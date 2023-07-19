"use strict";

import * as React from "react";

import {IMAGE_TOGGLE, GIF_TOGGLE, RIGHT_PANELS, VIDEO_TOGGLE} from "configs/constants";
import CreateGroupPanel from "../common/CreateGroupPanel";
import ContactInfoPanel from "./ContactInfoPanel";
import AddMembersPanel from "./AddMembersPanel";
import GroupInfoPanel from "./GroupInfoPanel";

interface IRightPanelProps {
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE | typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    rightPanel: string;
}

const
    RightPanel: React.SFC<IRightPanelProps> = ({rightPanel, togglePopUp, handleAudioChange}) => {

    switch (rightPanel) {
        default:
            return null;
    }
};

export default RightPanel;
