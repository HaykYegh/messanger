"use strict";

import {createSelector} from "helpers/DataHelper";
import {IRequest} from "./RequestsReducer";
import {Map} from "immutable";

const requestsDataSelector: any = state => state.get("requestsData");

const pendingRequestsSelector: any = createSelector(
    requestsDataSelector, (requestsData: any) => requestsData.get("requests")
);

export interface IRequestsModuleProps {
    pendingRequests: Map<string, IRequest>;
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            pendingRequests: pendingRequestsSelector(state)
        }
    } else if (variables === true) {
        return {
            pendingRequests: pendingRequestsSelector(state)
        }
    } else {
        return {
            pendingRequests: variables.pendingRequests ? pendingRequestsSelector(state) : null
        }
    }
};

export const getPendingRequestsSelector: any = () => {
    return createSelector(
        requestsDataSelector, (requestsData: any) => requestsData.get("requests")
    );
};
