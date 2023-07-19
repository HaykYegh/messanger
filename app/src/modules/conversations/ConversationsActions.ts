"use strict";

import {actions} from "./ConversationsReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import {IApplicationActions} from "modules/application/ApplicationActions";

export interface IConversationActions {
    type: string;
    payload?: {
        showNotification?: Function;
        mutedThreads?: Array<any>;
        threadIds?: Array<string>;
        allowToMessage?: boolean;
        avatarHash?: string;
        receivedMessage?: string;
        avatarCharacter?: string;
        phone?: number | string;
        removeFromList?: boolean;
        expirationDate?: number;
        searchReset?: boolean;
        searchText?: string;
        threadType?: string;
        conversations?: any;
        firstName?: string;
        followers?: string;
        messageId?: string;
        seenSent?: boolean;
        favorite?: boolean;
        file?: Blob | File;
        contact?: IContact;
        contactId?: string;
        props?: any;
        conversation?: any;
        lastActivity?: any;
        isCarbon?: boolean;
        blocked?: boolean;
        threadId?: string;
        thread?: any;
        lastName?: string;
        username?: string;
        lastMessage?: any;
        offset?: boolean;
        message?: string;
        avatarUrl?: Blob;
        imageUrl?: Blob;
        syncTime?: any;
        muted?: boolean;
        send?: boolean;
        page?: number;
        draft?: string
        time?: number;
        name?: string;
        blob?: Blob;
        id?: string;
        saved?: boolean;

        type?: string;
        skip?: number;
        limit?: number;
        messageIds?: string[],
        property?: any

    };
}

export function attemptCreateConversation(message, isCarbon: boolean = false, seenSent: boolean = false, showNotification?: Function): IConversationActions {
    return {type: actions.ATTEMPT_CREATE_CONVERSATION, payload: {message, isCarbon, seenSent, showNotification}};
}
export function attemptCreateEmptyConversation(threadId:string): IConversationActions {
    return {type: actions.ATTEMPT_CREATE_EMPTY_CONVERSATION, payload: {threadId}};
}
export function filterEmptyConversations(id): IConversationActions {
    return {type: actions.FILTER_EMPTY_CONVERSATIONS, payload: {id}};
}

export function addConversation(conversation: any): IConversationActions {
    return {type: actions.ADD_CONVERSATION, payload: {conversation}};
}

export function updateConversation(id: string, firstName: string, lastName: string, phone: number | string, username?: string, contact?: IContact, avatarUrl?: Blob, imageUrl?: Blob, saved?: boolean): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION, payload: {id, firstName, lastName, phone, avatarUrl, imageUrl, saved}};
}

export function updateConversationProps(id: string, props: any): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_PROPS, payload: {id, props}};
}

export function removeConversationMember(threadId: string, contactId: string) {
    return {type: actions.REMOVE_CONVERSATION_MEMBER, payload: {threadId, contactId}};
}
export function addConversationMember(threadId: string, contact: any) {
    return {type: actions.ADD_CONVERSATION_MEMBER, payload: {threadId, contact}};
}

export function toggleProductContactConversation(id: string): IConversationActions {
    return {type: actions.TOGGLE_PRODUCT_CONTACT_CONVERSATION, payload: {id}};
}

export function attemptUpdateConversationAvatar(threadId: string, blob: Blob): IConversationActions {
    return {type: actions.ATTEMPT_UPDATE_CONVERSATION_AVATAR, payload: {threadId, blob}};
}

export function setConversationTyping(threadId: string, username: string): IConversationActions {
    return {type: actions.SET_CONVERSATION_TYPING, payload: {threadId, username}}
}

export function attemptUpdateConversationTyping(threadId: string, username: string, removeFromList: boolean): IConversationActions {
    return {type: actions.ATTEMPT_UPDATE_CONVERSATION_TYPING, payload: {threadId, username, removeFromList}}
}

export function stopConversationTyping(threadId: string, username: string): IConversationActions {
    return {type: actions.STOP_CONVERSATION_TYPING, payload: {threadId, username}}
}

export function updateConversationAvatar(threadId: string, blob: Blob, avatarHash?: string): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_AVATAR, payload: {threadId, blob, avatarHash}};
}

export function attemptUpdateConversationName(threadId: string, name: string): IConversationActions {
    return {type: actions.ATTEMPT_UPDATE_CONVERSATION_NAME, payload: {threadId, name}};
}

export function attemptMuteConversation(threadId: string, expirationDate: number, send: boolean = false): IConversationActions {
    return {type: actions.ATTEMPT_MUTE_CONVERSATION, payload: {threadId, expirationDate, send}};
}

export function attemptMuteConversations(mutedThreads: Array<any>): IConversationActions {
    return {type: actions.ATTEMPT_MUTE_CONVERSATIONS, payload: {mutedThreads}};
}

export function attemptUnmuteConversation(threadId: string, send: boolean = false): IConversationActions {
    return {type: actions.ATTEMPT_UNMUTE_CONVERSATION, payload: {threadId, send}};
}

export function attemptUnmuteConversations(threadIds: Array<string>, send: boolean = true): IConversationActions {
    return {type: actions.ATTEMPT_UNMUTE_CONVERSATIONS, payload: {threadIds, send}};
}

export function toggleMuteConversation(threadId: string, muted: boolean): IConversationActions {
    return {type: actions.TOGGLE_MUTE_CONVERSATION, payload: {threadId, muted}};
}

export function updateConversationName(threadId: string, name: string, avatarCharacter?: string): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_NAME, payload: {threadId, name, avatarCharacter}};
}

export function attemptResetConversationNewMessagesIds(id: string): IConversationActions {
    return {type: actions.ATTEMPT_RESET_NEW_MESSAGES_IDS, payload: {id}}
}

export function resetConversationNewMessagesIds(id: string): IConversationActions {
    return {type: actions.RESET_NEW_MESSAGES_IDS, payload: {id}}
}

export function addConversationNewMessageId(id: string, messageId: string): IConversationActions {
    return {type: actions.ADD_NEW_MESSAGES_IDS, payload: {id, messageId}}
}

export function setConversationLastMessage(threadId: string, lastMessage: any): IConversationActions {
    return {type: actions.SET_LAST_MESSAGE, payload: {threadId, lastMessage}};
}

export function updateConversationLastMessage(threadId: string, messageId: string, lastMessage: any): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_LAST_MESSAGE, payload: {threadId, messageId, lastMessage}};
}

export function updateConversationTime(threadId: string, time: number): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_TIME, payload: {threadId, time}};
}

export function attemptUpdateConversationTime(threadId: string, time: number): IConversationActions {
    return {type: actions.ATTEMPT_UPDATE_CONVERSATION_TIME, payload: {threadId, time}};
}

export function attemptRemoveConversation(threadId: string, send: boolean = false): IConversationActions {
    return {type: actions.ATTEMPT_REMOVE_CONVERSATION, payload: {threadId, send}};
}

export function disableGroupConversationThread(threadId: string, username: string): IConversationActions {
    return {type: actions.DISABLE_GROUP_CONVERSATION_THREAD, payload: {threadId, username}};
}

export function updateSelectedConversationThread(threadId: string, thread: any): IConversationActions {
    return {type: actions.UPDATE_SELECTED_CONVERSATION_THREAD, payload: {threadId, thread}};
}

export function enableConversationGroup(threadId: string, contact: any): IConversationActions {
    return {type: actions.ENABLE_CONVERSATION_GROUP, payload: {threadId, contact}};
}

export function conversationTyping(threadId: string): IConversationActions {
    return {type: actions.SET_TYPING, payload: {threadId}};
}

export function conversationStopTyping(threadId: string): IConversationActions {
    return {type: actions.STOP_TYPING, payload: {threadId}};
}

export function conversationBulkInsert(conversations: any): IConversationActions {

    return {type: actions.CONVERSATIONS_BULK_INSERT, payload: {conversations}}
}

export function conversationBulkReplace(conversations: any): IConversationActions {
    return {type: actions.CONVERSATIONS_BULK_REPLACE, payload: {conversations}}
}

export function removeConversation(id: string): IConversationActions {
    return {type: actions.REMOVE_CONVERSATION, payload: {id}}
}

export function removeConversations(threadIds: Array<string>): IConversationActions {
    return {type: actions.REMOVE_CONVERSATIONS, payload: {threadIds}}
}

export function attemptRemoveConversations(threadIds: Array<string>): IConversationActions {
    return {type: actions.ATTEMPT_REMOVE_CONVERSATIONS, payload: {threadIds}}
}

export function toggleConversationAllowToMessage(threadId: string, allowToMessage: boolean): IConversationActions {
    return {type: actions.TOGGLE_CONVERSATION_ALLOW_TO_MESSAGE, payload: {threadId, allowToMessage}}
}

export function attemptSetConversationDraft(threadId: string, draft: string): IConversationActions {
    return {type: actions.ATTEMPT_SET_CONVERSATION_DRAFT, payload: {threadId, draft}}
}

export function setConversationDraft(threadId: string, draft: string): IConversationActions {
    return {type: actions.SET_CONVERSATION_DRAFT, payload: {threadId, draft}}
}

export function reset(): IConversationActions {
    return {type: actions.RESET}
}

export function attemptSetConversations(syncTime?: string): IConversationActions {
    return {type: actions.ATTEMPT_SET_CONVERSATIONS, payload: {syncTime}}
}

export function attemptGetConversations(page: number, offset: boolean = false, threadType: string = "", searchText = ""): IConversationActions {
    return {
        type: actions.ATTEMPT_GET_CONVERSATIONS,
        payload: {page: page, offset: offset, threadType: threadType, searchText: searchText}
    }
}

export function setBlockedConversations(threadIds: Array<string>): IConversationActions {
    return {type: actions.SET_BLOCKED_CONVERSATIONS, payload: {threadIds}}
}

export function attemptResetConversation(searchReset: boolean = false): IConversationActions {
    return {type: actions.ATTEMPT_RESET_CONVERSATIONS, payload: {searchReset: searchReset}};
}

export function attemptResetConversationLastMessage(threadId: string): IConversationActions {
    return {type: actions.ATTEMPT_RESET_CONVERSATION_LAST_MESSAGE, payload: {threadId: threadId}};
}

export function setConversations(conversations: any): IConversationActions {
    return {type: actions.SET_CONVERSATIONS, payload: {conversations}}
}

export function updateConversationsBlocked(threadId: string, blocked: boolean): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_BLOCKED, payload: {threadId, blocked}}
}
export function conversationBecameOffline(threadId, lastActivity): IConversationActions {
    return {type: actions.CONVERSATION_BECAME_OFFLINE, payload: {threadId, lastActivity}}
}
export function conversationBecameOnline(threadId): IConversationActions {
    return {type: actions.CONVERSATION_BECAME_ONLINE, payload: {threadId}}
}

export function FETCH_CONVERSATION_LIST(type: string, limit: number, skip: number): IConversationActions {
    return {type: actions.FETCH_CONVERSATION_LIST, payload: {type, limit, skip}}
}

export function STORE_CONVERSATION_LIST(conversations: any): IConversationActions {
    return {type: actions.STORE_CONVERSATION_LIST, payload: {conversations}}
}


export function CONVERSATION_UNREAD_MESSAGES_UPDATE(threadId: string, messageIds: string[]): IConversationActions {
    return {type: actions.CONVERSATION_UNREAD_MESSAGES_UPDATE, payload: {threadId, messageIds}}
}

export function CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS(threadId: string, messageIds: string[]): IConversationActions {
    return {type: actions.CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS, payload: {threadId, messageIds}}
}

export function conversationPropertyUpdateSuccess(threadId: string, property: { key: string, value: any }[]): IConversationActions {
    return {type: actions.CONVERSATION_PROPERTY_UPDATE_SUCCESS, payload: {threadId, property}}
}

export function conversationLastMessageStatusUpdate(threadId: string, property: any): IConversationActions {
    return {type: actions.UPDATE_CONVERSATION_LAST_MESSAGE_STATUS, payload: {threadId, property}}
}

export function conversationLastMessageChange(lastMessage: any, threadId: string): IConversationActions {
    return {type: actions.CHANGE_CONVERSATION_LAST_MESSAGE, payload: {lastMessage, threadId}}
}




