"use strict";

import * as React from "react";
import {Store} from "react-redux";
import {Map, Seq} from "immutable";

import {
    GROUP_MESSAGES_LIMIT,
    IMAGE_TOGGLE,
    LOAD_STATUS,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    VIDEO_TOGGLE
} from "configs/constants";
import {bulkUpdateMessageProperties, downloadFile} from "modules/messages/MessagesActions";
import {getThread, getThreadType} from "helpers/DataHelper";
import {IMessage} from "modules/messages/MessagesReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import {ISticker} from "modules/settings/SettingsReducer";
import IDBMessage from "services/database/class/Message";
import {getContactbyId} from "helpers/ContactsHelper";
import {handleScrollShow} from "helpers/DomHelper";
import {IGroup} from "modules/groups/GroupsReducer";
import storeCreator from "helpers/StoreHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import MessageDate from "./MessageDate";
import Message from "./Message";
import {isSystemMessage} from "helpers/MessageHelper";
import {RightSideContent} from "components/messages/style";
import Log from "modules/messages/Log";

interface IMessagesContainerState {
    isMessagesLoading: boolean;
    isMessagesLoadingDown: boolean;
    isOfflineMessagesLoading: boolean;
    conversationLastMessageId: string;
}

interface IMessagesContainerProps {
    togglePopUp: (type: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    onRightClick: (event: React.MouseEvent<HTMLDivElement>) => void;
    toggleMap: (lat: number, lng: number, location: string) => void;
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value) => void;
    attemptSetStickersIcons: (id: string, callback: Function, iconId: string) => void;
    deleteMessage: (msgId) => void;
    createMessage: (message: any) => void;
    uploadFile: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId: string) => void;
    setContainerRef: (ref: HTMLDivElement) => void;
    // setContainerRef: any;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    handleDownScrollShowMoreMessages: () => void;
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
    showMore: boolean;
    toggleDropEventListeners: (remove?: boolean) => void;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,
    isOnline: boolean;
    showRightPanel: boolean;
    animationLeftLength: number;
    animationRightLength: number;
    groupTextAnimationLeftLength: number;
    groupTextAnimationRightLength: number;
    selectedThreadId: string;
    selectedConversation: any;

    attemptSetSelectedThread: (threadId: any, callback?: Function) => void;

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void

    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handleShowInFolder: (message?: any) => void;
    caches?: any;
}

export default class MessagesContainer extends React.Component<IMessagesContainerProps, IMessagesContainerState> {

    constructor(props) {
        super(props);
        this.state = {
            isMessagesLoading: false,
            isMessagesLoadingDown: false,
            isOfflineMessagesLoading: false,
            conversationLastMessageId: ""
        }
    }

    messageUpdateQueue: any = [];
    messageDBUpdateQueue: any = [];
    downloadFileQueue: any = [];
    lastMessageId: string = null;

    componentDidMount(): void {
        document.getElementById("chatBackground").addEventListener("scroll", this.handleDocumentScroll, true);

        // document.getElementById("chatBackground").scrollTop = document.getElementById("chatBackground").scrollHeight;
        // test if this is needed
        // window.addEventListener("resize", this.calculateDayBubbleHeight);
        // // this.calculateDayBubbleHeight();
        // // setTimeout(this.calculateDayBubbleHeight, 500);
        // // setTimeout(this.calculateDayBubbleHeight, 1000);
        // // setTimeout(this.calculateDayBubbleHeight, 1500);
        // // setTimeout(this.calculateDayBubbleHeight, 2000);
        // // setTimeout(this.calculateDayBubbleHeight, 2500);
        // test if this is needed
        this.props.toggleDropEventListeners();
    }

    shouldComponentUpdate(nextProps: IMessagesContainerProps, nextState: IMessagesContainerState): boolean {
        const {messagesMap, messages, contacts, displayMessagesCount, user, stickers, minimized, showChat, selectedContact, dropzoneActive, showMore, languages, sharedMediaPanel, messagesLoadStatus, gifMessages, searchedActiveMessage, isOnline, showRightPanel} = this.props;

        const {isMessagesLoading} = this.state;

        if (!messagesMap.equals(nextProps.messagesMap)) {
            return true;
        }

        if (!gifMessages.equals(nextProps.gifMessages)) {
            return true;
        }

        if (nextProps.selectedThreadId !== this.props.selectedThreadId) {
            return true;
        }
        if (
          nextProps.showRightPanel !== this.props.showRightPanel
          || nextProps.animationRightLength !== this.props.animationRightLength
          || nextProps.animationLeftLength !== this.props.animationLeftLength
        ) {
            return true;
        }

        if (!messages.equals(nextProps.messages)) {
            return true;
        }

        if (!contacts.equals(nextProps.contacts)) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (!user.equals(nextProps.user)) {
            return true;
        }

        if (!stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (selectedContact
            && nextProps.selectedContact
            && !selectedContact.equals(nextProps.selectedContact)
            && selectedContact.getIn(["conversations", "typing"]) === nextProps.selectedContact.getIn(["conversations", "typing"])
            && selectedContact.getIn(["members", selectedContact.getIn(["conversations", "threadId"]), "lastActivity"]) === nextProps.selectedContact.getIn(["members", nextProps.selectedContact.getIn(["conversations", "threadId"]), "lastActivity"])
            && selectedContact.getIn(["members", selectedContact.getIn(["conversations", "threadId"]), "status"]) === nextProps.selectedContact.getIn(["members", nextProps.selectedContact.getIn(["conversations", "threadId"]), "status"])
        ) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (!languages.equals(nextProps.languages)) {
            return true;
        }

        if (showChat !== nextProps.showChat) {
            return true;
        }

        if (minimized !== nextProps.minimized) {
            return true;
        }

        if (dropzoneActive !== nextProps.dropzoneActive) {
            return true;
        }

        if (showMore !== nextProps.showMore) {
            return true;
        }

        // if (isMessagesLoading !== nextState.isMessagesLoading) {
        //     return true;
        // }

        if (nextProps.messagesLoadStatus && !nextProps.messagesLoadStatus.equals(messagesLoadStatus)) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true;
        }

        return displayMessagesCount !== nextProps.displayMessagesCount;

    }

    componentDidUpdate(prevProps: IMessagesContainerProps): void {
        const {messages, selectedThreadId} = this.props;
        // if (!messages.equals(prevProps.messages)) {
        //     this.setState({
        //         isMessagesLoading: !this.state.isMessagesLoading,
        //     });
        // }

        if(selectedThreadId !== prevProps.selectedThreadId) {
            this.setState({conversationLastMessageId: ""})
        }

        if (this.state.isMessagesLoading && !messages.equals(prevProps.messages)) {
            this.setState({
                isMessagesLoading: false,
                isOfflineMessagesLoading: false,
            });
        }

        if (this.state.isMessagesLoadingDown && !messages.equals(prevProps.messages)) {
            this.setState({
                isMessagesLoadingDown: false,
            });
        }

        // check if this is needed
        //This is antipattern and should be changed in future
        // this.calculateDayBubbleHeight();
        // setTimeout(this.calculateDayBubbleHeight, 500);
        // setTimeout(this.calculateDayBubbleHeight, 1000);
        // setTimeout(this.calculateDayBubbleHeight, 1500);
        // setTimeout(this.calculateDayBubbleHeight, 2000);
        // setTimeout(this.calculateDayBubbleHeight, 2500);
        // check if this is needed
    }

    componentWillUnmount(): void {
        if(document.getElementById("chatBackground")) {
            document.getElementById("chatBackground").removeEventListener("scroll", this.handleDocumentScroll, true);
        }

        window.removeEventListener("resize", this.calculateDayBubbleHeight);
        this.props.toggleDropEventListeners(true);
    }

    changeConversationLastMessageId = (msgId: string): void => {
        this.setState({conversationLastMessageId: msgId})
    }

    calculateDayBubbleHeight = (): void => {
        const elements: any[] = Array.from(document.getElementsByClassName("day-data-wrapper"));
        for (let i: number = 0; i < elements.length; i++) {
            const currentNode = elements[i];
            if (i != elements.length - 1) {
                currentNode.firstChild.style.height = elements[i + 1].offsetTop - currentNode.parentElement.offsetTop + 10 + "px";

            } else {
                currentNode.firstChild.style.height = currentNode.parentElement.parentElement.offsetHeight - currentNode.parentElement.offsetTop + 10 + "px";
            }
        }
    };

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
                this.messageDBUpdateQueue.map(async item => {
                    if (item.property === 'm_options') {
                        await IDBMessage.messageBulkUpdateDimensions(item);
                    } else {
                        await IDBMessage.update(msgId, {[item.property]: item.value})
                    }
                })
                store.dispatch(bulkUpdateMessageProperties(this.messageDBUpdateQueue));
            }

            this.messageUpdateQueue = [];
            this.messageDBUpdateQueue = [];
            (window as any).messagesUpdateTimer = null;
        }, 0)
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

    handleDocumentScroll = (event) => {
        const {handleShowMoreMessages, showMore, handleDownScrollShowMoreMessages} = this.props;
        const target = event.target;



        //Target clientHeight is checked for preventing scroll action to work when chat is just opened
        // if (target.scrollTop < 49 && target.clientHeight > 30 && showMore) {
        if (target.scrollTop < 49 && target.clientHeight > 30) {

            if (!this.state.isMessagesLoading && navigator.onLine) {
                // if (!this.state.isMessagesLoading && navigator.onLine) {
                if (navigator.onLine) {
                    this.setState({
                        isMessagesLoading: true,
                    });
                    Log.i("showMore -> message = ", event)
                    handleShowMoreMessages();
                } else if (!this.state.isOfflineMessagesLoading && !navigator.onLine) {
                    this.setState({
                        isMessagesLoading: false,
                        isOfflineMessagesLoading: true
                    });
                    handleShowMoreMessages();
                }

            }
            if (target.scrollHeight - (target.offsetHeight + target.scrollTop) <= target.scrollHeight / 200) {
                if (!this.state.isMessagesLoadingDown && navigator.onLine) {
                    this.setState({
                        isMessagesLoadingDown: true,
                    });
                    // handleDownScrollShowMoreMessages();
                }
            }
        }
    };

    isSystemMessage = (message): boolean => {
        return [
            MESSAGE_TYPES.leave_group,
            MESSAGE_TYPES.join_group,
            MESSAGE_TYPES.remove_from_group,
            MESSAGE_TYPES.update_group_avatar,
            MESSAGE_TYPES.update_group_name,
            MESSAGE_TYPES.room_call_start,
            MESSAGE_TYPES.room_call_join,
            MESSAGE_TYPES.room_call_leave,
            MESSAGE_TYPES.room_call_end,
            MESSAGE_TYPES.delete_room,
            MESSAGE_TYPES.create_room
        ].includes(message.get('type'));
    }

    render() {
        const {
            messagesMap, togglePopUp, thread, messages, setContainerRef, messagesLoadStatus, showSharedMedia, setShowSharedMedia, toggleMap, contacts, displayMessagesCount, handleShowMoreMessages, user, onRightClick, stickers, minimized, updateMessageProperty, deleteMessage, languages,
            showChat, showMore, inviteToCall, selectedContact, handleAudioChange, attemptSetCreateContactNumber, dropzoneActive, downloadFile, uploadFile, createMessage, resetConversationLastMessage, ADD_MEDIA_RECORD,
            sharedMediaPanel, attemptOptimiseVideo, gifMessages, attemptSetStickersIcons, searchedActiveMessage, handleNetworkJoin, attemptCreateContact, attemptSetSelectedThread, UPDATE_MEDIA_RECORD, isOnline,
            forwardMessage, handleMessageReply, handleMessageDelete, handleShowInFolder, showRightPanel, animationLeftLength, animationRightLength,
            groupTextAnimationLeftLength, groupTextAnimationRightLength, selectedThreadId, selectedConversation, caches

        } = this.props;
        const {conversationLastMessageId} = this.state
        if (!thread) {
            return null
        }
        if (thread && thread.get("threads") && thread.get("threads").isEmpty()) {
            return null;
        }
        const {isMessagesLoading} = this.state;
        // console.log(isMessagesLoading, "isMessagesLoading")
        const localization: any = components().messagesContainer;
        const members: Map<any, any> = thread && thread.get('members');

        // const chatContainer = document.getElementById("chatBackground");
        //
        // if (chatContainer && this.state.isMessagesLoading && showMore && chatContainer.scrollTop == 0) {
        //     chatContainer.scrollTop = 50;
        // }

        const threadType = thread && thread.getIn(['threads', 'threadType'])
        const {isGroup} = getThreadType(threadType);
        const selectedThread = getThread(selectedContact, user.get("username"));



        const messages_limit = isGroup ? GROUP_MESSAGES_LIMIT : MESSAGES_CHAT_LIMIT;
        const messagesLoadedByShowMore = messages.size > messages_limit;

        return (
            <RightSideContent
                id="chatBackground"
                onClick={handleScrollShow}
                onScroll={handleScrollShow}
                onMouseDown={handleScrollShow}
                onMouseUp={handleScrollShow}
                onMouseEnter={handleScrollShow}
                showRightPanel={showRightPanel}
                className={languages.get('selectedLanguage') === 'ar' ? `right_side_content${showChat && !minimized ? " show-chat-content" : ""} right_side_content-ar` : `right_side_content${showChat && !minimized ? " show-chat-content" : ""}`}
                ref={setContainerRef}
            >
                <div className="chat_container" id="messagesContainer">
                    {/*{*/}
                    {/*    isMessagesLoading && showMore && navigator.onLine &&*/}
                    {/*    <span className="image-loader">*/}
                    {/*        <div className="loader">*/}
                    {/*           <div className="circular-loader">*/}
                    {/*                    <div className="loader-stroke">*/}
                    {/*                        <div className="loader-stroke-left"/>*/}
                    {/*                        <div className="loader-stroke-right"/>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*        </div>*/}
                    {/*    </span>*/}
                    {/*}*/}

                    {
                        messages.filter(item => item.get("threadId") === selectedThreadId).map((message: IMessage, index: number) => {
                            if (message.get('hidden')) {
                                return null;
                            }

                            if ([MESSAGE_TYPES.room_call_ringing, MESSAGE_TYPES.room_call_decline, MESSAGE_TYPES.room_call_current_members, MESSAGE_TYPES.room_call_video].includes(message.get("type"))) {
                                return null;
                            }
                            let creator: IContact = user.get("id") === message.get("creator") ? user : members && members.get(message.get("creator"));
                            if (!creator) {
                                creator = getContactbyId(message.get("creator"));
                            }
                            const msgId = message.get("messageId") || message.get("id") || message.get("msgId");
                            if (messagesLoadStatus && message.get("loadStatus") === LOAD_STATUS.LOAD_START && messagesLoadStatus.get(msgId)) {
                                const messageLoadStatus = messagesLoadStatus.getIn([msgId, "loadStatus"]);
                                messageLoadStatus !== LOAD_STATUS.LOAD_START && updateMessageProperty(msgId, "loadStatus", messageLoadStatus);
                            }

                            let lastAuthor: string = "";
                            let nextAuthor: string = "";
                            let isNextMessageSystemMessage: boolean = false;
                            let isLastMessageSystemMessage: boolean = false;
                            let lastMessageType = "";
                            let lastMessageDeleted = "";
                            let lastSeen: boolean = false;
                            let lastDelivered: boolean = false;

                            const prevMessage: any = messages.get(index - 1);
                            if (index > 0) {
                                lastMessageType = prevMessage.get("type");
                                lastMessageDeleted = prevMessage.get("deleted");
                            }

                            if (index > 0 && prevMessage.get("creator") === user.get("id")) {
                                lastAuthor = user.get("username");
                            } else if (index !== 0) {
                                lastAuthor = prevMessage && prevMessage.get("creator") && prevMessage.get("creator").replace(/@[^@]+$/, '');
                            }

                            if (messages.getIn([index + 1, "creator"]) && messages.getIn([index + 1, "creator"]) === user.get("id")) {
                                nextAuthor = user.get("username");
                            } else if (messages.getIn([index + 1, "creator"])) {
                                nextAuthor = messages.getIn([index + 1, "creator"]).replace(/@[^@]+$/, '');
                            } else {
                                nextAuthor = "1";
                            }

                            if (messages.getIn([index + 1, "deleted"]) || messages.getIn([index + 1, "type"]) && isSystemMessage(messages.getIn([index + 1, "type"]))) {
                                isNextMessageSystemMessage = true;
                            } else if (((new Date(messages.getIn([index, "time"]))).toDateString() !== (new Date(messages.getIn([index + 1, "time"]))).toDateString())) {
                                isNextMessageSystemMessage = true;
                            }


                            if (index !== 0) {
                                if (messages.getIn([index - 1, "deleted"]) || messages.getIn([index - 1, "type"]) && isSystemMessage(messages.getIn([index - 1, "type"]))) {
                                    isLastMessageSystemMessage = true;
                                } else if (((new Date(messages.getIn([index, "time"]))).toDateString() !== (new Date(messages.getIn([index - 1, "time"]))).toDateString())) {
                                    isLastMessageSystemMessage = true;
                                }
                            }

                            const threadType = thread.getIn(['threads', 'threadType']);
                            const {isGroup} = getThreadType(threadType);

                            const repid = messagesMap.get(message.get("repid"));


                            let textToReply: any = "";


                            let nameToReplay: any = "";

                            if (repid) {
                                textToReply = emojify(repid.get("text"), false);


                                if (messagesMap.getIn([message.get("repid"), "own"])) {
                                    nameToReplay = localization.you;
                                } else if (isGroup) {
                                    nameToReplay = members.getIn([messagesMap.getIn([message.get("repid"), "creator"]), "name"]);
                                    /*contacts.getIn([)*/
                                } else {
                                    nameToReplay = members.getIn([messagesMap.getIn([message.get("repid"), "creator"]), "name"]);
                                    thread.get("name")/*contacts.getIn([message.get("threadId"), "name"])*/;
                                }
                            }
                            let animationLength;

                            // console.log(animationRightLength, "animationRightLength2")

                            // console.log(this.isSystemMessage(message), "isSystemMessage")

                            const sistemMessage = this.isSystemMessage(message)

                            if(message.get("own")) {
                               if (languages.get("selectedLanguage") !== 'ar') {
                                   animationLength = sistemMessage || message.get("deleted") ? groupTextAnimationRightLength : animationRightLength
                               } else {
                                   animationLength = sistemMessage || message.get("deleted") ? groupTextAnimationLeftLength : animationLeftLength
                               }
                            } else {
                                if (languages.get("selectedLanguage") !== 'ar') {
                                    animationLength = sistemMessage || message.get("deleted") ? groupTextAnimationLeftLength : animationLeftLength
                                } else {
                                    animationLength = sistemMessage || message.get("deleted") ? groupTextAnimationRightLength : animationRightLength
                                }
                            }

                            // ${messages.size === index + 1 ? " last-message" : ""}
                            // if(!isGroup && (message.get('conversationId') && selectedThread.get("contactId") === message.get('conversationId')) || (message.get('threadId') && selectedThread.get("contactId") === message.get('threadId'))) {
                            if(!isGroup) {
                                return (
                                  <div key={msgId}>
                                      {(index === 0 || ((new Date(message.get("time"))).toDateString() !== (new Date(messages.getIn([index - 1, "time"]))).toDateString())) &&
                                      <MessageDate
                                        date={message.get("time")}
                                        languages={languages}
                                        showRightPanel={showRightPanel}
                                      />}
                                      <div
                                        className={`message-content`}
                                        style={{
                                            transform: showRightPanel ? `translateX(${animationLength}px)` : "translateX(0px)",
                                            transition: "transform 0.125s ease-in-out"
                                        }}
                                      >


                                          <Message
                                            selectedContact={selectedContact}
                                            stickers={stickers}
                                            message={message}
                                            languages={languages}
                                            gifMessages={gifMessages}
                                            contacts={contacts}
                                            selectedConversation={selectedConversation}
                                            conversationLastMessageId={conversationLastMessageId}
                                            changeConversationLastMessageId={this.changeConversationLastMessageId}
                                            caches={caches}





                                            attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                                            last={messages.size === index + 1}
                                            lastSeen={lastSeen}
                                            lastDelivered={lastDelivered}

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

                                            creator={creator}

                                            selectedThread={selectedThread}
                                            messagesLoadStatus={messagesLoadStatus}
                                            sharedMediaPanel={sharedMediaPanel}
                                            showSharedMedia={showSharedMedia}
                                            setShowSharedMedia={setShowSharedMedia}

                                            attemptSetStickersIcons={attemptSetStickersIcons}
                                            replyingMessage={repid}
                                            messagesLoadedByShowMore={messagesLoadedByShowMore}
                                            searchedActiveMessage={searchedActiveMessage}
                                            handleNetworkJoin={handleNetworkJoin}
                                            attemptCreateContact={attemptCreateContact}
                                            isMessagesLoading={isMessagesLoading}
                                            attemptSetSelectedThread={attemptSetSelectedThread}

                                            selectedThreadId={selectedThreadId}
                                            isOnline={isOnline}

                                            ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                                            UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}

                                            forwardMessage={forwardMessage}
                                            handleMessageReply={handleMessageReply}
                                            handleMessageDelete={handleMessageDelete}
                                            handleShowInFolder={handleShowInFolder}
                                            isNextMessageSystemMessage={isNextMessageSystemMessage}
                                            isLastMessageSystemMessage={isLastMessageSystemMessage}
                                          />
                                      </div>
                                  </div>
                                )
                            }
                            // if(isGroup && (message.get('conversationId') && selectedThread.get("id") === message.get('conversationId')) || (message.get('threadId') && selectedThread.get("id") === message.get('threadId'))) {
                            if(isGroup) {
                                return (
                                  <div key={msgId}>
                                      {(index === 0 || ((new Date(message.get("time"))).toDateString() !== (new Date(messages.getIn([index - 1, "time"]))).toDateString())) &&
                                      <MessageDate
                                        date={message.get("time")}
                                        languages={languages}
                                        showRightPanel={showRightPanel}
                                      />}
                                      <div
                                        className={`message-content`}
                                        style={{
                                            transform: showRightPanel ? `translateX(${animationLength}px)` : "translateX(0px)",
                                            transition: "transform 0.125s ease-in-out"
                                        }}
                                      >
                                          <Message
                                            attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                                            last={messages.size === index + 1}
                                            lastSeen={lastSeen}
                                            lastDelivered={lastDelivered}
                                            selectedContact={selectedContact}
                                            selectedConversation={selectedConversation}
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
                                            selectedThreadId={selectedThreadId}
                                            conversationLastMessageId={conversationLastMessageId}
                                            changeConversationLastMessageId={this.changeConversationLastMessageId}
                                            caches={caches}

                                            attemptSetSelectedThread={attemptSetSelectedThread}
                                            contacts={contacts}

                                            isOnline={isOnline}

                                            ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                                            UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}

                                            forwardMessage={forwardMessage}
                                            handleMessageReply={handleMessageReply}
                                            handleMessageDelete={handleMessageDelete}
                                            handleShowInFolder={handleShowInFolder}
                                            isNextMessageSystemMessage={isNextMessageSystemMessage}
                                            isLastMessageSystemMessage={isLastMessageSystemMessage}
                                          />
                                      </div>
                                  </div>
                                )
                            }
                        })}
                </div>
            </RightSideContent>
        );
    }
};
