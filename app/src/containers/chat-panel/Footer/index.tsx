"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import throttle from "lodash/throttle";

import {
    ENTER_KEY_CODE,
    ESC_KEY_CODE,
    LEFT_PANELS,
    MEDIA_ACCESS_TYPE,
    MESSAGE_BOX_TYPES,
    MESSAGE_TYPES,
    UNSUPPORTED_FILE_TYPES,
} from "configs/constants";
import FileUploadPopUp from "containers/chat-panel/Footer/FileUploadPopUp";
import SendLocation from "containers/chat-panel/Footer/SendLocation";
import StickerContainer from "components/stickers/StickerContainer";
import ContentEditable from "components/common/bin/ContentEditable";
import MoreActions from "containers/chat-panel/Footer/MoreActions";
import {
    getCaretNode,
    getCaretPosition,
    getNodeIndex,
    isFullScreen,
    placeCaretAtEnd,
    setCaretPosition
} from "helpers/DomHelper";
import {demojify, emojify, setEmoji} from "helpers/EmojiHelper";
import TakeVideo from "containers/chat-panel/Footer/TakeVideo";
import TakePhoto from "containers/chat-panel/Footer/TakePhoto";
import TakeAudio from "containers/chat-panel/Footer/TakeAudio";
import {getThread, getThreadType, showMessageBox} from "helpers/DataHelper";
import ReplyBlock from "containers/chat-panel/Reply/ReplyBlock";
import {IMessage} from "modules/messages/MessagesReducer";
import PopUpMain from "components/common/PopUpMain";
import {getThumbnail} from "helpers/FileHelper";
import components from "configs/localization";
import "scss/pages/chat-panel/ChatPanelFooter";
import {checkForMediaAccess} from "helpers/MessageBoxHelper";
import Log from "modules/messages/Log";
import {ImageManager} from "helpers/ImageHelper";
import {getLocation} from "requests/locationRequest";
import {setSendingLocation} from "modules/application/ApplicationActions";

const contactStickerSvg = require("assets/images/chat-sticker.svg");
const contactRecordSvg = require("assets/images/chat-record.svg");
const chatSendMessageSvg = require("assets/images/chat-send-message.svg");

interface IChatPanelFooterPassedProps {
    attemptSetConversationDraft: (threadId: string, draft: string) => void;
    setShowSharedMedia?: (showSharedMedia: boolean) => void;
    sendMessage: (message: any, messageType: string, meta: any) => void;
    attemptSendFileMessage: (file: File, meta: any, blob: Blob) => void;
    toggleFileUploadPopUp?: (isShown?: boolean) => void;
    toggleDropEventListeners: (remove?: boolean) => void;
    sendTyping: (to: string, isGroup: boolean) => void;
    toggleDropZoneActive?: (isActive: boolean) => void;
    uploadRequest: (messages: any, file: File) => void;
    setActiveSubPage: (activeSubPage: string) => void;
    attemptReplyMessage: (message: any) => void;
    setSendingLocation: (location: any) => void;
    createMessage: (messageToSave: any) => void;
    sendStoppedTyping: (to: string) => void;
    editMessage: (message: any) => void;
    toggleSendContactPopup: () => void;
    removeMessageEditing: () => void;
    isFileUploadPopUpShown: boolean;
    showRightPanel: boolean;
    removeReplyMessage: () => void;
    isForwardThreadsShown: boolean;
    showSendContactPopUp: boolean;
    removeEditingMessage: boolean;
    replyingMessage: IMessage;
    selectedThreadId: string;
    editingMessage: IMessage;
    removeFiles: () => void;
    replyMessageText: any;
    recentStickers: any;
    selectedThread: any;
    myStickers: any;
    language: any;
    contacts: any;
    stickers: any;
    chatBody: any;
    privacy: any;
    app: any;
    chat: any;
    user: any;

    SEND_FILE_MESSAGE: (file: File, meta: any, blob: Blob) => void;
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
}

interface IChatPanelFooterState {
    showBlockedPopUp: boolean;
    showFailedPopUp: boolean;
    inputTextHeight: number;
    showMoreActions: boolean;
    showSmiles: boolean;
    typingTimer: any;
    stickerKind: string;
    takePhoto: boolean;
    takeVideo: boolean;
    takeAudio: boolean;
    files: File[];
    threadTexts: any;
    typing: boolean;
    requestId: any;
    caretNode: any;
    location: any;
    _message: string;
    isAudioRecording: boolean,
    isStopRecordingPopupShown: boolean,
    direction: any,
}

export default class ChatPanelFooter extends React.Component<IChatPanelFooterPassedProps, IChatPanelFooterState> {

    constructor(props: any) {
        super(props);

        this.state = {
            showBlockedPopUp: false,
            showFailedPopUp: false,
            stickerKind: "emoji",
            inputTextHeight: 38,
            showMoreActions: false,
            typingTimer: null,
            showSmiles: false,
            takePhoto: false,
            takeVideo: false,
            takeAudio: false,
            requestId: null,
            threadTexts: {},
            location: null,
            typing: false,
            caretNode: {},
            files: [],
            _message: "",
            isAudioRecording: false,
            isStopRecordingPopupShown: false,
            direction: 'ltr',
        };
    }

    inputArea: HTMLDivElement | any;

    lastSelectedNode: any;

    intervalId: any;

    stickerId: any = null;

    _moreActionsContainer: HTMLDivElement = null;

    _stickerContainer: HTMLDivElement = null;

    _audioContainer: HTMLDivElement = null;

    get messageReplyCreator(): string {
        let messageToReplayCreator: string = "";
        const {replyingMessage, user, selectedThread, contacts} = this.props;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread: any = isGroup ? selectedThread.getIn(['threads', 'threadInfo']) : selectedThread.get('members').first();
        const groupMembers: any = isGroup && selectedThread && selectedThread.get('members');

        if (replyingMessage) {
            const creatorId: string = replyingMessage.get("creator");
            const creatorInfo: any = groupMembers && groupMembers.get(creatorId);
            const creatorContact = contacts.get(creatorId);

            if (creatorId === user.get("id")) {
                const localization: any = components().messageElement;

                messageToReplayCreator = localization.You;
            } else if (isGroup) {
                if (!groupMembers.get(creatorId)) {
                    if (creatorContact) {
                        messageToReplayCreator = creatorContact.getIn(["members", creatorId, "name"]);
                    }
                } else {
                    messageToReplayCreator = creatorInfo.get("name");
                }
            } else {
                messageToReplayCreator = thread && thread.get("name");
            }
        }

        return messageToReplayCreator;
    }

    get messageSendAccess(): boolean {
        const {selectedThread, user} = this.props;
        const thread: any = getThread(selectedThread, user.get("username"));

        if (thread.get("blocked")) {
            this.setState({showBlockedPopUp: true});
            return false;
        } else if (user.get("phone") === thread.get("phone")) {
            this.setState({showFailedPopUp: true});
            return false;
        } else if (selectedThread.get("loading")) {
            return false;
        }
        return true;
    }

    componentDidMount(): void {
        const {selectedThreadId, selectedThread} = this.props;
        const conversations = selectedThread && selectedThread.get("conversations");
        const draft: any = conversations && emojify(conversations.get("draft"));
        let threadText = draft || "";

        if (threadText) {
            threadText = Array.isArray(threadText) ? threadText.join("") : threadText;
        }

        this.setState({
            caretNode: {node: this.inputArea, position: 0},
            threadTexts: (draft ? {[selectedThreadId]: draft} : {}),
            _message: threadText
        });

        this.inputArea && this.inputArea.focus();

        window.addEventListener("beforeunload", this.beforeUnloadListener);
    }


    beforeUnloadListener = () => {
        const {selectedThreadId} = this.props;
        const draft = demojify(this.inputArea);
        this.setThreadDraft(selectedThreadId, draft);
    };

    UNSAFE_componentWillReceiveProps(nextProps: IChatPanelFooterPassedProps): void {
        const {selectedThreadId} = this.props;
        if (selectedThreadId != nextProps.selectedThreadId) {
            const {threadTexts, _message} = this.state;
            const newState: IChatPanelFooterState = {...this.state};
            newState.threadTexts[selectedThreadId] = _message;
            newState._message = threadTexts[nextProps.selectedThreadId] || "";
            this.setThreadDraft(selectedThreadId, demojify(this.inputArea));
            this.setState(newState);
        }
    }

    shouldComponentUpdate(nextProps: IChatPanelFooterPassedProps, nextState: IChatPanelFooterState): boolean {

        const {
            editingMessage, replyingMessage, selectedThread, isForwardThreadsShown, language, myStickers, stickers,
            app, showSendContactPopUp, isFileUploadPopUpShown, chat, removeEditingMessage, showRightPanel
        } = this.props;

        if(showRightPanel !== nextProps.showRightPanel) {
            return true;
        }

        if (!selectedThread.equals(nextProps.selectedThread) &&
            !(selectedThread && nextProps.selectedThread && selectedThread.getIn(["conversations", "typing"]) !== nextProps.selectedThread.getIn(["conversations", "typing"]))) {
            return true;
        }

        if (!stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (!myStickers.equals(nextProps.myStickers)) {
            return true;
        }

        if (!isEqual(app.files, nextProps.app.files)) {
            return true;
        }

        if (!isEqual(app.sendingLocation, nextProps.app.sendingLocation)) {
            return true;
        }

        if (language !== nextProps.language) {
            return true;
        }

        if (!editingMessage && nextProps.editingMessage || editingMessage && !nextProps.editingMessage) {
            return true;
        }

        if (showSendContactPopUp !== nextProps.showSendContactPopUp) {
            return true;
        }

        if (chat.get("useEnterToSend") !== (nextProps.chat.get("useEnterToSend"))) {
            return true
        }

        if (removeEditingMessage !== nextProps.removeEditingMessage) {
            return true
        }

        if (!replyingMessage && nextProps.replyingMessage || replyingMessage && !nextProps.replyingMessage || replyingMessage && !replyingMessage.equals(nextProps.replyingMessage)) {
            return true;
        }

        if (isForwardThreadsShown !== nextProps.isForwardThreadsShown) {
            return true;
        }

        if (isFileUploadPopUpShown !== nextProps.isFileUploadPopUpShown) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IChatPanelFooterPassedProps, prevState: IChatPanelFooterState): void {
        const {
            selectedThread, selectedThreadId, app, sendStoppedTyping, privacy, showSendContactPopUp,
            toggleFileUploadPopUp, editingMessage, replyingMessage, isForwardThreadsShown, isFileUploadPopUpShown,
            removeEditingMessage
        } = this.props;
        const {location, typing, typingTimer, takePhoto, takeVideo, showSmiles} = this.state;
        const newState: IChatPanelFooterState = {...this.state};

        if (selectedThreadId && prevProps.selectedThreadId && selectedThreadId !== prevProps.selectedThreadId) {
            const conversations = selectedThread && selectedThread.get("conversations");
            const draft = conversations && emojify(conversations.get("draft"));
            let threadText = draft || "";


            if (threadText) {
                threadText = Array.isArray(threadText) ? threadText.join("") : threadText;
                newState.caretNode = {
                    node: this.inputArea,
                    position: 0
                };
                newState._message = threadText;
                newState.threadTexts = (draft ? {[selectedThreadId]: draft} : {});
            } else {
                newState._message = '';
            }

            if (location) {
                this.handleLocationToggle();
            }

            if (typing) {
                sendStoppedTyping(prevProps.selectedThreadId);
                clearTimeout(typingTimer);
                clearInterval(this.intervalId);
                newState.typing = false;
                newState.typingTimer = null;
            }
            this.inputArea && this.inputArea.focus();
        }

        if (!prevProps.isFileUploadPopUpShown && !isFileUploadPopUpShown && app.files && app.files.length > 0) {
            newState.files = app.files;
            toggleFileUploadPopUp(true);
        }

        if (editingMessage !== prevProps.editingMessage || replyingMessage !== prevProps.replyingMessage) {
            if (editingMessage || replyingMessage) {
                document.addEventListener("keydown", this.handleEditReplyEscPress);
            }
        }

        if (!prevProps.editingMessage && editingMessage || prevProps.editingMessage && editingMessage && !editingMessage.equals(prevProps.editingMessage)) {
            const messageText: any = editingMessage.get("type") === MESSAGE_TYPES.stream_file && editingMessage.get("text").match(/text="(.*?)"[ ]?\//) ? editingMessage.get("text").match(/text="(.*?)"[ ]?\//)[1] : editingMessage.get("text");
            const text: any = emojify(messageText.replace(/&lt;[?]/, "<?").replace(/&lt;3/, "<3"));
            this.inputArea.innerHTML = Array.isArray(text) ? text.join("") : text;
            placeCaretAtEnd(this.inputArea);
            newState._message = this.inputArea.innerHTML;
            if (!typing) {
                newState.typing = true;
                this.handleSendTyping();
                this.intervalId = setInterval(() => {
                    this.handleSendTyping();
                }, 4000);
            }

            if (typingTimer) {
                clearTimeout(typingTimer);
            }

            newState.typingTimer = setTimeout(() => {
                clearInterval(this.intervalId);
                this.setState({typing: false, typingTimer: null});
            }, 100);
        }

        if (prevProps.privacy.get("showTyping") && !privacy.get("showTyping") && typing) {
            sendStoppedTyping(selectedThreadId);
            clearTimeout(typingTimer);
            newState.typing = false;
            newState.typingTimer = null;
        }

        if (takePhoto || takeVideo || isFileUploadPopUpShown ||
            (!location && !isEqual(location, prevState.location)) || (showSendContactPopUp && showSendContactPopUp !== prevProps.showSendContactPopUp)) {
            //Close more action popup and remove listener
            newState.showMoreActions = false;
            this.toggleListener(false, 'click', this.handleCloseMoreActions);
        }

        if (!isEqual(location, prevState.location)) {
            this.props.toggleDropEventListeners(!!location);
        }

        if (isForwardThreadsShown) {
            newState.showSmiles = false;
            newState.showMoreActions = false;
            newState.takeAudio = false;
        }

        if (prevProps.app.sendingLocation !== app.sendingLocation) {

            newState.showMoreActions = false;
            Log.i("componentDidMount -> sendingLocation = ", newState.showMoreActions)
        }

        // newState.showMoreActions = false;

        this.setState(newState);

        if (removeEditingMessage) {
            this.handleMessageEditOrReplyCancel(null, 'removeMessageEditing');
        }
    }

    componentWillUnmount(): void {
        const {selectedThreadId} = this.props;
        const {threadTexts, _message} = this.state;
        if (this.inputArea) {
            threadTexts[selectedThreadId] = _message;
        }
        const draft = demojify(this.inputArea);
        this.setThreadDraft(selectedThreadId, draft);
        window.removeEventListener("beforeunload", this.beforeUnloadListener);

    }

    toggleMoreActions = (): void => {
        if (this.messageSendAccess) {
            const {showMoreActions} = this.state;
            this.setState({showMoreActions: !showMoreActions});
            // this.toggleListener(!showMoreActions, 'click', this.handleCloseMoreActions);
            // this.toggleListener(!showMoreActions, 'keydown', this.handleCloseMoreActions);
        }
    };

    handleCloseMoreActions = (event: any) => {
        if (this._moreActionsContainer && !this._moreActionsContainer.contains(event.target)) {
            if (event.type === "click" || event.key === "Escape") {
                this.toggleMoreActions();
            }
        }
    };

    toggleStickerContainer = () => {
        if (this.messageSendAccess) {
            const {showSmiles} = this.state;
            this.setState({showSmiles: !showSmiles});
            this.toggleListener(!showSmiles, 'click', this.handleClosePopUp);

            if (showSmiles) {
                this.inputArea.focus();
            }
        }
    };

    toggleAudioContainer = (e: any): void => {
        e.preventDefault();
        e.stopPropagation();

        const {takeAudio, isAudioRecording} = this.state;

        if (this.messageSendAccess) {
            if (!takeAudio && !isAudioRecording) {
                this.setState({takeAudio: true});
                this.toggleListener(true, 'click', this.handleClosePopUp, true);

            } else if (takeAudio && isAudioRecording) {
                this.toggleListener(false, 'click', this.handleClosePopUp, true);
                this.setState({isStopRecordingPopupShown: true})

            } else if (takeAudio && !isAudioRecording) {
                this.setState({takeAudio: false});
                this.toggleListener(false, 'click', this.handleClosePopUp, true);
            }
        }
    };

    _toggleAudioContainer = throttle(this.toggleAudioContainer, 500);


    handleClosePopUp = (event: any) => {
        const {showSmiles, takeAudio} = this.state;

        if (this._stickerContainer && !this._stickerContainer.contains(event.target)) {
            if (showSmiles) {
                this.toggleStickerContainer();
            }
        }

        if (this._audioContainer && (!this._audioContainer.contains(event.target) && !event.target.classList.contains("audio_record_chat_icon"))) {
            if (takeAudio) {
                this.toggleAudioContainer(event);
            }
        }
    };

    toggleListener = (add: boolean, eventName: string, callback: any, isBubbling?: boolean) => {
        if (add) {
            document.addEventListener(eventName, callback, isBubbling || false);
        } else {
            document.removeEventListener(eventName, callback, isBubbling || false);
        }
    };

    closeFileUploadPopUp = (): void => {
        const {toggleFileUploadPopUp, toggleDropZoneActive, removeFiles} = this.props;
        this.emptyFiles();
        toggleFileUploadPopUp(false);
        toggleDropZoneActive(false);
        removeFiles();
    };

    handleFiles = async (event: any, filesFromClipBoard?: FileList) => {
        const localization: any = components().chatPanelFooter;
        const {currentTarget, voiceDuration, amplitudes}: any = event || {};
        let files: Array<File> = currentTarget && currentTarget.files || filesFromClipBoard;
        const {removeReplyMessage, replyingMessage, toggleFileUploadPopUp} = this.props;
        const {takePhoto, takeVideo, takeAudio} = this.state;



        if (!files[0]) {
            return;
        }

        files = [...files];

        if (files.every(file => UNSUPPORTED_FILE_TYPES.includes(file.type))) {
            showMessageBox(
                true,
                MESSAGE_BOX_TYPES.info,
                [localization.OK],
                localization.cantBeSent,
                localization.notSupportedYet,
                undefined,
                undefined,
                0,
                0,
                () => false
            );
            return this.toggleMoreActions();
        }

        files = files.filter(file => !UNSUPPORTED_FILE_TYPES.includes(file.type));

        const sendDirect = (takeAudio || takePhoto || takeVideo);

        if (sendDirect) {
            for (const file of files) {
                let thumb: any = null;
                if (takePhoto) {
                    thumb = await getThumbnail(file);
                }

                let m_options: any

                if (thumb && thumb.dimensions) {
                    m_options = {
                        width: thumb.dimensions.width,
                        height: thumb.dimensions.height
                    }
                }

                this.sendFileMessage(file, voiceDuration, null, thumb && thumb.img, undefined, amplitudes, m_options || null);
            }
        } else {
            const newState: IChatPanelFooterState = {...this.state};
            newState.files = files;
            this.setState(newState);
            toggleFileUploadPopUp(true);
        }

        if (replyingMessage && sendDirect) {
            removeReplyMessage();
        }
    };

    handlePaste = (event: any) => {
        const {clipboardData} = event;
        const {files} = clipboardData;

        if (files.length > 0) {
            event.preventDefault();
            return this.handleFiles(null, files);
        }

        const pastedText: any = emojify(clipboardData.getData('Text'));
        if (!Array.isArray(pastedText)) {
            return;
        }
        event.preventDefault();

        const text = emojify(clipboardData.getData('Text')).join("");
        const inputText = this.inputArea.innerHTML;
        const target = document.createTextNode("\u0001");
        const target1 = document.createTextNode("\u0002");
        document.getSelection().getRangeAt(0).insertNode(target);
        document.getSelection().getRangeAt(0).collapse(false);
        document.getSelection().getRangeAt(0).insertNode(target1);
        const position = this.inputArea.innerHTML.indexOf("\u0001");
        const position2 = this.inputArea.innerHTML.indexOf("\u0002");
        target.parentNode.removeChild(target);
        target1.parentNode.removeChild(target1);

        this.inputArea.innerHTML = inputText.slice(0, position) + text + "<span id='caretTempElement'></span>" + inputText.slice(position2 - 1);
        const caretElement = document.getElementById("caretTempElement");

        const range: any = document.createRange();
        const sel: any = window.getSelection();
        range.setStart(caretElement, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        if (!(this.inputArea.scrollTop < caretElement.offsetTop && ((this.inputArea.scrollTop + this.inputArea.offsetHeight) > caretElement.offsetTop + 22))) {
            this.inputArea.scrollTop = caretElement.offsetTop;
        }

        this.inputArea.removeChild(caretElement);
        this.setState({_message: this.inputArea.innerHTML});
    };

    sendFileMessage = (file: File | any, voiceDuration: number, caption?: string, thumb?: string, blob: Blob = null, amplitudes?: string, m_options: any = null) => {
        const {attemptSendFileMessage, replyingMessage, removeReplyMessage, SEND_FILE_MESSAGE} = this.props;
        const meta: any = {
            voiceDuration: voiceDuration || null,
            caption: caption || null,
            thumb: thumb || null,
            m_options: m_options || null,
            replyingMessage: replyingMessage || null,
            amplitudes
        };

        attemptSendFileMessage(file, meta, blob);
        // SEND_FILE_MESSAGE(file, meta, blob);
        replyingMessage && removeReplyMessage();
    };

    handleMediaKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && !isFullScreen()) {
            this.handleLocationToggle();
        }
    };

    handleMediaToggle = (event: any, mediaName?: string) => {
        if (this.messageSendAccess) {
            const {showSmiles} = this.state;
            const newState: IChatPanelFooterState = {...this.state};

            if (showSmiles) {
                newState.showSmiles = false;
            }

            if (event) {
                const media: string = event.currentTarget.getAttribute('data-media');
                checkForMediaAccess(MEDIA_ACCESS_TYPE.CAMERA, () => {
                    newState[media] = !this.state[media];
                    this.setState(newState);
                });
            } else {
                newState[mediaName] = !this.state[mediaName];
                this.setState(newState);
            }


        }
    };

    handleInputSizeChange = () => {
        const {inputTextHeight} = this.state;
        if (this.inputArea.offsetHeight > inputTextHeight) {
            const chatePanel = document.getElementById("chatBackground");
            if (chatePanel) {
                chatePanel.scrollTop += this.inputArea.offsetHeight - inputTextHeight;
            }
        }
        this.setState({inputTextHeight: this.inputArea.offsetHeight});
    };

    changeStickerKind = (event: any, emoji: boolean = false) => {
        if (emoji) {
            this.setState({stickerKind: "emoji"});
        } else if (event.target.hasAttribute("id") || event.target.closest("#stickerSettings")) {
            if (event.target.closest("#stickerSettings")) {
                const {setActiveSubPage} = this.props;
                setActiveSubPage(LEFT_PANELS.sticker_store);
                this.handleCloseStickerContainer();
            } else {
                this.setState({stickerKind: event.target.id});
            }
        }
    };

    handleSetEmoji = (emj: any) => {
        const {caretNode} = this.state;
        const emoji: any = document.createElement("span");
        emoji.draggable = false;
        emoji.innerText = emj.native;
        Log.i(emoji, "emojiObj")
        // const emoji: any = document.createElement("img");
        // emoji.draggable = false;
        // emoji.className = emojiName;
        // emoji.src = "./assets/images/empty.png";
        // emoji.alt = emojiTextName || "";

        this.inputArea.innerText += emoji.innerText;
        this.setState({_message: this.inputArea.innerHTML});
        setCaretPosition(this.inputArea, getNodeIndex(emoji) + 1);

        if (this.inputArea !== null) {
            if (!(this.inputArea.scrollTop < emoji.offsetTop && ((this.inputArea.scrollTop + this.inputArea.offsetHeight) > emoji.offsetTop + 22))) {
                this.inputArea.scrollTop = emoji.offsetTop;
            }
            this.inputArea.focus();

            if (this.inputArea.offsetHeight != this.state.inputTextHeight) {
                this.handleInputSizeChange();
            }
        } // todo maybe remove after
    };

    handleStickerClick = (event: any) => {
        this.stickerId = event.target.id;



        const dimensions: any = {
            width: event.target.naturalWidth / 2,
            height: event.target.naturalHeight / 2,
        };

        Log.i("handleStickerClick -> dimensions = ", dimensions)

        this.handleSendMessage(event, MESSAGE_TYPES.sticker, {dimensions});
        this.handleCloseStickerContainer();
    };

    handleCloseStickerContainer = () => {
        this.setState({showSmiles: false});
        this.toggleListener(false, 'click', this.handleClosePopUp);
    };

    handleLocationToggle = async () => {
        if (this.messageSendAccess) {
            const {app, setSendingLocation} = this.props;

            if (app.sendingLocation) {
                setSendingLocation(null)
                // this.setState({showMoreActions: false});
                // this.setState({location: null});
            } else {
                const locationData = await getLocation();
                setSendingLocation({lat: locationData.lat, lng: locationData.lng})
                this.setState({showMoreActions: false});
                // this.setState({location: {lat: locationData.lat, lng: locationData.lng}, showMoreActions: false});
                // navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
                //     this.setState({location: {lat: latitude, lng: longitude}, showMoreActions: false});
                // })
            }
        }
    };

    handleCloseItselfMessagePopUp = () => {
        this.setState({showFailedPopUp: false});
    };

    handleMessageEditOrReplyCancel = (e: React.MouseEvent<HTMLElement>, actionType: string = "") => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const action: string = e && e.currentTarget.getAttribute('data-event-name') || actionType;
        const newState: IChatPanelFooterState = {...this.state};
        newState._message = '';
        this.inputArea.innerHTML = "";
        this.setState(newState);
        document.removeEventListener("keydown", this.handleEditReplyEscPress);
        this.props[action] && this.props[action]();
    };

    handleCancelUnBlockContact = () => {
        this.setState({showBlockedPopUp: false});
    };

    handleUnBlockContact = (): void => {
        const {selectedThread, user, UNBLOCK_CONTACT} = this.props;

        const threadInfo = selectedThread.get('members').first();

        const thread = getThread(selectedThread, user.get("username"));
        const numbers = thread.get("numbers");
        const contactId: string = numbers && numbers.toArray() || threadInfo.get("contactId");

        UNBLOCK_CONTACT([contactId]);
        this.setState({showBlockedPopUp: false});
    };

    emptyFiles = (): void => {
        const newState: IChatPanelFooterState = {...this.state};
        newState.files = [];
        this.setState(newState);
    };

    handleEditReplyEscPress = (event: React.KeyboardEvent<HTMLElement> | any) => {
        if (event.keyCode === ESC_KEY_CODE) {
            const {editingMessage, replyingMessage} = this.props;
            if (editingMessage) {
                this.handleMessageEditOrReplyCancel(null, 'removeMessageEditing');
            } else if (replyingMessage) {
                this.handleMessageEditOrReplyCancel(null, 'removeReplyMessage');
            }
        }
    };

    setThreadDraft = (threadId: string, draft: string): void => {
        const {selectedThread, attemptSetConversationDraft} = this.props;
        const conversation: any = selectedThread.get("conversations");
        const oldDraft: any = conversation && conversation.get("draft");
        const _draft = draft.trim();

        if ((oldDraft !== "" && !oldDraft && _draft) || (oldDraft === "" && _draft) || (oldDraft && oldDraft !== _draft)) {
            attemptSetConversationDraft(threadId, _draft);
        }
    };

    //Content editable element handlers start

    handleMessageChange = (event: any): void => {
        const {typing, typingTimer} = this.state;
        const {selectedThread, selectedThreadId} = this.props;
        const newState: IChatPanelFooterState = {...this.state};
        const blaـl = event.target.innerText.charAt(event.target.innerText.length -1);

        function checkRTL(s){
            const ltrChars    = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
              rtlChars    = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
              rtlDirCheck = new RegExp('^[^'+ltrChars+']*['+rtlChars+']');
            return rtlDirCheck.test(s);
        };

        if(blaـl !== "\n" && blaـl !== " ") {
            if (checkRTL(blaـl)) {
                newState.direction = "rtl";
            } else {
                newState.direction = "ltr";
            }
        }


        if (!typing) {
            newState.typing = true;
            this.handleSendTyping();
            this.intervalId = setInterval(() => {
                this.handleSendTyping();
            }, 4000);
        }

        if (typingTimer) {
            clearTimeout(typingTimer);
        }

        newState.typingTimer = setTimeout(() => {
            clearInterval(this.intervalId);
            this.setState({typing: false, typingTimer: null});
        }, 100);

        newState._message = event.currentTarget.innerHTML.replace(/<div.*?>/g, "").replace(/<\/div>/g, "").replace(/<br.*?>/g, "").replace(/<\/br.*?>/g, "");

        if (newState._message === "" && selectedThread.getIn(["conversations", "draft"])) {
            this.setThreadDraft(selectedThreadId, "")
        }
        let self = this
        this.setState(newState, () => {
            placeCaretAtEnd(this.inputArea)
        });
    };

    handleAppendNewLine = () => {
        const {inputTextHeight} = this.state;
        const caretPosition = getCaretPosition(this.inputArea);
        const caretNode = getCaretNode();
        const docFragment = document.createDocumentFragment();

        let newLineNode: any;
        const oneLine = "\n";
        const twoLine = "\n\n";

        if (this.inputArea.innerHTML === this.inputArea.innerText) {
            if (this.inputArea.innerHTML.length === caretPosition) {
                newLineNode = document.createTextNode(twoLine);

            } else {
                newLineNode = document.createTextNode(oneLine);
            }

        } else if (this.inputArea.innerHTML.length + caretNode.position === caretPosition) {
            newLineNode = document.createTextNode(twoLine);
        } else {
            newLineNode = document.createTextNode(oneLine);
        }

        docFragment.appendChild(newLineNode);

        let range = window.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(docFragment);

        range = document.createRange();
        range.setStartAfter(newLineNode);
        range.collapse(true);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        if (this.inputArea) {
            if (!(this.inputArea.scrollTop < newLineNode.offsetTop && ((this.inputArea.scrollTop + this.inputArea.offsetHeight) > newLineNode.offsetTop + 22))) {
                this.inputArea.scrollTop += this.inputArea.scrollTop + 18;
            }
            this.inputArea.focus();

            if (this.inputArea.offsetHeight != inputTextHeight) {
                this.handleInputSizeChange();
            }
        }
    };

    handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        const {chat} = this.props;

        if (event.ctrlKey && event.keyCode === ENTER_KEY_CODE) {
            this.handleAppendNewLine();

        } else if (event.keyCode === ENTER_KEY_CODE && ((chat.get("useEnterToSend") && !event.shiftKey) || (event.shiftKey && !chat.get("useEnterToSend")))) {
            const {_message} = this.state;
            // Send message only not empty body
            if (_message.trim()) {
                this.handleSendMessage(event);
            }
            // Stop message change callback
            event.preventDefault();
        }
    };

    handleSendTyping = (): void => {
        const {selectedThread, selectedThreadId, sendTyping, privacy, user} = this.props;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup, isProductContact} = getThreadType(threadType);
        const threadIsEmpty = selectedThread.get("threads").isEmpty();
        const isBlocked: boolean = isProductContact ? selectedThread.getIn(["members", selectedThreadId, "blocked"]) : false;

        if (!threadIsEmpty && (isProductContact || isGroup) && privacy.get("showTyping") && user.get("id") !== selectedThreadId && !isBlocked) {
            sendTyping(selectedThreadId, isGroup);
        }
    };

    handleLocationSend = (lat, lng) => {
        this.handleSendMessage(null, MESSAGE_TYPES.location, {
            lat,
            lng
        });
    };

    handleGifSend = (url: string, id: string, dimensions: any) => {
        if (id) {
            const {replyingMessage, removeReplyMessage} = this.props;
            this.handleSendMessage(null, MESSAGE_TYPES.gif, {url, id, dimensions});
            if (replyingMessage) {
                removeReplyMessage();
            }
        }
        this.handleCloseStickerContainer();
    };

    handleSendMessage = (event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLSpanElement>, type: string = MESSAGE_TYPES.text, metaData?: any): void => {
        if (this.messageSendAccess) {
            const {app, setSendingLocation, selectedThreadId, sendMessage, editingMessage, removeMessageEditing, replyingMessage, removeReplyMessage} = this.props;
            const {threadTexts, showSmiles, _message, location} = this.state;
            const meta: any = {};
            const newState: IChatPanelFooterState = {...this.state};
            const message: string = _message.trim();

            let newMessage: any = demojify(this.inputArea);
            newMessage = newMessage && newMessage.trim();

            if (type !== MESSAGE_TYPES.gif && type !== MESSAGE_TYPES.sticker && message !== '') {
                threadTexts[selectedThreadId] = '';
                clearInterval(this.intervalId);
                newState._message = '';
            }

            if (app.sendingLocation) {
                setSendingLocation(null)
                // newState.location = null;
            }

            if (showSmiles && (this.stickerId === '' || type === MESSAGE_TYPES.text)) {
                newState.showSmiles = false;
                this.toggleStickerContainer()
            }

            if (editingMessage && !this.stickerId && !location) {
                meta.editingMessage = editingMessage;
                removeMessageEditing();
            } else if (replyingMessage) {
                removeReplyMessage();
            }

            if (type === MESSAGE_TYPES.sticker) {
                meta.stickerId = this.stickerId
                meta.dimensions = metaData.dimensions;
            }
            if (type === MESSAGE_TYPES.location) {
                const {lat, lng} = metaData;
                meta.location = {lat, lng};
            }

            if (type === MESSAGE_TYPES.gif) {

                if (metaData.dimensions && metaData.dimensions.width) {
                    const optimalSize = ImageManager.optimalSize({
                        toSaveWidth: 300,
                        toSaveHeight: 300,
                        maxWidth: 350,
                        maxHeight: 400,
                        originalWidth: metaData.dimensions.width,
                        originalHeight: metaData.dimensions.height,
                        video: false
                    })
                    metaData.dimensions.width = optimalSize.width
                    metaData.dimensions.height = optimalSize.height
                }

                meta.gif = {
                    url: metaData.url,
                    id: metaData.id,
                    dimensions: metaData.dimensions,
                }
            }

            if (replyingMessage) {
                meta.replyMessage = replyingMessage;
                // this is a wrong code that caused failure in reply message logic, needs further investigation
                // meta.replyMessage = meta.replyMessage.set("messageId", `msgId${Date.now()}`);
                // meta.replyMessage = meta.replyMessage.set("id", meta.replyMessage.get("messageId"));
            }

            this.inputArea.innerHTML = "";
            this.stickerId = null;

            newState.caretNode = {
                node: this.inputArea,
                position: 0
            };

            this.setState(newState);
            this.setThreadDraft(selectedThreadId, "");
            sendMessage(newMessage, type, meta);
        }
    };

    setInputAreaRef = (ref: any) => {
        this.inputArea = ref;
    };

    handleBlur = (): void => {
        const caretNode: any = getCaretNode();
        this.setState({caretNode});
    };

    //Content editable element handlers end

    setMoreActionsContainerRef = (ref: HTMLDivElement) => {
        this._moreActionsContainer = ref;
    };

    setStickerContainerRef = (ref: HTMLDivElement) => {
        this._stickerContainer = ref;
    };

    setAudioContainerRef = (ref: HTMLDivElement) => {
        this._audioContainer = ref;
    };

    toggleSendContactPopup = () => {
        this.props.toggleSendContactPopup();
        this.toggleMoreActions();
    };

    handleAudioRecording = (isAudioRecording: boolean): void => {
        this.setState({isAudioRecording})
    };

    handleStopRecordingPopupClose = (): void => {
        this.toggleListener(true, 'click', this.handleClosePopUp, true);
        this.setState({isStopRecordingPopupShown: false})
    };

    handleConfirmStopRecording = (): void => {
        this.toggleListener(false, 'click', this.handleClosePopUp, true);
        this.setState({takeAudio: false, isAudioRecording: false, isStopRecordingPopupShown: false});
    };

    render(): JSX.Element {
        const {
            showSmiles, takePhoto, stickerKind, takeVideo, takeAudio, location, files, showBlockedPopUp,
            showMoreActions, showFailedPopUp, _message, isAudioRecording, isStopRecordingPopupShown, direction
        } = this.state;
        const {
            language, selectedThread, editingMessage, replyingMessage, toggleSendContactPopup, app,
            replyMessageText, recentStickers, myStickers, stickers, removeReplyMessage, isFileUploadPopUpShown, showRightPanel, setSendingLocation
        } = this.props;
        const localization: any = components().chatPanelFooter;
        const blockedLocalization: any = components().blockedPopUp;

        if (replyingMessage) {
            this.inputArea.focus();
        }

        Log.i("app -> location = ", app.sendingLocation)

        return (
            <div
              style={{
                  // transform: showRightPanel ? "translateX(314px)" : "translateX(0)",
                  width: showRightPanel ? "calc(100% - 314px)" : "100%",
                  willChange: "width",
                  transition: "transform 0.125s ease-in-out"
              }}
              className="right_side_chat_footer">
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
                        isFileUploadPopUpShown &&
                        <FileUploadPopUp
                            closeFileUploadPopUp={this.closeFileUploadPopUp}
                            sendFiles={this.sendFileMessage}
                            selectedThread={selectedThread}
                            removeReplyMessage={removeReplyMessage}
                            files={files}
                            emptyFiles={this.emptyFiles}
                        />
                    }

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

                    {
                        showFailedPopUp &&
                        <PopUpMain
                            confirmButton={this.handleCloseItselfMessagePopUp}
                            cancelButton={this.handleCloseItselfMessagePopUp}
                            confirmButtonText={localization.failedPopUpButton}
                            titleText={localization.failedPopUpTitle}
                            infoText={localization.failedPopUpText}
                            showPopUpLogo={true}
                        />
                    }

                    {
                        isStopRecordingPopupShown &&
                        <PopUpMain
                            confirmButton={this.handleConfirmStopRecording}
                            cancelButton={this.handleStopRecordingPopupClose}
                            confirmButtonText={localization.yes}
                            cancelButtonText={localization.no}
                            titleText={localization.title}
                            infoText={localization.stopRecording}
                            showPopUpLogo={true}
                        />
                    }
                </ReactCSSTransitionGroup>
                {
                    takePhoto &&
                    <TakePhoto
                        mediaToggle={this.handleMediaToggle}
                        send={this.handleFiles}
                    />
                }
                {
                    takeVideo &&
                    <TakeVideo
                        mediaToggle={this.handleMediaToggle}
                        send={this.sendFileMessage}
                    />
                }

                {
                    app.sendingLocation &&
                    <SendLocation
                        lat={app.sendingLocation.lat}
                        lng={app.sendingLocation.lng}
                        send={this.handleLocationSend}
                        handleMediaKeyDown={this.handleMediaKeyDown}
                        closePopUp={this.handleLocationToggle}
                        language={language}
                    />
                }

                <div

                  className={language === "ar" ? "right_side_footer_content reverse" : "right_side_footer_content"} >
                    <MoreActions
                        toggleMoreActions={this.toggleMoreActions}
                        toggleSendContactPopup={this.toggleSendContactPopup}
                        showMoreActions={showMoreActions}
                        localization={localization}
                        locationToggle={this.handleLocationToggle}
                        mediaToggle={this.handleMediaToggle}
                        changeFiles={this.handleFiles}
                        moreActionsContainerRef={this.setMoreActionsContainerRef}
                        language={language}
                    />

                    <div className={language === "ar" ? "chat_footer_input input-reverse" : "chat_footer_input"}
                         onKeyDown={(e: React.KeyboardEvent) => (e.keyCode === 9) && e.preventDefault()}>
                        {/* FIXME temporary solution ↑↑↑↑↑↑↑↑↑↑↑↑↑ onKeyDown */}
                        <div className="text-input-block">
                            {
                                editingMessage &&
                                <div className="editing-message">
                                    <span className="editing-text">{localization.edit}</span>
                                    <span
                                        className="cancel-editing-text"
                                        onClick={this.handleMessageEditOrReplyCancel}
                                        data-event-name='removeMessageEditing'
                                    />
                                </div>
                            }
                            {
                                replyingMessage &&
                                <ReplyBlock
                                    replyMessageText={replyMessageText}
                                    language={language}
                                    stickers={stickers}
                                    messageToReplayCreator={this.messageReplyCreator}
                                    cancelReplyMessage={this.handleMessageEditOrReplyCancel}
                                    message={replyingMessage}
                                />
                            }

                            <ContentEditable
                                className={`input_text${editingMessage ? " input-height" : ""}`}
                                innerRef={this.setInputAreaRef}
                                onKeyDown={this.handleKeyDown}
                                onChange={this.handleMessageChange}
                                onPaste={this.handlePaste}
                                onBlur={this.handleBlur}
                                placeholder={localization.enterMessage}
                                disabled={false}
                                html={_message}
                                direction={this.state.direction}
                            />

                            {/*<div*/}
                            {/*className={`input_text${editingMessage ? " input-height" : ""}`}*/}
                            {/*data-placeholder={localization.enterMessage}*/}
                            {/*ref={ref => this.inputArea = ref}*/}
                            {/*onKeyDown={this.handleKeyDown}*/}
                            {/*onInput={this.handleMessageChange}*/}
                            {/*onSelect={this.handleSelect}*/}
                            {/*onPaste={this.handlePaste}*/}
                            {/*onBlur={this.handleBlur}*/}
                            {/*contentEditable={true}*/}
                            {/*onContextMenu={this.handleRightClick}*/}
                            {/*id="footer-input-text"*/}
                            {/*/>*/}
                        </div>
                        <div className={language === "ar" ? "chat_footer_icons smile-reverse": "chat_footer_icons"}>
                            {
                                takeAudio &&
                                <TakeAudio
                                    mediaToggle={this.toggleAudioContainer}
                                    send={this.handleFiles}
                                    setAudioContainerRef={this.setAudioContainerRef}
                                    isAudioRecording={isAudioRecording}
                                    handleAudioRecording={this.handleAudioRecording}
                                    language={language}
                                />
                            }
                            <StickerContainer
                                stickers={stickers}
                                showSmiles={showSmiles}
                                myStickers={myStickers}
                                stickerKind={stickerKind}
                                emojiClick={this.handleSetEmoji}
                                recentStickers={recentStickers}
                                handleGifSend={this.handleGifSend}
                                handleStickerClick={this.handleStickerClick}
                                changeStickerKind={this.changeStickerKind}
                                closePopup={this.handleCloseStickerContainer}
                                setStickerContainerRef={this.setStickerContainerRef}
                                language={language}
                            />
                            <img src={contactStickerSvg} alt="show stickers" title={localization.sendSmile}
                                 className="chat_smile_icon cursor" onClick={this.toggleStickerContainer}
                                 draggable={false}/>
                        </div>
                    </div>
                    <div className={language === "ar" ? "chat_footer_icons icon-reverse": "chat_footer_icons"}>
                        <div className="chat_footer_icon">
                            {
                                (this.inputArea && demojify(this.inputArea).trim()) || _message.trim() !== "" ?
                                    <img src={chatSendMessageSvg} alt="send"
                                         className="chat_footer_icon send_chat_icon cursor"
                                         onClick={this.handleSendMessage}/> :
                                    <img src={contactRecordSvg} alt="record"
                                         className="contact_record_svg cursor"
                                         onClick={this._toggleAudioContainer}
                                         draggable={false}/>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
