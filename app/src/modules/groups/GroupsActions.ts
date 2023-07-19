"use strict";

import {IContact} from "../contacts/ContactsReducer";
import {actions, IGroup} from "./GroupsReducer";
import {IGroupCreateParams, IGroupDetails} from "services/interfaces";

export interface IGroupsActions {
    type: string;
    payload?: {
        removeSelectedThreadId?: boolean;
        groupMembersList?: Array<string>;
        waitForServerResponse?: boolean;
        groupIds?: Array<string>;
        memberUsername?: string;
        isOfflineSync?: boolean;
        isManualAdd?: boolean;
        keepHistory?: boolean;
        settingType?: string;
        setThread?: boolean;
        partialId?: string;
        messageId?: string;
        contact?: IContact;
        requestId?: string;
        avatarUrl?: string;
        imageUrl?: string;
        username?: string;
        getInfo?: boolean;
        groupId?: string;
        command?: string;
        members?: string;
        isSync?: boolean;
        member?: string;
        groupInfo?: any;
        admins?: string;
        owner?: string;
        response?: any;
        allow?: string;
        group?: IGroup;
        role?: string;
        name?: string;
        type?: number;
        groups?: any;
        id?: string;
        conferenceCall?: boolean;


        details?: IGroupCreateParams;
        contacts?: any
    };
}

export function attemptLeaveOrRemoveMember(partialId: string, memberUsername: string, command: string, waitForServerResponse: boolean = false): IGroupsActions {
    return {
        type: actions.ATTEMPT_LEAVE_OR_DELETE_MEMBER,
        payload: {partialId, memberUsername, command, waitForServerResponse}
    };
}

export function attemptDeleteGroup(id: string, keepHistory: boolean): IGroupsActions {
    return {type: actions.ATTEMPT_DELETE_GROUP, payload: {id, keepHistory}}
}

export function setGroupSettingsPanel(type: number): IGroupsActions {
    return {type: actions.SET_GROUP_SETTINGS_PANEL, payload: {type}}
}

export function attemptChangeGroupName(id: string, name: string): IGroupsActions {
    return {type: actions.ATTEMPT_CHANGE_GROUP_NAME, payload: {id, name}}
}

export function attemptChangeGroupSettings(id: string, settingType: string, members: string, role: string, allow: string, requestId: string): IGroupsActions {
    return {type: actions.ATTEMPT_CHANGE_GROUP_SETTINGS, payload: {id, settingType, members, role, allow, requestId}}
}

export function attemptUpdateGroupInfo(groupInfo: any): IGroupsActions {
    return {type: actions.ATTEMPT_UPDATE_GROUP_INFO, payload: {groupInfo}}
}

export function attemptRemoveGroup(id: string, requestId: string): IGroupsActions {
    return {type: actions.ATTEMPT_REMOVE_GROUP, payload: {id, requestId}}
}

export function attemptLeaveAndChangeOwner(id: string, owner: string, keepHistory: boolean, requestId: string): IGroupsActions {
    return {type: actions.ATTEMPT_LEAVE_AND_CHANGE_OWNER, payload: {id, owner, keepHistory, requestId}}
}

export function groupSettingsResponseReceived(requestId: string): IGroupsActions {
    return {type: actions.GROUP_SETTINGS_RESPONSE_RECEIVED, payload: {requestId}}
}

export function groupNameUpdatedServer(id: string, name: string): IGroupsActions {
    return {type: actions.GROUP_NAME_UPDATED_SERVER, payload: {id, name}}
}

export function invitedToGroup(id: string, username: string, getInfo: boolean): IGroupsActions {
    return {type: actions.IVITED_TO_GROUP, payload: {id, username, getInfo}};
}

export function groupCreated(groupId: string, group): IGroupsActions {
    return {type: actions.GROUP_CREATED, payload: {groupId, group}};
}

export function updateAvatar(id: string, avatarUrl: string, imageUrl: string): IGroupsActions {
    return {type: actions.UPDATE_AVATAR, payload: {avatarUrl, imageUrl, id}}
}

export function setGroupLastMessage(groupId: string, messageId: string): IGroupsActions {
    return {type: actions.SET_LAST_MESSAGE, payload: {groupId, messageId}};
}

export function inviteGroupMembers(groupId: string, members: string = "", isManualAdd: boolean = false, admins: string = ""): IGroupsActions {
    return {type: actions.INVITE_MEMBERS, payload: {groupId, members, isManualAdd, admins}}
}

export function joinGroups(groupIds: Array<string>, username: string): IGroupsActions {
    return {type: actions.JOIN_GROUPS, payload: {groupIds, username}};
}

export function addGroupNewMessageId(id: string, messageId: string): IGroupsActions {
    return {type: actions.ADD_NEW_MESSAGES_IDS, payload: {id, messageId}}
}

export function attemptCreateGroup(group: any, username: string, setThread: boolean, details: IGroupCreateParams  = null, contacts?: any, conferenceCall?: boolean): IGroupsActions {
    return {type: actions.ATTEMPT_CREATE_GRPOUP, payload: {group, username, setThread, details, contacts, conferenceCall}};
}

export function attemptCreateGroups(groupIds: Array<string>, isOfflineSync: any = false, isSync: boolean = false): IGroupsActions {
    return {type: actions.ATTEMPT_CREATE_GROUPS, payload: {groupIds, isOfflineSync, isSync}};
}

export function handleGroupResponse(response: any): IGroupsActions {
    return {type: actions.HANDLE_GROUP_RESPONSE, payload: {response}};
}

export function removeGroupMember(id: string, username: string): IGroupsActions {
    return {type: actions.REMOVE_MEMBER, payload: {id, username}};
}

export function addGroupMember(id: string, username: string): IGroupsActions {
    return {type: actions.ADD_MEMBER, payload: {id, username}};
}

export function disableGroup(id: string, username: string): IGroupsActions {
    return {type: actions.DISABLE_GROUP, payload: {id, username}};
}

export function enableGroup(id: string, username: string): IGroupsActions {
    return {type: actions.ENABLE_GROUP, payload: {id, username}};
}

export function updateName(id: string, name: string): IGroupsActions {
    return {type: actions.UPDATE_NAME, payload: {name, id}}
}

export function resetGroupNewMessagesIds(id: string): IGroupsActions {
    return {type: actions.RESET_NEW_MESSAGES_IDS, payload: {id}}
}

export function getGroupInfo(groupId: string): IGroupsActions {
    return {type: actions.GET_INFO, payload: {groupId}};
}

export function toggleGroupMuted(id: string): IGroupsActions {
    return {type: actions.TOGGLE_GRPOUP_MUTED, payload: {id}};
}

export function createGroup(group: IGroup): IGroupsActions {
    return {type: actions.CREATE_GRPOUP, payload: {group}};
}

export function deleteGroup(id: string): IGroupsActions {
    return {type: actions.DELETE_GRPOUP, payload: {id}};
}

export function reset(): IGroupsActions {
    return {type: actions.RESET}
}
