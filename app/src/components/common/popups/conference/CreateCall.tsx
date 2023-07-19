"use strict";

import * as React from "react";

import InputSelectable from "components/common/popups/conference/InputSelectable";
import {IGroupCreateParams, IGroupDetails} from "services/interfaces";
import Contact from "components/common/popups/conference/Contact";
import {
    CONFERENCE_CALL_MEMBERS_COUNT,
    CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM,
    CONVERSATION_TYPES,
    LEFT_PANELS
} from "configs/constants";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import "scss/pages/Popup.scss";
import Log from "modules/messages/Log";
import {getPhone} from "helpers/UIHelper";

interface ICreateCallProps {
    conferenceCreate: (details: any) => void;
    close: () => void;
    containerState: {
        isOpened: boolean;
    };
    changeConversationType?: (type: number) => void;
    conversationType?: number;
    rendering?: boolean;
    leftPanel?: string;
    autoFocus?: string;
    user?: any
}

interface ICreateCallState {
    loading: {
        init: boolean;
        isListUpdating: boolean;
    }
    q: string;
    contactsList: any[];
    contactsCount: number;
    selectedContacts: { [key: string]: IContact };
    selectedContactsCount: number;
    group: IGroupDetails;
    limit: number;
    offset: number;
    isNextStep: boolean;
}

export default class CreateCall extends React.Component<ICreateCallProps, ICreateCallState> {

    get isMounted(): boolean {
        return this._isMounted;
    }

    set isMounted(value: boolean) {
        this._isMounted = value;
    }

    private _isMounted: boolean = false;

    newCallPopup: any = React.createRef();
    newCallPopupBlock: any = React.createRef();
    contactsListContainer: any = React.createRef();

    constructor(props: ICreateCallProps) {
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
            isNextStep: false,
            group: {
                avatar: {
                    cropped: null,
                    file: null,
                },
                name: "",
            },
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleEscapePress);
        const {limit, offset} = this.state;
        this.isMounted = true;

        const newState: ICreateCallState = {...this.state};
        newState.loading.init = true;
        this.setState(newState);

        (async () => {
            const {records, count} = await fetchContactsWithFilter({q: '', limit, offset});

            newState.contactsList = [...newState.contactsList, ...records];
            newState.contactsCount = count;
            newState.offset = offset + 1;
            newState.loading.init = false;

            this.setState(newState);
        })();
    }

    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleEscapePress);
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
                    const {records, count} = await fetchContactsWithFilter({q:getPhone(q), limit, offset});
                    const newState: ICreateCallState = {...this.state};

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
        if (containerState.isOpened && this.newCallPopupBlock.current && !this.newCallPopupBlock.current.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    handleEscapePress = (event: any): void => {
        const {close} = this.props;
        if (event.key === "Escape") {
            close();
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
        const newState: ICreateCallState = {...this.state};

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
        const {limit, selectedContacts} = this.state;

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

                const newState: ICreateCallState = {...this.state};
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
        const newState: ICreateCallState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    handleStartConference = () => {
        const {close} = this.props;
        const {selectedContactsCount, selectedContacts} = this.state;

        const groupMembersNames: string[] = Object.keys(selectedContacts).map(item => selectedContacts[item].firstName);
        const params: IGroupCreateParams = {
            contacts: Object.keys(selectedContacts),
            group: {
                avatar: {
                    cropped: null,
                    file: null,
                },
                name: [groupMembersNames].join(','),
            }
        };

        this.props.conferenceCreate(params);
        close();

        // if (selectedContactsCount === 1) {
        //     this.props.singleCallCreate(Object.values(selectedContacts)[0]);
        //     close();
        // } else if (selectedContactsCount > 1) {
        //     const groupMembersNames: string[] = Object.keys(selectedContacts).map(item => selectedContacts[item].firstName);
        //     const params: IGroupCreateParams = {
        //         contacts: Object.keys(selectedContacts),
        //         group: {
        //             avatar: {
        //                 cropped: null,
        //                 file: null,
        //             },
        //             name: [groupMembersNames].join(','),
        //         }
        //     };
        //
        //     this.props.conferenceCreate(params);
        //     close();
        // }
    };

    render() {
        const localization: any = components().newCallPopup;
        const {changeConversationType, conversationType, rendering, leftPanel, autoFocus, user} = this.props
        const {selectedContactsCount, contactsList, selectedContacts, loading, limit, offset, isNextStep, q} = this.state;

        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT

        return (
            loading.init ? <div className="loader"/> :
                <div
                    style={{
                        opacity: rendering ? "1" : leftPanel !== LEFT_PANELS.keypad ? 0 : 1,
                    }}
                    className={`popup-container ${leftPanel === LEFT_PANELS.keypad ? "" : "container-absolute"} ${conversationType === CONVERSATION_TYPES.call ? "container-call" : ""}`}>
                    <div className="popup-header">
                        <div className="text-block">
                            <h2>{localization.selectContacts}<span> {selectedContactsCount} / {C_Count}   </span>
                            </h2>
                            <p className={`error-text ${selectedContactsCount >= C_Count ? "display" : "display_none"}`}/>
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
                                autoFocus={autoFocus}
                                inputValue={getPhone(q)}
                            />
                        </div>
                    </div>

                    <div className="popup-body">
                        <div
                            className="contacts-container-block"
                            onScroll={this.handleContactListScroll}
                        >
                            <ul
                                id="contact-list-container"
                                className="contact-list-container"
                                ref={this.contactsListContainer}
                            >
                                {
                                    contactsList.length > 0 && contactsList.map(contact => {
                                        const username: any = contact.username;
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
                                                    user={user}
                                                />
                                            </li>
                                        )
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
                            {leftPanel !== LEFT_PANELS.keypad && <button
                                onClick={() => changeConversationType(CONVERSATION_TYPES.conversation)}
                                className="btn-cancel"
                            >{localization.back}</button>}
                            <button
                                onClick={this.handleCancelClick}
                                className="btn-cancel"
                            >{localization.cancel}</button>

                            <button
                                onClick={this.handleStartConference}
                                disabled={selectedContactsCount === 0}
                                className="btn-next"
                            >{localization.start}</button>
                        </div>
                    </div>
                </div>
        );
    }
};
