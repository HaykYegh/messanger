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
import {ENTER_KEY_CODE} from "configs/constants";
import isMap = Map.isMap;
import phoneParse from "libphonenumber-js/es6/parse";
const metadata = require('libphonenumber-js/metadata.min.json');
import isValidNumber from "libphonenumber-js/es6/validate";
import Log from "modules/messages/Log";
import selector from "services/selector";
import {connect} from "react-redux";
import {
    ConferenceOptionsBody, ConferenceOptionsFooter,
    ConferenceTextBlock, ContactSearchCotainer,
    ContactsTextBlock, FooterItem,
    MembersContainer
} from "containers/chat-panel/conference/settingsPopupStyle";
import {addMembers, toggleAddMembersPopup} from "modules/conference/ConferenceActions";
import {getPhone, phoneMask} from "helpers/UIHelper";

interface IContactsForConferenceProps {
    user: any;
    conferenceDetails: any;
    toggleAddMembersPopup: (addMembersPopup: boolean) => void;
    addMembers: (groupId: string, callId: string, members: any) => void;
}

interface IContactsForConferenceState {
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

const selectorVariables: any = {
    user: true,
    conferenceDetails: true
};

class ContactsForConference extends React.Component<IContactsForConferenceProps, IContactsForConferenceState> {

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

        // const {contactInfo} = this.props;

        // this.setState({loading: {init: true, isListUpdating: true}});
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchContactsWithFilter({q: '', limit, offset});
                const newState: IContactsForConferenceState = {...this.state};

                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;

                // if (!contactInfo) {
                //     newState.loading.isListUpdating = false;
                // }

                this.setState(newState, () => {
                    // if (contactInfo) {
                    //     this.handleContactSelect(contactInfo.username, true);
                    //     // setTimeout(() => {
                    //     //     this.handleContactSelect(contactInfo.username, true);
                    //     // }, 1000)
                    // }
                });

            })();
        }
    }

    componentWillUnmount(): void {
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
                    const newState: IContactsForConferenceState = {...this.state};

                    newState.contactsList = [...newState.contactsList, ...records];
                    newState.contactsCount = count;
                    newState.offset = nextOffset;
                    newState.loading.isListUpdating = false;
                    this.setState(newState);
                })();
            }

        }
    };

    addConfMembers = () => {
        const {selectedContacts} = this.state;
        const {conferenceDetails, addMembers, toggleAddMembersPopup} = this.props

        const members = Object.keys(selectedContacts)
        const callId = conferenceDetails.get("callId")
        const groupId = conferenceDetails.getIn(["info","threadId"]).split("@")[0]

        if (!members.length) {
            return
        }

        addMembers(groupId, callId, members)
        toggleAddMembersPopup(!conferenceDetails.get("addMembersPopup"))




        Log.i("conference -> selectedContacts = ", selectedContacts)

    }

    handleContactSelect = (username: string, isDefault: boolean = false): void => {
        const {contactsList} = this.state;
        const selectedContacts: any = {...this.state.selectedContacts};
        let selectedContactsCount: number = this.state.selectedContactsCount;
        const newState: IContactsForConferenceState = {...this.state};

        if (!isDefault) {
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

        } else {
            // const {contactInfo} = this.props;

            // if (!contactInfo.saved) {
            //     newState.contactsList.push(contactInfo);
            // }

            // newState.selectedContacts[contactInfo.username] = contactInfo;
            newState.selectedContactsCount = 1;
            newState.loading.isListUpdating = false;
        }

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

                const newState: IContactsForConferenceState = {...this.state};
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
                this.setState(newState);

            })();
        }
    };

    handleContactsListLoaderUpdate = (loading: boolean): void => {
        const newState: IContactsForConferenceState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    render() {
        const localization: any = components().createGroupPopup;
        const {selectedContactsCount, contactsList, selectedContacts, loading, limit, offset, isNextStep, isGroupNameEmpty, q} = this.state;
        const {conferenceDetails, toggleAddMembersPopup} = this.props

        Log.i("conference -> contactsList = ", contactsList)

        return (
            <MembersContainer>
                <ConferenceTextBlock>
                    <ContactsTextBlock>
                        <h2>{localization.selectContacts}<span> {selectedContactsCount} / 50   </span></h2>
                        <p className={`error-text ${selectedContactsCount >= 50 ? "display" : "display_none"}`}/>
                    </ContactsTextBlock>
                    <ContactSearchCotainer>
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
                        />
                    </ContactSearchCotainer>
                </ConferenceTextBlock>
                <ConferenceOptionsBody onScroll={this.handleContactListScroll}>
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
                                            showSelection={!isNextStep}
                                            isSelected={isSelected}
                                            onSelect={this.handleContactSelect}
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
                </ConferenceOptionsBody>
                <ConferenceOptionsFooter>
                    <FooterItem>
                        <button onClick={() => {
                            toggleAddMembersPopup(!conferenceDetails.get("addMembersPopup"))
                        }}>Cancel</button>
                    </FooterItem>
                    <FooterItem>
                        <button className={selectedContactsCount > 0 ? "" : "disable"}
                            onClick={() => this.addConfMembers()}
                        >Add</button>
                    </FooterItem>
                </ConferenceOptionsFooter>
            </MembersContainer>
        );
    }
};

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    toggleAddMembersPopup: (addMembersPopup: boolean) => dispatch(toggleAddMembersPopup(addMembersPopup)),
    addMembers: (groupId: string, callId: string, members: any) => dispatch(addMembers(groupId, callId, members))
});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsForConference);
