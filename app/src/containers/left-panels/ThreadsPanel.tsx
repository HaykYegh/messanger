"use strict";
import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import {Scrollbars} from 'react-custom-scrollbars';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {
    attemptShowMoreSearchMessages,
    attemptSearchMessages,
    removeSearchedMessageId,
    attemptShowSearchedMessage,
    setSearchedMessageId
} from "modules/messages/MessagesActions";
import {
    attemptChangeLeftPanel,
    attemptSetSelectedThread,
    FETCH_THREAD, setNewSelectedThreadId,
    setSearchKeyword,
    setSelectedThreadId,
    setSelectedThreadType as setThreadType,
    toggleProfilePopUp
} from "modules/application/ApplicationActions";
import {attemptGetConversations, attemptRemoveConversation} from "modules/conversations/ConversationsActions";
import {acceptCall, declineCall, sendHangUp, TOGGLE_IGNORE, toggleMic} from "modules/call/CallActions";
import {getThread, getThreadType, includesInNumbers, isPublicRoom} from "helpers/DataHelper";
import {check, join} from "modules/conference/ConferenceActions";
import {attemptLeaveOrRemoveMember} from "modules/groups/GroupsActions";
import {
    CALL_STATUSES,
    CONVERSATION_TYPE,
    CONVERSATIONS_LIMIT,
    MESSAGE_TYPES,
    OFFLINE_MESSAGE_BODY
} from "configs/constants";
import selector, {IStoreProps} from "services/selector";
import SearchInput from "components/common/SearchInput";
import {LEAVE_GROUP_COMMAND} from "xmpp/XMLConstants";
import PopUpMain from "components/common/PopUpMain";
import Thread from "components/contacts/Thread";
import components from "configs/localization";
import {getCallTime, getFormattedDate} from "helpers/DateHelper";
import "scss/pages/left-panel/ChatList";
import {languagesSelector} from "modules/settings/SettingsSelector";
import {emojify} from "helpers/EmojiHelper";
import {AvatarSize} from "components/contacts/style";
import Avatar from "components/contacts/Avatar";
import Log from "modules/messages/Log";
import {getPhone} from "helpers/UIHelper";

interface IThreadsPanelState {
    deleteThreadPopUp: boolean;
    onlyGroup: boolean;
    getConversationsBool: boolean;
    getConversations?: (page: number, threadType: string, offset: boolean, searchText: string) => void;
    scrollTop: number;
    value: string;

    time: number;
    timer: any;
    callStartTime: number;

    threadIdToDelete: string;
}

interface IThreadsPanelProps extends IStoreProps {
    attemptShowSearchedMessage: (id: string, message: any, text: string) => void;
    getConversations: (page: number, threadType: string, offset: boolean, searchText: string) => void;
    setSelectedThreadType: (threadType: string) => void;
    setSelectedConversationId: (id: string) => void;
    attemptLeaveGroup: (id, username) => void;
    setSelectedThreadId: (id: string) => void;
    deleteConversation: (id: string) => void;
    setSelectedThread: (thread: any, updateConversationTime: boolean, contactId: string, callback: Function) => void;
    changeLeftPanel: (panel: string) => void;
    setSearchKeyword: (keyword: string) => void;
    attemptSearchMessages: (keyword: string, search: boolean) => void;
    removeSearchedMessageId: () => void;
    toggleProfilePopUp: () => void;
    attemptShowMoreSearchMessages: (text: string) => void;
    setSearchedMessageId: (id: string) => void;

    sendHangUp: (id: string, to: string, outCall: boolean) => void;
    declineCall: (id: string, to: string, outCall?: boolean) => void;
    toggleMic: (id, mic) => void;
    TOGGLE_IGNORE: (id: string, ignored?: boolean, isVideo?: boolean) => void;
    searchValue: string;
    selectedThreadId: string;
    FETCH_THREAD: (threadId: string | any) => void;
    checkConference: () => void;
}

const selectorVariables: any = {
    newMessagesCount: true,
    selectedThreadId:true,
    conversations: true,
    application: {
        app: true
    },
    messages: {
        messages: true,
        searchedMessages: true,
        allMessages: true,
        searchedActiveMessage: true
    },
    calls: {
        lastCall: true,
    },
    contacts: true,
    threads: true,
    user: true,
    settings: {
        languages: true,
    },
    conference: {
        showConference: true,
        initialized: true,
        conferenceDetails: true
    },
    pendingRequests: true
};

class ThreadsPanel extends React.Component<IThreadsPanelProps, IThreadsPanelState> {

    contextMenu: HTMLDivElement;

    scrollTop: number = 0;

    constructor(props: any) {
        super(props);
        const lastCall = props.lastCall;
        let callStartTime: number = null;
        let time: number = 0;
        if (lastCall) {
            callStartTime = lastCall.get("callStartTime") || null;

            if (lastCall.get('status') === CALL_STATUSES.answering && callStartTime) {
                time = Date.now() / 1000 - callStartTime;
            }
        }

        this.state = {
            deleteThreadPopUp: false,
            onlyGroup: false,
            getConversationsBool: false,
            scrollTop: 0,
            value: "",

            time,
            timer: null,
            callStartTime,

            threadIdToDelete: "",
        }
    }

    componentDidMount(): void {
        const {callStartTime} = this.state;
        const {lastCall, attemptSearchMessages, removeSearchedMessageId, app: {searchKeyword}} = this.props;
        // this.getConversations();
        this.setState({value: getPhone(searchKeyword)});
        // attemptSearchMessages("", true);
        // removeSearchedMessageId();
        document.getElementById("threadContainer").addEventListener("scroll", this.handleDocumentScroll, true);

        if (lastCall && lastCall.get('status') === CALL_STATUSES.answering && callStartTime) {
            const timer: any = setInterval(() => {
                this.setState({time: Date.now() / 1000 - callStartTime});
            }, 1000);
            this.setState({timer});
        }
    }

    shouldComponentUpdate(nextProps: IThreadsPanelProps, nextState: IThreadsPanelState): boolean {
        const {app: {searchKeyword, applicationState}, messages, searchedMessages, searchedActiveMessage, contacts} = this.props;

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (nextProps.searchedMessages && !nextProps.searchedMessages.equals(searchedMessages)) {
            return true;
        }

        if (searchKeyword && searchKeyword.length > 0 && !messages.equals(nextProps.messages)) {
            return true;
        }

        if (this.props.app.searchKeyword !== nextProps.app.searchKeyword) {
            this.getConversations(true, nextProps.app.searchKeyword); // Todo move it to componentDidUpdate
            return true;
        }

        if (applicationState.isOnline !== nextProps.app.applicationState.isOnline) {
            return true;
        }

        if (this.props.lastCall && !this.props.lastCall.equals(nextProps.lastCall)) {
            return true;
        }

        if (!this.props.lastCall && !!nextProps.lastCall) {
            return true;
        }

        if (!this.props.languages.equals(nextProps.languages)) {
            return true;
        }

        if (this.props.app.showProfilePopUp !== nextProps.app.showProfilePopUp) {
            return true;
        }

        if (this.props.selectedThreadId !== nextProps.selectedThreadId) {
            return true;
        }

        if (this.props.newMessagesCount !== nextProps.newMessagesCount) {
            return true;
        }

        if (!isEqual(this.props.app.threadTexts, nextProps.app.threadTexts)) {
            return true;
        }

        if (!isEqual(this.props.conversations, nextProps.conversations)) {
            return true;
        }

        if (!isEqual(contacts, nextProps.contacts)) {
            return true;
        }

        if (!isEqual(this.props.threads, nextProps.threads)) {
            return true;
        }

        if (!isEqual(this.props.user, nextProps.user)) {
            return true;
        }

        if (this.state.callStartTime !== nextState.callStartTime) {
            return true;
        }

        if (this.state.time !== nextState.time) {
            return true;
        }

        if (this.state.timer !== nextState.timer) {
            return true;
        }

        if (this.state.onlyGroup !== nextState.onlyGroup) {
            return true;
        }

        if(this.state.value !== nextState.value) {
            return true;
        }

        if (this.props.showConference !== nextProps.showConference) {
            return true;
        }

        if (this.props.conferenceDetails.getIn(['info', 'threadId']) !== nextProps.conferenceDetails.getIn(['info', 'threadId'])) {
            return true;
        }

        if (!isEqual(this.props.conferenceDetails, nextProps.conferenceDetails)) {
            return true;
        }

        return this.state.deleteThreadPopUp !== nextState.deleteThreadPopUp;
    }

    componentDidUpdate(prevProps: Readonly<IThreadsPanelProps>, prevState: Readonly<IThreadsPanelState>): void {
        const {getConversationsBool, timer, callStartTime} = this.state;
        const {app: {searchKeyword}, lastCall, messages} = this.props;
        if (getConversationsBool) {
            this.setState({
                getConversationsBool: false,
            });
            if (this.refs.scrollbar) {
                const scrollBar: any = this.refs.scrollbar;
                this.scrollTop = scrollBar.lastViewScrollTop;
            }
        }

        if (lastCall && !lastCall.equals(prevProps.lastCall) && lastCall.get('status') === CALL_STATUSES.answering) {
            if (!timer) {
                if (!callStartTime) {
                    const time: number = Date.now() / 1000;
                    this.setState({callStartTime: time});
                }
                const timer: any = setInterval(() => {
                    this.setState({time: Date.now() / 1000 - this.state.callStartTime});
                }, 1000);
                this.setState({timer});
            }
        }

        if (!lastCall && timer) {
            clearInterval(timer);
            this.setState({
                callStartTime: null,
                timer: null,
                time: 0,
            })
        }

        if (searchKeyword && searchKeyword.length > 0 && !messages.equals(prevProps.messages)) {
            attemptSearchMessages(searchKeyword, true);
            removeSearchedMessageId();
        }
    }

    componentWillUnmount(): void {
        const {timer} = this.state;
        document.getElementById("threadContainer").removeEventListener("scroll", this.handleDocumentScroll);
        if (timer) {
            clearInterval(timer);
        }
    }

    searchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {app: {searchKeyword}, setSearchKeyword, attemptSearchMessages, removeSearchedMessageId} = this.props;

        this.setState({value});

        if (getPhone(value).trim() !== getPhone(searchKeyword)) {
            setSearchKeyword(getPhone(value).trim());
            attemptSearchMessages(getPhone(value).trim(), true);
            removeSearchedMessageId();
        }
    };

    handleSearchClear = (): void => {
        const {setSearchKeyword, attemptSearchMessages, removeSearchedMessageId} = this.props;
        (document.getElementById("searchInput") as HTMLInputElement).value = "";
        this.setState({value: ""});
        setSearchKeyword("");
        attemptSearchMessages("", true);
        removeSearchedMessageId();
    };

    handleDocumentScroll = (event) => {
        const target = event.target;

        Log.i("handleDocumentScroll ->", event)

        if ((target.scrollTop + target.offsetHeight) == target.scrollHeight) {
            target.scrollTop--;
        }

        const scrollBar: any = this.refs.scrollBar;
        if (target.scrollTop === 0 && !(scrollBar && scrollBar.lastViewScrollTop)) {
            scrollBar && scrollBar.scrollTop(scrollBar.viewScrollTop);
        }
        if (this.scrollTop && this.scrollTop < target.scrollTop) {
            const sc: any = this.refs.scrollbar;
            sc.scrollTop(this.scrollTop);
            this.scrollTop = this.scrollTop + 100;
        }

        if (!this.state.getConversationsBool && (target.scrollHeight - (target.offsetHeight + target.scrollTop) <= target.scrollHeight / 200) && event.currentTarget.id == "threadContainer" && !this.state.getConversations) {
            this.getConversations();
            this.setState({
                getConversationsBool: true,
                scrollTop: target.scrollTop
            });
        }
    };

    toggleDeletePopup = (threadId: string = "") => {
        const {deleteThreadPopUp} = this.state;
        this.setState({
            deleteThreadPopUp: !deleteThreadPopUp,
            threadIdToDelete: threadId,

        });
    };

    deleteThread = () => {
        const {deleteConversation} = this.props;
        const {threadIdToDelete} = this.state;

        deleteConversation(threadIdToDelete);

        this.toggleDeletePopup();
    };

    getConversations(takeFirst: boolean = false, searchText: string = "") {
        const {getConversations} = this.props;
        Log.i("threads_count -> ", this.threads)
        const threadsCount = this.threads.size || this.threads.length;
        const threadType = this.state.onlyGroup ? CONVERSATION_TYPE.GROUP : CONVERSATION_TYPE.SINGLE;
        getConversations(Math.floor((takeFirst ? 1 : ((threadsCount + 1) / CONVERSATIONS_LIMIT) + 1)), threadType, true, searchText);
        takeFirst && (document.getElementById("threadContainer").scrollTop = 0);
    };

    hangUp = (e: React.MouseEvent<HTMLSpanElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        const {sendHangUp, lastCall} = this.props;
        if (lastCall) {
            sendHangUp(lastCall.get("id"), lastCall.get("to"), false);
        }
    };

    handleAcceptCall = (isVideo: boolean = false): void => {
        const {TOGGLE_IGNORE, lastCall} = this.props;
        if (lastCall) {
            TOGGLE_IGNORE(lastCall.get("id"), false, isVideo);
        }
    };

    handleDeclineCall = (): void => {
        const {declineCall, lastCall} = this.props;
        if (lastCall) {
            declineCall(lastCall.get("id"), lastCall.get("to"));
        }
    };

    handleToggleMic = (e: React.MouseEvent<HTMLSpanElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        const {lastCall, toggleMic} = this.props;
        if (lastCall) {
            toggleMic(lastCall.get("id"), lastCall.get('mic'));
        }
    };

    handleSearchMessagesScroll = (event: any): void => {
        const {app: {searchKeyword}, attemptShowMoreSearchMessages} = this.props;
        const element: any = event.target;
        if (element.scrollHeight - (element.offsetHeight + element.scrollTop) <= element.scrollHeight / 200) {
            attemptShowMoreSearchMessages(searchKeyword);
        }
    };

    handleSearchedMessageClick = (id: string, message: any, keyword: string): void => {
        const {attemptShowSearchedMessage, setSearchedMessageId} = this.props;
        attemptShowSearchedMessage(id, message, keyword);
        setSearchedMessageId(id);
    };

    get threads(): any {
        const {conversations, selectedThreadId, contacts, setSelectedThread, user, app: {searchKeyword, applicationState}, lastCall, languages, FETCH_THREAD, setSelectedThreadId,
            showConference, initialized, conferenceDetails, checkConference, pendingRequests} = this.props;
        const username = user.get("username");
        const filteredConversations = conversations.filter(conversation => {
            const thread = conversation.get("threads");
            const {isGroup, isProductContact} = getThreadType(thread.get("threadType"));
            const {threadInfo} = getThread(conversation, username, true);
            const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
            // const [name, phone, numbers] = threadInfo && threadInfo.size > 0 && [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];
            if(!threadInfo) {
                return false
            }
            const [name, phone, numbers] = threadInfo && [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];
            if (!name || (!isGroup && !isProductContact) || thread.get('threadId') === user.get('id')) {
                return false;
            }

            if (searchKeyword && !name.toLowerCase().includes(searchKeyword.toLowerCase())) {
                if (!phone) {
                    return false;

                } else if (!includesInNumbers(phone, numbers, searchKeyword)) {
                    return false;
                }
            }

            return true;
        });


        const conversationsWithDraft = filteredConversations.filter(conversation => conversation.getIn(['conversations', 'draft']));
        const conversationsWithoutDraft = filteredConversations.filter(conversation => !conversation.getIn(['conversations', 'draft']));

        const threads: any[] = [];
        const caller: any = lastCall && (lastCall.get('ownCall') ? lastCall.get('receiver') : lastCall.get('caller'));
        const selectedLanguage: string = languages && languages.get("selectedLanguage");

        if (lastCall && caller && filteredConversations.has(caller)) {
            const conversation: any = filteredConversations.get(caller);
            const thread: any = filteredConversations.getIn([caller, 'threads']);
            const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
            const draft = conversation.getIn(['conversations', 'draft']);
            const lastMessage = lastMessageId ? conversation.get("messages") : null;

            threads.push(
                <Thread
                    thread={conversation}
                    isOnline={applicationState.isOnline}
                    contacts={contacts}
                    key={thread.get("threadId")}
                    userId={username}
                    pendingRequests={pendingRequests}
                    fetchTread={(window as any).isRefactor ? FETCH_THREAD : setSelectedThread}
                    setSelectedThreadId={setSelectedThreadId}
                    selectedThreadId={selectedThreadId}
                    lastMessage={lastMessage}
                    selectedLanguage={selectedLanguage}
                    draft={draft}
                    lastCall={lastCall}
                    time={this.time}
                    hangUp={this.hangUp}
                    toggleMic={this.handleToggleMic}
                    toggleDeletePopup={this.toggleDeletePopup}
                    acceptCall={this.handleAcceptCall}
                    declineCall={this.handleDeclineCall}
                    conferenceInfo={{
                        showConference,
                        initialized,
                        threadId: conferenceDetails.getIn(['info', 'threadId']),
                        callId: conferenceDetails.get("callId")
                    }}
                    checkConference={checkConference}
                />
            );
        }

        conversationsWithDraft.map(conversation => {
            const thread = conversation.get("threads");
            if (caller === thread.get("threadId")) {
                return null;
            }
            if ((!thread.get('threadInfo') || thread.get('threadInfo').isEmpty()) && conversation.get("members") && conversation.get("members").isEmpty()) {
                return null;
            }
            const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
            const draft = conversation.getIn(['conversations', 'draft']);
            const lastMessage = lastMessageId ? conversation.get("messages") : null;

            threads.push(
                <Thread
                    thread={conversation}
                    contacts={contacts}
                    isOnline={applicationState.isOnline}
                    key={thread.get("threadId")}
                    userId={user.get("username")}
                    pendingRequests={pendingRequests}
                    fetchTread={(window as any).isRefactor ? FETCH_THREAD : setSelectedThread}
                    setSelectedThreadId={setSelectedThreadId}
                    selectedThreadId={selectedThreadId}
                    lastMessage={lastMessage}
                    selectedLanguage={selectedLanguage}
                    draft={draft}
                    toggleDeletePopup={this.toggleDeletePopup}
                    conferenceInfo={{
                        showConference,
                        initialized,
                        threadId: conferenceDetails.getIn(['info', 'threadId']),
                        callId: conferenceDetails.get("callId")
                    }}
                    checkConference={checkConference}
                />
            );

        });

        conversationsWithoutDraft.map(conversation => {
            const thread = conversation.get("threads");
            if (caller === thread.get("threadId")) {
                return null;
            }
            if ((!thread.get('threadInfo') || thread.get('threadInfo').isEmpty()) && conversation.get("members") && conversation.get("members").isEmpty()) {
                return null;
            }
            const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
            const lastMessage = lastMessageId ? conversation.get("messages") : null;

            threads.push(
                <Thread
                    thread={conversation}
                    contacts={contacts}
                    isOnline={applicationState.isOnline}
                    key={thread.get("threadId")}
                    userId={user.get("username")}
                    pendingRequests={pendingRequests}
                    fetchTread={(window as any).isRefactor ? FETCH_THREAD : setSelectedThread}
                    setSelectedThreadId={setSelectedThreadId}
                    selectedThreadId={selectedThreadId}
                    lastMessage={lastMessage}
                    selectedLanguage={selectedLanguage}
                    toggleDeletePopup={this.toggleDeletePopup}
                    conferenceInfo={{
                        showConference,
                        initialized,
                        threadId: conferenceDetails.getIn(['info', 'threadId']),
                        callId: conferenceDetails.get("callId")
                    }}
                    checkConference={checkConference}
                />
            );

        });

        // if (threads.length === 0) {
        //     const localization: any = components().threadsPanel;
        //
        //     return (
        //         <span className="no-info">
        //             <span className="no-info-title">{!searchKeyword ? localization.noThreadTitle : ""}</span>
        //             <span
        //                 className="no-info-text">{!searchKeyword ? localization.noThreadText : localization.noThreadSearchText}</span>
        //         </span>
        //     )
        // }

        return threads;
    }

    get time(): string {
        const {lastCall} = this.props;
        const {time} = this.state;

        if (lastCall && lastCall.get("status") === CALL_STATUSES.answering && time > 0) {
            return getCallTime(time, false);
        } else {
            return null;
        }
    }

    get popup(): JSX.Element {
        const {deleteThreadPopUp, threadIdToDelete} = this.state;
        const localization: any = components().threadsPanel;
        const {languages} = this.props;
        const selectedLanguage: string = languages && languages.get("selectedLanguage");
        return (
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
                    deleteThreadPopUp &&
                    <PopUpMain
                        confirmButton={this.deleteThread}
                        cancelButton={this.toggleDeletePopup}
                        confirmButtonText={localization.yes}
                        cancelButtonText={localization.cancel}
                        titleText={localization.deleteTitle}
                        infoText={selectedLanguage==='es' && isPublicRoom(threadIdToDelete) ?  localization.sureDelete.substr(0,localization.sureDelete.length - 2) + "e " + localization.group : localization.sureDelete + (isPublicRoom(threadIdToDelete) ? localization.group : " " + localization.conversation)}
                        showPopUpLogo={true}
                    />
                }
            </ReactCSSTransitionGroup>
        );
    }

    render(): JSX.Element {
        const {app: {searchKeyword}, messages, searchedMessages, searchedActiveMessage, conversations, user, selectedThreadId} = this.props;
        const searchClearButton: boolean = searchKeyword && searchKeyword !== "";

        const localization: any = components().searchMessages;
        const localization2: any = components().threadsPanel;

        const username = user.get("username");

        const filteredConversations = conversations.size > 0 && conversations.filter(conversation => {
            const thread = conversation && conversation.get('threads') ? conversation.get("threads") : '';
            const {isGroup, isProductContact} = getThreadType(thread.get("threadType"));
            const {threadInfo} = getThread(conversation, username, true);

            if(!threadInfo) {
                return false
            }
            const [name, phone, numbers] = threadInfo && [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];
            if (!name || (!isGroup && !isProductContact) || thread.get('threadId') === user.get('id')) {
                return false;
            }

            if (searchKeyword && !name.toLowerCase().includes(searchKeyword.toLowerCase())) {
                if (!phone) {
                    return false;

                } else if (!includesInNumbers(phone, numbers, searchKeyword)) {
                    return false;
                }
            }

            return true;
        });

        return (
            <div className="left_side">
                <div className="left_side_content">
                    <SearchInput
                        onChange={this.searchInputChange}
                        searchValue={this.state.value}
                        iconClassName="hidden"
                        handleSearchClear={this.handleSearchClear}
                        clearButton={searchClearButton}
                    />
                    <div id="threadContainer" className="chat-messages-content">
                        {!!filteredConversations.size && searchKeyword && <div className="search-in-chat-info">
                            <span className="search-messages-text">
                                {
                                    <h2>{`${localization.foundResult} ${filteredConversations.size} ${filteredConversations.size === 1 ? localization.chat : localization.chats}`}</h2>
                                }
                            </span>
                        </div>}
                        <Scrollbars
                            className="contacts_container chat-list"
                            ref="scrollbar"

                            style={{height: "auto"}}
                            // onMouseDown={() => {
                            //     this.scrollTop = 0
                            // }}
                            autoHide
                            autoHideTimeout={2000}
                            autoHideDuration={1000}
                        >
                            {this.threads}
                        </Scrollbars>
                        {!!searchedMessages.size && <div className="search-in-chat-info">
                            <span className="search-messages-text">
                                {
                                    <h2>{`${localization.foundResult} ${searchedMessages.size} ${searchedMessages.size === 1 ? localization.message : localization.messages}`}</h2>
                                }
                            </span>
                        </div>}
                        <div className="messages-results messages-results-search" onScroll={this.handleSearchMessagesScroll}>
                            {
                                searchedMessages && searchedMessages.size > 0 &&
                                searchedMessages.valueSeq().map(message => {
                                    const messageId: string = message && (message.get('messageId') || message.get('id'));
                                    const creatorId: string = message && message.get("creator");
                                    const own: any = message && message.get("own");
                                    const type: any = message && message.get("type");
                                    const time: any = message && message.get("time");
                                    const text: any = message && message.get("text");
                                    const conversationId: string = message && message.get("conversationId");

                                    const thread = conversations && conversations.get(conversationId) && conversations.get(conversationId).get("threads");

                                    if(!thread) {
                                        return null
                                    }

                                    const {isGroup} = getThreadType(thread.get("threadType"));

                                    const {threadInfo} = getThread(conversations.get(conversationId), user.get("username"), true);
                                    const userName: any = isGroup ? threadInfo.get("name") : `${threadInfo.get("firstName")} ${threadInfo.get("lastName")}`;
                                    const threadImage: any = {
                                        url: threadInfo.get("avatarUrl"),
                                        file: threadInfo.get("avatar"),
                                    };
                                    let searchedText: string = "";

                                    if (type === MESSAGE_TYPES.file) {
                                        const fileMessage: any = message ? JSON.parse(message.get("info")) : null;
                                        if (fileMessage) {
                                            searchedText = fileMessage.fileName + "." + fileMessage.fileType;
                                        }

                                    } else if ([MESSAGE_TYPES.text, MESSAGE_TYPES.image].includes(type)) {
                                        searchedText = emojify(text, true);
                                    } else if ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(type)) {
                                        searchedText = (
                                          text === OFFLINE_MESSAGE_BODY || text === "null") ? "" :
                                          ((type === MESSAGE_TYPES.stream_file && text &&
                                            text.match(/text="(.*?)"[ ]?\//)) ? text.match(/text="(.*?)"[ ]?\//)[1]
                                            : text);
                                    } else {
                                        searchedText = text;
                                    }
                                    let fileType: string;
                                    const localization = components().fileType;
                                    switch (type) {
                                        case MESSAGE_TYPES.file:
                                            fileType = `${localization.file}:`;
                                            break;
                                        case MESSAGE_TYPES.image:
                                            fileType = `${localization.photo}:`;
                                            break;
                                        case MESSAGE_TYPES.stream_file:
                                        case MESSAGE_TYPES.video:
                                            fileType = `${localization.video}:`;
                                            break;
                                        case MESSAGE_TYPES.text:
                                            fileType = `${localization.text}:`;
                                            break;
                                        case MESSAGE_TYPES.contact_with_info:
                                            fileType = `${localization.contact}:`;
                                            break;
                                        default:
                                            fileType = "";
                                            break;
                                    }
                                    const handleLoadedMessageClick: any = () => {

                                        if(selectedThreadId === conversationId) {
                                            this.handleSearchedMessageClick(messageId, message, searchKeyword)
                                        } else {
                                            this.props.setSelectedThread(conversations.get(conversationId).toJS(), false, "", () => {
                                                setTimeout(() => {
                                                    this.handleSearchedMessageClick(messageId, message, searchKeyword)
                                                }, 300)

                                            })
                                        }
                                    };
                                    const active: boolean = searchedActiveMessage === messageId;

                                    return (
                                      <div
                                        className={`searched-message-row${active ? " active-row" : ""}`}
                                        key={messageId}
                                        onClick={handleLoadedMessageClick}
                                      >
                                          <AvatarSize>
                                              <Avatar
                                                image={threadImage}
                                                color={threadInfo.getIn(["color", "numberColor"])}
                                                status={threadInfo.get("status")}
                                                avatarCharacter={threadInfo.get("avatarCharacter")}
                                                name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                                                meta={{threadId: creatorId}}
                                                avatarBlobUrl={threadInfo.get("avatarBlobUrl")}
                                                // userAvatar={own}
                                              />
                                          </AvatarSize>
                                          <div className="searched-message-info">
                                              <div className="creator-info">
                                                  <h2 className="creator-name">{userName}</h2>
                                                  <h2 className="message-time">{time !== 0 ? getFormattedDate({
                                                      date: time,
                                                      left: true
                                                  }) : ""}</h2>
                                              </div>
                                              <div className="searched-message-text">
                                                  {fileType && <h2 className="message-text message-type">{fileType}</h2>}
                                                  <h2 className="message-text">{searchedText}</h2>
                                              </div>
                                          </div>
                                      </div>
                                    )
                                })
                            }
                        </div>
                        {conversations.size === 0 ? <span className="no-info">
                            <span className="no-info-title">{localization2.noThreadTitle}</span>
                        </span> : (filteredConversations.size === 0 && searchedMessages.size === 0) ?  <span className="no-info">{localization.noResult}</span> : ""}
                    </div>
                </div>

                {this.popup}
            </div>
        );
    }
}


const mapStateToProps: any = state => selector(state, selectorVariables);

// const mapStateToProps: any = () => {
//   const languages = languagesSelector();
//     return (state, props) => {
//         return {
//             languages: languages(state, props),
//         }
//   }
// }

const mapDispatchToProps: any = dispatch => ({
    getConversations: (page, threadType, offset, searchText) => dispatch(attemptGetConversations(page, offset, threadType, searchText)),
    attemptLeaveGroup: (id, username) => dispatch(attemptLeaveOrRemoveMember(id, username, LEAVE_GROUP_COMMAND, true)),
    deleteConversation: (id) => dispatch(attemptRemoveConversation(id, true)),
    setSelectedThread: (thread, updateConversationTime, contactId, callback) => dispatch(attemptSetSelectedThread(thread, updateConversationTime, contactId, callback)),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    setSelectedThreadId: id => dispatch(setNewSelectedThreadId(id)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    setSearchKeyword: (keyword) => dispatch(setSearchKeyword(keyword)),
    attemptSearchMessages: (keyword, search) => dispatch(attemptSearchMessages(keyword, search)),
    attemptShowSearchedMessage: (id: string, message: any, text: string) => dispatch(attemptShowSearchedMessage(id, message, text)),
    removeSearchedMessageId: () => dispatch(removeSearchedMessageId()),
    attemptShowMoreSearchMessages: (text: string) => dispatch(attemptShowMoreSearchMessages(text)),
    setSearchedMessageId: (id: string) => dispatch(setSearchedMessageId(id)),

    sendHangUp: (id, to, outCall) => dispatch(sendHangUp(id, to, outCall)),
    toggleMic: (id, mic) => dispatch(toggleMic(id, mic)),
    acceptCall: (id, to, sdp) => dispatch(acceptCall(id, to, sdp)),
    declineCall: (id, to, outCall) => dispatch(declineCall(id, to, outCall)),
    TOGGLE_IGNORE: (id: string, ignored?: boolean, isVideo?: boolean) => dispatch(TOGGLE_IGNORE(id, ignored, isVideo)),
    FETCH_THREAD: (threadId: string) => dispatch(FETCH_THREAD(threadId)),

    // Conference call actions start

    checkConference: (groupId: string, callId: string) => dispatch(join(groupId, callId)),

    // Conference call actions end
});

export default connect(mapStateToProps, mapDispatchToProps)(ThreadsPanel);
