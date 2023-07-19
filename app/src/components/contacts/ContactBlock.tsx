"use strict";

import * as React from "react";

import {IContact} from "modules/contacts/ContactsReducer";
import Avatar from "components/contacts/Avatar";
import {getUsername} from "helpers/DataHelper";
import conf from "configs/configurations";
import "scss/pages/left-panel/ContactBlock";

interface IContactBlockProps {
    toggleSelectedThread: (contact: any, event?: React.MouseEvent<HTMLLIElement>) => void;
    selectedContactId: string;
    favoriteContact?: boolean;
    contact: IContact;
    addToFavorites: boolean;
}

export default function ContactBlock({selectedContactId, contact, toggleSelectedThread, addToFavorites, favoriteContact}: IContactBlockProps): JSX.Element {
    const contactData: any = contact.get("members").first();
    const contactId: string = contactData.get("contactId");
    const name: string = contactData.get("firstName") || contactData.get("lastName") ? contactData.get("name") : contactData.get("email") ? contactData.get("email") : contactData.get("name");
    const active: boolean = contactId === selectedContactId && !addToFavorites ||
        !favoriteContact
        && contactData.get("numbers")
        && selectedContactId && contactData.get("numbers").includes(getUsername(selectedContactId)) && !addToFavorites;

    const handleThreadSelect: any = (event) => toggleSelectedThread(contact, event);

    const threadImage: any = {
        url: contactData.get("avatarUrl"),
        file: contactData.get("avatar"),
    };

    return (
        <li
            className={`contact_block${active ? " active" : ""}`}
            onClickCapture={handleThreadSelect}
            data-threadid={contactId}
        >
            <Avatar
                image={threadImage}
                color={contactData.getIn(["color", "numberColor"])}
                status={contactData.get("status")}
                avatarCharacter={contactData.get("avatarCharacter")}
                name={contactData.get("firstName")}
                meta={{threadId: contactId}}
            />
            <div className="contact_info">
                <span className="contact_name">{name}</span>
                {contactData.get("isProductContact") && <span className="product-contact hidden">{conf.app.name}</span>}
            </div>
        </li>
    );
};
