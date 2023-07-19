"use strict";

import * as React from "react";
import {Map} from "immutable";

import ContactBlock from "components/contacts/ContactBlock";
import {
    ContactFavoritesIcon,
    ContactInfo,
    ContactListBlock,
    ContactName,
    SubTitle
} from "containers/sidebars/ContactsSidebar/style";

interface IContactContainerProps {
    toggleSelectedThread: (contact: any, event?: React.MouseEvent<HTMLLIElement>) => void;
    updateContactsInfo: (getContacts: boolean, currentPage?: number) => void;
    selectedContactId: string;
    contacts: Map<string, any>;
    favoriteContact?: boolean;
    onlyProductContact: boolean;
    showTitle?: boolean;
    scrollBar?: any;
    getContacts: boolean;
    currentPage: number;
    title: string;
    toggleAddToFavorites: () => void;
    addToFavorites: boolean;
    userId: string;
}

export default function ContactContainer(props: IContactContainerProps): JSX.Element {
    const {
        title, selectedContactId, contacts, toggleSelectedThread, showTitle, onlyProductContact,
        favoriteContact, toggleAddToFavorites, addToFavorites, userId
    } = props;
    const handleAddToFavorites = () => toggleAddToFavorites();

    return (
        <ul className="usual_contacts">
            {showTitle && <li>
                <SubTitle>{title}</SubTitle>
            </li>}
            {
                favoriteContact ?
                    <ContactListBlock onClick={handleAddToFavorites}>
                        <ContactFavoritesIcon>
                            <a/>
                        </ContactFavoritesIcon>
                        <ContactInfo>
                            <ContactName>Add To Favorites</ContactName>
                        </ContactInfo>
                    </ContactListBlock> : null
            }
            <div
                className="contacts_container"

            >
                {contacts.map(contact => {
                    if (onlyProductContact) {
                        return (
                            contact.get('members').first().get("isProductContact") &&
                            contact.get('members').first().get("contactId") !== userId &&
                            <ContactBlock key={contact.get('members').first().get("contactId")}
                                          favoriteContact={favoriteContact}
                                          selectedContactId={selectedContactId}
                                          contact={contact}
                                          toggleSelectedThread={toggleSelectedThread}
                                          addToFavorites={addToFavorites}
                            />
                        )
                    } else {
                        return (
                            contact.get('members').first().get("contactId") !== userId &&
                            <ContactBlock key={contact.get('members').first().get("contactId")}
                                          selectedContactId={selectedContactId}
                                          contact={contact}
                                          toggleSelectedThread={toggleSelectedThread}
                                          favoriteContact={favoriteContact}
                                          addToFavorites={addToFavorites}
                            />
                        )
                    }
                })}
            </div>
        </ul>
    );
}
