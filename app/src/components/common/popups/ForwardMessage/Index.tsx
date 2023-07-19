"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import InputSelectable from "components/common/popups/ForwardMessage/InputSelectable";
import Contact from "components/common/popups/ForwardMessage/Contact";
import Thread from "components/common/popups/ForwardMessage/Thread";
import {DatabaseContacts} from "services/database/class/Contact";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {getAllConversations} from "helpers/ConversationHelper";
import PopUpMain from "components/common/PopUpMain";
import {ENTER_KEY_CODE} from "configs/constants";
import components from "configs/localization";
import "scss/pages/Popup.scss";
import Log from "modules/messages/Log";
import {getPhone} from "helpers/UIHelper";

interface IForwardMessagePopupProps {
    close: () => void;
    showForwardMessagePopUp: boolean;
    recentChats: any;
    forwardMessageSend: (selectedThreadIds: string[], emailsMap: {[key: string]: string}) => void;
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    BLOCK_CONTACT: (contactIds: string[]) => void;
    selectedThread: any,
    selectedThreadId: string
    user: any
}

interface IForwardMessagePopupState {
    loading: {
        init: boolean,
        isListUpdating: boolean
    }
    q: string,
    contactsList: any[],
    contactsCount: number,
    selectedThreads: { [key: string]: any },
    selectedContactsCount: number,
    limit: number,
    offset: number,
    recentChatList: any,

    requestId: number,
    showBlockedPopUp: boolean
    blockedContactIds: any[]
    contactToUnblock: string
    selectedContacts: {[key: string]: any}
}

export default class ForwardMessagePopup extends React.Component<IForwardMessagePopupProps, IForwardMessagePopupState> {
    get popupBlock(): HTMLDivElement {
        return this._forwardMessagePopupBlock;
    }

    set popupBlock(value: HTMLDivElement) {
        this._forwardMessagePopupBlock = value;
    }

    get popup(): HTMLDivElement {
        return this._forwardMessagePopup;
    }

    set popup(value: HTMLDivElement) {
        this._forwardMessagePopup = value;
    }

    get contactsListContainer(): HTMLUListElement {
        return this._contactsListContainer;
    }

    set contactsListContainer(value: HTMLUListElement) {
        this._contactsListContainer = value;
    }

    get recentChatsListContainer(): HTMLUListElement {
        return this._recentChatsListContainer;
    }

    set recentChatsListContainer(value: HTMLUListElement) {
        this._recentChatsListContainer = value;
    }

    get isMounted(): boolean {
        return this._isMounted;
    }

    set isMounted(value: boolean) {
        this._isMounted = value;
    }

    private _isMounted: boolean = false;
    private _contactsListContainer: HTMLUListElement = null;
    private _recentChatsListContainer: HTMLUListElement = null;
    private _forwardMessagePopup: HTMLDivElement = null;
    private _forwardMessagePopupBlock: HTMLDivElement = null;


    constructor(props) {
        super(props);
        this.state = {
            loading: {
                init: true,
                isListUpdating: true
            },
            q: "",
            recentChatList: [],
            contactsList: [],
            contactsCount: 0,
            selectedContacts: {},

            selectedThreads: {},
            selectedContactsCount: 0,

            limit: 40,
            offset: 0,

            requestId: null,
            showBlockedPopUp: false,
            blockedContactIds: [],
            contactToUnblock: "",
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyup);
        this.isMounted = true;

        const {limit, offset} = this.state;

        if (this.isMounted) {

            (async () => {

                const {records, count} = await fetchContactsWithFilter({q: '', limit, offset});
                const conversations = await getAllConversations();
                const blockedContactIds = await DatabaseContacts.selectBlockedContactIds();
                const newState: IForwardMessagePopupState = {...this.state};

                newState.recentChatList = conversations;
                newState.contactsList = [...newState.contactsList, ...records];
                newState.contactsCount = count;
                newState.offset = offset + 1;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;
                newState.blockedContactIds = blockedContactIds;

                this.setState(newState);
            })();
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keyup", this.handleKeyup);
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
                    const newState: IForwardMessagePopupState = {...this.state};

                    newState.contactsList = [...newState.contactsList, ...records];
                    newState.contactsCount = count;
                    newState.offset = nextOffset;
                    newState.loading.isListUpdating = false;
                    this.setState(newState);
                })();
            }

        }
    };

    handleOutsideFromPopupClick = (event): void => {
        event.stopPropagation();
        const {close} = this.props;

        if (this.popupBlock && !this.popupBlock.contains(event.target)) {
            close();
        }
    };

    handleKeyup = (event: any): void => {
        const {close} = this.props;
        const {selectedContactsCount} = this.state;
        if (event.key === "Escape") {
            close();
        }

        if (event.keyCode === ENTER_KEY_CODE && selectedContactsCount !== 0) {
            this.handleSendClick();
        }

        event.preventDefault();
    };

    handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        const {close} = this.props;
        e.preventDefault();
        close();
    };

    handleContactSelect = (username: string): void => {
        const {contactsList, recentChatList, loading} = this.state;
        const {init} = {...loading};
        const selectedThreads: any = {...this.state.selectedThreads};
        const selectedContacts: any = {...this.state.selectedContacts};
        let selectedContactsCount: number = this.state.selectedContactsCount;
        if (selectedThreads.hasOwnProperty(username)) {
            delete selectedThreads[username];
            selectedContactsCount -= 1
        } else {
            const thread = recentChatList.find(chat => chat.name === username || chat.username === username) || contactsList.find(contact => contact.username === username);
            selectedThreads[thread.username || thread.name] = thread;
            selectedContactsCount += 1;

        }
        this.setState({selectedThreads, selectedContactsCount, loading: {init, isListUpdating: false}});
    };

    handleSelectedContactDelete = (username?: string): void => {
        const selectedThreads: any = {...this.state.selectedThreads};
        let selectedContactsCount: number = this.state.selectedContactsCount;

        if (!username) {
            const userNames: string[] = Object.keys(selectedThreads);
            username = userNames[userNames.length - 1];
        }

        if (selectedThreads.hasOwnProperty(username)) {
            delete selectedThreads[username];
            selectedContactsCount -= 1;
            this.setState({selectedThreads, selectedContactsCount});
        }
    };

    handleThreadsUpdate = (q: string): void => {
        this.setState({loading: {init: false, isListUpdating: true}, q: getPhone(q)});
        const {limit, selectedThreads} = this.state;

        if (this.isMounted) {

            (async () => {

                const result: { records, count, canceled?: boolean } = await fetchContactsWithFilter({
                    q: getPhone(q),
                    limit,
                    offset: 0
                });

                const conversations = await getAllConversations(getPhone(q));

                if (result.canceled) {
                    return;
                }

                const newState: IForwardMessagePopupState = {...this.state};
                let {records, count} = result;


                if (getPhone(q) === "") {
                    Object.keys(selectedThreads).map((key) => {
                        if (!selectedThreads[key].saved) {
                            records.push(selectedThreads[key]);
                            count++;
                        }
                    });
                }


                newState.recentChatList = conversations;
                newState.contactsCount = count;
                newState.contactsList = records;
                newState.loading.init = false;
                newState.loading.isListUpdating = false;
                this.setState(newState);

            })();
        }
    };

    handleContactsListLoaderUpdate = (loading: boolean): void => {
        const newState: IForwardMessagePopupState = {...this.state};
        newState.loading.isListUpdating = loading;
        this.setState(newState);
    };

    handleSendClick = () => {
        const {selectedThreads} = this.state;
        const {forwardMessageSend} = this.props;
        let selectedThreadIds: string[] = [];
        const emailsMap: {[key: string]: string} = {};
        for (const key in selectedThreads) {
            selectedThreadIds = [...selectedThreadIds, selectedThreads[key].contactId || selectedThreads[key].id];
            if (selectedThreads[key].email && selectedThreads[key].email !== "") {
                emailsMap[key] = selectedThreads[key].email
            }

        }
        forwardMessageSend(selectedThreadIds, emailsMap);
    };

    handleCancelUnBlockContact = () => {
        this.setState({showBlockedPopUp: false});
    };

    handleShowUnblockContactPopup = (contactId: string) => {
        this.setState({showBlockedPopUp: true, contactToUnblock: contactId})
    };

    handleUnBlockContact = (): void => {
        const {UNBLOCK_CONTACT} = this.props;
        const {contactToUnblock, blockedContactIds, contactsList, recentChatList} = {...this.state};

        const newBlockedContactIds = blockedContactIds.filter(contactId => contactId === contactToUnblock);

        UNBLOCK_CONTACT([contactToUnblock]);
        this.setState({showBlockedPopUp: false, blockedContactIds: newBlockedContactIds, contactToUnblock: ""});
        let contact: any = contactsList.find(contact => contact.contactId === contactToUnblock);
        if (!contact) {
            contact = recentChatList.find(contact => contact.contactId === contactToUnblock);
        }
        this.handleContactSelect(contact.username);
    };

    render() {
        const localization: any = components().forwardContacts;
        const {selectedContactsCount, contactsList, selectedThreads, loading, limit, offset, recentChatList, showBlockedPopUp, blockedContactIds} = this.state;
        const blockedLocalization: any = components().blockedPopUp;

        return (
            <div
                id={"conversation-start-popup"}
                className="popup"
                onClick={this.handleOutsideFromPopupClick}
                ref={(ref) => this.popup = ref}
            >
                <div
                    id={"forward-message-popup-block"}
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
                                    <h2>{localization.title}</h2>
                                </div>
                                <div className={"contact-search-container"}>
                                    <InputSelectable
                                        selectedContactsCount={selectedContactsCount}
                                        isLoading={loading.isListUpdating}
                                        limit={limit}
                                        offset={offset}
                                        selectedThreads={selectedThreads}
                                        contactsUpdate={this.handleThreadsUpdate}
                                        contactsListLoaderUpdate={this.handleContactsListLoaderUpdate}
                                        selectedContactDelete={this.handleSelectedContactDelete}
                                    />
                                </div>
                            </div>
                            <div className={"popup-body"}>
                                {
                                    recentChatList.length === 0 && contactsList.length === 0 ?
                                        <div className="empty-message">{localization.notContactsFound}</div> :
                                        <div className={"contacts-container-block"}
                                             onScroll={this.handleContactListScroll}>
                                            {
                                                recentChatList.length !== 0 &&
                                                <ul id={"contact-list-container"}
                                                    className={"contact-list-container"}
                                                    ref={(ref) => this.recentChatsListContainer = ref}>
                                                    <h3 className="label-title">{localization.recentChats}</h3>
                                                    {
                                                        recentChatList.map((chat) => {

                                                            const name: string = chat.username || chat.name;
                                                            const isSelected: boolean = !!selectedThreads.hasOwnProperty(name);
                                                            const threadId: string = chat.contactId || chat.id;

                                                            if (threadId) {
                                                                return (
                                                                    <li key={threadId}>
                                                                        <Thread
                                                                            isSelected={isSelected}
                                                                            onSelect={this.handleContactSelect}
                                                                            key={name}
                                                                            thread={chat}
                                                                            blockedContactIds={blockedContactIds}
                                                                            handleShowUnblockContactPopup={this.handleShowUnblockContactPopup}
                                                                        />
                                                                    </li>
                                                                )
                                                            }
                                                        })
                                                    }
                                                </ul>
                                            }
                                            {
                                                contactsList.length !== 0 &&
                                                <ul id={"contact-list-container"}
                                                    className={"contact-list-container"}
                                                    ref={(ref) => this.contactsListContainer = ref}>
                                                    <h3 className="label-title">{localization.contacts}</h3>
                                                    {
                                                        contactsList.map((contact) => {

                                                            const username = contact.username;
                                                            const isSelected: boolean = !!selectedThreads.hasOwnProperty(username);

                                                            return (
                                                                <li key={username}>
                                                                    <Contact
                                                                        isSelected={isSelected}
                                                                        onSelect={this.handleContactSelect}
                                                                        key={username}
                                                                        contact={contact}
                                                                        selectedContactsCount={selectedContactsCount}
                                                                        blockedContactIds={blockedContactIds}
                                                                        handleShowUnblockContactPopup={this.handleShowUnblockContactPopup}
                                                                    />
                                                                </li>
                                                            )
                                                        })
                                                    }
                                                </ul>
                                            }

                                        </div>
                                }
                            </div>
                            <div className="popup-footer">
                                <div className="footer-content">
                                    <button
                                        onClick={this.handleCancelClick}
                                        className="btn-cancel"
                                    >{localization.cancel}
                                    </button>
                                    <button
                                        onClick={this.handleSendClick}
                                        disabled={selectedContactsCount === 0}
                                        className="btn-next"
                                    >{localization.send}
                                    </button>
                                </div>
                            </div>
                        </div>
                    }
                </div>
                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={230}>
                    {
                        showBlockedPopUp &&
                        <PopUpMain
                            confirmButton={this.handleUnBlockContact}
                            cancelButton={this.handleCancelUnBlockContact}
                            confirmButtonText={blockedLocalization.confirm}
                            cancelButtonText={blockedLocalization.cancel}
                            titleText={blockedLocalization.title}
                            infoText={blockedLocalization.unblockInfo}
                            showPopUpLogo={true}
                        />
                    }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
};
