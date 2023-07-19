"use strict";

import {actions, IContact} from "./ContactsReducer";
import {IConversationActions} from "modules/conversations/ConversationsActions";

export interface IContactsActions {
    type: string;
    payload?: {
        blockedContactNumbers?: Array<string>;
        removeSelectedThreadId?: boolean;
        blockedContacts?: Array<string>;
        contactIds?: string[];
        isProductContact?: boolean;
        parentContactId?: string;
        phone?: string[] | string;
        contactsToBlock?: string;
        isPrivateChat?: boolean;
        lastActivity?: string;
        setThreadId?: boolean;
        createConversation?: boolean;
        editableId?: string;
        username?: string;
        favorite?: boolean;
        contactId?: string;
        contact?: IContact;
        file?: File | Blob;
        firstName?: string;
        messageId?: string;
        requestId?: number;
        lastName?: string;
        threadId?: string;
        muted?: boolean;
        blocked?: boolean;
        avatarUrl?: Blob;
        command?: string;
        saved?: boolean;
        mainId?: number;
        parentMainId?: number;
        author?: string;
        imageUrl?: Blob;
        limit?: number;
        contacts?: any;
        color?: any;
        avatarHash?: string;
        blob?: Blob;
        type?: number;
        id?: string;
        email?: string[];
        numbers?: string[];
        image?: Blob;
        avatar?: Blob;
        labels?: any[];
        label?: string;
        contactErrors?: any;

        favoritesChanges?: { prevValue: boolean, value: boolean, username: string }[];
        updatedFavorites?: { contactId: string, isFavorite: boolean }[];
        skip?: number,
        records?: any,
        count?: number,
        list?: IContact,
        loading?: boolean,
        updatedContacts?: IContact[]
        q?: string
        isSearch?: boolean;
        isDeleted?: boolean;
        emailAddress?: string
        isScrollToBottom?: boolean
        contactsSearch?: string
        editable?: boolean
        notSaved?: boolean
        notificationMessage?: any
    };
}

export function toggleMuteContact(threadId: string, muted: boolean): IConversationActions {
    return {type: actions.TOGGLE_MUTE_CONTACTS, payload: {threadId, muted}};
}

export function attemptCreateContact(id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean = false, type?: number, email: any = [], labels: any[] = [], createConversation?: boolean, editableId?: string, notSaved: boolean = false, notificationMessage: any = null): IContactsActions {
    return {
        type: actions.ATTEMPT_CREATE_CONTACT,
        payload: {id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels, createConversation, editableId, notSaved, notificationMessage}
    };
}

export function createContact(id: string, contact: any): IContactsActions {
    return {type: actions.CREATE_CONTACT, payload: {id, contact}};
}

export function attemptEnableContactEditable(id: string, editable: boolean): IContactsActions {
    return {type: actions.EDITABLE_CONTACT, payload: {id, editable}};
}

export function contactErrors(contactErrors: any): IContactsActions {
    return {type: actions.CONTACT_ERRORS, payload: {contactErrors}};
}

export function attemptToggleProductContact(id: string): IContactsActions {
    return {type: actions.ATTEMPT_TOGGLE_PRODUCT_CONTACT, payload: {id}};
}

export function toggleProductContact(id: string): IContactsActions {
    return {type: actions.TOGGLE_PRODUCT_CONTACT, payload: {id}};
}

export function contactCreationDone(contactId: string): IContactsActions {
    return {type: actions.CONTACT_CREATION_DONE, payload: {contactId}};
}

export function updateContact(id: string, firstName: string, lastName: string, phone: string, avatarUrl?: Blob, imageUrl?: Blob, isProductContact?: boolean, saved?: boolean, favorite?: boolean, mainId?: number, parentMainId?: number, numbers?: string[], image?: Blob, avatar?: Blob, label?: string, color?: any, avatarHash?: string): IContactsActions {
    return {
        type: actions.UPDATE_CONTACT,
        payload: {
            id,
            firstName,
            lastName,
            phone,
            avatarUrl,
            imageUrl,
            isProductContact,
            saved,
            favorite,
            mainId,
            parentMainId,
            numbers,
            image,
            avatar,
            label,
            color,
            avatarHash
        }
    };
}

export function attemptToggleBlock(contactsToBlock: string, command: string, requestId: number): IContactsActions {
    return {type: actions.ATTEMPT_TOGGLE_BLOCK, payload: {contactsToBlock, command, requestId}};
}

export function deleteConversation(id: string, removeSelectedThreadId: boolean): IContactsActions {
    return {type: actions.DELETE_CONVERSATION, payload: {id, removeSelectedThreadId}}
}


export function contactBecameOffline(id: string, lastActivity: string): IContactsActions {
    return {type: actions.CONTACT_BECAME_OFFLINE, payload: {id, lastActivity}};
}

export function setBlockedContacts(blockedContacts: any): IContactsActions {
    return {type: actions.SET_BLOCKED_CONTACTS, payload: {blockedContacts}};
}

export function attemptSetBlockedContactNumbers(blockedContactNumbers: any): IContactsActions {
    return {type: actions.ATTEMPT_SET_BLOCKED_CONTACT_NUMBERS, payload: {blockedContactNumbers}};
}

export function setBlockedContactIds(contactIds: any): IContactsActions {
    return {type: actions.SET_BLOCKED_CONTACT_IDS, payload: {contactIds}};
}

export function toggleBlocked(id: string, blocked: boolean): IContactsActions {
    return {type: actions.TOGGLE_BLOCK, payload: {id, blocked}};
}

// export function attemptUpdateContact(id: string, firstName: string, lastName: string, phone: number | string, username?: string, contact?: IContact, avatarUrl?: Blob, imageUrl?: Blob, favorite?: boolean) {
//     return {
//         type: actions.ATTEMPT_UPDATE_CONTACT,
//         payload: {id, firstName, lastName, phone, username, contact, avatarUrl, imageUrl, favorite}
//     };
// }

export function attemptUpdateContact(idList: any, firstName: string, lastName: string, phoneList: any, username?: string, svContacts?: IContact, avatarUrl?: Blob, imageUrl?: Blob, favorite?: boolean) {
    return {
        type: actions.ATTEMPT_UPDATE_CONTACT,
        payload: {idList, firstName, lastName, phoneList, username, svContacts, avatarUrl, imageUrl, favorite}
    };
}

export function attemptToggleFavorite(id: string, favorite: boolean, parentContactId?: string): IContactsActions {
    return {type: actions.ATTEMPT_TOGGLE_FAVORITE, payload: {id, favorite, parentContactId}};
}

export function attemptFavoritesUpdate(favoritesChanges: { prevValue: boolean, value: boolean, username: string }[]): IContactsActions {
    return {type: actions.ATTEMPT_FAVORITES_UPDATE, payload: {favoritesChanges}}
}

export function toggleConversationMuted(id: string): IContactsActions {
    return {type: actions.TOGGLE_CONVERSATION_MUTED, payload: {id}};
}

export function contactStoppedTyping(id: string): IContactsActions {
    return {type: actions.CONTACT_STOPPED_TYPING, payload: {id}};
}

export function contactBecameOnline(id: string): IContactsActions {
    return {type: actions.CONTACT_BECAME_ONLINE, payload: {id}};
}

export function removeLastMessageId(id: string): IContactsActions {
    return {type: actions.REMOVE_LAST_MESSAGE_ID, payload: {id}}
}

export function toggleFavorite(id: string, parentContactId?: string): IContactsActions {
    return {type: actions.TOGGLE_FAVORITE, payload: {id, parentContactId}};
}

export function contactTyping(id: string): IContactsActions {
    return {type: actions.CONTACT_TYPING, payload: {id}};
}

export function saveContact(id: string, contact: any): IContactsActions {
    return {type: actions.ATTEMPT_SAVE_CONTACT, payload: {id, contact}};
}

export function reset(): IContactsActions {
    return {type: actions.RESET}
}

export function contactsBulkInsert(contacts): IContactsActions {
    return {type: actions.CONTACTS_BULK_INSERT, payload: {contacts}}
}

export function setContactsLoading(): IContactsActions {
    return {type: actions.SET_CONTACTS_LOADING}
}

export function removeContactsLoading(): IContactsActions {
    return {type: actions.REMOVE_CONTACTS_LOADING}
}

export function attemptSetContacts(username: string): IContactsActions {
    return {type: actions.ATTEMPT_SET_CONTACTS, payload: {username}}
}

export function attemptGetBlockedContacts(limit: number): IContactsActions {
    return {type: actions.ATTEMPT_GET_BLOCKED_CONTACTS, payload: {limit}};
}

export function UPDATE_FAVORITES(updatedContacts: IContact []): IContactsActions {
    return {type: actions.UPDATE_FAVORITES, payload: {updatedContacts}};
}

export function FETCH_CONTACT_LIST(skip: number, limit: number, q: string = "", isProductContact: boolean = true, isScrollToBottom: boolean = false): IContactsActions {
    return {type: actions.FETCH_CONTACT_LIST, payload: {skip, limit, q, isProductContact, isScrollToBottom}};
}

export function STORE_CONTACT_LIST(records: any, count: number, isSearch?: boolean, isProductContact?: boolean, isScrollToBottom?: boolean, contactsSearch: string = ""): IContactsActions {
    return {type: actions.STORE_CONTACT_LIST, payload: {records, count, isSearch, isProductContact, isScrollToBottom, contactsSearch}};
}

export function updateContactAvatar(threadId: string, blob: Blob, avatarHash: string): IContactsActions {
    return {type: actions.UPDATE_CONTACT_AVATAR, payload: {threadId, blob, avatarHash}};
}

export function FETCH_FAVORITE_CONTACT_LIST(q?: string): IContactsActions {
    return {type: actions.FETCH_FAVORITE_CONTACT_LIST, payload: {q}};
}

export function STORE_FAVORITE_CONTACT_LIST(records: any, isSearch?: boolean): IContactsActions {
    return {type: actions.STORE_FAVORITE_CONTACT_LIST, payload: {records, isSearch}};
}

export function TOGGLE_CONTACTS_LOADING(loading: boolean): IContactsActions {
    return {type: actions.TOGGLE_CONTACTS_LOADING, payload: {loading}};
}

export function DELETE_CONTACT(contactId: string): IContactsActions {
    return {type: actions.DELETE_CONTACT, payload: {contactId}};
}

export function DELETE_CONTACT_SUCCEED(contactId: string): IContactsActions {
    return {type: actions.DELETE_CONTACT_SUCCEED, payload: {contactId}};
}

export function UNBLOCK_CONTACT(contactIds: string[]): IContactsActions {
    return {type: actions.UNBLOCK_CONTACT, payload: {contactIds}};
}

export function BLOCK_CONTACT(contactIds: string[]): IContactsActions {
    return {type: actions.BLOCK_CONTACT, payload: {contactIds}};
}

export function contactUpdate(threadId?: string, emailAddress?: string, isDeleted?: boolean): IContactsActions {
    return {type: actions.CONTACT_UPDATE, payload: {threadId, emailAddress, isDeleted}};
}

export function contactUpdateSucceed(threadId: string, firstName: string, lastName: string, avatar: Blob, image: Blob | File, isDeleted?: boolean): IContactsActions {
    return {type: actions.CONTACT_UPDATE_SUCCEED, payload: {threadId, firstName, lastName, avatar, image, isDeleted}};
}

export function contactUpdateError(): IContactsActions {
    return {type: actions.CONTACT_UPDATE_ERROR, payload: {}};
}
