"use strict";

import {Map} from "immutable";

import {IDBxConversation} from "services/database/class/Conversation";
import {IContact} from "modules/contacts/ContactsReducer";
import {IRequest} from "modules/requests/RequestsReducer";
import {actions, IApplicationState} from "./ApplicationReducer";
import {ICurrentThread} from "modules/application/ApplicationTypes";

export interface IApplicationActions {
    type: string;
    payload?: {
        updateIsAvailable?: boolean;
        status?: any;
        updateDownloadFinish?: boolean;
        updateDownloadStart?: boolean;
        updateIsLoading?: boolean;
        updateProgress?: number;
        pendingRequests?: Map<string, IRequest>;
        updateConversationTime?: boolean;
        afterCreateGroup?: boolean;
        conversation?: IDBxConversation;
        conversationsLastMessages?: any;
        showOnlineStatus?: boolean;
        gifMessagesCount?: any;
        newMessagesCount?: number;
        channelIds?: Array<string>;
        followers?: Array<string>;
        previousGroupId?: string;
        followersCount?: number;
        groupIds?: Array<string>;
        encodedUsername?: string;
        addMemberPlace?: string;
        showSharedMedia?: boolean;
        filesReceiver?: string;
        handlers?: Array<any>;
        accessToken?: string;
        connectHandler?: any;
        files?: Array<File>;
        mediaMessages?: any;
        threadType?: string;
        lastActivity?: any;
        channelId?: string;
        minimized?: boolean;
        file?: Blob | File;
        amazonLinks?: any;
        newContacts?: any;
        threadTexts?: any;
        callback?: Function;
        showChat?: boolean;
        subPage?: string;
        username?: string;
        threadId?: string;
        password?: string;
        updateTs?: string;
        enable?: boolean;
        gifs?: any;
        contactId?: any;
        messageId?: any;
        keyword?: string;
        show?: boolean;
        isGroup?: boolean;
        panel?: string;
        phone?: number;
        messages?: any;
        caches?: any;
        cache?: any;
        synced?: any;
        effect?: any;
        contact?: any;
        from?: string;
        thread?: any;
        to?: string;
        id?: string;
        message?: any;
        fetchChannel?: number;
        errorMessage?: string;
        showSearchMessages?: boolean;
        sharedMediaCount?: number;
        location?: any;
        messageModalData?: any;
        canNotDoCall?: boolean;
        canNotDeleteGroupPopup?: boolean;


        //refactored


        skip?: number,
        sharedMediaType?: string,
        sharedMediaRecordsMap?: any,
        sharedMediaCountMap?: { total: number, media: number, file: number, link: number },
        sharedMediaUpdater?: any,
        currentThread?: ICurrentThread,
        isLoading?: boolean,
        applicationState?: IApplicationState,
        isFocused?: boolean,
        isOnline?: boolean,
        messageIds?: string[],
        property?: string;
        unreadMessagesCount?: number;
        checkedFilesCount?: {
            media: number,
            file: number,
            link: number,
            total: number
        };
        isDeleteEveryWhere?: boolean;
        ownMessages?: any[];
        version?: string;
        url?: string;
    };
}

export function XMPPConnected(handlers: Array<any>, pendingRequests: Map<string, IRequest>, showOnlineStatus: boolean): IApplicationActions {
    return {type: actions.XMPP_CONNECTED, payload: {handlers, pendingRequests, showOnlineStatus}};
}

export function XMPPDisconnected(username: string, accessToken: string, connectHandler: any): IApplicationActions {
    return {type: actions.XMPP_DISCONNECTED, payload: {username, accessToken, connectHandler}};
}

export function setSelectedInfoThreadId(id: string, previousGroupId: string = null): IApplicationActions {
    return {type: actions.SET_SELECTED_INFO_THREAD_ID, payload: {id, previousGroupId}};
}

export function changeRightPanel(panel: string, addMemberPlace: string = ""): IApplicationActions {
    return {type: actions.CHANGE_RIGHT_PANEL, payload: {panel, addMemberPlace}};
}

export function setFiles(files: Array<File>, filesReceiver: string = null): IApplicationActions {
    return {type: actions.SET_DRAG_AND_DROP_FILES, payload: {files, filesReceiver}}
}

export function attemptSetCreateContactNumber(phone: number): IApplicationActions {
    return {type: actions.ATTEMPT_SET_CREATE_CONTACT_NUMBER, payload: {phone}};
}

export function setRightCreateGroupMember(contact: IContact): IApplicationActions {
    return {type: actions.SET_RIGHT_CREATE_GROUP_MEMBER, payload: {contact}};
}

export function syncCompleted(): IApplicationActions {
    return {type: actions.SYNC_COMPLETED};
}

export function setGroupsData(groupIds: Array<string>): IApplicationActions {
    return {type: actions.SET_GROUPS_DATA, payload: {groupIds}};
}

export function setCreateContactNumber(phone: number): IApplicationActions {
    return {type: actions.SET_CREATE_CONTACT_NUMBER, payload: {phone}};
}

export function sendXMLReceived({from, id, to}: any): IApplicationActions {
    return {type: actions.SEND_XML_RECEIVED, payload: {from, id, to}};
}

export function toggleOnlineStatus(enable: boolean): IApplicationActions {
    return {type: actions.TOGGLE_ONLINE_STATUS, payload: {enable}};
}

export function removeFollower(id: string, username: string): IApplicationActions {
    return {type: actions.REMOVE_FOLLOWER, payload: {id, username}}
}

export function attemptAddFollower(id: string, username: string): IApplicationActions {
    return {type: actions.ATTEMPT_ADD_FOLLOWER, payload: {id, username}}
}

export function addFollower(id: string, username: string): IApplicationActions {
    return {type: actions.ADD_FOLLOWER, payload: {id, username}}
}

export function attemptAddAdmin(id: string, username: string): IApplicationActions {
    return {type: actions.ATTEMPT_ADD_ADMIN, payload: {id, username}}
}

export function addAdmin(id: string, username: string): IApplicationActions {
    return {type: actions.ADD_ADMIN, payload: {id, username}}
}

export function attemptRevokeAdmin(id: string, username: string): IApplicationActions {
    return {type: actions.ATTEMPT_REVOKE_ADMIN, payload: {id, username}}
}

export function revokeAdmin(id: string, username: string): IApplicationActions {
    return {type: actions.REVOKE_ADMIN, payload: {id, username}}
}

export function setSelectedStickerId(id: string): IApplicationActions {
    return {type: actions.SET_SELECTED_STICKER_ID, payload: {id}};
}

export function setSelectedThreadId(id: string): IApplicationActions {
    return {type: actions.SET_SELECTED_THREAD_ID, payload: {id}};
}

export function SET_SELECTED_THREAD_ID(id: string): IApplicationActions {
    return {type: actions.SET_SELECTED_THREAD_ID, payload: {id}};
}

export function setSelectedAvatarUrl(url: string): IApplicationActions {
    return {type: actions.SET_SELECTED_AVATAR_URL, payload: {url}};
}

export function setNewSelectedThreadId(id: string): IApplicationActions {
    return {type: actions.SET_NEW_SELECTED_THREAD_ID, payload: {id}};
}

export function setShowSharedMedia(showSharedMedia: boolean): IApplicationActions {
    return {type: actions.SET_SHOW_SHARED_MEDIA, payload: {showSharedMedia}};
}

export function addMemberSelectedThread(threadId: string, contact: any): IApplicationActions {
    return {type: actions.ADD_MEMBER_SELECTED_THREAD, payload: {threadId, contact}};
}

export function groupsSyncSuccess(): IApplicationActions {
    return {type: actions.GROUPS_SYNC_SUCCESS};
}

export function channelsSyncSuccess(): IApplicationActions {
    return {type: actions.CHANNELS_SYNC_SUCCESS};
}

export function contactsSyncSuccess(): IApplicationActions {
    return {type: actions.CONTACTS_SYNC_SUCCESS}
}

export function conversationsSyncSuccess(): IApplicationActions {
    return {type: actions.CONVERSATIONS_SYNC_SUCCESS}
}

export function privateChatsSyncSuccess(): IApplicationActions {
    return {type: actions.PRIVATE_CHATS_SYNC_SUCCESS}
}

export function attemptRemoveMemberSelectedThread(threadId: string, contactId: string): IApplicationActions {
    return {type: actions.ATTEMPT_REMOVE_MEMBER_SELECTED_THREAD, payload: {threadId, contactId}};
}

export function attemptEnableGroup(threadId: string, username: string): IApplicationActions {
    return {type: actions.ATTEMPT_ENABLE_GROUP, payload: {threadId, username}};
}

export function enableGroup(threadId: string, contact: any): IApplicationActions {
    return {type: actions.ENABLE_GROUP, payload: {threadId, contact}};
}

export function removeMemberSelectedThread(threadId: string, contactId: string): IApplicationActions {
    return {type: actions.REMOVE_MEMBER_SELECTED_THREAD, payload: {threadId, contactId}};
}

export function disableGroupSelectedThread(threadId: string, username: string): IApplicationActions {
    return {type: actions.DISABLE_GROUP_SELECTED_THREAD, payload: {threadId, username}};
}

export function attemptDisableGroup(threadId: string, username: string): IApplicationActions {
    return {type: actions.ATTEMPT_DISABLE_GROUP, payload: {threadId, username}};
}

export function attemptSetSelectedThread(thread: any, updateConversationTime: boolean = false, contactId: string = "", callback?: Function, afterCreateGroup: boolean = false): IApplicationActions {
    return {type: actions.ATTEMPT_SET_SELECTED_THREAD, payload: {thread, updateConversationTime, contactId, callback, afterCreateGroup}};
}

export function attemptDownloadUpdate(fileRemotePath, method, sha512, isAdminRightsRequired) {
    return {type: actions.ATTEMPT_DOWNLOAD_UPDATE, payload: {fileRemotePath, method, sha512, isAdminRightsRequired}};
}

export function setSelectedThread(thread: any): IApplicationActions {
    return {type: actions.SET_SELECTED_THREAD, payload: {thread}};
}

export function setSharedMediaCount(sharedMediaCount: number): IApplicationActions {
    return {type: actions.SET_SHARED_MEDIA_COUNT, payload: {sharedMediaCount}};
}

export function setSendingLocation(location: any): IApplicationActions {
    return {type: actions.SET_SENDING_LOCATION, payload: {location}};
}

export function setFollowersCount(id: string, followersCount: number): IApplicationActions {
    return {type: actions.SET_FOLLOWERS_COUNT, payload: {id, followersCount}}
}

export function resetSelectedThread(): IApplicationActions {
    return {type: actions.RESET_SELECTED_THREAD};
}

export function updateSelectedThread(thread: any): IApplicationActions {
    return {type: actions.UPDATE_SELECTED_THREAD, payload: {thread}};
}

export function checkMutedConversations(encodedUsername: string): IApplicationActions {
    return {type: actions.CHECK_MUTED_CONVERSATIONS, payload: {encodedUsername}};
}

export function toggleRightPanel(show: boolean): IApplicationActions {
    return {type: actions.TOGGLE_RIGHT_PANEL, payload: {show}};
}

export function changeLeftPanel(panel: string): IApplicationActions {
    return {type: actions.CHANGE_LEFT_PANEL, payload: {panel}};
}

export function attemptChangeLeftPanel(panel: string): IApplicationActions {
    return {type: actions.ATTEMPT_CHANGE_LEFT_PANEL, payload: {panel}};
}

export function removeOldCreateContactNumber(): IApplicationActions {
    return {type: actions.REMOVE_CREATE_CONTACT_NUMBER};
}

export function removeRightCreateGroupMember(): IApplicationActions {
    return {type: actions.REMOVE_RIGHT_CREATE_GROUP_MEMBER};
}

export function sendPong({from, id, to}: any): IApplicationActions {
    return {type: actions.SEND_PONG, payload: {from, id, to}};
}

export function sendStoppedTyping(to: string): IApplicationActions {
    return {type: actions.SEND_TYPING_STOPPED, payload: {to}};
}

export function removeCreateContactNumber(): IApplicationActions {
    return {type: actions.REMOVE_CREATE_CONTACT_NUMBER};
}

export function removeSelectedThreadId(): IApplicationActions {
    return {type: actions.REMOVE_SELECTED_THREAD_ID};
}

export function sendTyping(to: string, isGroup: boolean): IApplicationActions {
    return {type: actions.SEND_TYPING, payload: {to, isGroup}};
}

export function toggleProfilePopUp(): IApplicationActions {
    return {type: actions.TOGGLE_PROFILE_POPUP};
}

export function removeLoading(): IApplicationActions {
    return {type: actions.REMOVE_LOADING}
}

export function removeFiles(): IApplicationActions {
    return {type: actions.REMOVE_DRAG_AND_DROP_FILES}
}

export function setLoading(): IApplicationActions {
    return {type: actions.SET_LOADING}
}

export function attemptSetTyping(threadId: string, username?: string): IApplicationActions {
    return {type: actions.ATTEMPT_SET_TYPING, payload: {threadId, username}}
}

export function applicationTyping(threadId: string, username: string): IApplicationActions {
    return {type: actions.SET_TYPING, payload: {threadId, username}}
}

export function applicationStopTyping(threadId: string, username: string): IApplicationActions {
    return {type: actions.STOP_TYPING, payload: {threadId, username}}
}

export function setSelectedThreadType(threadType: string): IApplicationActions {
    return {type: actions.SET_SELECTED_THREAD_TYPE, payload: {threadType: threadType}}
}

export function reset(): IApplicationActions {
    return {type: actions.RESET};
}

export function userBecameOnline(id: string): IApplicationActions {
    return {type: actions.USER_BECAME_ONLINE, payload: {id}}
}

export function userBecameOffline(id: string, lastActivity: string): IApplicationActions {
    return {type: actions.USER_BECAME_OFFLINE, payload: {id, lastActivity}}
}

export function threadBecameOnline(id: string): IApplicationActions {
    return {type: actions.THREAD_BECAME_ONLINE, payload: {id}};
}

export function checkForFailedSync(): IApplicationActions {
    return {type: actions.CHECK_FOR_FAILED_SYNC};
}

export function syncFailed(effect): IApplicationActions {
    return {type: actions.SYNC_FAILED, payload: {effect}};
}

export function resetFailedSync(): IApplicationActions {
    return {type: actions.RESET_FAILED_SYNC};
}

export function threadBecameOffline(id: string, lastActivity: string): IApplicationActions {
    return {type: actions.THREAD_BECAME_OFFLINE, payload: {id, lastActivity}};
}

export function removeSelectedThreadLoading(): IApplicationActions {
    return {type: actions.REMOVE_SET_SELECTED_THREAD_LOADING};
}

export function initializeApplication(): IApplicationActions {
    return {type: actions.INITIALIZE_APPLICATION};
}

export function attemptSetNewMessagesCount(): IApplicationActions {
    return {type: actions.ATTEMPT_SET_NEW_MESSAGES_COUNT, payload: {}}
}

export function updateCallPanel(minimized: boolean, showChat: boolean): IApplicationActions {
    return {type: actions.UPDATE_CALL_PANEL, payload: {minimized: minimized, showChat: showChat}}
}

export function setNewMessagesCount(newMessagesCount): IApplicationActions {
    return {type: actions.SET_NEW_MESSAGES_COUNT, payload: {newMessagesCount: newMessagesCount}}
}

export function setSync(synced): IApplicationActions {
    return {type: actions.SET_SYNCED, payload: {synced}}
}

export function attemptSetSharedMediaMessages(threadId: string): IApplicationActions {
    return {type: actions.ATTEMPT_SET_SHARED_MEDIA_MESSAGES, payload: {threadId}};
}

export function attemptCreateStatus(status: any): IApplicationActions {
    return {type: actions.ATTEMPT_CREATE_STATUS, payload: {status}};
}

export function attemptResetStatuses(): IApplicationActions {
    return {type: actions.ATTEMPT_RESET_STATUSES}
}


export function setSharedMediaMessages(messages: any): IApplicationActions {
    return {type: actions.SET_SHARED_MEDIA_MESSAGES, payload: {messages}}
}

export function getAllCaches(caches: any): IApplicationActions {
    return {type: actions.ATTEMPT_CACHES, payload: {caches}}
}

export function createCache(id: string, cache: any): IApplicationActions {
    return {type: actions.CREATE_CACHE, payload: {id, cache}}
}

export function attemptSetGifMessages(keyword: string): IApplicationActions {
    return {type: actions.ATTEMPT_SET_GIF_MESSAGES, payload: {keyword}};
}

export function attemptShowMoreGifMessages(keyword: string): IApplicationActions {
    return {type: actions.ATTEMPT_SHOW_MORE_GIF_MESSAGES, payload: {keyword}};
}

export function showMoreGifLoading(enable: boolean): IApplicationActions {
    return {type: actions.SHOW_MORE_GIF_LOADING_TOGGLE, payload: {enable}};
}

export function setGifMessagesCount(gifMessagesCount: any): IApplicationActions {
    return {type: actions.SET_GIF_MESSAGES_COUNT, payload: {gifMessagesCount}};
}

export function setShowMoreGifMessages(gifs: any): IApplicationActions {
    return {type: actions.SET_SHOW_MORE_GIF_MESSAGES, payload: {gifs}};
}

export function setGifMessages(gifs: any): IApplicationActions {
    return {type: actions.SET_GIF_MESSAGES, payload: {gifs}}
}

export function setGifsLoading(): IApplicationActions {
    return {type: actions.SET_GIFS_LOADING};
}

export function removeGifsLoading(): IApplicationActions {
    return {type: actions.REMOVE_GIFS_LOADING}
}

export function removeSharedMediaMessages(): IApplicationActions {
    return {type: actions.REMOVE_SHARED_MEDIA_MESSAGES}
}

export function addSharedMediaMessages(messageId: string, message: any): IApplicationActions {
    return {type: actions.ADD_SHARED_MEDIA_MESSAGE, payload: {messageId, message}}
}

export function openSharedMedia(): IApplicationActions {
    return {type: actions.OPEN_SHARED_MEDIA}
}

export function closeSharedMedia(): IApplicationActions {
    return {type: actions.CLOSE_SHARED_MEDIA}
}

export function openCallOutPopUp(): IApplicationActions {
    return {type: actions.OPEN_CALL_OUT_POPUP}
}

export function closeCallOutPopUp(): IApplicationActions {
    return {type: actions.CLOSE_CALL_OUT_POPUP}
}

export function setSearchKeyword(keyword: string): IApplicationActions {
    return {type: actions.SET_SEARCH_TEXT, payload: {keyword}}
}

export function deleteSharedMediaMessages(messageId: string): IApplicationActions {
    return {type: actions.DELETE_SHARED_MEDIA_MESSAGES, payload: {messageId}}
}

export function updateThreadTexts(threadTexts: string): IApplicationActions {
    return {type: actions.UPDATE_THREAD_TEXTS, payload: {threadTexts}}
}

export function setChannelFetch(fetchChannel: number): IApplicationActions {
    return {type: actions.SET_CHANNEL_FETCH, payload: {fetchChannel}}
}

export function setPrivateChatError(errorMessage: string): IApplicationActions {
    return {type: actions.SET_PRIVATE_CHAT_ERROR, payload: {errorMessage}}
}

export function toggleSearchMessages(showSearchMessages: boolean): IApplicationActions {
    return {type: actions.TOGGLE_SEARCH_MESSAGES, payload: {showSearchMessages}}
}

export function removePrivateChatError(): IApplicationActions {
    return {type: actions.REMOVE_PRIVATE_CHAT_ERROR}
}

export function showCreateNewContactPopUp(): IApplicationActions {
    return {type: actions.SHOW_CREATE_NEW_CONTACT_POPUP}
}

export function hideCreateNewContactPopUp(): IApplicationActions {
    return {type: actions.HIDE_CREATE_NEW_CONTACT_POPUP}
}

export function ACTIVATE_CALLER_THREAD(): IApplicationActions {
    return {type: actions.ACTIVATE_CALLER_THREAD}
}

export function FETCH_SELECTED_THREAD(threadId: string): IApplicationActions {
    return {type: actions.FETCH_SELECTED_THREAD, payload: {threadId}}
}

export function FETCH_THREAD(threadId: string): IApplicationActions {
    return {type: actions.FETCH_THREAD, payload: {threadId}}
}

export function FETCH_THREAD_SUCCEED(thread: any, threadId: string): IApplicationActions {
    return {type: actions.FETCH_THREAD_SUCCEED, payload: {thread, threadId}}
}

export function STORING_THREAD_LOADING(threadId: string, isLoading: boolean): IApplicationActions {
    return {type: actions.STORING_THREAD_LOADING, payload: {threadId, isLoading}}
}

export function STORE_THREAD(currentThread: ICurrentThread): IApplicationActions {
    return {type: actions.STORE_THREAD, payload: {currentThread}}
}

/// New actions after refactoring

export function UPDATE_APPLICATION_STATE(applicationState: IApplicationState): IApplicationActions {
    return {type: actions.UPDATE_APPLICATION_STATE, payload: {applicationState}}
}

export function FOCUS_APPLICATION(isFocused: boolean): IApplicationActions {
    return {type: actions.FOCUS_APPLICATION, payload: {isFocused}}
}

export function SET_APPLICATION_FOCUS(isFocused: boolean): IApplicationActions {
    return {type: actions.SET_APPLICATION_FOCUS, payload: {isFocused}}
}

export function NETWORK_STATUS_UPDATE_SUCCESS(isOnline: boolean): IApplicationActions {
    return {type: actions.NETWORK_STATUS_UPDATE_SUCCESS, payload: {isOnline}}
}

export function NETWORK_STATUS_UPDATE(isOnline: boolean): IApplicationActions {
    return {type: actions.NETWORK_STATUS_UPDATE, payload: {isOnline}}
}


export function initializeSharedMedia(threadId: string): IApplicationActions {
    return {type: actions.INITIALIZE_SHARED_MEDIA, payload: {threadId}}
}


export function initializeSharedMediaSucceed(sharedMediaCountMap: { total: number, media: number, file: number, link: number }): IApplicationActions {
    return {type: actions.INITIALIZE_SHARED_MEDIA_SUCCEED, payload: {sharedMediaCountMap}}
}


export function fetchSharedMedia(threadId: string, sharedMediaType: string): IApplicationActions {
    return {type: actions.FETCH_SHARED_MEDIA, payload: {threadId, sharedMediaType}}
}

export function fetchSharedMediaSucceed(sharedMediaType: string, sharedMediaRecordsMap: any, skip: number): IApplicationActions {
    return {type: actions.FETCH_SHARED_MEDIA_SUCCEED, payload: {sharedMediaType, sharedMediaRecordsMap, skip}}
}

export function ADD_MEDIA_RECORD(sharedMediaType: string, sharedMediaRecordsMap: any): IApplicationActions {
    return {type: actions.ADD_MEDIA_RECORD, payload: {sharedMediaType, sharedMediaRecordsMap}}
}

export function fetchSharedMediaFailed(sharedMediaType: string): IApplicationActions {
    return {type: actions.FETCH_SHARED_MEDIA_FAILED, payload: {sharedMediaType}}
}

export function getWalletUrl(): IApplicationActions {
    return {type: actions.GET_WALLET_URL}
}

export function getWalletUrlSucceed(url: string): IApplicationActions {
    return {type: actions.GET_WALLET_URL_SUCCEED, payload: {url}}
}

export function emptyWalletUrl(): IApplicationActions {
    return {type: actions.EMPTY_WALLET_URL}
}

export function DELETE_SHARED_MEDIA_MESSAGES(messageIds: string[], checkedFilesCount: any = {}, isDeleteEveryWhere: boolean = false, ownMessages: any[]): IApplicationActions {
    return {
        type: actions.DELETE_SHARED_MEDIA_MESSAGES,
        payload: {messageIds, checkedFilesCount, isDeleteEveryWhere, ownMessages}
    }
}

export function DELETE_SHARED_MEDIA_MESSAGES_SUCCESS(messageIds: string[], checkedFilesCount: any = {}): IApplicationActions {
    return {type: actions.DELETE_SHARED_MEDIA_MESSAGES_SUCCESS, payload: {messageIds, checkedFilesCount}}
}

export function UPDATE_MEDIA_RECORD(sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any): IApplicationActions {
    return {type: actions.UPDATE_MEDIA_RECORD, payload: {sharedMediaType, messageId, property, sharedMediaUpdater}}
}

export function setSharedMediaImages(messsages){
    return {type: actions.SET_SHARED_MEDIA_IMAGES, payload: messsages}
}
export function addSharedMediaImage(message){
    return {type: actions.ADD_SHARED_MEDIA_IMAGE, payload: message}
}

export function UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS(unreadMessagesCount: number): IApplicationActions {
    return {type: actions.UNREAD_MESSAGES_COUNT_UPDATE_SUCCESS, payload: {unreadMessagesCount}}
}

export function updateApplicationVersionProperty(version: string): IApplicationActions {
    return {type: actions.UPDATE_APPLICATION_VERSION_PROPERTY, payload: {version}}
}

export function updateDownloadProgress(updateProgress: number): IApplicationActions {
    return {type: actions.UPDATE_PROGRESS_BAR, payload: {updateProgress}}
}

export function toggleUpdateDownloadStart(updateDownloadStart: boolean): IApplicationActions {
    return {type: actions.TOGGLE_UPDATE_DOWNLOAD_START, payload: {updateDownloadStart}}
}

export function toggleCanNotDoCall(canNotDoCall: boolean): IApplicationActions {
    return {type: actions.TOGGLE_CAN_NOT_DO_CALL, payload: {canNotDoCall}}
}

export function toggleCanNotDeleteGroup(canNotDeleteGroupPopup: boolean): IApplicationActions {
    return {type: actions.TOGGLE_CAN_NOT_DELETE_GROUP, payload: {canNotDeleteGroupPopup}}
}

export function toggleUpdateDownloadFinish(updateDownloadFinish: boolean): IApplicationActions {
    return {type: actions.TOGGLE_UPDATE_DOWNLOAD_FINISH, payload: {updateDownloadFinish}}
}

export function toggleUpdateIsAvailable(updateIsAvailable: boolean): IApplicationActions {
    return {type: actions.TOGGLE_UPDATE_IS_AVAILABLE, payload: {updateIsAvailable}}
}

export function toggleIsUpdateLoading(updateIsLoading: boolean): IApplicationActions {
    return {type: actions.TOGGLE_UPDATE_IS_LOADING, payload: {updateIsLoading}}
}

export function showMessageModal(messageModalData: object) {
    return {type: actions.SHOW_MESSAGE_MODAL, payload: {messageModalData}};
}

export function hideMessageModal() {
    return {type: actions.HIDE_MESSAGE_MODAL};
}
