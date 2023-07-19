"use strict";

import * as React from "react";

import Contact from "components/common/popups/Favorites/Contact";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";

import "scss/pages/Popup.scss";
import Log from "modules/messages/Log";

interface IFavoritesPopupProps {
    close: () => void;
    attemptFavoritesUpdate: (changes: { prevValue: boolean, value: boolean, username: string }[]) => void
}

interface IFavoritesPopupState {
    loading: {
        init: boolean,
        isListUpdating: boolean
    }
    q: string,
    contactsList: any[],
    contactsCount: number,
    selectedContacts: { [key: string]: { prevValue: boolean, value: boolean, username: string } },
    selectedContactsCount: number,
    limit: number,
    offset: number,

    checkedContacts: { [key: string]: IContact },
    keyword: string,
}

export default class FavoritesPopup extends React.Component<IFavoritesPopupProps, IFavoritesPopupState> {
    get popupBlock(): HTMLDivElement {
        return this._favoritesPopupBlock;
    }

    set popupBlock(value: HTMLDivElement) {
        this._favoritesPopupBlock = value;
    }

    get popup(): HTMLDivElement {
        return this._favoritesPopup;
    }

    set popup(value: HTMLDivElement) {
        this._favoritesPopup = value;
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
    private _favoritesPopup: HTMLDivElement = null;
    private _favoritesPopupBlock: HTMLDivElement = null;


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

            checkedContacts: {},
            keyword: "",
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleEscapePress);

        this.setState({loading: {init: true, isListUpdating: true}});
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchContactsWithFilter({q: '', limit, offset, hideMultipleContacts: true});
                const newState: IFavoritesPopupState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;
                this.setState(newState);
            })();
        }
    }


    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleEscapePress);
        this.isMounted = false;
    }


    handleContactListScroll = (e) => {
        if (e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight) - 150) {
            Log.i("### IS BOTTOM");
            const {limit, offset, contactsCount, q = ''} = this.state;

            if ((offset * limit) >= contactsCount) {
                Log.i("#### CONTACTS ALREADY RETRIEVED");
                return;
            }

            if (this.isMounted) {

                (async () => {

                    const nextOffset: number = offset + 1;
                    const {records, count} = await fetchContactsWithFilter({q, limit, offset, hideMultipleContacts: true});
                    const newState: IFavoritesPopupState = {...this.state};

                    newState.contactsList = [...newState.contactsList, ...records];
                    newState.contactsCount = count;
                    newState.offset = nextOffset;
                    newState.loading.isListUpdating = false;
                    this.setState(newState);
                })();
            }

        }
    };


    dismissPopup = (event = null) => {
        const {close} = this.props;
        if (!event) {
            close();
            return;
        }
        if (this.popupBlock && !this.popupBlock.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any) => {
        this.dismissPopup(event);
    };

    handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        this.dismissPopup();
    };

    handleDoneClick = () => {
        const {attemptFavoritesUpdate} = this.props;
        const {selectedContacts} = this.state;
        const changes: { prevValue: boolean, value: boolean, username: string }[] = Object.values(selectedContacts);
        attemptFavoritesUpdate(changes);
        this.dismissPopup();
    };

    handleContactSelect = (username: string) => {
        const {contactsList} = this.state;
        const selectedContacts = {...this.state.selectedContacts};

        let selectedContactsCount: number = this.state.selectedContactsCount;
        const newState: IFavoritesPopupState = {...this.state};

        if (selectedContacts.hasOwnProperty(username)) {
            const selectedContact = selectedContacts[username];
            if (selectedContact.prevValue === !selectedContact.value) {
                selectedContacts[username].value = !selectedContacts[username].value;
                delete selectedContacts[username]
            }
            selectedContactsCount--
        } else {
            const contact = contactsList.find(contact => contact.username === username);
            selectedContacts[contact.username] = {
                prevValue: contact.favorite,
                value: !contact.favorite,
                username
            };
            selectedContactsCount++
        }
        newState.selectedContacts = selectedContacts;
        newState.selectedContactsCount = selectedContactsCount;
        newState.loading.isListUpdating = false;

        this.setState(newState);
    };

    handleEscapePress = (event: any) => {
        if (event.key === "Escape") {
            this.props.close();
        }
    };

    handleSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({loading: {init: false, isListUpdating: true}, keyword: value});
        const {limit} = this.state;

        (async () => {

            const result: { records, count, canceled?: boolean } = await fetchContactsWithFilter({
                q: value,
                limit,
                offset: 0,
                hideMultipleContacts: true
            });

            if (result.canceled) {
                return;
            }

            const newState: IFavoritesPopupState = {...this.state};
            let {records, count} = result;

            newState.contactsCount = count;
            newState.contactsList = records;
            newState.loading.init = false;
            newState.loading.isListUpdating = false;
            newState.offset = 1;
            if (this.isMounted) {
                this.setState(newState);
            }

        })();
    };

    render() {
        const {contactsList, selectedContacts, loading, keyword} = this.state;
        const disabled: boolean = Object.keys(selectedContacts).length === 0;
        const localization: any = components().contactInfo;


        return (
            <div id="conversation-start-popup" className="popup"
                 onClick={this.handleOutsideFromPopupClick}
                 ref={(ref) => this.popup = ref}>
                <div id="conversation-start-popup-block" className="popup-block"
                     ref={(ref) => this.popupBlock = ref}>
                    {
                        loading.init && <div className="loader"/>
                    }
                    {
                        !loading.init &&
                        <div className="popup-container">
                            <div className="popup-header">
                                <div className="text-block">
                                    <h2>{localization.addFav}</h2>
                                </div>
                                <div className="contact-search-container search-icon">
                                    <input
                                        placeholder={localization.search}
                                        className="search-input"
                                        autoFocus={true}
                                        value={keyword}
                                        onChange={this.handleSearchInputChange}
                                    />
                                </div>
                            </div>
                            <div className="popup-body">
                                <div className="contacts-container-block" onScroll={this.handleContactListScroll}>
                                    <ul
                                        id="contact-list-container"
                                        className="contact-list-container"
                                        ref={(ref) => this.contactsListContainer = ref}
                                    >
                                        {
                                            contactsList.length > 0 && contactsList.map((contact) => {
                                                const username = contact.username;
                                                const isSelected: boolean = selectedContacts.hasOwnProperty(username) ? selectedContacts[username].value : contact.favorite;
                                                return <li key={username}>
                                                    <Contact
                                                        isSelected={isSelected}
                                                        onSelect={this.handleContactSelect}
                                                        key={username}
                                                        contact={contact}
                                                    />
                                                </li>
                                            })
                                        }
                                        {
                                            contactsList.length === 0 &&
                                            <div className="empty-message">{localization.noSearchResult}</div>
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
                                        onClick={this.handleDoneClick}
                                        className="btn-next"
                                        disabled={disabled}
                                    >{localization.done}
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
