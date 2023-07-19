"use strict";

import * as React from "react";

interface IOutcomingCallButtonsProps {
    errorMessage: string;
    toggleVideo: () => void;
    toggleHold: () => void;
    toggleKeypad: () => void;
    toggleMic: () => void;
    decline: () => void;
    hangUp: () => void;
    answering: boolean;
    holded: boolean;
    video: boolean;
    myHolded: boolean;
    otherHolded: boolean;
    mic: boolean;
}

export default function OutcomingCallButtons(props: IOutcomingCallButtonsProps): JSX.Element {
    const {decline, toggleKeypad, toggleHold, toggleMic, toggleVideo, video, answering, holded, mic, hangUp, myHolded, otherHolded, errorMessage} = props;

    return (
        <div className="call-buttons">
            <span className={`footer-icon${!answering ? " disabled" : ""} ${myHolded ? "hold-on" : "hold-off"}`} onClick={toggleHold}/>
            <span className={`footer-icon${!answering || myHolded || otherHolded || errorMessage ? " disabled" : ""} ${video ? "video_call-on" : "video_call-off"}`} onClick={toggleVideo}/>
            <span className={`footer-icon${!answering || errorMessage ? " disabled" : ""} ${mic ? "microphone-on" : "microphone-off"}`} onClick={toggleMic}/>
            <span className="footer-icon decline_call" onClick={hangUp}/>
        </div>
    )
};
