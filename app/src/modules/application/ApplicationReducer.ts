"use strict";

import {
    DEFAULT_LEFT_PANEL,
    DEFAULT_RIGHT_PANEL,
    MESSAGE_TYPES,
    RIGHT_PANELS,
    SHARED_MEDIA_TYPES
} from "configs/constants";
import {IApplicationActions} from "./ApplicationActions";
import {fromJS, List, Map} from "immutable";
import {getThreadType} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {IApplicationData} from "modules/application/ApplicationTypes";
import isList = List.isList;
import Log from "modules/messages/Log";
import {IContactsData} from "modules/contacts/ContactsReducer";

interface IApplicationReducerActions {

    ATTEMPT_REMOVE_MEMBER_SELECTED_THREAD: any;
    REMOVE_SET_SELECTED_THREAD_LOADING: string;
    ATTEMPT_SET_CREATE_CONTACT_NUMBER: string;
    REMOVE_OLD_CREATE_CONTACT_NUMBER: string;
    REMOVE_RIGHT_CREATE_GROUP_MEMBER: string;
    ATTEMPT_SET_SHARED_MEDIA_MESSAGES: any;
    SET_SHARED_MEDIA_MESSAGES: string;
    REMOVE_SHARED_MEDIA_MESSAGES: string;
    ATTEMPT_CREATE_STATUS: string;
    ATTEMPT_RESET_STATUSES: string;
    // DELETE_SHARED_MEDIA_MESSAGES: string;
    DISABLE_GROUP_SELECTED_THREAD: string;
    REMOVE_MEMBER_SELECTED_THREAD: string;
    SET_RIGHT_CREATE_GROUP_MEMBER: string;
    REMOVE_CREATE_CONTACT_NUMBER: string;
    SET_SELECTED_INFO_THREAD_ID: string;
    ATTEMPT_CACHES: string;
    CREATE_CACHE: string;
    ATTEMPT_SET_NEW_MESSAGES_COUNT: any;
    REMOVE_DRAG_AND_DROP_FILES: string;
    ADD_MEMBER_SELECTED_THREAD: string;
    PRIVATE_CHATS_SYNC_SUCCESS: string;
    CONVERSATIONS_SYNC_SUCCESS: any;
    SET_CREATE_CONTACT_NUMBER: string;
    REMOVE_SELECTED_THREAD_ID: string;
    ATTEMPT_SET_SELECTED_THREAD: any;
    ATTEMPT_DOWNLOAD_UPDATE: any;
    UPDATE_PROGRESS_BAR: any;
    TOGGLE_UPDATE_DOWNLOAD_START: any;
    TOGGLE_UPDATE_DOWNLOAD_FINISH: any;
    TOGGLE_UPDATE_IS_AVAILABLE: any;
    TOGGLE_UPDATE_IS_LOADING: any;
    ADD_SHARED_MEDIA_MESSAGE: string;
    OPEN_SHARED_MEDIA: string;
    CLOSE_SHARED_MEDIA: string;
    SET_SELECTED_STICKER_ID: string;
    SET_DRAG_AND_DROP_FILES: string;
    CHECK_MUTED_CONVERSATIONS: any;
    UPDATE_SELECTED_THREAD: string;
    SET_SELECTED_THREAD_ID: string;
    SET_SELECTED_AVATAR_URL: string;
    SET_NEW_SELECTED_THREAD_ID: string;
    ATTEMPT_CHANGE_LEFT_PANEL: any;
    THREAD_BECAME_OFFLINE: string;
    RESET_SELECTED_THREAD: string;
    SET_SHOW_SHARED_MEDIA: string;
    SET_SELECTED_THREAD_TYPE: any;
    CHECK_FOR_FAILED_SYNC: any;
    SET_FOLLOWERS_COUNT: string;
    THREAD_BECAME_ONLINE: string;
    USER_BECAME_ONLINE: string;
    USER_BECAME_OFFLINE: string;
    TOGGLE_ONLINE_STATUS: string;
    TOGGLE_PROFILE_POPUP: string;
    SET_SELECTED_THREAD: string;
    SEND_TYPING_STOPPED: string;
    OPEN_CALL_OUT_POPUP: string;
    CLOSE_CALL_OUT_POPUP: string;
    GROUPS_SYNC_SUCCESS: any;
    INITIALIZE_APPLICATION: any;
    CHANGE_RIGHT_PANEL: string;
    TOGGLE_RIGHT_PANEL: string;
    ATTEMPT_SET_FOLLOWERS: any;
    SET_NEW_MESSAGES_COUNT: any;
    ATTEMPT_DISABLE_GROUP: any;
    XMPP_DISCONNECTED: string;
    RESET_FAILED_SYNC: string;
    CHANNELS_SYNC_SUCCESS: any;
    CHANGE_LEFT_PANEL: string;
    ATTEMPT_REVOKE_ADMIN: any;
    SEND_XML_RECEIVED: string;
    SET_CHANNELS_DATA: string;
    CONTACTS_SYNC_SUCCESS: any;
    UPDATE_THREAD_TEXTS: any;
    UPDATE_CALL_PANEL: any;
    ATTEMPT_ADD_FOLLOWER: any;
    ATTEMPT_ENABLE_GROUP: any;
    SET_CHANNEL_DATA: string;
    CONNECT_DATABASE: string;
    SET_GROUPS_DATA: string;
    REMOVE_FOLLOWER: string;
    SYNC_COMPLETED: string;
    REMOVE_LOADING: string;
    XMPP_CONNECTED: string;
    ATTEMPT_ADD_ADMIN: any;
    SET_CHANNEL_FETCH: string;
    SET_SEARCH_TEXT: string;
    SET_FOLLOWERS: string;
    ENABLE_GROUP: string;
    ADD_FOLLOWER: string;
    REVOKE_ADMIN: string;
    SET_LOADING: string;
    SEND_TYPING: string;
    STOP_TYPING: string;
    SET_TYPING: string;
    ATTEMPT_SET_TYPING: any;
    ADD_ADMIN: string;
    SEND_PONG: string;
    SYNC_FAILED: any;
    RESET: string;
    SET_SYNCED: any;
    SET_SHARED_MEDIA_COUNT: any;
    SET_SENDING_LOCATION: string;

    SET_GIF_MESSAGES_COUNT: string;
    SHOW_MORE_GIF_LOADING_TOGGLE: string;
    ATTEMPT_SHOW_MORE_GIF_MESSAGES: any;
    SET_SHOW_MORE_GIF_MESSAGES: string;
    ATTEMPT_SET_GIF_MESSAGES: any;
    SET_GIF_MESSAGES: string;
    REMOVE_GIFS_LOADING: string;
    SET_GIFS_LOADING: string;
    SET_PRIVATE_CHAT_ERROR: string;
    REMOVE_PRIVATE_CHAT_ERROR: string;
    SHOW_CREATE_NEW_CONTACT_POPUP: string;
    HIDE_CREATE_NEW_CONTACT_POPUP: string;
    TOGGLE_SEARCH_MESSAGES: string;

    ACTIVATE_CALLER_THREAD: any;


    FETCH_THREAD: any;
    FETCH_SELECTED_THREAD: any;
    FETCH_THREAD_SUCCEED: string;
    STORING_THREAD_LOADING: string;
    STORE_THREAD: string;

    UPDATE_APPLICATION_STATE: string;
    FOCUS_APPLICATION: any;
    SET_APPLICATION_FOCUS: string;
    NETWORK_STATUS_UPDATE: any;
    NETWORK_STATUS_UPDATE_SUCCESS: string;

    UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS: string;
    INITIALIZE_SHARED_MEDIA: any;
    INITIALIZE_SHARED_MEDIA_SUCCEED: string;

    FETCH_SHARED_MEDIA: any,
    FETCH_SHARED_MEDIA_SUCCEED: string
    FETCH_SHARED_MEDIA_FAILED: string
    ADD_MEDIA_RECORD: string
    UPDATE_MEDIA_RECORD: string
    SET_SHARED_MEDIA_IMAGES: any;
    ADD_SHARED_MEDIA_IMAGE: any;
    DELETE_SHARED_MEDIA_MESSAGES: any,
    DELETE_SHARED_MEDIA_MESSAGES_SUCCESS: string,
    GET_WALLET_URL: string,
    GET_WALLET_URL_SUCCEED: string,
    EMPTY_WALLET_URL: string,

    UPDATE_APPLICATION_VERSION_PROPERTY: any,

    SHOW_MESSAGE_MODAL: string,
    HIDE_MESSAGE_MODAL: string,
    TOGGLE_CAN_NOT_DO_CALL: string,
    TOGGLE_CAN_NOT_DELETE_GROUP: string,
}

export const actions: IApplicationReducerActions = {
    ATTEMPT_REMOVE_MEMBER_SELECTED_THREAD: "APPLICATION:ATTEMPT_REMOVE_MEMBER_SELECTED_THREAD",
    REMOVE_SET_SELECTED_THREAD_LOADING: "APPLICATION:REMOVE_SET_SELECTED_THREAD_LOADING",
    ATTEMPT_SET_CREATE_CONTACT_NUMBER: "APPLICATION:ATTEMPT_SET_CREATE_CONTACT_NUMBER",
    ATTEMPT_SET_SHARED_MEDIA_MESSAGES: "APPLICATION:ATTEMPT_SET_SHARED_MEDIA_MESSAGES",
    REMOVE_OLD_CREATE_CONTACT_NUMBER: "APPLICATION:REMOVE_OLD_CREATE_CONTACT_NUMBER",
    REMOVE_RIGHT_CREATE_GROUP_MEMBER: "APPLICATION:REMOVE_RIGHT_CREATE_GROUP_MEMBER",
    REMOVE_SHARED_MEDIA_MESSAGES: "APPLICATION:REMOVE_SHARED_MEDIA_MESSAGES",
    ATTEMPT_CREATE_STATUS: "APPLICATION:ATTEMPT_CREATE_STATUS",
    ATTEMPT_RESET_STATUSES: "APPLICATION:ATTEMPT_RESET_STATUSES",
    SET_SHARED_MEDIA_MESSAGES: "APPLICATION:SET_SHARED_MEDIA_MESSAGES",
    ATTEMPT_CACHES: "APPLICATION:ATTEMPT_CACHES",
    CREATE_CACHE: "APPLICATION:CREATE_CACHE",
    // DELETE_SHARED_MEDIA_MESSAGES: "APPLICATION:DELETE_SHARED_MEDIA_MESSAGES",
    ATTEMPT_SET_NEW_MESSAGES_COUNT: "APPLICATION:ATTEMPT_SET_NEW_MESSAGES_COUNT",
    REMOVE_MEMBER_SELECTED_THREAD: "APPLICATION:REMOVE_MEMBER_SELECTED_THREAD",
    PRIVATE_CHATS_SYNC_SUCCESS: "APPLICATION:PRIVATE_CHATS_SYNC_SUCCESS",
    DISABLE_GROUP_SELECTED_THREAD: "APPLICATION:DISABLE_GROUP_SELECTED_THREAD",
    SET_RIGHT_CREATE_GROUP_MEMBER: "APPLICATION:SET_RIGHT_CREATE_GROUP_MEMBER",
    REMOVE_CREATE_CONTACT_NUMBER: "APPLICATION:REMOVE_CREATE_CONTACT_NUMBER",
    SET_SELECTED_INFO_THREAD_ID: "APPLICATION:SET_SELECTED_INFO_THREAD_ID",
    ATTEMPT_SET_SELECTED_THREAD: "APPLICATION:ATTEMPT_SET_SELECTED_THREAD",
    ATTEMPT_DOWNLOAD_UPDATE: "APPLICATION:ATTEMPT_DOWNLOAD_UPDATE",
    UPDATE_PROGRESS_BAR: "APPLICATION:UPDATE_PROGRESS_BAR",
    TOGGLE_UPDATE_DOWNLOAD_START: "APPLICATION:TOGGLE_UPDATE_DOWNLOAD_START",
    TOGGLE_UPDATE_DOWNLOAD_FINISH: "APPLICATION:TOGGLE_UPDATE_DOWNLOAD_FINISH",
    TOGGLE_UPDATE_IS_AVAILABLE: "APPLICATION:TOGGLE_UPDATE_IS_AVAILABLE",
    TOGGLE_UPDATE_IS_LOADING: "APPLICATION:TOGGLE_UPDATE_IS_LOADING",
    CONVERSATIONS_SYNC_SUCCESS: "APPLICATION:CONVERSATIONS_SYNC_SUCCESS",
    REMOVE_DRAG_AND_DROP_FILES: "APPLICATION:REMOVE_DRAG_AND_DROP_FILES",
    ADD_MEMBER_SELECTED_THREAD: "APPLICATION:ADD_MEMBER_SELECTED_THREAD",
    SET_CREATE_CONTACT_NUMBER: "APPLICATION:SET_CREATE_CONTACT_NUMBER",
    CHECK_MUTED_CONVERSATIONS: "APPLICATION:CHECK_MUTED_CONVERSATIONS",
    ATTEMPT_CHANGE_LEFT_PANEL: "APPLICATION:ATTEMPT_CHANGE_LEFT_PANEL",
    REMOVE_SELECTED_THREAD_ID: "APPLICATION:REMOVE_SELECTED_THREAD_ID",
    ADD_SHARED_MEDIA_MESSAGE: "APPLICATION:ADD_SHARED_MEDIA_MESSAGE",
    OPEN_SHARED_MEDIA: "APPLICATION:OPEN_SHARED_MEDIA",
    CLOSE_SHARED_MEDIA: "APPLICATION:CLOSE_SHARED_MEDIA",
    SET_SELECTED_THREAD_TYPE: "APPLICATION:SET_SELECTED_THREAD_TYPE",
    SET_SELECTED_STICKER_ID: "APPLICATION:SET_SELECTED_STICKER_ID",
    SET_DRAG_AND_DROP_FILES: "APPLICATION:SET_DRAG_AND_DROP_FILES",
    INITIALIZE_APPLICATION: "APPLICATION:INITIALIZE_APPLICATION",
    SET_SELECTED_THREAD_ID: "APPLICATION:SET_SELECTED_THREAD_ID",
    SET_SELECTED_AVATAR_URL: "APPLICATION:SET_SELECTED_AVATAR_URL",
    SET_NEW_SELECTED_THREAD_ID : "APPLICATION:SET_NEW_SELECTED_THREAD_ID",
    SET_SHOW_SHARED_MEDIA: "APPLICATION:SET_SHOW_SHARED_MEDIA",
    UPDATE_SELECTED_THREAD: "APPLICATION:UPDATE_SELECTED_THREAD",
    SET_NEW_MESSAGES_COUNT: "APPLICATION:SET_NEW_MESSAGES_COUNT",
    ATTEMPT_SET_FOLLOWERS: "APPLICATION:ATTEMPT_SET_FOLLOWERS",
    RESET_SELECTED_THREAD: "APPLICATION:RESET_SELECTED_THREAD",
    ATTEMPT_DISABLE_GROUP: "APPLICATION:ATTEMPT_DISABLE_GROUP",
    CONTACTS_SYNC_SUCCESS: "APPLICATION:CONTACTS_SYNC_SUCCESS",
    CHANNELS_SYNC_SUCCESS: "APPLICATION:CHANNELS_SYNC_SUCCESS",
    CHECK_FOR_FAILED_SYNC: "APPLICATION:CHECK_FOR_FAILED_SYNC",
    THREAD_BECAME_OFFLINE: "APPLICATION:THREAD_BECAME_OFFLINE",
    ATTEMPT_REVOKE_ADMIN: "APPLICATION:ATTEMPT_REVOKE_ADMIN",
    ATTEMPT_ENABLE_GROUP: "APPLICATION:ATTEMPT_ENABLE_GROUP",
    ATTEMPT_ADD_FOLLOWER: "APPLICATION:ATTEMPT_ADD_FOLLOWER",
    THREAD_BECAME_ONLINE: "APPLICATION:THREAD_BECAME_ONLINE",
    USER_BECAME_ONLINE: "APPLICATION:USER_BECAME_ONLINE",
    USER_BECAME_OFFLINE: "APPLICATION:USER_BECAME_OFFLINE",
    TOGGLE_ONLINE_STATUS: "APPLICATION:TOGGLE_ONLINE_STATUS",
    TOGGLE_PROFILE_POPUP: "APPLICATION:TOGGLE_PROFILE_POPUP",
    SET_FOLLOWERS_COUNT: "APPLICATION:SET_FOLLOWERS_COUNT",
    SEND_TYPING_STOPPED: "APPLICATIONS:SEND_TYPING_STOPPED",
    SET_SELECTED_THREAD: "APPLICATION:SET_SELECTED_THREAD",
    GROUPS_SYNC_SUCCESS: "APPLICATION:GROUPS_SYNC_SUCCESS",
    OPEN_CALL_OUT_POPUP: "APPLICATION:OPEN_CALL_OUT_POPUP",
    CLOSE_CALL_OUT_POPUP: "APPLICATION:CLOSE_CALL_OUT_POPUP",
    CHANGE_RIGHT_PANEL: "APPLICATION:CHANGE_RIGHT_PANEL",
    TOGGLE_RIGHT_PANEL: "APPLICATION:TOGGLE_RIGHT_PANEL",
    UPDATE_THREAD_TEXTS: "APPLICATION:UPDATE_THREAD_TEXTS",
    UPDATE_CALL_PANEL: "APPLICATION:UPDATE_CALL_PANEL",
    ATTEMPT_ADD_ADMIN: "APPLICATIONS:ATTEMPT_ADD_ADMIN",
    SET_CHANNEL_FETCH: "APPLICTAIONS:SET_CHANNEL_FETCH",
    SET_CHANNELS_DATA: "APPLICATION:SET_CHANNELS_DATA",
    RESET_FAILED_SYNC: "APPLICATION:RESET_FAILED_SYNC",
    CHANGE_LEFT_PANEL: "APPLICATION:CHANGE_LEFT_PANEL",
    XMPP_DISCONNECTED: "APPLICATION:XMPP_DISCONNECTED",
    SEND_XML_RECEIVED: "APPLICATION:SEND_XML_RECEIVED",
    SET_SEARCH_TEXT: "APPLICATION:SET_SEARCH_TEXT",
    SET_CHANNEL_DATA: "APPLICATION:SET_CHANNEL_DATA",
    CONNECT_DATABASE: "APPLICATION:CONNECT_DATABASE",
    SET_GROUPS_DATA: "APPLICATION:SET_GROUPS_DATA",
    REMOVE_FOLLOWER: "APPLICATION:REMOVE_FOLLOWER",
    REMOVE_LOADING: "APPLICATION:REMOVE_LOADING",
    SYNC_COMPLETED: "APPLICATION:SYNC_COMPLETED",
    XMPP_CONNECTED: "APPLICATION:XMPP_CONNECTED",
    SET_FOLLOWERS: "APPLICATION:SET_FOLLOWERS",
    ENABLE_GROUP: "APPLICATION:ENABLE_GROUP",
    ADD_FOLLOWER: "APPLICATION:ADD_FOLLOWER",
    REVOKE_ADMIN: "APPLICATION:REVOKE_ADMIN",
    SET_LOADING: "APPLICATION:SET_LOADING",
    SYNC_FAILED: "APPLICATION:SYNC_FAILED",
    SEND_TYPING: "APPLICATION:SEND_TYPING",
    STOP_TYPING: "APPLICATION:STOP_TYPING",
    SET_TYPING: "APPLICATION:SET_TYPING",
    ATTEMPT_SET_TYPING: "APPLICATION:ATTEMPT_SET_TYPING",
    SET_SYNCED: "APPLICATION:SET_SYNCED",
    ADD_ADMIN: "APPLICATION:ADD_ADMIN",
    SEND_PONG: "APPLICATION:SEND_PONG",
    RESET: "APPLICATION:RESET",
    SET_SHARED_MEDIA_COUNT: "APPLICATION:SET_SHARED_MEDIA_COUNT",
    SET_SENDING_LOCATION: "APPLICATION:SET_SENDING_LOCATION",

    SET_GIF_MESSAGES_COUNT: "APPLICATION:SET_GIF_MESSAGES_COUNT",
    SHOW_MORE_GIF_LOADING_TOGGLE: "APPLICATION:SHOW_MORE_GIF_LOADING_TOGGLE",
    ATTEMPT_SHOW_MORE_GIF_MESSAGES: "APPLICATION:ATTEMPT_SHOW_MORE_GIF_MESSAGES",
    SET_SHOW_MORE_GIF_MESSAGES: "APPLICATION:SET_SHOW_MORE_GIF_MESSAGES",
    ATTEMPT_SET_GIF_MESSAGES: "APPLICATION:ATTEMPT_SET_GIF_MESSAGES",
    REMOVE_GIFS_LOADING: "APPLICATION:REMOVE_GIFS_LOADING",
    SET_GIFS_LOADING: "APPLICATION:SET_GIFS_LOADING",
    SET_GIF_MESSAGES: "APPLICATION:SET_GIF_MESSAGES",
    SET_PRIVATE_CHAT_ERROR: "APPLICATION:SET_PRIVATE_CHAT_ERROR",
    REMOVE_PRIVATE_CHAT_ERROR: "APPLICATION:REMOVE_PRIVATE_CHAT_ERROR",
    SHOW_CREATE_NEW_CONTACT_POPUP: "APPLICATION:SHOW_CREATE_NEW_CONTACT_POPUP",
    HIDE_CREATE_NEW_CONTACT_POPUP: "APPLICATION:HIDE_CREATE_NEW_CONTACT_POPUP",
    TOGGLE_SEARCH_MESSAGES: "APPLICATION:TOGGLE_SEARCH_MESSAGES",

    ACTIVATE_CALLER_THREAD: "APPLICATION:ACTIVATE_CALLER_THREAD",


    FETCH_THREAD: "APPLICATION:FETCH_THREAD",
    FETCH_SELECTED_THREAD: "APPLICATION:FETCH_SELECTED_THREAD",
    FETCH_THREAD_SUCCEED: "APPLICATION:FETCH_THREAD_SUCCEED",
    STORING_THREAD_LOADING: "APPLICATION:STORING_THREAD_LOADING",
    STORE_THREAD: "APPLICATION:STORE_THREAD",

    FOCUS_APPLICATION: "APPLICATION:FOCUS_APPLICATION",
    UPDATE_APPLICATION_STATE: "APPLICATION:UPDATE_APPLICATION_STATE",
    NETWORK_STATUS_UPDATE: "APPLICATION:NETWORK_STATUS_UPDATE",
    SET_APPLICATION_FOCUS: "APPLICATION:SET_APPLICATION_FOCUS",
    NETWORK_STATUS_UPDATE_SUCCESS: "APPLICATION:NETWORK_STATUS_UPDATE_SUCCESS",
    UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS: "APPLICATION:UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS",

    INITIALIZE_SHARED_MEDIA: "APPLICATION:INITIALIZE_SHARED_MEDIA",
    INITIALIZE_SHARED_MEDIA_SUCCEED: "APPLICATION:INITIALIZE_SHARED_MEDIA_SUCCEED",

    FETCH_SHARED_MEDIA: "APPLICATION:FETCH_SHARED_MEDIA",
    FETCH_SHARED_MEDIA_SUCCEED: "APPLICATION:FETCH_SHARED_MEDIA_SUCCEED",
    FETCH_SHARED_MEDIA_FAILED: "APPLICATION:FETCH_SHARED_MEDIA_FAILED",
    ADD_MEDIA_RECORD: "APPLICATION:ADD_MEDIA_RECORD",
    UPDATE_MEDIA_RECORD: "APPLICATION:UPDATE_MEDIA_RECORD",
    SET_SHARED_MEDIA_IMAGES: "APPLICATION:SET_SHARED_MEDIA_IMAGES",
    ADD_SHARED_MEDIA_IMAGE: "APPLICATION:ADD_SHARED_MEDIA_IMAGE",
    DELETE_SHARED_MEDIA_MESSAGES: "APPLICATION:DELETE_SHARED_MEDIA_MESSAGES",
    DELETE_SHARED_MEDIA_MESSAGES_SUCCESS: "APPLICATION:DELETE_SHARED_MEDIA_MESSAGES_SUCCESS",
    GET_WALLET_URL: "APPLICATION:GET_WALLET_URL",
    GET_WALLET_URL_SUCCEED: "APPLICATION:GET_WALLET_URL_SUCCEED",
    EMPTY_WALLET_URL: "APPLICATION:EMPTY_WALLET_URL",

    UPDATE_APPLICATION_VERSION_PROPERTY: "APPLICATION:UPDATE_APPLICATION_VERSION_PROPERTY",

    SHOW_MESSAGE_MODAL: "APPLICATION:SHOW_MESSAGE_MODAL",
    HIDE_MESSAGE_MODAL: "APPLICATION:HIDE_MESSAGE_MODAL",
    TOGGLE_CAN_NOT_DO_CALL: "APPLICATION:TOGGLE_CAN_NOT_DO_CALL",
    TOGGLE_CAN_NOT_DELETE_GROUP: "APPLICATION:TOGGLE_CAN_NOT_DELETE_GROUP",
};

export interface IApplicationState extends Partial<Map<string, any>> {
    isLoading?: boolean,
    isOnline?: boolean,
    stateName?: string,
    config?: {
        version: string,
        env: string
    },
    leftSidebar?: "CONTACTS" | "CONVERSATIONS" | "KEYPAD" | "SETTINGS",
    status?: {
        isReconnecting?: boolean
        socket: number
    },
    language?: string,
    isRightSidebarVisible?: boolean,
    shouldUserPasswordSet?: boolean,
    shouldUserProfileSet?: boolean,
}

export const APPLICATION_DISABLED_LOGGING_ACTIONS: Array<string> = [
    actions.ATTEMPT_SET_CREATE_CONTACT_NUMBER,
    actions.REMOVE_OLD_CREATE_CONTACT_NUMBER,
    actions.REMOVE_RIGHT_CREATE_GROUP_MEMBER,
    actions.SET_RIGHT_CREATE_GROUP_MEMBER,
    actions.REMOVE_CREATE_CONTACT_NUMBER,
    actions.FOCUS_APPLICATION,
    actions.SET_CREATE_CONTACT_NUMBER,
    actions.REMOVE_SELECTED_THREAD_ID,
    actions.SET_SELECTED_THREAD_ID,
    actions.SET_NEW_SELECTED_THREAD_ID,
    actions.TOGGLE_PROFILE_POPUP,
    actions.CHANGE_RIGHT_PANEL,
    actions.TOGGLE_RIGHT_PANEL,
    actions.CHANGE_LEFT_PANEL,
    actions.REMOVE_LOADING,
    actions.SET_LOADING
];

export const defaultState: IApplicationData = fromJS({
    caches: {},
    showLoading: {percentage: 0, msgId: "", showProgressBar: false},
    previousRightPanel: DEFAULT_RIGHT_PANEL,
    previousLeftPanel: DEFAULT_LEFT_PANEL,
    rightPanel: DEFAULT_RIGHT_PANEL,
    leftPanel: DEFAULT_LEFT_PANEL,
    sharedMediaMessages: {},
    gifMessages: {},
    gifMessagesCount: {},
    gifsLoading: false,
    isFocused: true,
    showMoreGifLoading: false,
    sendingLocation: null,
    selectedThread: {
        conversations: {},
        messages: {},
        threads: {},
        members: {},
         loading: true,
        loadingTime: 0,
    },
    synced: {
        conversations: false,
        channels: false,
        groups: false,
        contacts: false,
        privateChats: false
    },
    failedSync: [],
    oldCreateContactNumber: "",
    rightCreateGroupMember: "",
    selectedInfoThreadId: "",
    createContactNumber: "",
    showProfilePopUp: false,
    selectedStickerId: null,
    previousGroupId: null,
    showRightPanel: false,
    selectedThreadId: "",
    onlineUsers: {},
    threadSavedTexts: null,
    addMembersPlace: "",
    showSharedMedia: false,
    sharedMediaPanel: false,
    sharedMediaCount: null,
    createNewContactPopUp: false,
    outCallPopup: false,
    showChat: false,
    minimized: false,
    loading: false,
    privateChatError: "",
    showSearchMessages: false,
    files: null,
    updateProgress: 0,
    updateDownloadStart: false,
    updateDownloadFinish: false,
    updateIsAvailable: false,
    updateIsLoading: true,
    statuses: [],
    canNotDoCallPopup: false,
    canNotDeleteGroupPopup: false,
    // refactored


    currentThread: {
        threadId: '',
        isLoading: false,
        media: {
            count: 0
        },
        mute: {
            isMuted: false,
            interval: 0
        },
        presence: {
            lastVisit: ""
        },
        isBlocked: false,
        isFavorite: false,
        thread: {
            type: '',
            value: {},
        },
        draft: ""
    },

    applicationState: {
        isLoading: false,
        isOnline: true,
        stateName: "",
        selectedAvatarUrl: "",
        config: {
            version: "",
            env: ""
        },
        leftSidebar: "CONTACTS",
        status: {
            isReconnecting: false,
            socket: null
        },
        language: 'en-US',
        isRightSidebarVisible: false,
        shouldUserPasswordSet: false,
        shouldUserProfileSet: false,
        walletURL: ""
    },
    sharedMedia: {
        isInitialized: false,
        total: 0,
        types: {
            media: {
                label: "MEDIA",
                isLoading: false,
                count: 0,
                skip: 0,
                records: {},
                imageUrls: {},
            },
            file: {
                label: "FILE",
                isLoading: false,
                count: 0,
                skip: 0,
                records: {}
            },
            link: {
                label: "LINK",
                isLoading: false,
                count: 0,
                skip: 0,
                records: {}
            },
        }

    },
    messageModal: {
        name: "",
        isOpen: false,
        coords: {
            top: 0,
            left: 0,
        },
    },
});

export default (state: IApplicationData = defaultState, {type, payload}: IApplicationActions): IApplicationData => {
    switch (type) {

        case actions.REMOVE_OLD_CREATE_CONTACT_NUMBER:
            return state.set("oldCreateContactNumber", "") as IApplicationData;

        case actions.REMOVE_RIGHT_CREATE_GROUP_MEMBER:
            return state.set("rightCreateGroupMember", "") as IApplicationData;

        case actions.SET_PRIVATE_CHAT_ERROR:
            return state.set("privateChatError", payload.errorMessage) as IApplicationData;

        case actions.REMOVE_PRIVATE_CHAT_ERROR:
            return state.set("privateChatError", "") as IApplicationData;

        case actions.SET_RIGHT_CREATE_GROUP_MEMBER:
            return state.set("rightCreateGroupMember", payload.contact) as IApplicationData;

        case actions.REMOVE_CREATE_CONTACT_NUMBER:
            return state.set("oldCreateContactNumber", state.get("createContactNumber")).set("createContactNumber", "") as IApplicationData;

        case actions.SET_SELECTED_INFO_THREAD_ID:
            return state.set("selectedInfoThreadId", payload.id).set("previousGroupId", payload.previousGroupId) as IApplicationData;

        case actions.REMOVE_DRAG_AND_DROP_FILES:
            return state.set("files", null).set("filesReceiver", null) as IApplicationData;

        case actions.REMOVE_SELECTED_THREAD_ID:
            return state.set("selectedInfoThreadId", null).set("selectedThreadId", null) as IApplicationData;

        case actions.SET_CREATE_CONTACT_NUMBER:
            return state.set("createContactNumber", payload.phone) as IApplicationData;

        case actions.ADD_MEMBER_SELECTED_THREAD: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.threadId) {
                return state.updateIn(['selectedThread', 'threads', 'threadInfo', 'groupMembersUsernames'],
                    groupMembersUsernames => groupMembersUsernames.push(payload.contact.username))
                    .setIn(['selectedThread', 'members', payload.contact.contactId], fromJS(payload.contact)) as IApplicationData;
            }
            return state;
        }

        case actions.GROUPS_SYNC_SUCCESS:
            return state.setIn(['synced', 'groups'], true) as IApplicationData;

        case actions.CHANNELS_SYNC_SUCCESS:
            return state.setIn(['synced', 'channels'], true) as IApplicationData;

        case actions.CONVERSATIONS_SYNC_SUCCESS:
            return state.setIn(['synced', 'conversations'], true) as IApplicationData;

        case actions.PRIVATE_CHATS_SYNC_SUCCESS:
            return state.setIn(['synced', 'privateChats'], true) as IApplicationData;

        case actions.CONTACTS_SYNC_SUCCESS:
            return state.setIn(['synced', 'contacts'], true) as IApplicationData;

        case actions.REMOVE_MEMBER_SELECTED_THREAD: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.threadId) {
                return state.updateIn(['selectedThread', 'threads', 'threadInfo', 'groupMembersUsernames'],
                    groupMembersUsernames => groupMembersUsernames.filter(groupMemberUsername => !payload.contactId.includes(groupMemberUsername)))
                    .deleteIn(['selectedThread', 'members', payload.contactId]) as IApplicationData;
            }
            return state;
        }

        case actions.DISABLE_GROUP_SELECTED_THREAD: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.threadId) {
                return state.updateIn(["selectedThread", "threads", "threadInfo"],
                    threadInfo => threadInfo.update("groupMembersUsernames",
                        groupMembersUsernames => groupMembersUsernames.filter(groupMembersUsername => groupMembersUsername !== payload.username))
                        .update("members", members => members.filter(member => member !== payload.username))
                        .set("disabled", true))
                    .deleteIn(['selectedThread', 'members', `${payload.username}@${SINGLE_CONVERSATION_EXTENSION}`]) as IApplicationData;
            }

            return state.updateIn(["conversations", payload.threadId, "threads", "threadInfo"],
              threadInfo => threadInfo.update("groupMembersUsernames",
                groupMembersUsernames => groupMembersUsernames.filter(groupMembersUsername => groupMembersUsername !== payload.username))
                .update("members", members => members.filter(member => member !== payload.username))
                .set("disabled", true))
              .deleteIn(["conversations", payload.threadId, 'members', `${payload.username}@${SINGLE_CONVERSATION_EXTENSION}`]) as IApplicationData;

            return state;
        }

        case actions.ENABLE_GROUP: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.threadId) {
                return state.updateIn(["selectedThread", "threads", "threadInfo"],
                    threadInfo => threadInfo
                        .update("groupMembersUsernames", groupMembersUsernames => !groupMembersUsernames.includes(payload.contact.username) ? groupMembersUsernames.push(payload.contact.username) : groupMembersUsernames)
                        .update("members", members => !members.includes(payload.contact.username) ? members.push(payload.contact.username) : members)
                        .setIn(['selectedThread', 'members', payload.contact.contactId], fromJS(payload.contact))
                        .setIn(["disabled"], false)) as IApplicationData;
            }

            return state;
        }

        case actions.THREAD_BECAME_ONLINE: {
            const threadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (threadId === payload.id) {
                return state.setIn(["selectedThread", "members", threadId, "status"], "online") as IApplicationData;
            }
            return state;
        }

        case actions.THREAD_BECAME_OFFLINE: {
            const threadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (threadId === payload.id) {
                return state.updateIn(["selectedThread", "members", threadId],
                    threadInfo => threadInfo && threadInfo.set("status", "offline")
                        .set("lastActivity", payload.lastActivity)) as IApplicationData;
            }
            return state;
        }

        case actions.USER_BECAME_ONLINE: {
            return state.setIn(["onlineUsers",payload.id, "status"], "online") as IApplicationData
        }

        case actions.USER_BECAME_OFFLINE: {
            return state.setIn(["onlineUsers",payload.id,"status"], "offline").setIn(["onlineUsers",payload.id,"lastActivity"], payload.lastActivity) as IApplicationData
        }

        case actions.SYNC_FAILED: {
            return state.update("failedSync", failedSync => failedSync.push(payload.effect)) as IApplicationData;
        }

        case actions.RESET_FAILED_SYNC: {
            return state.set("failedSync", List()) as IApplicationData;
        }

        case actions.SET_SELECTED_THREAD: {
            const thread = payload.thread;
            thread.loadingTime = Date.now();
            return Map.isMap(thread) ? state.set("selectedThread", thread) as IApplicationData : state.set("selectedThread", fromJS(thread)) as IApplicationData;
            // return state.set("selectedThread", fromJS({...payload.thread})) as IApplicationData;
        }

        case actions.SET_SHARED_MEDIA_COUNT: {
            return state.set("sharedMediaCount", payload.sharedMediaCount) as IApplicationData;
        }

        case actions.SET_SENDING_LOCATION: {
            return state.set("sendingLocation", payload.location) as IApplicationData;
        }

        case actions.SET_SHOW_SHARED_MEDIA: {
            return state.set("showSharedMedia", fromJS(payload.showSharedMedia)) as IApplicationData;
        }

        case actions.SET_APPLICATION_FOCUS: {
            return state.set("isFocused", payload.isFocused) as IApplicationData;
        }

        case actions.RESET_SELECTED_THREAD:
            return state.set('selectedThread', fromJS({
                conversations: {},
                messages: {},
                threads: {},
                members: {},
            })) as IApplicationData;

        case actions.ADD_ADMIN: {
            const threadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (threadId === payload.id) {
                return state
                    .updateIn(["selectedThread", "threads", "threadInfo"], threadInfo => threadInfo
                        .update("admins", admins => admins.push(payload.username))
                        .update("followersCount", followersCount => followersCount + 1)
                        .update("followers", followers => followers.filter(follower => follower !== payload.username))) as IApplicationData;
            }
            return state;
        }

        case actions.REVOKE_ADMIN: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.id) {
                return state
                    .updateIn(["selectedThread", "threads", "threadInfo"], threadInfo => threadInfo
                        .update("admins", admins => admins.filter(admin => admin !== payload.username))
                        .update("followers", followers => followers.push(payload.username))) as IApplicationData;
                // .updateIn(["selectedThread", "threads", "threadInfo", "followers"], followers => followers.push(payload.username))
            }
            return state;
        }

        case actions.ADD_FOLLOWER: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.id) {
                return state
                    .updateIn(["selectedThread", "threads", "threadInfo"], threadInfo => threadInfo
                        .update("followers", followers => followers.push(payload.username))
                        .update("followersCount", followersCount => followersCount + 1)) as IApplicationData;
            }
            return state;

        }

        case actions.REMOVE_FOLLOWER: {
            const selectedThreadId = state.getIn(["selectedThread", "threads", "threadId"]);
            if (selectedThreadId === payload.id) {
                return state.updateIn(["selectedThread", "threads", "threadInfo"], threadInfo => threadInfo
                    .update("followers", followers => followers.filter(follower => follower !== payload.username))
                    .update("followersCount", followersCount => followersCount - 1)) as IApplicationData;
            }
            return state;
        }

        case actions.UPDATE_SELECTED_THREAD: {
            const thread = state.get("selectedThread").toJS();
            const {threads: {threadId}} = thread;
            const {threads: {threadType}} = thread;
            const {isGroup} = getThreadType(threadType);
            let threadData = isGroup ? thread.threads.threadInfo : thread.members[threadId];
            threadData = {...threadData, ...payload.thread};

            if (isGroup) {
                thread.threads.threadInfo = threadData;
            } else {
                thread.members[threadId] = threadData;
            }

            return state.set("selectedThread", fromJS({...thread})) as IApplicationData;
        }

        case actions.SET_DRAG_AND_DROP_FILES:
            if (payload.filesReceiver) {
                return state
                    .set("files", payload.files)
                    .set("previousGroupId", null)
                    .set("selectedThreadId", payload.filesReceiver)
                    .set("selectedInfoThreadId", payload.filesReceiver) as IApplicationData;
            } else {
                return state.set("files", payload.files) as IApplicationData;
            }

        case actions.GET_WALLET_URL_SUCCEED:
            return state
                .setIn(["applicationState", "walletURL"], payload.url) as IApplicationData;

        case actions.EMPTY_WALLET_URL:
            return state
                .setIn(["applicationState", "walletURL"], "") as IApplicationData;

        case actions.SET_SELECTED_STICKER_ID:
            return state.set("selectedStickerId", payload.id) as IApplicationData;

        case actions.SET_SELECTED_THREAD_ID:
            return state.set("selectedThreadId", payload.id) as IApplicationData;

        case actions.SET_SELECTED_AVATAR_URL:
            return state.setIn(["applicationState", "selectedAvatarUrl"], payload.url) as IApplicationData;

        case actions.SET_NEW_SELECTED_THREAD_ID:
            return  state.set('selectedThreadId', payload.id) as IApplicationData;
        case actions.TOGGLE_PROFILE_POPUP:
            return state.update("showProfilePopUp", showProfilePopUp => !showProfilePopUp) as IApplicationData;

        case actions.TOGGLE_RIGHT_PANEL:
            return state.update("showRightPanel", showRightPanel => !showRightPanel) as IApplicationData;

        case actions.CHANGE_RIGHT_PANEL:
            return state.set("previousRightPanel", state.get("rightPanel")).set("rightPanel", payload.panel).set("addMemberPlace", payload.addMemberPlace) as IApplicationData;

        case actions.CHANGE_LEFT_PANEL:
            return state.set("previousLeftPanel", state.get("leftPanel")).set("leftPanel", payload.panel) as IApplicationData;

        case actions.REMOVE_LOADING:
            return state.set("loading", false) as IApplicationData;

        case actions.SET_LOADING:
            return state.set("loading", true) as IApplicationData;

        case actions.REMOVE_SET_SELECTED_THREAD_LOADING:
            return state.setIn(["selectedThread", "loading"], false).setIn(["selectedThread", "loadingTime"], Date.now()) as IApplicationData;

        case actions.SET_FOLLOWERS:
            const threadId = state.getIn(['selectedThread', 'threads', 'threadId']);
            if (threadId === payload.id) {
                return state.setIn(["selectedThread", "threads", "threadInfo", "followers"], fromJS(payload.followers)) as IApplicationData;
            }
            return state;

        case actions.SET_FOLLOWERS_COUNT: {
            const threadId = state.getIn(['selectedThread', 'threads', 'threadId']);
            if (threadId === payload.id) {
                return state.setIn(["selectedThread", "threads", "threadInfo", "followersCount"], fromJS(payload.followersCount)) as IApplicationData;
            }
            return state;
        }

        case actions.SET_SELECTED_THREAD_TYPE:
            return state.set("selectedThreadType", payload.threadType) as IApplicationData;

        case actions.SET_SEARCH_TEXT:
            return state.set("searchKeyword", payload.keyword) as IApplicationData;

        case actions.SET_TYPING:
            if (state.has("selectedThread") && state.getIn(["selectedThread", "threads", "threadId"]) === payload.threadId) {

                return state.updateIn(["selectedThread", "conversations", "typing"],
                    typing => isList(typing) ?
                        !typing.includes(payload.username) ?
                            typing.push(payload.username) :
                            typing :
                        List([payload.username])) as IApplicationData;
            }

            return state;

        case actions.STOP_TYPING:
            if (state.has("selectedThread") && state.getIn(["selectedThread", "threads", "threadId"]) === payload.threadId) {
                return state.updateIn(["selectedThread", "conversations", "typing"],
                    typing => {
                        if(typing) {
                            return typing.filter(username => payload.username !== username)
                        }
                    }) as IApplicationData;
            }
            return state;

        case actions.SET_NEW_MESSAGES_COUNT: {
            return state.set("newMessages", fromJS({
                thread: payload.newMessagesCount
            })) as IApplicationData;
        }

        case actions.UPDATE_CALL_PANEL: {
            return state.set("minimized", payload.minimized).set("showChat", payload.showChat) as IApplicationData;
        }

        case actions.SET_SYNCED: {
            return state.set("synced", fromJS({...payload.synced})) as IApplicationData;
        }

        case actions.SET_SHARED_MEDIA_MESSAGES: {
            if (state.has("selectedThread")) {
                const messages = {...payload.messages};
                return state.set("sharedMediaMessages", fromJS({...messages})) as IApplicationData;
            }
            return state;
        }

        case actions.ATTEMPT_CACHES:
            return state.update("caches", caches => caches.merge(fromJS(payload.caches))) as IApplicationData;

        case actions.CREATE_CACHE:

            state = state.setIn(["caches", payload.id], fromJS({...payload.cache})) as IApplicationData;


            return state;

        case actions.SET_GIF_MESSAGES: {
            if (state.has("selectedThread")) {
                return state.set("gifMessages", fromJS({...payload.gifs})) as IApplicationData;
            }
            return state;
        }

        case actions.SHOW_MORE_GIF_LOADING_TOGGLE: {
            if (state.has("selectedThread")) {
                return state.set("showMoreGifLoading", payload.enable) as IApplicationData;
            }
            return state;
        }

        case actions.SET_SHOW_MORE_GIF_MESSAGES: {
            if (state.has("selectedThread")) {
                return state.update("gifMessages", gifMessages => gifMessages.merge(fromJS({...payload.gifs}))) as IApplicationData;
            }
            return state;
        }

        case actions.SET_GIF_MESSAGES_COUNT: {
            if (state.has("selectedThread")) {
                return state.set("gifMessagesCount", fromJS({...payload.gifMessagesCount})) as IApplicationData;
            }
            return state;
        }

        case actions.SET_GIFS_LOADING: {
            return state.set("gifsLoading", true) as IApplicationData;
        }

        case actions.REMOVE_GIFS_LOADING: {
            return state.set("gifsLoading", false) as IApplicationData;
        }

        case actions.REMOVE_SHARED_MEDIA_MESSAGES: {
            if (state.has("selectedThread")) {
                return state.set("sharedMediaMessages", fromJS({})) as IApplicationData;
            }
            return state;
        }

        case actions.ATTEMPT_CREATE_STATUS: {
            return state.update("statuses", statuses => {
                if(typeof statuses === "object") {
                    return statuses.push(payload.status)
                } else {
                    return []
                }
            }) as IApplicationData;
        }

        case actions.ATTEMPT_RESET_STATUSES: {
            return state.update("statuses", statuses => List([])) as IApplicationData;
        }

        case actions.UPDATE_THREAD_TEXTS: {
            if (payload.threadTexts) {
                return state.set("threadTexts", fromJS(payload.threadTexts)) as IApplicationData;
            }
            return state;
        }

        case actions.ADD_SHARED_MEDIA_MESSAGE: {
            if (payload.message) {
                return state.setIn(["sharedMediaMessages", payload.messageId], fromJS(payload.message)) as IApplicationData;
            }
            return state;
        }

        case actions.OPEN_SHARED_MEDIA: {
            return state.set("sharedMediaPanel", true) as IApplicationData;
        }

        case actions.CLOSE_SHARED_MEDIA: {
            return state.set("sharedMediaPanel", false) as IApplicationData;
        }

        case actions.OPEN_CALL_OUT_POPUP: {
            return state.set("outCallPopup", true) as IApplicationData;
        }

        case actions.CLOSE_CALL_OUT_POPUP: {
            return state.set("outCallPopup", false) as IApplicationData;
        }

        case actions.SET_CHANNEL_FETCH: {
            return state.set("fetchChannel", payload.fetchChannel) as IApplicationData;
        }

        case actions.HIDE_CREATE_NEW_CONTACT_POPUP: {
            return state.set("createNewContactPopUp", false) as IApplicationData;
        }

        case actions.SHOW_CREATE_NEW_CONTACT_POPUP: {
            return state.set("createNewContactPopUp", true) as IApplicationData;
        }

        case actions.TOGGLE_SEARCH_MESSAGES:
            if (state.has("selectedThread")) {
                return state.set("showSearchMessages", payload.showSearchMessages) as IApplicationData;
            }
            return state;

        case actions.RESET:
            return defaultState;


        // refactored

        case actions.STORE_THREAD:
            return state
                .setIn(['currentThread', 'thread'], fromJS(payload.currentThread.thread))
                .setIn(['currentThread', 'draft'], payload.currentThread.draft)
                .setIn(['currentThread', 'isLoading'], false) as IApplicationData;

        case actions.STORING_THREAD_LOADING:
            return state
                .setIn(['currentThread', 'isLoading'], payload.isLoading)
                .setIn(['currentThread', 'threadId'], payload.threadId) as IApplicationData;


        case actions.UPDATE_APPLICATION_STATE:
            if (typeof payload.applicationState.leftSidebar !== 'undefined') {
                state = state.setIn(["applicationState", "leftSidebar"], payload.applicationState.leftSidebar) as IApplicationData;
            }

            if (typeof payload.applicationState.isLoading !== 'undefined') {
                state = state.setIn(["applicationState", "isLoading"], payload.applicationState.isLoading) as IApplicationData;
            }

            if (typeof payload.applicationState.shouldUserPasswordSet !== 'undefined') {
                state = state.setIn(["applicationState", "shouldUserPasswordSet"], payload.applicationState.shouldUserPasswordSet) as IApplicationData;
            }

            if (typeof payload.applicationState.shouldUserProfileSet !== 'undefined') {
                state = state.setIn(["applicationState", "shouldUserProfileSet"], payload.applicationState.shouldUserProfileSet) as IApplicationData;
            }

            if (typeof payload.applicationState.stateName !== 'undefined') {
                state = state.setIn(["applicationState", "stateName"], payload.applicationState.stateName) as IApplicationData;
            }
            if (typeof payload.applicationState.config !== 'undefined' && payload.applicationState.config.env) {
                state = state.setIn(["applicationState", "config", "env"], payload.applicationState.config.env) as IApplicationData;
            }
            if (typeof payload.applicationState.config !== 'undefined' && payload.applicationState.config.version) {
                state = state.setIn(["applicationState", "config", "version"], payload.applicationState.config.version) as IApplicationData;
            }

            if (typeof payload.applicationState.status !== 'undefined' && payload.applicationState.status.socket > 0) {
                state = state.setIn(["applicationState", "status", "socket"], payload.applicationState.status.socket) as IApplicationData;
            }

            return state as IApplicationData;

        case actions.NETWORK_STATUS_UPDATE_SUCCESS:
            return state.setIn(["applicationState", "isOnline"], payload.isOnline) as IApplicationData;


        case actions.INITIALIZE_SHARED_MEDIA:
            return state
                .setIn(["sharedMedia", "isInitialized"], defaultState.getIn(["sharedMedia", "isInitialized"]))
                .setIn(["sharedMedia", "types"], defaultState.getIn(["sharedMedia", "types"])) as IApplicationData;

        case actions.INITIALIZE_SHARED_MEDIA_SUCCEED:
            return state
                .setIn(["sharedMedia", "isInitialized"], true)
                .setIn(["sharedMedia", "total"], payload.sharedMediaCountMap.total)
                .setIn(["sharedMedia", "types", "media", "count"], payload.sharedMediaCountMap.media)
                .setIn(["sharedMedia", "types", "file", "count"], payload.sharedMediaCountMap.file)
                .setIn(["sharedMedia", "types", "link", "count"], payload.sharedMediaCountMap.link) as IApplicationData;

        case actions.FETCH_SHARED_MEDIA:
            return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "isLoading"], true) as IApplicationData;

        case actions.FETCH_SHARED_MEDIA_SUCCEED:
            // state = state.setIn(["sharedMedia", "types", payload.sharedMediaType, "skip"], payload.skip) as IApplicationData;
            // let records = state.getIn(["sharedMedia", "types", payload.sharedMediaType, "records"]);
            // for (const msgId in payload.sharedMediaRecordsMap) {
            //     if (payload.sharedMediaRecordsMap.hasOwnProperty(msgId)) {
            //         records = records.set(msgId, fromJS(payload.sharedMediaRecordsMap[msgId]));
            //     }
            // }
            //
            // return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "records"], fromJS(records).toOrderedMap()) as IApplicationData;
            return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "isLoading"], false)
                .setIn(["sharedMedia", "types", payload.sharedMediaType, "skip"], payload.skip)
                .updateIn(["sharedMedia", "types", payload.sharedMediaType, "records"],
                    records => records.merge(fromJS(payload.sharedMediaRecordsMap))) as IApplicationData;

        case actions.FETCH_SHARED_MEDIA_FAILED:
            return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "isLoading"], false) as IApplicationData;

        case actions.ADD_MEDIA_RECORD:
            const msgId: string = payload.sharedMediaRecordsMap.messages.messageId || payload.sharedMediaRecordsMap.messages.id;
            return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "records", msgId], fromJS(payload.sharedMediaRecordsMap))
                .setIn(["sharedMedia", "total"], state.getIn(["sharedMedia", "total"]) + 1) as IApplicationData;

        case actions.DELETE_SHARED_MEDIA_MESSAGES_SUCCESS:
            for (const id of payload.messageIds) {
                if (state.getIn(["sharedMedia", "types", SHARED_MEDIA_TYPES.MEDIA, "records", id])) {
                    state = state.deleteIn(["sharedMedia", "types", SHARED_MEDIA_TYPES.MEDIA, "records", id]) as IApplicationData;
                } else if (state.getIn(["sharedMedia", "types", SHARED_MEDIA_TYPES.FILE, "records", id])) {
                    state = state.deleteIn(["sharedMedia", "types", SHARED_MEDIA_TYPES.FILE, "records", id]) as IApplicationData;
                } else {
                    state = state.deleteIn(["sharedMedia", "types", SHARED_MEDIA_TYPES.LINK, "records", id]) as IApplicationData;
                }
            }

            state = state.setIn(["sharedMedia", "total"], state.getIn(["sharedMedia", "total"]) - payload.messageIds.length)
                .setIn(["sharedMedia", "types", "media", "count"], state.getIn(["sharedMedia", "types", "media", "count"]) - payload.checkedFilesCount.media)
                .setIn(["sharedMedia", "types", "file", "count"], state.getIn(["sharedMedia", "types", "media", "count"]) - payload.checkedFilesCount.file)
                .setIn(["sharedMedia", "types", "link", "count"], state.getIn(["sharedMedia", "types", "media", "count"]) - payload.checkedFilesCount.link) as IApplicationData;

            return state as IApplicationData;

        case actions.UPDATE_MEDIA_RECORD:
            return state.setIn(["sharedMedia", "types", payload.sharedMediaType, "records", payload.messageId, "messages", payload.property], fromJS(payload.sharedMediaUpdater)) as IApplicationData;
        case actions.SET_SHARED_MEDIA_IMAGES:
            state = state.setIn(["sharedMedia","types","media","imageUrls"], payload) as IApplicationData;
            return state;
        case actions.ADD_SHARED_MEDIA_IMAGE:
            const messageId = payload['key'];
            const imageURL = payload['value'];
            let imageUrls = {...state.getIn(["sharedMedia","types","media","imageUrls"])};
          if(imageUrls.size === 0) {
              imageUrls = {}
          }
            imageUrls[messageId] = imageURL;
            state = state.setIn(["sharedMedia","types","media","imageUrls"], Map.isMap(imageURL) ? imageUrls.toJS() : imageUrls) as IApplicationData;
            return state;
        case actions.FETCH_THREAD_SUCCEED:
            return state.set("selectedThread", fromJS({...payload.thread}))
                .setIn(['selectedThread', 'threads', 'threadId'], payload.threadId) as IApplicationData;

        case actions.UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS:
            return state.set("newMessages", {thread: payload.unreadMessagesCount}) as IApplicationData;
        case actions.UPDATE_PROGRESS_BAR:
            return state.set("updateProgress", Math.round((100*payload.updateProgress))) as IApplicationData;
        case actions.TOGGLE_UPDATE_DOWNLOAD_START:
            return  state.set("updateDownloadStart", payload.updateDownloadStart) as IApplicationData;
        case actions.TOGGLE_CAN_NOT_DO_CALL:
            return  state.set("canNotDoCallPopup", payload.canNotDoCall) as IApplicationData;
        case actions.TOGGLE_CAN_NOT_DELETE_GROUP:
            return  state.set("canNotDeleteGroupPopup", payload.canNotDeleteGroupPopup) as IApplicationData;
        case actions.TOGGLE_UPDATE_DOWNLOAD_FINISH:
            return state.set("updateDownloadFinish", payload.updateDownloadFinish) as IApplicationData;
        case actions.TOGGLE_UPDATE_IS_AVAILABLE:
            return state.set("updateIsAvailable", payload.updateIsAvailable) as IApplicationData;
        case actions.TOGGLE_UPDATE_IS_LOADING:
            return state.set("updateIsLoading", payload.updateIsLoading) as IApplicationData;
        case actions.SHOW_MESSAGE_MODAL:
            return state.setIn(["messageModal", "coords"], fromJS({...payload.messageModalData.coords}))
                .setIn(["messageModal", "isOpen"], true)
                .setIn(["messageModal", "name"], payload.messageModalData.name)
                .setIn(["messageModal", "callbacks"], fromJS(payload.messageModalData.callbacks)) as IApplicationData;
        case actions.HIDE_MESSAGE_MODAL:
            return state.setIn(["messageModal", "isOpen"], false)
                .setIn(["messageModal", "coords", "left"], 0)
                .setIn(["messageModal", "coords", "top"], 0) as IApplicationData;

        default:
            return state;
    }
};
