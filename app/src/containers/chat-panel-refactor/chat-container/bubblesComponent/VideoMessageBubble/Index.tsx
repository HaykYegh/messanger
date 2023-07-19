"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {LOAD_STATUS, MESSAGE_TYPES, NETWORK_LINK_REGEX, OFFLINE_MESSAGE_BODY, VIDEO_TOGGLE} from "configs/constants";
import {getBlobUri, getThumbnail} from "helpers/FileHelper";
import IDBMessage from "services/database/class/Message";
import {getLinkifiedText} from "helpers/MessageHelper";
import PopUpMain from "components/common/PopUpMain";
import {getBase64FromThumb} from "helpers/DataHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import MessagesModel from "modules/messages/MessagesModel";
import {
    EditedMessage,
    IsDeliveryWaiting,
    ProgressLoader,
    StatusMessage,
    Time,
    TimeBubble,
    TooltipButton,
    TooltipContent
} from "containers/chat-panel-refactor/chat-container/bubblesComponent/style";
import {PlayButton, VideoPart} from "./style";
import ContextMenu from "components/common/contextmenu/Index";
import {getMessageTime} from "helpers/DateHelper";

interface IVideoMessageState {
    video: Blob | File;
    loading: boolean;
    showLoader: boolean;
    loadCancelled: boolean;
    uploadStarted: boolean;
    showErrorPopup: boolean;
    filePathAndName: string;
    highlightText: string;
    /*compressing*/
    optimising: boolean;
    transferLoader: number;
    /*compressing*/
    isMenuPopUpOpen: boolean;
    clientX: any
    clientY: any

}

interface IVideoMessageProps {
    handleMediaPopUpOpen: (popUp: typeof VIDEO_TOGGLE, id?: string, src?: string, creatorId?: string) => void;
    createMessage: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value, isUpdateDB?: boolean) => void;
    deleteMessage: (msgId) => void;
    stopProcess: (uploadStarted: boolean) => void;
    uploadFile: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId: string) => void;
    /*compressing*/
    attemptOptimiseVideo?: (message: any, file: File | Blob) => void;
    /*compressing*/
    message?: any;
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    sharedMediaPanel: boolean;
    searchedActiveMessage?: string;
    messagesLoadStatus?: any;
    messagesLoadedByShowMore?: boolean

    handleOpenFileInFolder: (event: React.MouseEvent<HTMLElement>) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handelMenuPopUpOpen: () => void;
    handelMenuPopUpClose: () => void;
}

export default class VideoMessage extends React.Component<IVideoMessageProps, IVideoMessageState> {

    mounted: boolean = true;

    blobUri: string;

    contextMenu: any;

    videoRef: HTMLVideoElement;

    isGif: any = null;

    constructor(props: any) {
        super(props);

        this.state = {
            loading: true,
            video: null,
            showLoader: false,
            loadCancelled: false,
            uploadStarted: false,
            showErrorPopup: false,
            filePathAndName: "",
            highlightText: "",
            /*compressing*/
            transferLoader: 0,
            optimising: false,
            /*compressing*/
            isMenuPopUpOpen: false,
            clientX: null,
            clientY: null
        };
    }

    async componentDidMount() {
        const {message} = this.props;
        let loadStatus = message.get("loadStatus");
        const msgId = message.get("id") || message.get("messageId");
        document.addEventListener("messageSearch", this.handleMessageEvent);
        document.addEventListener(msgId, this.handleImageUpload);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true, transferLoader: 0});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.OPTIMISE_CANCEL) {
            this.setState({showLoader: true, loadCancelled: true, optimising: true, transferLoader: 0});
            this.startLoadProcess(true);
        }
        /*compressing*/
        else if (message.get("type") === MESSAGE_TYPES.stream_file) {
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true, transferLoader: 0});
        }
        /*compressing*/

        else {
            this.startLoadProcess(true);
        }
    }

    shouldComponentUpdate(nextProps: IVideoMessageProps, nextState: IVideoMessageState): boolean {
        const {message, searchedActiveMessage} = this.props;

        if (message && message.get("IsTransferred") !== nextProps.message.get("IsTransferred")) {
            return true;
        }

        if (message && message.get("text") !== nextProps.message.get("text")) {
            return true;
        }

        if (message && message.get("link") !== nextProps.message.get("link")) {
            return true;
        }

        if (message && message.get("isDownloaded") !== nextProps.message.get("isDownloaded")) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (message && !message.equals(nextProps.message)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IVideoMessageProps, prevState: IVideoMessageState) {
        const {message} = this.props;
        const {video, showLoader, uploadStarted} = this.state;
        const isUpload = showLoader && uploadStarted;
        const messageIsEmpty = !message && !prevProps.message;

        if ((!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred"))) {
            this.setState({showLoader: false, loading: false, uploadStarted: false});
        }

        if (video !== prevState.video && this.videoRef) {
            this.videoRef.load();
        }

        if (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload) {
            this.setState({showLoader: false, uploadStarted: false});
        }
    }

    handelMenuPopUpOpen = () => {
        this.setState({isMenuPopUpOpen: true})
    };

    handelMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false})
    };

    componentWillUnmount(): void {
        const {message} = this.props;
        this.mounted = false;
        const msgId = message.get("id") || message.get("messageId");
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(msgId, this.handleImageUpload);

    }

    handleImageUpload = ({detail: {progress, blob, loadStatus, optimising}}): void => {
        const {
            deleteMessage, resetConversationLastMessage, messagesLoadedByShowMore,
            message, updateMessageProperty
        } = this.props;
        const newState: any = {...this.state};
        const msgId = message.get("id") || message.get("messageId");

        /*compressing*/
        if (blob && optimising) {
            this.setState({filePathAndName: blob, transferLoader: 0});
            this.blobUri = blob;
            this.uploadOptimisedFile();
        } else if (blob) {
            newState.video = blob;
            newState.uploadStarted = false;
            newState.showLoader = false;

            updateMessageProperty(msgId, "blobUri", getBlobUri(blob));
        } else {
            const {showLoader} = this.state;
            if (!showLoader) {
                newState.showLoader = true;
            }
            newState.transferLoader = progress;

            /*compressing*/
            if (optimising) {
                newState.optimising = optimising;
            }
            /*compressing*/
        }

        if (loadStatus) {
            newState.loadCancelled = true;
            if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.OPTIMISE_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_CANCEL) {
                deleteMessage(msgId);
                resetConversationLastMessage(message.get("threadId"));
            } else {
                updateMessageProperty(msgId, "loadStatus", loadStatus);
            }
        } else {
            newState.loadCancelled = false;
        }

        if (this.mounted) {
            this.setState(newState);
        }
    };

    startLoadProcess = async (loadStarted?: any) => {
        const {message, createMessage, downloadFile, uploadFile} = this.props;
        const {video, uploadStarted, optimising} = this.state;
        let videoFile: Blob | File;
        const msgId = message.get("id") || message.get("messageId");
        // const threadId = message.get("threadId");
        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;
        const file: any = message.get("file");

        if ((!file && !video) || message.get("IsTransferred")) {
            await setTimeout(async () => {
                videoFile = await MessagesModel.get(message.get("fileRemotePath"));
                const {showLoader, loadCancelled} = this.state;

                if (videoFile) {
                    if (this.mounted) {
                        if (message.get("loadStatus") === LOAD_STATUS.LOAD_START) {
                            this.setState({video: videoFile, showLoader: true, uploadStarted: true});
                        } else {
                            this.setState({video: videoFile});
                        }
                    }
                } else if (uploadStarted !== true && optimising !== true && message.get("type") === MESSAGE_TYPES.stream_file) {
                    // const bucket: any = isPublicRoom(threadId) ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer;
                    const videoUrl = message.get("text").match(/href="(.*?)"/) && message.get("text").match(/href="(.*?)"/)[1];  //await getSignedUrl(bucket, REQUEST_TYPES.get, message.get("fileRemotePath"));
                    if (videoUrl) {
                        this.setState({video: videoUrl});
                        this.blobUri = videoUrl;
                    }
                } else if (!videoFile && (loadStatus === LOAD_STATUS.UPLOAD_SUCCESS || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS) && loadStarted === true) {
                    this.setState({showLoader: true, loadCancelled: true});
                } else if (!videoFile) {
                    if (this.mounted) {
                        this.setState({showLoader: true, loadCancelled: false, transferLoader: 0});
                    }

                    const downloadInfo = {
                        fileRemotePath: message.get("fileRemotePath"),
                        threadId: message.get("threadId"),
                        time: message.get("time"),
                        method: "GET",
                        msgId,
                        type: message.get('type')
                    };

                    if (!showLoader || loadCancelled) {
                        downloadFile(downloadInfo);
                    }
                }
            }, 100)

        } else if (!file && !video && uploadStarted) {
            uploadedFileDeleted = true;
        } else {
            if (loadStarted !== true) {
                const sendMessage = createMessage(message.toJS());

                if ((window as any).fs) {
                    const fileExist = await MessagesModel.checkFileInFolder(message);
                    if (!fileExist) {
                        uploadedFileDeleted = true;
                    }
                }

                // if (!uploadedFileDeleted && (window as any).fs && loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
                //     this.uploadOptimisedFile();
                // }

                /*compressing*/
                !uploadedFileDeleted && (window as any).fs && uploadFile({
                    message: sendMessage,
                    messageToSave: message.toJS()
                }, file || video);
                !uploadedFileDeleted && !(window as any).fs && uploadFile({
                    message: sendMessage,
                    messageToSave: message.toJS()
                }, file || video);
            } else {
                const sendMessage = createMessage(message.toJS());

                // if (!uploadedFileDeleted && (window as any).fs && message.get('type') === MESSAGE_TYPES.stream_file && loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
                //     this.uploadOptimisedFile();
                // }

                /*compressing*/

                if (!uploadedFileDeleted && (window as any).fs && message.get('type') === MESSAGE_TYPES.stream_file) {
                    this.setState({uploadStarted: true});
                    uploadFile({
                        message: sendMessage,
                        messageToSave: message.toJS()
                    }, file || video);
                }

                !uploadedFileDeleted && !(window as any).fs && this.setState({
                    showLoader: true,
                    uploadStarted: true,
                    loadCancelled: false,
                    transferLoader: 0
                });

                // await IDBMessage.addMessageStatus(msgId, {loadStatus: LOAD_STATUS.LOAD_START});
                // const sendMessage = createMessage(message.toJS());
                // uploadFile({
                //     message: sendMessage,
                //     messageToSave: message.toJS()
                // }, file || video);
            }
        }
        if (uploadedFileDeleted) {
            this.setState({showErrorPopup: true, showLoader: true, loadCancelled: false})
        }
    };

    uploadOptimisedFile = async () => {
        const {message, createMessage, uploadFile, updateMessageProperty} = this.props;
        const {filePathAndName} = this.state;

        //We can do here on request, but why do so when you already can have the file to be downloaded
        //That's why we do 2 requests: First for the case when you have already filepath and need file,
        //Second, when you need the file and don't know file path.
        const fileToUpload = filePathAndName ? await MessagesModel.get("", filePathAndName, true) : await MessagesModel.get(message.get("fileRemotePath"), "", true);
        this.setState({optimising: false, uploadStarted: true});
        const sendMessage: any = createMessage(message.toJS());
        const msgId = message.get("id") || message.get("messageId");
        const messageToSave = message.toJS();
        if (messageToSave.info.includes("9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAD6APoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVA")) {
            messageToSave.info = await getThumbnail(filePathAndName || fileToUpload, true);
            sendMessage.fileSize = fileToUpload.size;
            updateMessageProperty(msgId, "info", messageToSave.info);
            updateMessageProperty(msgId, "fileSize", sendMessage.fileSize);
            await IDBMessage.update(msgId, {info: messageToSave.info, fileSize: sendMessage.fileSize})
        }
        const thumb: string = getBase64FromThumb(messageToSave.info);
        uploadFile({message: {...sendMessage, msgInfo: thumb}, messageToSave}, fileToUpload);
    };

    handleVideoLoad = () => {
        if (this.mounted) {
            this.setState({
                loading: false
            });
        }
    };

    handleMessageEvent = ({detail: {messageIds, text}}: any): void => {
        const {message} = this.props;
        const msgId: string = message.get("messageId") ? message.get("messageId") : message.get("id");
        const {highlightText} = this.state;
        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleVideoMessageClick = async (event: any) => {
        const {handleMediaPopUpOpen, message} = this.props;
        const messageId = message.get("messageId") || message.get("id");
        const creatorId: string = message.get('creator');
        const currentImage = event.currentTarget.parentElement.querySelector('[data-rel="blobURI"]');
        const checkFile = ((window as any).fs && await MessagesModel.checkFileInFolder(message)) || (!(window as any).fs) || message.get("type") === MESSAGE_TYPES.stream_file;

        if (!checkFile) {
            this.startLoadProcess();
        } else if (currentImage) {
            let url = currentImage.getAttribute('data-url');

            if (url || message.get("type") === MESSAGE_TYPES.stream_file) {
                handleMediaPopUpOpen(VIDEO_TOGGLE, messageId, url, creatorId);
            }
        }
    };

    handleDownloadProgress = (value) => {
        const radius: number = 54;
        const circumference: number = 2 * Math.PI * radius;
        let progress: number = value / 100;
        let dashoffset: number = circumference * (1 - progress);
        if (isFinite(value)) {
            return dashoffset;
        }
    };

    deleteMessage = async () => {
        const {message, deleteMessage, resetConversationLastMessage} = this.props;
        const messageId = message.get("messageId") || message.get("id");
        if (messageId) {
            await IDBMessage.addMessageStatus(messageId, {loadStatus: LOAD_STATUS.UPLOAD_CANCEL});
            deleteMessage(messageId);
        }
        resetConversationLastMessage(message.get("threadId"));
    };

    stopProcess = () => {
        const {stopProcess} = this.props;
        const {uploadStarted} = this.state;
        stopProcess(uploadStarted);
        /*compressing*/

        this.setState({optimising: false});

    };

    handleUrlOpen = (event: React.MouseEvent<HTMLSpanElement>) => {
        const {handleNetworkJoin} = this.props;
        const href: string = (event.target as any).getAttribute("href");

        if (href) {
            const networkRegex = new RegExp(NETWORK_LINK_REGEX, "gi");
            const networkLink: boolean = networkRegex.test(href);

            if (networkLink) {
                const networkToken: string = href.split("networks/").pop();
                if (!!networkToken) {
                    handleNetworkJoin(networkToken, true);
                }
            } else {
                window.open(href)
            }
        }
        return false;
    };

    handleDeleteMessage = (): void => {
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message)
    };

    handleImageLoad = () => {
        this.setState({loading: false});
    };


    get popup(): JSX.Element {
        const {showErrorPopup} = this.state;
        const localization: any = components().notification;

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
                    showErrorPopup &&
                    <PopUpMain
                        confirmButton={this.handleDeleteMessage}
                        cancelButton={this.handleDeleteMessage} // Todo why cancel action delete message :)
                        confirmButtonText={localization.close}
                        titleText={localization.problemTitle}
                        infoText={localization.fileWasDeleted}
                        showPopUpLogo={true}
                    />
                }
            </ReactCSSTransitionGroup>
        )
    }

    render(): JSX.Element {
        const {
            video, transferLoader, showLoader, loadCancelled, uploadStarted, highlightText, clientY, clientX,
            isMenuPopUpOpen, optimising, loading
        } = this.state;
        const {
            message, updateMessageProperty, searchedActiveMessage, handleOpenFileInFolder, forwardMessage,
            handleMessageReply
        } = this.props;

        const localization: any = components().notification;

        const msgId: string = message.get("messageId") || message.get("id");
        const linkTags: any = message.get("linkTags");
        const creatorId: string = message.get('creator');
        const messageInfo = message.get("m_options");
        const loadStatus: any = message.get("loadStatus");
        const isOwnMessage = message.get("own");
        const edited = !!message.get("edited");
        const status: boolean = message.get("status");
        const delivered: boolean = message.get("delivered");
        const seen: boolean = message.get("seen");
        const messageTime: any = message.get("time");
        const deleted: any = message.get("deleted");
        const messageText: any = message.get("text");
        const info: any = message.get("info");
        const file: any = message.get("file");
        const isLink: boolean = message.get("link");
        const isDownloaded: boolean = message.get("isDownloaded");
        const poster: any = message.get("base64") || message.get("info");

        let text = messageText === OFFLINE_MESSAGE_BODY || !messageText ? "" : messageText;

        const height: any = messageInfo && messageInfo.get('height');
        const width: any = messageInfo && messageInfo.get('width');
        const isDeliveryWaiting: boolean = isOwnMessage && !status && !delivered && !seen;
        const isSent: boolean = isOwnMessage && status && !delivered && !seen;
        const isDelivered: boolean = isOwnMessage && delivered && !seen;
        const isSeen: boolean = isOwnMessage && seen;
        const isCaption: boolean = !deleted && text;
        const time: string = getMessageTime(messageTime);
        const vid = video || file;

        const brokenVideo: boolean = vid && !(typeof vid === "string") && vid.type.includes("xml");
        const isUpload = showLoader && uploadStarted;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const canDelete = loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_CANCEL;
        const styles: any = (showLoader && !canDelete) ? {pointerEvents: "none"} : {};
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');

        if (height && width) {
            styles.height = height || 200;
            styles.width = width || 200;
        }

        text = isLink ? getLinkifiedText(text) : text;

        if (linkTags && linkTags.size > 0) {
            linkTags.map(item => {
                text = text.replace(`@${item}`, `<span draggable="false" data-link="${item}" class="linkified text">&#64;${item}</span>`);
            });
        }

        if (highlightText) {
            if (Array.isArray(text)) {
                const highlightTextArr = text.join("").replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText}`, "gi"));
                for (let el of text) {
                    if (!(el.replace(/<[^>]*>/g, '') == "")) {
                        if (highlightTextArr && highlightTextArr.length > 0) {
                            for (let item of highlightTextArr) {
                                const index = text.indexOf(el);
                                text[index] = el.replace(/<[^>]*>/g, '').replace(`${item}`, `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${item}</span>`);
                            }
                        }
                    }
                }
            } else {
                const highlightTextArr = text.replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText}`, "gi"));
                if (highlightTextArr && highlightTextArr.length > 0) {
                    text = text.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText}`, "gi"), match => {
                        return `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                    });
                }
            }
        }

        text = text && emojify(text.replace(rep, "<3").replace(questionEmojy, "<?"));

        if (vid && !this.blobUri) {
            this.blobUri = getBlobUri(vid);
            this.isGif = (video && video.type && video.type.match(/image\/gif/)) || (file && file.type && file.type.match(/image\/gif/));
            updateMessageProperty(msgId, "blobUri", this.blobUri)
        }

        const imgUrl = this.blobUri || info;
        const url: string = this.isGif ? imgUrl : info || this.blobUri;

        return (
            <div className="video-block" style={{width: "100%"}}>
                <VideoPart className="video-part">
                    <img
                        src={poster}
                        style={styles}
                        onLoad={this.handleImageLoad}
                        data-url={url || (message.get("type") === MESSAGE_TYPES.stream_file ? msgId : "")}
                        data-msgid={msgId}
                        data-file-type={message.get("type")}
                        data-creator-id={creatorId}
                        data-load-status={message.get("loadStatus")}
                        data-blob={this.blobUri}
                        data-rel={(brokenVideo || isUpload) ? "" : "blobURI"}
                        alt=""
                    />
                    {((!loading && vid && !showLoader) || isDownloaded || (!showLoader && message.get("type") === MESSAGE_TYPES.stream_file)) &&
                    <PlayButton onClick={this.handleVideoMessageClick}
                                style={showLoader && !canDelete ? {pointerEvents: "none"} : {}}/>}
                    {showLoader && !loadCancelled &&
                    <ProgressLoader onClick={this.stopProcess}>
                        <div className="loader-content">
                            <svg className="progress" width="50" height="50" viewBox="0 0 120 120" id="progress__value">
                                <circle className="progress__meter" cx="60" cy="60" r="54" strokeWidth="4"/>
                                <circle className="progress__value" cx="60" cy="60" r="54" strokeWidth="4" style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: this.handleDownloadProgress(transferLoader)
                                }}/>
                            </svg>
                        </div>
                        <span className="cancel"/>
                    </ProgressLoader>}
                    {showLoader && loadCancelled &&
                    <ProgressLoader onClick={this.startLoadProcess}>
                        <div className={uploadStarted || optimising ? "loader-content" : ""}>
                        </div>
                        <span
                            className={(uploadStarted || optimising) ? "upload" : "download"}/>
                    </ProgressLoader>}
                </VideoPart>

                <div className="caption-content">
                    {((linkTags && linkTags.length > 0) || message.get("link") || Array.isArray(text)) || highlightText ?
                        <span className="video-caption" onClick={this.handleUrlOpen}
                              dangerouslySetInnerHTML={{__html: Array.isArray(text) ? text.join("") : text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}}/> :
                        <span className="video-caption">{text}</span>}
                    {optimising && !loadCancelled &&
                    <span>{localization.compressing} {transferLoader ? transferLoader.toFixed(0) + "%" : ""}...</span>}
                    {showLoader && !loadCancelled && uploadStarted && <span>{localization.uploading}</span>}
                </div>
                <TimeBubble
                    isCaption={isCaption}
                    isMediaBubble={true}
                    isOwnMessage={isOwnMessage}
                >
                    {edited && <EditedMessage/>}
                    <Time>{time}</Time>
                    <StatusMessage
                        isCaption={isCaption}
                        isMediaBubble={true}
                        isSeen={isSeen}
                        isDelivered={isDelivered}
                        isSent={isSent}/>
                    {isDeliveryWaiting &&
                    <IsDeliveryWaiting isMediaBubble={true}><span/></IsDeliveryWaiting>}
                </TimeBubble>
                <TooltipContent id={""} fileBubble={false}>
                    <TooltipButton fileBubble={false} reply={true} onClick={() => handleMessageReply(false, message)}/>
                    <TooltipButton fileBubble={false} forward={true}
                                   onClick={() => forwardMessage(message)}/>
                    <TooltipButton fileBubble={false} more={true}
                                   onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}/>
                    {
                        isMenuPopUpOpen &&
                        <ContextMenu
                            menuPopup={isMenuPopUpOpen}
                            handleMessageDelete={this.handleDeleteMessage}
                            handleShowInFolder={handleOpenFileInFolder}
                            handelMenuPopUpClose={this.handelMenuPopUpClose}
                            clientX={clientX}
                            clientY={clientY}
                        />
                    }
                </TooltipContent>
                {this.popup}
            </div>
        );
    }
}
