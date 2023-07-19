"use strict";

import {Map} from "immutable";
import * as React from "react";
import {Scrollbars} from 'react-custom-scrollbars';

import {IMAGE_TOGGLE, MESSAGE_TYPES, VIDEO_TOGGLE, GIF_TOGGLE} from "configs/constants";
import components from "configs/localization";
import IDBCache from "services/database/class/Cache";


interface ISharedImagesTabProps {
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE | typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean) => void;
    mediaMessages: Map<string, any>,
    fileEditing: boolean,
    toggleFiles?: (message: any) => void;
    checkedFiles?: Array<string>,
}

export default function SharedImages({togglePopUp, mediaMessages, fileEditing, toggleFiles, checkedFiles}: ISharedImagesTabProps): JSX.Element {
    const localization: any = components().sharedImages;

    return mediaMessages && mediaMessages.size > 0 ?
        (
            <Scrollbars className="shared_images" autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                <ul className="images_content">
                    {mediaMessages.valueSeq().map((message, item) => {
                        const msgId: any = message.get("messageId") ? message.get("messageId") : message.get("id");

                        let fileLink: string = "";
                        let blobLink: string = "";
                        if (message.get("type") === MESSAGE_TYPES.stream_file) {
                            blobLink = message.get("text").match(/href="(.*?)"/) && message.get("text").match(/href="(.*?)"/)[1];
                        }
                        if (message.get('info') && message.get('info') !== null) {
                            // fileLink = 'data:image/jpeg;base64,' + message.get('info');
                            fileLink = message.get('info');
                        }
                        const info: any = message.get("info");

                        const showVideoPopUp: any = () => togglePopUp(VIDEO_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), fileLink, message.get("creator"), true);
                        const showImagePopUp: any = () => togglePopUp(IMAGE_TOGGLE, message.get("messageId") ? message.get("messageId") : message.get("id"), fileLink, message.get("creator"), true);
                        const toggleImages: any = () => toggleFiles(message);

                        if (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) {
                            return (
                                <li key={item} className="list_image"
                                    onClick={fileEditing ? toggleImages : showVideoPopUp}>
                                    <img src={fileLink}

                                         data-url={blobLink || fileLink}
                                         data-msgid={message.get("messageId") ? message.get("messageId") : message.get("id")}
                                         data-fileremotepath={message.get("fileRemotePath")}
                                         data-file-type={message.get("type")}
                                         data-creator-id={message.get("creator")}
                                         data-thread-id={message.get("threadId")}
                                         data-rel={"sharedBlobURI"}
                                         data-load-status={message.get("loadStatus")}
                                    />
                                    <span className="video-icon"/>
                                    {fileEditing && <span
                                        className={checkedFiles.includes(msgId) ? "media-checked" : "media-not-checked"}/>}
                                </li>
                            )
                        } else if (message.get("type") === MESSAGE_TYPES.image || message.get("type") === MESSAGE_TYPES.gif) {
                            return (
                                <li key={item} className="list_image"
                                    onClick={fileEditing ? toggleImages : showImagePopUp}>
                                    <img src={fileLink}
                                         data-rel={"sharedBlobURI"}
                                         data-url={fileLink}
                                         data-msgid={message.get("messageId") ? message.get("messageId") : message.get("id")}
                                         data-fileremotepath={message.get("fileRemotePath")}
                                         data-file-type={message.get("type")}
                                         data-creator-id={message.get("creator")}
                                         data-thread-id={message.get("threadId")}
                                         data-load-status={message.get("loadStatus")}
                                         data-thumb={message.get("info")}
                                    />
                                    {fileEditing && <span
                                        className={checkedFiles.includes(msgId) ? "media-checked" : "media-not-checked"}/>}
                                </li>
                            )
                        } else {
                            return;
                        }
                    })}
                </ul>
            </Scrollbars>
        ) :
        (
            <div className="no_media">
                <span className="no_media_title">{localization.noMedia}</span>
                <p className="no_media_text">{localization.noMediaText}</p>
            </div>
        )
};
