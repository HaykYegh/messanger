"use strict";

import * as React from "react";
import {fromJS} from "immutable";
import isEqual from "lodash/isEqual";

import {scrollToBottom} from "helpers/UIHelper";
import {getBlobUri} from "helpers/FileHelper";
import {GIF_TOGGLE, MESSAGE_TYPES} from "configs/constants";
import {fetchFile} from "requests/fsRequest";
import {getGif} from "requests/gifRequest";
import MessagesModel from "modules/messages/MessagesModel";
import {
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble,
    TooltipButton, TooltipContent, TooltipText
} from "components/messages/style";
import {ImageBlock, ImageContent,GifBlock} from "components/messages/ImageMessage/style";
import ContextMenu from "components/common/contextmenu/Index";
import components from "configs/localization";
import {addSharedMediaImage, hideMessageModal, showMessageModal} from "modules/application/ApplicationActions";
import {connect} from "react-redux";
import Log from "modules/messages/Log";
import IDBMessage from "services/database/class/Message";
import thumbnail from "assets/images/thumbnail100x100.png";
// import {updateMessageProperty} from "modules/messages/MessagesActions";

interface IGifMessageState {
    gif: any;
    gifBlob: any;
    isGifLoading: boolean;
    isMenuPopUpOpen?: boolean;
}

interface IGifMessageProps {
    message: any;
    gifMessages: any;
    updateMessageProperty: (msgId, property, value, updateToDB?: boolean) => void;
    messagesLoadedByShowMore?: boolean;
    handleMediaPopUpOpen: (popUp: typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    sharedMediaPanel: boolean;

    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    addSharedMediaImage: (image: any) => void;
    showMessageModal: (modalData: object) => void;
    hideMessageModal: () => void;
}


class GifMessage extends React.Component<IGifMessageProps, IGifMessageState> {

    mounted: boolean = true;

    contextMenu: any;

    constructor(props: any) {
        super(props);

        this.state = {
            isGifLoading: false,
            gifBlob: null,
            gif: null,
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
                addSharedMediaImage(sharedMediaImage);
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
        const {gif} = this.state;

        if ((gif && gif.getIn(["original", "width"])))
        if (this.props.messagesLoadedByShowMore !== nextProps.messagesLoadedByShowMore) {
            return true;
        }

        if (message && !message.equals(nextProps.message)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    };

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isGifLoading !== this.state.isGifLoading && !this.state.isGifLoading) {
            // scrollToBottom();
        }
    }

    handelMenuPopUpOpen = (event) => {
        const targetCoords = event.target.getBoundingClientRect();
        const left: number = (targetCoords.left + targetCoords.width + 9) -
            document.getElementsByClassName("left_side")[0].getBoundingClientRect().width -
            document.getElementsByClassName("app-left-menu")[0].getBoundingClientRect().width;
        const top: number = targetCoords.top - document.getElementsByClassName("header-content")[0].getBoundingClientRect().height + 2;

        setTimeout(() => {
            this.setState({isMenuPopUpOpen: true})
            this.props.showMessageModal({
                name: `file-${this.props.message.get("id") || this.props.message.get("messageId")}`,
                coords: {top, left},
                callbacks: {
                    handleMessageDelete: this.handleMessageDelete,
                    handleMenuPopUpClose: this.handelMenuPopUpClose,
                },
            });
        });
    };

    handelMenuPopUpClose = () => {
        this.props.hideMessageModal();
        this.setState({isMenuPopUpOpen: false})
    };

    componentWillUnmount(): void {
        this.mounted = false;
    };

    getGif = async () => {
        const {message, addSharedMediaImage, updateMessageProperty} = this.props;
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
                        const gifUrl = getBlobUri(original);
                        const sharedMediaImage = {};
                        sharedMediaImage['key'] = message.get("messageId");
                        sharedMediaImage['value'] = gifUrl;
                        updateMessageProperty(message.get("messageId") || message.get("id"), "gifUrl", gifUrl);
                        IDBMessage.update(message.get("messageId") || message.get("id"), {gifUrl})
                        addSharedMediaImage(sharedMediaImage);
                    }
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


    handleGifLoad = ({target: img}: any) => {
        const {updateMessageProperty, messagesLoadedByShowMore} = this.props;
        const container: any = document.getElementById("chatBackground");
        const {message} = this.props;
        const messageInfo = message.get("m_options") && message.get("m_options").toJS();

        // img.src && updateMessageProperty(message.get("messageId") || message.get("id"), "blobUri", img.src);
        if (!(messageInfo && messageInfo.height && messageInfo.width)) {
            // updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
            //     height: img.height,
            //     width: img.width
            // }, true);

            if (img.offsetHeight > 200 && container.offsetHeight + container.scrollTop + 15 < container.scrollHeight) {
                // container.scrollTop = container.scrollTop + img.offsetHeight - 150;
                // container.scrollTop-=5;
            }
        }
        if (!messagesLoadedByShowMore) {
            // scrollToBottom();
        }
    };

    handleGifClick = ({currentTarget}: React.MouseEvent<HTMLElement>) => {
        const {message, handleMediaPopUpOpen} = this.props;
        const creatorId: string = message.get("creator");
        const currentImage = currentTarget;
        if (currentImage) {
            const url = currentImage.getAttribute("data-url") || currentImage.getAttribute("src");
            if (url) {
                handleMediaPopUpOpen(GIF_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), url, creatorId);
            }
        }
    };

    render(): JSX.Element {
        const { gifBlob, isGifLoading, isMenuPopUpOpen} = this.state;
        const {message,forwardMessage,handleMessageReply, gifMessages} = this.props;

        const gifId: string = message && message.get("fileRemotePath");
        const gif: any = gifMessages.get(gifId);



        let bubbleWidth: number = 400;
        const originalWidth: number = gif && gif.getIn(["original", "width"]);
        const originalHeight: number = gif && gif.getIn(["original", "height"]);

        if (bubbleWidth > originalWidth) {
            bubbleWidth = originalWidth;
        }

        const messageInfo = message.get("m_options") && message.get("m_options").toJS();
        const height = messageInfo && messageInfo.height;
        const width = messageInfo && messageInfo.width;
        const tooltipLocalization: any = components().tooltip;
        const bubbleHeight: number = (originalHeight / originalWidth) * bubbleWidth;
        const gifMessageSize: any = {
            height: `${height || bubbleHeight}px`,
            width: `${width || bubbleWidth}px`
        };
        const imageContainerSize: any = {
            minHeight: `${bubbleWidth && bubbleWidth !== 0 ? 0 : 130}px`
        };

        const url: string = gif ? gif.getIn(["preview", "url"]) : "";
        const gifUrl: any = getBlobUri(gifBlob);

        const creatorId: string = message.get("creator");
        const msgId: string = message.get("messageId") || message.get("id");
        const loadStatus = message.get("loadStatus");

        const isDeliveryWaiting: boolean = message.get("own") && !message.get("status") && !message.get("delivered") && !message.get("seen");
        const isSent = message.get("own") && message.get("status") && !message.get("delivered") && !message.get("seen");
        const isDelivered = message.get("own") && message.get("delivered") && !message.get("seen");
        const isSeen = message.get("own") && message.get("seen");
        const imageBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted");
        const videoBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted");
        const isMediaBubble = videoBubble || imageBubble;
        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");

        let time: any = new Date(message.get("time"));
        time = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2);

        return (
            // <div style={{display: originalWidth && originalHeight ? 'block' : 'none'}}>
            <div>
                <GifBlock>
                    <ImageContent className="image">
                        {!(message.get("gifUrl") || gifUrl || url || message.get("info")) ?
                            <img
                                onClick={this.handleGifClick}
                                style={gifMessageSize}
                                src={thumbnail}
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
                            :
                            <img
                            onClick={this.handleGifClick}
                            style={gifMessageSize}
                            src={message.get("gifUrl") || gifUrl || url || message.get("info")}
                            onLoad={this.handleGifLoad}
                            data-rel={isGifLoading ? "" : "blobURI"}
                            data-url={gifUrl}
                            data-thumb={message.get("info")}
                            data-msgid={msgId}
                            data-file-type={message.get("type")}
                            data-load-status={loadStatus}
                            data-creator-id={creatorId}
                            alt="gif"
                        />}
                    </ImageContent>
                    {
                        isGifLoading &&
                        <div style={{position:'absolute'}}>
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
                </GifBlock>

                <TimeBubble
                  isMediaBubble={isMediaBubble}
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
                </TooltipContent>
            </div>
        );
    }
}

const mapStateToProps: any = (dispatch) => (state, props) => {
    return {
        addSharedMediaImage: (image) => dispatch(addSharedMediaImage(image)),
    };
};

const mapDispatchToProps: any = (dispatch) => ({
    showMessageModal: (modalData: object) => dispatch(showMessageModal(modalData)),
    hideMessageModal: () => dispatch(hideMessageModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(GifMessage);
