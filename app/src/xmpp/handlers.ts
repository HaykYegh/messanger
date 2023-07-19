"use strict";

import {Store} from "react-redux";
import format from "date-fns/format";
import {fromJS, List} from "immutable";
import {v4 as uuid} from "uuid";

import conf from "configs/configurations";
import {
    ADD_TO_BLOCKED_COMMAND,
    CALL_COMMANDS,
    CHANGE_GROUP_XML_COMMAND,
    CONFERENCE_COMMANDS,
    CREATE_GROUP_XML_COMMAND,
    DELETE_ROOM_COMMAND,
    EVENT_XMLNS,
    GET_GROUPS_XML_COMMAND,
    GET_INFO_XML_COMMAND,
    GROUP_CONVERSATION_EXTENSION,
    INVITE_COMMAND,
    INVITE_REASON,
    NOT_ENOUGH_CREDIT,
    ONLINE_CONTACT_STATUS,
    RECEIPTS_REQUEST_XMLNS,
    REMOVE_FROM_BLOCKED_COMMAND,
    SINGLE_CONVERSATION_EXTENSION,
    VERSION_UPDATE_XML_COMMAND,
    XML_MESSAGE_TYPES,
    XML_REQUEST_XMLNS,
    ZCC_XMLNS,
    ACK_XMLNS,
    CARBONS_2_REQUEST_XMLNS,
    CHANGE_ROLE_ALL_COMMAND,
    MEMBER_EDIT_NAME_COMMAND,
    MEMBER_EDIT_AVATAR_COMMAND,
    MEMBER_ADD_MEMBER_COMMAND, CHANGE_ROLE_COMMAND
} from "./XMLConstants";
import {
    attemptCreateContact,
    attemptSetBlockedContactNumbers,
    attemptToggleProductContact,
    attemptUpdateContact,
} from "modules/contacts/ContactsActions";
import {
    addCallHistory,
    addIceCandidate,
    addLocalDescription,
    changeCallStatus,
    declineCall,
    invitedToCall,
    sendVideoEnabled,
    setVideoAnswer,
    setVideoOffer,
    toggleOtherHold,
    toggleOtherVideo
} from "modules/call/CallActions";
import {
    addMessage,
    messageDeliveredToReceiver,
    messageDeliveredToServer,
    messageDisplayedToReceiver,
    messageCallToReceiver, IMessagesActions, sendMessageSeen,
} from "modules/messages/MessagesActions";
import {
    ADD_CONTACT_TYPE, APP_CONFIG,
    APPLICATION,
    CALL_STATUSES,
    DEFAULT_TIME_FORMAT,
    DEVICE_TOKEN_PREFIX,
    DIFF_TIME,
    LOG_TYPES,
    LOGS_LEVEL_TYPE,
    MESSAGE_TYPES
} from "configs/constants";
import {
    carbonMessageHandler as carbonMessageHandlerAction,
    groupMessageHandler as groupMessageHandlerAction,
    messageHandler as messageHandlerAction
} from "modules/handlers/HandlersActions";
import {
    attemptCreateGroups,
    attemptDeleteGroup,
    attemptUpdateGroupInfo,
    groupNameUpdatedServer,
    handleGroupResponse,
    joinGroups
} from "modules/groups/GroupsActions";
import {
    attemptEnableGroup,
    attemptSetTyping,
    groupsSyncSuccess,
    openCallOutPopUp,
    sendXMLReceived,
    threadBecameOffline,
    threadBecameOnline,
    userBecameOffline,
    userBecameOnline,
    updateApplicationVersionProperty,
    sendPong
} from "modules/application/ApplicationActions";
import {
    getInitials,
    getNotificationText,
    getPartialId,
    getRoomId,
    getUserId,
    getUsername,
    groupActionCommands,
    isDeleteOrCreateRoom,
    writeLog
} from "helpers/DataHelper";
import {
    accept as conferenceAccept, addMembersSettings, changingConferenceDetails,
    endConference, getedStartMessage, holdMembers,
    initialized,
    join, leave, onJoinCall,
    ringing as conferenceRinging, sendAckConference, setCallId,
    setIncomingCall,
    setStatus,
    setStatuses,
    startingConference
} from "modules/conference/ConferenceActions";
import {isConferenceIncomingCallSelector} from "modules/conference/ConferenceSelector";
import {
    attemptCreateConversation,
    attemptRemoveConversation,
    conversationBecameOffline,
    conversationBecameOnline, updateConversationProps
} from "modules/conversations/ConversationsActions";
import {addRequest, removeRequest, setWaitForResponse} from "modules/requests/RequestsActions";
import IDBConversation from "services/database/class/Conversation";
import getConnectionUsername from "xmpp/getConnectionUsername";
import {setPremium, SIGN_OUT} from "modules/user/UserActions";
import connectionCreator from "xmpp/connectionCreator";
import storeCreator from "helpers/StoreHelper";
import {getColor} from "helpers/AppHelper";
import selector from "services/selector";
import xmlToJson from "./xmlToJson";
import {getMessageText} from "helpers/MessageHelper";
import {userNameSelector} from "modules/user/UserSelector";
import {settingsUpdate, settingsUpdateRequest} from "modules/settings/SettingsActions";
import {
    lastActivityRequestXML,
    leaveOrRemoveSomeoneFromGroupXML,
    messageCallReceivedXML,
    XMLReceivedXMLService
} from "xmpp/XMLBuilders";
import {PendingQueue} from "modules/messages/PendingQueue";
import {MessagingService} from "modules/messages/MessagingService";
import Log from "modules/messages/Log";
import {actions} from "modules/messages/MessagesReducer";
import {put} from "redux-saga/effects";
import {loopBackClient} from "modules/conference/ConferenceSaga";

let removedConferenceCallId;
let _showNotification: Function;

const groupMessageHandler: any = showNotification => message => {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {contacts, conversations, selectedThreadId, privacy, app: {
            minimized,
            isFocused
        }} = selector(store.getState(), {
            app: true,
            user: true,
            conversations: true,
            contacts: true,
            selectedThreadId: true,
            settings: {privacy: true}
        });
        const dispatch: any = store.dispatch;

        const {messages, user} = selector(store.getState(), {messages: {messages: true}, user: true});
        const jsonMessage: any = xmlToJson(message);
        const username = user.get("username");

        writeLog(LOG_TYPES.timer, {
            messageId: jsonMessage.id,
            time: jsonMessage.time,
            own: 'false',
            group: true
        });

        if (messages.get(jsonMessage.id) && messages.getIn([jsonMessage.id, "own"])) {
            writeLog(LOG_TYPES.groupChat, {
                ...jsonMessage,
                reason: "exists or own message",
                msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(jsonMessage.msgType) ? "" : jsonMessage.msgInfo
            });
            dispatch(sendXMLReceived({from: jsonMessage.to.split("/").shift(), id: jsonMessage.id, to: jsonMessage.from}));
            return true;
        }

        if (jsonMessage.subject && jsonMessage.delay) {
            writeLog(LOG_TYPES.groupChat, {
                ...jsonMessage,
                reason: "subject or delay",
                msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(jsonMessage.msgType) ? "" : jsonMessage.msgInfo
            });
            return true;
        }

        if ((jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS) || (jsonMessage.msgType && jsonMessage.msgType !== "UPDATE_ROOM")) {
            const waitingGroup = checkForWaitServerResponse();
            const {from, msgType, request, to, id} = jsonMessage;

            if (jsonMessage.type === XML_MESSAGE_TYPES.group && jsonMessage.from && jsonMessage.from.includes('gid')) {
                Log.i("conferenceHandler -> groupMessageHandler = ", jsonMessage)
                // conferenceHandler(jsonMessage);
            }

            if (waitingGroup.groupPartialId !== "" && from.includes(waitingGroup.groupPartialId) && msgType === MESSAGE_TYPES.leave_group) {
                if (request && request.xmlns && request.xmlns === RECEIPTS_REQUEST_XMLNS) {
                    dispatch(sendXMLReceived({from: to.split("/").shift(), id, to: from}));
                }

                dispatch(attemptDeleteGroup(getRoomId(waitingGroup.groupPartialId, username), false));
                waitingGroup.groupPartialId = "";

            } else {
                if (jsonMessage.creation !== "1") {
                    writeLog(LOG_TYPES.received_message, {
                        id: jsonMessage.id,
                        groupChat: true,
                        msgType: jsonMessage.msgType
                    });
                    dispatch(groupMessageHandlerAction(jsonMessage, showNotification));
                    const groupSenderId = `${jsonMessage.from.split('/')[0]}/${username}`
                    Log.i("groupSenderId -> ", groupSenderId)
                    if (groupSenderId === selectedThreadId && !minimized && isFocused) {
                        dispatch(sendMessageSeen(to, id, username, true))
                    }
                } else {
                    dispatch(sendXMLReceived({from: to.split("/").shift(), id, to: from}));
                }
            }
        } else {
            Log.i("group message handler");
            Log.i(jsonMessage);
        }

        return true;
    } catch (e) {
        Log.i("########### groupMessageHandler error start ################")
        Log.i(e)
        Log.i("########### groupMessageHandler error start ################")
    }
};

const messageHandler: any = showNotification => message => {
    Log.i("handler -> messageHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const jsonMessage: any = xmlToJson(message);


    Log.i("messageHandler -> 1", jsonMessage)

    writeLog(LOG_TYPES.timer, {
        messageId: jsonMessage.id,
        time: jsonMessage.time,
        own: 'false'
    });

    if (jsonMessage.zmuc && jsonMessage.zmuc.command) {
        Log.i("messageHandler -> 2", jsonMessage)
        Log.i("RESPONSE MESSAGE HANDLER");
        responseMessageHandler(message);
        return true;
    }

    // Conference
    if (jsonMessage.call && jsonMessage.from && jsonMessage.from.includes('gid') || (jsonMessage.zcc && jsonMessage.zcc.xmlns === ZCC_XMLNS)) {
        Log.i("conferenceHandler -> messageHandler = ", jsonMessage)
        conferenceHandler(jsonMessage);
        return true;
    }

    if (jsonMessage.call) {
        Log.i("messageHandler -> 4", jsonMessage)
        Log.i("callHandler2222 -> 1", jsonMessage)
        callHandler(jsonMessage, showNotification);
        return true;
    }

    if ((jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS) || jsonMessage.msgType) {
        Log.i("messageHandler -> 5", jsonMessage)
        writeLog(LOG_TYPES.received_message, {
            id: jsonMessage.id,
            singleChat: true,
            msgType: jsonMessage.msgType
        });

        if (jsonMessage.body === "delivered" && jsonMessage.from && jsonMessage.to && jsonMessage.from.split("@")[0] === jsonMessage.to.split("@")[0]) {
            return;
        }
        // return true
        dispatch(messageHandlerAction(jsonMessage, showNotification));

    } else {
        Log.i("messageHandler -> 6", jsonMessage)
        const selectorParams: any = {
            conversations: true,
            application: {
                app: true
            },
            contacts: true,
            messages: true,
            requests: true,
            groups: true,
            user: true,
            selectedThreadId: true,
        };

        const {user} = selector(store.getState(), selectorParams);

        const username: string = user.get("username");
        writeLog(LOG_TYPES.singleChat, {
            ...jsonMessage,
            reason: "no request or wrong xmlns/msgType",
            msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(jsonMessage.msgType) ? "" : jsonMessage.msgInfo
        });
        const forwardedMessage = jsonMessage.sent && jsonMessage.sent.forwarded && jsonMessage.sent.forwarded.message;

        if (forwardedMessage && forwardedMessage.body &&  !forwardedMessage.displayed && !forwardedMessage.delivered && !forwardedMessage.received) {
            Log.i("messageHandler -> 7", jsonMessage)
            // it's works in carbon message handlers dispatch(carbonMessageHandler(forwardedMessage));
            dispatch(carbonMessageHandlerAction(forwardedMessage));
        } else if (forwardedMessage && forwardedMessage.zmuc && forwardedMessage.zmuc.command === "create") {
            Log.i("messageHandler -> 8", jsonMessage)
            // dispatch(joinGroups([forwardedMessage.zmuc.room_name], username))
        } else {
            Log.i("messageHandler -> 9", jsonMessage)
            if (forwardedMessage && forwardedMessage.ack && forwardedMessage.ack.command) {

                Log.i("messageHandler -> 10", jsonMessage)
                const id: string = forwardedMessage.id;
                const msgId: string = forwardedMessage.id;
                const time = Date.now();
                const threadId = forwardedMessage.from.split("/").shift();

                if (forwardedMessage.ack.command === 'delivered') {
                    Log.i("messageHandler -> 11", jsonMessage)
                    // dispatch(messageDeliveredToReceiver({id, msgId, time, threadId}));
                }

                if (forwardedMessage.ack.command === 'displayed') {
                    Log.i("messageHandler -> 12", jsonMessage)
                    // dispatch(messageDisplayedToReceiver({msgId, time, threadId}));
                }

            }
        }

        Log.i("message handler");
    }

    return true;
};

const voipMessageHandler: any = showNotification => message => {
    Log.i("handler -> voipMessageHandler ->", message)

    const jsonMessage: any = xmlToJson(message);
    Log.i("handler -> voipMessageHandler -> jsonMessage = 1", jsonMessage)

    if (jsonMessage.call) {
        Log.i("callHandler2222 -> 2", jsonMessage)
        callHandler(jsonMessage);
        return true;
    } else if (jsonMessage["no-store"]["xmlns"] === "urn:xmpp:hints") {
        Log.i("handler -> voipMessageHandler -> jsonMessage = 2", message)
        Log.i("handler -> voipMessageHandler ->", message)
        const store: Store<any> = storeCreator.getStore();
        const dispatch: any = store.dispatch;
        const jsonMessage: any = xmlToJson(message);


        Log.i("voipMessageHandler -> 1", jsonMessage)

        writeLog(LOG_TYPES.timer, {
            messageId: jsonMessage.id,
            time: jsonMessage.time,
            own: 'false'
        });

        if (jsonMessage.zmuc && jsonMessage.zmuc.command) {
            Log.i("voipMessageHandler -> 2", jsonMessage)
            Log.i("RESPONSE MESSAGE HANDLER");
            responseMessageHandler(message);
            return true;
        }

        // Conference
        if (jsonMessage.call && jsonMessage.from && jsonMessage.from.includes('gid') || (jsonMessage.zcc && jsonMessage.zcc.xmlns === ZCC_XMLNS)) {
            Log.i("voipMessageHandler -> 3", jsonMessage)
            conferenceHandler(jsonMessage);
            return true;
        }

        if (jsonMessage.call) {
            Log.i("voipMessageHandler -> 4", jsonMessage)
            Log.i("callHandler2222 -> 1", jsonMessage)
            callHandler(jsonMessage, showNotification);
            return true;
        }

        if ((jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS) || jsonMessage.msgType) {
            Log.i("voipMessageHandler -> 5", jsonMessage)
            writeLog(LOG_TYPES.received_message, {
                id: jsonMessage.id,
                singleChat: true,
                msgType: jsonMessage.msgType
            });

            if (jsonMessage.body === "delivered" && jsonMessage.from && jsonMessage.to && jsonMessage.from.split("@")[0] === jsonMessage.to.split("@")[0]) {
                return;
            }
            // return true
            dispatch(messageHandlerAction(jsonMessage, showNotification));

        } else {
            Log.i("voipMessageHandler -> 6", jsonMessage)
            const selectorParams: any = {
                conversations: true,
                application: {
                    app: true
                },
                contacts: true,
                messages: true,
                requests: true,
                groups: true,
                user: true,
                selectedThreadId: true,
            };

            const {user} = selector(store.getState(), selectorParams);

            const username: string = user.get("username");
            writeLog(LOG_TYPES.singleChat, {
                ...jsonMessage,
                reason: "no request or wrong xmlns/msgType",
                msgInfo: [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(jsonMessage.msgType) ? "" : jsonMessage.msgInfo
            });
            const forwardedMessage = jsonMessage.sent && jsonMessage.sent.forwarded && jsonMessage.sent.forwarded.message;

            if (forwardedMessage && forwardedMessage.body &&  !forwardedMessage.displayed && !forwardedMessage.delivered && !forwardedMessage.received) {
                Log.i("voipMessageHandler -> 7", jsonMessage)
                // it's works in carbon message handlers dispatch(carbonMessageHandler(forwardedMessage));
                dispatch(carbonMessageHandlerAction(forwardedMessage));
            } else if (forwardedMessage && forwardedMessage.zmuc && forwardedMessage.zmuc.command === "create") {
                Log.i("voipMessageHandler -> 8", jsonMessage)
                // dispatch(joinGroups([forwardedMessage.zmuc.room_name], username))
            } else {
                Log.i("voipMessageHandler -> 9", jsonMessage)
                if (forwardedMessage && forwardedMessage.ack && forwardedMessage.ack.command) {

                    Log.i("voipMessageHandler -> 10", jsonMessage)
                    const id: string = forwardedMessage.id;
                    const msgId: string = forwardedMessage.id;
                    const time = Date.now();
                    const threadId = forwardedMessage.from.split("/").shift();

                    if (forwardedMessage.ack.command === 'delivered') {
                        Log.i("voipMessageHandler -> 11", jsonMessage)
                        // dispatch(messageDeliveredToReceiver({id, msgId, time, threadId}));
                    }

                    if (forwardedMessage.ack.command === 'displayed') {
                        Log.i("voipMessageHandler -> 12", jsonMessage)
                        // dispatch(messageDisplayedToReceiver({msgId, time, threadId}));
                    }

                }
            }

            Log.i("message handler");
        }

        return true;
    } else {
        return true;
    }


};

const _checkForGroupInvites = () => {
    const groupData = {groupId: "", members: "", admins: ""};

    return () => groupData;

};

const _checkForWaitServerResponse = () => {
    const waitingGroup = {groupPartialId: ""};

    return () => waitingGroup;

};

const checkForGroupInvites = _checkForGroupInvites();

const checkForWaitServerResponse = _checkForWaitServerResponse();

const applicationNewVersionHandler: any = message => {
    Log.i("handler -> applicationNewVersionHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;

    const {command, platform} = message.versioning;

    // check command and platform for desktop
    if (command === VERSION_UPDATE_XML_COMMAND && platform === APPLICATION.PLATFORM) {
        const version: string = message.versioning.version;
        if (version) {
            dispatch(updateApplicationVersionProperty(version));
            return;
        }

        writeLog(LOG_TYPES.appLatestVersion, {
            msg: "version is empty",
            message: message.versioning
        });
        return;
    }

    writeLog(LOG_TYPES.appLatestVersion, {
        msg: "command not specified or platform not desktop",
        message: message.versioning
    });
};

const responseMessageHandler: any = async messageXML => {
    Log.i("responseMessageHandler -> messageXML = ", messageXML)
    Log.i("handler -> responseMessageHandler ->", messageXML)
    const store: Store<any> = storeCreator.getStore();
    const state: any = store.getState();
    const selectorParams: any = {
        conversations: true,
        application: {
            app: true
        },
        contacts: true,
        messages: true,
        requests: true,
        groups: true,
        user: true,
        selectedThreadId: true,
    };
    const {user, messages, pendingRequests, conversations, selectedThreadId, showConfCall} = selector(store.getState(), selectorParams);
    const dispatch: any = store.dispatch;
    const jsonMessage: any = xmlToJson(messageXML);
    PendingQueue.instance.removeAndSendNextPending(jsonMessage.id)

    // app new version handle
    if (jsonMessage && jsonMessage.versioning) {
        writeLog(LOG_TYPES.appLatestVersion, {
            msg: "APPLICATION LATEST VERSION",
            message: jsonMessage.versioning
        });

        applicationNewVersionHandler(jsonMessage);
        return true;
    }


    if (jsonMessage.call && jsonMessage.call.command === CALL_COMMANDS.hangup) {
        Log.i("callHandler2222 -> 3", jsonMessage)
        callHandler(jsonMessage);
        return true;
    }

    if (jsonMessage.call) {
        return true;
    }

    if (Object.keys(jsonMessage).length === 3 && jsonMessage.ack && jsonMessage.from && jsonMessage.to) {
        return true;
    }

    if (Object.keys(jsonMessage).length === 4 && jsonMessage.ack && jsonMessage.from && jsonMessage.to && jsonMessage.xmlns) {
        return true;
    }


    if ((jsonMessage.zmuc && jsonMessage.zmuc.command === INVITE_COMMAND) || (jsonMessage.privacy && [REMOVE_FROM_BLOCKED_COMMAND, ADD_TO_BLOCKED_COMMAND].includes(jsonMessage.privacy.command))) {
        // let from: string = jsonMessage.zpresence.from;
        // from = from.substring(0, from.indexOf("@"));
        // console.log(selectedThreadId, from, "###########");
        if (jsonMessage.privacy && REMOVE_FROM_BLOCKED_COMMAND === jsonMessage.privacy.command && selectedThreadId && selectedThreadId !== "") {
            const connection: any = connectionCreator.getConnection();
            const msg: Strophe.Builder = lastActivityRequestXML({id: selectedThreadId});
            if (connection.connected) {
                connection.send(msg);
            }
        }
        return true;
    }

    Log.i("responseMessageHandler_jsonMessage1", jsonMessage)
    Log.i("responseMessageHandler_jsonMessage messageXML", messageXML)

    if (jsonMessage.zmuc && jsonMessage.zmuc.command === GET_GROUPS_XML_COMMAND) {
        Log.i("responseMessageHandler_jsonMessage2", messageXML)
        if (!jsonMessage.zmuc.rooms) {
            Log.i("rooms is empty ########");
            dispatch(groupsSyncSuccess());
            return true;
        }

        const groups: Array<string> = jsonMessage.zmuc.rooms.split(";");
        const newGroupIds: Array<string> = groups.filter(groupId => !conversations.get(`${groupId}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`));
        if (newGroupIds.length > 0) {
            dispatch(attemptCreateGroups(newGroupIds, false, true));

        } else {
            dispatch(groupsSyncSuccess());
        }

    } else if (
      jsonMessage.zmuc &&
      (
        jsonMessage.zmuc.command === GET_INFO_XML_COMMAND ||
        jsonMessage.zmuc.command === CHANGE_ROLE_ALL_COMMAND ||
        jsonMessage.zmuc.command === CHANGE_ROLE_COMMAND ||
        jsonMessage.zmuc.command === MEMBER_EDIT_NAME_COMMAND ||
        jsonMessage.zmuc.command === MEMBER_EDIT_AVATAR_COMMAND ||
        jsonMessage.zmuc.command === MEMBER_ADD_MEMBER_COMMAND
      )
    ) {
        Log.i("responseMessageHandler_jsonMessage3", messageXML)
        dispatch(attemptUpdateGroupInfo(jsonMessage.zmuc));

    } /*else if (jsonMessage.zmuc && jsonMessage.zmuc.command === CREATE_GROUP_XML_COMMAND) {
        const groupData = checkForGroupInvites(); in create case no need to do this actions, what are left moved to responseHandler
        const {zmuc} = jsonMessage;
        dispatch(joinGroups([jsonMessage.zmuc.name], user.get("username")));

        if (zmuc) {
            const {command, name} = zmuc;
            if (command === "create" && name === groupData.groupId) {
                // dispatch(inviteGroupMembers(groupData.groupId, groupData.members, true, groupData.admins));
                groupData.admins = "";
                groupData.groupId = "";

            }
        }

    }*/ else if (jsonMessage.ack && jsonMessage.from && jsonMessage.to && jsonMessage.id) {
        Log.i("responseMessageHandler_jsonMessage4", messageXML)
        MessagingService.sharedInstance.xmlServerRecived(null, jsonMessage)



    } else if (jsonMessage.privacy) {
        Log.i("responseMessageHandler_jsonMessage5", messageXML)
        if (jsonMessage.privacy.items && jsonMessage.privacy.items.length > 0) {
            dispatch(attemptSetBlockedContactNumbers(jsonMessage.privacy.items.replace(new RegExp(conf.app.prefix, "g"), "").split(";")));
        }
    } else if (jsonMessage.zmuc && jsonMessage.zmuc.command === CHANGE_GROUP_XML_COMMAND) {
        Log.i("responseMessageHandler_jsonMessage6", jsonMessage)
        const {name, subject} = jsonMessage.zmuc;
        dispatch(groupNameUpdatedServer(name, subject))

    } else if (jsonMessage.zmuc && jsonMessage.zmuc.command && groupActionCommands().includes(jsonMessage.zmuc.command)) {
        Log.i("responseMessageHandler_jsonMessage7", messageXML)
        const {requestId, command, name} = jsonMessage.zmuc;
        const request = pendingRequests && pendingRequests.get(requestId);

        if (request && request.get("keep")) {
            setTimeout(() => {
                dispatch(removeRequest(requestId));
            }, 300);
        }

        if (isDeleteOrCreateRoom(command) && name) {
            const groupData = checkForGroupInvites();
            if (command === CREATE_GROUP_XML_COMMAND && name === groupData.groupId) {
                groupData.admins = "";
                groupData.groupId = "";
            }
            dispatch(handleGroupResponse(jsonMessage));
        }

    } else {
        Log.i("responseMessageHandler_jsonMessage8", messageXML)
        writeLog(LOG_TYPES.request, {
            ...jsonMessage,
            reason: "not handled",
        });
    }

    return true;
};


export function responseRecived(jsonMessage): any {
    if(jsonMessage == null) {
        return
    }

    const store: Store<any> = storeCreator.getStore();
    const selectorParams: any = {
        conversations: true,
        application: {
            app: true
        },
        contacts: true,
        messages: true,
        requests: true,
        groups: true,
        user: true,
        selectedThreadId: true,
    };
    const {pendingRequests} = selector(store.getState(), selectorParams);
    const dispatch: any = store.dispatch;
    let shouldWaitForConversation: boolean = false;
    if (pendingRequests && pendingRequests.get(jsonMessage.id)) {
        const request = pendingRequests.get(jsonMessage.id);
        const waitingGroup = checkForWaitServerResponse();
        const groupData = checkForGroupInvites();
        const waitForServerResponse = request.get("waitForServerResponse");
        if (request.has("params")) {
            const params = request.get("params");
            const groupId = params.get("groupId");
            const admins = params.get("admins");

            if (params.get("id") && params.get("id").includes("create")) {
                groupData.groupId = groupId;
                groupData.admins = admins;
            }
        }

        if (waitForServerResponse) {
            const params: any = request.get("params");
            waitingGroup.groupPartialId = params.get("groupPartialId") || params.get("groupId");
        }

        if (request.get("keep")) {
            dispatch(setWaitForResponse(jsonMessage.id));

        } else {
            writeLog(LOG_TYPES.request, {
                ...jsonMessage,
                command: "removeRequest",
                id: jsonMessage.id,
            });
            dispatch(removeRequest(jsonMessage.id));
        }

        if (request.getIn(["params", "type"]) === MESSAGE_TYPES.chat) {
            shouldWaitForConversation = true
        }
    }

    // if (messages.get(jsonMessage.id)) {
    //     writeLog(LOG_TYPES.message_statuses, {
    //         id: jsonMessage.id,
    //         status: "delivered to server"
    //     });
    //     dispatch(messageDeliveredToServer(jsonMessage.id));
    // }


    dispatch(messageDeliveredToServer(jsonMessage.id, shouldWaitForConversation));
}

const deliveredMessageHandler: any = message => {
    Log.i("handler -> deliveredMessageHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const {pendingRequests} = selector(store.getState(), {pendingRequests: true});
    Log.i("#############", pendingRequests);
    const dispatch: any = store.dispatch;
    const jsonMessage: any = xmlToJson(message);
    // MessagingService.sharedInstance.xmlMessageRecived(true, jsonMessage)

    Log.i("handler -> deliveredMessageHandler -> 2", jsonMessage)

    if (jsonMessage.call) {
        Log.i("deliveredMessageHandler -> 3", jsonMessage)
        const id: string = jsonMessage.id;
        const msgId: string = jsonMessage.id;
        const time: string = jsonMessage.delay && jsonMessage.delay.stamp ? format(jsonMessage.delay.stamp, DEFAULT_TIME_FORMAT) : format(new Date(), DEFAULT_TIME_FORMAT);
        const threadId = jsonMessage.from.split("/").shift();
        const roomId: string = jsonMessage.roomId || "";
        if(jsonMessage.call.missed || jsonMessage.call.hangup || jsonMessage.call.decline) {
            Log.i("deliveredMessageHandler -> 4", message)
            dispatch(messageCallToReceiver({id, msgId, time, threadId, roomId}));
        } else {
            if (jsonMessage.call && jsonMessage.from && jsonMessage.from.includes('gid') || (jsonMessage.zcc && jsonMessage.zcc.xmlns === ZCC_XMLNS)) {
                return true;
            }
            Log.i("callHandler2222 -> 4", jsonMessage)
            callHandler(jsonMessage);
        }

        return true;
    }

    if (jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS && jsonMessage.type === XML_MESSAGE_TYPES.group) {
        Log.i("deliveredMessageHandler -> 5", message)
        return true;
    }

    if (jsonMessage.received && jsonMessage.id) {
        deleveryHandler(jsonMessage)

    } else if (jsonMessage.displayed && jsonMessage.id && jsonMessage.body === "seen") {
        Log.i("deliveredMessageHandler -> 7", message)
        displayedMessageHandler(message);
    } else if (jsonMessage.zmuc && jsonMessage.zmuc.command === DELETE_ROOM_COMMAND) {
        Log.i("deliveredMessageHandler -> 8", message)
        const {requestId} = jsonMessage.zmuc;
        const request = pendingRequests && pendingRequests.get(requestId);

        if (request && request.get("keep")) {
            dispatch(removeRequest(requestId));
        }

    } else {
        Log.i("deliveredMessageHandler -> 9", jsonMessage)

        if ((jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS) || jsonMessage.msgType) {
            writeLog(LOG_TYPES.received_message, {
                id: jsonMessage.id,
                singleChat: true,
                msgType: jsonMessage.msgType
            });

            if (jsonMessage.body === "delivered" && jsonMessage.from && jsonMessage.to && jsonMessage.from.split("@")[0] === jsonMessage.to.split("@")[0]) {
                return;
            }

            // if (jsonMessage.error) {
            //     return;
            // }

            // return true
            dispatch(messageHandlerAction(jsonMessage, _showNotification));

        }
    }

    return true;
};

export function deleveryHandler(jsonMessage): any {
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;

    const id: string = jsonMessage.id;
    const msgId: string = jsonMessage.id;
    const time: string = jsonMessage.delay && jsonMessage.delay.stamp ? format(jsonMessage.delay.stamp, DEFAULT_TIME_FORMAT) : format(new Date(), DEFAULT_TIME_FORMAT);
    const threadId = jsonMessage.from.split("/").shift();
    const roomId: string = jsonMessage.roomId || "";
    writeLog(LOG_TYPES.message_statuses, {
        from: jsonMessage.from,
        status: "delivered",
        deliveredToReceiver: true,
        id
    });
    dispatch(messageDeliveredToReceiver({id, msgId, time, threadId, roomId}));
}

const displayedMessageHandler: any = message => {
    Log.i("handler -> displayedMessageHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const {contacts, conversations, selectedThreadId, privacy, user} = selector(store.getState(), {
        user: true,
        conversations: true,
        contacts: true,
        selectedThreadId: true,
        settings: {privacy: true}
    });
    const jsonMessage: any = message instanceof Element ? xmlToJson(message): message;
    PendingQueue.instance.removeAndSendNextPending(jsonMessage.id)

    if (jsonMessage.status && jsonMessage.status === "seen") {
        const msgId: string = jsonMessage.msgId;
        const time: string = format(new Date(), DEFAULT_TIME_FORMAT);
        const threadId = jsonMessage.from.split("/").shift();
        const roomId: string = jsonMessage.roomId || "";
        writeLog(LOG_TYPES.message_statuses, {
            from: jsonMessage.from,
            status: "seen",
            displayedToReceiver: true,
            id: jsonMessage.id
        });
        if (privacy && privacy.get("showSeenStatus")) {
            dispatch(messageDisplayedToReceiver({msgId, time, threadId, roomId}));
        } else {
            dispatch(messageDeliveredToReceiver({id: msgId, msgId, time, threadId, roomId}));
        }
    }
    if ((jsonMessage.displayed && jsonMessage.body === "seen") || jsonMessage.x) {
        if (jsonMessage.body === "seen" && jsonMessage.id) {
            const msgId: string = jsonMessage.id;
            const time: string = jsonMessage.delay && jsonMessage.delay.stamp ? format(jsonMessage.delay.stamp, DEFAULT_TIME_FORMAT) : format(new Date(), DEFAULT_TIME_FORMAT);
            const threadId = jsonMessage.from.split("/").shift();
            const roomId: string = jsonMessage.roomId || "";

            writeLog(LOG_TYPES.message_statuses, {
                from: jsonMessage.from,
                status: "seen",
                displayedToReceiver: true,
                id: jsonMessage.id
            });
            if (privacy && privacy.get("showSeenStatus")) {
                dispatch(messageDisplayedToReceiver({msgId, time, threadId, roomId}));
            } else {
                dispatch(messageDeliveredToReceiver({id: msgId, msgId, time, threadId, roomId}));
            }
        } else if (jsonMessage.from && jsonMessage.x.composing) {
            const {composing: {isGroup}} = jsonMessage.x;
            const {from} = jsonMessage;

            if (!!+isGroup) {
                const partialId: string = getPartialId(from);
                const threadId: string = getRoomId(partialId, user.get("username"));
                const username: string = getUsername(from);

                if ((conversations.has(threadId) || selectedThreadId === threadId) && username !== user.get("username")) {
                    dispatch(attemptSetTyping(threadId, username));
                }

            } else {
                const username: string = getUsername(from);
                const contactId: string = getUserId(username);

                if (conversations.has(contactId) || selectedThreadId === contactId) {
                    dispatch(attemptSetTyping(contactId, username));
                }

                if (!contacts.get(contactId)) {
                    return true;
                }
            }
        }

    } else {

    }

    return true;
};

const callHandler: any = (jsonMessage: any, showNotification) => {
    Log.i("handler -> callHandler ->", jsonMessage)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const {contacts, lastCall, user, calls, blockedContactNumbers, selectedThreadId, app} = selector(store.getState());

    if (jsonMessage.call) {
        switch (jsonMessage.call.command) {
            case CALL_COMMANDS.invite:
                writeLog(LOG_TYPES.call, {
                    command: CALL_COMMANDS.invite,
                    from: jsonMessage.from,
                    callId: jsonMessage.call.callid
                });
                if (jsonMessage.call.hasOwnProperty("properties") && jsonMessage.call.properties.hasOwnProperty("property") && jsonMessage.call.properties.property.hasOwnProperty("value")) {
                    jsonMessage.sdp = jsonMessage.sdp || jsonMessage.call.properties.property.value["#text"];
                }

                let callerId: string = jsonMessage.from.split("/").shift();

                if (conf.app.prefix) {
                    callerId = callerId.split(conf.app.prefix).pop();
                }

                const callerUsername: string = callerId.split("@").shift();

                let caller: any = contacts.get(callerId);

                caller = caller && caller.get("members").first().toJS();
                const {firstName, lastName, email} = jsonMessage.call;

                if (!caller) {
                    caller = {
                        avatarCharacter: getInitials(firstName || "", lastName || ""),
                        phone: callerUsername,
                        author: user.get("username"),
                        username: callerUsername,
                        color: getColor(),
                        favorite: false,
                        blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(callerUsername)),
                        firstName: firstName || "",
                        lastName: lastName || "",
                        avatarUrl: "",
                        contactId: callerId,
                        status: true,
                        saved: false,
                        email: email || ""
                    };

                    dispatch(attemptCreateContact(
                        caller.contactId,
                        caller.firstName,
                        caller.lastName,
                        caller.author,
                        caller.phone,
                        caller.saved,
                        false,
                        ADD_CONTACT_TYPE.call,
                        caller.email
                    ));

                } else if (firstName && !caller.saved) {
                    dispatch(attemptUpdateContact(caller.contactId, firstName || "", lastName || "", caller.username, user.get("username")))
                }

                const call: any = {
                    callerData: {
                        audio: {
                            candidate: jsonMessage.call.acandidate,
                            proxy: jsonMessage.call.aproxy,
                            codec: jsonMessage.call.acodec
                        },
                        video: {
                            candidate: jsonMessage.call.vcandidate,
                            proxy: jsonMessage.call.vproxy,
                            codec: jsonMessage.call.vcodec
                        },
                        device: {
                            height: jsonMessage.call.dheight,
                            width: jsonMessage.call.dwidth
                        },
                        callPrototype: jsonMessage.call.prototype,
                        version: jsonMessage.call.version,
                        red5: jsonMessage.call.red5
                    },
                    otherVideo: jsonMessage.call.isvideo === "1",
                    callTime: jsonMessage.call.callTime,
                    status: CALL_STATUSES.calling,
                    id: jsonMessage.call.callid,
                    videoOffer: jsonMessage.sdp || " ",
                    to: caller.username,
                    receiver: user.get("id"),
                    otherHolded: false,
                    iceCandidates: {},
                    caller: callerId,
                    email,
                    myHolded: false,
                    myVideo: false,
                    ownCall: false,
                    mic: true,
                    showInThread: {
                        ignored: false,
                        isVideo: false
                    }
                };

                writeLog(LOG_TYPES.call, {
                    isSdpExists: call.videoOffer !== " ",
                    callId: jsonMessage.call.callid
                });


                if (jsonMessage.call.missed === MESSAGE_TYPES.missed) {
                    writeLog(LOG_TYPES.call, {
                        reason: "missed call",
                        from: jsonMessage.from,
                        callId: jsonMessage.call.callid
                    });

                    const threadId: any = callerId.includes(SINGLE_CONVERSATION_EXTENSION) ? callerId : `${callerId}@${SINGLE_CONVERSATION_EXTENSION}`;
                    const currentTime: any = Date.now();
                    const msgId: string = `msgId${currentTime}`;
                    const time: number = jsonMessage && jsonMessage.call && +jsonMessage.call.callTime || Date.now();

                    // const message: any = {
                    //     threadId,
                    //     createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                    //     type: MESSAGE_TYPES.missed_call,
                    //     fileRemotePath: null,
                    //     id: `msgId${uuid()}`,
                    //     creator: callerId,
                    //     fileSize: null,
                    //     own: false,
                    //     time,
                    //     info: "",
                    //     text: ""
                    // };

                    const message: any = {
                        conversationId: threadId,
                        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
                        creator: callerId,
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
                        isSeen: false,
                        likeState: 0,
                        likes: 0,
                        link: false,
                        linkTags: List[0],
                        loadStatus: null,
                        m_options: null,
                        messageId: msgId,
                        id: msgId,
                        own: false,
                        pid: undefined,
                        previousMessageId: undefined,
                        repid: "",
                        seen: false,
                        sid: undefined,
                        status: false,
                        text: '',
                        threadId,
                        time: currentTime,
                        type: MESSAGE_TYPES.missed_call,
                    };

                    dispatch(addCallHistory(call.id, fromJS(call)));

                    if (selectedThreadId === message.threadId) {
                        dispatch(addMessage(message));
                    }

                    dispatch(attemptCreateConversation(message));

                    if (!document.hasFocus() || selectedThreadId !== message.threadId || lastCall && lastCall.size > 0 && !app.minimized && !app.showChat) {
                        const text = getNotificationText(message, getMessageText.bind(
                            this, fromJS(message), contacts, user.get("username"), true)
                        );

                        showNotification(text, message.threadId, message.threadId);
                    }

                    break;
                }

                if (call.videoOffer === " ") {
                    Log.i("videoOffer ->", jsonMessage)
                    break;
                }

                if (lastCall && lastCall.size > 0 && call.id === lastCall.get("id")) {
                    dispatch(setVideoOffer(call.id, call.videoOffer));
                    break;
                }

                if (lastCall && lastCall.size > 0) {
                    writeLog(LOG_TYPES.call, {
                        reason: "decline in invite",
                        from: jsonMessage.from,
                        callId: jsonMessage.call.callid
                    });
                    dispatch(declineCall(jsonMessage.call.callid, callerUsername));

                    const threadId: any = callerId.includes(SINGLE_CONVERSATION_EXTENSION) ? callerId : `${callerId}@${SINGLE_CONVERSATION_EXTENSION}`;
                    const currentTime: any = Date.now();
                    const msgId: string = `msgId${currentTime}`;
                    // const message: any = {
                    //     threadId,
                    //     createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
                    //     type: MESSAGE_TYPES.missed_call,
                    //     fileRemotePath: null,
                    //     id: `msgId${uuid()}`,
                    //     creator: callerId,
                    //     fileSize: null,
                    //     own: false,
                    //     time: Date.now(),
                    //     info: "",
                    //     text: ""
                    // };

                    const message: any = {
                        conversationId: threadId,
                        createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
                        creator: callerId,
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
                        isSeen: false,
                        likeState: 0,
                        likes: 0,
                        link: false,
                        linkTags: List[0],
                        loadStatus: null,
                        m_options: null,
                        messageId: msgId,
                        id: msgId,
                        own: false,
                        pid: undefined,
                        previousMessageId: undefined,
                        repid: "",
                        seen: false,
                        sid: undefined,
                        status: false,
                        text: '',
                        threadId,
                        time: currentTime,
                        type: MESSAGE_TYPES.missed_call,
                    };

                    dispatch(addCallHistory(call.id, fromJS(call)));
                    if (selectedThreadId === message.threadId) {
                        dispatch(addMessage(message));
                    }
                    dispatch(attemptCreateConversation(message));

                    if (!document.hasFocus() || selectedThreadId !== message.threadId || lastCall && lastCall.size > 0 && !app.minimized && !app.showChat) {
                        const text = getNotificationText(message, getMessageText.bind(
                            this, fromJS(message), contacts, user.get("username"), true)
                        );

                        showNotification(text, message.threadId, message.threadId);
                    }

                    break;
                }

                dispatch(invitedToCall(call));
                break;

            case CALL_COMMANDS.hangup:
                writeLog(LOG_TYPES.call, {
                    from: jsonMessage.from,
                    command: CALL_COMMANDS.hangup,
                    callId: jsonMessage.call.callid
                });
                if (calls.get(jsonMessage.call.callid)) {
                    if (jsonMessage.call.reason === NOT_ENOUGH_CREDIT) {
                        setTimeout(() => {
                            dispatch(openCallOutPopUp());
                        }, 500);
                    }
                    console.warn("shouldGoToBackground boolean:", lastCall && lastCall.get("status") === CALL_STATUSES.answering);
                    dispatch(changeCallStatus(jsonMessage.call.callid, CALL_STATUSES.hangedUp, lastCall && lastCall.get("status") === CALL_STATUSES.answering));
                } else {
                    const id: string = jsonMessage.call.callid;
                    const msgId: string = jsonMessage.call.callid;
                    const time: string = jsonMessage.delay && jsonMessage.delay.stamp ? format(jsonMessage.delay.stamp, DEFAULT_TIME_FORMAT) : format(new Date(), DEFAULT_TIME_FORMAT);
                    const threadId = jsonMessage.from.split("/").shift();
                    const roomId: string = jsonMessage.roomId || "";
                    dispatch(messageCallToReceiver({id, msgId, time, threadId, roomId}));
                    setTimeout(() => {
                        const store: Store<any> = storeCreator.getStore();
                        const dispatch: any = store.dispatch;
                        const {calls} = selector(store.getState());
                        if (calls.get(jsonMessage.call.callid)) {
                            dispatch(changeCallStatus(jsonMessage.call.callid, CALL_STATUSES.hangedUp));
                        }
                    }, 1000);
                }
                break;

            case CALL_COMMANDS.decline:
                writeLog(LOG_TYPES.call, {
                    from: jsonMessage.from,
                    command: CALL_COMMANDS.decline,
                    id: jsonMessage.call.callid
                });
                if (calls.get(jsonMessage.call.callid)) {
                    dispatch(changeCallStatus(jsonMessage.call.callid, CALL_STATUSES.decline));
                }
                break;

            case CALL_COMMANDS.ringing:
                writeLog(LOG_TYPES.call, {
                    from: jsonMessage.from,
                    command: CALL_COMMANDS.ringing,
                    callId: jsonMessage.call.callid
                });
                if (calls.get(jsonMessage.call.callid) && !calls.get(jsonMessage.call.callid).get("callStartTime")) {
                    dispatch(changeCallStatus(jsonMessage.call.callid, CALL_STATUSES.ringing));
                }
                break;

            case CALL_COMMANDS.unhold:
                if (calls.get(jsonMessage.call.callid)) {
                    dispatch(toggleOtherHold(jsonMessage.call.callid, false));
                }
                break;

            case CALL_COMMANDS.accept:
                if (calls.get(jsonMessage.call.callid)) {
                    if (jsonMessage.call.hasOwnProperty("properties") && jsonMessage.call.properties.hasOwnProperty("property") && jsonMessage.call.properties.property.hasOwnProperty("value")) {
                        jsonMessage.sdp = jsonMessage.sdp || jsonMessage.call.properties.property.value["#text"];
                    }
                    Log.i("jsonMessage-------------------", jsonMessage);
                    dispatch(setVideoAnswer(jsonMessage.call.callid, jsonMessage.sdp));
                    dispatch(changeCallStatus(jsonMessage.call.callid, CALL_STATUSES.answering));
                    if (lastCall.get("myVideo")) {
                        dispatch(sendVideoEnabled(jsonMessage.call.callid, jsonMessage.from));
                    }
                }
                break;

            case CALL_COMMANDS.hold:
                if (calls.get(jsonMessage.call.callid)) {
                    dispatch(toggleOtherHold(jsonMessage.call.callid, true));
                }
                break;

            case CALL_COMMANDS.video:
                if (calls.get(jsonMessage.call.callid)) {
                    const otherVideo: boolean = jsonMessage.call.videoon === "1" && jsonMessage.from.includes(DEVICE_TOKEN_PREFIX);
                    if (calls.getIn([jsonMessage.call.callid, "otherVideo"]) !== otherVideo) {
                        dispatch(toggleOtherVideo(jsonMessage.call.callid, otherVideo));
                    }
                }
                break;

            case CALL_COMMANDS.ice_candidate:
                if (calls.get(jsonMessage.call.callid)) {
                    dispatch(addIceCandidate(jsonMessage.call.callid, {
                        sdpMLineIndex: jsonMessage.call.sdpMLineIndex,
                        candidate: jsonMessage.call.candidate,
                        sdpMid: jsonMessage.call.sdpMid,
                        id: uuid().toString(),
                        from: jsonMessage.from && jsonMessage.from.split("/")[1]
                    }));
                }
                break;

            case CALL_COMMANDS.local_description:
                if (calls.get(jsonMessage.call.callid)) {
                    jsonMessage.sdp = jsonMessage.sdp || jsonMessage.call.properties.property.value["#text"];
                    dispatch(addLocalDescription(jsonMessage.call.callid, jsonMessage.sdp, jsonMessage.call.type, jsonMessage.call.onlySet));
                }
                break;

            default:
                Log.i("call handler");
                Log.i(jsonMessage);
                break;
        }
    }

    return true;
};

export const conferenceHandler = (jsonMessage: any) => {
    Log.i("handler -> conferenceHandler ->", jsonMessage)


    const store: Store<any> = storeCreator.getStore();
    const username: string = userNameSelector()(store.getState());
    const isIncomingCall: boolean = isConferenceIncomingCallSelector()(store.getState());
    const dispatch: any = store.dispatch;
    const {user} = selector(store.getState());

    if (jsonMessage.request && jsonMessage.request.xmlns && jsonMessage.request.xmlns === RECEIPTS_REQUEST_XMLNS) {
        Log.i("handler -> conferenceHandler -> 2", jsonMessage)
        const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
        const id: string = jsonMessage.call ? jsonMessage.call.callid : messageInfo ? messageInfo.callid : "";
        // const msgId: string = jsonMessage.call.callid;
        // const time: string = jsonMessage.delay && jsonMessage.delay.stamp ? format(jsonMessage.delay.stamp, DEFAULT_TIME_FORMAT) : format(new Date(), DEFAULT_TIME_FORMAT);
        // const threadId = jsonMessage.from.split("/").shift();
        // const roomId: string = jsonMessage.roomId || "";
        // dispatch(messageCallToReceiver({id, msgId, time, threadId, roomId}));
        dispatch(sendAckConference(id))

        // dispatch(sendXMLReceived({from: jsonMessage.to.split("/").shift(), id: jsonMessage.id, to: jsonMessage.from}));
    }

    if (jsonMessage.zcc) {
        switch (jsonMessage.zcc.command) {
            case CONFERENCE_COMMANDS.create: // Check if conference created and is valid call, set initialized true
                if (jsonMessage.zcc.isValid === '1') {
                    dispatch(initialized());
                }

                break;

            case CONFERENCE_COMMANDS.check: // Check conference call exist and join to call
                if (jsonMessage.zcc.isCallExist === '1') {
                    Log.i("conference -> check -> jsonMessage = ", jsonMessage)
                    dispatch(join(jsonMessage.zcc.roomName, jsonMessage.zcc.callid));
                }

                break;

            case CONFERENCE_COMMANDS.join: // Check if joined
                if (jsonMessage.zcc.isValid === '1') {
                    Log.i("handler -> conferenceHandler -> join = ", jsonMessage)
                    dispatch(startingConference(`${jsonMessage.zcc.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`));
                }

                break;
            default:
                Log.i("conference created handler");
                Log.i(jsonMessage);
                break;
        }
    }

    if (jsonMessage.msgType) {

        const from: string[] = jsonMessage.from.split("/");
        const memberId: string = from[1].replace(conf.app.prefix, "");

        switch (jsonMessage.msgType) {

            // Set current members state
            case MESSAGE_TYPES.room_call_current_members: {
                const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                const store: Store<any> = storeCreator.getStore();
                const {conferenceDetails, conversations, user} = selector(store.getState(), {
                    conferenceDetails: true,
                    conversations: true,
                    user: true
                });
                Log.i("conference -> room_call_current_members -> conferenceDetails = ", conferenceDetails.get("memberId"))
                // if (!conferenceDetails.get("memberId")) {
                //     setTimeout(() => {
                Log.i("conference -> room_call_current_members -> messageInfo = 1", messageInfo)

                const callId: string = messageInfo.callId;
                const conferenceOwner: boolean = memberId.includes(username);
                const threadId: string = `${messageInfo.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                let from = jsonMessage.from && jsonMessage.from.split("/")[1]
                const prefix: string = APP_CONFIG.PREFIX;
                from = from.slice(prefix.length)

                // 3730935980-3061045703
                // 1731239721-3061045703

                if (conversations.get(threadId)) {
                    const threadInfo = conversations.getIn([threadId, "threads", "threadInfo"])
                    Log.i("conference -> removedConferenceCallId = ", removedConferenceCallId)
                    Log.i("conference -> callId = ", callId)
                    if ((threadInfo.getIn(["conferenceLastCall", "callId"]) === callId &&
                        threadInfo.getIn(["conferenceLastCall", "deleted"]) === true) ||
                        removedConferenceCallId === callId
                    ) {
                        return
                    }
                    dispatch(initialized());
                    dispatch(changingConferenceDetails(callId, threadId, messageInfo, from, jsonMessage.initiator))
                } else {
                    const id: string = `msgId${Date.now()}`;

                    const request: any = {
                        id: messageInfo.roomName,
                        action: "changingConferenceDetails",
                        params: {id, callId, threadId, messageInfo, from, initiator: jsonMessage.initiator},
                        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
                    };

                    dispatch(addRequest(request));
                    // setTimeout(() => {
                    //     dispatch(initialized());
                    //     dispatch(changingConferenceDetails(callId, threadId, messageInfo, from, jsonMessage.initiator))
                    // }, 3000)
                }


                // dispatch(setStatus(`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`, CONFERENCE_COMMANDS.join, !own));

                // If initiator is current user set call to answering ( and show timer)
                // if (conferenceOwner) {
                //     Log.i("conference -> room_call_current_members -> messageInfo = 2", messageInfo)
                //     dispatch(changeCallStatus(callId, CALL_STATUSES.answering));
                // } else {
                //
                // }


                //     }, 3000)
                // }

                dispatch(addMembersSettings(messageInfo.participantHoldMap, messageInfo.participantMuteMap, messageInfo.initiator, user.get("id")))


                // dispatch(startingConference(`${jsonMessage.zcc.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`));

                // const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                // const memberStatusMap: any = messageInfo && messageInfo.memberStatusMap;
                //
                // Log.i("room_call_current_members -> jsonMessage = ", jsonMessage)
                //
                // // dispatch(addMembersSettings(messageInfo.participantHoldMap, messageInfo.participantMuteMap, messageInfo.initiator))
                //
                // if (memberStatusMap) {
                //     const membersStatuses: any = {};
                //     for (const item in memberStatusMap) {
                //         if (memberStatusMap.hasOwnProperty(item) && memberStatusMap[item] !== CONFERENCE_COMMANDS.calling.toUpperCase()) {
                //             Log.i("room_call_current_members -> item = ", item)
                //             membersStatuses[`${item}@${SINGLE_CONVERSATION_EXTENSION}`] = memberStatusMap[item].toLowerCase();
                //         }
                //     }
                //     // dispatch(setStatuses(membersStatuses));
                // }
                break;
            }

            // Set current member to ringing
            case MESSAGE_TYPES.room_call_ringing:
                // dispatch(setStatus(`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`, CONFERENCE_COMMANDS.ringing));
                break;

            // Conference set current member to decline
            case MESSAGE_TYPES.room_call_decline:
                dispatch(setStatus(`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`, CONFERENCE_COMMANDS.decline, true));
                if (isIncomingCall) {
                    const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                    removedConferenceCallId = messageInfo.callId
                    const groupId: string = `${messageInfo.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                    dispatch(endConference(groupId));
                }
                break;

            case MESSAGE_TYPES.room_call_hold:
                const msgInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);

                const participantHoldMap = msgInfo.participantHoldMap

                dispatch(holdMembers(participantHoldMap))

                break;

            // Set current member to join
            case MESSAGE_TYPES.room_call_join: {
                const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                const callId: string = messageInfo.callId;
                const owner: boolean = memberId.includes(username);

                // const threadId: string = `${messageInfo.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                // let from = jsonMessage.from && jsonMessage.from.split("/")[1]
                // const prefix: string = APP_CONFIG.PREFIX;
                // from = from.slice(prefix.length)

                // Log.i("room_call_join2222 -> ", jsonMessage)
                // Log.i("room_call_join2222 -> to", jsonMessage.to)
                // Log.i("room_call_join2222 -> username", username)
                // Log.i("room_call_join -> from = ", from)
                // dispatch(initialized());
                // const msgInfo = JSON.parse(jsonMessage.msgInfo)
                //
                // Log.i("room_call_join -> msgInfo = ", messageInfo)
                //
                // if (jsonMessage.to.slice(prefix.length) === username) {
                //     dispatch(changingConferenceDetails(callId, threadId, messageInfo, from, jsonMessage.initiator))
                // }


                // setTimeout(() => {
                //     dispatch(setStatus(`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`, CONFERENCE_COMMANDS.join, !owner));
                // }, 500)

                //
                // // If initiator is current user set call to answering ( and show timer)
                //
                if (owner) {
                    dispatch(changeCallStatus(callId, CALL_STATUSES.join));
                } else {

                }

                break;
            }

            // Set current member to leave
            case MESSAGE_TYPES.room_call_leave: {
                const store: Store<any> = storeCreator.getStore();
                const {conferenceDetails, conversations, user} = selector(store.getState(), {
                    conferenceDetails: true,
                    conversations: true,
                    user: true
                });
                const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                const groupId: string = `${messageInfo.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                const groupInfo = conversations.get(groupId).toJS().threads
                const threadInfo: any = groupInfo.threadInfo
                const activeMembers: any = threadInfo.activeMembers || {}
                const pasiveMembers: any = threadInfo.pasiveMembers || {}
                if (pasiveMembers[`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`] && `${memberId}@${SINGLE_CONVERSATION_EXTENSION}` !== user.get("id")) {
                    delete pasiveMembers[`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`]
                }
                if (activeMembers[`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`]) {
                    delete activeMembers[`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`]
                    for(let i = 0; i < Object.keys(pasiveMembers).length; i++) {
                        if (Object.keys(pasiveMembers)[i] !== user.get("id")) {
                            activeMembers[Object.keys(pasiveMembers)[i]] = pasiveMembers[Object.keys(pasiveMembers)[i]]
                            delete pasiveMembers[Object.keys(pasiveMembers)[i]]
                            break
                        }
                    }
                }
                Log.i("conference -> conferenceDetails", conferenceDetails.get("statuses"))
                const statusMap = threadInfo.statusMap || {}

                statusMap[`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`] = CONFERENCE_COMMANDS.leave;
                dispatch(setStatus(`${memberId}@${SINGLE_CONVERSATION_EXTENSION}`, CONFERENCE_COMMANDS.leave, true));
                dispatch(updateConversationProps(groupId, {statusMap, pasiveMembers, activeMembers})),
                IDBConversation.updateGroup(groupId, {
                    statusMap,
                    activeMembers,
                    pasiveMembers
                })
                break;
            }

            // End conference
            case MESSAGE_TYPES.room_call_end: {
                Log.i("conference -> room_call_end -> handler", "12345")
                const messageInfo: any = jsonMessage.msgInfo && JSON.parse(jsonMessage.msgInfo);
                removedConferenceCallId = messageInfo.callId
                const groupId: string = `${messageInfo.roomName}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                dispatch(endConference(groupId));
                break;
            }

            case MESSAGE_TYPES.room_call_start: {
                Log.i("conference -> room_call_start -> handler ", jsonMessage)
                dispatch(getedStartMessage());
                break;
            }

            default:
                Log.i("conference type group_chat handlers");
                Log.i(jsonMessage);
                break;
        }
    }

    if (jsonMessage.call) {
        const callId: string = jsonMessage.call.callid;
        const from: string = jsonMessage.from;

        switch (jsonMessage.call.command) {

            case CONFERENCE_COMMANDS.invite:

                writeLog(LOG_TYPES.call, {
                    command: CONFERENCE_COMMANDS.invite,
                    from,
                    callId
                });

                const fromInfo: string[] = from ? from.split("/") : [];
                const memberId: string = fromInfo[1] || "";
                const own: boolean = memberId.includes(username);
                const call: any = {
                    callInfo: {
                        audio: {
                            candidate: jsonMessage.call.acandidate,
                            proxy: jsonMessage.call.aproxy,
                            codec: jsonMessage.call.acodec
                        },
                        video: {
                            candidate: jsonMessage.call.vcandidate,
                            proxy: jsonMessage.call.vproxy,
                            codec: jsonMessage.call.vcodec
                        },
                        device: {
                            height: jsonMessage.call.dheight,
                            width: jsonMessage.call.dwidth
                        },
                        version: jsonMessage.call.version,
                    },
                    callPrototype: jsonMessage.call.prototype,
                    callTime: jsonMessage.call.callTime,
                    callId: jsonMessage.call.callid,
                    id: jsonMessage.call.callid,
                    iceCandidates: {},
                    status: CALL_STATUSES.calling,
                    groupId: fromInfo ? fromInfo[0].split("@")[0] : "",
                    to: fromInfo[0] || "",
                    ownCall: own,
                    username,
                    from
                };

                dispatch(conferenceRinging(call));



                Log.i("conference invite -> 1", jsonMessage)

                // If initiator is current user after ringing send accept
                if (own) {
                    Log.i("conference invite -> 2", jsonMessage)
                    dispatch(conferenceAccept());
                } else {
                    Log.i("conference invite -> 3", jsonMessage)
                    dispatch(onJoinCall(call.groupId, call.callId));

                    // dispatch(conferenceAccept());
                }


                // const threadId: string = `${call.groupId}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                // Initialized conference and show incoming call
                // dispatch(initialized());
                // dispatch(setIncomingCall());
                // dispatch(startingConference(threadId, own));


                break;

            default:
                Log.i("conference type chat handler");
                Log.i(jsonMessage);
                break;
        }
    }

    return true;
};

const presenceHandler: any = message => {
    Log.i("handler -> presenceHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const {contacts, selectedThread, selectedThreadId} = selector(store.getState(), {
        selectedThreadId: true,
        selectedThread: true,
        contacts: true
    });

    const username: string = userNameSelector()(store.getState());

    const threadIsEmpty = selectedThread.get("threads").isEmpty();

    Log.i("presenceHandler_message", message)

    const jsonMessage: any = xmlToJson(message);

    Log.i("jsonMessage_message", message)

    if (jsonMessage.from.startsWith("111")) {
        if (jsonMessage.to) {
            if (getUsername(jsonMessage.to) === username) {
                const isEnabled = jsonMessage.zpresence.status === "available";
                dispatch(settingsUpdate("privacy", "showOnlineStatus", isEnabled));
                return true;
            }
        }
        return true;
    }

    const id: string = getUserId(getUsername(jsonMessage.from));


    if (jsonMessage.from && jsonMessage.zpresence && jsonMessage.zpresence.type && jsonMessage.zpresence.command === "getStatus") {
        const status: boolean = jsonMessage.zpresence.type === ONLINE_CONTACT_STATUS;
        if (status && selectedThreadId.includes(id)) {
            dispatch(userBecameOnline(selectedThreadId))

        } else {
            const lastActivity: string = (jsonMessage.zpresence.lastActivity && jsonMessage.zpresence.lastActivity > 1) ?
                format(Date.now() - jsonMessage.zpresence.lastActivity * 1000, DEFAULT_TIME_FORMAT) :
                format(new Date(), DEFAULT_TIME_FORMAT);
            if (selectedThreadId.includes(id)) {
                dispatch(userBecameOffline(selectedThreadId,lastActivity))
            }
        }
    } else {
        Log.i("presence handler");
        Log.i(jsonMessage);
    }

    if (contacts.has(id) && !contacts.getIn([id, "members", id, "isProductContact"])) {
        dispatch(attemptToggleProductContact(id));
    }

    return true;
};

const inviteHandler: any = async message => {
    Log.i("handler -> inviteHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const {user, threads, selectedThreadId, selectedThread, conversations} = selector(store.getState(), {
        user: true,
        threads: true,
        selectedThreadId: true,
        selectedThread: true
    });
    const jsonMessage: any = xmlToJson(message);
    Log.i("#inviteHandler");
    Log.i(jsonMessage);

    if (jsonMessage.from && jsonMessage.x && jsonMessage.x[0].invite && jsonMessage.x[0].invite.reason === INVITE_REASON) {
        const username: string = user.get("username");
        // let partialId: string = jsonMessage.from.split("@").shift();
        let groupId: string = `${jsonMessage.from.split("/")}/${username}`;




        // let getInfo: boolean = true;

        // if (conf.app.prefix) {
        //     partialId = partialId.split(conf.app.prefix).pop();
        // }

        if (selectedThreadId === groupId) {
            // const threadInfo = selectedThread.getIn(['threads', 'threadInfo']);
            const threadInfo = conversations.getIn([groupId, 'threads', 'threadInfo']);

            if (!threadInfo.get("groupMembersUsernames").includes(username) && threadInfo.get("disabled")) {
                // getInfo = false;
                dispatch(attemptEnableGroup(groupId, username));
            }
        } else {
            const thread: any = await IDBConversation.getThread(groupId);
            let threadInfo = thread && fromJS(thread);
            threadInfo = threadInfo && threadInfo.getIn(['threads', 'threadInfo']);



            if (threadInfo && !threadInfo.get("groupMembersUsernames").includes(username) && threadInfo.get("disabled")) {
                // getInfo = false;
                dispatch(attemptEnableGroup(groupId, username));

            }
        }
        // dispatch(invitedToGroup(partialId, username, getInfo)); it's no needed in large groups case
    } else {
        Log.i("invite handler");
        Log.i(jsonMessage);
    }

    return true;
};

const pingHandler: any = message => {
    Log.i("handler -> pingHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const jsonMessage: any = xmlToJson(message);
    const dispatch: any = store.dispatch;
    const from: string = jsonMessage.to;
    const to: string = jsonMessage.from;
    const id: string = jsonMessage.id;

    // dispatch(sendPong({from, id, to}));

    return true;
};

const iqHandler: any = message => {
    Log.i("handler -> iqHandler ->", message)
    const jsonMessage: any = xmlToJson(message);

    if (jsonMessage.type === "time" && jsonMessage.time) {
        localStorage.setItem(DIFF_TIME, JSON.stringify(Date.now() - +jsonMessage.time));
    }

    return true;
};

const carbonHandler: any = (message) => {
    Log.i("handler -> carbonHandler ->", message)
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;
    const selectorParams: any = {
        user: true
    };

    Log.i("carbonHandler", "1")
    const {user} = selector(store.getState(), selectorParams);
    const jsonMessage: any = xmlToJson(message);
    Log.i("carbonHandler", jsonMessage)
    const username: string = user.get("username");
    const connectionUsername: string = getConnectionUsername(user.get("username"));

    // Log.i("carbonHandler", "jsonMessage.from ", jsonMessage.from)
    // Log.i("carbonHandler", "connectionUsername.split(\"/\").shift() -> ", connectionUsername.split("/").shift())
    // Log.i("carbonHandler", "jsonMessage.sent ", jsonMessage.sent)
    // Log.i("carbonHandler", "jsonMessage.sent.forwarded ", jsonMessage.sent.forwarded)


    if (jsonMessage.http && jsonMessage.http.command === "login") {
        Log.i("carbonHandler -> premium = ", jsonMessage.http.premium)

        dispatch(setPremium(jsonMessage.http.premium))
    }
    if (jsonMessage.from && jsonMessage.from === connectionUsername.split("/").shift() && jsonMessage.sent && jsonMessage.sent.forwarded) {
        Log.i("carbonHandler", "4")
        const forwardedMessage: any = jsonMessage.sent.forwarded.message;


        if (forwardedMessage.http && forwardedMessage.http.command === "login" && forwardedMessage.http.uid !== connectionUsername.split("/").pop()) {


            if (user && user.size > 0) {
                writeLog(LOG_TYPES.connection, {
                    msg: "AUTHFAIL",
                    info: "sign in from another resource (handlers)",
                    username
                });
                const event = new Date()
                Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                    msg: "AUTHFAIL",
                    info: "sign in from another resource (handlers)",
                    username
                })
                dispatch(SIGN_OUT(false, false));
                return true;
            }
        }

        Log.i("forwardedMessage -> ", forwardedMessage)

        if (forwardedMessage.body && !forwardedMessage.displayed && !forwardedMessage.delivered && !forwardedMessage.received) {
            Log.i("carbonHandler", "5")
            dispatch(carbonMessageHandlerAction(forwardedMessage));
        } else if (forwardedMessage.zmuc && forwardedMessage.zmuc && forwardedMessage.zmuc.command === "create") {
            Log.i("carbonHandler", "6")
            dispatch(joinGroups([forwardedMessage.zmuc.room_name], username))
        } else if (forwardedMessage.zmuc && forwardedMessage.zmuc.command === GET_INFO_XML_COMMAND) {
            Log.i("carbonHandler", "7")
            Log.i("carbonHandler group info", forwardedMessage)
            dispatch(attemptUpdateGroupInfo(forwardedMessage.zmuc));
        } else {
            Log.i("carbonHandler", "8")
        }
        // const id: string = forwardedMessage.id;
        // const msgId: string = forwardedMessage.id;
        // const time: string = moment().format(DEFAULT_TIME_FORMAT);
        // const threadId = forwardedMessage.from.split("/").shift();
        //

        // if (forwardedMessage.ack.command === 'delivered') {
        //     dispatch(messageDeliveredToReceiver({id, msgId, time, threadId}));
        // }
        //
        // if (forwardedMessage.displaye) {
        //     dispatch(messageDisplayedToReceiver({msgId, time, threadId}));
        // }


        if(forwardedMessage.zpresence && forwardedMessage.zpresence.command === "available") {
            dispatch(settingsUpdateRequest("privacy", "showOnlineStatus", true))
        }

        if(forwardedMessage.zpresence && forwardedMessage.zpresence.command === "unavailable") {
            dispatch(settingsUpdateRequest("privacy", "showOnlineStatus", false))
        }

        const time = Date.now()
        const prefix: string = APP_CONFIG.PREFIX;
        if (forwardedMessage.displayed) {
            dispatch(messageDisplayedToReceiver({msgId: forwardedMessage.id, time, roomId: forwardedMessage.to.replace(prefix, "")}));
        }

        if (forwardedMessage.received) {
            dispatch(messageDeliveredToReceiver({id: forwardedMessage.id, msgId: forwardedMessage.id, time, roomId: forwardedMessage.to.replace(prefix, "")}));
        }
    }

    return true;
};

const errorHandler: any = message => {
    Log.i("handler -> errorHandler ->", message)
    const jsonMessage: any = xmlToJson(message);
    const {error} = jsonMessage;
    console.error(jsonMessage);
    writeLog(LOG_TYPES.websocket_error, jsonMessage, LOGS_LEVEL_TYPE.error);

    if (error && error.code === "404" && error.type === XML_MESSAGE_TYPES.cancel) {
        const connection = connectionCreator.getConnection();

        if (connection.connected) {
            connection.disconnect();
        }
    }

    return true;
};

const loginHandler: any = message => {
    Log.i("handler -> loginHandler ->", xmlToJson(message))
    // const jsonMessage: any = xmlToJson(message);
    // const {error} = jsonMessage;
    // console.error(jsonMessage);
    // writeLog(LOG_TYPES.websocket_error, jsonMessage, LOGS_LEVEL_TYPE.error);
    //
    // if (error && error.code === "404" && error.type === XML_MESSAGE_TYPES.cancel) {
    //     const connection = connectionCreator.getConnection();
    //
    //     if (connection.connected) {
    //         connection.disconnect();
    //     }
    // }
    //
    // return true;
};

export default (showNotification): Array<any> => {
    _showNotification = showNotification;

    const handlers: Array<any> = [];

    handlers.push([responseMessageHandler, ACK_XMLNS, "message"]);

    handlers.push([responseMessageHandler, "zangi:privacy", "message"]);

    handlers.push([responseMessageHandler, "zangi:zmuc", "message"]);

    handlers.push([errorHandler, null, "error", XML_MESSAGE_TYPES.cancel]);

    handlers.push([groupMessageHandler(showNotification), null, "message", XML_MESSAGE_TYPES.group]);

    handlers.push([carbonHandler, CARBONS_2_REQUEST_XMLNS, "message"]);

    handlers.push([messageHandler(showNotification), "zangi:call" || null, "message", XML_MESSAGE_TYPES.chat]);

    handlers.push([inviteHandler, "http://jabber.org/protocol/muc#user", "message"]);

    handlers.push([deliveredMessageHandler, XML_REQUEST_XMLNS, "message"]);

    handlers.push([voipMessageHandler(showNotification), "urn:xmpp:hints", "message"]);

    handlers.push([displayedMessageHandler, EVENT_XMLNS, "message"]);

    handlers.push([presenceHandler, "zangi:zpresence", "presence"]);

    handlers.push([pingHandler, "urn:xmpp:ping", "iq", "get"]);

    handlers.push([iqHandler, null, 'iq', null, null, null]);

    return handlers;
};
