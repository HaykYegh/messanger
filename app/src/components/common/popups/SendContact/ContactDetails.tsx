import * as React from "react";

import ContactToShare from "components/common/popups/SendContact/ContactToShare"
import components from "configs/localization";


interface IContactDetailsProps {
    contactFirstName: string,
    contactLastName: string,
    contactNumbers: any[],
    handleSelectedContactNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    handleContactToShareClick: (number: string) => void,
    contactsToShare: any[],
    isNameEmpty: boolean,
}

export default function ContactDetails({contactNumbers, handleSelectedContactNameChange, handleContactToShareClick, contactsToShare, isNameEmpty, contactLastName, contactFirstName}: IContactDetailsProps): JSX.Element {
    const localization: any = components().sendContact;

    return <div className={"send-contact-block"}>
                <div className="text">{localization.text}</div>
                <div className={"contact-name"}>
                    <input
                        type={"text"}
                        name={"firstName"}
                        value={contactFirstName}
                        className={isNameEmpty ? "invalid-name": ""}
                        placeholder={localization.firstName}
                        onChange={handleSelectedContactNameChange}
                    />
                    <input
                        type={"text"}
                        name={"lastName"}
                        value={contactLastName}
                        className={isNameEmpty ? "invalid-name": ""}
                        placeholder={localization.lastName}
                        onChange={handleSelectedContactNameChange}
                    />
                </div>
                {
                    contactNumbers.map(item => {
                        const selectedContact = contactsToShare.find(contact => contact.username === item.username);
                        const isSelected = selectedContact ? true : false;
                        return <ContactToShare
                            key={item.email || item.username}
                            isSelected={isSelected}
                            contactNumber={item}
                            handleContactToShareClick={handleContactToShareClick}
                        />
                    })
                }
            </div>
};
