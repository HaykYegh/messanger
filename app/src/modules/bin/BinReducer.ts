"use strict";

import {IBinActions} from "./BinActions";
import {fromJS, List, Map} from "immutable";

interface IBinReducerActions {
    ATTEMPT_GET_APP_VERSION: any;
    GET_APP_VERSION: string;
}

export const actions: IBinReducerActions = {
    ATTEMPT_GET_APP_VERSION: "BIN:ATTEMPT_GET_APP_VERSION",
    GET_APP_VERSION: "BIN:GET_APP_VERSION",
};

// export interface INetwork extends Map<any, any> {
//     callName: string;
//     description: string;
//     label: string;
//     networkId: number;
//     nickname: string;
// }

export interface IBinData extends Map<string, any> {
    appVersion: string;
}

export const defaultState: IBinData = fromJS({
    appVersion: "",
});

export default (state: IBinData = defaultState, {type, payload}: IBinActions): IBinData => {
    switch (type) {

        case actions.GET_APP_VERSION:
            return state.set("appVersion", payload.appVersion) as IBinData;

        default:
            return state;
    }
};
