"use strict";

import {IMessage} from "services/database/class/Message";
import {MESSAGE_TYPES} from "configs/constants";
import {actions} from "./MessagesReducer";
import Log from "modules/messages/Log";

export interface IMessagesActions {
    type: string;
    payload?: {
        localDeletedMsgIds?: Array<string>;
        isIncomingMessage?: boolean;
        resetStoreMessages?: boolean;
        showProgressBar?: boolean;
        threadIds?: Array<string>;
        fileRemotePath?: string;
        messageCreator?: string;
        messages?: Array<any>;
        messageToSave?: any;
        percentage?: number;
        showMore?: boolean;
        isUpload?: boolean;
        downloadInfo?: any;
        likeState?: number;
        threadId?: string;
        isGroup?: boolean;
        oldState?: number;
        newState?: number;
        property?: string;
        progress?: number;
        messageXml?: any;
        author?: string;
        offset?: number;
        action?: string;
        msgId?: string;
        send?: boolean;
        fileLink?: any;
        repId?: string;
        value?: number;
        text?: string;
        search?:boolean;
        message?: any;
        messageLoadStatus?: any;
        time?: string;
        from?: string;
        type?: string;
        thread?: any;
        rel?: string;
        id?: string;
        file?: File | Blob;
        blob?: Blob;
        to?: string;
        likes?: number;
        dislikes?: number;
        limit?: number;
        err?: Error;

        replyMessage?: IMessage;
        numbers?: string[];
        name?: string;
        messageType?: string;
        meta?: any,

        // refactored

        messageId?: string,
        toTopDirection?: boolean,
        skip?: number,
        messagesMap?: { [key: string]: IMessage },
        unreadMessagesCount?: number,
        messageIds?: string[],
        roomId?: string,
        shouldWaitForConversation?: boolean
        emailsMap?: {[key: string]: string};
        shouldSetNewThread?: boolean;
        linkTitle?: string;
        linkDescription?: string;
        linkSiteURL?: string;
        linkImagePreviewUrl?: string;
    };
}

export function setAmazonLink(id: string, fileRemotePath: string, fileLink: string, rel: string = null): IMessagesActions {
    return {type: actions.SET_AMAZON_LINK, payload: {id, fileRemotePath, fileLink, rel}};
}

export function attemptSetAmazonLink(id: string, fileRemotePath: string, isGroup: boolean): IMessagesActions {
    return {type: actions.ATTEMPT_SET_IMAGE_AMAZON_LINK, payload: {id, fileRemotePath, isGroup}};
}

export function sendMessageSeen(to: string, id: string, author: string, isGroup: boolean, messageCreator?: string): IMessagesActions {
    return {type: actions.SEND_MESSAGE_SEEN, payload: {to, id, author, isGroup, messageCreator}}
}

export function sendCarbonEnablingXML(from: string): IMessagesActions {
    return {type: actions.SEND_CARBON_ENABLING_XML, payload: {from}}
}

export function showLoading(percentage: any, msgId: string, showProgressBar: boolean): IMessagesActions {
    return {type: actions.SHOW_LOADING, payload: {percentage, msgId, showProgressBar}}
}

export function attemptAddMessage(message: any, isGroup: boolean = false): IMessagesActions {
    return {type: actions.ATTEMPT_ADD_MESSAGE, payload: {message, isGroup}}
}

export function attemptDeleteMessage(id: string, message: any = null, isIncomingMessage: boolean = false): IMessagesActions {
    return {type: actions.ATTEMPT_DELETE_MESSAGE, payload: {id, message, isIncomingMessage}}
}

export function messageDeliveredToReceiver(jsonMessage: any): IMessagesActions {
    return {type: actions.MESSAGE_DELIVERED_TO_RECEIVER, payload: jsonMessage};
}

export function messageDeliveredToReceiverService({id, msgId, time, threadId, roomId}: any): IMessagesActions {
    return {type: actions.MESSAGE_DELIVERED_TO_RECEIVER_SERVICE, payload: {id, msgId, time, threadId, roomId}};
}

export function setMessageDeliveredToReceiver({msgId, time}: any): IMessagesActions {
    return {type: actions.SET_MESSAGE_DELIVERED_TO_RECEIVER, payload: {msgId, time}};
}

export function setMessageDisplayedToReceiver({msgId, time}: any): IMessagesActions {
    return {type: actions.SET_MESSAGE_DISPLAYED_TO_RECEIVER, payload: {msgId, time}};
}

export function messageDisplayedToReceiver({msgId, time, threadId, roomId}: any): IMessagesActions {
    return {type: actions.MESSAGE_DISPLAYED_TO_RECEIVER, payload: {msgId, time, threadId, roomId}};
}
export function messageDisplayedToReceiverService({msgId, time, threadId, roomId}: any): IMessagesActions {
    return {type: actions.MESSAGE_DISPLAYED_TO_RECEIVER_SERVICE, payload: {msgId, time, threadId, roomId}};
}
export function messageCallToReceiver({id, msgId, time, threadId, roomId}: any): IMessagesActions {
    return {type: actions.MESSAGE_CALL_TO_RECEIVER, payload: {id, msgId, time, threadId, roomId}};
}

export function sendMessage(message: any, messageToSave: any, isUpload: boolean = false, resetStoreMessages: boolean = true): IMessagesActions {
    return {type: actions.SEND_MESSAGE, payload: {message, messageToSave, isUpload, resetStoreMessages}}
}

export function changeLike(id: string, likeState: number): IMessagesActions {
    return {type: actions.CHANGE_LIKE, payload: {id, likeState}}
}

export function messageDeliveredToServer(id: string, shouldWaitForConversation: boolean = false): IMessagesActions {
    return {type: actions.MESSAGE_DELIVERED_TO_SERVER, payload: {id, shouldWaitForConversation}}
}

export function setMessageDeliveredToServer(id: string): IMessagesActions {
    return {type: actions.SET_MESSAGE_DELIVERED_TO_SERVER, payload: {id}}
}

export function deleteThreadMessages(threadId: string): IMessagesActions {
    return {type: actions.DELETE_THREAD_MESSAGES, payload: {threadId}};
}

export function deleteThreadsMessages(threadIds: Array<string>): IMessagesActions {
    return {type: actions.DELETE_THREADS_MESSAGES, payload: {threadIds}};
}

export function editMessage(id: string, text: string): IMessagesActions {
    return {type: actions.EDIT_MESSAGE, payload: {id, text}};
}

export function attemptEditMessage(message: any, isIncomingMessage: boolean = false): IMessagesActions {
    return {type: actions.ATTEMPT_EDIT_MESSAGE, payload: {message, isIncomingMessage}};
}

// export function replyMessage(id: string, text: string, repId: string): IMessagesActions {
//     return {type: actions.EDIT_MESSAGE, payload: {id, text, repId}};
// }

export function attemptReplyMessage(message: any): IMessagesActions {
    return {type: actions.ATTEMPT_REPLY_MESSAGE, payload: {message}};
}

export function replyMessage(id: string, text: string, repId: string): IMessagesActions {
    return {type: actions.REPLY_MESSAGE, payload: {id, text, repId}};
}

export function setStoreMessages(messages: any): IMessagesActions {
    return {type: actions.SET_STORE_MESSAGES, payload: {messages}};
}

export function attemptSearchMessages(text: string, search: boolean = false): IMessagesActions {
    return {type: actions.ATTEMPT_SEARCH_MESSAGES, payload: {text, search}};
}

export function setSearchedMessages(messages: any): IMessagesActions {
    return {type: actions.SET_SEARCH_MESSAGES, payload: {messages}};
}

export function removeSearchedMessages(): IMessagesActions {
    return {type: actions.REMOVE_SEARCH_MESSAGES};
}

export function attemptShowSearchedMessage(id: string, message: any, text: string): IMessagesActions {
    return {type: actions.ATTEMPT_SHOW_SEARCHED_MESSAGE, payload: {id, message, text}};
}

export function setSearchedMessageId(id: string): IMessagesActions {
    return {type: actions.SET_SEARCH_MESSAGE_ID, payload: {id}};
}

export function removeSearchedMessageId(): IMessagesActions {
    return {type: actions.REMOVE_SEARCH_MESSAGE_ID};
}

export function showMoreSearchMessages(messages): IMessagesActions {
    return {type: actions.SHOW_MORE_SEARCH_MESSAGES, payload: {messages}};
}

export function attemptShowMoreSearchMessages(text: string): IMessagesActions {
    return {type: actions.ATTEMPT_SHOW_MORE_SEARCH_MESSAGES, payload: {text}};
}

export function attemptShowCalendarMessages(time: any): IMessagesActions {
    return {type: actions.ATTEMPT_SHOW_CALENDAR_MESSAGES, payload: {time}};
}

export function setMessageSeen(id: string): IMessagesActions {
    return {type: actions.SET_MESSAGE_SEEN, payload: {id}}
}

export function deleteMessage(id: string): IMessagesActions {
    return {type: actions.DELETE_MESSAGE, payload: {id}};
}

export function removeMessage(id: string): IMessagesActions {
    return {type: actions.REMOVE_MESSAGE, payload: {id}};
}

export function removeMessages(localDeletedMsgIds: Array<string>): IMessagesActions {
    return {type: actions.REMOVE_MESSAGES, payload: {localDeletedMsgIds}};
}

export function addMessage(message: any, messageXml?: any): IMessagesActions {
    return {type: actions.ADD_MESSAGE, payload: {message, messageXml}};
}

export function uploadRequest(messages: any, file: File | Blob, resetStoreMessages: boolean = true, shouldSetNewThread: boolean = false): IMessagesActions {
    return {type: actions.UPLOAD_REQUEST, payload: {messages, file, resetStoreMessages, shouldSetNewThread}};
}

export function uploadFailure(err: Error, msgId: string): IMessagesActions {
    return {type: actions.UPLOAD_FAILURE, payload: {err, msgId}};
}

export function messageLocalDelete(msgId: string, threadId: string, send: boolean = false): IMessagesActions {
    return {type: actions.MESSAGE_LOCAL_DELETE, payload: {msgId, threadId, send}};
}

export function uploadProgress(progress: number, msgId: string): IMessagesActions {
    return {type: actions.UPLOAD_PROGRESS, payload: {progress, msgId}};
}

export function transferSuccess(msgId: string): IMessagesActions {
    return {type: actions.TRANSFER_SUCCESS, payload: {msgId}};
}

export function uploadFile(messages: any, file: File): IMessagesActions {
    return {type: actions.UPLOAD_FILE, payload: {messages, file}}
}

export function downloadFile(downloadInfo: any): IMessagesActions {
    return {type: actions.DOWNLOAD_FILE, payload: {downloadInfo}}
}

export function reset(): IMessagesActions {
    return {type: actions.RESET}
}

export function messagesBulkInsert(messages: any): IMessagesActions {
    return {type: actions.MESSAGES_BULK_INSERT, payload: {messages}}
}

export function attemptGetMessages(thread: any, msgId: string): IMessagesActions {
    return {type: actions.ATTEMPT_GET_MESSAGES, payload: {thread, msgId}}
}

export function attemptGetScrollDownMessages(thread: any, msgId: string, message: any): IMessagesActions {
    return {type: actions.ATTEMPT_GET_SCROLL_DOWN_MESSAGES, payload: {thread, msgId, message}}
}

export function attemptOptimiseVideo(message: string, file: Blob | File): IMessagesActions {
    return {type: actions.ATTEMPT_OPTIMISE_VIDEO, payload: {message: message, file: file}}
}

export function attemptCreateMessage(message: any): IMessagesActions {
    return {type: actions.ATTEMPT_CREATE_MESSAGE, payload: {message}}
}

export function getMessages(messages: any): IMessagesActions {
    return {type: actions.GET_MESSAGES, payload: {messages}}
}

export function toggleShowMore(showMore: boolean): IMessagesActions {
    return {type: actions.TOGGLE_SHOW_MORE, payload: {showMore}}
}

export function toggleShowMoreDown(showMore: boolean): IMessagesActions {
    return {type: actions.TOGGLE_SHOW_MORE_DOWN, payload: {showMore}}
}

export function toggleResetStoreMessages(resetStoreMessages: boolean): IMessagesActions {
    return {type: actions.TOGGLE_RESET_STORE_MESSAGES, payload: {resetStoreMessages}}
}

export function updateMessageProperty(msgId: string, property: string, value: any): IMessagesActions {
    return {type: actions.UPDATE_MESSAGE_PROP, payload: {msgId, property, value}}
}

export function updateMessageLinkProps(msgId: string, linkTitle: string, linkDescription: string, linkSiteURL: string, linkImagePreviewUrl: string): IMessagesActions {
    return {type: actions.UPDATE_MESSAGE_LINK_PROPS, payload: {msgId, linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl}}
}

export function bulkUpdateMessageProperties(messages: any): IMessagesActions {
    return {type: actions.BULK_UPDATE_MESSAGE_PROPS, payload: {messages}}
}

export function deleteMessageFromStore(msgId: string): IMessagesActions {
    return {type: actions.DELETE_MESSAGE_FROM_STORE, payload: {msgId}}
}

export function updateVideoMessage(msgId: string): IMessagesActions {
    return {type: actions.UPDATE_VIDEO_MESSAGE, payload: {msgId}}
}

export function addMessageLoadStatus(messageLoadStatus: any): IMessagesActions {
    return {type: actions.ADD_MESSAGE_LOAD_STATUS, payload: {messageLoadStatus}}
}

export function removeMessageLoadStatus(messageLoadStatus: any): IMessagesActions {
    return {type: actions.REMOVE_MESSAGE_LOAD_STATUS, payload: {messageLoadStatus}}
}

export function setForwardMessage(messages: any): IMessagesActions {
    return {type: actions.SET_FORWARD_MESSAGE, payload: {messages}}
}

export function clearForwardMessage(): IMessagesActions {
    return {type: actions.CLEAR_FORWARD_MESSAGE}
}

export function attemptSendForwardMessage(messages: any, threadIds: Array<string>, emailsMap?: {[key: string]: string}): IMessagesActions {
    return {type: actions.ATTEMPT_SEND_FORWARD_MESSAGE, payload: {messages, threadIds, emailsMap}}
}


export function attemptSendMessage(message: any, messageType: string = MESSAGE_TYPES.text, meta: any = null, isUpload: boolean = false): IMessagesActions {
    return {type: actions.ATTEMPT_SEND_MESSAGE, payload: {message, messageType, meta, isUpload}}
}

// export function createPendingObject(message: any, messageType: string = MESSAGE_TYPES.text, meta: any): IMessagesActions {
//     return {type: actions.ATTEMPT_CREATE_OBJECT, payload: {message, messageType, meta}}
// }

export function attemptSendFileMessage(file: File, meta: any, blob: Blob): IMessagesActions {
    return {type: actions.ATTEMPT_SEND_FILE_MESSAGE, payload: {file, meta, blob}}

}

export function attemptSendContact(id: string, replyMessage, numbers, name): IMessagesActions {
    return {type: actions.ATTEMPT_SEND_CONTACT, payload: {id, replyMessage, numbers, name}}
}


// refactored


export function DELETE_STORE_MESSAGES(messageIds: string[]): IMessagesActions {
    return {type: actions.DELETE_STORE_MESSAGES, payload: {messageIds}}
}

export function SEND_FILE_MESSAGE(file: File, meta: any, blob: Blob): IMessagesActions {
    return {type: actions.SEND_FILE_MESSAGE, payload: {file, meta, blob}}
}

export function receiveMessage(message: any, meta: any = {}): IMessagesActions {
    return {type: actions.RECEIVE_MESSAGE, payload: {message, meta}}
}

export function FETCH_MESSAGES(threadId: string, messageId?: string, toTopDirection?: boolean): IMessagesActions {
    return {type: actions.FETCH_MESSAGES, payload: {threadId, messageId, toTopDirection}}
}

export function FETCH_MESSAGES_SUCCEED(messagesMap: { [key: string]: IMessage }, toTopDirection?: boolean, unreadMessagesCount?: number): IMessagesActions {
    return {type: actions.FETCH_MESSAGES_SUCCEED, payload: {messagesMap, toTopDirection, unreadMessagesCount}}
}

export function MESSAGES_SEEN_SEND(threadId: string, messageIds: string[]): IMessagesActions {
    return {type: actions.MESSAGES_SEEN_SEND, payload: {threadId, messageIds}}
}

export function MESSAGES_SEEN_SEND_SUCCEED(messageIds: string[]): IMessagesActions {
    return {type: actions.MESSAGES_SEEN_SEND_SUCCEED, payload: {messageIds}}
}

export function MESSAGES_RESET_SUCCEED(): IMessagesActions {
    return {type: actions.MESSAGES_RESET_SUCCEED}
}

export function MESSAGE_CREATION_DONE(id: string): IMessagesActions {
    return {type: actions.MESSAGE_CREATION_DONE, payload: {id}}
}
