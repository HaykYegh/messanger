"use strict";

import * as React from "react";

interface IIncomingCallButtonsProps {
    accept: (myVideo: boolean) => void;
    decline: () => void;
}

export default function IncomingCallButtons({decline, accept}: IIncomingCallButtonsProps): JSX.Element {
    const acceptCall: any = () => accept(false);
    const acceptVideo: any = () => accept(true);

    return (
        <div className="call-buttons">
            <span className="footer-icon accept_call" onClick={acceptCall}/>
            <span className="footer-icon accept_video_call" onClick={acceptVideo}/>
            <span className="footer-icon decline_call" onClick={decline}/>
        </div>
    )
};
