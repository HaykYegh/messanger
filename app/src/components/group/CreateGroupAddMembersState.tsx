"use strict";

import "scss/pages/left-panel/creategroup/CreateGroupChat";
import {GROUP_MAX_MEMBERS_COUNT} from "configs/constants";
import {IContact} from "modules/contacts/ContactsReducer";
import SearchInput from "components/common/SearchInput";
import components from "configs/localization";
import Contact from "../contacts/Contact";
import * as React from "react";
import {List} from "immutable";
import {Scrollbars} from 'react-custom-scrollbars';

interface ICreateGroupAddMembersProps {
    searchInput: {
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        name?: string;
        iconClassName: string;

        clearButton?: boolean;
        handleSearchClear?: () => void;
        newId?: boolean;
        searchId?: string;
    };
    toggleMember: (contact: IContact) => void;
    checkedContactsUsernames: Array<string>;
    contacts: List<IContact>;
    existMembers?: string
    user?: any;
    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    rightButton?: {
        onClick?: () => void;
        className: string;
        text?: string;
    };

}

export default function CreateGroupAddMembersState({searchInput, contacts, checkedContactsUsernames, toggleMember, leftButton, rightButton, existMembers, user}: ICreateGroupAddMembersProps): JSX.Element {
    const localization: any = components().createGroupPanel;
    return (
        <div className="group_chat_create">
            {
                <div className="group_chat_content">
                    <div className="create-group-info">
                        {leftButton &&
                        <span className={leftButton.className} style={leftButton.style} onClick={leftButton.onClick}>{leftButton.text}</span>}
                        <div className="create-group-header">
                            <span className="create-group-text">{localization.chatMembers}</span>
                        {<div className="members_number">
                                {existMembers && existMembers.length > 0 ? <span className="add_number">{existMembers}</span> :
                                    <span className="add_number">{`${checkedContactsUsernames.length} / `}</span>}
                                <span className="all_contacts">{GROUP_MAX_MEMBERS_COUNT}</span>
                            </div>}
                        </div>
                        {rightButton &&
                        <span className={rightButton.className} onClick={rightButton.onClick}>{rightButton.text}</span>}
                    </div>
                    <div className="search">
                        <SearchInput {...searchInput} />
                    </div>
                    { contacts && contacts.size > 0 ?
                        <div className="contacts">
                            <Scrollbars className="contacts_container" autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                                {contacts.valueSeq().map(contact => {
                                    const toggleMemberSelected: any = () => toggleMember(contact);

                                    const contactInfo: any = contact && contact.get("members").first();
                                    const ownContact: boolean = user && user.get("phone") === contactInfo.get("phone");

                                    return <Contact
                                        contact={contact.get("members").first()}
                                        key={contact.get('members').first().get("contactId")}
                                        toggleMember={toggleMemberSelected}
                                        checked={checkedContactsUsernames.includes(contact.get("members").first().get("username"))}
                                        me={ownContact || false}
                                    />
                                })}
                            </Scrollbars>
                        </div>
                        :
                        <span className="no-info">
                            <span className="no-info-title"/>
                            <span className="no-info-text">{localization.noSearchResult}</span>
                        </span>
                    }
                </div>
            }
        </div>
    );
};
