import * as React from "react";
import * as Raven from 'raven-js';
import {fromJS, Map} from "immutable";
import {connect, Store} from "react-redux";
import Notification from "react-web-notification";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import conf from "configs/configurations";
// import { Picker } from 'emoji-mart'

import {
    attemptSetSelectedThread,
    changeRightPanel,
    checkForFailedSync,
    checkMutedConversations,
    DELETE_SHARED_MEDIA_MESSAGES,
    deleteSharedMediaMessages,
    FETCH_THREAD,
    removeLoading,
    setSelectedThreadId, setSendingLocation, toggleCanNotDeleteGroup, toggleCanNotDoCall,
    toggleProfilePopUp, updateCallPanel,
    XMPPConnected,
    XMPPDisconnected
} from "modules/application/ApplicationActions";
import {
    GIF_TOGGLE,
    IMAGE_TOGGLE, LEFT_PANELS,
    LOG_TYPES,
    LOGS_LEVEL_TYPE,
    MEDIA_ACCESS_TYPE,
    MEDIA_POPUP_ACTIONS,
    MESSAGE_TYPES,
    OFFLINE_MESSAGE_BODY,
    RIGHT_PANELS,
    URL_SCHEME,
    VIDEO_TOGGLE
} from "configs/constants";
import {
    attemptDeleteMessage,
    attemptSendForwardMessage,
    downloadFile,
    messageLocalDelete,
    sendCarbonEnablingXML,
    sendMessageSeen,
    updateVideoMessage
} from "modules/messages/MessagesActions";
import {GROUP_CONVERSATION_EXTENSION, XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import {getDeviceToken, getThread, getThreadType, isPublicRoom, isSubPanelOpened, writeLog} from "helpers/DataHelper";
import {resetConversationNewMessagesIds} from "modules/conversations/ConversationsActions";
import {attemptCheckForUpdates} from "modules/settings/SettingsActions";
import {inviteGroupMembers, resetGroupNewMessagesIds} from "modules/groups/GroupsActions";
import IDBConversation from "services/database/class/Conversation";
import {attemptGetNetwork, setNetworkKickedPopUp} from "modules/networks/NetworksActions";
import {resendRequests} from "modules/requests/RequestsActions";
import {setContextMenu} from "helpers/AppHelper";
import getConnectionUsername from "xmpp/getConnectionUsername";
import ChatPanelOld from "containers/chat-panel/Footer/ChatPanel";
import ChatPanelRefactor from "containers/chat-panel-refactor";
import {IRequest} from "modules/requests/RequestsReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import RightPanel from "containers/right-panel/RightPanel";
import selector, {IStoreProps} from "services/selector";
import {SIGN_OUT} from "modules/user/UserActions";
import connectionCreator from "xmpp/connectionCreator";
import MediaPopUp from "components/common/MediaPopUp";
import {getContactbyId} from "helpers/ContactsHelper";
import PopUpMain from "components/common/PopUpMain";
import MapPopUp from "components/common/MapPopUp";
import {unEscapeText} from "helpers/MessageHelper";
import LeftPanel from "containers/left-panels";
import HeaderOld from "components/common/Header";
import HeaderNew from "containers/HeaderContainer";
import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";
import Audio from "components/common/Audio";
import LeftMenu from "containers/left-menu";
import handlers from "xmpp/handlers";

import "scss/pages/app";
import {checkForMediaAccess} from "helpers/MessageBoxHelper";
import {getCredentials, ICredentials} from "services/request";
import MessagesModel from "modules/messages/MessagesModel";
import {Loader, LoadingPage} from "./style";
import AddMembersPopup from "components/common/popups/AddMembers";
import {BLOCK_CONTACT, UNBLOCK_CONTACT} from "modules/contacts/ContactsActions";
import {PendingQueue} from "modules/messages/PendingQueue";
import storeCreator from "helpers/StoreHelper";
import Log from "modules/messages/Log";
import WebViewContent from "./WebViewContent";
import {endCall, startCall} from "modules/call/CallActions";
import CallPanel from "containers/chat-panel/newUICall";
import {backgroundXML} from "xmpp/XMLBuilders";
import ConferenceSettings from "containers/chat-panel/conference/settingsPopup";
import {
    changeInitiatorAccess, leave,
    setConferenceProperty,
    toggleAddMembersPopup, toggleAnotherCallPopup, toggleInitiatorPopup, toggleLeaveGroupCallPopup, toggleMemberMuted,
    toggleSettingsPopup,
    toggleUnMutePopup
} from "modules/conference/ConferenceActions";
import UnMutePopup from "containers/chat-panel/conference/unMutePopup";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import ChangeInitiator from "containers/chat-panel/conference/ChangeInitiatorPopup";
import CanNotDoCall from "containers/chat-panel/conference/CanNotDoCall";
import CanNotDeleteGroup from "containers/chat-panel/conference/CanNotDeleteGroup";
import AnotherCallPopup from "containers/chat-panel/conference/AnotherCall";
import LeaveGroupCallPopup from "containers/chat-panel/conference/LeaveGroupCallPopup";

(window as any).isRefactor = false;
const ChatPanel: any = (window as any).isRefactor ? ChatPanelRefactor : ChatPanelOld;
// const ChatPanel: any = (window as any).isRefactor ? ChatPanelRefactor : ChatPanelRefactor;

export interface IAppProps extends Partial<IStoreProps> {
    XMPPConnected?: (handlers: Array<any>, pendingRequests: Map<string, IRequest>, showOnlineStatus: boolean) => void;
    XMPPDisconnected?: (username: string, accessToken: string, connectionHandler: any) => void;
    sendMessageSeen?: (to: string, id: string, author: string, isGroup: boolean) => void;
    updateCallPanel?: (minimized: boolean, showChat: boolean) => void;
    messageLocalDelete?: (id: string, threadId: string) => void;
    deleteSharedMediaMessages?: (messageId: string) => void;
    SIGN_OUT?: (shouldDeleteHistory: boolean, sessionExpired?: boolean) => void;
    sendCarbonEnablingXML?: (from: string) => void;
    updateVideoMessage?: (msgId: string) => void;
    resetConversationNewMessagesIds?: (id: string) => void;
    resetGroupNewMessagesIds?: (id: string) => void;
    resendRequests?: (requests: Array<any>) => void;
    checkMutedConversations?: (encodedUsername) => void;
    attemptDeleteMessage?: (id: string, message: any) => void;
    attemptGetNetwork?: (id: string, token: boolean) => void;
    attemptSetSelectedThread?: (thread: any) => void;
    setContactsData?: (username: string) => void;
    changeRightPanel?: (panel: string) => void;
    setSelectedThreadId?: (id: string) => void;
    downloadFile?: (downloadInfo) => void;
    setSendingLocation?: (location) => void;
    attemptCheckForUpdates?: (isAvailable, count) => void;
    toggleProfilePopUp?: () => void;
    checkForFailedSync?: () => void;
    removeLoading?: () => void;
    removeFiles?: () => void;
    state?: Store<any>;
    loading?: boolean;
    dispatch?: any;
    networkKickedPopUp?: boolean;
    setNetworkKickedPopUp?: (networkKickedPopUp: boolean) => void;
    DELETE_SHARED_MEDIA_MESSAGES?: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => void;
    selectedThreadId?: string;
    addMembers?: (groupId: string, members: string, isManualAdd: boolean) => void;
    FETCH_THREAD?: (threadId: string) => void;
    BLOCK_CONTACT?: (contactIds: string[]) => void;
    UNBLOCK_CONTACT?: (contactIds: string[]) => void;
    attemptSendForwardMessage?: (messages: any, threadIds: string[], emailsMap: { [key: string]: string }) => void;
    startCall?: () => void;
    endCall?: () => void;
    isRedialScreenShown?: boolean;
    conferenceDetails?: any
    toggleSettingsPopup?: (settingsPopup: boolean) => void;
    toggleAddMembersPopup?: (addMembersPopup: boolean) => void;
    toggleUnMutePopup?: (unMuteBool: boolean) => void,
    setConferenceProperty?: (propertyId: ConfPropertyId, value: string) => void;
    toggleMemberMuted?: (memberId: string, muted: boolean) => void;
    toggleInitiatorPopup?: (initiatorPopup: boolean) => void;
    changeInitiatorAccess?: (groupId: string, member: string) => void;
    toggleCanNotDoCall?: (canNotDoCall: boolean) => void;
    toggleCanNotDeleteGroup?: (canNotDeleteGroup: boolean) => void;
    toggleAnotherCallPopup?: (anotherCall: boolean) => void;
    toggleLeaveGroupCallPopup?: (leaveGroupCallPopup: boolean) => void;
    leave?: () => void;
}

interface IAppState {
    resendRequestsRef: any;
    ignore: boolean;
    title: string;
    options: any;
    media: {
        type: typeof IMAGE_TOGGLE | typeof VIDEO_TOGGLE;
        rightDisabled: boolean;
        leftDisabled: boolean;
        url: string;
        id: string;
        firstName: string;
        name: string;
        phone: string;
        image: Blob;
        avatarCharacter: string;
        color: any,
        role: string,
        createdAt: string,
        videoUrl?: string,
        imgUrl?: string,
        avatar: any,
        avatarUrl: string,
        own: boolean,
        text: string,
        time: any,
        isAvatarImage: boolean,
    };
    mediaPopUp: boolean;
    audio: HTMLAudioElement;
    map: {
        location: string;
        lat: number;
        lng: number;
    }
    callDetails: {
        contact: IContact;
        isVideo: boolean;
        outCall: boolean;
    };
    sharedMedia: any[];
    sharedMediaPopUp: boolean;
    disconnected: boolean;
    popUpFileIndex: number;
    // showRightPanel: boolean;

    isAddMemberPopUpShown: boolean;
    resizeWidth: number;
    resizeHeight: number;
    clientWidth: number;
    clientHeight: number;
    opacity: string;
}

const selectorVariables: any = {
    selectedInfoThread: true,
    selectedThreadId: true,
    sharedMediaMessages: true,
    app: true,
    settings: {
        notification: true,
        privacy: true,
        chat: true,
        languages: true
    },
    requests: true,
    contacts: true,
    threads: true,
    user: true,
    calls: {
        lastCall: true
    },
    initialState: true,
    messages: {
        allMessages: true
    },
    conversations: true,
    networkKickedPopUp: true,
    conferenceDetails: true
};
let iv: any = 0;

class App extends React.Component<IAppProps, IAppState> {

    audio: HTMLAudioElement;

    notificationAudio: HTMLAudioElement;
    private readonly contentEl: React.RefObject<HTMLDivElement>;

    constructor(props: IAppProps) {
        super(props);

        this.state = {
            resendRequestsRef: null,
            sharedMediaPopUp: false,
            callDetails: null,
            mediaPopUp: true,
            ignore: false,
            options: null,
            media: null,
            audio: null,
            title: "",
            map: null,
            sharedMedia: null,
            disconnected: false,
            popUpFileIndex: 0,
            resizeWidth: window.innerWidth,
            resizeHeight: window.innerHeight,
            isAddMemberPopUpShown: false,
            clientWidth: null,
            clientHeight: null,
            opacity: "1"
        }

        this.contentEl = React.createRef();
    }

    // updateWithAndHeight = () => {
    //     let self=this
    //     // console.log(self.contentEl, "contentEl2")
    //
    //     this.setState({
    //         resizeWidth: window.innerWidth,
    //         resizeHeight: window.innerHeight,
    //     })
    //
    //     // setTimeout(() => {
    //     //     this.setState({
    //     //         resizeWidth: window.innerWidth,
    //     //         resizeHeight: window.innerHeight,
    //     //         // clientWidth: self.contentEl.current.clientWidth,
    //     //         // clientHeight: self.contentEl.current.clientHeight
    //     //     }, () => {
    //     //         this.setState({
    //     //             // clientWidth: self.contentEl.current.clientWidth,
    //     //             // clientHeight: self.contentEl.current.clientHeight
    //     //             // resizeWidth: window.innerWidth,
    //     //             // resizeHeight: window.innerHeight,
    //     //         })
    //     //     });
    //     // }, 10)
    //
    // }


    componentDidMount() {
        const {removeLoading, app, removeFiles, toggleProfilePopUp, checkMutedConversations} = this.props;
        const userCredentials: ICredentials = getCredentials();
        const username: string = userCredentials["X-Access-Number"];
        const accessToken: string = userCredentials["X-Access-Token"];


        const store: Store<any> = storeCreator.getStore();
        const {
        app: {
            minimized, showChat, lastCall
        }} = selector(store.getState(), {app: true});

        writeLog(LOG_TYPES.user, {
            reason: "App is mounted",
            userCredentials
        });
        if (!userCredentials) {
            writeLog(LOG_TYPES.user, {
                reason: "User Credentials aren't exist",
                userCredentials
            });
            return;
        }

        if (app.files) {
            removeFiles();
        }

        const connection: any = connectionCreator.getConnection();

        Strophe.log = (level, msg): void => {
            if (level > 2) {
                if (level === 4) {
                    if (userCredentials) {
                        const connection: any = connectionCreator.getConnection();
                        if (!connection.connected || connection.disconnecting) {
                            connection.disconnect();
                        }
                    }
                }
                console.dir(msg);
            }
        };

        const connectionUsername: string = getConnectionUsername(username);

        if (!connection.connected || !connection.authenticated) {

            writeLog(LOG_TYPES.connection, {
                msg: "trying to connect...",
                connectionUsername
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "trying to connect...",
                connectionUsername
            })
            connection.connect(connectionUsername, `${accessToken}$${getDeviceToken()}`, this.connectHandler);
        }


        const resendRequestsRef: any = setInterval(() => {
            const {pendingRequests, resendRequests} = this.props;
            const requests: any = pendingRequests.toJS();
            if (Object.keys(requests).length > 0) {
                resendRequests(requests);
            }
        }, 10000);

        this.setState({resendRequestsRef});

        setTimeout(() => {
            const {app} = this.props;
            if (app.loading) {
                removeLoading();
            }
        }, 5000);

        document.addEventListener("click", this.checkProfilePopUpState);

        document.addEventListener("mousedown", this.handleKeyPress);

        window.addEventListener("offline", this.handleOffline);

        window.addEventListener("online", this.onlineHandler);

        window.addEventListener("dragover", this.handleDragDrop, false);

        window.addEventListener("drop", this.handleDragDrop, false);

        (window as any).ipcRenderer.on('getNotification', this.getNotification);

        (window as any).ipcRenderer.on('balloon-clicked', this.handleNotificationClick);

        (window as any).ipcRenderer.on('openNetwork', this.handleNetworkOpen);

        (window as any).ipcRenderer.on('sendError', this.sendErrorReport);

        (window as any).ipcRenderer.on('logInfo', this.handleLogInfo);

        if ((window as any).remote.getGlobal('globalValues').firstOpen === true) {
            this.handleNetworkOpen();
            (window as any).remote.getGlobal('globalValues').firstOpen = false;
        }

        this.handleOffline();

        if ((window as any).remote) {
            setContextMenu();
        }

        if (app.showProfilePopUp) {
            toggleProfilePopUp();
        }

        checkMutedConversations(btoa(username));


        // Handle app updates and when update is available then draw badge check for updates menu in settings

        (window as any).ipcRenderer.on('appUpdate', this.handleAppUpdate);
        this.checkForSleepMode(connection);


        // this.updateWithAndHeight();
        // (window as any).addEventListener("resize", this.updateWithAndHeight);
        // (window as any).addEventListener("resize", () => {
        //     this.setState({
        //         resizeWidth: window.innerWidth*2,
        //         resizeHeight: window.innerHeight*2
        //     })
        // });


        let running = false;

        const update = () => {
            running = false;
            this.setState({
                opacity: "0"
            })
            window.require("@electron/remote").getCurrentWindow().setContentSize(window.require("@electron/remote").getCurrentWindow().getContentSize()[0], window.require("@electron/remote").getCurrentWindow().getContentSize()[1], true)
        }

        const requestTick = () => {
            if(!running) requestAnimationFrame(update);
            running = true;
            setTimeout(() => {
                this.setState({
                    opacity: "1"
                })
            }, 600)

        }

        // window.addEventListener('resize', requestTick);
        window.require("@electron/remote").getCurrentWindow().addListener('enter-full-screen', requestTick)
        window.require("@electron/remote").getCurrentWindow().addListener('leave-full-screen', requestTick)
        window.require("@electron/remote").getCurrentWindow().addListener('will-resize', requestTick)

        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
                Log.i("LocationMessage -> getCurrentPosition = ", {latitude, longitude})
            })
        }, 10000)
        // window.require("electron").remote.getCurrentWindow().isFullScreenable()
    }

    componentDidUpdate(prevProps: IAppProps, prevState: IAppState): void {
        const {app, changeRightPanel, selectedThreadId} = this.props;
        if (this.state.media && !prevState.media) {
            const mediaElement = document.getElementById("media-popup");
            mediaElement && mediaElement.focus();
        }

        if (app.applicationState.isOnline !== prevProps.app.applicationState.isOnline && app.applicationState.isOnline === true) {
            const connection: any = connectionCreator.getConnection();
            const userCredentials: ICredentials = getCredentials();
            const username: string = userCredentials["X-Access-Number"];
            const accessToken: string = userCredentials["X-Access-Token"];
            const connectionUsername: string = getConnectionUsername(username);
            connection.connect(connectionUsername, `${accessToken}$${getDeviceToken()}`, this.connectHandler);
        }

        if (selectedThreadId !== prevProps.selectedThreadId && isSubPanelOpened(app.rightPanel)) {
            if (isPublicRoom(selectedThreadId)) {
                selectedThreadId.includes("gid") && changeRightPanel(RIGHT_PANELS.group_info);

            } else {
                changeRightPanel(RIGHT_PANELS.contact_info);
            }
        }
    }

    componentWillUnmount(): void {
        const {resendRequestsRef} = this.state;

        if (resendRequestsRef) {
            clearInterval(resendRequestsRef);
        }
        const connection: any = connectionCreator.getConnection();
        connection.disconnect();



        document.removeEventListener("click", this.checkProfilePopUpState);

        document.removeEventListener("mousedown", this.handleKeyPress);

        window.removeEventListener("offline", this.handleOffline);

        window.removeEventListener("online", this.onlineHandler);

        window.removeEventListener("dragover", this.handleDragDrop, false);

        window.removeEventListener("drop", this.handleDragDrop, false);

        (window as any).ipcRenderer.removeListener('openNetwork', this.handleNetworkOpen);

        (window as any).ipcRenderer.removeListener('balloon-clicked', this.handleNotificationClick);

        (window as any).ipcRenderer.removeListener('sendError', this.sendErrorReport);

        (window as any).ipcRenderer.removeListener('logInfo', this.handleLogInfo);

        (window as any).ipcRenderer.removeListener('appUpdate', this.handleAppUpdate);

        // (window as any).removeEventListener("resize", this.updateWithAndHeight);
    }

    inviteToCall = (isVideo: boolean, contact: IContact, outCall?: boolean) => {
        const {lastCall, isRedialScreenShown, startCall} = this.props;

        checkForMediaAccess(isVideo ? MEDIA_ACCESS_TYPE.CAMERA : MEDIA_ACCESS_TYPE.MICROPHONE, () => {
            const callOut: boolean = !!outCall;
            if (!lastCall || lastCall.size === 0) {
                this.setState({callDetails: {isVideo, contact, outCall: callOut}});
            }

            if (isRedialScreenShown) {
                startCall();
            }
        });
    };

    removeCallDetails = () => {
        this.setState({callDetails: null});
    };

    togglePopUp = async (type: typeof IMAGE_TOGGLE | typeof VIDEO_TOGGLE | typeof GIF_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => {
        const {conversations, user, selectedThreadId, allMessages, sharedMediaMessages} = this.props;
        const selectedThread = conversations.get(selectedThreadId);

        if (isAvatarClick) {

            let avatarInfo: any;
            const {isGroup} = getThreadType(selectedThread.getIn(["threads", "threadType"]));

            if (isGroup) {
                avatarInfo = selectedThread.getIn(["threads", "threadInfo"]);
            } else {
                avatarInfo = selectedThread.get("members").first();
            }



            this.setState({
                media: {
                    name: avatarInfo.get("name") || avatarInfo.get("fullName") || avatarInfo.get("phone"),
                    firstName: "",
                    phone: null,
                    rightDisabled: true,
                    avatarCharacter: "",
                    leftDisabled: true,
                    image: avatarInfo.get("image") || avatarInfo.get("avatar"),
                    color: "",
                    role: null,
                    createdAt: null,
                    avatar: avatarInfo.get("avatar"),
                    avatarUrl: avatarInfo.get("avatarUrl") || "",
                    imgUrl: isGroup ? "" : (avatarInfo.get("imgUrl") || `${avatarInfo.get("username")}/image`),
                    type,
                    url: null,
                    id: avatarInfo.get("name") || avatarInfo.get("fullName") || avatarInfo.get("phone"),
                    own: null,
                    text: "",
                    time: null,
                    isAvatarImage: true
                }
            })
        } else if (url) {
            const {isGroup} = getThreadType(selectedThread.getIn(["threads", "threadType"]));
            let selectedItemIndex = 0;

            let files: any;
            if (sharedMediaPopUp) {
                files = document.querySelectorAll('[data-rel="sharedBlobURI"]');
                this.setState({sharedMediaPopUp: true});
            } else {
                files = document.querySelectorAll('[data-rel="blobURI"]')
            }
            let sharedMedia: Array<any> = [];

            if (files && files.length > 0) {
                files.forEach((file, index) => {
                    const creatorId = file.dataset.creatorId;
                    let creator: any = null;
                    if (creatorId === user.get("id")) {
                        creator = user;

                    } else if (isGroup) {
                        creator = selectedThread.getIn(["members", creatorId]);
                    } else {
                        creator = conversations.getIn([creatorId, "members", creatorId]);
                    }

                    if (!creator) {
                        creator = getContactbyId(creatorId);
                    }

                    if (file.dataset.msgid === id) {
                        this.setState({popUpFileIndex: index});
                        selectedItemIndex = index;
                    }

                    const messageId: string = file.dataset.msgid;
                    const createdAt: any = allMessages.getIn([messageId, "createdAt"]) || sharedMediaMessages.getIn([messageId, "createdAt"]);

                    let fileRemotePath: any;
                    if (sharedMediaPopUp) {
                        fileRemotePath = file.dataset.fileremotepath;
                    } else {
                        fileRemotePath = allMessages.getIn([messageId, "fileRemotePath"]);
                    }

                    const own: boolean = allMessages.getIn([messageId, "own"]);
                    const messageText: any = allMessages.getIn([messageId, "text"]);
                    let linkTags: any = allMessages.getIn([messageId, "linkTags"]) || sharedMediaMessages.getIn([messageId, "linkTags"]);
                    if (linkTags && linkTags.size > 0) {
                        linkTags = linkTags.toJS();
                    }
                    const link: any = allMessages.getIn([messageId, "link"]) || sharedMediaMessages.getIn([messageId, "link"]);
                    let messsageTime: any;

                    if (sharedMediaPopUp) {
                        messsageTime = sharedMediaMessages.getIn([messageId, "time"]);
                    } else {
                        messsageTime = allMessages.getIn([messageId, "time"]);
                    }

                    if (creator && creator.size > 0) {
                        sharedMedia.push({
                            name: creator.get("name") || creator.get("fullName") || creator.get("phone"),
                            firstName: creator.get("firstName") || "",
                            phone: creator.get("phone"),
                            avatarCharacter: creator.get("avatarCharacter"),
                            msgType: file.dataset.fileType,
                            image: creator.get("avatarUrl"),
                            color: creator.get("color"),
                            msgId: file.dataset.msgid,
                            role: creator.get("role"),
                            createdAt: createdAt,
                            avatar: creator.get("avatar") || "",
                            avatarUrl: creator.get("avatarUrl") || "",
                            videoUrl: file.dataset.url,
                            fileRemotePath: fileRemotePath,
                            loadStatus: file.dataset.loadStatus,
                            blobLink: file.dataset.blob,
                            threadId: file.dataset.threadId,
                            src: file.src,
                            imgUrl: (file.dataset && file.dataset.url) ? file.dataset.url : file.src,
                            own: own,
                            text: messageText && messageText !== "" ? messageText : "",
                            time: messsageTime,
                            link: link,
                            linkTags: linkTags,
                            thumb: file.dataset.thumb,
                        });
                    }

                });
                this.setState({sharedMedia});
            }

            let creator: any = null;
            if (creatorId === user.get('id')) {
                creator = user;

            } else if (isGroup) {
                creator = selectedThread.getIn(['members', creatorId]);

            } else {
                creator = conversations.getIn([creatorId, 'members', creatorId]);
            }
            if (!creator) {
                creator = getContactbyId(creatorId);
            }

            let sharedImageUrl;
            if (sharedMediaPopUp) {
                const fileRemotePath: string = sharedMedia[selectedItemIndex].fileRemotePath;
                sharedImageUrl = await MessagesModel.get(fileRemotePath);
            }

            if (creator && creator.size > 0) {

                this.setState({
                    media: {
                        name: creator.get("name") || creator.get("fullName") || creator.get("phone"),
                        firstName: creator.get("firstName") || "",
                        phone: creator.get("phone"),
                        rightDisabled: sharedMedia[sharedMedia.length - 1].imgUrl === url,
                        avatarCharacter: creator.get("avatarCharacter"),
                        leftDisabled: sharedMedia[0].imgUrl === url,
                        image: creator.get("avatarUrl"),
                        color: creator.get("color"),
                        role: creator.get("role"),
                        createdAt: sharedMedia[selectedItemIndex].createdAt,
                        avatar: creator.get("avatar"),
                        avatarUrl: creator.get("avatarUrl"),
                        type,
                        url: sharedImageUrl || sharedMedia[selectedItemIndex].videoUrl || url,
                        id,
                        own: null,
                        text: "",
                        time: sharedMedia[selectedItemIndex].time,
                        isAvatarImage: false
                    }
                })
            }

        } else {
            this.setState({media: null, sharedMedia: null, popUpFileIndex: 0, sharedMediaPopUp: false})
        }

    };

    toggleMap = (lat: number = null, lng: number = null, location: string = null) => {
        const {map} = this.state;

        if (map) {
            this.setState({map: null});
        } else if (lat && lng && location) {
            this.setState({map: {lat, lng, location}});
        }
    };

    getNotification = async (event, data) => {
        if (data.action === 'GET_NOTIFICATION') {
            const {notification, user} = this.props;

            const senderId = data.senderId;
            let senderThread: any = await IDBConversation.getThread(senderId);
            senderThread = senderThread && fromJS(senderThread);

            if (!senderThread || senderThread.size === 0) {
                writeLog(LOG_TYPES.notification, {
                    showed: false,
                    senderThreadExists: !!senderThread,
                    username: user.get("username")
                });
                return false;
            }
            const threadInfo = getThread(senderThread, user.get("username"));
            const isMuted = threadInfo.get("muted");
            const {isGroup} = getThreadType(senderThread.getIn(['threads', 'threadType']));
            const messageSound: boolean = isGroup ? notification.get("groupSound") : notification.get("sound");
            // if (!this.notificationAudio && messageSound && ((window as any).isMac || (window as any).isWin) && !isMuted) {
            //     this.notificationAudio = document.createElement("audio");
            //     this.notificationAudio.setAttribute("src", require("files/sound.mp3"));
            //     this.notificationAudio.play();
            // } else if (messageSound && ((window as any).isMac || (window as any).isWin) && !isMuted) {
            //     this.notificationAudio.play();
            // }
        }
    }

    showNotification = async (message: string, contactId: string, threadId: string) => {
        const {ignore} = this.state;
        const {user} = this.props;

        // Log.i("showNotification -> ignore = ", ignore)

        if (ignore) {
            writeLog(LOG_TYPES.notification, {
                showed: false,
                ignore,
                username: user.get("username")
            });
            return;
        }



        const senderId = contactId === threadId ? contactId : threadId;

        const {notification, languages} = this.props;
        const localization: any = components(true)[languages.get("selectedLanguage")].app;

        let senderThread: any = await IDBConversation.getThread(senderId);

        senderThread = senderThread && fromJS(senderThread);



        if (!senderThread || senderThread.size === 0) {
            writeLog(LOG_TYPES.notification, {
                showed: false,
                ignore,
                senderThreadExists: !!senderThread,
                username: user.get("username")
            });
            return false;
        }





        const {isGroup} = getThreadType(senderThread.getIn(['threads', 'threadType']));

        const threadInfo = getThread(senderThread, user.get("username"));

        const senderAvatar: string = getBlobUri(threadInfo.get("avatarUrl")) || require("assets/images/logo.svg");





        const isMuted = threadInfo.get("muted");
        const title: string = `${localization.newMessage} ${threadInfo && threadInfo.get("contactId") === "000000002@msg.hawkstream.com" ? 'RASED' : threadInfo && threadInfo.get("contactId") === "111@msg.hawkstream.com" ? "RASED Admin" :  threadInfo ? threadInfo.get("name") :  senderId}`;

        const messagePreview: boolean = isGroup ? notification.get("groupMessagePreview") : notification.get("messagePreview");
        const messageSound: boolean = isGroup ? notification.get("groupSound") : notification.get("sound");
        //This is a hot fix, some problems occurred in nodeJS notification sound playing

        const options: any = {
            icon: senderAvatar,
            lang: languages.get("selectedLanguage"),
            sound: messageSound ? require("files/sound.mp3") : "",
            data: senderThread.toJS(),
            tag: Date.now(),
            body: messagePreview ? unEscapeText(message) : `${conf.app.name} Message`,
            senderId
        };

        const showPreviews: boolean = notification.get("showPreview");



        const showNotification: boolean = showPreviews && !isMuted;
        const {remote} = (window as any);
        const {systemPreferences} = remote;



        // if (!this.notificationAudio && messageSound && ((window as any).isMac || (window as any).isWin) && !isMuted) {
        //     this.notificationAudio = document.createElement("audio");
        //     this.notificationAudio.setAttribute("src", require("files/sound.mp3"));
        //     this.notificationAudio.play();
        // } else if (messageSound && ((window as any).isMac || (window as any).isWin) && !isMuted) {
        //     this.notificationAudio.play();
        // }


        if (((window as any).isWin || (window as any).isMac) && showNotification) {
            writeLog(LOG_TYPES.notification, {
                shouldShow: true,
                ignore,
                senderThreadExists: !!senderThread,
                username: user.get("username")
            });
            (window as any).ipcRenderer.send('notification', {
                options,
                title
            });

            (window as any).ipcRenderer.once('balloon-clicked', (event, senderThread) => {

                this.handleNotificationOnClick({
                    currentTarget: {
                        data: senderThread
                    }
                });

                (window as any).ipcRenderer.send('showWindow');
            });
        } else if (showNotification) {
            this.setState({
                options,
                title
            });
        }
    };

    handleAudioChange = (audio: HTMLAudioElement) => {

        if (this.state.audio && !this.state.audio.paused) {
            document.getElementsByClassName('pause-btn')[0].classList.add('play-btn');
            document.getElementsByClassName('pause-btn')[0].classList.remove('pause-btn');
            this.state.audio.pause();
        }
        audio.play();

        if (this.state.audio !== audio) {
            this.setState({audio});
        }

    };

    showOtherMedia = async (side: string, index?: number, removeFile: boolean = false, messageId?: string) => {
        const {sharedMediaPopUp} = this.state;
        let sharedMedia = this.state.sharedMedia;
        let popUpFileIndex = index || index === 0 ? index : this.state.popUpFileIndex;

        if (popUpFileIndex < 0 || sharedMedia && sharedMedia.length < popUpFileIndex) {
            return;
        }

        if (removeFile) {
            if (sharedMedia.length === 1) {
                this.setState({media: null, sharedMedia: null, popUpFileIndex: 0});
                return;
            }
            sharedMedia = sharedMedia.filter((file) => {
                return file.msgId !== messageId;
            });
            if (popUpFileIndex >= 1) {
                popUpFileIndex -= 1;
            }
            this.setState({sharedMedia, popUpFileIndex});

        }
        if (side === MEDIA_POPUP_ACTIONS.left) {
            if (popUpFileIndex >= 1) {
                popUpFileIndex -= 1;
                this.setState({popUpFileIndex});
            }
        }
        if (side === MEDIA_POPUP_ACTIONS.right) {
            popUpFileIndex += 1;
            this.setState({popUpFileIndex});
        }

        if (index || index === 0) {
            this.setState({popUpFileIndex: index});
        }

        let image: Blob | File;
        let url;
        if (sharedMediaPopUp) {
            const fileRemotePath: string = sharedMedia[popUpFileIndex].fileRemotePath;
            image = await MessagesModel.get(fileRemotePath);
            url = typeof image === "string" ? image : getBlobUri(image);
        }

        if (sharedMedia) {
            const newMedia: any = {
                type: sharedMedia[popUpFileIndex].msgType.toLowerCase(),
                url: url || sharedMedia[popUpFileIndex].imgUrl,
                videoUrl: url || sharedMedia[popUpFileIndex].videoUrl,
                leftDisabled: popUpFileIndex === 0,
                rightDisabled: popUpFileIndex === sharedMedia.length - 1,
                id: sharedMedia[popUpFileIndex].msgId,
                firstName: sharedMedia[popUpFileIndex].firstName,
                name: sharedMedia[popUpFileIndex].name,
                phone: sharedMedia[popUpFileIndex].phone,
                image: sharedMedia[popUpFileIndex].image,
                avatarCharacter: sharedMedia[popUpFileIndex].avatarCharacter,
                color: sharedMedia[popUpFileIndex].color,
                role: sharedMedia[popUpFileIndex].role,
                createdAt: sharedMedia[popUpFileIndex].createdAt,
                avatar: sharedMedia[popUpFileIndex].avatar,
                avatarUrl: sharedMedia[popUpFileIndex].avatarUrl,
                fileRemotePath: sharedMedia[popUpFileIndex].fileRemotePath,
                own: sharedMedia[popUpFileIndex].own,
                text: sharedMedia[popUpFileIndex].text,
                time: sharedMedia[popUpFileIndex].time,
                link: sharedMedia[popUpFileIndex].link,
                linkTags: sharedMedia[popUpFileIndex].linkTags,
            };

            this.setState({
                media: newMedia
            });

            const scrollElement = document.getElementById("popup_footer");
            const activeMedia = scrollElement.querySelector(`#${sharedMedia[popUpFileIndex].msgId}`);

            if (activeMedia instanceof HTMLElement) {
                if (scrollElement.scrollLeft > activeMedia.offsetLeft) {
                    scrollElement.scrollLeft = activeMedia.offsetLeft - 5;
                } else if (activeMedia.offsetLeft + activeMedia.offsetWidth > scrollElement.offsetWidth + scrollElement.scrollLeft) {
                    scrollElement.scrollLeft = activeMedia.offsetLeft - scrollElement.offsetWidth + activeMedia.offsetWidth + 5;
                }
            }
        }

    };

    handleNotificationOnClick = async ({currentTarget}: any) => {

        const {attemptSetSelectedThread, conversations, selectedThreadId, FETCH_THREAD} = this.props;

        if (!currentTarget.data) {
            return false;
        }

        const {conversations: {threadId}} = currentTarget.data;

        if (selectedThreadId !== threadId) {
            let thread = conversations.get(threadId);
            if (!thread) {
                thread = await IDBConversation.getThread(threadId);
            }
            if (thread) {
                if ((window as any).isRefactor) {
                    FETCH_THREAD(threadId);
                } else {
                    const activeThreadElement = document.querySelector("li.thread_block.active");
                    activeThreadElement && activeThreadElement.classList.remove("active");
                    attemptSetSelectedThread(thread.size > 0 ? thread.toJS() : thread);
                }
            }

        } else {
            window.focus();
        }

        /*const senderThread: any = fromJS(currentTarget.data);
        const {isGroup} = getThreadType(senderThread.getIn(['threads', 'threadType']));


        if (senderThread.getIn(["conversations", "newMessagesIds"]).size > 0) {
            senderThread.getIn(["conversations", "newMessagesIds"]).map(id => {
                const to: string = senderThread.getIn(["threads", "threadId"]).split("/").shift();
                sendMessageSeen(to, id, user.get("username"), isGroup);
            });

            resetConversationNewMessagesIds(senderThread.getIn(["threads", "threadId"]));
        }
        */



        if ((window as any).isMac) (window as any).ipcRenderer.send('showWindow');
        !(window as any).isWin && currentTarget.close && currentTarget.close();
    };

    handleNotificationOnShow = ({currentTarget}: any) => {
        const {data: {conversations: {threadId}}} = currentTarget;

        const {conversations, notification, user} = this.props;
        /*const thread: any = conversations.find(storeThread => storeThread.get("id") === threadId);*/
        const thread: any = conversations.get(threadId);

        if (!thread || thread.size === 0) {
            return false;
        }

        const {isGroup} = getThreadType(thread.getIn(['threads', 'threadType']));

        const threadInfo = getThread(thread, user.get("username"));
        const messageSound: boolean = isGroup ? notification.get("groupSound") : notification.get("sound");

        if (messageSound && !threadInfo.get("muted")) {
            this.playSound();
        }

    };

    onMediaKeyDown = (event: KeyboardEvent) => {
        const {media, map, popUpFileIndex, sharedMedia} = this.state;
        switch (event.key) {
            case "ArrowRight":
                if (media && popUpFileIndex < sharedMedia.length - 1) {
                    this.showOtherMedia(MEDIA_POPUP_ACTIONS.right);
                }
                break;
            case "ArrowLeft":
                if (media && popUpFileIndex > 0) {
                    this.showOtherMedia(MEDIA_POPUP_ACTIONS.left);
                }
                break;
            case "Escape":
                if (media) {
                    this.togglePopUp(media.type);
                }
                if (map) {
                    this.toggleMap();
                }
                break;
            default:
                break;
        }
    };

    setAudioRef = (ref: HTMLAudioElement) => {
        this.audio = ref;
    };

    handleKeyPress = (event: any) => {
        // Todo change below this (refactor)
        // if ((window as any).getSelection() && !event.target.className.includes("smile")) {
        //     // clearSelection();
        // }
    };

    checkProfilePopUpState = (event: any) => {
        const {app, toggleProfilePopUp} = this.props;

        if (app.showProfilePopUp) {
            let mustClose: boolean = true;
            for (const el of event.path) {
                if (["user_icon", "profile-popup"].includes(el.className)) {
                    mustClose = false;
                }
            }
            if (mustClose) {
                toggleProfilePopUp();
            }
        }

        if ((window as any).shell && event.target && event.target.hasAttribute('href') && event.target.href) {
            event.preventDefault();
            (window as any).shell.openExternal(event.target.href);
        }
    };

    connectHandler = (status: any) => {
        const {XMPPConnected, XMPPDisconnected, pendingRequests, privacy, sendCarbonEnablingXML, SIGN_OUT} = this.props;
        const userCredentials: ICredentials = getCredentials();
        const username: string = userCredentials["X-Access-Number"];
        const accessToken: string = userCredentials["X-Access-Token"];
        let connecting: boolean = false;

        Log.i("connection -> XMPPConnected -> strophe Status = ", Strophe.Status)
        Log.i("connection -> XMPPConnected -> Status = ", status)

        if (!userCredentials) {
            writeLog(LOG_TYPES.user, {
                fn: "connectHandler",
                reason: "User Credentials aren't exist"
            });
            return null;
        }

        const connectionUsername: string = getConnectionUsername(username);

        if (status === Strophe.Status.CONNECTING) {
            writeLog(LOG_TYPES.connection, {
                msg: "CONNECTING",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "CONNECTING",
                username
            })



            connecting = true;

            Log.i("connection -> XMPPConnected -> connecting = 1", connecting)
        } else if (status === Strophe.Status.CONNECTED) {
            writeLog(LOG_TYPES.connection, {
                msg: "CONNECTED",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "CONNECTED",
                username
            })
            sendCarbonEnablingXML(`${getConnectionUsername(username)}`);
            XMPPConnected(handlers(this.showNotification), pendingRequests, privacy.get("showOnlineStatus"));
            PendingQueue.instance.forceResendFromDb()
            Log.i("connection -> XMPPConnected -> connecting = 2", connecting)
        } else if (status === Strophe.Status.DISCONNECTED) {

            if (connectionUsername.length > 0 && accessToken.length > 0) {
                XMPPDisconnected(connectionUsername, accessToken, this.connectHandler);
                const connection = connectionCreator.getConnection();
                if (connection.connected) {
                    // connection.disconnect();

                    const event = new Date()
                    Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                        msg: "Connected after disconnected",
                        username
                    })
                }

            }
            console.dir("DISCONNECTED");
            Log.i("connection -> XMPPConnected -> connecting = 3", connecting)
        } else if (status === Strophe.Status.AUTHENTICATING) {
            writeLog(LOG_TYPES.connection, {
                msg: "AUTHENTICATING",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "AUTHENTICATING",
                username
            })
            console.dir("AUTHENTICATING");
            Log.i("connection -> XMPPConnected -> connecting = 4", connecting)
        } else if (status === Strophe.Status.DISCONNECTING) {
            writeLog(LOG_TYPES.connection, {
                msg: "DISCONNECTING",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "DISCONNECTING",
                username
            })
            console.dir("DISCONNECTING");
            Log.i("connection -> XMPPConnected -> connecting = 5", connecting)
        } else if (status === Strophe.Status.CONNFAIL) {
            writeLog(LOG_TYPES.connection, {
                msg: "CONNFAIL",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "CONNFAIL",
                username
            })
            console.dir("CONNFAIL");
            Log.i("connection -> XMPPConnected -> connecting = 6", connecting)
        } else if (status === Strophe.Status.AUTHFAIL) {
            writeLog(LOG_TYPES.connection, {
                msg: "AUTHFAIL",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "AUTHFAIL",
                username
            })
            console.dir("AUTHFAIL");
            Log.i("connection -> XMPPConnected -> connecting = 7", connecting)
        } else if (status === Strophe.Status.ATTACHED) {
            writeLog(LOG_TYPES.connection, {
                msg: "ATTACHED",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "ATTACHED",
                username
            })
            console.dir("ATTACHED");
            Log.i("connection -> XMPPConnected -> connecting = 8", connecting)
        } else if (status === Strophe.Status.REDIRECT) {
            writeLog(LOG_TYPES.connection, {
                msg: "REDIRECT",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "REDIRECT",
                username
            })
            console.dir("REDIRECT");
            Log.i("connection -> XMPPConnected -> connecting = 9", connecting)
        } else if (status === Strophe.Status.ERROR) {
            writeLog(LOG_TYPES.connection, {
                msg: "ERROR",
                username
            }, LOGS_LEVEL_TYPE.error);
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "ERROR",
                username
            })
            console.dir("ERROR");
            Log.i("connection -> XMPPConnected -> connecting = 10", connecting)
        }

        if ((status === Strophe.Status.CONNTIMEOUT || status === Strophe.Status.CONNFAIL) && userCredentials) {
            Log.i("connection -> XMPPConnected -> connecting = 11", connecting)
            const connection: any = connectionCreator.getConnection();
            // const msg: Strophe.Builder = backgroundXML();
            // if (connection.connected) {
            //     connection.send(msg);
            // }
            connection.disconnect();
        }


        if ((status === Strophe.Status.AUTHFAIL || status === Strophe.Status.CONNTIMEOUT) && userCredentials) {
            Log.i("connection -> XMPPConnected -> connecting = 12", connecting)
            writeLog(LOG_TYPES.connection, {
                msg: "AUTHFAIL",
                info: "sign in from another resource",
                username
            });
            const event = new Date()
            Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
                msg: "AUTHFAIL",
                info: "sign in from another resource",
                username
            })
            SIGN_OUT(false, false);
        }

        Log.i("connection -> XMPPConnected -> connecting = 13", connecting)


        if (connecting) {
            iv = setTimeout(() => {
                XMPPDisconnected(connectionUsername, accessToken, this.connectHandler);
            }, 10000);
        } else {
            clearInterval(iv);
        }
    };

    deleteMessage = (message?: any) => {
        const {user, DELETE_SHARED_MEDIA_MESSAGES} = this.props;
        const {media} = this.state;
        const id = message.get("id") || message.get("messageId");
        const threadId = message.get("threadId");

        if (media && id && id === media.id) {
            this.showOtherMedia("left", null, true, id);
        }

        const deletedMessage: any = {
            to: message.get("threadId").split("/").shift(),
            msgText: message.get("text") || OFFLINE_MESSAGE_BODY,
            msgType: MESSAGE_TYPES.delete_msg,
            rel: id,
            type: XML_MESSAGE_TYPES.chat,
            author: user.get("username"),
            id: `msgId${Date.now()}`,
            msgInfo: ""
        };

        if (message.get("threadId") && message.get("threadId").includes(GROUP_CONVERSATION_EXTENSION)) {
            deletedMessage.type = XML_MESSAGE_TYPES.group;
        }

        const checkedFilesCount: any = {
            media: 0,
            file: 0,
            link: 0,
            total: 0
        };

        if ([MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(message.get("type"))) {
            checkedFilesCount.media = checkedFilesCount.media + 1;
        }

        if ([MESSAGE_TYPES.file, MESSAGE_TYPES.voice].includes(message.get("type"))) {
            checkedFilesCount.file = checkedFilesCount.media + 1;
        }

        checkedFilesCount.total = checkedFilesCount.total + 1;

        if (id && threadId) {
            DELETE_SHARED_MEDIA_MESSAGES([id], checkedFilesCount, false, []);
        }
    };

    playSound = () => {
        this.audio.play();
    };

    setIgnoreFalse = () => {
        this.setState({ignore: false})
    };

    setIgnoreTrue = () => {
        this.setState({ignore: true})
    };

    handleOffline = () => {
        const {app} = this.props;

        if (app.applicationState.isOnline) {
            writeLog(LOG_TYPES.internet, {
                status: "online",
                loginPage: false
            });
            this.setState({disconnected: false})

        } else {
            writeLog(LOG_TYPES.internet, {
                status: "offline",
                loginPage: false
            });
            this.setState({disconnected: true});
            const connection = connectionCreator.getConnection();
            if (connection.connected) connection.disconnect();
        }
    };

    onlineHandler = () => {
        const {checkForFailedSync} = this.props;
        this.handleOffline();
        checkForFailedSync();
    };

    handleNetworkOpen = (event?: any, args?: Array<string>) => {
        const {attemptGetNetwork} = this.props;
        let argv = args || (window as any).remote.process.argv;

        if ((window as any).isMac && !args && (window as any).remote.getGlobal('globalValues').link) {
            argv = [(window as any).remote.getGlobal('globalValues').link];
        }
        if (Array.isArray(argv)) {
            const networkIndex = argv.findIndex(x => x.includes(`${URL_SCHEME}://`));
            if (networkIndex > -1) {
                const networkMatch: any = argv[networkIndex].match(/\A?token=[^&]+&*/);
                if (networkMatch[0]) {
                    const networkToken = networkMatch[0].replace("token=", "");
                    attemptGetNetwork(networkToken, true);
                }
            }
        }
    };

    checkForSleepMode = (connection) => {
        let last = (new Date()).getTime();
        setInterval(() => {
            const current = (new Date()).getTime();
            if (current - last > 3000) {
                if (connection.connected) {
                    connection.disconnect();
                }
            }
            last = current;
        }, 1000);
    };

    handleNotificationClick = (event, senderThread) => {
        this.handleNotificationOnClick({
            currentTarget: {
                data: senderThread
            }
        });
        (window as any).ipcRenderer.send('showWindow');
    };

    handleDragDrop = (e) => {
        e.preventDefault();
    };

    handleAppUpdate = (event, reply) => {
        if (reply.action === 'UPDATE_AVAILABLE' && !reply.error) {
            const {attemptCheckForUpdates} = this.props;
            const isAvailable = true;
            const count = 1;
            attemptCheckForUpdates(isAvailable, count);
        }
    };

    handleLogInfo = (event, info: any) => {
        //
    };

    sendErrorReport = (event: any, error: any) => {
        Raven.captureException("Error from NODE: " + error);
    };

    handleNewMediaSet = (state: any) => {
        this.setState({media: state})
    };

    handleNewSharedMediaSet = (state: any) => {
        this.setState({sharedMedia: state})
    };

    componentDidCatch(error, info) {
        // Display fallback UI
        Raven.captureException("Crash Error: " + error + " " + info);
        if (process.env.NODE_ENV === "production") {
            location.reload();
        }
    }

    handleNetworkPopUpClose = (): void => {
        this.props.setNetworkKickedPopUp(false);
    };

    get rightPanel(): string {
        const {app, selectedThread} = this.props;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const threadIsEmpty = selectedThread && selectedThread.get("threads").isEmpty();

        if (threadIsEmpty) {
            return app.rightPanel;
        }

        if (!threadIsEmpty && !isGroup && selectedThread && selectedThread.size > 0 && [RIGHT_PANELS.contact_info, RIGHT_PANELS.group_info].includes(app.rightPanel)) {
            return RIGHT_PANELS.contact_info;
        } else if ([RIGHT_PANELS.contact_info].includes(app.rightPanel) && isGroup) {
            return RIGHT_PANELS.group_info;
        } else {
            return app.rightPanel;
        }
    }

    handleAddMembersPopUpClose = () => {
        this.setState({isAddMemberPopUpShown: false})
    };

    handleAddMembersPopUpOpen = () => {
        this.setState({isAddMemberPopUpShown: true})
    };

    render(): JSX.Element {
        const {
            ignore, title, options, media, map, callDetails, sharedMedia, disconnected, popUpFileIndex,
            isAddMemberPopUpShown,
        } = this.state;
        const {
            app, languages, user, downloadFile, setSendingLocation, lastCall, updateVideoMessage, messages, sharedMediaMessages,
            networkKickedPopUp, addMembers, selectedThreadId, contacts, BLOCK_CONTACT, UNBLOCK_CONTACT,
            conversations, attemptSendForwardMessage, isRedialScreenShown, updateCallPanel, conferenceDetails,
            toggleSettingsPopup, toggleAddMembersPopup, toggleUnMutePopup, toggleInitiatorPopup, changeInitiatorAccess,
            toggleCanNotDoCall, toggleCanNotDeleteGroup, toggleAnotherCallPopup, toggleLeaveGroupCallPopup, leave,
        } = this.props;
        const localization: any = components().app;
        const selectedThread = conversations.get(selectedThreadId)
        const threadIsEmpty = selectedThread && selectedThread.get("threads") && selectedThread.get("threads").isEmpty();

        const setParentStateFromCallPanel: any = ({minimized, showChat}) => {
            if (typeof (minimized) !== "undefined" && typeof (showChat) !== "undefined") {
                updateCallPanel(minimized, showChat)
            } else if (typeof (minimized) !== "undefined" && typeof (showChat) === "undefined") {
                updateCallPanel(minimized, app.showChat);
            } else if (typeof (minimized) === "undefined" && typeof (showChat) !== "undefined") {
                updateCallPanel(app.minimized, showChat);
            }
        };

        return (
            app.loading ?
                (
                    <LoadingPage>
                        <Loader/>
                    </LoadingPage>
                ) :
                (
                    <div
                        onClick={() => {
                            if (document.getElementById("media-popup")) {
                                document.getElementById("media-popup").focus();
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                app.sendingLocation && setSendingLocation(null)
                            }
                        }}
                      ref={this.contentEl}
                      className="app"
                      style={{
                          // opacity: this.state.opacity,
                          // transition: "opacity 0.125s ease-in-out",
                          // width: this.state.resizeWidth,
                          // height: this.state.resizeHeight,
                          // transform: `scale(${this.state.resizeWidth/this.state.clientWidth}, ${this.state.resizeHeight/this.state.clientHeight})`,
                          // transition: "all 0.125s ease-in-out",
                          // transitionDelay: "0s"
                      }}
                    >
                        <LeftMenu/>
                        {/*{*/}
                        {/*    ((callDetails && Object.keys(callDetails).length === 3) || ((lastCall || isRedialScreenShown))) &&*/}
                        {/*    <CallPanel*/}
                        {/*        showNotification={this.showNotification}*/}
                        {/*        removeCallDetails={this.removeCallDetails}*/}
                        {/*        setParentState={setParentStateFromCallPanel}*/}
                        {/*        callDetails={callDetails}*/}
                        {/*        minimized={app.minimized}*/}
                        {/*        showChat={app.showChat}*/}
                        {/*        threadIsEmpty={threadIsEmpty}*/}
                        {/*        handleInviteToCall={this.inviteToCall}*/}
                        {/*    />*/}
                        {/*}*/}
                        {app.leftPanel === LEFT_PANELS.payments &&
                            <WebViewContent /> }
                        <div

                            style={{
                                display: app.leftPanel === LEFT_PANELS.payments ? "none" : "flex"
                            }}
                            className="app-main">
                            {
                                (window as any).isRefactor && selectedThreadId !== '' ?
                                    <HeaderNew
                                        inviteToCall={this.inviteToCall}
                                        rightPanel={this.rightPanel}
                                        disconnected={disconnected}
                                        alreadyInCall={!!((callDetails && Object.keys(callDetails).length === 3) || lastCall)}
                                        handleMediaPopUpOpen={this.togglePopUp}
                                        handleAddMembersPopUpOpen={this.handleAddMembersPopUpOpen}
                                    /> :
                                    <HeaderOld
                                        inviteToCall={this.inviteToCall}
                                        lang={languages.get("selectedLanguage")}
                                        showRightPanel={app.showRightPanel}
                                        rightPanel={this.rightPanel}
                                        user={user}
                                        disconnected={disconnected}
                                        alreadyInCall={!!((callDetails && Object.keys(callDetails).length === 3) || lastCall)}
                                        handleMediaPopUpOpen={this.togglePopUp}
                                        handleAddMembersPopUpOpen={this.handleAddMembersPopUpOpen}
                                        currentThread={selectedThreadId && contacts.get(selectedThreadId) ? contacts.get(selectedThreadId) : selectedThreadId && conversations.get(selectedThreadId) ? conversations.get(selectedThreadId) : false}
                                        isRedialScreenShown={isRedialScreenShown}
                                    />
                            }

                            <div className={`app-content${disconnected ? " no-internet" : ""}`}>
                                <LeftPanel leftPanel={app.leftPanel}/>
                                <div className="chat-content">
                                    <ChatPanel
                                        togglePopUp={this.togglePopUp}
                                        toggleMap={this.toggleMap}
                                        handleAudioChange={this.handleAudioChange}
                                        inviteToCall={this.inviteToCall}
                                        removeCallDetails={this.removeCallDetails}
                                        callDetails={callDetails}
                                        showNotification={this.showNotification}
                                    />

                                    {conversations.get(selectedThreadId) || contacts.get(selectedThreadId) ? <RightPanel
                                      rightPanel={this.rightPanel}
                                      togglePopUp={this.togglePopUp}
                                      handleAudioChange={this.handleAudioChange}
                                      disconnected={disconnected}
                                      handleAddMembersPopUpOpen={this.handleAddMembersPopUpOpen}
                                    /> : ''}
                                </div>
                            </div>
                            {/*<div style={{*/}
                            {/*    display: "none"*/}
                            {/*}}>*/}
                            {/*    {<Picker*/}
                            {/*        // onSelect={(emoji) => emojiClick(emoji)}*/}
                            {/*        set="apple"*/}
                            {/*        autoFocus={false}*/}
                            {/*        emojiSize={26}*/}
                            {/*        color="#3f83c7"*/}
                            {/*        i18n={{*/}
                            {/*            categories: {*/}
                            {/*                search: 'Search Results',*/}
                            {/*                recent: 'Frequently Used',*/}
                            {/*                smileys: 'Smileys & Emotion',*/}
                            {/*                people: 'People & Body',*/}
                            {/*                nature: 'Animals & Nature',*/}
                            {/*                foods: 'Food & Drink',*/}
                            {/*                activity: 'Activity',*/}
                            {/*                places: 'Travel & Places',*/}
                            {/*                objects: 'Objects',*/}
                            {/*                symbols: 'Symbols',*/}
                            {/*                flags: 'Flags',*/}
                            {/*                custom: 'Custom',*/}
                            {/*            },*/}
                            {/*        }}*/}
                            {/*    />}*/}
                            {/*</div>*/}
                            <ReactCSSTransitionGroup
                                transitionName={{
                                    enter: 'open',
                                    leave: 'close',
                                }}
                                component="div"
                                transitionEnter={true}
                                transitionLeave={true}
                                transitionEnterTimeout={300}
                                transitionLeaveTimeout={230}>
                                {
                                    networkKickedPopUp &&
                                    <PopUpMain
                                        confirmButton={this.handleNetworkPopUpClose}
                                        confirmButtonText={localization.ok}
                                        titleText={localization.title}
                                        infoText={localization.kickedFromNetwork}
                                        showPopUpLogo={true}
                                    />
                                }

                                {
                                    isAddMemberPopUpShown &&
                                    <AddMembersPopup
                                        handleAddMembersPopUpClose={this.handleAddMembersPopUpClose}
                                        selectedThread={conversations.get(selectedThreadId)}
                                        addMembers={addMembers}
                                    />
                                }
                            </ReactCSSTransitionGroup>

                            {!((window as any).isWin || (window as any).isMac) && <Notification
                                onPermissionGranted={this.setIgnoreFalse}
                                onClick={this.handleNotificationOnClick}
                                onPermissionDenied={this.setIgnoreTrue}
                                onShow={this.handleNotificationOnShow}
                                notSupported={this.setIgnoreTrue}
                                options={options}
                                ignore={ignore}
                                timeout={5000}
                                title={title}
                            />}
                            <Audio setRef={this.setAudioRef} fileName="sound"/>
                            {media && <MediaPopUp
                                onMediaKeyDown={this.onMediaKeyDown}
                                showOtherMedia={this.showOtherMedia}
                                deleteMessage={this.deleteMessage}
                                closePopUp={this.togglePopUp}
                                downloadFile={downloadFile}
                                selectedThread={conversations.get(selectedThreadId)}
                                messages={messages}
                                sharedMediaMessages={sharedMediaMessages}
                                media={media}
                                popUpFileIndex={popUpFileIndex}
                                sharedMedia={sharedMedia}
                                handleNewMediaSet={this.handleNewMediaSet}
                                handleNewSharedMediaSet={this.handleNewSharedMediaSet}
                                updateVideoMessage={updateVideoMessage}

                                user={user}
                                selectedThreadId={selectedThreadId}
                                conversations={conversations}
                                actions={{
                                    BLOCK_CONTACT,
                                    UNBLOCK_CONTACT,
                                    attemptSendForwardMessage
                                }}
                            />}
                            {map && <MapPopUp
                                onMediaKeyDown={this.onMediaKeyDown}
                                closePopUp={this.toggleMap}
                                location={map.location}
                                lng={map.lng}
                                lat={map.lat}
                            />}
                        </div>
                        {conferenceDetails.get("settingsPopup") && <ConferenceSettings
                            conferenceDetails={conferenceDetails}
                            conversations={conversations}
                            toggleSettingsPopup={toggleSettingsPopup}
                            toggleAddMembersPopup={toggleAddMembersPopup}
                        />}
                        {conferenceDetails.get("unMutePopup") && <UnMutePopup
                            // toggleUnMutePopup={toggleUnMutePopup}
                            // setConferenceProperty={setConferenceProperty}
                            // toggleMemberMuted={toggleMemberMuted}
                            // user={user}
                        />}
                        {conferenceDetails.get("initiatorPopup") && <ChangeInitiator
                            conferenceDetails={conferenceDetails}
                            toggleSettingsPopup={toggleSettingsPopup}
                            toggleAddMembersPopup={toggleAddMembersPopup}
                            toggleInitiatorPopup={toggleInitiatorPopup}
                            changeInitiatorAccess={changeInitiatorAccess}
                        />}
                        {conferenceDetails.get("leaveGroupCallPopup") && app.minimized && <LeaveGroupCallPopup
                            leave={leave}
                            toggleLeaveGroupCallPopup={toggleLeaveGroupCallPopup}
                            toggleInitiatorPopup={toggleInitiatorPopup}
                        />}
                        {app.canNotDoCallPopup && <CanNotDoCall toggleCanNotDoCall={toggleCanNotDoCall} />}
                        {app.canNotDeleteGroupPopup && <CanNotDeleteGroup toggleCanNotDeleteGroup={toggleCanNotDeleteGroup}/>}
                        {conferenceDetails.get("anotherCallPopup") && <AnotherCallPopup toggleAnotherCallPopup={toggleAnotherCallPopup}/>}
                    </div>
                )
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    XMPPConnected: (handlers, pendingRequests, showOnlineStatus) => dispatch(XMPPConnected(handlers, pendingRequests, showOnlineStatus)),
    XMPPDisconnected: (username, accessToken, connectionHandler) => dispatch(XMPPDisconnected(username, accessToken, connectionHandler)),
    updateCallPanel: (minimized, showChat) => dispatch(updateCallPanel(minimized, showChat)),
    sendMessageSeen: (to, id, author, isGroup) => dispatch(sendMessageSeen(to, id, author, isGroup)),
    sendCarbonEnablingXML: (from) => dispatch(sendCarbonEnablingXML(from)),
    resetConversationNewMessagesIds: id => dispatch(resetConversationNewMessagesIds(id)),
    resetGroupNewMessagesIds: id => dispatch(resetGroupNewMessagesIds(id)),
    resendRequests: requests => dispatch(resendRequests(requests)),
    attemptDeleteMessage: (id, message) => dispatch(attemptDeleteMessage(id, message)),
    checkMutedConversations: (encodedUsername) => dispatch(checkMutedConversations(encodedUsername)),
    checkForFailedSync: () => dispatch(checkForFailedSync()),
    downloadFile: (downloadInfo) => dispatch(downloadFile(downloadInfo)),
    setSendingLocation: (location) => dispatch(setSendingLocation(location)),
    changeRightPanel: panel => dispatch(changeRightPanel(panel)),
    setSelectedThreadId: id => dispatch(setSelectedThreadId(id)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    removeLoading: () => dispatch(removeLoading()),
    attemptSetSelectedThread: (thread) => dispatch(attemptSetSelectedThread(thread)),
    deleteSharedMediaMessages: (messageId) => dispatch(deleteSharedMediaMessages(messageId)),
    messageLocalDelete: (id, threadId) => dispatch(messageLocalDelete(id, threadId, true)),
    attemptGetNetwork: (id, token) => dispatch(attemptGetNetwork(id, token)),
    SIGN_OUT: (shouldDeleteHistory: boolean, sessionExpired: boolean) => dispatch(SIGN_OUT(shouldDeleteHistory, sessionExpired)),
    attemptCheckForUpdates: (isAvailable, count) => dispatch(attemptCheckForUpdates(isAvailable, count)),
    updateVideoMessage: (msgId) => dispatch(updateVideoMessage(msgId)),
    setNetworkKickedPopUp: (networkKickedPopUp: boolean) => dispatch(setNetworkKickedPopUp(networkKickedPopUp)),
    startCall: () => dispatch(startCall()),
    endCall: () => dispatch(endCall()),
    DELETE_SHARED_MEDIA_MESSAGES: (messageIds: string[], checkedFilesCount: any, isDeleteEveryWhere: boolean, ownMessages: any[]) => dispatch(DELETE_SHARED_MEDIA_MESSAGES(messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages)),
    addMembers: (groupId, members, isManualAdd) => dispatch(inviteGroupMembers(groupId, members, isManualAdd)),
    FETCH_THREAD: (threadId: string) => dispatch(FETCH_THREAD(threadId)),
    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds)),
    BLOCK_CONTACT: (contactIds: string[]) => dispatch(BLOCK_CONTACT(contactIds)),
    attemptSendForwardMessage: (messages: any, threadIds: string[], emailsMap: { [key: string]: string }) => dispatch(attemptSendForwardMessage(messages, threadIds, emailsMap)),
    toggleSettingsPopup: (settingsPopup: boolean) => dispatch(toggleSettingsPopup(settingsPopup)),
    toggleAddMembersPopup: (addMembersPopup: boolean) => dispatch(toggleAddMembersPopup(addMembersPopup)),
    toggleUnMutePopup: (unMuteBool: boolean) => dispatch(toggleUnMutePopup(unMuteBool)),
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => dispatch(setConferenceProperty(propertyId, value)),
    toggleMemberMuted: (memberId: string, muted: boolean) => dispatch(toggleMemberMuted(memberId, muted)),
    toggleInitiatorPopup: (initiatorPopup: boolean) => dispatch(toggleInitiatorPopup(initiatorPopup)),
    changeInitiatorAccess: (groupId: string, member: string) => dispatch(changeInitiatorAccess(groupId, member)),
    toggleCanNotDoCall: (canNotDoCall: boolean) => dispatch(toggleCanNotDoCall(canNotDoCall)),
    toggleCanNotDeleteGroup: (canNotDoCall: boolean) => dispatch(toggleCanNotDeleteGroup(canNotDoCall)),
    toggleAnotherCallPopup: (anotherCall) => dispatch(toggleAnotherCallPopup(anotherCall)),
    toggleLeaveGroupCallPopup: (leaveGroupCallPopup: boolean) => dispatch(toggleLeaveGroupCallPopup(leaveGroupCallPopup)),
    leave: () => dispatch(leave()),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
