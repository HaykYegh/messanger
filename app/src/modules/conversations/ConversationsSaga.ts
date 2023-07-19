"use strict";

import {Store} from "react-redux";
import format from "date-fns/format";
import {all, call, delay, fork, put, select, take, takeEvery, takeLatest} from "redux-saga/effects";

import {
    addConversation,
    addConversationNewMessageId,
    attemptRemoveConversations as attemptRemoveConversationsAction,
    attemptResetConversation,
    attemptSetConversations as attemptSetConversationsAction,
    CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS,
    conversationBulkInsert,
    conversationBulkReplace, conversationLastMessageStatusUpdate,
    removeConversation,
    removeConversations,
    resetConversationNewMessagesIds,
    setConversationDraft,
    setConversationLastMessage,
    setConversationTyping,
    stopConversationTyping,
    toggleMuteConversation,
    updateConversationAvatar,
    updateConversationName,
    updateConversationTime, updateSelectedConversationThread
} from "modules/conversations/ConversationsActions";
import {
    APPLICATION,
    CONNECTION_ERROR_TYPES, CONVERSATION_TYPE,
    CONVERSATIONS_LIMIT,
    DEFAULT_TIME_FORMAT,
    GROUP_MESSAGES_LIMIT,
    LEFT_PANELS,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    SYNC_MUTE_TIMES
} from "configs/constants";
import {
    getInitials,
    getNotificationText,
    getThreadType,
    getUsername,
    isCorrectFileRemotePath,
    isPublicRoom,
    setFailed
} from "helpers/DataHelper";
import {
    attemptResetStatuses,
    attemptSetNewMessagesCount,
    attemptSetSelectedThread,
    conversationsSyncSuccess,
    resetSelectedThread,
    setSelectedThreadId,
    syncFailed,
    UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS,
    updateSelectedThread
} from "modules/application/ApplicationActions";
import {
    attemptCreateMessage,
    deleteThreadMessages,
    deleteThreadsMessages, messageDeliveredToReceiverService, messageDisplayedToReceiverService,
    removeMessages,
    setStoreMessages,
    toggleResetStoreMessages
} from "modules/messages/MessagesActions";
import {
    attemptCreateContact,
    contactsBulkInsert,
    toggleMuteContact,
} from "modules/contacts/ContactsActions";
import {getConversationMessages, getConversations} from "requests/conversationRequest";
import {actions as CONTACT_ACTIONS} from "modules/contacts/ContactsReducer";
import {actions} from "modules/conversations/ConversationsReducer";
import IDBConversation from "services/database/class/Conversation";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import IDBMessage from "services/database/class/Message";
import IDBContact from "services/database/class/Contact";
import {profileListData} from "helpers/ContactsHelper";
import {getGroupMessages} from "helpers/GroupHelpers";
import getNewMessages from "requests/getNewMessages";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import {getMessageText} from "helpers/MessageHelper";
import {fromJS} from "immutable";
import {getCredentials, ICredentials} from "services/request";
import {conversationUnreadMessageSelector} from "modules/conversations/ConversationsSelector";
import {setBadge} from "helpers/AppHelper";
import Log from "modules/messages/Log";

function* attemptSetConversations({payload: {syncTime}}): any {
    window.addEventListener("beforeunload", () => {
        const key = `synced_${APPLICATION.VERSION}`;
        const synced: any = localStorage.getItem(key);

        if (!(synced && JSON.parse(synced).conversations) || !synced) {
            setFailed(put(attemptSetConversationsAction(syncTime)));
        }
    });
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId} = selector(store.getState(), {user: true, selectedThreadId: true});
    const deletedConversationsIds: Array<string> = [];
    const localDeletedMsgIds: Array<string> = [];
    const conversationIds: Array<string> = [];
    const username = user.get("username");
    const isOfflineSync = !!syncTime;
    const effects: Array<any> = [];
    try {
        const {data: {body, status}} = yield call(getConversations, syncTime);
        const profileIDs: any = {};

        if ((!body || !Array.isArray(body) && status === "SUCCESS") || status !== "SUCCESS") {
            const effect = put(attemptSetConversationsAction(syncTime));
            return yield put(syncFailed(effect));
        }

        let toBeUpdatedThreads = [];
        for (const conversation of body) {

            if (isOfflineSync) {
                conversationIds.push(conversation.conversationId)
            }

            const target: string = user.get("username") === conversation.to ? conversation.from : conversation.to;
            const threadId: string = `${target}@${SINGLE_CONVERSATION_EXTENSION}`;
            toBeUpdatedThreads.push(threadId);
            let fileRemotePath: string = "";

            if (!conversation.msgId || conversation.sid === "1") {
                continue;
            }

            if (conversation.fileRemotePath && isCorrectFileRemotePath(conversation.fileRemotePath)) {
                fileRemotePath = conversation.fileRemotePath;

            } else if ([MESSAGE_TYPES.file, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.voice].includes(conversation.msgType)) {
                fileRemotePath = `${conversation.from}/${conversation.msgId}`;
            }

            profileIDs[target] = {
                thread: {
                    threadId,
                    threadType: "SINGLE"
                },
                conversation: {
                    conversationId: conversation.conversationId,
                    lastMessageId: conversation.msgId,
                    newMessagesIds: conversation.newMessagesIds || [],
                    time: conversation.time,
                    threadId
                },
                threadContact: {
                    threadId,
                    contactId: threadId,
                },
                message: {
                    conversationId: conversation.conversationId,
                    createdAt: format(conversation.time, DEFAULT_TIME_FORMAT),
                    repid: conversation.repId || "",
                    type: conversation.msgType,
                    info: conversation.msgInfo,
                    text: conversation.msg,
                    messageId: conversation.msgId,
                    threadId,
                    creator: `${conversation.from}@${SINGLE_CONVERSATION_EXTENSION}`,
                    fileLink: '',
                    fileRemotePath,
                    fileSize: null,
                    own: conversation.from === user.get("username"),
                    delivered: true,
                    isDelivered: false,
                    isSeen: false,
                    seen: false,
                    deleted: !!conversation.deleted,
                    edited: !!conversation.edited,
                    time: conversation.time,
                    status: true
                },
            };
        }

        let dbConversations = [];
        if (toBeUpdatedThreads.length > 0) {
            dbConversations = yield call(IDBConversation.getNewMessagesCountByConversationIds, toBeUpdatedThreads);
        }
        conversationIds.map(conversationId => {
            effects.push(call(getNewMessages, syncTime, conversationId));
        });

        if (effects.length > 0) {
            const responses = yield all(effects);
            responses.map(response => {
                const {data: {body, status}} = response;

                if (status === "SUCCESS") {
                    if (body.length > 0) {
                        const target: string = user.get("username") === body[0].to ? body[0].from : body[0].to;
                        const threadId: string = `${target}@${SINGLE_CONVERSATION_EXTENSION}`;
                        const isConversationDeleted: boolean = body.every(message => message.localDeleted);

                        if (isConversationDeleted) {
                            deletedConversationsIds.push(threadId);

                        } else {
                            body.map(message => {
                                const {localDeleted, msgId} = message;
                                localDeleted ? localDeletedMsgIds.push(msgId) : null;
                            });
                        }
                    }
                }

            });
        }

        if (localDeletedMsgIds.length > 0) {
            yield all([
                call(IDBMessage.localDeleteMessages, localDeletedMsgIds),
                put(removeMessages(localDeletedMsgIds))
            ])
        }

        if (deletedConversationsIds.length > 0) {
            yield put(attemptRemoveConversationsAction(deletedConversationsIds));
        }

        const profiles: any = yield call(profileListData, Object.keys(profileIDs));
        let conversationStore: any = {};

        let conversations = Object.keys(profiles).map((profileId) => {
            if (profileIDs.hasOwnProperty(profileId) && profiles.hasOwnProperty(profileId)) {
                const conversation: any = profileIDs[profileId];
                const dbItem = dbConversations.length > 0 ? dbConversations.find(item => item.conversations.threadId === conversation.conversation.threadId) : null;
                conversation.contact = profiles[profileId];
                conversation.conversation.newMessagesIds = (dbItem && dbItem.conversations.newMessagesIds) ? dbItem.conversations.newMessagesIds : [];
                conversation.conversation.newMessagesCount = (dbItem && dbItem.conversations.newMessagesCount) ? dbItem.conversations.newMessagesCount : [];
                conversation.message.seen = dbItem && dbItem.messages.seen ? dbItem.messages.seen : false;

                conversationStore[conversation.thread.threadId] = {
                    conversations: {
                        conversationId: conversation.conversation.conversationId,
                        threadId: conversation.conversation.threadId,
                        lastMessageId: conversation.conversation.lastMessageId,
                        newMessagesIds: conversation.conversation.newMessagesIds,
                        newMessagesCount: conversation.conversation.newMessagesCount,
                        typing: [],
                        time: conversation.time
                    },
                    threads: {
                        threadId: conversation.thread.threadId,
                        threadType: conversation.thread.threadType,
                        threadInfo: {}
                    },
                    messages: {
                        messageId: conversation.message.messageId,
                        delivered: conversation.message.delivered,
                        threadId: conversation.message.threadId,
                        isSeen: conversation.message.isSeen,
                        own: conversation.message.own,
                        fileRemotePath: conversation.message.fileRemotePath,
                        edited: conversation.message.edited,
                        creator: conversation.message.creator,
                        text: conversation.message.text,
                        time: conversation.message.time,
                        info: conversation.message.info,
                        status: conversation.message.status,
                        fileLink: conversation.message.fileLink,
                        repid: conversation.message.repid,
                        deleted: conversation.message.deleted,
                        isDelivered: conversation.message.isDelivered,
                        type: conversation.message.type,
                        createdAt: conversation.message.createdAt,
                        seen: conversation.message.seen,
                        fileSize: conversation.message.fileSize,
                        conversationId: conversation.message.conversationId
                    },
                    members: {
                        [conversation.contact.contactId]: conversation.contact
                    }
                };

                return conversation
            }
        });

        conversations = conversations.filter(conversation =>
            !deletedConversationsIds.includes(conversation.thread.threadId));

        Object.keys(conversationStore).map(threadId =>
            deletedConversationsIds.includes(threadId) ?
                delete conversationStore[threadId] :
                null);

        const userCredentials: ICredentials = getCredentials();
        const username: string = userCredentials["X-Access-Number"];

        if (username !== username) {
            throw new Error("User Credentials Error");
        }

        yield all([
            call(IDBConversation.EXPERIMENTAL_bulkCreateConversations, conversations),
            put(contactsBulkInsert(conversationStore))
        ]);
        yield all([
            call(resetConversations, {payload: {searchReset: ""}}),
            put(conversationsSyncSuccess())
        ]);

        if (syncTime && conversationStore[selectedThreadId]) {
            yield put(attemptSetSelectedThread(conversationStore[selectedThreadId]));
        }

    } catch (e) {
        Log.i(e, "#attemptSetConversations");
        if (CONNECTION_ERROR_TYPES.includes(e.message) || !navigator.onLine) {
            Log.i("########", e.message);
            const effect = put(attemptSetConversationsAction(syncTime));
            yield put(syncFailed(effect));
        }

    } finally {

    }
}

function* attemptUpdateConversationAvatar({payload: {threadId, blob}}) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {selectedThreadId} = selector(store.getState(), {selectedThreadId: true});
        const effects: Array<any> = [];

        if (selectedThreadId === threadId) {
            effects.push(put(updateSelectedThread({avatar: blob})));
        }

        effects.push(put(updateConversationAvatar(threadId, blob, null)));

        effects.push(call(IDBConversation.updateThreadInfo, threadId, {avatar: blob}));

        yield all(effects);
    } catch (e) {
        Log.i("############### attemptUpdateConversationAvatar error start #############")
        Log.i(e)
        Log.i("############### attemptUpdateConversationAvatar error end #############")
    }

}

function* attemptMuteConversation({payload: {threadId, expirationDate, send}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId, conversations, contacts} = selector(store.getState(), {
        user: true,
        selectedThreadId: true,
        conversations: true,
        contacts: true
    });

    const effects: Array<any> = [];

    const expires: any = Date.now() + expirationDate.expires * 1000;
    var currentdate = new Date(expires);
    const username = user.get("username");
    const encodedUsername = btoa(username);

    const mutedConversations = localStorage.getItem(encodedUsername);
    const hours = currentdate.getHours()/10 > 1 ? currentdate.getHours() : "0" + currentdate.getHours()
    const minutes = currentdate.getMinutes()/10 > 1 ? currentdate.getMinutes() : "0" + currentdate.getMinutes()

    if (!mutedConversations) {
        const mutedMap = {};
        mutedMap[threadId] = {expires, hour: hours + ":" + minutes, date: currentdate.getDate(), year: currentdate.getFullYear() };
        localStorage.setItem(encodedUsername, JSON.stringify(mutedMap));

    } else {
        const mutedMap = JSON.parse(mutedConversations);

        mutedMap[threadId] = {expires, hour: hours + ":" + minutes, date: currentdate.getDate(), year: currentdate.getFullYear() };
        localStorage.setItem(encodedUsername, JSON.stringify(mutedMap));
    }

    if (selectedThreadId === threadId) {
        effects.push(put(updateSelectedThread({muted: true})));
        // effects.push(put(updateSelectedConversationThread(threadId,{muted: true})));
    }

    if (conversations.has(threadId)) {
        effects.push(put(toggleMuteConversation(threadId, true)));
    }

    if (contacts.has(threadId)) {
        effects.push(put(toggleMuteContact(threadId, true)));
    }

    if (isPublicRoom(threadId)) {
        effects.push(call(IDBConversation.updateGroup, threadId, {muted: true}))

    } else {
        effects.push(call(IDBContact.updateContact, threadId, {muted: true}))
    }

    yield all(effects);

}

function* attemptMuteConversations({payload: {mutedThreads}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId, conversations} = selector(store.getState(), {
        user: true,
        selectedThreadId: true,
        conversations: true
    });
    const effects: Array<any> = [];
    const username = user.get("username");
    const encodedUsername = btoa(username);
    const mutedConversations = localStorage.getItem(encodedUsername);
    const mutedMap = mutedConversations && JSON.parse(mutedConversations) || {};

    for (let i = 0; i < mutedThreads.length; i++) {
        const {muteType, threadId} = mutedThreads[i];
        const expires = SYNC_MUTE_TIMES[muteType];

        if (expires) {
            mutedMap[threadId] = Date.now() + expires * 1000;
        }

        if (selectedThreadId === threadId) {
            effects.push(put(updateSelectedThread({muted: true})));
        }

        if (conversations.has(threadId)) {
            effects.push(put(toggleMuteConversation(threadId, true)));
        }

        if (isPublicRoom(threadId)) {
            yield call(IDBConversation.updateGroup, threadId, {muted: true});

        } else {
            yield call(IDBContact.updateContact, threadId, {muted: true});
        }
    }

    localStorage.setItem(encodedUsername, JSON.stringify(mutedMap));

    yield all(effects);
}

function* attemptUnmuteConversation({payload: {threadId, send}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, conversations, selectedThreadId, contacts} = selector(store.getState(), {
        user: true,
        selectedThreadId: true,
        conversations: true,
        contacts: true
    });

    const username = user.get("username");
    const encodedUsername = btoa(username);

    const effects: Array<any> = [];

    const mutedConversations = localStorage.getItem(encodedUsername);

    if (mutedConversations) {
        const mutedMap = JSON.parse(mutedConversations);

        if (mutedMap.hasOwnProperty(threadId)) {
            delete mutedMap[threadId];
        }

        localStorage.setItem(encodedUsername, JSON.stringify(mutedMap));
    }

    if (selectedThreadId === threadId) {
        effects.push(put(updateSelectedThread({muted: false})));
    }

    if (conversations.has(threadId)) {
        effects.push(put(toggleMuteConversation(threadId, false)));
    }

    if (contacts.has(threadId)) {
        effects.push(put(toggleMuteContact(threadId, false)));
    }

    if (isPublicRoom(threadId)) {
        effects.push(call(IDBConversation.updateGroup, threadId, {muted: false}));

    } else {
        effects.push(call(IDBContact.updateContact, threadId, {muted: false}));
    }

    yield all(effects);
}

function* attemptUpdateConversationName({payload: {threadId, name}}) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId} = selector(store.getState(), {selectedThreadId: true});
    const effects: Array<any> = [];

    const avatarCharacter = getInitials(name);

    if (selectedThreadId === threadId) {
        effects.push(put(updateSelectedThread({name, avatarCharacter})));
    }
    effects.push(call(IDBConversation.updateGroup, threadId, {name: name, avatarCharacter: avatarCharacter}));
    effects.push(put(updateConversationName(threadId, name, avatarCharacter)));

    yield all(effects);
}

function* attemptResetConversationLastMessages() {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThread, resetStoreMessages} = selector(store.getState(), {
        selectedThread: true,
        resetStoreMessages: true
    });
    if (resetStoreMessages) {
        yield put(toggleResetStoreMessages(false));
    }
    ;
    const threadType = selectedThread.getIn(['threads', 'threadType']);
    const threadId = selectedThread.getIn(['threads', 'threadId']);
    let conversation: any = yield IDBConversation.getThread(threadId);
    const {conversations: {conversationId, lastMessageId}, messages} = conversation;
    const {isGroup} = getThreadType(threadType);
    let loadedMessages: any = {};
    try {
        if (isGroup) {
            const groupId: string = threadId.split('@')[0];
            loadedMessages = yield call(getGroupMessages, groupId, GROUP_MESSAGES_LIMIT, lastMessageId, (messages && lastMessageId === messages.messageId) ? messages : null);
        } else {
            loadedMessages = yield call(getConversationMessages, conversationId || threadId, MESSAGES_CHAT_LIMIT, lastMessageId, (messages && lastMessageId === messages.messageId) ? messages : null);
        }
    } catch (e) {
        Log.i(e);
    }
    yield put(setStoreMessages(loadedMessages.messages));
}
function* attemptCreateEmptyConversation({payload:{threadId}}){
    const store: Store<any> = storeCreator.getStore();
    const {conversations, user, privacy, resetStoreMessages, contacts} = selector(store.getState(), {
        conversations: true,
        user: true,
        privacy: true,
        resetStoreMessages: true,
        contacts: true
    });
    if(conversations && conversations.get(threadId)) {
        return;
    }

    const conversation = {
        conversationId:  threadId,
        draft: "",
        newMessagesIds: [],
        time: Date.now(),
        lastMessageId:'',
        typing: [],
        threadId
    };

    yield all([
        call(IDBConversation.createConversation, conversation, {}),
    ]);

    const thread = yield call(IDBConversation.getThread, threadId);
    yield put(addConversation(thread));

}
function* attemptCreateConversation({payload: {message, isCarbon, seenSent, showNotification}}) {
    const store: Store<any> = storeCreator.getStore();
    const {conversations, user, privacy, resetStoreMessages, contacts, app: {statuses}} = selector(store.getState(), {
        conversations: true,
        user: true,
        privacy: true,
        resetStoreMessages: true,
        contacts: true,
        app: true
    });



    const {threadId, id, creator} = message;
    const username = user.get("username");

    const isIncomingMessage = !message.own;
    const email = message.email;
    let conversationExists = conversations.has(message.threadId);
    let selectedConversation = conversations.get(message.threadId) && conversations.get(message.threadId).toJS();
    let conversationExistInStore = conversationExists;
    let conversationId = conversationExists ? conversations.getIn([message.threadId, "conversations", "conversationId"]) : "";
    let lastMessageId: string = id;
    let time: number = message.time;
    let isLastMessageChanged: boolean = true;

    if (!conversationExists) {
        const threadInfo = yield call(IDBConversation.getThread, message.threadId);
        conversationId = threadInfo && threadInfo.conversations && threadInfo.conversations.conversationId;
        selectedConversation = threadInfo;
        if (conversationId) {
            conversationExists = true;
        }
    }

    if (conversationExists && conversations.getIn([message.threadId, "conversations", "time"]) > message.time) {
        lastMessageId = conversations.getIn([message.threadId, "conversations", "lastMessageId"]);
        time = conversations.getIn([message.threadId, "conversations", "time"]);
        isLastMessageChanged = false
    }

    const conversation = {
        conversationId: conversationId || threadId,
        draft: message.draft || "",
        newMessagesIds: [],
        time,
        lastMessageId,
        typing: [],
        threadId
    };

    if (conversationExists) {

        const effects: Array<any> = [];


        if (isLastMessageChanged) {
            if (Array.isArray(statuses)) {
               statuses.forEach(item => {
                    if (item.status === "seen" && message.messageId === item.msgId) {
                        message.seen = true
                    }

                   if (item.status === "delivered" && message.messageId === item.msgId) {
                       message.delivered = true
                   }
                })
            }
            effects.push(call(IDBConversation.updateConversation, threadId, {lastMessageId, time}));
            effects.push(put(setConversationLastMessage(threadId, message)));
            yield put(attemptResetStatuses())
        }

        effects.push(put(attemptCreateMessage(message)));

        if (isIncomingMessage && !seenSent) {
            effects.push(put(addConversationNewMessageId(threadId, id)));
            effects.push(call(IDBConversation.addMessageId, threadId, id));
        }
        yield all(effects);
        isIncomingMessage && !seenSent && (yield put(attemptSetNewMessagesCount()));

        if (resetStoreMessages && !isIncomingMessage) {
            yield attemptResetConversationLastMessages();
        }

    } else if (isIncomingMessage || isCarbon) {
        const sendEmail = !isCarbon ? email : ""
        let notificationInfo = null;
        if (message.type === MESSAGE_TYPES.notification) {
            notificationInfo = JSON.parse(message.info)
        }
        yield put(attemptCreateContact(
            threadId,
            notificationInfo ? notificationInfo.label : "",
            "",
            username,
            getUsername(threadId),
            false,
            false,
            undefined,
          sendEmail || "",
          null,
          null,
          null,
          true,
            notificationInfo
        ));

        const {payload: {contactId}} = yield take(CONTACT_ACTIONS.CONTACT_CREATION_DONE);

        if (contactId === threadId) {

            yield all([
                call(IDBConversation.createConversation, conversation, {}),
                put(attemptCreateMessage(message))
            ]);

            const thread = yield call(IDBConversation.getThread, threadId);
            console.warn(threadId, message);

            const effects: Array<any> = [
                put(addConversation(thread))
            ];

            if (isIncomingMessage && !seenSent) {

                if (showNotification) {
                    const text = getNotificationText(message, getMessageText.bind(
                        this, fromJS(message), contacts, username, true)
                    );

                    showNotification(text, creator, threadId);
                }

                effects.push(put(addConversationNewMessageId(threadId, id)));
                effects.push(call(IDBConversation.addMessageId, threadId, id));
            }
            yield all(effects);

            isIncomingMessage && !seenSent && (yield put(attemptSetNewMessagesCount()));
        }

    } else {
        yield all([
            call(IDBConversation.createConversation, conversation, {}),
            put(attemptCreateMessage(message))
        ]);

        const thread = yield call(IDBConversation.getThread, threadId);

        yield put(addConversation(thread));
    }

    if (selectedConversation && selectedConversation.conversations && selectedConversation.conversations.newMessagesIds && selectedConversation.conversations.newMessagesIds.length > 0) {
        const {threads: {threadType}} = selectedConversation;
        const {isGroup} = getThreadType(threadType);

        if (privacy.get("showSeenStatus") && creator === user.get('id')) {
            yield call(attemptResetConversationNewMessagesIds, {payload: {id: selectedConversation.conversations.threadId}});
            yield put(attemptSetNewMessagesCount());
        }
    }

    if (conversations.size > CONVERSATIONS_LIMIT || !conversationExistInStore) {
        yield put(attemptResetConversation());
        // yield put(conversationLastMessageStatusUpdate(threadId, {key: "delivered", value: true}));
    }
}

function* attemptUnmuteConversations({payload: {threadIds}}) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId, user, conversations} = selector(store.getState(), {
        selectedThreadId: true,
        user: true,
        conversations: true
    });
    const username = user.get("username");
    const encodedUsername = btoa(username);

    try {
        const mutedConversations = localStorage.getItem(encodedUsername);
        const effects: Array<any> = [];

        if (mutedConversations) {
            const mutedMap = JSON.parse(mutedConversations);

            for (const key in mutedMap) {
                if (mutedMap.hasOwnProperty(key)) {
                    if (threadIds.includes(key)) {
                        delete mutedMap[key];
                    }
                }
            }
            localStorage.setItem(encodedUsername, JSON.stringify(mutedMap));
        }

        for (const threadId of threadIds) {

            if (selectedThreadId === threadId) {
                effects.push(put(updateSelectedThread({muted: false})));
            }

            if (conversations.has(threadId)) {
                effects.push(put(toggleMuteConversation(threadId, false)));
            }

            if (isPublicRoom(threadId)) {
                effects.push(call(IDBConversation.updateGroup, threadId, {muted: false}));

            } else {
                effects.push(call(IDBContact.updateContact, threadId, {muted: false}));
            }
        }

        yield all(effects);

    } catch (e) {
        Log.i(e);
    }
}

function* attemptGetLocalConversations({payload: {page, offset, threadType, searchText}}) {
    const conversations = yield call(IDBConversation.getLocalConversations, page, offset, threadType, searchText);
    yield put(conversationBulkInsert(conversations));
}

export function* resetConversations({payload: {searchReset}}) {
    const store: Store<any> = storeCreator.getStore();
    const {conversations, app} = selector(store.getState(), {conversations: true, application: true});
    const leftPanel = app.leftPanel;
    const prevLeftPanel = app.previousLeftPanel;
    if (conversations && ((conversations.size > CONVERSATIONS_LIMIT || prevLeftPanel !== leftPanel) && (leftPanel === LEFT_PANELS.threads))) {
        let threadType = app.selectedThreadType;
        const searchText = (!searchReset && document.getElementById("searchInput")) ? document.getElementById("searchInput")["value"] : "";
        const conversations = yield call(IDBConversation.getLocalConversations, 1, false, threadType, searchText);
        if (conversations) {
            yield put(conversationBulkReplace(conversations));
        }
    }

    const effects = []

    if (Array.isArray(app.statuses)) {
        app.statuses.forEach(item => {
            if(item.status == "delivered") {
                effects.push(put(messageDeliveredToReceiverService(item)))
            }

            if(item.status == "seen") {
                effects.push(put(messageDisplayedToReceiverService(item)))
            }
        })
    }

    yield all(effects)

    setTimeout(() => {
        store.dispatch(attemptResetStatuses())
    }, 500)
}

function* attemptResetConversationNewMessagesIds({payload: {id}}) {
    yield all([
        call(IDBConversation.updateConversation, id, {newMessagesIds: [], newMessagesCount: 0}),
        put(resetConversationNewMessagesIds(id)),
        put(attemptSetNewMessagesCount())
    ]);
}

function* attemptUpdateConversationTime({payload: {threadId, time}}) {
    const store: Store<any> = storeCreator.getStore();
    const {conversations} = selector(store.getState(), {conversations: true});

    yield call(IDBConversation.updateConversation, threadId, {time});

    if (conversations.has(threadId)) {
        yield put(updateConversationTime(threadId, time));

    } else {
        const conversation = yield call(IDBConversation.getThread, threadId);
        if (conversation) {
            const conversationsMap: any = {};
            conversationsMap[threadId] = conversation;
            yield put(conversationBulkInsert(conversationsMap));
        }
    }
}

function* attemptResetConversationLastMessage({payload: {threadId}}) {
    const lastMessage = yield call(IDBMessage.getOldMessages, "", threadId, "", 1);
    if (lastMessage && lastMessage.length > 0) {
        lastMessage[0].messages.loadStatus = lastMessage[0].messageStatus.loadStatus;
        lastMessage[0].messages.id = lastMessage[0].messages.messageId;
        yield all([
            call(IDBConversation.updateConversation, threadId, {
                lastMessageId: lastMessage[0].messages.messageId,
                time: lastMessage[0].messages.time
            }),
            put(setConversationLastMessage(threadId, lastMessage[0].messages))
        ]);

    } else {
        yield all([
            call(IDBConversation.updateConversation, threadId, {lastMessageId: "", time: 0}),
            put(setConversationLastMessage(threadId, ""))
        ]);
    }
}

function* attemptRemoveConversation({payload: {threadId, send}}: any) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId, user} = selector(store.getState(), {selectedThreadId: true, user: true});

    if (send) {
        // const username = user.get("username");
        // const connectionUsername = getConnectionUsername(username);
        //
        // const message = {
        //     id: `sync${Date.now()}`,
        //     opponent: getUsername(threadId),
        //     from: connectionUsername,
        //     sid: isThreadIdPrivateChat(threadId) ? "1": "0",
        //     pid: isThreadIdPrivateChat(threadId) ? getPid(threadId): ""
        // };
        //
        // const connection: any = connectionCreator.getConnection();
        // const msg: Strophe.Builder = removeConversationXML(message);
        // const xmlBuilder: string = "removeConversationXML";
        //
        // const request: any = {
        //     params: message,
        //     id: message.id,
        //     xmlBuilder
        // };
        //
        // yield put(addRequest(request));
        //
        // if (connection.connected) {
        //     connection.send(msg);
        // }
    }


    yield all([
        put(deleteThreadMessages(threadId)),
        put(removeConversation(threadId)),
        call(IDBConversation.removeConversation, threadId)
    ]);

    yield put(attemptSetNewMessagesCount());

    if (selectedThreadId === threadId) {
        yield put(setSelectedThreadId(""));
    }
}

function* attemptRemoveConversations({payload: {threadIds}}) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId} = selector(store.getState(), {selectedThreadId: true});

    yield all([
        put(deleteThreadsMessages(threadIds)),
        put(removeConversations(threadIds)),
        call(IDBConversation.removeConversations, threadIds)
    ]);

    yield put(attemptSetNewMessagesCount());

    if (threadIds.includes(selectedThreadId)) {
        yield put(resetSelectedThread());
    }

}

function* attemptSetConversationDraft({payload: {threadId, draft}}) {
    const store: Store<any> = storeCreator.getStore();
    const {conversations, user} = selector(store.getState(), {conversations: true, user: true});
    const effects: Array<any> = [];
    const conversation: any = conversations.get(threadId);

    if (conversation) {
        const lastMessage = conversation.get("messages");

        if (lastMessage && lastMessage.get("draft") && draft === "") {
            yield call(attemptRemoveConversation, {payload: {threadId}});

        } else {
            effects.push(call(IDBConversation.updateConversation, threadId, {draft}));
            effects.push(put(setConversationDraft(threadId, draft)));
        }

    }
    // else {
    //     const thread = yield call(IDBConversation.getThread, threadId);
    //
    //     if (thread) {
    //         const lastMessage: any = thread.messages;
    //
    //         if (lastMessage && lastMessage.draft && draft === "") {
    //             yield call(attemptRemoveConversation, {payload: {threadId}});
    //
    //         } else {
    //             effects.push(call(IDBConversation.updateConversation, threadId, {draft}));
    //             effects.push(put(setConversationDraft(threadId, draft)));
    //         }
    //
    //     } else {
    //         const time = Date.now();
    //         const messageToSave: any = {
    //             type: MESSAGE_TYPES.text,
    //             info: "",
    //             text: "",
    //             createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
    //             threadId: threadId,
    //             id: `msgId${time}`,
    //             hidden: true,
    //             creator: user.get("id"),
    //             fileRemotePath: null,
    //             time,
    //             fileSize: null,
    //             draft,
    //             fileLink: '',
    //             own: true,
    //             email: user.get("email") || "",
    //             repid: "",
    //         };
    //
    //         yield call(attemptCreateConversation, {payload: {message: messageToSave}});
    //     }
    //
    // }

    if (effects.length > 0) {
        yield all(effects);
    }
}

function* CONVERSATION_UNREAD_MESSAGES_UPDATE_HANDLER({payload: {threadId, messageIds}}) {
    try {

        const unreadMessages: any = yield select(conversationUnreadMessageSelector(threadId, {list: true}));

        if (unreadMessages) {
            const list: string[] = unreadMessages.list;
            if (list && list.length > 0) {
                let unreadMessagesCount: number = 0;
                let nextUnreadMessages: string[] = [];

                if (list.length > messageIds.length) {
                    unreadMessagesCount = list.length - messageIds.length;
                    nextUnreadMessages = list.filter(messageId => !messageIds.includes(messageId));
                }

                yield call(IDBConversation.updateUnreadMessages, threadId, nextUnreadMessages, unreadMessagesCount);
                yield fork(setBadge, unreadMessagesCount);

                yield all([
                    put(CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS(threadId, nextUnreadMessages)),
                    put(UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS(unreadMessagesCount))
                ]);
            }
        }


    } catch (e) {
        Log.i("###############CONVERSATION_NEW_MESSAGES_UPDATE_HANLDER##################");
        Log.i(e);
        Log.i("###############CONVERSATION_NEW_MESSAGES_UPDATE_HANLDER##################");
    }
}

function* attemptUpdateConversationTyping({payload: {threadId, username, removeFromList}}) {
    removeFromList ?
        yield put(stopConversationTyping(threadId, username)):
        yield put(setConversationTyping(threadId, username));

    const conversation = yield call(IDBConversation.getThread, threadId);

    if(conversation) {
        let {conversations: {typing}} = conversation;

        if(removeFromList) {
            if(Array.isArray(typing)) {
                typing = typing.filter(_username => _username !== username);
                yield call(IDBConversation.updateConversation, threadId, {typing});
            }

        } else {
            typing = Array.isArray(typing) ? !typing.includes(username) ? [...typing, username] : typing : [username];
            yield call(IDBConversation.updateConversation, threadId, {typing});
        }

    }

}


function* conversationsSaga(): any {
    yield takeEvery(actions.ATTEMPT_RESET_NEW_MESSAGES_IDS, attemptResetConversationNewMessagesIds);
    yield takeEvery(actions.ATTEMPT_UPDATE_CONVERSATION_AVATAR, attemptUpdateConversationAvatar);
    yield takeEvery(actions.ATTEMPT_SET_CONVERSATION_DRAFT, attemptSetConversationDraft);
    yield takeEvery(actions.ATTEMPT_UPDATE_CONVERSATION_NAME, attemptUpdateConversationName);
    yield takeEvery(actions.ATTEMPT_UPDATE_CONVERSATION_TIME, attemptUpdateConversationTime);
    yield takeEvery(actions.ATTEMPT_REMOVE_CONVERSATION, attemptRemoveConversation);
    yield takeEvery(actions.ATTEMPT_REMOVE_CONVERSATIONS, attemptRemoveConversations);
    yield takeEvery(actions.ATTEMPT_UNMUTE_CONVERSATIONS, attemptUnmuteConversations);
    yield takeLatest(actions.ATTEMPT_GET_CONVERSATIONS, attemptGetLocalConversations);
    yield takeEvery(actions.ATTEMPT_UNMUTE_CONVERSATION, attemptUnmuteConversation);
    yield takeEvery(actions.ATTEMPT_CREATE_CONVERSATION, attemptCreateConversation);
    yield takeEvery(actions.ATTEMPT_CREATE_EMPTY_CONVERSATION, attemptCreateEmptyConversation);
    yield takeEvery(actions.ATTEMPT_UPDATE_CONVERSATION_TYPING, attemptUpdateConversationTyping);
    yield takeEvery(actions.ATTEMPT_MUTE_CONVERSATION, attemptMuteConversation);
    yield takeEvery(actions.ATTEMPT_MUTE_CONVERSATIONS, attemptMuteConversations);
    yield takeEvery(actions.ATTEMPT_SET_CONVERSATIONS, attemptSetConversations);
    yield takeEvery(actions.ATTEMPT_RESET_CONVERSATIONS, resetConversations);
    yield takeEvery(actions.ATTEMPT_RESET_CONVERSATION_LAST_MESSAGE, attemptResetConversationLastMessage);

    yield takeEvery(actions.CONVERSATION_UNREAD_MESSAGES_UPDATE, CONVERSATION_UNREAD_MESSAGES_UPDATE_HANDLER)
}

export default conversationsSaga;
