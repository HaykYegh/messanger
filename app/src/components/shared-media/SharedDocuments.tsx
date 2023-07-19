"use strict";
import * as React from "react";
import {Map} from "immutable";

import {getFileColor, handleFileSize, urlToBase64} from "helpers/FileHelper";
import {getFormattedDate} from "helpers/DateHelper";
import components from "configs/localization";
import {MESSAGE_TYPES} from "configs/constants";
import AudioMessage from "components/messages/audioMessage/AudioMessage";
import Index from "components/messages/FileMessage/Index";
import { Scrollbars } from 'react-custom-scrollbars';

interface ISharedDocumentsTabProps {
    fileMessages?: Map<string, any>;
    fileEditing?: boolean,
    toggleFiles?: (message: any) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    updateMessageProperty: (msgId, property, value) => void;
    checkedFiles?: Array<string>,
    downloadFile?: (downloadInfo: any) => void;
}

export default function SharedDocuments({fileMessages, fileEditing, toggleFiles, checkedFiles, handleAudioChange, downloadFile, updateMessageProperty}: ISharedDocumentsTabProps): JSX.Element {
    const localization: any = components().sharedDocuments;

    return fileMessages && fileMessages.size > 0 ?
        (
            <Scrollbars className="shared_documents" autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                <div className="documents_content">
                    {fileMessages.valueSeq().map(message => {
                        const info: any = message.get("info") && JSON.parse(message.get("info"));
                        const validJson: boolean = typeof info === "object" && info !== null;
                        const toggleFile: any = () => toggleFiles(message);
                        const msgId = message.get("messageId") || message.get("id");
                        const time: any = getFormattedDate({date: message.get("createdAt"), left: true});
                        const downloadMessageFile: any = (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            urlToBase64(message.get("fileLink")).then(data => {
                                const link: HTMLAnchorElement = document.createElement("a");
                                link.href = data;
                                link.download = `${info.fileName}.${info.fileType}`;
                                link.click();
                            });
                        };
                        const stopProcess = (uploadStarted:boolean) => {
                            const msgId = message.get("id") || message.get("messageId");
                            if(uploadStarted){
                                document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_" + msgId));
                                document.dispatchEvent(new CustomEvent("CANCEL_UPLOAD_PROCESS", {detail: {messageId: msgId}}));
                            }else{
                                document.dispatchEvent(new CustomEvent("CANCEL_DOWNLOAD_" + msgId));
                            }
                        };
                        const fileClass: string = validJson && getFileColor(info.fileType);
                        const iconText: string = validJson && (message.get("type") === MESSAGE_TYPES.file && info.fileType.length > 3 ? "file" : info.fileType);
                        const size: string = validJson && info.fileType + " " + handleFileSize(info.fileSize);

                        if (message.get("type") === MESSAGE_TYPES.file) {
                            return (
                                <div key={message.get("messageId")} className={fileEditing ? "pointer shared-file" : "shared-file"} onClick={fileEditing ? toggleFile : downloadFile}>
                                    <Index
                                        stopProcess={stopProcess}
                                        updateMessageProperty={updateMessageProperty}
                                        downloadFile={downloadFile}
                                        message={message}
                                        percentage={message.get("percentage")}
                                        showProgress={message.get("showProgressBar")}
                                        fromSharedMedia={true}
                                        msgId={msgId}
                                        data={message.get("info")}
                                        link={message.get("fileLink")}
                                        file={message.get("file")}/>
                                    {!fileEditing ?
                                        <span className="time">{time}</span>
                                        :
                                        <span className={checkedFiles.includes(msgId) ? "media-checked" : "media-not-checked"}/>
                                    }
                                </div>
                            )
                        } else if (message.get("type") === MESSAGE_TYPES.voice) {
                            return (
                                <div key={message.get("messageId")} className={fileEditing ? "pointer voice" : "voice"} onClick={toggleFile}>
                                    <div className={fileEditing ? "disable voice-content" : "voice-content"}>
                                        <AudioMessage 
                                            message={message} 
                                            file={message.get("file")} 
                                            handleAudioChange={handleAudioChange} 
                                            downloadFile={downloadFile} 
                                            stopProcess={stopProcess} 
                                            updateMessageProperty={updateMessageProperty}
                                            fromSharedMedia={true}
                                            />
                                        {!fileEditing ?
                                            <span className="time">{time}</span>
                                            :
                                            <span className={checkedFiles.includes(msgId) ? "media-checked" : "media-not-checked"}/>
                                        }
                                    </div>
                                </div>
                            )
                        }


                    })}
                </div>
            </Scrollbars>
        ) :
        (
            <div className="no_documents">
                <span className="no_documents_title">{localization.noDocuments}</span>
                <p className="no_documents_text">{localization.noDocumentsText}</p>
            </div>
        )
};
