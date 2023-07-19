"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import ContactDetails from "components/common/popups/SendContact/ContactDetails";
import {fetchSavedContactsWithFilter} from "helpers/ContactsHelper";
import Contact from "components/common/popups/SendContact/Contact";
import components from "configs/localization";
import {userCheck} from "requests/profileRequest";

import "scss/pages/Popup.scss";
import {type} from "os";
import {checkEmailValidate} from "requests/loginRequest";
import {number} from "prop-types";
import {ADD_CONTACT_TYPE} from "configs/constants";

interface ISendContactPopupProps {
    close: () => void;
    isSendContactPopupShown: boolean,
    sendContact: (id, contactsToShare, firstName, lastName) => void,
}

interface ISendContactPopupState {
    loading: {
        init: boolean,
        isListUpdating: boolean
    }
    contactsList: any[],
    contactsCount: number,
    limit: number,
    offset: number,
    isContactDetails: boolean,
    keyword: string,
    selectedContactNumbers: any[],
    isNameEmpty: boolean,
    selectedContactId: string,
    contactsToShare: any[],
    selectedContactFirstName: string,
    selectedContactLastName: string,
}

export default class SendContactPopup extends React.Component<ISendContactPopupProps, ISendContactPopupState> {
    get popupBlock(): HTMLDivElement {
        return this._sendContactPopupBlock;
    }

    set popupBlock(value: HTMLDivElement) {
        this._sendContactPopupBlock = value;
    }

    get popup(): HTMLDivElement {
        return this._sendContactPopup;
    }

    set popup(value: HTMLDivElement) {
        this._sendContactPopup = value;
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
    private _sendContactPopup: HTMLDivElement = null;
    private _sendContactPopupBlock: HTMLDivElement = null;


    constructor(props) {
        super(props);
        this.state = {
            loading: {
                init: false,
                isListUpdating: false
            },
            contactsList: [],
            contactsCount: 0,

            limit: 50,
            offset: 0,
            isContactDetails: false,
            keyword: "",
            selectedContactNumbers: [],
            isNameEmpty: false,
            selectedContactId: "",
            contactsToShare: [],
            selectedContactFirstName: "",
            selectedContactLastName: ""
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleEscapePress);

        this.setState({loading: {init: true, isListUpdating: true}});
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchSavedContactsWithFilter({q: '', limit, offset});
                const newState: ISendContactPopupState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;

                this.setState(newState);

            })();
        }
    }

    componentDidUpdate(prevProps: Readonly<ISendContactPopupProps>, prevState: Readonly<ISendContactPopupState>, snapshot?: any): void {
        if (this.state.selectedContactFirstName === "" && this.state.selectedContactLastName === "" && !this.state.isNameEmpty) {
            this.setState({isNameEmpty: true})
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleEscapePress);
        this.isMounted = false;
    }

    shouldComponentUpdate(nextProps: Readonly<ISendContactPopupProps>, nextState: Readonly<ISendContactPopupState>, nextContext: any): boolean {
        return !isEqual(this.state, nextState);
    }

    handleContactListScroll = async (e) => {
        if (e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight) - 150) {
            const {limit, offset, contactsCount, keyword = '', isContactDetails} = this.state;

            if ((offset * limit) >= contactsCount) {
                return;
            }

            if (this.isMounted && !isContactDetails) {
                const nextOffset: number = offset + 1;
                const {records, count} = await fetchSavedContactsWithFilter({q: keyword, limit, offset});
                const newState: ISendContactPopupState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = nextOffset;
                newState.loading.isListUpdating = false;
                this.setState(newState);
            }

        }
    };

    handleEscapePress = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            this.dismissPopup();
        }
    };

    dismissPopup = (event = null) => {
        const {close, isSendContactPopupShown} = this.props;
        if (!event) {
            close();
            return;
        }
        if (isSendContactPopupShown && this.popupBlock && !this.popupBlock.contains(event.target)) {
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

    handleSendClick = () => {
        const {sendContact} = this.props;
        const {selectedContactId, contactsToShare, selectedContactFirstName, selectedContactLastName} = this.state;
        sendContact(selectedContactId, contactsToShare, selectedContactFirstName, selectedContactLastName)
    };

    handleContactSelect = async (username: string) => {
        const newState: ISendContactPopupState = {...this.state};
        const contact: any = newState.contactsList.find(contact => contact.username === username);
        newState.selectedContactFirstName = contact.firstName;
        newState.selectedContactLastName = contact.lastName;
        if (contact.isProductContact && contact.numbers && typeof contact.numbers[0] !== "string") {
            newState.selectedContactNumbers = contact.numbers ? contact.numbers.map(number => {
                    const matchContact = newState.contactsList.find(contact => contact.username === number);
                    if (typeof  number !== "string") {
                        return {
                            username: matchContact.username || contact.username,
                            isProductContact: matchContact.isProductContact || contact.isProductContact,
                            label: matchContact.label || contact.label,
                            email: matchContact.email || contact.email,
                        }
                    }else {
                        return {
                            username: contact.username,
                            isProductContact: contact.isProductContact,
                            label: contact.label,
                            email: contact.email,
                        }
                    }

                }) :
                [{
                    username: contact.username,
                    isProductContact: contact.isProductContact,
                    label: contact.label,
                    email: contact.email
                }];

            newState.isContactDetails = true;
            newState.selectedContactId = contact.contactId;
            newState.contactsToShare = contact.numbers || [contact.username];
            newState.isNameEmpty = newState.selectedContactFirstName + newState.selectedContactLastName === "";

            this.setState(newState)

        } else {
            if (contact.isProductContact) {
                let unverifiedContactDetails = [];
                if (contact.email && typeof contact.email !== 'string') {
                    const {data: {body}} = await userCheck([], contact.email);
                    if (body) {
                        body.map(async (email) => {
                            if (email["registered"]) {
                                await unverifiedContactDetails.push({
                                    username: contact.username,
                                    isProductContact: true,
                                    label: contact.label,
                                    email: email["email"],
                                });
                            }
                            else {
                                await unverifiedContactDetails.push({
                                    username: email["email"],
                                    isProductContact: false,
                                    label: contact.label,
                                    email: email["email"],
                                });
                            }

                            // unverifiedContactDetails.push({
                            //     username: contact.username,
                            //     isProductContact: contact.isProductContact,
                            //     label: contact.label,
                            //     email: email
                            // });
                        });

                    }
                }

                if (contact.numbers && contact.numbers.indexOf(contact.username) !== -1) {
                    // const filteredContacts = contact.numbers.filter(number => number !== contact.username);
                    contact.numbers.map(async (number, index) => {
                        await unverifiedContactDetails.push({
                            username: newState.contactsList[index].email ? newState.contactsList[index].email : number,
                            isProductContact: false,
                            label: contact.label,
                            email: newState.contactsList[index].email ? newState.contactsList[index].email : null,
                        })

                    })
                } else {
                    contact.numbers ? contact.numbers.map(async number => {
                        const matchContact = newState.contactsList.find(contact => contact.username === number);
                        if (typeof  number !== "string") {
                            unverifiedContactDetails.push({
                                username: matchContact.username || number,
                                isProductContact: matchContact.isProductContact || contact.isProductContact,
                                label: matchContact.label || contact.label,
                                email: null,
                            })
                        } else {
                            await unverifiedContactDetails.push({
                                username: matchContact.username || number,
                                isProductContact: matchContact.isProductContact || contact.isProductContact,
                                label: matchContact.label || contact.label,
                                email: null,
                            })
                        }
                    }) : ""
                }
                const contactArr = unverifiedContactDetails.length ?  unverifiedContactDetails : [{
                    username: contact.username,
                    isProductContact: contact.isProductContact,
                    label: contact.label,
                    email: contact.email
                }];

                newState.selectedContactNumbers = contactArr
                newState.isContactDetails = true;
                newState.selectedContactId = contact.contactId;
                newState.contactsToShare = contactArr;
                newState.isNameEmpty = newState.selectedContactFirstName + newState.selectedContactLastName === "";
                await this.setState(newState);
            } else {
                let unverifiedContactDetails = [];
                if (contact.email && typeof contact.email !== 'string') {
                    contact.email.map(async (email) => {
                        await unverifiedContactDetails.push({
                            username: email,
                            isProductContact: false,
                            label: contact.label,
                            email: email,
                        });
                    });
                }
                if (contact.email && typeof contact.email === 'string') {
                    await unverifiedContactDetails.push({
                        username: contact.email,
                        isProductContact: false,
                        label: contact.label,
                        email: contact.email
                    });

                }
                contact.numbers ? contact.numbers.map(async (number, index) => {
                        await unverifiedContactDetails.push({
                            username: newState.contactsList[index].email ? newState.contactsList[index].email : number,
                            isProductContact: false,
                            label: contact.label,
                            email: newState.contactsList[index].email ? newState.contactsList[index].email : null,
                        })
                }) : "";

                !contact.numbers && !contact.email && contact.phone && typeof contact.phone === "string" ?
                    unverifiedContactDetails.push({
                        username: contact.phone,
                        isProductContact: false,
                        label: contact.label,
                        email: null,
                    }) : "";


                function removeDuplicates(myArr, prop) {
                    return myArr.filter((obj, pos, arr) => {
                        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
                    });
                }
                const filteredContactDetails = removeDuplicates(unverifiedContactDetails, 'username');
                newState.selectedContactNumbers = filteredContactDetails;
                newState.isContactDetails = true;
                newState.selectedContactId = contact.contactId;
                newState.contactsToShare = unverifiedContactDetails || [contact.username];
                newState.isNameEmpty = newState.selectedContactFirstName + newState.selectedContactLastName === "";
                await this.setState(newState);
            }
        }
    };

    handleContactsListLoaderUpdate = (loading: boolean) => {
        const newState: ISendContactPopupState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    handleBackClick = () => {
        this.setState({
            isContactDetails: false,
            selectedContactNumbers: [],
            selectedContactFirstName: "",
            selectedContactLastName: "",
            selectedContactId: "",
            isNameEmpty: false
        })
    };

    handleSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({loading: {init: false, isListUpdating: true}, keyword: value});
        const {limit} = this.state;

        (async () => {

            const result: { records, count, canceled?: boolean } = await fetchSavedContactsWithFilter({
                q: value,
                limit,
                offset: 0
            });

            if (result.canceled) {
                return;
            }

            const newState: ISendContactPopupState = {...this.state};
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

    handleSelectedContactNameChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        const newState: ISendContactPopupState = {...this.state};
        if (name === "firstName") {
            newState.selectedContactFirstName = value.trim();
            newState.isNameEmpty = false;
        } else if (name === "lastName") {
            newState.selectedContactLastName = value.trim();
            newState.isNameEmpty = false;
        }

        if (newState.selectedContactFirstName === "" && newState.selectedContactLastName === "") {
            newState.isNameEmpty = true;
        }

        this.setState(newState);
    };

    handleContactToShareClick = (number: string) => {
        const newState: ISendContactPopupState = {...this.state};
        const { selectedContactNumbers } = this.state;
            const selectedNumber = newState.contactsToShare.find(contact => contact.username === number);
            if (selectedNumber) {
            newState.contactsToShare = newState.contactsToShare.filter(contact => contact.username !== selectedNumber.username);
        } else {
            const selectedNumber = selectedContactNumbers.find(contact => contact.username === number);
            newState.contactsToShare = [...newState.contactsToShare, selectedNumber]
        }
        this.setState({contactsToShare: newState.contactsToShare})
    };

    render() {
        const {contactsList, isNameEmpty, selectedContactNumbers, loading, isContactDetails, keyword, contactsToShare, selectedContactFirstName, selectedContactLastName} = this.state;
        const localization: any = components().sendContact;

        return (
            <div
                id={"send-contact-popup"}
                className={"popup"}
                onClick={this.handleOutsideFromPopupClick}
                ref={(ref) => this.popup = ref}
            >
                <div
                    id="send-contact-popup-block"
                    className="popup-block"
                    ref={(ref) => this.popupBlock = ref}>
                    {
                        loading.init && <div className="loader"/>
                    }
                    {
                        !loading.init &&
                        <div className="popup-container">
                            <div className="popup-header">
                                <div className="text-block">
                                    <h2>{localization.title}</h2>
                                </div>
                                {
                                    !isContactDetails ?
                                        <div className="contact-search-container search-icon">
                                            <input placeholder={localization.search}
                                                   className="search-input "
                                                   value={keyword}
                                                   onChange={this.handleSearchInputChange}
                                                   autoFocus={true}/>
                                        </div> : null
                                }
                            </div>
                            <div className="popup-body">
                                <div className="contacts-container-block" onScroll={this.handleContactListScroll}>
                                    {
                                        isContactDetails ?
                                            <ContactDetails
                                                contactFirstName={selectedContactFirstName}
                                                contactLastName={selectedContactLastName}
                                                contactNumbers={selectedContactNumbers}
                                                handleSelectedContactNameChange={this.handleSelectedContactNameChange}
                                                handleContactToShareClick={this.handleContactToShareClick}
                                                contactsToShare={contactsToShare}
                                                isNameEmpty={isNameEmpty}
                                            /> :
                                            <ul id="contact-list-container"
                                                className="contact-list-container"
                                                ref={(ref) => this.contactsListContainer = ref}>
                                                {
                                                    contactsList.length > 0 && contactsList.map((contact, index) => {

                                                        return (
                                                            <li key={index}>
                                                                <Contact
                                                                    onSelect={this.handleContactSelect}
                                                                    key={index}
                                                                    contact={contact}
                                                                />
                                                            </li>
                                                        )
                                                    })
                                                }
                                                {
                                                    contactsList.length === 0 &&
                                                    <div className="empty-message">{localization.noContacts}</div>
                                                }
                                            </ul>
                                    }
                                </div>
                            </div>
                            <div className="popup-footer">
                                <div className="footer-content">
                                    <button
                                        onClick={isContactDetails ? this.handleBackClick : this.handleCancelClick}
                                        className="btn-cancel"
                                    >{isContactDetails ? localization.back : localization.cancel}
                                    </button>
                                    {
                                        isContactDetails ?
                                            <button
                                                onClick={this.handleSendClick}
                                                className="btn-next"
                                                disabled={isNameEmpty}
                                            >{localization.send}
                                            </button> : null
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        );
    }
};
