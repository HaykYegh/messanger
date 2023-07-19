"use strict";

import {fromJS, Map} from "immutable";
import * as React from "react";
import isEqual from "lodash/isEqual";
import format from "date-fns/format";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    DEFAULT_TIME_FORMAT,
    GIF_TOGGLE,
    IMAGE_TOGGLE,
    LOAD_STATUS,
    MEDIA_POPUP_ACTIONS,
    MESSAGE_TYPES,
    OFFLINE_MESSAGE_BODY,
    STREAM_TOGGLE,
    VIDEO_TOGGLE,
    VOICE_TOGGLE,
} from "configs/constants";
import {downloadFile, getBlobUri} from "helpers/FileHelper";
import MessagesModel from "modules/messages/MessagesModel";
import VideoElement from "components/common/VideoElement";
import {getLinkifiedText} from "helpers/MessageHelper";
import {AvatarSize} from "components/contacts/style";
import PopUpMain from "components/common/PopUpMain";
import {isThumbnail} from "helpers/DataHelper";
import Avatar from "components/contacts/Avatar"
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import "scss/pages/MediaPopUp";
import {attemptRetrieveFile} from "helpers/FileHelper";
import conf from "configs/configurations";
import ForwardMessagePopup from "components/common/popups/ForwardMessage";
import Log from "modules/messages/Log";
import IDBMessage from "services/database/class/Message";


export interface IMediaPopUpProps {
    closePopUp: (pupUp: typeof IMAGE_TOGGLE | typeof GIF_TOGGLE | typeof VIDEO_TOGGLE | typeof VOICE_TOGGLE) => void;
    showOtherMedia: (side: string, index?: number) => void;
    onMediaKeyDown: (event: any) => void;
    deleteMessage: (id: string) => void;
    handleNewSharedMediaSet: (state: any) => void;
    handleNewMediaSet: (state: any) => void;
    downloadFile: (downloadInfo: any) => void;
    updateVideoMessage: (msgId: string) => void;
    sharedMediaMessages: any;
    selectedThread: any;
    messages: any;
    media: {
        rightDisabled: boolean;
        leftDisabled: boolean;
        url: string;
        id: string;
        type: any;
        firstName: string;
        name: string;
        phone: string;
        image: Blob;
        avatarCharacter: string;
        color: any;
        role: string;
        createdAt: string;
        videoUrl?: string;
        avatar;
        avatarUrl;
        own;
        text;
        isAvatarImage: boolean;
        imgUrl?: string
    };
    sharedMedia: any[];
    popUpFileIndex: number;

    user: any;
    selectedThreadId: string;
    conversations: any;
    actions: {
        BLOCK_CONTACT: (contactIds: string[]) => void;
        UNBLOCK_CONTACT: (contactIds: string[]) => void;
        attemptSendForwardMessage: (messages: any, threadIds: string[], emailsMap: { [key: string]: string }) => void;
    }
}

interface IMediaPopUpState {
    deleteEveryWhere: boolean;
    transferLoader: number;
    loadCancelled: boolean;
    showLoader: boolean;
    downloadButton: boolean;
    uploadStarted: boolean;
    originalImage: Blob | File;
    isLoading: boolean,
    isForwardPopUpOpen: boolean;
}

export default class MediaPopUp extends React.Component<IMediaPopUpProps, IMediaPopUpState> {

    constructor(props) {
        super(props);
        this.state = {
            deleteEveryWhere: false,
            transferLoader: 0,
            loadCancelled: false,
            showLoader: false,
            downloadButton: false,
            uploadStarted: false,
            originalImage: null,
            isLoading: false,
            isForwardPopUpOpen: false
        };
    }

    mounted: boolean = true;

    subscribedIds: string[] = [];

    componentDidMount(): void {
        const {popUpFileIndex, showOtherMedia, media} = this.props;
        if (media.isAvatarImage && media.imgUrl) {
            this.setState({isLoading: true});

            (async () => {
                    const image: Blob = await attemptRetrieveFile({
                        bucket: conf.app.aws.bucket.profile,
                        key: media.imgUrl
                    });

                    this.setState({originalImage: getBlobUri(image), isLoading: false})

                }
            )();
        }
        document.addEventListener(media.id, this.handleImageUpload);
        this.subscribedIds.push(media.id);
        showOtherMedia("", popUpFileIndex);
        this.updateMediaState();
    }

    shouldComponentUpdate(nextProps: IMediaPopUpProps, nextState: IMediaPopUpState) {
        return !isEqual(this.props.media, nextProps.media) ||
            !isEqual(this.state, nextState) || !isEqual(this.props.messages, nextProps.messages);
    }

    componentDidUpdate(prevProps: IMediaPopUpProps, prevState: IMediaPopUpState) {
        if (this.props.media.id !== prevProps.media.id) {
            this.updateMediaState();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        this.subscribedIds.map(subscribedId => document.removeEventListener(subscribedId, this.handleImageUpload));
    }

    handlePopUpActions = ({currentTarget: {dataset}}: React.MouseEvent<HTMLSpanElement>) => {
        const {closePopUp, media, showOtherMedia, messages, sharedMedia} = this.props;
        switch (dataset.action) {
            case MEDIA_POPUP_ACTIONS.close:
                closePopUp(media.type);
                this.handleDownloadButtonHide();
                break;
            case MEDIA_POPUP_ACTIONS.delete:
                this.handleDeleteEverywherePopupToggle();
                break;
            case MEDIA_POPUP_ACTIONS.forward:
                this.handleForwardPopupToggle();
                break;
            case MEDIA_POPUP_ACTIONS.download:
                const mediaMessageId: string = media.id;
                const dbMessage = messages.get(mediaMessageId);
                const msgIndex = sharedMedia && sharedMedia.findIndex(x => x.msgId === media.id);
                const message: any = sharedMedia && msgIndex > -1 ? sharedMedia[msgIndex] : {};
                let blobUri = message && message.blobUri;
                if (!blobUri) {
                    blobUri = dbMessage && dbMessage.get("blobUri");
                }
                const fileName: string = media.type === IMAGE_TOGGLE ? `${media.id}.jpeg` : media.type === GIF_TOGGLE ? `${media.id}.gif` : `${media.id}.mp4`;
                downloadFile(fileName, blobUri || media.url || getBlobUri(media.image));
                break;
            case MEDIA_POPUP_ACTIONS.left:
                showOtherMedia(MEDIA_POPUP_ACTIONS.left);
                break;
            case MEDIA_POPUP_ACTIONS.right:
                showOtherMedia(MEDIA_POPUP_ACTIONS.right);
                break;
            default:
                break;
        }
    };

    handleImageUpload = (event) => {
        const {updateVideoMessage, sharedMedia, media, popUpFileIndex, handleNewMediaSet, handleNewSharedMediaSet} = this.props;
        const {detail: {progress, blob, msgId, loadStatus}} = event;
        const obj: any = {};
        let newStateMedia: any;
        let newStateSharedMedia: any;
        let showDownload: boolean;

        if (blob) {
            const videoUrl = getBlobUri(blob);
            if (media.id === msgId) {
                newStateMedia = {...media};
                newStateMedia.videoUrl = videoUrl;
                newStateMedia.url = videoUrl;
                newStateSharedMedia = [...sharedMedia];
                newStateSharedMedia[popUpFileIndex].videoUrl = videoUrl;
                newStateSharedMedia[popUpFileIndex].imgUrl = videoUrl;

                let url: any = videoUrl;
                const regexp: RegExp = /^data:image\/[^;]+;base64,/i;
                showDownload = regexp.test(url);

                if (this.mounted && media) {
                    this.setState({downloadButton: showDownload, transferLoader: 0, showLoader: false});
                    handleNewMediaSet(newStateMedia);
                    handleNewSharedMediaSet(newStateSharedMedia);
                }

            } else {
                newStateSharedMedia = [...sharedMedia];
                newStateSharedMedia.find(media => {
                    if (media.msgId === msgId) {
                        media.videoUrl = videoUrl;
                    }
                });
                handleNewSharedMediaSet(newStateSharedMedia);

            }

            if (this.mounted) {
                updateVideoMessage(media.id);
            }

        } else {
            if (msgId === media.id) {
                const {showLoader} = this.state;
                if (!showLoader) {
                    obj["showLoader"] = true;
                }
                obj["transferLoader"] = progress;
            }
        }

        if (loadStatus) {
            obj["loadCancelled"] = true;
        } else if (msgId === media.id) {
            obj["loadCancelled"] = false;
        }

        if (this.mounted && Object.keys(obj).length > 0) {
            this.setState(obj);
        }
    };

    handleDeleteEverywherePopupToggle = () => {
        const {deleteEveryWhere} = this.state;
        this.setState({
            deleteEveryWhere: !deleteEveryWhere
        });
    };

    handleForwardPopupToggle = () => {
        const {isForwardPopUpOpen} = this.state;
        this.setState({
            isForwardPopUpOpen: !isForwardPopUpOpen
        });
    };

    handleDownloadProgress = (value) => {
        const radius: number = 54;
        const circumference: number = 2 * Math.PI * radius;
        const progress: number = value / 100;
        if (isFinite(value)) {
            return circumference * (1 - progress);
        }
    };

    handleDownloadButtonHide = () => {
        this.setState({downloadButton: false})
    };

    messageDeleteEverywhere = () => {
        const {media, deleteMessage, messages, sharedMediaMessages} = this.props;
        const message: any = messages.get(media.id) || sharedMediaMessages && sharedMediaMessages.get(media.id);
        if (message && !message.isEmpty()) {
            deleteMessage(message);
        }
        this.handleDeleteEverywherePopupToggle();
    };

    updateMediaState = () => {
        const {media, messages, sharedMedia}: any = this.props;
        const mediaMessageId: string = media.id;

        let message = messages.get(mediaMessageId) && messages.get(mediaMessageId).toJS();
        if (!message && sharedMedia) {
            const msgIndex = sharedMedia.findIndex(x => x.msgId === mediaMessageId);
            message = msgIndex > -1 ? sharedMedia[msgIndex] : {};
        }


        let loadStatus = message && message.loadStatus;
        loadStatus = isNaN(loadStatus) ? 0 : parseInt(loadStatus);


        const loadCancelled = loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE || loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS || loadStatus === LOAD_STATUS.UPLOAD_SUCCESS;


        document.addEventListener(this.props.media.id, this.handleImageUpload);
        this.subscribedIds.push(this.props.media.id);

        const url = media.videoUrl ? media.videoUrl : media.url || media.src;
        const isUrlThumbnail: boolean = isThumbnail(url);
        // const regexp: RegExp = /^data:image\/[^;]+;base64,/i;
        const showDownload: boolean = message && !message.blobUri && isUrlThumbnail && loadStatus !== LOAD_STATUS.DOWNLOAD_404;

        if (this.mounted) {
            this.setState({
                showLoader: showDownload,
                transferLoader: 0,
                downloadButton: showDownload,
                loadCancelled: loadCancelled
            });
        }
    };

    stopProcess = async () => {
        const {media} = this.props;
        const {uploadStarted} = this.state;
        const msgId = media.id;
        if (uploadStarted) {
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_" + msgId));
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_PROCESS", {detail: {messageId: msgId}}));
        } else {
            document.dispatchEvent(new CustomEvent("CANCEL_DOWNLOAD_" + msgId));
        }
    };

    startLoadProcess = async () => {
        const {messages, downloadFile, media, sharedMedia} = this.props;
        let message = messages.get(this.props.media.id) && messages.get(this.props.media.id).toJS();
        if (!message) {
            const msgIndex = sharedMedia.findIndex(x => x.msgId === media.id);
            message = msgIndex > -1 ? sharedMedia[msgIndex] : {};
        }

        let loadedImage: Blob | File;
        const file: any = media.url;
        if (!(file instanceof Blob || file instanceof File)) {
            await setTimeout(async () => {
                loadedImage = await MessagesModel.get(message.fileRemotePath);
                const {showLoader, loadCancelled} = this.state;

                if (!loadedImage) {
                    if (this.mounted) {
                        this.setState({showLoader: true, loadCancelled: false, transferLoader: 0});
                    }

                    const downloadInfo = {
                        fileRemotePath: message.fileRemotePath,
                        threadId: message.threadId,
                        method: "GET",
                        msgId: this.props.media.id
                    };

                    if (!showLoader || loadCancelled) {
                        downloadFile(downloadInfo);
                    }
                }
            }, 100)
        }
    };

    get recentChats() {
        const {conversations} = this.props;
        return conversations.size > 20 ? conversations.slice(0, 20) : conversations;
    }

    handleForwardMessageSend = async (selectedThreadIds: any, emailsMap: { [key: string]: string }) => {
        const {actions: {attemptSendForwardMessage}, media, messages} = this.props;

        const mediaMessageId: string = media.id;
        let message = messages.get(mediaMessageId);

        if (!message) {
            const messageObj = await IDBMessage.getMessageById(mediaMessageId);
            message = fromJS(messageObj)
        }

        let forwardMessage = Map();
        forwardMessage = forwardMessage.set(mediaMessageId, message);

        attemptSendForwardMessage(forwardMessage, selectedThreadIds, emailsMap);
        this.handleForwardPopupToggle();
    };


    render() {
        const {media, onMediaKeyDown, closePopUp, sharedMedia, showOtherMedia, messages, user, selectedThread, selectedThreadId, actions: {UNBLOCK_CONTACT, BLOCK_CONTACT}} = this.props;
        const {deleteEveryWhere, transferLoader, showLoader, downloadButton, loadCancelled, originalImage, isLoading, isForwardPopUpOpen} = this.state;

        const localization: any = components().mediaPopUp;
        const mediaMessageId: string = media.id;

        const dbMessage = messages.get(mediaMessageId);

        const msgIndex = sharedMedia && sharedMedia.findIndex(x => x.msgId === media.id);
        const message: any = sharedMedia && msgIndex > -1 ? sharedMedia[msgIndex] : {};
        let loadStatus = message && message.loadStatus;
        loadStatus = isNaN(loadStatus) ? 0 : parseInt(loadStatus);
        let blobUri = message && message.blobUri;
        if (!blobUri) {
            blobUri = dbMessage && dbMessage.get("blobUri");
        }

        const date: string = format(new Date(media.createdAt), DEFAULT_TIME_FORMAT);
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        let result = this.handleDownloadProgress(transferLoader);

        const closePopUpOutside: any = (event: any) => {
            if (event.target.id === "image-container" && event.target.className !== "popup-image" ||
                event.target.className === "video_element" && event.target.className !== "video-tumb") {
                closePopUp(event.target.dataset.action);
                this.handleDownloadButtonHide();
            }
            return;
        };

        const threadImage: any = {
            url: media.avatarUrl ? media.avatarUrl : "",
            file: media.avatar || "",
        };
        let caption: string = media.text && media.text !== "null" && media.text !== OFFLINE_MESSAGE_BODY ? media.text : "";

        if (message.msgType === MESSAGE_TYPES.stream_file) {
            let text: string = message.text && message.text.match(/text="(.*?)"[ ]?\//) && message.text.match(/text="(.*?)"[ ]?\//)[1];
            if (text == "null" || !text) {
                text = "";
            }
            caption = text;
        }

        caption = message.link ? getLinkifiedText(caption) : caption;
        if (message.linkTags && message.linkTags.length > 0) {
            message.linkTags.map(item => {
                caption = caption.replace(`@${item}`, `<span draggable="false" data-link="${item}" class="linkified text">&#64;${item}</span>`);
            });
        }

        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        caption = caption && emojify(caption.replace(rep, "<3").replace(questionEmojy, "<?"));

        return (
            <div className="media-popup show" onKeyDown={onMediaKeyDown} tabIndex={0} id="media-popup">
                <div className="media-popup-content" data-action="close" onClick={closePopUpOutside}>
                    <div className="header-popup">
                        <div className="user-name-block">
                            {
                                <AvatarSize margin="0 14px 0 18px" width="40px" height="40px">
                                    <Avatar
                                        image={threadImage}
                                        color={media.color && media.color.get("numberColor")}
                                        avatarCharacter={media.avatarCharacter}
                                        name={media.firstName}
                                        iconSize={"40px"}
                                    />
                                </AvatarSize>}
                            <div className="name-number-block">
                                <div className="name">{media.name}</div>
                                {media.createdAt && <div className="number">{date}</div>}
                            </div>
                        </div>

                        <div className="buttons">
                            <ul className="action-buttons">
                                {
                                    !media.isAvatarImage &&
                                    <li className="item-icon" data-action="forward" onClick={this.handlePopUpActions}>
                                        <span className="forward"/>
                                        <span className={"item-icon-name"}>{localization.forward}</span>
                                    </li>
                                }

                                {
                                    !media.isAvatarImage &&
                                    <li className="item-icon" data-action="delete" onClick={this.handlePopUpActions}>
                                        <span className="delete"/>
                                        <span className={"item-icon-name"}>{localization.delete}</span>
                                    </li>
                                }

                                {
                                    // message.msgType !== MESSAGE_TYPES.stream_file &&
                                    !isLoading &&
                                    <li className="item-icon" data-action="download" onClick={this.handlePopUpActions}>
                                        <span className="download"/>
                                        <span className={"item-icon-name"}>{localization.download}</span>
                                    </li>
                                }

                                <li className="item-icon" data-action="close" onClick={this.handlePopUpActions}>
                                    <span className="close"/>
                                    <span className={"item-icon-name close-button"}>{localization.close}</span>
                                </li>
                            </ul>
                        </div>
                        {/*{message.msgType === MESSAGE_TYPES.stream_file && <div className="video-live-stream">*/}
                        {/*<span className="live-stream-icon"/>*/}
                        {/*<p className="live-stream-text">{localization.liveStream}</p>*/}
                        {/*</div>}*/}
                    </div>

                    {!media.leftDisabled &&
                    <span className="right_arrow" data-action="left" onClick={this.handlePopUpActions}/>}
                    {!media.rightDisabled &&
                    <span className="left_arrow" data-action="right" onClick={this.handlePopUpActions}/>}

                    <div className={`${media.type === STREAM_TOGGLE ? VIDEO_TOGGLE : media.type}_block`}>
                        {media.type === IMAGE_TOGGLE || media.type === GIF_TOGGLE ?
                            <div id="image-container"
                                 className={caption ? "caption-container img-container" : "img-container"}>
                                {!isLoading && <img className="popup-image"
                                                    src={originalImage || blobUri || media.url || getBlobUri(media.image)}
                                                    alt=""/>}

                                {isLoading && <div className="avatar-loader"/>}

                                {showLoader && !loadCancelled &&
                                <div className="progress-loader" onClick={this.stopProcess}>
                                    <div className="loader-content">
                                        <svg className="progress" width="75" height="75" viewBox="0 0 120 120"
                                             id="progress__value">
                                            <circle className="progress__meter" cx="60" cy="60" r="54" strokeWidth="4"/>
                                            <circle className="progress__value" cx="60" cy="60" r="54" strokeWidth="4"
                                                    style={{strokeDasharray: circumference, strokeDashoffset: result}}/>
                                        </svg>
                                    </div>
                                    <span className="cancel"/>
                                </div>}
                                {showLoader && !blobUri && loadCancelled ?
                                    <div className="progress-loader" onClick={this.startLoadProcess}>
                                        <div className="loader-content">
                                        </div>
                                        <span
                                            className={(loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE || loadStatus === LOAD_STATUS.UPLOAD_SUCCESS || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS) ? "download" : "upload"}/>
                                    </div> : ""}

                                {caption && (message.linkTags || message.link || Array.isArray(caption)) ?
                                    <span className="caption"
                                          dangerouslySetInnerHTML={{__html: Array.isArray(caption) ? caption.join("") : caption}}/> : (caption &&
                                        <span className="image-caption">{caption}</span>)}
                            </div> :
                            (media.type === VIDEO_TOGGLE || media.type === STREAM_TOGGLE) ?
                                <div className="video-info">
                                    <VideoElement media={media} message={message} downloadButton={downloadButton}/>
                                    {caption && (message.linkTags || message.link || Array.isArray(caption)) ?
                                        <span className="caption"
                                              dangerouslySetInnerHTML={{__html: Array.isArray(caption) ? caption.join("") : caption}}/> : (caption &&
                                            <span className="image-caption">{caption}</span>)}
                                    {/*{downloadButton && showLoader && loadCancelled &&*/}
                                    {/*<button onClick={this.startLoadProcess} className="download-button"/>}*/}
                                    {showLoader && !loadCancelled &&
                                    <div className="progress-loader" onClick={this.stopProcess}>
                                        <div className="loader-content">
                                            <svg className="progress" width="75" height="75" viewBox="0 0 120 120"
                                                 id="progress__value">
                                                <circle className="progress__meter" cx="60" cy="60" r="54"
                                                        strokeWidth="4"/>
                                                <circle className="progress__value" cx="60" cy="60" r="54"
                                                        strokeWidth="4" style={{
                                                    strokeDasharray: circumference,
                                                    strokeDashoffset: this.handleDownloadProgress(transferLoader)
                                                }}/>
                                            </svg>
                                        </div>
                                        <span className="cancel"/>
                                    </div>}
                                    {showLoader && loadCancelled &&
                                    <div className="progress-loader" onClick={this.startLoadProcess}>
                                        <div className="loader-content">
                                        </div>
                                        <span className="download"/>
                                    </div>}
                                </div> : null}
                    </div>
                    {!media.isAvatarImage && <div className="popup-footer" id="popup_footer">
                        {
                            sharedMedia && sharedMedia.map((media: any, index: number) => {
                                const mediaUrl: any = media.thumb || media.src;
                                const isVideo: boolean = MESSAGE_TYPES.video.includes(media.msgType) || MESSAGE_TYPES.stream_file.includes(media.msgType);
                                const active: boolean = mediaMessageId === media.msgId;
                                const handleMediaClick: any = () => showOtherMedia("", index);

                                return (
                                    <div onClick={handleMediaClick}
                                         className={`media-info${active ? " media-info-active" : ""}`}
                                         id={media.msgId}
                                         key={index}>
                                        {
                                            isVideo ? <div className="media-video">
                                                    <img className="video" src={mediaUrl} alt=""/>
                                                    <span className="video-icon"/>
                                                </div>
                                                : <img className="media-img" src={mediaUrl} alt=""/>
                                        }
                                        <span className="overlay"/>
                                    </div>
                                )
                            })
                        }
                        <div className="media-info hidden-block"/>
                    </div>}
                </div>
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
                        deleteEveryWhere &&
                        <PopUpMain
                            confirmButton={this.messageDeleteEverywhere}
                            cancelButton={this.handleDeleteEverywherePopupToggle}
                            cancelButtonText={localization.cancel}
                            confirmButtonText={localization.delete}
                            titleText={localization.deleteEverywhereTitle}
                            infoText={localization.deleteEverywhereText}
                            showPopUpLogo={true}
                        />
                    }

                    {
                        isForwardPopUpOpen &&
                        <ForwardMessagePopup
                            close={this.handleForwardPopupToggle}
                            showForwardMessagePopUp={isForwardPopUpOpen}
                            recentChats={this.recentChats}
                            forwardMessageSend={this.handleForwardMessageSend}
                            UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                            BLOCK_CONTACT={BLOCK_CONTACT}
                            selectedThread={selectedThread}
                            selectedThreadId={selectedThreadId}
                            user={user}
                        />
                    }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}
