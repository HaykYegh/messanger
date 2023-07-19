"use strict";

import components from "configs/localization";
import "scss/pages/chat-panel/CallOutMessage";
import * as React from "react";
import {OutCall, OutCallDescription, OutCallIcon} from "components/chat/outCallStyle";

export default function CallOutMessage({ showRightPanel }): JSX.Element {
    const localization: any = components().callOutMessage;

    return (
        <OutCall
          href="http://www.jalatalk.com/#/es/home"
          target='_blank'
          style={{
            transform: showRightPanel ? "translateX(-314px) translateY(-50%)" : "translateX(-50%) translateY(-50%)",
            transition: "transform 0.125s ease-in-out"
          }}
        >
            <OutCallIcon/>
            <OutCallDescription >{localization.info}</OutCallDescription>
        </OutCall>
    );
};
