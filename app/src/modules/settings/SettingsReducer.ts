"use strict";

import {DEFAULT_STICKERS, RECENT_STICKERS_MAX_COUNT} from "configs/constants";
import {ISettingsActions} from "./SettingsActions";
import {fromJS, List, Map} from "immutable";
import conf from "configs/configurations";

interface ISettingsReducerActions {
    ATTEMPT_ADD_STICKER_PREVIEW_IMAGE: any;
    ATTEMPT_ADD_STICKER_PREVIEW_ICON: any;
    ADD_STICKER_PREVIEW_IMAGE: string;
    ADD_STICKER_PREVIEW_ICON: string;
    ATTEMPT_SET_STICKERS_ICONS: any;
    ATTEMPT_CHECK_NEW_STICKERS: any;
    ATTEMPT_ADD_RECENT_STICKER: any;
    SETTINGS_BULK_UPDATE: string;
    ATTEMPT_REMOVE_STICKER: any;
    ATTEMPT_CHANGE_SETTING: any;
    SET_STICKERS_ICONS: string;
    ADD_RECENT_STICKER: string;
    SET_ACTIVE_SUB_PAGE: string;
    ATTEMPT_RESET_SETTING: any;
    ATTEMPT_SHOW_STICKER: any;
    ATTEMPT_HIDE_STICKER: any;
    ADD_RECENT_STICKERS: any;
    ATTEMPT_ADD_STICKER: any;
    SET_MY_STICKERS: string;
    CHANGE_SETTING: string;
    REMOVE_STICKER: string;
    SET_STICKERS: string;
    HIDE_STICKER: string;
    SHOW_STICKER: string;
    ADD_STICKER: string;
    SET_SETTINGS: any;
    RESET: string;


    ATTEMPT_CHECK_FOR_UPDATES: any;
    CHECK_FOR_UPDATES: string;


    SETTINGS_UPDATE_REQUEST: any;
    SETTINGS_UPDATE: any;
    SETTINGS_UPDATE_SUCCEED: string;
    SETTINGS_UPDATE_ERROR: string;
}

export const actions: ISettingsReducerActions = {
    ADD_RECENT_STICKER: "SETTINGS:ADD_RECENT_STICKER",
    SET_ACTIVE_SUB_PAGE: "SETTINGS:SET_ACTIVE_SUB_PAGE",
    ADD_RECENT_STICKERS: "SETTINGS:ADD_RECENT_STICKERS",
    ATTEMPT_CHANGE_SETTING: "SETTINGS:ATTEMPT_CHANGE_SETTING",
    ATTEMPT_ADD_RECENT_STICKER: "SETTINGS:ATTEMPT_ADD_RECENT_STICKER",
    ATTEMPT_RESET_SETTING: "SETTINGS:ATTEMPT_RESET_SETTING",
    SETTINGS_BULK_UPDATE: "SETTINGS:SETTINGS_BULK_UPDATE",
    SET_SETTINGS: "SETTINGS:SET_SETTINGS",
    CHANGE_SETTING: "SETTINGS:CHANGE_SETTING",
    RESET: "SETTINGS:RESET",
    ATTEMPT_REMOVE_STICKER: "SETTINGS:ATTEMPT_REMOVE_STICKER",
    ATTEMPT_ADD_STICKER: "SETTINGS:ATTEMPT_ADD_STICKER",
    SET_MY_STICKERS: "SETTINGS:SET_MY_STICKERS",
    REMOVE_STICKER: "SETTINGS:REMOVE_STICKER",
    SET_STICKERS: "SETTINGS:SET_STICKERS",
    ATTEMPT_HIDE_STICKER: "SETTINGS:ATTEMPT_HIDE_STICKER",
    HIDE_STICKER: "SETTINGS:HIDE_STICKER",
    ATTEMPT_SHOW_STICKER: "SETTINGS:ATTEMPT_SHOW_STICKER",
    SHOW_STICKER: "SETTINGS:SHOW_STICKER",
    ADD_STICKER: "SETTINGS:ADD_STICKER",
    ATTEMPT_SET_STICKERS_ICONS: "SETTINGS:ATTEMPT_SET_STICKERS_ICONS",
    SET_STICKERS_ICONS: "SETTINGS:SET_STICKERS_ICONS",
    ATTEMPT_CHECK_NEW_STICKERS: "SETTINGS:ATTEMPT_CHECK_NEW_STICKERS",
    ADD_STICKER_PREVIEW_ICON: "SETTINGS:ADD_STICKER_PREVIEW_ICON",
    ATTEMPT_ADD_STICKER_PREVIEW_ICON: "SETTINGS:ATTEMPT_ADD_STICKER_PREVIEW_ICON",
    ADD_STICKER_PREVIEW_IMAGE: "SETTINGS:ADD_STICKER_PREVIEW_IMAGE",
    ATTEMPT_ADD_STICKER_PREVIEW_IMAGE: "SETTINGS:ATTEMPT_ADD_STICKER_PREVIEW_IMAGE",


    ATTEMPT_CHECK_FOR_UPDATES: "SETTINGS:ATTEMPT_CHECK_FOR_UPDATES",
    CHECK_FOR_UPDATES: "SETTINGS:CHECK_FOR_UPDATES",


    SETTINGS_UPDATE_REQUEST: "SETTINGS:SETTINGS_UPDATE_REQUEST",
    SETTINGS_UPDATE: "SETTINGS:SETTINGS_UPDATE",
    SETTINGS_UPDATE_SUCCEED: "SETTINGS:SETTINGS_UPDATE_SUCCEED",
    SETTINGS_UPDATE_ERROR: "SETTINGS:SETTINGS_UPDATE_ERROR",
};

export interface ISticker extends Map<string, any> {
    icons: Map<string, string>;
    defaultPackage: boolean;
    description: string;
    featured: boolean;
    hidden: boolean;
    preview: string;
    price: string;
    free: boolean;
    icon: string;
    name: string;
    id: string;
    iconsCount: number;
    position: number;
    category: string;
}

export interface ISettings extends Map<string, any> {
    stickers: Map<string, ISticker>;
    myStickers: List<string>;
    recentStickers: List<string>;
    activeSubPage: string;
    notification: {
        showPreview: boolean,
        sound: boolean,
        messagePreview: boolean,
        groupSound: boolean,
        groupMessagePreview: boolean,
        callSound: boolean
    };
    privacy: {
        showOnlineStatus: boolean,
        showTyping: boolean,
        showSeenStatus: boolean,
    };
    chat: {
        selectedLanguage: string;
        useEnterToSend: boolean;
    };
    languages: {
        selectedLanguage: string;
    }
    checkForUpdates: {
        isAvailable: boolean,
        count: number,
    }

}

let selectedLanguage = localStorage.getItem("selectedLanguage");
let defaultLanguage: string = selectedLanguage ? selectedLanguage : 'en-US';
const systemLanguage: Array<any> = conf.app.languages.filter((language) => {
    return language.value === navigator.language;
});

if (!selectedLanguage && systemLanguage.length) {
    defaultLanguage = systemLanguage[0].value;
}

export const defaultState: ISettings = fromJS({
    stickers: {[DEFAULT_STICKERS.id]: DEFAULT_STICKERS},
    myStickers: [],
    recentStickers: [],
    activeSubPage: "",
    chat: {
        useEnterToSend: true,
    },
    privacy: {
        showOnlineStatus: true,
        showTyping: true,
        showSeenStatus: true,
    },
    notification: {
        showPreview: true,
        sound: true,
        messagePreview: true,
        groupSound: true,
        groupMessagePreview: true,
        callSound: true
    },
    languages: {
        selectedLanguage: defaultLanguage
    },
    checkForUpdates: {
        isAvailable: false,
        count: 0,
    }
});

export default (state: ISettings = defaultState, {type, payload}: ISettingsActions): ISettings => {
    switch (type) {

        case actions.SET_STICKERS:
            return state.update("stickers", stickers => stickers.merge(fromJS(payload.stickers))) as ISettings;

        case actions.ADD_STICKER:
            if (!state.getIn(["stickers", payload.id])) {
                return state;
            }

            return state.update("myStickers", myStickers => myStickers.push(payload.id)) as ISettings;

        case actions.REMOVE_STICKER:
            if (!state.get("myStickers").includes(payload.id)) {
                return state;
            }

            return state.update("myStickers", myStickers => myStickers.filter(stickerId => stickerId !== payload.id)) as ISettings;

        case actions.HIDE_STICKER:
            if (!state.get("myStickers").includes(payload.id)) {
                return state;
            }

            return state.setIn(["stickers", payload.id, "hidden"], true) as ISettings;

        case actions.SHOW_STICKER:
            if (!state.get("myStickers").includes(payload.id) || !state.getIn(["stickers", payload.id]) || !state.getIn(["stickers", payload.id, "hidden"])) {
                return state;
            }
            return state.setIn(["stickers", payload.id, "hidden"], false) as ISettings;

        case actions.SET_STICKERS_ICONS:
            if (!state.getIn(["stickers", payload.id])) {
                return state;
            }
            return state.updateIn(["stickers", payload.id, "icons"], icons => icons.merge(payload.stickers)) as ISettings;

        case actions.SET_MY_STICKERS:
            return state.set("myStickers", fromJS(payload.stickers)) as ISettings;

        case actions.SET_ACTIVE_SUB_PAGE:
            return state.set("activeSubPage", payload.activeSubPage) as ISettings;

        case actions.ADD_RECENT_STICKER:
            if (state.get("recentStickers") && state.get("recentStickers").includes(payload.id)) {
                if (state.get("recentStickers").last() === payload.id) {
                    return state;
                } else {
                    return state.update("recentStickers", stickers => stickers.filter(sticker => sticker !== payload.id).push(payload.id)) as ISettings;
                }
            } else if (state.get("recentStickers")) {
                if (state.get("recentStickers").size === RECENT_STICKERS_MAX_COUNT) {
                    return state.update("recentStickers", stickers => stickers.shift().push(payload.id)) as ISettings;
                } else {
                    return state.update("recentStickers", stickers => stickers ? stickers.push(payload.id) : fromJS([payload.id])) as ISettings;
                }
            } else {
                return state.set("recentStickers", fromJS([payload.id])) as ISettings;
            }
        case actions.ADD_RECENT_STICKERS:
            return state.set("recentStickers", fromJS(payload.stickers)) as ISettings;

        case actions.ADD_STICKER_PREVIEW_ICON:
            if (!state.getIn(["stickers", payload.id])) {
                return state;
            }
            return state.setIn(["stickers", payload.id, "icon"], payload.icon) as ISettings;

        case actions.ADD_STICKER_PREVIEW_IMAGE:
            if (!state.getIn(["stickers", payload.id])) {
                return state;
            }
            return state.setIn(["stickers", payload.id, "preview"], payload.icon) as ISettings;
        case actions.SET_SETTINGS:
            return payload.value as ISettings;

        case actions.CHANGE_SETTING:
            return state.setIn([payload.settingsType, payload.settingsId], payload.value) as ISettings;


        case actions.SETTINGS_BULK_UPDATE:
            return state.update(payload.settingsType, value => value.merge(fromJS(payload.selectedSettings))) as ISettings;

        case actions.CHECK_FOR_UPDATES:
            return state
                .setIn(['checkForUpdates', 'isAvailable'], payload.isAvailable)
                .setIn(['checkForUpdates', 'count'], payload.count) as ISettings;

        case actions.RESET:
            if (payload.selectedLanguage) {
                return defaultState.setIn(['languages', 'selectedLanguage'], payload.selectedLanguage) as ISettings;
            } else {
                return defaultState;
            }

        case actions.SETTINGS_UPDATE_SUCCEED:
            return state.setIn([payload.settingsType, payload.settingsId], payload.value) as ISettings;

        default:
            return state;
    }
};
