"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import Avatar from "components/contacts/Avatar";

interface IContactProps {
    showInfo?: () => void;
    toggleMember?: () => void;
    optionBtn?: {
        onClick: () => void;
        text: string;
    };
    deleteClass?: boolean;
    editing?: boolean;
    contact: IContact;
    checked?: boolean;
    groupList?: boolean;
    me?: boolean;
}

export default function ConfCallContact({me, contact, toggleMember, checked, deleteClass, optionBtn, showInfo, editing, groupList}: IContactProps): JSX.Element {
    const localization: any = components().contact;
    const contactId = contact.get("contactId") || contact.get("id");
    const displayName: string = me ? localization.me : contact.get("name") !== contact.get("phone") ? `${contact.get("name")}` : contact.get("phone");
    const displayNumber: string = contact.get("phone");

    const threadImage: any = {
        url: contact.get("avatarUrl"),
        file: contact.get("avatar"),
    };

    let showContactInfo: any;
    if (showInfo) {
        showContactInfo = () => showInfo();
    }

    return (
        <li onClick={groupList ? showContactInfo : toggleMember} className="contact-row">
            <Avatar
                image={threadImage}
                color={contact.getIn(["color", "avatarColor"])}
                status={contact.get("status")}
                avatarCharacter={contact.get("avatarCharacter")}
                name={contact.get("name")}
                meta={{threadId: contactId}}
            />
            <div className="contact-info">
                <div className="forward-name">
                    <span className="contact-name">{displayName}</span>
                </div>
            </div>

            <span className={checked ? "delete-checked" : "delete-not-checked"}/>
        </li>
    );
};
