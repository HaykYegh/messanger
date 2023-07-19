"use strict";

import ConfCallContact from "components/conference/CallContact";
import {validateNumber} from "helpers/DataHelper";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {ESC_KEY_CODE, GROUP_MAX_MEMBERS_COUNT} from "configs/constants";
import {inviteGroupMembers} from "modules/groups/GroupsActions";
import "scss/pages/chat-panel/helpers/MessageActionsPopUp";
import {IContact} from "modules/contacts/ContactsReducer";
import SearchInput from "components/common/SearchInput";
import selector, {IStoreProps} from "services/selector";
import {cloneDeep, isEqual} from "lodash";
import {connect} from "react-redux";
import * as React from "react";

interface IAddConferenceMembersState {
    loader: boolean;
    allTimeCheckedContactsUsernames: Array<string>;
    checkedContactsUsernames: Array<string>;
    keyword: string;
}

interface IAddConferenceMembersPassedProps {
    handleForwardPopUpClose: () => void
}

interface IAddConferenceMembersProps extends IStoreProps, IAddConferenceMembersPassedProps {
    createContact: (contactId: string, phone: string, author: string) => void;
    addMembers: (groupId: string, members: string, isManualAdd: boolean) => void;
}

const selectorVariables: any = {
    newMessagesCount: true,
    application: {
        app: true
    },
    contacts: {
        savedContacts: true,
        contacts: true
    },
    settings: {
        chat: true
    },
    user: true
};


 class AddConferenceMembers extends React.Component<IAddConferenceMembersProps, IAddConferenceMembersState> {

    constructor(props: any) {
        super(props);

        this.state = {
            allTimeCheckedContactsUsernames: [],
            checkedContactsUsernames: [],
            loader: true,
            keyword: ""
        };
    }

    mounted: boolean;

    componentDidMount() {
        this.mounted = true;
        document.addEventListener("keydown",  this.handleEscPress);
    }

    componentWillUnmount(): void {
        this.mounted = false;
        document.removeEventListener("keydown",  this.handleEscPress);
    }

    handleSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;

        if (value !== keyword) {
            this.setState({keyword: value.toLowerCase()});
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchInputForward") as HTMLInputElement).value = "";
    };

    handleEscPress = (event: any) => {
        const {handleForwardPopUpClose} = this.props;

        switch (event.keyCode) {
            case ESC_KEY_CODE:
                handleForwardPopUpClose();
                break;
        }
    };

    toggleMember = (contact: IContact) => {
         const contactUsername = contact.get('members').first().get("username");
         const {user} = this.props;
         if (user.get("username") === contactUsername) return;

         const {checkedContactsUsernames, allTimeCheckedContactsUsernames} = this.state;
         const contactIndex: number = checkedContactsUsernames.indexOf(contact.get('members').first().get("username"));
         const newState: any = cloneDeep(this.state);

         if(allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) === -1){
             newState.allTimeCheckedContactsUsernames.push(contactUsername);
         }

         if (contactIndex !== -1) {
             newState.checkedContactsUsernames.splice(contactIndex, 1);
         } else {
             if (checkedContactsUsernames.length < GROUP_MAX_MEMBERS_COUNT) {
                 newState.checkedContactsUsernames.push(contactUsername);
             }
         }

         if (!isEqual(this.state, newState)) {
             this.setState(newState);
         }
     };

    handleMemberAdd = () => {
         const {checkedContactsUsernames} = this.state;
         const {addMembers} = this.props;
         const partialId: string = "";
         if (checkedContactsUsernames.length > 0) {
             addMembers(partialId, checkedContactsUsernames.join(";"), true);
         }
    };

    get contacts(): any {
        const {savedContacts, contacts, user, createContact} = this.props;
        const {allTimeCheckedContactsUsernames} = this.state;
        const {keyword} = this.state;
        const _keyword = keyword.toLowerCase();

        let checkedContacts:any =  savedContacts && savedContacts
            .filter(contact => {
                const contactInfo = contact.get("members").first();
                const firstName = contactInfo.get("firstName").toLowerCase();
                const lastName = contactInfo.get("lastName").toLowerCase();
                const name = contactInfo.get("name").toLowerCase();
                const phone = contactInfo.get("phone");
                const isProductContact = contactInfo.get("isProductContact");
                const blocked = contactInfo.get("blocked");

                return isProductContact && !blocked && ((firstName && firstName.includes(_keyword)) ||
                    (lastName && lastName.includes(_keyword)) ||
                    (name && name.includes(_keyword)) ||
                    (phone.toString().includes(_keyword)))
            })
            .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

        if(checkedContacts && checkedContacts.size > 0 && allTimeCheckedContactsUsernames.length > 0){
            const oldCheckedContacts = contacts && contacts
                .filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const firstName = contactInfo.get("firstName").toLowerCase();
                    const lastName = contactInfo.get("lastName").toLowerCase();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const isProductContact = contactInfo.get("isProductContact");
                    const blocked = contactInfo.get("blocked");

                    return isProductContact && !blocked && allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) > -1 && ((firstName && firstName.includes(_keyword)) ||
                        (lastName && lastName.includes(_keyword)) ||
                        (name && name.includes(_keyword)) ||
                        (phone.toString().includes(_keyword)))
                });

            checkedContacts = checkedContacts.merge(oldCheckedContacts).sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

        }

        let number  = validateNumber(keyword, user.get("phone"));
        if(checkedContacts && checkedContacts.size === 0){
            if(number && number.fullNumber) {
                checkedContacts = contacts && contacts
                    .filter(contact => {
                        const contactInfo = contact.get("members").first();
                        const firstName = contactInfo.get("firstName").toLowerCase();
                        const lastName = contactInfo.get("lastName").toLowerCase();
                        const name = contactInfo.get("name").toLowerCase();
                        const phone = contactInfo.get("phone");
                        const isProductContact = contactInfo.get("isProductContact");
                        const blocked = contactInfo.get("blocked");

                        return isProductContact && !blocked && ((firstName && firstName.includes(_keyword)) ||
                            (lastName && lastName.includes(_keyword)) ||
                            (name && name.includes(_keyword)) ||
                            (phone.toString().includes(number.fullNumber)))
                    })
                    .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            }
        }

        if(_keyword && _keyword.length > 0 && ((checkedContacts && checkedContacts.size === 0) || !checkedContacts)){
            if(number && number.fullNumber){
                createContact(`${number.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`, number.fullNumber, user.get("phone"));
            }
        }
        return checkedContacts;
    }

    render() {
        const {handleForwardPopUpClose} = this.props;
        const {keyword, checkedContactsUsernames} = this.state;
        const searchClearButton: boolean = keyword && keyword !== "";

        const closePopUp : any = (e) => {
            if(e.target.id === 'conf-call-popup') {
                handleForwardPopUpClose();
            }
            return;
        };

        return (
            <div className="message-action-popup" id="conf-call-popup" onClick={closePopUp}>
                <div className="popup-block">
                    <div  className="popup-content">
                        <span className="popup-text">Add Members To Call</span>
                        <SearchInput
                            onChange={this.handleSearchInputChange}
                            iconClassName="hidden"
                            handleSearchClear={this.handleSearchClear}
                            clearButton={searchClearButton}
                            newId={true}
                            searchId="searchInputForward"
                        />
                        <div className="contacts-container">
                            {this.contacts.valueSeq().map(contact => {
                                const toggleMemberSelected: any = () => this.toggleMember(contact);

                                return <ConfCallContact
                                    contact={contact.get("members").first()}
                                    key={contact.get('members').first().get("contactId")}
                                    toggleMember={toggleMemberSelected}
                                    checked={checkedContactsUsernames.includes(contact.get("members").first().get("username"))}
                                />
                            })}
                        </div>
                        <div className="send-block">
                            <button className="cancel-btn" onClick={handleForwardPopUpClose}>Cancel</button>
                            <button className={checkedContactsUsernames && checkedContactsUsernames.length > 0 ? "send-btn" : "send-btn disabled-button"}>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    createContact: (contactId, phone, author) => dispatch(attemptCreateContact(contactId,"","", author, phone, false, false, null)),
    addMembers: (groupId, members, isManualAdd) => dispatch(inviteGroupMembers(groupId, members, isManualAdd)),
});

export default connect<{}, {}, IAddConferenceMembersPassedProps>(mapStateToProps, mapDispatchToProps)(AddConferenceMembers);
