"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    IMAGE_TOGGLE,
    LOAD_STATUS,
    MEDIA_TYPES,
    MESSAGE_TYPES,
    NETWORK_LINK_REGEX,
    OFFLINE_MESSAGE_BODY
} from "configs/constants";
import IDBMessage from "services/database/class/Message";
import {getLinkifiedText} from "helpers/MessageHelper";
import PopUpMain from "components/common/PopUpMain";
import {scrollToBottom} from "helpers/UIHelper";
import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";
import {emojify} from "helpers/EmojiHelper";
import MessagesModel from "modules/messages/MessagesModel";
import {
    CaptionContent, CaptionText,
    EditedMessage,
    IsDeliveryWaiting,
    ProgressLoader,
    StatusMessage,
    Time,
    TimeBubble, TooltipButton, TooltipContent, TooltipText
} from "components/messages/style";
import {ImageBlock, ImageContent} from "components/messages/ImageMessage/style";
import ContextMenu from "components/common/contextmenu/Index";
import {DELETE_SHARED_MEDIA_MESSAGES} from "modules/application/ApplicationActions";

interface IImageMessageState {
    loading: boolean;
    height: number;
    width: number;
    image: Blob | File;
    transferLoader: number;
    showLoader: boolean;
    loadCancelled: boolean;
    uploadStarted: boolean;
    showErrorPopup: boolean;
    highlightText: string;
    isMenuPopUpOpen: boolean;
    clientX: any;
    clientY: any;
}

interface IImageMessageProps {
    handleMediaPopUpOpen: (popUp: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    createMessage: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value, updateToDB?: boolean) => void;
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    deleteMessage: (msgId) => void;
    stopProcess: (uploadStarted: boolean) => void;
    uploadFile: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId: string) => void;
    sharedMediaPanel: boolean;
    searchedActiveMessage: string;
    message?: any;
    messagesLoadStatus?: any;
    linkTags?: any;
    file?: any;
    messagesLoadedByShowMore?: boolean

    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handleShowInFolder: (message?: any) => void;
    language?: string

}

export default class Index extends React.Component<IImageMessageProps, IImageMessageState> {

    mounted: boolean = true;

    blobUri: string;

    contextMenu: any;

    isGif: string;

    constructor(props: any) {
        super(props);

        this.state = {
            loading: true,
            height: null,
            width: null,
            image: null,
            showLoader: false,
            transferLoader: 0,
            loadCancelled: false,
            uploadStarted: false,
            showErrorPopup: false,
            highlightText: "",
            isMenuPopUpOpen: false,
            clientX: null,
            clientY: null
        };
    }

    componentDidMount() {
        const {message} = this.props;
        let loadStatus = message.get("loadStatus");
        const msgId = message.get("id") || message.get("messageId");

        document.addEventListener("messageSearch", this.handleMessageEvent);
        document.addEventListener(msgId, this.handleIDataTransfer);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true, transferLoader: 0});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true, transferLoader: 0});
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_404) {
            this.setState({showLoader: false, loadCancelled: false});
        } else {
            this.startLoadProcess(true);
        }
    }

    shouldComponentUpdate(nextProps: IImageMessageProps, nextState: IImageMessageState): boolean {
        const {message, sharedMediaPanel, searchedActiveMessage} = this.props;

        if (message && message.get("IsTransferred") !== nextProps.message.get("IsTransferred")) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (message && message.get("text") !== nextProps.message.get("text")) {
            return true;
        }

        if (message && message.get("link") !== nextProps.message.get("link")) {
            return true;
        }

        if (message && !message.equals(nextProps.message)) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (this.props.language !== nextProps.language) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IImageMessageProps, prevState: IImageMessageState) {
        const {message} = this.props;
        const {showLoader, uploadStarted, loading} = this.state;
        const isUpload = showLoader && uploadStarted;
        const messageIsEmpty = !message && !prevProps.message;

        if (
            (!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred")) ||
            (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload)
        ) {
            this.setState({showLoader: false, uploadStarted: false});
        }

        if (loading !== prevState.loading && !loading) {
            // scrollToBottom();
        }
    }

    handelMenuPopUpOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        const clientX: number = event.clientX;
        const clientY: number = event.clientY;

        this.setState({isMenuPopUpOpen: true, clientX, clientY})
    };

    handelMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false})
    };

    componentWillUnmount(): void {
        const {message} = this.props;
        this.mounted = false;
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(message.get("id") || message.get("messageId"), this.handleIDataTransfer);
    }

    handleIDataTransfer = ({detail: {progress, blob, loadStatus, err}}): void => {
        const {deleteMessage, resetConversationLastMessage, message} = this.props;
        const obj: any = {};
        const msgId = message.get("id") || message.get("messageId");
        if (blob) {
            obj["image"] = blob;
            obj["uploadStarted"] = false;
            obj["showLoader"] = false;
            obj["progress"] = 0;
            const {updateMessageProperty} = this.props;

            updateMessageProperty(msgId, "blobUri", getBlobUri(blob));

        } else {
            const {showLoader} = this.state;
            if (!showLoader) {
                obj["showLoader"] = true;
            }
            obj["transferLoader"] = progress;
        }
        if (loadStatus) {
            obj["loadCancelled"] = true;
            const {message, updateMessageProperty} = this.props;
            const msgId = message.get("id") || message.get("messageId");

            if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL) {
                deleteMessage(msgId);
                resetConversationLastMessage(message.get("threadId"));
            } else {
                updateMessageProperty(msgId, "loadStatus", err !== "404" ? loadStatus : LOAD_STATUS.DOWNLOAD_404);
            }
        } else {
            obj["loadCancelled"] = false;
        }

        if (err === "404") {
            obj["loadCancelled"] = false;
            obj["showLoader"] = false;
        }

        if (this.mounted) {
            this.setState(obj);
        }
    };

    startLoadProcess = async (loadStarted?: any) => {
        const {message, createMessage, file, downloadFile, uploadFile} = this.props;
        const {image, uploadStarted} = this.state;
        let loadedImage: Blob | File;
        const msgId = message.get("id") || message.get("messageId");
        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;

        if ((!file && !image) || message.get("IsTransferred")) {
            await setTimeout(async () => {
                loadedImage = await MessagesModel.get(message.get("fileRemotePath"));

                const {showLoader, loadCancelled} = this.state;

                if (!loadedImage && (loadStatus === LOAD_STATUS.UPLOAD_SUCCESS || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS) && loadStarted === true) {
                    this.setState({showLoader: true, loadCancelled: true});
                } else if (!loadedImage && !uploadStarted) {
                    if (this.mounted) {
                        this.setState({showLoader: true, loadCancelled: false, transferLoader: 0});
                    }

                    const downloadInfo = {
                        fileRemotePath: message.get("fileRemotePath"),
                        threadId: message.get("threadId"),
                        method: "GET",
                        time: message.get("time"),
                        msgId
                    };

                    if (!showLoader || loadCancelled) {
                        downloadFile(downloadInfo);
                    }


                } else if (!file && !image && uploadStarted) {
                    uploadedFileDeleted = true;
                } else {
                    if (this.mounted) {
                        if (message.get("loadStatus") === LOAD_STATUS.LOAD_START) {
                            this.setState({image: loadedImage, showLoader: true, uploadStarted: true});
                        } else {
                            this.setState({image: loadedImage});
                        }
                    }
                }
            }, 100)

        } else {
            if (loadStarted !== true) {
                const sendMessage = createMessage(message.toJS());

                if ((window as any).fs) {
                    const fileExist = await MessagesModel.checkFileInFolder(message);
                    if (!fileExist) {
                        uploadedFileDeleted = true;
                    }
                }
                !uploadedFileDeleted && uploadFile({
                    message: sendMessage,
                    messageToSave: message.toJS()
                }, file || image);
            }
            !uploadedFileDeleted && this.setState({
                showLoader: true,
                uploadStarted: true,
                loadCancelled: false,
                transferLoader: 0
            });
        }
        if (uploadedFileDeleted) {
            this.setState({showErrorPopup: true, showLoader: true, loadCancelled: false, transferLoader: 0})
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

    handleImageClick = ({currentTarget}: React.MouseEvent<HTMLElement>) => {
        const {message, handleMediaPopUpOpen} = this.props;
        const creatorId: string = message.get('creator');
        const currentImage = currentTarget;
        if (currentImage) {
            const url = currentImage.getAttribute('data-url') || currentImage.getAttribute('src');
            if (url) {
                handleMediaPopUpOpen(IMAGE_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), url, creatorId);
            }
        }
    };

    handleMessageDelete = (): void => {
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message)
    };

    handleShowInFolder = (): void => {
        const {message, handleShowInFolder} = this.props;
        handleShowInFolder(message)
    };

    handleImageLoad = ({target: img}: any) => {
        const {updateMessageProperty, messagesLoadedByShowMore} = this.props;
        const container: any = document.getElementById("chatBackground");
        const {message} = this.props;
        const messageInfo = message.get("m_options") && message.get("m_options").toJS();
        if (!(messageInfo && messageInfo.height && messageInfo.width)) {
            let toSaveWidth = img.naturalWidth;
            let toSaveHeight = img.naturalHeight;
            if (img.naturalWidth > 400) {
                toSaveWidth = 400;
                toSaveHeight = img.naturalHeight * (400 / img.naturalWidth);
            }
            updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                height: toSaveHeight,
                width: toSaveWidth
            }, true);

            if (img.offsetHeight > 200 && container.offsetHeight + container.scrollTop + 15 < container.scrollHeight) {
                // container.scrollTop = container.scrollTop + img.offsetHeight - 150;
                // container.scrollTop-=5;
            }
        }
        this.setState({
            loading: false
        });
        if (!messagesLoadedByShowMore) {
            // scrollToBottom();
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

    render(): JSX.Element {
        const {image, transferLoader, showLoader, loadCancelled, uploadStarted, showErrorPopup, highlightText, isMenuPopUpOpen, clientX, clientY} = this.state;
        const {file, message, stopProcess, handleMessageReply, updateMessageProperty, linkTags, handleShowInFolder, forwardMessage, searchedActiveMessage} = this.props;
        const localization: any = components().notification;
        const tooltipLocalization: any = components().tooltip;
        const img = image || file;
        const creatorId: string = message.get('creator');
        let text = message.get("text") === OFFLINE_MESSAGE_BODY || message.get("text") === "null" ? "" : message.get("text");
        const brokenImage: boolean = img && img.type == "application/xml";
        const isUpload = showLoader && uploadStarted;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const loadStatus = message.get("loadStatus");
        const canDelete = loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_CANCEL;
        let result = this.handleDownloadProgress(transferLoader);
        const messageInfo = message.get("m_options") && message.get("m_options").toJS();
        const height = messageInfo && messageInfo.height;
        const width = messageInfo && messageInfo.width;
        const msgId: string = message.get("messageId") || message.get("id");

        const isDeliveryWaiting: boolean = message.get("own") && !message.get("status") && !message.get("delivered") && !message.get("seen");
        const isSent = message.get("own") && message.get("status") && !message.get("delivered") && !message.get("seen");
        const isDelivered = message.get("own") && message.get("delivered") && !message.get("seen");
        const isSeen = message.get("own") && message.get("seen");
        const imageBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && !text;
        const videoBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && !text;
        const isMediaBubble = videoBubble || imageBubble;
        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");
        const isImageCaptionBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && text;
        const isVideoCaptionBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && text;
        const isCaption: boolean = isImageCaptionBubble || isVideoCaptionBubble;

        let time: any = new Date(message.get("time"));
        time = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2);

        const styles: any = (showLoader && !canDelete) ? {pointerEvents: "none"} : {};
        if (height && width) {
            styles.height = height;
            styles.width = width;
        }

        text = message.get("link") ? getLinkifiedText(text) : text;

        if (linkTags && linkTags.length > 0) {
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
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        text = text && emojify(text.replace(rep, "<3").replace(questionEmojy, "<?"));

        if ((image || file) && !this.blobUri) {
            this.blobUri = getBlobUri(image || file);
            this.isGif = (image && image.type && image.type.match(/image\/gif/)) || (file && file.type && file.type.match(/image\/gif/));
            updateMessageProperty(message.get("messageId"), "blobUri", this.blobUri)
        }

        // let imgUrl = this.blobUri || 'data:image/jpeg;base64,' + message.get('info');
        // let url: string = this.isGif ? imgUrl : ('data:image/jpeg;base64,' + message.get('info') || this.blobUri);

        let imgUrl = this.blobUri || message.get('info');
        let url: string = this.isGif ? imgUrl : message.get('info') || this.blobUri;

        return (
            <div>
                <ImageBlock>
                    <ImageContent>
                        <img
                            onClick={this.handleImageClick}
                            style={styles}
                            src={brokenImage ? "./assets/images/pinngle/brokenimage.png" : url}
                            onLoad={this.handleImageLoad}
                            data-rel={(brokenImage || isUpload) ? "" : "blobURI"}
                            data-url={imgUrl}
                            data-msgid={msgId}
                            data-file-type={message.get("type")}
                            data-load-status={loadStatus}
                            data-creator-id={creatorId}
                            alt="img"
                        />
                        {showLoader && !loadCancelled &&
                        <ProgressLoader onClick={() => stopProcess(uploadStarted)}>
                            <div className="loader-content">
                                <svg className="progress" width="50" height="50" viewBox="0 0 120 120"
                                     id="progress__value">
                                    <circle className="progress__meter" cx="60" cy="60" r="54" strokeWidth="4"/>
                                    <circle className="progress__value" cx="60" cy="60" r="54" strokeWidth="4"
                                            style={{strokeDasharray: circumference, strokeDashoffset: result}}/>
                                </svg>
                            </div>
                            <span className="cancel"/>
                        </ProgressLoader>}
                        {showLoader && loadCancelled &&
                        <div className="progress-loader" onClick={this.startLoadProcess}>
                            <div className="loader-content">
                            </div>
                            <span className={uploadStarted ? "upload" : "download"}/>
                        </div>}
                    </ImageContent>
                </ImageBlock>
                {isCaption &&
                <CaptionContent>
                    {((linkTags && linkTags.length > 0) || message.get("link") || Array.isArray(text)) || highlightText ?
                        <CaptionText onClick={this.handleUrlOpen}
                                     dangerouslySetInnerHTML={{__html: Array.isArray(text) ? text.join("") : text}}/> :
                        <CaptionText>{text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</CaptionText>}
                </CaptionContent>
                }
                <TimeBubble
                    isCaption={isCaption}
                    isMediaBubble={isMediaBubble}
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
                    <IsDeliveryWaiting isMediaBubble={isMediaBubble}><span/></IsDeliveryWaiting>}
                </TimeBubble>
                <TooltipContent id={""} fileBubble={false} isMenuPopUpOpen={isMenuPopUpOpen}>
                    <TooltipText content={tooltipLocalization.reply}>
                        <TooltipButton
                            fileBubble={false}
                            reply={true}
                            onClick={() => handleMessageReply(false, message)}
                        />
                    </TooltipText>
                    <TooltipText content={tooltipLocalization.forward}>
                    <TooltipButton
                        fileBubble={false}
                        forward={true}
                        onClick={() => forwardMessage(message)}
                    /></TooltipText>
                    <TooltipText content={tooltipLocalization.more}>
                    <TooltipButton
                        fileBubble={false}
                        more={true}
                        onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}/>
                    </TooltipText>
                    {
                        isMenuPopUpOpen &&
                        <ContextMenu menuPopup={isMenuPopUpOpen}
                                     handleMessageDelete={this.handleMessageDelete}
                                     handleShowInFolder={this.handleShowInFolder}
                                     handelMenuPopUpClose={this.handelMenuPopUpClose}
                                     clientX={clientX}
                                     clientY={clientY}
                        />
                    }
                </TooltipContent>
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
                        showErrorPopup && <PopUpMain confirmButton={this.deleteMessage}
                                                     cancelButton={this.deleteMessage}
                                                     confirmButtonText={localization.close}
                                                     titleText={localization.problemTitle}
                                                     infoText={localization.fileWasDeleted}
                                                     showPopUpLogo={true}/>
                    }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}
