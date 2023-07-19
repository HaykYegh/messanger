"use strict";

import * as React from "react";
import {Map, Seq} from "immutable";
import isEqual from "lodash/isEqual";
import {connect, Store} from "react-redux";

import {
    GROUP_MESSAGES_LIMIT,
    IMAGE_TOGGLE,
    LOAD_STATUS,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    MESSAGES_LIMIT,
    VIDEO_TOGGLE
} from "configs/constants";
import {
    hasMoreBottomMessagesSelector,
    hasMoreTopMessagesSelector,
    isMessagesInitializedSelector,
    isMessagesLoadingSelector,
    newMessagesSelector
} from "modules/messages/MessagesSelector";
import {bulkUpdateMessageProperties, downloadFile, FETCH_MESSAGES} from "modules/messages/MessagesActions";
import DateBubble from "containers/chat-panel-refactor/chat-container/bubblesComponent/DateBubble/Index";
import Message from "containers/chat-panel-refactor/chat-container/bubblesComponent/Index";
import {applicationStateSelector, selectedThreadIdSelector} from "modules/application/ApplicationSelector";
import EmptyChatMessage from "components/chat/EmptyChatMessage";
import {getThread, getThreadType} from "helpers/DataHelper";
import SplashScreen from "components/common/SplashScreen";
import {IMessage} from "modules/messages/MessagesReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import {ISticker} from "modules/settings/SettingsReducer";
import IDBMessage from "services/database/class/Message";
import {getContactbyId} from "helpers/ContactsHelper";
import {IGroup} from "modules/groups/GroupsReducer";
import storeCreator from "helpers/StoreHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import {ADD_MEDIA_RECORD, UPDATE_MEDIA_RECORD} from "modules/application/ApplicationActions";
import {isSystemMessage} from "helpers/MessageHelper";
import {handleScrollShow} from "helpers/DomHelper";
import {ChatContainerContent} from "containers/chat-panel-refactor/chat-container/style";
import Log from "modules/messages/Log";

interface IChatContainerState {
    isMessagesLoadingBottom: boolean;
    isMessagesLoadingTop: boolean;
}

interface IChatContainerProps {
    togglePopUp: (type: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    onRightClick: (event: React.MouseEvent<HTMLDivElement>) => void;
    toggleMap: (lat: number, lng: number, location: string) => void;
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value) => void;
    attemptSetStickersIcons: (id: string) => void;
    deleteMessage: (msgId) => void;
    createMessage: (message: any) => void;
    uploadFile: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId: string) => void;
    setContainerRef: (ref: HTMLDivElement) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    handleDrop: (accepted: Array<File>) => void;
    handleDownScrollShowMoreMessages: () => void;
    handleDragEnter: () => void;
    handleDragLeave: () => void;
    stickers: Map<string, ISticker>;
    contacts: Map<string, IContact>;
    messages: Seq.Indexed<IMessage>;
    messagesMap: Map<string, IMessage>;
    displayMessagesCount: number;
    thread: IContact | IGroup;
    handleShowMoreMessages: () => void;
    minimized: boolean;
    dropzoneActive: boolean;
    searchedActiveMessage: string;
    showChat: boolean;
    user: any;
    languages: any;
    gifMessages: any;
    selectedContact?: any,
    sharedMediaPanel: boolean;
    messagesLoadStatus: any;
    showSharedMedia: boolean;
    setShowSharedMedia: (showSharedMedia: boolean) => void;
    handleNetworkJoin: (keyword: string, token: boolean) => void;
    addSharedMediaMessages: (messageId: string, message: any) => void;
    showMore: boolean;
    toggleDropEventListeners: (remove?: boolean) => void;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,

    attemptSetSelectedThread: (threadId: any) => void;

    isMessagesLoading?: boolean;
    hasMoreBottomMessages?: boolean;
    hasMoreTopMessages?: boolean
    isMessagesInitialized?: boolean
    threadId?: string;
    applicationState?: any;

    FETCH_MESSAGES: (threadId: string, messageId?: string, toTopDirection?: boolean) => void;

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
}

class ChatContainer extends React.Component<IChatContainerProps, IChatContainerState> {

    private readonly chatContainerRef: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);
        this.chatContainerRef = React.createRef();
        this.state = {
            isMessagesLoadingBottom: false,
            isMessagesLoadingTop: false,
        }
    }

    messageUpdateQueue: any = [];
    messageDBUpdateQueue: any = [];
    downloadFileQueue: any = [];
    lastMessageId: string = null;

    componentDidMount(): void {
        this.props.toggleDropEventListeners();
    }

    shouldComponentUpdate(nextProps: IChatContainerProps, nextState: IChatContainerState): boolean {

        if (!isEqual(this.props.messages, nextProps.messages)) {
            return true;
        }

        if (!isEqual(this.props.user, nextProps.user)) {
            return true;
        }

        if (!isEqual(this.props.stickers, nextProps.stickers)) {
            return true;
        }

        if (!this.props.languages.get('selectedLanguage') !== nextProps.languages.get('selectedLanguage')) {
            return true;
        }

        if (this.props.threadId !== nextProps.threadId) {
            return true;
        }

        if (this.state.isMessagesLoadingTop ! == nextState.isMessagesLoadingTop) {
            return true;
        }

        return this.state.isMessagesLoadingBottom ! == nextState.isMessagesLoadingBottom;

        // if (!gifMessages.equals(nextProps.gifMessages)) {
        //     return true;
        // }
        //

        //
        // if (!contacts.equals(nextProps.contacts)) {
        //     return true;
        // }
        //
        // if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
        //     return true;
        // }

        //
        //
        // if (!selectedContact.equals(nextProps.selectedContact)
        //     && selectedContact.getIn(["conversations", "typing"]) === nextProps.selectedContact.getIn(["conversations", "typing"])
        //     && selectedContact.getIn(["members", selectedContact.getIn(["conversations", "threadId"]), "lastActivity"]) === nextProps.selectedContact.getIn(["members", nextProps.selectedContact.getIn(["conversations", "threadId"]), "lastActivity"])
        //     && selectedContact.getIn(["members", selectedContact.getIn(["conversations", "threadId"]), "status"]) === nextProps.selectedContact.getIn(["members", nextProps.selectedContact.getIn(["conversations", "threadId"]), "status"])
        // ) {
        //     return true;
        // }
        //
        // if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
        //     return true;
        // }

        //
        // if (showChat !== nextProps.showChat) {
        //     return true;
        // }
        //
        // if (minimized !== nextProps.minimized) {
        //     return true;
        // }
        //
        // if (dropzoneActive !== nextProps.dropzoneActive) {
        //     return true;
        // }
        //
        // if (showMore !== nextProps.showMore) {
        //     return true;
        // }
        //
        // if (isMessagesLoading !== nextState.isMessagesLoading) {
        //     return true;
        // }
        //
        // if (nextProps.messagesLoadStatus && !nextProps.messagesLoadStatus.equals(messagesLoadStatus)) {
        //     return true;
        // }
        //
        //
        // // refactored
        //

        //
        // return displayMessagesCount !== nextProps.displayMessagesCount;
    }

    componentDidUpdate(prevProps: Readonly<IChatContainerProps>, prevState: Readonly<IChatContainerState>, snapshot?: any): void {
        const chatContainerRef: HTMLDivElement = this.chatContainerRef.current;

        if (snapshot) {
            if (snapshot.position && chatContainerRef) {

                if (snapshot.isDirectionTop) {
                    chatContainerRef.scrollTop = chatContainerRef.scrollHeight - snapshot.position;
                    this.setState({isMessagesLoadingBottom: false, isMessagesLoadingTop: false});
                } else {
                    // if scroll height is big than window height / not scroll
                    chatContainerRef.scrollTo({
                        top: chatContainerRef.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }
        }

        // scroll to bottom at once when received first messages data
        if (prevProps.isMessagesInitialized !== this.props.isMessagesInitialized && this.props.isMessagesInitialized) {
            const selectedThread: any = this.props.thread;
            let unreadMessagesCount: number = 0;
            if (selectedThread) {
                unreadMessagesCount = selectedThread.getIn(['conversations', 'newMessagesCount']) || 0;
            }

            if (chatContainerRef) {
                if (unreadMessagesCount > MESSAGES_LIMIT) {
                    chatContainerRef.scrollTop = chatContainerRef.scrollHeight - chatContainerRef.offsetHeight - 1;
                } else {
                    chatContainerRef.scrollTop = chatContainerRef.scrollHeight;
                }

            }
        }
    }

    getSnapshotBeforeUpdate(prevProps: Readonly<IChatContainerProps>, prevState: Readonly<IChatContainerState>): any {
        if (this.props.isMessagesInitialized && prevProps.messages.size < this.props.messages.size) {
            const chatContainerRef: HTMLDivElement = this.chatContainerRef.current;
            if (chatContainerRef) {
                const isDirectionTop: boolean = chatContainerRef.scrollTop === 0;
                return {
                    position: chatContainerRef.scrollHeight - chatContainerRef.scrollTop,
                    isDirectionTop
                };
            }
            return null;
        }
        return null;
    }

    componentWillUnmount(): void {
        this.props.toggleDropEventListeners(true);
    }

    updateMessageProperty = (msgId: string, property: string, value: string, updateToDB?: boolean) => {
        if ((window as any).messagesUpdateTimer) {
            clearTimeout((window as any).messagesUpdateTimer)
        }
        const updateRow = {msgId, property, value};
        if (updateToDB === true) {
            this.messageDBUpdateQueue.push(updateRow);
        } else {
            this.messageUpdateQueue.push(updateRow);
        }

        (window as any).messagesUpdateTimer = setTimeout(async () => {
            const store: Store<any> = storeCreator.getStore();
            this.messageUpdateQueue.length > 0 && store.dispatch(bulkUpdateMessageProperties(this.messageUpdateQueue));
            if (this.messageDBUpdateQueue.length > 0) {
                await IDBMessage.messageBulkUpdateDimensions(this.messageDBUpdateQueue);
            }

            this.messageUpdateQueue = [];
            this.messageDBUpdateQueue = [];
            (window as any).messagesUpdateTimer = null;
        }, 50)
    };

    downloadFile = (downloadInfo: any) => {
        if ((window as any).downloadFileTimer) {
            clearTimeout((window as any).downloadFileTimer)
        }
        this.downloadFileQueue.push(downloadInfo);
        (window as any).downloadFileTimer = setTimeout(() => {
            const store: Store<any> = storeCreator.getStore();
            this.downloadFileQueue = this.downloadFileQueue.sort(function (a, b) {
                return (a.time > b.time)
            });

            for (let i = this.downloadFileQueue.length - 1; i >= 0; i--) {
                store.dispatch(downloadFile(this.downloadFileQueue[i]));
            }

            this.downloadFileQueue = [];
            (window as any).downloadFileTimer = null;
        }, 50)
    };

    handleMessagesScroll = (event: any) => {
        handleScrollShow(event);
        event.preventDefault();
        const {messages, threadId, FETCH_MESSAGES, isMessagesLoading, hasMoreTopMessages, hasMoreBottomMessages} = this.props;
        const chatContainerRef: HTMLDivElement = this.chatContainerRef.current;
        const topDistance: number = chatContainerRef.scrollTop + chatContainerRef.offsetHeight;
        const scrollHeight: number = chatContainerRef.scrollHeight;
        let toTopDirection: boolean = false;
        let messageId: string = "";

        if (chatContainerRef.scrollTop === 0) {

            Log.i("TOP");
            toTopDirection = true;
            if (messages.first()) {
                messageId = messages.first().get("messageId")
            }

            Log.i(`messageId:${messageId}, toTopDirection:${toTopDirection}`);
            if (!isMessagesLoading && hasMoreTopMessages) {
                this.setState({isMessagesLoadingBottom: false, isMessagesLoadingTop: true});
                FETCH_MESSAGES(threadId, messageId, toTopDirection);
            }
        }

        if (topDistance === scrollHeight) {
            Log.i("BOTTOM");

            if (messages.last()) {
                messageId = messages.last().get("messageId")
            }

            toTopDirection = false;
            Log.i(`messageId:${messageId}, toTopDirection:${toTopDirection}`);

            if (!isMessagesLoading && hasMoreBottomMessages) {
                this.setState({isMessagesLoadingBottom: true, isMessagesLoadingTop: false});
                FETCH_MESSAGES(threadId, messageId, toTopDirection);
            }
        }

    };

    get messageBubbles(): any {
        const {
            messages, togglePopUp, thread, messagesLoadStatus, showSharedMedia, setShowSharedMedia,
            toggleMap, contacts, user, onRightClick, stickers, updateMessageProperty, deleteMessage,
            languages, inviteToCall, selectedContact, handleAudioChange, attemptSetCreateContactNumber,
            uploadFile, createMessage, resetConversationLastMessage, sharedMediaPanel,
            attemptOptimiseVideo, gifMessages, attemptSetStickersIcons, searchedActiveMessage, handleNetworkJoin,
            attemptCreateContact, attemptSetSelectedThread, UPDATE_MEDIA_RECORD, ADD_MEDIA_RECORD, applicationState,
            forwardMessage, handleMessageReply, handleMessageDelete
        } = this.props;
        const localization: any = components().messagesContainer;
        const members: Map<any, any> = thread.get('members');
        const {isGroup} = getThreadType(thread.getIn(['threads', 'threadType']));
        const selectedThread: any = getThread(selectedContact, user.get("username"));
        const messages_limit: number = isGroup ? GROUP_MESSAGES_LIMIT : MESSAGES_CHAT_LIMIT;
        const messagesLoadedByShowMore = messages.size > messages_limit;

        const bubblesContainers: any[] = [];
        const lastMessage: IMessage = messages.last();
        let currentDate: any = null;
        let currentBubbles: any[] = [];
        let lastDate: number = null;

        const tempMessages: any = messages.valueSeq();


        if (messages) {
            function getTimeDifference(prev, next) {
                const nextDay: number = new Date(next).getDay();
                const prevDay: number = new Date(prev).getDay();
                return nextDay === prevDay ? 0 : 1;
            }

            const [...messageIds]: any = messages.keys();
            let index: number = 0;

            for (const messageId of messageIds) {
                const message: IMessage = messages.get(messageId);

                if (message.get('hidden')) {
                    return null;
                }

                if ([
                    MESSAGE_TYPES.room_call_ringing,
                    MESSAGE_TYPES.room_call_decline,
                    MESSAGE_TYPES.room_call_current_members,
                    MESSAGE_TYPES.room_call_video
                ].includes(message.get("type"))) {
                    return null;
                }

                let creator: IContact = user.get("id") === message.get("creator") ? user : members && members.get(message.get("creator"));
                if (!creator) {
                    creator = getContactbyId(message.get("creator"));
                }
                const msgId: string = message.get("messageId") || message.get("id");
                if (messagesLoadStatus && message.get("loadStatus") === LOAD_STATUS.LOAD_START && messagesLoadStatus.get(msgId)) {
                    const messageLoadStatus = messagesLoadStatus.getIn([msgId, "loadStatus"]);
                    messageLoadStatus !== LOAD_STATUS.LOAD_START && updateMessageProperty(msgId, "loadStatus", messageLoadStatus);
                }

                let lastAuthor: string = "";
                let nextAuthor: string = "";
                let isNextMessageSystemMessage: boolean = false;
                let lastMessageType = "";
                let lastMessageDeleted = "";
                let penultimate: boolean = false;
                let lastSeen: boolean = false;
                let lastDelivered: boolean = false;

                const prevMessage: any = tempMessages.get(index - 1);
                if (index > 0) {
                    lastMessageType = prevMessage.get("type");
                    lastMessageDeleted = prevMessage.get("deleted");
                }

                if (index > 0 && prevMessage.get("creator") === user.get("id")) {
                    lastAuthor = user.get("username");
                } else if (index !== 0) {
                    lastAuthor = prevMessage.get("creator").replace(/@[^@]+$/, '');
                }

                if (tempMessages.getIn([index + 1, "creator"]) && tempMessages.getIn([index + 1, "creator"]) === user.get("id")) {
                    nextAuthor = user.get("username");
                } else if (tempMessages.getIn([index + 1, "creator"])) {
                    nextAuthor = tempMessages.getIn([index + 1, "creator"]).replace(/@[^@]+$/, '');
                } else {
                    nextAuthor = "1";
                }

                if (messages.getIn([index + 1, "deleted"]) || messages.getIn([index + 1, "type"]) && isSystemMessage(messages.getIn([index + 1, "type"]))) {
                    isNextMessageSystemMessage = true;
                } else if (((new Date(messages.getIn([index, "time"]))).toDateString() !== (new Date(messages.getIn([index + 1, "time"]))).toDateString())) {
                    isNextMessageSystemMessage = true;
                }

                const threadType = thread.getIn(['threads', 'threadType']);
                const {isGroup} = getThreadType(threadType);

                const repid = messages.get(message.get("repid"));


                let textToReply: any = "";


                let nameToReplay: any = "";

                if (repid) {
                    textToReply = emojify(repid.get("text"), false);


                    if (messages.getIn([message.get("repid"), "own"])) {
                        nameToReplay = localization.you;
                    } else if (isGroup) {
                        nameToReplay = members.getIn([messages.getIn([message.get("repid"), "creator"]), "name"]);
                        /*contacts.getIn([)*/
                    } else {
                        nameToReplay = members.getIn([messages.getIn([message.get("repid"), "creator"]), "name"]);
                        thread.get("name")/*contacts.getIn([message.get("threadId"), "name"])*/;
                    }
                }

                if (!lastDate) {
                    lastDate = message.get("time");
                    currentDate = <DateBubble date={lastDate}/>;
                }

                const bubble: any = (
                    <Message
                        key={messageId}
                        attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                        last={messages.size === index + 1}
                        lastSeen={lastSeen}
                        lastDelivered={lastDelivered}
                        penultimate={penultimate}
                        selectedContact={selectedContact}
                        isGroup={isGroup}
                        userId={user.get("username")}
                        onRightClick={onRightClick}
                        inviteToCall={inviteToCall}
                        togglePopUp={togglePopUp}
                        handleAudioChange={handleAudioChange}
                        lastAuthor={lastAuthor}
                        nextAuthor={nextAuthor}
                        lastMessageType={lastMessageType}
                        lastMessageDeleted={lastMessageDeleted}
                        attemptOptimiseVideo={attemptOptimiseVideo}
                        downloadFile={this.downloadFile}
                        uploadFile={uploadFile}
                        resetConversationLastMessage={resetConversationLastMessage}
                        updateMessageProperty={this.updateMessageProperty}
                        deleteMessage={deleteMessage}
                        createMessage={createMessage}
                        textToReply={textToReply}
                        nameToReplay={nameToReplay}
                        toggleMap={toggleMap}
                        stickers={stickers}
                        message={message}
                        creator={creator}
                        languages={languages}
                        selectedThread={selectedThread}
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        showSharedMedia={showSharedMedia}
                        setShowSharedMedia={setShowSharedMedia}
                        gifMessages={gifMessages}
                        attemptSetStickersIcons={attemptSetStickersIcons}
                        replyingMessage={repid}
                        messagesLoadedByShowMore={messagesLoadedByShowMore}
                        searchedActiveMessage={searchedActiveMessage}
                        handleNetworkJoin={handleNetworkJoin}
                        attemptCreateContact={attemptCreateContact}

                        attemptSetSelectedThread={attemptSetSelectedThread}
                        contacts={contacts}

                        isOnline={applicationState.get('isOnline')}

                        ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                        UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}

                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handleMessageDelete={handleMessageDelete}

                        isNextMessageSystemMessage={isNextMessageSystemMessage}
                    />
                );

                if (lastDate !== message.get("time") && getTimeDifference(lastDate, message.get("time")) >= 1) {
                    const currentBubbleContainer: any = (
                        <div key={lastDate}>{currentDate}{currentBubbles}</div>
                    );

                    bubblesContainers.push(currentBubbleContainer);
                    currentBubbles = [bubble];
                    lastDate = message.get("time");
                    currentDate = <DateBubble date={lastDate}/>

                } else {
                    currentBubbles.push(bubble);
                }

                if (messageId === lastMessage.get("messageId")) {
                    const currentBubbleContainer: any = (
                        <div key={lastDate}>{currentDate}{currentBubbles}</div>
                    );
                    bubblesContainers.push(currentBubbleContainer);
                }

                index++;
            }

            return bubblesContainers;
        }

        return undefined;
    }

    render() {
        const {
            minimized, showChat, thread, user, messages, isMessagesLoading, isMessagesInitialized
        } = this.props;
        const {isMessagesLoadingBottom, isMessagesLoadingTop} = this.state;
        const threadIsEmpty: boolean = thread.get("threads").isEmpty();

        if (threadIsEmpty) {
            return <SplashScreen user={user}/>
        }

        if (!threadIsEmpty && isMessagesInitialized && messages && messages.size === 0) {
            return <EmptyChatMessage showRightPanel={false}/>;
        }

        if (!threadIsEmpty && isMessagesInitialized) {
            return (
                <ChatContainerContent
                    className={`right_side_content${showChat && !minimized ? " show-chat-content" : ""}`}
                    onScroll={this.handleMessagesScroll}
                    onClick={handleScrollShow}
                    onMouseDown={handleScrollShow}
                    onMouseUp={handleScrollShow}
                    onMouseEnter={handleScrollShow}
                    ref={this.chatContainerRef}
                >
                    {this.messageBubbles}

                    {
                        isMessagesLoading &&
                        <div
                            className={`message-loading${isMessagesLoadingBottom ? ' bottom' : ''}${isMessagesLoadingTop ? ' top' : ''}`}>
                            <div className="loader">
                                <div className="circular-loader">
                                    <div className="loader-stroke">
                                        <div className="loader-stroke-left"/>
                                        <div className="loader-stroke-right"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </ChatContainerContent>
            );
        }

        if (!isMessagesInitialized) {
            return (
                <div className="message-loading">
                    <div className="loader">
                        <div className="circular-loader">
                            <div className="loader-stroke">
                                <div className="loader-stroke-left"/>
                                <div className="loader-stroke-right"/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    }
}

const mapStateToProps = () => {
    const isMessagesLoading = isMessagesLoadingSelector();
    const hasMoreBottomMessages = hasMoreBottomMessagesSelector();
    const hasMoreTopMessages = hasMoreTopMessagesSelector();
    const isMessagesInitialized = isMessagesInitializedSelector();
    const threadId = selectedThreadIdSelector();
    const messages = newMessagesSelector();
    const applicationState = applicationStateSelector();

    return (state, props) => {
        return {
            isMessagesLoading: isMessagesLoading(state, props),
            hasMoreBottomMessages: hasMoreBottomMessages(state, props),
            hasMoreTopMessages: hasMoreTopMessages(state, props),
            isMessagesInitialized: isMessagesInitialized(state, props),
            threadId: threadId(state, props),
            messages: messages(state, props),
            applicationState: applicationState(state, props),
        }
    }
};

const mapDispatchToProps: any = dispatch => ({
    FETCH_MESSAGES: (threadId: string, messageId?: string, toTopDirection?: boolean) => dispatch(FETCH_MESSAGES(threadId, messageId, toTopDirection)),
    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => dispatch(ADD_MEDIA_RECORD(sharedMediaType, sharedMediaRecords)),
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => dispatch(UPDATE_MEDIA_RECORD(sharedMediaType, messageId, property, sharedMediaUpdater)),

});

export default connect(mapStateToProps, mapDispatchToProps)(ChatContainer);














