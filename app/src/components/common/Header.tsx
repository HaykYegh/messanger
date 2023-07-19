"use strict";

import * as React from "react";
import timeago from "timeago.js";
import {connect} from "react-redux";
import {List, Map} from "immutable";
import throttle from "lodash/throttle";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    attemptChangeLeftPanel,
    attemptSetSelectedThread,
    attemptSetSharedMediaMessages,
    changeRightPanel,
    closeCallOutPopUp,
    closeSharedMedia,
    hideCreateNewContactPopUp,
    openSharedMedia,
    removeCreateContactNumber,
    setRightCreateGroupMember,
    setSelectedInfoThreadId,
    showCreateNewContactPopUp, toggleCanNotDoCall,
    toggleRightPanel,
    toggleSearchMessages
} from "modules/application/ApplicationActions";
import {getThread, getThreadType, getUserId, getUsername, isPublicRoom} from "helpers/DataHelper";
import {
    attemptCreateContact,
    attemptToggleFavorite,
    contactErrors,
    BLOCK_CONTACT,
    DELETE_CONTACT,
    saveContact,
    UNBLOCK_CONTACT
} from "modules/contacts/ContactsActions";
import {
    attemptCreateGroup,
    attemptDeleteGroup,
    attemptLeaveAndChangeOwner,
    attemptLeaveOrRemoveMember,
    disableGroup
} from "modules/groups/GroupsActions";
import {
    attemptSearchMessages,
    removeSearchedMessageId
} from "modules/messages/MessagesActions"
import {LEAVE_GROUP_COMMAND, MESSAGE_XMLNS, OWNER_LEAVE_COMMAND, XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import {
    ADD_CONTACT_TYPE,
    ADD_MEMBERS_PLACES,
    CONFERENCE_CALL_MEMBERS_COUNT,
    ESC_KEY_CODE,
    GROUP_ROLES,
    IMAGE_TOGGLE,
    LEAVE_GROUP_ACTIONS,
    LEFT_PANELS,
    MESSAGE_TYPES,
    RIGHT_PANELS,
    SYSTEM_MESSAGE_NUMBER,
    TYPING_LIST_SIZE,
    APPLICATION, CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM
} from "configs/constants";
import {startingConference, toggleAnotherCallPopup} from "modules/conference/ConferenceActions";
import ConversationStartPopup from "components/common/popups/conversation";
import GroupMembersPopUp from "components/contacts/GroupMembersPopUp";
import AddContactPopup from "components/common/popups/addContact/AddContactPopup"
import ConferencePopup from "components/common/popups/conference";
import {addMessage} from "modules/messages/MessagesActions";
import HeaderButtons from "components/common/HeaderButtons";
import {IContact} from "modules/contacts/ContactsReducer";
import selector, {IStorePropsNew} from "services/selector";
import {IGroupCreateParams} from "services/interfaces";
import connectionCreator from "xmpp/connectionCreator";
import Account from "containers/left-panels/Account";
import {getLastVisitDate} from "helpers/DateHelper";
import PopUpMain from "components/common/PopUpMain";
import Avatar from "components/contacts/Avatar";
import components from "configs/localization";
import conf from "configs/configurations";
import xmlToJson from "xmpp/xmlToJson";
import "scss/pages/Header";
import {IApplicationState} from "modules/application/ApplicationReducer";
import {AvatarSize} from "components/contacts/style";
import {attemptCreateEmptyConversation} from "modules/conversations/ConversationsActions";
import IDBConversation from "services/database/class/Conversation";
import Log from "modules/messages/Log";
import isEqual from "lodash/isEqual";

const createGroupSvg = require("assets/images/create-group.svg");

interface IHeaderState {
    showLeaveGroupPopUp: boolean,
    keepGroupHistory: boolean,
    ownerSelectKeyword: string,
    showProfilePopUp: boolean,
    createContactPopUp: boolean,
    leaveHandlerRef: any,
    showSelectOwnerPopUp: boolean,
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
    showRightPanel: boolean;
    alreadyInCall: boolean;
    disconnected: boolean;
    rightPanel: string;
    lang: string;
    user: any;
    currentThread: any;
    handleAddMembersPopUpOpen: () => void;
    isRedialScreenShown: boolean;
}

interface IHeaderProps extends IStorePropsNew, IHeaderPassedProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: any, labels: any[], createConversation: boolean) => void,
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
    attemptSearchMessages: (keyword: string) => void;
    removeSearchedMessageId: () => void;
    contactErrors: (errors: any) => void;

    createGroup: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts: any, conferenceCall: boolean) => void;

    applicationState: IApplicationState

    // Conference
    startingConference: (groupId: string) => void;
    toggleAnotherCallPopup: (anotherCall: boolean) => void;

    DELETE_CONTACT: (threadId: string) => void
    BLOCK_CONTACT: (contactIds: string[]) => void
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    toggleCanNotDoCall: (canNotDoCall: boolean) => void;
    selectedThreadId: string;
    onlineUsers: any;
}

const selectorVariables: any = {
    selectedInfoThread: true,
    selectedThreadId: true,
    onlineUsers: true,
    sharedMediaPanel: true,
    conferenceDetails: true,
    application: {
        app: true
    },
    conference: {
        showConference: true
    },
    contacts: {
        selectedContact: true,
        contacts: true,
        savedContacts: true
    },
    settings: {
        languages: true
    },
    outCallPopup: true,

    applicationState: true,
};


class Header extends React.Component<IHeaderProps, IHeaderState> {

    pendingUpdates: any = {};

    constructor(props: any) {
        super(props);

        this.state = {
            showLeaveGroupPopUp: false,
            keepGroupHistory: false,
            showProfilePopUp: false,
            showSelectOwnerPopUp: false,
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

        const {removeCreateContactNumber, app, pendingRequests} = this.props;
        const {showProfilePopUp} = this.state;

        if (showProfilePopUp !== prevState.showProfilePopUp) {
            if (showProfilePopUp) {
                document.addEventListener("keydown", this.handleProfilePopUpEscPress);
            }
        }

        if (app.createNewContactPopUp !== prevProps.app.createNewContactPopUp) {
            const addContactElement: any = document.getElementById("icon-add-contact");
            if (addContactElement && !addContactElement.classList.contains("icon-animate")) {
                addContactElement.classList.add("icon-animate");
            }

            if (app.createContactNumber) {
                removeCreateContactNumber();
            }
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

    shouldComponentUpdate(nextProps: IHeaderProps, nextState: IHeaderState): boolean {

        if (!isEqual(nextProps.currentThread, this.props.currentThread)) {
            return true
        }

        if(this.props.selectedThreadId !== nextProps.selectedThreadId) {
            return true;
        }

        if (this.props.showConference !== nextProps.showConference) {
            return true;
        }

        if(this.props.onlineUsers.get(this.props.selectedThreadId) !== nextProps.onlineUsers.get(this.props.selectedThreadId)) {
            return  true
        }

        if (this.state.conferencePopup.isOpened !== nextState.conferencePopup.isOpened) {
            return true;
        }

        if (this.props.app.applicationState.isOnline !== nextProps.app.applicationState.isOnline) {
            return true
        }

        return this.state.showProfilePopUp !== nextState.showProfilePopUp ||
            this.props.app.createNewContactPopUp !== nextProps.app.createNewContactPopUp ||
            this.props.app.createContactNumber !== nextProps.app.createContactNumber ||
            this.state.showLeaveGroupPopUp !== nextState.showLeaveGroupPopUp ||
            this.props.showRightPanel !== nextProps.showRightPanel ||
            this.props.disconnected !== nextProps.disconnected ||
            // !this.props.currentThread.equals(nextProps.currentThread) ||
            !this.props.languages.equals(nextProps.languages) ||
            !this.props.user.equals(nextProps.user) ||
            this.props.app.leftPanel !== nextProps.app.leftPanel ||
            this.props.sharedMediaPanel !== nextProps.sharedMediaPanel ||
            this.props.app.rightPanel !== nextProps.app.rightPanel ||
            this.state.showSelectOwnerPopUp !== nextState.showSelectOwnerPopUp ||
            this.state.ownerSelectKeyword !== nextState.ownerSelectKeyword ||
            this.state.selectedOwnerId !== nextState.selectedOwnerId ||
            this.props.app.outCallPopup !== nextProps.app.outCallPopup ||
            !this.props.pendingRequests.equals(nextProps.pendingRequests) ||
            this.props.alreadyInCall !== nextProps.alreadyInCall ||
            this.state.showCallOut !== nextState.showCallOut ||
            this.state.blockPopup !== nextState.blockPopup ||
            this.state.createContactPopUp !== nextState.createContactPopUp ||
            this.state.deletePopup !== nextState.deletePopup ||
            this.state.menuPopup !== nextState.menuPopup ||
            this.state.conversationPopup.isOpened !== nextState.conversationPopup.isOpened ||
            this.state.addContactPopup.isOpened !== nextState.addContactPopup.isOpened;
    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
    }

    showInfo = () => {
        const {app, toggleRightPanel, setSelectedInfoThreadId, selectedThreadId} = this.props;

        toggleRightPanel(app.showRightPanel);

        if (selectedThreadId && selectedThreadId !== app.selectedInfoThreadId) {
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
        const {closeCallOutPopUp, app} = this.props;
        if (app.outCallPopup) {
            closeCallOutPopUp();
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

    setReferenceNode = (node: any) => {
        this.setState({referenceNode: node});
    };

    handleNodeDelete = (): void => {
        this.setState({croppedNode: null})

    };

    setCroppedNode = (node) => {
        this.setState({croppedNode: node});
    };

    openCreateGroup = () => {
        const {changeRightPanel, setRightCreateGroupMember, currentThread} = this.props;
        setRightCreateGroupMember(currentThread);
        changeRightPanel(RIGHT_PANELS.create_group);
    };

    toggleContactFavorite = () => {
        const {selectedThreadId, currentThread, attemptToggleFavorite} = this.props;
        const thread = currentThread.get("members").first();
        attemptToggleFavorite(selectedThreadId, thread.get("favorite"), thread.get("parentContactId"));
    };

    toggleDeletePopup = () => {
        const {deletePopup} = this.state;
        this.setState({deletePopup: !deletePopup});
    };

    handleSearchMessagesPanelOpen = () => {
        const {toggleSearchMessages, app, changeLeftPanel, attemptSearchMessages, removeSearchedMessageId} = this.props;

        if (app.leftPanel !== LEFT_PANELS.search_messages) {
            attemptSearchMessages("");
            removeSearchedMessageId();
            changeLeftPanel(LEFT_PANELS.search_messages);
            toggleSearchMessages(true);
        }
    };

    deleteContact = () => {
        const {DELETE_CONTACT, currentThread} = this.props;
        const threadId: string = currentThread.getIn(["threads", "threadId"]);
        DELETE_CONTACT(threadId);
        this.toggleDeletePopup();
    };

    attemptToggleContactBlocked = () => {
        const {currentThread, user, BLOCK_CONTACT, UNBLOCK_CONTACT} = this.props;

        const threadInfo = currentThread.get('members').first();

        const thread = getThread(currentThread, user.get("username"));
        const numbers = thread.get("numbers");
        const contactId: string[] = numbers && numbers.toArray() || [threadInfo.get("contactId")];

        if (threadInfo.get("blocked")) {
            UNBLOCK_CONTACT(contactId);
        } else {
            BLOCK_CONTACT(contactId);
        }
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
        const {saveContact, currentThread} = this.props;
        const contact = currentThread.toJS();
        const {threads: {threadId}} = contact;
        saveContact(threadId, contact);
    };

    openAddMembers = () => {
        const {changeRightPanel} = this.props;
        changeRightPanel(RIGHT_PANELS.add_members, ADD_MEMBERS_PLACES.group_members);
    };

    openLeaveGroupPopUp = () => {
        this.setState({showLeaveGroupPopUp: true});
    };

    choseActionForLeaveGroup = (action: string, isOwner: boolean = false) => {
        const {showLeaveGroupPopUp} = this.state;

        if (action === LEAVE_GROUP_ACTIONS.cancel) {
            this.setState({showLeaveGroupPopUp: false});
        } else {
            if (showLeaveGroupPopUp) {
                this.setState({showLeaveGroupPopUp: false}, () => {

                    if (!isOwner) {
                        const connection: any = connectionCreator.getConnection();
                        const {currentThread, attemptLeaveGroup, user} = this.props;
                        const id = currentThread.getIn(['threads', 'threadInfo', 'id']);
                        const partialId = currentThread.getIn(['threads', 'threadInfo', 'partialId']);
                        const leaveHandlerRef: any = connection.addHandler(this.handler, MESSAGE_XMLNS, "message", XML_MESSAGE_TYPES.group, null);

                        if (action === "keep") {
                            this.setState({leaveHandlerRef, keepGroupHistory: true});
                        } else {
                            this.setState({leaveHandlerRef});
                        }
                        attemptLeaveGroup(partialId, user.get("username"));

                    } else {
                        this.setState({showSelectOwnerPopUp: true, keepGroupHistory: action === "keep"});
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
        this.setState({showLeaveGroupPopUp: false, leaveHandlerRef: null, keepGroupHistory: false});
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

    changePanelRight = (panel: string) => {
        const {app, changeLeftPanel} = this.props;
        if (panel !== app.leftPanel) {
            changeLeftPanel(panel);
        }
    };

    createGroupChat = () => {
        this.changePanelRight(LEFT_PANELS.create_group)
    };

    createNewContact = () => {
        this.changePanelRight(LEFT_PANELS.create_contact)
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

    handleCreateContactOpen = () => {
        const {showCreateNewContactPopUp, hideCreateNewContactPopUp, app} = this.props;
        if (app.createNewContactPopUp) {
            hideCreateNewContactPopUp();
        } else {
            showCreateNewContactPopUp();
        }
    };

    handleCreateContactClose = () => {
        const {hideCreateNewContactPopUp} = this.props;
        hideCreateNewContactPopUp();
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
            showSelectOwnerPopUp: false,
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

    get typing() {
        const {selectedThreadId, currentThread, conversations} = this.props;
        const selectedThreadTypingList: List<string> = currentThread.getIn(['conversations', 'typing']);
        const conversationTypingList: List<string> = conversations.get(selectedThreadId) && conversations.getIn([selectedThreadId, "conversations", "typing"]);
        const typingList: List<string> = selectedThreadTypingList && selectedThreadTypingList.size > 0 ? selectedThreadTypingList : conversationTypingList;

        let text: string = "typing";
        let names: any;

        if (isPublicRoom(selectedThreadId)) {
            const members: Map<string, any> = currentThread.get("members");

            names = typingList.map(username => {
                const contactId: string = getUserId(username);
                const member: any = members.get(contactId);
                return member ? (member.get("firstName") || member.get("phone")) : '';
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
        const {selectedThreadId, currentThread, conversations} = this.props;
        const selectedThreadTypingList: List<string> = currentThread.getIn(['conversations', 'typing']);
        const conversationTypingList: List<string> = conversations.get(selectedThreadId) && conversations.getIn([selectedThreadId, "conversations", "typing"]);

        return selectedThreadTypingList && selectedThreadTypingList.size > 0 || conversationTypingList && conversationTypingList.size > 0;
    }

    get isGroupMember() {
        const {currentThread, user} = this.props;
        const {isGroup} = getThreadType(currentThread.getIn(['threads', 'threadType']));
        const groupMembersUsernames = currentThread.getIn(['threads', 'threadInfo', 'groupMembersUsernames']);
        const threadIsEmpty = currentThread &&  currentThread.get("threads") && currentThread.get("threads").isEmpty();

        return !threadIsEmpty && isGroup
            && groupMembersUsernames && groupMembersUsernames.includes(user.get("username"));
    }

    get groupMembers() {
        const {currentThread, user} = this.props;
        const {ownerSelectKeyword} = this.state;
        const groupMembers: any = currentThread.get("members");

        return groupMembers.filter(groupMember => {
            const name: string = groupMember.get("name");

            return (name && name.toLowerCase().includes(ownerSelectKeyword) ||
                groupMember.get("phone").includes(ownerSelectKeyword))
                && groupMember.get("username") !== user.get("username")
        });
    }

    get status() {
        const {currentThread, lang, user, disconnected, onlineUsers, selectedThreadId} = this.props;
        const localization: any = components(true)[lang].chatPanelHeader;
        const contactInfoLocalization: any = components().contactInfo;
        const threadType = currentThread.getIn(['threads', 'threadType']);
        const thread = getThread(currentThread, user.get("username"));
        const isProductContact: boolean = thread && thread.get('isProductContact');
        const {isGroup} = getThreadType(threadType);
        const blocked: boolean = thread && thread.get("blocked");
        let status: string | JSX.Element;

        if (!currentThread || (!isGroup && !isProductContact)) {
            status = "";
        } else if (isGroup) {
            if (currentThread.get('members') && currentThread.get('members').size > 1) {
                status = `${currentThread.get('members').size} ${localization.members}`;
            } else {
                status = `${currentThread.get('members').size} ${localization.members}`;
            }
            // if (thread.get("groupMembersUsernames").size > 1) {
            //     status = `${thread.get("groupMembersUsernames").size} ${localization.members}`;
            // } else {
            //     status = `${thread.get("groupMembersUsernames").size} ${localization.member}`;
            // }
        } else {
            // const date: string = thread && thread.get("lastActivity") || 0;
            const date: string = onlineUsers.get(selectedThreadId) && onlineUsers.get(selectedThreadId).get("lastActivity") || 0;
            Log.i("onlineUsers -> ", onlineUsers)
            if (disconnected) {
                status = localization.waitingForNetwork;
            } else if (onlineUsers.get(selectedThreadId) && !blocked && onlineUsers.get(selectedThreadId).get("status") === "online") {
                status = localization.online;
            } else if (date && !blocked) {
                status = `${contactInfoLocalization.lastVisit} ${getLastVisitDate({date})}`;
            }
        }

        Log.i("status -> status = ", '&nbsp;')

        // return status || <span>&nbsp;</span>

        return status || <span>tap for contact info</span>;
    }

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
        this.setState({addContactPopup: {isOpened: false}}, () => {
            this.props.contactErrors({})
        });
    };

    handleListContacts = (limit: number, offset: number): any => {
        const {savedContacts} = this.props;
        return {
            contacts: savedContacts.skip(offset).take(limit),
            count: savedContacts.count(),
        };
    };

    conversationNavigate = async (contact: IContact) => {
        const {attemptSetSelectedThread, contacts, attemptCreateContact, user, attemptCreateEmptyConversation} = this.props;
        const contactId: string = contact.contactId;
        const thread = contacts.get(contactId);

        if (thread && thread.has("members")) {
            await attemptCreateEmptyConversation(contactId);
            attemptSetSelectedThread(contacts.get(contactId).toJS());
        }
        else {
            const labels = [{value: contact.email || contact.phone, label: contact.email ? "home" : "mobile"}];
            await attemptCreateContact(contact.contactId, '', '', user.get("username"), contact.phone ? [contact.phone.toString()] : null, false, true, ADD_CONTACT_TYPE.keypadPanel, contact.email ? [contact.email] : null, labels,   true);
            // await attemptCreateEmptyConversation(contactId);
            //  const thread = await contacts.get(contactId);
            // if (thread && thread.has("members")) {
            //     await attemptSetSelectedThread(contacts.get(contactId).toJS());
            // }
        }
    };

    // Conference call handlers start

    handleConferenceCreate = (details: any) => {
        const {createGroup} = this.props;

        Log.i("conference -> handleConferenceCreate -> details = ", details)
        createGroup(null, null, null, details, null, true);

        // Todo Force to conference call
    };

    handleSingleCallCreate = (contact: IContact) => {
        const {attemptSetSelectedThread, contacts, attemptCreateContact, user, inviteToCall, changeLeftPanel, app} = this.props;
        const contactId: string = contact.contactId;
        const thread = contacts.get(contactId);

        if (thread && thread.has("members")) {
            const threadInfo = thread.get('members').first();


            attemptSetSelectedThread(thread.toJS());

            if (app.leftPanel !== LEFT_PANELS.threads) {
                changeLeftPanel(LEFT_PANELS.threads);
            }

            inviteToCall(false, threadInfo, false);
        } else {
            const labels = [{value: contact.email || contact.phone, label: contact.email ? "home" : "mobile"}];
            attemptCreateContact(contact.contactId, '', '', user.get("username"), contact.phone ? [contact.phone.toString()] : null, false, true, ADD_CONTACT_TYPE.keypadPanel, contact.email ? [contact.email] : null, labels, false);
            if (app.leftPanel !== LEFT_PANELS.threads) {
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
        const {currentThread, selectedThreadId, showConference, user} = this.props;
        const threadIsEmpty = currentThread.get("threads").isEmpty();
        const groupMembers = currentThread && currentThread.get("members");

        Log.i("conference -> handleStartConference -> user = ", user)

        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT

        if (!threadIsEmpty && groupMembers && groupMembers.size > C_Count) {
            this.handleConferencePopupOpen();
        } else {
            // Create conference
            if (showConference) {
                this.props.toggleAnotherCallPopup(true);
            } else {
                this.props.startingConference(selectedThreadId);
            }
        }
    };

    // Conference call handlers end

    render(): JSX.Element {
        const {
            showProfilePopUp, menuPopup, deletePopup, showLeaveGroupPopUp, blockPopup, showSelectOwnerPopUp,
            selectedOwnerId, conversationPopup, addContactPopup, conferencePopup,
        } = this.state;
        const {
            currentThread, lang, inviteToCall, selectedContact, showRightPanel, app, user, disconnected,
            sharedMediaPanel, alreadyInCall, createGroup, showConference, handleMediaPopUpOpen,
            handleAddMembersPopUpOpen, isRedialScreenShown, toggleCanNotDoCall, conferenceDetails
        } = this.props;
        const conferenceId = conferenceDetails.getIn(["info", "threadId"])
        const threadType = currentThread && currentThread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);
        const thread = currentThread && getThread(currentThread, user.get("username"));
        const isOwner: boolean = thread && thread.get("role") === GROUP_ROLES.owner;
        const isProductContact: boolean = thread && thread.get('isProductContact');
        const threadIsEmpty = !currentThread ? true : currentThread && currentThread.get("threads") && currentThread.get("threads").isEmpty() ? true : false;
        let langParam = lang;
        const blocked: boolean = thread && thread.get("blocked");
        const threadId: string = currentThread && currentThread.getIn(['threads', 'threadId']);
        const blockLocalization = components().blockedPopUp;
        const localization: any = components(true)[lang].chatPanelHeader;
        const pageTitleLocalization: any = components(true)[lang].leftMenu;
        const titleText: string = isOwner ? localization.pleaseConfirm : localization.leaveGroupTitle;
        const infoText: string = isOwner ? localization.leaveConfirmationInfo : localization.leaveGroupText;
        const deleteContactLocalization: any = components(true)[lang].contactInfoPanel;
        // const singleConversationName: string = thread && !isGroup && (thread.get("firstName") || thread.get("lastName") ? thread.get("name") : thread.get("email") ? thread.get("email") : `${!thread.get("name").startsWith("0") ? "+" : ""}${thread.get("name")}`);
        let singleConversationName: string;
        if (thread && !isGroup && thread.get("contactId") === "000000002@msg.hawkstream.com") {
            singleConversationName = "RASED";
        }
        else if (thread && !isGroup && thread.get("contactId") === "111@msg.hawkstream.com") {
            singleConversationName = "RASED Admin";
        } else {
            const nameType = APPLICATION.WITHEMAIL ? "email" : "username"
            singleConversationName = thread && !isGroup && (thread.get("firstName") || thread.get("lastName") ? thread.get("name") : thread.get("email") ? thread.get(nameType) : `${thread.get("name")}`);
        }

        const leaveButKeepHistory: any = () => this.choseActionForLeaveGroup(LEAVE_GROUP_ACTIONS.leave_and_keep_history, isOwner);
        const cancel: any = () => this.choseActionForLeaveGroup(LEAVE_GROUP_ACTIONS.cancel);
        const isSystemChat: boolean = !isGroup && thread && thread.get('phone') && thread.get('phone').includes(SYSTEM_MESSAGE_NUMBER);

        if (langParam == 'en-US') {
            langParam = 'en';
            timeago.register(langParam, require(`timeago.js/locales/${langParam}`));
        } else {
            timeago.register(langParam, require(`timeago.js/locales/${langParam}`));
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
                    transitionLeaveTimeout={200}>
                    {
                        conversationPopup.isOpened &&
                        <ConversationStartPopup
                            groupConversationCreate={createGroup}
                            conferenceCreate={this.handleConferenceCreate}
                            conversationNavigate={this.conversationNavigate}
                            close={this.handleStartConversationPopupClose}
                            containerState={conversationPopup}
                            user={user}
                        />
                    }

                    {
                        addContactPopup.isOpened &&
                        <AddContactPopup
                            handleAddContactPopupClose={this.handleAddContactPopupClose}
                            containerState={addContactPopup}
                        />
                    }

                    {
                        conferencePopup.isOpened &&
                        <ConferencePopup
                            close={this.handleConferencePopupClose}
                            singleCallCreate={this.handleSingleCallCreate}
                            conferenceCreate={this.handleConferenceCreate}
                            containerState={conferencePopup}
                            inviteToCall={inviteToCall}
                            leftPanel={LEFT_PANELS.keypad}
                            user={user}
                            // leftPanel={app.leftPanel}
                        />
                    }

                </ReactCSSTransitionGroup>


                <div className="header-content">
                    <div className="header-left">
                        <div className="left-side-content">
                            <span className="page-title">
                                {pageTitleLocalization && pageTitleLocalization[app.leftPanel]}
                            </span>
                            {
                                app.leftPanel == LEFT_PANELS.threads ?
                                    <div className="create-group" >
                                        <img onClick={this.handleStartConversationPopupOpen} draggable={false}
                                             className="create-group-svg" src={createGroupSvg} alt="create-group"/>
                                    </div>
                                    :
                                    app.leftPanel == LEFT_PANELS.contacts ?
                                        <button
                                            className="add-contact"
                                            id="contact-form-btn"
                                            // onClick={this.handleCreateContactOpen}
                                            onClick={this.handleAddContactPopupOpen}
                                        >
                                        <span
                                            id="icon-add-contact"
                                            className={`icon-add-contact${app.createNewContactPopUp ? " circle-rotate" : ""}`}/>
                                            <span className="add-contact-title">{localization.newContactButton}</span>
                                        </button> :
                                        app.leftPanel == LEFT_PANELS.keypad &&
                                            <button
                                                className="new-call"
                                                onClick={this.handleConferencePopupOpen}
                                            >
                                                <span className="icon-new-call"/>
                                                <span className="new-call-title">{localization.newCall}</span>
                                            </button>
                            }
                            <div className={`profile-popup${showProfilePopUp ? " open" : ""}`}
                                 ref={this.setReferenceNode}>
                                {showProfilePopUp && <Account
                                    croppedNode={this.setCroppedNode}
                                    handleNodeDelete={this.handleNodeDelete}
                                    showProfilePopUp={showProfilePopUp}
                                />}
                            </div>


                            {/*<div*/}
                            {/*    className={`create-contact-popup${app.createNewContactPopUp ? " open" : ""}`}>*/}
                            {/*    {app.createNewContactPopUp && <CreateContactPanelNew*/}
                            {/*        handleCreateContactClose={this.handleCreateContactClose}*/}
                            {/*        createContactPopUp={app.createNewContactPopUp}*/}
                            {/*    />}*/}
                            {/*</div>*/}


                        </div>
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
                                !app.applicationState.isOnline && <div className="no-internet">
                                    <h2 className="no-internet-text">{localization.noInternet}</h2>
                                </div>
                            }
                        </ReactCSSTransitionGroup>
                    </div>
                    {
                    <div className={`header-center${threadIsEmpty ? " no-border" : ""}`}>

                        {currentThread && thread && thread.size > 1 ?
                          <div className="conversation-info" onClick={this._showInfo}>
                              <AvatarSize margin="0 14px 0 18px" width="40px" height="40px">
                                  <Avatar
                                    image={threadImage}
                                    color={thread.getIn(["color", "numberColor"])}
                                    backgroundColor={"#F0F2FC"}
                                    avatarCharacter={thread.get("avatarCharacter")}
                                    name={isGroup ? thread.get("name") : thread.get("firstName")}
                                    meta={{threadId}}
                                    contactId={thread.get("contactId")}
                                    handleMediaPopUpOpen={handleMediaPopUpOpen}
                                    isGroup={isGroup}
                                    iconSize={isGroup ? "21px" : "40px"}
                                    border={"1px solid #F5F5F7"}
                                    avatarBlobUrl={thread.get("avatarBlobUrl")}
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
                                          <p className={`chat_status${thread && thread.get("status") === "online" ? " chat_status_online" : ""}${thread && !isGroup && (!thread.get("status") || thread.get("status") !== "online") ? " chat_status_offline" : ""}${disconnected ? " disconnected" : ""}`}>
                                              {this.status || ``}
                                          </p>}
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
                            currentThread && !threadIsEmpty &&
                            <HeaderButtons
                                toggleCanNotDoCall={toggleCanNotDoCall}
                                handleBlockContactToggle={this.handleBlockContactToggle}
                                handleSharedMediaToggle={this.handleSharedMediaToggle}
                                selectedInfoThread={currentThread}
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
                                showSearchMessages={app.showSearchMessages}
                                handleSearchMessagesPanelOpen={this.handleSearchMessagesPanelOpen}
                                startConference={this.handleStartConference}
                                conferenceId={conferenceId}
                                showConference={showConference}
                                isDisconnected={disconnected}
                                handleAddMembersPopUpOpen={handleAddMembersPopUpOpen}
                                isRedialScreenShown={isRedialScreenShown}
                            />
                        }
                    </div>
                    }

                </div>
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
                        showLeaveGroupPopUp ?
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
                            /> :
                            deletePopup ?
                                <PopUpMain
                                    confirmButton={this.deleteContact}
                                    confirmButtonText={deleteContactLocalization.yes}
                                    cancelButton={this.toggleDeletePopup}
                                    cancelButtonText={deleteContactLocalization.no}
                                    titleText={deleteContactLocalization.title}
                                    infoText={deleteContactLocalization.sureDelete}
                                    showPopUpLogo={true}
                                /> :
                                app.outCallPopup ?
                                    <PopUpMain
                                        confirmLinkButtonText={localization.outCallConfirm}
                                        cancelButton={this.handleCallOutClose}
                                        cancelButtonText={localization.outCallCancel}
                                        titleText={localization.outCallTitle}
                                        infoText={localization.outCallText}
                                        showPopUpLogo={true}
                                    /> :
                                    blockPopup ?
                                        <PopUpMain
                                            confirmButton={this.handleBlockButtonConfirm}
                                            confirmButtonText={blockLocalization.confirm}
                                            cancelButton={this.handleBlockContactToggle}
                                            cancelButtonText={blockLocalization.cancel}
                                            titleText={blocked ? blockLocalization.unblockTitle : blockLocalization.blockTitle}
                                            infoText={blocked ? blockLocalization.unblockInfo : blockLocalization.blockInfo}
                                            showPopUpLogo={true}
                                        /> : null
                    }

                    {currentThread ? showSelectOwnerPopUp && <GroupMembersPopUp
                        handleOwnerSearchInputChange={this.handleOwnerSearchInputChange}
                        groupMembers={this.groupMembers}
                        handleOwnerSelect={this.handleOwnerSelect}
                        handleShowSelectOwnerPopUpClose={this.handleShowSelectOwnerPopUpClose}
                        selectedOwnerId={selectedOwnerId}
                        changeOwner={this.handleChangeOwner}
                    />:''}
                </ReactCSSTransitionGroup>
            </div>
        )
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels, createConversation) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels,createConversation)),
    attemptLeaveAndChangeOwner: (id, owner, keepHistory, requestId) => dispatch(attemptLeaveAndChangeOwner(id, owner, keepHistory, requestId)),
    attemptToggleFavorite: (id, favorite, parentContactId) => dispatch(attemptToggleFavorite(id, favorite, parentContactId)),
    attemptLeaveGroup: (id, username) => dispatch(attemptLeaveOrRemoveMember(id, username, LEAVE_GROUP_COMMAND)),
    toggleSearchMessages: (showSearchMessages) => dispatch(toggleSearchMessages(showSearchMessages)),
    changeRightPanel: (panel, addMemberPlace) => dispatch(changeRightPanel(panel, addMemberPlace)),
    attemptSetSharedMediaMessages: (threadId) => dispatch(attemptSetSharedMediaMessages(threadId)),
    setRightCreateGroupMember: contact => dispatch(setRightCreateGroupMember(contact)),
    deleteGroup: (id, keepHistory) => dispatch(attemptDeleteGroup(id, keepHistory)),
    attemptCreateEmptyConversation: (threadId) => dispatch(attemptCreateEmptyConversation(threadId)),
    attemptSetSelectedThread: (thread) => dispatch(attemptSetSelectedThread(thread)),
    showCreateNewContactPopUp: () => dispatch(showCreateNewContactPopUp()),
    removeCreateContactNumber: () => dispatch(removeCreateContactNumber()),
    hideCreateNewContactPopUp: () => dispatch(hideCreateNewContactPopUp()),
    setSelectedInfoThreadId: id => dispatch(setSelectedInfoThreadId(id)),
    disableGroup: (id, username) => dispatch(disableGroup(id, username)),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    saveContact: (id, contact) => dispatch(saveContact(id, contact)),
    toggleRightPanel: show => dispatch(toggleRightPanel(show)),
    addMessage: message => dispatch(addMessage(message)),
    openSharedMedia: () => dispatch(openSharedMedia()),
    closeSharedMedia: () => dispatch(closeSharedMedia()),
    closeCallOutPopUp: () => dispatch(closeCallOutPopUp()),
    attemptSearchMessages: (keyword) => dispatch(attemptSearchMessages(keyword)),
    removeSearchedMessageId: () => dispatch(removeSearchedMessageId()),
    contactErrors: (errors) => dispatch(contactErrors(errors)),


    createGroup: (group, username, setThread, details, contacts,  conferenceCall) => dispatch(attemptCreateGroup(group, username, setThread, details, contacts, conferenceCall)),

    // Conference call actions start

    startingConference: (groupId) => dispatch(startingConference(groupId)),
    toggleAnotherCallPopup: (anotherCall) => dispatch(toggleAnotherCallPopup(anotherCall)),

    // Conference call actions end

    DELETE_CONTACT: (threadId: string) => dispatch(DELETE_CONTACT(threadId)),
    BLOCK_CONTACT: (contactIds: string[]) => dispatch(BLOCK_CONTACT(contactIds)),
    UNBLOCK_CONTACT: (contactIds: string[]) => dispatch(UNBLOCK_CONTACT(contactIds)),
    toggleCanNotDoCall: (canNotDoCall: boolean) => dispatch(toggleCanNotDoCall(canNotDoCall)),

});

export default connect<{}, {}, IHeaderPassedProps>(mapStateToProps, mapDispatchToProps)(Header);
