"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {LOAD_STATUS, MESSAGE_TYPES, NETWORK_LINK_REGEX, OFFLINE_MESSAGE_BODY, VIDEO_TOGGLE} from "configs/constants";
import {getBlobUri, getThumbnail, getEmptyThumbnail,makeWindowsThumb, makeMacThumb} from "helpers/FileHelper";
import IDBMessage from "services/database/class/Message";
import {getLinkifiedText} from "helpers/MessageHelper";
import PopUpMain from "components/common/PopUpMain";
import {getBase64FromThumb, isPublicRoom} from "helpers/DataHelper";
import {scrollToBottom} from "helpers/UIHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import conf from "configs/configurations";
import MessagesModel from "modules/messages/MessagesModel";
import {
    CaptionContent,
    EditedMessage,
    IsDeliveryWaiting, ProgressLoader,
    StatusMessage,
    Time,
    TimeBubble, TooltipButton,
    TooltipContent, TooltipText, CaptionText, TooltipButtonContent, PlayButtonContent
} from "components/messages/style";
import {PlayButton, VideoPart} from "components/messages/VideoMessage/style";

import {ImageTextContent} from "containers/chat-panel-refactor/chat-container/bubblesComponent/ImageMessageBubble/style";
const os = require("os");
const fs  = require("fs");
const DOWNLOAD_FOLDER_NAME =  require("config").zz.DOWNLOAD_FOLDER_NAME;
import {Map} from "immutable";
import videoThumbnail from "assets/images/thumbnail_video.png";
import {hideMessageModal, showMessageModal} from "modules/application/ApplicationActions";
import Log from "modules/messages/Log";

import {ImageManager} from "helpers/ImageHelper";


import ReplySvg from "../../../../assets/components/svg/video/ReplySvg"
import ForwardSvg from "../../../../assets/components/svg/video/ForwardSvg"
import MoreSvg from "../../../../assets/components/svg/video/MoreSvg"
import PlaySvg from "../../../../assets/components/svg/video/PlaySvg"


const blackBackground = getEmptyThumbnail();

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
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    /*compressing*/
    message?: any;
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    sharedMediaPanel: boolean;
    searchedActiveMessage?: string;
    messagesLoadStatus?: any;
    linkTags?: any;
    language: string;
    file: File;
    messagesLoadedByShowMore?: boolean

    handleShowInFolder: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    showMessageModal?: (modalData: object) => void;
    hideMessageModal?: () => void;
    handelMenuPopUpOpen?: () => void;
    handelMenuPopUpClose?: () => void;
    caches: any;
}

class VideoMessage extends React.Component<IVideoMessageProps, IVideoMessageState> {

    mounted: boolean = true;

    blobUri: string;

    contextMenu: any;

    videoRef: HTMLVideoElement;

    constructor(props: any) {
        super(props);

        this.state = {
            loading: true,
            isMenuPopUpOpen: false,
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
            // clientX: null,
            // clientY: null
        };
    }

    async componentDidMount() {
        const {message} = this.props;
        let loadStatus = message.get("loadStatus");
        const msgId = message.get("id") || message.get("messageId");
        const poster = message.get("base64") || message.get("info");

        if(!poster && loadStatus === 4 && (window as any).fs) {
            // this.createThumbnail(msgId);
        }
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
        else if (message.get("type") === MESSAGE_TYPES.stream_file || message.get("type") === MESSAGE_TYPES.video) {
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true, transferLoader: 0});
        }
        /*compressing*/

        else {
            this.startLoadProcess(true);
        }
        // setTimeout(scrollToBottom, 100);
    }

    shouldComponentUpdate(nextProps: IVideoMessageProps, nextState: IVideoMessageState): boolean {
        const {message, searchedActiveMessage, language} = this.props;

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
        if (message && message.get("loadStatus") !== nextProps.message.get("loadStatus")) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (message && !message.equals(nextProps.message)) {
            return true;
        }

        if (language !== nextProps.language) {
            return true;
        }

        if (message && message.get("info") !== nextProps.message.get("info")) {
            return true
        }
        return !isEqual(this.state, nextState);
    }

    async componentDidUpdate(prevProps: IVideoMessageProps, prevState: IVideoMessageState) {
        const {message, updateMessageProperty, file} = this.props;
        const {video, showLoader, uploadStarted, loading} = this.state;
        const isUpload = showLoader && uploadStarted;
        const messageIsEmpty = !message && !prevProps.message;
        const msgId = message.get("id") || message.get("messageId");
        const poster = message.get("base64") || message.get("info");
        const isDownloaded: boolean = message && message.get("isDownloaded");
        const vid = file || video;
        if ((!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred"))) {
            this.setState({showLoader: false, loading: false, uploadStarted: false});
        }

        if (video !== prevState.video && this.videoRef) {
            this.videoRef.load();
        }

        if (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload) {
            this.setState({showLoader: false, uploadStarted: false});
        }
        if (message && message.get("info") !== prevProps.message.get("info")) {
            Log.i("msg info update");
        }
        if(((!loading && vid && !showLoader) || isDownloaded || (!showLoader && message.get("type") === MESSAGE_TYPES.stream_file))) {
            updateMessageProperty(msgId, "loadStatus", 4, true);
        }
        let loadStatus = message.get("loadStatus");
        if(message.get("loadStatus") !== prevProps.message.get("loadStatus")){
            if(!poster && loadStatus === 4 && (window as any).fs) {
                // this.createThumbnail(msgId);
            }
        }

    }

    handelMenuPopUpOpen = (event) => {
        const targetCoords = event.target.getBoundingClientRect();
        const left: number = (targetCoords.left + targetCoords.width + 9) -
            document.getElementsByClassName("left_side")[0].getBoundingClientRect().width -
            document.getElementsByClassName("app-left-menu")[0].getBoundingClientRect().width;
        const top: number = targetCoords.top - document.getElementsByClassName("header-content")[0].getBoundingClientRect().height - 12;

        setTimeout(() => {
            this.setState({isMenuPopUpOpen: true})
            this.props.showMessageModal({
                name: `video-${this.props.message.get("id") || this.props.message.get("messageId")}`,
                coords: {top, left},
                callbacks: {
                    handleMessageDelete: this.handleMessageDelete,
                    handleShowInFolder: this.handleShowInFolder,
                    handleMenuPopUpClose: this.handelMenuPopUpClose,
                },
            })
        });
    };

    handelMenuPopUpClose = () => {
        this.props.hideMessageModal();
        this.setState({isMenuPopUpOpen: false})
    };

    componentWillUnmount(): void {
        const {message} = this.props;
        this.mounted = false;
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(message.get("id") || message.get("messageId"), this.handleImageUpload);

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
            const blobUri = getBlobUri(blob)

            updateMessageProperty(msgId, "blobUri", blobUri);
            IDBMessage.update(message.get("messageId") || message.get("id"), {blobUri, localPath: blob})
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
            updateMessageProperty(msgId, "loadStatus", loadStatus);
            // if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.OPTIMISE_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_CANCEL) {
            //     deleteMessage(msgId);
            //     resetConversationLastMessage(message.get("threadId"));
            // } else {
            //     updateMessageProperty(msgId, "loadStatus", loadStatus);
            // }
        } else {
            newState.loadCancelled = false;
        }
        if (!messagesLoadedByShowMore) {
            // scrollToBottom();
        }

        if (this.mounted) {
            this.setState(newState);
        }
    };

    startLoadProcess = async (loadStarted?: any) => {


        const {message, createMessage, file, downloadFile, uploadFile, updateMessageProperty, caches} = this.props;


        const {video, uploadStarted, optimising} = this.state;
        let videoFile: Blob | File;
        const msgId = message.get("id") || message.get("messageId");

        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;

        if (caches[message.get("fileRemotePath")] && !loadStarted) {
            return false
        }

        // if (message.get("type") !== MESSAGE_TYPES.stream_file || message.get("type") !== MESSAGE_TYPES.video) {
        //     return false
        // }

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
                        type:message.get('type')
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

                    if (file) {
                        const blobUri = getBlobUri(file)

                        updateMessageProperty(msgId, "blobUri", blobUri);
                        IDBMessage.update(message.get("messageId") || message.get("id"), {blobUri, localPath: file})
                    }

                }

                this.setState({
                    showLoader: true,
                    uploadStarted: true,
                    loadCancelled: false,
                    transferLoader: 0
                });

                // !uploadedFileDeleted && !(window as any).fs && this.setState({
                //     showLoader: true,
                //     uploadStarted: true,
                //     loadCancelled: false,
                //     transferLoader: 0
                // });

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

    optimiseVideo = async () => {
        const {message, file, attemptOptimiseVideo} = this.props;
        const loadStatus = message.get("loadStatus");
        if (loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.uploadOptimisedFile();
        } else if (loadStatus !== LOAD_STATUS.LOAD_START) {
            this.setState({optimising: true});
            attemptOptimiseVideo(message, file);
        }
    };

    getVideo = () => {
        const {message, downloadFile} = this.props;
        const {showLoader} = this.state;
        const msgId = message.get("id") || message.get("messageId");
        const threadId = message.get("threadId");

        if (this.mounted) {
            this.setState({showLoader: true});
        }

        const downloadInfo = {
            fileRemotePath: message.get("fileRemotePath"),
            method: "GET",
            threadId,
            msgId,
            type:message.get('type')
        };

        if (!showLoader) {
            downloadFile(downloadInfo);
        }
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
        const checkFile = ((window as any).fs && await MessagesModel.checkFileInFolder(message)) || (!(window as any).fs) || message.get("type") === MESSAGE_TYPES.stream_file || message.get("type") === MESSAGE_TYPES.video;

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
        const {stopProcess, message} = this.props;
        const loadStatus: number = message.get("loadStatus");
        const {uploadStarted} = this.state;
        stopProcess(loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE ? false : uploadStarted);
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

    handleMessageDelete = (): void => {
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message)
    };
    handleShowInFolder = (): void => {
        const {message, handleShowInFolder} = this.props;
        handleShowInFolder(message)
    };

    handleImageLoad = ({target: img}: any) => {
        const {updateMessageProperty} = this.props;
        const container: any = document.getElementById("chatBackground");
        const {message} = this.props;
        const messageInfo = message.get("m_options") && Map.isMap(message.get("m_options")) ? message.get("m_options").toJS() : message.get("m_options");

        if (!(messageInfo && messageInfo.height && messageInfo.width)) {
            let toSaveWidth = img.naturalWidth;
            let toSaveHeight = img.naturalHeight;

            if (img.naturalWidth !== 400) {
                toSaveWidth = 400;
                toSaveHeight = img.naturalHeight * (400 / img.naturalWidth);
            }
            updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                height: toSaveHeight,
                width: toSaveWidth
            }, true);

            if (img.offsetHeight > 200 && container.offsetHeight + container.scrollTop + 15 < container.scrollHeight) {
                container.scrollTop = container.scrollTop + img.offsetHeight - 150;
                container.scrollTop -= 5;
            }
        }
    };

    createThumbnail = async (msgId) => {
        const homeDir = os.homedir();
        const {updateMessageProperty} = this.props;
        let thumb;
        while(!thumb) {
            thumb = await getThumbnail(homeDir+'/Downloads/'+DOWNLOAD_FOLDER_NAME+'/'+`${msgId}.webm`, true);
        }

        (window as any).isMac ? await makeMacThumb(thumb.url,msgId): (window as any).isWin ? await makeWindowsThumb(thumb.url, msgId) :'';
        const path2 = `${homeDir}/Library/Application Support/Electron/thumbs`;
        if (fs.existsSync(path2)) {
            (window as any).isMac ? await updateMessageProperty(msgId, 'info',  `${homeDir}/Library/Application Support/Electron/thumbs/${msgId}.jpeg`, true) : (window as any).isWin ? await updateMessageProperty(msgId, 'info',  `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`, true): '';
        }
    };

    render(): JSX.Element {
        const {video, loading, transferLoader, showLoader, uploadStarted, loadCancelled, showErrorPopup, optimising, highlightText, isMenuPopUpOpen} = this.state;
        const {message, file, linkTags, handleMessageReply, forwardMessage, searchedActiveMessage, language} = this.props;
        const vid = video || file;
        const messageId = message.get("messageId") || message.get("id");
        const isDownloaded: boolean = message && message.get("isDownloaded");
        const msgId: string = message.get("messageId") ? message.get("messageId") : message.get("id");
        let text: string = (message.get("text") === OFFLINE_MESSAGE_BODY || message.get("text") === "null") ? "" : ((message.get("type") === MESSAGE_TYPES.stream_file && message.get("text") && message.get("text").match(/text="(.*?)"[ ]?\//)) ? message.get("text").match(/text="(.*?)"[ ]?\//)[1] : message.get("text"));
        if (text === "null") {
            text = "";
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

        const messageInfo = message.get("m_options") && Map.isMap(message.get("m_options")) ? message.get("m_options").toJS() : message.get("m_options");
        const height = messageInfo && messageInfo.height;
        const width = messageInfo && messageInfo.width;

        const styles: any = {};
        if (height && width) {
            const optimalSizes = ImageManager.optimalSize({
                toSaveWidth: 300,
                toSaveHeight: 300,
                maxWidth: 350,
                maxHeight: 400,
                originalWidth: width,
                originalHeight: height,
                video
            })

            styles.height = optimalSizes.height;
            styles.width = optimalSizes.width;
        }

        // const type = "data:image/jpeg;base64,";
        const brokenVideo: boolean = vid && !(typeof vid === "string") && vid.type.includes("xml");
        const poster = message.get("base64") || message.get("info");
        const localization: any = components().notification;
        const isUpload = showLoader && uploadStarted;
        const creatorId: string = message.get('creator');
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        let url: string = this.blobUri;
        const loadStatus = message.get("loadStatus");
        const canDelete = loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.OPTIMISE_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_CANCEL;

        if (vid && !this.blobUri) {
            url = (video && typeof video === "string") ? video : getBlobUri(vid);
            this.blobUri = url;
            this.handleVideoLoad();
        }
        const tooltipLocalization: any = components().tooltip;
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
        const isCaption: boolean | string = !!(isImageCaptionBubble || isVideoCaptionBubble);

        let time: any = new Date(message.get("time"));
        time = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2);
        let buffer;
        if(poster) {
            buffer = fs.readFileSync(poster)
        }

        return (
            <div className="video-block" style={{width: "100%"}}>
            {/*<div style={{width: "100%"}}>*/}
                <VideoPart className="video-part" videoWidth={width} videoHeight={height}>
                {/*<VideoPart videoWidth={width} videoHeight={height}>*/}
                    <img
                        src={poster && buffer && buffer.length > 100 ? poster : videoThumbnail}
                        // src={videoThumbnail}
                        style={styles}
                        onLoad={this.handleImageLoad}
                        data-url={message.get("blobUri") || url || (message.get("type") === MESSAGE_TYPES.stream_file ? messageId : "")}
                        data-msgid={messageId}
                        data-file-type={message.get("type")}
                        data-creator-id={creatorId}
                        data-load-status={message.get("loadStatus")}
                        data-blob={message.get("blobUri") || this.blobUri}
                        data-rel={(brokenVideo || isUpload) ? "" : "blobURI"}
                        alt=""
                    />
                    {((!loading && vid && !showLoader) || isDownloaded || (!showLoader && (message.get("type") === MESSAGE_TYPES.stream_file || message.get("type") === MESSAGE_TYPES.video))) &&
                   <PlayButtonContent
                       onClick={this.handleVideoMessageClick}
                       style={showLoader && !canDelete ? {pointerEvents: "none"} : {}}
                   >
                       <PlaySvg />
                   </PlayButtonContent>}
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
                <ImageTextContent
                  style={{
                      padding: isCaption ? "5px 9px 6px 9px" : "0px"
                  }}
                  language={language}>
                    {isCaption &&
                    <CaptionContent language={language}>
                        {((linkTags && linkTags.length > 0) || message.get("link") || Array.isArray(text)) || highlightText ?
                            <CaptionText onClick={this.handleUrlOpen}
                                         dangerouslySetInnerHTML={{__html: Array.isArray(text) ? text.join("") : text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}}/> :
                            <CaptionText>{text}</CaptionText>}
                        {optimising && !loadCancelled &&
                        <span>{localization.compressing} {transferLoader ? transferLoader.toFixed(0) + "%" : ""}...</span>}
                        {/*{showLoader && !loadCancelled && uploadStarted && <span>{localization.uploading}</span>}*/}
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
                            isMediaBubble={true}
                            isSeen={isSeen}
                            isDelivered={isDelivered}
                            isSent={isSent}/>
                        {isDeliveryWaiting &&
                        <IsDeliveryWaiting isMediaBubble={isMediaBubble}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                </ImageTextContent>
                <TooltipContent id={""} fileBubble={false} isMenuPopUpOpen={isMenuPopUpOpen}>
                    <TooltipText content={tooltipLocalization.reply}>
                        {/*<TooltipButton fileBubble={false} reply={true}*/}
                        {/*               onClick={() => handleMessageReply(false, message)}/>*/}
                       <TooltipButtonContent onClick={() => handleMessageReply(false, message)}>
                           <ReplySvg />
                       </TooltipButtonContent>
                    </TooltipText>
                    <TooltipText content={tooltipLocalization.forward}>
                        {/*<TooltipButton fileBubble={false} forward={true} onClick={() => forwardMessage(message)}/>*/}
                        <TooltipButtonContent onClick={() => forwardMessage(message)}>
                            <ForwardSvg />
                        </TooltipButtonContent>
                    </TooltipText>
                    <TooltipText content={tooltipLocalization.more}>
                        {/*<TooltipButton*/}
                        {/*    fileBubble={false} more={true}*/}
                        {/*    onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}*/}
                        {/*/>*/}
                        <TooltipButtonContent onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}>
                            <MoreSvg />
                        </TooltipButtonContent>
                    </TooltipText>
                </TooltipContent>


                {/*{((linkTags && linkTags.length > 0) || message.get("link") || Array.isArray(text)) || highlightText ?*/}
                {/*<span className="video-caption" onClick={this.handleUrlOpen}*/}
                {/*dangerouslySetInnerHTML={{__html: Array.isArray(text) ? text.join("") : text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}}/> :*/}
                {/*<span className="video-caption">{text}</span>}*/}
                {/*{optimising && !loadCancelled &&*/}
                {/*<span>{localization.compressing} {transferLoader ? transferLoader.toFixed(0) + "%" : ""}...</span>}*/}
                {/*{showLoader && !loadCancelled && uploadStarted && <span>{localization.uploading}</span>}*/}
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

const mapDispatchToProps: any = (dispatch) => ({
    showMessageModal: (modalData: object) => dispatch(showMessageModal(modalData)),
    hideMessageModal: () => dispatch(hideMessageModal()),
});

export default connect<{}, {}, IVideoMessageProps>(null, mapDispatchToProps)(VideoMessage);

