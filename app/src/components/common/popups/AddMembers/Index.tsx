"use strict";

import * as React from "react";

import InputSelectable from "components/common/popups/AddMembers/InputSelectable";
import Contact from "components/common/popups/AddMembers/Contact";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import "scss/pages/Popup.scss";
import components from "configs/localization";
import {RIGHT_PANELS} from "configs/constants";
import {getPhone} from "helpers/UIHelper";
import {GROUP_MAX_COUNT} from "configs/constants";

interface IAddMembersPopupProps {
    handleAddMembersPopUpClose: () => void;
    selectedThread: any;
    addMembers: (groupId: string, members: string, isManualAdd: boolean) => void;
}

interface IAddMembersPopupState {
    loading: {
        init: boolean,
        isListUpdating: boolean
    }
    q: string,
    contactsList: any[],
    contactsCount: number,
    selectedContacts: { [key: string]: IContact },
    selectedContactsCount: number,
    limit: number,
    offset: number,
    groupMemberIds: any[];
}

export default class AddMembersPopup extends React.Component<IAddMembersPopupProps, IAddMembersPopupState> {
    get popupBlock(): HTMLDivElement {
        return this._addMembersPopupBlock;
    }

    set popupBlock(value: HTMLDivElement) {
        this._addMembersPopupBlock = value;
    }

    get popup(): HTMLDivElement {
        return this._addMembersPopup;
    }

    set popup(value: HTMLDivElement) {
        this._addMembersPopup = value;
    }

    get contactsListContainer(): HTMLUListElement {
        return this._contactsListContainer;
    }

    set contactsListContainer(value: HTMLUListElement) {
        this._contactsListContainer = value;
    }

    get isMounted(): boolean {
        return this._isMounted;
    }

    set isMounted(value: boolean) {
        this._isMounted = value;
    }

    private _isMounted: boolean = false;
    private _contactsListContainer: HTMLUListElement = null;
    private _addMembersPopup: HTMLDivElement = null;
    private _addMembersPopupBlock: HTMLDivElement = null;


    constructor(props) {
        super(props);
        this.state = {
            loading: {
                init: false,
                isListUpdating: false
            },
            q: "",
            contactsList: [],
            contactsCount: 0,

            selectedContacts: {},
            selectedContactsCount: 0,

            limit: 40,
            offset: 0,
            groupMemberIds: [],
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleEscapePress);
        const {selectedThread} = this.props;

        const groupMembers: any = selectedThread.get("members");
        let groupMemberIds: string[] = [];
        for (const member of groupMembers.valueSeq()) {
            groupMemberIds = [...groupMemberIds, member.get("contactId")]
        }

        this.setState({loading: {init: true, isListUpdating: true}});
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchContactsWithFilter({q: '', limit, offset});
                const newState: IAddMembersPopupState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;
                newState.groupMemberIds = groupMemberIds;

                newState.contactsList = newState.contactsList.filter(contact => {
                   return !groupMemberIds.includes(contact.contactId)
                });
                this.setState(newState);

            })();
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleEscapePress);
        this.isMounted = false;
    }


    handleContactListScroll = (e: any): void => {
        const {groupMemberIds} = this.state;

        if (e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight) - 150) {
            const {limit, offset, contactsCount, q = ''} = this.state;

            if ((offset * limit) >= contactsCount) {
                return;
            }

            if (this.isMounted) {

                (async () => {

                    const nextOffset: number = offset + 1;
                    const {records, count} = await fetchContactsWithFilter({q: getPhone(q), limit, offset});
                    const newState: IAddMembersPopupState = {...this.state};

                    newState.contactsList = [...newState.contactsList, ...records];
                    newState.contactsCount = count;
                    newState.offset = nextOffset;
                    newState.loading.isListUpdating = false;

                    newState.contactsList = newState.contactsList.filter(contact => {
                        return !groupMemberIds.includes(contact.contactId)
                    });

                    this.setState(newState);
                })();
            }

        }
    };


    dismissPopup = (event = null): void => {
        const {handleAddMembersPopUpClose} = this.props;
        if (!event) {
            handleAddMembersPopUpClose();
            return;
        }
        if (this.popupBlock && !this.popupBlock.contains(event.target)) {
            handleAddMembersPopUpClose();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    handleEscapePress = (event: any): void => {
        const {handleAddMembersPopUpClose} = this.props;
        if (event.key === "Escape") {
            handleAddMembersPopUpClose();
        }
    };

    handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.dismissPopup();
    };

    handleContactSelect = (username: string): void => {
        const {contactsList} = this.state;
        const selectedContacts: any = {...this.state.selectedContacts};
        let selectedContactsCount: number = this.state.selectedContactsCount;
        const newState: IAddMembersPopupState = {...this.state};
        if (selectedContacts.hasOwnProperty(username)) {
            delete selectedContacts[username];
            selectedContactsCount -= 1
        } else {
            const contact: any = contactsList.find(contact => contact.username === username);
            selectedContacts[contact.username] = contact;
            selectedContactsCount += 1;
        }
        newState.selectedContacts = selectedContacts;
        newState.selectedContactsCount = selectedContactsCount;
        newState.loading.isListUpdating = false;

        this.setState(newState);
    };

    handleSelectedContactDelete = (username?: string): void => {
        const selectedContacts: any = {...this.state.selectedContacts};
        let selectedContactsCount: number = this.state.selectedContactsCount;

        if (!username) {
            const userNames: string[] = Object.keys(selectedContacts);
            username = userNames[userNames.length - 1];
        }

        if (selectedContacts.hasOwnProperty(username)) {
            delete selectedContacts[username];
            selectedContactsCount -= 1;
            this.setState({selectedContacts, selectedContactsCount});
        }
    };

    handleContactsUpdate = (q: string): void => {
        this.setState({loading: {init: false, isListUpdating: true}, q: getPhone(q)});
        const {limit, selectedContacts, groupMemberIds} = this.state;

        if (this.isMounted) {

            (async () => {

                const result: { records, count, canceled?: boolean } = await fetchContactsWithFilter({
                    q: getPhone(q),
                    limit,
                    offset: 0
                });

                if (result.canceled) {
                    return;
                }

                const newState: IAddMembersPopupState = {...this.state};
                let {records, count} = result;


                if (getPhone(q) === "") {
                    Object.keys(selectedContacts).map((key) => {
                        if (!selectedContacts[key].saved) {
                            records.push(selectedContacts[key]);
                            count++;
                        }
                    });
                }

                newState.contactsCount = count;
                newState.contactsList = records;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;

                newState.contactsList = newState.contactsList.filter(contact => {
                    return !groupMemberIds.includes(contact.contactId)
                });

                this.setState(newState);

            })();
        }
    };

    handleContactsListLoaderUpdate = (loading: boolean): void => {
        const newState: IAddMembersPopupState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    handleAddClick = () => {
        const {selectedContacts} = this.state;
        const {addMembers, selectedThread} = this.props;
        const groupId: string = selectedThread.getIn(["threads", "threadInfo", "partialId"]);
        const selectedContactsIds: string = Object.keys(selectedContacts).join(";");

        addMembers(groupId, selectedContactsIds, true);
        this.dismissPopup();
    };

    render() {
        const localization: any = components().addMembersPanel;
        const contactInfoLoc: any = components().contactInfo;
        const {selectedContactsCount, contactsList, selectedContacts, loading, limit, offset, groupMemberIds} = this.state;
        const groupMemberIdsCount = groupMemberIds.length;

        return (
            <div
                id="add-members-popup"
                className="popup"
                onClick={this.handleOutsideFromPopupClick}
                ref={(ref) => this.popup = ref}
            >
                <div
                    id="add-members-popup-block"
                    className="popup-block"
                    ref={(ref) => this.popupBlock = ref}
                >
                    {
                        loading.init && <div className={"loader"}/>
                    }

                    {
                        !loading.init &&
                        <div className="popup-container">
                            <div className="popup-header">
                                <div className="text-block">
                                    <h2>
                                        {localization.addMembers}<span> {groupMemberIdsCount + selectedContactsCount} / {GROUP_MAX_COUNT} </span>
                                    </h2>
                                    <p className={`error-text ${selectedContactsCount + groupMemberIdsCount >= GROUP_MAX_COUNT ? "display" : "display_none"}`}/>
                                </div>
                                <div className="contact-search-container">
                                    <InputSelectable
                                        selectedContactsCount={selectedContactsCount}
                                        isLoading={loading.isListUpdating}
                                        limit={limit}
                                        offset={offset}
                                        selectedContacts={selectedContacts}
                                        contactsUpdate={this.handleContactsUpdate}
                                        contactsListLoaderUpdate={this.handleContactsListLoaderUpdate}
                                        selectedContactDelete={this.handleSelectedContactDelete}
                                    />
                                </div>
                            </div>
                            <div className="popup-body">
                                <div
                                    className="contacts-container-block"
                                    onScroll={this.handleContactListScroll}
                                >
                                    <ul id="contact-list-container"
                                        className="contact-list-container"
                                        ref={(ref) => this.contactsListContainer = ref}
                                    >
                                        {
                                            contactsList.length > 0 && contactsList.map((contact) => {

                                                const username = contact.username;
                                                const isSelected: boolean = !!selectedContacts.hasOwnProperty(username);

                                                return (
                                                    <li key={username}>
                                                        <Contact
                                                            isSelected={isSelected}
                                                            onSelect={this.handleContactSelect}
                                                            key={username}
                                                            contact={contact}
                                                            selectedContactsCount={selectedContactsCount + groupMemberIdsCount}
                                                        />
                                                    </li>
                                                )
                                            })
                                        }

                                        {
                                            contactsList.length === 0 &&
                                            <div className={"empty-message"}>{contactInfoLoc.noSearchResult}</div>
                                        }
                                    </ul>
                                </div>
                            </div>
                            <div className="popup-footer">
                                <div className="footer-content">
                                    <button
                                        onClick={this.handleCancelClick}
                                        className="btn-cancel"
                                    >{localization.cancel}
                                    </button>
                                    <button
                                        onClick={this.handleAddClick}
                                        disabled={selectedContactsCount === 0}
                                        className="btn-next"
                                    >{localization.add}
                                    </button>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        );
    }
};
