"use strict";

import * as React from "react";
import {Map} from "immutable";

import {LOAD_STATUS, MESSAGE_TYPES} from "configs/constants";
import {ISticker} from "modules/settings/SettingsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import {IContact} from "modules/contacts/ContactsReducer";
// import GifMessage from "components/messages/ImageMessage/GifMessage";
import GifMessageBubble from "containers/chat-panel-refactor/chat-container/bubblesComponent/GifMessageBubble/index";
import {getMessageText} from "helpers/MessageHelper";
import LocationMessage from "./LocationMessage";
// import StickerMessage from "./StickerMessage/StickerMessage";
import StickerMessage from "containers/chat-panel-refactor/chat-container/BubblesComponent/StickerMessageBubble/index";
import VideoMessage from "./VideoMessage/VideoMessage";
// import VideoMessage from "containers/chat-panel-refactor/chat-container/bubblesComponent/VideoMessageBubble/Index";
//
// Refactored
// TEXT message bubble
import TextMessageBubble from "containers/chat-panel-refactor/chat-container/bubblesComponent/TextMessageBubble/Index";
// CALL message bubble
import CallMessageBubble from "containers/chat-panel-refactor/chat-container/bubblesComponent/CallMessageBubble/Index";
// AUDIO message bubble
import AudioMessageBubble
    from "containers/chat-panel-refactor/chat-container/bubblesComponent/AudioMessageBubble/Index";
// CONTACT message bubble
import ContactMessageBubble
    from "containers/chat-panel-refactor/chat-container/bubblesComponent/ContactMessageBubble/Index";
// IMAGE message bubble d
import ImageMessageBubble
    from "containers/chat-panel-refactor/chat-container/bubblesComponent/ImageMessageBubble/Index";
// FILE message bubble d
import FileMessageBubble from "containers/chat-panel-refactor/chat-container/bubblesComponent/FileMessageBubble/Index";
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
    attemptSetStickersIcons: (id: string, callback: Function, iconId: string) => void;
    createMessage: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    uploadFile: (messages: any, file: any) => void;
    resetConversationLastMessage: (threadId) => void;
    setShowSharedMedia: (showSharedMedia: boolean) => void;
    stickers: Map<string, ISticker>;
    selectedContact?: IContact;
    callMessageText?: string;
    textToReply: string;
    searchedActiveMessage: string;
    message: IMessage;
    userId: string;
    contacts: any;
    gifMessages: any;
    languages: any;
    language?: string;
    time: string;
    sharedMediaPanel: boolean;
    messagesLoadStatus: any;
    showSharedMedia: boolean;
    handleNetworkJoin: (keyword: string, token: boolean) => void;
    messagesLoadedByShowMore: boolean,
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,

    attemptSetSelectedThread: (threadId: any) => void;
    handleOpenFileInFolder: (event: React.MouseEvent<HTMLElement>) => void;

    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handleShowInFolder: (message?: any) => void;
    caches: any;
    isStartMessage?: boolean;
    isOnline?: boolean;
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
        const {message, stickers, contacts, userId, time, selectedContact, languages, sharedMediaPanel, messagesLoadStatus, gifMessages, searchedActiveMessage, messagesLoadedByShowMore, isOnline} = this.props;
        const msgId = message.get("id") || message.get("messageId");

        if (!message.equals(nextProps.message)) {
            return true;
        }

        if ((nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) &&
            (nextProps.searchedActiveMessage === msgId || searchedActiveMessage === msgId)) {
            return true;
        }

        if (!stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (!contacts.equals(nextProps.contacts)) {
            return true;
        }

        if (!gifMessages.equals(nextProps.gifMessages)) {
            return true;
        }

        if (userId !== nextProps.userId) {
            return true;
        }

        if (time !== nextProps.time) {
            return true;
        }

        if (!languages.equals(nextProps.languages)) {
            return true;
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (message && message.get('loadStatus') === LOAD_STATUS.LOAD_START && nextProps.messagesLoadStatus && !nextProps.messagesLoadStatus.equals(messagesLoadStatus)) {
            return true;
        }

        if (messagesLoadedByShowMore !== nextProps.messagesLoadedByShowMore) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true
        }

        return !!(selectedContact && nextProps.selectedContact && !selectedContact.equals(nextProps.selectedContact));

    }

    openFileInFolder = () => {
        this.child && this.child.handleShowInFolder();
    };

    stopProcess = (uploadStarted: boolean) => {
        const {message} = this.props;
        const msgId = message.get("id") || message.get("messageId");
        const loadStatus: number = message.get("loadStatus");
        if (uploadStarted) {
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_" + msgId));
            document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_PROCESS", {detail: {messageId: msgId}}));
        } else {
            document.dispatchEvent(new CustomEvent("CANCEL_DOWNLOAD_" + msgId));
        }
    };

    handleMenuPopUpOpen = () => {
        this.setState({isMenuPopUpOpen: true})
    };

    handleMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false})
    };

    // get message(): JSX.Element {
    //     const {
    //         downloadFile, uploadFile, updateMessageProperty, deleteMessage, message, stickers, togglePopUp, toggleMap, contacts, attemptOptimiseVideo, messagesLoadStatus,
    //         userId, time, selectedContact, inviteToCall, handleAudioChange, attemptSetCreateContactNumber, createMessage, resetConversationLastMessage,
    //         handleNetworkJoin, sharedMediaPanel, attemptCreateContact,
    //         gifMessages, attemptSetStickersIcons, searchedActiveMessage, messagesLoadedByShowMore, attemptSetSelectedThread, handleOpenFileInFolder,
    //         forwardMessage, handleMessageReply, handleMessageDelete, handleShowInFolder, languages
    //     } = this.props;
    //
    //     const {isMenuPopUpOpen} = this.state;
    //
    //     if (message.get("deleted")) {
    //         return (
    //             <TextMessageBubble
    //                 text={getMessageText(message, contacts, userId)}
    //                 searchedActiveMessage={searchedActiveMessage}
    //                 handleNetworkJoin={handleNetworkJoin}
    //                 message={message}
    //                 language={languages.get('selectedLanguage')}
    //             />
    //         );
    //     } else {
    //         switch (message.get("type")) {
    //             case MESSAGE_TYPES.image:
    //                 return (
    //                     <ImageMessageBubble
    //                         searchedActiveMessage={searchedActiveMessage}
    //                         messagesLoadStatus={messagesLoadStatus}
    //                         sharedMediaPanel={sharedMediaPanel}
    //                         resetConversationLastMessage={resetConversationLastMessage}
    //                         stopProcess={this.stopProcess}
    //                         deleteMessage={deleteMessage}
    //                         updateMessageProperty={updateMessageProperty}
    //                         downloadFile={downloadFile}
    //                         uploadFile={uploadFile}
    //                         createMessage={createMessage}
    //                         message={message}
    //                         handleMediaPopUpOpen={togglePopUp}
    //                         handleNetworkJoin={handleNetworkJoin}
    //                         messagesLoadedByShowMore={messagesLoadedByShowMore}
    //                         language={languages.get('selectedLanguage')}
    //                         forwardMessage={forwardMessage}
    //                         handleMessageReply={handleMessageReply}
    //                         handleMessageDelete={handleMessageDelete}
    //                         handleShowInFolder={handleShowInFolder}
    //                     />
    //                 );
    //
    //             case MESSAGE_TYPES.gif:
    //                 return <GifMessage
    //                     message={message}
    //                     gifMessages={gifMessages}
    //                     updateMessageProperty={updateMessageProperty}
    //                     messagesLoadedByShowMore={messagesLoadedByShowMore}
    //                     handleMediaPopUpOpen={togglePopUp}
    //                     sharedMediaPanel={sharedMediaPanel}
    //
    //                     forwardMessage={forwardMessage}
    //                     handleMessageReply={handleMessageReply}
    //                     handelMenuPopUpOpen={this.handleMenuPopUpOpen}
    //                     handelMenuPopUpClose={this.handleMenuPopUpClose}
    //                     handleMessageDelete={handleMessageDelete}
    //                 />;
    //
    //             case MESSAGE_TYPES.video:
    //             case MESSAGE_TYPES.stream_file:
    //                 return <VideoMessage
    //                     searchedActiveMessage={searchedActiveMessage}
    //                     linkTags={message.get("linkTags") && message.get("linkTags").size > 0 ? message.get("linkTags").toJS() : message.get("linkTags")}
    //                     messagesLoadStatus={messagesLoadStatus}
    //                     attemptOptimiseVideo={attemptOptimiseVideo}
    //                     sharedMediaPanel={sharedMediaPanel}
    //                     resetConversationLastMessage={resetConversationLastMessage}
    //                     stopProcess={this.stopProcess}
    //                     deleteMessage={deleteMessage}
    //                     updateMessageProperty={updateMessageProperty}
    //                     downloadFile={downloadFile}
    //                     uploadFile={uploadFile}
    //                     createMessage={createMessage}
    //                     message={message}
    //                     handleMediaPopUpOpen={togglePopUp}
    //                     file={message.get("file")}
    //                     handleNetworkJoin={handleNetworkJoin}
    //                     messagesLoadedByShowMore={messagesLoadedByShowMore}
    //                     language={languages.get('selectedLanguage')}
    //                     handleShowInFolder={handleShowInFolder}
    //                     forwardMessage={forwardMessage}
    //                     handleMessageReply={handleMessageReply}
    //                     handelMenuPopUpOpen={this.handleMenuPopUpOpen}
    //                     handelMenuPopUpClose={this.handleMenuPopUpClose}
    //                     handleMessageDelete={handleMessageDelete}
    //                 />;
    //
    //             case MESSAGE_TYPES.location:
    //                 const [lat, lng] = message.get("info").split("*");
    //                 return <LocationMessage message={message} lat={parseFloat(lat)} lng={parseFloat(lng)}
    //                                         toggleMap={toggleMap}/>;
    //
    //             case MESSAGE_TYPES.sticker:
    //                 return <StickerMessage
    //                     attemptSetStickersIcons={attemptSetStickersIcons}
    //                     message={message}
    //                     stickerClass="sticker-block"
    //                     sticker={message.get("info")}
    //                     stickers={stickers}
    //                     updateMessageProperty={updateMessageProperty}
    //                     messagesLoadedByShowMore={messagesLoadedByShowMore}
    //                 />;
    //
    //             case MESSAGE_TYPES.file:
    //                 return (
    //                     <FileMessageBubble
    //                         ref={instance => {
    //                             this.child = instance;
    //                         }}
    //                         messagesLoadStatus={messagesLoadStatus}
    //                         sharedMediaPanel={sharedMediaPanel}
    //                         resetConversationLastMessage={resetConversationLastMessage}
    //                         stopProcess={this.stopProcess}
    //                         deleteMessage={deleteMessage}
    //                         searchedActiveMessage={searchedActiveMessage}
    //                         updateMessageProperty={updateMessageProperty}
    //                         downloadFile={downloadFile}
    //                         uploadFile={uploadFile}
    //                         createMessage={createMessage}
    //                         message={message}
    //                         messagesLoadedByShowMore={messagesLoadedByShowMore}
    //                         handleAudioChange={handleAudioChange}
    //                         handleShowInFolder={handleShowInFolder}
    //                         forwardMessage={forwardMessage}
    //                         handleMessageReply={handleMessageReply}
    //                         handleMenuPopUpOpen={this.handleMenuPopUpOpen}
    //                         handleMenuPopUpClose={this.handleMenuPopUpClose}
    //                         handleMessageDelete={handleMessageDelete}
    //                         language={languages.get('selectedLanguage')}
    //                     />
    //                 );
    //             case MESSAGE_TYPES.voice:
    //                 return (
    //                     <AudioMessageBubble
    //                         messagesLoadStatus={messagesLoadStatus}
    //                         sharedMediaPanel={sharedMediaPanel}
    //                         resetConversationLastMessage={resetConversationLastMessage}
    //                         stopProcess={this.stopProcess}
    //                         deleteMessage={deleteMessage}
    //                         updateMessageProperty={updateMessageProperty}
    //                         downloadFile={downloadFile}
    //                         uploadFile={uploadFile}
    //                         createMessage={createMessage}
    //                         message={message}
    //                         handleAudioChange={handleAudioChange}
    //                         language={languages.get('selectedLanguage')}
    //                     />
    //                 );
    //
    //             case MESSAGE_TYPES.contact:
    //             case MESSAGE_TYPES.contact_with_info:
    //                 return (
    //                     <ContactMessageBubble
    //                         attemptSetCreateContactNumber={attemptSetCreateContactNumber}
    //                         updateMessageProperty={updateMessageProperty}
    //                         searchedActiveMessage={searchedActiveMessage}
    //                         attemptCreateContact={attemptCreateContact}
    //                         message={message}
    //                         attemptSetSelectedThread={attemptSetSelectedThread}
    //                         userId={userId}
    //                         contacts={contacts}
    //                         language={languages.get('selectedLanguage')}
    //                     />
    //                 );
    //
    //             case MESSAGE_TYPES.outgoing_call:
    //             case MESSAGE_TYPES.incoming_call:
    //             case MESSAGE_TYPES.missed_call:
    //                 return (
    //                     <CallMessageBubble
    //                         language={languages.get('selectedLanguage')}
    //                         selectedContact={selectedContact}
    //                         inviteToCall={inviteToCall}
    //                         message={message}
    //                     />
    //                 );
    //
    //             case MESSAGE_TYPES.update_group_avatar:
    //             case MESSAGE_TYPES.update_group_name:
    //             case MESSAGE_TYPES.remove_from_group:
    //             case MESSAGE_TYPES.leave_group:
    //             case MESSAGE_TYPES.join_group:
    //             case MESSAGE_TYPES.room_call_start:
    //             case MESSAGE_TYPES.room_call_join:
    //             case MESSAGE_TYPES.room_call_leave:
    //             case MESSAGE_TYPES.room_call_end:
    //             case MESSAGE_TYPES.delete_room:
    //             case MESSAGE_TYPES.create_room:
    //                 return (
    //                     <TextMessageBubble
    //                         text={getMessageText(message, contacts, userId)}
    //                         searchedActiveMessage={searchedActiveMessage}
    //                         handleNetworkJoin={handleNetworkJoin}
    //                         message={message}
    //                         language={languages.get('selectedLanguage')}
    //                     />
    //                 );
    //
    //             case MESSAGE_TYPES.text:
    //             case MESSAGE_TYPES.chat:
    //             case MESSAGE_TYPES.group:
    //             case MESSAGE_TYPES.notification:
    //                 return (
    //                     <TextMessageBubble
    //                         searchedActiveMessage={searchedActiveMessage}
    //                         text={message.get("text")}
    //                         handleNetworkJoin={handleNetworkJoin}
    //                         message={message}
    //                         language={languages.get('selectedLanguage')}
    //                     />
    //                 );
    //
    //             default:
    //                 return null;
    //         }
    //     }
    // }

    render() {
        const {
            downloadFile, uploadFile, updateMessageProperty, deleteMessage, message, stickers, togglePopUp, toggleMap, contacts, attemptOptimiseVideo, messagesLoadStatus,
            userId, time, selectedContact, inviteToCall, handleAudioChange, attemptSetCreateContactNumber, createMessage, resetConversationLastMessage,
            handleNetworkJoin, sharedMediaPanel, attemptCreateContact,
            gifMessages, attemptSetStickersIcons, searchedActiveMessage, messagesLoadedByShowMore, attemptSetSelectedThread, handleOpenFileInFolder,
            forwardMessage, handleMessageReply, handleMessageDelete, handleShowInFolder, languages, caches, isStartMessage, isOnline
        } = this.props;

        const {isMenuPopUpOpen} = this.state;


        if (message.get("deleted")) {
            return (
              <TextMessageBubble
                text={getMessageText(message, contacts, userId)}
                isStartMessage={isStartMessage}
                searchedActiveMessage={searchedActiveMessage}
                handleNetworkJoin={handleNetworkJoin}
                message={message}
                language={languages.get('selectedLanguage')}
              />
            );
        } else {
            switch (message.get("type")) {
                case MESSAGE_TYPES.image:
                    return (
                      <ImageMessageBubble
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
                        messagesLoadedByShowMore={messagesLoadedByShowMore}
                        language={languages.get('selectedLanguage')}
                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handleMessageDelete={handleMessageDelete}
                        handleShowInFolder={handleShowInFolder}
                      />
                    );

                case MESSAGE_TYPES.gif:
                    return <GifMessageBubble
                      message={message}
                      gifMessages={gifMessages}
                      updateMessageProperty={updateMessageProperty}
                      messagesLoadedByShowMore={messagesLoadedByShowMore}
                      handleMediaPopUpOpen={togglePopUp}
                      sharedMediaPanel={sharedMediaPanel}
                      downloadFile={downloadFile}
                      uploadFile={uploadFile}

                      forwardMessage={forwardMessage}
                      handleMessageReply={handleMessageReply}
                      handelMenuPopUpOpen={this.handleMenuPopUpOpen}
                      handelMenuPopUpClose={this.handleMenuPopUpClose}
                      handleMessageDelete={handleMessageDelete}
                    />;

                case MESSAGE_TYPES.video:
                case MESSAGE_TYPES.stream_file:
                    return <VideoMessage
                      searchedActiveMessage={searchedActiveMessage}
                      caches={caches}
                      linkTags={message.get("linkTags") && message.get("linkTags").size > 0 ? message.get("linkTags").toJS() : message.get("linkTags")}
                      messagesLoadStatus={messagesLoadStatus}
                      attemptOptimiseVideo={attemptOptimiseVideo}
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
                      file={message.get("file")}
                      handleNetworkJoin={handleNetworkJoin}
                      messagesLoadedByShowMore={messagesLoadedByShowMore}
                      language={languages.get('selectedLanguage')}
                      handleShowInFolder={handleShowInFolder}
                      forwardMessage={forwardMessage}
                      handleMessageReply={handleMessageReply}
                      handelMenuPopUpOpen={this.handleMenuPopUpOpen}
                      handelMenuPopUpClose={this.handleMenuPopUpClose}
                      handleMessageDelete={handleMessageDelete}
                    />;

                case MESSAGE_TYPES.location:
                    const [lat, lng] = message.get("info").split("*");
                    return <LocationMessage
                        updateMessageProperty={updateMessageProperty}
                        message={message}
                        lat={parseFloat(lat)}
                        lng={parseFloat(lng)}
                        toggleMap={toggleMap}
                    />;

                case MESSAGE_TYPES.sticker:
                    return <StickerMessage
                      attemptSetStickersIcons={attemptSetStickersIcons}
                      message={message}
                      stickerClass="sticker-block"
                      sticker={message.get("info")}
                      stickers={stickers}
                      updateMessageProperty={updateMessageProperty}
                      messagesLoadedByShowMore={messagesLoadedByShowMore}
                    />;

                case MESSAGE_TYPES.file:
                    return (
                      <FileMessageBubble
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
                        handleAudioChange={handleAudioChange}
                        handleShowInFolder={handleShowInFolder}
                        forwardMessage={forwardMessage}
                        handleMessageReply={handleMessageReply}
                        handleMenuPopUpOpen={this.handleMenuPopUpOpen}
                        handleMenuPopUpClose={this.handleMenuPopUpClose}
                        handleMessageDelete={handleMessageDelete}
                        language={languages.get('selectedLanguage')}
                        isOnline={isOnline}
                      />
                    );
                case MESSAGE_TYPES.voice:
                    return (
                      <AudioMessageBubble
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
                        language={languages.get('selectedLanguage')}
                      />
                    );

                case MESSAGE_TYPES.contact:
                case MESSAGE_TYPES.contact_with_info:
                    return (
                      <ContactMessageBubble
                        attemptSetCreateContactNumber={attemptSetCreateContactNumber}
                        updateMessageProperty={updateMessageProperty}
                        searchedActiveMessage={searchedActiveMessage}
                        attemptCreateContact={attemptCreateContact}
                        message={message}
                        attemptSetSelectedThread={attemptSetSelectedThread}
                        userId={userId}
                        contacts={contacts}
                        language={languages.get('selectedLanguage')}
                      />
                    );

                case MESSAGE_TYPES.outgoing_call:
                case MESSAGE_TYPES.incoming_call:
                case MESSAGE_TYPES.missed_call:
                    return (
                      <CallMessageBubble
                        language={languages.get('selectedLanguage')}
                        selectedContact={selectedContact}
                        inviteToCall={inviteToCall}
                        message={message}
                      />
                    );

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
                      <TextMessageBubble
                        text={getMessageText(message, contacts, userId)}
                        isStartMessage={isStartMessage}
                        searchedActiveMessage={searchedActiveMessage}
                        handleNetworkJoin={handleNetworkJoin}
                        message={message}
                        language={languages.get('selectedLanguage')}
                      />
                    );

                case MESSAGE_TYPES.text:
                case MESSAGE_TYPES.chat:
                case MESSAGE_TYPES.group:
                case MESSAGE_TYPES.notification:
                    return (
                      <TextMessageBubble
                        searchedActiveMessage={searchedActiveMessage}
                        isStartMessage={isStartMessage}
                        text={message.get("text")}
                        handleNetworkJoin={handleNetworkJoin}
                        message={message}
                        language={languages.get('selectedLanguage')}
                      />
                    );

                default:
                    return null;
            }
        }
    }
};
