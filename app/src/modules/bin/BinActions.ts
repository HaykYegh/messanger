"use strict";

import {actions} from "./BinReducer";

export interface IBinActions {
    type: string;
    payload?: {
        appVersion?: string
    };
}

export function attemptGetAppVersion(): IBinActions {
    return {
        type: actions.ATTEMPT_GET_APP_VERSION
    };
}

export function getAppVersion(appVersion: string): IBinActions {
    return {
        type: actions.GET_APP_VERSION,
        payload: {appVersion}
    };
}