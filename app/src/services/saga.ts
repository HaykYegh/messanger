"use strict";

import ConversationsSaga from "modules/conversations/ConversationsSaga";
import ApplicationSaga from "modules/application/ApplicationSaga";
import ConferenceSaga from "modules/conference/ConferenceSaga";
import SettingsSaga from "modules/settings/SettingsSaga";
import MessagesSaga from "modules/messages/MessagesSaga";
import ContactsSaga from "modules/contacts/ContactsSaga";
import RequestsSaga from "modules/requests/RequestsSaga";
import HandlersSaga from "modules/handlers/HandlersSaga";
import NetworksSaga from "modules/networks/NetworksSaga";
import GroupsSaga from "modules/groups/GroupsSaga";
import UserSaga from "modules/user/UserSaga";
import CallSaga from "modules/call/CallSaga";
import BinSaga from "modules/bin/BinSaga";

export function* messagesSaga(): any {
    yield MessagesSaga();
}

export function* settingsSaga(): any {
    yield SettingsSaga();
}

export function* contactsSaga(): any {
    yield ContactsSaga();
}

export function* conversationsSaga(): any {
    yield ConversationsSaga();
}

export function* networksSaga(): any {
    yield NetworksSaga()
}

export function* requestsSaga(): any {
    yield RequestsSaga();
}

export function* handlersSaga(): any {
    yield HandlersSaga();
}

export function* groupsSaga(): any {
    yield GroupsSaga();
}

export function* userSaga(): any {
    yield UserSaga();
}

export function* callSaga(): any {
    yield CallSaga();
}

export function* conferenceSaga(): any {
    yield ConferenceSaga();
}

export default function* (): any {
    yield ApplicationSaga();
}

export function* binSaga(): any {
    yield BinSaga();
}
