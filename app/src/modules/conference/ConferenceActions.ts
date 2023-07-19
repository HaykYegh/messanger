"use strict";

import {Map} from 'immutable';

import {actions} from "./ConferenceReducer";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";

export interface IIConferenceActions {
    type: string;
    payload?: {
        groupId?: string;
        userId?: string;
        groupInfo?: any;
        members?: Map<string, any>;
        isSetMemberId?: boolean;
        memberId?: string;
        muted?: boolean;
        statuses?: any;
        status?: string;
        call?: any;
        callId?: string;
        ownCall?: boolean;
        id?: string;
        messageInfo?: any;
        from?: string;
        settingsPopup?: boolean;
        anotherCall?: boolean;
        initiatorPopup?: boolean;
        addMembersPopup?: boolean;
        participantHoldMap?: any;
        participantMuteMap?: any;
        currentMember?: string;
        initiator?: string;
        propertyId?: ConfPropertyId;
        value?: string;
        participants?:any;
        ownerName?:string;
        userName?:string;
        propId?:number;
        rawValue?:number;
        memberNumber?:string;
        unMuteBool?:boolean;
        unMuteLoading?:boolean;
        leaveGroupCallPopup?:boolean;
        member?:string;
        startedConference?: boolean;
        data?: any;
    };
}

export function getCallAudio(data: any): IIConferenceActions {
    return {type: actions.GET_CALL_AUDIO, payload: {data}};
}

export function getedStartMessage(): IIConferenceActions {
    return {type: actions.ROOM_CALL_START};
}

export function startingConference(groupId: string, ownCall: boolean = true): IIConferenceActions {
    return {type: actions.STARTING, payload: {groupId, ownCall}};
}

export function startedConference(members: any, groupInfo: any, statuses: any): IIConferenceActions {
    return {type: actions.STARTED, payload: {members, groupInfo, statuses}};
}

export function changingVoiceActivityMembers(participants: any): IIConferenceActions {
    return {type: actions.CHANGING_VA_MEMBERS, payload: {participants}};
}

export function changedVoiceActivityMembers(members: Map<string, any>): IIConferenceActions {
    return {type: actions.CHANGE_VA_MEMBERS, payload: {members}};
}

export function changingConferenceDetails(callId: string, groupId: string, messageInfo: any, from: string, initiator: string): IIConferenceActions {
    return {type: actions.CHANGING_CONFERENCE_DETAILS, payload: {callId, groupId, messageInfo, from, initiator}};
}

export function changedConferenceDetails(members: any, groupInfo: any, statuses: any): IIConferenceActions {
    return {type: actions.CHANGED_CONFERENCE_DETAILS, payload: {members, groupInfo, statuses}};
}

export function changedConferenceInfo(groupInfo: any): IIConferenceActions {
    return {type: actions.CHANGED_CONFERENCE_INFO, payload: {groupInfo}};
}

export function updatePropertyConferenceCallBack(ownerName: string, userName: string, propId: number, value: string): IIConferenceActions {
    return {type: actions.UPDATE_PROPERTY_CONF_CALLBACK, payload: {ownerName, userName, propId, value}};
}

export function intToParticipant(rawValue: number, memberNumber: string): IIConferenceActions {
    return {type: actions.INT_TO_PARTICIPANT, payload: {rawValue, memberNumber}};
}

export function toggleUnMutePopup(unMuteBool: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_UNMUTE_POPUP, payload: {unMuteBool}};
}

export function toggleUnMuteLoading(memberId:string, unMuteLoading: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_UNMUTE_LOADING, payload: {memberId, unMuteLoading}};
}

export function toggleLeaveGroupCallPopup(leaveGroupCallPopup:boolean): IIConferenceActions {
    return {type: actions.TOGGLE_LEAVE_GROUP_CALL_POPUP, payload: {leaveGroupCallPopup}};
}

export function setHistoryOfPartisipants(participants: any): IIConferenceActions {
    return {type: actions.SET_HISTORY_OF_PARTISIPANTS, payload: {participants}};
}

export function toggleMemberMuted(memberId: string, muted: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_MEMBER_MUTED, payload: {memberId, muted}};
}

export function addAllMembersMuted(members: any): IIConferenceActions {
    return {type: actions.ADD_ALLMEMBERS_MUTED, payload: {members}};
}

export function removeAllMembersMuted(members: any): IIConferenceActions {
    return {type: actions.REMOVE_ALLMEMBERS_MUTED, payload: {members}};
}

export function initializing(): IIConferenceActions {
    return {type: actions.INITIALIZING};
}

export function initialized(): IIConferenceActions {
    return {type: actions.INITIALIZED};
}

export function showConference(): IIConferenceActions {
    return {type: actions.SHOW_CONFERENCE};
}

export function hideConference(): IIConferenceActions {
    return {type: actions.HIDE_CONFERENCE};
}

export function setIncomingCall(): IIConferenceActions {
    return {type: actions.SET_INCOMING_CALL};
}

export function removeIncomingCall(): IIConferenceActions {
    return {type: actions.REMOVE_INCOMING_CALL};
}

export function setMembers(members: any): IIConferenceActions {
    return {type: actions.SET_MEMBERS, payload: {members}};
}

export function setInfo(groupInfo: any): IIConferenceActions {
    return {type: actions.SET_INFO, payload: {groupInfo}};
}

export function setCallId(callId: string): IIConferenceActions {
    return {type: actions.SET_CALL_ID, payload: {callId}};
}

export function toggleSettingsPopup(settingsPopup: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_SETTINGS_POPUP, payload: {settingsPopup}};
}

export function toggleAnotherCallPopup(anotherCall: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_ANOTHER_CALL_POPUP, payload: {anotherCall}};
}

export function toggleInitiatorPopup(initiatorPopup: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_INITIATOR_POPUP, payload: {initiatorPopup}};
}

export function toggleStartedConference(startedConference: boolean): IIConferenceActions {
    return {type: actions.TOGGLE_STARTED_CONFERENCE, payload: {startedConference}};
}

export function changeInitiatorAccess(groupId: string, member: string): IIConferenceActions {
    return {type: actions.CHANGE_INITIATOR_ACCESS, payload: {groupId, member}};
}

export function changeInitiatorSuccess(initiator: string): IIConferenceActions {
    return {type: actions.CHANGE_INITIATOR_SUCCESS, payload: {initiator}};
}

export function toggleAddMembersPopup(addMembersPopup: boolean): IIConferenceActions {
    return {type: actions.ADD_CONFERENCE_MEMBER_POPUP, payload: {addMembersPopup}};
}

export function setStatuses(statuses: any): IIConferenceActions {
    return {type: actions.SET_STATUSES, payload: {statuses}};
}

export function setStatus(memberId: string, status: string, isSetMemberId: boolean = false): IIConferenceActions {
    return {type: actions.SET_STATUS, payload: {memberId, status, isSetMemberId}};
}

export function ringing(call: any): IIConferenceActions {
    return {type: actions.RINGING, payload: {call}};
}

export function accept(): IIConferenceActions {
    return {type: actions.ACCEPT};
}

export function decline(): IIConferenceActions {
    return {type: actions.DECLINE};
}

export function leave(): IIConferenceActions {
    return {type: actions.LEAVE};
}

export function cancel(memberId: string): IIConferenceActions {
    return {type: actions.CANCEL, payload: {memberId}};
}

export function join(groupId: string, callId: string): IIConferenceActions {
    return {type: actions.JOIN, payload: {groupId, callId}};
}

export function onJoinCall(groupId: string, callId: string): IIConferenceActions {
    return {type: actions.ON_JOIN_CALL, payload: {groupId, callId}};
}

export function closeAudioCall(): IIConferenceActions {
    return {type: actions.CLOSE_AUDIO_CALL};
}

export function setConferenceProperty(propertyId: ConfPropertyId, value: string): IIConferenceActions {
    return {type: actions.SET_CONFERENCE_PROPERTY, payload: {propertyId, value}};
}

export function addMembers(groupId: string, callId: string, members: any): IIConferenceActions {
    return {type: actions.ADD_MEMBERS, payload: {groupId, callId, members}};
}

export function setCurrentMember(currentMember: string): IIConferenceActions {
    return {type: actions.SET_CURRENT_MEMBER, payload: {currentMember}};
}

export function holdMembers(participantHoldMap: any): IIConferenceActions {
    return {type: actions.TOGGLE_MEMBERS_HOLD, payload: {participantHoldMap}};
}

export function addMembersSettings(participantHoldMap: any, participantMuteMap: any, initiator: string, userId: string): IIConferenceActions {
    return {type: actions.ADD_MEMBERS_SETTINGS, payload: {participantHoldMap, participantMuteMap, initiator, userId}};
}

export function check(groupId: string): IIConferenceActions {
    return {type: actions.CHECK, payload: {groupId}};
}

export function endConference(groupId: string): IIConferenceActions {
    return {type: actions.END, payload: {groupId}};
}

export function removeConference(): IIConferenceActions {
    return {type: actions.REMOVE_CONFERENCE};
}

export function sendAckConference(id: string): IIConferenceActions {
    return {type: actions.SEND_ACK_CONFERENCE, payload: {id}};
}
