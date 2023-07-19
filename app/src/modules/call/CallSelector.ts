import {Map} from "immutable";

import {createSelector} from "helpers/DataHelper";
import {ICall} from "modules/call/CallReducer";

const callDataSelector: any = state => state.get("callData");

const callsSelector: any = createSelector(
    callDataSelector, (callData: any) => callData.get("calls")
);

const lastCallSelector: any = createSelector(
    callDataSelector, (callData: any) => callData.get("calls").valueSeq().first()
);

const callHistorySelector: any = createSelector(
    callDataSelector, (callData: any) => callData.get("callHistory")
);

const isRedialScreenShownSelector: any = createSelector(
    callDataSelector, (callData: any) => callData.get("isRedialScreenShown")
);

const isStartedCallSelector: any = createSelector(
    callDataSelector, (callData: any) => callData.get("isStartedCall")
);

export interface ICallModuleProps {
    callHistory: Map<string, ICall>;
    calls: Map<string, ICall>;
    lastCall: ICall;
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            callHistory: callHistorySelector(state),
            lastCall: lastCallSelector(state),
            calls: callsSelector(state),
            isRedialScreenShown: isRedialScreenShownSelector(state),
            isStartedCall: isStartedCallSelector(state),
        }
    } else if (variables === true) {
        return {
            callHistory: callHistorySelector(state),
            calls: callsSelector(state)
        }
    } else {
        return {
            callHistory: variables.lastCall ? callHistorySelector(state) : null,
            lastCall: variables.lastCall ? lastCallSelector(state) : null,
            calls: variables.calls ? callsSelector(state) : null
        }
    }
};


export const getLastCallSelector: any = () => createSelector(
    callDataSelector, (callData: any) => callData.get("calls").valueSeq().first()
);
