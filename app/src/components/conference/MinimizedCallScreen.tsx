"use strict";

import Avatar from "components/contacts/Avatar";
import Draggable from "react-draggable";
import * as React from "react";

interface IMinimizedConferenceCallScreenProps {
    handleMinimizeToggle: () => void;
    handleCallHangUp: () => void;
    otherHolded: boolean;
    confCallDetails: any;
    ringing: boolean;
}

export default function MinimizedConferenceCallScreen({ringing, otherHolded, handleCallHangUp, handleMinimizeToggle, confCallDetails}: IMinimizedConferenceCallScreenProps): JSX.Element {

    const groupInfo: any = confCallDetails && confCallDetails.get("callInfo");
    const threadId = groupInfo.get("threadId");
    const threadImage: any = {
        url: groupInfo ? groupInfo.getIn(["threadInfo", "avatarUrl"]) : "",
        file: groupInfo ? groupInfo.getIn(["threadInfo", "avatar"]) : "",
    };

    return (
        <Draggable bounds="parent">
            <div className="minimized-cohandleMinimizeTogglenf-call-panel">
                <div className="minimized-conf-call-header">
                    <button className="minimized-toggle-button" onClick={handleMinimizeToggle}/>
                </div>
                <div className="minimized-conf-call-content">
                    <Avatar
                        image={threadImage}
                        color={groupInfo.getIn(["threadInfo", "color", "avatarColor"])}
                        avatarCharacter={groupInfo.getIn(["threadInfo", "avatarCharacter"])}
                        name={groupInfo.getIn(["threadInfo", "name"])}
                        meta={{threadId}}
                    />
                    <span className="call-status">Ringing</span>
                    <audio autoPlay={true} id="remote_stream"/>
                </div>
                <div className="minimized-conf-call-footer">
                    <span className="footer-icon hold-on"/>
                    <span className="footer-icon microphone-on"/>
                    <span className="footer-icon decline_call" onClick={handleCallHangUp}/>
                </div>
                {
                    ringing &&
                    (
                        <audio id="sound" preload="auto" autoPlay={true}>
                            <source src={require("files/ringing.mp3")} type="audio/mpeg"/>
                            <embed hidden={true}  src={require("files/ringing.mp3")}/>
                        </audio>
                    )
                }
                {
                    otherHolded &&
                    (
                        <audio id="sound" preload="auto" autoPlay={true} loop={true}>
                            <source src={require("files/hold-sound.mp3")} type="audio/mpeg"/>
                            <embed hidden={true}  src={require("files/hold-sound.mp3")}/>
                        </audio>
                    )
                }
            </div>
        </Draggable>
    )
};
