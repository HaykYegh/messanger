"use strict";

import * as React from "react";
import timeago from "timeago.js";
import {connect} from "react-redux";
import {List, Map} from "immutable";
import throttle from "lodash/throttle";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    attemptChangeLeftPanel,
    attemptSetSelectedThread,
    attemptSetSharedMediaMessages,
    changeRightPanel,
    closeCallOutPopUp,
    closeSharedMedia,
    FETCH_THREAD,
    hideCreateNewContactPopUp,
    openSharedMedia,
    removeCreateContactNumber,
    setRightCreateGroupMember,
    setSelectedInfoThreadId,
    showCreateNewContactPopUp,
    toggleRightPanel,
    toggleSearchMessages
} from "modules/application/ApplicationActions";
import {attemptCreateEmptyConversation} from "modules/conversations/ConversationsActions";
import {getThread, getThreadType, getUserId, getUsername, isPublicRoom} from "helpers/DataHelper";
import {
    attemptCreateContact,
    attemptToggleBlock,
    attemptToggleFavorite,
    DELETE_CONTACT,
    saveContact,
    toggleBlocked
} from "modules/contacts/ContactsActions";
import {
    attemptCreateGroup,
    attemptDeleteGroup,
    attemptLeaveAndChangeOwner,
    attemptLeaveOrRemoveMember,
    disableGroup
} from "modules/groups/GroupsActions";
import {
    ADD_TO_BLOCKED_COMMAND,
    LEAVE_GROUP_COMMAND,
    MESSAGE_XMLNS,
    OWNER_LEAVE_COMMAND,
    REMOVE_FROM_BLOCKED_COMMAND,
    XML_MESSAGE_TYPES
} from "xmpp/XMLConstants";
import {
    ADD_CONTACT_TYPE,
    ADD_MEMBERS_PLACES,
    CONFERENCE_CALL_MEMBERS_COUNT, CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM,
    ESC_KEY_CODE,
    GROUP_ROLES,
    IMAGE_TOGGLE,
    LEAVE_GROUP_ACTIONS,
    LEFT_PANELS,
    MESSAGE_TYPES,
    RIGHT_PANELS,
    SYSTEM_MESSAGE_NUMBER,
    TYPING_LIST_SIZE
} from "configs/constants";
import {startingConference} from "modules/conference/ConferenceActions";
import ConversationStartPopup from "components/common/popups/conversation";
import GroupMembersPopUp from "components/contacts/GroupMembersPopUp";
import AddContactPopup from "components/common/popups/addContact/AddContactPopup"
import ConferencePopup from "components/common/popups/conference";
import {addMessage} from "modules/messages/MessagesActions";
import HeaderButtons from "components/common/HeaderButtons";
import {IContact} from "modules/contacts/ContactsReducer";
import {IStoreProps} from "services/selector";
import {IGroupCreateParams} from "services/interfaces";
import connectionCreator from "xmpp/connectionCreator";
import {getLastVisitDate} from "helpers/DateHelper";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";
import conf from "configs/configurations";
import xmlToJson from "xmpp/xmlToJson";
import {IApplicationState} from "modules/application/ApplicationReducer";
import {AvatarSize} from "components/contacts/style";
import Avatar from "components/contacts/Avatar";
import {
    applicationStateSelector,
    createContactNumberSelector,
    createNewContactPopupSelector,
    leftPanelSelector,
    outCallPopupSelector,
    selectedInfoThreadIdSelector,
    selectedThreadIdSelector,
    selectedThreadSelector,
    sharedMediaPanelSelector,
    showRightPanelSelector,
    showSearchMessagesSelector
} from "modules/application/ApplicationSelector";
import {isConferenceShowSelector} from "modules/conference/ConferenceSelector";
import {getContactsSelectorOld, getSelectedContactSelector} from "modules/contacts/ContactsSelector";
import {languagesSelector} from "modules/settings/SettingsSelector";
import {userNameSelector, userSelector} from "modules/user/UserSelector";
import "scss/pages/Header";
import {conversationSelector} from "modules/conversations/ConversationsSelector";
import {getPendingRequestsSelector} from "modules/requests/RequestsSelector";
import Log from "modules/messages/Log";

interface IHeaderState {
    showLeaveGroupPopup: boolean,
    keepGroupHistory: boolean,
    requestId: string | number,
    ownerSelectKeyword: string,
    showProfilePopUp: boolean,
    createContactPopUp: boolean,
    leaveHandlerRef: any,
    showSelectOwnerPopup: boolean,
    selectedOwnerId: string,
    deletePopup: boolean,
    showCallOut: boolean,
    referenceNode: any,
    croppedNode: any,
    blockPopup: boolean,
    menuPopup: boolean,
    conversationPopup: {
        isOpened: boolean
    },
    addContactPopup: {
        isOpened: boolean
    },
    conferencePopup: {
        isOpened: boolean
    },
}

interface IHeaderPassedProps {
    handleMediaPopUpOpen: (type: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    inviteToCall?: (isVideo: boolean, contact: IContact, outCall: boolean) => void;
    alreadyInCall: boolean;
    disconnected: boolean;
    rightPanel: string;
    handleAddMembersPopUpOpen: () => void;
}

interface IHeaderProps extends IStoreProps, IHeaderPassedProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: any, labels: any[]) => void,
    attemptToggleBlock: (contactToBlock: string, command: string, requestId: number) => void;
    attemptLeaveAndChangeOwner: (id: string, owner: string, keepHistory: boolean, requestId: string) => void;
    attemptSetSelectedThread: (thread: any) => void;
    attemptCreateEmptyConversation: (threadId: string ) => void;
    attemptSetSharedMediaMessages: (threadId: string) => void,
    changeRightPanel: (panel: string, addMemberPlace?: string) => void;
    attemptToggleFavorite: (id: string, favorite: boolean, parentContactId: string) => void;
    toggleShowConferenceCall: (showConfCall: boolean) => void;
    toggleSearchMessages: (showSearchMessages: boolean) => void;
    attemptLeaveGroup: (id: string, username: string) => void;
    deleteGroup: (id: string, keepHistory: boolean) => void;
    toggleBlocked: (id: string, blocked: boolean) => void;
    disableGroup: (id: string, username: string) => void;
    setRightCreateGroupMember: (contact: any) => void,
    saveContact: (id: string, contact: any) => void,
    setSelectedInfoThreadId: (id: string) => void;
    toggleRightPanel: (show: boolean) => void;
    changeLeftPanel: (panel: string) => void;
    deleteContact: (contact: any) => void;
    showCreateNewContactPopUp: () => void;
    hideCreateNewContactPopUp: () => void;
    addMessage: (message: any) => void;
    openSharedMedia: () => void;
    removeCreateContactNumber: () => void;
    closeCallOutPopUp: () => void;
    closeSharedMedia: () => void;

    createGroup: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts?: any) => void;


    // Conference
    startingConference: (groupId: string) => void;

    DELETE_CONTACT: (threadId: string) => void;

    applicationState: IApplicationState
    createNewContactPopup: boolean;
    createContactNumber: number;
    leftPanel: string;
    rightPanel: string;
    outCallPopup: any;
    showSearchMessages: boolean;
    selectedInfoThreadId: string;
    showConference: boolean;
    selectedContact: IContact;
    contacts: Map<string, IContact>;
    user: any;
    userName: string;
    showRightPanel: boolean;
    conversation: any;

    FETCH_THREAD: (threadId: string) => void;

}

class Header extends React.Component<IHeaderProps, IHeaderState> {

    pendingUpdates: any = {};

    constructor(props: any) {
        super(props);

        this.state = {
            showLeaveGroupPopup: false,
            keepGroupHistory: false,
            showProfilePopUp: false,
            showSelectOwnerPopup: false,
            createContactPopUp: false,
            ownerSelectKeyword: "",
            leaveHandlerRef: null,
            selectedOwnerId: "",
            deletePopup: false,
            showCallOut: false,
            referenceNode: {},
            croppedNode: null,
            menuPopup: false,
            blockPopup: false,
            requestId: "",
            conversationPopup: {
                isOpened: false
            },
            addContactPopup: {
                isOpened: false
            },
            conferencePopup: {
                isOpened: false
            }
        }
    }

    componentDidMount(): void {
        document.addEventListener("click", this.handleOutSideClick);
    }

    componentDidUpdate(prevProps: IHeaderProps, prevState: IHeaderState) {

        const {removeCreateContactNumber, pendingRequests, createNewContactPopup} = this.props;
        const {showProfilePopUp} = this.state;

        if (showProfilePopUp !== prevState.showProfilePopUp) {
            if (showProfilePopUp) {
                document.addEventListener("keydown", this.handleProfilePopUpEscPress);
            }
        }

        if (createNewContactPopup !== prevProps.createNewContactPopup) {
            const addContactElement: any = document.getElementById("icon-add-contact");
            if (addContactElement && !addContactElement.classList.contains("icon-animate")) {
                addContactElement.classList.add("icon-animate");
            }

            if (this.props.createContactNumber) {
                removeCreateContactNumber();
            }
        }

        if (prevProps.pendingRequests && this.pendingUpdates[OWNER_LEAVE_COMMAND]) {
            const {showSelectOwnerPopup} = this.state;
            const requestId: string = this.pendingUpdates[OWNER_LEAVE_COMMAND];

            if (prevProps.pendingRequests.get(requestId) && !pendingRequests.get(requestId) && showSelectOwnerPopup) {
                delete this.pendingUpdates[OWNER_LEAVE_COMMAND];

                this.setState({
                    showSelectOwnerPopup: false,
                    selectedOwnerId: "",
                    keepGroupHistory: false
                });
            }
        }
    }

    shouldComponentUpdate(nextProps: IHeaderProps, nextState: IHeaderState): boolean {
        const {conversation} = this.props;

        if (conversation && nextProps.conversation &&
            !conversation.getIn(["conversations", "typing"]).equals(nextProps.conversation.getIn(["conversations", "typing"]))) {
            return true;
        }

        if (this.props.showConference !== nextProps.showConference) {
            return true;
        }

        if (this.props.applicationState.get('isOnline') !== nextProps.applicationState.get('isOnline')) {
            return true;
        }

        if (!this.props.selectedThread.equals(nextProps.selectedThread)) {
            return true;
        }

        if (this.props.createNewContactPopup !== nextProps.createNewContactPopup) {
            return true;
        }

        if (this.props.createContactNumber !== nextProps.createContactNumber) {
            return true;
        }

        if (this.props.leftPanel !== nextProps.leftPanel) {
            return true;
        }

        if (this.props.rightPanel !== nextProps.rightPanel) {
            return true;
        }

        if (this.props.outCallPopup !== nextProps.outCallPopup) {
            return true;
        }

        if (this.props.showRightPanel !== nextProps.showRightPanel) {
            return true;
        }

        if (this.props.disconnected !== nextProps.disconnected) {
            return true;
        }

        if (this.props.languages.get('selectedLanguage') !== nextProps.languages.get('selectedLanguage')) {
            return true;
        }

        if (!this.props.user.equals(nextProps.user)) {
            return true;
        }

        if (this.props.sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (!this.props.pendingRequests.equals(nextProps.pendingRequests)) {
            return true;
        }

        if (this.props.alreadyInCall !== nextProps.alreadyInCall) {
            return true;
        }

        return !isEqual(this.state, nextState);

    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
    }

    showInfo = () => {
        const {toggleRightPanel, setSelectedInfoThreadId, selectedThreadId, showRightPanel, selectedInfoThreadId} = this.props;

        toggleRightPanel(showRightPanel);

        if (selectedThreadId && selectedThreadId !== selectedInfoThreadId) {
            setSelectedInfoThreadId(selectedThreadId);
        }
    };

    toggleMenuPopUp = () => {
        const {menuPopup} = this.state;
        this.setState({menuPopup: !menuPopup});
    };

    toggleCallOut = () => {
        const {showCallOut} = this.state;
        this.setState({showCallOut: !showCallOut});
    };

    handleCallOutClose = () => {
        if (this.props.outCallPopup) {
            this.props.closeCallOutPopUp();
        }
    };

    toggleProfilePopUp = () => {
        const {showProfilePopUp} = this.state;
        this.setState({
            showProfilePopUp: !showProfilePopUp
        });
        document.removeEventListener("keydown", this.handleProfilePopUpEscPress);
    };

    handleOutSideClick = (event: any) => {

        const {referenceNode, showProfilePopUp, croppedNode} = this.state;

        if (showProfilePopUp && referenceNode && event.target.id !== "header_logo" && event.target.id !== "user_img" && event.target.id !== "profile_name" && (!referenceNode.contains(event.target)) && !croppedNode) {
            this.toggleProfilePopUp();
        }

    };

    openCreateGroup = () => {
        const {changeRightPanel, setRightCreateGroupMember, selectedThread} = this.props;
        setRightCreateGroupMember(selectedThread);
        changeRightPanel(RIGHT_PANELS.create_group);
    };

    toggleContactFavorite = () => {
        const {selectedThreadId, selectedThread, attemptToggleFavorite} = this.props;
        const thread = selectedThread.get("members").first();
        attemptToggleFavorite(selectedThreadId, thread.get("favorite"), thread.get("parentContactId"));
    };

    toggleDeletePopup = () => {
        const {deletePopup} = this.state;
        this.setState({deletePopup: !deletePopup});
    };

    handleSearchMessagesPanelOpen = () => {
        const {toggleSearchMessages, leftPanel, changeLeftPanel} = this.props;

        if (leftPanel !== LEFT_PANELS.search_messages) {
            changeLeftPanel(LEFT_PANELS.search_messages);
            toggleSearchMessages(true);
        }
    };

    deleteContact = () => {
        const {DELETE_CONTACT, selectedThread} = this.props;
        const threadId: string = selectedThread.getIn(["threads", "threadId"]);
        DELETE_CONTACT(threadId);
        this.toggleDeletePopup();
    };

    answerOfToggleBlocked = (res: any) => {
        if (res.innerHTML) {
            const {selectedThreadId, toggleBlocked} = this.props;
            const {requestId} = this.state;

            if (res.innerHTML.includes(requestId)) {
                const isBlocked: boolean = res.innerHTML.includes(ADD_TO_BLOCKED_COMMAND);
                toggleBlocked(selectedThreadId, isBlocked);

                this.setState({requestId: null});
                return false;
            }

            return true;
        } else {
            return true;
        }
    };

    attemptToggleContactBlocked = () => {
        const {selectedThread, attemptToggleBlock, user} = this.props;
        const thread = getThread(selectedThread, user.get("username"));
        const numbers = thread.get("numbers");
        const contactsToBlock: string = numbers && numbers.toArray() || thread.get("username");
        const connection: any = connectionCreator.getConnection();
        const requestId: number = Math.floor(Math.random() * 999 + 1);
        const command: string = thread.get("blocked") ? REMOVE_FROM_BLOCKED_COMMAND : ADD_TO_BLOCKED_COMMAND;

        connection.addHandler(this.answerOfToggleBlocked, null, "message", null, null, "msg.hawkstream.com");
        this.setState({requestId});
        attemptToggleBlock(contactsToBlock, command, requestId);
    };

    handleBlockContactToggle = () => {
        const {blockPopup} = this.state;
        this.setState({blockPopup: !blockPopup});
    };

    handleBlockButtonConfirm = () => {
        this.attemptToggleContactBlocked();
        this.setState({blockPopup: false});
    };

    saveContact = (): void => {
        const {saveContact, selectedThread} = this.props;
        const contact = selectedThread.toJS();
        const {threads: {threadId}} = contact;
        saveContact(threadId, contact);
    };

    openAddMembers = () => {
        const {changeRightPanel} = this.props;
        changeRightPanel(RIGHT_PANELS.add_members, ADD_MEMBERS_PLACES.group_members);
    };

    openLeaveGroupPopUp = () => {
        this.setState({showLeaveGroupPopup: true});
    };

    choseActionForLeaveGroup = (action: string, isOwner: boolean = false) => {
        const {showLeaveGroupPopup} = this.state;

        if (action === LEAVE_GROUP_ACTIONS.cancel) {
            this.setState({showLeaveGroupPopup: false});
        } else {
            if (showLeaveGroupPopup) {
                this.setState({showLeaveGroupPopup: false}, () => {

                    if (!isOwner) {
                        const connection: any = connectionCreator.getConnection();
                        const {selectedThread, attemptLeaveGroup, user} = this.props;
                        const partialId = selectedThread.getIn(['threads', 'threadInfo', 'partialId']);
                        const leaveHandlerRef: any = connection.addHandler(this.handler, MESSAGE_XMLNS, "message", XML_MESSAGE_TYPES.group, null);

                        if (action === "keep") {
                            this.setState({leaveHandlerRef, keepGroupHistory: true});
                        } else {
                            this.setState({leaveHandlerRef});
                        }
                        attemptLeaveGroup(partialId, user.get("username"));

                    } else {
                        this.setState({showSelectOwnerPopup: true, keepGroupHistory: action === "keep"});
                    }

                });
            }
        }
    };

    leaveGroup = (jsonMessage: any) => {
        const {selectedThreadId, user, deleteGroup} = this.props;
        const connection: any = connectionCreator.getConnection();
        const {leaveHandlerRef, keepGroupHistory} = this.state;

        connection.deleteHandler(leaveHandlerRef);
        this.setState({showLeaveGroupPopup: false, leaveHandlerRef: null, keepGroupHistory: false});
        if (jsonMessage.msgType === MESSAGE_TYPES.leave_group && jsonMessage.msgInfo === user.get("username")) {
            deleteGroup(selectedThreadId, keepGroupHistory);
        }
    };

    handler = (message: any) => {
        const jsonMessage: any = xmlToJson(message);
        if (jsonMessage.msgType === MESSAGE_TYPES.leave_group) {
            this.leaveGroup(jsonMessage);
        }
    };

    handleSharedMediaToggle = () => {
        const {sharedMediaPanel, openSharedMedia, closeSharedMedia, attemptSetSharedMediaMessages, selectedThreadId} = this.props;
        if (sharedMediaPanel) {
            closeSharedMedia()
        } else {
            attemptSetSharedMediaMessages(selectedThreadId);
            openSharedMedia()
        }
    };

    handleProfilePopUpEscPress = (event: any) => {
        const {showProfilePopUp} = this.state;
        if (showProfilePopUp && event.keyCode === ESC_KEY_CODE) {
            this.toggleProfilePopUp();
        }
        document.removeEventListener("keydown", this.handleProfilePopUpEscPress);
    };

    handleOwnerSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {ownerSelectKeyword} = this.state;
        const _value: string = value.trim().toLowerCase();

        if (ownerSelectKeyword !== _value) {
            this.setState({ownerSelectKeyword: _value});
        }

    };

    handleOwnerSelect = (contactId: string) => {
        const {selectedOwnerId} = this.state;

        if (selectedOwnerId !== contactId) {
            this.setState({selectedOwnerId: contactId});
        }
    };

    handleShowSelectOwnerPopUpClose = () => {
        this.setState({
            showSelectOwnerPopup: false,
            selectedOwnerId: "",
            keepGroupHistory: false
        });
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

    _showInfo = throttle(this.showInfo, 400);

    handleStartConversationPopupOpen = (): void => {
        this.setState({conversationPopup: {isOpened: true}});
    };

    handleStartConversationPopupClose = (): void => {
        this.setState({conversationPopup: {isOpened: false}});
    };

    handleAddContactPopupOpen = (): void => {
        this.setState({addContactPopup: {isOpened: true}});
    };

    handleAddContactPopupClose = (): void => {
        this.setState({addContactPopup: {isOpened: false}});
    };

    conversationNavigate = (contact: IContact) => {
        const {attemptSetSelectedThread, contacts, attemptCreateContact, user} = this.props;
        const contactId: string = contact.contactId;
        const thread = contacts.get(contactId);

        if (thread && thread.has("members")) {
            if ((window as any).isRefactor) {
                this.props.FETCH_THREAD(contactId);
            } else {
                this.props.attemptCreateEmptyConversation(contactId);
                attemptSetSelectedThread(contacts.get(contactId).toJS());
            }
        } else {
            const labels = [{value: contact.email || contact.phone, label: contact.email ? "home" : "mobile"}];
            attemptCreateContact(contact.contactId, '', '', user.get("username"), contact.phone ? [contact.phone.toString()] : null, false, true, ADD_CONTACT_TYPE.keypadPanel, contact.email ? [contact.email] : null, labels);
        }
    };

    // Conference call handlers start

    handleConferenceCreate = (details: any) => {
        const {createGroup} = this.props;
        createGroup(null, null, null, details);

        // Todo Force to conference call
    };

    handleSingleCallCreate = (contact: IContact) => {
        const {attemptSetSelectedThread, contacts, attemptCreateContact, user, inviteToCall, changeLeftPanel, leftPanel} = this.props;
        const contactId: string = contact.contactId;
        const thread = contacts.get(contactId);

        if (thread && thread.has("members")) {
            const threadInfo = thread.get('members').first();


            attemptSetSelectedThread(thread.toJS());

            if (leftPanel !== LEFT_PANELS.threads) {
                changeLeftPanel(LEFT_PANELS.threads);
            }

            inviteToCall(false, threadInfo, false);
        } else {
            const labels = [{value: contact.email || contact.phone, label: contact.email ? "home" : "mobile"}];
            attemptCreateContact(contact.contactId, '', '', user.get("username"), contact.phone ? [contact.phone.toString()] : null, false, true, ADD_CONTACT_TYPE.keypadPanel, contact.email ? [contact.email] : null, labels);
            if (leftPanel !== LEFT_PANELS.threads) {
                changeLeftPanel(LEFT_PANELS.threads);
            }
            inviteToCall(false, contact, false);
        }
    };

    handleConferencePopupOpen = (): void => {
        this.setState({conferencePopup: {isOpened: true}});
    };

    handleConferencePopupClose = (): void => {
        this.setState({conferencePopup: {isOpened: false}});
    };

    handleStartConference = () => {
        const {selectedThread, selectedThreadId, user} = this.props;
        const threadIsEmpty = selectedThread.get("threads").isEmpty();
        const groupMembers = selectedThread && selectedThread.get("members");
        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT


        if (!threadIsEmpty && groupMembers && groupMembers.size > C_Count) {

            this.handleConferencePopupOpen();

        } else {
            // Create conference
            this.props.startingConference(selectedThreadId);
        }
    };

    // Conference call handlers end

    get typing() {
        const {selectedThreadId, selectedThread, conversation} = this.props;
        const selectedThreadTypingList: List<string> = selectedThread.getIn(['conversations', 'typing']);
        const conversationTypingList: List<string> = conversation && conversation.getIn(["conversations", "typing"]);
        const typingList: List<string> = selectedThreadTypingList && selectedThreadTypingList.size > 0 ? selectedThreadTypingList : conversationTypingList;

        let text: string = "typing";
        let names: any;

        if (isPublicRoom(selectedThreadId)) {
            const members: Map<string, any> = selectedThread.get("members");

            names = typingList.map(username => {
                const contactId: string = getUserId(username);
                const member: any = members.get(contactId);

                return member.get("firstName") || member.get("phone");
            });

            const restSize: number = names.size - TYPING_LIST_SIZE;
            text = names.slice(0, 3).join(", ");

            if (restSize > 0) {
                text = `${text} and ${restSize} more`
            }
        }

        return (
            <div className="header-typing">
                <div className="typing-animation">
                    <span className="type-ico"/>
                    <span className="type-ico"/>
                    <span className="type-ico"/>
                </div>
                <p className="typing-text">{text}</p>
            </div>
        );
    }

    get isTyping() {
        const {selectedThread, conversation} = this.props;
        const selectedThreadTypingList: List<string> = selectedThread.getIn(['conversations', 'typing']);
        const conversationTypingList: List<string> = conversation && conversation.getIn(["conversations", "typing"]);

        return selectedThreadTypingList && selectedThreadTypingList.size > 0 || conversationTypingList && conversationTypingList.size > 0;
    }

    get isGroupMember() {
        const {selectedThread, user} = this.props;
        const {isGroup} = getThreadType(selectedThread.getIn(['threads', 'threadType']));
        const groupMembersUsernames = selectedThread.getIn(['threads', 'threadInfo', 'groupMembersUsernames']);
        const threadIsEmpty = selectedThread.get("threads").isEmpty();

        return !threadIsEmpty && isGroup
            && groupMembersUsernames && groupMembersUsernames.includes(user.get("username"));
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

    get status() {
        const {selectedThread, user, disconnected} = this.props;
        const localization: any = components().chatPanelHeader;
        const contactInfoLocalization: any = components().contactInfo;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const thread = getThread(selectedThread, user.get("username"));
        const isProductContact: boolean = thread && thread.get('isProductContact');
        const {isGroup} = getThreadType(threadType);
        const blocked: boolean = thread && thread.get("blocked");
        let status: string | JSX.Element;



        if (!selectedThread || (!isGroup && !isProductContact)) {
            status = "";
        } else if (isGroup) {
            if (thread.get("groupMembersUsernames").size > 1) {
                status = `${thread.get("groupMembersUsernames").size} ${localization.members}`;
            } else {
                status = `${thread.get("groupMembersUsernames").size} ${localization.member}`;
            }
        } else {
            const date: string = thread && thread.get("lastActivity") || 0;

            if (disconnected) {
                status = localization.waitingForNetwork;
            } else if (thread && !blocked && thread.get("status") === "online") {
                status = localization.online;
            } else if (date && !blocked) {
                status = `${contactInfoLocalization.lastVisit} ${getLastVisitDate({date})}`;
            }
        }

        return status || <span>&nbsp;</span>;
    }

    get popup(): JSX.Element {
        const {
            deletePopup, showLeaveGroupPopup, blockPopup, showSelectOwnerPopup, selectedOwnerId, conversationPopup,
            addContactPopup, conferencePopup
        } = this.state;
        const {selectedThread, inviteToCall, user, createGroup, outCallPopup} = this.props;

        const thread = getThread(selectedThread, user.get("username"));
        const isOwner: boolean = thread && thread.get("role") === GROUP_ROLES.owner;

        Log.i("CreateCall user = ", user)

        if (conversationPopup.isOpened) {
            return (
                <ConversationStartPopup
                    groupConversationCreate={createGroup}
                    conversationNavigate={this.conversationNavigate}
                    close={this.handleStartConversationPopupClose}
                    containerState={conversationPopup}
                    user={user}
                />
            );
        }

        if (addContactPopup.isOpened) {
            return (
                <AddContactPopup
                    handleAddContactPopupClose={this.handleAddContactPopupClose}
                    containerState={addContactPopup}
                />
            );
        }

        if (conferencePopup.isOpened) {
            return (
                <ConferencePopup
                    close={this.handleConferencePopupClose}
                    singleCallCreate={this.handleSingleCallCreate}
                    conferenceCreate={this.handleConferenceCreate}
                    containerState={conferencePopup}
                    inviteToCall={inviteToCall}
                    user={user}
                />
            )
        }

        if (showLeaveGroupPopup) {
            const localization: any = components().chatPanelHeader;
            const titleText: string = isOwner ? localization.pleaseConfirm : localization.leaveGroupTitle;
            const infoText: string = isOwner ? localization.leaveConfirmationInfo : localization.leaveGroupText;
            const leaveButKeepHistory: any = () => this.choseActionForLeaveGroup(LEAVE_GROUP_ACTIONS.leave_and_keep_history, isOwner);
            const cancel: any = () => this.choseActionForLeaveGroup(LEAVE_GROUP_ACTIONS.cancel);

            return (
                <PopUpMain
                    confirmButton={leaveButKeepHistory}
                    confirmButtonText={localization.confirm}
                    cancelButton={cancel}
                    cancelButtonText={localization.cancel}
                    titleText={titleText}
                    infoText={infoText}
                    showPopUpLogo={true}
                    shouldCheckOnPopupApprove={true}
                    checkInfo={localization.checkInfo}
                />
            );
        }

        if (deletePopup) {
            const deleteContactLocalization: any = components().contactInfoPanel;

            return (
                <PopUpMain
                    confirmButton={this.deleteContact}
                    confirmButtonText={deleteContactLocalization.yes}
                    cancelButton={this.toggleDeletePopup}
                    cancelButtonText={deleteContactLocalization.no}
                    titleText={deleteContactLocalization.title}
                    infoText={deleteContactLocalization.sureDelete}
                    showPopUpLogo={true}
                />
            );
        }

        if (outCallPopup) {
            const localization: any = components().chatPanelHeader;
            return (
                <PopUpMain
                    confirmLinkButtonText={localization.outCallConfirm}
                    cancelButton={this.handleCallOutClose}
                    cancelButtonText={localization.outCallCancel}
                    titleText={localization.outCallTitle}
                    infoText={localization.outCallText}
                    showPopUpLogo={true}
                />
            );
        }

        if (blockPopup) {
            const blockLocalization = components().blockedPopUp;
            const blocked: boolean = thread && thread.get("blocked");
            return (
                <PopUpMain
                    confirmButton={this.handleBlockButtonConfirm}
                    confirmButtonText={blockLocalization.confirm}
                    cancelButton={this.handleBlockContactToggle}
                    cancelButtonText={blockLocalization.cancel}
                    titleText={blocked ? blockLocalization.unblockTitle : blockLocalization.blockTitle}
                    infoText={blocked ? blockLocalization.unblockInfo : blockLocalization.blockInfo}
                    showPopUpLogo={true}
                />
            );
        }

        if (showSelectOwnerPopup) {
            return (
                <GroupMembersPopUp
                    handleOwnerSearchInputChange={this.handleOwnerSearchInputChange}
                    groupMembers={this.groupMembers}
                    handleOwnerSelect={this.handleOwnerSelect}
                    handleShowSelectOwnerPopUpClose={this.handleShowSelectOwnerPopUpClose}
                    selectedOwnerId={selectedOwnerId}
                    changeOwner={this.handleChangeOwner}
                />
            );
        }

        return null;
    }

    get connectionLostWindow(): JSX.Element {
        const {applicationState} = this.props;
        const localization: any = components().chatPanelHeader;

        return (
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'internet-enter',
                    enterActive: 'internet-enterActive',
                    leave: 'internet-leave',
                    leaveActive: 'internet-leaveActive'
                }}
                className=""
                component="span"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={110}
                transitionLeaveTimeout={110}>
                {
                    !applicationState.get('isOnline') && <div className="no-internet">
                        <h2 className="no-internet-text">{localization.noInternet}</h2>
                    </div>
                }
            </ReactCSSTransitionGroup>
        );
    }

    render(): JSX.Element {
        const {menuPopup} = this.state;
        const {
            selectedThread, languages, inviteToCall, selectedContact, showRightPanel, leftPanel, user, disconnected, selectedThreadId,
            sharedMediaPanel, alreadyInCall, showConference, handleMediaPopUpOpen, handleAddMembersPopUpOpen, createNewContactPopup,
            showSearchMessages
        } = this.props;
        const threadType = selectedThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread = getThread(selectedThread, user.get("username"));
        const isProductContact: boolean = thread && thread.get('isProductContact');
        const threadIsEmpty: boolean = selectedThread.get("threads").isEmpty();
        const threadId: string = selectedThread.getIn(['threads', 'threadId']);
        const localization: any = components().chatPanelHeader;
        const pageTitleLocalization: any = components().leftMenu;
        const singleConversationName: string = thread && !isGroup && (thread.get("firstName") || thread.get("lastName") ? thread.get("name") : thread.get("email") ? thread.get("email") : `${!thread.get("name").startsWith("0") ? "+" : ""}${thread.get("name")}`);
        const isSystemChat: boolean = !isGroup && thread && thread.get('phone') && thread.get('phone').includes(SYSTEM_MESSAGE_NUMBER);
        let selectedLanguage: string = languages.get('selectedLanguage');

        if (selectedLanguage == 'en-US') {
            selectedLanguage = 'en';
            timeago.register(selectedLanguage, require(`timeago.js/locales/${selectedLanguage}`));
        } else {
            timeago.register(selectedLanguage, require(`timeago.js/locales/${selectedLanguage}`));
        }

        const threadImage: any = {
            url: thread ? thread.get("avatarUrl") : "",
            file: thread ? thread.get("avatar") : "",
            loadFromWeb: true
        };

        return (

            <div className="header">
                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={200}
                >
                    {this.popup}
                </ReactCSSTransitionGroup>

                <div className="header-content">
                    <div className="header-left">
                        <div className="left-side-content">
                            <span className="page-title">
                                {pageTitleLocalization && pageTitleLocalization[leftPanel]}
                            </span>
                            {
                                leftPanel == LEFT_PANELS.threads &&
                                <button className="create-group" onClick={this.handleStartConversationPopupOpen}>
                                    <span className="icon-create-group"/>
                                    <span className="create-group-title">{localization.newChatButton}</span>
                                </button>
                            }

                            {
                                leftPanel == LEFT_PANELS.contacts &&
                                <button
                                    className="add-contact"
                                    id="contact-form-btn"
                                    onClick={this.handleAddContactPopupOpen}
                                >
                                    <span
                                        id="icon-add-contact"
                                        className={`icon-add-contact${createNewContactPopup ? " circle-rotate" : ""}`}/>
                                    <span className="add-contact-title">{localization.newContactButton}</span>
                                </button>
                            }

                            {
                                leftPanel == LEFT_PANELS.keypad &&
                                <button
                                    className="new-call hidden"
                                    onClick={this.handleConferencePopupOpen}
                                >
                                    <span className="icon-new-call"/>
                                    <span className="new-call-title">{localization.newCall}</span>
                                </button>
                            }

                        </div>

                        {this.connectionLostWindow}

                    </div>
                    <div className={`header-center${threadIsEmpty ? " no-border" : ""}`}>

                        {
                            selectedThreadId !== "" && thread ?
                                <div className="conversation-info" onClick={this._showInfo}>
                                    <AvatarSize margin="0 14px 0 18px" width="40px" height="40px">
                                        <Avatar
                                            image={threadImage}
                                            color={thread.getIn(["color", "numberColor"])}
                                            avatarCharacter={thread.get("avatarCharacter") || ''}
                                            name={isGroup ? thread.get("name") : thread.get("firstName")}
                                            meta={{threadId}}
                                            handleMediaPopUpOpen={handleMediaPopUpOpen}
                                            isGroup={isGroup}
                                            iconSize={isGroup ? "21px" : "40px"}
                                            border={"1px solid #F5F5F7"}
                                        />
                                    </AvatarSize>
                                    <div className="conversation-texts">
                                        <h1 className={`name ${(!isProductContact && !isGroup) ? "not-product-contact" : ""}`}
                                        >{isGroup ? thread.get("name") : singleConversationName}</h1>
                                        <div className="status-block">
                                            {this.isTyping ?
                                                this.typing :
                                                isSystemChat ?
                                                    <p className="chat_status chat_status_offline">{conf.app.name} Notifications</p> :
                                                    <p className={`chat_status${thread && thread.get("status") === "online" ? " chat_status_online" : ""}${thread && !isGroup && (!thread.get("status") || thread.get("status") !== "online") ? " chat_status_offline" : ""}${disconnected ? " disconnected" : ""}`}>{this.status || ` `}</p>}
                                        </div>
                                    </div>
                                </div>
                                :
                                <h2
                                    className="header-title"
                                    style={{cursor: "default"}}
                                >{localization.selectConversation}</h2>
                        }

                        {
                            selectedThreadId !== "" &&
                            <HeaderButtons
                                handleBlockContactToggle={this.handleBlockContactToggle}
                                handleSharedMediaToggle={this.handleSharedMediaToggle}
                                selectedInfoThread={selectedThread}
                                alreadyInCall={alreadyInCall}
                                toggleMenuPopUp={this.toggleMenuPopUp}
                                openCreateGroup={this.openCreateGroup}
                                toggleContactFavorite={this.toggleContactFavorite}
                                openLeaveGroupPopUp={this.openLeaveGroupPopUp}
                                openAddMembers={this.openAddMembers}
                                toggleDeletePopup={this.toggleDeletePopup}
                                isGroupMember={this.isGroupMember}
                                selectedContact={selectedContact}
                                showRightPanel={showRightPanel}
                                inviteToCall={inviteToCall}
                                sharedMediaPanel={sharedMediaPanel}
                                showInfo={this._showInfo}
                                saveContact={this.saveContact}
                                toggleCallOut={this.toggleCallOut}
                                menuPopup={menuPopup}
                                user={user}
                                showSearchMessages={showSearchMessages}
                                handleSearchMessagesPanelOpen={this.handleSearchMessagesPanelOpen}
                                startConference={this.handleStartConference}
                                showConference={showConference}
                                isDisconnected={disconnected}

                                handleAddMembersPopUpOpen={handleAddMembersPopUpOpen}
                            />
                        }
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = () => {
    const selectedThread = selectedThreadSelector();
    const selectedThreadId = selectedThreadIdSelector();
    const sharedMediaPanel = sharedMediaPanelSelector();
    const applicationState = applicationStateSelector();
    const outCallPopup = outCallPopupSelector();
    const createNewContactPopup = createNewContactPopupSelector();
    const createContactNumber = createContactNumberSelector();
    const leftPanel = leftPanelSelector();
    const showSearchMessages = showSearchMessagesSelector();
    const selectedInfoThreadId = selectedInfoThreadIdSelector();
    const showConference = isConferenceShowSelector();
    const selectedContact = getSelectedContactSelector();
    const contacts = getContactsSelectorOld();
    const languages = languagesSelector();
    const user = userSelector();
    const userName = userNameSelector();
    const showRightPanel = showRightPanelSelector();
    const conversation = conversationSelector();
    const pendingRequests = getPendingRequestsSelector();

    return (state, props) => {
        return {
            selectedThread: selectedThread(state, props),
            selectedThreadId: selectedThreadId(state, props),
            sharedMediaPanel: sharedMediaPanel(state, props),
            applicationState: applicationState(state, props),
            outCallPopup: outCallPopup(state, props),
            createNewContactPopup: createNewContactPopup(state, props),
            createContactNumberSelector: createContactNumber(state, props),
            leftPanel: leftPanel(state, props),
            showSearchMessages: showSearchMessages(state, props),
            selectedInfoThreadId: selectedInfoThreadId(state, props),
            showConference: showConference(state, props),
            selectedContact: selectedContact(state, props),
            contacts: contacts(state, props),
            languages: languages(state, props),
            user: user(state, props),
            userName: userName(state, props),
            showRightPanel: showRightPanel(state, props),
            conversation: conversation(state, props),
            pendingRequests: pendingRequests(state, props),
        }
    }
};

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels)),
    attemptLeaveAndChangeOwner: (id, owner, keepHistory, requestId) => dispatch(attemptLeaveAndChangeOwner(id, owner, keepHistory, requestId)),
    attemptToggleBlock: (contactToBlock, command, requestId) => dispatch(attemptToggleBlock(contactToBlock, command, requestId)),
    attemptToggleFavorite: (id, favorite, parentContactId) => dispatch(attemptToggleFavorite(id, favorite, parentContactId)),
    attemptLeaveGroup: (id, username) => dispatch(attemptLeaveOrRemoveMember(id, username, LEAVE_GROUP_COMMAND)),
    toggleSearchMessages: (showSearchMessages) => dispatch(toggleSearchMessages(showSearchMessages)),
    changeRightPanel: (panel, addMemberPlace) => dispatch(changeRightPanel(panel, addMemberPlace)),
    attemptSetSharedMediaMessages: (threadId) => dispatch(attemptSetSharedMediaMessages(threadId)),
    setRightCreateGroupMember: contact => dispatch(setRightCreateGroupMember(contact)),
    deleteGroup: (id, keepHistory) => dispatch(attemptDeleteGroup(id, keepHistory)),
    attemptSetSelectedThread: (thread) => dispatch(attemptSetSelectedThread(thread)),
    attemptCreateEmptyConversation: (threadId) => dispatch(attemptCreateEmptyConversation(threadId)),
    showCreateNewContactPopUp: () => dispatch(showCreateNewContactPopUp()),
    removeCreateContactNumber: () => dispatch(removeCreateContactNumber()),
    hideCreateNewContactPopUp: () => dispatch(hideCreateNewContactPopUp()),
    setSelectedInfoThreadId: id => dispatch(setSelectedInfoThreadId(id)),
    disableGroup: (id, username) => dispatch(disableGroup(id, username)),
    toggleBlocked: (id, blocked) => dispatch(toggleBlocked(id, blocked)),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    saveContact: (id, contact) => dispatch(saveContact(id, contact)),
    toggleRightPanel: show => dispatch(toggleRightPanel(show)),
    addMessage: message => dispatch(addMessage(message)),
    openSharedMedia: () => dispatch(openSharedMedia()),
    closeSharedMedia: () => dispatch(closeSharedMedia()),
    closeCallOutPopUp: () => dispatch(closeCallOutPopUp()),


    createGroup: (group, username, setThread, details, contacts) => dispatch(attemptCreateGroup(group, username, setThread, details, contacts)),

    // Conference call actions start

    startingConference: (groupId) => dispatch(startingConference(groupId)),

    // Conference call actions end

    DELETE_CONTACT: (threadId: string) => DELETE_CONTACT(threadId),

    FETCH_THREAD: (threadId: string) => dispatch(FETCH_THREAD(threadId))

});

export default connect<{}, {}, IHeaderPassedProps>(mapStateToProps, mapDispatchToProps)(Header);
