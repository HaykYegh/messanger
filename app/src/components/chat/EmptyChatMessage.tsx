"use strict";

import components from "configs/localization";
import "scss/pages/chat-panel/EmptyChatMessage";
import * as React from "react";
import {APP_CONFIG} from "configs/constants";

export default function EmptyChatMessage({ showRightPanel }): JSX.Element {
    const localization: any = components().emptyScreenMessage;
    return (
        <a
          style={{
            transform: showRightPanel ? "translateX(-314px) translateY(-50%)" : "translateX(-50%) translateY(-50%)",
            transition: "transform 0.125s ease-in-out",
              cursor: APP_CONFIG.SECURITY_LINK.href ? "pointer" : "default"
          }}
          {...APP_CONFIG.SECURITY_LINK} className="empty-chat-message">
            <span className="icon"/>
            <p className="text">
                {localization.info}
            </p>
        </a>
    );
};
