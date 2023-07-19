"use strict";

import {actions, IRequest} from "./RequestsReducer";

export interface IRequestsActions {
    type: string;
    payload?: {
        request?: IRequest;
        requests?: any;
        id?: string;
    };
}

export function addRequest(request: IRequest): IRequestsActions {
    return {type: actions.ADD_REQUEST, payload: {request}};
}

export function addRequests(requests: Object): IRequestsActions {
    return {type: actions.ADD_REQUESTS, payload: {requests}}
}

export function resendRequests(requests: any): IRequestsActions {
    return {type: actions.RESEND_REQUEST, payload: {requests}};
}

export function removeRequest(id: string): IRequestsActions {
    return {type: actions.REMOVE_REQUEST, payload: {id}};
}

export function setWaitForResponse(id: string): IRequestsActions {
    return {type: actions.SET_WAIT_FOR_RESPONSE, payload: {id}};
}

export function reset(): IRequestsActions {
    return {type: actions.RESET}
}

// refactored

export function REQUESTS_SEND(requests: { [key: string]: IRequest }): IRequestsActions {
    return {type: actions.REQUESTS_SEND, payload: {requests}};
}

export function REQUESTS_SEND_SUCCESS(requests: { [key: string]: IRequest }): IRequestsActions {
    return {type: actions.REQUESTS_SEND_SUCCESS, payload: {requests}};
}