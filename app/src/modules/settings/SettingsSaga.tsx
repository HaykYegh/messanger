"use strict";


import {Store} from "react-redux";
import logger from "redux-logger";
import {all, call, put, takeEvery} from "redux-saga/effects";

import {
    addStickerPreviewImage,
    addStickerPreviewIcon,
    settingsUpdateSucceed,
    settingsUpdateError,
    settingsBulkUpdate,
    setStickersIcons,
    addRecentSticker,
    checkForUpdates,
    changeSetting,
    removeSticker,
    hideSticker,
    setStickers,
    showSticker,
    addSticker
} from "modules/settings/SettingsActions";
import IDBApplication, {APPLICATION_PROPERTIES} from "services/database/class/Application";
import {backgroundXML, foregroundXML, showOnlineStatusXML} from "xmpp/XMLBuilders";
import {getAWSFile, getSignedUrl} from "requests/fsRequest";
import IDBSettings from "services/database/class/Settings"
import SettingsModel from "modules/settings/SettingsModel";
import {actions} from "modules/settings/SettingsReducer";
import connectionCreator from "xmpp/connectionCreator";
import {getStickers} from "requests/settingsRequest";
import {REQUEST_TYPES} from "configs/constants";
import storeCreator from "helpers/StoreHelper";
import {writeLog} from "helpers/DataHelper";
import conf from "configs/configurations";
import selector from "services/selector";
import Log from "modules/messages/Log";

function* attemptChangeSetting({payload: {settingsType, settingsId, value, send}}): any {
    if (settingsId === "selectedLanguage") {
        localStorage.setItem(settingsId, value);
    }

    try {
        yield all([
            call(IDBSettings.update, settingsId, value, settingsType),
            put(changeSetting(settingsType, settingsId, value))
        ]);
    } catch (error) {
        Log.i(error);
    }
}

function* attemptResetSetting({payload: {settingsType}}): any {
    try {
        yield IDBSettings.reset(settingsType);

        let selectedSettings: any = {};

        IDBSettings
            .initialValues
            .map((settings) => {
                if (settings.settingsType === settingsType) {
                    return selectedSettings[settings.settingsId] = settings.value;
                }
            });

        yield put(settingsBulkUpdate(settingsType, selectedSettings));


    } catch (error) {
        Log.i(error);
    }
}

function* attemptAddRecentSticker({payload: {id}}) {
    yield put(addRecentSticker(id));
    const store: Store<any> = storeCreator.getStore();
    const {recentStickers} = selector(store.getState(), {recentStickers: true});
    yield call(IDBApplication.update, APPLICATION_PROPERTIES.stickers, recentStickers.toJS());
}

function* attemptAddSticker({payload: {id}}) {
    yield put(addSticker(id));
    const store: Store<any> = storeCreator.getStore();
    const {myStickers} = selector(store.getState(), {settings: {myStickers: true}});
    yield call(IDBApplication.update, APPLICATION_PROPERTIES.myStickers, myStickers.toJS());
}

function* attemptRemoveSticker({payload: {id}}) {
    yield put(removeSticker(id));
    const store: Store<any> = storeCreator.getStore();
    const {myStickers} = selector(store.getState(), {settings: {myStickers: true}});
    yield call(IDBApplication.update, APPLICATION_PROPERTIES.myStickers, myStickers.toJS());
}

function* attemptStickerHide({payload: {id}}) {
    yield put(hideSticker(id));
    const store: Store<any> = storeCreator.getStore();
    const {stickers} = selector(store.getState(), {settings: {stickers: true}});
    yield call(IDBApplication.update, APPLICATION_PROPERTIES.stickerStore, stickers.toJS());
}

function* attemptStickerShow({payload: {id}}) {
    yield put(showSticker(id));
    const store: Store<any> = storeCreator.getStore();
    const {stickers} = selector(store.getState(), {settings: {stickers: true}});
    yield call(IDBApplication.update, APPLICATION_PROPERTIES.stickerStore, stickers.toJS());
}

function* attemptSetStickersIcons({payload: {id, callback, iconId}}) {
    console.warn(iconId, "#########");
    try {
        const store: Store<any> = storeCreator.getStore();
        const {stickers} = selector(store.getState(), {settings: {stickers: true}});

        const mapKeys = stickers.keySeq().toArray();
        const newStickerId = !mapKeys.includes(id);
        if (newStickerId) {
            yield call(attemptCheckNewStickers);
        }
        const sticker = stickers.get(id);
        let icons: any = {};

        if (iconId && sticker.getIn(["icons", iconId])) {
            return;
        }

        if(iconId) {
            icons[`${iconId}`] = call(getAWSFile,
                conf.app.aws.bucket.amazon,
                REQUEST_TYPES.get,
                `${conf.app.aws.bucket.sticker}/${sticker.get("id")}/x2/${iconId}@2x.png`
            );
            const iconsMapResult: any = yield all(icons);
            yield put(setStickersIcons(iconsMapResult, id));
            yield call(IDBApplication.updateStickersIcons, APPLICATION_PROPERTIES.stickerStore, iconsMapResult, id);
            icons = {};
        }

        if (sticker) {
            for (let j = 0; j <= 36; j++) {
                if(iconId && iconId === `${sticker.get("id")}_${1000 + j}`) continue;
                icons[`${sticker.get("id")}_${1000 + j}`] = call(getAWSFile,
                    conf.app.aws.bucket.amazon,
                    REQUEST_TYPES.get,
                    `${conf.app.aws.bucket.sticker}/${sticker.get("id")}/x2/${sticker.get("id")}_${1000 + j}@2x.png`
                );
            }
            const iconsMapResult: any = yield all(icons);
            yield put(setStickersIcons(iconsMapResult, id));
            yield call(IDBApplication.updateStickersIcons, APPLICATION_PROPERTIES.stickerStore, iconsMapResult, id);
        }
        callback ? callback(): null;

    } catch (e) {
        Log.i(e);
     }
}

function* attemptCheckNewStickers() {
    const store: Store<any> = storeCreator.getStore();
    const {stickers} = selector(store.getState(), {settings: {stickers: true}});
    try {
        const {data: {body}}: any = yield call(getStickers);
        const stickersList: any = body && body.stickers || [];
        const firstKey: number = stickers.keySeq().first();

        const newStickers = stickersList.filter(sticker => {
            return sticker.stickerPackageId > firstKey
        });

        if (newStickers && newStickers.length > 0) {
            const storeStickers: any = {};
            for (let i: number = 0; i < newStickers.length; i++) {
                const sticker: any = newStickers[i];
                storeStickers[sticker.stickerPackageId.toString()] = {
                    preview: yield call(getSignedUrl, conf.app.aws.bucket.amazon, REQUEST_TYPES.get, `${conf.app.aws.bucket.sticker}/${sticker.stickerPackageId}/x2/bucket_whole@2x.png`),
                    icon: yield call(getAWSFile, conf.app.aws.bucket.amazon, REQUEST_TYPES.get, `${conf.app.aws.bucket.sticker}/${sticker.stickerPackageId}/x2/bucket_icon@2x.png`),
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
            yield call(IDBApplication.updateStickerPackages, APPLICATION_PROPERTIES.stickerStore, storeStickers);
        } else {
            return;
        }
    } catch (error) {
        Log.i(error);
    }
}

function* attemptAddStickerPreviewIcon({payload: {id}}) {
    try {
        const icon: any = yield call(getAWSFile, conf.app.aws.bucket.amazon, REQUEST_TYPES.get, `${conf.app.aws.bucket.sticker}/${id}/x2/bucket_icon@2x.png`);
        yield put(addStickerPreviewIcon(id, icon));
        yield call(IDBApplication.updateStickersPreviewIcon, APPLICATION_PROPERTIES.stickerStore, icon, id);
    } catch (error) {
        Log.i(error);
    }
}

function* attemptAddStickerPreviewImage({payload: {id}}) {
    try {
        const imagePreview: any = yield call(getAWSFile, conf.app.aws.bucket.amazon, REQUEST_TYPES.get, `${conf.app.aws.bucket.sticker}/${id}/x2/bucket_whole@2x.png`);
        yield put(addStickerPreviewImage(id, imagePreview));
        yield call(IDBApplication.updateStickersPreviewImage, APPLICATION_PROPERTIES.stickerStore, imagePreview, id);
    } catch (error) {
        Log.i(error);
    }
}

function* attemptCheckUpdates({payload: {isAvailable, count}}) {
    try {
        yield put(checkForUpdates(isAvailable, count));
    } catch (error) {
        writeLog(`attemptCheckForUpdates#{isAvailable:${isAvailable}, count: ${count}, error: ${JSON.stringify(error)}`);
    }
}

function* settingsUpdateRequestHandler({payload: {settingsType, settingsId, value}}) {
    try {
        if (settingsType === "privacy" && settingsId === "showOnlineStatus") {
            const connection: any = connectionCreator.getConnection();
            const msg: Strophe.Builder = value ? showOnlineStatusXML(true) : showOnlineStatusXML(false);
            if (connection.connected) {
                connection.send(msg);
            }
            yield all([
                call(IDBSettings.update, settingsId, value, settingsType),
                put(changeSetting(settingsType, settingsId, value))
            ]);
        }
    } catch (error) {
        logger(error);
    }
}

function* settingsUpdateHandler({payload: {settingsType, settingsId, value}}) {
    try {
        yield call(SettingsModel.updateSettings, {settingsType, settingsId, value});
        yield put(settingsUpdateSucceed(settingsType, settingsId, value));

    } catch (error) {
        yield put(settingsUpdateError(settingsType, settingsId));
        logger(error);
    }
}

function* settingsSaga(): any {
    yield takeEvery(actions.ATTEMPT_CHANGE_SETTING, attemptChangeSetting);
    yield takeEvery(actions.ATTEMPT_RESET_SETTING, attemptResetSetting);
    yield takeEvery(actions.ATTEMPT_ADD_RECENT_STICKER, attemptAddRecentSticker);
    yield takeEvery(actions.ATTEMPT_ADD_STICKER, attemptAddSticker);
    yield takeEvery(actions.ATTEMPT_REMOVE_STICKER, attemptRemoveSticker);
    yield takeEvery(actions.ATTEMPT_HIDE_STICKER, attemptStickerHide);
    yield takeEvery(actions.ATTEMPT_SET_STICKERS_ICONS, attemptSetStickersIcons);
    yield takeEvery(actions.ATTEMPT_SHOW_STICKER, attemptStickerShow);
    yield takeEvery(actions.ATTEMPT_CHECK_NEW_STICKERS, attemptCheckNewStickers);
    yield takeEvery(actions.ATTEMPT_ADD_STICKER_PREVIEW_ICON, attemptAddStickerPreviewIcon);
    yield takeEvery(actions.ATTEMPT_ADD_STICKER_PREVIEW_IMAGE, attemptAddStickerPreviewImage);
    yield takeEvery(actions.ATTEMPT_CHECK_FOR_UPDATES, attemptCheckUpdates);
    yield takeEvery(actions.SETTINGS_UPDATE_REQUEST, settingsUpdateRequestHandler);
    yield takeEvery(actions.SETTINGS_UPDATE, settingsUpdateHandler);
}

export default settingsSaga;
