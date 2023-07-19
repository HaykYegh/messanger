"use strict";

import {ADD_MEMBERS_PLACES, DIGITS_REGEX, EMAIL_VALIDAITON_REGEX, GROUP_ROLES, RIGHT_PANELS} from "configs/constants";
import CreateGroupAddMembersState from "components/group/CreateGroupAddMembersState";
import {changeRightPanel} from "modules/application/ApplicationActions";

import {inviteGroupMembers} from "modules/groups/GroupsActions";
import {IContact} from "modules/contacts/ContactsReducer";
import selector, {IStoreProps} from "services/selector";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import {cloneDeep, isEqual} from "lodash";
import {connect} from "react-redux";
import * as React from "react";
import {getThreadType, validateNumber} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {attemptCreateContact} from "modules/contacts/ContactsActions";

interface IAddMembersPanelState {
    allTimeCheckedContactsUsernames: Array<string>;
    checkedContactsUsernames: Array<string>;
    checkedContacts: Array<IContact>;
    keyword: string;
}

interface IAddMembersPanelProps extends IStoreProps {
    attemptAddFollowers: (channelId: string, usernames: Array<string>) => void;
    attemptAddAdmins: (channelId: string, usernames: Array<string>) => void;
    createContact: (contactId: string, phone: string, author: string, email?: string) => void;
    addMembers: (groupId: string, members: string, isManualAdd: boolean) => void;
    changeRightPanel: (panel: string) => void;
}

const selectorVariables: any = {
    selectedThread: true,
    contacts: true,
    settings: {
        chat: true
    },
    application: {
        app: true
    }
};

class AddMembersPanel extends React.Component<IAddMembersPanelProps, IAddMembersPanelState> {

    constructor(props: any) {
        super(props);

        this.state = {
            allTimeCheckedContactsUsernames: [],
            checkedContactsUsernames: [],
            checkedContacts: [],
            keyword: ""
        }
    }

    handleInputChange = ({currentTarget: {value, name}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value.trim()) {
            const newState: any = cloneDeep(this.state);
            newState[name] = value.trim();
            this.setState(newState);
        }
    };

    toggleMember = (contact: IContact) => {
        const contactUsername = contact.get('members').first().get("username");
        const {user} = this.props;
        if(user.get("username") === contactUsername) return;

        const {checkedContactsUsernames, allTimeCheckedContactsUsernames} = this.state;
        const contactIndex: number = checkedContactsUsernames.indexOf(contact.get('members').first().get("username"));
        const newState: any = cloneDeep(this.state);

        if(allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) == -1){
            newState.allTimeCheckedContactsUsernames.push(contactUsername);
        }
        if (contactIndex !== -1) {
            newState.checkedContactsUsernames.splice(contactIndex, 1);
            newState.checkedContacts.splice(contactIndex, 1);
        } else {
            newState.checkedContactsUsernames.push(contactUsername);
            newState.checkedContacts.push(contact);
        }

        this.setState(newState);
    };

    get headerRightButton(): any {
        const {addMembers, changeRightPanel, selectedThread, app, attemptAddFollowers, attemptAddAdmins} = this.props;
        const thread = selectedThread.getIn(['threads', 'threadInfo']);
        const localization: any = components().addMembersPanel;
        const {checkedContactsUsernames} = this.state;

        return {
            text: localization.add,
            className: classNames({right_text_btn: true, right_text_btn_active: checkedContactsUsernames.length > 0}),
            onClick: () => {
                if (checkedContactsUsernames.length > 0) {
                    if (app.addMemberPlace === ADD_MEMBERS_PLACES.group_members) {
                        addMembers(thread.get("partialId"), checkedContactsUsernames.join(";"), true);
                        changeRightPanel(RIGHT_PANELS.group_info);
                    } else if (app.addMemberPlace === ADD_MEMBERS_PLACES.channel_followers) {
                        const index: number = checkedContactsUsernames.indexOf(selectedThread.get("creator"));
                        if (index !== -1) {
                            // swal({text: localization.canNotAddCreator(selectedThread.get("creator")), type: "info"})
                            //     .then(() => {
                            //         const contactsUsernames: any = [...checkedContactsUsernames];
                            //         contactsUsernames.splice(index, 1);
                            //         attemptAddFollowers(selectedThread.get("partialId"), contactsUsernames);
                            //         changeRightPanel(RIGHT_PANELS.channel_info);
                            //     });
                        } else {
                            // attemptAddFollowers(thread.get("partialId"), checkedContactsUsernames);
                            // changeRightPanel(RIGHT_PANELS.channel_info);
                        }
                    } else {
                        const index: number = checkedContactsUsernames.indexOf(selectedThread.get("creator"));
                        if (index !== -1) {
                            // swal({text: localization.canNotAddCreator(selectedThread.get("creator")), type: "info"})
                            //     .then(() => {
                            //         const contactsUsernames: any = [...checkedContactsUsernames];
                            //         contactsUsernames.splice(index, 1);
                            //         attemptAddAdmins(selectedThread.get("partialId"), contactsUsernames);
                            //         changeRightPanel(RIGHT_PANELS.channel_info);
                            //     });
                        } else {
                            // attemptAddAdmins(thread.get("partialId"), checkedContactsUsernames);
                            // changeRightPanel(RIGHT_PANELS.channel_info);
                        }
                    }
                }
            }
        }
    }

    componentDidUpdate(prevProps: IAddMembersPanelProps) {
        const {selectedThread, app, changeRightPanel} = this.props;
        const prevSelectedThread = prevProps.selectedThread;
        const {rightPanel, addMemberPlace} = app;

        if(rightPanel === RIGHT_PANELS.add_members
            && addMemberPlace === ADD_MEMBERS_PLACES.group_members
            && selectedThread && prevSelectedThread
            && !prevSelectedThread.equals(selectedThread)) {
            const threadInfo = selectedThread.getIn(['threads', 'threadInfo']);
            const role: number = threadInfo.get("role");
            const canAddMembers: boolean = threadInfo.get("memberAddMember") ||
                [GROUP_ROLES.admin, GROUP_ROLES.owner].includes(role) || threadInfo.get("allAdmins");

            if(!canAddMembers) {
                changeRightPanel(RIGHT_PANELS.group_info);
            }
        }
    }

    get headerLeftButton(): any {
        const localization: any = components().addMembersPanel;
        const {changeRightPanel} = this.props;

        return {
            className: "left_btn",
            onClick: () => {
                changeRightPanel(RIGHT_PANELS.group_info);
            }
        };
    }

    get contacts(): any {
        const {user, createContact, contacts, savedContacts, selectedThread, app} = this.props;
        const {keyword, allTimeCheckedContactsUsernames} = this.state;
        const thread = selectedThread.getIn(['threads', 'threadInfo']);
        const _keyword = keyword.toLowerCase();
        let searchedEmail: string;

        if(EMAIL_VALIDAITON_REGEX.test(_keyword)) {
            searchedEmail = _keyword;

        } else {
            searchedEmail = "";
        }

        let checkedContacts = null;
        const email  = !!user.get("email");
        const number: any = searchedEmail ? {}: validateNumber(_keyword, user.get("phone"), email);

        if (app.addMemberPlace === ADD_MEMBERS_PLACES.group_members) {
            checkedContacts = savedContacts && savedContacts.filter(contact => {
                const contactInfo = contact.get("members").first();
                const name = contactInfo.get("name").toLowerCase();
                const phone = contactInfo.get("phone");
                const isProductContact = contactInfo.get("isProductContact");
                const groupMembersUsernames = thread ? thread.get("groupMembersUsernames") : [];
                const username = contactInfo.get("username");
                const contactEmail: string = contactInfo.get("email");

                return ((name && name.includes(_keyword)) || phone.toString().includes(_keyword) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && groupMembersUsernames
                    && !groupMembersUsernames.includes(username)})
                .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

            if((number && number.fullNumber) || searchedEmail) {
                checkedContacts = contacts && contacts.filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const isProductContact = contactInfo.get("isProductContact");
                    const groupMembersUsernames = thread ? thread.get("groupMembersUsernames") : [];
                    const username = contactInfo.get("username");
                    const contactEmail: string = contactInfo.get("email");

                    return ((name && name.includes(_keyword)) || phone.toString().includes(number.fullNumber) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && groupMembersUsernames
                        && !groupMembersUsernames.includes(username)})
                    .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            }
        } else if (app.addMemberPlace === ADD_MEMBERS_PLACES.channel_followers) {
            checkedContacts = savedContacts && savedContacts.filter(contact => {
                const contactInfo = contact.get("members").first();
                const name = contactInfo.get("name").toLowerCase();
                const phone = contactInfo.get("phone");
                const username = contactInfo.get("username");
                const followers = thread ? thread.get("followers"): [];
                const admins = thread ? thread.get("admins"): [];
                const isProductContact = contactInfo.get("isProductContact");
                const contactEmail: string = contactInfo.get("email");

                return followers && !followers.includes(username) && admins && !admins.includes(username) &&
                    (name.includes(_keyword) || phone.toString().includes(_keyword) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && name })
                .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

            if((number && number.fullNumber) || searchedEmail) {
                checkedContacts = contacts && contacts.filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const username = contactInfo.get("username");
                    const followers = thread ? thread.get("followers"): [];
                    const admins = thread ? thread.get("admins"): [];
                    const isProductContact = contactInfo.get("isProductContact");
                    const contactEmail: string = contactInfo.get("email");

                    return followers && !followers.includes(username) && admins && !admins.includes(username) &&
                        (name.includes(_keyword) || phone.toString().includes(number.fullNumber) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && name })
                    .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            }
        } else if(thread){
            checkedContacts = savedContacts && savedContacts.filter(contact => {
                const contactInfo = contact.get("members").first();
                const name = contactInfo.get("name").toLowerCase();
                const phone = contactInfo.get("phone");
                const isProductContact = contactInfo.get("isProductContact");
                const admins = thread ? thread.get("admins") : [];
                const username = contactInfo.get("username");
                const contactEmail: string = contactInfo.get("email");

                return ((name && name.includes(_keyword)) || phone.toString().includes(_keyword) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && admins && !admins.includes(username);})
                .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            if(number && number.fullNumber) {
                checkedContacts = contacts && contacts.filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const isProductContact = contactInfo.get("isProductContact");
                    const admins = thread.get("admins");
                    const username = contactInfo.get("username");
                    const contactEmail: string = contactInfo.get("email");

                    return ((name && name.includes(_keyword)) || phone.toString().includes(number.fullNumber) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && admins && !admins.includes(username);})
                    .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            }
        }

        if(allTimeCheckedContactsUsernames && allTimeCheckedContactsUsernames.length > 0 && thread) {
            const oldCheckedContacts = contacts && contacts.filter(contact => {
                const contactInfo = contact.get("members").first();
                const name = contactInfo.get("name").toLowerCase();
                const isProductContact = contactInfo.get("isProductContact");
                const contactEmail: string = contactInfo.get("email");

                return ((name && name.includes(_keyword)) || contactEmail !== "" &&  contactEmail === searchedEmail) && isProductContact && allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) > -1;
            });
            checkedContacts = checkedContacts.merge(oldCheckedContacts).sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
        }

        if(_keyword && _keyword.length > 0 && ((checkedContacts && checkedContacts.size === 0) || !checkedContacts)){
            if(number && number.fullNumber && DIGITS_REGEX.test(number.fullNumber)){
                createContact(`${number.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`, number.fullNumber, user.get("phone"));

            } else if(searchedEmail) {
                createContact("", "", user.get("phone"), searchedEmail);
            }
        }
        return checkedContacts;
    }

    shouldComponentUpdate(nextProps: IAddMembersPanelProps, nextState: IAddMembersPanelState): boolean {
        if (!this.props.chat.equals(nextProps.chat)) {
            return true;
        }
        const {selectedThread} = this.props;
        const threadIsEmpty = selectedThread.get("threads").isEmpty();

        return !isEqual(this.state, nextState) ||
            (!threadIsEmpty && !this.props.selectedThread.equals(nextProps.selectedThread)) ||
            (this.props.contacts && !this.props.contacts.equals(nextProps.contacts));
    }

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchInputAddMember") as HTMLInputElement).value = "";
    };

    render(): JSX.Element {
        const {selectedThread} = this.props;
        const {checkedContactsUsernames, keyword} = this.state;
        const thread = selectedThread.getIn(['threads', 'threadInfo']);
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const searchClearButton: boolean = keyword && keyword !== "";

        return (
            <div className="left_side">
                <CreateGroupAddMembersState
                    contacts={this.contacts}
                    toggleMember={this.toggleMember}
                    checkedContactsUsernames={checkedContactsUsernames}
                    searchInput={{onChange: this.handleInputChange, name: "keyword", iconClassName: "hidden", handleSearchClear: this.handleSearchClear, clearButton: searchClearButton, newId: true, searchId: "searchInputAddMember"}}
                    leftButton={this.headerLeftButton}
                    rightButton={this.headerRightButton}
                    existMembers={isGroup ? `${thread.get("groupMembersUsernames").size + checkedContactsUsernames.length} / `: ""}
                />
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    addMembers: (groupId, members, isManualAdd) => dispatch(inviteGroupMembers(groupId, members, isManualAdd)),
    changeRightPanel: panel => dispatch(changeRightPanel(panel)),
    createContact: (contactId, phone, author, email) => dispatch(attemptCreateContact(contactId,"","", author, phone, false, false, null, false, email))
});

export default connect(mapStateToProps, mapDispatchToProps)(AddMembersPanel);
