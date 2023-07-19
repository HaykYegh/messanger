import * as React from "react";
import isEqual from "lodash/isEqual";

import Avatar from "components/contacts/Avatar";
import {AvatarSize} from "components/contacts/style";
import components from "configs/localization";
import {APPLICATION} from "configs/constants";
import {phoneMask} from "helpers/UIHelper";


interface IContactProps {
    contact: any;
    isSelected?: boolean;
    onSelect?: (username: string) => void;
    selectedContactsCount?: number
    blockedContactIds: any[];
    handleShowUnblockContactPopup: (contactId: string) => void;
}

interface IContactState {


}

export default class Contact extends React.Component<IContactProps, IContactState> {
    constructor(props) {
        super(props);
        this.state = {};
    }


    shouldComponentUpdate(nextProps: Readonly<IContactProps>, nextState: Readonly<IContactState>, nextContext: any): boolean {

        if (!isEqual(nextProps.contact, this.props.contact)) {
            return true
        }

        if (!isEqual(nextProps.isSelected, this.props.isSelected)) {
            return true
        }

        if (this.props.blockedContactIds.length !== nextProps.blockedContactIds.length) {
            return true
        }

        return !isEqual(nextProps.selectedContactsCount, this.props.selectedContactsCount);
    }

    handleContactClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        const {isSelected, onSelect, contact, blockedContactIds, handleShowUnblockContactPopup} = this.props;

        const isBlocked = blockedContactIds.some(element => element.contactId === contact.contactId);

        if (isBlocked) {
            handleShowUnblockContactPopup(contact.contactId);
            return
        }

        if (typeof isSelected !== 'undefined' && typeof onSelect === 'function' && !isBlocked) {
            const username: string = e.currentTarget.getAttribute('data-value');
            onSelect(username);
        }
    };

    render() {
        const {contact, isSelected = false, blockedContactIds} = this.props;
        const contactId: string = contact.contactId;
        const blockedLocalization: any = components().blockedPopUp;
        const threadImage: any = {
            url: contact.avatarUrl,
            file: contact.avatar,
        };
        const username = contact.username;
        const isBlocked: boolean = blockedContactIds.some(contact => contact.contactId === contactId);
        return (
            <div onClick={this.handleContactClick} data-value={username} className="contact">
                <div className="contact-block">
                    <AvatarSize margin="0 12px 0 0">
                    <Avatar
                        image={threadImage}
                        color={contact.color.numberColor}
                        status={contact.status}
                        avatarCharacter={contact.avatarCharacter}
                        name={contact.firstName}
                        meta={{threadId: contactId}}
                        avatarBlobUrl={contact.avatarBlobUrl}
                    />
                    </AvatarSize>
                    <div className="contact-content">

                        <div className="text-block">
                            <div className="user-name"
                                 style={{display: !contact.firstName && !contact.lastName ? "none" : "block"}}>{contact.firstName} {contact.lastName} </div>
                            <div className={`user-info ${!contact.firstName && !contact.lastName ? "no-name" : ""}`}>
                                {APPLICATION.WITHEMAIL ? (contact.email || `${phoneMask(username)}`) : `${phoneMask(username)}`}
                            </div>
                        </div>
                        {
                            isBlocked ?
                                <div className="blocked-Contact">
                                    <div className="blocked-info">
                                        {blockedLocalization.blockedContact}
                                    </div>
                                    <div className="blocked-description">
                                        {blockedLocalization.unblockContact}
                                    </div>
                                </div>
                            :
                                <div className={`select ${isSelected ? "isSelected" : ""}`}/>

                        }
                    </div>

                </div>
            </div>
        );
    }
};
