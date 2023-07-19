"use strict";

import * as React from "react";
import Draggable from "react-draggable";

import {IContact} from "modules/contacts/ContactsReducer";
import Avatar from "components/contacts/Avatar";

import "scss/pages/chat-panel/CallPanel";

interface IMinimizedCallScreenProps {
    toggleMinimize: () => void;
    hangUpCall: () => void;
    isOtherHolden: boolean;
    isAnswering: boolean;
    receiver: IContact;
    isConnected: boolean;
    isRinging: boolean;
    caller: IContact;
    isVideo: boolean;
    isOwnCall: boolean;
    otherUrl: string;
    declineCall: any;
    avatar: any;
    status: string;
    dataLine: string;
}

export default function MinimizedCallScreen({isConnected, otherUrl, isVideo, toggleMinimize, hangUpCall, caller, receiver, isOwnCall, status, isAnswering, declineCall, isRinging, isOtherHolden, avatar, dataLine}: IMinimizedCallScreenProps): JSX.Element {

    return (
        <Draggable bounds="parent">
            <div className={!isVideo ? "minimized-call audio-minimized-call" : "minimized-call"}>
                <span className="call-status">{status}</span>
                <span className="minimized-call-screen" onClick={toggleMinimize}/>
                <span className="minimized-decline-btn" onClick={hangUpCall}/>

                {
                    !isVideo &&
                    <Avatar
                        image={avatar}
                        color={caller && caller.getIn(["color", "numberColor"])}
                        avatarCharacter={caller && caller.get("avatarCharacter")}
                        name={caller && caller.get("firstName")}
                        meta={{threadId: caller && caller.get("contactId")}}
                    />
                }

                {isConnected && !isVideo && <audio autoPlay={true} id="remote_stream" src={otherUrl}/>}

                {
                    isConnected && isVideo &&
                    [
                        <video className="guest-video" key={1} id="remote_stream" autoPlay={true}
                               src={otherUrl}/>,
                        <span className="minimized-decline-btn" onClick={hangUpCall} key={2}/>
                    ]
                }

                <div className="call-panel-footer">
                    <div className="call-buttons">
                        <span className="footer-icon decline_call" onClick={isAnswering ? hangUpCall : declineCall}/>
                    </div>
                </div>

                {
                    isRinging &&
                    <audio id="sound" preload="auto" autoPlay={true}>
                        <source src={require("files/ringing.mp3")} type="audio/mpeg"/>
                        <embed hidden={true} src={require("files/ringing.mp3")}/>
                    </audio>
                }

                {
                    isOtherHolden &&
                    <audio id="sound" preload="auto" autoPlay={true} loop={true}>
                        <source src={require("files/hold-sound.mp3")} type="audio/mpeg"/>
                        <embed hidden={true} src={require("files/hold-sound.mp3")}/>
                    </audio>
                }

            </div>
        </Draggable>
    )
};
