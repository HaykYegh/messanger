"use strict";

import {fromJS, OrderedMap} from "immutable";

import ConversationsSelector, {IConversationsModuleProps} from "modules/conversations/ConversationsSelector";
import ApplicationSelector, {IApplicationModuleProps} from "modules/application/ApplicationSelector";
import ConferenceSelector, {IConferenceModuleProps} from "modules/conference/ConferenceSelector";
import SettingsSelector, {ISettingsModuleProps} from "modules/settings/SettingsSelector";
import MessagesSelector, {IMessagesModuleProps} from "modules/messages/MessagesSelector";
import RequestsSelector, {IRequestsModuleProps} from "modules/requests/RequestsSelector";
import NetworksSelector, {INetworksModuleProps} from "modules/networks/NetworksSelector";
import ContactsSelector, {IContactModuleProps} from "modules/contacts/ContactsSelector";
import GroupsSelector, {IGroupsModuleProps} from "modules/groups/GroupsSelector";
import UserSelector, {IUserModuleProps} from "modules/user/UserSelector";
import CallSelector, {ICallModuleProps} from "modules/call/CallSelector";
import {IContact} from "modules/contacts/ContactsReducer";
import {IGroup} from "modules/groups/GroupsReducer";
import {createSelector} from "helpers/DataHelper";

const initialStateDataSelector: any = state => state.get("initialStateData");


export interface IStoreProps extends IApplicationModuleProps, IContactModuleProps, IGroupsModuleProps,
    IMessagesModuleProps, IRequestsModuleProps, ISettingsModuleProps, IUserModuleProps, ICallModuleProps, IConferenceModuleProps, IConversationsModuleProps, INetworksModuleProps {
    threads: OrderedMap<string, IContact | IGroup>;
    selectedThread: IContact | IGroup;
    selectedThreadId: string;
    sharedMediaMessages: any;
    gifMessages: any;
    gifMessagesCount: any;
    selectedInfoThread: IContact;
    newMessagesCount: number;
    sharedMediaPanel: boolean;

}

export interface IStorePropsNew extends IApplicationModuleProps, IContactModuleProps, IGroupsModuleProps,
  IMessagesModuleProps, IRequestsModuleProps, ISettingsModuleProps, IUserModuleProps, ICallModuleProps, IConferenceModuleProps, IConversationsModuleProps, INetworksModuleProps {
  threads: OrderedMap<string, IContact | IGroup>;
  selectedThreadId: string;
  sharedMediaMessages: any;
  gifMessages: any;
  gifMessagesCount: any;
  selectedInfoThread: IContact;
  newMessagesCount: number;
  sharedMediaPanel: boolean;
}

const allThreadsSelector: any = createSelector(
    ContactsSelector, GroupsSelector, MessagesSelector,
    (contactsData, groupsData, messageData: IMessagesModuleProps) =>
        contactsData.contacts
            .concat(groupsData.groups)
);

const threadsSelector: any = createSelector(
    allThreadsSelector, ApplicationSelector, MessagesSelector,
    (threads: any, applicationData, messageData: IMessagesModuleProps) => threads.filter(thread => thread && (thread.get("isGroup") || thread.get("id") === applicationData.app.selectedThreadId || !!thread.get("lastMessageId"))).sort((thread1, thread2) => {
        const value1: string = thread1.get("lastMessageId") ? messageData.allMessages.getIn([thread1.get("lastMessageId"), "time"]) : thread1.get("time");

        const value2: string = thread2.get("lastMessageId") ? messageData.allMessages.getIn([thread2.get("lastMessageId"), "time"]) : thread2.get("time");

        if (value1 < value2) {
            return 1;
        } else if (value1 > value2) {
            return -1;
        } else {
            return 0;
        }
    })
);

const newMessagesCountSelector: any = createSelector(
    ApplicationSelector, ({app}: any) => {
        return app.newMessages ? app.newMessages.thread : 0;
    }
);

const sharedMediaSelector: any = createSelector(
    ApplicationSelector, (applicationData) => applicationData.app.sharedMediaPanel
);

const selectedThreadSelector: any = createSelector(
    ApplicationSelector, threadsSelector, (applicationData) => fromJS(applicationData.app.selectedThread)
);

const selectedThreadIdSelector: any = createSelector(
  ApplicationSelector, threadsSelector, (applicationData) => {
    return applicationData.app.selectedThreadId
  }
);

const onlineUsersSelector: any = createSelector(
  ApplicationSelector, (applicationData) => fromJS(applicationData.app.onlineUsers)
);

const syncedSelector: any = createSelector(
    ApplicationSelector, (applicationData) => fromJS(applicationData.app.synced)
);

const sharedMediaMessagesSelector: any = createSelector(
    ApplicationSelector, (applicationData) => fromJS(applicationData.app.sharedMediaMessages)
        .sort((sharedMessage1, sharedMessage2) => {
            if (sharedMessage1.get("time") >= sharedMessage2.get("time")) {
                return -1;
            } else if (sharedMessage1.get("time") < sharedMessage2.get("time")) {
                return 1;
            }
        })
);

const gifMessagesSelector: any = createSelector(
    ApplicationSelector, (applicationData) => fromJS(applicationData.app.gifMessages)
        .sort((gifMessage1, gifMessage2) => {
            if (gifMessage1.get("time") >= gifMessage2.get("time")) {
                return 1;
            } else if (gifMessage1.get("time") < gifMessage2.get("time")) {
                return -1;
            } else {
                return 0;
            }
        })
);

const gifMessagesCountSelector: any = createSelector(
    ApplicationSelector, (applicationData) => fromJS(applicationData.app.gifMessagesCount)
);

const failedSyncSelector: any = createSelector(
    ApplicationSelector, (applicationData) => applicationData.app.failedSync
);

const selectedInfoThreadSelector: any = createSelector(
    ApplicationSelector, allThreadsSelector, (applicationData, threads: any) => threads.find(thread => thread.get("id") === applicationData.app.selectedInfoThreadId)
);

const allSelector: any = createSelector((state, variables) => state, (state, variables) => variables, (state, variables) => {
    if (!variables) {
        return {
            selectedInfoThread: selectedInfoThreadSelector(state),
            newMessagesCount: newMessagesCountSelector(state),
            selectedThreadId: selectedThreadIdSelector(state),
            onlineUsers: onlineUsersSelector(state),
            selectedThread: selectedThreadSelector(state),
            threads: threadsSelector(state),
            synced: syncedSelector(state),
            sharedMediaMessages: sharedMediaMessagesSelector(state),
            gifMessages: gifMessagesSelector(state),
            gifMessagesCount: gifMessagesCountSelector(state),
            failedSync: failedSyncSelector(state),
            sharedMediaPanel: sharedMediaSelector(state),
            ...ApplicationSelector(state),
            ...SettingsSelector(state),
            ...MessagesSelector(state),
            ...ConversationsSelector(state),
            ...ContactsSelector(state),
            ...RequestsSelector(state),
            ...GroupsSelector(state),
            ...UserSelector(state),
            ...CallSelector(state),
            ...ConferenceSelector(state),
            ...NetworksSelector(state),
            ...initialStateDataSelector(state)
        }
    } else {
        return {
            selectedInfoThread: variables.selectedInfoThread ? selectedInfoThreadSelector(state) : null,
            newMessagesCount: variables.newMessagesCount ? newMessagesCountSelector(state) : null,
            selectedThreadId: variables.selectedThreadId ? selectedThreadIdSelector(state) : null,
            selectedThread: variables.selectedThread ? selectedThreadSelector(state) : null,
            threads: variables.threads ? threadsSelector(state) : null,
            synced: variables.synced ? syncedSelector(state) : null,
            sharedMediaMessages: variables.sharedMediaMessages ? sharedMediaMessagesSelector(state) : null,
            gifMessages: variables.gifMessages ? gifMessagesSelector(state) : null,
            gifMessagesCount: variables.gifMessagesCount ? gifMessagesCountSelector(state) : null,
            failedSync: variables.failedSync ? failedSyncSelector(state) : null,
            sharedMediaPanel: variables.sharedMediaPanel ? sharedMediaSelector(state) : null,
            ...ApplicationSelector(state, variables.application),
            ...SettingsSelector(state, variables.settings),
            ...MessagesSelector(state, variables.messages),
            ...ConversationsSelector(state, variables.conversations),
            ...ContactsSelector(state, variables.contacts),
            ...RequestsSelector(state, variables.requests),
            ...GroupsSelector(state, variables.groups),
            ...UserSelector(state, variables.user),
            ...CallSelector(state, variables.call),
            ...ConferenceSelector(state),
            ...NetworksSelector(state, variables.networks),
            ...initialStateDataSelector(state, variables.initialState)

        }
    }
});

export default (state, variables = null): any => {
    return allSelector(state);
};
