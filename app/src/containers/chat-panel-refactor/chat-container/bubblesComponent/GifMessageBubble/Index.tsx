"use strict";

import * as React from "react";
import {fromJS} from "immutable";
import isEqual from "lodash/isEqual";

import {getBlobUri} from "helpers/FileHelper";
import {GIF_TOGGLE} from "configs/constants";
import {fetchFile} from "requests/fsRequest";
import {getGif} from "requests/gifRequest";
import thumbnail from "assets/images/thumbnail.png";
import MessagesModel from "modules/messages/MessagesModel";
import {
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble,
    TooltipButton,
    TooltipContent
} from "containers/chat-panel-refactor/chat-container/bubblesComponent/style";
import {ImageBlock, ImageContent} from "./style";
import ContextMenu from "components/common/contextmenu/Index";
import {getMessageTime} from "helpers/DateHelper";
import IDBMessage from "services/database/class/Message";
import {addSharedMediaImage} from "modules/application/ApplicationActions";
import Log from "modules/messages/Log";

interface IGifMessageState {
    gif: any;
    gifBlob: any;
    isGifLoading: boolean;
    isMenuPopUpOpen: boolean;
    clientX: any;
    clientY: any;
    loaded: boolean;
}

interface IGifMessageProps {
    message: any;
    gifMessages: any;
    updateMessageProperty: (msgId, property, value, updateToDB?: boolean) => void;
    messagesLoadedByShowMore?: boolean;
    handleMediaPopUpOpen: (popUp: typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    sharedMediaPanel: boolean;
    downloadFile?: (downloadInfo: any) => void;
    uploadFile?: (messages: any, file: any) => void;

    handleOpenFileInFolder?: (event: React.MouseEvent<HTMLElement>) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handelMenuPopUpOpen?: () => void;
    handelMenuPopUpClose?: () => void;
    addSharedMediaImage?: (image: any) => void;
}

export default class GifMessage extends React.Component<IGifMessageProps, IGifMessageState> {

    mounted: boolean = true;

    contextMenu: any;

    constructor(props: any) {
        super(props);

        this.state = {
            isGifLoading: false,
            gifBlob: null,
            gif: null,
            isMenuPopUpOpen: false,
            clientX: null,
            clientY: null,
            loaded: false
        };
    }

    async componentDidMount() {
        const {gifMessages, message, addSharedMediaImage, updateMessageProperty} = this.props;
        const gifId: string = message && message.get("fileRemotePath");

        if (!message.get("gifUrl")) {
            let gifFile: Blob | File = await MessagesModel.get(gifId);
            this.setState({isGifLoading: true})
            if (gifFile) {
                this.setState({
                    gifBlob: gifFile,
                    isGifLoading: false
                });

                const gifUrl = getBlobUri(gifFile)

                const sharedMediaImage = {};
                sharedMediaImage['key'] = message.get("messageId");
                sharedMediaImage['value'] = gifUrl;
                updateMessageProperty(message.get("messageId") || message.get("id"), "gifUrl", gifUrl);
                IDBMessage.update(message.get("messageId") || message.get("id"), {gifUrl, localPath: gifFile})
                if (addSharedMediaImage) {
                    addSharedMediaImage(sharedMediaImage)
                }

            } else if (gifMessages && gifMessages.get(gifId)) {
                const gif: any = gifMessages.get(gifId);
                this.setState({gif});
                this.handleGetGifMessageBlob();
            } else {
                this.getGif();
            }
        }
    };

    shouldComponentUpdate(nextProps: IGifMessageProps, nextState: IGifMessageState): boolean {
        const {message} = this.props;

        if (this.props.messagesLoadedByShowMore !== nextProps.messagesLoadedByShowMore) {
            return true;
        }

        if (message && !message.equals(nextProps.message)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    };

    handelMenuPopUpOpen = () => {
        this.setState({isMenuPopUpOpen: true})
    };

    handelMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false})
    };

    componentWillUnmount(): void {
        this.mounted = false;
    };

    getGif = async () => {
        const {message, downloadFile, updateMessageProperty, addSharedMediaImage} = this.props;
        const id: string = message && message.get("fileRemotePath");
        try {
            const {data: {data}, status} = await getGif(id);
            if (status === 200) {
                const gif: any = fromJS({
                    id: data.id,
                    type: data.type,
                    url: data.url,
                    preview: fromJS(data.images.preview_gif),
                    original: fromJS(data.images.downsized)
                });
                if (this.mounted && gif) {
                    this.setState({gif});

                    const original: Blob = await fetchFile(gif.getIn(["original", "url"]));
                    await MessagesModel.set(original, gif.get("id"), message.get("id") || message.get("messageId"));
                    if (original) {
                        this.setState({
                            gifBlob: original,
                            isGifLoading: false
                        });
                    }
                    const gifUrl = getBlobUri(original);
                    const sharedMediaImage = {};
                    sharedMediaImage['key'] = message.get("messageId");
                    sharedMediaImage['value'] = gifUrl;
                    updateMessageProperty(message.get("messageId") || message.get("id"), "gifUrl", gifUrl);
                    IDBMessage.update(message.get("messageId") || message.get("id"), {gifUrl})
                    addSharedMediaImage(sharedMediaImage);
                    // const downloadInfo = {
                    //     fileRemotePath: message.get("fileRemotePath"),
                    //     threadId: message.get("threadId"),
                    //     method: "GET",
                    //     time: message.get("time"),
                    //     msgId,
                    //     type: message.get('type')
                    // };
                    //
                    // downloadFile(downloadInfo);
                }
            }
        } catch (e) {
            Log.i(e);
        } finally {
            this.setState({isGifLoading: false});
        }
    };

    handleGetGifMessageBlob = async () => {
        const {gifMessages, message, updateMessageProperty} = this.props;
        const gifId: string = message && message.get("fileRemotePath");
        const gif: any = gifMessages.get(gifId);
        try {
            const original: Blob = await fetchFile(gif.getIn(["original", "url"]));

            if (this.mounted && original) {
                this.setState({
                    gifBlob: original,
                    isGifLoading: false
                });
                const gifUrl = getBlobUri(original)
                const sharedMediaImage = {};
                sharedMediaImage['key'] = message.get("messageId");
                sharedMediaImage['value'] = gifUrl;

                updateMessageProperty(message.get("messageId") || message.get("id"), "gifUrl", gifUrl);
                IDBMessage.update(message.get("messageId") || message.get("id"), {gifUrl})
                addSharedMediaImage(sharedMediaImage);
            }
            await MessagesModel.set(original, gif.get("id"), message.get("id") || message.get("messageId"));
        } catch (e) {
            Log.i(e);
        } finally {
            this.setState({isGifLoading: false});
        }
    };

    handleMessageDelete = (): void => {
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message)
    };

    handleGifLoad = ({target}: any) => {
        Log.i('gif loaded');
        this.setState({loaded: true})
    };

    handleGifClick = ({currentTarget}: React.MouseEvent<HTMLElement>) => {
        const url = currentTarget.getAttribute("data-url") || currentTarget.getAttribute("src");
        if (url) {
            const {message} = this.props;
            const creatorId: string = message.get("creator");
            const msgId: string = message.get("messageId") || message.get("id");
            this.props.handleMediaPopUpOpen(GIF_TOGGLE, msgId, url, creatorId);
        }
    };

    render(): JSX.Element {
        const {gif, gifBlob, isGifLoading, isMenuPopUpOpen, clientX, clientY, loaded} = this.state;
        const {message, handleMessageReply, forwardMessage, handleOpenFileInFolder} = this.props;
        const messageInfo: any = message.get("m_options");
        const height: number = messageInfo && messageInfo.get('height');
        const width: number = messageInfo && messageInfo.get('width');
        const url: string = gif ? gif.getIn(["preview", "url"]) : "";
        const gifUrl: any = getBlobUri(gifBlob);
        const creatorId: string = message.get("creator");
        const msgId: string = message.get("messageId") || message.get("id");
        const loadStatus: number = message.get("loadStatus");
        const status: boolean = message.get("status");
        const delivered: boolean = message.get("delivered");
        const seen: boolean = message.get("seen");
        const isOwnMessage: boolean = message.get("own");
        const edited = !!message.get("edited");

        const isDeliveryWaiting: boolean = isOwnMessage && !status && !delivered && !seen;
        const isSent: boolean = isOwnMessage && status && !delivered && !seen;
        const isDelivered: boolean = isOwnMessage && delivered && !seen;
        const isSeen: boolean = isOwnMessage && seen;
        const time: string = getMessageTime(message.get("time"));
        const style: any = {
            width: width || 200,
            height: height || 200
        };

        return (
            <div>
                <ImageBlock>
                    <ImageContent className="image">
                        <img
                            onClick={this.handleGifClick}
                            style={style}
                            src={message.get("gifUrl") || gifUrl || url || message.get("info") || thumbnail}
                            onLoad={this.handleGifLoad}
                            data-rel={isGifLoading ? "" : "blobURI"}
                            data-url={gifUrl}
                            data-thumb={message.get("info")}
                            data-msgid={msgId}
                            data-file-type={message.get("type")}
                            data-load-status={loadStatus}
                            data-creator-id={creatorId}
                            alt="gif"
                        />
                    </ImageContent>
                    {
                        isGifLoading &&
                        <div className="loader">
                            <div className="circular-loader">
                                <div className="loader-stroke">
                                    <div className="loader-stroke-left"/>
                                    <div className="loader-stroke-right"/>
                                </div>
                            </div>
                        </div>
                    }
                </ImageBlock>

                <TimeBubble
                    isMediaBubble={true}
                    isOwnMessage={isOwnMessage}
                >
                    {edited && <EditedMessage/>}
                    <Time>{time}</Time>
                    <StatusMessage
                        isMediaBubble={true}
                        isSeen={isSeen}
                        isDelivered={isDelivered}
                        isSent={isSent}/>
                    {isDeliveryWaiting &&
                    <IsDeliveryWaiting isMediaBubble={true}><span/></IsDeliveryWaiting>}
                </TimeBubble>
                <TooltipContent id={""} fileBubble={false}>
                    <TooltipButton
                        fileBubble={false}
                        reply={true}
                        onClick={() => handleMessageReply(false, message)}
                    />
                    <TooltipButton
                        fileBubble={false}
                        forward={true}
                        onClick={() => forwardMessage(message)}
                    />
                    <TooltipButton
                        fileBubble={false}
                        more={true}
                        onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}
                    />
                    {
                        isMenuPopUpOpen &&
                        <ContextMenu
                            menuPopup={isMenuPopUpOpen}
                            handleShowInFolder={handleOpenFileInFolder}
                            handleMessageDelete={this.handleMessageDelete}
                            handelMenuPopUpClose={this.handelMenuPopUpClose}
                            clientX={clientX}
                            clientY={clientY}
                        />
                    }
                </TooltipContent>
            </div>
        );
    }
}
