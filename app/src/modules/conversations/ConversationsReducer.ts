"use strict";

import {fromJS, List, Map} from "immutable";
import {IConversationActions} from "modules/conversations/ConversationsActions";
import {getInitials, getThreadType, isPublicRoom} from "helpers/DataHelper";
import isList = List.isList;
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {IApplicationData} from "modules/application/ApplicationTypes";
import Log from "modules/messages/Log";

interface IConversationsReducerActions {
    ATTEMPT_RESET_CONVERSATION_LAST_MESSAGE: any;
    TOGGLE_CONVERSATION_ALLOW_TO_MESSAGE: string;
    DISABLE_GROUP_CONVERSATION_THREAD: string;
    UPDATE_SELECTED_CONVERSATION_THREAD: string;
    ENABLE_CONVERSATION_GROUP: string;
    TOGGLE_PRODUCT_CONTACT_CONVERSATION: string;
    UPDATE_CONVERSATION_LAST_MESSAGE: string;
    ATTEMPT_UPDATE_CONVERSATION_AVATAR: any;
    ATTEMPT_UPDATE_CONVERSATION_TIME: any;
    ATTEMPT_UPDATE_CONVERSATION_NAME: any;
    ATTEMPT_RESET_NEW_MESSAGES_IDS: any;
    CONVERSATION_BECAME_OFFLINE: string;
    ATTEMPT_UPDATE_CONVERSATION: string;
    REMOVE_CONVERSATION_MEMBER: string;
    ADD_CONVERSATION_MEMBER: string;
    ATTEMPT_SET_CONVERSATION_DRAFT: any;
    ATTEMPT_UPDATE_CONVERSATION_TYPING: any;
    ATTEMPT_REMOVE_CONVERSATIONS: any;
    ATTEMPT_REMOVE_CONVERSATION: any;
    CONVERSATIONS_BULK_REPLACE: string;
    CONVERSATION_BECAME_ONLINE: string;
    ATTEMPT_UNMUTE_CONVERSATIONS: any;
    CONVERSATIONS_BULK_INSERT: string;
    UPDATE_CONVERSATION_TIME: string;
    SET_BLOCKED_CONVERSATIONS: string;
    TOGGLE_MUTE_CONVERSATION: string;
    ATTEMPT_CREATE_CONVERSATION: any;
    ATTEMPT_CREATE_EMPTY_CONVERSATION: any;
    FILTER_EMPTY_CONVERSATIONS: any;
    ATTEMPT_RESET_CONVERSATIONS: any;
    UPDATE_CONVERSATION_BLOCKED: any;
    SET_CONVERSATION_DRAFT: string;
    ATTEMPT_UNMUTE_CONVERSATION: any;
    STOP_CONVERSATION_TYPING: string;
    UPDATE_CONVERSATION_AVATAR: any;
    SET_CONVERSATION_TYPING: string;
    ATTEMPT_MUTE_CONVERSATIONS: any;
    ATTEMPT_SET_CONVERSATIONS: any;
    ATTEMPT_MUTE_CONVERSATION: any;
    ATTEMPT_GET_CONVERSATIONS: any;
    RESET_NEW_MESSAGES_IDS: string;
    UPDATE_CONVERSATION_NAME: any;
    ADD_NEW_MESSAGES_IDS: string;
    REMOVE_CONVERSATIONS: string;
    REMOVE_CONVERSATION: string;
    UPDATE_CONVERSATION: string;
    UPDATE_CONVERSATION_PROPS: string;
    SET_CONVERSATIONS: string;
    SET_LAST_MESSAGE: string;
    ADD_CONVERSATION: string;
    STOP_TYPING: string;
    SET_TYPING: string;
    RESET: string;


    FETCH_CONVERSATION_LIST: any;
    STORE_CONVERSATION_LIST: string;
    CONVERSATION_UNREAD_MESSAGES_UPDATE: any;
    CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS: string;
    CONVERSATION_PROPERTY_UPDATE_SUCCESS: string;
    UPDATE_CONVERSATION_LAST_MESSAGE_STATUS: string;
    CHANGE_CONVERSATION_LAST_MESSAGE: string;
}

export const actions: IConversationsReducerActions = {
    ATTEMPT_RESET_CONVERSATION_LAST_MESSAGE: "CONVERSATION:ATTEMPT_RESET_CONVERSATION_LAST_MESSAGE",
    TOGGLE_CONVERSATION_ALLOW_TO_MESSAGE: "CONVERSATION:TOGGLE_CONVERSATION_ALLOW_TO_MESSAGE",
    DISABLE_GROUP_CONVERSATION_THREAD: "CONVERSATION:DISABLE_GROUP_CONVERSATION_THREAD",
    UPDATE_SELECTED_CONVERSATION_THREAD: "CONVERSATION:UPDATE_SELECTED_CONVERSATION_THREAD",
    ENABLE_CONVERSATION_GROUP: "CONVERSATION:ENABLE_CONVERSATION_GROUP",
    TOGGLE_PRODUCT_CONTACT_CONVERSATION: "CONVERSATION:TOGGLE_PRODUCT_CONTACT_CONVERSATION",
    ATTEMPT_UPDATE_CONVERSATION_TYPING: "CONVERSATION:ATTEMPT_UPDATE_CONVERSATION_TYPING",
    ATTEMPT_UPDATE_CONVERSATION_AVATAR: "CONVERSATION:ATTEMPT_UPDATE_CONVERSATION_AVATAR",
    UPDATE_CONVERSATION_LAST_MESSAGE: "CONVERSATION:UPDATE_CONVERSATION_LAST_MESSAGE",
    ATTEMPT_UPDATE_CONVERSATION_TIME: "CONVERSATION:ATTEMPT_UPDATE_CONVERSATION_TIME",
    ATTEMPT_UPDATE_CONVERSATION_NAME: "CONVERSATION:ATTEMPT_UPDATE_CONVERSATION_NAME",
    ATTEMPT_SET_CONVERSATION_DRAFT: "CONVERSATION:ATTEMPT_SET_CONVERSATION_DRAFT",
    ATTEMPT_RESET_NEW_MESSAGES_IDS: "CONSERVATION:ATTEMPT_RESET_NEW_MESSAGES_IDS",
    ATTEMPT_REMOVE_CONVERSATIONS: "CONVERSATION:ATTEMPT_REMOVE_CONVERSATIONS",
    ATTEMPT_UNMUTE_CONVERSATIONS: "CONVERSATION:ATTEMPT_UNMUTE_CONVERSATIONS",
    ATTEMPT_CREATE_CONVERSATION: "CONVERSATION:ATTEMPT_CREATE_CONVERSATION",
    ATTEMPT_CREATE_EMPTY_CONVERSATION: "CONVERSATION:ATTEMPT_CREATE_EMPTY_CONVERSATION",
    FILTER_EMPTY_CONVERSATIONS: "CONVERSATION: FILTER_EMPTY_CONVERSATIONS",
    CONVERSATION_BECAME_OFFLINE: "CONVERSATION:CONVERSATION_BECAME_OFFLINE",
    ATTEMPT_UNMUTE_CONVERSATION: "CONVERSATION:ATTEMPT_UNMUTE_CONVERSATION",
    ATTEMPT_UPDATE_CONVERSATION: "CONVERSATION:ATTEMPT_UPDATE_CONVERSATION",
    REMOVE_CONVERSATION_MEMBER: "CONVERSATION:REMOVE_CONVERSATION_MEMBER",
    ADD_CONVERSATION_MEMBER: "CONVERSATION:ADD_CONVERSATION_MEMBER",
    ATTEMPT_REMOVE_CONVERSATION: "CONVERSATION:ATTEMPT_REMOVE_CONVERSATION",
    ATTEMPT_RESET_CONVERSATIONS: "CONVERSATION:ATTEMPT_RESET_CONVERSATIONS",
    UPDATE_CONVERSATION_BLOCKED: "CONVERSATION:UPDATE_CONVERSATION_BLOCKED",
    UPDATE_CONVERSATION_AVATAR: "CONVERSATION:UPDATE_CONVERSATION_AVATAR",
    ATTEMPT_MUTE_CONVERSATIONS: "CONSERVATION:ATTEMPT_MUTE_CONVERSATIONS",
    CONVERSATION_BECAME_ONLINE: "CONVERSATION:CONVERSATION_BECAME_ONLINE",
    CONVERSATIONS_BULK_REPLACE: "CONVERSATION:CONVERSATIONS_BULK_REPLACE",
    ATTEMPT_SET_CONVERSATIONS: "CONVERSATION:ATTEMPT_SET_CONVERSATIONS",
    SET_BLOCKED_CONVERSATIONS: "CONVERSATION:SET_BLOCKED_CONVERSATIONS",
    SET_CONVERSATION_TYPING: "CONVERSATION:SET_CONVERSATION_TYPING",
    STOP_CONVERSATION_TYPING: "CONVERSATION:STOP_CONVERSATION_TYPING",
    SET_CONVERSATION_DRAFT: "CONVERSATION:SET_CONVERSATION_DRAFT",
    ATTEMPT_MUTE_CONVERSATION: "CONVERSATION:ATTEMPT_MUTE_CONVERSATION",
    CONVERSATIONS_BULK_INSERT: "CONVERSATION:CONVERSATIONS_BULK_INSERT",
    ATTEMPT_GET_CONVERSATIONS: "CONVERSATION:ATTEMPT_GET_CONVERSATIONS",
    UPDATE_CONVERSATION_TIME: "CONVERSATION:UPDATE_CONVERSATION_TIME",
    UPDATE_CONVERSATION_NAME: "CONVERSATION:UPDATE_CONVERSATION_NAME",
    TOGGLE_MUTE_CONVERSATION: "CONVERSATION:TOGGLE_MUTE_CONVERSATION",
    RESET_NEW_MESSAGES_IDS: "CONVERSATION:RESET_NEW_MESSAGES_IDS",
    ADD_NEW_MESSAGES_IDS: "CONVERSATION:ADD_NEW_MESSAGES_IDS",
    REMOVE_CONVERSATIONS: "CONVERSATION:REMOVE_CONVERSATIONS",
    UPDATE_CONVERSATION: "CONVERSATION:UPDATE_CONVERSATION",
    UPDATE_CONVERSATION_PROPS: "CONVERSATION:UPDATE_CONVERSATION_PROPS",
    REMOVE_CONVERSATION: "CONVERSATION:REMOVE_CONVERSATION",
    SET_CONVERSATIONS: "CONVERSATION:SET_CONVERSATIONS",
    ADD_CONVERSATION: "CONVERSATION:ADD_CONVERSATION",
    SET_LAST_MESSAGE: "CONVERSATION:SET_LAST_MESSAGE",
    STOP_TYPING: "CONVERSATION:STOP_TYPING",
    SET_TYPING: "CONVERSATION:SET_TYPING",
    RESET: "CONVERSATION:RESET",


    FETCH_CONVERSATION_LIST: "CONVERSATION:FETCH_CONVERSATION_LIST",
    STORE_CONVERSATION_LIST: "CONVERSATION:STORE_CONVERSATION_LIST",
    CONVERSATION_UNREAD_MESSAGES_UPDATE: "CONVERSATION:CONVERSATION_UNREAD_MESSAGES_UPDATE",
    CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS: "CONVERSATION:CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS",
    CONVERSATION_PROPERTY_UPDATE_SUCCESS: "CONVERSATION:CONVERSATION_PROPERTY_UPDATE_SUCCESS",
    UPDATE_CONVERSATION_LAST_MESSAGE_STATUS: "CONVERSATION:UPDATE_CONVERSATION_LAST_MESSAGE_STATUS",
    CHANGE_CONVERSATION_LAST_MESSAGE: "CONVERSATION:CHANGE_CONVERSATION_LAST_MESSAGE",
};

export interface IConversation extends Map<string, any> {
}

export interface IConversationsData extends Map<string, any> {
    conversations: Map<string, IConversation>;
}

export const defaultState: IConversationsData = fromJS({
    conversations: {}
});

export default (state: IConversationsData = defaultState, {type, payload}: IConversationActions): IConversationsData => {
    let name: string;
    switch (type) {

        case actions.ADD_CONVERSATION:
            if (!payload.conversation) {
                return state;
            }
            return state.setIn(["conversations", payload.conversation.threads.threadId], fromJS({...payload.conversation})) as IConversationsData;

        case actions.UPDATE_CONVERSATION_PROPS:
            const conversation = state.getIn(['conversations', payload.id]).toJS();
            const {threads: {threadType}} = conversation;
            const {isGroup} = getThreadType(threadType);
            let threadData = isGroup ? conversation.threads.threadInfo : conversation.members[payload.id];
            threadData = {...threadData, ...payload.props};
            if (isGroup) {
                conversation.threads.threadInfo = threadData;
            } else {
                conversation.members[payload.id] = threadData;
            }
            return state.setIn(["conversations", payload.id], fromJS({...conversation})) as IConversationsData;;

        case actions.UPDATE_CONVERSATION:
            if (!payload.id) {
                return state;
            }

            name = (payload.firstName !== '' || payload.lastName !== '') ?
                `${payload.firstName} ${payload.lastName}`.trim() :
                payload.phone.toString();

            let avatar: Blob;
            let avatarUrl: string = "";
            let imageUrl: string = "";
            let saved: boolean;
            avatar = payload.avatarUrl || state.getIn(["conversations", payload.id, 'members', payload.id, "avatar"]);
            avatarUrl = state.getIn(["conversations", payload.id, 'members', payload.id, "avatarUrl"]);
            imageUrl = state.getIn(["conversations", payload.id, 'members', payload.id, "imageUrl"]);

            if (payload.avatarUrl) {
                avatarUrl = `${payload.phone}/avatar`;
                imageUrl = `${payload.phone}/image`;
            } if(payload.saved) {
                saved = payload.saved;
        }

            if (!state.getIn(["conversations", payload.id])) {
                return state;
            }
            if (!state.getIn(["conversations", payload.id, 'members', payload.id])) {
                return state
            }

            return state.updateIn(["conversations", payload.id, 'members', payload.id],
                conversation => conversation
                    .set("phone", payload.phone.toString())
                    .set("avatarCharacter", getInitials(payload.firstName, payload.lastName))
                    .set("username", payload.phone.toString())
                    .set("firstName", payload.firstName)
                    .set("lastName", payload.lastName)
                    .set("avatarUrl", avatarUrl)
                    .set("imageUrl", imageUrl)
                    .set("avatar", avatar)
                    .set("image", avatar)
                    .set("name", name)
                    .set("saved",saved)
            ) as IConversationsData;
        case actions.REMOVE_CONVERSATION_MEMBER:
            return state.deleteIn(["conversations",payload.threadId, "members", payload.contactId]) as IConversationsData;
        case actions.ADD_CONVERSATION_MEMBER:
            return state.setIn(['conversations', payload.threadId, 'members', payload.contact.contactId], fromJS(payload.contact)) as IConversationsData;
        case actions.UPDATE_CONVERSATION_LAST_MESSAGE:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }
            let lastMessage = state.getIn(["conversations", payload.threadId, "messages"]);
            const msgId = lastMessage && (lastMessage.get("messageId") || lastMessage.get("id"));
            if (msgId === payload.messageId) {
                lastMessage = lastMessage.toJS();
            } else {
                return state;
            }

            return state.setIn(["conversations", payload.threadId, "messages"], fromJS({...lastMessage, ...payload.lastMessage})) as IConversationsData;

        case actions.UPDATE_CONVERSATION_TIME:
            if (!state.getIn(["conversations", payload.threadId]) || !payload.time) {
                return state;
            }

            return state.setIn(["conversations", payload.threadId, "conversations", "time"], payload.time) as IConversationsData;

        case actions.TOGGLE_CONVERSATION_ALLOW_TO_MESSAGE:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            return state.setIn(["conversations", payload.threadId, "threads", "threadInfo", "allowToMessage"], payload.allowToMessage) as IConversationsData;

        case actions.SET_TYPING:
            return state.setIn(["conversations", payload.threadId, "conversations", "typing"], true) as IConversationsData;

        case actions.RESET_NEW_MESSAGES_IDS:
            if (!state.getIn(["conversations", payload.id])) {
                return state;
            }

            return state.setIn(["conversations", payload.id, "conversations", "newMessagesIds"], List()) as IConversationsData;

        case actions.TOGGLE_MUTE_CONVERSATION:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            if (isPublicRoom(payload.threadId)) {
                return state.updateIn(["conversations", payload.threadId, "threads", "threadInfo", "muted"], muted => payload.muted) as IConversationsData;
            }

            return state.updateIn(["conversations", payload.threadId, "members", payload.threadId, "muted"], muted => payload.muted) as IConversationsData;

        case actions.UPDATE_CONVERSATION_AVATAR: {

            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            if (isPublicRoom(payload.threadId)) {
                // return state.updateIn(["conversations", payload.threadId, "threads", "threadInfo", "avatar"], avatar => payload.blob) as IConversationsData;
                return state.setIn(["conversations", payload.threadId, "threads", "threadInfo", "avatar"], payload.blob)
                    .setIn(["conversations", payload.threadId, "threads", "threadInfo", "avatarHash"], payload.avatarHash)
                  .setIn(["conversations", payload.threadId, "threads", "threadInfo", "avatarBlobUrl"], (window as any).URL.createObjectURL(payload.blob))
                  .setIn(["conversations", payload.threadId, "threads", "threadInfo", "image"], payload.blob) as IConversationsData
            }

            return state.setIn(["conversations", payload.threadId, "members", payload.threadId, "avatar"], payload.blob)
                .setIn(["conversations", payload.threadId, "members", payload.threadId, "avatarHash"], payload.avatarHash)
              .setIn(["conversations", payload.threadId, "members", payload.threadId, "avatarBlobUrl"], (window as any).URL.createObjectURL(payload.blob))
              .setIn(["conversations", payload.threadId, "members", payload.threadId, "image"], payload.blob) as IConversationsData
        }

        case actions.SET_CONVERSATION_TYPING: {

            if (state.hasIn(["conversations", payload.threadId])) {

                return state.updateIn(["conversations", payload.threadId, "conversations", "typing"],
                    typing => isList(typing) ?
                        !typing.includes(payload.username) ?
                            typing.push(payload.username) :
                            typing :
                        List([payload.username])) as IConversationsData;
            }

            return state;
        }

        case actions.STOP_CONVERSATION_TYPING: {

            if (state.hasIn(["conversations", payload.threadId])) {

                return state.updateIn(["conversations", payload.threadId, "conversations", "typing"],
                    typing =>
                        typing.filter(username => payload.username !== username)) as IConversationsData;
            }

            return state;
        }

        case actions.SET_CONVERSATION_DRAFT: {

            if (!state.hasIn(["conversations", payload.threadId])) {
                return state;
            }

            return state.setIn(["conversations", payload.threadId, "conversations", "draft"], payload.draft) as IConversationsData;
        }

        case actions.UPDATE_CONVERSATION_NAME: {

            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            if (isPublicRoom(payload.threadId)) {
                return state.setIn(["conversations", payload.threadId, "threads", "threadInfo", "name"], payload.name)
                    .setIn(["conversations", payload.threadId, "threads", "threadInfo", "avatarCharacter"], payload.avatarCharacter) as IConversationsData;

            }

            return state.setIn(["conversations", payload.threadId, "members", payload.threadId, "name"], payload.name) as IConversationsData;
        }

        case actions.TOGGLE_PRODUCT_CONTACT_CONVERSATION: {

            if (!state.getIn(["conversations", payload.id])) {
                return state;
            }

            return state.updateIn(["conversations", payload.id, "members", payload.id, "isProductContact"], isProductContact => !isProductContact) as IConversationsData;
        }

        case actions.SET_LAST_MESSAGE:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }
            return state.setIn(["conversations", payload.threadId, "messages"], fromJS({...payload.lastMessage}))
                .setIn(["conversations", payload.threadId, "conversations", "lastMessageId"], payload.lastMessage.id || payload.lastMessage.messageId)
                .setIn(["conversations", payload.threadId, "conversations", "time"], payload.lastMessage.time || 0) as IConversationsData;

        case actions.STOP_TYPING:
            return state.setIn(["conversations", payload.threadId, "conversations", "typing"], false) as IConversationsData;

        case actions.UPDATE_CONVERSATION_BLOCKED:

            if (!state.hasIn(["conversations", payload.threadId])) {
                return state
            }

            return state.setIn(["conversations", payload.threadId, "members", payload.threadId, "blocked"], payload.blocked) as IConversationsData;

        case actions.REMOVE_CONVERSATION:
            if (!state.getIn(["conversations", payload.id])) {
                return state;
            }

            return state.deleteIn(["conversations", payload.id]) as IConversationsData;

        case actions.REMOVE_CONVERSATIONS:
            return state.update("conversations", conversations => conversations.filter(conversation => !payload.threadIds.includes(conversation.getIn(["threads", "threadId"])))) as IConversationsData;

        case actions.ADD_NEW_MESSAGES_IDS:
            if (!state.getIn(["conversations", payload.id])) {
                return state;
            }

            return state.updateIn(["conversations", payload.id, "conversations", "newMessagesIds"],
                newMessagesIds => newMessagesIds ? !newMessagesIds.includes(payload.messageId) ? newMessagesIds.push(payload.messageId) : newMessagesIds : fromJS([payload.messageId])) as IConversationsData;

        case actions.CONVERSATIONS_BULK_INSERT:
            return state.update("conversations", conversations => conversations.merge(fromJS(payload.conversations))) as IConversationsData;

        case actions.SET_BLOCKED_CONVERSATIONS:
            return state.update("conversations", conversations => conversations.map(conversation => {
                const threadId = conversation.getIn(["threads", "threadId"]);
                return payload.threadIds.includes(threadId) ?
                    conversation.setIn(["members", 0, "blocked"], true) :
                    conversation;
            })) as IConversationsData;

        case actions.CONVERSATIONS_BULK_REPLACE:
            return state.update("conversations", conversations => fromJS(payload.conversations)) as IConversationsData;

        case actions.SET_CONVERSATIONS:
            return state.update("conversations", conversations => conversations.merge(fromJS(payload.conversations))) as IConversationsData;

        case actions.RESET:
            return defaultState as IConversationsData;

        //    refactored

        case actions.CONVERSATION_UNREAD_MESSAGES_IDS_UPDATE_SUCCESS:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            state = state.setIn(["conversations", payload.threadId, "conversations", "newMessagesIds"], fromJS(payload.messageIds)) as IConversationsData;
            state = state.setIn(["conversations", payload.threadId, "conversations", "newMessagesCount"], payload.messageIds.length) as IConversationsData;

            return state as IConversationsData;

        case actions.CONVERSATION_PROPERTY_UPDATE_SUCCESS:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            for (const item of payload.property) {
                state = state.setIn(
                    ["conversations", payload.threadId, "members", payload.threadId, item.key], item.value
                ) as IConversationsData;
            }

            return state;

        case actions.UPDATE_CONVERSATION_LAST_MESSAGE_STATUS:

            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            return state.setIn(["conversations", payload.threadId, "messages", payload.property.key], payload.property.value) as IConversationsData;


        case actions.CHANGE_CONVERSATION_LAST_MESSAGE:
            if (!state.getIn(["conversations", payload.threadId])) {
                return state;
            }

            const id = payload.lastMessage && payload.lastMessage.messageId || payload.lastMessage.id || "";

            return state.setIn(["conversations", payload.threadId, "messages"], fromJS(payload.lastMessage))
                .setIn(["conversations", payload.threadId, "conversations", "lastMessageId"], id) as IConversationsData;

        case actions.CONVERSATION_BECAME_ONLINE: {
            return state.updateIn(["conversations",payload.threadId, "members", payload.threadId], threadInfo => threadInfo && threadInfo.set("status", "online")) as IConversationsData;
        }

        case actions.CONVERSATION_BECAME_OFFLINE: {
                return state.updateIn(["conversations", payload.threadId, "members", payload.threadId,],
                  threadInfo => threadInfo && threadInfo.set("status", "offline")
                    .set("lastActivity", payload.lastActivity)) as IConversationsData;
        }

        case actions.FILTER_EMPTY_CONVERSATIONS: {
            return state = state.update("conversations", conversations => conversations.filter(conversation => {
                if(conversation.getIn(["conversations", "conversationId"]) === payload.id) {
                    return conversation
                } else return conversation.getIn(["conversations", "lastMessageId"]) !== ''
            })) as IConversationsData;
        }

        case actions.DISABLE_GROUP_CONVERSATION_THREAD: {

            return state.updateIn(["conversations", payload.threadId, "threads", "threadInfo"],
              threadInfo => threadInfo.update("groupMembersUsernames",
                groupMembersUsernames => groupMembersUsernames.filter(groupMembersUsername => groupMembersUsername !== payload.username))
                .update("members", members => members.filter(member => member !== payload.username))
                .set("disabled", true))
              .deleteIn(["conversations", payload.threadId, 'members', `${payload.username}@${SINGLE_CONVERSATION_EXTENSION}`]) as IConversationsData;

            return state;
        }

        case actions.UPDATE_SELECTED_CONVERSATION_THREAD: {
            if (!state.getIn(["conversations", payload.threadId])) {
                return state
            }
            const thread = state.getIn(["conversations", payload.threadId]).toJS();
            const {threads: {threadId}} = thread;
            const {threads: {threadType}} = thread;
            const {isGroup} = getThreadType(threadType);
            let threadData = isGroup ? thread.threads.threadInfo : thread.members[threadId];
            threadData = {...threadData, ...payload.thread};

            if (isGroup) {
                thread.threads.threadInfo = threadData;
            } else {
                thread.members[threadId] = threadData;
            }

            return state.updateIn(["conversations", payload.threadId], conv => fromJS({...thread})) as IConversationsData;

        }

        case actions.ENABLE_CONVERSATION_GROUP: {
            // const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            // if (selectedThreadId === payload.threadId) {


                return state.updateIn(["conversations", payload.threadId, "threads", "threadInfo"],
                  threadInfo => threadInfo
                    .update("groupMembersUsernames", groupMembersUsernames => !groupMembersUsernames.includes(payload.contact.username) ? groupMembersUsernames.push(payload.contact.username) : groupMembersUsernames)
                    .update("members", members => !members.includes(payload.contact.username) ? members.push(payload.contact.username) : members)
                    .setIn(['selectedThread', 'members', payload.contact.contactId], fromJS(payload.contact))
                    .setIn(["disabled"], false)) as IConversationsData;


            // }
            //
            // return state;
        }

        default:
            return state;
    }
};
