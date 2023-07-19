"use strict";

import * as React from "react";

import SearchMessages from "containers/left-panels/SearchMessages";
import ContactsSidebar from "containers/sidebars/ContactsSidebar/Index";
import {LEFT_PANELS} from "configs/constants";
import ThreadsPanel from "containers/left-panels/ThreadsPanel";
import KeypadPanel from "containers/left-panels/KeypadPanel";



interface ILeftSidebarContainer {
    leftPanel: string;
}

const Index: React.FunctionComponent<ILeftSidebarContainer> = ({leftPanel}) => {

    switch (leftPanel) {
        case LEFT_PANELS.threads:
            return <ThreadsPanel/>;
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

export default Index;
