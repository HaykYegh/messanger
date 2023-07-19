import {actions, ICall} from "./CallReducer";

export interface ICallActions {
    type: string;
    payload?: {
        inCall?: boolean;
        sdpMLineIndex?: number;
        showNotification?: any;
        candidateId?: string;
        addNewCall?: boolean;
        receiverData?: any;
        ignored?: boolean;
        outCall?: boolean;
        onlySet?: boolean;
        callMembers?: any;
        isVideo?: boolean;
        holded?: boolean;
        candidate?: any;
        sdpMid?: string;
        callInfo?: any;
        status?: string;
        callid?: string;
        mic?: boolean;
        type?: string;
        from?: string;
        answer?: any;
        call?: ICall;
        offer?: any;
        to?: string;
        id?: string;
        sdp?: any;
    };
}

export function sendIceCandidate(to: string, callid: string, sdpMLineIndex: number, sdpMid: string, candidate: string, outCall: boolean): ICallActions {
    return {type: actions.SEND_ICE_CANDIDATE, payload: {to, callid, sdpMLineIndex, sdpMid, candidate, outCall}}
}

export function sendLocalDescription(to: string, callid: string, sdp: string, type: string, onlySet = false): ICallActions {
    return {type: actions.SEND_LOCAL_DESCRIPTION, payload: {to, callid, sdp, type, onlySet}}
}

export function attemptToggleVideo(id: string, isVideo: boolean, to: string): ICallActions {
    return {type: actions.ATTEMPT_TOGGLE_VIDEO, payload: {id, isVideo, to}};
}

export function attemptToggleHold(id: string, holded: boolean, to: string): ICallActions {
    return {type: actions.ATTEMPT_TOGGLE_HOLD, payload: {id, holded, to}};
}

export function inviteToCall(call: any, addNewCall: boolean = true): ICallActions {
    return {type: actions.INVITE_TO_CALL, payload: {call, addNewCall}}
}

export function removeIceCandidate(id: string, candidateId: string): ICallActions {
    return {type: actions.REMOVE_ICE_CANDIDATE, payload: {id, candidateId}};
}

export function toggleOtherVideo(id: string, isVideo: boolean): ICallActions {
    return {type: actions.TOGGLE_OTHER_VIDEO, payload: {id, isVideo}};
}

export function changeCallStatus(id: string, status: string, inCall?: boolean): ICallActions {
    return {type: actions.CHANGE_STATUS, payload: {id, status, inCall}}
}

export function sendVideoEnabled(callid: string, from: string): ICallActions {
    return {type: actions.SEND_VIDEO_ENABLED, payload: {callid, from}}
}

export function acceptCall(id: string, to: string, sdp: any): ICallActions {
    return {type: actions.SEND_ACCEPT, payload: {id, to, sdp}}
}

export function addIceCandidate(id: string, candidate: any): ICallActions {
    return {type: actions.ADD_ICE_CANDIDATE, payload: {id, candidate}}
}

export function addLocalDescription(id: string, sdp: string, type: string, onlySet: boolean = false): ICallActions {
    return {type: actions.ADD_LOCAL_DESCRIPTION, payload: {id, sdp, type, onlySet}}
}

export function toggleVideo(id: string, isVideo: boolean): ICallActions {
    return {type: actions.TOGGLE_MY_VIDEO, payload: {id, isVideo}};
}

export function setVideoAnswer(id: string, answer: any): ICallActions {
    return {type: actions.SET_VIDEO_ANSWER, payload: {id, answer}};
}

export function addCallHistory(id: string, call: ICall): ICallActions {
    return {type: actions.ADD_CALL_HISTORY, payload: {id, call}}
}

export function setVideoOffer(id: string, offer: any): ICallActions {
    return {type: actions.SET_VIDEO_OFFER, payload: {id, offer}}
}

export function declineCall(id: string, to: string, outCall?: boolean): ICallActions {
    return {type: actions.SEND_DECLINE, payload: {id, to, outCall}}
}

export function sendHangUp(id: string, to: string, outCall?: boolean): ICallActions {
    return {type: actions.SEND_HANG_UP, payload: {id, to, outCall}}
}

export function attemptRemoveCall(call: ICall, showNotification: any): ICallActions {
    return {type: actions.ATTEMPT_REMOVE_CALL, payload: {call, showNotification}}
}

export function toggleOtherHold(id: string, holded: boolean): ICallActions {
    return {type: actions.TOGGLE_OTHER_HOLDED, payload: {id, holded}}
}

export function invitedToCall(call: ICall): ICallActions {
    return {type: actions.INVITED_TO_CALL, payload: {id: call.id, call}};
}

export function toggleMyHold(id: string): ICallActions {
    return {type: actions.TOGGLE_MY_HOLDED, payload: {id}}
}

export function removeCall(id: string): ICallActions {
    return {type: actions.REMOVE_CALL, payload: {id}}
}

export function addCall(call: ICall): ICallActions {
    return {type: actions.ADD_CALL, payload: {id: call.id, call}};
}

export function toggleMic(id: string, mic: boolean): ICallActions {
    return {type: actions.TOGGLE_MIC, payload: {id, mic}};
}

export function showCallRedialScreen(): ICallActions {
    return {type: actions.SHOW_REDIAL_SCREEN};
}

export function hideCallRedialScreen(): ICallActions {
    return {type: actions.HIDE_REDIAL_SCREEN};
}

export function startCall(): ICallActions {
    return {type: actions.START_CALL};
}

export function endCall(): ICallActions {
    return {type: actions.END_CALL};
}

export function TOGGLE_IGNORE(id: string, ignored: boolean = true, isVideo: boolean = false): ICallActions {
    return {type: actions.TOGGLE_IGNORE, payload: {id, ignored, isVideo}};
}

export function reset(): ICallActions {
    return {type: actions.RESET}
}
