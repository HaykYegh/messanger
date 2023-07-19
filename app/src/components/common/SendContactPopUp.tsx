"use strict";

import * as React from "react";
import {OrderedMap} from "immutable";
import classnames from "classnames";
const classNames = classnames;
import {Scrollbars} from 'react-custom-scrollbars';

import {IContact} from "modules/contacts/ContactsReducer";
import SearchInput from "components/common/SearchInput";
import {IGroup} from "modules/groups/GroupsReducer";
import {getThreadType} from "helpers/DataHelper";
import Avatar from "components/contacts/Avatar";
import components from "configs/localization";

import "scss/pages/chat-panel/helpers/MessageActionsPopUp";

interface ISendContactPopUpProps {
    handleSearchInputChange: (currentTarget: any) => void;
    threads: OrderedMap<string, IContact | IGroup>;
    handleReceiverToggle: (thread: any) => void;
    handleSendContactsPopUpClose: () => void;
    selectedThreadIds: Array<string>;
    sendContact: () => void;
}

export default function SendContactPopUp({threads, selectedThreadIds, handleReceiverToggle, handleSendContactsPopUpClose, sendContact, handleSearchInputChange}: ISendContactPopUpProps): JSX.Element {
    const localization = components().createGroupPanel;

    const closePopUp : any = (e) => {
        if(e.target.className === 'message-action-popup') {
            handleSendContactsPopUpClose();
        }
        return;
    };
    return (
        <div className="message-action-popup" onClick={closePopUp}>
            <div className="popup-block">
                <div className="popup-content">
                    <h2 className="popup-text">{localization.popUpTitle}</h2>
                    <SearchInput onChange={handleSearchInputChange} iconClassName="hidden"/>
                    {threads.size > 0 ?
                        <Scrollbars>
                            <div className="contacts-container">
                                {threads.valueSeq().map(thread => {
                                    const handleSendContactReceiverToggle: any = () => handleReceiverToggle(thread);
                                    const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
                                    const threadInfo: any = isGroup ? thread.getIn(["threads", "threadInfo"]) : thread.get("members").first();
                                    const id: any = thread.getIn(["threads", "threadId"]);
                                    const threadImage: any = {
                                        url: threadInfo.get("avatarUrl"),
                                        file: threadInfo.get("avatar"),
                                    };

                                    return (
                                        [
                                            !isGroup && threadInfo.get("saved") &&
                                            <div className="contact-row" onClick={handleSendContactReceiverToggle}
                                                 key={threadInfo.get("contactId")}>
                                                <Avatar
                                                    image={threadImage}
                                                    color={threadInfo.getIn(["color", "numberColor"])}
                                                    status={threadInfo.get("status")}
                                                    avatarCharacter={threadInfo.get("avatarCharacter")}
                                                    name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                                                    meta={{threadId: id}}
                                                />
                                                <div className="contact-info">
                                                    <span className="contact-name">{threadInfo.get("name")}</span>
                                                    <span
                                                        className="contact-number">{threadInfo.get("email") ? threadInfo.get("email") : `+${threadInfo.get("phone")}`}</span>
                                                </div>
                                                <span
                                                    className={classNames({
                                                        "delete-checked": selectedThreadIds.includes(threadInfo.get("contactId")),
                                                        "delete-not-checked": !selectedThreadIds.includes(threadInfo.get("contactId"))
                                                    })}
                                                />
                                            </div>
                                        ]
                                    )
                                })}
                            </div>
                        </Scrollbars>
                        :
                        <span className="no-info">
                        <span className="no-info-title">{localization.noContactTitle}</span>
                        <span className="no-info-text">{localization.noContactText}</span>
                    </span>
                    }
                    <div className="send-block">
                        <button onClick={handleSendContactsPopUpClose} className="cancel-btn">cancel</button>
                        <button
                            className={selectedThreadIds && selectedThreadIds.length > 0 ? "send-btn" : "send-btn disabled-button"}
                            onClick={sendContact}>{localization.popUpButtonText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
