"use strict";

import * as React from "react";
import isEqual from 'lodash/isEqual';
import {Map} from "immutable";

import {LOAD_STATUS, MESSAGE_TYPES, NETWORK_LINK_REGEX} from "configs/constants";
import {ISticker} from "modules/settings/SettingsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import {getMessageText} from "helpers/MessageHelper";
import GifMessage from "containers/chat-panel-refactor/chat-container/bubblesComponent/GifMessageBubble/index";
import ContactMessage from "./ContactMessageBubble/Index";
import ImageMessage from "./ImageMessageBubble/Index";
import AudioMessage from "./AudioMessageBubble/Index";
import VideoMessage from "./VideoMessageBubble/Index";
import CallMessage from "./CallMessageBubble/Index";
import FileMessage from "./FileMessageBubble/Index";
import LinkPreview from "./LinkMessageBubble/Index";
import LocationMessage from "./LocationMessageBubble/Index";
import StickerMessage from "./StickerMessageBubble/Index";
import TextMessage from "./TextMessageBubble/Index";
import Log from "modules/messages/Log";

interface IMessageElementProps {
    toggleMap: (lat: number, lng: number, location: string) => void;
    togglePopUp: (type: string, id?: string, url?: string, creatorId?: string) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact) => void;
    attemptOptimiseVideo: (message: any, file: File | Blob) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    handleAudioChange?: (audio: HTMLAudioElement) => void;
    updateMessageProperty: (msgId, property, value, updateToDb?: boolean) => void;
    deleteMessage: (msgId) => void;
    attemptSetStickersIcons: (id: string) => void;
    createMessage: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    uploadFile?: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId) => void;
    setShowSharedMedia: (showSharedMedia: boolean) => void;
    stickers: Map<string, ISticker>;
    selectedContact?: IContact;
    language?: string;
    textToReply: string;
    searchedActiveMessage: string;
    message: IMessage;
    userId: string;
    contacts: any;
    gifMessages: any;
    languages: any;
    sharedMediaPanel: boolean;
    messagesLoadStatus: any;
    showSharedMedia: boolean;
    handleNetworkJoin: (keyword: string, token: boolean) => void;
    messagesLoadedByShowMore: boolean,
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,

    attemptSetSelectedThread: (threadId: any) => void;
    ADD_MEDIA_RECORD?: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD?: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void,
    isOnline?: boolean;
    isSystemMessage?: any;
    handleOpenFileInFolder: (event: React.MouseEvent<HTMLElement>) => void;

    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
}

interface IMessageElementState {
    isMenuPopUpOpen: boolean
}

export default class MessageElement extends React.Component<IMessageElementProps, IMessageElementState> {

    child: any;

    constructor(props) {
        super(props);

        this.state = {
            isMenuPopUpOpen: false
        };
    }

    shouldComponentUpdate(nextProps: IMessageElementProps) {
        const {
            message, stickers, contacts, userId, selectedContact, languages, sharedMediaPanel,
            messagesLoadStatus, gifMessages, searchedActiveMessage, messagesLoadedByShowMore, isOnline
        } = this.props;

        const msgId = message.get("id") || message.get("messageId");

        if (!isEqual(message, nextProps.message)) {
            return true;
        }

        if ((nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) &&
            (nextProps.searchedActiveMessage === msgId || searchedActiveMessage === msgId)) {
            return true;
        }

        if (!isEqual(stickers, nextProps.stickers)) {
            return true;
        }

        if (!isEqual(contacts, nextProps.contacts)) {
            return true;
        }

        if (!isEqual(gifMessages, nextProps.gifMessages)) {
            return true;
        }

        if (userId !== nextProps.userId) {
            return true;
        }

        if (!isEqual(languages, nextProps.languages)) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (message && message.get('loadStatus') === LOAD_STATUS.LOAD_START &&
            nextProps.messagesLoadStatus && !isEqual(messagesLoadStatus, nextProps.messagesLoadStatus)
        ) {
            return true;
        }

        if (messagesLoadedByShowMore !== nextProps.messagesLoadedByShowMore) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true
        }

        return !!(selectedContact && nextProps.selectedContact && !isEqual(selectedContact, nextProps.selectedContact));

    }

    openFileInFolder = () => {
        this.child && this.child.handleShowInFolder();
    };

    stopProcess = (uploadStarted: boolean) => {
        const {message} = this.props;
        const msgId = message.get("id") || message.get("messageId");
        if (uploadStarted) {
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_" + msgId));
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_PROCESS", {detail: {messageId: msgId}}));
        } else {
            document.dispatchEvent(new CustomEvent("CANCEL_DOWNLOAD_" + msgId));
        }
    };

    handelMenuPopUpOpen = () => {
        this.setState({isMenuPopUpOpen: true})
    };

    handelMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false})
    };

    get message(): JSX.Element {
        const {
            downloadFile, uploadFile, updateMessageProperty, deleteMessage, message, stickers, togglePopUp, toggleMap,
            contacts, messagesLoadStatus, userId, handleAudioChange, attemptSetCreateContactNumber, createMessage,
            resetConversationLastMessage, handleNetworkJoin, sharedMediaPanel, attemptCreateContact,
            gifMessages, attemptSetStickersIcons, searchedActiveMessage, messagesLoadedByShowMore,
            attemptSetSelectedThread, isSystemMessage, isOnline
        } = this.props;



        if (message.get("deleted")) {
            return (
                <TextMessage
                    text={getMessageText(message, contacts, userId)}
                    searchedActiveMessage={searchedActiveMessage}
                    handleNetworkJoin={handleNetworkJoin}
                    message={message}
                />
            );
        }

        switch (message.get("type")) {
            case MESSAGE_TYPES.image: {
                const {forwardMessage, handleMessageReply, handleMessageDelete, handleOpenFileInFolder} = this.props;
                return (
                    <ImageMessage
                        searchedActiveMessage={searchedActiveMessage}
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        resetConversationLastMessage={resetConversationLastMessage}
                        stopProcess={this.stopProcess}
                        deleteMessage={deleteMessage}
                        updateMessageProperty={updateMessageProperty}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        createMessage={createMessage}
                        message={message}
                        handleMediaPopUpOpen={togglePopUp}
                        handleNetworkJoin={handleNetworkJoin}
                        handleShowInFolder={handleOpenFileInFolder}
                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handleMessageDelete={handleMessageDelete}
                    />
                );
            }


            case MESSAGE_TYPES.gif: {
                const {forwardMessage, handleMessageReply, handleMessageDelete, handleOpenFileInFolder} = this.props;
                return (
                    <GifMessage
                        message={message}
                        gifMessages={gifMessages}
                        updateMessageProperty={updateMessageProperty}
                        handleMediaPopUpOpen={togglePopUp}
                        sharedMediaPanel={sharedMediaPanel}

                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handelMenuPopUpOpen={this.handelMenuPopUpOpen}
                        handelMenuPopUpClose={this.handelMenuPopUpClose}
                        handleMessageDelete={handleMessageDelete}
                        handleOpenFileInFolder={handleOpenFileInFolder}
                    />
                );
            }

            case MESSAGE_TYPES.video:
            case MESSAGE_TYPES.stream_file: {
                const {forwardMessage, handleMessageReply, handleMessageDelete, handleOpenFileInFolder} = this.props;

                return (
                    <VideoMessage
                        searchedActiveMessage={searchedActiveMessage}
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        resetConversationLastMessage={resetConversationLastMessage}
                        stopProcess={this.stopProcess}
                        deleteMessage={deleteMessage}
                        updateMessageProperty={updateMessageProperty}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        createMessage={createMessage}
                        message={message}
                        handleMediaPopUpOpen={togglePopUp}
                        handleNetworkJoin={handleNetworkJoin}

                        handleOpenFileInFolder={handleOpenFileInFolder}
                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handelMenuPopUpOpen={this.handelMenuPopUpOpen}
                        handelMenuPopUpClose={this.handelMenuPopUpClose}
                        handleMessageDelete={handleMessageDelete}
                    />
                );
            }

            case MESSAGE_TYPES.location:
                const [lat, lng] = message.get("info").split("*");
                return (
                    <LocationMessage
                        message={message}
                        lat={parseFloat(lat)}
                        lng={parseFloat(lng)}
                        toggleMap={toggleMap}
                    />
                );

            case MESSAGE_TYPES.sticker:
                return (
                    <StickerMessage
                        attemptSetStickersIcons={attemptSetStickersIcons}
                        message={message}
                        stickerClass="sticker-block"
                        sticker={message.get("info")}
                        stickers={stickers}
                        updateMessageProperty={updateMessageProperty}
                        messagesLoadedByShowMore={messagesLoadedByShowMore}
                    />
                );

            case MESSAGE_TYPES.file: {
                const {forwardMessage, handleMessageReply, handleMessageDelete, handleOpenFileInFolder, isOnline} = this.props;

                return (
                    <FileMessage
                        ref={instance => {
                            this.child = instance;
                        }}
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        resetConversationLastMessage={resetConversationLastMessage}
                        stopProcess={this.stopProcess}
                        deleteMessage={deleteMessage}
                        searchedActiveMessage={searchedActiveMessage}
                        updateMessageProperty={updateMessageProperty}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        createMessage={createMessage}
                        message={message}
                        messagesLoadedByShowMore={messagesLoadedByShowMore}

                        handleOpenFileInFolder={handleOpenFileInFolder}
                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}

                        handelMenuPopUpOpen={this.handelMenuPopUpOpen}
                        handelMenuPopUpClose={this.handelMenuPopUpClose}
                        handleMessageDelete={handleMessageDelete}
                        isOnline={isOnline}
                    />
                );
            }

            case MESSAGE_TYPES.voice:
                return (
                    <AudioMessage
                        messagesLoadStatus={messagesLoadStatus}
                        sharedMediaPanel={sharedMediaPanel}
                        resetConversationLastMessage={resetConversationLastMessage}
                        stopProcess={this.stopProcess}
                        deleteMessage={deleteMessage}
                        updateMessageProperty={updateMessageProperty}
                        downloadFile={downloadFile}
                        uploadFile={uploadFile}
                        createMessage={createMessage}
                        message={message}
                        handleAudioChange={handleAudioChange}
                    />
                );

            case MESSAGE_TYPES.contact:
            case MESSAGE_TYPES.contact_with_info:
                return (
                    <ContactMessage
                        attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                        updateMessageProperty={updateMessageProperty}
                        searchedActiveMessage={searchedActiveMessage}
                        attemptCreateContact={attemptCreateContact}
                        message={message}
                        attemptSetSelectedThread={attemptSetSelectedThread}
                        userId={userId}
                        contacts={contacts}
                    />
                );

            case MESSAGE_TYPES.outgoing_call:
            case MESSAGE_TYPES.incoming_call:
            case MESSAGE_TYPES.missed_call: {
                const {inviteToCall, selectedContact} = this.props;
                return (
                    <CallMessage
                        language={this.props.languages.get('selectedLanguage')}
                        selectedContact={selectedContact}
                        inviteToCall={inviteToCall}
                        message={message}
                    />
                );
            }

            case MESSAGE_TYPES.update_group_avatar:
            case MESSAGE_TYPES.update_group_name:
            case MESSAGE_TYPES.remove_from_group:
            case MESSAGE_TYPES.leave_group:
            case MESSAGE_TYPES.join_group:
            case MESSAGE_TYPES.room_call_start:
            case MESSAGE_TYPES.room_call_join:
            case MESSAGE_TYPES.room_call_leave:
            case MESSAGE_TYPES.room_call_end:
            case MESSAGE_TYPES.delete_room:
            case MESSAGE_TYPES.create_room:
                return (
                    <TextMessage
                        text={getMessageText(message, contacts, userId)}
                        searchedActiveMessage={searchedActiveMessage}
                        handleNetworkJoin={handleNetworkJoin}
                        message={message}
                        isSystemMessage={isSystemMessage}
                    />
                );

            case MESSAGE_TYPES.text:
            case MESSAGE_TYPES.chat:
            case MESSAGE_TYPES.group:

                if (message.get("link")) {

                    const networkRegex = new RegExp(NETWORK_LINK_REGEX, "gi");
                    const networkLink: boolean = networkRegex.test(message.get("text"));

                    if (!networkLink && !message.get("deleted") && !message.get("localdeleted")) {
                        const {isOnline, ADD_MEDIA_RECORD, UPDATE_MEDIA_RECORD} = this.props;
                        return (
                            <LinkPreview
                                message={message}
                                updateMessageProperty={updateMessageProperty}
                                ADD_MEDIA_RECORD={ADD_MEDIA_RECORD}
                                UPDATE_MEDIA_RECORD={UPDATE_MEDIA_RECORD}
                                isOnline={isOnline}
                                handleNetworkJoin={handleNetworkJoin}
                            />
                        )
                    }

                    return null;

                }

                return (
                    <TextMessage
                        message={message}
                        searchedActiveMessage={searchedActiveMessage}
                        text={message.get("text")}
                        handleNetworkJoin={handleNetworkJoin}
                    />
                );

            default:
                return null;
        }
    }

    render() {
        Log.i("MESSAGE_TYPES -> isOnline -> ", this.props.isOnline)
        return this.message;
    }
};
