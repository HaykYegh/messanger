"use strict";

import * as React from "react";
import Draggable from "react-draggable";

import Avatar from "components/contacts/Avatar";

interface ICallRedialMinimizedScreenProps {
    handleCallRadial: () => void;
    handleMinimizeToggle: () => void;
    handleRadialScreenClose: () => void;
    callerContact: any;
}

export default function CallRedialMinimizedScreen({handleMinimizeToggle, handleRadialScreenClose, handleCallRadial, callerContact}: ICallRedialMinimizedScreenProps): JSX.Element {

    const threadImage: any = {
        url: callerContact && callerContact.get("avatarUrl"),
        file: callerContact && callerContact.get("avatar"),
    };
    const firstName = callerContact && callerContact.get("firstName");
    const color = callerContact && callerContact.getIn(["color", "numberColor"]);
    const avatarCharacter = callerContact && callerContact.get("avatarCharacter");
    const threadId = callerContact && callerContact.get("contactId");

    return (
        <Draggable bounds="parent">
            <div className="redial-minimized-panel">
                <div className="redial-minimized-header">
                    <button className="minimized-toggle-button" onClick={handleMinimizeToggle}/>
                </div>
                <div className="redial-minimized-content">
                    <Avatar
                        image={threadImage}
                        color={color}
                        avatarCharacter={avatarCharacter}
                        name={firstName}
                        meta={{threadId}}
                    />
                    <span className="call-status">User Busy</span>
                </div>
                <div className="redial-minimized-footer">
                    <span className="footer-icon redial_call" onClick={handleCallRadial}/>
                    <span className="footer-icon cancel_call" onClick={handleRadialScreenClose}/>
                </div>
            </div>
        </Draggable>
    )
};
