"use strict";

interface IHandlersReducerActions {
    GROUP_MESSAGE_HANDLER: string,
    CARBON_MESSAGE_HANDLER: any;
    MESSAGE_HANDLER: string;
    MESSAGE_HANDLER_SERVICE: string;
}

export const actions: IHandlersReducerActions = {
    GROUP_MESSAGE_HANDLER: "HANDLERS:GROUP_MESSAGE_HANDLER",
    CARBON_MESSAGE_HANDLER: "HANDLERS:CARBON_MESSAGE_HANDLER",
    MESSAGE_HANDLER: "HANDLERS:MESSAGE_HANDLER",
    MESSAGE_HANDLER_SERVICE: "HANDLERS:MESSAGE_HANDLER_SERVICE",
};

export interface IHandlersActions {
    type: string;
    payload: {
        showNotification?: (text: string, from: string, threadId: string) => void;
        messages?: Array<any>;
        message?: any;
    };
}

export function groupMessageHandler(message: any, showNotification: any): IHandlersActions {
    return {type: actions.GROUP_MESSAGE_HANDLER, payload: {message, showNotification}};
}

export function messageHandler(message: any, showNotification: any): IHandlersActions {
    return {type: actions.MESSAGE_HANDLER, payload: {message, showNotification}};
}

export function messageHandlerService(message: any, showNotification: any): IHandlersActions {
    return {type: actions.MESSAGE_HANDLER_SERVICE , payload: {message, showNotification}};
}

export function carbonMessageHandler(message: any): IHandlersActions {
    return {type: actions.CARBON_MESSAGE_HANDLER, payload: {message}};
};
