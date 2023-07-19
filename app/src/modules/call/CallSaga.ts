"use strict";

import {fromJS, List} from "immutable";
import {Store} from "react-redux";
import format from "date-fns/format";
import {all, put, takeEvery} from "redux-saga/effects";

import {
    callAcceptedXML,
    callVideoOnOffXML,
    declineCallXML,
    hangUpCallXML,
    inviteToCallXML,
    ringingXML,
    sendIceCandidateXML,
    sendLocalDescriptionXML,
    sendVideoEnabledXML,
    toggleCallHoldXML
} from "xmpp/XMLBuilders";
import {
    CALL_AUDIO_PARAMS,
    CALL_DEVICE_PARAMS,
    CALL_STATUSES,
    CALL_VERSION,
    CALL_VIDEO_PARAMS,
    DEFAULT_TIME_FORMAT,
    LOG_TYPES,
    MESSAGE_TYPES
} from "configs/constants";
import {
    addCall,
    addCallHistory,
    changeCallStatus,
    removeCall,
    toggleMyHold,
    toggleVideo as toggle
} from "modules/call/CallActions";
import {attemptCreateConversation} from "modules/conversations/ConversationsActions";
import {getNotificationText, getUserId, writeLog} from "helpers/DataHelper";
import {ACTIVATE_CALLER_THREAD, FOCUS_APPLICATION, setSelectedThreadId} from "modules/application/ApplicationActions";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {addMessage} from "modules/messages/MessagesActions";
import connectionCreator from "xmpp/connectionCreator";
import {getMessageText} from "helpers/MessageHelper";
import {actions} from "modules/call/CallReducer";
import {getCallTime} from "helpers/DateHelper";
import storeCreator from "helpers/StoreHelper";
import components from "configs/localization";
import selector from "services/selector";
import Log from "modules/messages/Log";

function* sendIceCandidate({payload: {to, callid, sdpMLineIndex, sdpMid, candidate, outCall}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = sendIceCandidateXML({
        sdpMLineIndex,
        candidate,
        sdpMid,
        callid,
        to,
        outCall
    });

    if (connection.connected) {
        connection.send(msg);
    }
}

function* inviteToCall({payload: {call, addNewCall}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = inviteToCallXML({
        prototype: call.callerData.callPrototype,
        deviceParams: call.callerData.device,
        audioParams: call.callerData.audio,
        videoParams: call.callerData.video,
        version: call.callerData.version,
        callTime: call.callTime,
        isVideo: call.myVideo,
        outCall: call.outCall,
        sdp: call.callerSdp,
        callid: call.id,
        to: call.to,
        email: call.email,
        firstName: call.firstName,
        lastName: call.lastName
    });

    if (connection.connected) {
        writeLog(LOG_TYPES.send_call, {
            prototype: call.callerData.callPrototype,
            deviceParams: call.callerData.device,
            audioParams: call.callerData.audio,
            videoParams: call.callerData.video,
            version: call.callerData.version,
            callTime: call.callTime,
            isVideo: call.myVideo,
            outCall: call.outCall,
            sdpExists: !!call.callerSdp,
            callid: call.id,
            to: call.to
        });
        connection.send(msg);
    }

    if (addNewCall) {
        yield put(addCall(call));
    }
}

function* toggleVideo({payload: {id, isVideo, to}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = callVideoOnOffXML({
        videoon: isVideo ? "1" : "0",
        callid: id,
        id: msgId,
        to
    });

    if (connection.connected) {
        connection.send(msg);
    }

    yield put(toggle(id, isVideo));
}

function* attemptRemoveCall({payload: {call, showNotification}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId, contacts, user} = selector(store.getState(), {
        selectedThreadId: true,
        contacts: {contacts: true},
        user: {user: true},
    });
    const username: string = user.get("username");
    yield put(removeCall(call.get("id")));
    const localization = components().messageElement;
    const inCall: boolean = !!call.get("callStartTime");
    const currentTime: any = Date.now();
    const msgId: string = `msgId${currentTime}`;
    const effects: Array<any> = [];

    // const message: any = {
    //     type: call.get("ownCall") ? MESSAGE_TYPES.outgoing_call : (call.get("status") === CALL_STATUSES.decline || !call.get("ownCall") && !inCall) ? MESSAGE_TYPES.missed_call : MESSAGE_TYPES.incoming_call,
    //     threadId: call.get("to").includes(SINGLE_CONVERSATION_EXTENSION) ? call.get("to") : `${call.get("to")}@${SINGLE_CONVERSATION_EXTENSION}`,
    //     text: call.get("ownCall") ? localization.outgoingCall : (call.get("status") === CALL_STATUSES.decline || !call.get("ownCall") && !inCall) ? localization.missedCall : localization.incomingCall,
    //     own: call.get("ownCall") ? true : call.get("status") === CALL_STATUSES.decline ? false : false,
    //     createdAt: format(+call.get("callTime"), DEFAULT_TIME_FORMAT),
    //     info: getCallTime(Date.now() / 1000 - call.get("callStartTime")),
    //     otherVideo: call.get("otherVideo"),
    //     myVideo: call.get("myVideo"),
    //     creator: call.get("caller"),
    //     fileRemotePath: null,
    //     id: `msgId${Date.now()}`,
    //     time: Date.now(),
    //     fileSize: null
    // };

    const message: any = {
        conversationId: call.get("to").includes(SINGLE_CONVERSATION_EXTENSION) ? call.get("to") : `${call.get("to")}@${SINGLE_CONVERSATION_EXTENSION}`,
        createdAt: format(+call.get("callTime"), DEFAULT_TIME_FORMAT),
        creator: call.get("caller"),
        deleted: false,
        delivered: false,
        dislikes: 0,
        edited: false,
        email: '',
        fileLink: '',
        fileRemotePath: null,
        fileSize: null,
        hidden: undefined,
        info: getCallTime(currentTime / 1000 - call.get("callStartTime")),
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
        own: call.get("ownCall") ? true : call.get("status") === CALL_STATUSES.decline ? false : false,
        pid: undefined,
        previousMessageId: undefined,
        repid: "",
        seen: false,
        sid: undefined,
        status: false,
        text: call.get("ownCall") ? localization.outgoingCall : (call.get("status") === CALL_STATUSES.decline || !call.get("ownCall") && !inCall) ? localization.missedCall : localization.incomingCall,
        threadId: call.get("to").includes(SINGLE_CONVERSATION_EXTENSION) ? call.get("to") : `${call.get("to")}@${SINGLE_CONVERSATION_EXTENSION}`,
        time: currentTime,
        type: call.get("ownCall") ? MESSAGE_TYPES.outgoing_call : (call.get("status") === CALL_STATUSES.decline || !call.get("ownCall") && !inCall) ? MESSAGE_TYPES.missed_call : MESSAGE_TYPES.incoming_call,
        otherVideo: call.get("otherVideo"),
        myVideo: call.get("myVideo"),
    };

    if(message.threadId === selectedThreadId) {
        effects.push(put(addMessage(message)));
    }

    effects.push(put(addCallHistory(call.get("id"), call)));
    effects.push(put(attemptCreateConversation(message, false, selectedThreadId === message.threadId)));
    yield all(effects);

    if (call.get("caller") !== username) {
        const senderId = getUserId(call.get("caller"));
        if (selectedThreadId !== message.threadId && message.type === MESSAGE_TYPES.missed_call && call.get("status") === CALL_STATUSES.hangedUp) {
            const text = getNotificationText(message, getMessageText.bind(
                this, fromJS(message), contacts, username, true)
            );
            showNotification(text, senderId, message.threadId);
        }
    }
}

function* invitedToCall({payload: {id, call}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;

    const msg: Strophe.Builder = ringingXML({
        deviceParams: CALL_DEVICE_PARAMS,
        audioParams: CALL_AUDIO_PARAMS,
        videoParams: CALL_VIDEO_PARAMS,
        version: CALL_VERSION,
        to: call.caller,
        callid: id,
        id: msgId
    });

    if (connection.connected) {
        connection.send(msg);
    }

    call.status = CALL_STATUSES.ringing;
    yield put(addCall(call));
}

function* acceptCall({payload: {id, to, sdp}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = callAcceptedXML({
        deviceParams: CALL_DEVICE_PARAMS,
        audioParams: CALL_AUDIO_PARAMS,
        videoParams: CALL_VIDEO_PARAMS,
        version: CALL_VERSION,
        callid: id,
        id: msgId,
        sdp,
        to
    });

    if (connection.connected) {
        connection.send(msg);
    }

    yield put(changeCallStatus(id, CALL_STATUSES.answering));
    yield put(setSelectedThreadId(to.includes(SINGLE_CONVERSATION_EXTENSION) ? to : `${to}@${SINGLE_CONVERSATION_EXTENSION}`));
    yield put(ACTIVATE_CALLER_THREAD())
}

function* hold({payload: {id, holded, to}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = toggleCallHoldXML({
        hold: !holded,
        callid: id,
        id: msgId,
        to
    });

    if (connection.connected) {
        connection.send(msg);
    }

    yield put(toggleMyHold(id));
}

function* declineCall({payload: {id, to, outCall}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = declineCallXML({
        callid: id,
        id: msgId,
        to,
        outCall
    });

    if (connection.connected) {
        connection.send(msg);
    }

    yield put(changeCallStatus(id, CALL_STATUSES.decline));
}

function* hangUp({payload: {id, to, outCall}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = hangUpCallXML({
        callid: id,
        id: msgId,
        to,
        outCall
    });

    if (connection.connected) {
        connection.send(msg);
    }

    yield put(changeCallStatus(id, CALL_STATUSES.hangedUp));
}

function* sendVideoEnabled({payload: {callid, from}}) {
    from = from.includes('/') ? from.split('/').shift() : from;
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `${Date.now()}`;
    const msg: Strophe.Builder = sendVideoEnabledXML({
        videoon: "1",
        callid,
        id: msgId,
        to: from
    });

    if (connection.connected) {
        connection.send(msg);
    }
}

function* sendLocalDescription({payload: {to, callid, sdp, type, onlySet}}) {
    const connection: any = connectionCreator.getConnection();
    const msg: Strophe.Builder = sendLocalDescriptionXML({
        callid,
        to,
        sdp,
        type,
        onlySet
    });

    if (connection.connected) {
        connection.send(msg);
    }
}

function* handleChangeCallStatus({payload: {inCall}}) {
    if(!document.hasFocus() && inCall) {
        yield put(FOCUS_APPLICATION(false));
    }
}

function* callSaga(): any {
    yield takeEvery(actions.SEND_LOCAL_DESCRIPTION, sendLocalDescription);
    yield takeEvery(actions.ATTEMPT_REMOVE_CALL, attemptRemoveCall);
    yield takeEvery(actions.SEND_VIDEO_ENABLED, sendVideoEnabled);
    yield takeEvery(actions.CHANGE_STATUS, handleChangeCallStatus);
    yield takeEvery(actions.SEND_ICE_CANDIDATE, sendIceCandidate);
    yield takeEvery(actions.ATTEMPT_TOGGLE_VIDEO, toggleVideo);
    yield takeEvery(actions.INVITED_TO_CALL, invitedToCall);
    yield takeEvery(actions.INVITE_TO_CALL, inviteToCall);
    yield takeEvery(actions.ATTEMPT_TOGGLE_HOLD, hold);
    yield takeEvery(actions.SEND_DECLINE, declineCall);
    yield takeEvery(actions.SEND_ACCEPT, acceptCall);
    yield takeEvery(actions.SEND_HANG_UP, hangUp);
}

export default callSaga;
