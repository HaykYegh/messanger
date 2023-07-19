"use strict";

import * as React from "react";
import {connect} from "react-redux"


import {DISPLAY_CONTATCS_COUNT} from "configs/constants";
import selector, {IStoreProps} from "services/selector";
import Avatar from "components/contacts/Avatar";
import containers from "configs/localization";

import "scss/pages/left-panel/settings/BlockedContacts";
import {AvatarSize} from "components/contacts/style";
import IDBContact from "services/database/class/Contact";
import {UNBLOCK_CONTACT} from "modules/contacts/ContactsActions";
import {IContact} from "modules/contacts/ContactsReducer";
import {
    Header,
    HeaderButton,
    SettingsPageTitle,
} from "containers/settings/style";
import {phoneMask} from "helpers/UIHelper";


const back = require("assets/images/back_arrow.svg");

interface IBlockedContactsPassedProps {
    handleBlockedContactsShow?: () => void;
}

interface IBlockedContactsProps extends IStoreProps, IBlockedContactsPassedProps {
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
}

interface IBlockedContactsState {
    isEditing: boolean,
    selectedContacts: string[],
    blockedContacts: any
}

const selectorVariables: any = {
    contacts: {
        blockedContacts: true
    },
    settings: {
        languages: true,
    },
};

class BlockedContacts extends React.Component<IBlockedContactsProps, IBlockedContactsState> {
    constructor(props) {
        super(props);
        this.state = {
            isEditing: false,
            selectedContacts: [],
            blockedContacts: {}
        }
    }

    componentDidMount() {
        (async () => {
            const blockedContacts: any = await IDBContact.getBlockedContacts(DISPLAY_CONTATCS_COUNT);
            this.setState({blockedContacts});
        })();

    }

    handleEdit = () => {
        this.setState({isEditing: true})
    };

    handleContactSelect = (contactId: string, isSelected: boolean): void => {
        const newState: IBlockedContactsState = {...this.state};

        if (isSelected) {
            newState.selectedContacts = newState.selectedContacts.filter(item => item !== contactId);
        } else {
            newState.selectedContacts.push(contactId);
        }

        this.setState(newState);
    };

    handleContactUnblock = (): void => {
        const {UNBLOCK_CONTACT} = this.props;
        const {blockedContacts, selectedContacts} = this.state;

        UNBLOCK_CONTACT(selectedContacts);

        const newBlockedContacts = Object.values(blockedContacts).filter((blockedContact: IContact) => !selectedContacts.includes(blockedContact.contactId));
        this.setState({blockedContacts: newBlockedContacts, isEditing: false})
    };


    render() {
        const {isEditing, selectedContacts, blockedContacts} = this.state;
        const localization: any = containers().blockedContacts;
        const isListEmpty: boolean = !!(Object.entries(blockedContacts).length === 0);

        return (
            <div className="settings-scroll blocked-contact add-blocked-contact">

                <Header justify_content={"space-between"}>
                    <HeaderButton
                        justify_content="flex-start"
                        onClick={this.props.handleBlockedContactsShow}>
                        <img src={back} alt={"back"}/>
                        {localization.back}
                    </HeaderButton>
                    <SettingsPageTitle width="150px">
                        {localization.title}
                    </SettingsPageTitle>
                    <HeaderButton
                        isDisabled={isListEmpty}
                        justify_content="flex-end"
                        onClick={isListEmpty ? null : isEditing ? this.handleContactUnblock : this.handleEdit}>{isEditing ? localization.delete : localization.edit}
                    </HeaderButton>
                </Header>

                {isListEmpty &&
                <span className="no-info">
                            <h2 className="no-info-title">{localization.noContact}</h2>
                            <p className="no-info-text">{localization.blockedDescription}</p>
                        </span>
                }
                <div className="blocked-contacts">
                    {Object.values(blockedContacts).map((blockedContact: any) => {
                        const firstName: string = blockedContact.firstName;
                        const lastName: string = blockedContact.lastName;
                        const name: string = firstName ? `${firstName} ${lastName}` : "User";
                        let displayNumber: string = blockedContact.email || `${phoneMask(blockedContact.phone)}`;
                        const threadImage: any = {
                            url: blockedContact.avatarUrl,
                            file: blockedContact.avatar,
                        };
                        const contactId: string = blockedContact.contactId;
                        const color: any = blockedContact.color && blockedContact.color.numberColor;
                        const status: any = blockedContact.status;
                        const avatarCharacter: any = blockedContact.avatarCharacter;
                        const isSelected: boolean = selectedContacts.includes(contactId);

                        return (
                            <div className="blocked-contact-row"
                                 key={blockedContact.contactId}
                                 onClick={isEditing ? () => this.handleContactSelect(contactId, isSelected) : null}
                            >
                                <div className="blocked-contact-info">
                                    <div>
                                        <AvatarSize margin="0 12px 0 0">
                                            <Avatar
                                                image={threadImage}
                                                color={color}
                                                status={status}
                                                avatarCharacter={avatarCharacter}
                                                name={firstName}
                                                meta={{threadId: contactId}}
                                            />
                                        </AvatarSize>
                                    </div>
                                    <div className="blocked-contact-block">
                                        <div>
                                            <span className="blocked-contact-name">{name}</span>
                                            <span className="blocked-contact-number">{displayNumber}</span>
                                        </div>
                                        {isEditing && <div className={`select ${isSelected ? "isSelected" : ""}`}/>}
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds))
});

export default connect<{}, {}, IBlockedContactsPassedProps>(mapStateToProps, mapDispatchToProps)(BlockedContacts)
