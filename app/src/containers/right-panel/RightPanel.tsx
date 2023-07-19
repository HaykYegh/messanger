"use strict";

import {Map} from "immutable";
import * as React from 'react';
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    attemptCreateContact,
    attemptFavoritesUpdate,
    attemptUpdateContact,
    BLOCK_CONTACT,
    DELETE_CONTACT,
    saveContact,
    toggleConversationMuted,
    UNBLOCK_CONTACT
} from "modules/contacts/ContactsActions";
import {
    attemptChangeLeftPanel,
    attemptDisableGroup,
    attemptRemoveMemberSelectedThread,
    attemptSetSelectedThread,
    attemptSetSharedMediaMessages,
    changeRightPanel,
    closeSharedMedia,
    fetchSharedMedia,
    initializeSharedMedia,
    openSharedMedia,
    removeRightCreateGroupMember,
    removeSharedMediaMessages,
    setRightCreateGroupMember,
    setSearchKeyword,
    setSelectedInfoThreadId,
    setSelectedThreadId, toggleCanNotDeleteGroup,
    toggleProfilePopUp,
    toggleRightPanel
} from "modules/application/ApplicationActions";
import {
    addMessage,
    attemptDeleteMessage,
    attemptSendForwardMessage,
    clearForwardMessage,
    downloadFile,
    messageLocalDelete,
    removeMessage,
    sendMessage,
    setForwardMessage,
    updateMessageProperty
} from "modules/messages/MessagesActions";
import {
    attemptChangeGroupName,
    attemptChangeGroupSettings,
    attemptCreateGroup,
    attemptDeleteGroup,
    attemptLeaveAndChangeOwner,
    attemptLeaveOrRemoveMember,
    attemptRemoveGroup,
    inviteGroupMembers,
    setGroupSettingsPanel,
    toggleGroupMuted
} from "modules/groups/GroupsActions";
import {
    attemptMuteConversation,
    attemptUnmuteConversation,
    updateConversationAvatar
} from "modules/conversations/ConversationsActions";
import {DELETE_GROUP_MEMBER_COMMAND, LEAVE_GROUP_COMMAND} from "xmpp/XMLConstants";
import {IMAGE_TOGGLE, RIGHT_PANELS, VIDEO_TOGGLE} from "configs/constants";
import ContactInfoPanel from "containers/right-panel/ContactInfoPanel";
import GroupInfoPanel from "containers/right-panel/GroupInfoPanel";
import CreateGroupPanel from "containers/common/CreateGroupPanel";
import {getThreadType} from "helpers/DataHelper";
import {IRequest} from "modules/requests/RequestsReducer";
import selector, {IStoreProps} from "services/selector";

import "scss/pages/right-panel/RightPanel"
import {IGroupCreateParams} from "services/interfaces";
import Log from "modules/messages/Log";

interface IRightPanelPassedProps {
    togglePopUp: (type: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    rightPanel: string;
    disconnected: boolean;
    handleAddMembersPopUpOpen: () => void;
}

interface IRightPanelProps extends IRightPanelPassedProps, IStoreProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email, labels) => void,
    attemptUpdateConversation: (id: string, firstName: string, lastName: string, phone: number | string, username: string, contact: any) => void;
    attemptUpdateContact: (id: any, firstName: string, lastName: string, phone: number | string, username: string, contact: any) => void;
    attemptLeaveAndChangeOwner: (id: string, owner: string, keepHistory: boolean, requestId: string) => void;
    attemptToggleBlock: (contactsToBlock: string, command: string, requestId: number) => void;
    attemptChangeGroupSettings: (id, settingType, members, role, allow, requestId) => void;
    attemptMuteConversation: (threadId: string, expirationDate: number) => void,
    attemptSendForwardMessage: (messages: any, threadIds: string[]) => void;
    changeRightPanel: (panel: string, addMembersPlace?: string) => void;
    attemptDeleteMember: (id: string, memberUsername: string) => void;
    togglePopUp: (popUp: string, id?: string, url?: string) => void;
    attemptRemoveFollower: (id: string, username: string) => void;
    sendMessage: (messageToSend: any, messageToSave: any) => void;
    attemptDeleteMessage?: (id: string, message?: any) => void;
    messageLocalDelete: (id: string, threadId: string) => void;
    attemptChangeGroupName: (id: string, name: string) => void;
    removeGroupMember: (id: string, contactId: string) => void;
    attemptRevokeAdmin: (id: string, username: string) => void;
    attemptLeaveGroup: (id: string, username: string) => void;
    attemptSetSharedMediaMessages: (threadId: string) => void;
    deleteGroup: (id: string, keepHistory: boolean) => void;
    updateMessageProperty: (msgId, property, value) => void;
    attemptUnmuteConversation: (threadId: string) => void;
    toggleBlocked: (id: string, blocked: boolean) => void;
    disableGroup: (id: string, username: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    setRightCreateGroupMember: (contact: any) => void;
    attemptSetSelectedThread: (thread: any) => void;
    saveContact: (id: string, contact: any) => void;
    setSelectedInfoThreadId: (id: string) => void;
    setSearchKeyword: (keyword: string) => void;
    downloadFile: (downloadFile: any) => void;
    setForwardMessage: (message: any) => void;
    toggleRightPanel: (show: boolean) => void;
    attemptRemoveGroup: (id, requestId) => void;
    toggleGroupMuted: (id: string) => void;
    removeSharedMediaMessages: () => void;
    setGroupSettingsPanel: (type) => void;
    removeMessage: (id: string) => void;
    addMessage: (message: any) => void;
    toggleMuted: (id: string) => void;
    clearForwardMessage: () => void;
    openSharedMedia: () => void;
    closeSharedMedia: () => void;
    addMembers: (groupId: string, members: string, isManualAdd: boolean) => void;

    initializeSharedMedia: (threadId: string) => void
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void
    toggleCanNotDeleteGroup: (canNotDeleteGroup: boolean) => void;


    pendingRequests: Map<string, IRequest>;
    groupSettingsPanel: number;
    sharedMediaPanel: boolean;
    sharedMediaCount: number;
    selectedThread: any;
    savedContacts: any;
    languages: any;
    contacts: any;
    lastCall: any;
    user: any;
    chat: any;
    app: any;

    createGroup: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts?: any) => void;

    DELETE_CONTACT: (threadId: string) => void;

    attemptFavoritesUpdate: (favoriteChanges: { prevValue: boolean, value: boolean, username: string } []) => void;
    updateConversationAvatar: (selectedThreadId: string, avatar: Blob) => void;

    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    BLOCK_CONTACT: (contactIds: string[]) => void;
    selectedThreadId: string;
    onlineUsers: any;
    conferenceDetails: any;
}

interface IRightPanelState {
    isAddMembers: boolean;
}

const selectorVariables: any = {
    groupSettingsPanel: true,
    selectedInfoThread: true,
    selectedThreadId: true,
    pendingRequests: true,
    selectedThread: true,
    conversations: true,
    onlineUsers:true,
    sharedMediaPanel: true,
    sharedMediaCount: true,
    app: true,
    user: true,
    contacts: {
        contacts: true,
        selectedInfoContact: true,
        selectedContact: true
    },
    settings: {
        chat: true,
        languages: true
    },
    calls: {
        lastCall: true
    },
    sharedMediaMessages: true,
    messages: {
        forwardMessage: true,
        messages: true
    },
    conferenceDetails: true
};

class RightPanel extends React.Component<IRightPanelProps, IRightPanelState> {

    constructor(props) {
        super(props);
        this.state = {
            isAddMembers: false,
        }
    }

    // componentDidMount(): void {
    //     const {selectedThreadId} = this.props;
    //     initializeSharedMedia(selectedThreadId)
    // }

    shouldComponentUpdate(nextProps: IRightPanelProps, nextState: IRightPanelState): boolean {
        Log.i("rightPanel -> shouldComponentUpdate = ", nextProps)
        const selectedThread = this.props.conversations.get(this.props.selectedThreadId) || this.props.contacts.get(this.props.selectedThreadId);
        const nextSelectedThread = nextProps.conversations.get(this.props.selectedThreadId) || nextProps.contacts.get(this.props.selectedThreadId);

        if(this.props.contacts !== nextProps.contacts) {
            return true;
        }

        if(this.props.conversations !== nextProps.conversations) {
            return true;
        }

        if (this.props.app.showRightPanel !== nextProps.app.showRightPanel) {
            return true;
        }

        if (this.props.selectedThreadId !== nextProps.selectedThreadId) {
            return true;
        }

        if (!isEqual(selectedThread.get('members').first().get('muted'), nextSelectedThread.get('members').first().get('muted'))) {
            return true;
        }

        if (!isEqual(this.props.sharedMediaMessages, nextProps.sharedMediaMessages)) {
            return true;
        }

        if (this.props.sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (this.props.groupSettingsPanel !== nextProps.groupSettingsPanel) {
            return true;
        }

        if (!isEqual(this.props.sharedMediaCount, nextProps.sharedMediaCount)) {
            return true;
        }

        if (!this.props.pendingRequests.equals(nextProps.pendingRequests)) {
            return true;
        }

        if (!isEqual(this.props.messages, nextProps.messages)) {
            return true;
        }

        if (!isEqual(this.props.savedContacts, nextProps.savedContacts)) {
            return true;
        }

        if (!isEqual(this.props.forwardMessage, nextProps.forwardMessage)) {
            return true;
        }

        if (!isEqual(this.props.app.sharedMedia, nextProps.app.sharedMedia)) {
            return true;
        }

        if (this.props.disconnected !== nextProps.disconnected) {
            return true;
        }

        if (this.props.languages.get('selectedLanguage') !== nextProps.languages.get('selectedLanguage')) {
            return true;
        }

        return this.state.isAddMembers !== nextState.isAddMembers;
    }

    // componentDidUpdate(prevProps: Readonly<IRightPanelProps>, prevState: Readonly<IRightPanelState>, snapshot?: any) {
    //     const {app, conversations, selectedThreadId} = this.props;
    //     const selectedThread = conversations.get(selectedThreadId) || this.props.contacts.get(selectedThreadId);
    //     const threadInfo = selectedThread.get("members").first();
    // }

    get rightPanel(): string {
        const {app, conversations, selectedThreadId} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || this.props.contacts.get(selectedThreadId);
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const threadIsEmpty = selectedThread.get("threads") && selectedThread.get("threads").isEmpty();

        if (threadIsEmpty) {
            return app.rightPanel;
        }

        if (
            !threadIsEmpty && !isGroup && selectedThread.size > 0 &&
            [RIGHT_PANELS.contact_info, RIGHT_PANELS.group_info].includes(app.rightPanel)
        ) {
            return RIGHT_PANELS.contact_info;
        } else if ([RIGHT_PANELS.contact_info].includes(app.rightPanel) && isGroup) {
            return RIGHT_PANELS.group_info;
        } else {
            return app.rightPanel;
        }
    }

    get content(): any {
        const rightPanel: string = this.rightPanel;
        const {
            togglePopUp, handleAudioChange, changeRightPanel, conversations, fetchSharedMedia,
             app, user, selectedThreadId, sharedMediaPanel, attemptSetSelectedThread, attemptMuteConversation,
            attemptSetSharedMediaMessages, attemptUnmuteConversation, toggleRightPanel, openSharedMedia, closeSharedMedia, languages,
            sharedMediaMessages, forwardMessage, updateMessageProperty, removeSharedMediaMessages, DELETE_CONTACT,
            messageLocalDelete, downloadFile, disconnected, setForwardMessage, attemptSendForwardMessage, clearForwardMessage, setSearchKeyword,
            handleAddMembersPopUpOpen, attemptFavoritesUpdate, updateConversationAvatar, BLOCK_CONTACT, UNBLOCK_CONTACT,onlineUsers
        } = this.props;
        const selectedThread = conversations.get(selectedThreadId) || this.props.contacts.get(selectedThreadId)

        switch (rightPanel) {
            case RIGHT_PANELS.contact_info: {
                const {
                    attemptUpdateContact, attemptUpdateConversation, attemptCreateContact, setRightCreateGroupMember,
                    setSelectedInfoThreadId, removeMessage, toggleMuted,
                    saveContact, savedContacts, lastCall, messages, createGroup,conversations, selectedThreadId
                } = this.props;
                return (
                    <ContactInfoPanel
                        selectedThread={this.props.contacts.get(selectedThreadId) || (conversations.size > 0 && conversations.get(selectedThreadId)) }
                        selectedThreadId={selectedThreadId}
                        onlineUsers={onlineUsers}
                        togglePopUp={togglePopUp}
                        handleAudioChange={handleAudioChange}
                        attemptSetSelectedThread={attemptSetSelectedThread}
                        attemptUpdateContact={attemptUpdateContact}
                        attemptUpdateConversation={attemptUpdateConversation}
                        attemptCreateContact={attemptCreateContact}
                        setRightCreateGroupMember={setRightCreateGroupMember}
                        attemptMuteConversation={attemptMuteConversation}
                        attemptSetSharedMediaMessages={attemptSetSharedMediaMessages}
                        attemptUnmuteConversation={attemptUnmuteConversation}
                        downloadFile={downloadFile}
                        clearForwardMessage={clearForwardMessage}
                        setSearchKeyword={setSearchKeyword}
                        attemptSendForwardMessage={attemptSendForwardMessage}
                        setForwardMessage={setForwardMessage}
                        messageLocalDelete={messageLocalDelete}
                        updateMessageProperty={updateMessageProperty}
                        removeSharedMediaMessages={removeSharedMediaMessages}
                        sharedMediaMessages={sharedMediaMessages}
                        sharedMediaCount={app.sharedMediaCount}
                        forwardMessage={forwardMessage}
                        setSelectedInfoThreadId={setSelectedInfoThreadId}
                        changeRightPanel={changeRightPanel}
                        toggleRightPanel={toggleRightPanel}
                        removeMessage={removeMessage}
                        toggleMuted={toggleMuted}
                        saveContact={saveContact}
                        openSharedMedia={openSharedMedia}
                        closeSharedMedia={closeSharedMedia}
                        sharedMediaPanel={sharedMediaPanel}
                        savedContacts={savedContacts}
                        languages={languages}
                        lastCall={lastCall}
                        user={user}
                        app={app}
                        groupConversationCreate={createGroup}
                        contacts={this.props.contacts}
                        disconnected={disconnected}
                        DELETE_CONTACT={DELETE_CONTACT}
                        conversations={conversations}
                        sharedMedia={app.sharedMedia}
                        fetchSharedMedia={fetchSharedMedia}
                        messages={messages}
                        attemptFavoritesUpdate={attemptFavoritesUpdate}
                        BLOCK_CONTACT={BLOCK_CONTACT}
                        UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                    />
                );
            }
            case RIGHT_PANELS.group_info: {
                const {
                    attemptLeaveAndChangeOwner, attemptChangeGroupSettings, attemptDeleteMember, sendMessage,
                    attemptChangeGroupName, removeGroupMember, attemptLeaveGroup, deleteGroup, attemptRemoveGroup,
                    toggleGroupMuted, setGroupSettingsPanel, addMessage, pendingRequests, groupSettingsPanel,
                    attemptDeleteMessage, chat, addMembers, contacts, messages, selectedThreadId, conferenceDetails, toggleCanNotDeleteGroup
                } = this.props;

                return (
                    <GroupInfoPanel
                        toggleCanNotDeleteGroup={toggleCanNotDeleteGroup}
                        attemptLeaveAndChangeOwner={attemptLeaveAndChangeOwner}
                        attemptChangeGroupSettings={attemptChangeGroupSettings}
                        changeRightPanel={changeRightPanel}
                        attemptDeleteMember={attemptDeleteMember}
                        sendMessage={sendMessage}
                        attemptMuteConversation={attemptMuteConversation}
                        attemptChangeGroupName={attemptChangeGroupName}
                        removeGroupMember={removeGroupMember}
                        attemptLeaveGroup={attemptLeaveGroup}
                        attemptSetSharedMediaMessages={attemptSetSharedMediaMessages}
                        deleteGroup={deleteGroup}
                        attemptSetSelectedThread={attemptSetSelectedThread}
                        attemptUnmuteConversation={attemptUnmuteConversation}
                        attemptRemoveGroup={attemptRemoveGroup}
                        toggleRightPanel={toggleRightPanel}
                        toggleGroupMuted={toggleGroupMuted}
                        setGroupSettingsPanel={setGroupSettingsPanel}
                        addMessage={addMessage}
                        pendingRequests={pendingRequests}
                        closeSharedMedia={closeSharedMedia}
                        openSharedMedia={openSharedMedia}
                        sharedMediaPanel={sharedMediaPanel}
                        groupSettingsPanel={groupSettingsPanel}
                        selectedThreadId={selectedThreadId}
                        handleAudioChange={handleAudioChange}
                        sharedMediaMessages={sharedMediaMessages}
                        forwardMessage={forwardMessage}
                        attemptDeleteMessage={attemptDeleteMessage}
                        updateMessageProperty={updateMessageProperty}
                        removeSharedMediaMessages={removeSharedMediaMessages}
                        messageLocalDelete={messageLocalDelete}
                        downloadFile={downloadFile}
                        clearForwardMessage={clearForwardMessage}
                        setSearchKeyword={setSearchKeyword}
                        attemptSendForwardMessage={attemptSendForwardMessage}
                        setForwardMessage={setForwardMessage}
                        showSharedMedia={app.showSharedMedia}
                        sharedMediaCount={app.sharedMediaCount}
                        sharedMedia={app.sharedMedia}
                        fetchSharedMedia={fetchSharedMedia}
                        selectedThread={conversations.get(selectedThreadId)}
                        threadIsEmpty={selectedThread.get("threads") && selectedThread.get("threads").isEmpty()}
                        threadInfo={selectedThread.getIn(['threads', 'threadInfo'])}
                        togglePopUp={togglePopUp}
                        languages={languages}
                        contacts={contacts}
                        user={user}
                        chat={chat}
                        conversations={conversations}
                        messages={messages}
                        addMembers={addMembers}
                        handleAddMembersPopUpOpen={handleAddMembersPopUpOpen}
                        updateConversationAvatar={updateConversationAvatar}
                        BLOCK_CONTACT={BLOCK_CONTACT}
                        UNBLOCK_CONTACT={UNBLOCK_CONTACT}
                        conferenceDetails={conferenceDetails}
                    />);
            }
            case RIGHT_PANELS.create_group:
                return <CreateGroupPanel inRightSide={true}/>;
            case RIGHT_PANELS.private_chat:
                return null;
            default:
                return null;
        }
    }

    render() {
        const {app, conversations, selectedThreadId} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || this.props.contacts.get(selectedThreadId);
        const threadIsEmpty: boolean = selectedThread && selectedThread.get("threads") && selectedThread.get("threads").isEmpty();
        const showRightPanel: boolean = app.showRightPanel && !threadIsEmpty && selectedThread.get("threads") && selectedThread.get("threads").size > 1;
        return (
          <div className={!showRightPanel ? "chat-content-right" : "chat-content-right chat-content-right-anim"} >
              {this.content}
          </div>
        )
        // return (
        //     <ReactCSSTransitionGroup
        //         transitionName={{
        //             enter: 'open',
        //             enterActive: 'openActive',
        //             leave: 'close',
        //             leaveActive: 'closeActive'
        //         }}
        //         component="div"
        //         transitionEnter={true}
        //         transitionLeave={true}
        //         transitionEnterTimeout={200}
        //         transitionLeaveTimeout={200}
        //     >
        //         {showRightPanel ? this.content : null}
        //     </ReactCSSTransitionGroup>
        // );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    changeRightPanel: (panel, addMembersPlace) => dispatch(changeRightPanel(panel, addMembersPlace)),
    attemptUpdateContact: (id, firstName, lastName, phone, username, contact) => dispatch(attemptUpdateContact(id, firstName, lastName, phone, username, contact)),
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels)),
    setRightCreateGroupMember: contact => dispatch(setRightCreateGroupMember(contact)),
    toggleRightPanel: show => dispatch(toggleRightPanel(show)),
    toggleMuted: id => dispatch(toggleConversationMuted(id)),
    attemptMuteConversation: (threadId, expirationDate) => dispatch(attemptMuteConversation(threadId, expirationDate, true)),
    removeMessage: id => dispatch(removeMessage(id)),
    saveContact: (id, contact) => dispatch(saveContact(id, contact)),
    attemptSetSharedMediaMessages: (threadId) => dispatch(attemptSetSharedMediaMessages(threadId)),
    openSharedMedia: () => dispatch(openSharedMedia()),
    closeSharedMedia: () => dispatch(closeSharedMedia()),
    attemptSetSelectedThread: (thread) => dispatch(attemptSetSelectedThread(thread)),
    attemptUnmuteConversation: (threadId) => dispatch(attemptUnmuteConversation(threadId, true)),
    sendMessage: (message, messageToSave) => dispatch(sendMessage(message, messageToSave)),
    addMessage: message => dispatch(addMessage(message)),
    clearForwardMessage: () => dispatch(clearForwardMessage()),
    setForwardMessage: (message: any) => dispatch(setForwardMessage(message)),
    attemptSendForwardMessage: (messages: any, threadIds: string[]) => dispatch(attemptSendForwardMessage(messages, threadIds)),
    setSearchKeyword: (keyword) => dispatch(setSearchKeyword(keyword)),
    attemptLeaveAndChangeOwner: (id, owner, keepHistory, requestId) => dispatch(attemptLeaveAndChangeOwner(id, owner, keepHistory, requestId)),
    attemptDeleteMember: (id, memberUsername) => dispatch(attemptLeaveOrRemoveMember(id, memberUsername, DELETE_GROUP_MEMBER_COMMAND)),
    attemptRemoveGroup: (id, requestId) => dispatch(attemptRemoveGroup(id, requestId)),
    attemptChangeGroupSettings: (id, settingType, members, role, allow, requestId) => dispatch(attemptChangeGroupSettings(id, settingType, members, role, allow, requestId)),
    attemptLeaveGroup: (id, username) => dispatch(attemptLeaveOrRemoveMember(id, username, LEAVE_GROUP_COMMAND)),
    attemptChangeGroupName: (id, name) => dispatch(attemptChangeGroupName(id, name)),
    setGroupSettingsPanel: (type) => dispatch(setGroupSettingsPanel(type)),
    setSelectedInfoThreadId: (id, groupId) => dispatch(setSelectedInfoThreadId(id, groupId)),
    removeGroupMember: (id, contactId) => dispatch(attemptRemoveMemberSelectedThread(id, contactId)),
    disableGroup: (id, username) => dispatch(attemptDisableGroup(id, username)),
    toggleGroupMuted: id => dispatch(toggleGroupMuted(id)),
    deleteGroup: (id, keepHistory) => dispatch(attemptDeleteGroup(id, keepHistory)),
    setSelectedThread: (thread, updateConversationTime) => dispatch(attemptSetSelectedThread(thread, updateConversationTime)),
    // createGroup: (group, username, setThread) => dispatch(attemptCreateGroup(group, username, setThread)),
    inviteGroupMembers: (groupId, members) => dispatch(inviteGroupMembers(groupId, members)),
    removeRightCreateGroupMember: () => dispatch(removeRightCreateGroupMember()),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    setSelectedThreadId: id => dispatch(setSelectedThreadId(id)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    addMembers: (groupId, members, isManualAdd) => dispatch(inviteGroupMembers(groupId, members, isManualAdd)),
    attemptDeleteMessage: (id, message) => dispatch(attemptDeleteMessage(id, message)),
    removeSharedMediaMessages: () => dispatch(removeSharedMediaMessages()),
    messageLocalDelete: (id, threadId) => dispatch(messageLocalDelete(id, threadId, true)),
    updateMessageProperty: (msgId, property, value) => dispatch(updateMessageProperty(msgId, property, value)),
    downloadFile: (downloadInfo) => dispatch(downloadFile(downloadInfo)),
    initializeSharedMedia: (threadId: string) => dispatch(initializeSharedMedia(threadId)),
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => dispatch(fetchSharedMedia(threadId, sharedMediaType)),

    createGroup: (group, username, setThread, details, contacts) => dispatch(attemptCreateGroup(group, username, setThread, details, contacts)),
    DELETE_CONTACT: (threadId: string) => dispatch(DELETE_CONTACT(threadId)),
    attemptFavoritesUpdate: (changes) => dispatch(attemptFavoritesUpdate(changes)),
    updateConversationAvatar: (selectedThreadId: string, avatar: Blob) => dispatch(updateConversationAvatar(selectedThreadId, avatar)),

    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds)),
    BLOCK_CONTACT: (contactIds: string[]) => dispatch(BLOCK_CONTACT(contactIds)),
    toggleCanNotDeleteGroup: (canNotDoCall: boolean) => dispatch(toggleCanNotDeleteGroup(canNotDoCall)),
});

export default connect<{}, {}, IRightPanelPassedProps>(mapStateToProps, mapDispatchToProps)(RightPanel);


