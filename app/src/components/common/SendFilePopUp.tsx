"use strict";

import "scss/utils/SendFilePopUp";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";

interface ISendFilePopUpProps {
    closeFileDialog: () => void;
    files: any;
    removeFile: (index: number) => void;
    sendFiles: () => void;
    selectedThread: any
}

export default function SendFilePopUp({closeFileDialog, files, removeFile, selectedThread, sendFiles}: ISendFilePopUpProps): JSX.Element {
    const avatarStyle: any = {
        background: selectedThread.getIn(["color", "avatarColor"])
    };
    return (
        <div className="send-file-popup">
            <div className="close-dialog" onClick={closeFileDialog}/>
            <div className="send-file-popup-content">
                <div className="files-info">
                    <h2 className="info-title">Send File</h2>
                    <div className="user-info">
                        {selectedThread.get("avatarUrl") ?
                            <div className="user-image" style={{backgroundImage: `url(${selectedThread.get("avatarUrl")})`}}/> :
                            selectedThread.get("saved") ?
                                <div className="characters-block" style={avatarStyle}>
                                    <span className="user-first-characters">{selectedThread.get("avatarCharacter")}</span>
                                </div> :
                                <div className="img-block">
                                    <span className="img"/>
                                </div>}
                        <h2 className="user-name">{selectedThread.get("name")}</h2>
                    </div>
                    <h2 className="files-text">Are you sure you want to send {files.length} {files && files.length > 1 ? "files" : "file"}</h2>
                </div>
                <div className="files-list">
                    {files && files.map((file: any, index: number) => {
                        const deleteFile: any = () => removeFile(index);
                        let image: boolean = file.type.includes('image');
                        return (
                            <div key={index} className="file-block">
                                {
                                    image ? <div className="image-preview" style={{backgroundImage: `url(${file.preview})`}}/>
                                        : <span className={classNames({
                                        "file-ico-pdf": file.type.includes('pdf'),
                                        "file-ico-txt": file.type.includes('txt'),
                                        "file-ico-doc": file.type.includes('doc'),
                                        "file-ico-rtf": file.type.includes('rtf'),
                                        "file-ico-csv": file.type.includes('csv'),
                                        "file-ico-ppt": file.type.includes('ppt'),
                                        "file-ico-xls": file.type.includes('xls'),
                                        "file-ico-zip": file.type.includes('zip'),
                                        "file-ico": true
                                    })}
                                    />
                                }
                                <span className="file-name">{file.name}</span>
                                <span className="remove-file" onClick={deleteFile}/>
                            </div>
                        )
                    })}
                </div>
                <div className="send-button">
                    <span className="send-files" onClick={sendFiles}>Send</span>
                </div>
            </div>
        </div>
    );
};
