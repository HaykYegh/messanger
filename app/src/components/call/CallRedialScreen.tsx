"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import Avatar from "components/contacts/Avatar";
import "scss/pages/chat-panel/CallPanel";
import Draggable from "react-draggable";
import * as React from "react";

interface ICallRedialScreenProps {
    toggleExpanded: () => void;
    handleCallRadial: () => void;
    handleRadialScreenClose: () => void;
    callerContact: any;
    handleMinimizeToggle: () => void;

}

export default function CallRedialScreen({callerContact, toggleExpanded, handleRadialScreenClose, handleCallRadial, handleMinimizeToggle}: ICallRedialScreenProps): JSX.Element {

    const threadImage: any = {
        url: callerContact && callerContact.get("avatarUrl"),
        file: callerContact && callerContact.get("avatar"),
    };
    const name = callerContact && callerContact.get("name");
    const firstName = callerContact && callerContact.get("firstName");
    const color = callerContact && callerContact.getIn(["color", "avatarColor"]);
    const avatarCharacter = callerContact && callerContact.get("avatarCharacter");
    const threadId = callerContact && callerContact.get("contactId");
    const singleConversationName: string = callerContact && (callerContact.get("firstName") || callerContact.get("lastName") ? callerContact.get("name") : callerContact.get("email") ? callerContact.get("email") : `${!callerContact.get("name").startsWith("0") ? "+": ""}${callerContact.get("name")}`);

    return (
        <div className="call-panel-content">
            <div className="call-screen">
                <div className="draggable-block">
                    <div className="draggable-area">
                        <div className="header-buttons">
                            <button className="minimize-button" onClick={handleMinimizeToggle}/>
                            <button className="expanded-button" onClick={toggleExpanded}/>
                        </div>
                        <div className="caller-info">
                            <div className="caller-info-content">
                                <Avatar
                                    image={threadImage}
                                    color={color}
                                    avatarCharacter={avatarCharacter}
                                    name={firstName}
                                    meta={{threadId}}
                                />
                                <h2 className="name">{singleConversationName}</h2>
                                <div className="call-status">
                                    <span className="status">User Busy</span>
                                </div>
                            </div>
                        </div>
                        <div className="call-panel-footer">
                            <div className="call-buttons">
                                <span className="footer-icon redial_call" onClick={handleCallRadial}/>
                                <span className="footer-icon cancel_call" onClick={handleRadialScreenClose}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};
