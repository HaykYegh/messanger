"use strict";

import {Map} from "immutable";
import * as React from "react";
import clone from "lodash/clone";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {downloadFile,} from "modules/messages/MessagesActions";
import {IMAGE_TOGGLE, LOAD_STATUS, MESSAGE_TYPES, SHARED_MEDIA_TABS, VIDEO_TOGGLE} from "configs/constants";
import ForwardThreads from "components/chat/ForwardThreads";
import IDBCache from "services/database/class/Cache";
import PopUpMain from "components/common/PopUpMain";
import SharedDocuments from "./SharedDocuments";
import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";
import SharedImages from "./SharedImages";
import SharedLinks from "./SharedLinks";

import "scss/pages/right-panel/SharedMedia";
import Log from "modules/messages/Log";

interface ISharedMediaProps {
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    attemptSendForwardMessage: (messages: any, threadIds: string[]) => void;
    messageLocalDelete: (id: string, threadId: string) => void;
    deleteSharedMediaMessages?: (messageId: string) => void;
    updateMessageProperty: (msgId, property, value) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    setSearchKeyword: (keyword: string) => void;
    downloadFile: (downloadFile: any) => void;
    setForwardMessage: (message: any) => void;
    handleSharedMediaClose: () => void;
    removeSharedMediaMessages?: () => void;
    clearForwardMessage: () => void;
    sharedMediaMessages: any;
    selectedThread: any;
    forwardMessage: any;
    conversations?: any
}

interface ISharedMediaState {
    fileEditing: boolean;
    checkedFiles: string[];
    selectedTab: string;
    tabs: string[];
    deleteFilesPopUp: boolean;
    sharedFiles: Map<string, any>;
    showForwardThreads: boolean;
}

export default class SharedMedia extends React.Component<ISharedMediaProps, ISharedMediaState> {

    constructor(props) {
        super(props);
        this.state = {
            selectedTab: SHARED_MEDIA_TABS.media,
            tabs: [
                SHARED_MEDIA_TABS.media,
                SHARED_MEDIA_TABS.documents,
                SHARED_MEDIA_TABS.links,
            ],
            fileEditing: false,
            checkedFiles: [],
            deleteFilesPopUp: false,
            sharedFiles: Map({}),
            showForwardThreads: false
        }
    }



    shouldComponentUpdate(nextProps: ISharedMediaProps, nextState: ISharedMediaState): boolean {
        if (!this.props.selectedThread.equals(nextProps.selectedThread)) {
            return true;
        }

        if (!this.props.sharedMediaMessages.equals(nextProps.sharedMediaMessages)) {
            return true;
        }

        if (!this.props.forwardMessage.equals(nextProps.forwardMessage)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }



    componentWillUnmount(): void {
        const {removeSharedMediaMessages} = this.props;
        removeSharedMediaMessages();
    }

    handleTabChange = (e: React.MouseEvent<HTMLDivElement>): void => {
        const tab: string = e.currentTarget.getAttribute('data-tab');
        if (tab !== this.state.selectedTab) {
            this.setState({selectedTab: tab});
        }
    };

    toggleEditing = (): void => {
        const {fileEditing} = this.state;
        if (fileEditing) {
            this.setState({checkedFiles: []});
        }
        this.setState({fileEditing: !fileEditing});
    };

    handleFilesChecked = (message: Map<string, any>): void => {
        const {fileEditing} = this.state;

        if (!fileEditing) {
            return
        }
        const messageId: string = message.get("messageId") || message.get("id");
        const checkedFiles = clone(this.state.checkedFiles);
        const index: number = checkedFiles.indexOf(messageId);

        if (index === -1) {
            checkedFiles.push(messageId);
        } else {
            checkedFiles.splice(index, 1);
        }
        this.setState({checkedFiles: checkedFiles});
    };

    handleFilesLocalDelete = (): void => {
        const {messageLocalDelete, sharedMediaMessages, deleteSharedMediaMessages} = this.props;
        const {checkedFiles} = this.state;
        if (checkedFiles && checkedFiles.length > 0) {

            checkedFiles.map(msgId => {
                const sharedMessage = sharedMediaMessages.get(msgId);
                const threadId = sharedMessage && sharedMessage.get("threadId");
                const messageId = sharedMessage && (sharedMessage.get("messageId") || sharedMessage.get("id"));
                if (messageId && threadId) {
                    messageLocalDelete(messageId, threadId);
                    deleteSharedMediaMessages(messageId);
                }
            });
            this.setState({fileEditing: false, checkedFiles: []});
        }
        this.toggleFilesPopUp();
    };

    toggleFilesPopUp = (): void => {
        const {deleteFilesPopUp} = this.state;
        this.setState({deleteFilesPopUp: !deleteFilesPopUp});
    };

    handleSelectedFilesDownload = async () => {
        const {checkedFiles} = this.state;
        const {sharedMediaMessages} = this.props;
        if (checkedFiles && checkedFiles.length > 0) {
            checkedFiles.map(msgId => {
                const file = sharedMediaMessages.get(msgId);

                let fileType: string;
                switch (file.get("type")) {
                    case MESSAGE_TYPES.file:
                        fileType = JSON.parse(file.get("info")).fileType;
                        break;
                    case MESSAGE_TYPES.image:
                        fileType = "jpg";
                        break;
                    case MESSAGE_TYPES.stream_file:
                    case MESSAGE_TYPES.video:
                        fileType = "mp4";
                        break;
                    case MESSAGE_TYPES.voice:
                        fileType = "mp3";
                        break;
                    default:
                        fileType = "";
                        break;
                }
                if (fileType) {
                    const msgId = file.get("messageId") || file.get("id");
                    if (["jpg"].includes(fileType)) {
                        const name = msgId + "." + fileType;
                        this.handleFileDownload(name, file.get("fileRemotePath"));
                    } else {
                        let fileName;
                        try {
                            fileName = JSON.parse(file.get("info")).fileName + "." + fileType;
                        } catch (e) {
                            Log.i('is not valid json string', e);
                        } finally {
                            fileName = !fileName || fileName.includes('undefined') ? msgId + "." + fileType : fileName;
                        }
                        this.handleFileDownload(fileName, file.get("fileRemotePath"));
                    }
                }
            });
            this.setState({fileEditing: false, checkedFiles: []});
        }
    };

    handleFileDownload = async (name: string, fileRemotePath: string) => {
        const a: HTMLAnchorElement = document.createElement("a");
        const blob = await IDBCache.get(fileRemotePath);
        const blobUri = getBlobUri(blob);
        a.download = name;
        a.href = blobUri;
        a.click();
    };

    forwardMessageSend = async (selectedThreadIds: any) => {
        const {setSearchKeyword, attemptSendForwardMessage, forwardMessage, handleSharedMediaClose} = this.props;

        attemptSendForwardMessage(forwardMessage, selectedThreadIds);
        this.handleForwardPopUpClose();
        const input_field = (document.getElementById("searchInput") as HTMLInputElement);
        if (input_field) {
            input_field.value = "";
        }
        handleSharedMediaClose();
        setSearchKeyword('');
        this.toggleEditing();
    };

    handleForwardPopUpClose = () => {
        const {clearForwardMessage} = this.props;
        this.setState({showForwardThreads: false});
        clearForwardMessage();
    };

    handleForwardPopUpOpen = () => {
        const {checkedFiles} = this.state;
        const {setForwardMessage, sharedMediaMessages} = this.props;

        let messagesToShare: any = sharedMediaMessages.filter(message => {
            return checkedFiles.findIndex(x => x === message.get("messageId")) > -1;
        });

        checkedFiles.map(async checkedFile => {
            const message = sharedMediaMessages.get(checkedFile);
            const path = (message.get("fileRemotePath") && (message.get("type") === MESSAGE_TYPES.image || message.get("type") === MESSAGE_TYPES.audio || message.get("type") === MESSAGE_TYPES.file || message.get("type") === MESSAGE_TYPES.video)) ? await IDBCache.checkFileInFolder(message) : true;
            if (!path) {
                const downloadInfo = {
                    fileRemotePath: message.get("fileRemotePath"),
                    threadId: message.get("threadId"),
                    method: "GET",
                    msgId: message.get("messageId") || message.get("msgId") || message.get("id")
                };
                downloadFile(downloadInfo);
            }
        });

        if (messagesToShare && !messagesToShare.isEmpty()) {
            this.setState({showForwardThreads: true});
            setForwardMessage(messagesToShare);
        }
    };

    get content(): any {
        const {togglePopUp, sharedMediaMessages, handleAudioChange, downloadFile, updateMessageProperty} = this.props;
        const {fileEditing, checkedFiles, selectedTab} = this.state;
        switch (selectedTab) {
            case SHARED_MEDIA_TABS.media:
                const media: any = sharedMediaMessages.filter(sharedFile => {
                    const loadStatus: number = sharedFile.get('loadStatus');
                    const sendSuccess: boolean = loadStatus ? loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS || loadStatus === LOAD_STATUS.UPLOAD_SUCCESS : true;
                    return [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.gif].includes(sharedFile.get('type')) && sendSuccess;
                });
                return (
                    <SharedImages
                        mediaMessages={media}
                        togglePopUp={togglePopUp}
                        fileEditing={fileEditing}
                        toggleFiles={this.handleFilesChecked}
                        checkedFiles={checkedFiles}
                    />
                );
            case SHARED_MEDIA_TABS.documents:
                const files: any = sharedMediaMessages.filter(sharedFile => {
                    const loadStatus: number = sharedFile.get('loadStatus');
                    const sendSuccess: boolean = loadStatus ? loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS || loadStatus === LOAD_STATUS.UPLOAD_SUCCESS : true;
                    return [MESSAGE_TYPES.file, MESSAGE_TYPES.voice].includes(sharedFile.get('type')) && sendSuccess;
                });
                return (
                    <SharedDocuments
                        fileMessages={files}
                        fileEditing={fileEditing}
                        toggleFiles={this.handleFilesChecked}
                        handleAudioChange={handleAudioChange}
                        checkedFiles={checkedFiles}
                        downloadFile={downloadFile}
                        updateMessageProperty={updateMessageProperty}
                    />
                );
            case SHARED_MEDIA_TABS.links:
                const links: any = sharedMediaMessages.filter(sharedFile => {
                    return [MESSAGE_TYPES.text].includes(sharedFile.get('type')) && sharedFile.get('link');
                });
                return (
                    <SharedLinks
                        links={links}
                        fileEditing={fileEditing}
                        checkedFiles={checkedFiles}
                        handleFilesChecked={this.handleFilesChecked}
                    />
                )
        }
    }

    render() {
        const {handleSharedMediaClose, sharedMediaMessages, forwardMessage} = this.props;
        const {fileEditing, checkedFiles, selectedTab, deleteFilesPopUp, showForwardThreads, tabs} = this.state;
        const toggleEdit: boolean = checkedFiles && checkedFiles.length > 0;
        const localization: any = components().sharedMedia;
        const deleteSharedFilesLocalization = components().deleteSharedFiles;
        const channelCreator =  true;
        const showForwardMessagePopUp: boolean = forwardMessage && !forwardMessage.isEmpty();
        const disableEdit: boolean = sharedMediaMessages.isEmpty();

        return (
            <div className="shared_media">
                {!fileEditing ?
                    <div className="shared_media_btn">
                        <span className="left_btn" onClick={handleSharedMediaClose}/>
                        {!disableEdit &&
                        <span className="right_btn" onClick={this.toggleEditing}>{localization.edit}</span>
                        }
                    </div>
                    :
                    <div className="shared_media_btn">
                        <span className="left_btn_close" onClick={this.toggleEditing}/>
                        <div className="right_buttons">
                                <span
                                    className={`shared-msg shared-msg-forward${toggleEdit ? " shared-msg-active" : ""}`}
                                    onClick={this.handleForwardPopUpOpen}
                                />
                            {
                                channelCreator &&
                                <span
                                    className={`shared-msg shared-msg-delete${toggleEdit ? " shared-msg-active" : ""}`}
                                    onClick={this.toggleFilesPopUp}
                                />
                            }
                            {
                                selectedTab !== SHARED_MEDIA_TABS.links &&
                                <span
                                    className={`shared-msg shared-msg-download${toggleEdit ? " shared-msg-active" : ""}`}
                                    onClick={this.handleSelectedFilesDownload}
                                />
                            }
                        </div>
                    </div>
                }

                <div className="shared_media_menu">
                    {
                        tabs.map(tab => {
                            return (
                                <div
                                    key={tab}
                                    onClick={this.handleTabChange}
                                    className={`menu-item ${selectedTab === tab ? 'shared_media_menu_active' : ''}`}
                                    data-tab={tab}
                                ><span className="menu-title">{localization[tab]}</span>
                                </div>
                            )
                        })
                    }
                </div>

                <div className="shared_media_content">{this.content}</div>
                <ReactCSSTransitionGroup
                    transitionName={{enter: 'open', leave: 'close'}}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={230}
                >{
                    showForwardThreads && showForwardMessagePopUp ? <ForwardThreads
                            handleForwardPopUpClose={this.handleForwardPopUpClose}
                            forwardMessageSend={this.forwardMessageSend}/>
                        :
                        deleteFilesPopUp &&
                        <PopUpMain
                            confirmButton={this.handleFilesLocalDelete}
                            confirmButtonText={deleteSharedFilesLocalization.confirm}
                            cancelButton={this.toggleFilesPopUp}
                            cancelButtonText={deleteSharedFilesLocalization.cancel}
                            titleText={deleteSharedFilesLocalization.title}
                            infoText={deleteSharedFilesLocalization.text}
                            showPopUpLogo={true}
                        />
                }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}

