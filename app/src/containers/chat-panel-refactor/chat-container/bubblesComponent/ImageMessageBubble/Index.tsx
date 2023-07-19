"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {connect} from "react-redux";

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
import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";
import {emojify} from "helpers/EmojiHelper";
import MessagesModel from "modules/messages/MessagesModel";
import {
    CaptionContent,
    CaptionText,
    EditedMessage,
    IsDeliveryWaiting,
    ProgressLoader,
    StatusMessage,
    Time,
    TimeBubble,
    TooltipButton,
    TooltipContent,
    TooltipText,
} from "components/messages/style";
import {ImageBlock, ImageContent, ImageTextContent} from "./style";
import ContextMenu from "components/common/contextmenu/Index";
import {getMessageTime} from "helpers/DateHelper";
import thumbnail from "assets/images/thumbnail.png";
import {DELETE_SHARED_MEDIA_MESSAGES, hideMessageModal, showMessageModal} from "modules/application/ApplicationActions";
import Log from "modules/messages/Log";

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
    opacity: number;
}

interface IImageMessageProps {
    handleMediaPopUpOpen?: (popUp: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    createMessage?: (message: any) => void;
    downloadFile?: (downloadInfo: any) => void;
    updateMessageProperty?: (msgId, property, value, updateToDB?: boolean) => void;
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    deleteMessage?: (msgId) => void;
    stopProcess?: (uploadStarted: boolean) => void;
    uploadFile?: (messages: any, file: any) => void;
    resetConversationLastMessage?: (threadId: string) => void;
    DELETE_SHARED_MEDIA_MESSAGES?: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => void;
    sharedMediaPanel?: boolean;
    searchedActiveMessage?: string;
    message?: any;
    messagesLoadStatus?: any;
    messagesLoadedByShowMore?: boolean;
    language?: string;
    handleShowInFolder?: (event: React.MouseEvent<HTMLElement>) => void;
    handleMessageReply?: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage?: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    isMenuPopUpOpen?: boolean;
    showMessageModal?: (modalData: object) => void;
    hideMessageModal?: () => void;
}

class Index extends React.Component<IImageMessageProps, IImageMessageState> {

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
            opacity: 0,
        };
    }

   async componentDidMount() {
        const {message} = this.props;
        let loadStatus = message.get("loadStatus");
        const msgId: any = message.get("id") || message.get("messageId");

        document.addEventListener("messageSearch", this.handleMessageEvent);
        document.addEventListener(msgId, this.handleIDataTransfer);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true, transferLoader: 0});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true, transferLoader: 0});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_404) {
            this.setState({showLoader: false, loadCancelled: false});
        } else {
            this.startLoadProcess(true);
        }
    }

    shouldComponentUpdate(nextProps: IImageMessageProps, nextState: IImageMessageState): boolean {
        const {message, sharedMediaPanel, searchedActiveMessage,messagesLoadStatus} = this.props;

        // if(!this.state.opacity) {
        //     return false
        // }

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

        if (!isEqual(message, nextProps.message)) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (this.props.language !== nextProps.language) {
            return true;
        }
        if (message && message.get("loadStatus") !== nextProps.message.get("loadStatus")) {
            return true
        }
        if (messagesLoadStatus !== nextProps.messagesLoadStatus) {
            return true
        }



        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IImageMessageProps, prevState: IImageMessageState) {
        const {message} = this.props;
        const {showLoader, uploadStarted} = this.state;
        const isUpload = showLoader && uploadStarted;
        const messageIsEmpty = !message && !prevProps.message;

        if (
            (!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred")) ||
            (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload)
        ) {
            this.setState({showLoader: false, uploadStarted: false});
        }
    }

    componentWillUnmount(): void {
        const {message} = this.props;
        this.mounted = false;
        const msgId: any = message.get("id") || message.get("messageId");

        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(msgId, this.handleIDataTransfer);
    }

    handleMenuPopUpOpen = (event) => {
        const targetCoords = event.target.getBoundingClientRect();
        const left: number = (targetCoords.left + targetCoords.width + 9) -
            document.getElementsByClassName("left_side")[0].getBoundingClientRect().width -
            document.getElementsByClassName("app-left-menu")[0].getBoundingClientRect().width;
        const top: number = targetCoords.top - document.getElementsByClassName("header-content")[0].getBoundingClientRect().height - 12;

        setTimeout(() => {
            this.setState({isMenuPopUpOpen: true});
            this.props.showMessageModal({
                name: `file-${this.props.message.get("id") || this.props.message.get("messageId")}`,
                coords: {top, left},
                callbacks: {
                    handleMessageDelete: this.handleMessageDelete,
                    handleShowInFolder: this.handleShowInFolder,
                    handleMenuPopUpClose: this.handleMenuPopUpClose,
                },
            })
        });
    };

    handleMenuPopUpClose = () => {
        this.props.hideMessageModal();
        this.setState({isMenuPopUpOpen: false});
    };

    handleIDataTransfer = ({detail: {progress, blob, loadStatus, err}}): void => {
        const {resetConversationLastMessage, message, updateMessageProperty} = this.props;
        const obj: any = {};
        const msgId = message.get("id") || message.get("messageId");

            if (blob) {
                obj["image"] = blob;
                obj["uploadStarted"] = false;
                obj["showLoader"] = false;
                obj["progress"] = 0;

                const blobUri = getBlobUri(blob)

                if(!message.get("blobUri") || !message.get("localPath")) {
                    updateMessageProperty(msgId, "localPath", blob);
                    updateMessageProperty(msgId, "blobUri", blobUri);

                    IDBMessage.update(msgId, {blobUri, localPath: blob})
                }

            } else {
                const {showLoader} = this.state;
                if (!showLoader) {
                    obj["showLoader"] = true;
                }
                obj["transferLoader"] = progress;

                const blobUri = getBlobUri(message.get("file"))

                if(!message.get("blobUri") || !message.get("localPath")) {
                    updateMessageProperty(msgId, "localPath", message.get("file"));
                    updateMessageProperty(msgId, "blobUri", blobUri);

                    IDBMessage.update(msgId, {blobUri, localPath: message.get("file")})
                }
            }


        if (loadStatus) {
            obj["loadCancelled"] = true;
            const {deleteMessage, message, updateMessageProperty, DELETE_SHARED_MEDIA_MESSAGES} = this.props;
            const msgId = message.get("id") || message.get("messageId");

            updateMessageProperty(msgId, "loadStatus", err !== "404" ? loadStatus : LOAD_STATUS.DOWNLOAD_404);

            // if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL) {
            //     deleteMessage(msgId);
            //     resetConversationLastMessage(message.get("threadId"));
            //     const checkedFilesCount = {
            //         media: 0,
            //         file: 0,
            //         link: 0,
            //         total: 1
            //     };
            //     const ownMessage: string[] = [];
            //
            //     checkedFilesCount.file = checkedFilesCount.file + 1;
            //
            //     DELETE_SHARED_MEDIA_MESSAGES([msgId], checkedFilesCount, false, ownMessage);
            // } else {
            //     updateMessageProperty(msgId, "loadStatus", err !== "404" ? loadStatus : LOAD_STATUS.DOWNLOAD_404);
            // }
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
        const {message, createMessage, downloadFile, uploadFile} = this.props;
        const {image, uploadStarted} = this.state;
        const file: any = message.get('file');
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
                        msgId,
                        type: message.get('type')
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
        const msgId: string = message.get("messageId") || message.get("id");
        const {highlightText} = this.state;
        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleImageClick = ({currentTarget}: React.MouseEvent<HTMLElement>) => {
        const url = currentTarget.getAttribute('data-url') || currentTarget.getAttribute('src');
        if (url) {
            const {message, handleMediaPopUpOpen} = this.props;
            const msgId: string = message.get("messageId") || message.get("id");
            const creatorId: string = message.get('creator');
            handleMediaPopUpOpen(IMAGE_TOGGLE, msgId, url, creatorId);
        }
    };

    handleMessageDelete = (): void => {
        //todo rename this function name
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message);
    };

    handleImageLoad = (): void => {
        this.setState({
            loading: false,
            opacity: 1
        });
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

    handleDeleteMessage = async () => {
        //todo rename this function name
        const {message, deleteMessage, resetConversationLastMessage, DELETE_SHARED_MEDIA_MESSAGES} = this.props;
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

    handleShowInFolder = (): void => {
        const {message, handleShowInFolder} = this.props;
        handleShowInFolder(message)
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
        const {image, transferLoader, showLoader, loadCancelled, uploadStarted, highlightText, isMenuPopUpOpen, opacity} = this.state;
        const {
            message,
            stopProcess,
            updateMessageProperty,
            searchedActiveMessage,
            handleMessageReply,
            forwardMessage,
            language,
        } = this.props;

        const tooltipLocalization: any = components().tooltip;
        const msgId: string = message.get("messageId") || message.get("id");
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
        const linkTags: any = message.get("linkTags") && message.get("linkTags").size > 0 ?
            message.get("linkTags").toJS() : message.get("linkTags");

        let text = messageText === OFFLINE_MESSAGE_BODY || !messageText ? "" : messageText;

        const height: any = messageInfo && messageInfo.get('height');
        const width: any = messageInfo && messageInfo.get('width');
        const isDeliveryWaiting: boolean = isOwnMessage && !status && !delivered && !seen;
        const isSent: boolean = isOwnMessage && status && !delivered && !seen;
        const isDelivered: boolean = isOwnMessage && delivered && !seen;
        const isSeen: boolean = isOwnMessage && seen;
        const isCaption: boolean = !deleted && text;
        const isMediaBubble: boolean = !deleted && !text;
        const time: string = getMessageTime(messageTime);
        const imageSrc = image || file;

        const brokenImage: boolean = imageSrc && imageSrc.type == "application/xml";
        const isUpload = showLoader && uploadStarted;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const canDelete = loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_CANCEL;
        const styles: any = (showLoader && !canDelete) ? {pointerEvents: "none"} : {
            // opacity,
            // transition: "opacity 0.025s ease-in-out"
        };
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');

        let result = this.handleDownloadProgress(transferLoader);

        // if (height && width) {
        //     styles.height = height || 400;
        //     styles.width = width || 397;
        // }

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

        if (imageSrc && !this.blobUri) {
            // this.blobUri = getBlobUri(imageSrc);
            // this.isGif = (image && image.type && image.type.match(/image\/gif/)) || (file && file.type && file.type.match(/image\/gif/));
            // IDBMessage.update(msgId, {blobUri: this.blobUri, localPath: imageSrc})
            // updateMessageProperty(msgId, "blobUri", this.blobUri)
        }


        const imgUrl = (opacity && message.get("blobUri")) || info;
        const url: string = this.isGif ? imgUrl : (opacity && message.get("blobUri")) || info;

        // const imgUrl = info;
        // const url: string = this.isGif ? imgUrl : info;

        return (
            <div>
                <ImageBlock>
                    <ImageContent imageHeight={height} imageWidth={width}>
                        <img
                            onClick={this.handleImageClick}
                            style={styles}
                            src={brokenImage ? "./assets/images/pinngle/brokenimage.png" : url ? url : thumbnail}
                            onLoad={this.handleImageLoad}
                            data-rel={(brokenImage || isUpload) ? "" : "blobURI"}
                            data-url={imgUrl}
                            data-msgid={msgId}
                            data-file-type={message.get("type")}
                            data-load-status={loadStatus}
                            data-creator-id={creatorId}
                            onError={(e: any)=>{e.target.onerror = null; e.target.src=thumbnail}}
                            alt="img"
                        />
                        {showLoader && !loadCancelled &&
                        <ProgressLoader onClick={() => stopProcess(loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE ? false : uploadStarted)}>
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
                        <ProgressLoader onClick={this.startLoadProcess}>
                            <div className="loader-content">
                            </div>
                            <span className={uploadStarted ? "upload" : "download"}/>
                        </ProgressLoader>}
                    </ImageContent>
                </ImageBlock>
                <ImageTextContent
                  style={{
                      padding: isCaption ? "5px 9px 6px 9px" : "0px"
                  }}
                  language={language}>
                    {isCaption &&
                    <CaptionContent language={language}>
                        {((linkTags && linkTags.length > 0) || message.get("link") || Array.isArray(text)) || highlightText ?
                            <CaptionText onClick={this.handleUrlOpen}
                                         dangerouslySetInnerHTML={{__html: Array.isArray(text) ? text.join("") : text}}/> :
                            <CaptionText>{text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</CaptionText>}
                    </CaptionContent>
                    }
                    <TimeBubble
                        language={language}
                        isCaption={isCaption}
                        isMediaBubble={isMediaBubble}
                        isOwnMessage={isOwnMessage}
                    >
                        {edited && <EditedMessage/>}
                        <Time>{time}</Time>
                        <StatusMessage
                            isCaption={isCaption}
                            isMediaBubble={isMediaBubble}
                            isSeen={isSeen}
                            isDelivered={isDelivered}
                            isSent={isSent}/>
                        {isDeliveryWaiting &&
                        <IsDeliveryWaiting isMediaBubble={isMediaBubble} language={isCaption ? language : ''} isCaption={isCaption}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                </ImageTextContent>
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
                        />
                    </TooltipText>
                    <TooltipText content={tooltipLocalization.more}>
                        <TooltipButton
                            fileBubble={false}
                            more={true}
                            onClick={isMenuPopUpOpen ? this.handleMenuPopUpClose : this.handleMenuPopUpOpen}/>
                    </TooltipText>
                </TooltipContent>

                {/*Popup block*/}
                {this.popup}
            </div>
        );
    }
}

const mapDispatchToProps: any = (dispatch) => ({
    showMessageModal: (modalData: object) => dispatch(showMessageModal(modalData)),
    hideMessageModal: () => dispatch(hideMessageModal()),
    DELETE_SHARED_MEDIA_MESSAGES: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => dispatch(DELETE_SHARED_MEDIA_MESSAGES(messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages)),
});

export default connect<{}, {}, IImageMessageProps>(null, mapDispatchToProps)(Index);
