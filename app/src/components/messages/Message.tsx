"use strict";

import {Map} from "immutable";
import * as React from "react";
import classnames from "classnames";
const classNames = classnames;

import {IMAGE_TOGGLE, MESSAGE_TYPES, NETWORK_LINK_REGEX, OFFLINE_MESSAGE_BODY, VIDEO_TOGGLE} from "configs/constants";
import {getName, getThread, getThreadType} from "helpers/DataHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import {ISticker} from "modules/settings/SettingsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import ReplyBlock from "containers/chat-panel/Reply/ReplyBlock";
import LinkPreview from "components/messages/LinkPreview";
import Avatar from "components/contacts/Avatar";
import components from "configs/localization";
import MessageElement from "./MessageElement";
import {
    BubbleContainer,
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble,
    MassageContentText, StartConferenceTimeBubble
} from "components/messages/style";
import {AvatarSize} from "components/contacts/style";
import Log from "modules/messages/Log";
import {scrollToBottom} from "helpers/UIHelper";

interface IMessageProps {
    togglePopUp: (type: typeof IMAGE_TOGGLE | typeof VIDEO_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    toggleMap: (lat: number, lng: number, location: string) => void;
    onRightClick: (event: React.MouseEvent<HTMLDivElement>) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    attemptSetStickersIcons: (id: string, callback: Function, iconId: string) => void;
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
    language?: string;
    last?: boolean;
    lastSeen?: boolean;
    lastDelivered?: boolean;
    sharedMediaPanel: boolean;
    messagesLoadStatus: any;
    selectedThread: any;
    showSharedMedia: boolean;
    replyingMessage: any;
    messagesLoadedByShowMore: boolean;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, emails: string[], labels: any[]) => void,
    isLink?: boolean;
    isOnline: boolean;
    selectedConversation: any;
    conversationLastMessageId: string;
    changeConversationLastMessageId: (msgId: string) => void;

    attemptSetSelectedThread: (threadId: any, callback?: Function) => void;

    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void

    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handleShowInFolder: (message?: any) => void;

    isNextMessageSystemMessage: boolean;
    isLastMessageSystemMessage: boolean;
    isMessagesLoading?: boolean;
    selectedThreadId: string;
    caches: any;
}

export default class Message extends React.Component<IMessageProps> {

    componentDidMount() {
        const { selectedConversation, message, conversationLastMessageId, changeConversationLastMessageId } = this.props;
        if (localStorage.getItem("chatSelected") && localStorage.getItem("chatSelected") === "false") {
            scrollToBottom();
            setTimeout(() => {
                localStorage.removeItem("chatSelected")
            }, 100)
        }
        if (
            selectedConversation.getIn(["conversations", "lastMessageId"]) === message.get("messageId")
            && message.get("messageId") !== conversationLastMessageId
        ) {
            scrollToBottom();
            changeConversationLastMessageId(message.get("messageId"));
        }
    }

    componentDidUpdate(prevProps: Readonly<IMessageProps>) {
        const { selectedConversation, message, conversationLastMessageId, changeConversationLastMessageId } = this.props;

        if(selectedConversation.getIn(["conversations", "lastMessageId"]) !== prevProps.selectedConversation.getIn(["conversations", "lastMessageId"]) &&
            selectedConversation.getIn(["conversations", "lastMessageId"]) === message.get("messageId") &&
            message.get("messageId") !== conversationLastMessageId
        ) {
            scrollToBottom();
            changeConversationLastMessageId(message.get("messageId"));
        }
    }


    shouldComponentUpdate(nextProps: IMessageProps) {
        const {
            textToReply, nameToReplay, message, lastAuthor, creator, stickers, contacts, userId, last,
            selectedContact, languages, sharedMediaPanel, lastSeen, lastDelivered, nextAuthor, gifMessages, searchedActiveMessage,
            messagesLoadedByShowMore, isNextMessageSystemMessage, isLastMessageSystemMessage, isMessagesLoading, selectedThreadId, isOnline
        } = this.props;
        const msgId = message.get("id") || message.get("messageId");

        if (isOnline !== nextProps.isOnline) {
            return true
        }

        if(selectedThreadId !== nextProps.selectedThreadId) {
            return false
        }

        // return false

        // if (isMessagesLoading) {
        //     return false
        // }

        if (textToReply !== nextProps.textToReply) {
            return true;
        }

        if (isNextMessageSystemMessage !== nextProps.isNextMessageSystemMessage) {
            return true;
        }

        if (isLastMessageSystemMessage !== nextProps.isLastMessageSystemMessage) {
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

        if (lastDelivered != nextProps.lastDelivered) {
            return true
        }



        // return false
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

    get isStartMessage(): boolean {
        const {message} = this.props;
        return [
            MESSAGE_TYPES.room_call_start,
        ].includes(message.get('type'));
    }

    render() {
        const {
            downloadFile, uploadFile, updateMessageProperty, deleteMessage, createMessage, textToReply, nameToReplay, messagesLoadStatus, lastSeen, isOnline,
            message, toggleMap, lastAuthor, lastMessageDeleted, togglePopUp, creator, onRightClick, languages, attemptOptimiseVideo, lastDelivered, gifMessages,
            attemptSetStickersIcons, stickers, contacts, userId, last, inviteToCall, selectedContact, handleAudioChange, attemptSetCreateContactNumber,
            resetConversationLastMessage, sharedMediaPanel, nextAuthor, showSharedMedia, setShowSharedMedia, replyingMessage, messagesLoadedByShowMore, searchedActiveMessage,
            handleNetworkJoin, attemptCreateContact, attemptSetSelectedThread, UPDATE_MEDIA_RECORD, ADD_MEDIA_RECORD, forwardMessage, handleMessageReply,
            handleMessageDelete, isNextMessageSystemMessage, isLastMessageSystemMessage, handleShowInFolder, selectedConversation,
            conversationLastMessageId, changeConversationLastMessageId, caches
        } = this.props;
        const {isGroup} = getThreadType(selectedContact.getIn(['threads', 'threadType']));
        const localization: any = components().messageElement;
        if (!creator && !message.get("creator")) {
            return null;
        }

        const thread = getThread(selectedContact, userId);

        const bubbleDivIsInfo: boolean = [MESSAGE_TYPES.leave_group, MESSAGE_TYPES.join_group, MESSAGE_TYPES.remove_from_group, MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name, MESSAGE_TYPES.delete_room, MESSAGE_TYPES.create_room].includes(message.get("type")) || message.get("deleted");

        const networkRegex = new RegExp(NETWORK_LINK_REGEX, "gi");
        const networkLink: boolean = networkRegex.test(message.get("text"));

        const userName: string = creator ? (creator.get("username") || creator.get("phone")) : message.get("creator").replace(/@[^@]+$/, '');
        const name: string = !creator ? "+" + message.get("creator").replace(/@[^@]+$/, '') : (creator.get("firstName") || creator.get("lastName")) ? `${creator.get("firstName")} ${creator.get("lastName")}`.trim() : creator.get("email") || `+${creator.get("username")}` || `+${creator.get("phone")}`;
        const textSpanClassNames: string = classNames({
            hidden: !isGroup || message.get("own") || this.isSystemMessage || (userName === lastAuthor && !isLastMessageSystemMessage),
            group_guest_name: isGroup
        });

        const options = message.get("m_options") && (message.get("m_options").toJS ? message.get("m_options").toJS() : message.get("m_options"));
        const isYoutube = options && options.isYoutube;
        const hasBigImage = options && (options.title || options.description) && options.img && (options.width > 200 && options.width !== options.height) && !options.isYoutube;
        const selectedLanguage: string = languages && languages.get("selectedLanguage");
        const text = message.get("text") === OFFLINE_MESSAGE_BODY || message.get("text") === "null" ? "" : message.get("text");

        const bubbleDivClassNames: string = classNames({
            "leave-bubble": [MESSAGE_TYPES.leave_group, MESSAGE_TYPES.join_group, MESSAGE_TYPES.remove_from_group,
                MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name, MESSAGE_TYPES.room_call_start,
                MESSAGE_TYPES.room_call_join, MESSAGE_TYPES.room_call_leave, MESSAGE_TYPES.room_call_end, MESSAGE_TYPES.delete_room, MESSAGE_TYPES.create_room].includes(message.get("type")) || message.get("deleted"),
            "guest_bubble": !message.get("own") || [MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(message.get("type")) || message.get("deleted"),
            "link-bubble": !message.get("deleted") && message.get("type") === MESSAGE_TYPES.text && message.get("link"),
            "link_bubble_youtube": isYoutube && !message.get("deleted"),
            "link_bubble_mini": hasBigImage && !message.get("deleted"),
            "user_bubble": message.get("own") && ![MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(message.get("type")) && !message.get("deleted"),
            "sticker-guest-bubble": !message.get("own") && message.get("info") && message.get("type") === MESSAGE_TYPES.sticker && !message.get("deleted"),
            "img-bubble": [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && !text,
            "img-bubble-caption": [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && text,
            "sticker-bubble": message.get("info") && message.get("type") === MESSAGE_TYPES.sticker && !message.get("repid") && !message.get("deleted"),
            "sticker_img_bubble": message.get("type") === MESSAGE_TYPES.sticker && message.get("repid") && !message.get("deleted"),
            "file-bubble-guest": message.get("type") === MESSAGE_TYPES.file && !message.get("own") && !message.get("deleted"),
            "file-bubble-user": message.get("type") === MESSAGE_TYPES.file && message.get("own") && !message.get("deleted"),
            "call-status-outgoing-bubble": message.get("type") === MESSAGE_TYPES.outgoing_call && !message.get("deleted"),
            "call-status-incoming-bubble": message.get("type") === MESSAGE_TYPES.incoming_call && !message.get("deleted"),
            "call-status-missed-bubble": message.get("type") === MESSAGE_TYPES.missed_call && !message.get("deleted"),
            "call-bubble-ru": [MESSAGE_TYPES.missed_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.outgoing_call].includes(message.get("type")) && !message.get("deleted") && selectedLanguage === "ru",
            "contact-bubble": [MESSAGE_TYPES.contact, MESSAGE_TYPES.contact_with_info].includes(message.get("type")) && !message.get("deleted"),
            "video-bubble": (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && !text,
            "video-bubble-caption": (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && text,
            "audio-bubble": message.get("type") === MESSAGE_TYPES.voice && !message.get("deleted"),
            "reply_bubble": message.get("repid") && !message.get("deleted"),
            "seen-bubble": message.get("own") && last,
            "typing_bubble": false,
            "seen_bubble": (lastSeen || lastDelivered) && !last,
            "bubble": true
        });

        const timeSpanClassNames: string = classNames({
            guest_bubble_time: !message.get("own") || [MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(message.get("type")) || message.get("deleted"),
            user_bubble_time: message.get("own") && ![MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name].includes(message.get("type")) && !message.get("deleted"),
            bubble_edited_icon: message.get("edited")
        });

        const mainDivClassNames: string = classNames({
            "leave-message": [MESSAGE_TYPES.leave_group, MESSAGE_TYPES.join_group, MESSAGE_TYPES.remove_from_group,
                MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name, MESSAGE_TYPES.room_call_start,
                MESSAGE_TYPES.room_call_join, MESSAGE_TYPES.room_call_leave, MESSAGE_TYPES.room_call_end, MESSAGE_TYPES.delete_room, MESSAGE_TYPES.create_room].includes(message.get("type")) || message.get("deleted"),
            "call-status": [MESSAGE_TYPES.outgoing_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.missed_call].includes(message.get("type")) && !message.get("deleted"),
            "guest_notfirst_msg": !message.get("own") && !this.isSystemMessage && userName === nextAuthor && !isNextMessageSystemMessage,
            "user_notfirst_msg": message.get("own") && !isNextMessageSystemMessage && userName === nextAuthor || nextAuthor === "",
            "guest_msg_box": !message.get("own"),
            "user_msg_box": message.get("own"),
            "message_container": true,
        });

        const threadImage: any = {
            url: isGroup && creator ? creator.get("avatarUrl") : thread && thread.get("avatarUrl"),
            file: isGroup && creator ? creator.get("avatar") : thread && thread.get("avatar"),
        };

        let time: any = new Date(message.get("time"));
        time = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2);

        let callMessageText: string = "";
        switch (message.get("type")) {
            case MESSAGE_TYPES.missed_call:
                callMessageText = localization.missedCall;
                break;
            case MESSAGE_TYPES.incoming_call:
                callMessageText = localization.incomingCall;
                break;
            case MESSAGE_TYPES.outgoing_call:
                callMessageText = localization.outgoingCall;
                break;
        }
        const messageId = message.get("messageId") || message.get("id");


        const isDeliveryWaiting: boolean = message.get("own") && !message.get("status") && !message.get("delivered") && !message.get("seen");
        const isSent = message.get("own") && message.get("status") && !message.get("delivered") && !message.get("seen");
        const isDelivered = message.get("own") && message.get("delivered") && !message.get("seen");
        const isSeen = message.get("own") && message.get("seen");
        const imageBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && !text;
        const isImageCaptionBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && !!text;
        const videoBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && !text;
        const isVideoCaptionBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && !!text;

        const isCaption: boolean = isImageCaptionBubble || isVideoCaptionBubble;

        const isMediaBubble = videoBubble || imageBubble;
        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");
        const guestFileBubble = message.get("type") === MESSAGE_TYPES.file && !message.get("own") && !message.get("deleted");
        const userFileBubble = message.get("type") === MESSAGE_TYPES.file && message.get("own") && !message.get("deleted");
        const fileBubble = guestFileBubble || userFileBubble;
        const isLinkBubble = !message.get("deleted") && message.get("type") === MESSAGE_TYPES.text && message.get("link");
        const isCallOutgoingBubble = message.get("type") === MESSAGE_TYPES.outgoing_call && !message.get("deleted");
        const isCallIncomingBubble = message.get("type") === MESSAGE_TYPES.incoming_call && !message.get("deleted");
        const callMissedBubble = message.get("type") === MESSAGE_TYPES.missed_call && !message.get("deleted");
        const callBubble = isCallOutgoingBubble || isCallIncomingBubble || callMissedBubble;
        const audioBubble = message.get("type") === MESSAGE_TYPES.voice && !message.get("deleted");
        const stickerBubble = message.get("info") && message.get("type") === MESSAGE_TYPES.sticker && !message.get("repid") && !message.get("deleted");
        const replyBubble = message.get("repid") && !message.get("deleted");
        const stickerReplyBubble = replyBubble && stickerBubble;

        const leaveBubble = [MESSAGE_TYPES.leave_group, MESSAGE_TYPES.join_group, MESSAGE_TYPES.remove_from_group,
            MESSAGE_TYPES.update_group_avatar, MESSAGE_TYPES.update_group_name,
            MESSAGE_TYPES.room_call_join, MESSAGE_TYPES.room_call_leave, MESSAGE_TYPES.room_call_end, MESSAGE_TYPES.delete_room, MESSAGE_TYPES.create_room].includes(message.get("type")) || message.get("deleted");

        const isAvatarShown: boolean = !message.get("deleted") && !message.get("own") && !this.isSystemMessage
            && (userName !== nextAuthor && !lastMessageDeleted || isNextMessageSystemMessage);

        const contactId = creator.get( "contactId")

        const avatarBlobUrlForGroup = contacts.getIn([contactId, "members", contactId, "avatarBlobUrl"])

        return (

            <div
                id={messageId}
                className={mainDivClassNames}
                style={{
                    flexDirection: (!message.get("own") && languages.get("selectedLanguage")) === 'ar' ? 'row-reverse' : 'row'
                }}
            >
                {
                    isAvatarShown ?
                        <AvatarSize margin="0" width="36px" height="36px"
                                    onClick={isGroup ? this.handleContactClick : null} cursor={"pointer"}>
                            <Avatar
                                image={threadImage}
                                color={isGroup ? (creator ? creator.getIn(["color", "numberColor"]) : "") : thread.getIn(["color", "numberColor"])}
                                backgroundColor={"#F0F2FC"}
                                status={thread.get("status")}
                                avatarCharacter={isGroup ? (creator ? creator.get("avatarCharacter") : "") : thread.get("avatarCharacter")}
                                name={isGroup ? (creator ? (creator.get("avatarCharacter") ? thread.get("name") : "") : "") : thread.get("firstName")}
                                fontSize={"12px"}
                                border={"1px solid #F5F5F7"}
                                avatarBlobUrl={isGroup ? (creator ? avatarBlobUrlForGroup : "") : thread.get("avatarBlobUrl")}
                            />
                        </AvatarSize> :
                        !message.get("own") ?
                            <div className="contact_img"/> : null
                }


                <BubbleContainer
                    audioBubble={audioBubble}
                    videoBubble={videoBubble}
                    imageBubble={imageBubble}
                    fileBubble={fileBubble}
                    isLinkBubble={isLinkBubble}
                    isOwnMessage={isOwnMessage}
                    language={languages.get("selectedLanguage")}
                    isCaption={isCaption}
                    isMediaBubble={isMediaBubble}
                    className={bubbleDivClassNames}
                    onContextMenu={onRightClick}
                    data-messagetype={message.get("type")}
                    data-messageid={messageId}
                    data-isinfo={bubbleDivIsInfo}>
                    {<span className={textSpanClassNames} onClick={isGroup ? this.handleContactClick : null}>
                        {name}
                    </span>}
                    {
                        languages.get("selectedLanguage") === 'ar' ?
                          <span className={`${message.get("own") ?  'user_circle user_circle-ar' : 'guest_circle guest_circle-ar'}`}/> :
                          <span className={`${message.get("own") ?  'user_circle' : 'guest_circle'}`}/>
                    }
                    {
                        replyingMessage && !message.get("deleted") &&
                        <ReplyBlock
                            isChatMessage={true}
                            replyMessageText={textToReply}
                            language={languages.get("selectedLanguage")}
                            stickers={stickers}
                            attemptSetSelectedThread={attemptSetSelectedThread}
                            selectedThread={this.props.selectedThread}
                            messageToReplayCreator={nameToReplay}
                            message={replyingMessage}
                        />
                    }
                    <MassageContentText
                      language={languages.get("selectedLanguage")}
                      isGroup={isGroup}
                    >
                        <MessageElement
                            ref={instance => {
                                this.child = instance;
                            }}
                            isStartMessage={this.isStartMessage}
                            textToReply={textToReply}
                            attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                            attemptOptimiseVideo={attemptOptimiseVideo}
                            selectedContact={thread}
                            languages={languages}
                            inviteToCall={inviteToCall}
                            time={time}
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
                            callMessageText={callMessageText}
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
                            caches={caches}

                            handleOpenFileInFolder={this.handleOpenFileInFolder}
                            attemptSetSelectedThread={attemptSetSelectedThread}
                            contacts={contacts}

                            forwardMessage={forwardMessage}
                            handleMessageReply={handleMessageReply}
                            handleMessageDelete={handleMessageDelete}
                            handleShowInFolder={handleShowInFolder}
                            isOnline={isOnline}
                        />

                        {
                            message.get("type") === MESSAGE_TYPES.text && message.get("link") &&
                             !message.get("deleted") && !message.get("localdeleted") &&
                              <div style={{width: "100%"}}>
                                <LinkPreview
                                    message={message}
                                    language={languages.get("selectedLanguage")}
                                    selectedConversation={selectedConversation}
                                    conversationLastMessageId={conversationLastMessageId}
                                    changeConversationLastMessageId={changeConversationLastMessageId}
                                    updateMessageProperty={updateMessageProperty}
                                    classForTimes={timeSpanClassNames}
                                    ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                                    UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}
                                    isOnline={isOnline}
                                    handleNetworkJoin={handleNetworkJoin}
                                    isDeliveryWaiting={isDeliveryWaiting}
                                />
                              </div>
                        }


                        {/*Todo move it to specific component level, this time check if message not a link, remove after*/}
                        {
                            this.isStartMessage && <StartConferenceTimeBubble>{time}</StartConferenceTimeBubble>
                        }
                        {
                            (!message.get("link") && !isMediaBubble && !isCaption && !leaveBubble && !fileBubble) && !this.isStartMessage &&
                            <TimeBubble
                                stickerReplyBubble={stickerReplyBubble}
                                isMediaBubble={isMediaBubble}
                                isOwnMessage={isOwnMessage}
                                isCall={[MESSAGE_TYPES.outgoing_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.missed_call].includes(message.get("type"))}
                                fileBubble={fileBubble}
                                callBubble={callBubble}
                                stickerBubble={stickerBubble}
                                replyBubble={replyBubble}
                                language={languages.get("selectedLanguage")}
                            >
                                {edited && !this.isStartMessage && <EditedMessage/>}
                                <Time>{time}</Time>
                                {!callBubble && !this.isStartMessage && <StatusMessage
                                    isSeen={isSeen}
                                    isDelivered={isDelivered}
                                    isSent={isSent}/>}
                                {callBubble || isDeliveryWaiting && !this.isStartMessage &&
                                <IsDeliveryWaiting fileBubble={fileBubble} stickerBubble={stickerBubble}
                                                   isMediaBubble={isMediaBubble}><span/></IsDeliveryWaiting>}
                            </TimeBubble>

                        }
                    </MassageContentText>
                    {/*{message.get("showProgressBar") && <Progress completed={message.get("percentage")} color={"#85ac64"} height={3}/>}*/}
                </BubbleContainer>
            </div>
        );
    }
};




