"use strict";

import "scss/pages/chat-panel/CallOutErrorPopUp";
import components from "configs/localization";
import * as React from "react";

interface ICallOutErrorProps {
    closeCallOut: () => void;
}

export default function CallOutError({closeCallOut}: ICallOutErrorProps): JSX.Element {
    const localization: any = components().callOutError;

    return (
        <div className="call-out-error-popup">
            <div className="call-out-error-content">
                <div className="content_text">
                    <span className="info">{localization.info}</span>
                </div>
                <div className="content_btn">
                    <span className="confirm" onClick={closeCallOut}>{localization.ok}</span>
                </div>
            </div>
        </div>

    );
};
