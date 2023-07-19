"use strict";

import {combineReducers} from "redux-immutable";

import conversationsData from "modules/conversations/ConversationsReducer";
import conferenceData from "modules/conference/ConferenceReducer";
import applicationData from "modules/application/ApplicationReducer";
import requestsData from "modules/requests/RequestsReducer";
import settingsData from "modules/settings/SettingsReducer";
import messagesData from "modules/messages/MessagesReducer";
import contactsData from "modules/contacts/ContactsReducer";
import networksData from "modules/networks/NetworksReducer";
import groupsData from "modules/groups/GroupsReducer";
import userData from "modules/user/UserReducer";
import callData from "modules/call/CallReducer";
import binData from "modules/bin/BinReducer";

export default combineReducers({
    applicationData,
    requestsData,
    settingsData,
    messagesData,
    contactsData,
    groupsData,
    userData,
    callData,
    conferenceData,
    networksData,
    conversationsData,
    binData,
});






