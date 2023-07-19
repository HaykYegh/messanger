"use strict";

import {createSelector} from "helpers/DataHelper";
import {IMessage, IMessagesData} from "./MessagesReducer";
import {List, Map} from "immutable";
import {IMessageLoadStatus} from "modules/messages/MessagesReducer";

const messagesDataSelector: any = state => state.get("messagesData");

const allMessagesSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => {
      return messagesData.get("messages").sort((message1, message2) => {
        if (message1.get("time") < message2.get("time")) {
            return -1;
        } else if (message1.get("time") > message2.get("time")) {
            return 1;
        } else {
            return 0;
        }
    })}
);

const selectedThreadID: any = state => state.getIn(["applicationData", "selectedThread", "threads", "threadId"]);

const messagesSelector: any = createSelector(
    allMessagesSelector, selectedThreadID,
    (messages: any) => messages
);

const showMoreSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('showMore')
);

const showMoreDownSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('showMoreDown')
);

const resetStoreMessagesSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('resetStoreMessages')
);

const forwardMessageSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('forwardMessage')
);

const searchedMessagesSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('searchedMessages').sort((message1, message2) => {
        if (message1.get("time") < message2.get("time")) {
            return 1;
        } else if (message1.get("time") > message2.get("time")) {
            return -1;
        } else {
            return 0;
        }
    })
);

const messagesLoadStatusSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('messagesLoadStatus')
);

const searchedMessageSelector: any = createSelector(
    messagesDataSelector, (messagesData: any) => messagesData.get('searchedActiveMessage')
);

export interface IMessagesModuleProps {
    allMessages: Map<string, IMessage>;
    messages: Map<string, IMessage>;
    messagesLoadStatus: Map<string, IMessageLoadStatus>;
    showMore: boolean;
    showMoreDown: boolean;
    resetStoreMessages: boolean;
    forwardMessage: List<any>;
    searchedMessages: List<any>;
    searchedActiveMessage: string;
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            allMessages: allMessagesSelector(state),
            messages: messagesSelector(state),
            showMore: showMoreSelector(state),
            showMoreDown: showMoreDownSelector(state),
            resetStoreMessages: resetStoreMessagesSelector(state),
            messagesLoadStatus: messagesLoadStatusSelector(state),
            forwardMessage: forwardMessageSelector(state),
            searchedMessages: searchedMessagesSelector(state),
            searchedActiveMessage: searchedMessageSelector(state),
        }
    } else if (variables === true) {
        return {
            messages: messagesSelector(state),
            showMore: showMoreSelector(state),
            showMoreDown: showMoreDownSelector(state),
            resetStoreMessages: resetStoreMessagesSelector(state),
            forwardMessage: forwardMessageSelector(state),
            searchedMessages: searchedMessagesSelector(state),
            messagesLoadStatus: messagesLoadStatusSelector(state),
            searchedActiveMessage: searchedMessageSelector(state),
        };
    } else {
        return {
            allMessages: variables.allMessages ? allMessagesSelector(state) : null,
            messages: variables.messages ? messagesSelector(state) : null,
            messagesLoadStatus: variables.messagesLoadStatus ? messagesLoadStatusSelector(state) : null,
            showMore: showMoreSelector(state),
            showMoreDown: showMoreDownSelector(state),
            resetStoreMessages: resetStoreMessagesSelector(state),
            forwardMessage: forwardMessageSelector(state),
            searchedMessages: searchedMessagesSelector(state),
            searchedActiveMessage: searchedMessageSelector(state)
        };
    }
};

// Refactor

export const messageSelector = (msgId: string) => {
    return createSelector(
        messagesDataSelector, (messagesData) => messagesData.getIn(["messages", msgId])
    )
};

export const isMessagesLoadingSelector: any = () => createSelector(
    messagesDataSelector, (messagesData: IMessagesData) => messagesData.getIn(["messageSelectingState", "isLoading"])
);
export const hasMoreBottomMessagesSelector: any = () => createSelector(
    messagesDataSelector, (messagesData: IMessagesData) => messagesData.getIn(["messageSelectingState", "hasMoreBottom"])
);

export const hasMoreTopMessagesSelector: any = () => createSelector(
    messagesDataSelector, (messagesData: IMessagesData) => messagesData.getIn(["messageSelectingState", "hasMoreTop"])
);

export const isMessagesInitializedSelector: any = () => {
    return createSelector(
      messagesDataSelector, (messagesData: IMessagesData) => messagesData.getIn(["messageSelectingState", "isInitialized"])
    );
}

export const newMessagesSelector: any = () => createSelector(
    messagesDataSelector, (messagesData: IMessagesData) => {
        if (messagesData.get("messages")) {
            return messagesData.get("messages").sort((prev, next) => {
                if (prev.get("time") < next.get("time")) {
                    return -1;
                } else if (prev.get("time") > next.get("time")) {
                    return 1;
                } else {
                    return 0;
                }
            })
        }
    }
);

export const forwardedMessageSelector: any = () => createSelector(
    messagesDataSelector, (messagesData: IMessagesData) => messagesData.get("forwardMessage")
);
