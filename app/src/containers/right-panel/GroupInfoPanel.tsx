"use strict";

import * as React from "react";
import {fromJS, List, Map} from "immutable";
import format from "date-fns/format";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    ADD_MEMBERS_PLACES,
    DEFAULT_TIME_FORMAT,
    DELETE_GROUP_MEMBER_ACTIONS,
    GROUP_ROLES,
    GROUP_SETTINGS_PANEL_TYPE, IMAGE_TOGGLE,
    LEAVE_GROUP_ACTIONS,
    MESSAGE_TYPES,
    RIGHT_PANELS,
    SHARED_MEDIA_TABS, VIDEO_TOGGLE
} from "configs/constants";
import {
    CONFERENCE_COMMANDS,
    MESSAGE_XMLNS,
    OWNER_LEAVE_COMMAND,
    SINGLE_CONVERSATION_EXTENSION,
    XML_MESSAGE_TYPES
} from "xmpp/XMLConstants";
import GroupSettingsPanel from "containers/right-panel/GroupSettingsPanel";
import GroupMembersPopUp from "components/contacts/GroupMembersPopUp";
import NotificationsPopUp from "components/common/NotificationsPopUp";
import IDBConversation from "services/database/class/Conversation";
import {getThreadType, getUsername} from "helpers/DataHelper";
import {getThumbnail, setAWSFiles} from "helpers/FileHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import {IRequest} from "modules/requests/RequestsReducer";
import connectionCreator from "xmpp/connectionCreator";
import PopUpMain from "components/common/PopUpMain";
import GroupInfo from "components/group/GroupInfo";
import Contact from "components/contacts/Contact";
import components from "configs/localization";
import conf from "configs/configurations";
import xmlToJson from "xmpp/xmlToJson";

import "scss/pages/right-panel/GroupInfo";
import SharedMedia from "containers/SharedMedia";
import shell = Electron.shell;
import ContactInfo from "components/contacts/ContactInfo";
import AddMembersPopup from "components/common/popups/AddMembers";
import ContactInfoPanel from "containers/right-panel/ContactInfoPanel";

// import SharedMedia from "components/shared-media/SharedMedia";
import { RightPanel } from "./style";
import Log from "modules/messages/Log";
import {put} from "redux-saga/effects";

interface IGroupInfoPanelProps {
    attemptLeaveAndChangeOwner: (id: string, owner: string, keepHistory: boolean, requestId: string) => void;
    attemptChangeGroupSettings: (id, settingType, members, role, allow, requestId) => void;
    attemptSendForwardMessage: (messages: any, threadIds: string[]) => void;
    changeRightPanel: (panel: string, addMemberPlace?: string) => void;
    attemptDeleteMember: (id: string, memberUsername: string) => void;
    togglePopUp: (type: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    sendMessage: (messageToSend: any, messageToSave: any) => void;
    attemptMuteConversation: (threadId, expirationDate) => void;
    attemptDeleteMessage?: (id: string, message?: any) => void;
    attemptChangeGroupName: (id: string, name: string) => void;
    updateConversationAvatar: (selectedThreadId: string, avatar: Blob) => void;
    removeGroupMember: (id: string, contactId: string) => void;
    messageLocalDelete: (id: string, threadId: string) => void;
    attemptLeaveGroup: (id: string, username: string) => void;
    attemptSetSharedMediaMessages: (threadId: string) => void;
    deleteGroup: (id: string, keepHistory: boolean) => void;
    updateMessageProperty: (msgId, property, value) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    attemptSetSelectedThread: (thread: any) => void;
    attemptUnmuteConversation: (threadId) => void;
    attemptRemoveGroup: (id, requestId) => void;
    setSearchKeyword: (keyword: string) => void;
    toggleRightPanel: (show: boolean) => void;
    setForwardMessage: (message: any) => void;
    downloadFile: (downloadFile: any) => void;
    toggleGroupMuted: (id: string) => void;
    setGroupSettingsPanel: (type) => void;
    pendingRequests: Map<string, IRequest>;
    removeSharedMediaMessages?: () => void;
    addMessage: (message: any) => void;
    clearForwardMessage: () => void;
    closeSharedMedia: () => void;
    sharedMediaMessages: any;
    forwardMessage: any;
    openSharedMedia: () => void;
    threadIsEmpty: boolean;
    sharedMediaPanel: boolean;
    groupSettingsPanel: number;
    selectedThreadId: any;
    showSharedMedia: any;
    sharedMediaCount: number;
    selectedThread: any;
    threadInfo: any;
    languages: any;
    contacts: any;
    user: any;
    chat: any;
    conversations: any;
    sharedMedia: any
    messages: any;

    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void
    addMembers: (groupId: string, members: string, isManualAdd: boolean) => void;

    handleAddMembersPopUpOpen: () => void;
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    BLOCK_CONTACT: (contactIds: string[]) => void;
    conferenceDetails: any;
    toggleCanNotDeleteGroup?: (canNotDeleteGroup: boolean) => void;
}

interface IGroupInfoPanelState {
    showDeleteMemberPopUp: boolean;
    showSelectOwnerPopUp: boolean;
    showLeaveGroupPopUp: boolean;
    deleteMemberHandlerRef: any;
    ownerSelectKeyword: string;
    keepGroupHistory: boolean;
    isGroupMutePopUp: boolean;
    selectedOwnerId: string;
    sharedMediaTab: string;
    leaveHandlerRef: any;
    groupName: string;
    contact: IContact;
    croppedImage: any;
    editing: boolean;
    groupId: string;
    avatar: Blob;
    image: any;
    file: any;
    avatarBlobUrl: string;
}

export default class GroupInfoPanel extends React.Component<IGroupInfoPanelProps, IGroupInfoPanelState> {

    avatarUploaded: boolean = false;

    pendingUpdates: any = {};

    constructor(props: IGroupInfoPanelProps) {
        super(props);
        this.state = {
            avatar: props.threadInfo.get('avatar'),
            groupName: props.threadInfo.get('name'),
            sharedMediaTab: SHARED_MEDIA_TABS.media,
            deleteMemberHandlerRef: null,
            showDeleteMemberPopUp: false,
            showSelectOwnerPopUp: false,
            showLeaveGroupPopUp: false,
            keepGroupHistory: false,
            isGroupMutePopUp: false,
            ownerSelectKeyword: "",
            leaveHandlerRef: null,
            selectedOwnerId: "",
            croppedImage: null,
            editing: false,
            contact: null,
            image: null,
            groupId: "",
            file: null,
            avatarBlobUrl: props.threadInfo.get('avatarBlobUrl'),
        };
    }

    shouldComponentUpdate(nextProps: IGroupInfoPanelProps, nextState: IGroupInfoPanelState): boolean {

        const {chat, user, showSharedMedia, sharedMediaMessages, threadIsEmpty, selectedThread, contacts, languages, sharedMediaPanel, sharedMedia, groupSettingsPanel, pendingRequests} = this.props;
        const {showDeleteMemberPopUp, contact, showLeaveGroupPopUp, showSelectOwnerPopUp, ownerSelectKeyword, selectedOwnerId, isGroupMutePopUp, sharedMediaTab, groupName, editing, image} = this.state;


        if (!chat.equals(nextProps.chat)) {
            return true;
        }

        if (!user.equals(nextProps.user)) {
            return true;
        }

        if (showSharedMedia != nextProps.showSharedMedia) {
            return true;
        }

        if (!sharedMediaMessages.equals(nextProps.sharedMediaMessages)) {
            return true;
        }

        if (!isEqual(sharedMedia, nextProps.sharedMedia)) {
            return true;
        }

        if (!threadIsEmpty && !selectedThread.equals(nextProps.selectedThread)) {
            return true;
        }

        if (contacts && !contacts.equals(nextProps.contacts)) {
            return true;
        }

        if (languages.get("selectedLanguage") !== nextProps.languages.get("selectedLanguage")) {
            return true
        }

        if (sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (groupSettingsPanel !== nextProps.groupSettingsPanel) {
            return true;
        }

        if (!pendingRequests.equals(nextProps.pendingRequests)) {
            return true;
        }

        if (!isEqual(this.props.forwardMessage, nextProps.forwardMessage)) {
            return true
        }

        if (!isEqual(this.props.messages, nextProps.messages)) {
            return true
        }

        return showDeleteMemberPopUp !== nextState.showDeleteMemberPopUp ||
            contact && !contact.equals(nextState.contact) ||
            showLeaveGroupPopUp !== nextState.showLeaveGroupPopUp ||
            showSelectOwnerPopUp !== nextState.showSelectOwnerPopUp ||
            ownerSelectKeyword !== nextState.ownerSelectKeyword ||
            selectedOwnerId !== nextState.selectedOwnerId ||
            isGroupMutePopUp !== nextState.isGroupMutePopUp ||
            sharedMediaTab !== nextState.sharedMediaTab ||
            groupName !== nextState.groupName ||
            editing !== nextState.editing ||
            !isEqual(image, nextState.image);
    }

    componentDidUpdate(prevProps: IGroupInfoPanelProps, prevState: IGroupInfoPanelState): void {
        const {sharedMediaPanel, selectedThreadId, pendingRequests, setGroupSettingsPanel, threadIsEmpty, threadInfo, languages} = this.props;
        const {editing} = this.state;
        let avatarBlobUrl

        if(threadInfo && threadInfo.get("avatar")) {
            avatarBlobUrl = (window as any).URL.createObjectURL(threadInfo.get("avatar"))
        }

        if (!threadIsEmpty && !isEqual(prevProps.threadInfo, threadInfo) && selectedThreadId === prevProps.selectedThreadId) {
            this.setState({
                avatar: threadInfo.get("avatar"),
                groupName: threadInfo.get("name"),
                avatarBlobUrl
            });
        }

        if (!threadIsEmpty && selectedThreadId !== prevProps.selectedThreadId) {
            if (editing) {
                this.handleGroupEdit();
            }

            this.setState({
                avatar: threadInfo.get("avatar"),
                groupName: threadInfo.get("name"),
                avatarBlobUrl
            });
            if (sharedMediaPanel) {
                this.handleSharedMediaPanelClose();
            }

            setGroupSettingsPanel(GROUP_SETTINGS_PANEL_TYPE.closed);
        }

        if (prevProps.pendingRequests && this.pendingUpdates[OWNER_LEAVE_COMMAND]) {
            const {showSelectOwnerPopUp} = this.state;
            const requestId: string = this.pendingUpdates[OWNER_LEAVE_COMMAND];

            if (prevProps.pendingRequests.get(requestId) && !pendingRequests.get(requestId) && showSelectOwnerPopUp) {
                delete this.pendingUpdates[OWNER_LEAVE_COMMAND];

                this.setState({
                    showSelectOwnerPopUp: false,
                    selectedOwnerId: "",
                    keepGroupHistory: false
                });
            }
        }
    }

    componentWillUnmount(): void {
        const {sharedMediaPanel} = this.props;

        if (sharedMediaPanel) {
            this.handleSharedMediaPanelClose();
        }
    }

    handleNameChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value) {
            const newState: IGroupInfoPanelState = {...this.state};
            newState[name] = value;
            this.setState(newState);
        }
    };

    handleAvatarChange = ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => {
        if (currentTarget.files[0]) {
            // const avatarBlobUrl = (window as any).URL.createObjectURL(currentTarget.files[0])
            this.setState({image: currentTarget.files[0], avatar: currentTarget.files[0]});
        }

        currentTarget.value = "";
    };

    toggleIsGroupMutePopUp = () => {
        const {isGroupMutePopUp} = this.state;
        this.setState({isGroupMutePopUp: !isGroupMutePopUp});
    };

    deleteMuteTime = () => {
        const {selectedThreadId, attemptUnmuteConversation, threadIsEmpty, threadInfo} = this.props;

        if (!threadIsEmpty) {
            const muted = threadInfo.get("muted");
            if (muted) {
                attemptUnmuteConversation(selectedThreadId);
            }
        }
    };

    setUnlimitTimeMuteIsGroup = () => {
        // this.handleGroupMutedToggle();
        this.deleteMuteTime();
        this.toggleIsGroupMutePopUp();
    };

    setIsGroupMuteTime = (time: number) => {
        const {selectedThreadId, attemptMuteConversation} = this.props;
        attemptMuteConversation(selectedThreadId, time);
        this.toggleIsGroupMutePopUp();
    };

    handleCroppedImageUpdate = (croppedFile: any) => {
        const uploadedAvatar: any = {
            original: this.state.file,
            cropped: croppedFile.avatar
        };
        if (croppedFile.avatar) {
            this.avatarUploaded = true;
            const avatarBlobUrl = (window as any).URL.createObjectURL(croppedFile.avatar)
            this.setState({avatar: croppedFile.avatar, file: uploadedAvatar, image: null, avatarBlobUrl});
        }
    };

    handleCropPopupDismiss = () => {
        this.setState({image: null});
        (document.getElementById("groupPicInput") as any).value = "";
    };

    handleDeleteMemberAction = (chosenAction: string, contact?: any) => {
        if (chosenAction === DELETE_GROUP_MEMBER_ACTIONS.cancel) {
            this.setState({showDeleteMemberPopUp: false})
        } else {
            this.setState({showDeleteMemberPopUp: false}, () => {
                const connection: any = connectionCreator.getConnection();
                if (connection.connected) {
                    const {selectedThreadId, attemptDeleteMember, threadInfo} = this.props;
                    const from: string = selectedThreadId.split("/").join(`/${conf.app.prefix}`);
                    const deleteMemberHandlerRef: any = connection.addHandler(this.handleActionMessage, MESSAGE_XMLNS, "message", XML_MESSAGE_TYPES.group, null, from);

                    this.setState({deleteMemberHandlerRef});
                    attemptDeleteMember(threadInfo.get("partialId"), contact.get("username"));
                }

            });
        }

    };

    handleLeaveGroupAction = (action: string, isOwner: boolean) => {
        const {showLeaveGroupPopUp} = this.state;

        if (action === LEAVE_GROUP_ACTIONS.cancel) {
            this.setState({showLeaveGroupPopUp: false});

        } else {
            if (showLeaveGroupPopUp) {
                this.setState({showLeaveGroupPopUp: false}, () => {

                    if (!isOwner) {
                        const connection: any = connectionCreator.getConnection();
                        const {attemptLeaveGroup, user, threadInfo} = this.props;
                        const leaveHandlerRef: any = connection.addHandler(this.handleActionMessage, MESSAGE_XMLNS, "message", XML_MESSAGE_TYPES.group, null);

                        if (action === "keep") {
                            this.setState({leaveHandlerRef, keepGroupHistory: true});
                        } else {
                            this.setState({leaveHandlerRef});
                        }
                        attemptLeaveGroup(threadInfo.get("partialId"), user.get("username"));

                    } else {
                        this.setState({showSelectOwnerPopUp: true, keepGroupHistory: action === "keep"});
                    }
                });
            }
        }
    };

    handleMemberDelete = (jsonMessage: any) => {
        const {selectedThreadId, removeGroupMember, user, addMessage} = this.props;
        const connection: any = connectionCreator.getConnection();
        const {deleteMemberHandlerRef, contact} = this.state;
        const currentTime: any = Date.now();
        const msgId: string = `msgId${jsonMessage.id}`;
        const message: any = {
            text: `You removed ${contact.get("firstName") ? `${contact.get("firstName")}${contact.get("lastName") ? ` ${contact.get("lastName")}` : ""}` : contact.get("username")}`,
            createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
            fileRemotePath: jsonMessage.fileRemotePath,
            threadId: selectedThreadId,
            type: jsonMessage.msgType,
            info: jsonMessage.msgInfo,
            creator: user.get("id"),
            id: jsonMessage.id,
            time: Date.now(),
            fileSize: null,
            own: false
        };

        // const message: any = {
        //     conversationId: selectedThreadId,
        //     createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
        //     creator: user.get("id"),
        //     deleted: false,
        //     delivered: false,
        //     dislikes: 0,
        //     edited: false,
        //     email: '',
        //     fileLink: '',
        //     fileRemotePath: jsonMessage.fileRemotePath,
        //     fileSize: null,
        //     hidden: undefined,
        //     info: jsonMessage.msgInfo,
        //     isDelivered: false,
        //     isSeen: false,
        //     likeState: 0,
        //     likes: 0,
        //     link: false,
        //     linkTags: List[0],
        //     loadStatus: null,
        //     m_options: null,
        //     messageId: msgId,
        //     id: msgId,
        //     own: false,
        //     pid: undefined,
        //     previousMessageId: undefined,
        //     repid: "",
        //     seen: false,
        //     sid: undefined,
        //     status: false,
        //     text: `You removed ${contact.get("firstName") ? `${contact.get("firstName")}${contact.get("lastName") ? ` ${contact.get("lastName")}` : ""}` : contact.get("username")}`,
        //     ext: "",
        //     threadId: selectedThreadId,
        //     time: currentTime,
        //     type: jsonMessage.msgType,
        // };

        connection.deleteHandler(deleteMemberHandlerRef);
        removeGroupMember(selectedThreadId, jsonMessage.msgInfo.includes(conf.app.prefix) ?
            `${jsonMessage.msgInfo.replace(conf.app.prefix, "")}@${SINGLE_CONVERSATION_EXTENSION}`
            : `${jsonMessage.msgInfo}@${SINGLE_CONVERSATION_EXTENSION}`);
        addMessage(message);
        this.setState({deleteMemberHandlerRef: null, contact: null});
    };

    handleGroupLeave = (jsonMessage: any) => {
        const {selectedThreadId, user, deleteGroup} = this.props;
        const connection: any = connectionCreator.getConnection();
        const {leaveHandlerRef, keepGroupHistory} = this.state;

        connection.deleteHandler(leaveHandlerRef);
        this.setState({showLeaveGroupPopUp: false, leaveHandlerRef: null, keepGroupHistory: false});
        if (jsonMessage.msgType === MESSAGE_TYPES.leave_group && jsonMessage.msgInfo === user.get("username")) {
            deleteGroup(selectedThreadId, keepGroupHistory);
        }
    };

    handleActionMessage = (message: any) => {
        const jsonMessage: any = xmlToJson(message);
        if (jsonMessage.msgType === MESSAGE_TYPES.remove_from_group) {
            this.handleMemberDelete(jsonMessage);
        } else if (jsonMessage.msgType === MESSAGE_TYPES.leave_group) {
            this.handleGroupLeave(jsonMessage);
        }
    };

    handleLeaveGroupPopUpOpen = () => {
        this.setState({showLeaveGroupPopUp: true});
    };

    handleGroupMemberClick = (thread: any) => {
        const {attemptSetSelectedThread} = this.props;
        attemptSetSelectedThread(thread);
    };

    handleGroupMutedToggle = () => {
        const {selectedThreadId, toggleGroupMuted} = this.props;
        toggleGroupMuted(selectedThreadId);
    };

    handleSharedMediaPanelOpen = () => {
        this.props.openSharedMedia();
    };

    handleSharedMediaPanelClose = () => {
        this.props.closeSharedMedia();
    };

    handleGroupEdit = () => {
        const {editing} = this.state;
        const {threadInfo} = this.props;

        if (editing) {
            this.avatarUploaded = false;
            const avatarBlobUrl = threadInfo.get('avatar') ? (window as any).URL.createObjectURL(threadInfo.get('avatar')) : ""
            this.setState({avatar: threadInfo.get('avatar'), groupName: threadInfo.get("name"), avatarBlobUrl})
        }

        this.setState({editing: !editing});
    };

    handleGroupSettingsPanelChange = (type: number) => {
        const {editing} = this.state;
        const {setGroupSettingsPanel} = this.props;
        setGroupSettingsPanel(type);

        if (type === GROUP_SETTINGS_PANEL_TYPE.main && editing) {
            this.setState({editing: false});
        }
    };

    handleAddMembersOpen = () => {
        const {changeRightPanel} = this.props;
        changeRightPanel(RIGHT_PANELS.add_members, ADD_MEMBERS_PLACES.group_members);
    };

    handleRightPanelToggle = () => {
        const {toggleRightPanel} = this.props;
        toggleRightPanel(false);
    };

    handleShowSelectOwnerPopUpClose = () => {
        this.setState({
            showSelectOwnerPopUp: false,
            selectedOwnerId: "",
            keepGroupHistory: false
        });
    };

    handleOwnerSelect = (contactId: string) => {
        const {selectedOwnerId} = this.state;

        if (selectedOwnerId !== contactId) {
            this.setState({selectedOwnerId: contactId});
        }
    };

    handleGroupUpdate = async () => {
        const {groupName, avatar} = this.state;
        const {selectedThreadId, user, sendMessage, attemptChangeGroupName, threadInfo, updateConversationAvatar} = this.props;

        this.setState({editing: false});

        if (avatar !== threadInfo.get("avatar") && this.avatarUploaded) {
            this.avatarUploaded = false;
            const avatarImg = await getThumbnail(avatar, false);
            const groupId = threadInfo.get('partialId');
            const avatarKey: string = `${groupId}/profile/avatar`;
            const dataURI: string = atob(avatarImg.img);
            const ab: ArrayBuffer = new ArrayBuffer(dataURI.length);
            const ia: Uint8Array = new Uint8Array(ab);

            for (let i: number = 0; i < dataURI.length; i++) {
                ia[i] = dataURI.charCodeAt(i);
            }

            const resizedFile: File = new File([ab], "avatar", {type: "image/jpeg"});
            const avatarBlob = new Blob([new Uint8Array(ab)]);
            // const avatarBlobUrl = (window as any).URL.createObjectURL(avatarBlob)

            // const avatarBlobUrl = (window as any).URL.createObjectURL(avatarBlob)
            // this.setState({avatar: avatarBlob, image: null, groupId, avatarBlobUrl});
            const uploadImage: any = await setAWSFiles([
                {
                    bucket: conf.app.aws.bucket.group,
                    path: avatarKey,
                    value: resizedFile,
                }
            ]);
            const messageToSave: any = {
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                type: MESSAGE_TYPES.update_group_avatar,
                threadId: selectedThreadId,
                info: user.get("username"),
                creator: user.get("id"),
                id: `msgId${Date.now()}`,
                fileRemotePath: null,
                text: `#E#F#M#`,
                fileSize: null,
                time: Date.now(),
                own: true
            };

            const messageToSend: any = {
                to: selectedThreadId.split("/").shift(),
                author: messageToSave.creator,
                type: XML_MESSAGE_TYPES.group,
                msgType: messageToSave.type,
                msgText: messageToSave.text,
                msgInfo: messageToSave.info,
                id: messageToSave.id
            };


            sendMessage(messageToSend, messageToSave);
            updateConversationAvatar(selectedThreadId, avatar);
            await IDBConversation.updateThreadInfo(threadInfo.get('id'), {avatar});

            // Todo move upper part to saga
        }

        const updatedGroupName: string = groupName.replace(/  +/g, ' ').trim();

        if (updatedGroupName !== threadInfo.get("name")) {
            attemptChangeGroupName(selectedThreadId, updatedGroupName);
        }

    };

    handleOwnerSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {ownerSelectKeyword} = this.state;
        const _value: string = value.trim().toLowerCase();

        if (ownerSelectKeyword !== _value) {
            this.setState({ownerSelectKeyword: _value});
        }
    };

    handleChangeOwner = () => {
        const {selectedThreadId, attemptLeaveAndChangeOwner} = this.props;
        const {selectedOwnerId, keepGroupHistory} = this.state;
        const requestId: string = `msgId${Date.now()}`;
        this.pendingUpdates[OWNER_LEAVE_COMMAND] = requestId;

        if (selectedOwnerId !== "") {
            attemptLeaveAndChangeOwner(selectedThreadId, getUsername(selectedOwnerId), keepGroupHistory, requestId);
        }
    };

    get members(): List<JSX.Element> {
        const { user, contacts, threadIsEmpty, threadInfo, selectedThreadId, conversations, conferenceDetails} = this.props;
        const selectedThread = conversations.get(selectedThreadId);
        if (threadIsEmpty) {
            return null;
        }

        const {editing} = this.state;
        const localization: any = components().common;

        const isThreadDisabled: boolean = threadInfo && threadInfo.get("disabled");
        const ownerList: any = threadInfo && threadInfo.get("ownerList");
        const adminList: any = threadInfo && threadInfo.get("adminList");
        const allAdmins: boolean = threadInfo && threadInfo.get("allAdmins");
        const members: any = selectedThread.get("members");
        const deleteClass: boolean = allAdmins || adminList.includes(user.get("username")) || ownerList.includes(user.get("username")) && !isThreadDisabled;

        Log.i("conference -> statuses = ", conferenceDetails.get("statuses"))
        const statusMap = threadInfo && threadInfo.get("statusMap")

        const statuses = conferenceDetails.get("statuses");

        // const members = !selectedThreadMembers.has(user.get("id")) && isThreadDisabled ?
        //     selectedThreadMembers.set(user.get("id"), user) : selectedThreadMembers;
        return members && members.valueSeq().map(member => {
            const contactId = member.get("contactId") || member.get("id");
            const groupMember = contacts.get(contactId);
            const username: string = member.get("username");
            const handleMemberClick: any = groupMember && !editing ? () => this.handleGroupMemberClick(groupMember.toJS()) : null; // Todo remove toJS()
            const isOwn: boolean = username === user.get("username");
            const optionBtn: any = (isOwn || isThreadDisabled || ownerList.includes(username)) ? null : {
                text: localization.deleteTxt,
                onClick: () => this.handleDeleteMemberAction(DELETE_GROUP_MEMBER_ACTIONS.confirm, member)
            };

            Log.i("conference -> member status = ", statuses.get(`${username}@msg.hawkstream.com`))

            return (
                <div className="group-member-content">
                    {statusMap && (statusMap.get(`${username}@msg.hawkstream.com`) === CONFERENCE_COMMANDS.calling ||
                        statusMap.get(`${username}@msg.hawkstream.com`) === CONFERENCE_COMMANDS.join) && <span className="in-call">
                        In Call
                    </span>}
                    <Contact
                        key={isOwn ? user.get("id") : contactId}
                        deleteClass={deleteClass}
                        contact={isOwn ? user : groupMember ? groupMember.getIn(["members", contactId]) : null}
                        me={isOwn}
                        showInfo={isOwn ? null : handleMemberClick}
                        groupList={!isOwn}
                        editing={(isOwn || isThreadDisabled) ? false : editing}
                        optionBtn={optionBtn}
                    />
                </div>
            );
        });
    }

    get showGroupSettings() {
        const {threadInfo} = this.props;

        return this.isGroupMember && !threadInfo.get("disabled")
            && ([GROUP_ROLES.admin, GROUP_ROLES.owner].includes(threadInfo.get("role")) || threadInfo.get("allAdmins"));
    }

    get isGroupMember() {
        const {selectedThread, user, threadIsEmpty, threadInfo} = this.props;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const groupMembersUserNames: any = threadInfo && threadInfo.get("groupMembersUsernames");
        const {isGroup} = getThreadType(threadType);
        return !threadIsEmpty && isGroup && groupMembersUserNames && groupMembersUserNames.includes(user.get("username"));
    }

    get content(): JSX.Element {
        const {showDeleteMemberPopUp, showLeaveGroupPopUp, editing, groupName, image, avatar, avatarBlobUrl} = this.state;
        const {
            selectedThread, togglePopUp, handleAudioChange, sharedMediaPanel, showSharedMedia, groupSettingsPanel, user,
            attemptChangeGroupSettings, pendingRequests, attemptRemoveGroup, threadInfo, sharedMedia,
            handleAddMembersPopUpOpen, languages, toggleCanNotDeleteGroup, conferenceDetails
        } = this.props;

        const sharedMediaCount: number = fromJS(sharedMedia).get("total");

        if (groupSettingsPanel && this.showGroupSettings) {
            const groupSettingsLocalization = components().groupSettings;
            return (
                <GroupSettingsPanel
                    toggleCanNotDeleteGroup={toggleCanNotDeleteGroup}
                    attemptRemoveGroup={attemptRemoveGroup}
                    pendingRequests={pendingRequests}
                    attemptChangeGroupSettings={attemptChangeGroupSettings}
                    user={user}
                    selectedThread={selectedThread}
                    threadInfo={selectedThread.getIn(["threads", "threadInfo"])}
                    threadId={selectedThread.getIn(["threads", "threadId"])}
                    type={groupSettingsPanel}
                    handleGroupSettingsPanelChange={this.handleGroupSettingsPanelChange}
                    groupSettingsLocalization={groupSettingsLocalization}
                    groupCallId={conferenceDetails.get("callId")}
                />
            );
        } else {
            return (
                <GroupInfo
                    handleGroupSettingsPanelChange={this.handleGroupSettingsPanelChange}
                    handleSharedMediaPanelOpen={this.handleSharedMediaPanelOpen}
                    handleAddMembersPopUpOpen={handleAddMembersPopUpOpen}
                    //handleDeleteMemberAction={this.handleDeleteMemberAction}
                    handleLeaveGroupPopUpOpen={this.handleLeaveGroupPopUpOpen}
                    handleCroppedImageUpdate={this.handleCroppedImageUpdate}
                    handleLeaveGroupAction={this.handleLeaveGroupAction}
                    handleRightPanelToggle={this.handleRightPanelToggle}
                    toggleIsGroupMutePopUp={this.toggleIsGroupMutePopUp}
                    handleCropPopupDismiss={this.handleCropPopupDismiss}
                    handleAddMembersOpen={this.handleAddMembersOpen}
                    showDeleteMemberPopUp={showDeleteMemberPopUp}
                    handleAvatarChange={this.handleAvatarChange}
                    showGroupSettings={this.showGroupSettings}
                    handleGroupUpdate={this.handleGroupUpdate}
                    showLeaveGroupPopUp={showLeaveGroupPopUp}
                    handleNameChange={this.handleNameChange}
                    handleGroupEdit={this.handleGroupEdit}
                    sharedMediaCount={sharedMediaCount}
                    isGroupMember={this.isGroupMember}
                    showSharedMedia={showSharedMedia}
                    selectedThread={selectedThread}
                    threadInfo={threadInfo}
                    members={this.members}
                    groupName={groupName}
                    editing={editing}
                    avatar={avatar}
                    avatarBlobUrl={avatarBlobUrl}
                    image={image}
                    user={user}
                    handleMediaPopUpOpen={togglePopUp}
                    groupCallId={conferenceDetails.get("callId")}
                />
            )
        }
    }

    get groupMembers() {
        const {selectedThread, user} = this.props;
        const {ownerSelectKeyword} = this.state;
        const groupMembers: any = selectedThread.get("members");

        return groupMembers.filter(groupMember => {
            const name: string = groupMember.get("name");

            return (name && name.toLowerCase().includes(ownerSelectKeyword) ||
                groupMember.get("phone").includes(ownerSelectKeyword))
                && groupMember.get("username") !== user.get("username")
        });
    }

    render(): JSX.Element {
        const {threadIsEmpty, threadInfo, sharedMediaPanel, togglePopUp, handleAudioChange, languages, sharedMediaCount} = this.props;
        if (threadIsEmpty) {
            return null;
        }
        const muted: any = threadInfo.get("muted");
        const {showSelectOwnerPopUp, selectedOwnerId, isGroupMutePopUp} = this.state;
        const notificationsLoc: any = components().muteNotifications;
        const groupSettingsLoc: any = components().groupSettings;


        return (
            <div className="right_bar" style={{position:'relative'}}>
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
                        isGroupMutePopUp && !muted ?
                            <NotificationsPopUp
                                setIsPublicMuteTime={this.setIsGroupMuteTime}
                                toggleIsPublicMutePopUp={this.toggleIsGroupMutePopUp}
                                isPublicMutePopUp={isGroupMutePopUp}
                                setUnlimitTimeMuteIsPublic={this.setUnlimitTimeMuteIsGroup}
                            />
                            : isGroupMutePopUp && muted &&
                            <PopUpMain
                                showPopUpLogo={true}
                                confirmButton={this.setUnlimitTimeMuteIsGroup}
                                confirmButtonText={groupSettingsLoc.confirm}

                                cancelButton={this.toggleIsGroupMutePopUp}
                                cancelButtonText={groupSettingsLoc.cancel}

                                titleText={notificationsLoc.title}
                                infoText={notificationsLoc.turnOff}
                            />
                    }
                    {
                        showSelectOwnerPopUp &&
                        <GroupMembersPopUp
                            handleOwnerSearchInputChange={this.handleOwnerSearchInputChange}
                            groupMembers={this.groupMembers}
                            handleOwnerSelect={this.handleOwnerSelect}
                            handleShowSelectOwnerPopUpClose={this.handleShowSelectOwnerPopUpClose}
                            selectedOwnerId={selectedOwnerId}
                            changeOwner={this.handleChangeOwner}
                        />
                    }
                </ReactCSSTransitionGroup>
                <div
                  style={{
                      height:'100%',
                      opacity: sharedMediaPanel ? 1 : 0,
                      zIndex: sharedMediaPanel ? 5 : -2,
                      position:'relative', overflow: 'hidden',
                      transition: '0.3s ease-in-out',
                  }}
                >
                    <SharedMedia
                      togglePopUp={togglePopUp}
                      handleAudioChange={handleAudioChange}
                      handleSharedMediaClose={this.handleSharedMediaPanelClose}
                      // systemTimeFormat={app.systemTimeFormat}
                      languages={languages}
                      sharedMediaPanel={sharedMediaPanel}
                      sharedMediaCount={sharedMediaCount}
                    />
                </div>

                <div style={{position: "absolute", height: '100%',top: 0, zIndex: sharedMediaPanel ? 0: 5, width: '100%', opacity: sharedMediaPanel ?  0 : 1, transition: '0.3s ease-in-out'}}>
                    {this.content}
                </div>
            </div>
        );

    }
}
