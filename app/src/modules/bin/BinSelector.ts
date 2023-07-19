"use strict";

import {createSelector} from "helpers/DataHelper";
import {List, Map} from "immutable";
import {INetwork} from "modules/networks/NetworksReducer";

const binDataSelector: any = state => state.get("binData");

const appVersionSelector: any = createSelector(
    binDataSelector, (binData: any) => binData.get("appVersion")
);



// export interface INetworksModuleProps {
//     networks: Map<string, INetwork>;
//     networkJoinPopUp: string;
//     searchedNetwork: INetwork;
//     networkLeavePopUp: boolean,
//     networkLeaveId: number,
//     networkError: string,
//     networkToken: string,
// }

export default (state, variables = null) => {
    if (!variables) {
        return {
            appVersion: appVersionSelector(state),
        }
    } else if (variables === true) {
        return {
            appVersion: appVersionSelector(state),
        }
    } else {
        return {
            appVersion: variables.appVersion ? appVersionSelector(state): null,
        }
    }
};
