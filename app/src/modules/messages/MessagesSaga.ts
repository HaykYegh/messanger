"use strict";

import {
    addMessage,
    addMessageLoadStatus,
    attemptEditMessage as ATTEMPT_EDIT_MESSAGE,
    attemptReplyMessage as ATTEMPT_REPLY_MESSAGE,
    deleteMessage,
    editMessage,
    FETCH_MESSAGES_SUCCEED,
    getMessages,
    IMessagesActions,
    MESSAGE_CREATION_DONE,
    MESSAGES_SEEN_SEND,
    MESSAGES_SEEN_SEND_SUCCEED,
    removeMessage,
    removeSearchedMessages, replyMessage,
    sendMessage as SEND_MESSAGE,
    sendMessageSeen as SEND_MESSAGE_SEEN,
    setAmazonLink,
    setMessageDeliveredToReceiver,
    setMessageDeliveredToServer,
    setMessageDisplayedToReceiver,
    setMessageSeen,
    setSearchedMessages,
    setStoreMessages,
    showMoreSearchMessages,
    toggleResetStoreMessages,
    toggleShowMore,
    toggleShowMoreDown,
    transferSuccess, updateMessageLinkProps,
    updateMessageProperty,
    uploadFailure,
    uploadFile,
    uploadRequest as UPLOAD_REQUEST,
} from "modules/messages/MessagesActions";
import {Pending} from "modules/messages/Pending"
import { PendingMessageType} from "modules/messages/PendingMessageType"
import { PendingType } from "modules/messages/PendingType"
import {PendingDao} from "modules/messages/PendingDao"
import Log from "modules/messages/Log"
import {
    carbonEnablingXML,
    messageDeliveredReceivedXML,
    messageDisplayedReceivedXML,
    messageSeenXML,
    sendFileXML,
    sendGifXML,
    sendMediaXML,
    // sendMessageXML,
    getMessageXMLForSend,
    messageCallReceivedXML, sendMessageXML, callAcceptedXML, updateGroupAvatarXML
} from "xmpp/XMLBuilders";
import {GROUP_CONVERSATION_EXTENSION, SINGLE_CONVERSATION_EXTENSION, XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import {
    APP_CONFIG,
    AUDIO_MIME_TYPE, CALL_AUDIO_PARAMS, CALL_DEVICE_PARAMS, CALL_VERSION, CALL_VIDEO_PARAMS, CONVERSATION_TYPE,
    DEFAULT_TIME_FORMAT,
    LEFT_PANELS,
    LOAD_STATUS,
    LOG_TYPES, MEDIA_TYPES,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    MESSAGES_LIMIT,
    OFFLINE_MESSAGE_BODY,
    SEARCH_MESSAGES_LIMIT,
    SHARED_MEDIA_TYPES,
    SHARED_MESSAGE_TYPES,
    SHOW_MORE_LIMIT,
    SUPPORTED_IMAGE_FORMATS,
    VIDEO_EXT_LIST,
} from "configs/constants";
import {addRequest, REQUESTS_SEND} from "modules/requests/RequestsActions";
import {getLocationName} from "requests/locationRequest";
import {actionChannel, all, call, delay, fork, put, select, take, takeEvery, takeLatest} from "redux-saga/effects";
import connectionCreator from "xmpp/connectionCreator";
import storeCreator from "helpers/StoreHelper";
import {
    base64ToFile,
    getPublicUrl,
    getThumbnail,
    createThumbnail,
    makeWindowsThumb,
    getBlobUri,
    makeMacThumb,
    getVideoFile
} from "helpers/FileHelper";
import {actions} from "./MessagesReducer";
import {messageLocalDelete as messageLocalDeleteAction} from "./MessagesActions";
import conf from "configs/configurations";
import {Store} from "react-redux";
import selector from "services/selector";
import IDBMessage, {IMessage} from "services/database/class/Message";
import IDBConversation from "services/database/class/Conversation";
import {
    attemptCreateConversation,
    attemptUpdateConversationAvatar,
    attemptUpdateConversationName,
    CONVERSATION_UNREAD_MESSAGES_UPDATE,
    conversationLastMessageChange,
    conversationLastMessageStatusUpdate,
    removeConversation,
    updateConversationLastMessage
} from "modules/conversations/ConversationsActions";
import {getConversationMessages} from "requests/conversationRequest";
import {fetchFile, getAWSFile, getSignedUrl} from "requests/fsRequest";
import {getGroupMessages} from "helpers/GroupHelpers";
import {
    getBase64FromThumb,
    getConversationType,
    getNotificationText,
    getPartialId,
    getPid,
    getThread,
    getThreadType,
    getUserId,
    getUsername,
    isPublicRoom,
    isThreadIdPrivateChat,
    isThumbnail,
    isVideo,
    isVideoOrImage,
    isVideoStreamOrImage,
    writeLog,
    writeThumbnail
} from "helpers/DataHelper";
import {IRequest} from "modules/requests/RequestsReducer";
import {buffers, END, eventChannel} from "redux-saga";
import {
    ADD_MEDIA_RECORD, addSharedMediaImage,
    addSharedMediaMessages,
    applicationStopTyping, attemptCreateStatus, attemptResetStatuses,
    attemptSetSelectedThread,
    changeLeftPanel, createCache,
    DELETE_SHARED_MEDIA_MESSAGES_SUCCESS,
    deleteSharedMediaMessages,
    FETCH_THREAD,
    setShowSharedMedia,
    UPDATE_MEDIA_RECORD
} from "modules/application/ApplicationActions";
import {escapeText, getMessageText} from "helpers/MessageHelper";
import * as Raven from 'raven-js';
import format from "date-fns/format";
import {attemptAddRecentSticker} from "modules/settings/SettingsActions";
import * as mime from "mime-types";
import {
    getURIOrigin,
    getWebContentDescription,
    getWebContentImageUrl,
    getWebContentTitle,
    isURI, normalizeURI
} from "helpers/DomHelper";
import {fromJS, List} from "immutable";
import MessagesModel from "modules/messages/MessagesModel";
import {logger} from "helpers/AppHelper";
import {
    conversationLastMessageIdSelector,
    conversationUnreadMessageSelector,
    unreadMessagesCountSelector,
    conversationsSelector
} from "modules/conversations/ConversationsSelector";
import {messageSelector, newMessagesSelector} from "modules/messages/MessagesSelector";
import {userNameSelector, userSelector} from "modules/user/UserSelector";
import {
    mediaSelector,
    minimizedSelector,
    selectedThreadIdSelector,
    selectedThreadSelector,
    sharedMediaSelector,
    showChatSelector
} from "modules/application/ApplicationSelector";
import {privacySelector} from "modules/settings/SettingsSelector";
import {getLastCallSelector} from "modules/call/CallSelector";
import {contactSelector, getContactsListSelector} from "modules/contacts/ContactsSelector";
import {DatabaseContacts} from "services/database/class/Contact";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import {actions as CONTACT_ACTIONS} from "modules/contacts/ContactsReducer";
import {actions as CONVERSATION_ACTIONS} from "modules/conversations/ConversationsReducer";
import {actions as MESSAGE_ACTIONS} from "modules/messages/MessagesReducer";
import {PendingQueue} from "modules/messages/PendingQueue";
import {int} from "aws-sdk/clients/datapipeline";
import {MessagingService} from "modules/messages/MessagingService";
import {RegistrationService} from "modules/messages/RegistrationService";
import {getLinkPreview} from "requests/getLinkPreview";
import {startingConference} from "modules/conference/ConferenceActions";
const os = require("os");
const fs  = require("fs");
const DOWNLOAD_FOLDER_NAME =  require("config").zz.DOWNLOAD_FOLDER_NAME;

function* attemptSetAmazonLink({payload: {id, fileRemotePath, isGroup}}: any): any {
    const fileLink: string = yield call(getPublicUrl, fileRemotePath, isGroup ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer);
    yield put(setAmazonLink(id, fileRemotePath, fileLink));
}

function* messageDeliveredToReceiver({payload: jsonMessage}: any): any {
    MessagingService.sharedInstance.xmlDelivery(null, jsonMessage)
}

function* messageDeliveredToReceiverService({payload: jsonMessage}: any): any {
    const {id, msgId, time, threadId, roomId} = jsonMessage
    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});

    yield put(setMessageDeliveredToReceiver({msgId, time}));
    const prefix: string = APP_CONFIG.PREFIX;

    // update last message status
    if (!roomId) {
        let threadId_ = threadId.startsWith(prefix) ? threadId.slice(2) : threadId;
        const lastMessageId: string = yield select(conversationLastMessageIdSelector(threadId_));
        if (!lastMessageId) {
            yield put(attemptCreateStatus({...jsonMessage, status: "delivered"}))
        }
        if (msgId && (lastMessageId === msgId || !lastMessageId)) {
            yield put(conversationLastMessageStatusUpdate(threadId_, {key: "delivered", value: true}));
        }
    } else if (roomId && threadId) {
        let roomId_ = `${roomId}@conference.msg.hawkstream.com/${user.get('username')}`
        const lastMessageId: string = yield select(conversationLastMessageIdSelector(roomId_));
        if (!lastMessageId) {
            yield put(attemptCreateStatus({...jsonMessage, status: "delivered"}))
        }
        if (msgId && (lastMessageId === msgId || !lastMessageId)) {
            yield put(conversationLastMessageStatusUpdate(roomId_, {key: "delivered", value: true}));
        }
    }


    // const connection: any = connectionCreator.getConnection();
    // const msg: Strophe.Builder = messageDeliveredReceivedXML({id});

    yield all([
        call(IDBMessage.update, msgId, {delivered: true})
    ]);

    // if (connection.connected) {
    //     connection.send(msg);
    // }
}

function* messageCallToReceiver({payload: {id, time, threadId, roomId}}: any): any {
    yield put(setMessageDeliveredToReceiver({msgId: id, time}));

    // update last message status
    if (!roomId) {
        threadId = threadId.startsWith("zz") ? threadId.slice(2) : threadId;
        const lastMessageId: string = yield select(conversationLastMessageIdSelector(threadId));
        if (lastMessageId === id) {
            yield put(conversationLastMessageStatusUpdate(threadId, {key: "delivered", value: true}));
        }
    }


    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = messageCallReceivedXML({id});

    yield all([
        call(IDBMessage.update, id, {delivered: true})
    ]);

    if (connection.connected) {
        connection.send(msg);
    }
}

function* sendMessageSeen({payload: {id, to, isGroup, messageCreator}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {messages, user} = selector(store.getState(), {messages: true, user: true});

    let creator: string = messageCreator || messages.get(id) && messages.get(id).get("creator").split("@").shift();

    if (!creator && user.get("username") === creator) {
        return;
    }

    if (!creator) {
        const message = yield call(IDBMessage.getMessageById, id);
        if (!message) {
            return
        }
        creator = message.creator.split("@").shift();
    }



    const roomId: string = isGroup ? to : "";
    to = conf.app.prefix + getUserId(creator);
    const msgId: string = `displayed${id}`;

    let pending = createPendingForStatus(PendingMessageType.seen, to, id, roomId, 0)
    PendingQueue.instance.addMessageToQueue(pending)
    Log.i(pending, "sendMessageSeen222")

    yield put(setMessageSeen(id));
}

function createPendingForStatus(status: any, to: String, msgId: string, groupId: string, isE2ESupport: int) {
    let time = Date.now()

    let map: any = {}
    map["to"] = to
    map["msgId"] = msgId

    if (status == PendingMessageType.delivery) {
        map["status"] = "delivered"
    } else{
        map["status"] = "seen"
    }

    map["roomName"] = groupId

    map["from"] = userNumber()
    map["isE2ESupport"] = isE2ESupport

    return new Pending(map, time, msgId,  true, status)
}

function userNumber(){
    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});
    return user.get("username")
}

function* messageDisplayedToReceiver({payload: jsonMessage}: any): any {
    MessagingService.sharedInstance.xmlSeen(null, jsonMessage)
}

function* messageDisplayedToReceiverService({payload: {msgId, time, threadId, roomId}}: any): any {
    yield put(setMessageDisplayedToReceiver({msgId, time}));
    const store: Store<any> = storeCreator.getStore();
    const {user, conversations} = selector(store.getState(), {user: true, conversations: true});

    // update last message status
    if (!roomId) {
        threadId = threadId.startsWith("zz") ? threadId.slice(2) : threadId;
        const lastMessageId: string = yield select(conversationLastMessageIdSelector(threadId));
        if (!lastMessageId) {
            yield put(attemptCreateStatus({msgId, time, threadId, roomId, status: "seen"}))
        }
        if (lastMessageId === msgId) {
            yield put(conversationLastMessageStatusUpdate(threadId, {key: "seen", value: true}));
        }
    } else if (roomId && threadId) {
        let roomId_ = `${roomId}@conference.msg.hawkstream.com/${user.get('username')}`
        const lastMessageId: string = yield select(conversationLastMessageIdSelector(roomId_));

        if (!lastMessageId) {
            yield put(attemptCreateStatus({msgId, time, threadId, roomId, status: "seen"}))
        }
        if (msgId && (lastMessageId === msgId || !lastMessageId)) {
            yield put(conversationLastMessageStatusUpdate(roomId_, {key: "delivered", value: true}));
        }
    }


    // const connection: any = connectionCreator.getConnection();
    // const msg: Strophe.Builder = messageDisplayedReceivedXML({id: msgId});

    yield all([
        fork(IDBMessage.update, msgId, {seen: true})
    ]);

    // if (connection.connected) {
    //     writeLog(LOG_TYPES.send_status, {
    //         msgId,
    //         status: "ack"
    //     });
    //     connection.send(msg);
    // }
}

function* sendCarbonEnabling({payload: {from}}) {
    const connection: any = connectionCreator.getConnection();
    const iq: Strophe.Builder = carbonEnablingXML({from});
    let xmlBuilder: string;
    // xmlBuilder = "sendCarbonEnablingXML";
    if (connection.connected && iq) {
        connection.send(iq);
    }
}

function* sendMessage({payload: {message, messageToSave, isUpload, resetStoreMessages}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const effects: Array<any> = [];
    let msg: Strophe.Builder;
    let xmlBuilder: string;
    let time = Date.now()

    const {to, id, rel, msgText, fileSize, awsId, author, msgInfo, msgType, type, imghash, sid, pid, ext, repid = "", email = ""} = message;
    const {threadId, info} = messageToSave;

    messageToSave.text = messageToSave.text && messageToSave.text.toString().replace(/&amp;/, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    let obj = {}
    if (isVideoOrImage(msgType) || msgType === MESSAGE_TYPES.stream_file) {
        let _msgInfo: string = isThumbnail(info) ? msgInfo : info;
        _msgInfo = isThumbnail(_msgInfo) ? getBase64FromThumb(_msgInfo) : _msgInfo;

        xmlBuilder = "sendMediaXML";
        if ((ext && (ext === "gif")) || messageToSave.ext === "webm") {



            obj = {
                fileRemotePath: awsId,
                msgInfo: _msgInfo,
                fileSize,
                msgText,
                msgType,
                repid,
                author,
                email,
                type,
                rel,
                to,
                id,
                ext: ext || messageToSave.ext,
                imageVideoResolution: messageToSave.m_options && `${messageToSave.m_options.width}x${messageToSave.m_options.height}`
            }
            msg = getMessageXMLForSend({
                fileRemotePath: awsId,
                msgInfo: _msgInfo,
                fileSize,
                msgText,
                msgType,
                repid,
                author,
                email,
                type,
                rel,
                to,
                id,
                ext: ext || messageToSave.ext,
                imageVideoResolution: messageToSave.m_options && `${messageToSave.m_options.width}x${messageToSave.m_options.height}`
            });
        } else {
            obj = {
                fileRemotePath: awsId,
                msgInfo: _msgInfo,
                fileSize,
                msgText,
                msgType: msgType === MESSAGE_TYPES.stream_file ? MESSAGE_TYPES.video : msgType,
                repid,
                author,
                email,
                type,
                rel,
                sid,
                pid,
                to,
                id,
                imageVideoResolution: messageToSave.m_options && `${messageToSave.m_options.width}x${messageToSave.m_options.height}`
            }
            msg = getMessageXMLForSend({
                fileRemotePath: awsId,
                msgInfo: _msgInfo,
                fileSize,
                msgText,
                msgType: msgType === MESSAGE_TYPES.stream_file ? MESSAGE_TYPES.video : msgType,
                repid,
                author,
                email,
                type,
                rel,
                sid,
                pid,
                to,
                id,
                imageVideoResolution: messageToSave.m_options && `${messageToSave.m_options.width}x${messageToSave.m_options.height}`
            });
        }
    } else if (awsId) {
        obj = message
        msg = getMessageXMLForSend(message);
        xmlBuilder = "sendFileXML";

    } else {
        obj = message
        msg = getMessageXMLForSend(message);
        xmlBuilder = "sendMessageXML";
    }

    let pending = new Pending(obj, time, id, true, PendingMessageType.message, PendingType.none)
    PendingQueue.instance.addMessageToQueue(pending)


    const request: IRequest = {
        params: message,
        xmlBuilder,
        id,
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    if (connection.connected && msg && navigator.onLine) {
        writeLog(LOG_TYPES.message, {
            ...message,
            msgType: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(message.msgType) ? "" : message.msgInfo
        });
        // connection.send(msg);

    } else {
        writeLog(LOG_TYPES.message, {
            ...message, reason: {
                isConnected: connection.connected,
                isOnline: navigator.onLine
            }
        });
    }

    // effects.push(put(addRequest(request)));

    // sendMessage

    // message.linkTags = undefined;
    // messageToSave.linkTags = undefined;
    // messageToSave.link = undefined;

    if (!isUpload) {
        if (resetStoreMessages) {
            yield put(addMessage(messageToSave, message));
        }
        effects.push(put(attemptCreateConversation(messageToSave)));
    }

    yield all(effects);

    if (msgType === MESSAGE_TYPES.update_group_avatar) {
        const blob: Blob = yield call(getAWSFile, conf.app.aws.bucket.group, "GET", `${threadId.split("@").shift()}/profile/avatar`);
        yield put(attemptUpdateConversationAvatar(threadId, blob));
        const msg2 = updateGroupAvatarXML({
            to,
            id,
            msgText,
            type,
            msgType,
            msgInfo
        });

        if (connection.connected && msg2 && navigator.onLine) {
            connection.send(msg2);
        }
    } else if (msgType === MESSAGE_TYPES.update_group_name) {
        yield put(attemptUpdateConversationName(threadId, info));
    }
}

function* attemptAddMessage({payload: {message, isGroup}}: any): any {

    if (message.type === MESSAGE_TYPES.location) {
        try {
            message.location = yield call(getLocationName, message.info.split("*").shift(), message.info.split("*").pop());
        } catch (e) {
            console.dir(e);
        }
    } else {
        message.fileLink = yield call(getPublicUrl, message.fileRemotePath, isGroup ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer);
    }
    /*
        yield put(isGroup ? setGroupLastMessage(message.threadId, message.id) : setConversationLastMessage(message.threadId, message.id));
    */
}

function* attemptDeleteMessage({payload: {id, message, isIncomingMessage}}: any): any {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {user, app, sharedMediaMessages} = selector(store.getState(),
            {
                user: true,
                application: {
                    app: true
                },
                sharedMediaMessages: true
            });
        const storeMessage: any = yield select(messageSelector(id));
        let messageType:string;
        if (storeMessage) {
            messageType = storeMessage.get("type");
        }
        const time = Date.now();
        const username = user.get("username");
        const {sid, pid} = message;
        let threadId = message.threadId;

        if (!threadId && message.type === XML_MESSAGE_TYPES.group) {
            threadId = message.from ? `${message.from.split("/").shift()}/${username}` : `${message.to.split("/").shift()}/${username}`;

        } else if (!threadId) {
            threadId = isIncomingMessage ? getUserId(getUsername(message.from)) : getUserId(getUsername(message.to));
            threadId = sid === "1" && pid ? `${threadId}/${sid}/${pid}` : threadId;
        }

        if (!isIncomingMessage) {
            if (message) {
                // const connection: any = connectionCreator.getConnection();
                // const msg: Strophe.Builder = getMessageXMLForSend(message);
                const xmlBuilder: string = "sendMessageXML";

                const request: any = {
                    params: message,
                    id: message.id,
                    xmlBuilder,
                    createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
                };
                yield put(addRequest(request));
                // if (connection.connected) {
                //     connection.send(msg);
                // }
                let pending = new Pending(message, message, message.id, true, PendingMessageType.message, PendingType.none)
                PendingQueue.instance.addMessageToQueue(pending)
            }
        }

        yield all([
            put(deleteMessage(id)),
            call(IDBMessage.update, id, {deleted: true})
        ]);

        const lastMessageId: string = yield select(conversationLastMessageIdSelector(threadId));

        if (lastMessageId === id) {
            const lastMessage: any = yield MessagesModel.getLastMessage(threadId);

            yield call(IDBConversation.updateConversation, threadId, lastMessage ? {lastMessageId: lastMessage.messageId} : {
                lastMessageId: "",
                time: 0
            });

            yield put(conversationLastMessageChange(lastMessage || {}, threadId));
        }

        if (threadId.includes("pid") && sid !== "1" && !pid) {
            yield put(messageLocalDeleteAction(id, threadId, false));
        }

        if (SHARED_MESSAGE_TYPES.includes(messageType) || messageType === MESSAGE_TYPES.text && storeMessage.get("link")) {
            const checkedFilesCount = {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            };
            if (MEDIA_TYPES.media.includes(messageType)) {
                checkedFilesCount.media = checkedFilesCount.media + 1;
            } else if (MEDIA_TYPES.file.includes(messageType)) {
                checkedFilesCount.file = checkedFilesCount.file + 1;
            } else if (messageType === MESSAGE_TYPES.text && message.get("link")) {
                checkedFilesCount.link = checkedFilesCount.link + 1;
            }
            yield put(DELETE_SHARED_MEDIA_MESSAGES_SUCCESS([id], checkedFilesCount));
        }

        if (app.showSharedMedia) {
            const sharedMediaMessage = yield call(IDBMessage.findAll, threadId, 0, 1, [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);
            if (!sharedMediaMessage.length) {
                yield put(setShowSharedMedia(false));
            }
        }
    } catch (e) {
        Log.i(e)
    }
}

function* attemptEditMessage({payload: {message, isIncomingMessage}}: any): any {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {user, messages, app} = selector(store.getState(), {user: true, messages: true});
        const time = Date.now();
        let storeMessage = messages.get(message.rel) && messages.get(message.rel).toJS();
        const username = user.get("username");
        let threadId = message.threadId;
        const {sid, pid} = message;

        if (!threadId && message.type === XML_MESSAGE_TYPES.group) {
            threadId = message.from ? `${message.from.split("/").shift()}/${username}` : `${message.to.split("/").shift()}/${username}`;

        } else if (!threadId) {
            threadId = isIncomingMessage ? getUserId(getUsername(message.from)) : getUserId(getUsername(message.to));
            threadId = sid === "1" && pid ? `${threadId}/${sid}/${pid}` : threadId;
        }

        let text = message.msgText || message.body || message.text;

        if (text) {
            text = escapeText(text);
            if (storeMessage && storeMessage.type === MESSAGE_TYPES.stream_file && text) {
                text = storeMessage.text.replace(/text="(.*?)"[ ]?\/([&]gt;|>)/g, `text="${text}" />`).replace("&lt;old&gt;", "<old>").replace("&lt;/old&gt;&lt;", "</old><");
            }
            message.msgText = text;
        }

        if (!isIncomingMessage) {
            const connection: any = connectionCreator.getConnection();
            const msg: Strophe.Builder = getMessageXMLForSend(message);
            const xmlBuilder: string = "sendMessageXML";
            //msg["nodeTree"].children[0].innerHTML = text;
            const request: any = {
                params: message,
                id: message.id,
                xmlBuilder,
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            yield put(addRequest(request));

            // if (connection.connected) {
            //     Log.i("attemptEditMessage -> 3.1", message)
            //     connection.send(msg);
            //
            // }
            let pending = new Pending(message, message, message.id, true, PendingMessageType.message, PendingType.none)
            PendingQueue.instance.addMessageToQueue(pending)
        }

        message.linkTags = undefined;
        const link = message.link || undefined;
        const linkTitle = undefined;
        const linkDescription = undefined;
        const linkSiteURL = undefined;
        const linkImagePreviewUrl = undefined;

        yield all([
            put(updateMessageProperty(message.rel, "linkTags", message.linkTags)),
            put(editMessage(message.rel, text)),
            put(updateConversationLastMessage(threadId, message.rel, {text, edited: true})),
            put(updateMessageLinkProps(storeMessage.messageId, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl)),
            call(IDBMessage.update, message.rel, {text, edited: true, link, linkTags: message.linkTags, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl}),
        ]);


        if (storeMessage) {
            const isLink: boolean = isURI(text);

            if (!message.link && isLink) {
                storeMessage.text = text;
                storeMessage.link = isLink;

                yield all([
                    put(updateMessageProperty(message.rel, "link", isLink)),
                ]);

                if (!app.showSharedMedia) {
                    yield put(setShowSharedMedia(true));
                }

            } else if (storeMessage.link && !isLink) {
                storeMessage.text = text;
                storeMessage.link = isLink;

                yield all([
                    put(updateMessageProperty(message.rel, "link", isLink)),
                    put(deleteSharedMediaMessages(message.rel))
                ]);

                if (app.showSharedMedia) {
                    const sharedMediaMessage = yield call(IDBMessage.findAll, threadId, 0, 1, [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);
                    if (!sharedMediaMessage.length) {
                        yield put(setShowSharedMedia(false));
                    }
                }
            } else {
                Log.i(isLink);
            }

            if (storeMessage.type === MESSAGE_TYPES.text && storeMessage.link) {
                const {url, normalizedURI} = normalizeURI(storeMessage.text);
                const link = storeMessage.link
                const webContent: any = yield call(getLinkPreview, normalizedURI);
                const linkTitle: string = getWebContentTitle(webContent);
                const linkDescription: string = getWebContentDescription(webContent);
                const linkSiteURL: string = getURIOrigin(url);
                const linkImagePreviewUrl: string = getWebContentImageUrl(webContent, normalizedURI);

                yield all([
                    put(updateMessageLinkProps(storeMessage.messageId, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl)),
                    call(IDBMessage.update, storeMessage.messageId, {link, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl}),
                ]);
            }
        }

    } catch (e) {
        Log.i(e);
    }
}

function* attemptReplyMessage({payload: {message}}: any): any {
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
    // if (connection.connected) {
    //     connection.send(msg);
    // }
    yield put(replyMessage(message.id, message.msgText, message.repid));

}

function* addMessageDB({payload: {message, messageXml}}) {
    // const store: Store<any> = storeCreator.getStore();
    // const {conversations, messages} = selector(store.getState(), {conversations: true, messages: true});
    // const messageOutgoing = !!messageXml;
    //
    // const conversation = {
    //     conversationId: message.threadId,
    //     threadId: message.threadId,
    //     lastMessageId: message.id,
    //     newMessagesIds: [],
    //     typing: false
    // };
    //
    // //yield IDBMessage.createMessage(message);
    //
    // if (conversations.has(message.threadId)) {
    //     yield IDBConversation.updateConversation(conversation);
    //     yield put(setConversationLastMessage(message.threadId, message));
    // } else {
    //     if (!messageOutgoing) {
    //         yield take(ContactActions.CONTACT_ADDED_TO_DB);
    //     }
    //
    //     yield IDBConversation.createConversation(conversation);
    //     const fullConversation = yield IDBConversation.getThread(message.threadId);
    //     yield put(addConversation(fullConversation));
    //
    // }
    //
    // if (messageOutgoing) {
    //     const connection: any = connectionCreator.getConnection();
    //     let msg: Strophe.Builder;
    //     let xmlBuilder: string;
    //     if ([MESSAGE_TYPES.thumb_image, MESSAGE_TYPES.image, MESSAGE_TYPES.thumb_video, MESSAGE_TYPES.video].includes(messageXml.msgType)) {
    //         if (![MESSAGE_TYPES.thumb_image, MESSAGE_TYPES.thumb_video].includes(messageXml.msgType) /*|| params.AppName !== PINNGLE_APP_NAME*/) {
    //
    //             msg = getMessageXMLForSend({
    //                 to: messageXml.to,
    //                 id: messageXml.id,
    //                 rel: messageXml.rel,
    //                 msgText: messageXml.msgText,
    //                 fileSize: messageXml.fileSize,
    //                 fileRemotePath: messageXml.awsId,
    //                 author: messageXml.author,
    //                 msgInfo: messageXml.msgInfo,
    //                 msgType: messageXml.msgType,
    //                 type: messageXml.type
    //             });
    //             xmlBuilder = "sendMediaXML";
    //         }
    //     } else if (messageXml.awsId) {
    //         msg = getMessageXMLForSend(messageXml);
    //         xmlBuilder = "sendFileXML";
    //     } else {
    //         msg = getMessageXMLForSend(messageXml);
    //         xmlBuilder = "sendMessageXML";
    //     }
    //
    //     if (![MESSAGE_TYPES.thumb_image, MESSAGE_TYPES.thumb_video].includes(messageXml.msgType) /*|| params.AppName !== PINNGLE_APP_NAME*/) {
    //         const request: any = {
    //             xmlBuilder,
    //             id: messageXml.id,
    //             params: messageXml
    //         };
    //         yield put(addRequest(request));
    //     }
    //
    //     if (connection.connected && msg) {
    //         connection.send(msg);
    //         if (messageXml.msgType === MESSAGE_TYPES.update_group_avatar && messageXml.to.includes("pid")) {
    //             const msg: Strophe.Builder = channelImghashXML(messageXml.to, messageXml.imghash);
    //             connection.send(msg);
    //         }
    //     }
    // } else {
    //     yield put(addConversationNewMessageId(message.threadId, message.id));
    // }

    try {
        const msgType: string = message.type;

        if ([MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
            let sharedMediaType: string = "";
            if (msgType === MESSAGE_TYPES.file || msgType === MESSAGE_TYPES.voice) {
                sharedMediaType = SHARED_MEDIA_TYPES.FILE;
            } else {
                sharedMediaType = SHARED_MEDIA_TYPES.MEDIA
            }
            const sharedMediaRecordsMap = {
                messageStatus: null,
                messages: message
            };

            yield put(ADD_MEDIA_RECORD(sharedMediaType, sharedMediaRecordsMap))
        }
    } catch (e) {
        logger(e)
    }
}

function* messageDeliveredToServer({payload: {id, shouldWaitForConversation}}) {
    let message = yield IDBMessage.getMessageById(id);

    if (shouldWaitForConversation && !message) {
        yield take(action => {
            return action.type === MESSAGE_ACTIONS.MESSAGE_CREATION_DONE &&
                action.payload.id === id;
        });

        message = yield IDBMessage.getMessageById(id);
    }

    if (message) {
        const {threadId} = message;

        const lastMessageId: string = yield select(conversationLastMessageIdSelector(threadId));

        if (lastMessageId === id) {
            yield put(conversationLastMessageStatusUpdate(threadId, {key: "status", value: true}));
        }

    }

    yield all([
        put(setMessageDeliveredToServer(id)),
        fork(IDBMessage.update, id, {status: true})
    ]);
}

function* attemptGetMessages({payload: {thread, msgId}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {sharedMediaPanel, user} = selector(store.getState(), {
        sharedMediaPanel: true,
        user: true
    });

    const {threads: {threadType, threadId}, conversations: {conversationId}} = thread.toJS();
    const {isGroup} = getThreadType(threadType);

    let loadedMessages: any;
    try {
        Log.i("showMore -> loadedMessages = 1", loadedMessages)
        if (isGroup) {
            const groupId: string = conversationId.split('@')[0];
            loadedMessages = yield call(getGroupMessages, groupId, SHOW_MORE_LIMIT, msgId);
            Log.i("showMore -> loadedMessages = 2", loadedMessages)
        } else {
            loadedMessages = yield call(getConversationMessages, conversationId || threadId, SHOW_MORE_LIMIT, msgId);
            Log.i("showMore -> loadedMessages = 3", loadedMessages)
        }

        if (loadedMessages.messages && Object.keys(loadedMessages.messages).length > 1 && sharedMediaPanel) {
            Log.i("showMore -> loadedMessages = 4", loadedMessages)
            const effects: Array<any> = [];
            for (let item in loadedMessages.messages) {
                if (loadedMessages.messages[item].link) {
                    effects.push(put(addSharedMediaMessages(loadedMessages.messages[item].messageId, loadedMessages.messages[item])));
                }
            }
            if (effects.length > 0) {
                yield all(effects);
            }
        }
        if (loadedMessages && loadedMessages.messages && Object.keys(loadedMessages.messages).length > 0) {
            Log.i("showMore -> loadedMessages = 5", loadedMessages)
            yield put(getMessages(loadedMessages.messages));
        }
        if (loadedMessages && loadedMessages.stopLoader) {
            Log.i("showMore -> loadedMessages = 6", loadedMessages)
            yield put(toggleShowMore(false));
        }
    } catch (e) {
        Log.i("#showMore messages", e);
    }

}

function* attemptGetScrollDownMessages({payload: {thread, msgId, message}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {sharedMediaPanel, user} = selector(store.getState(), {
        sharedMediaPanel: true,
        user: true
    });
    yield put(toggleShowMoreDown(true));

    const {threads: {threadType, threadId}, conversations: {conversationId}} = thread.toJS();
    const {isGroup} = getThreadType(threadType);
    let loadedMessages: any;
    try {
        if (isGroup) {
            const groupId: string = conversationId.split('@')[0];
            loadedMessages = yield call(getGroupMessages, groupId, MESSAGES_CHAT_LIMIT, msgId, message.toJS(), true);
        } else {
            loadedMessages = yield call(getConversationMessages, conversationId || threadId, MESSAGES_CHAT_LIMIT, msgId, message.toJS(), true);
        }

        if (loadedMessages.messages && Object.keys(loadedMessages.messages).length > 1 && sharedMediaPanel) {
            const effects: Array<any> = [];
            for (let item in loadedMessages.messages) {
                if (loadedMessages.messages[item].link) {
                    yield put(addSharedMediaMessages(loadedMessages.messages[item].messageId, loadedMessages.messages[item]));
                }
            }
            if (effects.length > 0) {
                yield all(effects);
            }
        }
        if (loadedMessages && loadedMessages.messages && Object.keys(loadedMessages.messages).length > 0) {
            yield put(getMessages(loadedMessages.messages));
            if (Object.keys(loadedMessages.messages).length < 50) {
                yield put(toggleResetStoreMessages(false));
            }
        }
    } catch (e) {
        Log.i("Scroll Down show more messages", e);
    } finally {
        yield put(toggleShowMoreDown(false));
    }
}

function* uploadRequest({payload: {messages, file, resetStoreMessages, shouldSetNewThread, isForwardMessage}}) {
    const {message, messageToSave, filePath} = messages;
    const msgId = messageToSave.id || messageToSave.messageId;
    if (messageToSave.type === MESSAGE_TYPES.video) {
        messageToSave.loadStatus = LOAD_STATUS.LOAD_START;
    }

    messageToSave.text = messageToSave.text && messageToSave.text.toString().replace(/&amp;/, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    if (filePath) {
        Log.i("uploadRequest -> 2", messages)
        Log.i("uploadRequest -> file", file)
        yield call(MessagesModel.setDB, file, messageToSave.fileRemotePath, filePath);
    } else {
        Log.i("uploadRequest -> 3", messages)
        if (((window as any).fs && (file.path || file.type === "audio/mpeg" || file.type === "image/png"|| file.type === "video/webm")) || !(window as any).fs) {
            //Recorded Videos mustn't be added here they must be optimised

            Log.i("uploadRequest -> 3.1", file)
            yield call(MessagesModel.set, file, messageToSave.fileRemotePath, messageToSave)
        }
    }
    // if (isForwardMessage || messageToSave.type === MESSAGE_TYPES.stream_file) {
    if (isForwardMessage) {
        Log.i("uploadRequest -> 4", messages)
        yield all([
            put(attemptCreateConversation(messageToSave)),
            call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.LOAD_START}),
            put(uploadFile({message, messageToSave}, file)),
        ]);
    } else {
        Log.i("uploadRequest -> 5", messages)
        if (messageToSave.type !== MESSAGE_TYPES.stream_file) {
            Log.i("uploadRequest -> 6", messages)
            yield all([
                put(attemptCreateConversation(messageToSave)),
                call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.LOAD_START}),
                put(uploadFile({message, messageToSave}, file)),
            ]);
        } else {
            Log.i("uploadRequest -> 7", messages)
            yield all([
                put(attemptCreateConversation(messageToSave)),
                call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.LOAD_START}),
                // put(uploadFile({message, messageToSave}, file)),
            ]);
        }

    }


    if (shouldSetNewThread) {
        Log.i("uploadRequest -> 8", messages)
        const conversation = yield call(IDBConversation.getFullConversationById, messageToSave.threadId);

        if (!conversation) {
            Log.i("uploadRequest -> 9", messages)
            yield take(action => action.type === CONVERSATION_ACTIONS.ADD_CONVERSATION &&
                action.payload.conversation.conversations.conversationId === messageToSave.threadId);
        }
        yield put(attemptSetSelectedThread({
            threads: {
                threadId: messageToSave.threadId,
                threadType: getConversationType(messageToSave.threadId)
            }
        }));
    }

    if (isForwardMessage) {
        Log.i("uploadRequest -> 10", messages)
        yield put(addMessage({...messageToSave, file}, message));
    } else if (resetStoreMessages) {
        Log.i("uploadRequest -> 11", messages)
        yield put(addMessage({...messageToSave, file}, message));
    }

    if (!(window as any).fs) {
        Log.i("uploadRequest -> 12", messages)
        yield put(uploadFile({message, messageToSave}, file));
    }
}

async function getSignedLink(messageToSave) {
    return new Promise(resolve => {
        const bucket: any = isPublicRoom(messageToSave.threadId) ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer;
        (window as any).ipcRenderer.send('getSignedUrl', bucket, messageToSave.fileRemotePath);
        (window as any).ipcRenderer.once('getSignedUrlResponse', (event, result) => {
            resolve(result);
        })
    });
}

export function* _uploadFile({message, messageToSave}, file) {
    try {
        Log.i("_uploadFile -> 1", messageToSave)
        const msgId = messageToSave.id || messageToSave.messageId;
        const bucket: any = isPublicRoom(messageToSave.threadId) ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer;
        let links = null;
        // if(messageToSave.type === MESSAGE_TYPES.stream_file) {
        // this will be uncommented when stream file will be implemented in client
        //     links = yield getSignedLink(messageToSave);//(window as any).ipcRenderer.send('getSignedUrl', bucket, messageToSave.fileRemotePath);
        //     let messageText = message.msgText;
        //     if(message.msgText !== OFFLINE_MESSAGE_BODY){
        //         if(messageText.match(/text="(.*?)"[ ]?\//)){
        //             messageText = messageText.match(/text="(.*?)"[ ]?\//)[1];
        //         }
        //     }else {
        //         messageText = "null";
        //     }
        //     message.msgText = "<old>This content is not supported in your version. Please update Zangi to view the content.</old><link href=\"" + links.get + "\" text=\"" + messageText + "\" />";
        //     //`<old>This content is not supported in your version. Please update Pinngle to view the content.</old><link href="${links.get}" text="${message.msgText}" />`;
        //     yield all([
        //         put(updateMessageProperty(msgId, "text", message.msgText)),
        //         call(IDBMessage.update, msgId, {text:  message.msgText})
        //     ])
        // }

        if (RegistrationService.instance.isConnected) {
            if (messageToSave.type === MESSAGE_TYPES.stream_file) {
                Log.i("_uploadFile -> 2", message)
                message = {...message, fileSize: file.size};
                messageToSave = {...messageToSave, fileSize: file.size};
            }
            const url = links ? links.set : yield call(getSignedUrl, bucket, "PUT", messageToSave.fileRemotePath);
            if (url){
                Log.i("_uploadFile -> 3", message)
                const channel = yield call(createUploadFileChannel, url, file, messageToSave.type === MESSAGE_TYPES.stream_file || messageToSave.type === MESSAGE_TYPES.video);

                document.addEventListener("CANCEL_UPLOAD_" + msgId, async function _cancelUpload() {
                    channel.close();
                    document.removeEventListener("CANCEL_UPLOAD_" + msgId, _cancelUpload);
                });

                while (true) {
                    Log.i("_uploadFile -> 4", message)
                    const {progress = 0, err, success} = yield take(channel);
                    if (err) {
                        Log.i("_uploadFile -> 5", message)
                        yield all([
                            put(uploadFailure(err, msgId)),
                            call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.UPLOAD_FAILURE})
                        ]);
                        document.dispatchEvent(new CustomEvent(msgId, {
                            detail: {
                                loadStatus: LOAD_STATUS.UPLOAD_FAILURE,
                                msgId
                            }
                        }));
                        return;
                    }
                    if (success) {
                        Log.i("_uploadFile -> 6", message)
                        if (messageToSave.repid) {
                            message.repid = messageToSave.repid;
                        }
                        yield all([
                            put(transferSuccess(msgId)),
                            call(sendMessage, {payload: {message, messageToSave, isUpload: true}}),
                            call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.UPLOAD_SUCCESS}),
                            put(updateMessageProperty(msgId, "loadStatus", LOAD_STATUS.UPLOAD_SUCCESS)),
                            put(addMessageLoadStatus({messageId: msgId, loadStatus: LOAD_STATUS.UPLOAD_SUCCESS})),
                            put(createCache(message.awsId, {file: null, localPath: message.msgInfo}))
                        ]);
                        return;
                    }

                    Log.i("_uploadFile -> 7", message)

                    document.dispatchEvent(new CustomEvent(msgId, {detail: {progress: Math.round(progress * 100)}}));
                }
            }
        } else {
            let xmlBuilder: string;

            const {awsId, msgType} = message;

            messageToSave.text = messageToSave.text && messageToSave.text.toString().replace(/&amp;/, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;")

            Log.i("_uploadFile -> 8", message)
            if (isVideoOrImage(msgType) || msgType === MESSAGE_TYPES.stream_file) {
                Log.i("_uploadFile -> 9", message)
                xmlBuilder = "sendMediaXML";
            } else if (awsId) {
                Log.i("_uploadFile -> 10", message)
                xmlBuilder = "sendFileXML";
            } else {
                Log.i("_uploadFile -> 11", message)
                xmlBuilder = "sendMessageXML";
            }

            const request: IRequest = {
                params: message,
                xmlBuilder,
                messageToSave,
                file,
                id: message.id,
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            Log.i("_uploadFile -> 12", message)

            yield put(addRequest(request))
        }




    } catch (e) {
        Log.i("_uploadFile -> 8", message)
        const msgId = messageToSave.id || messageToSave.messageId;
        yield call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.UPLOAD_FAILURE});
        document.dispatchEvent(new CustomEvent(msgId, {detail: {loadStatus: LOAD_STATUS.UPLOAD_FAILURE, msgId}}));
        Log.i("###uploadFile", e);
    }

}

function createUploadFileChannel(endpoint: string, file: File, isVideo?: boolean) {
    return eventChannel(emitter => {
        const xhr = new XMLHttpRequest();
        const onProgress = (e: ProgressEvent) => {
            if (e.lengthComputable) {
                const progress = e.loaded / e.total;
                emitter({progress});
            }
        };
        const onFailure = (e: ProgressEvent) => {
            emitter({err: new Error('Upload failed')});
            emitter(END);
        };

        xhr.upload.addEventListener("progress", onProgress);
        xhr.upload.addEventListener("error", onFailure);
        xhr.upload.addEventListener("abort", onFailure);
        window.addEventListener("offline", onFailure);
        xhr.onreadystatechange = () => {
            const {readyState, status} = xhr;

            if (readyState === 4) {
                if (status === 200) {
                    if (xhr.responseText && xhr.responseText.length > 0) {
                        Raven.captureMessage('Custom: File Upload, ResponseText: ' + xhr.responseText + ' Endpoint: ' + endpoint);
                        onFailure(null);
                    } else {
                        emitter({success: true});
                        emitter(END);
                    }

                } else {
                    onFailure(null);
                }
            }
        };

        xhr.open("PUT", endpoint, true);
        if (isVideo) {
            xhr.setRequestHeader('Content-type', 'video/mp4');
        }
        xhr.send(file);

        return () => {
            window.removeEventListener("offline", onFailure);
            xhr.upload.removeEventListener("progress", onProgress);
            xhr.upload.removeEventListener("error", onFailure);
            xhr.upload.removeEventListener("abort", onFailure);
            xhr.onreadystatechange = null;
            xhr.abort();
        };

    });
}

function createDownloadFileChannel(endpoint: string) {
    Log.i("endpoint ->", endpoint)
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
                emitter({err: new Error('Upload failed')});
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

function* watchForFileUpload() {
    const uploadFileChannel = yield actionChannel(actions.UPLOAD_FILE, buffers.expanding(1));
    document.addEventListener("CANCEL_UPLOAD_PROCESS", async function _cancelUploadProcess(event: any) {
        const msgId = event.detail.messageId;
        await IDBMessage.addMessageStatus(msgId, {loadStatus: LOAD_STATUS.UPLOAD_CANCEL});
        document.dispatchEvent(new CustomEvent(msgId, {detail: {loadStatus: LOAD_STATUS.UPLOAD_CANCEL, msgId}}));
        uploadFileChannel.flush(async (array) => {
            const store: any = storeCreator.getStore();
            const index = array.findIndex(x => x.payload.messages.message.id === msgId);
            if (index >= 0) {
                array.splice(index, 1);
                document.dispatchEvent(new CustomEvent(msgId, {
                    detail: {
                        loadStatus: LOAD_STATUS.UPLOAD_CANCEL,
                        msgId
                    }
                }));
            }
            array.map(async (item) => {
                store.dispatch(uploadFile(item.payload.messages, item.payload.file));
            });
        });
    });

    while (true) {
        const {payload: {messages, file}} = yield take(uploadFileChannel);
        yield call(_uploadFile, messages, file);
    }
}

function* attemptOptimiseVideo({payload: {message, file}}) {
    let fileLink = yield call(MessagesModel.getDb, message.get("fileRemotePath"));
    let fileName = fileLink ? fileLink.split("/").pop().replace(/ /g, "") : "";
    let skipFilename = false;
    const messageId = message.get("id") || message.get("messageId");
    if (!fileName && file) {
        fileName = messageId + ".mp4";
        yield call(MessagesModel.set, file, message.get("fileRemotePath"), message.toJS());
        fileLink = yield call(MessagesModel.getDb, message.get("fileRemotePath"));
        //skipFilename = true;
    }
    (window as any).ffmpeg.ffprobe(fileLink, async (err, metadata) => {
        if (err) {
            document.dispatchEvent(new CustomEvent(message.get("messageId") || message.get("id"), {
                detail: {
                    progress: 0,
                    loadStatus: LOAD_STATUS.OPTIMISE_FAILURE
                }
            }));
        } else {
            if (metadata && metadata.streams && metadata.streams.length > 0) {
                const videoIndex = metadata.streams.findIndex(item => item.codec_type === "video");
                const audioIndex = metadata.streams.findIndex(item => item.codec_type === "audio");
                let overallBitRate: number = 0;
                let bitRateRatio: number = 1;
                let audioBitRate: number = 0;
                let videoBitrate: number = 0;
                let width: number = 0;
                let height: number = 0;
                let scaleRatio = 1;
                let sizeText: string = null;

                if (videoIndex >= 0) {
                    videoBitrate = metadata.streams[videoIndex].bit_rate;
                    overallBitRate += isNaN(videoBitrate) ? 0 : videoBitrate;
                    width = metadata.streams[videoIndex].coded_width;
                    height = metadata.streams[videoIndex].coded_height;

                    if (width > height && width > 640) {
                        sizeText = "640x?";
                        scaleRatio = 640 / width;
                    } else if (height > width && height > 640) {
                        scaleRatio = 640 / height;
                        sizeText = "?x640";
                    }
                }
                if (audioIndex >= 0) {
                    audioBitRate = metadata.streams[audioIndex].bit_rate;
                    overallBitRate += isNaN(audioBitRate) ? 0 : audioBitRate;
                }
                if (scaleRatio < 1) {
                    bitRateRatio = scaleRatio;
                    overallBitRate = overallBitRate * scaleRatio;
                }
                if (overallBitRate > 1500000) {
                    if (overallBitRate > 1500000) {
                        bitRateRatio = 1500000 / overallBitRate;
                    }
                }
                if (overallBitRate === 0 && metadata.format.bit_rate !== 0) {
                    videoBitrate = (metadata.format.bit_rate / 2) * scaleRatio;
                }
                const command = (window as any).ffmpeg(fileLink).videoCodec('libx264')
                    .on('progress', function (progress) {
                        let percent = 0;
                        if (isNaN(progress.percent) && progress.timemark && file.duration && !isNaN(file.duration)) {
                            const timeParticles = progress.timemark.split(":");
                            if (timeParticles instanceof Array && timeParticles.length === 3) {
                                const time = timeParticles[0] * 3600 + timeParticles[1] * 60 + timeParticles[2];
                                progress.percent = (time / file.duration) * 100;
                                if (progress.percent > 100) {
                                    progress.percent = 100;
                                }
                            }
                        } else {
                            percent = progress.percent;
                        }
                        document.dispatchEvent(new CustomEvent(message.get("messageId") || message.get("id"), {
                            detail: {
                                progress: progress.percent,
                                optimising: true
                            }
                        }));
                    }).on('end', async () => {
                        await MessagesModel.setDB(file, message.get("fileRemotePath"), file["path"]);
                        await IDBMessage.addMessageStatus(messageId, {loadStatus: LOAD_STATUS.LOAD_START});
                        document.dispatchEvent(new CustomEvent(message.get("messageId") || message.get("id"), {
                            detail: {
                                progress: 100,
                                optimising: true,
                                blob: filePathAndName
                            }
                        }));
                        if (fileLink.includes(fileName === message.get("messageId") || message.get("id") + "_record.mp4")) {
                            (window as any).fs.unlink(fileLink, function (error) {
                                if (error) {
                                    Log.i("Error during unliniking file")
                                }
                            });
                        }
                        document.removeEventListener("CANCEL_UPLOAD_" + messageId, cancelOptimisation);
                        document.removeEventListener("beforeunload", cancelOptimisation);

                    }).on('error', function () {
                        document.dispatchEvent(new CustomEvent(message.get("messageId") || message.get("id"), {
                            detail: {
                                progress: 0,
                                loadStatus: LOAD_STATUS.OPTIMISE_FAILURE
                            }
                        }));
                        document.removeEventListener("CANCEL_UPLOAD_" + messageId, cancelOptimisation);
                        document.removeEventListener("beforeunload", cancelOptimisation);
                    });

                if (sizeText !== null) {
                    command.size(sizeText);
                }
                if (bitRateRatio !== 1) {
                    if (videoBitrate > 0) {
                        command.videoBitrate((videoBitrate * bitRateRatio * bitRateRatio) / 1000);
                    }
                    if (audioBitRate > 0) {
                        command.audioBitrate(audioBitRate * bitRateRatio / 1000);
                    }
                }

                async function cancelOptimisation() {
                    command.kill('SIGSTOP');
                    (window as any).fs.unlink(filePathAndName, function (error) {
                        if (error) {
                            Log.i("Error during unliniking file")
                        }
                    });
                    document.removeEventListener("CANCEL_UPLOAD_" + messageId, cancelOptimisation);
                    document.removeEventListener("beforeunload", cancelOptimisation);
                }

                document.addEventListener("CANCEL_UPLOAD_" + messageId, cancelOptimisation);
                document.addEventListener("beforeunload", cancelOptimisation);
                document.addEventListener('keydown', function _cancelOptimise(e) {
                    if (e.code === "KeyR" && (((window as any).isWin && e.ctrlKey) || ((window as any).isMac && e.metaKey))) {
                        command.kill('SIGSTOP');
                    }
                });

                const filePathAndName = skipFilename ? fileName : await MessagesModel.getToSaveFileName(fileName);
                command.save(filePathAndName);
                await IDBMessage.addMessageStatus(messageId, {loadStatus: LOAD_STATUS.OPTIMISE_START});
            }
        }
    });
}

const getAsyncLoadedImage = async(file, msgId) => {
    const url = await getBlobUri(file);
    return { key: msgId,
        value: url}
};

function* attemptDownloadFile({payload: {downloadInfo}}) {
    const {fileRemotePath, threadId, method, msgId, folderPath, type} =  downloadInfo;
    try {
        const bucket: any = isPublicRoom(threadId) ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer;
        const url = yield call(getSignedUrl, bucket, method, fileRemotePath);
        const channel = yield call(createDownloadFileChannel, url);
        const store: any = storeCreator.getStore();
        Log.i("attemptDownloadFile channel = ", attemptDownloadFile)
        document.addEventListener("CANCEL_DOWNLOAD_" + msgId, async function _cancel() {
            channel.close();
            document.dispatchEvent(new CustomEvent(msgId, {
                detail: {
                    loadStatus: LOAD_STATUS.DOWNLOAD_CANCEL,
                    msgId
                }
            }));
            document.removeEventListener("CANCEL_DOWNLOAD_" + msgId, _cancel);
            // store.dispatch(updateMessageProperty(msgId, "loadStatus", LOAD_STATUS.DOWNLOAD_CANCEL)),
            await IDBMessage.addMessageStatus(msgId, {loadStatus: LOAD_STATUS.DOWNLOAD_CANCEL});
        });

        while (true) {
            const {progress = 0, err, success, blob} = yield take(channel);
            if (err) {
                yield all([
                    put(uploadFailure(err, msgId)),
                    call(IDBMessage.addMessageStatus, msgId, {loadStatus: err && err.message === "404" ? LOAD_STATUS.DOWNLOAD_404 : LOAD_STATUS.DOWNLOAD_FAILURE})
                ]);
                document.dispatchEvent(new CustomEvent(msgId, {
                    detail: {
                        loadStatus: LOAD_STATUS.DOWNLOAD_FAILURE,
                        msgId,
                        err: err && err.message
                    }
                }));
                return;
            }
            if (success) {
                document.dispatchEvent(new CustomEvent(msgId, {detail: {blob, msgId}}));
                if(type && (type === MESSAGE_TYPES.image || type === MESSAGE_TYPES.gif)) {
                    yield all([createThumbnail(msgId,blob)]);
                }
                yield all([
                    put(transferSuccess(msgId)),
                    call(MessagesModel.set, blob, fileRemotePath, msgId, folderPath),
                    call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.DOWNLOAD_SUCCESS}),
                    put(addMessageLoadStatus({messageId: msgId, loadStatus: LOAD_STATUS.DOWNLOAD_SUCCESS})),
                    put(createCache(fileRemotePath, {file: null, localPath: folderPath}))
                ]);

                if(type && (type === MESSAGE_TYPES.image || type === MESSAGE_TYPES.gif)) {
                    const loadedImage = yield getAsyncLoadedImage(blob, msgId);
                    const homeDir = os.homedir();
                    const path = (window as any).isMac ? `${homeDir}/Library/Application Support/Electron/thumbs/${msgId}.jpeg` : (window as any).isWin ? `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`: '';

                    yield all([call(IDBMessage.update, msgId, {'info': path}), put(updateMessageProperty(msgId, 'info',  path))]);
                    yield all([put(addSharedMediaImage(loadedImage))]);
                }

                return;
            }

            document.dispatchEvent(new CustomEvent(msgId, {detail: {progress: Math.round(progress * 100), msgId}}));
        }

    } catch (e) {
        yield call(IDBMessage.addMessageStatus, msgId, {loadStatus: LOAD_STATUS.DOWNLOAD_FAILURE});
        document.dispatchEvent(new CustomEvent(msgId, {detail: {loadStatus: LOAD_STATUS.DOWNLOAD_FAILURE, msgId}}));
        Log.i("###downloadFile", e);
    }
}

function* messageLocalDelete({payload: {msgId, threadId, send}}) {
    const store: Store<any> = storeCreator.getStore();
    const {app} = selector(store.getState(),
        {
            user: true,
            application: {
                app: true
            },
        });

    const message: any = yield select(messageSelector(msgId));

    yield all([
        put(removeMessage(msgId)),
        call(IDBMessage.localDelete, msgId)
    ]);

    yield call(checkForLastMessageDelete, msgId, threadId, send);

    if (app.showSharedMedia) {
        const sharedMediaMessage = yield call(IDBMessage.findAll, threadId, 0, 1, [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);
        if (!sharedMediaMessage.length) {
            yield put(setShowSharedMedia(false));
        }
    }

    if (app.sharedMedia.total > 0 && SHARED_MESSAGE_TYPES.includes(message.get("type"))) {
        const checkedFilesCount = {
            media: 0,
            file: 0,
            link: 0,
            total: 1
        };
        if (MEDIA_TYPES.media.includes(message.get("type"))) {
            checkedFilesCount.media = checkedFilesCount.media + 1;
        }

        if (MEDIA_TYPES.file.includes(message.get("type"))) {
            checkedFilesCount.file = checkedFilesCount.file + 1;
        }

        if (message.get("type") === MESSAGE_TYPES.text && message.get("link")) {
            checkedFilesCount.link = checkedFilesCount.link + 1;
        }

        DELETE_SHARED_MEDIA_MESSAGES_SUCCESS([msgId], checkedFilesCount);
    }
}

function* checkForLastMessageDelete(msgId: string, threadId: string, manualDelete: boolean) {
    const store: Store<any> = storeCreator.getStore();
    const {user, conversations, messages} = selector(store.getState(), {
        user: true,
        conversations: true,
        messages: true
    });
    const conversation = conversations.get(threadId);
    const lastMessageId = conversation ? conversation.getIn(["conversations", "lastMessageId"]) : "";
    const isLastMessage = lastMessageId === msgId;

    if (isLastMessage) {
        const lastMessage: any = yield MessagesModel.getLastMessage(threadId);
        if (manualDelete) {
            if (lastMessage) {
                const {messageId, id} = lastMessage;

                yield all([
                    call(IDBConversation.updateConversation, threadId, {
                        lastMessageId: id || messageId,
                    }),
                    put(conversationLastMessageChange(lastMessage, threadId)),
                ]);

            } else {

                const isThreadEmpty: boolean = yield MessagesModel.isThreadEmpty(threadId);

                if (isThreadEmpty) {
                    yield all([
                        call(IDBConversation.removeConversation, threadId),
                        put(removeConversation(threadId)),
                    ]);
                } else {
                    yield all([
                        call(IDBConversation.updateConversation, threadId, {lastMessageId: "", time: 0}),
                        put(conversationLastMessageChange({}, threadId)),
                    ]);
                }
            }
        } else {
            if (lastMessage) {
                const {id, messageId} = lastMessage;
                yield all([
                    call(IDBConversation.updateConversation, threadId, {lastMessageId: id || messageId}),
                    put(conversationLastMessageChange(lastMessage, threadId)),
                ]);
            }
        }
    }
}

function* attemptCreateNewMessage({payload: {message}}) {
    const store: Store<any> = storeCreator.getStore();
    const {sharedMediaPanel, app: {statuses}, selectedThreadId, user, messages, pendingRequests} = selector(store.getState(), {
        sharedMediaPanel: true,
        application: {
            app: true
        },
        messages: true,
        selectedThreadId: true,
        user: true,
        pendingRequests: true
    });

    const mediaTypes: any = {
        media: [
            MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video
        ],
        file: [
            MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file
        ]
    };

    let previousMessageId = message.previousMessageId;
    if (message.id && !message.messageId && user.get("id") === message.creator && !previousMessageId) {
        if (messages.size > 1) {
            //const prevMessage = messages._list.get(messages.size - 2)[1].toJS();
            //previousMessageId = prevMessage.id || prevMessage.messageId;
        }
    }

    const msgType = (typeof message.type === "object" && message.type !== null && !Array.isArray(message.type)) ? message.type["#text"] : message.type;

    let link: boolean = false;
    let linkTags: any = [];
    if ([MESSAGE_TYPES.text, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
        link = isURI(message.text);
        linkTags = undefined;
    }

    const messageToSave: IMessage = {
        blobUri: message.blobUri || null,
        conversationId: message.threadId,
        createdAt: new Date(message.createdAt),
        type: msgType,
        info: message.info,
        text: message.text,
        messageId: message.id || message.messageId,
        previousMessageId: previousMessageId,
        threadId: message.threadId,
        creator: message.creator,
        fileLink: message.fileLink || '',
        fileRemotePath: message.fileRemotePath || null,
        fileSize: message.fileSize || null,
        repid: message.repid || "",
        m_options: message.m_options || null,
        localPath: message.localPath || null,
        own: message.own,
        delivered: message.delivered || false,
        isDelivered: message.isDelivered || false,
        hidden: message.hidden,
        draft: message.draft,
        isSeen: message.isSeen || false,
        seen: message.seen || false,
        deleted: message.deleted || false,
        edited: message.edited || false,
        likes: message.likes || 0,
        dislikes: message.dislikes || 0,
        likeState: message.likeState || 0,
        time: message.time || new Date(message.createdAt).getTime(),
        status: message.status || false,
        link: link,
        linkTags: linkTags,
        sid: message.sid,
        pid: message.pid
    };


    const effects: Array<any> = [];
    effects.push(call(IDBMessage.createMessage, messageToSave));
    // if (link && sharedMediaPanel) {
    //     effects.push(put(addSharedMediaMessages(messageToSave.messageId, messageToSave)));
    // }

    yield all(effects);

    // if (!app.showSharedMedia && link) {
    //     const sharedMediaMessage = yield call(IDBMessage.findAll, selectedThreadId, 0, 1, [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);
    //     if (sharedMediaMessage.length > 0) {
    //         yield put(setShowSharedMedia(true));
    //     }
    // }
    let sharedMediaType: string = SHARED_MEDIA_TYPES.LINK;
    if (mediaTypes.media.includes(messageToSave.type)) {
        sharedMediaType = SHARED_MEDIA_TYPES.MEDIA
    }

    if (mediaTypes.file.includes(messageToSave.type)) {
        sharedMediaType = SHARED_MEDIA_TYPES.FILE
    }

    const sharedMediaRecordsMap = {
        messageStatus: null,
        messages: messageToSave
    };

    yield put(MESSAGE_CREATION_DONE(messageToSave.messageId))

    if (message.text === "create" && pendingRequests.size > 0 && message.zmuc && selectedThreadId.includes(message.zmuc.name)) {
        store.dispatch(startingConference(selectedThreadId))
    }




    // yield put(ADD_MEDIA_RECORD(sharedMediaType, sharedMediaRecordsMap, 0));

    // const sharedMediaMessagesCount = yield call(IDBMessage.getSharedMediaMessagesCount, selectedThreadId, [MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]);
    // yield put(setSharedMediaCount(sharedMediaMessagesCount[0].count));
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
        const message: any = item;
        if (message.type === MESSAGE_TYPES.image || message.type === MESSAGE_TYPES.gif) {
            const remotePath = message.fileRemotePath
            const msgId: string = message.messageId || message.id;
            return imageURLS[msgId]= asyncLoadedimage(remotePath, msgId);
        }
    }))
};


function* attemptSendForwardMessage({payload: {messages, threadIds, emailsMap}}) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {user, selectedThreadId, conversations, contacts, app} = selector(store.getState(), {
            user: true,
            selectedThreadId: true,
            app: true,
            conversations: true,
            contacts: true,
        });
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);



        const username = user.get("username");
        const userId = user.get("id");
        const email: string = user && user.get("email");
        let messagesArr: any = messages.valueSeq().toArray();

        for (let i: number = 0; i < messagesArr.length; i++) {
            const forwardMessage: any = messagesArr[i];

            Log.i("attemptSendForwardMessage -> forwardMessage = ", forwardMessage)


            const fileRemotePath: string = forwardMessage.get("fileRemotePath");

            let thumbnail: any;

            let dbMessage: any = {};


            if ((forwardMessage.get("type") === MESSAGE_TYPES.text && forwardMessage.get("link")) || forwardMessage.get("type") === MESSAGE_TYPES.image || forwardMessage.get("type") === MESSAGE_TYPES.video || forwardMessage.get("type") === MESSAGE_TYPES.sticker || forwardMessage.get("type") === MESSAGE_TYPES.stream_file) {
                dbMessage = yield IDBMessage.getMessageById(forwardMessage.get("id") || forwardMessage.get("messageId"));
            }

            if ([MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video].includes(forwardMessage.get("type"))) {
                thumbnail = getBase64FromThumb(forwardMessage.get("info"));

            }

            switch (forwardMessage.get("type")) {
                case MESSAGE_TYPES.location:
                case MESSAGE_TYPES.sticker:
                case MESSAGE_TYPES.text:
                case MESSAGE_TYPES.contact:
                case MESSAGE_TYPES.contact_with_info:
                case MESSAGE_TYPES.gif:
                    for (let conversationId of threadIds) {
                        const isGif: boolean = MESSAGE_TYPES.gif === forwardMessage.get("type");
                        const sid: string = isThreadIdPrivateChat(conversationId) ? "1" : "0";
                        const pid: string = isThreadIdPrivateChat(conversationId) ? getPid(conversationId) : "";
                        const time: any = Date.now();
                        const msgId = `msgId${time}`;



                        const messageToSave: any = (window as any).isRefactor ? {
                            conversationId: selectedThreadId,
                            createdAt: format(time, DEFAULT_TIME_FORMAT),
                            creator: user.get("id"),
                            deleted: false,
                            delivered: false,
                            dislikes: 0,
                            edited: false,
                            email,
                            fileLink: '',
                            fileRemotePath,
                            fileSize: null,
                            hidden: undefined,
                            info: forwardMessage.get("info"),
                            isDelivered: false,
                            isSeen: true,
                            likeState: 0,
                            likes: 0,
                            link: forwardMessage.get("link"),
                            linkTags: forwardMessage.get("linkTags"),
                            loadStatus: null,
                            m_options: dbMessage.m_options,
                            messageId: msgId,
                            id: msgId,
                            own: true,
                            pid,
                            previousMessageId: undefined,
                            repid: "",
                            seen: false,
                            sid,
                            status: false,
                            text: forwardMessage.get("text"),
                            threadId: conversationId,
                            time,
                            type: forwardMessage.get("type"),
                            ext: isGif ? "gif" : ""
                        } : {
                            fileRemotePath,
                            createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                            type: forwardMessage.get("type"),
                            text: forwardMessage.get("text"),
                            info: forwardMessage.get("info"),
                            m_options: dbMessage.m_options,
                            threadId: conversationId,
                            creator: user.get("id"),
                            id: `msgId${Date.now()}`,
                            time: Date.now(),
                            email,
                            fileSize: null,
                            own: true,
                            sid,
                            pid,
                            ext: isGif ? "gif" : "",
                            link: forwardMessage.get("link"),
                            linkTags: forwardMessage.get("linkTags"),
                        };

                        const message: any = {
                            awsId: fileRemotePath,
                            to: conversationId.split("/").shift(),
                            author: user.get("username"),
                            type: XML_MESSAGE_TYPES.chat,
                            msgType: isGif ? MESSAGE_TYPES.image : messageToSave.type,
                            msgText: messageToSave.text,
                            msgInfo: thumbnail || messageToSave.info,
                            email: messageToSave.email,
                            id: messageToSave.id,
                            sid,
                            pid,
                            ext: messageToSave.ext
                        };

                        if (forwardMessage.get("type") === MESSAGE_TYPES.stream_file) {
                            message.fileSize = 0;
                        }

                        if (conversationId.includes(GROUP_CONVERSATION_EXTENSION)) {
                            message.type = XML_MESSAGE_TYPES.group;
                        }

                        const conversationType: string = getConversationType(conversationId);
                        if (conversationType === CONVERSATION_TYPE.SINGLE) {
                            const contact = yield call(DatabaseContacts.selectDBContact, conversationId);

                            if (!contact) {
                                let contactPhone: string = getUsername(conversationId);
                                let contactEmail: string = null;

                                if (emailsMap[contactPhone]) {
                                    contactEmail = emailsMap[contactPhone];
                                    contactPhone = null;
                                }

                                yield put(attemptCreateContact(
                                    conversationId,
                                    "",
                                    "",
                                    username,
                                    contactPhone ? [contactPhone] : null,
                                    false,
                                    false,
                                    undefined,
                                    contactEmail ? [contactEmail] : null
                                ));

                                yield take(action => action.type === CONTACT_ACTIONS.CONTACT_CREATION_DONE && action.payload.contactId === conversationId);
                            }
                        }

                        yield call(sendMessage, {
                            payload: {
                                message,
                                messageToSave,
                                isUpload: false,
                                resetStoreMessages: conversationId === selectedThreadId
                            }
                        });

                        if (threadIds.length === 1) {
                            const threadId = threadIds[0];
                            const chatSelected: boolean = threadId === selectedThreadId;
                            localStorage.setItem("chatSelected", `${chatSelected}`)


                            if (app.leftPanel !== LEFT_PANELS.threads) {
                                yield all([
                                    call(attemptCreateNewMessage, {payload: {message: messageToSave}}),
                                    IDBConversation.updateConversation(threadId, {
                                        lastMessageId: messageToSave.id,
                                        time: messageToSave.time
                                    })
                                ]);
                            } else {
                                yield call(attemptCreateNewMessage, {payload: {message: messageToSave}});
                            }

                            if (app.leftPanel !== LEFT_PANELS.threads && app.leftPanel !== LEFT_PANELS.search_messages) {
                                yield put(changeLeftPanel(LEFT_PANELS.threads));
                            }



                            if (!chatSelected) {
                                yield delay(100)
                                yield put(attemptSetSelectedThread({
                                    threads: {
                                        threadId: threadId,
                                        threadType: getConversationType(threadId),
                                    },
                                    selectedThread
                                }, false, threadId))
                            }

                        }
                    }
                    break;
                case MESSAGE_TYPES.video:
                case MESSAGE_TYPES.voice:
                case MESSAGE_TYPES.image:
                case MESSAGE_TYPES.file:
                case MESSAGE_TYPES.stream_file:
                    let name: string;
                    let type: string;
                    if (forwardMessage.get("type") === MESSAGE_TYPES.video || forwardMessage.get("type") === MESSAGE_TYPES.stream_file) {
                        name = `video${Date.now()}.webm`;
                        type = "video/webm";
                    } else if (forwardMessage.get("type") === MESSAGE_TYPES.voice) {
                        name = `audio${Date.now()}.webm`;
                        type = "audio/webm";
                    } else if (forwardMessage.get("type") === MESSAGE_TYPES.image) {
                        name = `image${Date.now()}.jpg`;
                        type = "image/jpeg";
                    } else {
                        const info: any = JSON.parse(forwardMessage.get("info"));
                        name = `${info.fileName}.${info.fileType}`;
                        type = "file";
                    }

                    let blob = yield call(MessagesModel.get, fileRemotePath, "", true);

                    let filePath = "";

                    if (!blob) {
                        let currentBucket: string = conf.app.aws.bucket.fileTransfer;
                        if (forwardMessage.get('threadId').includes('pid')) {
                            currentBucket = conf.app.aws.bucket.group;
                        } else if (forwardMessage.get('threadId').includes('gid')) {
                            currentBucket = conf.app.aws.bucket.group;
                        }
                        blob = yield call(getAWSFile, currentBucket, "GET", fileRemotePath);
                    } else {
                        // if ((window as any).fs) {
                            filePath = yield call(MessagesModel.getDb, fileRemotePath);
                        // }
                    }

                    const file = base64ToFile(blob, name, type);

                    for (let threadId of threadIds) {
                        const time = Date.now();
                        const msgId = `msgId${time}`;

                        // const fileRemotePath = isPublicRoom(threadId) ? `${threadId.split("@").shift()}/${username}/${msgId}` : `${username}/${msgId}`;
                        const fileType = file.type.split("/").shift().toUpperCase();

                        // const messageToSave: any = {
                        //     blobUri: forwardMessage.get("blobUri"),
                        //     conversationId: selectedThreadId,
                        //     createdAt: format(time, DEFAULT_TIME_FORMAT),
                        //     creator: userId,
                        //     deleted: false,
                        //     delivered: false,
                        //     dislikes: 0,
                        //     edited: false,
                        //     email,
                        //     fileLink: '',
                        //     fileRemotePath: isPublicRoom(threadId) ? `${threadId.split("@").shift()}/${username}/${msgId}` : `${userId.split("@").shift()}/${msgId}`,
                        //     fileSize: file.size,
                        //     hidden: undefined,
                        //     info: forwardMessage.get("info"),
                        //     isDelivered: false,
                        //     isSeen: true,
                        //     likeState: 0,
                        //     likes: 0,
                        //     link: forwardMessage.get("link"),
                        //     linkTags: forwardMessage.get("linkTags"),
                        //     loadStatus: null,
                        //     m_options: dbMessage.m_options,
                        //     messageId: msgId,
                        //     id: msgId,
                        //     own: true,
                        //     pid: '',
                        //     previousMessageId: undefined,
                        //     repid: "",
                        //     seen: false,
                        //     sid: '',
                        //     status: false,
                        //     text: forwardMessage.get("text") || "#E#F#M#",
                        //     threadId,
                        //     time,
                        //     type: fileType === "AUDIO" ? "VOICE" : fileType,
                        // }

                        const messageToSave: any = (window as any).isRefactor ? {
                            conversationId: selectedThreadId,
                            createdAt: format(time, DEFAULT_TIME_FORMAT),
                            creator: userId,
                            deleted: false,
                            delivered: false,
                            dislikes: 0,
                            edited: false,
                            email,
                            fileLink: '',
                            fileRemotePath: isPublicRoom(threadId) ? `${threadId.split("@").shift()}/${username}/${msgId}` : `${userId.split("@").shift()}/${msgId}`,
                            fileSize: file.size,
                            hidden: undefined,
                            info: forwardMessage.get("info"),
                            isDelivered: false,
                            isSeen: true,
                            likeState: 0,
                            likes: 0,
                            link: forwardMessage.get("link"),
                            linkTags: forwardMessage.get("linkTags"),
                            loadStatus: null,
                            m_options: dbMessage.m_options,
                            messageId: msgId,
                            id: msgId,
                            own: true,
                            pid: '',
                            previousMessageId: undefined,
                            repid: "",
                            seen: false,
                            sid: '',
                            status: false,
                            text: forwardMessage.get("text") || "#E#F#M#",
                            threadId,
                            time,
                            type: fileType === "AUDIO" ? "VOICE" : fileType,
                        } : {
                            blobUri: forwardMessage.get("blobUri"),
                            text: forwardMessage.get("text") || "#E#F#M#",
                            createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                            info: forwardMessage.get("info"),
                            localPath: forwardMessage.get("localPath"),
                            m_options: dbMessage.m_options,
                            fileSize: file.size,
                            creator: userId,
                            type: fileType === "AUDIO" ? "VOICE" : fileType,
                            fileRemotePath: isPublicRoom(threadId) ? `${threadId.split("@").shift()}/${username}/${msgId}` : userId.toString().indexOf("@") !== -1 ? `${userId.split("@").shift()}/${msgId}` : `${userId.split("/").shift()}/${msgId}`,
                            id: msgId,
                            email,
                            own: true,
                            threadId,
                            time,
                            sid: "",
                            pid: ""
                        };

                        const message: any = {
                            to: threadId.split("/").shift(),
                            fileSize: messageToSave.fileSize,
                            type: XML_MESSAGE_TYPES.chat,
                            msgInfo: thumbnail || messageToSave.info,
                            msgText: messageToSave.text,
                            msgType: messageToSave.type,
                            email: messageToSave.email,
                            aswToSave: fileRemotePath,
                            awsId: fileRemotePath,
                            id: messageToSave.id,
                            author: username,
                            sid: "",
                            pid: ""
                        };

                        if (isPublicRoom(threadId)) {
                            message.type = XML_MESSAGE_TYPES.group;
                        }

                        if (messageToSave.type === MESSAGE_TYPES.video) {
                            messageToSave.loadStatus = LOAD_STATUS.LOAD_START;
                        }

                        const conversationType: string = getConversationType(threadId);
                        if (conversationType === CONVERSATION_TYPE.SINGLE) {
                            const contact = yield call(DatabaseContacts.selectDBContact, threadId);
                            if (!contact) {
                                let contactPhone: string = getUsername(threadId);
                                let contactEmail: string = null;

                                if (emailsMap[contactPhone]) {
                                    contactEmail = emailsMap[contactPhone];
                                    contactPhone = null;
                                }

                                yield put(attemptCreateContact(
                                    threadId,
                                    "",
                                    "",
                                    username,
                                    contactPhone ? [contactPhone] : null,
                                    false,
                                    false,
                                    undefined,
                                    contactEmail ? [contactEmail] : null
                                ));

                                yield take(action => action.type === CONTACT_ACTIONS.CONTACT_CREATION_DONE && action.payload.contactId === threadId);
                            }
                        }
                        if (app.leftPanel !== LEFT_PANELS.threads) {
                            yield all([
                                call(attemptCreateNewMessage, {payload: {message: messageToSave}}),
                                IDBConversation.updateConversation(threadId, {
                                    lastMessageId: messageToSave.id,
                                    time: messageToSave.time
                                })
                            ]);
                        } else {
                            yield call(attemptCreateNewMessage, {payload: {message: messageToSave}});
                        }




                        const messages = {message, messageToSave, filePath};
                        // const conversation = yield call(IDBConversation.getFullConversationById, threadId);
                        const conversation = conversations.get(selectedThreadId);

                        yield call(uploadRequest, {
                            payload: {
                                messages,
                                file,
                                resetStoreMessages: threadIds.length === 1 || threadId === selectedThreadId,
                                shouldSetNewThread: (conversation && conversation.contactId) || message.type === XML_MESSAGE_TYPES.group ?  false : threadIds.length === 1 && threadIds[0] !== selectedThreadId  ? true : false,
                                isForwardMessage: true,
                            }
                        });

                        if (threadIds.length === 1) {

                            const threadId = threadIds[0];
                            const chatSelected: boolean = threadId === selectedThreadId;

                            localStorage.setItem("chatSelected", `${chatSelected}`)
                            Log.i("chatSelected -> 1", chatSelected)


                            if (app.leftPanel !== LEFT_PANELS.threads && app.leftPanel !== LEFT_PANELS.search_messages) {
                                yield put(changeLeftPanel(LEFT_PANELS.threads));
                            }

                            if (!chatSelected) {
                                yield delay(100)
                                yield put(attemptSetSelectedThread({
                                    threads: {
                                        threadId: threadId,
                                        threadType: getConversationType(threadId),
                                    },
                                    selectedThread
                                }, false, threadId))
                            }

                        }


                    }
                    break;
                default:
                    break;
            }
        }

    } catch (e) {
        Log.i("##", e);
    }

}

function* attemptSearchMessages({payload: {text, search}}) {
    const store: Store<any> = storeCreator.getStore();
    const textReg = new RegExp(`${text.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")}`, "gi");
    const {selectedThreadId} = selector(store.getState(), {
        selectedThreadId: true,
    });
    let searchedMessages: any = {};
    try {
        searchedMessages = yield call(IDBMessage.getMessageByText, selectedThreadId, 0, text, 50, search);
        Log.i('searchedMessages', searchedMessages)
        if (searchedMessages && searchedMessages.length !== 0) {
            let searchedMessagesMap: any = {};

            for (const message of searchedMessages) {
                const msgType: string = message.type;
                if (MESSAGE_TYPES.file === msgType) {
                    const fileMessage: any = JSON.parse(message.info);
                    if (!textReg.test(fileMessage.fileName)) continue;
                } else if ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
                    const cleanedText: string = (message.text === OFFLINE_MESSAGE_BODY || message.text === "null") ? "" : ((message.type === MESSAGE_TYPES.stream_file && message.text && message.text.match(/text="(.*?)"[ ]?\//)) ? message.text.match(/text="(.*?)"[ ]?\//)[1] : message.text);
                    if (!textReg.test(cleanedText)) continue;
                }
                searchedMessagesMap[message.messageId] = message;
            }
            yield put(setSearchedMessages(searchedMessagesMap));
            document.dispatchEvent(new CustomEvent("messageSearch", {
                detail: {
                    messageIds: Object.keys(searchedMessagesMap),
                    text: text
                }
            }));
        } else {
            yield put(removeSearchedMessages());
            document.dispatchEvent(new CustomEvent("messageSearch", {detail: {messageIds: [], text: text}}));
        }
    } catch (e) {
        Log.i(e);
    }
}

function* attemptShowSearchedMessage({payload: {id, message, text}}) {
    const store: Store<any> = storeCreator.getStore();
    const {messages, searchedMessages, selectedThreadId} = selector(store.getState(), {
        messages: true,
        searchedMessages: true,
        selectedThreadId: true,
    });
    // Log.i(messages, "messages1234")
    try {
        if (messages.has(id)) {
            const element: any = document.getElementById(id);

            setTimeout(() => {
                element.scrollIntoView({behavior: "auto", block: "start", inline: "nearest"});
            }, 50);

        } else {
            const {newMessagesTop, newMessagesBottom} = yield all({
                newMessagesTop: call(IDBMessage.getTopSearchMessages, selectedThreadId, id, 20, message.toJS()),
                newMessagesBottom: call(IDBMessage.getBottomSearchMessages, selectedThreadId, id, 20, message.toJS()),
            });
            yield put(toggleResetStoreMessages(true));
            const messages = [...newMessagesTop, ...newMessagesBottom];
            let loadedMessagesMap: any = {};

            for (const message of messages) {
                loadedMessagesMap[message.messages.messageId] = message.messages;
            }

            yield put(setStoreMessages(loadedMessagesMap));
            document.dispatchEvent(new CustomEvent("messageSearch", {
                detail: {
                    messageIds: Object.keys(searchedMessages.toJS()),
                    text: text
                }
            }));
            const element: any = document.getElementById(id);
            element.scrollIntoView({behavior: "auto", block: "start", inline: "nearest"});
        }
    } catch (e) {
        Log.i(e);
    }
}

function* attemptShowCalendarMessages({payload: {time}}) {
    const store: Store<any> = storeCreator.getStore();
    const {messages, selectedThreadId} = selector(store.getState(), {messages: true, selectedThreadId: true});
    let loadedMessagesMap: any = {};
    try {
        const {newMessagesTop, newMessagesBottom} = yield all({
            newMessagesTop: call(IDBMessage.getMessageByStartTime, selectedThreadId, 50, time),
            newMessagesBottom: call(IDBMessage.getMessageByStartTimeTop, selectedThreadId, 25, time),
        });
        let id: string;
        if (newMessagesTop && newMessagesTop.length > 0) {
            id = newMessagesTop[0].messages.messageId;
        }
        if (id && id !== "") {
            if (messages.has(id)) {
                const element: any = document.getElementById(id);
                element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
            } else {
                const messages = [...newMessagesTop, ...newMessagesBottom];
                if (messages && messages.length > 0) {
                    for (const message of messages) {
                        loadedMessagesMap[message.messages.messageId] = message.messages;
                    }
                    yield put(setStoreMessages(loadedMessagesMap));
                    const element: any = document.getElementById(id);
                    element.scrollIntoView({behavior: "auto", block: "center", inline: "nearest"});
                    yield put(toggleResetStoreMessages(true));
                }
            }
        }
    } catch (e) {
        Log.i(e);
    }
}

function* attemptShowMoreSearchMessages({payload: {text}}) {
    const store: Store<any> = storeCreator.getStore();
    const {searchedMessages, selectedThreadId} = selector(store.getState(), {
        searchedMessages: true,
        selectedThreadId: true
    });

    let showMoreSearchedMessages: any = {};
    try {
        if (searchedMessages && searchedMessages.size >= SEARCH_MESSAGES_LIMIT) {
            const count: number = searchedMessages.size / SEARCH_MESSAGES_LIMIT;
            const newMessagesCount: number = count * SEARCH_MESSAGES_LIMIT + count;
            showMoreSearchedMessages = yield call(IDBMessage.getMessageByText, selectedThreadId, newMessagesCount, text, SEARCH_MESSAGES_LIMIT);
            let searchedMessagesMap: any = {};
            for (const message of showMoreSearchedMessages) {
                searchedMessagesMap[message.messageId] = message;
            }
            yield put(showMoreSearchMessages(searchedMessagesMap));
        }
    } catch (e) {
        Log.i(e);
    }
}

function* attemptSendMessage({payload: {message, messageType, meta, isUpload}}) {

    if (meta.replyMessage && !meta.replyMessage.get("repliedPersonally")) {
        // "hidden: true" was hardcoded before which makes reply messages disappear
        // needs investigation on why is this used
        yield fork(IDBMessage.createMessage, {...meta.replyMessage.toJS(), hidden: false});
        yield put(addMessage({...meta.replyMessage.toJS(), hidden: true}));
    }
    const connection: any = connectionCreator.getConnection();
    const store: Store<any> = storeCreator.getStore();

    const {conversations, selectedThreadId, user} = selector(store.getState(), {
        conversations: true,
        selectedThreadId: true,
        user: true,
    });
    let contact;
    if (selectedThreadId !== "") {
        contact = yield select(contactSelector(selectedThreadId));
    }

    const selectedThread = conversations.get(selectedThreadId) ? conversations.get(selectedThreadId) : contact;
    const repliedPersonally: boolean = meta.replyMessage && meta.replyMessage.get("repliedPersonally");
    const threadType: string = selectedThread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);
    const email: string = user && user.get("email") || "";
    const currentTime: any = Date.now();
    let msg: Strophe.Builder;
    let gifThumb: any;

    const messageToSave: any = (window as any).isRefactor ? {
        conversationId: selectedThreadId,
        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
        creator: user.get("id"),
        deleted: false,
        delivered: false,
        dislikes: 0,
        edited: false,
        email,
        fileLink: '',
        fileRemotePath: null,
        fileSize: null,
        hidden: undefined,
        info: '',
        isDelivered: false,
        isSeen: true,
        likeState: 0,
        likes: 0,
        link: isURI(message),
        linkTags: List[0],
        loadStatus: null,
        m_options: null,
        messageId: `msgId${currentTime}`,
        id: `msgId${currentTime}`,
        own: true,
        pid: undefined,
        previousMessageId: undefined,
        repid: meta.replyMessage ? meta.replyMessage.get("messageId") || meta.replyMessage.get("id") : "",
        seen: false,
        sid: undefined,
        status: false,
        text: message,
        threadId: selectedThreadId,
        time: currentTime,
        type: MESSAGE_TYPES.text,
        repliedPersonally
    } : {
        repid: meta.replyMessage ? meta.replyMessage.get("messageId") || meta.replyMessage.get("id") : "",
        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
        threadId: selectedThreadId,
        id: `msgId${currentTime}`,
        messageId: `msgId${currentTime}`,
        type: MESSAGE_TYPES.text,
        creator: user.get("id"),
        fileRemotePath: null,
        time: currentTime,
        fileSize: null,
        text: message,
        link: isURI(message),
        fileLink: '',
        own: true,
        info: '',
        email,
        sid: "",
        pid: "",
    };

    if (repliedPersonally) {
        messageToSave.threadId = meta.replyMessage.get("creator");
    }

    if (messageType === MESSAGE_TYPES.sticker) {
        messageToSave.type = MESSAGE_TYPES.sticker;
        messageToSave.info = meta.stickerId;
        messageToSave.m_options = meta.dimensions;
        messageToSave.text = "Sticker";
    } else if (messageType === MESSAGE_TYPES.location) {
        messageToSave.type = MESSAGE_TYPES.location;
        messageToSave.info = meta.location && `${meta.location.lat}*${meta.location.lng}`;
        messageToSave.text = "#E#F#M#";
    } else if (messageType === MESSAGE_TYPES.gif) {
        try {
            const gifBlob: any = yield call(fetchFile, meta.gif.url);
            gifThumb = yield call(getThumbnail, gifBlob);
            let thumbPath: string = "";

            if (gifThumb && gifThumb.img) {
                thumbPath = writeThumbnail(gifThumb.img, messageToSave.id);
            }

            Log.i("MESSAGE_TYPES meta = ", meta)

            messageToSave.text = "#E#F#M#";
            messageToSave.type = MESSAGE_TYPES.gif;
            messageToSave.info = thumbPath || gifThumb.img;
            messageToSave.fileRemotePath = meta.gif.id;
            messageToSave.ext = "gif";
            messageToSave.m_options = meta.gif.dimensions;
        } catch (e) {
            Log.i(e);
        }
    }

    const messageToSend: any = {
        to: messageToSave.threadId.split("/").shift(),
        author: messageToSave.creator,
        type: isGroup && !repliedPersonally ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
        msgType: messageToSave.type,
        msgText: messageToSave.text,
        msgInfo: messageToSave.info,
        repid: messageToSave.repid,
        email: messageToSave.email,
        id: messageToSave.id,
        sid: "",
        pid: "",
        imageVideoResolution: meta && meta.gif && meta.gif.dimensions && `${meta.gif.dimensions.width}x${meta.gif.dimensions.height}` || null
    };

    if (messageType === MESSAGE_TYPES.gif) {
        messageToSend.awsId = messageToSave.fileRemotePath;
        messageToSend.msgType = MESSAGE_TYPES.gif;
        messageToSend.ext = messageToSave.ext;
        messageToSend.msgInfo = gifThumb.img;
    }

    if (meta.editingMessage && !meta.stickerId && !meta.location) {
        messageToSend.msgType = MESSAGE_TYPES.edit_mgs;
        messageToSend.rel = meta.editingMessage.get("messageId") || meta.editingMessage.get("id");
        yield put(ATTEMPT_EDIT_MESSAGE(messageToSend));
    } else {
        const effects: any[] = [];
        const {threadId, info} = messageToSave;
        messageToSave.text = messageToSave.text && messageToSave.text.toString().replace(/&amp;/, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const {to, id, rel, msgText, fileSize, awsId, author, msgInfo, msgType, type, sid, pid, ext, repid = ""} = messageToSend;

        var obj = messageToSend

        if (isVideoOrImage(msgType) || msgType === MESSAGE_TYPES.stream_file) {
            if (ext && (ext === "gif" || ext === "webm")) {
                obj = {
                    fileRemotePath: awsId,
                    msgInfo: isThumbnail(info) ? msgInfo : info,
                    // msgInfo: msgType !== MESSAGE_TYPES.image ? isThumbnail(info) ? msgInfo : info : '',
                    msgText,
                    msgType,
                    repid,
                    author,
                    email,
                    type,
                    rel,
                    to,
                    id,
                    ext,
                    imageVideoResolution: meta && meta.gif && meta.gif.dimensions && `${meta.gif.dimensions.width}x${meta.gif.dimensions.height}`
                };
            } else {
                obj = {
                    fileRemotePath: awsId,
                    msgInfo: isThumbnail(info) ? msgInfo : info,
                    // msgInfo: msgType !== MESSAGE_TYPES.image ? isThumbnail(info) ? msgInfo : info : '',
                    fileSize,
                    msgText,
                    msgType: msgType === MESSAGE_TYPES.stream_file ? MESSAGE_TYPES.video : msgType,
                    repid,
                    author,
                    email,
                    type,
                    rel,
                    sid,
                    pid,
                    to,
                    id,
                    imageVideoResolution: meta && meta.gif && meta.gif.dimensions && `${meta.gif.dimensions.width}x${meta.gif.dimensions.height}`
                };
            }
        }


        let pending = new Pending(obj, currentTime, id, true, PendingMessageType.message, PendingType.none)
        PendingQueue.instance.addMessageToQueue(pending)

        Log.i("pending_messageSaga", pending)



        // messageToSend.linkTags = getLinkTags(msgText);
        // messageToSave.linkTags = messageToSend.linkTags;
        // messageToSave.link = isURI(messageToSave.text);

        if (!isUpload) {
            if (!messageToSave.repliedPersonally) {
                yield put(addMessage(messageToSave, messageToSend));
            }
            effects.push(put(attemptCreateConversation(messageToSave)));
        }

        if (msgType === MESSAGE_TYPES.sticker) {
            effects.push(put(attemptAddRecentSticker(meta.stickerId)));
        } else if (msgType === MESSAGE_TYPES.image) {
            effects.push(put(setShowSharedMedia(true)));
        } else if (meta.replyMessage) {
            effects.push(put(ATTEMPT_REPLY_MESSAGE(messageToSend)));
        }

        // if ([MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.text, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
        //     let sharedMediaType: string = SHARED_MEDIA_TYPES.LINK;
        //     if (msgType === MESSAGE_TYPES.file || msgType === MESSAGE_TYPES.voice) {
        //         sharedMediaType = SHARED_MEDIA_TYPES.FILE;
        //     } else if (msgType !== MESSAGE_TYPES.text) {
        //         sharedMediaType = SHARED_MEDIA_TYPES.MEDIA
        //     }
        //     const sharedMediaRecordsMap = {
        //         messageStatus: null,
        //         messages: messageToSave
        //     };
        //
        //     yield put(ADD_MEDIA_RECORD(sharedMediaType, sharedMediaRecordsMap, 0))
        // }

        yield all(effects);

        if (type === MESSAGE_TYPES.update_group_avatar) {
            const blob: Blob = yield call(getAWSFile, conf.app.aws.bucket.group, "GET", `${threadId.split("@").shift()}/profile/avatar`);
            yield put(attemptUpdateConversationAvatar(threadId, blob));

        } else if (type === MESSAGE_TYPES.update_group_name) {
            yield put(attemptUpdateConversationName(threadId, info));
        }

        if (messageToSave.type === MESSAGE_TYPES.text && messageToSave.link) {
            try {
                const {url, normalizedURI} = normalizeURI(messageToSave.text);
                const webContent: any = yield call(getLinkPreview, normalizedURI);
                const linkTitle: string = getWebContentTitle(webContent);
                const linkDescription: string = getWebContentDescription(webContent);
                const linkSiteURL: string = getURIOrigin(url);
                const linkImagePreviewUrl: string = getWebContentImageUrl(webContent, normalizedURI);

                yield all([
                    put(updateMessageLinkProps(messageToSave.id, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl)),
                    call(IDBMessage.update, messageToSave.id, {linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl}),
                ]);
            } catch (e) {
                Log.i("error -> e = ",  e)
            }
        }
    }
}

function* attemptCreatePending({payload: {message, messageType, meta}}) {
    const store: Store<any> = storeCreator.getStore();

    const {conversations, selectedThreadId, user} = selector(store.getState(), {
        conversations: true,
        selectedThreadId: true,
        user: true,
    });
    let contact;
    if (selectedThreadId !== "") {
        contact = yield select(contactSelector(selectedThreadId));
    }

    const selectedThread = conversations.get(selectedThreadId) ? conversations.get(selectedThreadId) : contact;
    const repliedPersonally: boolean = meta.replyMessage && meta.replyMessage.get("repliedPersonally");
    const threadType: string = selectedThread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);
    const email: string = user && user.get("email") || "";
    const currentTime: any = Date.now();
    let gifThumb: any;

    const messageToSave: any = (window as any).isRefactor ? {
        conversationId: selectedThreadId,
        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
        creator: user.get("id"),
        deleted: false,
        delivered: false,
        dislikes: 0,
        edited: false,
        email,
        fileLink: '',
        fileRemotePath: null,
        fileSize: null,
        hidden: undefined,
        info: '',
        isDelivered: false,
        isSeen: true,
        likeState: 0,
        likes: 0,
        link: isURI(message),
        linkTags: List[0],
        loadStatus: null,
        m_options: null,
        messageId: `msgId${currentTime}`,
        id: `msgId${currentTime}`,
        own: true,
        pid: undefined,
        previousMessageId: undefined,
        repid: meta.replyMessage ? meta.replyMessage.get("messageId") || meta.replyMessage.get("id") : "",
        seen: false,
        sid: undefined,
        status: false,
        text: message,
        threadId: selectedThreadId,
        time: currentTime,
        type: MESSAGE_TYPES.text,
        repliedPersonally
    } : {
        repid: meta.replyMessage ? meta.replyMessage.get("messageId") || meta.replyMessage.get("id") : "",
        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
        threadId: selectedThreadId,
        id: `msgId${currentTime}`,
        messageId: `msgId${currentTime}`,
        type: MESSAGE_TYPES.text,
        creator: user.get("id"),
        fileRemotePath: null,
        time: currentTime,
        fileSize: null,
        text: message,
        link: isURI(message),
        fileLink: '',
        own: true,
        info: '',
        email,
        sid: "",
        pid: "",
    };

    if (repliedPersonally) {
        messageToSave.threadId = meta.replyMessage.get("creator");
    }

    if (messageType === MESSAGE_TYPES.sticker) {
        messageToSave.type = MESSAGE_TYPES.sticker;
        messageToSave.info = meta.stickerId;
        messageToSave.m_options = meta.dimensions;
        messageToSave.text = "Sticker";
    } else if (messageType === MESSAGE_TYPES.location) {
        messageToSave.type = MESSAGE_TYPES.location;
        messageToSave.info = meta.location && `${meta.location.lat}*${meta.location.lng}`;
        messageToSave.text = "#E#F#M#";
    } else if (messageType === MESSAGE_TYPES.gif) {
        const gifBlob: any = yield call(fetchFile, meta.gif.url);
        gifThumb = yield call(getThumbnail, gifBlob);
        let thumbPath: string = "";

        if (gifThumb && gifThumb.img) {
            thumbPath = writeThumbnail(gifThumb.img, messageToSave.id);
        }

        messageToSave.text = "#E#F#M#";
        messageToSave.type = MESSAGE_TYPES.gif;
        messageToSave.info = thumbPath || gifThumb.img;
        messageToSave.fileRemotePath = meta.gif.id;
        messageToSave.ext = "gif";
        messageToSave.m_options = meta.gif.dimensions;
    }

    const messageToSend: any = {
        to: messageToSave.threadId.split("/").shift(),
        author: messageToSave.creator,
        type: isGroup && !repliedPersonally ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
        msgType: messageToSave.type,
        msgText: messageToSave.text,
        msgInfo: messageToSave.info,
        repid: messageToSave.repid,
        email: messageToSave.email,
        id: messageToSave.id,
        sid: "",
        pid: ""
    };

    if (messageType === MESSAGE_TYPES.gif) {
        messageToSend.awsId = messageToSave.fileRemotePath;
        messageToSend.msgType = MESSAGE_TYPES.gif;
        messageToSend.ext = messageToSave.ext;
        messageToSend.msgInfo = gifThumb.img;
    }

    if (meta.editingMessage && !meta.stickerId && !meta.location) {
        messageToSend.msgType = MESSAGE_TYPES.edit_mgs;
        messageToSend.rel = meta.editingMessage.get("messageId") || meta.editingMessage.get("id");
        return {messageToSend, messageToSave}
    } else {
        const effects: any[] = [];
        const {threadId, info} = messageToSave;
        messageToSave.text = messageToSave.text && messageToSave.text.toString().replace(/&amp;/, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const {to, id, rel, msgText, fileSize, awsId, author, msgInfo, msgType, type, sid, pid, ext, repid = ""} = messageToSend;
        let sendObj = {}
        if (isVideoOrImage(msgType) || msgType === MESSAGE_TYPES.stream_file) {
            if (ext && ext === "gif") {
                sendObj = {
                    fileRemotePath: awsId,
                    msgInfo: isThumbnail(info) ? msgInfo : info,
                    // msgInfo: msgType !== MESSAGE_TYPES.image ? isThumbnail(info) ? msgInfo : info : '',
                    msgText,
                    msgType,
                    repid,
                    author,
                    email,
                    type,
                    rel,
                    to,
                    id,
                    ext
                }
            } else {

                sendObj = {
                    fileRemotePath: awsId,
                    msgInfo: isThumbnail(info) ? msgInfo : info,
                    // msgInfo: msgType !== MESSAGE_TYPES.image ? isThumbnail(info) ? msgInfo : info : '',
                    fileSize,
                    msgText,
                    msgType: msgType === MESSAGE_TYPES.stream_file ? MESSAGE_TYPES.video : msgType,
                    repid,
                    author,
                    email,
                    type,
                    rel,
                    sid,
                    pid,
                    to,
                    id
                }
            }
        } else {
            sendObj = messageToSend
        }

        return {messageToSend: sendObj, messageToSave}
    }
}




function* attemptSendFileMessage({payload: {file, meta, blob}}) {
    const user = yield select(userSelector());
    const selectedThreadId = yield select(selectedThreadIdSelector());
    const conversations = yield select(conversationsSelector());
    const contacts = yield select(getContactsListSelector());
    const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId)

    const {voiceDuration, caption, thumb, replyingMessage, amplitudes, options, m_options} = meta;
    const username = user.get("username");
    const userId = user.get("id");

    const thread = getThread(selectedThread, username);
    const threadType = selectedThread && selectedThread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);
    const fileTypeInfo: any = file.type.split("/");
    const fileType = fileTypeInfo[0].toUpperCase();
    const fileTypeFormat = fileTypeInfo[1];

    const time = Date.now();
    const msgId = `msgId${time}`;
    const email: string = user && user.get("email");
    const repId: string = replyingMessage ? replyingMessage.get("messageId") || replyingMessage.get("id") : "";

    const homeDir = os.homedir();
    const path = (window as any).isMac ? `${homeDir}/Library/Application Support/Electron/thumbs/${msgId}.jpeg` : (window as any).isWin ? `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`: '';
    (window as any).isMac ? yield  makeMacThumb(thumb, msgId) : (window as any).isWin ? yield makeWindowsThumb(thumb, msgId) :'';
    // Todo refactor

    Log.i("attemptSendFileMessage -> 1", file)

    if (isVideoOrImage(fileType) && !file.type.includes("svg") && (SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat.toLowerCase()) || isVideo(fileType))) {
        const partialId = thread && thread.get("partialId");
        // const fileRemotePath = isPublicRoom(selectedThreadId) ? `${partialId}/${username}/${msgId}` : `${username}/${msgId}`;
        const fileRemotePath = isPublicRoom(selectedThreadId) ? `${selectedThreadId.split("@").shift()}/${username}/${msgId}` : `${userId.split("@").shift()}/${msgId}`;
        let thumbPath: string;

        if (thumb && (fileType === MESSAGE_TYPES.video || fileType === MESSAGE_TYPES.stream_file)) {
            thumbPath = writeThumbnail(thumb, msgId);
        }

        let info = fileType !== MESSAGE_TYPES.image ? voiceDuration || thumbPath || thumb : path;
        // let info = voiceDuration || thumbPath || thumb;
        const messageType: string = (fileType === MESSAGE_TYPES.video && (window as any).fs) ? MESSAGE_TYPES.stream_file
            : fileTypeFormat.toUpperCase() === MESSAGE_TYPES.gif ? MESSAGE_TYPES.gif : fileType;

        // const messageToSave: any = {
        //     type: messageType,
        //     text: (caption && caption.length) ? caption : voiceDuration || "#E#F#M#",
        //     createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
        //     threadId: selectedThreadId,
        //     info: amplitudes || info,
        //     fileSize: file.size,
        //     creator: user.get("id"),
        //     fileRemotePath,
        //     id: msgId,
        //     own: true,
        //     repid: repId,
        //     email,
        //     time,
        //     sid: "",
        //     pid: "",
        //     ext: fileTypeFormat.toUpperCase() === MESSAGE_TYPES.gif ? fileTypeFormat : null
        // };

        Log.i("fileTypeFormat ->", fileTypeFormat)

        const messageToSave: any = {
            conversationId: selectedThreadId,
            createdAt: format(time, DEFAULT_TIME_FORMAT),
            creator: user.get("id"),
            deleted: false,
            delivered: false,
            dislikes: 0,
            edited: false,
            email,
            fileLink: '',
            fileRemotePath,
            fileSize: file.size,
            hidden: undefined,
            info: amplitudes || info,
            isDelivered: false,
            isSeen: false,
            likeState: 0,
            likes: 0,
            link: false,
            linkTags: List[0],
            loadStatus: null,
            m_options: m_options || null,
            messageId: msgId,
            id: msgId,
            own: true,
            pid: '',
            previousMessageId: undefined,
            repid: repId,
            seen: false,
            sid: '',
            status: false,
            text: (caption && caption.length) ? caption : voiceDuration || "#E#F#M#",
            threadId: selectedThreadId,
            time,
            type: messageType,
            ext: (fileTypeFormat.toUpperCase() === MESSAGE_TYPES.gif || fileTypeFormat === "webm") ? fileTypeFormat : null
        };

        const message: any = {
            to: selectedThreadId.split("/").shift(),
            id: messageToSave.id || messageToSave.messageId,
            aswToSave: messageToSave.fileRemotePath,
            awsId: messageToSave.fileRemotePath,
            fileSize: messageToSave.fileSize,
            type: isGroup ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
            msgInfo: messageToSave.type !== MESSAGE_TYPES.image ? amplitudes || voiceDuration || thumb : amplitudes || voiceDuration || path,
            // msgInfo: amplitudes || voiceDuration || thumb,
            msgText: messageToSave.text,
            msgType: messageToSave.type,
            email: email,
            author: username,
            sid: "",
            pid: ""
        };

        Log.i("attemptSendFileMessage -> 2", file)


       yield put(UPLOAD_REQUEST({message, messageToSave}, file));

    } else {
        const index: number = file.name.lastIndexOf(".");
        const ext: any = fileTypeInfo[1];
        let fileName: string;
        let fileType: string;
        let msgType: string;
        let msgInfo: string;

        if (index !== -1) {
            [fileName, fileType] = [file.name.slice(0, index), file.name.slice(index + 1)];

        } else {
            fileName = file.name;
            fileType = blob ? "zip" : mime.extension(file.type);
        }

        // const awsLink: string = thread.get("partialId") ?
        //     `${thread.get("partialId")}/${user.get("username")}/${msgId}` :
        //     `${user.get("username")}/${msgId}`;
        const fileRemotePath = isPublicRoom(selectedThreadId) ? `${selectedThreadId.split("@").shift()}/${username}/${msgId}` : `${userId.split("@").shift()}/${msgId}`;
        const extList: string[] = ["flac", "m4a", "ogv", "ogm", "opus", "webm", "mpeg", "wav", "x-m4a", "aac"];

        if (fileTypeInfo[0] === "audio"
            && extList.includes(ext) && voiceDuration) {
            msgType = AUDIO_MIME_TYPE.toUpperCase();
            msgInfo = JSON.stringify({
                fileSize: file.size,
                fileName,
                fileType
            });
        } else {
            msgType = "FILE";
            msgInfo = JSON.stringify({
                fileSize: file.size,
                fileName,
                fileType
            });
        }

        // const messageToSave: any = {
        //     createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
        //     threadId: selectedThreadId,
        //     text: voiceDuration || "#E#F#M#",
        //     info: amplitudes || voiceDuration || msgInfo,
        //     fileRemotePath: awsLink,
        //     creator: user.get("id"),
        //     fileSize: file.size,
        //     type: msgType,
        //     repid: repId,
        //     time: time,
        //     id: msgId,
        //     email,
        //     own: true,
        //     sid: "",
        //     pid: "",
        // };

        const messageToSave: any = {
            conversationId: selectedThreadId,
            createdAt: format(time, DEFAULT_TIME_FORMAT),
            creator: user.get("id"),
            deleted: false,
            delivered: false,
            dislikes: 0,
            edited: false,
            email,
            fileLink: '',
            // fileRemotePath: awsLink,
            fileRemotePath,
            fileSize: file.size,
            hidden: undefined,
            info: amplitudes || voiceDuration || msgInfo,
            isDelivered: false,
            isSeen: false,
            likeState: 0,
            likes: 0,
            link: false,
            linkTags: List[0],
            loadStatus: null,
            m_options: null,
            messageId: msgId,
            id: msgId,
            own: true,
            pid: '',
            previousMessageId: undefined,
            repid: repId,
            seen: false,
            sid: '',
            status: false,
            text: voiceDuration || "#E#F#M#",
            threadId: selectedThreadId,
            time,
            type: msgType,
        };

        const message: any = {
            to: selectedThreadId.split("/").shift(),
            id: messageToSave.id || messageToSave.messageId,
            aswToSave: messageToSave.fileRemotePath,
            awsId: messageToSave.fileRemotePath,
            fileSize: messageToSave.fileSize,
            type: isGroup ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
            msgInfo: messageToSave.info,
            msgText: messageToSave.text,
            msgType: messageToSave.type,
            email: email,
            author: username,
            sid: "",
            pid: ""
        };

        Log.i("attemptSendFileMessage -> 3", file)

        yield put(UPLOAD_REQUEST({message, messageToSave}, blob || file));

    }
}

function* attemptSendContact({payload: {id, replyMessage, numbers, name}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId, savedContacts, selectedThread} = selector(store.getState(), {
        user: true,
        savedContacts: true,
        selectedThread: true,
        selectedThreadId: true
    });
    const threadIsEmpty = selectedThread.get("threads").isEmpty();


    const userEmail: string = user && user.get("email");
    const msgInfo: Array<any> = [];
    const contactInfo: any = savedContacts.getIn([id, "members", id]);
    const email: any = contactInfo.get("email");
    const phone: any = contactInfo.get("phone");
    const avatar: Blob = contactInfo.get("avatar");
    const avatarThumb: any = avatar ? yield call(getThumbnail, avatar) : "";
    const time: any = Date.now();
    const msgId: string = `msgId${time}`;

    if (contactInfo.get("numbers") && contactInfo.get("numbers").size > 0) {
        contactInfo.get("numbers").map(number => {
            const numberId: any = `${number}@${SINGLE_CONVERSATION_EXTENSION}`;
            const numberInfo: any = savedContacts.getIn([numberId, "members", numberId]);
            const phone: any = numberInfo.get("phone");
            msgInfo.push({
                email: email || "",
                fullNumber: phone,
                number: phone,
                numbers: numbers,
                type: "mobile",
                zangi: numberInfo.get("isProductContact"),
            });
        });
    } else {
        msgInfo.push({
            email: email || "",
            fullNumber: phone,
            number: phone,
            type: "mobile",
            zangi: contactInfo.get("isProductContact"),
        });
    }
    const info = JSON.stringify(msgInfo);
    // const messageToSave: any = {
    //     createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
    //     type: MESSAGE_TYPES.contact_with_info,
    //     text: name,
    //     info: info,
    //     threadId: selectedThreadId,
    //     creator: user.get("id"),
    //     id: `msgId${Date.now()}`,
    //     fileSize: null,
    //     time: Date.now(),
    //     email: userEmail,
    //     own: true,
    //     repid: replyMessage ? replyMessage.get("messageId") ? replyMessage.get("messageId") : replyMessage.get("id") : "",
    //     m_options: avatarThumb,
    // };

    const messageToSave: any = {
        conversationId: selectedThreadId,
        createdAt: format(time, DEFAULT_TIME_FORMAT),
        creator: user.get("id"),
        deleted: false,
        delivered: false,
        dislikes: 0,
        edited: false,
        email: userEmail,
        fileLink: '',
        fileRemotePath: null,
        fileSize: null,
        hidden: undefined,
        info,
        isDelivered: false,
        isSeen: false,
        likeState: 0,
        likes: 0,
        link: false,
        linkTags: List[0],
        loadStatus: null,
        m_options: avatarThumb,
        messageId: msgId,
        id: msgId,
        own: true,
        pid: '',
        previousMessageId: undefined,
        repid: replyMessage ? replyMessage.get("messageId") ? replyMessage.get("messageId") : replyMessage.get("id") : "",
        seen: false,
        sid: '',
        status: false,
        text: name,
        threadId: selectedThreadId,
        time,
        type: MESSAGE_TYPES.contact_with_info,
    };

    const message: any = {
        to: selectedThreadId.split("/").shift(),
        author: user.get("username"),
        type: XML_MESSAGE_TYPES.chat,
        msgType: messageToSave.type,
        msgText: messageToSave.text,
        msgInfo: messageToSave.info,
        email: messageToSave.email,
        id: messageToSave.id
    };

    if (!threadIsEmpty && selectedThreadId.includes(GROUP_CONVERSATION_EXTENSION)) {
        message.type = XML_MESSAGE_TYPES.group;
    }

    yield put(SEND_MESSAGE(message, messageToSave));

    if (replyMessage) {
        message.repid = messageToSave.repid;
        attemptReplyMessage(message);
    }
}


// refactored


function* FETCH_MESSAGES_HANDLER({payload: {threadId, messageId = null, toTopDirection = false}}: any): any {
    try {

        let currentMessageId: string = "";
        let unreadMessagesCount: number = 0;

        if (toTopDirection) {
            currentMessageId = messageId;
        } else {
            const unreadMessages: { count: number, firstId: string } = yield select(conversationUnreadMessageSelector(threadId));
            if (unreadMessages) {
                if (unreadMessages.count > MESSAGES_LIMIT) {
                    if (unreadMessages.firstId !== "") {
                        currentMessageId = unreadMessages.firstId
                    }
                }

                unreadMessagesCount = unreadMessages.count;
            }
        }

        const selectedMessages: {
            messagesMap: { [key: string]: IMessage },
            unreadMessageIds: string[]
        } = yield call(IDBMessage.selectMessages, {
            threadId,
            messageId: currentMessageId,
            toTopDirection
        });

        if (selectedMessages) {
            const messagesMap: { [key: string]: IMessage } = selectedMessages.messagesMap;
            yield put(FETCH_MESSAGES_SUCCEED(messagesMap, toTopDirection, unreadMessagesCount));

            if (selectedMessages.unreadMessageIds && selectedMessages.unreadMessageIds.length > 0) {
                const privacy: any = yield select(privacySelector());

                yield put(CONVERSATION_UNREAD_MESSAGES_UPDATE(threadId, selectedMessages.unreadMessageIds));
                if (privacy.get("showSeenStatus")) {
                    yield put(MESSAGES_SEEN_SEND(threadId, selectedMessages.unreadMessageIds));
                }
            }
        }


    } catch (e) {
        Log.i("###############FETCH_MESSAGES_HANDLER##################");
        Log.i(e);
        Log.i("###############FETCH_MESSAGES_HANDLER##################");
    }

}

function* UPDATE_MESSAGE_PROP_HANDLER({payload: {msgId, property, value}}: IMessagesActions) {
    try {
        const message = yield select(messageSelector(msgId));
        const msgType: string = message.get("type");
        if ([MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
            let sharedMediaType: string = "";
            if (msgType === MESSAGE_TYPES.file || msgType === MESSAGE_TYPES.voice) {
                sharedMediaType = SHARED_MEDIA_TYPES.FILE;
            } else {
                sharedMediaType = SHARED_MEDIA_TYPES.MEDIA
            }

            yield put(UPDATE_MEDIA_RECORD(sharedMediaType, msgId, property, value))
        }
    } catch (e) {
        logger(e)
    }
}

function* BULK_UPDATE_MESSAGE_PROPS_HANDLER({payload: {messages}}: IMessagesActions) {
    try {
        const effects: any[] = [];
        const sharedMedia = yield select(sharedMediaSelector());
        for (const element of messages) {
            const message = yield select(messageSelector(element.msgId || element.messageId || element.id));
            const msgType: string = message.get("type");
            if ([MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(msgType)) {
                let sharedMediaType: string = "";
                if (msgType === MESSAGE_TYPES.file || msgType === MESSAGE_TYPES.voice) {
                    sharedMediaType = SHARED_MEDIA_TYPES.FILE;
                } else {
                    sharedMediaType = SHARED_MEDIA_TYPES.MEDIA
                }
                const messageId = message.get('msgId') || message.get('id')

                if (sharedMedia.getIn(["types", sharedMediaType, "records", messageId])) {
                    effects.push(put(UPDATE_MEDIA_RECORD(sharedMediaType, messageId, element.property, element.value)));
                }
            }
        }

        yield all(effects)
    } catch (e) {
        logger(e)
    }
}


function* SEND_FILE_MESSAGE_HANDLER({payload: {file, meta, blob}}) {
    try {
        const user: any = yield select(userSelector());
        const selectedThread: any = yield select(selectedThreadSelector());
        const selectedThreadId: any = yield select(selectedThreadIdSelector());

        const {voiceDuration, caption, thumb, replyingMessage, amplitudes, options} = meta;
        const username: string = user && user.get("username");
        const thread: any = getThread(selectedThread, username);
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const fileTypeInfo: any = file.type.split("/");
        const fileType = fileTypeInfo[0].toUpperCase();
        const fileTypeFormat = fileTypeInfo[1];
        const time = Date.now();
        const msgId = `msgId${time}`;
        const email: string = user && user.get("email");
        const repId: string = replyingMessage ? replyingMessage.get("messageId") || replyingMessage.get("id") : "";
        const partialId: any = thread.get("partialId");
        let fileToUplaod: any = file;

        const messageToSave: any = {
            conversationId: selectedThreadId,
            createdAt: format(time, DEFAULT_TIME_FORMAT),
            creator: user.get("id"),
            deleted: false,
            delivered: false,
            dislikes: 0,
            edited: false,
            email,
            fileLink: '',
            fileRemotePath: null,
            fileSize: file.size,
            hidden: undefined,
            info: '',
            isDelivered: false,
            isSeen: false,
            likeState: 0,
            likes: 0,
            link: false,
            linkTags: List[0],
            loadStatus: null,
            m_options: options || null,
            messageId: msgId,
            id: msgId,
            own: true,
            pid: '',
            previousMessageId: undefined,
            repid: repId,
            seen: false,
            sid: '',
            status: false,
            text: '',
            threadId: selectedThreadId,
            time,
            type: '',
            ext: ''
        };

        const message: any = {
            to: selectedThreadId.split("/").shift(),
            id: messageToSave.id || messageToSave.messageId,
            fileSize: messageToSave.fileSize,
            type: isGroup ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
            email,
            author: username,
            sid: "",
            pid: ""
        };

        if (isVideoOrImage(fileType) && !file.type.includes("svg") && (SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat.toLowerCase()) || isVideo(fileType))) {
            const fileRemotePath: any = isPublicRoom(selectedThreadId) ? `${partialId}/${username}/${msgId}` : `${username}/${msgId}`;
            const thumbPath: string = thumb && isVideoStreamOrImage(fileType) ? writeThumbnail(thumb, msgId) : '';
            const info: any = voiceDuration || thumbPath || thumb;
            const messageType: string = (fileType === MESSAGE_TYPES.video && (window as any).fs) ? MESSAGE_TYPES.stream_file
                : fileTypeFormat.toUpperCase() === MESSAGE_TYPES.gif ? MESSAGE_TYPES.gif : fileType;

            messageToSave.fileRemotePath = fileRemotePath;
            messageToSave.info = amplitudes || info;
            messageToSave.text = caption && caption.length ? caption : voiceDuration || "#E#F#M#";
            messageToSave.type = messageType;
            messageToSave.ext = fileTypeFormat.toUpperCase() === MESSAGE_TYPES.gif ? fileTypeFormat : null;

            message.aswToSave = fileRemotePath;
            message.awsId = fileRemotePath;
            message.msgInfo = amplitudes || voiceDuration || thumb;
            message.msgText = messageToSave.text;
            message.msgType = messageType;

        } else {
            const index: number = file.name.lastIndexOf(".");
            const ext: any = fileTypeInfo[1];
            let fileName: string;
            let fileType: string;
            let msgType: string;
            let msgInfo: string;

            if (index !== -1) {
                [fileName, fileType] = [file.name.slice(0, index), file.name.slice(index + 1)];

            } else {
                fileName = file.name;
                fileType = blob ? "zip" : mime.extension(file.type);
            }

            const awsLink: string = thread.get("partialId") ?
                `${thread.get("partialId")}/${username}/${msgId}` :
                `${username}/${msgId}`;


            if (fileTypeInfo[0] === "audio"
                && VIDEO_EXT_LIST.includes(ext) && voiceDuration) {
                msgType = AUDIO_MIME_TYPE.toUpperCase();
                msgInfo = JSON.stringify({
                    fileSize: file.size,
                    fileName,
                    fileType
                });
            } else {
                msgType = "FILE";
                msgInfo = JSON.stringify({
                    fileSize: file.size,
                    fileName,
                    fileType
                });
            }

            messageToSave.fileRemotePath = awsLink;
            messageToSave.info = amplitudes || voiceDuration || msgInfo;
            messageToSave.text = voiceDuration || "#E#F#M#";
            messageToSave.type = msgType;

            message.aswToSave = awsLink;
            message.awsId = awsLink;
            message.msgInfo = messageToSave.info;
            message.msgText = messageToSave.text;
            message.msgType = msgType;

            fileToUplaod = blob || file;
        }

        yield put(UPLOAD_REQUEST({message, messageToSave}, fileToUplaod));

    } catch (e) {
        Log.i('#########SEND_FILE_MESSAGE_HANDLER ERROR#########');
        Log.i(e);
        Log.i('#########SEND_FILE_MESSAGE_HANDLER ERROR#########');
    }

}

function* MESSAGES_SEEN_SEND_HANDLER({payload: {threadId, messageIds}}) {
    try {
        yield fork(MESSAGES_BULK_SEND_SEEN, messageIds, threadId);
        yield call(IDBMessage.updateMessageSelfSeen, messageIds);
        yield put(MESSAGES_SEEN_SEND_SUCCEED(messageIds));

    } catch (e) {
        Log.i("###############MESSAGES_SEEN_SEND_HANDLER ERROR##################");
        Log.i(e);
        Log.i("###############MESSAGES_SEEN_SEND_HANDLER ERROR##################");
    }
}

export function* MESSAGES_BULK_SEND_SEEN(messageIds: string[], threadId: string) {
    try {
        const username: string = yield select(userNameSelector());
        const connection: any = connectionCreator.getConnection();
        const requests: { [key: string]: IRequest } = {};
        const isGroup: boolean = threadId.startsWith('gid');
        const creator: string = threadId.split("@").shift();
        let to: string = threadId.split("@").shift();

        const roomId: string = isGroup ? to : "";
        to = conf.app.prefix + getUserId(creator);

        for (const messageId of messageIds) {
            const id: string = messageId;
            const msgId: string = `displayed${id}`;

            requests[id] = {
                id,
                xmlBuilder: "messageSeenXML",
                params: {msgId, id, to, author: username, isGroup},
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };
        }

        yield put(REQUESTS_SEND(requests));

        for (const messageId of messageIds) {
            const id: string = messageId;
            const msgId: string = `displayed${id}`;

            if (!creator && username === creator) {
                return;
            }

            const msg: Strophe.Builder = messageSeenXML({msgId, to, id, roomId, isE2ESupport: "0"});

            if (connection.connected) {
                writeLog(LOG_TYPES.send_status, {
                    msgId,
                    id,
                    isGroup,
                    creator,
                    to,
                    status: "seen"
                });
                connection.send(msg);
            }
        }


    } catch (e) {
        Log.i("###############MESSAGES_BULK_SEND_SEEN##################");
        Log.i(e);
        Log.i("###############MESSAGES_BULK_SEND_SEEN##################");
    }
}

function* receiveMessageHandler({payload: {message, meta}}) {
    Log.i("receive message handler");
    try {
        const store: Store<any> = storeCreator.getStore();
        const {
            app: {
                isFocused
            },
            showConference
        } = selector(store.getState(), {app: true});
        const selectedThreadId: string = yield select(selectedThreadIdSelector());
        const trimmedSelectedThreadId = selectedThreadId ? selectedThreadId.trim() : '';
        const privacy: any = yield select(privacySelector());
        const username: any = yield select(userNameSelector());
        const lastCall: any = yield select(getLastCallSelector());
        const contacts: any = yield select(getContactsListSelector());
        const minimized: boolean = yield select(minimizedSelector());
        const showChat: boolean = yield select(showChatSelector());

        const alias: any = meta.alias;
        const showNotification: any = meta.showNotification;
        const isGroup: boolean = meta.isGroup || false;
        const messageId: string = message.id;
        const threadId: string = message.threadId ? message.threadId.trim(): '';

        let isMessageExist: boolean = false;
        let seenSent: boolean = false;
        let gifThumb: any;

        Log.i("receiveMessageHandler -> message 1", message)
        Log.i("receiveMessageHandler -> meta = ", meta)
        Log.i("conference -> trimmedSelectedThreadId = 1", trimmedSelectedThreadId)

        if (trimmedSelectedThreadId === threadId) {
            const messages: any = yield select(newMessagesSelector());
            const unreadMessagesCount: number = yield select(unreadMessagesCountSelector());
            if (!messages.get(messageId)) {
                if ((window as any).isRefactor) {
                    if (unreadMessagesCount === 0) {
                        Log.i("receiveMessageHandler -> message 2", message)
                        yield put(addMessage(message));
                    }
                } else {
                    Log.i("receiveMessageHandler -> message 3", message)
                    yield put(addMessage(message));
                }
            } else {
                Log.i("EXISTS OR OWN MESSAGE");
                writeLog(LOG_TYPES.singleChat, {
                    ...message,
                    reason: "exists or own message",
                    msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(message.msgType) ? "" : message.msgInfo
                });

                isMessageExist = true;
            }

            // if (document.hasFocus() && !(lastCall && lastCall.size > 0 && !minimized && !showChat)) {

            // Removed commit #######
            if (!(lastCall && lastCall.size > 0 && !minimized && !showChat)) {
                Log.i("isFocused -> ", isFocused)
                seenSent = isFocused ? true : false;
            //     if (privacy.get("showSeenStatus")) {
            //         const to: string = isGroup ? getPartialId(meta.from) : trimmedSelectedThreadId.split("@").shift();
            //         if ((window as any).isRefactor) {
            //             if (unreadMessagesCount === 0) {
            //                 yield put(SEND_MESSAGE_SEEN(to, message.id, username, isGroup, alias))
            //             }
            //         } else {
            //             yield put(SEND_MESSAGE_SEEN(to, message.id, username, isGroup, alias))
            //         }
            //
            //     }
            }

        } else {
            const message: any = yield call(IDBMessage.getMessageById, messageId);

            if (message) {
                isMessageExist = true;
                Log.i("EXISTS OR OWN MESSAGE");
                writeLog(LOG_TYPES.singleChat, {
                    ...message,
                    reason: "exists or own message",
                    msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(message.msgType) ? "" : message.msgInfo
                });
            }
        }
        if (!isGroup) {
            yield put(applicationStopTyping(threadId, alias));
        }
        if (!isMessageExist) {
            Log.i("receiveMessageHandler -> message 4", message)
            yield put(attemptCreateConversation(message, false, seenSent, showNotification));
            let showNotificationCondition: boolean = trimmedSelectedThreadId !== threadId || lastCall && lastCall.size > 0 && !minimized && !showChat;
            let creator: any = message.creator;

            Log.i("receiveMessageHandler -> minimized =", document.hasFocus())

            if (isGroup) {
                showNotificationCondition = trimmedSelectedThreadId !== threadId && !message.creator.includes(username) || (lastCall && lastCall.size > 0 && !minimized && !showChat && !showConference);
                creator = getUserId(alias);
            }

            Log.i("conference -> showNotificationCondition = 1", trimmedSelectedThreadId !== threadId && !message.creator.includes(username))
            Log.i("conference -> hasFocus = ", document.hasFocus())
            Log.i("conference -> trimmedSelectedThreadId = 2", trimmedSelectedThreadId)

            if (!document.hasFocus() || showNotificationCondition) {
                const text = getNotificationText(message, getMessageText.bind(
                    this, fromJS(message), contacts, username, true)
                );
                // if (showNotificationCondition) {
                    showNotification(text, creator, threadId);
                // }
            }
        }

    } catch (e) {
        Log.i('#######RECEIVE_MESSAGE_HANDLER ERROR#######');
        Log.i(e);
        Log.i('#######RECEIVE_MESSAGE_HANDLER ERROR#######');
    }
}

function* messagesSaga(): any {

    // refactored
    yield takeEvery(actions.FETCH_MESSAGES, FETCH_MESSAGES_HANDLER);
    yield takeEvery(actions.MESSAGES_SEEN_SEND, MESSAGES_SEEN_SEND_HANDLER);
    yield takeEvery(actions.SEND_FILE_MESSAGE, SEND_FILE_MESSAGE_HANDLER);
    yield takeEvery(actions.RECEIVE_MESSAGE, receiveMessageHandler);
    // refactored end

    yield takeEvery(actions.ATTEMPT_SEND_FORWARD_MESSAGE, attemptSendForwardMessage);
    yield takeEvery(actions.MESSAGE_DELIVERED_TO_RECEIVER, messageDeliveredToReceiver);
    yield takeEvery(actions.MESSAGE_DELIVERED_TO_RECEIVER_SERVICE, messageDeliveredToReceiverService);
    yield takeEvery(actions.MESSAGE_CALL_TO_RECEIVER, messageCallToReceiver);
    yield takeEvery(actions.MESSAGE_DISPLAYED_TO_RECEIVER, messageDisplayedToReceiver);
    yield takeEvery(actions.MESSAGE_DISPLAYED_TO_RECEIVER_SERVICE, messageDisplayedToReceiverService);
    yield takeEvery(actions.MESSAGE_DELIVERED_TO_SERVER, messageDeliveredToServer);
    yield takeEvery(actions.ATTEMPT_CREATE_MESSAGE, attemptCreateNewMessage);
    yield takeEvery(actions.ATTEMPT_SET_IMAGE_AMAZON_LINK, attemptSetAmazonLink);
    yield takeLatest(actions.ATTEMPT_SEARCH_MESSAGES, attemptSearchMessages);
    yield takeEvery(actions.ATTEMPT_SHOW_SEARCHED_MESSAGE, attemptShowSearchedMessage);
    yield takeEvery(actions.ATTEMPT_SHOW_MORE_SEARCH_MESSAGES, attemptShowMoreSearchMessages);
    yield takeEvery(actions.ATTEMPT_GET_SCROLL_DOWN_MESSAGES, attemptGetScrollDownMessages);
    yield takeEvery(actions.ATTEMPT_SHOW_CALENDAR_MESSAGES, attemptShowCalendarMessages);
    yield takeEvery(actions.ATTEMPT_DELETE_MESSAGE, attemptDeleteMessage);
    yield takeEvery(actions.SEND_CARBON_ENABLING_XML, sendCarbonEnabling);
    yield takeEvery(actions.ATTEMPT_OPTIMISE_VIDEO, attemptOptimiseVideo);
    yield takeEvery(actions.ATTEMPT_REPLY_MESSAGE, attemptReplyMessage);
    yield takeEvery(actions.ATTEMPT_EDIT_MESSAGE, attemptEditMessage);
    yield takeEvery(actions.ATTEMPT_GET_MESSAGES, attemptGetMessages);
    yield takeEvery(actions.ATTEMPT_ADD_MESSAGE, attemptAddMessage);
    yield takeEvery(actions.MESSAGE_LOCAL_DELETE, messageLocalDelete);
    yield takeEvery(actions.DOWNLOAD_FILE, attemptDownloadFile);
    yield takeEvery(actions.SEND_MESSAGE_SEEN, sendMessageSeen);
    yield takeEvery(actions.UPLOAD_REQUEST, uploadRequest);
    yield takeEvery(actions.ADD_MESSAGE, addMessageDB);
    yield takeEvery(actions.SEND_MESSAGE, sendMessage);

    yield takeEvery(actions.ATTEMPT_SEND_CONTACT, attemptSendContact);
    yield takeEvery(actions.ATTEMPT_SEND_MESSAGE, attemptSendMessage);
    yield takeEvery(actions.ATTEMPT_SEND_FILE_MESSAGE, attemptSendFileMessage);
    yield takeEvery(actions.BULK_UPDATE_MESSAGE_PROPS, BULK_UPDATE_MESSAGE_PROPS_HANDLER);
    yield takeLatest(actions.UPDATE_MESSAGE_PROP, UPDATE_MESSAGE_PROP_HANDLER);


    yield watchForFileUpload();


}

export default messagesSaga;
