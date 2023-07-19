"use strict";

import * as React from "react";

import {MESSAGE_TYPES, OFFLINE_MESSAGE_BODY, MAP_SRC_CREATOR, MUSIC_EXT_LIST} from "configs/constants";
import {getBlobUri, getFileColor, getFileDetails} from "helpers/FileHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import {getConversationType} from "helpers/DataHelper";
import {getFileIcon} from "helpers/AppHelper";
import {Icon, IconText, MessageIcon} from "containers/SharedMedia/style";
import {
    CancelEditingText,
    ContactReply,
    ImageReply, MessagePart, PersonallyReply, PersonallyReplyIcon, PersonallyReplytext,
    ReplayName,
    ReplayType,
    ReplyContanier
} from "containers/chat-panel/Reply/style";
import Log from "modules/messages/Log";

const file_unknown: any = require("assets/images/file_unknown.svg");
const music_play: any = require("assets/images/music_play.svg");

interface IReplyBlockProps {
    cancelReplyMessage?: (e: React.MouseEvent<HTMLElement>, actionType?: string) => void;
    attemptSetSelectedThread?: (thread: any, callBack: Function) => void;
    messageToReplayCreator: string;
    replyMessageText: any;
    selectedThread?: any;
    language: string;
    stickers: any;
    message: any;
    isChatMessage?: boolean
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
            if (selectedThreadId && selectedThreadId !== threadId) {
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
        const {messageToReplayCreator, cancelReplyMessage, message, stickers, replyMessageText, isChatMessage} = this.props;
        const messageType = message.get('type');
        const localization: any = components().replyMessage;
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        let text: string = '';
        let replyMessageImage: any = null;
        let iconText: string = "";
        let imageSrc: string = "";
        let isMusicFile: boolean = false;
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
            isMusicFile = true;
        } else if (messageType === MESSAGE_TYPES.text || messageType === MESSAGE_TYPES.contact_with_info) {
            const options = message.get("m_options") && message.get("m_options").toJS && message.get("m_options").toJS() || message.get("m_options");
            if (options && options.img) {
                replyMessageImage = "data:image/jpeg;base64,".concat(options.img);
            }

            text = emojify(message.get("text").replace(rep, "<3").replace(questionEmojy, "<?"));

        } else if (messageType === MESSAGE_TYPES.gif) {
            text = localization.gif;
            replyMessageImage = message.get("gifUrl");
        } else if (messageType === MESSAGE_TYPES.location) {
            const [lat, lng] = message.get("info").split("*");
            replyMessageImage = MAP_SRC_CREATOR(lat, lng);
            text = localization.location;
        } else if (messageType === MESSAGE_TYPES.file) {
            text = localization.file;
            const fileMessage: any = JSON.parse(message.get("info"));
            isMusicFile = MUSIC_EXT_LIST.includes(fileMessage.fileType);
            imageSrc = getFileIcon(fileMessage.fileType);
            if (imageSrc === file_unknown) {
                if (fileMessage.fileType.length <= 3) {
                    iconText = fileMessage.fileType.toUpperCase();
                } else {
                    iconText = "FILE"
                }
            }
        }

        return <React.Fragment>
            {repliedFrom &&
            <PersonallyReply>
                <PersonallyReplyIcon  src={require("assets/images/reply_personally.svg")} alt=""/>
                <PersonallyReplytext>Replied personally from "{repliedFrom}" group</PersonallyReplytext>
            </PersonallyReply>
            }
            <ReplyContanier language={this.props.language} onClick={this.handleScrollToOriginalMessage}>
                {
                    replyMessageImage && (messageType === MESSAGE_TYPES.sticker || messageType === MESSAGE_TYPES.image || messageType === MESSAGE_TYPES.video || messageType === MESSAGE_TYPES.stream_file || messageType === MESSAGE_TYPES.gif)  &&
                    <ImageReply
                        language={this.props.language}
                        draggable={false}
                        src={replyMessageImage}
                        alt=''
                    />
                }

                {(imageSrc || isMusicFile) &&
                <MessageIcon
                    language={this.props.language}
                    isChatFileMessage={isChatMessage}
                    isReplyBlock={true}
                    isMusicFileMessage={isMusicFile}
                    background={isMusicFile ? "rgb(22,172,246)" : "none"}
                    borderRadius={isMusicFile ? "50%" : "0"}
                >
                    <Icon
                        language={this.props.language}
                        className={"play-btn"}
                        width={isMusicFile ? "36px" : "28px"}
                        src={isMusicFile ? music_play : imageSrc}
                    />
                    {
                        imageSrc === file_unknown && !isMusicFile &&
                        <IconText>{iconText}</IconText>
                    }
                </MessageIcon>
                }

                {
                    messageType === MESSAGE_TYPES.contact_with_info && !replyMessageImage &&
                    <ContactReply language={this.props.language} />
                }
                {
                    messageType === MESSAGE_TYPES.contact_with_info && replyMessageImage &&
                    <ImageReply
                        language={this.props.language}
                        contactImageReply={MESSAGE_TYPES.contact_with_info && replyMessageImage}
                        draggable={false}
                        src={replyMessageImage}
                        alt=''
                    />
                }
                <MessagePart>
                    <ReplayName language={this.props.language} >{messageToReplayCreator}</ReplayName>
                    <>
                        {(text && Array.isArray(text)) ?
                            <ReplayType
                                language={this.props.language}
                                draggable={false}
                                dangerouslySetInnerHTML={{__html: text.join("")}}
                            />
                            : <ReplayType language={this.props.language}>{text || replyMessageText}</ReplayType>}
                        {
                            cancelReplyMessage &&
                            <CancelEditingText
                                language={this.props.language}
                                onClick={this.handleCancelReplyMessage}
                                data-event-name='removeReplyMessage'
                            />
                        }
                    </>
                </MessagePart>
            </ReplyContanier>
        </React.Fragment>
    }
};

