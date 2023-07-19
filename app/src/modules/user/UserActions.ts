"use strict";

import {actions} from "./UserReducer";
import {ICountry} from "services/interfaces";
import {IResponseMessage} from "modules/user/UserTypes";
import {v5String} from "uuid/interfaces";

export interface IUserActions {
    type: string;
    payload?: {
        sessionExpired?: boolean;
        errorMessage?: string;
        deleteImage?: boolean;
        accessToken?: string;
        firstName?: string;
        imageTime?: string;
        oldImage?: string;
        lastName?: string;
        password?: string;
        fullName?: string;
        username?: string;
        updateUser?: any;
        imageUrl?: Blob;
        image?: string;
        phone?: string;
        email?: string;
        networks?: any;
        avatar?: Blob;
        user?: any;

        country?: ICountry;
        number?: string;
        pinCode?: string;

        responseMessage?: IResponseMessage,

        profile?: {
            userId?: string,
            firstName?: string,
            lastName?: string,
            avatar?: Blob,
            imageUrl?: Blob,
            isAvatarChanged?: boolean,
            isAvatarDeleted?: boolean,
            fullName?: string
        },

        isForgotPassword?: boolean,
        shouldDeleteHistory?: boolean,
        isPasswordSet?: boolean,
        currentPassword?: string,
        params?: any
        phoneCode?: string,
        regionCode?: string,
        isFirstLogin?: boolean,
        deepLink?: string,
        avatarBlobUrl?: string,
        isPremium?: string,
    };
}

export function changeIsFirstLogin(isFirstLogin: boolean): IUserActions {
    return {type: actions.CHANGE_FIRST_LOGIN, payload: {isFirstLogin}};
}

export function signInFailed(errorMessage: string): IUserActions {
    return {type: actions.SIGN_IN_FAILED, payload: {errorMessage}};
}

export function setPremium(isPremium: string): IUserActions {
    return {type: actions.SET_PREMIUM, payload: {isPremium}};
}

export function CLEAR_ERROR_MESSAGE(): IUserActions {
    return {type: actions.CLEAR_ERROR_MESSAGE};
}

export function signInSucceed(firstName: string, lastName: string, fullName: string, avatar: Blob, imageUrl: Blob, username: string, email: string): IUserActions {
    return {
        type: actions.SIGN_IN_SUCCEED,
        payload: {firstName, lastName, fullName, avatar, imageUrl, username, email}
    };
}

export function setUser(user: any): IUserActions {
    return {
        type: actions.SET_USER,
        payload: {...user}
    };
}

export function attemptUpdateProfile(user: any, updateUser: any): IUserActions {
    return {
        type: actions.ATTEMPT_UPDATE_PROFILE,
        payload: {user, updateUser}
    };
}

export function attemptSignIn({username, accessToken, password, email, firstName, lastName, avatar, networks}: any): IUserActions {
    return {
        type: actions.ATTEMPT_SIGN_IN,
        payload: {username, accessToken, password, email, firstName, lastName, avatar, networks}
    };
}


export function resetUser(): IUserActions {
    return {type: actions.RESET_USER};
}

export function attemptDeleteAccount(): IUserActions {
    return {type: actions.ATTEMPT_DELETE_ACCOUNT};
}

export function deleteAccount(): IUserActions {
    return {type: actions.DELETE_ACCOUNT};
}

export function SIGN_IN(country: ICountry, number?: string, email?: string, password?: string, pinCode?: string, isForgotPassword: boolean = false, accessToken?: string): IUserActions {
    return {type: actions.SIGN_IN, payload: {country, number, email, password, pinCode, isForgotPassword, accessToken}};
}

export function SIGN_IN_SUCCEED(firstName: string, lastName: string, fullName: string, avatar: Blob, imageUrl: Blob, username: string, email: string, isPasswordSet: boolean, phoneCode: string, regionCode: string, deepLink: string, avatarBlobUrl: string): IUserActions {
    return {
        type: actions.SIGN_IN_SUCCEED,
        payload: {firstName, lastName, fullName, avatar, imageUrl, username, email, isPasswordSet, phoneCode, regionCode, deepLink, avatarBlobUrl}
    };
}

export function SIGN_IN_FAILED(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.SIGN_IN_FAILED, payload: {responseMessage}};
}

export function UPDATE_RESPONSE_MESSAGE(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.UPDATE_RESPONSE_MESSAGE, payload: {responseMessage}};
}

export function UPDATE_PROFILE(profile: {
    firstName?: string,
    lastName?: string,
    avatar?: Blob,
    imageUrl?: Blob,
    isAvatarDeleted?: boolean,
    isAvatarChanged?: boolean
}): IUserActions {
    return {type: actions.UPDATE_PROFILE, payload: {profile}};
}

export function UPDATE_PROFILE_SUCCEED(profile: {
    firstName: string,
    lastName: string,
    fullName: string,
    avatar: Blob,
    imageUrl: Blob,
}): IUserActions {
    return {type: actions.UPDATE_PROFILE_SUCCEED, payload: {profile}};
}

export function UPDATE_PROFILE_OFFLINE(params: any): IUserActions {
    return {type: actions.UPDATE_PROFILE_OFFLINE, payload: {params}};
}

export function UPDATE_PROFILE_FAILED(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.UPDATE_PROFILE_FAILED, payload: {responseMessage}};
}

export function SIGN_OUT(shouldDeleteHistory: boolean, sessionExpired?: boolean): IUserActions {
    return {type: actions.SIGN_OUT, payload: {shouldDeleteHistory, sessionExpired}};
}

export function SIGN_OUT_SUCCEED(): IUserActions {
    return {type: actions.SIGN_OUT_SUCCEED};
}

export function SIGN_OUT_FAILED(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.SIGN_OUT_FAILED, payload: {responseMessage}};
}

export function SET_PASSWORD(password: string): IUserActions {
    return {type: actions.SET_PASSWORD, payload: {password}};
}

export function DELETE_PASSWORD(currentPassword: string): IUserActions {
    return {type: actions.DELETE_PASSWORD, payload: {currentPassword}};
}

export function SET_PASSWORD_SUCCEED(): IUserActions {
    return {type: actions.SET_PASSWORD_SUCCEED};
}

export function DELETE_PASSWORD_SUCCEED(): IUserActions {
    return {type: actions.DELETE_PASSWORD_SUCCEED};
}

export function SET_PASSWORD_FAILED(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.SET_PASSWORD_FAILED, payload: {responseMessage}};
}

export function DELETE_PASSWORD_FAILED(responseMessage: IResponseMessage): IUserActions {
    return {type: actions.DELETE_PASSWORD_FAILED, payload: {responseMessage}};
}

