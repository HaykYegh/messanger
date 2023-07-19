"use strict";

import {call, delay, fork, put, takeEvery, takeLatest} from "redux-saga/effects";
import format from "date-fns/format";

import * as builders from "xmpp/XMLBuilders";
import {deleteRoom} from "xmpp/XMLBuilders";
import connectionCreator from "xmpp/connectionCreator";
import {DEFAULT_TIME_FORMAT} from "configs/constants";
import {getDateDifference} from "helpers/DateHelper";
import {actions} from "./RequestsReducer";
import IDBRequest from "services/database/class/Request";
import {addRequests, REQUESTS_SEND_SUCCESS} from "modules/requests/RequestsActions";
import {UPDATE_PROFILE_OFFLINE} from "modules/user/UserActions";
import Log from "modules/messages/Log";
import {_uploadFile} from "modules/messages/MessagesSaga";

function* resendRequest({payload: {requests}}: any): any {
    const connection: any = connectionCreator.getConnection();
    let msg: Strophe.Builder;
    let keys = Object.keys(requests);
    if (keys) {
        keys = keys.sort();
    }
    for (let key of keys) {
        const request = requests[key];
        if (getDateDifference(request.createdAt, format(new Date(), DEFAULT_TIME_FORMAT)) < 5) {
            return;
        }

        if (request.waitForResponse) {
            continue;
        }

        switch (request.xmlBuilder) {
            case "leaveOrRemoveSomeoneFromGroupXML":
                msg = builders.leaveOrRemoveSomeoneFromGroupXML(request.params);
                break;
            case "messageDisplayedReceivedXML":
                // msg = builders.messageDisplayedReceivedXML(request.params);
                break;
            case "messageDeliveredReceivedXML":
                // msg = builders.messageDeliveredReceivedXML(request.params);
                break;
            case "toggleContactBlockXML":
                msg = builders.toggleContactBlockXML(request.params);
                break;
            case "inviteGroupMembersXML":
                msg = builders.inviteGroupMembersXML(request.params);
                break;
            case "getGroupInfoXML":
                msg = builders.getGroupInfoXML(request.params);
                break;
            case "changeGroupNameXML":
                msg = builders.changeGroupNameXML(request.params);
                break;
            case "messageSeenXML":
                // msg = builders.messageSeenXML(request.params);
                break;
            case "sendMessageXML":
                yield call(_uploadFile, {message: request.params, messageToSave: request.messageToSave}, request.file);
                msg = builders.getMessageXMLForSend(request.params);
                break;
            case "createGroupXML":
                msg = builders.createGroupXML(request.params);
                break;
            case "XMLReceivedXML":
                msg = builders.XMLReceivedXML(request.params);
                break;
            case "sendFileXML":
                yield call(_uploadFile, {message: request.params, messageToSave: request.messageToSave}, request.file);
                msg = builders.getMessageXMLForSend(request.params);
                break;
            case "sendMediaXML":
                yield call(_uploadFile, {message: request.params, messageToSave: request.messageToSave}, request.file);
                msg = builders.getMessageXMLForSend(request.params);
                break;
            case "memberEditName":
                msg = builders.memberEditName(request.params);
                break;
            case "memberAddMember":
                msg = builders.memberAddMember(request.params);
                break;
            case "memberEditAvatar":
                msg = builders.memberEditAvatar(request.params);
                break;
            case "leaveOwner":
                msg = builders.leaveOwner(request.params);
                break;
            case "deleteRoom":
                msg = builders.deleteRoom(request.params);
                break;
            case "changeRole":
                msg = builders.changeRole(request.params);
                break;
            case "changeRoleAll":
                msg = builders.changeRoleAll(request.params);
                break;
            case "profileUpdate":
                yield put(UPDATE_PROFILE_OFFLINE(request.params));
                break;
            default:
                console.dir("XML builder didn't match!");
                console.dir(request);
                break;
        }
        if (!connection.connected && !navigator.onLine) {
            break;
        }
        Log.i(msg, "msg2222222")
        if (msg && connection.connected && navigator.onLine) {

            connection.send(msg);
            yield delay(50);
        }
    }
}

function* attemptAddRequest({payload: {request}}): any {
    yield fork(IDBRequest.addRequest, request)
}

function* attemptRemoveRequest({payload: {id}}): any {
    yield fork(IDBRequest.deleteRequest, id)
}

export function* attemptAddRequests() {
    const dbRequestsCount = yield call(IDBRequest.getRequestsCount);

    if (dbRequestsCount[0].count > 0) {
        const dbRequests: any = yield call(IDBRequest.getRequests);
        const requests: Object = {};
        for (const request of dbRequests) {
            requests[request.id] = request
        }
        yield put(addRequests(requests))
    }
}

function* REQUESTS_SEND_HANDLER({payload: {requests}}): any {
    try {
        yield call(IDBRequest.insertRequests, Object.values(requests));
        yield put(REQUESTS_SEND_SUCCESS(requests));
    } catch (e) {
        Log.i("###############REQUESTS_SEND_HANDLER##################");
        Log.i(e);
        Log.i("###############REQUESTS_SEND_HANDLER##################");
    }
}

function* requestsSaga(): any {
    yield takeLatest(actions.RESEND_REQUEST, resendRequest);
    yield takeEvery(actions.ADD_REQUEST, attemptAddRequest);
    yield takeEvery(actions.REMOVE_REQUEST, attemptRemoveRequest);


    yield takeEvery(actions.REQUESTS_SEND, REQUESTS_SEND_HANDLER);
}

export default requestsSaga;
