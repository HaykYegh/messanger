"use strict";

import {MEDIA_ACCESS_TYPE, MESSAGE_BOX_TYPES} from "configs/constants";
import {showMessageBox} from "helpers/DataHelper";
import components from "configs/localization";
import conf from "configs/configurations";

export const checkForMediaAccess = (type: "microphone" | "camera", callback) => {
    const localization = components().mediaDeviceAccess;
    const detail: string = type === MEDIA_ACCESS_TYPE.MICROPHONE ? localization.microphoneAccess: localization.cameraAccess;
    const {remote} = (window as any);
    const {systemPreferences} = remote;

    if(!systemPreferences.askForMediaAccess) {
        navigator.permissions.query({name: type})
            .then(res => {
                res.state === "granted" ? callback():
                    showMessageBox(
                        true,
                        MESSAGE_BOX_TYPES.info,
                        [localization.ok],
                        conf.app.name,
                        detail,
                        undefined,
                        undefined,
                        0,
                        1,
                        () => null
                    )
            })

    } else {
        systemPreferences.askForMediaAccess(type)
            .then(res =>
                res ?
                    callback():
                    showMessageBox(
                        true,
                        MESSAGE_BOX_TYPES.info,
                        [localization.ok],
                        conf.app.name,
                        detail,
                        undefined,
                        undefined,
                        0,
                        1,
                        () => null
                    )
            );
    }


};