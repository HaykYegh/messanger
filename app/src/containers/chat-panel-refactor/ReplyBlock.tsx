"use strict";

import * as React from "react";

import {MESSAGE_TYPES, OFFLINE_MESSAGE_BODY, MAP_SRC_CREATOR} from "configs/constants";
import {getBlobUri, getFileColor} from "helpers/FileHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import {getConversationType} from "helpers/DataHelper";

interface IReplyBlockProps {
    cancelReplyMessage?: (e: React.MouseEvent<HTMLElement>, actionType?: string) => void;
    attemptSetSelectedThread?: (thread: any, callBack: Function) => void;
    messageToReplayCreator: string;
    replyMessageText: any;
    selectedThread?: any;
    language: string;
    stickers: any;
    message: any;
}

interface IReplyBlockState {

}

export default class ReplyBlock extends React.Component<IReplyBlockProps, IReplyBlockState> {

    constructor(props: any) {
        super(props);
        this.state = {};
    }

    shouldComponentUpdate(nextProps: IReplyBlockProps): boolean {
        const {message, messageToReplayCreator, language, stickers} = this.props;

        if (message.get('type') === MESSAGE_TYPES.sticker && !stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (!message.equals(nextProps.message)) {
            return true;
        }

        if (messageToReplayCreator !== nextProps.messageToReplayCreator) {
            return true;
        }

        return language !== nextProps.language;
    }

    componentWillUnmount() {
        document.removeEventListener("scrollToMessage", this.handleScrollToMessage);
    }

    handleScrollToOriginalMessage = () => {
        const {message, selectedThread, attemptSetSelectedThread} = this.props;
        const id: string = message.get('messageId') || message.get('id');
        const threadId: string = message.get('threadId');
        const selectedThreadId: string = selectedThread.get("contactId") || selectedThread.get("id");

        if (id !== "" && !message.get("deleted")) {
            if(selectedThreadId && selectedThreadId !== threadId) {
                attemptSetSelectedThread({
                    threads: {
                        threadId: threadId,
                        threadType: getConversationType(threadId)
                    }
                }, () => this.scrollToMessage(id));
            } else {
                this.scrollToMessage(id);
            }
        }
    };


    scrollToMessage = (msgId: string) => {
        const chatContainer: any = document.getElementById('chatBackground');
        const messageElement: any = document.getElementById(msgId);
        if (messageElement) {
            if (!chatContainer.classList.contains("scroll-smooth")) {
                chatContainer.classList.add('scroll-smooth');
            }
            messageElement.scrollIntoView(false);
            chatContainer.classList.remove('scroll-smooth');
        }
    };

    handleScrollToMessage = ({detail: {repId}}: any) => {
        const {message} = this.props;
        const id: string = message.get('messageId') || message.get('id');
        if (repId === id) {
            const chatContainer: any = document.getElementById('chatBackground');
            const element: any = document.getElementById(id);
            if (!chatContainer.classList.contains("scroll-smooth")) {
                chatContainer.classList.add('scroll-smooth');
            }
            element && element.scrollIntoView(false);
            chatContainer.classList.remove('scroll-smooth');
        }
    };

    handleCancelReplyMessage = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const {cancelReplyMessage} = this.props;
        cancelReplyMessage(event)
    };

    render(): JSX.Element {
        const {messageToReplayCreator, cancelReplyMessage, message, stickers, replyMessageText} = this.props;
        const messageType = message.get('type');
        const localization: any = components().replyMessage;
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        let text: string = '';
        let replyMessageImage: any = null;
        let fileClass: string = "";
        let iconText: string = "";
        const repliedFrom: string = message.get("repliedFrom");

        if (messageType === MESSAGE_TYPES.sticker) {
            text = localization.sticker;
            const sticker = message.get("info");
            const stickerBlob: any = stickers && stickers.getIn([sticker.split("_").shift().toString(), "icons", sticker]);
            const stickerImage: any = getBlobUri(stickerBlob);
            replyMessageImage = stickers.getIn([sticker.split("_").shift().toString(), "defaultPackage"]) ? stickerBlob : stickerImage;

        } else if (messageType === MESSAGE_TYPES.image) {
            // replyMessageImage = "data:image/jpeg;base64,".concat(message.get("info"));
            replyMessageImage = message.get("info");
            text = (message.get('text') && message.get('text') !== "#E#F#M#") ? message.get('text') : localization.photo;
            text = emojify(text.replace(rep, "<3").replace(questionEmojy, "<?"));

        } else if (messageType === MESSAGE_TYPES.video || messageType === MESSAGE_TYPES.stream_file) {
            // replyMessageImage = "data:image/jpeg;base64,".concat(message.get("info"));
            replyMessageImage = message.get("info");
            text = (message.get("text") === OFFLINE_MESSAGE_BODY || message.get("text") === "null") ? localization.video : ((message.get("type") === MESSAGE_TYPES.stream_file && message.get("text") && message.get("text").match(/text="(.*?)"[ ]?\//)) ? message.get("text").match(/text="(.*?)"[ ]?\//)[1] : message.get("text"));
            if (!text || (message.get("text").match(/text="(.*?)"[ ]?\//) && text === "null")) {
                text = localization.video;
            }
            text = emojify(text.replace(rep, "<3").replace(questionEmojy, "<?"));

        } else if (messageType === MESSAGE_TYPES.voice) {
            text = localization.voice;

        } else if (messageType === MESSAGE_TYPES.text || messageType === MESSAGE_TYPES.contact_with_info) {
            const options = message.get("m_options") && message.get("m_options").toJS && message.get("m_options").toJS() || message.get("m_options");
            if (options && options.img) {
                replyMessageImage = "data:image/jpeg;base64,".concat(options.img);
            }
            text = emojify(message.get("text").replace(rep, "<3").replace(questionEmojy, "<?"));

        } else if (messageType === MESSAGE_TYPES.gif) {
            text = localization.gif;
            replyMessageImage = message.get("info");

        } else if (messageType === MESSAGE_TYPES.location) {
            const [lat, lng] = message.get("info").split("*");
            replyMessageImage = MAP_SRC_CREATOR(lat, lng);
            text = localization.location;

        } else if (messageType === MESSAGE_TYPES.file) {
            text = localization.file;
            const fileMessage: any = JSON.parse(message.get("info"));
            fileClass = getFileColor(fileMessage.fileType);
            iconText = (fileMessage.fileType && fileMessage.fileType.length > 4) ? "file" : fileMessage.fileType;
        }

        return <React.Fragment>
            {repliedFrom &&
                <div className="personally-reply">
                    <img className="personally-reply-icon" src={require("assets/images/reply_personally.svg")} alt=""/>
                    <span className="personally-reply-text">Replied personally from "{repliedFrom}" group</span>
                </div>}
            <div className="replay-block replaying-message" onClick={this.handleScrollToOriginalMessage}>
                {
                    replyMessageImage &&
                    <img
                        draggable={false}
                        src={replyMessageImage}
                        className={messageType === MESSAGE_TYPES.sticker ? "sticker_image" : MESSAGE_TYPES.contact_with_info ? "reply_contact_image" : "reply_image"}
                        alt=''
                    />
                }
                {
                    fileClass &&
                    <span className={`file-bg ${fileClass}`}>
                        <span className="file_text">{iconText}</span>
                    </span>
                }
                {
                    messageType === MESSAGE_TYPES.contact_with_info && !replyMessageImage &&
                    <span className="contact-icon"/>
                }
                <div className="message-part">
                    <div className="top-info">
                        <span className="replay-name">{messageToReplayCreator}</span>
                        {
                            cancelReplyMessage &&
                            <span
                                className="cancel-editing-text"
                                onClick={this.handleCancelReplyMessage}
                                data-event-name='removeReplyMessage'
                            />
                        }
                    </div>
                    <div className="message-info">
                        {(text && Array.isArray(text)) ?
                            <span
                                draggable={false}
                                className="replay-text"
                                dangerouslySetInnerHTML={{__html: text.join("")}}
                            />
                            : <span className="replay-text">{text || replyMessageText}</span>}
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
};

