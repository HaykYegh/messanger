"use strict";

import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {IUserActions} from "./UserActions";
import {getColor} from "helpers/AppHelper";
import {fromJS, Map} from "immutable";
import {getInitials} from "helpers/DataHelper";
import {addMilliseconds} from "date-fns";
import {IResponseMessage} from "modules/user/UserTypes";
import {responseMarkerType} from "aws-sdk/clients/iam";
import {APPLICATION} from "configs/constants";

interface IUserReducerActions {
    CLEAR_ERROR_MESSAGE: string;
    ATTEMPT_UPDATE_PROFILE: string;
    ATTEMPT_SIGN_IN: string;
    // SIGN_IN_SUCCEED: string;
    // SIGN_IN_FAILED: string;
    SET_REFERRAL: string;
    RESET_USER: string;
    SET_USER: string;
    ATTEMPT_DELETE_ACCOUNT: any;
    DELETE_ACCOUNT: string;
    CHANGE_FIRST_LOGIN: string;
    SET_PREMIUM: string;

    SIGN_IN: any;
    SIGN_IN_SUCCEED: string;
    SIGN_IN_FAILED: string;

    UPDATE_RESPONSE_MESSAGE: string;

    UPDATE_PROFILE: any;
    UPDATE_PROFILE_OFFLINE: any;
    UPDATE_PROFILE_SUCCEED: any;
    UPDATE_PROFILE_FAILED: string;


    SIGN_OUT: any;
    SIGN_OUT_SUCCEED: string;
    SIGN_OUT_FAILED: string;

    SET_PASSWORD: any;
    SET_PASSWORD_SUCCEED: string;
    SET_PASSWORD_FAILED: string;

    DELETE_PASSWORD: any;
    DELETE_PASSWORD_SUCCEED: string;
    DELETE_PASSWORD_FAILED: string;
}

export const actions: IUserReducerActions = {
    CLEAR_ERROR_MESSAGE: "USER:CLEAR_ERROR_MESSAGE",
    ATTEMPT_UPDATE_PROFILE: "USER:ATTEMPT_UPDATE_PROFILE",
    ATTEMPT_SIGN_IN: "USER:ATTEMPT_SIGN_IN",
    // SIGN_IN_SUCCEED: "USER:SIGN_IN_SUCCEED",
    // SIGN_IN_FAILED: "USER:SIGN_IN_FAILED",
    SET_REFERRAL: "USER:SET_REFERRAL",
    RESET_USER: "USER:RESET_USER",
    SET_USER: "USER:SET_USER",
    ATTEMPT_DELETE_ACCOUNT: "USER:ATTEMPT_DELETE_ACCOUNT",
    DELETE_ACCOUNT: "USER:DELETE_ACCOUNT",
    CHANGE_FIRST_LOGIN: "CHANGE_FIRST_LOGIN",
    SET_PREMIUM: "SET_PREMIUM",

    SIGN_IN: "USER:SIGN_IN",
    SIGN_IN_SUCCEED: "USER:SIGN_IN_SUCCEED",
    SIGN_IN_FAILED: "USER:SIGN_IN_FAILED",

    UPDATE_RESPONSE_MESSAGE: "USER:UPDATE_RESPONSE_MESSAGE",

    UPDATE_PROFILE: "USER:UPDATE_PROFILE",
    UPDATE_PROFILE_OFFLINE: "USER:UPDATE_PROFILE_OFFLINE",
    UPDATE_PROFILE_SUCCEED: "USER:UPDATE_PROFILE_SUCCEED",
    UPDATE_PROFILE_FAILED: "USER:UPDATE_PROFILE_FAILED",

    SIGN_OUT: "USER:SIGN_OUT",
    SIGN_OUT_SUCCEED: "USER:SIGN_OUT_SUCCEED",
    SIGN_OUT_FAILED: "USER:SIGN_OUT_FAILED",

    SET_PASSWORD: "USER:SET_PASSWORD",
    SET_PASSWORD_SUCCEED: "USER:SET_PASSWORD_SUCCEED",
    SET_PASSWORD_FAILED: "USER:SET_PASSWORD_FAILED",

    DELETE_PASSWORD: "USER:DELETE_PASSWORD",
    DELETE_PASSWORD_SUCCEED: "USER:DELETE_PASSWORD_SUCCEED",
    DELETE_PASSWORD_FAILED: "USER:DELETE_PASSWORD_FAILED",
};

export interface IUserData extends Map<string, any> {
    user: any,
    responseMessage: IResponseMessage,
    shouldPasswordSet: boolean,
}

export const defaultState: IUserData = fromJS({
    user: {
        username: null,
        firstName: "",
        lastName: "",
        fullName: "",
        email: "",
        avatar: null,
        imageUrl: null,
        avatarCharacter: null,
        errorMessage: null,
        color: null,
        phone: null,
        id: null,
        isPasswordSet: false,
        regionCode: null,
        phoneCode: null,
        deepLink: "",
        avatarBlobUrl: "",
        isFirstLogin: false,
        premium: "false"
    },
    responseMessage: {
        level: "",
        message: ""
    },
});

export default (state: IUserData = defaultState, {type, payload}: IUserActions): IUserData => {

    switch (type) {
        case actions.SET_USER:
            state = state
                .setIn(["user", "id"], `${payload.username}@${SINGLE_CONVERSATION_EXTENSION}`)
                .setIn(["user", "username"], payload.username)
                .setIn(["user", "firstName"], payload.firstName)
                .setIn(["user", "lastName"], payload.lastName)
                .setIn(["user", "fullName"], payload.fullName)
                .setIn(["user", "avatar"], payload.avatar)
                .setIn(["user", "avatarCharacter"], getInitials(payload.firstName, payload.lastName))
                .setIn(["user", "imageUrl"], payload.imageUrl)
                .setIn(["user", "color"], fromJS(getColor()))
                .setIn(["user", "phone"], payload.username)
                .setIn(["user", "email"], payload.email)
                .setIn(["user", "phoneCode"], APPLICATION.WITHOUTCOUNTRY ? "" : payload.phoneCode)
                .setIn(["user", "regionCode"], payload.regionCode)
                .setIn(["user", "isPasswordSet"], payload.isPasswordSet)
                .setIn(["user", "deepLink"], payload.deepLink)
                .setIn(["user", "avatarBlobUrl"], payload.avatarBlobUrl)
                .setIn(["responseMessage", "message"], "") as IUserData;
            return state as IUserData;

        case actions.SIGN_IN_SUCCEED:
            return state
                .setIn(["user", "id"], `${payload.username}@${SINGLE_CONVERSATION_EXTENSION}`)
                .setIn(["user", "username"], payload.username)
                .setIn(["user", "firstName"], payload.firstName)
                .setIn(["user", "lastName"], payload.lastName)
                .setIn(["user", "fullName"], payload.fullName)
                .setIn(["user", "avatar"], payload.avatar)
                .setIn(["user", "avatarCharacter"], getInitials(payload.firstName, payload.lastName))
                .setIn(["user", "imageUrl"], payload.imageUrl)
                .setIn(["user", "color"], fromJS(getColor()))
                .setIn(["user", "phone"], payload.username)
                .setIn(["user", "email"], payload.email)
                .setIn(["user", "phoneCode"], APPLICATION.WITHOUTCOUNTRY ? "" : payload.phoneCode)
                .setIn(["user", "regionCode"], payload.regionCode)
                .setIn(["user", "isPasswordSet"], payload.isPasswordSet)
                .setIn(["user", "deepLink"], payload.deepLink)
                .setIn(["user", "avatarBlobUrl"], payload.avatarBlobUrl)
                .setIn(["responseMessage", "message"], "") as IUserData;

        case actions.SIGN_IN_FAILED:
            return state.set("responseMessage", fromJS(payload.responseMessage)) as IUserData;

        case actions.SET_PASSWORD_SUCCEED:
            return state.setIn(["user", "isPasswordSet"], true) as IUserData;

        case actions.DELETE_PASSWORD_SUCCEED:
            return state.setIn(["user", "isPasswordSet"], false) as IUserData;

        case actions.SET_PREMIUM:
            return state.setIn(["user", "premium"], payload.isPremium) as IUserData;

        case actions.SET_PASSWORD_FAILED:
            return state.set("responseMessage", fromJS(payload.responseMessage)) as IUserData;

        case actions.DELETE_PASSWORD_FAILED:
            return state.set("responseMessage", fromJS(payload.responseMessage)) as IUserData;

        case actions.CLEAR_ERROR_MESSAGE:
            return state.set("responseMessage", fromJS({level: "", message: "", type: ""})) as IUserData;

        case actions.RESET_USER:
            return defaultState;

        case actions.UPDATE_PROFILE_SUCCEED:
            const firstName: string = payload.profile.firstName;
            const lastName: string = payload.profile.lastName;
            const fullName: string = payload.profile.fullName;
            const avatar: Blob = payload.profile.avatar;
            const imageUrl: Blob = payload.profile.imageUrl;

            state = state
                .setIn(["user", "avatarCharacter"], getInitials(firstName || state.get("firstName"), lastName || state.get("lastName")))
                .setIn(["user", "firstName"], firstName)
                .setIn(["user", "lastName"], lastName)
                .setIn(["user", "fullName"], fullName)
                .setIn(["user", "avatar"], avatar)
                .setIn(["user", "avatarBlobUrl"], avatar && (window as any).URL.createObjectURL(avatar))
                .setIn(["user", "imageUrl"], imageUrl) as IUserData;
            return state as IUserData;

        case actions.UPDATE_RESPONSE_MESSAGE:
            return state.setIn(["responseMessage", "level"], payload.responseMessage.level)
                .setIn(["responseMessage", "message"], payload.responseMessage.message) as IUserData;

        case actions.UPDATE_PROFILE_FAILED:
            return state
                .setIn(["responseMessage", "level"], payload.responseMessage.level)
                .setIn(["responseMessage", "message"], payload.responseMessage.message) as IUserData;

        case actions.CHANGE_FIRST_LOGIN:
            return state
                .setIn(["user", "isFirstLogin"], payload.isFirstLogin) as IUserData;

        case actions.SIGN_OUT_SUCCEED:
            return defaultState;

        case actions.SIGN_OUT_FAILED:
            return state
                .setIn(["responseMessage", "level"], payload.responseMessage.level)
                .setIn(["responseMessage", "message"], payload.responseMessage.message) as IUserData;

        default:
            return state;
    }
};
