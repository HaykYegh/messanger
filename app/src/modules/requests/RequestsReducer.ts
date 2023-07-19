"use strict";

import {DEFAULT_TIME_FORMAT} from "configs/constants";
import {IRequestsActions} from "./RequestsActions";
import {fromJS, Map} from "immutable";
import format from "date-fns/format";

interface IRequestsReducerActions {
    SET_WAIT_FOR_RESPONSE: string;
    REMOVE_REQUEST: any;
    RESEND_REQUEST: string;
    ADD_REQUEST: any;
    ADD_REQUESTS: any;
    RESET: string;

    REQUESTS_SEND: any;
    REQUESTS_SEND_SUCCESS: string;
}

export const actions: IRequestsReducerActions = {
    SET_WAIT_FOR_RESPONSE: "REQUESTS:SET_WAIT_FOR_RESPONSE",
    REMOVE_REQUEST: "REQUESTS:REMOVE_REQUEST",
    RESEND_REQUEST: "REQUESTS:RESEND_REQUEST",
    ADD_REQUEST: "REQUESTS:ADD_REQUEST",
    RESET: "REQUESTS:RESET",
    ADD_REQUESTS: "REQUESTS:ADD_REQUESTS",

    REQUESTS_SEND: "REQUESTS:REQUESTS_SEND",
    REQUESTS_SEND_SUCCESS: "REQUESTS:REQUESTS_SEND_SUCCESS",
};

export const REQUEST_DISABLED_LOGGING_ACTIONS: Array<string> = [
    // actions.REMOVE_REQUEST,
    // actions.ADD_REQUEST
];

export interface IRequest {
    xmlBuilder: string;
    createdAt?: string;
    params: any;
    id: string;
    messageToSave?: any,
    file?: any,
}

export interface IRequestsData extends Map<string, any> {
    requests: Map<string, IRequest>;
}

export const defaultState: IRequestsData = fromJS({
    requests: {}
});

export default (state: IRequestsData = defaultState, {type, payload}: IRequestsActions): IRequestsData => {
    switch (type) {
        case actions.ADD_REQUEST:
            if (state.getIn(["requests", payload.request.id])) {
                return state;
            }
            return state
                .setIn(["requests", payload.request.id], fromJS({
                    ...payload.request,
                })) as IRequestsData;

        case actions.ADD_REQUESTS:
            return state.update("requests", requests => requests.merge(fromJS(payload.requests))) as IRequestsData;

        case actions.REMOVE_REQUEST:
            if (!state.getIn(["requests", payload.id])) {
                return state;
            }

            return state.deleteIn(["requests", payload.id]) as IRequestsData;

        case actions.SET_WAIT_FOR_RESPONSE:
            if (!state.getIn(["requests", payload.id])) {
                return state;
            }

            return state.setIn(["requests", payload.id, "waitForResponse"], true) as IRequestsData;

        case actions.RESET:
            return defaultState;

        case actions.REQUESTS_SEND_SUCCESS:
            return state.update("requests", requests => requests.merge(fromJS(payload.requests))) as IRequestsData;

        default:
            return state;
    }
};
