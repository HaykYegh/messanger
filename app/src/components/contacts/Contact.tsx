"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import "scss/pages/left-panel/ContactPack";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import Avatar from "components/contacts/Avatar";
import {AvatarSize} from "components/contacts/style";
import {getName} from "helpers/DataHelper";
import {APPLICATION} from "configs/constants";

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

export default function Contact({me, contact, toggleMember, checked, deleteClass, optionBtn, showInfo, editing, groupList}: IContactProps): JSX.Element {
    const localization: any = components().contact;
    if(!contact) {
        return null
    }
    const contactId = contact.get("contactId") || contact.get("id");
    const phone: string = contact.get("phone");

    const email: string = APPLICATION.WITHEMAIL ? contact.get("email") : contact.get("username");
    const displayName: string = me ? localization.me : getName(contact);
    const displayNumber: string = email || `+${phone}`;

    const threadImage: any = {
        url: contact.get("avatarUrl"),
        file: contact.get("avatar"),
    };

    return (
        <li onClick={groupList ? showInfo : toggleMember} className={classNames({contacts_pack: true})}>
            <AvatarSize margin="0">
                <Avatar
                    image={threadImage}
                    color={contact.getIn(["color", "numberColor"])}
                    status={contact.get("status")}
                    avatarCharacter={contact.get("avatarCharacter")}
                    name={contact.get("firstName")}
                    meta={{threadId: contactId}}
                    border={"1px solid #F5F5F7"}
                    avatarBlobUrl={contact.get("avatarBlobUrl")}
                />
            </AvatarSize>
            <div className="contact_info">
                <span className="contact_name" title={displayName}>{displayName}</span>
                <span className="contact_number">{displayNumber}</span>
            </div>
            {
                !me &&
                <span
                    className={`group-chat-not-checked${checked ? " group-chat-check" : ""}${deleteClass && editing ? " group-chat-delete" : ""}`}>
                    <span
                        className="contact_option_btn"
                        onClick={optionBtn ? optionBtn.onClick : undefined}
                    >{optionBtn ? optionBtn.text : ""}</span>
                </span>
            }
        </li>
    );
};
