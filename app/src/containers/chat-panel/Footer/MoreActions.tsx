"use strict";

import * as React from "react";
import VideoCallSvg from "../../../../assets/components/svg/VideoCallSvg";

const contactPlusSvg = require("assets/images/chat-plus.svg");

interface IMoreActionsProps {
    toggleMoreActions: () => void;
    showMoreActions: boolean;
    toggleSendContactPopup: () => void;
    localization: any;
    changeFiles: (event: any, filesFromClipBoard?: FileList) => void;
    mediaToggle: (e?: any, mediaName?: string) => void;
    locationToggle: () => void;
    moreActionsContainerRef: (ref: HTMLDivElement) => void;
    language: string;
}

export default function MoreActions(props: IMoreActionsProps): JSX.Element {

    const [inputTitle, setTodos] = React.useState("");

    React.useEffect(() => {
        const inputElem = document.getElementById("file_upload_input") as HTMLInputElement;
        inputElem.files.length === 0 ? setTodos(localization.noFiles) : setTodos(inputElem.files[0].name);
    },[])


    const {
        toggleMoreActions, showMoreActions, toggleSendContactPopup, localization,
        changeFiles, mediaToggle, locationToggle, moreActionsContainerRef, language
    } = props;

    return (
        <div className="footer_plus_icons">
            <img draggable={false} onClick={toggleMoreActions} src={contactPlusSvg} alt="more" className={`plus-icon${showMoreActions ? " circle-rotate" : ""}`}/>
            <div className={`${language === "ar" ? "footer-icons footer-icons-reverse" : "footer-icons"} ${showMoreActions ? " show" : ""}`} ref={moreActionsContainerRef}>
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
                        <VideoCallSvg className="svg-video" styles={{marginLeft: '14px'}} hoverColor="#8174FF"
                                      containerWidth="32" containerHeight="32"/>
                        {/*<span className="icon-font icon-video"/>*/}
                        <button className="list-button video-btn">{localization.takeVideo}</button>
                    </li>
                    <li className="icons-item">
                        <span className="icon-font icon-file"/>
                        <button className="list-button file-btn">{localization.file}</button>
                        <input
                            title={inputTitle}
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
