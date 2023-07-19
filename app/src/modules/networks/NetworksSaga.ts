"use strict";

import {
    addNetwork,
    setNetworkJoinPopUp,
    setSearchedNetwork,
    leaveNetworks,
    setNetworkLeavePopUp,
    setNetworkError,
    setNetworkToken, setNetworkKickedPopUp
} from "modules/networks/NetworksActions";
import {getNetwork, joinNetwork, leaveNetwork} from "requests/networksRequest";
import {call, put, takeEvery, takeLatest} from "redux-saga/effects";
import IDBNetwork from "services/database/class/Networks";
import {MESSAGE_TYPES, NETWORK_JOIN_POPUP} from "configs/constants";
import components from "configs/localization";
import {actions} from "./NetworksReducer";
import Log from "modules/messages/Log";

function* attemptGetNetwork({payload: {id, token}}) {
    try {
        if (id && id.length > 0) {
            const {data: {error, result}} = yield call(getNetwork, id);
            const localization = components().networks;
            if (error || !result) {
                if (token) {
                    yield put(setNetworkError(NETWORK_JOIN_POPUP.TOKEN));
                } else {
                    yield put(setNetworkError(NETWORK_JOIN_POPUP.NICKNAME));
                }
            } else if (result && result.networkId) {
                const {callName, description, label, networkId, nickname} = result;
                yield put(setSearchedNetwork(callName, description, label, networkId, nickname));
                if (token) {
                    yield put(setNetworkJoinPopUp(NETWORK_JOIN_POPUP.TOKEN));
                    yield put(setNetworkToken(id));

                } else {
                    yield put(setNetworkJoinPopUp(NETWORK_JOIN_POPUP.NICKNAME));
                }
            }
        }
        return;
    } catch (e) {
        Log.i(e);
    }
}

function* attemptAddNetwork({payload: {nicknameOrToken, network}}) {
    yield put(setNetworkJoinPopUp(""));
    const localization = components().networks;
    const {data: {error, result}} = yield call(joinNetwork, nicknameOrToken);
    if (error || !result) {
        Log.i("Add Network Error");
        //yield put(setNetworkError(NETWORK_JOIN_POPUP.NICKNAME));
        return;
    } else if (result && result.networkId) {
        yield put(addNetwork(Number(network.networkId), network));
        yield call(IDBNetwork.addNetwork, network);
    }
    return;
}

function* attemptLeaveNetwork({payload: {networkId}}) {
    yield put(setNetworkLeavePopUp(false, null));
    const {data: {error, result, errorMessage}} = yield call(leaveNetwork, networkId);

    if (result && result.leave || error && errorMessage === "NOT_JOINED") {
        yield put(leaveNetworks(networkId));
        yield call(IDBNetwork.deleteNetwork, networkId);
    } else if (error || !result) {
        Log.i("Leave Network Error");
    }
    return;
}

function* attemptNetworkHandler({payload: {type, info}}) {
    const networkInfo: any = JSON.parse(info);
    switch (type) {

        case MESSAGE_TYPES.network_leave:
            yield call(IDBNetwork.deleteNetwork, networkInfo.networkId);
            yield put(leaveNetworks(Number(networkInfo.networkId)));
            break;

        case MESSAGE_TYPES.network_update:
            yield call(IDBNetwork.updateNetwork, networkInfo.networkId, networkInfo);
            yield put(addNetwork(Number(networkInfo.networkId), networkInfo));
            break;

        case MESSAGE_TYPES.network_join:
            yield call(IDBNetwork.addNetwork, networkInfo);
            yield put(addNetwork(Number(networkInfo.networkId), networkInfo));
            break;

        case MESSAGE_TYPES.network_kick:
            Log.i(MESSAGE_TYPES.network_kick);
            yield call(IDBNetwork.deleteNetwork, networkInfo.networkId);
            yield put(leaveNetworks(Number(networkInfo.networkId)));
            yield put(setNetworkKickedPopUp(true));
            break;

        case MESSAGE_TYPES.network_delete:
            Log.i(MESSAGE_TYPES.network_delete);
            yield call(IDBNetwork.deleteNetwork, networkInfo.networkId);
            yield put(leaveNetworks(Number(networkInfo.networkId)));
            yield put(setNetworkKickedPopUp(true));
            break;
    }
}

function* networksSaga(): any {
    yield takeEvery(actions.ATTEMPT_GET_NETWORK, attemptGetNetwork);
    yield takeLatest(actions.ATTEMPT_ADD_NETWORK, attemptAddNetwork);
    yield takeLatest(actions.ATTEMPT_LEAVE_NETWORK, attemptLeaveNetwork);
    yield takeLatest(actions.ATTEMPT_NETWORK_HANDLER, attemptNetworkHandler);
}

export default networksSaga;
