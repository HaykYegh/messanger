"use strict";

import {actions, INetwork} from "./NetworksReducer";

export interface INetworksActions {
    type: string;
    payload?: {
        id?:string;
        networkJoinPopUp?: string;
        networkLeavePopUp?: boolean;
        callName?: string;
        description?: string;
        label?: string;
        networkId?: number;
        nickname?: string;
        network?: INetwork;
        networks?: any;
        type?: string;
        info?: string;
        errorMessage?: string;
        networkToken?: string;
        token?: boolean;
        nicknameOrToken?: string | number;
        networkKickedPopUp?: boolean
    };
}

export function attemptGetNetwork(id: string, token?: boolean): INetworksActions {
    return {
        type: actions.ATTEMPT_GET_NETWORK,
        payload: {id, token}
    };
}

export function setNetworkJoinPopUp(networkJoinPopUp: string): INetworksActions {
    return {
        type: actions.NETWORK_JOIN_POPUP,
        payload: {networkJoinPopUp}
    };
}

export function setNetworkLeavePopUp(networkLeavePopUp: boolean, networkId: number): INetworksActions {
    return {
        type: actions.NETWORK_LEAVE_POPUP,
        payload: {networkLeavePopUp, networkId}
    };
}

export function setNetworkKickedPopUp(networkKickedPopUp: boolean): INetworksActions {
    return {
        type: actions.NETWORK_KICKED_POPUP,
        payload: {networkKickedPopUp}
    };
}

export function setSearchedNetwork(callName: string, description: string, label: string, networkId: number, nickname: string): INetworksActions {
    return {
        type: actions.SET_SEARCHED_NETWORK,
        payload: {callName, description, label, networkId, nickname}
    };
}

export function removeSearchedNetwork(): INetworksActions {
    return {
        type: actions.REMOVE_SEARCHED_NETWORK
    };
}

export function attemptAddNetwork(nicknameOrToken: string | number, network: INetwork): INetworksActions {
    return {
        type: actions.ATTEMPT_ADD_NETWORK,
        payload: {nicknameOrToken, network}
    };
}

export function addNetwork(networkId: any, network: INetwork): INetworksActions {
    return {
        type: actions.ADD_NETWORK,
        payload: {networkId, network}
    };
}

export function attemptLeaveNetwork(networkId: number): INetworksActions {
    return {
        type: actions.ATTEMPT_LEAVE_NETWORK,
        payload: {networkId}
    };
}

export function leaveNetworks(networkId: number): INetworksActions {
    return {
        type: actions.LEAVE_NETWORK,
        payload: {networkId}
    };
}

export function setNetworks(networks:any): INetworksActions {
    return {
        type: actions.SET_NETWORKS,
        payload: {networks}
    };
}

export function attemptNetworkHandler(type: string, info: string): INetworksActions {
    return {
        type: actions.ATTEMPT_NETWORK_HANDLER,
        payload: {type, info}
    };
}

export function setNetworkError(errorMessage: string): INetworksActions {
    return {
        type: actions.SET_NETWORK_ERROR,
        payload: {errorMessage}
    };
}

export function setNetworkToken(networkToken: string): INetworksActions {
    return {
        type: actions.SET_NETWORK_TOKEN,
        payload: {networkToken}
    };
}

export function removeNetworkError(): INetworksActions {
    return {
        type: actions.REMOVE_NETWORK_ERROR
    };
}

export function resetNetworks(): INetworksActions {
    return {
        type: actions.RESET
    }
}
