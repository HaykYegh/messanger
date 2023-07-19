"use strict";

import {createSelector} from "helpers/DataHelper";
import {List, Map} from "immutable";
import {INetwork} from "modules/networks/NetworksReducer";

const networksDataSelector: any = state => state.get("networksData");

const allNetworksSelector: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networks")
);

const searchedNetwork: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("searchedNetwork")
);

const networkJoinPopUp: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkJoinPopUp")
);

const networkLeavePopUp: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkLeavePopUp")
);

const networkKickedPopUp: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkKickedPopUp")
);

const networkLeaveId: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkLeaveId")
);

const networkError: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkError")
);

const networkToken: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkToken")
);

export interface INetworksModuleProps {
    networks: Map<string, INetwork>;
    networkJoinPopUp: string;
    searchedNetwork: INetwork;
    networkLeavePopUp: boolean,
    networkLeaveId: number,
    networkError: string,
    networkToken: string,
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            networks: allNetworksSelector(state),
            networkJoinPopUp: networkJoinPopUp(state),
            searchedNetwork: searchedNetwork(state),
            networkLeavePopUp: networkLeavePopUp(state),
            networkKickedPopUp: networkKickedPopUp(state),
            networkLeaveId: networkLeaveId(state),
            networkError: networkError(state),
            networkToken: networkToken(state),
        }
    } else if (variables === true) {
        return {
            networks: allNetworksSelector(state),
            networkToken: networkToken(state),
            networkJoinPopUp: networkJoinPopUp(state),
            searchedNetwork: searchedNetwork(state),
            networkLeavePopUp: networkLeavePopUp(state),
            networkKickedPopUp: networkKickedPopUp(state),
            networkLeaveId: networkLeaveId(state),
            networkError: networkError(state),
        }
    } else {
        return {
            networks: variables.networks ? allNetworksSelector(state) : null,
            networkJoinPopUp: variables.networkJoinPopUpSelector ? networkJoinPopUp(state) : null,
            searchedNetwork: variables.searchedNetworkSelector ? searchedNetwork(state) : null,
            networkLeavePopUp: variables.networkLeavePopUpSelector ? networkLeavePopUp(state) : null,
            networkKickedPopUp: variables.networkKickedPopUpSelector ? networkKickedPopUp(state) : null,
            networkLeaveId: variables.networkLeaveIdSelector ? networkLeaveId(state) : null,
            networkError: variables.networkErrorSelector ? networkError(state) : null,
            networkToken: variables.networkTokenSelector ? networkToken(state) : null,
        }
    }
};

// refactored

export const networksSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("networks")
    )
};

export const networkLeavePopUpSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("networkLeavePopUp")
    )
};
export const networkLeaveIdSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("networkLeaveId")
    )
};
export const networkErrorSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("networkError")
    )
};
export const networkJoinPopUpSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("networkJoinPopUp")
    )
};
export const searchedNetworkSelector = () => {
    return createSelector(
        networksDataSelector, (networksData: any) => networksData.get("searchedNetwork")
    )
};

const networkKickedPopUpSelector: any = createSelector(
    networksDataSelector, (networksData: any) => networksData.get("networkKickedPopUp")
);
