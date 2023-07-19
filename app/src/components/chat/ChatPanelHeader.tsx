"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import {IGroup} from "modules/groups/GroupsReducer";
import "scss/pages/chat-panel/ChatPanelHeader";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import TimeAgo from "timeago-react";
import timeago from "timeago.js";
import * as React from "react";

interface IChatPanelHeaderProps {
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    showInfo?: (id: string) => void;
    thread?: IGroup | IContact;
    callOut?: () => void;
    classPopup: string;
    contact?: IContact;
    popup?: boolean;
    lang: string;
}

export default function ChatPanelHeader({thread, contact, showInfo, classPopup, inviteToCall, popup, lang, callOut}: IChatPanelHeaderProps): JSX.Element {
    const localization: any = components(true)[lang].chatPanelHeader;
    const contactInfoLocalization: any = components().contactInfo;
    let status: string | JSX.Element;

    timeago.register(lang, require(`timeago.js/locales/${lang}`));

    if (!thread || (!thread.get("isGroup") && !thread.get("isProductContact"))) {
        status = "";
    } else if (thread.get("isGroup")) {
        if (thread.get("groupMembersUsernames").size > 1) {
            status = `${thread.get("groupMembersUsernames").size} ${localization.members}`;
        } else {
            status = `${thread.get("groupMembersUsernames").size} ${localization.member}`;
        }
    } else {
        const date: string = contact && contact.get("lastActivity") ? contact.get("lastActivity") : contact.get("createdAt");
        status = contact && contact.get("status") === "online" ? localization.online : <TimeAgo datetime={date} locale={lang}/>;
    }

    const showRightBar: any = () => showInfo(thread.get("id"));
    const inviteToVideoCall: any = () => inviteToCall(true, contact);
    const inviteToAudioCall: any = () => inviteToCall(false, contact);

    return (
        <div className={classPopup}>
            <div className="chat_status_wrapper">
                <div className="header_info">
                    {thread ?
                        <span className="contact_header_name" onClick={showRightBar}>{thread.get("name")}</span> :
                        !popup ?
                            <span className="contact_header_name" style={{cursor: "default"}}>{localization.selectConversation}</span> :
                            null}
                    <span
                        className={classNames({
                            chat_status: true,
                            chat_status_online: contact && contact.get("status") === "online",
                            chat_status_offline: contact && (!contact.get("status") || contact.get("status") !== "online")
                        })}
                    >
                         {status ? <time>{contactInfoLocalization.lastVisit}</time> : ""} {status}
                    </span>
                </div>
                {thread && !thread.get("isGroup") && thread.get("isProductContact") && <div className="call_buttons" title={thread && thread.get("blocked") ? "Unblock contact." : ""}>
                    <span
                        title={localization.videoCall}
                        className={thread && thread.get("blocked") ? "video_audio_call_icons icon-video_call_chat disable" : "video_audio_call_icons icon-video_call_chat"}
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                        onClick={inviteToVideoCall}
                    />
                    <span
                        title={localization.voiceCall}
                        className={thread && thread.get("blocked") ? "video_audio_call_icons icon-call_chat disable" : "video_audio_call_icons icon-call_chat"}
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                        onClick={inviteToAudioCall}
                    />
                    <span
                        title={localization.pinngleOut}
                        className={thread && thread.get("blocked") ? "video_audio_call_icons icon-call_out disable" : "video_audio_call_icons icon-call_out"}
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                        onClick={callOut}
                    />
                    <span
                        title={localization.pinngleOut}
                        className="search"
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                    />
                    <span
                        title={localization.pinngleOut}
                        className="hamburger-menu"
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                    />
                </div>}
                {(thread && !thread.get("isGroup") && !thread.get("isProductContact")) && <div className="call_buttons" title={thread && thread.get("blocked") ? "Unblock contact." : ""}>
                    <span
                        title={localization.pinngleOut}
                        className={thread && thread.get("blocked") ? "video_audio_call_icons icon-call_out disable" : "video_audio_call_icons icon-call_out"}
                        style={thread && thread.get("blocked") ? {pointerEvents: "none"} : {}}
                        onClick={callOut}
                    />
                </div>}
            </div>
        </div>
    );
};
