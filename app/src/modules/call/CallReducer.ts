import {CALL_STATUSES} from "configs/constants";
import {fromJS, List, Map} from "immutable";
import {ICallActions} from "./CallActions";
import Log from "modules/messages/Log";

interface ICallReducerActions {
    SEND_LOCAL_DESCRIPTION: any;
    ADD_LOCAL_DESCRIPTION: string;
    REMOVE_ICE_CANDIDATE: string;
    ATTEMPT_TOGGLE_VIDEO: string;
    ATTEMPT_TOGGLE_HOLD: string;
    TOGGLE_OTHER_HOLDED: string;
    ATTEMPT_REMOVE_CALL: string;
    SEND_ICE_CANDIDATE: string;
    TOGGLE_OTHER_VIDEO: string;
    SEND_VIDEO_ENABLED: any;
    ADD_ICE_CANDIDATE: string;
    SET_VIDEO_ANSWER: string;
    TOGGLE_MY_HOLDED: string;
    ADD_CALL_HISTORY: string;
    SET_VIDEO_OFFER: string;
    TOGGLE_MY_VIDEO: string;
    INVITED_TO_CALL: string;
    INVITE_TO_CALL: string;
    DTMF_RECEIVED: string;
    CHANGE_STATUS: any;
    SEND_HANG_UP: string;
    SEND_DECLINE: string;
    SEND_ACCEPT: string;
    REMOVE_CALL: string;
    SEND_DTMF: string;
    ADD_CALL: string;
    SET_SDP: string;
    RESET: string;
    TOGGLE_MIC: string;
    TOGGLE_IGNORE: string;
    SHOW_REDIAL_SCREEN: string;
    HIDE_REDIAL_SCREEN: string;
    START_CALL: string;
    END_CALL: string;
}

export const actions: ICallReducerActions = {
    SEND_LOCAL_DESCRIPTION: "CALL:SEND_LOCAL_DESCRIPTION",
    ADD_LOCAL_DESCRIPTION: "CALL:ADD_LOCAL_DESCRIPTION",
    REMOVE_ICE_CANDIDATE: "CALL:REMOVE_ICE_CANDIDATE",
    ATTEMPT_TOGGLE_VIDEO: "CALL:ATTEMPT_TOGGLE_VIDEO",
    ATTEMPT_TOGGLE_HOLD: "CALL:ATTEMPT_TOGGLE_HOLD",
    TOGGLE_OTHER_HOLDED: "CALL:TOGGLE_OTHER_HOLDED",
    ATTEMPT_REMOVE_CALL: "CALL:ATTEMPT_REMOVE_CALL",
    SEND_ICE_CANDIDATE: "CALL:SEND_ICE_CANDIDATE",
    TOGGLE_OTHER_VIDEO: "CALL:TOGGLE_OTHER_VIDEO",
    SEND_VIDEO_ENABLED: "CALL:SEND_VIDEO_ENABLED",
    ADD_ICE_CANDIDATE: "CALL:ADD_ICE_CANDIDATE",
    TOGGLE_MY_HOLDED: "CALL:TOGGLE_MY_HOLDED",
    ADD_CALL_HISTORY: "CALL:ADD_CALL_HISTORY",
    SET_VIDEO_ANSWER: "CALL:SET_VIDEO_ANSWER",
    SET_VIDEO_OFFER: "CALL:SET_VIDEO_OFFER",
    TOGGLE_MY_VIDEO: "CALL:TOGGLE_MY_VIDEO",
    INVITED_TO_CALL: "CALL:INVITED_TO_CALL",
    INVITE_TO_CALL: "CALL:INVITE_TO_CALL",
    DTMF_RECEIVED: "CALL:DTMF_RECEIVED",
    CHANGE_STATUS: "CALL:CHANGE_STATUS",
    SEND_HANG_UP: "CALL:SEND_HANG_UP",
    SEND_DECLINE: "CALL:SEND_DECLINE",
    SEND_ACCEPT: "CALL:SEND_ACCEPT",
    REMOVE_CALL: "CALL:REMOVE_CALL",
    SEND_DTMF: "CALL:SEND_DTMF",
    ADD_CALL: "CALL:ADD_CALL",
    SET_SDP: "CALL:SET_SDP",
    RESET: "CALL:RESET",
    TOGGLE_MIC: "CALL:TOGGLE_MIC",
    TOGGLE_IGNORE: "CALL:TOGGLE_IGNORE",
    SHOW_REDIAL_SCREEN: "CALL:SHOW_REDIAL_SCREEN",
    HIDE_REDIAL_SCREEN: "CALL:HIDE_REDIAL_SCREEN",
    START_CALL: "CALL:START_CALL",
    END_CALL: "CALL:END_CALL",
};

export interface ICall extends Map<any, any> {
    status: "Calling" | "Ringing" | "Call Ended" | "User busy" | "Answering";
    iceCandidates: List<any>;
    localDescription: any;
    callDuration: string;
    otherHolded: boolean;
    otherVideo: boolean;
    myHolded: boolean;
    receiver: string;
    receiverRequest?: string;
    myVideo: boolean;
    ownCall: boolean;
    callTime: string;
    videoAnswer: any;
    videoOffer: any;
    caller: string;
    to: string;
    id: string;
    email: string;
    mic: boolean;
}

export interface ICallData extends Map<string, any> {
    callHistory: Map<string, ICall>;
    calls: Map<string, ICall>;
    isRedialScreenShown: boolean;
    isStartedCall: boolean;
}

export const defaultState: ICallData = fromJS({
    callHistory: {},
    calls: {},
    isRedialScreenShown: false,
    isStartedCall: false,
});

export default (state: ICallData = defaultState, {type, payload}: ICallActions): ICallData => {
    switch (type) {

        case actions.REMOVE_ICE_CANDIDATE:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.deleteIn(["calls", payload.id, "iceCandidates", payload.candidateId]) as ICallData;

        case actions.TOGGLE_OTHER_HOLDED:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "otherHolded"], payload.holded) as ICallData;

        case actions.TOGGLE_OTHER_VIDEO:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "otherVideo"], payload.isVideo) as ICallData;

        case actions.ADD_ICE_CANDIDATE:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "iceCandidates", payload.candidate.id], fromJS({
                sdpMLineIndex: payload.candidate.sdpMLineIndex,
                candidate: payload.candidate.candidate,
                sdpMid: payload.candidate.sdpMid
            })).setIn(["calls", payload.id, "receiverRequest"], payload.candidate.from) as ICallData;

        case actions.ADD_LOCAL_DESCRIPTION:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "localDescription"], fromJS({
                sdp: payload.sdp,
                type: payload.type,
                onlySet: !!+payload.onlySet
            })) as ICallData;

        case actions.ADD_CALL_HISTORY:
            if (!state.getIn(["callHistory", payload.id])) {
                return state;
            }

            return state.setIn(["callHistory", payload.id], payload.call) as ICallData;

        case actions.TOGGLE_MY_HOLDED:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.updateIn(["calls", payload.id, "myHolded"], myHolded => !myHolded) as ICallData;

        case actions.SET_VIDEO_ANSWER:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "videoAnswer"], fromJS(payload.answer)) as ICallData;

        case actions.SET_VIDEO_OFFER:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "videoOffer"], fromJS(payload.offer)) as ICallData;

        case actions.TOGGLE_MY_VIDEO:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id, "myVideo"], payload.isVideo) as ICallData;

        case actions.CHANGE_STATUS:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            if (payload.status === CALL_STATUSES.answering && !state.getIn(["calls", payload.id, "callStartTime"])) {
                return state.updateIn(["calls", payload.id], call => call.set("status", payload.status).set("callStartTime", Date.now() / 1000)) as ICallData;
            } else {
                return state.setIn(["calls", payload.id, "status"], payload.status) as ICallData;
            }

        case actions.REMOVE_CALL:
            if (!state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.deleteIn(["calls", payload.id]) as ICallData;

        case actions.ADD_CALL:
            if (state.getIn(["calls", payload.id])) {
                return state;
            }

            return state.setIn(["calls", payload.id], fromJS(payload.call)) as ICallData;

        case actions.TOGGLE_MIC:
            return state.setIn(["calls", payload.id, 'mic'], !payload.mic) as ICallData;

        case actions.TOGGLE_IGNORE:
            return state.setIn(["calls", payload.id, 'showInThread', 'ignored'], payload.ignored)
                .setIn(["calls", payload.id, 'showInThread', 'isVideo'], payload.isVideo) as ICallData;

        case actions.SHOW_REDIAL_SCREEN:
            const data = state.set("isRedialScreenShown", true) as ICallData;
            Log.i("data =>", data);
            return data;

        case actions.HIDE_REDIAL_SCREEN:
            return state.set("isRedialScreenShown", false) as ICallData;

        case actions.START_CALL:
            return state.set("isStartedCall", true) as ICallData;

        case actions.END_CALL:
            return state.set("isStartedCall", false) as ICallData;

        case actions.RESET:
            return defaultState;

        default:
            return state;
    }
};
