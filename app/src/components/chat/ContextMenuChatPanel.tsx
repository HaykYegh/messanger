"use strict";

import * as React from "react";

import {LOAD_STATUS, MESSAGE_TYPES, OFFLINE_MESSAGE_BODY} from "configs/constants";
import {IContact} from "modules/contacts/ContactsReducer";
import {getLocationName} from "requests/locationRequest";
import {IGroup} from "modules/groups/GroupsReducer";
import {unEscapeText} from "helpers/MessageHelper";
import {getThreadType} from "helpers/DataHelper";
import components from "configs/localization";

interface IContextMenuChatPanelProps {
    setContextMenuRef: (ref: HTMLDivElement) => void;
    handleDeleteEverywherePopupToggle: () => void;
    selectedThread: IContact | IGroup;
    handleMessageForward: () => void;
    handleMessageEdit: () => void;
    handleMessageReply: () => void;
    handleMessageDelete: () => void;
    handleFileDownload: () => void;
    handleShowInFolder: () => void;
    handleStickerPackageAdd: () => void;
    myStickers: any;
    contextMenuMessage: any;
}

export default function ContextMenuChatPanel({setContextMenuRef, handleDeleteEverywherePopupToggle, selectedThread, handleMessageForward, handleMessageEdit, handleMessageReply, handleMessageDelete, handleFileDownload, contextMenuMessage, handleShowInFolder, myStickers, handleStickerPackageAdd}: IContextMenuChatPanelProps): JSX.Element {
    if (!(contextMenuMessage && contextMenuMessage.get("deleted") !== 1) || (window as any).remote) {
        return <div className="contextMenu" ref={setContextMenuRef}/>;
    }

    const localization: any = components().chatPanel;
    const threadType = selectedThread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);
    const threadInfo = selectedThread.getIn(['threads', 'threadInfo']);
    const role = threadInfo && threadInfo.get("role");
    const deleted: boolean = contextMenuMessage && contextMenuMessage.get("deleted") == 1;
    const disabledGroup: boolean = isGroup && threadInfo.get("disabled");
    const link: boolean = contextMenuMessage && contextMenuMessage.get("link");
    const gif: boolean = contextMenuMessage && contextMenuMessage.get("type") === MESSAGE_TYPES.gif;
    const userSelection: string = contextMenuMessage && window.getSelection().toString();
    const loadStatus = contextMenuMessage && contextMenuMessage.get("loadStatus");
    const isUpload = loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_CANCEL;


    const stream_file_text = contextMenuMessage && ((contextMenuMessage.get("type") === MESSAGE_TYPES.stream_file && contextMenuMessage.get("text") && contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)) ? contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)[1] : contextMenuMessage.get("text"));
    const canCopyVideo = stream_file_text && stream_file_text !== "null";
    const canEdit = (contextMenuMessage && contextMenuMessage.get("text") && ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.thumb_image, MESSAGE_TYPES.thumb_video, MESSAGE_TYPES.text].includes(contextMenuMessage.get("type") || canCopyVideo)) && contextMenuMessage.get("text") !== "#E#F#M#");
    const canCopy = userSelection || canEdit || contextMenuMessage && contextMenuMessage.get("type") === MESSAGE_TYPES.location;

    const doCopy = () => {
        if ((window as any).getSelection().toString()) {
            document.execCommand('copy');
        } else {
            let text: string = contextMenuMessage.get("text");
            if (contextMenuMessage.get("type") === MESSAGE_TYPES.stream_file) {
                text = (contextMenuMessage.get("text") === OFFLINE_MESSAGE_BODY || contextMenuMessage.get("text") === "null") ? "" : ((contextMenuMessage.get("text") && contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)) ? contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)[1] : contextMenuMessage.get("text"));
            }
            let input: any = document.createElement("textarea");
            input.style = "position: absolute; left: -1000px; top: -1000px";
            input.value = unEscapeText(text);
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
        }
    };

    const doCopyAsync = async () => {
        const [lat, lng] = contextMenuMessage.get("info").split("*");
        if ((window as any).getSelection().toString()) {
            document.execCommand('copy');

        } else {
            let input: any = document.createElement("textarea");
            input.style = "position: absolute; left: -1000px; top: -1000px";
            const address: string = await getLocationName(parseFloat(lat), parseFloat(lng));
            input.value = unEscapeText(address);
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
        }

    };

    if (contextMenuMessage && !deleted) {
        if ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.thumb_image, MESSAGE_TYPES.thumb_video, MESSAGE_TYPES.file].includes(contextMenuMessage.get("type"))) {
            return (
                <div className={contextMenuMessage ? "contextMenu contextMenu--active" : "contextMenu"}
                     ref={setContextMenuRef}>
                    {!isUpload && canEdit && canCopyVideo && contextMenuMessage.get("own") &&
                    <div className="contextMenu--option" onClick={handleMessageEdit}>{localization.editMessage}</div>}
                    {canCopy && canCopyVideo && !isUpload && ![MESSAGE_TYPES.voice].includes(contextMenuMessage.get("type")) &&
                    <div className="contextMenu--option" onMouseDown={doCopy}>{localization.copy}</div>}
                    {contextMenuMessage.get("type") !== MESSAGE_TYPES.stream_file && !isUpload &&
                    <div className="contextMenu--option"
                         onClick={(window as any).fs ? handleShowInFolder : handleFileDownload}>{localization.downloadFile}</div>}
                    {!isUpload &&
                    <div className="contextMenu--option" onClick={handleMessageForward}>{localization.forward}</div>}
                    {!disabledGroup &&
                    <div className="contextMenu--option" onClick={handleMessageReply}>{localization.reply}</div>}
                    {<div className="contextMenu--option"
                          onClick={handleMessageDelete}>{localization.deleteMessage}</div>}
                    {!isUpload && (contextMenuMessage.get("own")) && <div className="contextMenu--option"
                                                                          onClick={handleDeleteEverywherePopupToggle}>{localization.deleteEverywhere}</div>}
                </div>
            )
        } else if ([MESSAGE_TYPES.text, MESSAGE_TYPES.chat].includes(contextMenuMessage.get("type"))) {
            return (
                <div
                    className={`contextMenu${contextMenuMessage ? " contextMenu--active" : ""}`}
                    ref={setContextMenuRef}
                >
                    {
                        canCopy && <div className="contextMenu--option" onMouseDown={doCopy}>{localization.copy}</div>
                    }

                    <div className="contextMenu--option" onClick={handleMessageForward}>{localization.forward}</div>

                    {
                        !disabledGroup && (contextMenuMessage.get("own")) &&
                        <div
                            className="contextMenu--option"
                            onClick={handleMessageEdit}
                        >{localization.editMessage}
                        </div>
                    }

                    {
                        !disabledGroup &&
                        <div className="contextMenu--option" onClick={handleMessageReply}>{localization.reply}</div>
                    }

                    <div
                        className="contextMenu--option"
                        onClick={handleMessageDelete}
                    >{localization.deleteMessage}
                    </div>

                    {
                        !disabledGroup && (contextMenuMessage.get("own")) &&
                        <div
                            className="contextMenu--option"
                            onClick={handleDeleteEverywherePopupToggle}
                        >{localization.deleteEverywhere}</div>
                    }
                </div>
            )
        } else if (contextMenuMessage.get("type") === MESSAGE_TYPES.sticker) {
            return (
                <div
                    className={`contextMenu${contextMenuMessage ? " contextMenu--active" : ""}`}
                    ref={setContextMenuRef}
                >
                    {
                        canCopy && <div className="contextMenu--option" onMouseDown={doCopy}>{localization.copy}</div>
                    }

                    {
                        myStickers.includes(contextMenuMessage.get("info").split("_").shift()) ?
                            <div
                                className="contextMenu--option"
                                onClick={handleMessageForward}
                            >{localization.forward}
                            </div> :
                            <div
                                className="contextMenu--option"
                                onClick={handleStickerPackageAdd}
                            >{localization.get}
                            </div>
                    }

                    {
                        !disabledGroup &&
                        <div className="contextMenu--option" onClick={handleMessageReply}>{localization.reply}</div>
                    }

                    <div
                        className="contextMenu--option"
                        onClick={handleMessageDelete}
                    >{localization.deleteMessage}
                    </div>

                    {
                        contextMenuMessage.get("own") &&
                        <div
                            className="contextMenu--option"
                            onClick={handleDeleteEverywherePopupToggle}
                        >{localization.deleteEverywhere}
                        </div>
                    }
                </div>
            )
        } else if ([MESSAGE_TYPES.outgoing_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.missed_call].includes(contextMenuMessage.get("type"))) {
            return (
                <div className={contextMenuMessage ? "contextMenu contextMenu--active" : "contextMenu"}
                     ref={setContextMenuRef}>
                    {
                        canCopy &&
                        <div className="contextMenu--option" onMouseDown={doCopy}>{localization.copy}</div>
                    }
                    <div
                        className="contextMenu--option"
                        onClick={handleMessageDelete}
                    >{localization.deleteMessage}
                    </div>
                </div>
            )

        } else {
            return (
                <div
                    className={`contextMenu${contextMenuMessage ? " contextMenu--active" : ""}`}
                    ref={setContextMenuRef}
                >
                    {
                        canCopy &&
                        <div className="contextMenu--option"
                             onMouseDown={MESSAGE_TYPES.location === contextMenuMessage.get("type") ? doCopyAsync : doCopy}
                        >{localization.copy}
                        </div>
                    }

                    {
                        !gif &&
                        <div className="contextMenu--option" onClick={handleMessageForward}>{localization.forward}</div>
                    }

                    {
                        !disabledGroup &&
                        <div className="contextMenu--option" onClick={handleMessageReply}>{localization.reply}</div>
                    }

                    <div
                        className="contextMenu--option"
                        onClick={handleMessageDelete}
                    >{localization.deleteMessage}
                    </div>

                    {
                        contextMenuMessage.get("own") &&
                        <div
                            className="contextMenu--option"
                            onClick={handleDeleteEverywherePopupToggle}
                        >{localization.deleteEverywhere}
                        </div>
                    }
                </div>
            )
        }
    } else {
        return <div className="contextMenu" ref={setContextMenuRef}/>;
    }
}
