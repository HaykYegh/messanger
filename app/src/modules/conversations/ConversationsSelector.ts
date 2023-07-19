"use strict";

import {List, Map} from "immutable";

import {selectedThreadIdSelector} from "modules/application/ApplicationSelector";
import {IConversation, IConversationsData} from "./ConversationsReducer";
import {createSelector} from "helpers/DataHelper";

const conversationsDataSelector: any = state => state.get("conversationsData");

const allConversationsSelector: any = createSelector(
    conversationsDataSelector, (conversationsData: any) => conversationsData.get("conversations")
        .sort((conversation1, conversation2) => {
            const value1: string = conversation1.getIn(["conversations", "time"]);
            const value2: string = conversation2.getIn(["conversations", "time"]);

            if (value1 < value2) {
                return 1;

            } else if (value1 > value2) {
                return -1;

            } else {
                return 0;
            }
        })
);

export interface IConversationsModuleProps {
    conversations: Map<string, IConversation>;
}

export default (state, variables = null) => {
    return {
        conversations: allConversationsSelector(state),
    };
};

// refactored

export const unreadMessagesCountSelector: any = () => {
    return createSelector(
        conversationsDataSelector, selectedThreadIdSelector(), (conversationsData: IConversationsData, threadId: string) => {
            const conversation = conversationsData.getIn(["conversations", threadId]);

            if (conversation) {
                const count: number = conversation.getIn(["conversations", "newMessagesCount"]);
                return count || 0;
            }

            return 0;

        }
    )
};

export const conversationSelector: any = (conversationId?: string) => {
    return createSelector(
        conversationsDataSelector, (conversationsData: any, selectedThreadId: string) => conversationsData.getIn(["conversations", conversationId || selectedThreadId]))
};

export const conversationDraftMessageSelector: any = (conversationsId: string) => {
    return createSelector(
        conversationsDataSelector, (conversationsData: any) => conversationsData.getIn(["conversations", conversationsId, 'conversations', 'draft']))
};

export const conversationUnreadMessageSelector: any = (threadId: string, options?: { list: boolean }) => {
    return createSelector(
        conversationsDataSelector, (conversationsData: any) => {
            const conversation = conversationsData.getIn(["conversations", threadId]);
            if (conversation) {
                const messageIds: List<string> = conversation.getIn(["conversations", "newMessagesIds"]);
                const unreadMessages: any = {
                    firstId: "",
                    count: messageIds.size,
                    list: []
                };

                if (options) {
                    if (options.list) {
                        unreadMessages.list = messageIds.toArray();
                    }
                }

                if (messageIds.size > 0) {
                    unreadMessages.firstId = messageIds.first();
                }

                return unreadMessages
            }
        })
};

export const conversationsSelector = () => createSelector(
    conversationsDataSelector, (conversationData: any) => conversationData.get("conversations")
);


export const conversationLastMessageIdSelector = (conversationId: string) => createSelector(
    conversationsDataSelector, (conversationData: any) => conversationData.getIn(['conversations', conversationId, 'conversations', 'lastMessageId'])
);
