"use strict";

import {ICall} from "modules/call/CallReducer";
import * as React from "react";

interface ICallPanelHeaderProps {
    toggleMinimize: any;
    toggleExpanded: any;
    toggleShowChat: any;
    showChat: boolean;
    expanded: boolean;
    lastCall: ICall;
    status: string;
    contacts: any;
    time: string;
}

export default function CallPanelHeader({showChat, expanded, lastCall, contacts, status, toggleShowChat, toggleMinimize, toggleExpanded, time}: ICallPanelHeaderProps): JSX.Element {
    return (
        <div className="call-panel-header">
            <span className={showChat ? "hide-chat-icon" : "show-chat-icon"} style={expanded ? {pointerEvents: "none"} : {}} onClick={toggleShowChat}/>
            <div className="info-block">
                <span className="guest-name">
                    {lastCall && (lastCall.get("ownCall") ? contacts.getIn([lastCall.get("receiver"), "name"]) : contacts.getIn([lastCall.get("caller"), "name"]))}
                </span>
                {time && <span className="call-status">{time}</span>}
                {status && <span className="call-status">{status}</span>}
            </div>
            <div className="header-right-icons">
                <span className="full-minimize-icon" onClick={toggleMinimize}/>
                <span className={expanded ? " screen-minimize-icon" : "screen-maximize-icon"} onClick={toggleExpanded}/>
            </div>
        </div>
    );
}
