"use strict";

import {Store} from "react-redux";
import format from "date-fns/format";
import {fromJS, List, Map} from "immutable";
import {all, call, delay, fork, put, select, take, takeEvery, takeLatest} from "redux-saga/effects";

import {
    addMessage,
    attemptDeleteMessage,
    attemptEditMessage,
    receiveMessage,
} from "modules/messages/MessagesActions";
import {
    getEmailFromUsername,
    getInitials,
    getUserId,
    getUsername,
    isDeleted,
    isEdited,
    isLeaveJoinRemove,
    isNetworkAction,
    isVideoStreamOrImage,
    writeThumbnail
} from "helpers/DataHelper";
import {
    ADD_MEDIA_RECORD,
    addMemberSelectedThread,
    attemptDisableGroup,
    attemptRemoveMemberSelectedThread,
    sendXMLReceived, UPDATE_MEDIA_RECORD
} from "modules/application/ApplicationActions";
import {
    addConversationMember,
    attemptCreateConversation,
    attemptUpdateConversationAvatar,
    attemptUpdateConversationName, updateConversationAvatar, updateConversationProps
} from "modules/conversations/ConversationsActions";
import {
    CALL_STATUSES,
    DEFAULT_TIME_FORMAT, DIFF_TIME,
    FILE_MESSAGES_TYPES,
    MESSAGE_TYPES,
    RESOLUTION_SEPARATOR, SHARED_MEDIA_TYPES,
    SYSTEM_MESSAGE_NUMBER
} from "configs/constants";
import {GROUP_CONVERSATION_EXTENSION, RECEIPTS_REQUEST_XMLNS, SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {actions as APPLICATION_ACTIONS} from "../application/ApplicationReducer";
import {actions as GROUP_ACTIONS} from "../groups/GroupsReducer";
import {attemptNetworkHandler} from "modules/networks/NetworksActions";
import {attemptCreateContact, updateContactAvatar,} from "modules/contacts/ContactsActions";
import IDBConversation from "services/database/class/Conversation";
import {attemptCreateGroups} from "modules/groups/GroupsActions";
import {actions, IHandlersActions} from "./HandlersActions";
import {userNameSelector} from "modules/user/UserSelector";
import IDBContact from "services/database/class/Contact";
import {sanitizeByPrefix} from "filters/ContactFilter";
import storeCreator from "helpers/StoreHelper";
import {getAWSFile} from "requests/fsRequest";
import {getColor} from "helpers/AppHelper";
import conf from "configs/configurations";
import selector from "services/selector";
import {isURI} from "helpers/DomHelper";
import {MessagingService} from "modules/messages/MessagingService";
import Log from "modules/messages/Log";
import {attemptRetrieveFile, getBlobUri} from "helpers/FileHelper";
import ContactsModel from "modules/contacts/ContactsModel";
import {ImageManager} from "helpers/ImageHelper";
import {conferenceHandler} from "xmpp/handlers";

function* groupMessageHandler({payload: {message, showNotification}}: IHandlersActions): any {
    const store: Store<any> = storeCreator.getStore();
    const selectorVariables: any = {
        blockedContactNumbers: true,
        synced: true,
        user: true,
        conferenceDetails: true
    };
    const {user, blockedContactNumbers, synced, conferenceDetails} = selector(store.getState(), selectorVariables);

    Log.i("groupMessageHandler -> showNotification = ", showNotification)
    const conferenceBool = [
        MESSAGE_TYPES.room_call_current_members,
        MESSAGE_TYPES.room_call_ringing,
        MESSAGE_TYPES.room_call_hold,
        MESSAGE_TYPES.room_call_decline,
        MESSAGE_TYPES.room_call_join,
        MESSAGE_TYPES.room_call_leave,
        MESSAGE_TYPES.room_call_start,
        MESSAGE_TYPES.room_call_end
    ].includes(message.msgType)

    if (conferenceBool) {
        Log.i("conference -> groupMessageHandler -> message = ", message)
        Log.i("conference -> conferenceDetails -> callId = ", conferenceDetails.get("callId"))
        const messageInfo: any = JSON.parse(message.msgInfo)
        const callId: string = messageInfo.callId
        const userId: string = user.get("id")
        // if(
        //     callId !== conferenceDetails.get("callId") &&
        //     conferenceDetails.getIn(["statuses", userId]) === CALL_STATUSES.join ||
        //     conferenceDetails.getIn(["statuses", userId]) === CALL_STATUSES.calling
        // ) {
        //
        // } else {
        //     conferenceHandler(message)
        // }
        conferenceHandler(message)
    }

    if (
        message.msgType === MESSAGE_TYPES.room_call_ringing ||
        message.msgType === MESSAGE_TYPES.room_call_join ||
        message.msgType === MESSAGE_TYPES.room_call_leave
    ) {
        return
    }

    const diffTime: number = +localStorage.getItem(DIFF_TIME);
    const delayExists: boolean = message.delay && message.delay.stamp;
    const delayTime: number = delayExists && new Date(message.delay.stamp).getTime();


    let {conversations, contacts} = selector(store.getState(), {conversations: true, contacts: true});
    // const groupsSynced = synced.get("groups");
    let infoNumber: string;

    // if (!groupsSynced && message.from && message.from.includes("gid")) {
    //     yield take(APPLICATION_ACTIONS.GROUPS_SYNC_SUCCESS);
    //
    //     const store: Store<any> = storeCreator.getStore();
    //     conversations = selector(store.getState(), {conversations: true}).conversations;
    // }

    const senderCredentials = sanitizeByPrefix(conf.app.prefix, {to: message.to, alias: message.alias});
    const username: string = user.get("username");

    if (senderCredentials) {
        message.alias = senderCredentials.alias;
        message.to = senderCredentials.to;
    }

    const {to, from, msgType, msgInfo, body, id, rel, request, repid, ext, fileRemotePath, resolution, imageVideoResolution} = message;
    const senderUsername = getUsername(from);
    const senderId = getUserId(senderUsername);
    let {alias} = message;


    if (message.avatarHash && contacts.getIn([senderId, "members", senderId, "avatarHash"]) !== message.avatarHash) {
        const updatedThread: any = {};
        const avatar =  yield call(attemptRetrieveFile, {
            bucket: conf.app.aws.bucket.profile,
            key: `${senderUsername}/avatar`
        })
        const avatarHash = message.avatarHash
        const avatarBlobUrl = avatar && (window as any).URL.createObjectURL(avatar)

        updatedThread["threadId"] = senderId;
        updatedThread["avatar"] = avatar;
        updatedThread["image"] = avatar;
        updatedThread["imageHash"] = message.avatarHash;
        yield put(updateConversationAvatar(senderId, avatar, avatarHash));
        yield put(updateContactAvatar(senderId, avatar, avatarHash));
        yield fork(ContactsModel.updateContactAvatar, updatedThread)
    }

    let fromStr = from && from.split("/")[1]

    if (msgType && [MESSAGE_TYPES.leave_group, MESSAGE_TYPES.remove_from_group, MESSAGE_TYPES.join_group].includes(msgType) && alias === username) {
        alias = getUsername(fromStr);
        //fixes message own bug on remove
    }


    if (!alias && from) {
        alias = getUsername(from);
    }

    Log.i("msgType -> ", msgType)
    Log.i("alias -> ", alias)
    if (msgType && alias) {
        const threadId: string = from && `${from.split("/").shift()}/${username}`;
        let thumbPath: string;

        alias = conf.app.prefix ? getUsername(alias) : alias;


        if (!conversations || !conversations.get(threadId)) {
            let conversation = yield call(IDBConversation.getThread, threadId);
            conversation = fromJS(conversation);
            if (!conversation) {
                yield put(attemptCreateGroups([threadId.split("@").shift()]));
                yield take(({payload, type}) => type === GROUP_ACTIONS.GROUP_CREATED && payload.groupId === threadId);
            }
        }

        if (request && request.xmlns && request.xmlns === RECEIPTS_REQUEST_XMLNS) {
            yield put(sendXMLReceived({from: to.split("/").shift(), id, to: from}));
        }

        if (msgInfo && isVideoStreamOrImage(msgType.toUpperCase())) {
            thumbPath = writeThumbnail(msgInfo, id);
        }

        let options = {}
        if (resolution) {
            const dimensions: any = resolution.split(RESOLUTION_SEPARATOR);
            if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {
                options = {
                    width: +dimensions[0],
                    height: +dimensions[1],
                }
            }
        } else if (imageVideoResolution) {
            const dimensions: any = imageVideoResolution.split(RESOLUTION_SEPARATOR);

            if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {
                const optimalSize = ImageManager.optimalSize({
                    toSaveWidth: 300,
                    toSaveHeight: 300,
                    maxWidth: 350,
                    maxHeight: 400,
                    originalWidth: +dimensions[0],
                    originalHeight: +dimensions[1],
                    video: false
                })
                options = {
                    width: optimalSize.width,
                    height: optimalSize.height,
                }
            }
        }
        const _time: number = delayExists && delayTime ? delayTime + diffTime : Date.now();
        const receivedMessage: any = {
            conversationId: from && `${from.split("/").shift()}/${username}`,
            createdAt: format(_time, DEFAULT_TIME_FORMAT),
            creator: senderId,
            deleted: false,
            delivered: false,
            dislikes: 0,
            edited: false,
            email: '',
            fileLink: '',
            fileRemotePath: (FILE_MESSAGES_TYPES.includes(msgType) && from) ? `${from.split("@").shift()}/${alias}/${id}` : '',
            fileSize: null,
            hidden: undefined,
            info: thumbPath || msgInfo,
            isDelivered: false,
            isSeen: false,
            likeState: 0,
            likes: 0,
            linkTags: List[0],
            link: isURI(body),
            loadStatus: null,
            m_options: options,
            messageId: id,
            id,
            own: alias === username,
            pid: undefined,
            previousMessageId: undefined,
            repid: repid || "",
            seen: false,
            sid: undefined,
            status: false,
            text: body && body.replace(/&amp;/, "&"),
            ext,
            threadId: threadId,
            time: _time,
            type: msgType,
        };

        if (ext === "gif") {
            receivedMessage.type = MESSAGE_TYPES.gif;
            receivedMessage.fileRemotePath = fileRemotePath;
        }


        if (isLeaveJoinRemove(receivedMessage.type)) {
            receivedMessage.info = msgInfo.includes("|") ? msgInfo.split("|")[0] : getUsername(receivedMessage.info);
            receivedMessage.text = '';
            infoNumber = getUsername(receivedMessage.info);
        }

        if (isDeleted(msgType)
            // && !message.to.includes(username)
        ) {
            // if (!message.to.includes(username)) {
                yield put(attemptDeleteMessage(rel, message, true));
            // }
            return true;
        } else if (isEdited(msgType)) {
            yield put(attemptEditMessage(message, true));
            return true;
        }

        //mute
        // if(receivedMessage.type === MESSAGE_TYPES.room_call_mute ||
        //     receivedMessage.type === MESSAGE_TYPES.room_call_change_initiator
        // ) {
        //     return
        // }

        yield put(receiveMessage(receivedMessage, {alias: senderUsername, showNotification, isGroup: true, from}));

        if (isLeaveJoinRemove(receivedMessage.type)) {
            let contact: any;

            if (receivedMessage.type === MESSAGE_TYPES.join_group) {

                if (infoNumber === username) {
                    contact = user.toJS();
                    contact.contactId = contact.id;
                } else {
                    contact = yield call(IDBContact.getContactById, `${infoNumber}@${SINGLE_CONVERSATION_EXTENSION}`);
                }

                let conversation = yield call(IDBConversation.getThread, receivedMessage.threadId);
                conversation = conversation && fromJS(conversation);

                if (!contact) {
                    const contactId: string = getUserId(infoNumber);
                    const addedMemberEmail = msgInfo.split("|")[1] || ""

                    contact = {
                        avatarCharacter: getInitials(infoNumber),
                        phone: infoNumber,
                        username: infoNumber,
                        color: Map(getColor()),
                        author: username,
                        favorite: false,
                        blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(infoNumber)),
                        firstName: "",
                        lastName: "",
                        avatarUrl: "",
                        saved: false,
                        contactId,
                        email: addedMemberEmail
                    };

                    yield put(attemptCreateContact(
                        contact.contactId,
                        contact.firstName,
                        contact.lastName,
                        contact.author,
                        contact.phone,
                        contact.saved,
                        false,
                        null,
                        contact.email,
                        contact.email,
                        null,
                        null,
                        true
                    ));
                }

                if (conversation && !conversation.getIn(['threads', 'threadInfo', 'groupMembersUsernames']).includes(infoNumber)) {
                    Log.i("################################################ added!!!!!!!!!!!!", contact, threadId);
                    yield all([
                        call(IDBConversation.addConversationMember, threadId, contact.contactId),
                        put(addConversationMember(threadId, contact))
                    ]);
                }
            } else if (receivedMessage.type === MESSAGE_TYPES.leave_group) {
                if (infoNumber === username) {
                    yield put(attemptDisableGroup(threadId, username));

                } else {
                    yield put(attemptRemoveMemberSelectedThread(threadId, `${infoNumber}@${SINGLE_CONVERSATION_EXTENSION}`));
                }

            } else if (receivedMessage.type === MESSAGE_TYPES.remove_from_group) {
                if (infoNumber === username) {
                    yield put(attemptDisableGroup(threadId, username));

                } else {
                    yield put(attemptRemoveMemberSelectedThread(threadId, `${infoNumber}@${SINGLE_CONVERSATION_EXTENSION}`));
                }
            }

        } else if (msgType === MESSAGE_TYPES.update_group_avatar) {
            const blob: Blob = yield call(getAWSFile, conf.app.aws.bucket.group, "GET", `${threadId.split("@").shift()}/profile/avatar`);
            yield put(attemptUpdateConversationAvatar(threadId, blob));

        } else if (msgType === MESSAGE_TYPES.update_group_name) {
            yield put(attemptUpdateConversationName(threadId, receivedMessage.info));
        }
    }
}

function* carbonMessageHandler({payload: {message}}: IHandlersActions): any {
    try {
        if (message.hasOwnProperty("call")) {
            return true;
        }
        const store: Store<any> = storeCreator.getStore();
        const {selectedThreadId} = selector(store.getState(), {conversations: true, selectedThreadId: true});


        const receiverUsername = getUsername(message.to);
        const senderUsername = getUsername(message.from);
        const receiverId = getUserId(receiverUsername);
        const senderId = getUserId(senderUsername);

        let threadId: string = ""
        let creator: string = ""
        if (message.from.startsWith("gid") || message.from.startsWith("pid") || message.from.startsWith("sid")){
            threadId = `${message.to.split("/").shift()}/${receiverUsername}`;
            creator = senderId;
        } else {
            threadId = receiverId
            creator = senderId
        }

        const effects: Array<any> = [];
        const {id, body} = message;
        let msg: any = {};
        let thumbPath: string;

        if (message.properties != null){
            message.properties && message.properties.property.map((property) => {
                msg[property.name] = property.value ? property.value["#text"] ? property.value["#text"] : property.value : "";
            });
        } else {
            msg = message
        }

        if (msg.msgInfo && isVideoStreamOrImage(msg.msgType)) {
            thumbPath = writeThumbnail(msg.msgInfo, id);
        }

        let options = {}
        if (msg["imageVideoResolution"] && typeof msg["imageVideoResolution"] === "string") {
            const dimensions: any = msg["imageVideoResolution"].split(RESOLUTION_SEPARATOR);
            if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {
                options = {
                    width: +dimensions[0] || 400,
                    height: +dimensions[1] || 400,
                }
            }
        } else if (
            msg["imageVideoResolution"] &&
            typeof msg["imageVideoResolution"] === "object" &&
            msg["imageVideoResolution"].value
        ) {
            const dimensions: any = msg["imageVideoResolution"].value.split(RESOLUTION_SEPARATOR);
            if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {
                options = {
                    width: +dimensions[0] || 400,
                    height: +dimensions[1] || 400,
                }
            }
        }



        msg["threadId"] = threadId
        msg["createdAt"] = format(new Date(), DEFAULT_TIME_FORMAT)
        msg["repid"] = msg.repid ? msg.repid : ""
        msg["creator"] = creator
        msg["info"] = thumbPath || msg.msgInfo || ""
        msg["type"] = msg.msgType
        msg["time"] = Date.now()
        msg["messageId"] = id
        msg["status"] = true
        msg["text"] = body.replace(/&amp;/, "&")
        msg["linkTags"] = undefined
        msg["link"] = undefined
        msg["own"] = true
        msg["id"] = id
        msg["m_options"] = options

        const msgType = (typeof msg.type === "object" && msg.type !== null && !Array.isArray(msg.type)) ? msg.type["#text"] : msg.type;

        msg.type = msgType
        msg.msgType = msgType

        if (isDeleted(msg.msgType)) {
            yield put(attemptDeleteMessage(msg.rel, msg, true));
            return true;

        } else if (isEdited(msg.msgType)) {
            yield put(attemptEditMessage(msg, true));
            return true;
        }

        if (![MESSAGE_TYPES.text,
            MESSAGE_TYPES.image,
            MESSAGE_TYPES.video,
            MESSAGE_TYPES.stream_file,
            MESSAGE_TYPES.sticker,
            MESSAGE_TYPES.location,
            MESSAGE_TYPES.room_call_start,
            MESSAGE_TYPES.room_call_join,
            MESSAGE_TYPES.room_call_leave,
            MESSAGE_TYPES.room_call_end,
            MESSAGE_TYPES.room_call_ringing,
            MESSAGE_TYPES.room_call_decline,
            MESSAGE_TYPES.room_call_mute,
        ].includes(msgType) && body === "#E#F#M#") {
            return true
        }


        if (msg.ext === "gif") {
            msg["type"] = MESSAGE_TYPES.gif;
        }




        if (msg.threadId && selectedThreadId == msg.threadId) {
            effects.push(put(addMessage(msg)));
        }

        effects.push(put(attemptCreateConversation(msg, true)));

        yield all(effects);

    } catch (e) {
        Log.i("carbon message error", e);
    }

}

function* messageHandler({payload: {message, showNotification}}: IHandlersActions): any {
    try {
        Log.i("conference -> messageHandlerService -> message = ", message)
        if (message.type !== "error") {

            MessagingService.sharedInstance.xmlMessageRecived(showNotification, message)
        }

    } catch (e) {
        Log.i(e, "error_messageHandler")
    }
}

function* messageHandlerService({payload: {message, showNotification}}: IHandlersActions): any {
    try {
        Log.i("messageHandlerService -> message = ", message)
        const diffTime: number = +localStorage.getItem(DIFF_TIME);
        const username: any = yield select(userNameSelector());
        const delayExists: boolean = message.delay && message.delay.stamp;
        const delayTime: number = delayExists && new Date(message.delay.stamp).getTime();
        const store: Store<any> = storeCreator.getStore();
        const {stickers} = selector(store.getState(), {stickers: true});

        const {
            request, msgType, msgInfo, id, to, rel, repid, body, from, sid, pid, ext,
            fileRemotePath, email, received, displayed, resolution, imageVideoResolution, fileSize
        } = message;
        let alias: any = message.alias;
        let options: any = null;

        if (message.zcc && message.zcc.isValid === "0") {
            Log.i("conference -> messageHandlerService -> isValid = ", message)
            const groupId: string = `${message.zcc.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;

            yield all([
                put(updateConversationProps(groupId, {statusMap: {}, joinedList: {}, callId: "", unValid: true})),
                call(IDBConversation.updateGroup, groupId, {statusMap: {}, joinedList: {}, callId: "", unValid: true})
            ])
        }


        //Removed commit #######

        // if (request && request.xmlns && request.xmlns === RECEIPTS_REQUEST_XMLNS && !received && !displayed) {
        //     yield put(sendXMLReceived({from: to.split("/").shift(), id, to: from}));
        // }



        if (isNetworkAction(msgType)) {
            yield put(attemptNetworkHandler(msgType, msgInfo));
            return true;
        }

        if (from.split("@").shift() === SYSTEM_MESSAGE_NUMBER) {
            alias = from;
        }

        if (!alias && from) {
            alias = getUsername(from);
        }

        if (msgType && alias && msgType !== "udp_2_tcp") {
            let thumbPath: string;

            alias = getUsername(alias);

            if (alias !== username) {
                const senderId = getUserId(alias);

                if (msgInfo && isVideoStreamOrImage(msgType)) {
                    thumbPath = writeThumbnail(msgInfo, id);

                    if ((window as any).isRefactor) {
                        // Todo refactor after remove thumbnail logic in signaling
                        if (msgType === MESSAGE_TYPES.image) {

                            const imageContainer: HTMLImageElement = document.createElement('img');
                            imageContainer.src = thumbPath;
                            imageContainer.onload = () => {
                                let width = imageContainer.naturalWidth;
                                let height = imageContainer.naturalHeight;
                                if (width > 400) {
                                    width = 400;
                                    height = height * (400 / width);
                                }
                                options = {
                                    width,
                                    height,
                                };
                            };
                        }

                        if (msgType === MESSAGE_TYPES.video) {

                            const videoContainer: HTMLVideoElement = document.createElement('video');
                            videoContainer.src = thumbPath;
                            videoContainer.onloadeddata = () => {
                                let width = videoContainer.videoWidth;
                                let height = videoContainer.videoHeight;
                                if (width > 400) {
                                    width = 400;
                                    height = height * (400 / width);
                                }
                                options = {
                                    width,
                                    height,
                                };
                            }
                        }
                        yield delay(150);

                        if (!options) {

                            options = {
                                width: 350,
                                height: 200
                            }
                        }
                    }

                }

                if (resolution) {
                    const dimensions: any = resolution.split(RESOLUTION_SEPARATOR);
                    if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {
                        options = {
                            width: +dimensions[0],
                            height: +dimensions[1],
                        }
                    }
                } else if (imageVideoResolution) {
                    const dimensions: any = imageVideoResolution.split(RESOLUTION_SEPARATOR);

                    if (dimensions && Array.isArray(dimensions) && dimensions.length === 2) {

                        const optimalSize = ImageManager.optimalSize({
                            toSaveWidth: 300,
                            toSaveHeight: 300,
                            maxWidth: 350,
                            maxHeight: 400,
                            originalWidth: +dimensions[0],
                            originalHeight: +dimensions[1],
                            video: false
                        })

                        options = {
                            width: optimalSize.width,
                            height: optimalSize.height,
                        }
                    }
                }

                const _time: number = delayExists && delayTime ? delayTime + diffTime : Date.now();

                const receivedMessage: any = {
                    conversationId: senderId,
                    createdAt: format(_time, DEFAULT_TIME_FORMAT),
                    creator: senderId,
                    deleted: false,
                    delivered: false,
                    dislikes: 0,
                    edited: false,
                    email: email || "",
                    fileLink: '',
                    fileRemotePath: FILE_MESSAGES_TYPES.includes(msgType) ? `${alias}/${id}` : '',
                    fileSize: fileSize || null,
                    hidden: undefined,
                    info: thumbPath || msgInfo,
                    isDelivered: false,
                    isSeen: false,
                    likeState: 0,
                    likes: 0,
                    linkTags: List[0],
                    link: isURI(body),
                    loadStatus: null,
                    m_options: options,
                    messageId: id,
                    id,
                    ext,
                    own: false,
                    pid,
                    previousMessageId: undefined,
                    repid: repid || "",
                    seen: false,
                    sid,
                    status: false,
                    text: body ? body.replace(/&amp;/, "&") : "#E#F#M#",
                    threadId: senderId,
                    time: _time,
                    type: msgType
                };

                if (msgType === MESSAGE_TYPES.sticker) {


                    const stickerId: string = msgInfo.split("_").shift().toString();

                    const stickerBlob: any = stickers && stickers.getIn([stickerId, "icons", msgInfo]);
                    const stickerImage: any = getBlobUri(stickerBlob);
                    const stickerUrl: any = stickers.getIn([stickerId, "defaultPackage"]) ? stickerBlob : stickerImage;
                    const imageContainer: HTMLImageElement = document.createElement('img');
                    imageContainer.src = stickerUrl

                    Log.i("stickers -> imageContainer = ", imageContainer.naturalHeight)
                    imageContainer.onload = () => {
                        let width = imageContainer.naturalWidth / 2;
                        let height = imageContainer.naturalHeight / 2;
                        receivedMessage.m_options = {
                            width,
                            height
                        }
                        Log.i("stickers -> options = ", receivedMessage)
                        store.dispatch(receiveMessage(receivedMessage, {alias, showNotification}))
                        // put(receiveMessage(receivedMessage, {alias, showNotification}));
                    }
                }

                if (ext === "gif") {
                    receivedMessage.type = MESSAGE_TYPES.gif;
                    receivedMessage.fileRemotePath = fileRemotePath;
                }

                if (isDeleted(msgType)) {
                    yield put(attemptDeleteMessage(rel, message, true));
                    return true;

                } else if (isEdited(msgType)) {
                    yield put(attemptEditMessage(message, true));
                    return true;
                }
                if (msgType !== MESSAGE_TYPES.sticker) {
                    yield put(receiveMessage(receivedMessage, {alias, showNotification}));
                }

            }
        }
    } catch (e) {
        Log.i(e, "error_messageHandler_service")
    }
}

function* handlersSaga(): any {
    yield takeEvery(actions.CARBON_MESSAGE_HANDLER, carbonMessageHandler);
    yield takeEvery(actions.GROUP_MESSAGE_HANDLER, groupMessageHandler);
    yield takeEvery(actions.MESSAGE_HANDLER, messageHandler);
    yield takeEvery(actions.MESSAGE_HANDLER_SERVICE, messageHandlerService);
}

export default handlersSaga;
