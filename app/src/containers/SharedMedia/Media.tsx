"use strict";

import * as React from "react";
import {ScrollBar} from "containers/settings/style";
import {
    GIF_TOGGLE,
    IMAGE_TOGGLE,
    MESSAGE_TYPES,
    SHARED_MEDIA_LIMIT,
    SHARED_MEDIA_TYPES,
    VIDEO_TOGGLE
} from "configs/constants";
import {
    ButtonContent,
    NoMedia,
    PlayButton,
    SelectButton,
    SharedMediaElement,
    SharedMediaImage,
    SharedMediaList
} from "containers/SharedMedia/style";
import {BoldText, DescriptionText} from "../../pages/AuthContainer/style";
import components from "configs/localization";
import {Loader, LoadingPage} from "../../pages/style";
import MessagesModel from "modules/messages/MessagesModel";
import {getBlobUri} from "helpers/FileHelper";
import thumbnail from "assets/images/thumbnail100x100.png";
import Log from "modules/messages/Log";

export interface IMediaProps {
    mediaMessages: any
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE | typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean) => void;
    isFilesEditing: boolean,
    handleFilesChecked: (message: any, type: string, isOwnMessage: boolean) => void;
    checkedFiles: {
        [key: string]: {
            type: string,
            index: number
        }
    };
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void;
    selectedThreadId: string
    media: any;
    setSharedMediaImages:any;
    images: any;
    sharedMediaCount: any;
}


export default class Media extends React.Component<IMediaProps> {

    _scrollbar: HTMLDivElement;

    get scrollbar() {
        return this._scrollbar
    }

    set scrollbar(value) {
        this._scrollbar = value
    }

    handleMediaMessagesScroll = (event: any) => {
        const {mediaMessages} = this.props;
        if (event.target.scrollTop >= (event.target.scrollHeight - event.target.offsetHeight) && mediaMessages.get("count") > mediaMessages.get("records").size) {
            const {fetchSharedMedia, selectedThreadId} = this.props;
            fetchSharedMedia(selectedThreadId, SHARED_MEDIA_TYPES.MEDIA);
            // this.scrollbar.scrollTop = event.target.scrollHeight;
        }
    };

    handleMessageSelect = (msgId: string) => {
        const {handleFilesChecked, mediaMessages} = this.props;
        const isOwnMessage: boolean = mediaMessages.getIn(["records", msgId, "messages", "own"]);
        handleFilesChecked(msgId, SHARED_MEDIA_TYPES.MEDIA, isOwnMessage)
    };

    handleShowVideoPopup = (msgId: string) => {
        const {mediaMessages, togglePopUp} = this.props;
        const message: any = mediaMessages.getIn(["records", msgId, "messages"]);
        let fileLink: string = "";
        if (message.get('info')) {
            fileLink = message.get('info');
        }
        togglePopUp(VIDEO_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), fileLink, message.get("creator"), true);
    };

    handleShowImagePopup = (msgId: string) => {
        const {mediaMessages, togglePopUp} = this.props;
        const message: any = mediaMessages.getIn(["records", msgId, "messages"]);
        let fileLink: string = "";
        if (message.get('info') || message.get('gifUrl')) {
            fileLink = message.get('info') || message.get('gifUrl');
        }

        Log.i("handleShowImagePopup -> message = ", message)

        togglePopUp(IMAGE_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), fileLink, message.get("creator"), true);
    };

    handleMediaElementClick = (event: React.MouseEvent<HTMLLIElement>) => {
        const {mediaMessages} = this.props;
        const msgId: string = event.currentTarget.getAttribute("data-value");

        const {isFilesEditing} = this.props;
        if (!isFilesEditing) {
            const fileType: string = mediaMessages.getIn(["records", msgId, "messages", "type"]);
            if (fileType === MESSAGE_TYPES.video || fileType === MESSAGE_TYPES.stream_file) {
                this.handleShowVideoPopup(msgId)
            } else if (fileType === MESSAGE_TYPES.image || fileType === MESSAGE_TYPES.gif) {
                this.handleShowImagePopup(msgId)
            }
        } else {
            this.handleMessageSelect(msgId)
            event.stopPropagation();
            event.preventDefault();
        }
    };

    render() {
        const {mediaMessages, isFilesEditing, checkedFiles, media, images} = this.props;
        const localization: any = components().sharedImages;
        const messages: any = media;
        // const sorted = mediaMessages.get('records').toArray().sort().reverse();
        const messagesCount: number = mediaMessages.get("count");

        return (
            <>
                {
                    mediaMessages.get("isLoading") && messages.size === 0 && messagesCount !== 0 &&
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%'}}>
                      <LoadingPage
                        width="30px"
                        height="30px"
                      >
                          <Loader
                            width="30px"
                            height="30px"
                            background="white"
                          />
                      </LoadingPage>
                  </div>

                }

                {
                    // messages.size !== 0 && !mediaMessages.get("isLoading") &&
                    messages.size !== 0 &&
                    <ScrollBar height="inherit" padding="0" onScroll={this.handleMediaMessagesScroll}
                               ref={ref => this.scrollbar = ref}>
                        <SharedMediaList key='IMAGES'>
                            {mediaMessages.get('records').valueSeq().sortBy(
                                (item) => item.getIn(['messages', 'time'])
                            ).reverse().map((messageData) => {
                                const message: any = messageData.get("messages");
                                const msgId: string = message.get("messageId") || message.get("id");


                                let fileLink: string = "";
                                let blobLink: string = "";
                                if (message.get("type") === MESSAGE_TYPES.stream_file) {
                                    blobLink = message.get("text").match(/href="(.*?)"/) && message.get("text").match(/href="(.*?)"/)[1];
                                }
                                if (message.get('info') && message.get('info') !== null) {
                                    // fileLink = 'data:image/jpeg;base64,' + message.get('info');
                                    fileLink = message.get('info');
                                }
                                const content = checkedFiles[msgId] && checkedFiles[msgId].index.toString();

                                if (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) {
                                    return (
                                        <SharedMediaElement
                                            key={`${msgId}`}
                                            onClick={this.handleMediaElementClick}
                                            data-value={msgId}
                                            elementType={SHARED_MEDIA_TYPES.MEDIA}
                                            isEditing={isFilesEditing}
                                        >
                                            <SharedMediaImage
                                              src={fileLink || thumbnail}
                                              data-url={blobLink || fileLink}
                                              data-msgid={message.get("messageId") ? message.get("messageId") : message.get("id")}
                                              data-fileremotepath={message.get("fileRemotePath")}
                                              data-file-type={message.get("type")}
                                              data-creator-id={message.get("creator")}
                                              data-thread-id={message.get("threadId")}
                                              data-rel={"sharedBlobURI"}
                                              data-load-status={message.get("loadStatus")}
                                            />
                                            <PlayButton/>
                                            {
                                                isFilesEditing &&
                                                <SelectButton
                                                    isSelected={checkedFiles.hasOwnProperty(msgId)}
                                                >
                                                    <ButtonContent>{content}</ButtonContent>
                                                </SelectButton>
                                            }
                                        </SharedMediaElement>
                                    )
                                } else if (message.get("type") === MESSAGE_TYPES.image || message.get("type") === MESSAGE_TYPES.gif) {

                                    // const mediaMessage: any = mediaMessages.getIn(["records", msgId, "messages"]);
                                    // Log.i("mediaMessage ->", message.get("gifUrl"))
                                    // Log.i("mediaMessage image ->", message)
                                    const mediaUrl = message.get("type") === MESSAGE_TYPES.image ? message.get("blobUri") : message.get("gifUrl")
                                    return (
                                        <SharedMediaElement
                                            key={`${msgId}`}
                                            onClick={this.handleMediaElementClick}
                                            elementType={SHARED_MEDIA_TYPES.MEDIA}
                                            data-value={msgId}
                                        >
                                            <SharedMediaImage
                                              src={mediaUrl || images[msgId] || fileLink || thumbnail}
                                              data-rel={"sharedBlobURI"}
                                              data-url={message.get("gifUrl") || images[msgId] || fileLink}
                                              data-msgid={mediaUrl ? message.get("messageId") : message.get("id")}
                                              data-fileremotepath={message.get("fileRemotePath")}
                                              data-file-type={message.get("type")}
                                              data-creator-id={message.get("creator")}
                                              data-thread-id={message.get("threadId")}
                                              data-load-status={message.get("loadStatus")}
                                              data-thumb={message.get("gifUrl") || message.get("info")}
                                              blur={message.get("gifUrl") || images[msgId] || message.get('own') === true ? false : fileLink ? true : false}
                                            />
                                            {
                                                isFilesEditing &&
                                                <SelectButton
                                                    isSelected={checkedFiles.hasOwnProperty(msgId)}
                                                >
                                                    <ButtonContent>{content}</ButtonContent>
                                                </SelectButton>
                                            }
                                        </SharedMediaElement>
                                    )
                                } else {
                                    return;
                                }
                            })}
                        </SharedMediaList>
                    </ScrollBar>
                }
                {
                    messagesCount === 0 && messages.size === 0 && !mediaMessages.get("isLoading") &&
                    <NoMedia>
                        <BoldText>{localization.noMedia}</BoldText>
                        <DescriptionText>{localization.noMediaText}</DescriptionText>
                    </NoMedia>
                }
            </>
        );
    }

}
