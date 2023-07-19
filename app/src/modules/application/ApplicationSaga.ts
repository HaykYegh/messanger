"use strict";

import {fromJS, Map} from "immutable";
import {END, eventChannel} from "redux-saga";
import {all, call, cancel, delay, fork, put, select, take, takeEvery, takeLatest} from "redux-saga/effects";
import {MessagingService} from "modules/messages/MessagingService"

import {
    addAdmin,
    addFollower,
    applicationStopTyping,
    applicationTyping,
    attemptSetSelectedThread as ATTEMPT_SET_SELECTED_THREAD,
    attemptDownloadUpdate as ATTEMPT_DOWNLOAD_UPDATE,
    changeLeftPanel,
    DELETE_SHARED_MEDIA_MESSAGES_SUCCESS,
    disableGroupSelectedThread,
    enableGroup,
    FETCH_THREAD_SUCCEED,
    fetchSharedMedia,
    fetchSharedMediaFailed,
    fetchSharedMediaSucceed,
    FOCUS_APPLICATION,
    IApplicationActions,
    initializeSharedMedia,
    initializeSharedMediaSucceed,
    NETWORK_STATUS_UPDATE,
    NETWORK_STATUS_UPDATE_SUCCESS,
    removeGifsLoading,
    removeMemberSelectedThread,
    removeSelectedThreadLoading,
    reset as resetAplication,
    resetFailedSync,
    revokeAdmin,
    setCreateContactNumber,
    setGifMessages,
    setGifMessagesCount,
    setGifsLoading,
    setNewMessagesCount,
    setSearchKeyword,
    setSelectedThread,
    setSelectedThreadId,
    setNewSelectedThreadId,
    setSharedMediaImages,
    setSharedMediaMessages,
    setShowMoreGifMessages,
    SET_SELECTED_THREAD_ID,
    setSync,
    showCreateNewContactPopUp,
    showMoreGifLoading,
    syncCompleted,
    UPDATE_APPLICATION_STATE,
    addSharedMediaImage,
    updateDownloadProgress,
    toggleUpdateDownloadStart,
    toggleUpdateDownloadFinish,
    toggleUpdateIsAvailable,
    setSelectedAvatarUrl,
    getWalletUrlSucceed,
    getAllCaches,
    userBecameOffline, SET_APPLICATION_FOCUS
} from "modules/application/ApplicationActions";
import {
    disableGroupConversationThread,
    enableConversationGroup, updateConversationProps
} from "modules/conversations/ConversationsActions";
import {
    appLatestVersionXML,
    backgroundXML,
    foregroundXML,
    lastActivityRequestXML,
    pongXML,
    presenceXML,
    sendMessageXML,
    getMessageXMLForSend,
    stopTypingMessageXML,
    toggleContactBlockXML,
    typingMessageXML,
    XMLReceivedXML
} from "xmpp/XMLBuilders";
import {
    APP_CONFIG,
    APPLICATION,
    CALL_STATUSES,
    CONVERSATION_TYPE,
    DEFAULT_TIME_FORMAT,
    GIF_SEARCH_LIMIT,
    GROUP_MESSAGES_LIMIT,
    LEFT_PANELS, LOAD_STATUS,
    LOG_TYPES,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    OFFLINE_MESSAGE_BODY,
    SHARED_MEDIA_TYPES
} from "configs/constants";
import {addRequest, resendRequests, reset as resetRequests} from "modules/requests/RequestsActions";
import {
    addMessageLoadStatus,
    DELETE_STORE_MESSAGES,
    FETCH_MESSAGES,
    MESSAGES_RESET_SUCCEED,
    reset as resetMessages,
    sendMessageSeen,
    setStoreMessages,
    toggleShowMore, transferSuccess, updateMessageProperty, uploadFailure
} from "modules/messages/MessagesActions";
import {getGroupMessages} from "helpers/GroupHelpers";
import {actions} from "modules/application/ApplicationReducer";
import connectionCreator from "xmpp/connectionCreator";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import conf from "configs/configurations";
import {Store} from "react-redux";
import IDBConversation from "services/database/class/Conversation";
import {
    checkForSyncFinish,
    getConversationType,
    getDeviceToken,
    getPartialId,
    getThreadType,
    getUserId,
    getUsername,
    resetFailed,
    setSynced,
    writeLog
} from "helpers/DataHelper";
import {
    attemptResetConversationNewMessagesIds,
    attemptUnmuteConversations,
    attemptUpdateConversationTime,
    attemptUpdateConversationTyping,
    conversationBulkInsert,
    conversationBulkReplace, conversationTyping, filterEmptyConversations, removeConversationMember,
    reset as resetConversations,
    setConversationDraft
} from "modules/conversations/ConversationsActions";
import {
    addRecentStickers,
    reset as resetSettings,
    setMyStickers,
    setSettings,
    setStickers
} from "modules/settings/SettingsActions";
import {
    attemptCreateContact,
    contactsBulkInsert,
    contactUpdate,
    FETCH_CONTACT_LIST,
    FETCH_FAVORITE_CONTACT_LIST,
    reset as resetContacts,
    TOGGLE_CONTACTS_LOADING
} from "modules/contacts/ContactsActions";
import {GROUP_CONVERSATION_EXTENSION, SINGLE_CONVERSATION_EXTENSION, XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import IDBApplication, {APPLICATION_PROPERTIES} from "services/database/class/Application";
import {getGroupInfo, reset as resetGroups} from "modules/groups/GroupsActions";
import {resetUser, setUser, SIGN_OUT} from "modules/user/UserActions";
import {getConversationMessages} from "requests/conversationRequest";
import {checkForProfileUpdates} from "modules/contacts/ContactsSaga";
import {actions as MESSAGE_ACTIONS} from "modules/messages/MessagesReducer";
import IDBPublicChat from "services/database/class/PublicChat";
import {reset as resetCalls} from "modules/call/CallActions";
import {setNetworks} from "modules/networks/NetworksActions";
import IDBSettings from "services/database/class/Settings";
import IDBNetwork from "services/database/class/Networks";
import IDBContact from "services/database/class/Contact";
import IDBMessage from "services/database/class/Message";
import {logger} from "helpers/AppHelper";
import {searchGifsRequest} from "requests/gifRequest";
import format from "date-fns/format";
import {attemptAddRequests} from "modules/requests/RequestsSaga";
import {leftPanelSelector, sharedMediaSkipSelector} from "modules/application/ApplicationSelector";
import {conversationDraftMessageSelector, conversationSelector} from "modules/conversations/ConversationsSelector";
import {getLastCallSelector} from "modules/call/CallSelector";
import {contactSelector} from "modules/contacts/ContactsSelector";
import {userNameSelector} from "modules/user/UserSelector";
import {getCredentials, isLoggedIn} from "services/request";
import ApplicationModel from "modules/application/ApplicationModel";
import {privacySelector} from "modules/settings/SettingsSelector";
import { mediaSelector } from "modules/application/ApplicationSelector";
import {profileListData} from "helpers/ContactsHelper";
import MessagesModel from "modules/messages/MessagesModel";
import {createThumbnail, getBlobUri} from "helpers/FileHelper";
import {getSignedUrl} from "requests/fsRequest";
import {getDeepLink} from "requests/getDeepLink";
import {RegistrationService} from "modules/messages/RegistrationService";
import {PendingQueue} from "modules/messages/PendingQueue";
import Log from "modules/messages/Log";
import database, {initialize as DBInitialize} from "services/database";
import {getWalletURL} from "requests/settingsRequest";
import {scrollToBottom} from "helpers/UIHelper";
import IDBCache from "services/database/class/Cache";
import {changedConferenceDetails} from "modules/conference/ConferenceActions";

const remote = require("@electron/remote");
const os = require("os");


function* XMPPConnected({payload: {handlers, pendingRequests, showOnlineStatus}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const store: Store<any> = storeCreator.getStore();
    // const {synced} = selector(store.getState(), {synced: true});
    // const groupsSynced = synced.get("groups");
    // const username = yield select(userNameSelector());


    for (const handler of handlers) {
        // Log.i("XMPPConnected -> handlers = ", handlers)
        connection.addHandler(...handler);
    }

    const id: string = `pres${Date.now()}`;
    const pres: Strophe.Builder = presenceXML({id});

    if (connection.connected) {
        writeLog(LOG_TYPES.connection, {
            msg: "SEND_PRESENCE",
            id
        });
        const event = new Date()
        Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
            msg: "SEND_PRESENCE",
            id
        })
        connection.send(pres);
    }

    if (showOnlineStatus) {
        yield delay(100);


        const foregroundMsg: Strophe.Builder = foregroundXML();

        Log.i("remote -> ", remote)
        if (connection.connected && !remote.getCurrentWindow().isMinimized()) {
            console.warn("foreground sent ###########");
            writeLog(LOG_TYPES.connection, {
                msg: "foregroundXML",
                info: "showOnlineStatus"
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "foregroundXML",
                info: "showOnlineStatus"
            })
            connection.send(foregroundMsg);
        }
    }

    // const getGroupsId: string = `getRooms${Date.now()}`;
    // const msg: Strophe.Builder = getGroupsXML({id: getGroupsId});
    //
    // if (connection.connected && !groupsSynced) {
    //     writeLog(LOG_TYPES.groups, {
    //         msg: "GET_GROUPS",
    //         id: getGroupsId
    //     });
    //     connection.send(msg);
    // }

    const blockedId: string = `block${Date.now()}`;
    const blockedMsg: Strophe.Builder = toggleContactBlockXML({
        id: blockedId,
        contactToBlock: "",
        command: "GET",
        requestId: Date.now().toString()
    });

    if (connection.connected) {
        writeLog(LOG_TYPES.contacts, {
            msg: "GET_BLOCKED_NUMBERS",
            id: blockedId
        });
        connection.send(blockedMsg);
    }

    // check application new version
    if (connection.connected) {
        writeLog(LOG_TYPES.appCurrentVersion, {
            msg: "APPLICATION CURRENT VERSION",
            id: APP_CONFIG.CURRENT_VERSION
        });
        const credentials: any = getCredentials();
        const username: string = credentials["X-Access-Number"];
        const password: string = credentials["X-Access-Token"];
        const appLatestVersionMsg: Strophe.Builder = appLatestVersionXML({
            username,
            password,
            appCurrentVersion: APP_CONFIG.CURRENT_VERSION
        });
        connection.send(appLatestVersionMsg);
    }

    const requests: any = pendingRequests && pendingRequests.toJS();
    if (requests && Object.keys(requests).length > 0) {
        yield put(resendRequests(requests));
    }

    const {selectedThread, selectedThreadId} = selector(store.getState(), {
        selectedThread: true,
        selectedThreadId: true,
    });

    const isProductContact = selectedThread && selectedThread.get("members") && selectedThread.get("members").first() &&
        selectedThread.get("members").first().get("isProductContact");
    if (selectedThread && selectedThreadId && isProductContact && connection.connected) {
        const msg: Strophe.Builder = lastActivityRequestXML({id: selectedThreadId});
        connection.send(msg);
    }


    // setInterval(() => {
    //     if (connection.connected) {
    //
    //         const jid: string = getConnectionUsername(username);
    //         const iq: Strophe.Builder = ping({jid});
    //         connection.send(iq);
    //     }
    // }, 2000)
}

function* XMPPDisconnected({payload: {username, accessToken, connectHandler}}: any): any {
    writeLog(LOG_TYPES.connection, {
        fn: "XMPPDisconnected",
        username
    });
    const event = new Date()
    Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
        fn: "XMPPDisconnected",
        username
    })
    const connection: any = connectionCreator.getConnection();
    setTimeout(() => {
        if (isLoggedIn() && !connection.connected && navigator.onLine) {
            const credentials = getCredentials();
            const newAccessToken: string = credentials["X-Access-Token"];
            connection.connect(username, `${newAccessToken}$${getDeviceToken()}`, connectHandler);
        }
    }, 5000);
}

function* attemptSetCreateContactNumber({payload: {phone}}: any): any {

    yield put(setCreateContactNumber(phone));
    yield put(changeLeftPanel(LEFT_PANELS.contacts));
    yield put(showCreateNewContactPopUp());
}

function* sendXMLReceived({payload: {id, from, to}}: any): any {
    // const roomId: string = to.startsWith("gid") ? getPartialId(to) : "";
    // to = roomId ? conf.app.prefix + getUserId(getUsername(to)) : to;

    // const connection: any = connectionCreator.getConnection();
    // const isE2ESupport: any = "0"
    // const msg: Strophe.Builder = XMLReceivedXML({to, id, from, roomId,isE2ESupport});

    // const request: any = {
    //     xmlBuilder: "XMLReceivedXML",
    //     params: {to, id, from, roomId},
    //     id,
    //     createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
    // };

    // yield put(addRequest(request));

    // if (connection.connected) {
    //     writeLog(LOG_TYPES.send_status, {
    //         to,
    //         id,
    //         from,
    //         status: "delivered"
    //     });
    //
    //     Log.i("seen ->", `${msg}`)
    //     connection.send(msg);
    // }

}

function* toggleOnlineStatus({payload: {enable}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = enable ? foregroundXML(true) : backgroundXML(true);

    if (connection.connected) {
        connection.send(msg);
    }
}

function* setGroupsData({payload: {groupIds}}: any): any {

    // const groupsLastMessages: any = {};
    // const amazonLinks: any = {};
    // const messages: any = {};
    //
    // const responses: any = yield call(getGroupDataRequest, groupIds);
    //
    // const store: Store<any> = storeCreator.getStore();
    // const {user} = selector(store.getState(), {user: {user: true}});
    //
    // for (const response of responses) {
    //     const {data: {body, status}} = response;
    //
    //     if (status === "SUCCESS") {
    //
    //         body.sort((message1, message2) => {
    //             if (message1.time > message2.time) {
    //                 return 1;
    //             } else if (message1.time < message2.time) {
    //                 return -1;
    //             } else {
    //                 return 0;
    //             }
    //         });
    //
    //         for (const groupMessage of body) {
    //             if (
    //                 groupMessage.msgType.includes("THUMB") ||
    //                 groupMessage.msgType === "UPDATE_ROOM" ||
    //                 groupMessage.msgType === "PIN_MESSAGE" ||
    //                 groupMessage.msgType === "PIN"
    //             ) {
    //                 continue;
    //             }
    //
    //             if (groupMessage.msgType === MESSAGE_TYPES.delete_msg) {
    //                 messages[groupMessage.rel].deleted = true;
    //                 continue;
    //             }
    //
    //             if (groupMessage.msgType === MESSAGE_TYPES.edit_mgs) {
    //                 messages[groupMessage.rel].text = groupMessage.msg;
    //                 messages[groupMessage.rel].edited = true;
    //                 continue;
    //             }
    //
    //             if ([MESSAGE_TYPES.join_group, MESSAGE_TYPES.leave_group, MESSAGE_TYPES.remove_from_group].includes(groupMessage.msgType) && conf.app.prefix) {
    //                 groupMessage.msgInfo = groupMessage.msgInfo.split(conf.app.prefix).pop();
    //             }
    //
    //             if (groupMessage.msgType === MESSAGE_TYPES.update_group_avatar) {
    //                 const avatarUrl: string = yield call(getPublicUrl, `${groupMessage.to}/profile/avatar`, conf.app.aws.bucket.group);
    //                 const imageUrl: string = yield call(getPublicUrl, `${groupMessage.to}/profile/image`, conf.app.aws.bucket.group);
    //                 yield put(updateAvatar(`${groupMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`, avatarUrl, imageUrl));
    //             } else if (groupMessage.msgType === MESSAGE_TYPES.update_group_name) {
    //                 yield put(updateName(`${groupMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`, groupMessage.msgInfo));
    //             }
    //
    //             const message: any = {
    //                 creator: groupMessage.from.includes(SINGLE_CONVERSATION_EXTENSION) ? groupMessage.from : `${groupMessage.from}@${SINGLE_CONVERSATION_EXTENSION}`,
    //                 info: [MESSAGE_TYPES.video, MESSAGE_TYPES.image].includes(groupMessage.msgType) ? "base64 => base64" : groupMessage.msgInfo,
    //                 fileRemotePath: `${groupMessage.to}/${groupMessage.from}/${groupMessage.msgId}`,
    //                 threadId: `${groupMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`,
    //                 createdAt: moment(groupMessage.time).format(DEFAULT_TIME_FORMAT),
    //                 own: groupMessage.from === user.get("username"),
    //                 fileSize: groupMessage.fileSize,
    //                 type: groupMessage.msgType,
    //                 text: groupMessage.msg,
    //                 id: groupMessage.msgId,
    //                 isDelivered: true,
    //                 delivered: true,
    //                 isSeen: true,
    //                 seen: true
    //             };
    //
    //             if ([MESSAGE_TYPES.video, MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.file].includes(message.type)) {
    //                 amazonLinks[message.id] = message.fileRemotePath;
    //             } else if (message.type === MESSAGE_TYPES.location) {
    //                 const [lat, lng] = message.info.split("*");
    //                 try {
    //                     const {data: {results}} = yield call(getLocationName, lat, lng);
    //                     message.location = results[0].formatted_address;
    //                 } catch (e) {
    //                     console.dir(e);
    //                 }
    //             }
    //
    //             messages[message.id] = message;
    //             groupsLastMessages[message.threadId] = message.id;
    //         }
    //     }
    // }
    //
    // let links: any = yield call(getPublicUrls, {bucket: conf.app.aws.bucket.fileTransfer, urls: amazonLinks});
    // links = links ? JSON.parse(links) : {};
    //
    // Object.keys(links).map(id => {
    //     messages[id].fileLink = links[id];
    // });
    //
    // yield put(setStoreMessages(messages));
    //
    // const groupLastIds: Array<string> = Object.keys(groupsLastMessages);
    // for (const groupId of groupLastIds) {
    //     yield put(setGroupLastMessage(groupId, groupsLastMessages[groupId]))
    // }
    //
    // yield put(removeLoading());
}

function* sendPong({payload: {id, from, to}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const iq: Strophe.Builder = pongXML({to, id, from});

    if (connection.connected) {
        connection.send(iq);
    }
}

function* sendTypingStopped({payload: {to}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = stopTypingMessageXML({to});

    if (connection.connected) {
        connection.send(msg);
    }
}

function* sendTyping({payload: {to, isGroup}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = typingMessageXML({
        to: isGroup ? `${getPartialId(to)}@${GROUP_CONVERSATION_EXTENSION}` : `${conf.app.prefix}${to}`,
        groupTyping: +isGroup,
        type: isGroup ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat
    });

    if (connection.connected) {
        connection.send(msg);
    }
}

function* setSelectedThreadWithDelay(conversation): any {
    try {
        yield delay(50);
        yield put(setSelectedThread(conversation));
    } catch (ex) {
    }
}

function* attemptSetSelectedThread({payload: {thread, updateConversationTime, contactId, callback, afterCreateGroup}}): any {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {selectedThreadId, user, contacts} = selector(store.getState(), {selectedThreadId: true, user: true, contacts: true});
        let contact;
        if (contactId !== "") {
            contact = yield select(contactSelector(contactId));
        }
        const threadId = contact ? contact.getIn(['threads', 'threadId']) :  Map.isMap(thread) ?  thread.getIn(['threads', 'threadId']): thread.threads.threadId;
        yield put(setSelectedThreadId(threadId))

        let threadUser: any = "";

        const members = contact ? contact.get('members') : Map.isMap(thread) ? thread.get('members') : thread.members; //members conversion to immutable
        if(Map.isMap(members)) {
            members.map((value, key) => {
                threadUser = value;
            });
        } else {
            for (const key in members) {
                if (members.hasOwnProperty(key)) {
                    threadUser = members[key];
                }
            }
        }



        // const selectedContact = contacts.get(threadId)
        // const selectedContactInfo = selectedContact.getIn(["members", threadId])
        // let selectedAvatarUrl = "";
        // if (selectedContactInfo.get("avatar")) {
        //     selectedAvatarUrl = (window as any).URL.createObjectURL(selectedContactInfo.get("avatar"))
        // }
        // console.log(selectedAvatarUrl, "selectedAvatarUrl22222")

        // yield put(setSelectedAvatarUrl(selectedAvatarUrl))

        const threadType = contact ? contact.getIn(['threads', 'threadType']) : Map.isMap(thread) ?  thread.getIn(['threads', 'threadType']) : thread.threads.threadType;
        const {isGroup} = getThreadType(threadType);
        const isProductContact = isGroup ? false : Map.isMap(threadUser) ? threadUser.get('isProductContact') : threadUser.isProductContact;
        let conversation: any = thread && Map.isMap(thread) ? thread : thread ? fromJS(thread) : yield call(IDBConversation.getThread, threadId);

        // let conversation: any = conversations.get(threadId);

        // const sharedMediaMessagesCount = yield call(IDBMessage.getSharedMediaMessagesCount, threadId, [MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);

        // shared media open action

        // if (sharedMediaMessagesCount.length > 0) {
        //     effects.push(put(setShowSharedMedia(true)));
        //     effects.push(put(removeSharedMediaMessages()))
        // } else {
        //     effects.push(put(setShowSharedMedia(false)));
        // }


        // yield put(initializeSharedMedia(threadId));


        // yield put(setSharedMediaCount(sharedMediaMessagesCount[0].count));

        if (!conversation) {
            conversation = thread || contact;
        }
        let conversationId,lastMessageId,messages;

        if (Map.isMap(conversation) && conversation.get("selectedThread")) {
            conversation = conversation.getIn(["selectedThread", "conversations"])
        }

        if (!Map.isMap(conversation)) {
            if(!conversation.conversations) {
                conversation =  yield call(IDBConversation.getThread, threadId);
            }
            if (conversation) {
                conversationId = conversation.conversations.conversationId;
                lastMessageId = conversation.conversations.lastMessageId;
                messages = conversation.messages;
            }

        } else {
            if(conversation.get("conversations")) {
                conversationId = conversation.getIn(["conversations","conversationId"]);
                lastMessageId = conversation.getIn(["conversations","lastMessageId"]);
                messages = conversation.get("messages");
            } else {
                conversation =  yield call(IDBConversation.getThread, threadId);
                if (conversation) {
                    conversationId = conversation.conversations.conversationId;
                    lastMessageId = conversation.conversations.lastMessageId;
                    messages = conversation.messages;
                }
            }
        }




        // conversation.loading = true;
        const effects: Array<any> = [];
        // effects.push(put(setSelectedThreadId(threadId)));

        let loadedMessages: any = {};

        try {
            if (isGroup) {
                const groupId: string = threadId.split('@')[0];
                loadedMessages = yield call(getGroupMessages, groupId, GROUP_MESSAGES_LIMIT, lastMessageId, (messages && lastMessageId === messages.messageId) ? messages : null);
            } else {
                if (isProductContact || ((conversationId && conversationId.toString().includes("@msg.hawkstream.com")) || (threadId && threadId.toString().includes("@msg.hawkstream.com")))) {
                    loadedMessages = yield call(getConversationMessages, conversationId || threadId, MESSAGES_CHAT_LIMIT, lastMessageId, (messages && lastMessageId === messages.messageId) ? messages : null);
                }
            }
        } catch (e) {
            Log.i(e);
        }

        // yield call(checkForProfileUpdates, getUsername(threadId), threadId, conversation)

        yield put(setStoreMessages(loadedMessages.messages));


        // if(document.getElementById("chatBackground")){
        //     document.getElementById("chatBackground").scrollTop = document.getElementById("chatBackground").scrollHeight;
        // }

        if (!isGroup) {
            yield fork(checkForProfileUpdates, getUsername(threadId), threadId, conversation)
        }

        // effects.push(fork(checkForProfileUpdates, getUsername(threadId), threadId, conversation));

        if(conversation) {
            conversation =  Map.isMap(conversation) ? conversation :  fromJS(conversation);
            if (conversation && conversation.get('conversations') && conversation.getIn(['conversations','newMessagesIds']) && conversation.getIn(['conversations','newMessagesIds']).size > 0) {
                const privacy: any = yield select(privacySelector());
                if (privacy.get("showSeenStatus")) {
                    const username: any = yield select(userNameSelector());

                    conversation.getIn(['conversations', 'newMessagesIds']).map(id => {
                        const to: string = conversation.getIn(['conversations','threadId']).split("@").shift();
                        // put(sendMessageSeen(to, id, username, isGroup));
                        effects.push(put(sendMessageSeen(to, id, username, isGroup)));
                    });
                }
            }
        }

        Log.i("seenStatus -> selectedThreadId = ", selectedThreadId)

        if (selectedThreadId) {
            store.dispatch(userBecameOffline(selectedThreadId,""))
        }

        if (isProductContact) {
            const connection: any = connectionCreator.getConnection();
            const msg: Strophe.Builder = lastActivityRequestXML({id: threadId});
            if (connection.connected) {
                connection.send(msg);
            }
        }

        if (conversation && conversation.get('conversations') && conversation.getIn(['conversations','newMessagesIds']) && conversation.getIn(['conversations','newMessagesIds']).size > 0) {
            Log.i(conversation.getIn(['conversations','threadId']), "attemptResetConversationNewMessagesIds")
            yield put(attemptResetConversationNewMessagesIds(conversation.getIn(['conversations','threadId'])))
            // effects.push(put(attemptResetConversationNewMessagesIds(conversation.getIn(['conversations','threadId']))));
        }

        // if (updateConversationTime) {
        //     effects.push(put(attemptUpdateConversationTime(threadId, Date.now())));
        // }

        yield put(initializeSharedMedia(threadId));
        yield put(fetchSharedMedia(threadId,SHARED_MEDIA_TYPES.MEDIA))
        yield put(filterEmptyConversations(threadId))
        // effects.push(put(filterEmptyConversations(threadId)));
        const conversationsFromDB = yield call(IDBConversation.getConversations);
        if(conversationsFromDB) {
            conversationsFromDB.map(conversation => {
                if(conversation.getIn(["conversations", "conversationId"]) === threadId) {
                    return
                } else if(conversation.getIn(['conversations','lastMessageId']) === ''){
                    return IDBConversation.removeConversation(conversation.getIn(['conversations','conversationId']))
                }
            });
        }

        yield all(effects);

        // yield fetchSharedMediaHandler(payload);

        if (isGroup && !conversation.getIn(["threads", "threadInfo", "disabled"]) && !afterCreateGroup) {
            yield put(getGroupInfo(threadId));
        }



        // if (isGroup && conversation.getIn(["threads", "threadInfo", "callId"])) {
        //     const groupInfo = conversation.toJS().threads
        //     const callId = conversation.getIn(["threads", "threadInfo", "callId"])
        //     const statusMap = conversation.getIn(["threads", "threadInfo", "statusMap"])
        //     let joinedList = conversation.getIn(["threads", "threadInfo", "joinedList"])
        //     joinedList.keySeq().forEach(item => {
        //         Log.i("conference -> item = ", conversation.getIn(["members", item, "avatarBlobUrl"]))
        //         joinedList = joinedList.setIn([item, "avatarBlobUrl"], conversation.getIn(["members", item, "avatarBlobUrl"]))
        //     })
        //     Log.i("conference -> joinedList = ", joinedList)
        //     yield put(changedConferenceDetails(joinedList, groupInfo, statusMap))
        // }

        Log.i("attamptSetSelectedThread -> pasiveMembers = 2", conversation)
        Log.i("attamptSetSelectedThread -> isGroup = ", isGroup)

        if (isGroup && (!conversation.getIn(["threads", "threadInfo", "pasiveMembers"]) || (conversation.getIn(["threads", "threadInfo", "pasiveMembers"]) && conversation.getIn(["threads", "threadInfo", "pasiveMembers"]).size === 0))) {

            const threadInfo = conversation.getIn(["threads", "threadInfo"]).toJS();
            const id = user.get("id")
            Log.i("attamptSetSelectedThread -> pasiveMembers = 1", conversation.getIn(["members", id]))
            Log.i("attamptSetSelectedThread -> id = ", id)
            const pasiveMembers: any = threadInfo.pasiveMembers || {}
            const joinedList: any = threadInfo.joinedList || {}
            const member: any = contacts.getIn([id, "members", id]).toJS()
            // const member: any = conversation.getIn(["members", id]).toJS()


            Log.i("attamptSetSelectedThread -> pasiveMembers = 3", member)


            if (!pasiveMembers[id]) {
                pasiveMembers[id] = member
                joinedList[id] = member

                yield all([
                    call(IDBConversation.updateGroup, threadId, {
                        pasiveMembers,
                        joinedList
                    }),
                    put(updateConversationProps(threadId, {
                        pasiveMembers,
                        joinedList
                    }))
                ])
            }

        }

        //yield put(attemptSetNewMessagesCountAction())

        // let threadUser: any = "";
        // let isNotRegistered: boolean = false;
        // const members = contactId !== "" ? contact.members : thread.members;
        // for (const key in members) {
        //     if (members.hasOwnProperty(key)) {
        //         threadUser = members[key];
        //     }
        // }

        if (callback) {
            callback();
        }


        // TODO this might not be needed
        // if (!isGroup) {
        //     yield put(contactUpdate(threadId))
        // }


        // TODO Vahan refoctor
        // if (threadUser.email) {
        //     const {data: {body: {0: {registered}}, status}} = yield call(userCheck, [], [threadUser.email]);
        //     isNotRegistered = !registered;
        // } else if (threadUser.phone) {
        //     const {data: {body: {0: {registered}}, status}} = yield call(userCheck, [threadUser.phone], []);
        //     isNotRegistered = !registered;
        // }
        //
        // if (isNotRegistered) {
        //     yield fork(
        //         IDBContact.updateContact, threadId, {
        //             firstName: threadUser.firstName,
        //             lastName: threadUser.lastName,
        //             saved: threadUser.saved,
        //             name: threadUser.name,
        //             isProductContact: false,
        //         });
        //     yield put(updateContact(threadId, threadUser.firstName, threadUser.lastName, threadUser.phone, threadUser.avatarUrl, threadUser.imageUrl, false, threadUser.saved))
        // }
        // scrollToBottom()
        // if(document.getElementById("chatBackground")){
        //     document.getElementById("chatBackground").scrollTop = document.getElementById("chatBackground").scrollHeight;
        // }
    } catch (e) {
        logger("selected thread error");
        logger(e);
    }
}


function* attemptSetNewMessagesCount() {
    const {messagesCount} = yield all({
        messagesCount: call(IDBConversation.getMessagesCount, CONVERSATION_TYPE.SINGLE)
    });
    if ((window as any).ipcRenderer) {
        if ((window as any).isMac) {
            (window as any).ipcRenderer.send('setBadge', messagesCount);
        } else {
            (window as any).ipcRenderer.send('setBadge', (messagesCount) ? createBadge(messagesCount) : null);
        }
    }
    yield put(setNewMessagesCount(messagesCount));
}

function* attemptSetFollowers({payload: {id, followers}}) {
    yield IDBPublicChat.setFollowers(id, followers);
}

function* attemptAddFollower({payload: {id, username}}) {
    yield IDBPublicChat.addFollower(id, username);
    yield put(addFollower(id, username));
}

function* attemptRevokeAdmin({payload: {id, username}}) {
    yield IDBPublicChat.revokeAdmin(id, username);
    yield put(revokeAdmin(id, username));
}

function* attemptAddAdmin({payload: {id, username}}) {
    yield IDBPublicChat.addAdmin(id, username);
    yield put(addAdmin(id, username));
}

function* attemptRemoveMemberSelectedThread({payload: {threadId, contactId}}) {
    const thread: any = yield call(IDBConversation.getThread, threadId);
    const effects: Array<any> = [];

    if (thread && thread.threads && thread.threads.threadInfo) {
        const {threads: {threadInfo}} = thread;
        const groupMembersUsernames = threadInfo && [...threadInfo["groupMembersUsernames"]];
        const removedUsername = getUsername(contactId);
        const index = groupMembersUsernames.indexOf(removedUsername);
        groupMembersUsernames.splice(index, 1);
        effects.push(call(IDBConversation.updateGroup, threadId, {groupMembersUsernames}));
        effects.push(call(IDBConversation.removeGroupMember, threadId, contactId));
        effects.push(put(removeMemberSelectedThread(threadId, contactId)));
        effects.push(put(removeConversationMember(threadId, contactId)));
    }

    if (effects.length > 0) {
        yield all(effects);
    }
}

function* attemptDisableGroup({payload: {threadId, username}}) {
    try {
        const draftMessage: string = yield select(conversationDraftMessageSelector(threadId));
        const effects: any = [
            call(IDBConversation.updateGroup, threadId, {disabled: {value: true, username}}),
            call(IDBConversation.removeGroupMember, threadId, `${username}@${SINGLE_CONVERSATION_EXTENSION}`),
            // put(disableGroupSelectedThread(threadId, username))
            put(disableGroupConversationThread(threadId, username))
        ];

        // if group history is saved and draft message exists, then remove draft message
        if (draftMessage) {
            effects.push(call(IDBConversation.updateDraftMessage, threadId, ''));
            effects.push(put(setConversationDraft(threadId, '')));
        }

        yield all(effects);
    } catch (e) {
        Log.i("#############attemptDisableGroup#####################");
        Log.i(e);
        Log.i("#############attemptDisableGroup#####################");
    }

}

function* attemptEnableGroup({payload: {threadId, username}}) {

    const contact: any = yield call(profileListData, [username]);

    yield IDBConversation.updateGroup(threadId, {disabled: {value: false, username}});
    // yield put(enableGroup(threadId, contact[username]));
    yield put(enableConversationGroup(threadId, contact[username]));
}

function* initializeApplication() {
    // open application loader before opening
    yield put(UPDATE_APPLICATION_STATE({isLoading: true, stateName: "INITIALIZING"}));
    //
    // // watch application online offline status
    yield fork(WATCH_NETWORK_STATUS);
    //
    // // watch window focus status
    yield fork(WATCH_WINDOW_FOCUS_STATUS);

    // if (username && accessToken) {
    //     yield call(addAuthorizationHeader, username, accessToken);
    // }

    if ((window as any).isDesktop === true) {
        const applicationPath = (window as any).remote.app.getAppPath();
        const regex = /^(?!\/volumes.*$)(?!\/private.*$).*/ig;

        if (applicationPath && applicationPath.match(regex)) {
            try {
                let fileSeparator = "/";
                if ((window as any).isWin) {
                    fileSeparator = "\\";
                }
                const lastOpened = localStorage.getItem(`openedFrom`);
                (window as any).fs.unlinkSync(applicationPath + `${fileSeparator}app${fileSeparator}check.txt`);
                localStorage.setItem(`openedFrom`, `applications`);
                if (lastOpened === `applications`) {
                    yield put(SIGN_OUT(false));
                }
            } catch (ex) {
            }
        } else {
            localStorage.setItem(`openedFrom`, `private`);
        }
    }


    let synced: any = localStorage.getItem(`synced_${APPLICATION.VERSION}`);
    const initialState: any = yield all({
            settings: call(IDBSettings.getStoreSettings),
            networks: call(IDBNetwork.getNetworks),
            conversations: call(IDBConversation.getLocalConversations),
            contacts: call(IDBContact.getContactsFromDB),
            user: call(IDBApplication.get, APPLICATION_PROPERTIES.user),
            applicationVersion: call(IDBApplication.get, APPLICATION_PROPERTIES.appVersion),
            newMessagesCount: call(IDBConversation.getMessagesCount, CONVERSATION_TYPE.SINGLE),
            recentStickers: call(IDBApplication.get, APPLICATION_PROPERTIES.stickers),
            stickerStore: call(IDBApplication.get, APPLICATION_PROPERTIES.stickerStore),
            myStickers: call(IDBApplication.get, APPLICATION_PROPERTIES.myStickers),
            updateBlobUrls: call(IDBMessage.updateBlobUrls),
            caches: call(IDBCache.getAll),
        }
    );

    Log.i("conference -> initialState = ", initialState)

    let deepLink = initialState.user ? initialState.user.deepLink : null;

    if(initialState.user) {
        if(initialState.user.avatar) {
            initialState.user.avatarBlobUrl = (window as any).URL.createObjectURL(initialState.user.avatar);
        } else {
            initialState.user.avatarBlobUrl = ""
        }
    }

    if(initialState.conversations) {

        Object.keys(initialState.conversations).forEach(item => {
            if (initialState.conversations[item].threads.threadInfo.avatar) {
                initialState.conversations[item].threads.threadInfo.avatarBlobUrl = (window as any).URL.createObjectURL(initialState.conversations[item].threads.threadInfo.avatar)
            } else {
                initialState.conversations[item].threads.threadInfo.avatarBlobUrl = ""
            }
        })
        // if(initialState.conversations.avatar) {
        //     initialState.user.avatarBlobUrl = (window as any).URL.createObjectURL(initialState.user.avatar);
        // } else {
        //     initialState.user.avatarBlobUrl = ""
        // }
    }



    try {
        if (!deepLink) {
            if (localStorage.getItem("deepLink")) {
                deepLink=localStorage.getItem(deepLink)
            } else {
                const { data } = yield call(getDeepLink);

                if (data.status === "SUCCESS") {
                    deepLink = data.body
                    localStorage.setItem("deepLink", deepLink)
                }
            }
        }
    } catch(e) {
        Log.i("#############attemptDisableGetDeepLink#####################");
        Log.i(e);
        Log.i("#############attemptDisableGetDeepLink#####################");
    }

    yield all([
        put(conversationBulkInsert(initialState.conversations)),
        put(contactsBulkInsert(initialState.contacts)),
        put(getAllCaches(initialState.caches)),
        put(setUser({...initialState.user, deepLink})),
        put(UPDATE_APPLICATION_STATE({
            config: {
                version: initialState.applicationVersion || APP_CONFIG.CURRENT_VERSION,
                env: process.env.NODE_ENV || 'production' // Todo change it and set webpack in config
            }
        })),
        put(setSettings(initialState.settings)),
        put(setNewMessagesCount(initialState.newMessagesCount)),
        put(addRecentStickers(initialState.recentStickers)),
        put(setStickers(initialState.stickerStore)),
        put(setMyStickers(initialState.myStickers)),
        put(setNetworks(initialState.networks)),
    ]);

    Log.i("conference -> initialState user = ", initialState.user)

    const user = initialState.user

    yield put(attemptCreateContact(
        user.id,
        user.firstName,
        user.lastName,
        user.username,
        user.phone,
        false,
        false,
        null,
        user.email,
        user.email,
        null,
        null,
        true
    ));

    // yield put(attemptCreateContact(
    //     contact.contactId,
    //     contact.firstName,
    //     contact.lastName,
    //     contact.author,
    //     contact.phone,
    //     contact.saved,
    //     false,
    //     null,
    //     contact.email,
    //     contact.email,
    //     null,
    //     null,
    //     true
    // ));

    if (!synced) {
        synced = {}

    } else {
        synced = JSON.parse(synced);
        const {failed} = synced;

        if (failed && failed.length > 0) {
            resetFailed();
            yield all(failed);
            console.warn("#### failed on before unload");
        }
    }

    yield put(setSync(synced));
    yield fork(IDBMessage.updateUploadMessagesStatus);

    if ((window as any).ipcRenderer) {
        if ((window as any).isMac) {
            (window as any).ipcRenderer.send('setBadge', initialState.newMessagesCount);
        } else {
            (window as any).ipcRenderer.send('setBadge', (initialState.newMessagesCount) ? createBadge(initialState.newMessagesCount) : null);
        }
    }
    yield fork(attemptAddRequests);
    yield put(UPDATE_APPLICATION_STATE({isLoading: false, stateName: "INITIALIZING_COMPLETED"}));
    yield put(TOGGLE_CONTACTS_LOADING(false)); // Todo maybe move to ContactsSaga
}

function* attemptChangeLeftPanel({payload: {panel}}) {
    const effects: Array<any> = [put(changeLeftPanel(panel))];

    if (panel === LEFT_PANELS.channels || panel === LEFT_PANELS.threads) {
        let threadType = '';
        if (panel === LEFT_PANELS.channels) {
            threadType = CONVERSATION_TYPE.CHANNEL;
        }
        // const conversations = yield call(IDBConversation.getLocalConversations, 1, false, threadType, '');
        // if (conversations) {
        //     effects.push(put(conversationBulkReplace(conversations)));
        // }
    }

    yield all(effects);
}

function* checkMutedConversations({payload: {encodedUsername}}) {


    const username: string = yield select(userNameSelector());

    if (username && username !== "") {
        const chan = yield call(mutedInterval, encodedUsername);

        try {
            while (true) {
                const expiredConversations = yield take(chan);
                Log.i("expiredConversations -> ", expiredConversations)
                if (Array.isArray(expiredConversations) && expiredConversations.length > 0) {
                    yield put(attemptUnmuteConversations(expiredConversations));
                }
            }

        } catch (e) {
            Log.i(e);
        }
    }
}

function createBadge(number) {
    const style = {
        fontColor: 'white',
        font: '24px arial',
        color: 'red',
        fit: true,
        decimals: 0,
        radius: 8
    };
    const radius = style.radius;
    const img: any = document.createElement('canvas');
    img.width = Math.ceil(radius * 2);
    img.height = Math.ceil(radius * 2);
    img.ctx = img.getContext('2d');
    img.radius = radius;
    img.number = number;
    img.displayStyle = style;

    style.color = style.color ? style.color : 'red';
    style.font = style.font ? style.font : '18px arial';
    style.fontColor = style.fontColor ? style.fontColor : 'white';
    style.fit = style.fit === undefined ? true : style.fit;
    style.decimals = style.decimals === undefined || isNaN(style.decimals) ? 0 : style.decimals;

    img.draw = function () {
        let fontScale, fontWidth, fontSize, number;
        this.width = Math.ceil(this.radius * 2);
        this.height = Math.ceil(this.radius * 2);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.displayStyle.color;
        this.ctx.beginPath();
        this.ctx.arc(radius, radius, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.font = this.displayStyle.font;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = this.displayStyle.fontColor;
        number = this.number.toFixed(this.displayStyle.decimals);
        number = number > 99 ? "99+" : number;
        fontSize = Number(/[0-9\.]+/.exec(this.ctx.font)[0]);

        if (!this.displayStyle.fit || isNaN(fontSize)) {
            this.ctx.fillText(number, radius, radius);
        } else {
            fontWidth = this.ctx.measureText(number).width;
            fontScale = Math.cos(Math.atan(fontSize / fontWidth)) * this.radius * 2 / fontWidth;
            this.ctx.setTransform(fontScale, 0, 0, fontScale, this.radius, this.radius);
            this.ctx.fillText(number, 0, 0);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (!this.displayStyle.fit || isNaN(fontSize)) {
            this.ctx.fillText(number, radius, radius);
        } else {
            fontScale = Math.cos(Math.atan(fontSize / fontWidth)) * this.radius * 2 / fontWidth;
            this.ctx.setTransform(fontScale, 0, 0, fontScale, this.radius, this.radius);
            this.ctx.fillText(number, 0, 0);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        return this;
    };

    img.draw();
    return img.toDataURL();
}

function mutedInterval(encodedUsername) {

    return eventChannel(emitter => {
            const iv = setInterval(() => {
                const expiredMutedConversations: Array<string> = [];
                const currentTime = Date.now();

                const mutedConversations = localStorage.getItem(encodedUsername);

                if (mutedConversations) {
                    const mutedMap = JSON.parse(mutedConversations);

                    Object.keys(mutedMap).map(threadId => {
                        if (parseInt(mutedMap[threadId].expires) < currentTime) {
                            expiredMutedConversations.push(threadId);
                        }
                    });

                    if (expiredMutedConversations.length > 0) {
                        emitter(expiredMutedConversations);
                    }
                }
            }, 3000);
            return () => {
                clearInterval(iv)
            }
        }
    )
}

function* groupsSyncSuccess() {
    setSynced("groups");

    if (checkForSyncFinish()) {
        yield put(syncCompleted());
    }
}

function* contactsSyncSuccess() {
    setSynced("contacts");

    if (checkForSyncFinish()) {
        yield put(syncCompleted());
    }

    yield put(FETCH_FAVORITE_CONTACT_LIST());
    yield put(FETCH_CONTACT_LIST(0, 50));
}

function* privateChatsSyncSuccess() {
    setSynced("privateChats");

    if (checkForSyncFinish()) {
        yield put(syncCompleted());
    }
}

function* conversationsSyncSuccess() {
    setSynced("conversations");

    if (checkForSyncFinish()) {
        yield put(syncCompleted());
    }
}

function* channelsSyncSuccess() {
    setSynced("channels");

    if (checkForSyncFinish()) {
        yield put(syncCompleted());
    }
}

function* checkForFailedSync() {
    const store: Store<any> = storeCreator.getStore();
    const {failedSync} = selector(store.getState(), {app: {failedSync: true}});

    if (Array.isArray(failedSync) && failedSync.length > 0) {
        yield all(failedSync);
        yield put(resetFailedSync());
        yield delay(10000);
        yield fork(checkForFailedSync);
    }
}

function* watchForInserts() {
    while (true) {
        yield take([
            "CONTACTS:CONTACTS_BULK_INSERT",
            "CONVERSATION:SET_CONVERSATIONS",
            "CONVERSATION:CONVERSATIONS_BULK_INSERT"
        ]);

        if (!isLoggedIn()) {
            yield all([
                put(resetUser()),
                put(resetAplication()),
                put(resetContacts()),
                put(resetMessages()),
                put(resetRequests()),
                put(resetSettings()),
                put(resetGroups()),
                put(resetCalls()),
                put(resetConversations())
            ]);
        }

    }
}

function* retryCheckSyncFailed() {
    if (navigator.onLine) {
        yield delay(10000);
        yield fork(checkForFailedSync);
    }
}

function* attemptSetSharedMediaMessages({payload: {threadId}}) {
    let messages: any = {};
    try {
        messages = yield call(IDBMessage.findAll, threadId, 0, 80, [MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);

        if (messages) {
            let messageMap: any = {};
            // for (const message of messages) {
            //     message.messages.loadStatus = message.messageStatus.loadStatus;
            //     messageMap[message.messages.messageId] = message.messages;
            // }
            messages.map(message => {
                message.messages.loadStatus = message.messageStatus.loadStatus;
                messageMap[message.messages.messageId] = message.messages;
            });
            yield put(setSharedMediaMessages(messageMap));
        }
    } catch (e) {
        Log.i(e);
    }
}

function* attemptSetGifMessages({payload: {keyword}}) {
    yield put(setGifsLoading());
    try {
        const {data: {data, meta: {status}, pagination: {total_count, count}}} = yield call(searchGifsRequest, keyword, 0);
        if (status == 200) {
            const gifMessagesCount = {totalCount: total_count, count: count};
            yield put(setGifMessagesCount(gifMessagesCount));
            if (Array.isArray(data) && data.length > 0) {
                let gifsMap: any = {};
                for (let i = 0; i < data.length; i++) {
                    const gif: any = data[i];
                    gifsMap[gif.id] = {
                        id: gif.id,
                        type: gif.type,
                        url: gif.url,
                        preview: fromJS(gif.images.preview_gif),
                        original: fromJS(gif.images.downsized),
                        time: Date.now() + i,
                    };
                }

                yield put(setGifMessages(gifsMap));
            }
        }
    } catch (e) {
        Log.i(e);
    } finally {
        yield put(removeGifsLoading());
    }
}

function* attemptShowMoreGifMessages({payload: {keyword}}): any {
    const store: Store<any> = storeCreator.getStore();
    const {gifMessages} = selector(store.getState(), {gifMessages: true});
    yield put(showMoreGifLoading(true));
    const count: number = gifMessages.size / GIF_SEARCH_LIMIT;
    const newGifsCount: number = count * GIF_SEARCH_LIMIT + count;
    try {
        const {data: {data, meta: {status}, pagination: {total_count, count}}} = yield call(searchGifsRequest, keyword, newGifsCount);
        if (status == 200) {
            const gifMessagesCount = {totalCount: total_count, count: count};
            yield put(setGifMessagesCount(gifMessagesCount));
            if (Array.isArray(data) && data.length > 0) {
                let gifsMap: any = {};
                for (let i = 0; i < data.length; i++) {
                    const gif: any = data[i];
                    gifsMap[gif.id] = {
                        id: gif.id,
                        type: gif.type,
                        url: gif.url,
                        preview: fromJS(gif.images.preview_gif),
                        original: fromJS(gif.images.downsized),
                        time: Date.now() + i,
                    };
                }
                yield put(setShowMoreGifMessages(gifsMap));
            }
        }
    } catch (e) {
        Log.i(e, "showMore gif messages");
    } finally {
        yield put(showMoreGifLoading(false));
    }

}

function* stopTyping(threadId, username, typingList) {
    yield delay(5000);
    yield all([
        put(applicationStopTyping(threadId, username)),
        put(attemptUpdateConversationTyping(threadId, username, true))
    ]);
    delete typingList[`${threadId}_${username}`];
}

function* watchForTyping() {
    const typingList: any = {};
    while (true) {
        const {payload: {threadId, username, message}, type} = yield take([actions.ATTEMPT_SET_TYPING, MESSAGE_ACTIONS.ATTEMPT_CREATE_MESSAGE]);
        if (type === MESSAGE_ACTIONS.ATTEMPT_CREATE_MESSAGE) {
            const {threadId, creator} = message;
            const username = getUsername(creator);
            const key = `${threadId}_${username}`;

            if (typingList[key]) {
                yield cancel(typingList[key]);
                yield all([
                    put(applicationStopTyping(threadId, username)),
                    put(attemptUpdateConversationTyping(threadId, username, true))
                ]);
                delete typingList[`${threadId}_${username}`];
            }

        } else {
            const key: string = `${threadId}_${username}`;

            if (typingList[key]) {
                yield cancel(typingList[key]);

            } else {
                yield all([
                    put(applicationTyping(threadId, username)),
                    put(attemptUpdateConversationTyping(threadId, username, false))
                ])
            }
            typingList[key] = yield fork(stopTyping, threadId, username, typingList)
        }

    }
}


// refactored

export function* WATCH_NETWORK_STATUS() {
    yield put(NETWORK_STATUS_UPDATE(window.navigator.onLine));

    const channel = eventChannel(listener => {
        const handleConnectivityChange = (e) => {
            const isOnline: boolean = e.type === 'online';
            listener(isOnline);
        };

        window.addEventListener('offline', handleConnectivityChange);
        window.addEventListener('online', handleConnectivityChange);

        return () => {
            window.removeEventListener('online', handleConnectivityChange);
            window.removeEventListener('offline', handleConnectivityChange);
        };
    });
    while (true) {
        const connection = yield take(channel);
        yield put(NETWORK_STATUS_UPDATE(connection));
    }
}


export function* WATCH_WINDOW_FOCUS_STATUS() {

    const channel = eventChannel(listener => {
        const handleWindowFocus = (e) => {
            const isFocused: boolean = e.type === "focus";
            listener(isFocused);
        };

        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowFocus);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('blur', handleWindowFocus);
        };
    });

    while (true) {
        const isFocused: boolean = yield take(channel);
        yield put(FOCUS_APPLICATION(isFocused));
    }
}


function* NETWORK_STATUS_UPDATE_HANDLER({payload: {isOnline}}: IApplicationActions) {
    try {
        logger(" ###### ONLINE ####### ");
        logger(isOnline);
        logger(" ###### ONLINE END ####### ");

        if (isOnline) {
            // connect from socket
            // yield put(WEBSOCKET_CONNECT());
        } else {
            // disconnect from sockets
            // WEBSOCKET.disconnect();
        }

        // change online status in store
        yield put(NETWORK_STATUS_UPDATE_SUCCESS(isOnline));

    } catch (e) {
        logger("### network status update");
        logger(e);
        logger("### network status update");
    }
}


function* FOCUS_APPLICATION_HANDLER({payload: {isFocused}}: IApplicationActions) {
    const store: Store<any> = storeCreator.getStore();
    const {lastCall} = selector(store.getState(), {calls: {lastCall: true},});
    try {

        if (isLoggedIn()) {
            const connection: any = connectionCreator.getConnection();
            yield put(SET_APPLICATION_FOCUS(isFocused))
            if (isFocused) {
                const foregroundMsg: Strophe.Builder = foregroundXML();
                if (connection.connected) {
                    connection.send(foregroundMsg);
                }

                RegistrationService.instance.onBackground = false
                Log.i("application is focused")
            } else {
                if (lastCall && lastCall.size > 0 &&
                    lastCall.get("ownCall") ||
                    lastCall && lastCall.size > 0 &&
                    !lastCall.get("ownCall") && lastCall.get("status") === CALL_STATUSES.answering) {
                    return false;
                }
                const backgroundMsg: Strophe.Builder = backgroundXML();
                if (connection.connected) {
                    connection.send(backgroundMsg);
                }
                RegistrationService.instance.onBackground = true
                Log.i("application is unfocused")
            }
        }

    } catch (e) {
        logger("### APP FOCUSED ERROR ###");
        logger(e);
        logger("### APP FOCUSED ERROR ###");
    }
}


function* ACTIVATE_CALLER_THREAD_HANDLER() {
    try {
        const lastCall: any = yield select(getLastCallSelector());
        const leftPanel: string = yield select(leftPanelSelector());

        if (lastCall) {
            const caller: any = lastCall.get('ownCall') ? lastCall.get('receiver') : lastCall.get('caller');
            const thread: any = yield select(conversationSelector(caller));
            const threadId: string = thread && thread.getIn(['threads', 'threadId']);

            if (leftPanel !== LEFT_PANELS.threads) {
                yield put(changeLeftPanel(LEFT_PANELS.threads));
            }
            if (threadId) {
                yield put(ATTEMPT_SET_SELECTED_THREAD({
                    threads: {
                        threadId: threadId,
                        threadType: getConversationType(threadId)
                    }
                }))
            } else {
                yield put(ATTEMPT_SET_SELECTED_THREAD(null, null, caller))
            }

        }

    } catch (e) {
        logger('######### ERROR ACTIVATE_CALLER_THREAD_HANDLER');
        logger(e);
        logger('######### ERROR ACTIVATE_CALLER_THREAD_HANDLER END');
    }
}


function* initializeSharedMediaHandler({payload: {threadId}}: IApplicationActions) {
    try {
        const [mediaCount, mediaCountTypes]: any[] = yield all([
            call(ApplicationModel.selectSharedMediaCount, threadId),
            all({
                media: call(ApplicationModel.selectSharedMediaCountByType, threadId, [SHARED_MEDIA_TYPES.MEDIA]),
                file: call(ApplicationModel.selectSharedMediaCountByType, threadId, [SHARED_MEDIA_TYPES.FILE]),
                link: call(ApplicationModel.selectSharedMediaCountByType, threadId, [SHARED_MEDIA_TYPES.LINK]),
            })
        ]);

        yield put(initializeSharedMediaSucceed({
                total: mediaCount,
                media: mediaCountTypes.media,
                file: mediaCountTypes.file,
                link: mediaCountTypes.link
            }
        ));

        // yield put(fetchSharedMedia(threadId, sharedMediaTypes.MEDIA));


    } catch (e) {
        logger("### INIT SHARED MEDIA ###");
        logger(e);
        logger("### INIT SHARED MEDIA ERROR ###");
    }
}

function* fetchSharedMediaHandler({payload: {threadId, sharedMediaType}}: IApplicationActions) {
    try {
        const skip: number = yield select(sharedMediaSkipSelector(sharedMediaType));

        if (!skip && skip !== 0) {
            throw new Error("invalid shared media skip");
        }

        const sharedMediaMap: any = yield call(ApplicationModel.selectSharedMediaByType, threadId, sharedMediaType, skip);
        const nextSkip: number = skip + 1;

        yield put(fetchSharedMediaSucceed(sharedMediaType, sharedMediaMap, nextSkip));
        if(sharedMediaType === SHARED_MEDIA_TYPES.MEDIA) {
            const media: any = yield select(mediaSelector());

            if(media.toArray().length) {
                const a = yield getData(media.toArray()).then(res => res.filter(function( element ) {
                    return element !== undefined;
                })).then(arr => {
                    const result = {}
                    for (let i = 0; i < arr.length; i++) {
                        const arrObj: any = arr[i]
                        result[arrObj.key] = arrObj.value;
                    }
                    return result;
                });
                if(!(Object.keys(a).length === 0 && a.constructor === Object)){
                    yield put(setSharedMediaImages(a))
                }
            }
        }
    } catch (e) {
        yield put(fetchSharedMediaFailed(sharedMediaType));
        logger("### FETCH SHARED MEDIA ###");
        logger(e);
        logger("### FETCH SHARED MEDIA ERROR ###");
    }
}

function* getWalletUrl() {
    try {
        const response = yield call(getWalletURL);
        const {data: {body, status}} = response
        if (status === "SUCCESS"){
            yield put(getWalletUrlSucceed(body))
        }

    } catch (e) {
        logger("### GET WALLET URL ERROR###");
        logger(e);
        logger("### FGET WALLET URL ERROR ###");
    }
}


const getLoadedImage = remotePath => Promise.resolve(MessagesModel.get(remotePath));
const asyncLoadedimage = async(remotePath, msgId) => {
    const file = await getLoadedImage(remotePath)
    const url = await getBlobUri(file);
    return { key: msgId,
        value: url}
};
const getData = async (messages) => {
    const imageURLS={}
    return Promise.all(messages.map(item => {
        const message: any = item.get("messages");
        if (message.get("type") === MESSAGE_TYPES.image || message.get("type") === MESSAGE_TYPES.gif) {
            const remotePath = message.get("fileRemotePath")
            const msgId: string = message.get("messageId") || message.get("id");
            return imageURLS[msgId]= asyncLoadedimage(remotePath, msgId);
        }
    }))
};

function* DELETE_SHARED_MEDIA_MESSAGES_HANDLER({payload: {messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages}}: IApplicationActions) {
    try {
        const username: string = yield select(userNameSelector());
        if (isDeleteEveryWhere && ownMessages.length !== 0) {
            for (const messages of ownMessages) {
                const message: any = {
                    to: messages.getIn(["messages", "threadId"]),
                    msgText: messages.getIn(["messages", "text"]) || OFFLINE_MESSAGE_BODY,
                    msgType: MESSAGE_TYPES.delete_msg,
                    rel: messages.getIn(["messages", "id"]) || messages.getIn(["messages", "messageId"]),
                    type: XML_MESSAGE_TYPES.chat,
                    author: username,
                    id: `msgId${Date.now()}`,
                    msgInfo: "",
                    sid: messages.getIn(["messages", "sid"]),
                    pid: messages.getIn(["messages", "sid"])
                };

                const connection: any = connectionCreator.getConnection();
                const msg: Strophe.Builder = getMessageXMLForSend(message);
                const xmlBuilder: string = "sendMessageXML";

                const request: any = {
                    params: message,
                    id: message.id,
                    xmlBuilder,
                    createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
                };
                yield put(addRequest(request));
                if (connection.connected) {
                    connection.send(msg);
                }
            }
        }
        yield call(ApplicationModel.deleteSharedMediaMessages, messageIds);
        yield put(DELETE_SHARED_MEDIA_MESSAGES_SUCCESS(messageIds, checkedFilesCount));
        yield put(DELETE_STORE_MESSAGES(messageIds));
    } catch (e) {
        logger("### DELETE SHARED MEDIA MESSAGES ###");
        logger(e);
        logger("### DELETE SHARED MEDIA MESSAGES ERROR ###");
    }

}

function* FETCH_SELECTED_THREAD_HANDLER({payload: {threadId}}): any {

    try {
        yield put(MESSAGES_RESET_SUCCEED());


        let thread: any = yield call(IDBConversation.getThread, threadId);
        yield put(FETCH_MESSAGES(threadId));


        if (!thread) {
            thread = yield select(contactSelector(threadId));
            thread = thread.toJS();
        }

        if (thread && !thread.isGroup) {
            yield fork(LAST_ACTIVITY_RETRIEVE, threadId);
        }

        yield put(FETCH_THREAD_SUCCEED(thread, threadId));
        yield put(setSelectedThreadId(threadId))
    } catch (e) {
        Log.i("################FETCH_SELECTED_THREAD_HANDLER ERROR#################");
        Log.i(e);
        Log.i("################FETCH_SELECTED_THREAD_HANDLER ERROR#################");
    }
}

function* FETCH_THREAD_HANDLER({payload: {threadId}}): any {

    try {
        yield put(MESSAGES_RESET_SUCCEED());


        let thread: any = yield call(IDBConversation.getThread, threadId);
        yield put(FETCH_MESSAGES(threadId));


        if (!thread) {
            thread = yield select(contactSelector(threadId));
            thread = thread.toJS();
        }

        if (thread && !thread.isGroup) {
            yield fork(LAST_ACTIVITY_RETRIEVE, threadId);
        }

        yield put(FETCH_THREAD_SUCCEED(thread, threadId));
    } catch (e) {
        Log.i("################FETCH_THREAD_HANDLER ERROR#################");
        Log.i(e);
        Log.i("################FETCH_THREAD_HANDLER ERROR#################");
    }
}

function* LAST_ACTIVITY_RETRIEVE(threadId: string) {
    try {
        // --- get current thread presence --- //
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = lastActivityRequestXML({id: threadId});
        if (connection.connected) {
            connection.send(msg);
        }
        // ------ end ------ //
    } catch (e) {
        Log.i("################FETCH_THREAD_HANDLER#################");
        Log.i(e);
        Log.i("################FETCH_THREAD_HANDLER#################");
    }
}

function createDownloadFileChannel(endpoint: string) {
    return eventChannel(emitter => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';


        const onProgress = (e: ProgressEvent) => {
            if (e.lengthComputable) {
                const progress = e.loaded / e.total;
                emitter({progress});
            }
        };

        const onFailure = (e: any) => {
            if (e === 404) {
                emitter({err: new Error('404')});
            } else {
                emitter({err: new Error('Download failed')});
            }
            emitter(END);
        };

        xhr.addEventListener("progress", onProgress);
        xhr.addEventListener("error", onFailure);
        xhr.addEventListener("abort", onFailure);
        window.addEventListener("offline", onFailure);
        xhr.onreadystatechange = () => {
            const {readyState, status} = xhr;

            if (readyState === 4) {
                if (status === 200) {
                    emitter({success: true, blob: xhr.response});
                    emitter(END);

                } else {
                    onFailure(status);
                }
            }
        };
        xhr.open("GET", endpoint, true);
        xhr.send();

        return () => {
            window.removeEventListener("offline", onFailure);
            xhr.removeEventListener("progress", onProgress);
            xhr.removeEventListener("error", onFailure);
            xhr.removeEventListener("abort", onFailure);
            xhr.onreadystatechange = null;
            xhr.abort();
        };

    });
}

function* attemptDownloadUpdate({payload: {fileRemotePath, method, sha512, isAdminRightsRequired}}) {
    const homeDir = os.homedir();
    const cachesFolderPath = `${homeDir}/Library/Application Support/Caches`;
    const downloadFolderPath = `${homeDir}/Library/Application Support/Caches/pending`;
    const downloadFolderAppNamePath = `${homeDir}/Library/Application Support/Caches/${conf.app.versionName}-updater`;
    const downloadFolderPath2 = `${homeDir}/Library/Application Support/Caches/${conf.app.versionName}-updater/pending`;
    const fileNameToSave: any = yield call(MessagesModel.getToSaveFileName, fileRemotePath,downloadFolderPath);
    const fileNameToSave2: any = yield call(MessagesModel.getToSaveFileName, fileRemotePath,downloadFolderPath2);

    const path  = `${conf.app.versionName}/${fileRemotePath}`;
    const fs = (window as any).fs;

    try {
        const bucket: any = conf.app.aws.bucket.desktopReleases;
        const url = yield call(getSignedUrl, bucket, method, path);
        const channel = yield call(createDownloadFileChannel, url);
        while (true) {
            const {progress, err, success, blob} = yield take(channel);
            yield put(updateDownloadProgress(progress));

            if(success) {
                const updateInfo = {
                    fileName: fileRemotePath,
                    sha512: sha512,
                    isAdminRightsRequired: isAdminRightsRequired
                };
                yield put(updateDownloadProgress(1));
                yield put(toggleUpdateDownloadFinish(true));
                yield put(toggleUpdateDownloadStart(false));
                yield put(toggleUpdateIsAvailable(false));
                if (!fs.existsSync(cachesFolderPath)) {
                    yield fs.mkdirSync(cachesFolderPath);
                    yield fs.mkdirSync(downloadFolderPath);
                    yield fs.mkdirSync(downloadFolderAppNamePath);
                    yield fs.mkdirSync(downloadFolderPath2);
                } else {
                    if(!fs.existsSync(downloadFolderPath)) {
                        yield fs.mkdirSync(downloadFolderPath);
                    }
                    if(!fs.existsSync(downloadFolderAppNamePath)) {
                        yield fs.mkdirSync(downloadFolderAppNamePath);
                        yield fs.mkdirSync(downloadFolderPath2);
                    } else {
                        if(!fs.existsSync(downloadFolderPath2)) {
                            yield fs.mkdirSync(downloadFolderPath2);
                        }
                    }
                }

                yield fs.writeFile(`${downloadFolderPath}/update-info.json`, JSON.stringify(updateInfo), function(err) {
                    if (err) {
                        Log.i(err);
                    }
                });

                yield fs.writeFile(`${downloadFolderPath2}/update-info.json`, JSON.stringify(updateInfo), function(err) {
                    if (err) {
                        Log.i(err);
                    }
                });

                return new Promise( async(resolve,reject) => {
                    const fileReader = new FileReader();
                    fileReader.readAsArrayBuffer(blob);
                    fileReader.onload = async function () {
                        const wstream = fs.createWriteStream(`${fileNameToSave}`);
                        const wstream2 = fs.createWriteStream(`${fileNameToSave2}`);
                        wstream.on('finish', async () => {
                            resolve(blob);
                        });
                        wstream2.on('finish', async () => {
                            resolve(blob);
                        });
                        // @ts-ignore
                        const length = Math.ceil(this.result.byteLength / 2000000);
                        for (let i = 0; i <= length; i++) {
                            wstream.write(Buffer.from(this.result.slice(i * 2000000, i * 2000000 + 2000000)));
                            wstream2.write(Buffer.from(this.result.slice(i * 2000000, i * 2000000 + 2000000)));
                        }
                        wstream.end();
                        wstream2.end();
                    }
                })
            }


        }
    } catch (e) {

    }
}

function* updateAppVersionPropertyHandler({payload: {version}}) {
    try {
        // send delivered (id not found in response message)


        const appCurrentVersion: string = yield call(IDBApplication.get, APPLICATION_PROPERTIES.appVersion);

        if (appCurrentVersion >= version) {
            // app version is the same, no need to update
            return;
        }

        // set new version in database
        yield call(IDBApplication.update, APPLICATION_PROPERTIES.appVersion, version);

        // set new version in store
        yield put(UPDATE_APPLICATION_STATE({config: {version, env: process.env.NODE_ENV || 'production'}}));

    } catch (e) {
        Log.i("################UPDATE APP VERSION PROPERTY ERROR#################");
        Log.i(e);
        Log.i("################UPDATE APP VERSION PROPERTY ERROR#################");
    }
}

function* applicationSaga(): any {
    yield takeEvery(actions.ATTEMPT_REMOVE_MEMBER_SELECTED_THREAD, attemptRemoveMemberSelectedThread);
    yield takeEvery(actions.ATTEMPT_SET_CREATE_CONTACT_NUMBER, attemptSetCreateContactNumber);
    yield takeEvery(actions.CONVERSATIONS_SYNC_SUCCESS, conversationsSyncSuccess);
    yield takeEvery(actions.PRIVATE_CHATS_SYNC_SUCCESS, privateChatsSyncSuccess);
    yield takeEvery(actions.ATTEMPT_SET_FOLLOWERS, attemptSetFollowers);
    yield takeEvery(actions.ATTEMPT_DISABLE_GROUP, attemptDisableGroup);
    yield takeEvery(actions.CONTACTS_SYNC_SUCCESS, contactsSyncSuccess);
    yield takeEvery(actions.CHANNELS_SYNC_SUCCESS, channelsSyncSuccess);
    yield takeEvery(actions.CHECK_FOR_FAILED_SYNC, checkForFailedSync);
    yield takeEvery(actions.ATTEMPT_ADD_FOLLOWER, attemptAddFollower);
    yield takeEvery(actions.ATTEMPT_REVOKE_ADMIN, attemptRevokeAdmin);
    yield takeEvery(actions.TOGGLE_ONLINE_STATUS, toggleOnlineStatus);
    yield takeEvery(actions.SEND_TYPING_STOPPED, sendTypingStopped);
    yield takeEvery(actions.GROUPS_SYNC_SUCCESS, groupsSyncSuccess);
    yield takeEvery(actions.XMPP_DISCONNECTED, XMPPDisconnected);
    yield takeEvery(actions.ATTEMPT_ADD_ADMIN, attemptAddAdmin);
    yield takeEvery(actions.SYNC_FAILED, retryCheckSyncFailed);
    yield takeEvery(actions.SEND_XML_RECEIVED, sendXMLReceived);
    yield takeEvery(actions.SET_GROUPS_DATA, setGroupsData);
    yield takeEvery(actions.XMPP_CONNECTED, XMPPConnected);
    yield takeEvery(actions.SEND_TYPING, sendTyping);
    yield takeEvery(actions.UPDATE_APPLICATION_VERSION_PROPERTY, updateAppVersionPropertyHandler);

    yield takeEvery(actions.ACTIVATE_CALLER_THREAD, ACTIVATE_CALLER_THREAD_HANDLER);


    yield takeLatest(actions.ATTEMPT_SET_SHARED_MEDIA_MESSAGES, attemptSetSharedMediaMessages);
    yield takeLatest(actions.ATTEMPT_SHOW_MORE_GIF_MESSAGES, attemptShowMoreGifMessages);
    yield takeLatest(actions.ATTEMPT_SET_GIF_MESSAGES, attemptSetGifMessages);
    yield takeLatest(actions.ATTEMPT_SET_NEW_MESSAGES_COUNT, attemptSetNewMessagesCount);
    yield takeLatest(actions.ATTEMPT_SET_SELECTED_THREAD, attemptSetSelectedThread);
    yield takeLatest(actions.ATTEMPT_DOWNLOAD_UPDATE, attemptDownloadUpdate);
    yield takeLatest(actions.CHECK_MUTED_CONVERSATIONS, checkMutedConversations);
    yield takeLatest(actions.ATTEMPT_CHANGE_LEFT_PANEL, attemptChangeLeftPanel);
    yield takeLatest(actions.INITIALIZE_APPLICATION, initializeApplication);
    yield takeLatest(actions.ATTEMPT_ENABLE_GROUP, attemptEnableGroup);
    yield takeLatest(actions.FETCH_SELECTED_THREAD, FETCH_SELECTED_THREAD_HANDLER);
    yield takeLatest(actions.FETCH_THREAD, FETCH_THREAD_HANDLER);
    yield takeLatest(actions.NETWORK_STATUS_UPDATE, NETWORK_STATUS_UPDATE_HANDLER);
    yield takeLatest(actions.FOCUS_APPLICATION, FOCUS_APPLICATION_HANDLER);
    yield takeLatest(actions.INITIALIZE_SHARED_MEDIA, initializeSharedMediaHandler);
    yield takeLatest(actions.FETCH_SHARED_MEDIA, fetchSharedMediaHandler);
    yield takeLatest(actions.GET_WALLET_URL, getWalletUrl);
    yield takeLatest(actions.DELETE_SHARED_MEDIA_MESSAGES, DELETE_SHARED_MEDIA_MESSAGES_HANDLER);


    yield all([watchForInserts(), watchForTyping()])
}

export default applicationSaga;
