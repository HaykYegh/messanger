"use strict";

import * as React from "react";

interface IMoreActionsProps {
    toggleMoreActions: () => void;
    showMoreActions: boolean;
    toggleSendContactPopup: () => void;
    localization: any;
    changeFiles: (event: any, filesFromClipBoard?: FileList) => void;
    mediaToggle: (e?: any, mediaName?: string) => void;
    locationToggle: () => void;
    moreActionsContainerRef: (ref: HTMLDivElement) => void
}

export default function MoreActions(props: IMoreActionsProps): JSX.Element {
    const {
        toggleMoreActions, showMoreActions, toggleSendContactPopup, localization,
        changeFiles, mediaToggle, locationToggle, moreActionsContainerRef
    } = props;


    return (
        <div className="footer_plus_icons">
            <span onClick={toggleMoreActions} className={`plus-icon${showMoreActions ? " circle-rotate" : ""}`}/>
            <div className={`footer-icons${showMoreActions ? " show" : ""}`} ref={moreActionsContainerRef}>
                <ul className="icons-list">
                    <li className="icons-item" onClick={toggleSendContactPopup} title={localization.sendContacts}>
                        <span className="icon-font icon-send-contact"/>
                        <button
                            className="list-button send-contact-btn">{localization.sendContacts}</button>
                    </li>
                    <li
                        title={localization.sendLoc} onClick={locationToggle}
                        className="icons-item">
                        <span className="icon-font icon-location"/>
                        <button className="list-button location-btn">{localization.location}</button>
                    </li>

                    <li className="icons-item" onClick={mediaToggle} data-media="takePhoto" title={localization.sendPhoto}>
                        <span className="icon-font icon-photo"/>
                        <button className="list-button photo-btn">{localization.takePhoto}</button>
                    </li>
                    <li className="icons-item" onClick={mediaToggle} data-media="takeVideo" title={localization.sendVideo}>
                        <span className="icon-font icon-video"/>
                        <button className="list-button video-btn">{localization.takeVideo}</button>
                    </li>
                    <li className="icons-item">
                        <span className="icon-font icon-file"/>
                        <button className="list-button file-btn">{localization.file}</button>
                        <input
                            id="file_upload_input"
                            type="file"
                            className="pic"
                            multiple={true}
                            onChange={changeFiles}
                            onClick={(event) => {
                                event.currentTarget.value = ""
                            }}
                        />
                    </li>
                </ul>
            </div>
        </div>
    )
}
