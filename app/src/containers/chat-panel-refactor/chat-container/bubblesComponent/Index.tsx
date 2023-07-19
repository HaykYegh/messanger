"use strict";

import {Map} from "immutable";
import * as React from "react";
import classnames from "classnames";
const classNames = classnames;

import {IMAGE_TOGGLE, MESSAGE_TYPES, NETWORK_LINK_REGEX, OFFLINE_MESSAGE_BODY, VIDEO_TOGGLE} from "configs/constants";
import {getThread, getThreadType} from "helpers/DataHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import {ISticker} from "modules/settings/SettingsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import ReplyBlock from "containers/chat-panel/Reply/ReplyBlock";
import Avatar from "components/contacts/Avatar";
import MessageElement from "./MessageElement";
import {BubbleContainer, EditedMessage, IsDeliveryWaiting, StatusMessage, Time, TimeBubble} from "./style";
import {AvatarSize} from "components/contacts/style";
import LinkPreview from "components/messages/LinkPreview";
import {getMessageTime} from "helpers/DateHelper";

interface IMessageProps {
    togglePopUp: (type: typeof IMAGE_TOGGLE | typeof VIDEO_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    toggleMap: (lat: number, lng: number, location: string) => void;
    onRightClick: (event: React.MouseEvent<HTMLDivElement>) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    attemptSetStickersIcons: (id: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    createMessage: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    uploadFile: (messages: any, file: any) => void;
    updateMessageProperty: (msgId, property, value, updateToDB?: boolean) => void;
    setShowSharedMedia: (showSharedMedia: boolean) => void;
    resetConversationLastMessage: (threadId) => void;
    handleNetworkJoin: (keyword: string, token: boolean) => void;
    deleteMessage: (msgId) => void;
    stickers: Map<string, ISticker>;
    selectedContact?: IContact;
    lastAuthor: string;
    nextAuthor: string;
    lastMessageType: string;
    lastMessageDeleted: string;
    searchedActiveMessage: string;
    textToReply: any;
    nameToReplay: any;
    creator: IContact;
    message: IMessage;
    isGroup: boolean;
    userId: string;
    contacts: any;
    gifMessages: any;
    languages: any;
    last?: boolean;
    penultimate?: boolean;
    lastSeen?: boolean;
    lastDelivered?: boolean;
    sharedMediaPanel: boolean;
    messagesLoadStatus: any;
    selectedThread: any;
    showSharedMedia: boolean;
    replyingMessage: any;
    messagesLoadedByShowMore: boolean;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, emails: string[], labels: any[]) => void,
    isOnline: boolean;
    isSystemMessage?: any;

    attemptSetSelectedThread: (threadId: any, callback?: Function) => void;

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void;
    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;

    isNextMessageSystemMessage: boolean
}

export default class Message extends React.Component<IMessageProps> {
    shouldComponentUpdate(nextProps: IMessageProps) {
        const {
            textToReply, nameToReplay, message, lastAuthor, creator, stickers, contacts, userId, last, penultimate,
            selectedContact, languages, sharedMediaPanel, lastSeen, lastDelivered, nextAuthor, gifMessages, searchedActiveMessage,
            messagesLoadedByShowMore
        } = this.props;
        const msgId = message.get("id") || message.get("messageId");

        if (textToReply !== nextProps.textToReply) {
            return true;
        }

        if (nameToReplay !== nextProps.nameToReplay) {
            return true;
        }

        if (!message.equals(nextProps.message)) {
            return true;
        }

        if ((nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) &&
            (nextProps.searchedActiveMessage === msgId || searchedActiveMessage === msgId)) {
            return true;
        }

        if (!gifMessages.equals(nextProps.gifMessages)) {
            return true;
        }

        if (lastAuthor !== nextProps.lastAuthor) {
            return true;
        }

        if (nextAuthor !== nextProps.nextAuthor) {
            return true;
        }

        if (last !== nextProps.last) {
            return true;
        }

        if (userId !== nextProps.userId) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (messagesLoadedByShowMore !== nextProps.messagesLoadedByShowMore) {
            return true;
        }

        if (creator && nextProps.creator && !creator.equals(nextProps.creator)) {
            return true;
        }

        if (!languages.equals(nextProps.languages)) {
            return true;
        }

        if (!contacts.equals(nextProps.contacts)) {
            return true;
        }

        if (!stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (lastSeen != nextProps.lastSeen) {
            return true;
        }

        if (penultimate != nextProps.penultimate) {
            return true;
        }

        if (lastDelivered != nextProps.lastDelivered) {
            return true
        }
        return selectedContact && nextProps.selectedContact && !selectedContact.equals(nextProps.selectedContact);
    }

    child: any;

    handleOpenFileInFolder = (event) => {
        if (event.target && event.target.className.match(/(cancel-icon|dislikes-ico|likes-ico|likes-number|likes)/)) {
            return;
        }
        this.child && this.child.openFileInFolder();
    };

    handleContactClick = () => {
        const {attemptSetSelectedThread, contacts, message} = this.props;
        const creator: string = message.get("creator");
        const groupMember = contacts.get(creator) && contacts.get(creator).toJS();
        attemptSetSelectedThread(groupMember);
    };

    get isSystemMessage(): boolean {
        const {message} = this.props;
        return [
            MESSAGE_TYPES.leave_group,
            MESSAGE_TYPES.join_group,
            MESSAGE_TYPES.remove_from_group,
            MESSAGE_TYPES.update_group_avatar,
            MESSAGE_TYPES.update_group_name,
            MESSAGE_TYPES.room_call_start,
            MESSAGE_TYPES.room_call_join,
            MESSAGE_TYPES.room_call_leave,
            MESSAGE_TYPES.room_call_end,
            MESSAGE_TYPES.delete_room,
            MESSAGE_TYPES.create_room
        ].includes(message.get('type'));
    }

    get circleElement(): JSX.Element {
        const isOwn: boolean = this.props.message.get("own");
        return (
            <span className={`${isOwn ? 'user_circle' : 'guest_circle'}`}/>
        )
    }

    render() {
        const {
            downloadFile, uploadFile, updateMessageProperty, deleteMessage, createMessage, textToReply, nameToReplay, messagesLoadStatus, lastSeen, isOnline,
            message, toggleMap, lastAuthor, lastMessageDeleted, togglePopUp, creator, onRightClick, languages, attemptOptimiseVideo, lastDelivered, gifMessages, attemptSetStickersIcons,
            stickers, contacts, userId, last, inviteToCall, selectedContact, handleAudioChange, attemptSetCreateContactNumber, resetConversationLastMessage, sharedMediaPanel, nextAuthor, showSharedMedia,
            setShowSharedMedia, replyingMessage, messagesLoadedByShowMore, searchedActiveMessage, handleNetworkJoin, attemptCreateContact, attemptSetSelectedThread, UPDATE_MEDIA_RECORD, ADD_MEDIA_RECORD,
            isNextMessageSystemMessage, forwardMessage, handleMessageReply, handleMessageDelete
        } = this.props;
        const {isGroup} = getThreadType(selectedContact.getIn(['threads', 'threadType']));

        if (!creator && !message.get("creator")) {
            return null;
        }

        const isDeleted: boolean = message.get("deleted");
        const isOwn: boolean = message.get("own");
        const isEdited: boolean = !!message.get("edited");
        const type: any = message.get("type");
        const options: any = message.get("m_options");
        const isLink: boolean = message.get("link");
        const messageText: any = message.get("text");
        const repId: any = message.get("repid");
        const messageId: string = message.get("messageId") || message.get("id");
        const messageCreator: any = message.get("creator");
        const seen: boolean = message.get("seen");
        const delivered: boolean = message.get("delivered");
        const info: any = message.get("info");
        const status: any = message.get("status");

        const time: string = getMessageTime(message.get("time"));

        const thread = getThread(selectedContact, userId);

        const _isSystemMessage: boolean = this.isSystemMessage;

        const bubbleDivIsInfo: boolean = _isSystemMessage || isDeleted;

        const userName: string = creator ? (creator.get("username") ? creator.get("username") : creator.get("phone")) : messageCreator.replace(/@[^@]+$/, '');
        const name: string = !creator ? "+" + messageCreator.replace(/@[^@]+$/, '') : (creator.get("firstName") || creator.get("lastName")) ? `${creator.get("firstName")} ${creator.get("lastName")}`.trim() : creator.get("username") ? creator.get("username") : creator.get("phone");

        const textSpanClassNames: string = classNames({
            hidden: !isGroup || (userName === lastAuthor && !_isSystemMessage && !lastMessageDeleted) || isOwn,
            group_guest_name: isGroup
        });

        const isYoutube = options && options.get('isYoutube');
        const hasBigImage = options && (options.get('title') || options.get('description')) && options.get('img') && (options.get('width') > 200 && options.get('width') !== options.get('height')) && !options.get('isYoutube');
        const selectedLanguage: string = languages && languages.get("selectedLanguage");
        const text = messageText === OFFLINE_MESSAGE_BODY || messageText === "null" ? "" : messageText;

        const bubbleDivClassNames: string = classNames({
            "leave-bubble": _isSystemMessage || isDeleted,
            "guest_bubble": !isOwn || [MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(type) || isDeleted,
            "link-bubble": !isDeleted && type === MESSAGE_TYPES.text && isLink,
            "link_bubble_youtube": isYoutube && !isDeleted,
            "link_bubble_mini": hasBigImage && !isDeleted,
            "user_bubble": isOwn && ![MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(type) && !isDeleted,
            "sticker-guest-bubble": !isOwn && info && type === MESSAGE_TYPES.sticker && !isDeleted,
            "img-bubble": [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(type) && !isDeleted && !text,
            "img-bubble-caption": [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(type) && !isDeleted && text,
            "sticker-bubble": info && type === MESSAGE_TYPES.sticker && !repId && !isDeleted,
            "sticker_img_bubble": type === MESSAGE_TYPES.sticker && repId && !isDeleted,
            "file-bubble-guest": type === MESSAGE_TYPES.file && !isOwn && !isDeleted,
            "file-bubble-user": type === MESSAGE_TYPES.file && isOwn && !isDeleted,
            "call-status-outgoing-bubble": type === MESSAGE_TYPES.outgoing_call && !isDeleted,
            "call-status-incoming-bubble": type === MESSAGE_TYPES.incoming_call && !isDeleted,
            "call-status-missed-bubble": type === MESSAGE_TYPES.missed_call && !isDeleted,
            "call-bubble-ru": [MESSAGE_TYPES.missed_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.outgoing_call].includes(type) && !isDeleted && selectedLanguage === "ru",
            "contact-bubble": [MESSAGE_TYPES.contact, MESSAGE_TYPES.contact_with_info].includes(type) && !isDeleted,
            "video-bubble": (type === MESSAGE_TYPES.video || type === MESSAGE_TYPES.stream_file) && !isDeleted && !text,
            "video-bubble-caption": (type === MESSAGE_TYPES.video || type === MESSAGE_TYPES.stream_file) && !isDeleted && text,
            "audio-bubble": type === MESSAGE_TYPES.voice && !isDeleted,
            "reply_bubble": repId && !isDeleted,
            "seen-bubble": isOwn && last,
            "typing_bubble": false,
            "seen_bubble": (lastSeen || lastDelivered) && !last,
            "bubble": true
        });


        const mainDivClassNames: string = classNames({
            "leave-message": _isSystemMessage || isDeleted,
            "call-status": [MESSAGE_TYPES.outgoing_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.missed_call].includes(type) && !isDeleted,
            "guest_notfirst_msg": !isOwn && !_isSystemMessage && !lastMessageDeleted && userName === nextAuthor && !isNextMessageSystemMessage,
            "user_notfirst_msg": isOwn && !isNextMessageSystemMessage && userName === nextAuthor || nextAuthor === "",
            "guest_msg_box": !isOwn,
            "user_msg_box": isOwn,
            "message_container": true,
        });

        const timeSpanClassNames: string = classNames({
            guest_bubble_time: !isOwn || [MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(type) || isDeleted,
            user_bubble_time: isOwn && ![MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(type) && !isDeleted,
            bubble_edited_icon: isEdited
        });

        const threadImage: any = {
            url: isGroup && creator ? creator.get("avatarUrl") : thread && thread.get("avatarUrl"),
            file: isGroup && creator ? creator.get("avatar") : thread && thread.get("avatar"),
        };


        const networkRegex: any = new RegExp(NETWORK_LINK_REGEX, "gi");
        const networkLink: boolean = networkRegex.test(messageText);

        const isDeliveryWaiting: boolean = isOwn && !status && !delivered && !seen;
        const isSent: boolean = isOwn && status && !delivered && !seen;
        const isDelivered: boolean = isOwn && delivered && !seen;
        const isSeen: boolean = isOwn && seen;
        const imageBubble: boolean = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(type) && !isDeleted && !text;
        const isImageCaptionBubble: boolean = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(type) && !isDeleted && text;
        const videoBubble: boolean = (type === MESSAGE_TYPES.video || type === MESSAGE_TYPES.stream_file) && !isDeleted && !text;
        const isVideoCaptionBubble: boolean = (type === MESSAGE_TYPES.video || type === MESSAGE_TYPES.stream_file) && !isDeleted && text;
        const isCaption: boolean = isImageCaptionBubble || isVideoCaptionBubble;

        const isMediaBubble: boolean = videoBubble || imageBubble;
        const guestFileBubble: boolean = type === MESSAGE_TYPES.file && !isOwn && !isDeleted;
        const userFileBubble: boolean = type === MESSAGE_TYPES.file && isOwn && !isDeleted;
        const fileBubble: boolean = guestFileBubble || userFileBubble;
        const isLinkBubble: boolean = !isDeleted && type === MESSAGE_TYPES.text && isLink;
        const isCallOutgoingBubble: boolean = type === MESSAGE_TYPES.outgoing_call && !isDeleted;
        const isCallIncomingBubble: boolean = type === MESSAGE_TYPES.incoming_call && !isDeleted;
        const callMissedBubble: boolean = type === MESSAGE_TYPES.missed_call && !isDeleted;
        const callBubble: boolean = isCallOutgoingBubble || isCallIncomingBubble || callMissedBubble;
        const stickerBubble: boolean = info && type === MESSAGE_TYPES.sticker && !repId && !isDeleted;
        const leaveBubble: boolean = _isSystemMessage || isDeleted;
        const isAvatarShown: boolean = !isDeleted && !isOwn && !_isSystemMessage
            && (userName !== nextAuthor && !lastMessageDeleted || isNextMessageSystemMessage);



        return (

            <div
                id={messageId}
                className={mainDivClassNames}
            >
                {
                    isAvatarShown ?
                        <AvatarSize margin="0" width="36px" height="36px"
                                    onClick={isGroup ? this.handleContactClick : null} cursor={"pointer"}>
                            <Avatar
                                image={threadImage}
                                color={isGroup ? (creator ? creator.getIn(["color", "numberColor"]) : "") : thread.getIn(["color", "numberColor"])}
                                status={thread.get("status")}
                                avatarCharacter={isGroup ? (creator ? creator.get("avatarCharacter") : "") : thread.get("avatarCharacter")}
                                name={isGroup ? (creator ? (creator.get("avatarCharacter") ? thread.get("name") : "") : "") : thread.get("firstName")}
                                fontSize={"12px"}
                                border={"1px solid #F5F5F7"}
                            />
                        </AvatarSize> :
                        !message.get("own") ?
                            <div className="contact_img"/> : null
                }
                <BubbleContainer
                    videoBubble={videoBubble}
                    imageBubble={imageBubble}
                    fileBubble={fileBubble}
                    isLinkBubble={isLinkBubble}
                    isOwnMessage={isOwn}
                    isCaption={isCaption}
                    isMediaBubble={isMediaBubble}
                    className={bubbleDivClassNames}
                    onContextMenu={onRightClick}
                    data-messagetype={type}
                    data-messageid={messageId}
                    data-isinfo={bubbleDivIsInfo}
                >
                    <span
                        className={textSpanClassNames}
                        onClick={isGroup ? this.handleContactClick : null}
                    >{name}
                    </span>

                    {this.circleElement}

                    {
                        replyingMessage && !isDeleted &&
                        <ReplyBlock
                            replyMessageText={textToReply}
                            language={languages.get("selectedLanguage")}
                            stickers={stickers}
                            attemptSetSelectedThread={attemptSetSelectedThread}
                            selectedThread={this.props.selectedThread}
                            messageToReplayCreator={nameToReplay}
                            message={replyingMessage}
                        />
                    }
                    <MessageElement
                        ref={instance => {
                            this.child = instance;
                        }}
                        textToReply={textToReply}
                        attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                        attemptOptimiseVideo={attemptOptimiseVideo}
                        selectedContact={thread}
                        languages={languages}
                        inviteToCall={inviteToCall}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        createMessage={createMessage}
                        message={message}
                        togglePopUp={togglePopUp}
                        stickers={stickers}
                        toggleMap={toggleMap}
                        updateMessageProperty={updateMessageProperty}
                        deleteMessage={deleteMessage}
                        userId={userId}
                        handleAudioChange={handleAudioChange}
                        resetConversationLastMessage={resetConversationLastMessage}
                        sharedMediaPanel={sharedMediaPanel}
                        messagesLoadStatus={messagesLoadStatus}
                        showSharedMedia={showSharedMedia}
                        setShowSharedMedia={setShowSharedMedia}
                        gifMessages={gifMessages}
                        attemptSetStickersIcons={attemptSetStickersIcons}
                        searchedActiveMessage={searchedActiveMessage}
                        handleNetworkJoin={handleNetworkJoin}
                        messagesLoadedByShowMore={messagesLoadedByShowMore}
                        attemptCreateContact={attemptCreateContact}
                        isSystemMessage={_isSystemMessage}

                        handleOpenFileInFolder={this.handleOpenFileInFolder}
                        attemptSetSelectedThread={attemptSetSelectedThread}
                        contacts={contacts}

                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handleMessageDelete={handleMessageDelete}
                        ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                        UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}

                    />


                    {/*Todo move it to specific component level, this time check if message not a link, remove after*/}
                    {
                        (!isLink && !isMediaBubble && !isCaption && !leaveBubble && !fileBubble) &&
                        <TimeBubble
                            isMediaBubble={isMediaBubble}
                            isOwnMessage={isOwn}
                            fileBubble={fileBubble}
                            callBubble={callBubble}
                            stickerBubble={stickerBubble}
                        >
                            {isEdited && <EditedMessage/>}
                            <Time>{time}</Time>
                            <StatusMessage
                                isSeen={isSeen}
                                isDelivered={isDelivered}
                                isSent={isSent}/>
                            {callBubble || isDeliveryWaiting &&
                            <IsDeliveryWaiting fileBubble={fileBubble} stickerBubble={stickerBubble}
                                               isMediaBubble={isMediaBubble}><span/></IsDeliveryWaiting>}
                        </TimeBubble>
                    }
                    {/*{message.get("showProgressBar") && <Progress completed={message.get("percentage")} color={"#85ac64"} height={3}/>}*/}
                </BubbleContainer>
            </div>
        );
    }
};




