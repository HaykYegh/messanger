"use strict";
import {Map, OrderedMap} from 'immutable';

import {createSelector} from "helpers/DataHelper";
import {IConferenceDetails} from "modules/conference/ConferenceReducer";
import {CONFERENCE_COMMANDS} from "xmpp/XMLConstants";
import {userIdSelector} from "modules/user/UserSelector";

const conferenceDataSelector: any = state => state.get("conferenceData");

const showConferenceSelector: any = createSelector(
    conferenceDataSelector, (data: any) => data.get("showConference")
);

export const conferenceDetailsSelector: any = createSelector(
    conferenceDataSelector, (data: any) => data.get("conferenceDetails")
);

const conferenceInitializingSelector: any = createSelector(
    conferenceDataSelector, (data: any) => data.get("initialized")
);

export interface IConferenceModuleProps {
    showConference: boolean;
    conferenceDetails: IConferenceDetails;
    initialized: boolean;
}

export default (state) => {
    return {
        showConference: showConferenceSelector(state),
        conferenceDetails: conferenceDetailsSelector(state),
        initialized: conferenceInitializingSelector(state),
    };
};

export const isConferenceShowSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.get("showConference")
);

export const isConferenceInitializedSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.get("initialized")
);

export const getConferenceOrderedMembersSelector: any = () => createSelector(
    conferenceDataSelector, userIdSelector(), (data: any, userId) => {
        let sortedMembers = OrderedMap({});
        // const userId = "871249137763@msg.hawkstream.com"; // Todo
        const members: Map<string, any> = data.getIn(['conferenceDetails', 'members']);
        sortedMembers = sortedMembers.set(userId, members.get(userId));
        const filteredMembers = members.filter((value, key) => key !== userId);

        if (filteredMembers && filteredMembers.size > 0) {
            filteredMembers.map((value, key) => {
                sortedMembers = sortedMembers.set(key, value);
            });
        }

        return sortedMembers;
    }
);

export const getConferenceMembersSelector: any = () => createSelector(
    conferenceDataSelector, userIdSelector(), (data: any, userId) => data.getIn(['conferenceDetails', 'members'])
);

export const getConferenceVoiceActivityMembersSelector: any = () => createSelector(
    conferenceDataSelector, userIdSelector(), (data: any) => data.getIn(['conferenceDetails', 'voiceActivityMembers'])
);

export const getConferenceCurrentMember: any = () => createSelector(
    conferenceDataSelector, userIdSelector(), (data: any, userId) => data.getIn(['conferenceDetails', 'currentMember'])
);

export const getConferenceStatusesSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'statuses'])
);

export const getStartedConferenceSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'startedConference'])
);

export const getConferencesettingsPopupSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'settingsPopup'])
);

// "electron": "^15.0.0",
//     "electron-builder": "^22.9.1",
//     "electron-builder-http": "^19.27.5",
//     "electron-devtools-installer": "^2.0.1",
//     "electron-notarize": "^0.1.1",

export const getConferenceInfoSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'info'])
);

export const getLeaveGroupCallPopupSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'leaveGroupCallPopup'])
);

export const getGroupCallInitiator: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'initiator'])
);

export const isConferenceIncomingCallSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'isIncomingCall'])
);

export const getConferenceCallIdSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'callId'])
);

export const getConferenceMemberIdSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => data.getIn(['conferenceDetails', 'memberId'])
);

export const getAllowedMembersCountSelector: any = () => createSelector(
    conferenceDataSelector, (data: any) => {
        const statuses: Map<string, any> = data.getIn(['conferenceDetails', 'statuses']);
        const permittedStatuses: string[] = [CONFERENCE_COMMANDS.calling, CONFERENCE_COMMANDS.ringing, CONFERENCE_COMMANDS.join];
        return statuses.filter(status => permittedStatuses.includes(status)).size;
    }
);
