"use strict";

import * as React from "react";
import {ScrollBar} from "containers/settings/style";
import {MESSAGE_TYPES, SHARED_MEDIA_TYPES} from "configs/constants";
import {getFormattedDate} from "helpers/DateHelper";
import {
    ButtonContent,
    MessageTime,
    NoMedia,
    SelectButton,
    SharedMediaElement,
    SharedMediaList
} from "containers/SharedMedia/style";
import {Loader, LoadingPage} from "../../pages/style";
import SharedFileMessage from "containers/SharedMedia/SharedFileMessage";
import SharedAudioMessage from "containers/SharedMedia/SharedAudioMessage";
import components from "configs/localization";
import {BoldText, DescriptionText} from "../../pages/AuthContainer/style";

export interface ISharedFilesState {
}

export interface ISharedFilesProps {
    fileMessages: any;
    file: any;
    isFilesEditing: boolean,
    handleFilesChecked: (message: any, type: string, isOwnMessage: boolean) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    updateMessageProperty: (msgId, property, value) => void;
    checkedFiles: {
        [key: string]: {
            type: string,
            index: number
        }
    };
    downloadFile: (downloadInfo: any) => void;
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void;
    selectedThreadId: string
    selectedTab: any;
}


export default class SharedFiles extends React.Component<ISharedFilesProps, ISharedFilesState> {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount(): void {
        const {fetchSharedMedia, selectedThreadId, fileMessages} = this.props;
        // fetchSharedMedia(selectedThreadId, SHARED_MEDIA_TYPES.FILE)
    }

    handleMediaMessagesScroll = (event: any) => {
        const {fileMessages} = this.props;
        if (event.target.scrollTop >= (event.target.scrollHeight - event.target.offsetHeight) && fileMessages.get("count") > fileMessages.get("records").size) {
            const {fetchSharedMedia, selectedThreadId} = this.props;
            fetchSharedMedia(selectedThreadId, SHARED_MEDIA_TYPES.FILE)
        }
    };

    handleMessageSelect = (msgId) => {
        const {handleFilesChecked, fileMessages} = this.props;
        const isOwnMessage: boolean = fileMessages.getIn(["records", msgId, "messages", "own"]);
        handleFilesChecked(msgId, SHARED_MEDIA_TYPES.FILE, isOwnMessage)
    };

    handleMediaElementClick = (event: React.MouseEvent<HTMLLIElement>) => {
        const {downloadFile} = this.props;
        const msgId: string = event.currentTarget.getAttribute("data-value");

        const {isFilesEditing} = this.props;
        if (isFilesEditing) {
            this.handleMessageSelect(msgId);
            event.stopPropagation();
            event.preventDefault();
        }
    };

    render() {
        const {fileMessages, isFilesEditing, downloadFile, updateMessageProperty, checkedFiles, handleAudioChange, file} = this.props;
        const messages: any = file;
        const localization: any = components().sharedDocuments;
        const messagesCount: number = fileMessages.get("count");

        return (
            <>
                {
                    fileMessages.get("isLoading") && messages.size === 0 && messagesCount !== 0 &&
                    <LoadingPage
                        width="30px"
                        height="30px"
                        top="50%"
                        right="50%"
                        position="absolute"
                        backgroundColor="#FFFFFF"
                    >
                        <Loader
                            backgroundColor="#fff"
                            width="30px"
                            height="30px"
                            background="#FFFFFF"
                        />
                    </LoadingPage>
                }
                {
                    messages.size !== 0 && !fileMessages.get("isLoading") &&
                    <ScrollBar height="inherit" padding="0" onScroll={this.handleMediaMessagesScroll}>
                        <SharedMediaList padding="0 16px 0 12px">
                            {messages.valueSeq().sortBy(
                                (item) => item.getIn(['messages', 'time'])
                            ).reverse().map((messageData, item) => {
                                const message: any = messageData.get("messages");
                                const msgId: string = message.get("messageId") || message.get("id");
                                const time: any = getFormattedDate({date: message.get("createdAt"), left: true});
                                const content = checkedFiles[msgId] && checkedFiles[msgId].index.toString();

                                if (message.get("type") === MESSAGE_TYPES.file) {
                                    return (
                                        <SharedMediaElement
                                            key={item}
                                            onClick={this.handleMediaElementClick}
                                            data-value={msgId}
                                            elementType={SHARED_MEDIA_TYPES.FILE}
                                            isEditing={isFilesEditing}
                                        >
                                            <SharedFileMessage
                                                updateMessageProperty={updateMessageProperty}
                                                downloadFile={downloadFile}
                                                message={message}
                                                percentage={message.get("percentage")}
                                                showProgress={message.get("showProgressBar")}
                                                fromSharedMedia={true}
                                                msgId={msgId}
                                                data={message.get("info")}
                                                link={message.get("fileLink")}
                                                file={message.get("file")}
                                                isFilesEditing={isFilesEditing}
                                                handleAudioChange={handleAudioChange}
                                            />
                                            {
                                                isFilesEditing &&
                                                <SelectButton
                                                    top="unset"
                                                    right="0"
                                                    isSelected={checkedFiles.hasOwnProperty(msgId)}
                                                >
                                                    <ButtonContent>{content}</ButtonContent>
                                                </SelectButton>
                                            }
                                        </SharedMediaElement>
                                    )
                                } else if (message.get("type") === MESSAGE_TYPES.voice) {
                                    return (
                                        <SharedMediaElement
                                            key={item}
                                            onClick={this.handleMediaElementClick}
                                            data-value={msgId}
                                            elementType={SHARED_MEDIA_TYPES.FILE}
                                        >
                                            <SharedAudioMessage
                                                message={message}
                                                file={message.get("file")}
                                                handleAudioChange={handleAudioChange}
                                                downloadFile={downloadFile}
                                                updateMessageProperty={updateMessageProperty}
                                                fromSharedMedia={true}
                                            />
                                            {
                                                isFilesEditing &&
                                                <SelectButton
                                                    top="unset"
                                                    right="0"
                                                    isSelected={checkedFiles.hasOwnProperty(msgId)}
                                                >
                                                    <ButtonContent>{content}</ButtonContent>
                                                </SelectButton>
                                            }
                                        </SharedMediaElement>
                                    )
                                }
                            })}
                        </SharedMediaList>
                    </ScrollBar>
                }
                {
                    messages.size === 0 && !fileMessages.get("isLoading") &&
                    <NoMedia>
                        <BoldText>{localization.noDocuments}</BoldText>
                        <DescriptionText>{localization.noDocumentsText}</DescriptionText>
                    </NoMedia>
                }
            </>
        );
    }
}
