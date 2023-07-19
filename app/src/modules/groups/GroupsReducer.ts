"use strict";

import {DEFAULT_TIME_FORMAT, GROUP_SETTINGS_PANEL_TYPE} from "configs/constants";
import {IGroupsActions} from "./GroupsActions";
import {fromJS, List, Map} from "immutable";
import format from "date-fns/format";
import {getInitials} from "helpers/DataHelper";

interface IGroupsReducerActions {
    GROUP_SETTINGS_RESPONSE_RECEIVED: string;
    ATTEMPT_LEAVE_OR_DELETE_MEMBER: string;
    ATTEMPT_LEAVE_AND_CHANGE_OWNER: any;
    ATTEMPT_CHANGE_GROUP_SETTINGS: any;
    GROUP_NAME_UPDATED_SERVER: string;
    SET_GROUP_SETTINGS_PANEL: string;
    ATTEMPT_CHANGE_GROUP_NAME: any;
    ATTEMPT_UPDATE_GROUP_INFO: any;
    RESET_NEW_MESSAGES_IDS: string;
    ATTEMPT_CREATE_GRPOUP: any;
    ATTEMPT_UPDATE_AVATAR: string;
    ATTEMPT_DELETE_GROUP: string;
    ADD_NEW_MESSAGES_IDS: string;
    TOGGLE_GRPOUP_MUTED: string;
    ATTEMPT_UPDATE_NAME: string;
    HANDLE_GROUP_RESPONSE: any;
    ATTEMPT_CREATE_GROUPS: any;
    ATTEMPT_REMOVE_GROUP: any;
    SET_LAST_MESSAGE: string;
    IVITED_TO_GROUP: string;
    INVITE_MEMBERS: string;
    UPDATE_AVATAR: string;
    DISABLE_GROUP: string;
    GROUP_CREATED: string;
    CREATE_GRPOUP: string;
    DELETE_GRPOUP: string;
    REMOVE_MEMBER: string;
    ENABLE_GROUP: string;
    UPDATE_NAME: string;
    JOIN_GROUPS: string;
    ADD_MEMBER: string;
    GET_INFO: string;
    RESET: string;
}

export const actions: IGroupsReducerActions = {
    GROUP_SETTINGS_RESPONSE_RECEIVED: "GROUPS:GROUP_SETTINGS_RESPONSE_RECEIVED",
    ATTEMPT_LEAVE_AND_CHANGE_OWNER: "GROUPS:ATTEMPT_LEAVE_AND_CHANGE_OWNER",
    ATTEMPT_LEAVE_OR_DELETE_MEMBER: "GROUPS:ATTEMPT_LEAVE_OR_DELETE_MEMBER",
    ATTEMPT_CHANGE_GROUP_SETTINGS: "GROUPS:ATTEMPT_CHANGE_GROUP_SETTINGS",
    ATTEMPT_UPDATE_GROUP_INFO: "GROUPS:ATTEMPT_UPDATE_GROUP_INFO",
    SET_GROUP_SETTINGS_PANEL: "GROUPS:SET_GROUP_SETTINGS_PANEL",
    GROUP_NAME_UPDATED_SERVER: "GROUPS:GROUP_NAME_UPDATED_SERVER",
    ATTEMPT_CHANGE_GROUP_NAME: "GROUPS:ATTEMPT_CHANGE_GROUP_NAME",
    RESET_NEW_MESSAGES_IDS: "GROUPS:RESET_NEW_MESSAGES_IDS",
    ATTEMPT_CREATE_GROUPS: "GROUPS:ATTEMPT_CREATE_GROUPS",
    ATTEMPT_CREATE_GRPOUP: "GROUPS:ATTEMPT_CREATE_GRPOUP",
    ATTEMPT_UPDATE_AVATAR: "GROUPS:ATTEMPT_UPDATE_AVATAR",
    HANDLE_GROUP_RESPONSE: "GROUPS:HANDLE_GROUP_RESPONSE",
    ATTEMPT_DELETE_GROUP: "GROUPS:ATTEMPT_DELETE_GROUP",
    ADD_NEW_MESSAGES_IDS: "GROUPS:ADD_NEW_MESSAGES_IDS",
    ATTEMPT_REMOVE_GROUP: "GROUPS:ATTEMPT_REMOVE_GROUP",
    ATTEMPT_UPDATE_NAME: "GROUPS:ATTEMPT_UPDATE_NAME",
    TOGGLE_GRPOUP_MUTED: "GROUPS:TOGGLE_GRPOUP_MUTED",
    SET_LAST_MESSAGE: "GROUPS:SET_LAST_MESSAGE",
    IVITED_TO_GROUP: "GROUPS:IVITED_TO_GROUP",
    INVITE_MEMBERS: "GROUPS:INVITE_MEMBERS",
    UPDATE_AVATAR: "GROUPS:UPDATE_AVATAR",
    DISABLE_GROUP: "GROUPS:DISABLE_GROUP",
    CREATE_GRPOUP: "GROUPS:CREATE_GRPOUP",
    GROUP_CREATED: "GROUPS:GROUP_CREATED",
    DELETE_GRPOUP: "GROUPS:DELETE_GRPOUP",
    REMOVE_MEMBER: "GROUPS:REMOVE_MEMBER",
    ENABLE_GROUP: "GROUPS:ENABLE_GROUP",
    JOIN_GROUPS: "GROUPS:JOIN_GROUPS",
    UPDATE_NAME: "GROUPS:UPDATE_NAME",
    ADD_MEMBER: "GROUPS:ADD_MEMBER",
    GET_INFO: "GROUPS:GET_INFO",
    RESET: "GROUPS:RESET"
};

export const GROUPS_DISABLED_LOGGING_ACTIONS: Array<string> = [
    actions.ATTEMPT_CREATE_GRPOUP,
    actions.ATTEMPT_DELETE_GROUP
];

export interface IGroup extends Map<any, any> {
    newMessagesIds: List<string>;
    groupMembers: List<string>;
    avatarCharacter: string;
    color: {
        avatarColor: string;
        numberColor: string;
    };
    lastMessageId: string;
    partialId: string;
    disabled: boolean;
    createdAt: string;
    avatarUrl: string;
    isGroup: boolean;
    imageUrl: string;
    author: string;
    muted: boolean;
    name: string;
    id: string;
}

export interface IGroupsData extends Map<string, any> {
    groups: Map<string, IGroup>;
    groupSettingsPanel: number;
}

export const defaultState: IGroupsData = fromJS({
    groupSettingsPanel: GROUP_SETTINGS_PANEL_TYPE.closed,
    groups: {}
});

export default (state: IGroupsData = defaultState, {type, payload}: IGroupsActions): IGroupsData => {
    switch (type) {
        case actions.CREATE_GRPOUP:
            if (state.getIn(["groups", payload.group.id])) {
                return state;
            }

            return state
                .setIn(["groups", payload.group.id], fromJS({
                    avatarCharacter: getInitials(payload.group.name),
                    createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                    lastMessageId: null,
                    newMessagesIds: [],
                    ...payload.group,
                    disabled: false,
                    isGroup: true,
                    muted: false
                })) as IGroupsData;

        case actions.DELETE_GRPOUP:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.deleteIn(["groups", payload.id]) as IGroupsData;

        case actions.UPDATE_NAME:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.updateIn(["groups", payload.id], group => group.set("name", payload.name).set("avatarCharacter", getInitials(payload.name))) as IGroupsData;

        case actions.UPDATE_AVATAR:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.updateIn(["groups", payload.id], group => group.set("avatarUrl", payload.avatarUrl).set("imageUrl", payload.imageUrl)) as IGroupsData;

        case actions.SET_GROUP_SETTINGS_PANEL:
            return state.set("groupSettingsPanel", payload.type) as IGroupsData;

        case actions.TOGGLE_GRPOUP_MUTED:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.updateIn(["groups", payload.id, "muted"], muted => !muted) as IGroupsData;

        case actions.SET_LAST_MESSAGE:
            if (!state.getIn(["groups", payload.groupId])) {
                return state;
            }

            return state.setIn(["groups", payload.groupId, "lastMessageId"], payload.messageId) as IGroupsData;

        case actions.ADD_MEMBER:
            if (!state.getIn(["groups", payload.id]) || state.getIn(["groups", payload.id, "groupMembersUsernames"]).includes(payload.username)) {
                return state;
            }

            return state.updateIn(["groups", payload.id, "groupMembersUsernames"], groupMembersUsernames => groupMembersUsernames.push(payload.username)) as IGroupsData;

        case actions.REMOVE_MEMBER:
            if (!state.getIn(["groups", payload.id]) || !state.getIn(["groups", payload.id, "groupMembersUsernames"]).includes(payload.username)) {
                return state;
            }

            return state.updateIn(["groups", payload.id, "groupMembersUsernames"],
                groupMembersUsernames => groupMembersUsernames.filter(groupMemberUsername => groupMemberUsername !== payload.username)) as IGroupsData;

        case actions.ENABLE_GROUP:
            if (!state.getIn(["groups", payload.id]) || state.getIn(["groups", payload.id, "groupMembersUsernames"]).includes(payload.username)) {
                return state.setIn(["groups", payload.id, "disabled"], false) as IGroupsData;
            }

            return state.updateIn(["groups", payload.id],
                group => group.update("groupMembersUsernames", groupMembersUsernames => groupMembersUsernames.push(payload.username)).set("disabled", false)) as IGroupsData;

        case actions.DISABLE_GROUP:
            if (!state.getIn(["groups", payload.id]) || !state.getIn(["groups", payload.id, "groupMembersUsernames"]).includes(payload.username)) {
                return state.set("disabled", true) as IGroupsData;
            }

            return state.updateIn(["groups", payload.id],
                group => group.update("groupMembersUsernames",
                    groupMembersUsernames => groupMembersUsernames.filter(groupMembersUsername => groupMembersUsername !== payload.username)).set("disabled", true)) as IGroupsData;

        case actions.ADD_NEW_MESSAGES_IDS:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.updateIn(
                ["groups", payload.id, "newMessagesIds"],
                newMessagesIds => newMessagesIds ? !newMessagesIds.includes(payload.messageId) && newMessagesIds.push(payload.messageId) : List([payload.messageId])
            ) as IGroupsData;

        case actions.RESET_NEW_MESSAGES_IDS:
            if (!state.getIn(["groups", payload.id])) {
                return state;
            }

            return state.setIn(["groups", payload.id, "newMessagesIds"], List()) as IGroupsData;

        case actions.RESET:
            return defaultState;

        default:
            return state;
    }
};
