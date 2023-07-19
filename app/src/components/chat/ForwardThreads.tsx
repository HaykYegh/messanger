"use strict";

import "scss/pages/chat-panel/helpers/MessageActionsPopUp";
import SearchInput from "components/common/SearchInput";
import {getThread, getThreadType, includesInNumbers} from "helpers/DataHelper";
import components from "configs/localization";
import * as React from "react";
import {connect} from "react-redux";
import ForwardThreadRow from "components/chat/ForwardThreadRow";
import selector, {IStoreProps} from "services/selector";
import IDBConversation from "services/database/class/Conversation";
import {DISPLAY_CONTATCS_COUNT, ENTER_KEY_CODE, ESC_KEY_CODE} from "configs/constants";
import {Scrollbars} from 'react-custom-scrollbars';
import {IContact} from "modules/contacts/ContactsReducer";
import {IGroup} from "modules/groups/GroupsReducer";
import {cloneDeep} from "lodash";
import IDBContact from "services/database/class/Contact";
import Log from "modules/messages/Log";

interface IForwardContactsState {
    selectedThreadIds: Array<string>;
    allConversations: any;
    favoriteContacts: any;
    contacts: any;
    loader: boolean;
    keyword: string;
}

interface IForwardContactsPassedProps {
    handleForwardPopUpClose: () => void;
    forwardMessageSend: (selectedThreadIds: any) => void;
}

interface IForwardContactsProps extends IStoreProps, IForwardContactsPassedProps {

}

const selectorVariables: any = {
    user: {
        user: true
    },
    contacts: {
        savedContacts: true,
        favoriteContacts: true,
    },
};


class ForwardThreads extends React.Component<IForwardContactsProps, IForwardContactsState> {

    constructor(props: any) {
        super(props);

        this.state = {
            allConversations: [],
            selectedThreadIds: [],
            favoriteContacts: [],
            contacts: [],
            loader: true,
            keyword: ""
        };
    }

    mounted: boolean;

    async componentDidMount() {
        const {savedContacts, favoriteContacts, user} = this.props;
        this.mounted = true;
        let contacts: any = [];
        document.addEventListener("keydown",  this.handleEscPress);
        try {
            let allConversations = await IDBConversation.getConversations();
            const blockedContactNumbers = await IDBContact.getBlockedContacts(DISPLAY_CONTATCS_COUNT);

            if (savedContacts && savedContacts.size > 0) {
                let savedProductContacts: any = savedContacts.filter(contact => {
                    const contactInfo: any = contact.get("members").first();
                    const username: string = contactInfo.get("username");
                    const blocked: boolean = Object.keys(blockedContactNumbers).join().includes(username);
                    return contactInfo.get("name") && contactInfo.get("isProductContact") && !blocked;
                });
                contacts = savedProductContacts.merge(allConversations);
                contacts = contacts.filter(thread => {
                    const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
                    const threadInfo: any = getThread(thread, user.get("username"));
                    const lastMessage = thread.get('messages') && thread.get('messages').toJS();
                    return threadInfo && !((isGroup && threadInfo.get("disabled")) ||
                        (!isGroup && threadInfo.get("blocked")) ||
                        (!isGroup && user.get("phone") === threadInfo.get("phone")) ||
                        (!isGroup && threadInfo.get("favorite"))) && !lastMessage.time && (!isGroup && thread.get('members').first() && !threadInfo.get("blocked"));
                }).sort((c1, c2) => {
                    const compare = c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name"));
                    if(compare === 1 && c2.get('members').first().get("name") && isNaN(c2.get('members').first().get("name")[0]) && c1.get('members').first().get("name") && !isNaN(c1.get('members').first().get("name")[0])){
                        return -1;
                    }
                    return compare;
                });
            }
            if (this.mounted) {
                this.setState({
                    favoriteContacts,
                    allConversations,
                    contacts,
                    loader: false
                });
            }
        } catch(e) {
            if (this.mounted) {
                this.setState({loader: false});
            }
            Log.i(e);
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        document.removeEventListener("keydown",  this.handleEscPress);
        this.setState({selectedThreadIds: []});
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

    handleForwardMessageSend = (): void => {
        const {forwardMessageSend} = this.props;
        const {selectedThreadIds} = this.state;
        forwardMessageSend(selectedThreadIds);
    };

    handleReceiverToggle = (thread: IContact | IGroup) => {
        const newState: IForwardContactsState = cloneDeep(this.state);
        const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
        let threadInfo: any = isGroup ? thread.getIn(["threads", "threadInfo"]) : thread.get("members").first();
        const id: any = thread.getIn(["threads", "threadId"]);
        const index: number = newState.selectedThreadIds.indexOf(id);

        if (index === -1) {
            newState.selectedThreadIds.push(id);
        } else {
            newState.selectedThreadIds.splice(index, 1);
        }
        this.setState(newState);
    };

    handleEscPress = (event: any) => {
        const {handleForwardPopUpClose} = this.props;
        const {selectedThreadIds} = this.state;

        switch (event.keyCode) {
            case ESC_KEY_CODE:
                handleForwardPopUpClose();
                break;
            case ENTER_KEY_CODE:
                if (selectedThreadIds && selectedThreadIds.length > 0) {
                    this.handleForwardMessageSend
                }
                break;
        }
    };

    get conversations(): any {
        const {user} = this.props;
        const {keyword, allConversations} = this.state;

        if (!allConversations && allConversations == null) {
            return;
        }

        return allConversations
            .filter(thread => {
                const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
                const threadInfo: any = getThread(thread, user.get("username"));
                const [threadName, threadPhone, threadNumbers] = [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];

                const lastMessage = thread.get('messages') && thread.get('messages').toJS();
                return threadInfo && !((isGroup && threadInfo.get("disabled")) ||
                    (!isGroup && threadInfo.get("blocked")) ||
                    (!isGroup && user.get("phone") === threadInfo.get("phone")) ||
                    (!isGroup && threadInfo.get("favorite"))) && (threadName && threadName.toLowerCase().includes(keyword) || includesInNumbers(threadPhone, threadNumbers, keyword)) && lastMessage.time;

            })
    }

    get favoriteContacts(): any {
        const {user} = this.props;
        const {keyword, favoriteContacts} = this.state;

        if (!favoriteContacts && favoriteContacts.isEmpty()) {
            return
        }

        return favoriteContacts
            .filter(thread => {
                const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
                const threadInfo: any = getThread(thread, user.get("username"));
                const [threadName, threadPhone, threadNumbers] = [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];

                return !isGroup &&
                    threadInfo.get("isProductContact") &&
                    !threadInfo.get("blocked") &&
                    (threadName && threadName.toLowerCase().includes(keyword) || includesInNumbers(threadPhone, threadNumbers, keyword))
            });
    }

    get contacts(): any {
        const {user} = this.props;
        const {keyword, contacts} = this.state;

        if (!contacts && contacts == null) {
            return
        }

        return contacts
            .filter(thread => {
                const threadInfo: any = getThread(thread, user.get("username"));
                const [threadName, threadPhone, threadNumbers] = [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];
                return threadName.toLowerCase().includes(keyword) || includesInNumbers(threadPhone, threadNumbers, keyword);
            })
    }

    render() {
        const {handleForwardPopUpClose, user} = this.props;
        const {loader, keyword, selectedThreadIds} = this.state;
        const localization: any = components().forwardContacts;
        const searchClearButton: boolean = keyword && keyword !== "";

        const closePopUp : any = (e) => {
            if(e.target.id === 'forward-popup') {
                handleForwardPopUpClose();
            }
            return;
        };

        return (
            <div className="message-action-popup" id="forward-popup" onClick={closePopUp}>
                <div className="popup-block">
                    <div  className="popup-content">
                        <span className="popup-text">{localization.title}</span>
                        <SearchInput
                            onChange={this.handleSearchInputChange}
                            iconClassName="hidden"
                            handleSearchClear={this.handleSearchClear}
                            clearButton={searchClearButton}
                            newId={true}
                            searchId="searchInputForward"
                        />
                        {((this.conversations && this.conversations.size > 0) || (this.contacts && this.contacts.size > 0) || (this.favoriteContacts && this.favoriteContacts.size > 0)) ?
                            <Scrollbars style={{height:"320px"}}>
                                <div className="contacts-container">
                                    {this.favoriteContacts && this.favoriteContacts.size > 0 && <span>{localization.favorites}</span>}
                                    {this.favoriteContacts && this.favoriteContacts.size > 0 && this.favoriteContacts.valueSeq().map(thread => {
                                        const handleForwardReceiverToggle: any = () => this.handleReceiverToggle(thread);
                                        const id: any = thread.getIn(["threads","threadId"]);

                                        return <ForwardThreadRow
                                            thread={thread}
                                            username={user.get("username")}
                                            key={id}
                                            handleForwardReceiverToggle={handleForwardReceiverToggle}
                                            checked = {selectedThreadIds.includes(id)}
                                        />
                                    })}
                                    {this.conversations && this.conversations.size > 0 && <span>{localization.recentChats}</span>}
                                    {this.conversations && this.conversations.size > 0 && this.conversations.valueSeq().map(thread => {
                                        const handleForwardReceiverToggle: any = () => this.handleReceiverToggle(thread);
                                        const id: any = thread.getIn(["threads","threadId"]);

                                        return <ForwardThreadRow
                                            thread={thread}
                                            username={user.get("username")}
                                            key={id}
                                            handleForwardReceiverToggle={handleForwardReceiverToggle}
                                            checked = {selectedThreadIds.includes(id)}
                                        />
                                    })}
                                    {this.contacts && this.contacts.size > 0 && <span>{localization.contacts}</span>}
                                    {this.contacts && this.contacts.size > 0 && this.contacts.valueSeq().map(thread => {
                                        const handleForwardReceiverToggle: any = () => this.handleReceiverToggle(thread);
                                        const id: any = thread.getIn(["threads","threadId"]);

                                        return <ForwardThreadRow
                                            thread={thread}
                                            username={user.get("username")}
                                            key={id}
                                            handleForwardReceiverToggle={handleForwardReceiverToggle}
                                            checked = {selectedThreadIds.includes(id)}
                                        />
                                    })}
                                </div>
                            </Scrollbars>
                            : searchClearButton ?
                                <span className="no-info">
                                    <span className="no-info-text">{localization.notFound}</span>
                                </span>
                            : loader ?
                                <div className="loader">
                                    <div className="circular-loader">
                                        <div className="loader-stroke">
                                            <div className="loader-stroke-left"/>
                                            <div className="loader-stroke-right"/>
                                        </div>
                                    </div>
                                </div>
                            :
                            <span className="no-info">
                                <span className="no-info-title">No Contacts to Send</span>
                                <span className="no-info-text">Just click the “Add Contact” button, add your friends and chat.</span>
                            </span>
                        }

                        <div className="send-block">
                            <button onClick={handleForwardPopUpClose} className="cancel-btn">{localization.cancel}</button>
                            <button className={selectedThreadIds && selectedThreadIds.length > 0 ? "send-btn" : "send-btn disabled-button"}  onClick={this.handleForwardMessageSend}>{localization.send}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

export default connect<{}, {}, IForwardContactsPassedProps>(mapStateToProps)(ForwardThreads);
