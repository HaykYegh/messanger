"use strict";

import {LIKE_STATES, MESSAGE_TYPES, MESSAGES_CHAT_LIMIT, MESSAGES_LIMIT} from "configs/constants";
import {IMessagesActions} from "./MessagesActions";
import {fromJS, List, Map} from "immutable";

interface IMessagesReducerActions {
    SET_FORWARD_MESSAGE: string;
    CLEAR_FORWARD_MESSAGE: string;
    ATTEMPT_SEND_FORWARD_MESSAGE: any;

    SET_MESSAGE_DELIVERED_TO_RECEIVER: string;
    SET_MESSAGE_DISPLAYED_TO_RECEIVER: string;
    SET_MESSAGE_DELIVERED_TO_SERVER: string;
    ATTEMPT_SET_IMAGE_AMAZON_LINK: string;
    MESSAGE_DELIVERED_TO_RECEIVER: string;
    MESSAGE_DELIVERED_TO_RECEIVER_SERVICE: string;
    MESSAGE_DISPLAYED_TO_RECEIVER: string;
    MESSAGE_DISPLAYED_TO_RECEIVER_SERVICE: string;
    MESSAGE_CALL_TO_RECEIVER: string;
    DELETE_MESSAGE_FROM_STORE: string;
    MESSAGE_DELIVERED_TO_SERVER: any;
    BULK_UPDATE_MESSAGE_PROPS: string;
    OFFLINE_MESSAGE_HANDLER: string;
    DELETE_THREADS_MESSAGES: string;
    DELETE_THREAD_MESSAGES: string;
    ATTEMPT_OPTIMISE_VIDEO: any;
    ATTEMPT_DELETE_MESSAGE: string;
    ATTEMPT_CREATE_MESSAGE: any;
    ATTEMPT_REPLY_MESSAGE: string;
    ATTEMPT_SEND_CONTACT: any;
    SEND_CARBON_ENABLING_XML: any;
    ATTEMPT_GET_MESSAGES: string;
    MESSAGES_BULK_INSERT: string;
    ATTEMPT_EDIT_MESSAGE: string;
    UPDATE_VIDEO_MESSAGE: string;
    UPDATE_MESSAGE_PROP: string;
    UPDATE_MESSAGE_LINK_PROPS: string;
    ATTEMPT_ADD_MESSAGE: string;
    REMOVE_MESSAGE_LOAD_STATUS: any;
    ADD_MESSAGE_LOAD_STATUS: any;
    SET_STORE_MESSAGES: string;
    ATTEMPT_SEARCH_MESSAGES: any;
    ATTEMPT_GET_SCROLL_DOWN_MESSAGES: any;
    ATTEMPT_SHOW_SEARCHED_MESSAGE: any;
    ATTEMPT_SHOW_MORE_SEARCH_MESSAGES: any;
    SHOW_MORE_SEARCH_MESSAGES: string;
    SET_SEARCH_MESSAGES: string;
    SET_SEARCH_MESSAGE_ID: string;
    REMOVE_SEARCH_MESSAGE_ID: string;
    REMOVE_SEARCH_MESSAGES: string;
    TOGGLE_SHOW_MORE_DOWN: string;
    TOGGLE_RESET_STORE_MESSAGES: string;
    ATTEMPT_SHOW_CALENDAR_MESSAGES: any;
    MESSAGE_LOCAL_DELETE: any;
    TRANSFER_SUCCESS: string;
    SEND_MESSAGE_SEEN: string;
    SET_MESSAGE_SEEN: string;
    REMOVE_MESSAGES: string;
    TOGGLE_SHOW_MORE: string
    SET_AMAZON_LINK: string;
    UPLOAD_PROGRESS: string;
    DELETE_MESSAGE: string;
    UPLOAD_FAILURE: string;
    REMOVE_MESSAGE: string;
    REPLY_MESSAGE: string;
    DOWNLOAD_FILE: any;
    SHOW_LOADING: string;
    EDIT_MESSAGE: string;
    GET_MESSAGES: string;
    SEND_MESSAGE: string;
    UPLOAD_REQUEST: any;
    CHANGE_LIKE: string;
    UPLOAD_FILE: string;
    ADD_MESSAGE: any;
    RESET: string;

    ATTEMPT_SEND_MESSAGE: any,
    ATTEMPT_SEND_FILE_MESSAGE: any,


    // refactored

    FETCH_MESSAGES: any;
    FETCH_MESSAGES_SUCCEED: any;
    SEND_FILE_MESSAGE: any;
    MESSAGES_SEEN_SEND: any;
    MESSAGES_SEEN_SEND_SUCCEED: string;
    MESSAGES_RESET_SUCCEED: string;

    DELETE_STORE_MESSAGES: string;

    RECEIVE_MESSAGE: any;

    MESSAGE_CREATION_DONE: string
}

export const actions: IMessagesReducerActions = {
    ATTEMPT_SEND_FORWARD_MESSAGE: "MESSAGES:ATTEMPT_SEND_FORWARD_MESSAGE",
    SET_FORWARD_MESSAGE: "MESSAGES:SET_FORWARD_MESSAGE",
    CLEAR_FORWARD_MESSAGE: "MESSAGES:CLEAR_FORWARD_MESSAGE",
    SET_MESSAGE_DELIVERED_TO_RECEIVER: "MESSAGES:SET_MESSAGE_DELIVERED_TO_RECEIVER",
    SET_MESSAGE_DISPLAYED_TO_RECEIVER: "MESSAGES:SET_MESSAGE_DISPLAYED_TO_RECEIVER",
    SET_MESSAGE_DELIVERED_TO_SERVER: "MESSAGES:SET_MESSAGE_DELIVERED_TO_SERVER",
    ATTEMPT_SET_IMAGE_AMAZON_LINK: "MESSAGES:ATTEMPT_SET_IMAGE_AMAZON_LINK",
    MESSAGE_DELIVERED_TO_RECEIVER: "MESSAGES:MESSAGE_DELIVERED_TO_RECEIVER",
    MESSAGE_DELIVERED_TO_RECEIVER_SERVICE: "MESSAGES:MESSAGE_DELIVERED_TO_RECEIVER_SERVICE",
    MESSAGE_CALL_TO_RECEIVER: "MESSAGES:MESSAGE_CALL_TO_RECEIVER",
    MESSAGE_DISPLAYED_TO_RECEIVER: "MESSAGES:MESSAGE_DISPLAYED_TO_RECEIVER",
    MESSAGE_DISPLAYED_TO_RECEIVER_SERVICE: "MESSAGES:MESSAGE_DISPLAYED_TO_RECEIVER_SERVICE",
    MESSAGE_DELIVERED_TO_SERVER: "MESSAGES:MESSAGE_DELIVERED_TO_SERVER",
    BULK_UPDATE_MESSAGE_PROPS: "MESSAGES:BULK_UPDATE_MESSAGE_PROPS",
    SEND_CARBON_ENABLING_XML: "MESSAGES:SEND_CARBON_ENABLING_XML",
    DELETE_THREADS_MESSAGES: "MESSAGES:DELETE_THREADS_MESSAGES",
    OFFLINE_MESSAGE_HANDLER: "MESSAGES:OFFLINE_MESSAGE_HANDLER",
    DELETE_THREAD_MESSAGES: "MESSAGES:DELETE_THREAD_MESSAGES",
    ATTEMPT_OPTIMISE_VIDEO: "MESSAGES:ATTEMPT_OPTIMISE_VIDEO",
    ATTEMPT_DELETE_MESSAGE: "MESSAGES:ATTEMPT_DELETE_MESSAGE",
    ATTEMPT_CREATE_MESSAGE: "MESSAGES:ATTEMPT_CREATE_MESSAGE",
    ATTEMPT_REPLY_MESSAGE: "MESSAGES:ATTEMPT_REPLY_MESSAGE",
    MESSAGES_BULK_INSERT: "MESSAGES:MESSAGES_BULK_INSERT",
    ATTEMPT_GET_MESSAGES: "MESSAGES:ATTEMPT_GET_MESSAGES",
    MESSAGE_LOCAL_DELETE: "MESSAGES:MESSAGE_LOCAL_DELETE",
    ATTEMPT_EDIT_MESSAGE: "MESSAGES:ATTEMPT_EDIT_MESSAGE",
    UPDATE_VIDEO_MESSAGE: "MESSAGES:UPDATE_VIDEO_MESSAGE",
    UPDATE_MESSAGE_PROP: "MESSAGES:UPDATE_MESSAGE_PROP",
    UPDATE_MESSAGE_LINK_PROPS: "MESSAGES:UPDATE_MESSAGE_LINK_PROPS",
    DELETE_MESSAGE_FROM_STORE: "MESSAGES:DELETE_MESSAGE_FROM_STORE",
    ATTEMPT_ADD_MESSAGE: "MESSAGES:ATTEMPT_ADD_MESSAGE",
    REMOVE_MESSAGE_LOAD_STATUS: "MESSAGES:REMOVE_MESSAGE_LOAD_STATUS",
    ADD_MESSAGE_LOAD_STATUS: "MESSAGES:ADD_MESSAGE_LOAD_STATUS",
    ATTEMPT_GET_SCROLL_DOWN_MESSAGES: "MESSAGES:ATTEMPT_GET_SCROLL_DOWN_MESSAGES",
    ATTEMPT_SEARCH_MESSAGES: "MESSAGES:ATTEMPT_SEARCH_MESSAGES",
    ATTEMPT_SHOW_SEARCHED_MESSAGE: "MESSAGES:ATTEMPT_SHOW_SEARCHED_MESSAGE",
    REMOVE_SEARCH_MESSAGES: "MESSAGES:REMOVE_SEARCH_MESSAGES",
    SET_SEARCH_MESSAGES: "MESSAGES:SET_SEARCH_MESSAGES",
    SET_SEARCH_MESSAGE_ID: "MESSAGES:SET_SEARCH_MESSAGE_ID",
    REMOVE_SEARCH_MESSAGE_ID: "MESSAGES:REMOVE_SEARCH_MESSAGE_ID",
    ATTEMPT_SHOW_MORE_SEARCH_MESSAGES: "MESSAGES:ATTEMPT_SHOW_MORE_SEARCH_MESSAGES",
    SHOW_MORE_SEARCH_MESSAGES: "MESSAGES:SHOW_MORE_SEARCH_MESSAGES",
    TOGGLE_SHOW_MORE_DOWN: "MESSAGES:TOGGLE_SHOW_MORE_DOWN",
    TOGGLE_RESET_STORE_MESSAGES: "MESSAGES:TOGGLE_RESET_STORE_MESSAGES",
    ATTEMPT_SHOW_CALENDAR_MESSAGES: "MESSAGES:ATTEMPT_SHOW_CALENDAR_MESSAGES",
    SET_STORE_MESSAGES: "MESSAGES:SET_STORE_MESSAGES",
    SEND_MESSAGE_SEEN: "MESSAGES:SEND_MESSAGE_SEEN",
    TOGGLE_SHOW_MORE: "MESSAGES:TOGGLE_SHOW_MORE",
    SET_MESSAGE_SEEN: "MESSAGES:SET_MESSAGE_SEEN",
    UPLOAD_PROGRESS: "MESSAGES:UPLOAD_PROGRESS",
    SET_AMAZON_LINK: "MESSAGES:SET_AMAZON_LINK",
    UPLOAD_FAILURE: "MESSAGES:UPLOAD_FAILURE",
    TRANSFER_SUCCESS: "MESSAGES:TRANSFER_SUCCESS",
    REMOVE_MESSAGES: "MESSAGES:REMOVE_MESSAGES",
    UPLOAD_REQUEST: "MESSAGES:UPLOAD_REQUEST",
    DELETE_MESSAGE: "MESSAGES:DELETE_MESSAGE",
    REMOVE_MESSAGE: "MESSAGES:REMOVE_MESSAGE",
    REPLY_MESSAGE: "MESSAGES:REPLY_MESSAGE",
    DOWNLOAD_FILE: "MESSAGES:DOWNLOAD_FILE",
    GET_MESSAGES: "MESSAGES:GET_MESSAGES",
    SHOW_LOADING: "MESSAGES:SHOW_LOADING",
    EDIT_MESSAGE: "MESSAGES:EDIT_MESSAGE",
    SEND_MESSAGE: "MESSAGES:SEND_MESSAGE",
    CHANGE_LIKE: "MESSAGES:CHANGE_LIKE",
    ADD_MESSAGE: "MESSAGES:ADD_MESSAGE",
    UPLOAD_FILE: "MESSAGES:UPLOAD_FILE",
    RESET: "MESSAGES:RESET",

    ATTEMPT_SEND_MESSAGE: "MESSAGES:ATTEMPT_SEND_MESSAGE",
    ATTEMPT_SEND_FILE_MESSAGE: "MESSAGES:ATTEMPT_SEND_FILE_MESSAGE",
    ATTEMPT_SEND_CONTACT: "MESSAGES:ATTEMPT_SEND_CONTACT",


    //refactored
    FETCH_MESSAGES: 'MESSAGES:FETCH_MESSAGES',
    FETCH_MESSAGES_SUCCEED: 'MESSAGES:FETCH_MESSAGES_SUCCEED',
    SEND_FILE_MESSAGE: 'MESSAGES:SEND_FILE_MESSAGE',
    MESSAGES_SEEN_SEND: 'MESSAGES:MESSAGES_SEEN_SEND',
    MESSAGES_SEEN_SEND_SUCCEED: 'MESSAGES:MESSAGES_SEEN_SEND_SUCCEED',
    MESSAGES_RESET_SUCCEED: 'MESSAGES:MESSAGES_RESET_SUCCEED',
    DELETE_STORE_MESSAGES: 'MESSAGES:DELETE_STORE_MESSAGES',
    RECEIVE_MESSAGE: 'MESSAGES:RECEIVE_MESSAGE',
    MESSAGE_CREATION_DONE: 'MESSAGES:MESSAGE_CREATION_DONE',

};

export const MESSAGE_DISABLED_LOGGING_ACTIONS: Array<string> = [
    actions.SET_MESSAGE_DELIVERED_TO_RECEIVER,
    actions.SET_MESSAGE_DISPLAYED_TO_RECEIVER,
    actions.MESSAGE_DELIVERED_TO_RECEIVER,
    actions.MESSAGE_CALL_TO_RECEIVER,
    actions.MESSAGE_DISPLAYED_TO_RECEIVER,
    actions.ATTEMPT_ADD_MESSAGE,
    actions.SEND_MESSAGE_SEEN
];

export interface IMessage extends Map<string, any> {
    deliveredTime: boolean;
    fileRemotePath: string;
    messageSearch: string;
    groupMessage: boolean;
    isDownloaded: boolean;
    isDelivered: boolean;
    delivered: boolean;
    seenTime: boolean;
    createdAt: number;
    location: string;
    threadId: string;
    showLoading: any;
    fileLink: string;
    fileSize: string;
    creator: string;
    status: boolean;
    isSeen: boolean;
    edited: boolean;
    reply: boolean;
    base64: string;
    seen: boolean;
    own: boolean;
    info: string;
    text: string;
    type: string;
    id: string;
    linkTitle: string;
    linkDescription: string;
    linkImagePreviewUrl: string;
    linkSiteURL: string;
}

export interface IMessageLoadStatus extends Map<string, any> {
    messageId: string;
    loadStatus: number
}

export interface IMessagesData extends Map<string, any> {
    messages: Map<string, IMessage>;
    messagesLoadStatus: Map<string, IMessageLoadStatus>;
    showMore: boolean;
    showMoreDown: boolean;
    forwardMessages: List<IMessage>,
    searchedActiveMessage: string,
    searchedMessages: List<IMessage>,
    resetStoreMessages: boolean,

    messageSelectingState: {
        hasMoreTop: boolean,
        hasMoreBottom: boolean,
        q: string,
        isLoading: boolean,
        isInitialized: boolean
    }
}

export const defaultState: IMessagesData = fromJS({
    messages: Map({}),

    showMore: true,
    showMoreDown: false,
    isDownloaded: false,
    resetStoreMessages: false,
    searchedActiveMessage: "",
    forwardMessage: {},
    searchedMessages: {},

    messageSelectingState: {
        hasMoreTop: true,
        hasMoreBottom: true,
        q: "",
        isLoading: false,
        isInitialized: false
    }
});

export default (state: IMessagesData = defaultState, {type, payload}: IMessagesActions): IMessagesData => {
    switch (type) {

        case actions.SET_MESSAGE_DELIVERED_TO_RECEIVER:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.updateIn(["messages", payload.msgId], message => message.set("delivered", true).set("deliveredTime", payload.time)) as IMessagesData;

        case actions.SET_MESSAGE_DISPLAYED_TO_RECEIVER:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.updateIn(["messages", payload.msgId], message => message.set("seen", true).set("seenTime", payload.time)) as IMessagesData;

        case actions.SET_MESSAGE_DELIVERED_TO_SERVER:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.setIn(["messages", payload.id, "status"], true) as IMessagesData;

        case actions.DELETE_THREAD_MESSAGES:
            return state.update("messages", messages => messages.filter(message => message.get("threadId") !== payload.threadId)) as IMessagesData;

        case actions.DELETE_THREADS_MESSAGES:
            return state.update("messages", messages => messages.filter(message => !payload.threadIds.includes(message.get("threadId")))) as IMessagesData;

        case actions.SET_STORE_MESSAGES:
            return state.set("messages", fromJS({...payload.messages})) as IMessagesData;

        case actions.SET_MESSAGE_SEEN:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.setIn(["messages", payload.id, "isSeen"], true) as IMessagesData;

        case actions.UPLOAD_PROGRESS:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.setIn(["messages", payload.msgId, "progress"], payload.progress) as IMessagesData;

        case actions.TRANSFER_SUCCESS:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.setIn(["messages", payload.msgId, "IsTransferred"], true) as IMessagesData;

        case actions.UPDATE_VIDEO_MESSAGE:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }

            return state.updateIn(["messages", payload.msgId], message => message.set("isDownloaded", true)) as IMessagesData;
        case actions.UPDATE_MESSAGE_PROP:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }
            return state.updateIn(["messages", payload.msgId], message => message.set(payload.property, payload.value)) as IMessagesData;
        case actions.UPDATE_MESSAGE_LINK_PROPS:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }
            return state.updateIn(["messages", payload.msgId], message =>
                message.set("linkTitle", payload.linkTitle)
                    .set("linkDescription", payload.linkDescription)
                    .set("linkSiteURL", payload.linkSiteURL)
                    .set("linkImagePreviewUrl", payload.linkImagePreviewUrl)
            ) as IMessagesData;
        case actions.BULK_UPDATE_MESSAGE_PROPS:
            if (payload.messages.length > 0) {
                for (let i = 0; i < payload.messages.length; i++) {
                    if (state.getIn(["messages", payload.messages[i].msgId])) {
                        state = state.updateIn(["messages", payload.messages[i].msgId], message => message.set(payload.messages[i].property, payload.messages[i].value)) as IMessagesData;
                    }
                }
            }
            return state;
        case actions.DELETE_MESSAGE_FROM_STORE:
            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }
            return state.deleteIn(["messages", payload.msgId]) as IMessagesData;
        case actions.SET_AMAZON_LINK:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.updateIn(["messages", payload.id],
                message => message
                    .set("base64", null)
                    .set("fileLink", payload.fileLink)
                    .set("fileRemotePath", payload.fileRemotePath)) as IMessagesData;

        case actions.DELETE_MESSAGE:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.updateIn(["messages", payload.id], message => message.set("deleted", true)) as IMessagesData;

        case actions.REMOVE_MESSAGE:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.deleteIn(["messages", payload.id]) as IMessagesData;

        case actions.REMOVE_MESSAGES:
            return state.update("messages", messages => messages.filter(message => !payload.localDeletedMsgIds.includes(message.get("messageId") || message.get("id")))) as IMessagesData;

        case actions.SHOW_LOADING:

            if (!state.getIn(["messages", payload.msgId])) {
                return state;
            }
            return state.updateIn(["messages", payload.msgId], message => message.set("percentage", payload.percentage).set("showProgressBar", payload.showProgressBar)) as IMessagesData;

        case actions.EDIT_MESSAGE:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.updateIn(["messages", payload.id], message => message.set("text", payload.text).set("edited", true)) as IMessagesData;

        case actions.REPLY_MESSAGE:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.updateIn(["messages", payload.id], message => message.set("text", payload.text).set("reply", true)) as IMessagesData;

        case actions.SET_FORWARD_MESSAGE:

            return state.set("forwardMessage", fromJS(payload.messages)) as IMessagesData;

        case actions.CLEAR_FORWARD_MESSAGE:

            return state.set("forwardMessage", fromJS({})) as IMessagesData;

        case actions.ADD_MESSAGE:
            if (state.hasIn(["messages", payload.message.id])) {
                return state;
            }

            let base64: string;
            if (payload.message.base64) {
                if (payload.message.type === MESSAGE_TYPES.video || payload.message.type === MESSAGE_TYPES.stream_file) {
                    base64 = "data:video/webm;base64," + payload.message.base64;
                } else if (payload.message.type === MESSAGE_TYPES.image) {
                    base64 = "data:image/jpeg;base64," + payload.message.base64;
                } else {
                    base64 = payload.message.base64;
                }
            }

            let messages = state.get("messages");
            if (state.get("messages").size > MESSAGES_CHAT_LIMIT + 5) {
                let messagesJS = messages.toJS();
                Object.keys(messagesJS).map(function (key) {
                    return [messagesJS[key].time, messagesJS[key]];
                }).sort().map((item, index, array) => {
                    if (index < array.length - (MESSAGES_CHAT_LIMIT + 1) && !item[1].hidden && payload.message.repid !== item[1].messageId) {
                        messages = messages.delete(item[1].messageId ? item[1].messageId : item[1].id);
                    }
                });

                messages = messages.set(payload.message.id, fromJS({
                    ...payload.message,
                    base64
                }));
                return state.set("messages", messages) as IMessagesData;
            }

            return state.setIn(["messages", payload.message.id], fromJS({
                ...payload.message,
                base64
            })) as IMessagesData;

        case actions.CHANGE_LIKE:
            if (!state.getIn(["messages", payload.id])) {
                return state;
            }

            return state.updateIn(["messages", payload.id], message => {
                if (payload.likeState === LIKE_STATES.like && (message.get("likeState") === LIKE_STATES.defaultState || message.get("dislikes") === 0)) {
                    return message.set("likeState", payload.likeState).update("likes", likes => (likes + 1));
                } else if (payload.likeState === LIKE_STATES.like && message.get("likeState") === LIKE_STATES.dislike) {
                    return message.set("likeState", payload.likeState).update("likes", likes => (likes + 1)).update("dislikes", dislikes => (dislikes - 1));
                } else if (payload.likeState === LIKE_STATES.defaultState && message.get("likeState") === LIKE_STATES.like && message.get("likes") > 0) {
                    return message.set("likeState", payload.likeState).update("likes", likes => (likes - 1));
                } else if (payload.likeState === LIKE_STATES.defaultState && message.get("likeState") === LIKE_STATES.dislike && message.get("dislikes") > 0) {
                    return message.set("likeState", payload.likeState).update("dislikes", dislikes => (dislikes - 1));
                } else if (payload.likeState === LIKE_STATES.dislike && (message.get("likeState") === LIKE_STATES.defaultState || message.get("likes") === 0)) {
                    return message.set("likeState", payload.likeState).update("dislikes", dislikes => (dislikes + 1));
                } else if (payload.likeState === LIKE_STATES.dislike && message.get("likeState") === LIKE_STATES.like) {
                    return message.set("likeState", payload.likeState).update("dislikes", dislikes => (dislikes + 1)).update("likes", likes => (likes - 1));
                } else {
                    return message;
                }
            }) as IMessagesData;


        case actions.MESSAGES_BULK_INSERT:
            return state.update("messages", messages => messages.merge(fromJS(payload.messages))) as IMessagesData;

        case actions.GET_MESSAGES:
            return state.update("messages", messages => messages.merge(fromJS(payload.messages))) as IMessagesData;

        case actions.TOGGLE_SHOW_MORE:
            return state.set("showMore", payload.showMore) as IMessagesData;

        case actions.TOGGLE_SHOW_MORE_DOWN:
            return state.set("showMoreDown", payload.showMore) as IMessagesData;

        case actions.TOGGLE_RESET_STORE_MESSAGES:
            return state.set("resetStoreMessages", payload.resetStoreMessages) as IMessagesData;

        case actions.ADD_MESSAGE_LOAD_STATUS:
            return state.setIn(["messagesLoadStatus", payload.messageLoadStatus.messageId], fromJS({
                ...payload.messageLoadStatus,
            })) as IMessagesData;

        case actions.REMOVE_MESSAGE_LOAD_STATUS:
            if (!state.getIn(["messagesLoadStatus", payload.messageLoadStatus.messageId])) {
                return state;
            }

            return state.deleteIn(["messagesLoadStatus", payload.messageLoadStatus.messageId]) as IMessagesData;

        case actions.SET_SEARCH_MESSAGES:
            return state.set("searchedMessages", fromJS({...payload.messages})) as IMessagesData;

        case actions.REMOVE_SEARCH_MESSAGES:
            return state.set("searchedMessages", fromJS({})) as IMessagesData;

        case actions.SET_SEARCH_MESSAGE_ID:
            return state.set("searchedActiveMessage", payload.id) as IMessagesData;

        case actions.REMOVE_SEARCH_MESSAGE_ID:
            return state.set("searchedActiveMessage", "") as IMessagesData;

        case actions.SHOW_MORE_SEARCH_MESSAGES: {
            return state.update("searchedMessages", searchedMessages => searchedMessages.merge(fromJS({...payload.messages}))) as IMessagesData;
        }

        case actions.RESET:
            return defaultState;



        //refactored

        case actions.DELETE_STORE_MESSAGES:
            for (const id of payload.messageIds) {
                if (state.getIn(["messages", id])) {
                    state = state.setIn(["messages", id, "deleted"], true) as IMessagesData;
                }
            }

            return state as IMessagesData;

        case actions.MESSAGES_RESET_SUCCEED:

            state = state.set("messages", Map({})) as IMessagesData;
            state = state.setIn(["messageSelectingState", 'isInitialized'], false) as IMessagesData;
            state = state.setIn(["messageSelectingState", 'hasMoreTop'], true) as IMessagesData;
            state = state.setIn(["messageSelectingState", 'hasMoreBottom'], true) as IMessagesData;

            return state as IMessagesData;

        case actions.FETCH_MESSAGES:
            return state.setIn(["messageSelectingState", 'isLoading'], true) as IMessagesData;

        case actions.FETCH_MESSAGES_SUCCEED:

            const messagesMap: Map<string, IMessage> = fromJS(payload.messagesMap);

            state = state.setIn(["messageSelectingState", "isLoading"], false) as IMessagesData;

            if (!state.getIn(["messageSelectingState", "isInitialized"])) {
                state = state.setIn(["messageSelectingState", "isInitialized"], true) as IMessagesData;
            }

            if (payload.unreadMessagesCount <= 0) {
                state = state.setIn(["messageSelectingState", "hasMoreBottom"], false) as IMessagesData;
            }

            if (messagesMap && messagesMap.size > 0) {

                state = state.update("messages", messages => messages.merge(messagesMap)) as IMessagesData;

                if (messagesMap.size < MESSAGES_LIMIT) {
                    if (payload.toTopDirection) {
                        state = state.setIn(["messageSelectingState", "hasMoreTop"], false) as IMessagesData;
                    } else {
                        state = state.setIn(["messageSelectingState", "hasMoreBottom"], false) as IMessagesData;
                    }
                }
            }
            return state as IMessagesData;

        case actions.MESSAGES_SEEN_SEND_SUCCEED:
            for (const messageId of payload.messageIds) {
                state = state.setIn(["messages", messageId, "isSeen"], true) as IMessagesData;
            }
            return state;

        default:
            return state;
    }
};
