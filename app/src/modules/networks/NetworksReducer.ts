"use strict";

import {INetworksActions} from "./NetworksActions";
import {fromJS, List, Map} from "immutable";

interface INetworksReducerActions {
    REMOVE_SEARCHED_NETWORK: string;
    ATTEMPT_NETWORK_HANDLER: any;
    ATTEMPT_LEAVE_NETWORK: any;
    SET_SEARCHED_NETWORK: any;
    REMOVE_NETWORK_ERROR: any;
    NETWORK_KICKED_POPUP: any;
    ATTEMPT_ADD_NETWORK: any;
    NETWORK_LEAVE_POPUP: any;
    ATTEMPT_GET_NETWORK: any;
    NETWORK_JOIN_POPUP: any;
    SET_NETWORK_ERROR: any;
    SET_NETWORK_TOKEN: any;
    LEAVE_NETWORK: string;
    SET_NETWORKS: string;
    ADD_NETWORK: string;
    RESET: string;
}

export const actions: INetworksReducerActions = {
    ATTEMPT_NETWORK_HANDLER: "NETWORKS:ATTEMPT_NETWORK_HANDLER",
    REMOVE_SEARCHED_NETWORK: "NETWORKS:REMOVE_SEARCHED_NETWORK",
    ATTEMPT_LEAVE_NETWORK: "NETWORKS:ATTEMPT_LEAVE_NETWORK",
    REMOVE_NETWORK_ERROR: "NETWORKS:REMOVE_NETWORK_ERROR",
    NETWORK_KICKED_POPUP: "NETWORKS:NETWORK_KICKED_POPUP",
    SET_SEARCHED_NETWORK: "NETWORKS:ATTEMPT_GET_NETWORK",
    NETWORK_LEAVE_POPUP: "NETWORKS:NETWORK_LEAVE_POPUP",
    ATTEMPT_GET_NETWORK: "NETWORKS:ATTEMPT_GET_NETWORK",
    ATTEMPT_ADD_NETWORK: "NETWORKS:ATTEMPT_ADD_NETWORK",
    NETWORK_JOIN_POPUP: "NETWORKS:NETWORK_JOIN_POPUP",
    SET_NETWORK_ERROR: "NETWORKS:SET_NETWORK_ERROR",
    SET_NETWORK_TOKEN: "NETWORKS:SET_NETWORK_TOKEN",
    LEAVE_NETWORK: "NETWORKS:LEAVE_NETWORK",
    SET_NETWORKS: "NETWORKS:SET_NETWORKS",
    ADD_NETWORK: "NETWORKS:ADD_NETWORK",
    RESET: "NETWORKS:RESET",
};

export interface INetwork extends Map<any, any> {
    callName: string;
    description: string;
    label: string;
    networkId: number;
    nickname: string;
}

export interface INetworksData extends Map<string, any> {
    networks: Map<number, INetwork>;
    networkJoinPopUp: string;
    searchedNetwork: INetwork;
    networkError: string;
    networkLeaveId: number;
    networkToken: string;
}

export const defaultState: INetworksData = fromJS({
    networks: {},
    networkJoinPopUp: "",
    networkLeavePopUp: false,
    networkKickedPopUp: false,
    networkLeaveId: null,
    searchedNetwork: {},
    networkError: "",
    networkToken: "",
});

export default (state: INetworksData = defaultState, {type, payload}: INetworksActions): INetworksData => {
    switch (type) {

        case actions.NETWORK_JOIN_POPUP:
            return state.set("networkJoinPopUp", payload.networkJoinPopUp) as INetworksData;

        case actions.SET_NETWORK_TOKEN:
            return state.set("networkToken", payload.networkToken) as INetworksData;

        case actions.NETWORK_LEAVE_POPUP:
            return state.set("networkLeaveId", payload.networkId)
                .set("networkLeavePopUp", payload.networkLeavePopUp) as INetworksData;

        case actions.NETWORK_KICKED_POPUP:
            return state.set("networkKickedPopUp", payload.networkKickedPopUp) as INetworksData;

        case actions.SET_SEARCHED_NETWORK:
            return state.setIn(["searchedNetwork", "callName"], payload.callName)
                .setIn(["searchedNetwork", "description"], payload.description)
                .setIn(["searchedNetwork", "label"], payload.label)
                .setIn(["searchedNetwork", "networkId"], payload.networkId)
                .setIn(["searchedNetwork", "nickname"], payload.nickname) as INetworksData;

        case actions.REMOVE_SEARCHED_NETWORK:
            return state.set("searchedNetwork", fromJS({})) as INetworksData;

        case actions.ADD_NETWORK:
            return state.setIn(["networks", payload.networkId.toString()], fromJS({...payload.network})) as INetworksData;

        case actions.LEAVE_NETWORK:
            return state.update("networks", networks => networks.filter(network => network.get("networkId") !== payload.networkId)) as INetworksData;

        case actions.SET_NETWORKS:
            return state.set("networks", fromJS({...payload.networks})) as INetworksData;

        case actions.SET_NETWORK_ERROR:
            return state.set("networkError", payload.errorMessage) as INetworksData;

        case actions.REMOVE_NETWORK_ERROR:
            return state.set("networkError", "") as INetworksData;

        case actions.RESET:
            return defaultState;

        default:
            return state;
    }
};
