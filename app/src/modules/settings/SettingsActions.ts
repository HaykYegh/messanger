"use strict";

import {actions, ISettings} from "./SettingsReducer";

export interface ISettingsActions {
    type: string;
    payload?: {
        value?: string | boolean | ISettings;
        selectedLanguage?: string;
        activeSubPage?: string;
        selectedSettings?: any;
        settingsType?: string;
        settingsId?: string;
        stickers?: any;
        send?: boolean;
        callback?: any;
        icon?: string;
        iconId?: string;
        id?: string;
        isAvailable?: boolean;
        count?: number;



    };
}

export function attemptChangeSetting(settingsType: string, settingsId: string, value: string | boolean, send: boolean = false): ISettingsActions {
    return {type: actions.ATTEMPT_CHANGE_SETTING, payload: {settingsType, settingsId, value, send}};
}

export function attemptResetSetting(settingsType: string,): ISettingsActions {
    return {type: actions.ATTEMPT_RESET_SETTING, payload: {settingsType}};
}

export function addRecentStickers(stickers: any): ISettingsActions {
    return {type: actions.ADD_RECENT_STICKERS, payload: {stickers}}
}

export function addRecentSticker(id: string): ISettingsActions {
    return {type: actions.ADD_RECENT_STICKER, payload: {id}}
}

export function attemptAddRecentSticker(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_ADD_RECENT_STICKER, payload: {id}}
}

export function setActiveSubPage(activeSubPage: string): ISettingsActions {
    return {type: actions.SET_ACTIVE_SUB_PAGE, payload: {activeSubPage}}
}

export function changeSetting(settingsType: string, settingsId: string, value: string | boolean): ISettingsActions {
    return {type: actions.CHANGE_SETTING, payload: {settingsType, settingsId, value}};
}

export function settingsBulkUpdate(settingsType: string, selectedSettings: any): ISettingsActions {
    return {type: actions.SETTINGS_BULK_UPDATE, payload: {settingsType, selectedSettings}};
}

export function setSettings(settings: any): ISettingsActions {
    return {type: actions.SET_SETTINGS, payload: {value: settings}};
}

export function reset(selectedLanguage?: string): ISettingsActions {
    return {type: actions.RESET, payload: {selectedLanguage}};
}

export function setStickers(stickers: any): ISettingsActions {
    return {type: actions.SET_STICKERS, payload: {stickers}}
}

export function attemptSetStickersIcons(id: string, callback?: any, iconId?: string): ISettingsActions {
    return {type: actions.ATTEMPT_SET_STICKERS_ICONS, payload: {id, callback, iconId}}
}

export function setStickersIcons(stickers: any, id: string): ISettingsActions {
    return {type: actions.SET_STICKERS_ICONS, payload: {stickers, id}}
}

export function removeSticker(id: string): ISettingsActions {
    return {type: actions.REMOVE_STICKER, payload: {id}}
}

export function attemptRemoveSticker(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_REMOVE_STICKER, payload: {id}};
}

export function addSticker(id: string): ISettingsActions {
    return {type: actions.ADD_STICKER, payload: {id}}
}

export function attemptAddSticker(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_ADD_STICKER, payload: {id}};
}

export function hideSticker(id: string): ISettingsActions {
    return {type: actions.HIDE_STICKER, payload: {id}}
}

export function showSticker(id: string): ISettingsActions {
    return {type: actions.SHOW_STICKER, payload: {id}}
}

export function setMyStickers(stickers: any): ISettingsActions {
    return {type: actions.SET_MY_STICKERS, payload: {stickers}}
}

export function attemptStickerHide(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_HIDE_STICKER, payload: {id}}
}

export function attemptStickerShow(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_SHOW_STICKER, payload: {id}}
}

export function attemptCheckNewStickers(): ISettingsActions {
    return {type: actions.ATTEMPT_CHECK_NEW_STICKERS}
}

export function attemptAddStickerPreviewIcon(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_ADD_STICKER_PREVIEW_ICON, payload: {id}}
}

export function addStickerPreviewIcon(id: string, icon: string): ISettingsActions {
    return {type: actions.ADD_STICKER_PREVIEW_ICON, payload: {id, icon}}
}

export function attemptAddStickerPreviewImage(id: string): ISettingsActions {
    return {type: actions.ATTEMPT_ADD_STICKER_PREVIEW_IMAGE, payload: {id}}
}

export function addStickerPreviewImage(id: string, icon: string): ISettingsActions {
    return {type: actions.ADD_STICKER_PREVIEW_IMAGE, payload: {id, icon}}
}


export function attemptCheckForUpdates(isAvailable: boolean, count: number): ISettingsActions {
    return {type: actions.ATTEMPT_CHECK_FOR_UPDATES, payload: {isAvailable, count}}
}

export function checkForUpdates(isAvailable: boolean, count: number): ISettingsActions {
    return {type: actions.CHECK_FOR_UPDATES, payload: {isAvailable, count}}
}







export function settingsUpdateRequest(settingsType: string, settingsId: string, value: any): ISettingsActions {
    return {type: actions.SETTINGS_UPDATE_REQUEST, payload: {settingsType, settingsId, value}}
}

export function settingsUpdate(settingsType: string, settingsId: string, value: any): ISettingsActions {
    return {type: actions.SETTINGS_UPDATE, payload: {settingsType, settingsId, value}}
}

export function settingsUpdateSucceed(settingsType: string, settingsId: string, value: any): ISettingsActions {
    return {type: actions.SETTINGS_UPDATE_SUCCEED, payload: {settingsType, settingsId, value}}
}

export function settingsUpdateError(settingsType: string, settingsId: string): ISettingsActions {
    return {type: actions.SETTINGS_UPDATE_ERROR, payload: {settingsType, settingsId}}
}

