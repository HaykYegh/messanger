"use strict";

import {
    attemptSetNewMessagesCount, getAllCaches,
    removeLoading,
    reset as resetAplication,
    setLoading,
    UPDATE_APPLICATION_STATE
} from "../application/ApplicationActions";
import {
    changeIsFirstLogin,
    CLEAR_ERROR_MESSAGE,
    DELETE_PASSWORD_FAILED,
    IUserActions,
    resetUser,
    SET_PASSWORD_FAILED,
    SET_PASSWORD_SUCCEED,
    SIGN_IN_FAILED,
    SIGN_IN_SUCCEED,
    SIGN_OUT,
    SIGN_OUT_FAILED,
    SIGN_OUT_SUCCEED,
    UPDATE_PROFILE_FAILED,
    UPDATE_PROFILE_SUCCEED,
} from "./UserActions";
import {
    addRecentStickers,
    attemptAddSticker,
    attemptCheckNewStickers,
    setMyStickers,
    setSettings,
    setStickers,
} from "modules/settings/SettingsActions";
import {attemptCreateContact, attemptSetContacts, reset as resetContacts} from "modules/contacts/ContactsActions";
import {reset as resetMessages} from "modules/messages/MessagesActions";
import {addRequest, removeRequest, reset as resetRequests} from "modules/requests/RequestsActions";
import {getUsersProfile, profile as getProfile, updateProfileRequest} from "requests/profileRequest";
import {reset as resetGroups} from "modules/groups/GroupsActions";
import {reset as resetCalls} from "modules/call/CallActions";
import {conversationBulkInsert, reset as resetConversations} from "modules/conversations/ConversationsActions";
import {all, call, fork, put, select, takeEvery, takeLatest} from "redux-saga/effects";
import connectionCreator from "xmpp/connectionCreator";
import {getDeepLink} from "requests/getDeepLink";

import {backgroundXML} from "xmpp/XMLBuilders";
import {actions} from "./UserReducer";
import conf from "configs/configurations";
import {
    checkPasswordExistNumber,
    deletePassword,
    ISignInParams,
    setPassword,
    singInUsingEmailAndPassword,
    singInUsingEmailAndPinCode,
    singInUsingNumberAndPassword,
    singInUsingNumberAndPinCode
} from "requests/loginRequest";
import {deleteUser, getStickers} from "requests/settingsRequest";
import IDBApplication, {APPLICATION_PROPERTIES} from "services/database/class/Application";
import {addNetwork, resetNetworks} from "modules/networks/NetworksActions"
import {APPLICATION, DEFAULT_STICKERS, DEFAULT_TIME_FORMAT, LOG_TYPES, LOGS_LEVEL_TYPE} from "configs/constants";
import {attemptRetrieveFile, attemptUploadFile, setAWSFiles, updateUserProfile} from "helpers/FileHelper";
import {createUserObject, getDeviceToken, setUserMessagesLimit, writeLog} from "helpers/DataHelper";
import components from "configs/localization";
import {
    addAuthorizationHeader,
    cancelPostRequests,
    getAppVersion,
    getEnv,
    getLanguage,
    getOsVersion,
    getPlatform,
    renewCancelToken
} from "helpers/AppHelper";
import IDBSettings from "services/database/class/Settings";
import IDBNetwork from "services/database/class/Networks";
import {attemptAddRequests} from "modules/requests/RequestsSaga";
import {deleteCredentials, getCredentials, ICredentials, updateCredentials} from "services/request";
import UserModel from "modules/user/UserModel";
import {IDownloadFile, IUploadFile} from "services/interfaces";
import {userAvatarSelector, userIdSelector, userImageSelector, userSelector} from "modules/user/UserSelector";
import {initialize as DBInitialize, release as DBRelease} from "services/database"
import {REMOVE_FROM_BLOCKED_COMMAND} from "xmpp/XMLConstants";
import {format} from "date-fns";
import {COOKIE_CONST, setAuthorizationToken} from "helpers/CookieHelper";
import {getAWSFile} from "requests/fsRequest";
import {LoginManager} from "modules/messages/LoginManager";
import Log from "modules/messages/Log";
import IDBConversation from "services/database/class/Conversation";
import IDBMessage from "services/database/class/Message";
import IDBCache from "services/database/class/Cache";

function* attemptUpdateProfile({payload: {user, updateUser}}: any): any {
    try {
        if (updateUser) {
            const {firstName, lastName, image, isAvatarChange, deleted} = updateUser;
            const imageKey: string = `${user.get("username")}/image`;
            const avatarKey: string = `${user.get("username")}/avatar`;

            let avatar: Blob = user.get('avatar');
            let imageUrl: Blob = user.get('imageUrl');

            if (isAvatarChange) {
                const {original, cropped} = image;
                const uploadImage: any = yield call(setAWSFiles, [
                    {
                        bucket: conf.app.aws.bucket.profile,
                        path: avatarKey,
                        value: cropped,
                    },
                    {
                        bucket: conf.app.aws.bucket.profile,
                        path: imageKey,
                        value: original,
                    }
                ]);

                if (uploadImage) {
                    avatar = cropped;
                    imageUrl = original;
                }
            }

            const {data: {status}}: any = yield call(updateProfileRequest, firstName, lastName, deleted ? "" : user.get("username"));

            if (status === "SUCCESS") {

                const user = yield call(IDBApplication.get, APPLICATION_PROPERTIES.user);
                if (user) {
                    user.firstName = firstName;
                    user.fullName = `${firstName} ${lastName}`;
                    user.lastName = lastName;
                    user.avatar = avatar;
                    user.imageUrl = imageUrl;
                }

                yield all([
                    fork(IDBApplication.update, APPLICATION_PROPERTIES.user, user),
                    // put(updateProfile(firstName, lastName, avatar, imageUrl))
                ]);

                return true;
            }

        }
    } catch (error) {
        console.dir(error);
    }
}

function* UPDATE_PROFILE_HANDLER({payload}: IUserActions) {
    let avatarSmallUploader: IUploadFile = null;
    let avatarOriginalUploader: IUploadFile = null;
    let updatedProfile: any = null;

    try {

        // update AWS
        // update API
        // update local DB
        // update Store

        const firstName: string = payload.profile.firstName;
        const lastName: string = payload.profile.lastName;
        const avatar: Blob = payload.profile.avatar;
        const imageUrl: Blob = payload.profile.imageUrl;
        const isAvatarChanged: boolean = payload.profile.isAvatarChanged;
        const isAvatarDeleted: boolean = payload.profile.isAvatarDeleted;
        const oldAvatar: Blob = yield select(userAvatarSelector());
        const oldImageUrl: Blob = yield select(userImageSelector());
        const credentials: ICredentials = getCredentials();

        const user = yield call(IDBApplication.get, APPLICATION_PROPERTIES.user);
        let fullName: string = "";

        if (user) {
            fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "";

            user.firstName = firstName;
            user.fullName = fullName;
            user.lastName = lastName;
            user.avatar = isAvatarChanged ? avatar : isAvatarDeleted ? null : oldAvatar;
            user.imageUrl = isAvatarChanged ? imageUrl : isAvatarDeleted ? null : oldImageUrl;
        }

        yield call(IDBApplication.update, APPLICATION_PROPERTIES.user, user);

        yield put(UPDATE_PROFILE_SUCCEED({
            firstName,
            lastName,
            fullName,
            avatar: user.avatar,
            imageUrl: user.imageUrl
        }));

        updatedProfile = {
            firstName: payload.profile.firstName,
            lastName: payload.profile.lastName,
            avatarFileName: !isAvatarDeleted ? Date.now().toString() : "",
        };

        if (isAvatarChanged) {
            avatarSmallUploader = {
                bucket: conf.app.aws.bucket.profile,
                data: payload.profile.avatar,
                key: `${credentials["X-Access-Number"]}/avatar`
            };

            avatarOriginalUploader = {
                bucket: conf.app.aws.bucket.profile,
                data: payload.profile.imageUrl,
                key: `${credentials["X-Access-Number"]}/image`
            };

            yield all([
                call(attemptUploadFile, avatarSmallUploader),
                call(attemptUploadFile, avatarOriginalUploader)
            ])
        }

        yield call(updateUserProfile, updatedProfile);


    } catch (e) {
        Log.i(e);
        const userId: string = yield select(userIdSelector());
        const request: any = {
            id: userId,
            xmlBuilder: "profileUpdate",
            params: {
                avatarSmallUploader,
                avatarOriginalUploader,
                updatedProfile
            },
            createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
        };

        yield put(addRequest(request));


        return yield put(UPDATE_PROFILE_FAILED({level: "ERROR", message: "Failed to update profile"}));
    }
}

function* SIGN_IN_HANDLER({payload}: IUserActions): any {
    renewCancelToken();
    yield put(setLoading());
    yield put(CLEAR_ERROR_MESSAGE());
    try {
        const user = {
            id: null,
            firstName: null,
            lastName: null,
            fullName: null,
            avatar: null,
            imageUrl: null,
            username: null,
            phone: null,
            email: null,
            isPasswordSet: false,
            phoneCode: null,
            regionCode: null,
            avatarBlobUrl: null,
        };

        let authResponse: any;

        const signInParams: ISignInParams = {
            appVersion: getAppVersion(),
            deviceName: getPlatform().name,
            platformVersion: getOsVersion(),
            platformId: getPlatform().platformId,
            deviceToken: getDeviceToken(),
            isDevEnv: getEnv() === "development",
            language: getLanguage(),
            phoneCode: payload.country.phoneCode,
            regionCode: payload.country.regionCode,
            number: payload.number,
            password: payload.password,
            email: payload.email,
            pinCode: payload.pinCode
        };


        // access token comes as a prop from payload when login type is qr
        if (!payload.accessToken) {
            if (signInParams.number !== "" && signInParams.password !== "") {
                // sign in using mobile and password
                authResponse = yield call(singInUsingNumberAndPassword, signInParams)
            } else if (signInParams.email !== "" && signInParams.password !== "") {
                // sign in using email and password
                authResponse = yield call(singInUsingEmailAndPassword, signInParams)
            } else if (signInParams.email !== "" && signInParams.password === "" && signInParams.pinCode !== "") {
                // sign in using email and pin
                authResponse = yield call(singInUsingEmailAndPinCode, signInParams)
            } else if (signInParams.number !== "" && signInParams.password === "" && signInParams.pinCode !== "") {
                // sign in using mobile and pin
                authResponse = yield call(singInUsingNumberAndPinCode, signInParams)
            } else {
                return yield put(SIGN_IN_FAILED({level: "ERROR", message: "INVALID_DATA"}))
            }
        }


        // update credentials in local storage and request module;
        const headers: any = !payload.accessToken ? authResponse.headers : null;
        const XAccessPrefix: string = !payload.accessToken ? headers["X-Access-Prefix"] : conf.app.prefix;
        const XAccessNumber: string = !payload.accessToken ? headers["X-Access-Number"] : signInParams.number;
        const XAccessToken: string = !payload.accessToken ? headers["X-Access-Token"]: payload.accessToken;
        updateCredentials(XAccessPrefix, XAccessNumber, XAccessToken);
        yield call(DBInitialize);
        /// end

        const networks: any = !payload.accessToken ? authResponse.result.networks : null;

        // get user profile

        const userInfo = payload.email !== "" ? payload.email : payload.number

        const profiles = yield call(getUsersProfile, [userInfo], payload.email !== "");
        const profile: any = profiles[0].profileInfo;

        const shouldUserPasswordSet: boolean = payload.isForgotPassword;
        const shouldUserProfileSet: boolean = !payload.accessToken ? authResponse.result.isNewUser || !profile.firstName : false;

        if (shouldUserPasswordSet || shouldUserProfileSet) {
            yield put(UPDATE_APPLICATION_STATE({shouldUserPasswordSet, shouldUserProfileSet}))
        }

        try {
            if (profile.imageHash) {
                // get user avatar

                const avatarDownloader: IDownloadFile = {
                    bucket: conf.app.aws.bucket.profile,
                    key: `${XAccessNumber}/avatar`
                };



                const avatarFile: Blob = yield call(attemptRetrieveFile, avatarDownloader);
                user.avatar = avatarFile;
                user.imageUrl = avatarFile;
                // end
            }
        } catch (e) {
            Log.i(">>>> Can't insert the avatar");
        }

        user.username = XAccessNumber;
        user.firstName = profile ? profile.firstName : "";
        user.lastName = profile ? profile.lastName : "";
        user.email = payload.email;

        if (!!payload.password) {
            user.isPasswordSet = !!payload.password;
        } else {
            const isPasswordExist: boolean = yield call(checkPasswordExistNumber, payload.number);
            user.isPasswordSet = isPasswordExist
        }

        user.phoneCode = payload.country.phoneCode;
        user.regionCode = payload.country.regionCode;

        if (user.firstName !== "") {
            user.fullName = `${user.firstName} ${user.lastName}`
        } else if (user.email !== "") {
            user.fullName = user.email
        } else {
            user.fullName = user.username
        }

        console.warn(payload, new Date(), XAccessPrefix, XAccessNumber, XAccessToken, "User Saga");
        const settings = yield call(IDBSettings.getStoreSettings);
        let deepLink = ""

        yield call(IDBApplication.update, APPLICATION_PROPERTIES.user, createUserObject(user).toJS());

        const { data } = yield call(getDeepLink);

        if (data.status === "SUCCESS") {
            deepLink = data.body
            localStorage.setItem("deepLink", deepLink)
        }

        if (user.avatar) {
           user.avatarBlobUrl = (window as any).URL.createObjectURL(user.avatar)
        }

        const version = yield call(IDBApplication.get, APPLICATION_PROPERTIES.appVersion);

        yield all([
            put(SIGN_IN_SUCCEED(user.firstName, user.lastName, user.fullName, user.avatar, user.imageUrl, user.username, user.email, user.isPasswordSet, user.phoneCode, user.regionCode, deepLink, user.avatarBlobUrl)),
            put(UPDATE_APPLICATION_STATE({config: {version, env: process.env.NODE_ENV || 'production'}})),
            put(setSettings(settings))
        ]);

        //for resizing application when user is logged in
        // resizeApplication(false);
        //for resizing application when user is logged in

        writeLog(LOG_TYPES.user, {
            reason: "LOGIN SUCCESS",
            XAccessNumber,
            XAccessToken
        });
        const recentStickers = yield call(IDBApplication.get, APPLICATION_PROPERTIES.stickers);

        yield all([
            put(addRecentStickers(recentStickers)),
            put(removeLoading())
        ]);

        writeLog(LOG_TYPES.user, {
            reason: "TRYING TO SET CONTACTS§",
            XAccessNumber
        });

        yield put(attemptSetContacts(XAccessNumber));

        const stickerStore = yield call(IDBApplication.get, APPLICATION_PROPERTIES.stickerStore);
        const myStickers = yield call(IDBApplication.get, APPLICATION_PROPERTIES.myStickers);

        if (networks && networks.length > 0) {
            for (const network of networks) {
                yield all([
                    call(IDBNetwork.updateNetwork, network.networkId, network),
                    put(addNetwork(Number(network.networkId), network))
                ]);
            }
        }

        if (stickerStore && Object.keys(stickerStore).length > 0) {
            yield all([
                put(setStickers(stickerStore)),
                put(setMyStickers(myStickers)),
                put(attemptCheckNewStickers()),
            ]);
        } else {
            const {data: {body: {stickers}}}: any = yield call(getStickers);
            const storeStickers: any = {};
            for (let i: number = 0; i < stickers.length; i++) {
                const sticker: any = stickers[i];

                storeStickers[sticker.stickerPackageId.toString()] = {
                    preview: "",
                    icon: "",
                    id: sticker.stickerPackageId.toString(),
                    category: sticker.stickerCategory,
                    featured: sticker.featured,
                    position: sticker.position,
                    description: sticker.desc,
                    icons: {},
                    defaultPackage: false,
                    price: sticker.price,
                    free: sticker.free,
                    name: sticker.name,
                    hidden: false
                }
            }
            yield put(setStickers(storeStickers));
            yield put(attemptAddSticker(DEFAULT_STICKERS.id));
            yield fork(IDBApplication.update, APPLICATION_PROPERTIES.stickerStore, storeStickers);
        }
        yield put(attemptSetNewMessagesCount());

        const localConversaions = yield call(IDBConversation.getLocalConversations)

        yield put(conversationBulkInsert(localConversaions))

        const caches = yield call(IDBCache.getAll)

        yield put(getAllCaches(caches))

        Log.i("UserSaga user -> ", user)

        yield put(attemptCreateContact(
            user.id,
            user.firstName,
            user.lastName,
            user.username,
            user.phone,
            false,
            false,
            null,
            user.email,
            user.email,
            null,
            null,
            true
        ));

        yield call(IDBMessage.updateBlobUrls)

    } catch (error) {
        writeLog(LOG_TYPES.user, {
            reason: "SIGN IN FAILED",
            errorInfo: error,
            // XAccessToken
        }, LOGS_LEVEL_TYPE.error);
        Log.i(error);
        yield put(SIGN_IN_FAILED({level: "ERROR", message: error.message, type: "SIGN_IN_FAIL"}));

    } finally {
        Log.i("### attemptSignIn");
    }
}

function* watchForContactsSync() {
    // while (true) {
    // should be disable for zz
    //     yield take(APPLICATION_ACTIONS.CONTACTS_SYNC_SUCCESS);
    //     yield put(attemptSetConversations());
    // }
}

function* attemptDeleteAccount() {
    writeLog("attempt delete account");
    try {
        const {data: {status}} = yield call(deleteUser);
        if (status === "SUCCESS") {
            yield put(SIGN_OUT(true));
            yield call(IDBApplication.drop);
            yield put(resetNetworks())
        } else {
            writeLog("Delete user request received status failed")
        }
    } catch (e) {
        writeLog(e)
    }
}

function* watchForSignInSuccess() {
    yield fork(attemptAddRequests)
}

function* SIGN_OUT_HANDLER({payload}) {
    try {
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = backgroundXML();
        if (connection.connected) {
            connection.send(msg);
        }
        connection.disconnect();

        const shouldDeleteHistory: boolean = payload.shouldDeleteHistory;
        const sessionExpired: boolean = payload.sessionExpired;

        const localization: any = components().common;
        cancelPostRequests();
        const credentials: ICredentials = getCredentials();
        const username: string = credentials["X-Access-Number"];

        if (shouldDeleteHistory) {
            yield call(UserModel.purgeUser);
            localStorage.removeItem("selectedLanguage");
        } else {
            yield call(UserModel.signOut);
        }

        deleteCredentials();

        DBRelease();

        // localStorage.removeItem(btoa(`${APPLICATION.UUID_KEY}${username}`));
        localStorage.removeItem(`synced_${APPLICATION.VERSION}`);
        localStorage.removeItem("deepLink");
        const selectedLanguage = localStorage.getItem("selectedLanguage");
        yield all([
            put(resetUser()),
            put(resetAplication()),
            put(resetContacts()),
            put(resetMessages()),
            put(resetRequests()),
            // put(resetSettings(selectedLanguage)),
            put(resetGroups()),
            put(resetCalls()),
            put(resetConversations()),
            put(SIGN_OUT_SUCCEED()),
            // call(removeAuthorizationHeader)
        ]);
        if ((window as any).ipcRenderer) {
            (window as any).ipcRenderer.send('setBadge', null);
        }

        writeLog(LOG_TYPES.user, {
            reason: "SIGN OUT",
            username
        });

        if (sessionExpired) {
            yield put(SIGN_OUT_FAILED({level: "ERROR", message: localization.sessionExpired}))
        } else {
            // resizeApplication(true)
        }

        LoginManager.sharedInstance.afterLogout()

    } catch (e) {
        Log.i(e);
        return yield put(SIGN_OUT_FAILED({level: "ERROR", message: e.message}));
    }
}

function* SET_PASSWORD_HANDLER({payload}) {
    try {

        const password: string = payload.password;
        const user = yield select(userSelector());

        const isEmail: boolean = !!user.get("email");
        const username: string = user.get("username");

        const status: boolean = yield call(setPassword, isEmail, username, password);

        if (status) {
            const user = yield call(IDBApplication.get, APPLICATION_PROPERTIES.user);

            if (!user.isPasswordSet) {
                user.isPasswordSet = true;
                yield call(IDBApplication.update, APPLICATION_PROPERTIES.user, createUserObject(user).toJS());
                yield put(SET_PASSWORD_SUCCEED());
            }

            yield put(changeIsFirstLogin(false))
        }

    } catch (e) {
        Log.i(e);
        return yield put(SET_PASSWORD_FAILED({level: "ERROR", message: e.message}));
    }
}

function* DELETE_PASSWORD_HANDLER({payload}) {
    try {

        const currentPassword: string = payload.currentPassword;
        const status: boolean = yield call(deletePassword, currentPassword);

    } catch (e) {
        Log.i(e);
        return yield put(DELETE_PASSWORD_FAILED({level: "ERROR", message: e.message}));
    }
}

function* UPDATE_PROFILE_OFFLINE_HANDLER({payload}) {
    try {
        yield call(updateUserProfile, payload.params.updatedProfile);

        if (payload.params.avatarSmallUploader) {
            yield all([
                call(attemptUploadFile, payload.params.avatarSmallUploader),
                call(attemptUploadFile, payload.params.avatarOriginalUploader)
            ])
        }

        const userId: string = yield select(userIdSelector());
        yield put(removeRequest(userId));

    } catch (e) {
        Log.i(e);
        return yield put(UPDATE_PROFILE_FAILED({level: "ERROR", message: "Failed to update profile"}));
    }
}


function* userSaga(): any {
    yield takeLatest(actions.ATTEMPT_UPDATE_PROFILE, attemptUpdateProfile);
    yield takeLatest(actions.UPDATE_PROFILE, UPDATE_PROFILE_HANDLER);
    yield takeLatest(actions.UPDATE_PROFILE_OFFLINE, UPDATE_PROFILE_OFFLINE_HANDLER);
    yield takeLatest(actions.SIGN_IN, SIGN_IN_HANDLER);
    yield takeLatest(actions.ATTEMPT_DELETE_ACCOUNT, attemptDeleteAccount);
    yield takeEvery(actions.SIGN_IN_SUCCEED, watchForSignInSuccess);
    yield takeEvery(actions.SET_PASSWORD, SET_PASSWORD_HANDLER);
    yield takeEvery(actions.DELETE_PASSWORD, DELETE_PASSWORD_HANDLER);
    yield takeEvery(actions.DELETE_PASSWORD, DELETE_PASSWORD_HANDLER);
    yield watchForContactsSync();

    yield takeLatest(actions.SIGN_OUT, SIGN_OUT_HANDLER);

}

export default userSaga;
