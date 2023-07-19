"use strict";

import * as React from "react";

import ConversationSidebar from "containers/sidebars/ConversationsSidebar";
import SearchMessages from "containers/left-panels/SearchMessages";
import ContactsSidebar from "containers/sidebars/ContactsSidebar/Index";
import CreateGroupPanel from "../common/CreateGroupPanel";
import {LEFT_PANELS} from "configs/constants";
import ThreadsPanel from "./ThreadsPanel";
import KeypadPanel from "./KeypadPanel";

interface ILeftPanel {
    leftPanel: string;
}

const LeftPanel: React.FunctionComponent<ILeftPanel> = ({leftPanel}) => {

    switch (leftPanel) {
        case LEFT_PANELS.threads:
            return <ThreadsPanel/>;
        case LEFT_PANELS.create_group:
            return <CreateGroupPanel/>;
        case LEFT_PANELS.contacts:
            return <ContactsSidebar/>;
        case LEFT_PANELS.keypad:
            return <KeypadPanel/>;
        case LEFT_PANELS.search_messages:
            return <SearchMessages/>;
        default:
            return <ThreadsPanel/>;
    }
};

export default LeftPanel;
