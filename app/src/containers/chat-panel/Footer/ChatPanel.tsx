import * as React from "react";
import {connect, Store} from "react-redux";
import format from "date-fns/format";
import isEqual from "lodash/isEqual";
import {fromJS, Map} from "immutable";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    ADD_MEDIA_RECORD,
    addSharedMediaMessages,
    attemptSetCreateContactNumber,
    attemptSetSelectedThread,
    changeLeftPanel,
    DELETE_SHARED_MEDIA_MESSAGES,
    removeFiles,
    removePrivateChatError,
    sendStoppedTyping,
    sendTyping,
    setFiles,
    setSearchKeyword,
    setSelectedInfoThreadId,
    setShowSharedMedia,
    toggleRightPanel,
    UPDATE_MEDIA_RECORD,
    updateCallPanel,
    hideMessageModal, setSendingLocation,
} from "modules/application/ApplicationActions";
import {
    attemptCreateMessage,
    attemptDeleteMessage,
    attemptEditMessage,
    attemptGetMessages,
    attemptGetScrollDownMessages,
    attemptOptimiseVideo,
    attemptReplyMessage,
    attemptSendFileMessage,
    attemptSendForwardMessage,
    attemptSendMessage,
    clearForwardMessage,
    deleteMessageFromStore,
    downloadFile,
    messageLocalDelete,
    SEND_FILE_MESSAGE,
    sendMessage,
    sendMessageSeen,
    setForwardMessage,
    toggleResetStoreMessages,
    toggleShowMore,
    updateMessageProperty,
    uploadFile,
    uploadRequest
} from "modules/messages/MessagesActions";
import {
    CALL_STATUSES,
    DEFAULT_TIME_FORMAT,
    DISPLAY_MESSAGES_COUNT,
    IMAGE_TOGGLE,
    LOAD_STATUS,
    MEDIA_TYPES,
    MESSAGE_TYPES,
    NETWORK_JOIN_POPUP,
    OFFLINE_MESSAGE_BODY,
    SHARED_MESSAGE_TYPES,
    UNSUPPORTED_FILE_TYPES,
    VIDEO_TOGGLE
} from "configs/constants";
import {
    attemptResetConversationLastMessage,
    attemptResetConversationNewMessagesIds,
    attemptSetConversationDraft,
    setConversationLastMessage
} from "modules/conversations/ConversationsActions";
import {
    attemptAddRecentSticker,
    attemptAddSticker,
    attemptAddStickerPreviewIcon,
    attemptSetStickersIcons,
    setActiveSubPage
} from "modules/settings/SettingsActions";
import {
    attemptAddNetwork,
    attemptGetNetwork,
    removeNetworkError,
    removeSearchedNetwork,
    setNetworkJoinPopUp
} from "modules/networks/NetworksActions";
import {GROUP_CONVERSATION_EXTENSION, SINGLE_CONVERSATION_EXTENSION, XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import {getPartialId, getPid, getThread, getThreadType, isPublicRoom, isThreadIdPrivateChat} from "helpers/DataHelper";
import {
    attemptCreateContact,
    attemptToggleBlock,
    BLOCK_CONTACT,
    toggleBlocked,
    UNBLOCK_CONTACT
} from "modules/contacts/ContactsActions";
import ForwardMessagePopup from "components/common/popups/ForwardMessage";
import {downloadFromUrlWithName, getThumbnail} from "helpers/FileHelper";
import ContextMenuChatPanel from "components/chat/ContextMenuChatPanel";
import MessagesContainer from "components/messages/MessagesContainer";
import {resetGroupNewMessagesIds} from "modules/groups/GroupsActions";
import SendContactPopUp from "components/common/popups/SendContact";
import {accept, decline, join, showConference} from "modules/conference/ConferenceActions";
import EmptyChatMessage from "components/chat/EmptyChatMessage";
import ConferencePanel from "containers/chat-panel/conference";
import {openMessageContextMenu} from "helpers/MessageHelper";
import CallOutMessage from "components/chat/CallOutMessage";
import ChatPanelFooter from "containers/chat-panel/Footer";
import {IContact} from "modules/contacts/ContactsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import SplashScreen from "components/common/SplashScreen";
import {INetwork} from "modules/networks/NetworksReducer";
import CallPanel from "containers/chat-panel/newUICall";
import selector, {IStoreProps} from "services/selector";
import {IGroup} from "modules/groups/GroupsReducer";
import PopUpMain from "components/common/PopUpMain";
import {removeCall} from "modules/call/CallActions";
import {scrollToBottom} from "helpers/UIHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import "scss/pages/chat-panel/ChatPanelContent";
import conf from "configs/configurations";
import MessagesModel from "modules/messages/MessagesModel";
import Timer = NodeJS.Timer;
import Message from "components/messages/Message";
import MessageModal from "components/messages/MessageModal";
import ContextMenu from "components/common/contextmenu/Index";
import Log from "modules/messages/Log";
import {JoinButton, JoinConference, ParticipantsInfo} from "containers/chat-panel/Footer/style";
import storeCreator from "helpers/StoreHelper";

interface IChatPanelState {
    selectedThreadIds: Array<string>;
    isSendContactPopupShown: boolean;
    deleteEverywhereInfo: IMessage;
    removeEditingMessage: boolean;
    isFileUploadPopUpShown: boolean
    isForwardThreadsShown: boolean;
    displayMessagesCount: number;
    isInvalidFileType: boolean;
    deleteEverywhere: boolean;
    isDropZoneActive: boolean;
    repliedPersonally: boolean;
    editingMessage: IMessage;
    contextMenuMessage: any;
    isCallOutShown: boolean;
    invalidFileName: string;
    audio: HTMLAudioElement;
    replyMessage: IMessage;
    replyMessageText: any;
    showMoreBtn?: string
    keyword: string;
    offset: number;
    text: string;
    deleteMessagePopUp: {
        isOwn: boolean;
        isShown: boolean
    };
    isUnsupportedFileType: boolean;
    showBlockedPopUp: boolean;
    anim: boolean;
    animationLeftLength: number;
    animationRightLength: number;
    groupTextAnimationLeftLength: number;
    groupTextAnimationRightLength: number;
}

interface IChatPanelPassedProps {
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    showNotification?: (message: string, contactId: string, threadId: string) => void;
    toggleMap: (lat: number, lng: number, location: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    removeCallDetails: () => void;
    callDetails: any;
}

interface IChatPanelProps extends IStoreProps, IChatPanelPassedProps {
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    sendMessageSeen: (to: string, id: string, author: string, isGroup: boolean) => void;
    attemptResetConversationLastMessage: (threadId: string) => void;
    attemptToggleBlock: (contactToBlock: string, command: string, requestId: number) => void;
    attemptSetConversationDraft: (threadId: string, draft: string) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    attemptDeleteMessage: (id: string, message?: any) => void;
    sendStoppedTyping: (to: string) => void;
    removeFiles: () => void;
    sendTyping: (to: string, isGroup: boolean) => void;
    toggleBlocked: (id: string, blocked: boolean) => void;
    editMessage: (message: any) => void;
    sendMessage: (message: any, messageToSave: any) => void;
    setActiveSubPage: (activeSubPage: string) => void;
    uploadRequest: (messages: any, file: File) => void;
    attemptResetConversationNewMessagesIds: (id: string) => void;
    attemptSetSelectedThread: (thread: any, callback?: Function) => void;
    resetChannelNewMessagesIds: (id: string) => void;
    attemptAddRecentSticker: (id: string) => void;
    attemptSetStickersIcons: (id: string, callback: Function, iconId: string) => void;
    updateCallPanel: (minimized: boolean, showChat: boolean) => void;
    uploadFile: (messages: any, file: any) => void;
    downloadFile: (downloadFile: any) => void;
    setSendingLocation: (location: any) => void;
    resetGroupNewMessagesIds: (id: string) => void;
    setSelectedInfoThreadId: (id: string) => void;
    removeCall: (id) => void;
    applicationStopTyping: (id: string) => void;
    toggleRightPanel: (show: boolean) => void;
    setFiles: (files: Array<File>) => void;
    updateMessageProperty: (msgId, property, value) => void;
    deleteMessageFromStore: (msgId) => void;
    localDelete: (id: string, threadId: string, send: boolean) => void;
    attemptGetMessages: (thread: any, msgId: string) => void;
    attemptGetScrollDownMessages: (thread: any, msgId: string, message: any) => void;
    DELETE_SHARED_MEDIA_MESSAGES?: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => void;
    toggleResetStoreMessages: (resetStoreMessages: boolean) => void;
    addSharedMediaMessages: (messageId: string, message: any) => void;
    attemptAddSticker: (id: string) => void;
    changeLeftPanel: (leftPanel: string) => void;
    setConversationLastMessage: (threadId: string, message: any) => void;
    setShowShareMedia: (showSharedMedia: boolean) => void;
    attemptCreateMessage: (message: any) => void;
    setForwardMessage: (messages: any) => void;
    clearForwardMessage: () => void;
    attemptSendForwardMessage: (messages: any, threadIds: Array<string>, emailsMap: { [key: string]: string }) => void;
    setSearchKeyword: (keyword: string) => void;
    attemptReplyMessage: (message: any) => void;
    gifMessages: any;
    attemptAddStickerPreviewIcon: (id: string) => void;
    toggleShowMore: (showMore: boolean) => void;
    removePrivateChatError: () => void;
    showMore: boolean,
    showRightPannel: boolean,
    isRedialScreenShown: boolean;

    attemptGetNetwork: (id: string, token: boolean) => void;
    setNetworkJoinPopUp: (networkJoinPopUp: string) => void;
    attemptAddNetwork: (nicknameOrToken: any, network: any) => void;
    removeSearchedNetwork: () => void;
    removeNetworkError: () => void;

    attemptSendMessage: (message: any, messageType: string, meta: any) => void;
    attemptSendFileMessage: (file: File, meta: any, blob: Blob) => void;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void;
    SEND_FILE_MESSAGE: (file: File, meta: any, blob: Blob) => void;
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    BLOCK_CONTACT: (contactIds: string[]) => void;

    handleMessagePopupClose: () => void;
    checkConference?: (groupId: string, callId: string) => void;
}

const selectorVariables: any = {
    gifMessages: true,
    // selectedThread: true,
    selectedThreadId: true,
    conversations: true,
    sharedMediaMessages: true,
    sharedMediaPanel: true,
    confCallDetails: true,
    networkJoinPopUp: true,
    searchedNetwork: true,
    showRightPannel: true,
    networkError: true,
    networks: true,
    networkToken: true,
    conferenceDetails: true,
    application: {
        app: true
    },
    contacts: {
        selectedContact: true,
        contacts: true,
        savedContacts: true
    },
    settings: {
        privacy: true,
        chat: true,
        languages: true,
        myStickers: true,
        stickers: true
    },
    messages: {
        messages: true,
        showMore: true,
        showMoreDown: true,
        messagesLoadStatus: true,
        forwardMessage: true,
        searchedActiveMessage: true,
        resetStoreMessages: true
    },
    threads: true,
    calls: {
        lastCall: true
    },
    conference: {
        showConference: true,
        initialized: true
    },
    user: {
        user: true
    },
};

class ChatPanel extends React.Component<IChatPanelProps, IChatPanelState> {

    callPanel: any;

    chatBody: HTMLDivElement;

    contextMenu: HTMLDivElement;

    checkFocusIntervalId: Timer | number;

    dropZoneContainer: React.RefObject<HTMLDivElement>;

    constructor(props: any) {
        super(props);

        this.dropZoneContainer = React.createRef();

        this.state = {
            displayMessagesCount: DISPLAY_MESSAGES_COUNT,
            deleteMessagePopUp: {
                isOwn: false,
                isShown: false
            },
            isSendContactPopupShown: false,
            isFileUploadPopUpShown: false,
            removeEditingMessage: false,
            isForwardThreadsShown: false,
            deleteEverywhereInfo: null,
            contextMenuMessage: null,
            isInvalidFileType: false,
            deleteEverywhere: false,
            isDropZoneActive: false,
            replyMessageText: null,
            repliedPersonally: false,
            selectedThreadIds: [],
            isCallOutShown: false,
            editingMessage: null,
            invalidFileName: "",
            replyMessage: null,
            keyword: "",
            audio: null,
            text: "",
            offset: 0,
            isUnsupportedFileType: false,
            showBlockedPopUp: false,
            anim: false,
            animationLeftLength: 0,
            animationRightLength: 0,
            groupTextAnimationLeftLength: 0,
            groupTextAnimationRightLength: 0
        };
    }

    componentDidMount(): void {
        document.addEventListener("scroll", this.handleDocumentScroll, true);
        document.addEventListener("contextmenu", this.handleDocumentClick);
        document.addEventListener("click", this.handleDocumentClick);
        window.addEventListener("focus", this.handleDocumentFocus);

        this.handleAnimation();
        // (window as any).addEventListener("resize", () => {
        //     console.log("Hello woard")
        //     setTimeout(() => {
        //         this.handleAnimation()
        //     },2000)
        //
        // });
        window.onresize = this.handleAnimation;

    }

    shouldComponentUpdate(nextProps: IChatPanelProps, nextState: IChatPanelState): boolean {
        const {
            languages,  messages, privacy, callDetails, showMore, app,
            sharedMediaPanel, messagesLoadStatus, stickers, forwardMessage,
            searchedActiveMessage, showMoreDown, chat, myStickers, user, conversations,
            selectedThreadId, contacts, isRedialScreenShown,
        } = this.props;


        const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const nextSelectedThread = nextProps.conversations && nextProps.conversations.get(nextProps.selectedThreadId) || nextProps.contacts.get(nextProps.selectedThreadId);
        const threadIsEmpty = selectedThread && selectedThread.get("threads") && selectedThread.get("threads").isEmpty();
        const nextPropsThreadIsEmpty = nextProps.selectedThread && nextProps.selectedThread.get("threads") && nextProps.selectedThread.get("threads").isEmpty();
        const threadInfo = conversations && conversations?.get(selectedThreadId)?.getIn(['threads', 'threadInfo'])
        const nextThreadInfo = nextProps.conversations && nextProps.conversations?.get(selectedThreadId)?.getIn(['threads', 'threadInfo'])

        if(app.showRightPanel !== nextProps.app.showRightPanel) {
            return true;
        }

        if(app.applicationState.isOnline !== nextProps.app.applicationState.isOnline) {
            return true;
        }

        if (!isEqual(this.props.networks, nextProps.networks) ||
            !isEqual(this.props.searchedNetwork, nextProps.searchedNetwork) ||
            this.props.networkJoinPopUp !== nextProps.networkJoinPopUp ||
            this.props.networkToken !== nextProps.networkToken ||
            this.props.networkError !== nextProps.networkError) {
            return true;
        }

        if (app.minimized != nextProps.app.minimized || app.showChat != nextProps.app.showChat) {
            return true;
        }

        if (chat.get("useEnterToSend") !== (nextProps.chat.get("useEnterToSend"))) {
            return true;
        }

        // if (!threadIsEmpty && !nextPropsThreadIsEmpty && !selectedThread.equals(nextProps.selectedThread)) {
        //     return true;
        // }

        if (!threadIsEmpty && !nextPropsThreadIsEmpty && (!selectedThread.equals(nextProps.selectedThread))) {
            return true;
        }

        if (!threadIsEmpty && !conversations.equals(nextProps.conversations)) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (nextProps.selectedThreadId !== this.props.selectedThreadId) {
            return true;
        }
        if(conversations.getIn([this.props.selectedThreadId, 'members',this.props.selectedThreadId, 'blocked']) !== nextProps.conversations.getIn([nextProps.selectedThreadId, 'members',nextProps.selectedThreadId, 'blocked'])) {
            return true
        }

        if (privacy.get("showTyping") !== nextProps.privacy.get("showTyping")) {
            return true;
        }

        if (privacy.get("showSeenStatus") !== nextProps.privacy.get("showSeenStatus")) {
            return true;
        }

        if (languages.get("selectedLanguage") !== nextProps.languages.get("selectedLanguage")) {
            return true
        }

        if (nextProps.messages && !nextProps.messages.equals(messages)) {
            return true;
        }

        if (nextProps.forwardMessage && !nextProps.forwardMessage.equals(forwardMessage)) {
            return true;
        }

        if (!isEqual(nextProps.user, user)) {
            return true;
        }

        if (nextProps.messagesLoadStatus && !nextProps.messagesLoadStatus.equals(messagesLoadStatus)) {
            return true;
        }

        if (!isEqual(nextProps.callDetails, callDetails)) {
            return true;
        }

        if (!isEqual(nextProps.app.files, app.files)) {
            return true;
        }

        if (!isEqual(nextProps.app.sendingLocation, app.sendingLocation)) {
            return true;
        }

        if (!isEqual(nextThreadInfo, threadInfo)) {
            return true;
        }

        if (this.props.calls && !this.props.calls.equals(nextProps.calls)) {
            return true;
        }

        if (showMore !== nextProps.showMore) {
            return true;
        }

        if (showMoreDown !== nextProps.showMoreDown) {
            return true;
        }

        if (!isEqual(nextProps.stickers, stickers)) {
            return true;
        }

        if (!isEqual(nextProps.myStickers, myStickers)) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (this.state.audio !== nextState.audio) {
            return true;
        }

        if (this.props.showConference !== nextProps.showConference) {
            return true;
        }

        if (this.props.initialized !== nextProps.initialized) {

            return true;
        }

        if (isRedialScreenShown !== nextProps.isRedialScreenShown) {
            return true;
        }

        return !isEqual(nextState, this.state);
    }

    async componentDidUpdate(prevProps: IChatPanelProps, prevState: IChatPanelState): Promise<any> {
        const {
            messages, conversations, selectedThreadId, calls, removeCall, lastCall, app, showMoreDown,
            toggleResetStoreMessages, showMore, resetStoreMessages, toggleShowMore
        } = this.props;
        const selectedThread = conversations && conversations.get(selectedThreadId)
        const {editingMessage, replyMessage} = this.state;
        const lastCallObj = lastCall && lastCall.toJS();
        const threadIsEmpty = selectedThread && selectedThread.get("threads").isEmpty();
        const prevPropsThreadIsEmpty = prevProps.conversations && prevProps.conversations.get(selectedThreadId) && prevProps.conversations.get(selectedThreadId).get("threads").isEmpty();

        if (selectedThreadId !== prevProps.selectedThreadId) {
            toggleResetStoreMessages(false);
        }

        if (messages.last() && !messages.last().equals(prevProps.messages.last()) && !showMore && resetStoreMessages) {
            toggleShowMore(true);
        }

        if (calls.size > 1) {
            calls.map((item, index: any) => {
                const call = calls.get(index).toJS();
                if (lastCallObj.id != call.id && call.ownCall == true && call.status === CALL_STATUSES.calling) {
                    removeCall(call.id);
                }
            });
        }

        // commented code

        // if (this.chatBody) {
        //     if (!threadIsEmpty && prevPropsThreadIsEmpty && this.chatBody.scrollHeight > this.chatBody.scrollTop) {
        //         this.scroll();
        //     } else if (!threadIsEmpty && !prevPropsThreadIsEmpty) {
        //         if (selectedThreadId !== prevProps.selectedThreadId && messages && messages.first() && messages.first().get('conversationId') === selectedThreadId) {
        //             this.setState({displayMessagesCount: DISPLAY_MESSAGES_COUNT});
        //             this.scroll();
        //         } else if (selectedThreadId === prevProps.selectedThreadId && (messages.size > 0 && prevProps.messages.size > 0) && (messages.first().get('conversationId') === prevProps.messages.first().get('conversationId')) && messages.size > prevProps.messages.size) {
        //             if (!prevProps.messages.last() || (prevProps.messages.last() && !messages.last().equals(prevProps.messages.last()))) {
        //                 if (!showMoreDown) {
        //                         this.scroll();
        //                     if(document.getElementById("chatBackground")){
        //                         this.chatBody.scrollTop = this.chatBody.scrollTop;
        //                     }
        //                 }
        //             }
        //
        //         } else if (selectedThreadId === prevProps.selectedThreadId && messages.size < prevProps.messages.size - 1) {
        //             this.scroll();
        //             // toggleResetStoreMessages(true);
        //         }
        //     }
        // }

        if ((app.showChat && !prevProps.app.showChat) || app.minimized && !prevProps.app.minimized) {
            this.handleDocumentFocus()
        }

        if (prevProps.lastCall && !lastCall) {
            this.handleDocumentFocus();
        }

        if (selectedThreadId !== prevProps.selectedThreadId && (editingMessage || replyMessage)) {
            const obj = {};

            if (editingMessage) {
                obj["editingMessage"] = null;
            }

            if (replyMessage) {
                obj["replyMessage"] = null;
                obj["replyMessageText"] = null;
            }

            Object.keys(obj).length > 0 ? this.setState(obj) : null;
        }
    }

    componentWillUnmount(): void {
        clearInterval((this.checkFocusIntervalId as number));

        document.removeEventListener("contextmenu", this.handleDocumentClick);
        document.removeEventListener("scroll", this.handleDocumentScroll);
        document.removeEventListener("click", this.handleDocumentClick);
        window.removeEventListener("focus", this.handleDocumentFocus);
    }

    handleAnimation = () => {
        const chatContent = document.querySelector(".chat-content")
        const rect = chatContent && chatContent.getBoundingClientRect();
        // console.log(rect, 'chatContentCoordinates');
        let animationLeftLength;
        let animationRightLength;
        let groupTextAnimationLeftLength;
        let groupTextAnimationRightLength;
        const difWidth = 1274
        const curWidth = 157
        const rightSidebarLength = 314
        const difference = difWidth - rect.width
        if (difference >= 0) {
            if (difference > rightSidebarLength) {
                animationLeftLength = rightSidebarLength
                animationRightLength = 0
                groupTextAnimationLeftLength = rightSidebarLength/2
                groupTextAnimationRightLength = rightSidebarLength/2
            } else {
                animationLeftLength = Math.floor((rightSidebarLength + difference)/2)
                animationRightLength = Math.floor((rightSidebarLength - difference)/2)
                groupTextAnimationLeftLength = rightSidebarLength/2
                groupTextAnimationRightLength = rightSidebarLength/2
            }
        } else {
            animationLeftLength = curWidth;
            animationRightLength = curWidth;
            groupTextAnimationLeftLength = curWidth
            groupTextAnimationRightLength = curWidth
        }

        this.setState({
            animationLeftLength,
            animationRightLength,
            groupTextAnimationLeftLength,
            groupTextAnimationRightLength
        });
    }

    handleDocumentFocus = () => {
        const {contacts, selectedThreadId, conversations, sendMessageSeen, user, attemptResetConversationNewMessagesIds, privacy, lastCall, app} = this.props;
        const conversationExists = selectedThreadId !== "" && !conversations.isEmpty() && conversations.has(selectedThreadId);
        const selectedThread = selectedThreadId !== "" && (conversations.get(selectedThreadId) || contacts.get(selectedThreadId))
        const newMessagesIds = conversationExists && conversations.get(selectedThreadId) ? conversations.getIn([selectedThreadId, "conversations", "newMessagesIds"]).toJS() : [];
        const threadType = selectedThread && selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = threadType &&  getThreadType(threadType);
        const threadIsEmpty = selectedThread && selectedThread.get("threads").isEmpty();

        if (!threadIsEmpty) {
            if (lastCall && lastCall.size > 0 && !app.minimized && !app.showChat) {
                return false;
            }

            if (privacy.get("showSeenStatus")) {
                newMessagesIds.map(id => {
                    const to: string = selectedThreadId.split("@").shift();
                    sendMessageSeen(to, id, user.get("username"), isGroup);
                });
            }

            if (newMessagesIds.length > 0) {
                attemptResetConversationNewMessagesIds(selectedThreadId);
            }
        }
    };

    forwardMessage = async (message?: any) => {
        const {contextMenuMessage} = this.state;
        const {setForwardMessage} = this.props;
        const id: string = message ? (message.get("id") || message.get("messageId")) : (contextMenuMessage.get("id") || contextMenuMessage.get("messageId"));
        let obj = {};
        obj[id] = message || contextMenuMessage;
        const messagesToForward: Map<string, any> = fromJS(obj);

        if (messagesToForward && !messagesToForward.isEmpty()) {
            messagesToForward.map(async message => {
                const path = (message.get("fileRemotePath") && (message.get("type") === MESSAGE_TYPES.image || message.get("type") === MESSAGE_TYPES.audio || message.get("type") === MESSAGE_TYPES.file || message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file)) ? await MessagesModel.checkFileInFolder(message) : true;
                if (!path) {
                    const downloadInfo = {
                        fileRemotePath: message.get("fileRemotePath"),
                        threadId: message.get("threadId"),
                        method: "GET",
                        msgId: message.get("messageId") || message.get("msgId") || message.get("id")
                    };
                    downloadFile(downloadInfo);
                }
            });
            setForwardMessage(messagesToForward);
            this.setState({isForwardThreadsShown: true});
        }
    };

    handleStickerPackageAdd = () => {
        const {contextMenuMessage} = this.state;
        const {attemptAddSticker, attemptAddStickerPreviewIcon, stickers} = this.props;
        const id: string = contextMenuMessage.get("info").split("_").shift();
        attemptAddSticker(id);
        const sticker = stickers.get(id);
        if (sticker && !sticker.get("icon")) {
            attemptAddStickerPreviewIcon(id);
        }
    };

    handleForwardPopUpClose = () => {
        const {clearForwardMessage} = this.props;
        this.setState({isForwardThreadsShown: false});
        clearForwardMessage();
    };

    handleSendContactsPopUpClose = () => this.setState({isSendContactPopupShown: false, selectedThreadIds: []});

    handleMessageRightClick = (event: React.MouseEvent<HTMLDivElement>) => {

        const {currentTarget: {dataset: {isinfo}}} = event;
        if (isinfo === "true") {
            return event;
        }
        const {messages, myStickers, conversations, contacts, selectedThreadId} = this.props;
        const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const messageId = event.currentTarget.getAttribute("data-messageid");
        const messageType = event.currentTarget.getAttribute("data-messagetype");
        const isFile: any = event.currentTarget.querySelector("[src]") || event.currentTarget.querySelector("[href]");
        const blobUrl = isFile && (isFile.dataset.url || isFile.src || isFile.href);
        const message = messages.get(messageId) && messages.get(messageId).toJS();

        event.preventDefault();
        event.nativeEvent.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();

        const messageIsUploading = event.currentTarget.querySelector("[class*='progress']");

        if (messageIsUploading && message && message.loadStatus !== LOAD_STATUS.UPLOAD_FAILURE && message.loadStatus !== LOAD_STATUS.UPLOAD_CANCEL && message.loadStatus !== LOAD_STATUS.OPTIMISE_FAILURE && message.loadStatus !== LOAD_STATUS.OPTIMISE_CANCEL) {
            return false;
        }

        let rootH: number;
        if (messages.get(messageId).get("own")) {
            if ([MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.file, MESSAGE_TYPES.location].includes(messageType)) {
                rootH = 184;
            } else if ([MESSAGE_TYPES.contact, MESSAGE_TYPES.contact_with_info, MESSAGE_TYPES.sticker].includes(messageType)) {
                rootH = 104;
            } else if ([MESSAGE_TYPES.text, MESSAGE_TYPES.chat].includes(messageType)) {
                rootH = 194;
            }
        } else {
            if ([MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.file, MESSAGE_TYPES.text, MESSAGE_TYPES.chat].includes(messageType)) {
                rootH = 104;
            } else if ([MESSAGE_TYPES.location, MESSAGE_TYPES.contact, MESSAGE_TYPES.contact_with_info, MESSAGE_TYPES.sticker].includes(messageType)) {
                rootH = 74;
            }
        }
        const rootW: number = this.contextMenu.offsetWidth ? this.contextMenu.offsetWidth : 145;
        const screenH: number = window.innerHeight - 20;
        const screenW: number = window.innerWidth;
        const clickX: number = event.clientX;
        const clickY: number = event.clientY;

        const right: boolean = (screenW - clickX) > rootW;
        const top: boolean = (screenH - clickY) > rootH;
        const bottom: boolean = !top;
        const left: boolean = !right;

        if (right) {
            this.contextMenu.style.left = `${clickX + 5}px`;
        }

        if (left) {
            this.contextMenu.style.left = `${clickX - rootW - 15}px`;
        }

        if (top) {
            this.contextMenu.style.top = `${clickY + 5}px`;
            this.contextMenu.style.bottom = "auto"
        }

        if (bottom) {
            this.contextMenu.style.top = "auto";
            this.contextMenu.style.bottom = `${screenH - clickY + 15}px`;
        }

        const currentMessage: any = messages.get(messageId);
        const contextMenuMessage = blobUrl ? {...currentMessage.toJS(), ...{blobUrl}} : currentMessage;
        const result: any = fromJS(contextMenuMessage);

        this.setState({contextMenuMessage: result});
        contextMenuMessage && !contextMenuMessage.deleted && openMessageContextMenu(result, selectedThread, myStickers, this.downloadFile, this.forwardMessage, this.editMessage, this.handleMessageReply, this.handleDeleteMessagePopUpOpen, this.handleShowInFolder, this.handleStickerPackageAdd);
        this.contextMenu.style.display = "block";
    };

    handleSendContactPopupToggle = () => {
        const {isSendContactPopupShown} = this.state;
        this.setState({isSendContactPopupShown: !isSendContactPopupShown, keyword: ""});
    };

    handleDeleteEverywherePopupToggle = () => {
        const {deleteEverywhere, contextMenuMessage} = {...this.state};
        this.setState({deleteEverywhereInfo: contextMenuMessage, deleteEverywhere: !deleteEverywhere});
    };

    handleReceiverToggle = (thread: IContact | IGroup) => {
        const newState: IChatPanelState = {...this.state};
        const id: any = thread.getIn(["threads", "threadId"]);
        const index: number = newState.selectedThreadIds.indexOf(id);

        if (index === -1) {
            newState.selectedThreadIds.push(id);
        } else {
            newState.selectedThreadIds.splice(index, 1);
        }
        this.setState(newState);
    };

    handleDocumentClick = (event: MouseEvent) => {
        if (!(event.target as any).contains(this.contextMenu) && this.contextMenu && this.contextMenu.style.display === "block" && !this.state.deleteMessagePopUp.isShown) {
            this.contextMenu.style.display = "none";
            this.setState({contextMenuMessage: null});
        }
    };

    setContainerRef = (ref: HTMLDivElement) => {
        this.chatBody = ref;
        if (this.chatBody) {
            this.chatBody.scrollTop = this.chatBody.scrollHeight;
        }
    };

    setContextMenuRef = (ref: HTMLDivElement) => {
        this.contextMenu = ref;
    };

    removeMessageEditing = () => {
        this.setState({editingMessage: null, removeEditingMessage: false});
    };

    removeReplyMessage = () => {
        this.setState({replyMessage: null, replyMessageText: null, repliedPersonally: false});
    };

    handleDocumentScroll = () => {
        if (this.contextMenu && this.contextMenu.style.display === "block") {
            this.contextMenu.style.display = "none";
            this.setState({contextMenuMessage: null});
        }
    };

    handleAudioChange = (audio: HTMLAudioElement) => {
        if (this.state.audio && !this.state.audio.paused) {
            document.getElementsByClassName('pause-btn')[0].classList.add('play-btn');
            document.getElementsByClassName('pause-btn')[0].classList.remove('pause-btn');
            this.state.audio.pause();
        }
        audio.play();
        this.setState({audio});
    };

    handleDragEnter = (e) => {
      e.preventDefault();
      const { user, conversations, selectedThreadId,contacts} = this.props;
      const {isUnsupportedFileType} = this.state;
      const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
      const items: any = Array.from(e.dataTransfer.items);
      const threadType = selectedThread.getIn(['threads', 'threadType']);
      const {isGroup} = getThreadType(threadType);
      const threadInfo = getThread(selectedThread, user.get("username"));
      const blocked: boolean = !isGroup && threadInfo.get("blocked");

      if (blocked) {
        this.setState({showBlockedPopUp:true});
      }

      if (items.some(item => item.kind === "file")) {
        if (!blocked && (!isGroup || (isGroup && this.isGroupMember)) && !isUnsupportedFileType) {
          this.toggleDropZoneActive(true);
        }
      }
    };

    handleUnBlockContact = (): void => {
      const {user, UNBLOCK_CONTACT, conversations, contacts,selectedThreadId} = this.props;
      const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
      const threadInfo = selectedThread.get('members').first();

      const thread = getThread(selectedThread, user.get("username"));
      const numbers = thread.get("numbers");
      const contactId: string = numbers && numbers.toArray() || threadInfo.get("contactId");

      UNBLOCK_CONTACT([contactId]);
      this.setState({showBlockedPopUp: false});
    };

    handleDragLeave = () => {
        this.toggleDropZoneActive(false);
    };

    handleCancelUnBlockContact = () => {
        this.setState({showBlockedPopUp: false});
    };

    handleDrop = (e: any) => {
        e.preventDefault();
        const accepted: any[] = Array.from(e.dataTransfer.files);
        const localization: any = components().chatPanel;
        const {setFiles, conversations,selectedThreadId,contacts} = this.props;
        const {isDropZoneActive, isUnsupportedFileType} = this.state;
        const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const threadInfo = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        const blocked: boolean = !isGroup && threadInfo.get("blocked");

        if (accepted.every(file => UNSUPPORTED_FILE_TYPES.includes(file.type)) && !isUnsupportedFileType) {
            // showMessageBox(
            //     true,
            //     MESSAGE_BOX_TYPES.info,
            //     [localization.OK],
            //     localization.cantBeSent,
            //     localization.notSupportedYet,
            //     undefined,
            //     undefined,
            //     0,
            //     0,
            //     () => false
            // );

            this.setState({isUnsupportedFileType: true})
        }

        if (accepted.length > 0 && !blocked && isDropZoneActive) {
            setFiles(accepted.filter(file => file.name && file.name !== "" && !UNSUPPORTED_FILE_TYPES.includes(file.type)));
        }
        this.toggleDropZoneActive(false);
    };

    handleInvalidFilePupUpClose = () => {
        this.setState({
            isInvalidFileType: false,
        })
    };

    sendContact = async (selectedContactId: string, contactsToShare: any[], firstName: string, lastName: string) => {

        const {replyMessage} = this.state;
        const {sendMessage, user, savedContacts, selectedThreadId, conversations, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const threadIsEmpty = selectedThread.get("threads").isEmpty();

        const userEmail: string = user && user.get("email");
        const msgInfo: Array<any> = [];
        const contactInfo: any = savedContacts.getIn([selectedContactId, "members", selectedContactId]);
        const name: string = firstName && lastName ? `${firstName} ${lastName}`.trim() : (firstName || lastName);
        const email: any = contactInfo.get("email");
        const phone: any = contactInfo.get("phone");
        const avatar: Blob = contactInfo.get("avatar");
        const avatarThumb: any = avatar ? await getThumbnail(avatar) : "";
        const time: any = Date.now();
        const msgId: string = `msgId${time}`;


        if (contactsToShare && contactsToShare.length > 0) {
            contactsToShare.map(number => {
                if (typeof number === "object") {
                    if (number.isProductContact) {
                        const numberId: any = `${number.username}@${SINGLE_CONVERSATION_EXTENSION}` || selectedContactId;
                        const numberInfo: any = savedContacts.getIn([numberId, "members", numberId]);
                        const phone: string = number.username;
                        const email: string = number.email;
                        msgInfo.push({
                            email: email || "",
                            fullNumber: phone,
                            number: phone,
                            type: numberInfo.get("label"),
                            zangi: true,
                        });
                    } else {
                        const email: string = number.email;
                        if (!email || email === "") {
                            msgInfo.push({
                                email: email || "",
                                fullNumber: number.username,
                                number: number.username,
                                type: number.label,
                                zangi: false,
                            });
                        } else {
                            msgInfo.push({
                                email: email || "",
                                fullNumber: "",
                                number: "",
                                type: number.label,
                                zangi: false,
                            });
                        }

                    }

                }
                else if (typeof  number === "string") {
                    msgInfo.push({
                        email: number.indexOf("@") !== -1 ? number: '',
                        fullNumber: number,
                        number: phone,
                        label: '',
                        zangi: false,
                    })
                }
            });
        } else {
            msgInfo.push({
                email: email || "",
                fullNumber: phone,
                number: phone,
                type: contactInfo.get("label"),
                zangi: contactInfo.get("isProductContact"),
            });
        }
        const info = JSON.stringify(msgInfo);

        const messageToSave: any = {
            createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
            type: MESSAGE_TYPES.contact_with_info,
            text: name,
            firstName,
            lastName,
            info: contactsToShare && contactsToShare.length > 0 ? info : "",
            threadId: selectedThreadId,
            creator: user.get("id"),
            id: `msgId${Date.now()}`,
            fileSize: null,
            time: Date.now(),
            email: userEmail,
            own: true,
            repid: replyMessage ? replyMessage.get("messageId") ? replyMessage.get("messageId") : replyMessage.get("id") : "",
            m_options: avatarThumb,
        };

        // const messageToSave: any = {
        //     conversationId: selectedThreadId,
        //     createdAt: format(time, DEFAULT_TIME_FORMAT),
        //     creator: user.get("id"),
        //     deleted: false,
        //     delivered: false,
        //     dislikes: 0,
        //     edited: false,
        //     email: userEmail,
        //     fileLink: '',
        //     fileRemotePath: null,
        //     fileSize: null,
        //     hidden: undefined,
        //     firstName,
        //     lastName,
        //     info,
        //     isDelivered: false,
        //     isSeen: false,
        //     likeState: 0,
        //     likes: 0,
        //     link: isURI(name),
        //     linkTags: List[0],
        //     loadStatus: null,
        //     m_options: avatarThumb,
        //     messageId: msgId,
        //     id: msgId,
        //     own: true,
        //     pid: undefined,
        //     previousMessageId: undefined,
        //     repid: replyMessage ? replyMessage.get("messageId") || replyMessage.get("id") : "",
        //     seen: false,
        //     sid: undefined,
        //     status: false,
        //     text: name,
        //     threadId: selectedThreadId,
        //     time,
        //     type: MESSAGE_TYPES.contact_with_info,
        // };

        const message: any = {
            to: selectedThreadId.split("/").shift(),
            author: user.get("username"),
            type: XML_MESSAGE_TYPES.chat,
            msgType: messageToSave.type,
            msgText: messageToSave.text,
            msgInfo: messageToSave.info,
            email: messageToSave.email,
            id: messageToSave.id
        };

        if (!threadIsEmpty && selectedThreadId.includes(GROUP_CONVERSATION_EXTENSION)) {
            message.type = XML_MESSAGE_TYPES.group;
        }

        sendMessage(message, messageToSave);
        if (replyMessage) {
            message.repid = messageToSave.repid;
            attemptReplyMessage(message);
        }
        this.handleSendContactsPopUpClose();

        replyMessage && this.removeReplyMessage();
    };

    handleSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;

        if (value !== keyword) {
            this.setState({keyword: value.toLowerCase()});
        }
    };

    forwardMessageSend = async (selectedThreadIds: any, emailsMap: { [key: string]: string }) => {
        const {} = this.state;
        const {setSearchKeyword, attemptSendForwardMessage, forwardMessage} = this.props;

        attemptSendForwardMessage(forwardMessage, selectedThreadIds, emailsMap);
        this.handleForwardPopUpClose();
        const input_field = (document.getElementById("searchInput") as HTMLInputElement);
        if (input_field) {
            input_field.value = "";
        }
        setSearchKeyword('');
    };

    messageDeleteEverywhere = (): void => {
        const {attemptDeleteMessage, user, DELETE_SHARED_MEDIA_MESSAGES, sharedMediaMessages} = this.props;
        const {deleteEverywhereInfo} = this.state;
        const threadId: string = deleteEverywhereInfo.get("threadId");
        const messageId: string = deleteEverywhereInfo.get("id") || deleteEverywhereInfo.get("messageId");
        const sid: string = isThreadIdPrivateChat(threadId) ? "1" : "0";
        const pid: string = isThreadIdPrivateChat(threadId) ? getPid(threadId) : "";

        const message: any = {
            to: threadId.split("/").shift(),
            msgText: deleteEverywhereInfo.get("text") || OFFLINE_MESSAGE_BODY,
            msgType: MESSAGE_TYPES.delete_msg,
            rel: messageId,
            type: XML_MESSAGE_TYPES.chat,
            author: user.get("username"),
            id: `msgId${Date.now()}`,
            msgInfo: "",
            sid,
            pid
        };

        if (isPublicRoom(threadId)) {
            message.type = XML_MESSAGE_TYPES.group;
        }

        attemptDeleteMessage(messageId, message);
        // if (sharedMediaMessages && !sharedMediaMessages.isEmpty()) {
        //     const checkedFilesCount = {
        //         media: 0,
        //         file: 0,
        //         link: 0,
        //         total: 1
        //     };
        //     const ownMessage: string[] = [];
        //     if (deleteEverywhereInfo.get("own")) {
        //         ownMessage.push(messageId)
        //     }
        //     if (MEDIA_TYPES.media.includes(deleteEverywhereInfo.get("type"))) {
        //         checkedFilesCount.media = checkedFilesCount.media + 1;
        //     } else if (MEDIA_TYPES.file.includes(deleteEverywhereInfo.get("type"))) {
        //         checkedFilesCount.file = checkedFilesCount.file + 1;
        //     } else if (deleteEverywhereInfo.get("type") === MESSAGE_TYPES.text && deleteEverywhereInfo.get("link")) {
        //         checkedFilesCount.link = checkedFilesCount.link + 1;
        //     }
        //
        //     DELETE_SHARED_MEDIA_MESSAGES([messageId], checkedFilesCount, true, ownMessage);
        // }

        this.setState({deleteEverywhereInfo: null});
    };

    messageLocalDelete = (): void => {
        const {contextMenuMessage} = this.state;
        const {localDelete, DELETE_SHARED_MEDIA_MESSAGES, app} = this.props;
        const msgId = contextMenuMessage.get("id") || contextMenuMessage.get("messageId");

        if (contextMenuMessage && contextMenuMessage.size !== 0) {
            if (app.sharedMedia.total > 0 && SHARED_MESSAGE_TYPES.includes(contextMenuMessage.get("type"))) {
                const checkedFilesCount = {
                    media: 0,
                    file: 0,
                    link: 0,
                    total: 1
                };
                const ownMessage: string[] = [];
                if (contextMenuMessage.get("own")) {
                    ownMessage.push(msgId)
                }
                if (MEDIA_TYPES.media.includes(contextMenuMessage.get("type"))) {
                    checkedFilesCount.media = checkedFilesCount.media + 1;
                } else if (MEDIA_TYPES.file.includes(contextMenuMessage.get("type"))) {
                    checkedFilesCount.file = checkedFilesCount.file + 1;
                } else if (contextMenuMessage.get("type") === MESSAGE_TYPES.text && contextMenuMessage.get("link")) {
                    checkedFilesCount.link = checkedFilesCount.link + 1;
                }
                DELETE_SHARED_MEDIA_MESSAGES([msgId], checkedFilesCount, false, ownMessage);
            }
            localDelete(msgId, contextMenuMessage.get("threadId"), true);
        }
    };

    handleDeleteMessagePopUpOpen = (message?: any): void => {
        const {contextMenuMessage} = this.state;
        const newState: IChatPanelState = {...this.state};

        const messageToDelete: any = message || contextMenuMessage;

        if (messageToDelete) {
            if (messageToDelete.get("own")) {
                newState.deleteMessagePopUp = {
                    isOwn: true,
                    isShown: true
                };
                newState.deleteEverywhereInfo = messageToDelete;
                newState.contextMenuMessage = messageToDelete;

            } else {
                newState.deleteMessagePopUp = {
                    isOwn: false,
                    isShown: true
                };
                newState.contextMenuMessage = messageToDelete;
            }
            this.setState(newState);
        }
    };

    handleDeleteMessagePopUpClose = (): void => {
        this.setState({
            deleteMessagePopUp: {
                isOwn: false,
                isShown: false
            }
        })
    };

    handleDeleteMessage = (deleteForEveryOne?: boolean): void => {
        const {deleteMessagePopUp: {isOwn}, editingMessage, contextMenuMessage} = this.state;
        if (!isOwn || isOwn && !deleteForEveryOne) {
            this.messageLocalDelete();
        } else if (isOwn && deleteForEveryOne) {
            this.messageDeleteEverywhere();
        }

        this.handleDeleteMessagePopUpClose();

        if (editingMessage) {
            const editingMsgId: string = editingMessage.get("messageId") || editingMessage.get("msgId") || editingMessage.get("id");
            const deletingMsgId: string = contextMenuMessage.get("messageId") || contextMenuMessage.get("msgId") || contextMenuMessage.get("id");

            if (editingMsgId === deletingMsgId) {
                this.setState({removeEditingMessage: true});
            }
        }
    };

    handleShowInFolder = async (message?: any) => {

        const {contextMenuMessage} = this.state;

        let messageToShow: any = message || contextMenuMessage;
        messageToShow = Map.isMap(messageToShow) ? messageToShow : fromJS(messageToShow);
        const {downloadFile} = this.props;
        const path = await MessagesModel.checkFileInFolder(messageToShow);
        if (path) {
            (window as any).remote.shell.showItemInFolder(path);
        } else {
            const downloadInfo = {
                fileRemotePath: Map.isMap(messageToShow) ? messageToShow.get("fileRemotePath"): messageToShow['fileRemotePath'],
                threadId: Map.isMap(messageToShow) ? messageToShow.get("threadId") : messageToShow['threadId'],
                method: "GET",
                msgId: Map.isMap(messageToShow) ?  messageToShow.get("messageId") || messageToShow.get("msgId") || messageToShow.get("id") : messageToShow["messageId"] || messageToShow["msgId"] || messageToShow["id"]
            };
            downloadFile(downloadInfo);
        }
    };

    downloadFile = async () => {
        const {contextMenuMessage} = this.state;
        let url = contextMenuMessage.get("blobUrl");
        let fileType: string;
        switch (contextMenuMessage.get("type")) {
            case MESSAGE_TYPES.file:
                fileType = JSON.parse(contextMenuMessage.get("info")).fileType;
                break;
            case MESSAGE_TYPES.image:
                fileType = "jpg";
                break;
            case MESSAGE_TYPES.stream_file:
            case MESSAGE_TYPES.video:
                fileType = "mp4";
                break;
            case MESSAGE_TYPES.voice:
                fileType = "mp3";
                break;
            default:
                fileType = "";
                break;
        }
        if (fileType && url) {
            const msgId = contextMenuMessage.get("id") || contextMenuMessage.get("messageId");
            if (["jpg"].includes(fileType)) {
                const link: HTMLAnchorElement = document.createElement("a");
                link.href = url;
                link.download = msgId + "." + fileType;
                link.click();
            } else {
                let fileName;
                try {
                    fileName = JSON.parse(contextMenuMessage.get("info")).fileName + "." + fileType;
                } catch (e) {
                    Log.i('is not valid json string', e);
                } finally {
                    fileName = !fileName || fileName.includes('undefined') ? msgId + "." + fileType : fileName;
                }
                downloadFromUrlWithName(fileName, url, msgId);
            }
        }
    };

    closeCallOut = (): void => {
        this.setState({isCallOutShown: false});
    };

    editMessage = (): void => {
        const {contextMenuMessage} = this.state;
        this.removeReplyMessage();
        this.setState({editingMessage: contextMenuMessage});
    };

    handleMessageReply = (repliedPersonally: boolean = false, message?: any): void => {
        const {contextMenuMessage, editingMessage} = this.state;
        const inputField = (document.getElementById("footer-input-text") as HTMLDivElement);

        if (editingMessage) {
            this.removeMessageEditing();
            if (inputField) {
                inputField.innerText = "";
            }
        }
        let replyMessageText: string = emojify(message ? message.get("text") : contextMenuMessage.get("text"));

        this.setState({
            replyMessage: message ? message.set("repliedPersonally", repliedPersonally) : contextMenuMessage.set("repliedPersonally", repliedPersonally),
            replyMessageText: replyMessageText,
        });

        if (inputField) {
            inputField.innerText = "";
            inputField.focus();
        }
    };

    handleShowMoreMessages = (): void => {
        const { attemptGetMessages, messages, conversations, contacts,selectedThreadId} = this.props;
        Log.i("showMore -> messages = 1", messages)
        let firstMessageId = messages.valueSeq().getIn([0, 'messageId']) || messages.valueSeq().getIn([0, 'id']);
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const message = messages.get(firstMessageId);
        if (message.get("loadStatus") === LOAD_STATUS.LOAD_START ||
            message.get("loadStatus") === LOAD_STATUS.UPLOAD_FAILURE ||
            message.get("loadStatus") === LOAD_STATUS.UPLOAD_CANCEL ||
            message.get("type") === MESSAGE_TYPES.missed_call ||
            message.get("type") === MESSAGE_TYPES.outgoing_call ||
            message.get("type") === MESSAGE_TYPES.incoming_call ||
            message.get("deleted") === true ||
            message.get("hidden") === true) {
            Log.i("showMore -> messages = 2", messages)
            let found = false;
            messages.map((message) => {
                if (message.get("loadStatus") !== LOAD_STATUS.LOAD_START &&
                    message.get("loadStatus") !== LOAD_STATUS.UPLOAD_FAILURE &&
                    message.get("loadStatus") !== LOAD_STATUS.UPLOAD_CANCEL &&
                    message.get("type") !== MESSAGE_TYPES.missed_call &&
                    message.get("type") !== MESSAGE_TYPES.outgoing_call &&
                    message.get("type") !== MESSAGE_TYPES.incoming_call &&
                    message.get("deleted") !== true &&
                    message.get("hidden") !== true &&
                    !found) {
                    firstMessageId = message.get("id") || message.get("messageId");
                    found = true;
                }
            });
        }

        if (selectedThread && firstMessageId) {
            Log.i("showMore -> messages = 3", messages)
            attemptGetMessages(selectedThread, firstMessageId);
        }

    };

    handleDownScrollShowMoreMessages = (): void => {
        const { attemptGetScrollDownMessages, messages, selectedThreadId, conversations} = this.props;
        const selectedThread = conversations.get(selectedThreadId);
        let lastMessageIndex: number;
        if (messages && messages.size > 1) {
            lastMessageIndex = messages.size - 1;
        }
        let lastMessageId = messages.valueSeq().getIn([lastMessageIndex, 'messageId']) || messages.valueSeq().getIn([lastMessageIndex, 'id']);
        const lastMessage = messages.get(lastMessageId);

        const lastMessageLoadStatus = lastMessage && lastMessage.get("loadStatus");
        const lastMessageType = lastMessage && lastMessage.get("type");
        const lastMessageDeleted = lastMessage && lastMessage.get("deleted");
        const lastMessageHidden = lastMessage && lastMessage.get("hidden");


        if (lastMessageLoadStatus === LOAD_STATUS.LOAD_START ||
            lastMessageLoadStatus === LOAD_STATUS.UPLOAD_FAILURE ||
            lastMessageLoadStatus === LOAD_STATUS.UPLOAD_CANCEL ||
            lastMessageType === MESSAGE_TYPES.missed_call ||
            lastMessageType === MESSAGE_TYPES.outgoing_call ||
            lastMessageType === MESSAGE_TYPES.incoming_call ||
            lastMessageDeleted === true ||
            lastMessageHidden === true) {
            let found = false;
            messages.map((message) => {
                const loadStatus = message.get("loadStatus");
                const type = message.get("type");
                const deleted = message.get("deleted");
                const hidden = message.get("hidden");
                if (loadStatus !== LOAD_STATUS.LOAD_START &&
                    loadStatus !== LOAD_STATUS.UPLOAD_FAILURE &&
                    loadStatus !== LOAD_STATUS.UPLOAD_CANCEL &&
                    type !== MESSAGE_TYPES.missed_call &&
                    type !== MESSAGE_TYPES.outgoing_call &&
                    type !== MESSAGE_TYPES.incoming_call &&
                    deleted !== true &&
                    hidden !== true &&
                    !found) {
                    lastMessageId = message.get("id") || message.get("messageId");
                    found = true;
                }
            });
        }
        if (selectedThread && lastMessageId) {
            attemptGetScrollDownMessages(selectedThread, lastMessageId, lastMessage);
        }
    };

    scroll = (): void => {
        scrollToBottom();
    };

    createMessage = (messageToSave: any) => {
        const {user, selectedThreadId,conversations, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const username = user.get("username");
        const email: string = user && user.get("email") || "";

        return {
            to: selectedThreadId.split("/").shift(),
            id: messageToSave.id || messageToSave.messageId,
            aswToSave: messageToSave.fileRemotePath,
            awsId: messageToSave.fileRemotePath,
            fileSize: messageToSave.fileSize,
            type: isGroup ? XML_MESSAGE_TYPES.group : XML_MESSAGE_TYPES.chat,
            msgInfo: messageToSave.info,
            msgText: messageToSave.text,
            msgType: messageToSave.type,
            email: email,
            author: username,
            sid: "",
            pid: ""
        };
    };

    get isNotProductContact(): boolean {
        const {conversations, contacts, selectedThreadId} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId) || this.props.selectedThread;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        const isProductContact: boolean = thread && thread.get('isProductContact');
        return !isGroup && !isProductContact;
    };

    get isGroupMember() {
        const { user, conversations, selectedThreadId} = this.props;
        const selectedThread = conversations.get(selectedThreadId)
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        return thread.get("groupMembersUsernames") && thread.get("groupMembersUsernames").includes(user.get("username"));
    }

    get showFooter(): boolean {
        const { conversations, selectedThreadId, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        if(!selectedThread) {
            return false
        }
        const threadType: any = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        const isProductContact: boolean = thread && thread.get('isProductContact');
        return thread && !thread.get("disabled") && ((isGroup && this.isGroupMember) || isProductContact);
    }

    handleNetworkJoin = (keyword: string, token: boolean) => {
        const {attemptGetNetwork} = this.props;
        if (!!keyword) {
            attemptGetNetwork(keyword, token);
        }
    };

    handleNetworkJoinCancel = (): void => {
        const {setNetworkJoinPopUp, removeSearchedNetwork} = this.props;
        setNetworkJoinPopUp("");
        removeSearchedNetwork();
    };

    handleNetworkAdd = (): void => {
        const {attemptAddNetwork, searchedNetwork, networkToken} = this.props;
        const searchedNetworkObj = searchedNetwork.toJS();
        attemptAddNetwork(networkToken, searchedNetworkObj);
    };


    handlePopupClose = (): void => {
        this.setState({isUnsupportedFileType: false})
    };

    get savedContacts(): any {
        const {savedContacts} = this.props;
        const {keyword} = this.state;

        if (!savedContacts && savedContacts == null) {
            return
        }

        return savedContacts
            .filter(contact => {
                const {isGroup} = getThreadType(contact.getIn(["threads", "threadType"]));
                const threadInfo: any = isGroup ? contact.getIn(["threads", "threadInfo"]) : contact.get("members").first();
                return threadInfo.get("name") && threadInfo.get("name").toLowerCase().includes(keyword)
            })
    }

    toggleDropEventListeners = (remove: boolean = false) => {
        const messageContainer: any = document.getElementById("chat-container");
        const dropZoneContainer: any = this.dropZoneContainer && this.dropZoneContainer.current || null;
        if (remove) {
            messageContainer.removeEventListener("dragenter", this.handleDragEnter);
            if (dropZoneContainer) {
                dropZoneContainer.removeEventListener("dragleave", this.handleDragLeave);
                dropZoneContainer.removeEventListener("drop", this.handleDrop);
            }

        } else {
            messageContainer.addEventListener("dragenter", this.handleDragEnter);
            if (dropZoneContainer) {
                dropZoneContainer.addEventListener("dragleave", this.handleDragLeave);
                dropZoneContainer.addEventListener("drop", this.handleDrop);
            }

        }
    };

    toggleFileUploadPopUp = (isShown: boolean = false) => {
        this.setState({isFileUploadPopUpShown: isShown});
    };

    toggleDropZoneActive = (isActive: boolean = false) => {
        this.setState({isDropZoneActive: isActive});
    };

    handleCheckConference = (e: React.MouseEvent<HTMLElement>): void => {
        e.preventDefault();
        const store: Store<any> = storeCreator.getStore();
        const dispatch: any = store.dispatch;
        const {conversations, selectedThreadId, checkConference, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);

        const threadType: any = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        Log.i("conference -> selectedThread = ", thread)
        const groupId: string = getPartialId(thread.get("id"));
        dispatch(showConference())
        checkConference(groupId, thread.get("callId"));
    };

    get partisipantsCount() {
        const {conversations, selectedThreadId, checkConference, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);

        const threadType: any = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get("members").first();
        if (thread.get("statusMap")){
            let sum = 0
            thread.get("statusMap").forEach(item => {
                if (item === CALL_STATUSES.calling || item === CALL_STATUSES.join) {
                    sum++
                }
            })

            return sum
        } else {
            return 0
        }
    }

    get recentChats() {
        const {conversations} = this.props;
        return conversations.size > 20 ? conversations.slice(0, 20) : conversations;
    }

    get popup(): JSX.Element {
        const {
            isForwardThreadsShown, isCallOutShown, isSendContactPopupShown, deleteEverywhere, isInvalidFileType,
            invalidFileName, deleteMessagePopUp, isUnsupportedFileType
        } = this.state;
        const {
            conversations, contacts, user, networkJoinPopUp, searchedNetwork, removeNetworkError, selectedThreadId,
            UNBLOCK_CONTACT, BLOCK_CONTACT, networkError, forwardMessage
        } = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const localization: any = components().chatPanel;
        const showForwardMessagePopUp: boolean = forwardMessage && !forwardMessage.isEmpty();

        const showErrorPopUp: boolean = !!networkError && networkError === NETWORK_JOIN_POPUP.TOKEN;

        const localizationNetwork: any = components().networks;

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
                transitionLeaveTimeout={230}
            >
                {
                    networkJoinPopUp && networkJoinPopUp === NETWORK_JOIN_POPUP.TOKEN && searchedNetwork && !searchedNetwork.isEmpty() &&
                    <PopUpMain
                        confirmButton={this.handleNetworkAdd}
                        confirmButtonText={localizationNetwork.confirmAddButton}
                        cancelButton={this.handleNetworkJoinCancel}
                        cancelButtonText={localizationNetwork.cancelAddButton}
                        titleText={localizationNetwork.joinNetworkTitle}
                        infoText={`${localizationNetwork.joinNetworkText1} ${searchedNetwork.get("nickname")}`}
                        showPopUpLogo={true}
                    />
                }

                {
                    isUnsupportedFileType &&
                    <PopUpMain
                        confirmButton={this.handlePopupClose}
                        confirmButtonText={localization.OK}
                        titleText={localization.cantBeSent}
                        infoText={localization.notSupportedYet}
                        showPopUpLogo={true}
                    />
                }

                {
                    showErrorPopUp &&
                    <PopUpMain
                        confirmButton={removeNetworkError}
                        confirmButtonText={localizationNetwork.OkButton}
                        cancelButton={removeNetworkError}
                        cancelButtonText=""
                        titleText={localizationNetwork.invalidTokenTitle}
                        infoText={localizationNetwork.invalidTokenText}
                        showPopUpLogo={true}
                    />
                }

                {
                    isForwardThreadsShown && showForwardMessagePopUp &&
                    <ForwardMessagePopup
                        close={this.handleForwardPopUpClose}
                        showForwardMessagePopUp={showForwardMessagePopUp}
                        recentChats={this.recentChats}
                        forwardMessageSend={this.forwardMessageSend}
                        UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                        BLOCK_CONTACT={BLOCK_CONTACT}
                        selectedThread={selectedThread}
                        selectedThreadId={selectedThreadId}
                        user={user}
                    />
                }

                {
                    !(isForwardThreadsShown && showForwardMessagePopUp) && isSendContactPopupShown &&
                    <SendContactPopUp
                        close={this.handleSendContactsPopUpClose}
                        isSendContactPopupShown={isSendContactPopupShown}
                        sendContact={this.sendContact}
                    />
                }

                {
                    isInvalidFileType &&
                    <PopUpMain
                        confirmButton={this.handleInvalidFilePupUpClose}
                        confirmButtonText={localization.ok}
                        titleText={"Unsupported file"}
                        infoText={`Sorry ${invalidFileName} is a type of file not supported by ${conf.app.name}`}
                        showPopUpLogo={true}
                    />
                }

                {
                    isCallOutShown &&
                    <PopUpMain
                        confirmButton={this.closeCallOut}
                        cancelButton={this.closeCallOut}
                        confirmButtonText={localization.ok}
                        titleText={localization.callOutTitle}
                        infoText={localization.callOutText}
                        showPopUpLogo={true}
                    />
                }

                {
                    !isCallOutShown && deleteEverywhere &&
                    <PopUpMain
                        confirmButton={this.messageDeleteEverywhere}
                        confirmButtonText={localization.delete}
                        cancelButton={this.handleDeleteEverywherePopupToggle}
                        cancelButtonText={localization.cancel}
                        titleText={localization.deleteEverywhereTitle}
                        infoText={localization.deleteEverywhereText}
                        showPopUpLogo={true}
                    />
                }

                {
                    deleteMessagePopUp.isShown &&
                    <PopUpMain
                        showPopUpLogo={true}
                        confirmButton={this.handleDeleteMessage}
                        confirmButtonText={localization.delete}
                        cancelButton={this.handleDeleteMessagePopUpClose}
                        cancelButtonText={localization.cancel}
                        titleText={localization.deleteThisMessage}
                        infoText={!deleteMessagePopUp.isOwn ? localization.deleteUndo : ""}
                        checkInfo={localization.deleteForEveryone}
                        shouldCheckOnPopupApprove={deleteMessagePopUp.isOwn}
                        isChecked={true}
                    />
                }
            </ReactCSSTransitionGroup>
        );
    }

    render(): JSX.Element {
        const {
            displayMessagesCount, isForwardThreadsShown, editingMessage, isSendContactPopupShown,
            replyMessage, replyMessageText, isDropZoneActive, contextMenuMessage, isFileUploadPopUpShown,
            removeEditingMessage,showBlockedPopUp, animationLeftLength, animationRightLength,
            groupTextAnimationLeftLength, groupTextAnimationRightLength
        } = this.state;
        const {
            showMore, messages, contacts, user, togglePopUp, toggleMap, lastCall,
            attemptSetCreateContactNumber, handleAudioChange, inviteToCall, removeCallDetails,
            callDetails, downloadFile, setSendingLocation, attemptOptimiseVideo, setShowShareMedia, uploadFile,
            updateMessageProperty, deleteMessageFromStore, app, updateCallPanel,
            attemptResetConversationLastMessage, stickers, languages, sharedMediaPanel,
            myStickers, messagesLoadStatus, showNotification, gifMessages, attemptSetStickersIcons,
            searchedActiveMessage, sendTyping, editMessage, attemptReplyMessage, uploadRequest,
            attemptSetConversationDraft, setActiveSubPage, sendStoppedTyping, removeFiles,
            recentStickers, chat, privacy, attemptSendMessage, ADD_MEDIA_RECORD,
            attemptSendFileMessage, attemptCreateContact, attemptSetSelectedThread, UPDATE_MEDIA_RECORD,
            SEND_FILE_MESSAGE, UNBLOCK_CONTACT, conversations, selectedThreadId, isRedialScreenShown, showConference, conferenceDetails
        } = this.props;
        const selectedThread = conversations && conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const conferenceId = conferenceDetails.getIn(['info', 'threadId'])
        let conferenceInfo = null

        if (conferenceId) {
            conferenceInfo = conversations.getIn([conferenceId, 'threads', 'threadInfo'])
        }
        Log.i("conference -> conferenceInfo = ", conferenceInfo)


        const threadIsEmpty = !selectedThreadId;
        const localization: any = components().chatPanel;
        const blockedLocalization: any = components().blockedPopUp;
        const setParentStateFromCallPanel: any = ({minimized, showChat}) => {
            if (typeof (minimized) !== "undefined" && typeof (showChat) !== "undefined") {
                updateCallPanel(minimized, showChat)
            } else if (typeof (minimized) !== "undefined" && typeof (showChat) === "undefined") {
                updateCallPanel(minimized, app.showChat);
            } else if (typeof (minimized) === "undefined" && typeof (showChat) !== "undefined") {
                updateCallPanel(app.minimized, showChat);
            }
        };
        // if(!selectedThreadId) {
        //     return null
        // }
        const threadType: any = selectedThread?.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const threadInfo: any = isGroup ? selectedThread?.getIn(['threads', 'threadInfo']) : selectedThread?.get("members")?.first();
        Log.i("conference -> threadInfo = ", threadInfo)

        const conferenceCallId = threadInfo?.get("callId");

        return (
            <div
                className={`right_side${app.showChat && !app.minimized ? " chat_background calling-show-chat" : !threadIsEmpty ? " chat_background" : ""}`}
                id="chat-container"
            >
                {app.applicationState.isOnline && conferenceCallId && <JoinConference
                    style={{
                        // transform: showRightPanel ? "translateX(314px)" : "translateX(0)",
                        width: app.showRightPanel ? "calc(100% - 314px)" : "100%",
                        willChange: "width",
                        transition: "transform 0.125s ease-in-out"
                    }}
                >
                    <ParticipantsInfo>
                        <h1>Join Conference</h1>
                        <span>{`${this.partisipantsCount} ${this.partisipantsCount <= 1 ? "participant" : "participants"}`}</span>
                    </ParticipantsInfo>
                    <JoinButton
                        onClick={this.handleCheckConference}
                    >join</JoinButton>
                </JoinConference>}
                {
                    showConference && conferenceInfo &&
                    <ConferencePanel
                        updateCallPanel={updateCallPanel}
                        minimized={app.minimized}
                        setParentState={setParentStateFromCallPanel}
                        showChat={app.showChat}
                        lastCall={lastCall}
                        user={user}
                        threadInfo={conferenceInfo}
                    />
                }

                {
                    ((callDetails && Object.keys(callDetails).length === 3) || (!showConference && (lastCall || isRedialScreenShown))) &&
                    <CallPanel
                        showNotification={showNotification}
                        removeCallDetails={removeCallDetails}
                        setParentState={setParentStateFromCallPanel}
                        callDetails={callDetails}
                        minimized={app.minimized}
                        showChat={app.showChat}
                        threadIsEmpty={threadIsEmpty}
                        handleInviteToCall={inviteToCall}
                    />
                }
                {/*Popup block*/}
                {this.popup}
                {/*messages && messages.size < 1*/}
                {
                    (conversations.get(selectedThreadId) || contacts.get(selectedThreadId) ) && !conversations.has(selectedThreadId) && messages && messages.size < 1 && !this.isNotProductContact &&
                      <EmptyChatMessage
                        showRightPanel={app.showRightPanel}
                       />
                }
                <div
                    ref={this.dropZoneContainer}
                    className={`drop-block${isDropZoneActive && !isFileUploadPopUpShown ? ` drop-block-active${app.showChat && !app.minimized ? ' drop-block-active-incall' : ''}` : ''}`}>
                    <div className="drop-content">
                        <span className="icon-drop"/>
                        <p className="drop-text">{localization.dropFiles}</p>
                    </div>
                </div>

                {
                    !threadIsEmpty &&
                    <MessagesContainer
                        attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                        displayMessagesCount={displayMessagesCount}
                        // setContainerRef={this.chatBody}
                        setContainerRef={this.setContainerRef}
                        onRightClick={this.handleMessageRightClick}
                        selectedContact={conversations.get(selectedThreadId) || contacts.get(selectedThreadId)}
                        inviteToCall={inviteToCall}
                        messages={messages.valueSeq()}
                        messagesMap={messages}
                        togglePopUp={togglePopUp}
                        handleShowMoreMessages={this.handleShowMoreMessages}
                        handleAudioChange={handleAudioChange}
                        thread={conversations.get(selectedThreadId) || contacts.get(selectedThreadId)}
                        createMessage={this.createMessage}
                        attemptOptimiseVideo={attemptOptimiseVideo}
                        toggleMap={toggleMap}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        updateMessageProperty={updateMessageProperty}
                        deleteMessage={deleteMessageFromStore}
                        minimized={app.minimized}
                        resetConversationLastMessage={attemptResetConversationLastMessage}
                        dropzoneActive={isDropZoneActive}
                        stickers={stickers}
                        contacts={contacts}
                        showChat={app.showChat}
                        caches={app.caches}
                        user={user}
                        showMore={showMore}
                        languages={languages}
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        showSharedMedia={app.showSharedMedia}
                        setShowSharedMedia={setShowShareMedia}
                        gifMessages={gifMessages}
                        attemptSetStickersIcons={attemptSetStickersIcons}
                        searchedActiveMessage={searchedActiveMessage}
                        handleDownScrollShowMoreMessages={this.handleDownScrollShowMoreMessages}
                        handleNetworkJoin={this.handleNetworkJoin}
                        toggleDropEventListeners={this.toggleDropEventListeners}
                        attemptCreateContact={attemptCreateContact}
                        isOnline={app.applicationState.isOnline}
                        showRightPanel={app.showRightPanel}
                        animationLeftLength={animationLeftLength}
                        animationRightLength={animationRightLength}
                        groupTextAnimationLeftLength={groupTextAnimationLeftLength}
                        groupTextAnimationRightLength={groupTextAnimationRightLength}
                        selectedConversation={conversations.get(selectedThreadId) || contacts.get(selectedThreadId)}

                        attemptSetSelectedThread={attemptSetSelectedThread}
                        ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                        UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}
                        selectedThreadId={selectedThreadId}
                        forwardMessage={this.forwardMessage}
                        handleMessageReply={this.handleMessageReply}
                        handleMessageDelete={this.handleDeleteMessagePopUpOpen}
                        handleShowInFolder={this.handleShowInFolder}
                    />
                }

                {
                    threadIsEmpty && <SplashScreen user={user}/>
                }
                {
                    showBlockedPopUp &&
                    <PopUpMain
                      confirmButton={this.handleUnBlockContact}
                      confirmButtonText={blockedLocalization.confirm}
                      cancelButtonText={blockedLocalization.cancel}
                      titleText={blockedLocalization.title}
                      infoText={blockedLocalization.unblockInfo}
                      showPopUpLogo={true}
                    />
                }

                {
                    this.showFooter &&
                    <ChatPanelFooter
                        removeMessageEditing={this.removeMessageEditing}
                        toggleSendContactPopup={this.handleSendContactPopupToggle}
                        removeReplyMessage={this.removeReplyMessage}
                        createMessage={this.createMessage}
                        toggleDropEventListeners={this.toggleDropEventListeners}
                        toggleFileUploadPopUp={this.toggleFileUploadPopUp}
                        toggleDropZoneActive={this.toggleDropZoneActive}
                        isFileUploadPopUpShown={isFileUploadPopUpShown}
                        removeEditingMessage={removeEditingMessage}
                        editingMessage={editingMessage}
                        sendMessage={attemptSendMessage}
                        replyingMessage={replyMessage}
                        removeFiles={removeFiles}
                        attemptSetConversationDraft={attemptSetConversationDraft}
                        editMessage={editMessage}
                        sendStoppedTyping={sendStoppedTyping}
                        setActiveSubPage={setActiveSubPage}
                        uploadRequest={uploadRequest}
                        setShowSharedMedia={setShowShareMedia}
                        attemptReplyMessage={attemptReplyMessage}
                        sendTyping={sendTyping}
                        attemptSendFileMessage={attemptSendFileMessage}
                        showRightPanel={app.showRightPanel}
                        setSendingLocation={setSendingLocation}

                        isForwardThreadsShown={isForwardThreadsShown}
                        showSendContactPopUp={isSendContactPopupShown}
                        language={languages.get('selectedLanguage')}
                        selectedThreadId={selectedThreadId}
                        replyMessageText={replyMessageText}
                        selectedThread={conversations.get(selectedThreadId) || contacts.get(selectedThreadId)}
                        recentStickers={recentStickers}
                        chatBody={this.chatBody}
                        myStickers={myStickers}
                        contacts={contacts}
                        stickers={stickers}
                        privacy={privacy}
                        chat={chat}
                        user={user}
                        app={app}

                        SEND_FILE_MESSAGE={SEND_FILE_MESSAGE}
                        UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                    />
                     }

                <ContextMenuChatPanel
                    contextMenuMessage={contextMenuMessage}
                    selectedThread={conversations.get(selectedThreadId) || contacts.get(selectedThreadId)}
                    myStickers={myStickers}
                    setContextMenuRef={this.setContextMenuRef}
                    handleFileDownload={this.downloadFile}
                    handleMessageForward={this.forwardMessage}
                    handleMessageEdit={this.editMessage}
                    handleMessageReply={this.handleMessageReply}
                    handleMessageDelete={this.handleDeleteMessagePopUpOpen}
                    handleShowInFolder={this.handleShowInFolder}
                    handleStickerPackageAdd={this.handleStickerPackageAdd}
                    handleDeleteEverywherePopupToggle={this.handleDeleteEverywherePopupToggle}
                />


                {this.isNotProductContact && selectedThreadId && <CallOutMessage showRightPanel={app.showRightPanel}/>}

                <MessageModal render={({left, top, handleMessageDelete, handleShowInFolder, handleMenuPopUpClose, isOpen}) => (
                    <ContextMenu
                        handleMessageDelete={handleMessageDelete}
                        handleShowInFolder={handleShowInFolder}
                        handelMenuPopUpClose={handleMenuPopUpClose}
                        clientX={left}
                        clientY={top}
                        menuPopup={isOpen}
                    />
                )}/>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    toggleBlocked: (id, blocked) => dispatch(toggleBlocked(id, blocked)),
    attemptToggleBlock: (contactToBlock, command, requestId) => dispatch(attemptToggleBlock(contactToBlock, command, requestId)),
    updateCallPanel: (minimized, showChat) => dispatch(updateCallPanel(minimized, showChat)),
    attemptSetConversationDraft: (threadId: string, draft: string) => dispatch(attemptSetConversationDraft(threadId, draft)),
    sendMessageSeen: (to, id, author, isGroup) => dispatch(sendMessageSeen(to, id, author, isGroup)),
    setActiveSubPage: activeSubPage => dispatch(setActiveSubPage(activeSubPage)),
    sendMessage: (message: any, messageToSave: any) => dispatch(sendMessage(message, messageToSave)),
    editMessage: (message: any) => dispatch(attemptEditMessage(message)),
    attemptSetCreateContactNumber: phone => dispatch(attemptSetCreateContactNumber(phone)),
    attemptResetConversationNewMessagesIds: id => dispatch(attemptResetConversationNewMessagesIds(id)),
    attemptDeleteMessage: (id, message) => dispatch(attemptDeleteMessage(id, message)),
    uploadFile: (messages, file) => dispatch(uploadFile(messages, file)),
    attemptSetSelectedThread: (thread, callback) => dispatch(attemptSetSelectedThread(thread, null, "", callback)),
    uploadRequest: (messages, file) => dispatch(uploadRequest(messages, file)),
    resetGroupNewMessagesIds: id => dispatch(resetGroupNewMessagesIds(id)),
    setSelectedInfoThreadId: id => dispatch(setSelectedInfoThreadId(id)),
    downloadFile: (downloadInfo) => dispatch(downloadFile(downloadInfo)),
    setSendingLocation: (location) => dispatch(setSendingLocation(location)),
    toggleRightPanel: show => dispatch(toggleRightPanel(show)),
    sendStoppedTyping: to => dispatch(sendStoppedTyping(to)),
    localDelete: (id, threadId, send) => dispatch(messageLocalDelete(id, threadId, send)),
    setFiles: files => dispatch(setFiles(files)),
    removeCall: id => dispatch(removeCall(id)),
    attemptOptimiseVideo: (message, file) => dispatch(attemptOptimiseVideo(message, file)),
    updateMessageProperty: (msgId, property, value) => dispatch(updateMessageProperty(msgId, property, value)),
    deleteMessageFromStore: (msgId) => dispatch(deleteMessageFromStore(msgId)),
    attemptGetMessages: (thread, msgId) => dispatch(attemptGetMessages(thread, msgId)),
    attemptResetConversationLastMessage: (threadId) => dispatch(attemptResetConversationLastMessage(threadId)),
    setConversationLastMessage: (threadId, message) => dispatch(setConversationLastMessage(threadId, message)),
    addSharedMediaMessages: (messageId, message) => dispatch(addSharedMediaMessages(messageId, message)),
    attemptAddSticker: (id) => dispatch(attemptAddSticker(id)),
    changeLeftPanel: (leftPanel) => dispatch(changeLeftPanel(leftPanel)),
    attemptCreateMessage: (message) => dispatch(attemptCreateMessage(message)),
    setShowShareMedia: (showSharedMedia) => dispatch(setShowSharedMedia(showSharedMedia)),
    setSearchKeyword: (keyword) => dispatch(setSearchKeyword(keyword)),
    attemptSetStickersIcons: (id, callback, iconId) => dispatch(attemptSetStickersIcons(id, callback, iconId)),
    attemptAddStickerPreviewIcon: (id) => dispatch(attemptAddStickerPreviewIcon(id)),
    attemptGetScrollDownMessages: (thread: any, msgId: string, message: any) => dispatch(attemptGetScrollDownMessages(thread, msgId, message)),
    attemptReplyMessage: (message: any) => dispatch(attemptReplyMessage(message)),
    attemptAddRecentSticker: id => dispatch(attemptAddRecentSticker(id)),
    toggleResetStoreMessages: (resetStoreMessages: boolean) => dispatch(toggleResetStoreMessages(resetStoreMessages)),
    setForwardMessage: (messages: any) => dispatch(setForwardMessage(messages)),
    clearForwardMessage: () => dispatch(clearForwardMessage()),
    removePrivateChatError: () => dispatch(removePrivateChatError()),
    toggleShowMore: (showMore: boolean) => dispatch(toggleShowMore(showMore)),
    attemptSendForwardMessage: (messages: any, threadIds: Array<string>, emailsMap: { [key: string]: string }) => dispatch(attemptSendForwardMessage(messages, threadIds, emailsMap)),
    removeFiles: () => dispatch(removeFiles()),
    sendTyping: (to, isGroup) => dispatch(sendTyping(to, isGroup)),
    attemptGetNetwork: (id, token) => dispatch(attemptGetNetwork(id, token)),
    setNetworkJoinPopUp: networkJoinPopUp => dispatch(setNetworkJoinPopUp(networkJoinPopUp)),
    attemptAddNetwork: (nicknameOrToken: any, network: INetwork) => dispatch(attemptAddNetwork(nicknameOrToken, network)),
    removeSearchedNetwork: () => dispatch(removeSearchedNetwork()),
    removeNetworkError: () => dispatch(removeNetworkError()),

    attemptSendMessage: (message, messageType, meta) => dispatch(attemptSendMessage(message, messageType, meta)),
    attemptSendFileMessage: (file, meta, blob) => dispatch(attemptSendFileMessage(file, meta, blob)),
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels)),

    // Conference call actions start

    declineConference: () => dispatch(decline()),
    acceptConference: () => dispatch(accept()),

    // Conference call actions end

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => dispatch(ADD_MEDIA_RECORD(sharedMediaType, sharedMediaRecords)),
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => dispatch(UPDATE_MEDIA_RECORD(sharedMediaType, messageId, property, sharedMediaUpdater)),
    SEND_FILE_MESSAGE: (file, meta, blob) => dispatch(SEND_FILE_MESSAGE(file, meta, blob)),
    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds)),
    BLOCK_CONTACT: (contactIds: string[]) => dispatch(BLOCK_CONTACT(contactIds)),
    DELETE_SHARED_MEDIA_MESSAGES: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => dispatch(DELETE_SHARED_MEDIA_MESSAGES(messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages)),
    checkConference: (groupId: string, callId: string) => dispatch(join(groupId, callId)),
});

export default connect<{}, {}, IChatPanelPassedProps>(mapStateToProps, mapDispatchToProps)(ChatPanel);
