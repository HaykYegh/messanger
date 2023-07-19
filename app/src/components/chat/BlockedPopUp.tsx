"use strict";

import components from "configs/localization";
import "scss/pages/chat-panel/BlockPopUp";
import * as React from "react";

interface IBlockPopUpProps {
    unblock: () => void;
    cancel: () => void;
}

export default function BlockedPopUp({unblock, cancel}: IBlockPopUpProps): JSX.Element {
    const localization: any = components().blockedPopUp;

    return (
        <div className="block-popup">
            <div className="block-popup-content">
                <div className="close-block-popup" onClick={cancel}/>
                <div className="content_text">
                    <span className="info">{localization.unblockInfo}</span>
                </div>
                <div className="content_btn">
                    <span className="confirm" onClick={unblock}>{localization.unblock}</span>
                    <span className="cancel" onClick={cancel}>{localization.cancel}</span>
                </div>
            </div>
        </div>

    );
};
