"use strict";

import {fromJS, List, Map} from "immutable";
import {IIConferenceActions} from "./ConferenceActions";
import Log from "modules/messages/Log";
import selector from "services/selector";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";

interface IConferenceReducerActions {
    STARTING: any;
    RINGING: any;
    ACCEPT: any;
    DECLINE: any;
    LEAVE: any;
    CHECK: any;
    CANCEL: any;
    JOIN: any;
    ON_JOIN_CALL: any;
    SET_CONFERENCE_PROPERTY: any;
    ADD_MEMBERS: any;
    END: any;

    INITIALIZING: string;
    INITIALIZED: string;
    STARTED: string;
    SET_INCOMING_CALL: string;
    REMOVE_INCOMING_CALL: string;
    SET_MEMBERS: string;
    SET_INFO: string;
    SET_CALL_ID: string;
    TOGGLE_SETTINGS_POPUP: string;
    TOGGLE_ANOTHER_CALL_POPUP: string;
    SET_STATUSES: string;
    SET_STATUS: string;
    SHOW_CONFERENCE: string;
    CHANGE_INITIATOR_ACCESS: string
    CHANGE_INITIATOR_SUCCESS: string;
    HIDE_CONFERENCE: string;
    REMOVE_CONFERENCE: string;
    SEND_ACK_CONFERENCE: string;
    CHANGING_CONFERENCE_DETAILS: string;
    CHANGING_VA_MEMBERS: string;
    CHANGE_VA_MEMBERS: string;
    CHANGED_CONFERENCE_DETAILS: string;
    CHANGED_CONFERENCE_INFO: string;
    UPDATE_PROPERTY_CONF_CALLBACK: string;
    INT_TO_PARTICIPANT: string;
    SET_HISTORY_OF_PARTISIPANTS: string;
    ADD_CONFERENCE_MEMBER_POPUP: string;
    TOGGLE_MEMBER_MUTED: string;
    ADD_ALLMEMBERS_MUTED: string;
    ADD_MEMBERS_SETTINGS: string;
    TOGGLE_MEMBERS_HOLD: string;
    REMOVE_ALLMEMBERS_MUTED: string;
    SET_CURRENT_MEMBER: string;
    TOGGLE_UNMUTE_POPUP: string;
    TOGGLE_UNMUTE_LOADING: string;
    TOGGLE_LEAVE_GROUP_CALL_POPUP: string;
    TOGGLE_INITIATOR_POPUP: string;
    TOGGLE_STARTED_CONFERENCE: string;
    GET_CALL_AUDIO: string;
    CLOSE_AUDIO_CALL: string;
    ROOM_CALL_START: string;
}

export const actions: IConferenceReducerActions = {
    STARTING: "CONFERENCE:STARTING",
    RINGING: "CONFERENCE:RINGING",
    ACCEPT: "CONFERENCE:ACCEPT",
    DECLINE: "CONFERENCE:DECLINE",
    LEAVE: "CONFERENCE:LEAVE",
    CHECK: "CONFERENCE:CHECK",
    JOIN: "CONFERENCE:JOIN",
    ON_JOIN_CALL: "CONFERENCE:ON_JOIN_CALL",
    SET_CONFERENCE_PROPERTY: "CONFERENCE:SET_CONFERENCE_PROPERTY",
    ADD_MEMBERS: "CONFERENCE:ADD_MEMBERS",
    CANCEL: "CONFERENCE:CANCEL",
    END: "CONFERENCE:END",
    INITIALIZING: "CONFERENCE:INITIALIZING",
    INITIALIZED: "CONFERENCE:INITIALIZED",
    STARTED: "CONFERENCE:STARTED",
    SET_INCOMING_CALL: "CONFERENCE:SET_INCOMING_CALL",
    REMOVE_INCOMING_CALL: "CONFERENCE:REMOVE_INCOMING_CALL",
    SET_MEMBERS: "CONFERENCE:SET_MEMBERS",
    SET_INFO: "CONFERENCE:SET_INFO",
    SET_CALL_ID: "CONFERENCE:SET_CALL_ID",
    TOGGLE_SETTINGS_POPUP: "CONFERENCE:TOGGLE_SETTINGS_POPUP",
    TOGGLE_ANOTHER_CALL_POPUP: "CONFERENCE:TOGGLE_ANOTHER_CALL_POPUP",
    SET_STATUSES: "CONFERENCE:SET_STATUSES",
    SET_STATUS: "CONFERENCE:SET_STATUS",
    SHOW_CONFERENCE: "CONFERENCE:SHOW_CONFERENCE",
    CHANGE_INITIATOR_ACCESS: "CONFERENCE:CHANGE_INITIATOR_ACCESS",
    CHANGE_INITIATOR_SUCCESS: "CONFERENCE:CHANGE_INITIATOR_SUCCESS",
    HIDE_CONFERENCE: "CONFERENCE:HIDE_CONFERENCE",
    REMOVE_CONFERENCE: "CONFERENCE:REMOVE_CONFERENCE",
    SEND_ACK_CONFERENCE: "CONFERENCE:SEND_ACK_CONFERENCE",
    CHANGING_CONFERENCE_DETAILS: "CONFERENCE:CHANGING_CONFERENCE_DETAILS",
    CHANGED_CONFERENCE_DETAILS: "CONFERENCE:CHANGED_CONFERENCE_DETAILS",
    CHANGED_CONFERENCE_INFO: "CONFERENCE:CHANGED_CONFERENCE_INFO",
    CHANGING_VA_MEMBERS: "CONFERENCE:CHANGING_VA_MEMBERS",
    CHANGE_VA_MEMBERS: "CONFERENCE:CHANGE_VA_MEMBERS",
    UPDATE_PROPERTY_CONF_CALLBACK: "CONFERENCE:UPDATE_PROPERTY_CONF_CALLBACK",
    INT_TO_PARTICIPANT: "CONFERENCE:INT_TO_PARTICIPANT",
    SET_HISTORY_OF_PARTISIPANTS: "CONFERENCE:SET_HISTORY_OF_PARTISIPANTS",
    ADD_CONFERENCE_MEMBER_POPUP: "CONFERENCE:ADD_CONFERENCE_MEMBER_POPUP",
    TOGGLE_MEMBER_MUTED: "CONFERENCE:TOGGLE_MEMBER_MUTED",
    ADD_ALLMEMBERS_MUTED: "CONFERENCE:ADD_ALLMEMBERS_MUTED",
    ADD_MEMBERS_SETTINGS: "CONFERENCE:ADD_MEMBERS_SETTINGS",
    TOGGLE_MEMBERS_HOLD: "CONFERENCE:TOGGLE_MEMBERS_HOLD",
    REMOVE_ALLMEMBERS_MUTED: "CONFERENCE:REMOVE_ALLMEMBERS_MUTED",
    SET_CURRENT_MEMBER: "CONFERENCE:SET_CURRENT_MEMBER",
    TOGGLE_UNMUTE_POPUP: "CONFERENCE:TOGGLE_UNMUTE_POPUP",
    TOGGLE_UNMUTE_LOADING: "CONFERENCE:TOGGLE_UNMUTE_LOADING",
    TOGGLE_LEAVE_GROUP_CALL_POPUP: "CONFERENCE:TOGGLE_LEAVE_GROUP_CALL_POPUP",
    TOGGLE_INITIATOR_POPUP: "CONFERENCE:TOGGLE_INITIATOR_POPUP",
    TOGGLE_STARTED_CONFERENCE: "CONFERENCE:TOGGLE_STARTED_CONFERENCE",
    GET_CALL_AUDIO: "CONFERENCE:GET_CALL_AUDIO",
    CLOSE_AUDIO_CALL: "CONFERENCE:CLOSE_AUDIO_CALL",
    ROOM_CALL_START: "CONFERENCE:ROOM_CALL_START",
};

export interface IConferenceDetails extends Map<string, any> {
    isVideo: boolean;
    isIncomingCall: boolean;
    memberId: string;
    pendingMessages: Map<string, any>;
    members: Map<string, any>;
    info: Map<string, any>;
    statuses: Map<string, any>;
    callId: string;
    anotherCallPopup: boolean;
    settingsPopup: boolean;
    addMembersPopup: boolean;
}

export interface IConference extends Map<string, any> {
    showConference: boolean;
    initialized: boolean;
    conferenceDetails: List<IConferenceDetails>;
}

export const defaultState: IConference = fromJS({
    showConference: false,
    initialized: false,
    conferenceDetails: {
        pendingMessages: {},
        isVideo: false,
        isIncomingCall: false,
        initiator: "",
        info: {},
        memberId: "",
        voiceActivityMembers: {},
        members: {},
        statuses: {},
        callId: "",
        anotherCallPopup: false,
        settingsPopup: false,
        addMembersPopup: false,
        currentMember: "0",
        unMutePopup: false,
        leaveGroupCallPopup: false,
        initiatorPopup: false,
        startedConference: false
    },
});


export default (state: IConference = defaultState, {type, payload}: IIConferenceActions): IConference => {
    switch (type) {

        case actions.INITIALIZING:
            return state.set("initialized", false) as IConference;

        case actions.INITIALIZED:
            return state.set("initialized", true) as IConference;

        case actions.STARTED:
            return state.set("showConference", true)
                .setIn(["conferenceDetails", "members"], fromJS(payload.members))
                .setIn(["conferenceDetails", "statuses"], fromJS(payload.statuses))
                .setIn(["conferenceDetails", "info"], fromJS(payload.groupInfo)) as IConference;

        case actions.CHANGE_VA_MEMBERS:
            return state.setIn(["conferenceDetails", "voiceActivityMembers"], fromJS(payload.members)) as IConference;

        case actions.CHANGED_CONFERENCE_DETAILS:

            return state
                .setIn(["conferenceDetails", "info"], fromJS(payload.groupInfo))
                .setIn(["conferenceDetails", "members"], fromJS(payload.members))
                .setIn(["conferenceDetails", "statuses"], fromJS(payload.statuses)) as IConference;

        case actions.CHANGED_CONFERENCE_INFO:

            return state
                .setIn(["conferenceDetails", "info"], fromJS(payload.groupInfo)) as IConference;

        case actions.SHOW_CONFERENCE:
            return state.set("showConference", true) as IConference;

        case actions.HIDE_CONFERENCE:
            return state.set("showConference", false) as IConference;

        case actions.SET_MEMBERS:
            return state.setIn(["conferenceDetails", "members"], fromJS(payload.members)) as IConference;

        case actions.CHANGE_INITIATOR_SUCCESS:
            return state.setIn(["conferenceDetails", "initiator"], payload.initiator) as IConference;

        case actions.TOGGLE_MEMBER_MUTED:
            return state.setIn(["conferenceDetails", "members", payload.memberId, "muted"], payload.muted) as IConference;

        case actions.ADD_ALLMEMBERS_MUTED:
            let addMembers: Map<string, any> = state.getIn(["conferenceDetails", "members"]);

            payload.members.forEach(item => {
                addMembers = addMembers.setIn([item, "muted"], true)
                Log.i("conference -> item = ", item)
            })
            Log.i("conference -> addMembers = ", addMembers)
            Log.i("conference -> members = ", payload.members)
            return state.setIn(["conferenceDetails", "members"], addMembers) as IConference;

        case actions.ADD_MEMBERS_SETTINGS:
            // const store: Store<any> = storeCreator.getStore();
            // const {user} = selector(store.getState(), {user: true});
            // const id = user.get("id")
            let conferenceMembers: Map<string, any> = state.getIn(["conferenceDetails", "members"]);

            for (const username in payload.participantHoldMap) {
                if(payload.userId === `${username}@msg.hawkstream.com`) {
                    continue
                }
                conferenceMembers = conferenceMembers.setIn([`${username}@msg.hawkstream.com`, "hold"], payload.participantHoldMap[username])
            }

            for (const username in payload.participantMuteMap) {

                if(payload.userId === `${username}@msg.hawkstream.com`) {
                    continue
                }
                conferenceMembers = conferenceMembers.setIn([`${username}@msg.hawkstream.com`, "mute"], payload.participantMuteMap[username])
            }

            return state.setIn(["conferenceDetails", "members"], conferenceMembers)
                        .setIn(["conferenceDetails", "initiator"], payload.initiator) as IConference;

        case actions.TOGGLE_MEMBERS_HOLD:
            let members: Map<string, any> = state.getIn(["conferenceDetails", "members"]);

            for (const username in payload.participantHoldMap) {
                members = members.setIn([`${username}@msg.hawkstream.com`, "hold"], payload.participantHoldMap[username])
            }

            return state.setIn(["conferenceDetails", "members"], members) as IConference;

        case actions.REMOVE_ALLMEMBERS_MUTED:
            let removeMembers: Map<string, any> = state.getIn(["conferenceDetails", "members"]);

            payload.members.forEach(item => {
                removeMembers = removeMembers.setIn([item, "muted"], false)
            })
            return state.setIn(["conferenceDetails", "members"], removeMembers) as IConference;

        case actions.SET_INFO:
            return state.setIn(["conferenceDetails", "info"], fromJS(payload.groupInfo)) as IConference;

        case actions.SET_STATUSES:
            return state.setIn(["conferenceDetails", "statuses"], fromJS(payload.statuses)) as IConference;

        case actions.SET_CURRENT_MEMBER:
            return state.setIn(["conferenceDetails", "currentMember"], fromJS(payload.currentMember)) as IConference;

        case actions.SET_STATUS:
            if (payload.isSetMemberId) {
                return state.setIn(["conferenceDetails", "statuses", payload.memberId], payload.status).setIn(["conferenceDetails", "memberId"], payload.memberId) as IConference;
            }

            return state.setIn(["conferenceDetails", "statuses", payload.memberId], payload.status) as IConference;

        case actions.SET_INCOMING_CALL:
            return state.setIn(["conferenceDetails", "isIncomingCall"], true) as IConference;

        case actions.REMOVE_INCOMING_CALL:
            return state.setIn(["conferenceDetails", "isIncomingCall"], false) as IConference;

        case actions.TOGGLE_UNMUTE_POPUP:
            return state.setIn(["conferenceDetails", "unMutePopup"], payload.unMuteBool) as IConference;

        case actions.TOGGLE_UNMUTE_LOADING:
            return state.setIn(["conferenceDetails", "members", payload.memberId, "unMuteloader"], payload.unMuteLoading) as IConference;

        case actions.TOGGLE_LEAVE_GROUP_CALL_POPUP:
            return state.setIn(["conferenceDetails", "leaveGroupCallPopup"], payload.leaveGroupCallPopup) as IConference;

        case actions.SET_CALL_ID:
            return state.setIn(["conferenceDetails", "callId"], payload.callId) as IConference;

        case actions.TOGGLE_SETTINGS_POPUP:
            return state.setIn(["conferenceDetails", "settingsPopup"], payload.settingsPopup) as IConference;

        case actions.TOGGLE_ANOTHER_CALL_POPUP:
            return state.setIn(["conferenceDetails", "anotherCallPopup"], payload.anotherCall) as IConference;

        case actions.TOGGLE_INITIATOR_POPUP:
            return state.setIn(["conferenceDetails", "initiatorPopup"], payload.initiatorPopup) as IConference;

        case actions.TOGGLE_STARTED_CONFERENCE:
            return state.setIn(["conferenceDetails", "startedConference"], payload.startedConference) as IConference;

        case actions.ADD_CONFERENCE_MEMBER_POPUP:
            return state.setIn(["conferenceDetails", "addMembersPopup"], payload.addMembersPopup) as IConference;

        case actions.REMOVE_CONFERENCE:
            return defaultState;

        default:
            return state;
    }
};
