"use strict";
import {List, Map} from "immutable";
import {createSelector} from "helpers/DataHelper";
import {ISticker} from "modules/settings/SettingsReducer";
import Log from "modules/messages/Log";

const settingsSelector: any = state => state.get("settingsData");

const stickers: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("stickers").sort((sticker1, sticker2) => {
        if (sticker1.get("id") > sticker2.get("id")) {
            return -1;
        } else if (sticker1.get("id") < sticker2.get("id")) {
            return 1;
        } else {
            return 0;
        }
    })
);

const chat: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("chat")
);
const appUpdate: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("checkForUpdates")
);

const privacy: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("privacy")
);

const notification: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("notification")
);

const languages: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("languages")
);

const recentStickers: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("recentStickers")
);

const activeSubPage: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("activeSubPage")
);

const myStickers: any = createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("myStickers")
);

export interface ISettingsModuleProps {
    stickers: Map<string, ISticker>;
    myStickers: List<string>;
    activeSubPage: string;
    recentStickers: any;
    notification: any;
    privacy: any;
    chat: any;
    languages: any;
    appUpdate: any;
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            notification: notification(state),
            recentStickers: recentStickers(state),
            activeSubPage: activeSubPage(state),
            myStickers: myStickers(state),
            stickers: stickers(state),
            privacy: privacy(state),
            chat: chat(state),
            languages: languages(state),
            appUpdate: appUpdate(state)
        }
    } else {
        return {
            notification: variables.notification ? notification(state) : null,
            recentStickers: variables.recentStickers ? recentStickers(state) : null,
            activeSubPage: variables.activeSubPage ? activeSubPage(state) : null,
            privacy: variables.privacy ? privacy(state) : null,
            chat: variables.chat ? chat(state) : null,
            languages: variables.languages ? languages(state) : null,
            myStickers: variables.myStickers ? myStickers(state) : null,
            stickers: variables.stickers ? stickers(state) : null,
            appUpdate: variables.appUpdate ? appUpdate(state) : null

        }
    }
};


export const userSettingsSelector: any = (params) => createSelector(
    settingsSelector, (settingsData: any) => {
        let settings: Map<string, any> = Map({});
        for (const prop of params) {
            if (settingsData.has(prop)) {

                Log.i("prop  #####");
                Log.i(prop);
                Log.i("##### prop");

                settings = settings.set(prop, settingsData.get(prop))
            }
        }
        return settings;
    }
);

export const privacySettingsSelector: any = () => createSelector(
    settingsSelector, (settingsData: any) => settingsData.get("privacy")
);

// refactored

export const checkForUpdatesSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("checkForUpdates")
    );
};

export const notificationSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("notification")
    );
};

export const privacySelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("privacy")
    );
};

export const chatSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("chat")
    );
};

export const languagesSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("languages")
    );
};

export const appUpdatesSelector: any = () => {
    return createSelector(
      settingsSelector, (settingsData: any) => settingsData.get("checkForUpdates")
    );
}

export const myStickersSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("myStickers")
    );
};

export const stickersSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("stickers").sort((sticker1, sticker2) => {
            if (sticker1.get("id") > sticker2.get("id")) {
                return -1;
            } else if (sticker1.get("id") < sticker2.get("id")) {
                return 1;
            } else {
                return 0;
            }
        })
    );
};

export const activeSubPageSelector: any = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("activeSubPage")
    );
};

export const recentStickersSelector = () => {
    return createSelector(
        settingsSelector, (settingsData: any) => settingsData.get("recentStickers")
    )
};
