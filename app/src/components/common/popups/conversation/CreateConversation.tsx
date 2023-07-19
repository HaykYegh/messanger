"use strict";

import * as React from "react";
import {Map} from "immutable";

import EnterGroupDetails from "components/common/popups/conversation/EnterGroupDetails";
import InputSelectable from "components/common/popups/conversation/InputSelectable";
import {IGroupCreateParams, IGroupDetails} from "services/interfaces";
import Contact from "components/common/popups/conversation/Contact";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";

import "scss/pages/Popup.scss";
import {validateNumber} from "helpers/DataHelper";
import {
    CONFERENCE_CALL_MEMBERS_COUNT,
    CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM,
    CONVERSATION_TYPES,
    ENTER_KEY_CODE
} from "configs/constants";
import isMap = Map.isMap;
import phoneParse from "libphonenumber-js/es6/parse";
const metadata = require('libphonenumber-js/metadata.min.json');
import isValidNumber from "libphonenumber-js/es6/validate";
import Log from "modules/messages/Log";
import ContactSvg from "../../../../../assets/components/svg/ContactSvg";
import CallSvg from "../../../../../assets/components/svg/CallSvg";
import {getPhone} from "helpers/UIHelper";

interface ICreateConversationProps {
    close: () => void;
    containerState: {
        isOpened: boolean
    };
    groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, selectedContacts?: any) => void;
    conversationNavigate: (contact: IContact) => void;
    changeConversationType: (type: number) => void;
    contactInfo?: any;
    user: any;
    conversationType: number;
    autoFocus?: string;
}

interface ICreateConversationState {
    loading: {
        init: boolean,
        isListUpdating: boolean
    }
    q: string,
    contactsList: any[],
    contactsCount: number,
    selectedContacts: { [key: string]: IContact },
    selectedContactsCount: number,
    group: IGroupDetails
    limit: number,
    offset: number,
    isNextStep: boolean,
    isGroupNameEmpty: boolean
}

export default class CreateConversation extends React.Component<ICreateConversationProps, ICreateConversationState> {

    popupContent: React.RefObject<HTMLDivElement>;

    popupBlockContent: React.RefObject<HTMLDivElement>;

    contactsListContainer: React.RefObject<HTMLUListElement>;

    get isMounted(): boolean {
        return this._isMounted;
    }

    set isMounted(value: boolean) {
        this._isMounted = value;
    }

    private _isMounted: boolean = false;

    constructor(props) {
        super(props);

        this.popupContent = React.createRef();
        this.popupBlockContent = React.createRef();
        this.contactsListContainer = React.createRef();

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
            isNextStep: false,


            group: {
                avatar: {
                    cropped: null,
                    original: null,
                },
                name: "",
            },

            isGroupNameEmpty: true
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);

        const {contactInfo} = this.props;

        this.setState({loading: {init: true, isListUpdating: true}});
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchContactsWithFilter({q: '', limit, offset});
                const newState: ICreateConversationState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;

                if (!contactInfo) {
                    newState.loading.isListUpdating = false;
                }

                this.setState(newState, () => {
                    if (contactInfo) {
                        this.handleContactSelect(contactInfo.username);
                        // setTimeout(() => {
                        //     this.handleContactSelect(contactInfo.username, true);
                        // }, 1000)
                    }
                });

            })();
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleKeyUp);
        this.isMounted = false;
    }

    handleContactListScroll = (e: any): void => {
        if (e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight) - 150) {
            const {limit, offset, contactsCount, q = ''} = this.state;

            if ((offset * limit) >= contactsCount) {
                return;
            }

            if (this.isMounted) {

                (async () => {

                    const nextOffset: number = offset + 1;
                    const {records, count} = await fetchContactsWithFilter({q: getPhone(q), limit, offset});
                    const newState: ICreateConversationState = {...this.state};

                    newState.contactsList = [...newState.contactsList, ...records];
                    newState.contactsCount = count;
                    newState.offset = nextOffset;
                    newState.loading.isListUpdating = false;
                    this.setState(newState);
                })();
            }

        }
    };

    dismissPopup = (event = null): void => {
        const {close, containerState} = this.props;
        if (!event) {
            close();
            return;
        }
        const popupBlock: any = this.popupBlockContent && this.popupBlockContent.current;
        if (containerState.isOpened && popupBlock && !popupBlock.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    handleKeyUp = (event: any): void => {
        const {close, contactInfo} = this.props;
        const {selectedContactsCount, isGroupNameEmpty} = this.state;
        if (event.key === "Escape") {
            close();
        }

        if (event.keyCode === ENTER_KEY_CODE) {
            if (
                selectedContactsCount === 1 && !contactInfo ||
                selectedContactsCount !== 0 && isGroupNameEmpty && contactInfo && selectedContactsCount > 1 ||
                selectedContactsCount > 1 && !contactInfo && isGroupNameEmpty
            ) {
                this.handleNextStepClick(event);

            } else if (!isGroupNameEmpty) {
                this.handleGroupCreate(event);
            }
        }

        event.preventDefault();
        event.stopPropagation();
    };

    handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.dismissPopup();
    };

    handleNextStepClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const {close, conversationNavigate} = this.props;
        const {selectedContactsCount, selectedContacts} = this.state;
        if (selectedContactsCount === 1) {
            conversationNavigate(Object.values(selectedContacts)[0]);
            close();
        } else if (selectedContactsCount > 1) {
            this.setState({isNextStep: true})
        }
    };

    handleGoBackClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        this.setState({isNextStep: false, isGroupNameEmpty: true})
    };

    handleGroupNameUpdate = (name: string): void => {
        const newState: ICreateConversationState = {...this.state};
        newState.group.name = name;
        newState.isGroupNameEmpty = !name.length;
        this.setState(newState);
    };

    handleGroupAvatarUpdate = ({cropped, file}: { cropped: Blob | File, file: Blob | File }): void => {
        const newState: ICreateConversationState = {...this.state};
        newState.group.avatar.original = file;
        newState.group.avatar.cropped = cropped;
        this.setState(newState)
    };

    handleGroupCreate = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const {groupConversationCreate, close} = this.props;
        const {group, selectedContacts} = this.state;
        const params: IGroupCreateParams = {
            contacts: Object.keys(selectedContacts),
            group
        };

        if (params.contacts.length > 1) {
            groupConversationCreate(null, null, null, params, selectedContacts);
        }
        close();
    };

    handleContactSelect = (contact): void => {
        const {close, conversationNavigate} = this.props;

        conversationNavigate(contact);
        close();
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

    finalizedNumber = (q: string) => {
        const {user} = this.props;
        const regExp = /[a-zA-Z]/g;

        if(regExp.test(getPhone(q))){
            return getPhone(q)
        } else {
            const parsedNumber: any = phoneParse.call(this, `${getPhone(q)}`, {extended: true}, metadata);
            if (isValidNumber.call(this, parsedNumber, metadata)) {
                return {
                    phoneNumber: parsedNumber.phone,
                    phoneCode: parsedNumber.countryCallingCode,
                    fullNumber: getPhone(q).substr(1)
                };
            } else {
                // if (user.get("regionCode") && user.get("phoneCode")) {
                //     if (q.substr(0, user.get("phoneCode").length) === user.get("phoneCode")) {
                //         q = `+${q}`
                //     }
                //     if (isValidNumber.call(this, q, user.get("regionCode"), metadata)) {
                //
                //         const parsedNumber = phoneParse.call(this, q, {
                //             defaultCountry: user.get("regionCode"),
                //             extended: true
                //         }, metadata);
                //         if (parsedNumber.possible) {
                //             return {
                //                 phoneNumber: parsedNumber.phone,
                //                 phoneCode: user.get("phoneCode"),
                //                 fullNumber: `${user.get("phoneCode")}${parsedNumber.phone}`
                //             };
                //         }
                //     } else {
                //         if(q.startsWith("0")) {
                //             return {
                //                 phoneNumber: q,
                //                 phoneCode: user.get("phoneCode"),
                //                 fullNumber: `${user.get("phoneCode")}${q.substr(0,)}`
                //             }
                //         }
                //     }
                // }

                if (user.regionCode && user.phoneCode) {
                    if (getPhone(q).substr(0, user.phoneCode.length) === user.phoneCode) {
                        q = `+${getPhone(q)}`
                    }
                    if (isValidNumber.call(this, getPhone(q), user.regionCode, metadata)) {

                        const parsedNumber = phoneParse.call(this, getPhone(q), {
                            defaultCountry: user.regionCode,
                            extended: true
                        }, metadata);
                        if (parsedNumber.possible) {
                            return {
                                phoneNumber: parsedNumber.phone,
                                phoneCode: user.phoneCode,
                                fullNumber: `${user.phoneCode}${parsedNumber.phone}`
                            };
                        }
                    } else {
                        if(getPhone(q).startsWith("0")) {
                            return {
                                phoneNumber: getPhone(q),
                                phoneCode: user.phoneCode,
                                fullNumber: `${user.phoneCode}${getPhone(q).substr(0,)}`
                            }
                        }
                    }
                }
            }
            return getPhone(q)
        }
    };

    handleContactsUpdate = (q: string): void => {
        const {user} = this.props;
        const email: string = isMap(user) ? user.get("email") : user.email;
        const phone: string = isMap(user) ? user.get("phone") : user.phone;
        this.setState({loading: {init: false, isListUpdating: true}, q: getPhone(q)});
        const {limit, selectedContacts} = this.state;
        const finalSearchNumber: any = this.finalizedNumber(getPhone(q));
        const phoneData: any = !!email ? null : validateNumber(getPhone(q), phone, !!email);

        if (this.isMounted) {

            (async () => {
                const result: { records, count, canceled?: boolean } = await fetchContactsWithFilter({
                    q: finalSearchNumber && finalSearchNumber.fullNumber ? finalSearchNumber.fullNumber : finalSearchNumber && !finalSearchNumber.fullNumber ? finalSearchNumber : getPhone(q),
                    limit,
                    offset: 0
                });



                if (result.canceled) {
                    return;
                }

                const newState: ICreateConversationState = {...this.state};
                let {records, count} = result;


                if (q === "") {
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
                this.setState(newState);

            })();
        }
    };

    handleContactsListLoaderUpdate = (loading: boolean): void => {
        const newState: ICreateConversationState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    render() {
        const localization: any = components().createGroupPopup;
        const {selectedContactsCount, contactsList, selectedContacts, loading, limit, offset, isNextStep, isGroupNameEmpty, q} = this.state;
        const {user, changeConversationType, conversationType, autoFocus} = this.props;
        const selectedContactIds: string[] = isNextStep ? [...Object.keys(selectedContacts)] : [];

        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT

        return (
            <>
                {loading.init && <div className="loader"/>}

                {
                    !loading.init &&
                    <div className={`popup-container container-absolute-c ${conversationType !== CONVERSATION_TYPES.conversation ? "container-conversation" : ""}`}>

                        {!isNextStep && <div className={"popup-header"}>
                            <div className="text-block">
                                <h2>{localization.newChat}</h2>
                                <p className={`error-text ${selectedContactsCount >= C_Count ? "display" : "display_none"}`}/>
                            </div>

                            <div className={"contact-search-container"}>
                                <InputSelectable
                                    selectedContactsCount={selectedContactsCount}
                                    isLoading={loading.isListUpdating}
                                    limit={limit}
                                    offset={offset}
                                    selectedContacts={selectedContacts}
                                    contactsUpdate={this.handleContactsUpdate}
                                    contactsListLoaderUpdate={this.handleContactsListLoaderUpdate}
                                    selectedContactDelete={this.handleSelectedContactDelete}
                                    inputValue={getPhone(q)}
                                    autoFocus={autoFocus}
                                />
                            </div>
                        </div>}


                        {isNextStep && <div className={"popup-header border-none"}>
                            <div className="text-block border"><h2>{localization.createGroup}</h2></div>
                            <div className={"create-group-container"}>

                                <EnterGroupDetails
                                    groupNameUpdate={this.handleGroupNameUpdate}
                                    groupAvatarUpdate={this.handleGroupAvatarUpdate}
                                />


                            </div>
                        </div>}

                        <div className={"popup-body"}>
                             <div className={"contacts-container-block top"}>
                                <ul
                                    className="contact-list-container top"
                                    ref={this.contactsListContainer}
                                >
                                    <li onClick={() => changeConversationType(CONVERSATION_TYPES.call)} >
                                        <div data-value="871890528518" className="contact">
                                            <div className="contact-block">
                                                <div className="contact-icon">
                                                    <CallSvg hoverColor="#000000"/>
                                                </div>
                                                <div className="contact-content">
                                                    <div className="text-block">
                                                        <div className="user-name">New Group Call</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li onClick={() => changeConversationType(CONVERSATION_TYPES.group)}>
                                        <div data-value="871890528518" className="contact">
                                            <div className="contact-block">
                                                <div className="contact-icon">
                                                    <ContactSvg hoverColor="#000000"/>
                                                </div>
                                                <div className="contact-content">
                                                    <div className="text-block">
                                                        <div className="user-name">Create Group</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            {!isNextStep &&
                            <div className={"contacts-container-block"} onScroll={this.handleContactListScroll}>
                                <ul
                                    className="contact-list-container"
                                    ref={this.contactsListContainer}
                                >
                                    {
                                        contactsList.length > 0 && contactsList.map((contact) => {

                                            const username = contact.username;
                                            const isSelected: boolean = !!selectedContacts.hasOwnProperty(username);

                                            return (
                                                <li key={username}>
                                                    <Contact
                                                        showSelection={false}
                                                        isSelected={isSelected}
                                                        onSelect={() => this.handleContactSelect(contact)}
                                                        key={username}
                                                        contact={contact}
                                                        selectedContactsCount={selectedContactsCount}
                                                    />
                                                </li>
                                            )
                                        })
                                    }

                                    {!isNextStep && contactsList.length === 0 &&
                                    <div className={"empty-message"}>{localization.noSearchResult}</div>}

                                </ul>
                            </div>}
                            {
                                isNextStep &&
                                <div className={"contacts-container-block"}>


                                    <p className={"members-count"}>{localization.members}</p>
                                    <ul
                                        className="contact-list-container"
                                        ref={this.contactsListContainer}>
                                        <li>
                                            <Contact
                                                contact={isMap(user) ? user.toJS() : user}
                                            />
                                        </li>
                                        {
                                            isNextStep && selectedContactIds.length > 0 && selectedContactIds.map((username) => {

                                                const contact: IContact = selectedContacts[username];

                                                return (
                                                    <li key={username}><Contact key={username} contact={contact}/>
                                                    </li>
                                                );
                                            })
                                        }

                                    </ul>
                                </div>
                            }


                        </div>
                        <div className={"popup-footer"}>
                            <div className="footer-content">
                                <button onClick={this.handleCancelClick}
                                        className="btn-cancel">{localization.cancel}</button>
                            </div>
                        </div>
                    </div>
                }
            </>
        );
    }
};
