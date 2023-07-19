"use strict";
import * as React from "react";
import {IMAGE_TOGGLE, SHARED_MEDIA_TABS, SHARED_MEDIA_TYPES, VIDEO_TOGGLE} from "configs/constants";
import {
    BackArrow,
    BackgroundSlider,
    EditButton,
    FooterButton,
    FooterButtonTitle,
    FooterTab,
    FooterTabList,
    NavBar,
    NavBarTabs,
    SharedMediaContainer,
    SharedMediaContent,
    SharedMediaFooter,
    SharedMediaHeader,
    SharedMediaTitle,
    Tab
} from "containers/SharedMedia/style";
import components from "configs/localization";
import Media from "containers/SharedMedia/Media";
import SharedFiles from "containers/SharedMedia/SharedFiles";
import SharedLinks from "containers/SharedMedia/SharedLinks";
import isEmpty from "lodash/isEmpty";
import PopUpMain from "components/common/PopUpMain";
import ForwardMessagePopup from "components/common/popups/ForwardMessage";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {
    DELETE_SHARED_MEDIA_MESSAGES,
    fetchSharedMedia,
    setSearchKeyword,
    setSharedMediaImages
} from "modules/application/ApplicationActions";
import {BLOCK_CONTACT, UNBLOCK_CONTACT} from "modules/contacts/ContactsActions";
import {
    attemptSendForwardMessage,
    clearForwardMessage,
    downloadFile,
    setForwardMessage,
    updateMessageProperty
} from "modules/messages/MessagesActions";
import {connect} from "react-redux";
import {userSelector} from "modules/user/UserSelector";
import {
    fileSelector,
    linkSelector,
    mediaSelector,
    selectedThreadIdSelector,
    selectedThreadSelector,
    sharedMediaSelector,
    imageUrlSelector,
} from "modules/application/ApplicationSelector";
import {forwardedMessageSelector} from "modules/messages/MessagesSelector";
import {conversationsSelector} from "modules/conversations/ConversationsSelector";
import isEqual from "lodash/isEqual";
import Log from "modules/messages/Log";

const back_arrow: any = require("assets/images/back_arrow.svg");
const shared_delete: any = require("assets/images/shared_delete.svg");
const shared_download: any = require("assets/images/shared_download.svg");
const shared_forward: any = require("assets/images/shared_forward.svg");
const delete_active: any = require("assets/images/delete_active.svg");
const download_active: any = require("assets/images/download_active.svg");
const forward_active: any = require("assets/images/forward_active.svg");


export interface ISharedMediaProps {
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    handleSharedMediaClose: () => void;

    attemptSendForwardMessage?: (messages: any, threadIds: string[], emailsMap: {[key: string]: string}) => void;
    updateMessageProperty?: (msgId, property, value) => void;
    setSearchKeyword?: (keyword: string) => void;
    downloadFile?: (downloadFile: any) => void;
    setForwardMessage?: (message: any) => void;
    clearForwardMessage?: () => void;
    forwardMessage?: any;
    conversations?: any
    sharedMedia?: any;
    fetchSharedMedia?: (threadId: string, sharedMediaType: string) => void;
    selectedThreadId?: string;
    selectedThread?: any;
    DELETE_SHARED_MEDIA_MESSAGES?: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => void;
    user?: any
    file?: any
    link?: any
    media?: any;
    images?: any;
    languages?: any;
    BLOCK_CONTACT?: (contactIds: string[]) => void
    UNBLOCK_CONTACT?: (contactIds: string[]) => void
    setSharedMediaImages?:(messages: any) => void;
    sharedMediaPanel: boolean;
    sharedMediaCount:any;
    systemTimeFormat?: any;
}

export interface ISharedMediaState {
    selectedTab: string;
    tabs: string[];
    isFilesEditing: boolean;
    isDeletePopup: boolean;
    checkedFiles: {
        [key: string]: {
            type: string,
            index: number
            isOwn: boolean
        }
    };
    isForwardMessagePopup: boolean;
    checkedFilesCount: {
        media: number,
        file: number,
        link: number,
        total: number
    };
}

class SharedMedia extends React.Component<ISharedMediaProps, ISharedMediaState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedTab: SHARED_MEDIA_TABS.media,
            tabs: [
                SHARED_MEDIA_TABS.media,
                SHARED_MEDIA_TABS.documents,
                SHARED_MEDIA_TABS.links,
            ],
            isFilesEditing: false,
            isDeletePopup: false,
            checkedFiles: {},
            isForwardMessagePopup: false,
            checkedFilesCount: {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            },
        }
    }

    handleFilesEditing = (): void => {
        const {isFilesEditing} = this.state;
        this.setState({
            isFilesEditing: !isFilesEditing, checkedFiles: {}, checkedFilesCount: {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            }
        });
    };

    handleTabChange = (e: React.MouseEvent<HTMLDivElement>): void => {
        const tab: string = e.currentTarget.getAttribute('data-tab');
        if (tab !== this.state.selectedTab) {
            this.setState({selectedTab: tab});
        }
    };

    handleDeletePopupShowing = () => {
        const {isDeletePopup, checkedFiles} = this.state;
        if (!isEmpty(checkedFiles)) {
            this.setState({isDeletePopup: !isDeletePopup});
        }
    };

    //
    // shouldComponentUpdate(nextProps: ISharedMediaProps, nextState: ISharedMediaState): boolean {
    //     const {languages} = this.props
    //     if (!this.props.sharedMedia.equals(nextProps.sharedMedia)) {
    //         return true;
    //     }
    //     if (!languages.equals(nextProps.languages)) {
    //         return true;
    //     }
    //     return !isEqual(this.state, nextState);
    // }

    handleSelectedFilesDownload = (folderPath: string) => {
        const {checkedFiles} = this.state;
        const {sharedMedia, downloadFile, selectedThreadId} = this.props;

        if (isEmpty(checkedFiles)) {
            return null;
        }

        for (const key in checkedFiles) {
            if (checkedFiles.hasOwnProperty(key) && checkedFiles[key].type !== SHARED_MEDIA_TYPES.LINK) {
                const msgId: string = key;
                const message: any = sharedMedia.getIn(["types", checkedFiles[key].type, "records", msgId, "messages"]);
                const downloadInfo = {
                    fileRemotePath: message.get("fileRemotePath"),
                    threadId: selectedThreadId,
                    method: "GET",
                    msgId,
                    folderPath: folderPath,
                };
                downloadFile(downloadInfo)
            }
        }
        this.setState({
            checkedFiles: {}, checkedFilesCount: {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            }
        });
        this.handleFilesEditing();
    };

    handleFolderSelectForFiles = async () => {
        const {checkedFiles} = this.state;
        if (!isEmpty(checkedFiles)) {
            (window as any).remote.dialog.showOpenDialog({properties: ["openDirectory"]}).then(res => {
                    if (!res.canceled) {
                        const folderPath: string = res.filePaths[0];
                        this.handleSelectedFilesDownload(folderPath)
                    }
                }
            )
        }
    };

    handleForwardPopUpOpen = () => {
        const {checkedFiles} = this.state;
        const {setForwardMessage, sharedMedia} = this.props;

        const messages: any = {};

        for (const msgId in checkedFiles) {
            if (checkedFiles.hasOwnProperty(msgId)) {
                messages[msgId] = sharedMedia.getIn(["types", checkedFiles[msgId].type, "records", msgId, "messages"])
            }
        }

        if (messages && !isEmpty(messages)) {
            this.setState({isForwardMessagePopup: true});
            setForwardMessage(messages);
        }
    };

    handleForwardPopUpClose = () => {
        this.setState({isForwardMessagePopup: false})
    };

    handleFilesChecked = (messageId: string, type: string, isOwnMessage: boolean): void => {
        const {isFilesEditing, checkedFilesCount, checkedFiles} = {...this.state};
        const newState: ISharedMediaState = {...this.state};

        if (!isFilesEditing) {
            return
        }

        if (!checkedFiles.hasOwnProperty(messageId)) {
            checkedFiles[messageId] = {
                type,
                index: checkedFilesCount.total,
                isOwn: isOwnMessage
            };
            newState.checkedFilesCount.total = checkedFilesCount.total + 1;
            newState.checkedFilesCount[type] = checkedFilesCount[type] + 1;

        } else {
            newState.checkedFilesCount.total = checkedFilesCount.total - 1;
            for (const key in checkedFiles) {
                if (checkedFiles.hasOwnProperty(key) && checkedFiles[messageId].index < checkedFiles[key].index) {
                    checkedFiles[key].index = checkedFiles[key].index - 1
                }
            }

            newState.checkedFilesCount[type] = checkedFilesCount[type] - 1;

            delete checkedFiles[messageId];
        }
        newState.checkedFiles = checkedFiles;
        this.setState(newState);
    };

    handleMessagesDelete = (isDeleteEveryWhere: boolean) => {
        const {DELETE_SHARED_MEDIA_MESSAGES, sharedMedia} = this.props;
        const {checkedFiles, checkedFilesCount} = this.state;

        const messageIds: string[] = [];
        const ownMessage: any[] = [];

        for (const msgId in checkedFiles) {
            if (checkedFiles.hasOwnProperty(msgId)) {
                messageIds.push(msgId);
                if (checkedFiles[msgId].isOwn) {
                    const message: any = sharedMedia.getIn(["types", checkedFiles[msgId].type, "records", msgId]);
                    ownMessage.push(message)
                }
            }
        }

        DELETE_SHARED_MEDIA_MESSAGES(messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessage);
        this.handleDeletePopupShowing();
        this.handleFilesEditing();
        this.setState({
            checkedFiles: {}, checkedFilesCount: {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            }
        });
    };
    componentDidUpdate(prevProps: Readonly<ISharedMediaProps>, prevState: Readonly<ISharedMediaState>, snapshot?: any): void {
        const {selectedTab} = this.state;
        const {sharedMedia} = this.props;
        const media = sharedMedia.toJS()

        const {fetchSharedMedia, selectedThreadId} = this.props;
        if(selectedThreadId !== prevProps.selectedThreadId) {
            setTimeout(() => {
                this.setState({selectedTab: SHARED_MEDIA_TABS.media});
            }, 125)
        }
        if (selectedTab !== prevState.selectedTab){
            if(selectedTab === SHARED_MEDIA_TABS.links) {
                const records = media.types.link.records;
                if(Object.keys(records).length === 0 && records.constructor === Object) {
                    fetchSharedMedia(selectedThreadId,SHARED_MEDIA_TYPES.LINK);
                }

            }
            else if(selectedTab === SHARED_MEDIA_TABS.media) {
                const records = media.types.media.records;
                if(Object.keys(records).length === 0 && records.constructor === Object) {
                    fetchSharedMedia(selectedThreadId,SHARED_MEDIA_TYPES.MEDIA);
                }
            }
            else if(selectedTab === SHARED_MEDIA_TABS.documents) {
                const records = media.types.file.records;
                if(Object.keys(records).length === 0 && records.constructor === Object) {
                    fetchSharedMedia(selectedThreadId,SHARED_MEDIA_TYPES.FILE);
                }

            }

        }
    }

    handleForwardMessageSend = async (selectedThreadIds: any, emailsMap: {[key: string]: string}) => {
        const {setSearchKeyword, attemptSendForwardMessage, forwardMessage, handleSharedMediaClose} = this.props;

        attemptSendForwardMessage(forwardMessage, selectedThreadIds, emailsMap);
        this.handleForwardPopUpClose();
        const input_field = (document.getElementById("searchInput") as HTMLInputElement);
        if (input_field) {
            input_field.value = "";
        }
        handleSharedMediaClose();
        setSearchKeyword('');
        this.handleFilesEditing();
        this.setState({
            checkedFiles: {}, checkedFilesCount: {
                media: 0,
                file: 0,
                link: 0,
                total: 1
            }
        });
    };

    get recentChats() {
        const {conversations} = this.props;
        return conversations.size > 20 ? conversations.slice(0, 20) : conversations;
    }

    get content(): any {
        const {togglePopUp, handleAudioChange, downloadFile, updateMessageProperty, sharedMedia, fetchSharedMedia, selectedThreadId, file, media, link,setSharedMediaImages, images, sharedMediaCount} = this.props;
        const {isFilesEditing, checkedFiles, selectedTab} = this.state;

        return(
            <>
                <div key="mediaPanel" style={{display: selectedTab === SHARED_MEDIA_TABS.media ? "block": "none", height: 'inherit', width: '100%'}}>
                    <Media
                      mediaMessages={sharedMedia.getIn(["types", SHARED_MEDIA_TYPES.MEDIA])}
                      isFilesEditing={isFilesEditing}
                      checkedFiles={checkedFiles}
                      togglePopUp={togglePopUp}
                      handleFilesChecked={this.handleFilesChecked}
                      fetchSharedMedia={fetchSharedMedia}
                      selectedThreadId={selectedThreadId}
                      media={media}
                      images={images}
                      setSharedMediaImages={setSharedMediaImages}
                      sharedMediaCount={sharedMediaCount}
                    />
                </div>
                <div key="filePanel" style={{display: selectedTab === SHARED_MEDIA_TABS.documents ? "block": "none", height: '100%'}}>
                    <SharedFiles
                      fileMessages={sharedMedia.getIn(["types", SHARED_MEDIA_TYPES.FILE])}
                      isFilesEditing={isFilesEditing}
                      handleFilesChecked={this.handleFilesChecked}
                      handleAudioChange={handleAudioChange}
                      updateMessageProperty={updateMessageProperty}
                      checkedFiles={checkedFiles}
                      downloadFile={downloadFile}
                      fetchSharedMedia={fetchSharedMedia}
                      selectedThreadId={selectedThreadId}
                      selectedTab={selectedTab}
                      file={file}
                    />
                </div>
                <div key="linkPanel" style={{display: selectedTab === SHARED_MEDIA_TABS.links ? "block": "none", height: '100%'}}>
                    <SharedLinks
                      links={sharedMedia.getIn(["types", SHARED_MEDIA_TYPES.LINK])}
                      handleFilesChecked={this.handleFilesChecked}
                      isFilesEditing={isFilesEditing}
                      checkedFiles={checkedFiles}
                      fetchSharedMedia={fetchSharedMedia}
                      selectedThreadId={selectedThreadId}
                      link={link}
                    />
                </div>
            </>)
    }

    get popup(): JSX.Element {
        const {forwardMessage, BLOCK_CONTACT, UNBLOCK_CONTACT, selectedThreadId, selectedThread, user} = this.props;
        const {isDeletePopup, isForwardMessagePopup} = this.state;
        const deleteSharedFilesLocalization = components().chatPanel;
        const isForwardMessageEmpty: boolean = forwardMessage && !forwardMessage.isEmpty();

        return (
            <ReactCSSTransitionGroup
                transitionName={{enter: 'open', leave: 'close'}}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}
            >
                {
                    isForwardMessagePopup && isForwardMessageEmpty &&
                    <ForwardMessagePopup
                        close={this.handleForwardPopUpClose}
                        showForwardMessagePopUp={isForwardMessagePopup}
                        recentChats={this.recentChats}
                        forwardMessageSend={this.handleForwardMessageSend}
                        UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                        BLOCK_CONTACT={BLOCK_CONTACT}
                        selectedThread={selectedThread}
                        selectedThreadId={selectedThreadId}
                        user={user}
                    />
                }
                {
                    isDeletePopup &&
                    <PopUpMain
                        showPopUpLogo={true}
                        confirmButton={this.handleMessagesDelete}
                        confirmButtonText={deleteSharedFilesLocalization.delete}
                        cancelButton={this.handleDeletePopupShowing}
                        cancelButtonText={deleteSharedFilesLocalization.cancel}
                        titleText={deleteSharedFilesLocalization.deleteThisMessage}
                        infoText={deleteSharedFilesLocalization.deleteMessageInfo}
                        checkInfo={deleteSharedFilesLocalization.deleteForEveryone}
                        shouldCheckOnPopupApprove={true}
                        isChecked={true}
                    />
                }

            </ReactCSSTransitionGroup>
        )
    }

    render() {
        const {handleSharedMediaClose, sharedMediaPanel} = this.props;
        const {isFilesEditing, tabs, selectedTab, checkedFiles} = this.state;
        const localization: any = components().sharedMedia;

        return (
            <SharedMediaContainer sharedMediaPanel={sharedMediaPanel}>
                <SharedMediaHeader>
                    <BackArrow src={back_arrow} onClick={handleSharedMediaClose}/>
                    <SharedMediaTitle>{localization.sharedMedia}</SharedMediaTitle>
                    <EditButton
                        fontWeight={isFilesEditing ? "600" : "400"}
                        onClick={this.handleFilesEditing}>{isFilesEditing ? localization.done : localization.edit}</EditButton>
                </SharedMediaHeader>
                <NavBar>
                    <NavBarTabs>
                        {
                            tabs.map((tab) => {
                                return (
                                    <Tab
                                        key={tab}
                                        onClick={this.handleTabChange}
                                        data-tab={tab}
                                    >
                                        {localization[tab]}
                                    </Tab>
                                )
                            })
                        }
                        <BackgroundSlider
                            tabLength={tabs.length}
                            tabIndex={
                                selectedTab === SHARED_MEDIA_TABS.media ? 0 :
                                    selectedTab === SHARED_MEDIA_TABS.documents ? 1 : 2
                            }
                        />
                    </NavBarTabs>
                </NavBar>
                <SharedMediaContent
                  height={isFilesEditing ? "calc(100% - 30px)" : "100%"}>
                    {this.content}
                </SharedMediaContent>
                <SharedMediaFooter
                  style={{
                      visibility: isFilesEditing ? "visible" : "hidden"
                  }}
                  isFilesEditing={isFilesEditing}
                  bottom="0">
                    <FooterTabList>
                        <FooterTab cursor={!isEmpty(checkedFiles) ? "pointer" : "default"} onClick={this.handleDeletePopupShowing}>
                            <FooterButton src={!isEmpty(checkedFiles) ? delete_active : shared_delete}/>
                            <FooterButtonTitle>{localization.delete}</FooterButtonTitle>
                        </FooterTab>
                        <FooterTab cursor={!isEmpty(checkedFiles) ? "pointer" : "default"} onClick={this.handleFolderSelectForFiles}>
                            <FooterButton src={!isEmpty(checkedFiles) ? download_active : shared_download}/>
                            <FooterButtonTitle>{localization.download}</FooterButtonTitle>
                        </FooterTab>
                        <FooterTab cursor={!isEmpty(checkedFiles) ? "pointer" : "default"} onClick={this.handleForwardPopUpOpen}>
                            <FooterButton src={!isEmpty(checkedFiles) ? forward_active : shared_forward}/>
                            <FooterButtonTitle>{localization.forward}</FooterButtonTitle>
                        </FooterTab>
                    </FooterTabList>
                </SharedMediaFooter>

                {/*Popup block*/}
                {this.popup}
            </SharedMediaContainer>
        );
    }
}

const mapStateToProps = () => {
    const user = userSelector();
    const selectedThread = selectedThreadSelector();
    const selectedThreadId = selectedThreadIdSelector();
    const sharedMedia = sharedMediaSelector();
    const forwardMessage = forwardedMessageSelector();
    const conversations = conversationsSelector();
    const file = fileSelector();
    const link = linkSelector();
    const media = mediaSelector();
    const images = imageUrlSelector();
    return (state, props) => {
        return {
            user: user(state, props),
            selectedThread: selectedThread(state, props),
            selectedThreadId: selectedThreadId(state, props),
            sharedMedia: sharedMedia(state, props),
            forwardMessage: forwardMessage(state, props),
            conversations: conversations(state, props),
            file: file(state, props),
            link: link(state, props),
            media: media(state, props),
            images: images(state,props),
        };
    };
};
const mapDispatchToProps: any = dispatch => ({
    attemptSendForwardMessage: (messages: any, threadIds: string[], emailsMap: {[key: string]: string}) => dispatch(attemptSendForwardMessage(messages, threadIds, emailsMap)),
    updateMessageProperty: (msgId, property, value) => dispatch(updateMessageProperty(msgId, property, value)),
    setSearchKeyword: (keyword) => dispatch(setSearchKeyword(keyword)),
    downloadFile: (downloadInfo) => dispatch(downloadFile(downloadInfo)),
    setForwardMessage: (message: any) => dispatch(setForwardMessage(message)),
    clearForwardMessage: () => dispatch(clearForwardMessage()),
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => dispatch(fetchSharedMedia(threadId, sharedMediaType)),
    DELETE_SHARED_MEDIA_MESSAGES: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => dispatch(DELETE_SHARED_MEDIA_MESSAGES(messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages)),
    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds)),
    BLOCK_CONTACT: (contactIds: string[]) => dispatch(BLOCK_CONTACT(contactIds)),
    setSharedMediaImages: (messages) => dispatch(setSharedMediaImages(messages))
});

export default connect<{}, {}, ISharedMediaProps>(mapStateToProps, mapDispatchToProps)(SharedMedia);
