import * as React from "react";

import {IContact} from "modules/contacts/ContactsReducer";
import Avatar from "components/contacts/Avatar";
import {AvatarSize} from "components/contacts/style";
import {phoneMask} from "helpers/UIHelper";


interface IContactProps {
    contact: IContact;
    onSelect?: (username: string) => void;
}

export default function Contact(props: IContactProps): JSX.Element {
    const {contact} = props;
    const contactId: string = contact.contactId;
    const threadImage: any = {
        url: contact.avatarUrl,
        file: contact.avatar,
    };
    const username = contact.username;

    const contactClick: any = (e: React.MouseEvent<HTMLDivElement>): void => {
        const {onSelect} = props;
        const username: string = e.currentTarget.getAttribute('data-value');
        onSelect(username);
    };
    return (
        <div onClick={contactClick} data-value={username} className="contact">
            <div className="contact-block">
                <AvatarSize margin="0 12px 0 0">
                    <Avatar
                        image={threadImage}
                        color={contact.color.numberColor}
                        status={contact.status}
                        avatarCharacter={contact.avatarCharacter}
                        name={contact.firstName}
                        meta={{threadId: contactId}}
                    />
                </AvatarSize>
                <div className="contact-content">
                    <div className="text-block">
                        <div className="user-name"
                             style={{display: !contact.firstName && !contact.lastName ? "none" : "block"}}>{contact.firstName} {contact.lastName} </div>
                        <div className={`user-info ${!contact.firstName && !contact.lastName ? "no-name" : ""}`}>
                            {contact.email && typeof  contact.email === "string" ? contact.email : contact.email && typeof  contact.email === "object" ? contact.email[0] : `${phoneMask(username)}`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
