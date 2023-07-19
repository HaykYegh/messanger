"use strict";

import {createSelector} from "helpers/DataHelper";
import {IGroup} from "./GroupsReducer";
import {Map} from "immutable";

const groupsDataSelector: any = state => state.get("groupsData");

const groupsSelector: any = createSelector(
    groupsDataSelector, (groupsData: any) => groupsData.get("groups")
);

const groupSettingsPanelSelector: any = createSelector(
    groupsDataSelector, (groupsData: any) => groupsData.get("groupSettingsPanel")
);

export interface IGroupsModuleProps {
    groups: Map<string, IGroup>;
    groupSettingsPanel: number;
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            groups: groupsSelector(state),
            groupSettingsPanel: groupSettingsPanelSelector(state)
        }
    } else if (variables === true) {
        return {
            groups: groupsSelector(state),
            groupSettingsPanel: groupSettingsPanelSelector(state)

        }
    } else {
        return {
            groups: variables.groups ? groupsSelector(state) : null,
            groupSettingsPanel: variables.groupSettingsPanel ? groupSettingsPanelSelector(state): null
        }
    }
};
