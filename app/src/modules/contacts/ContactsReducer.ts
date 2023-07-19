"use strict";

import {IContactsActions} from "./ContactsActions";
import {fromJS, List, Map} from "immutable";
import {getInitials, isPublicRoom} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {updateContactProperties} from "helpers/StoreHelper";
import {IConversationsData} from "modules/conversations/ConversationsReducer";

interface IContactsReducerActions {
    ATTEMPT_SET_BLOCKED_CONTACT_NUMBERS: any;
    ATTEMPT_TOGGLE_PRODUCT_CONTACT: any;
    SET_BLOCKED_CONTACT_IDS: string;
    TOGGLE_CONVERSATION_MUTED: string;
    ATTEMPT_GET_BLOCKED_CONTACTS: any
    REMOVE_CONTACTS_LOADING: string;
    CONTACT_BECAME_OFFLINE: string;
    REMOVE_LAST_MESSAGE_ID: string;
    ATTEMPT_CREATE_CONTACT: string;
    CONTACT_STOPPED_TYPING: string;
    TOGGLE_PRODUCT_CONTACT: string;
    CONTACT_BECAME_ONLINE: string;
    ATTEMPT_TOGGLE_BLOCK: string;
    SET_BLOCKED_CONTACTS: string;
    CONTACTS_BULK_INSERT: string;
    SET_CONTACTS_LOADING: string;
    TOGGLE_MUTE_CONTACTS: string;
    ATTEMPT_TOGGLE_FAVORITE: any;
    ATTEMPT_FAVORITES_UPDATE: any;
    DELETE_CONVERSATION: string;
    CONTACT_ADDED_TO_DB: string;
    ATTEMPT_UPDATE_CONTACT: any;
    CONTACT_CREATION_DONE: any;
    ATTEMPT_SET_CONTACTS: any;
    ATTEMPT_SAVE_CONTACT: any;
    TOGGLE_FAVORITE: string;
    CONTACT_TYPING: string;
    CREATE_CONTACT: string;
    UPDATE_CONTACT: string;
    EDITABLE_CONTACT: string;
    TOGGLE_BLOCK: string;
    RESET: string;


    UPDATE_FAVORITES: string;
    FETCH_CONTACT_LIST: any;
    FETCH_FAVORITE_CONTACT_LIST: any;
    STORE_FAVORITE_CONTACT_LIST: string;
    STORE_CONTACT_LIST: string;
    UPDATE_CONTACT_AVATAR: string;
    TOGGLE_CONTACTS_LOADING: string;

    DELETE_CONTACT: string;
    DELETE_CONTACT_SUCCEED: string;

    UNBLOCK_CONTACT: any;
    BLOCK_CONTACT: any;


    CONTACT_UPDATE: any;
    CONTACT_UPDATE_SUCCEED: string;
    CONTACT_UPDATE_ERROR: string;
    CONTACT_ERRORS: string;

}

export const actions: IContactsReducerActions = {
    ATTEMPT_SET_BLOCKED_CONTACT_NUMBERS: "CONTACTS:ATTEMPT_SET_BLOCKED_CONTACT_NUMBERS",
    ATTEMPT_TOGGLE_PRODUCT_CONTACT: "CONTACTS:ATTEMPT_TOGGLE_PRODUCT_CONTACT",
    ATTEMPT_GET_BLOCKED_CONTACTS: "CONTACTS:ATTEMPT_GET_BLOCKED_CONTACTS",
    SET_BLOCKED_CONTACT_IDS: "CONTACTS:SET_BLOCKED_CONTACT_IDS",
    TOGGLE_CONVERSATION_MUTED: "CONTACTS:TOGGLE_CONVERSATION_MUTED",
    REMOVE_CONTACTS_LOADING: "CONTACTS:REMOVE_CONTACTS_LOADING",
    ATTEMPT_TOGGLE_FAVORITE: "CONTACTS:ATTEMPT_TOGGLE_FAVORITE",
    ATTEMPT_FAVORITES_UPDATE: "CONTACTS:ATTEMPT_FAVORITES_UPDATE",
    REMOVE_LAST_MESSAGE_ID: "CONTACTS:REMOVE_LAST_MESSAGE_ID",
    CONTACT_STOPPED_TYPING: "CONTACTS:CONTACT_STOPPED_TYPING",
    ATTEMPT_CREATE_CONTACT: "CONTACTS:ATTEMPT_CREATE_CONTACT",
    CONTACT_BECAME_OFFLINE: "CONTACTS:CONTACT_BECAME_OFFLINE",
    ATTEMPT_UPDATE_CONTACT: "CONTACTS:ATTEMPT_UPDATE_CONTACT",
    TOGGLE_PRODUCT_CONTACT: "CONTACTS:TOGGLE_PRODUCT_CONTACT",
    CONTACT_CREATION_DONE: "CONTACTS:CONTACT_CREATION_DONE",
    CONTACT_BECAME_ONLINE: "CONTACTS:CONTACT_BECAME_ONLINE",
    SET_CONTACTS_LOADING: "CONTACTS:SET_CONTACTS_LOADING",
    TOGGLE_MUTE_CONTACTS: "CONTACTS:TOGGLE_MUTE_CONTACTS",
    CONTACTS_BULK_INSERT: "CONTACTS:CONTACTS_BULK_INSERT",
    SET_BLOCKED_CONTACTS: "CONTACTS:SET_BLOCKED_CONTACTS",
    ATTEMPT_SAVE_CONTACT: "CONTACTS:ATTEMPT_SAVE_CONTACT",
    ATTEMPT_SET_CONTACTS: "CONTACTS:ATTEMPT_SET_CONTACTS",
    ATTEMPT_TOGGLE_BLOCK: "CONTACTS:ATTEMPT_TOGGLE_BLOCK",
    CONTACT_ADDED_TO_DB: "CONTACTS:CONTACT_ADDED_TO_DB",
    DELETE_CONVERSATION: "CONTACTS:DELETE_CONVERSATION",
    TOGGLE_FAVORITE: "CONTACTS:TOGGLE_FAVORITE",
    CONTACT_TYPING: "CONTACTS:CONTACT_TYPING",
    UPDATE_CONTACT: "CONTACTS:UPDATE_CONTACT",
    CREATE_CONTACT: "CONTACTS:CREATE_CONTACT",
    DELETE_CONTACT: "CONTACTS:DELETE_CONTACT",
    EDITABLE_CONTACT: "CONTACTS:EDITABLE_CONTACT",
    DELETE_CONTACT_SUCCEED: "CONTACTS:DELETE_CONTACT_SUCCEED",
    TOGGLE_BLOCK: "CONTACTS:TOGGLE_BLOCK",
    CONTACT_ERRORS: "CONTACTS:CONTACT_ERRORS",
    RESET: "CONTACTS:RESET",


    UPDATE_FAVORITES: "CONTACTS:UPDATE_FAVORITES",

    FETCH_CONTACT_LIST: "CONTACTS:FETCH_CONTACT_LIST",
    FETCH_FAVORITE_CONTACT_LIST: "CONTACTS:FETCH_FAVORITE_CONTACT_LIST",
    STORE_FAVORITE_CONTACT_LIST: "CONTACTS:STORE_FAVORITE_CONTACT_LIST",
    STORE_CONTACT_LIST: "CONTACTS:STORE_CONTACT_LIST",
    UPDATE_CONTACT_AVATAR: "CONTACTS:UPDATE_CONTACT_AVATAR",
    TOGGLE_CONTACTS_LOADING: "CONTACTS:TOGGLE_CONTACTS_LOADING",

    UNBLOCK_CONTACT: "CONTACTS:UNBLOCK_CONTACT",
    BLOCK_CONTACT: "CONTACTS:BLOCK_CONTACT",

    CONTACT_UPDATE: "CONTACTS:CONTACT_UPDATE",
    CONTACT_UPDATE_SUCCEED: "CONTACTS:CONTACT_UPDATE_SUCCEED",
    CONTACT_UPDATE_ERROR: "CONTACTS:CONTACT_UPDATE_ERROR",


};

export const CONTACTS_DISABLED_LOGGING_ACTIONS: Array<string> = [
    actions.CONTACT_BECAME_OFFLINE,
    actions.CONTACT_BECAME_ONLINE
];

export interface IContact extends Map<any, any> {
    childContactId?: string,
    label?: string,
    mainId?: number,
    numbers?: any,
    parentMainId?: number,
    singleProductContact?: boolean,
    parentContactId?: any;
    newMessagesIds?: List<string>;
    avatarCharacter?: string;
    color?: {
        avatarColor: string;
        numberColor: string;
    };
    isProductContact?: boolean;
    lastMessageId?: string;
    firstName?: string;
    lastActive?: string;
    lastName?: string;
    avatarUrl?: Blob;
    favorite?: boolean;
    createdAt?: string;
    imageUrl?: Blob;
    blocked?: boolean;
    username?: string;
    email?: [string];
    typing?: boolean;
    author?: string;
    saved?: boolean;
    status?: string;
    muted?: boolean;
    phone?: number | string;
    name?: string;
    contactId?: string;
    unMuteloader?: boolean;
    avatarBlobUrl?: string;
    avatar?: Blob;
    image?: Blob;
    members?: any;
}

export interface IContactsData extends Map<string, any> {
    blockedContacts?: Map<string, IContact>;
    blockedContactNumbers?: List<string>
    contacts?: Map<string, IContact>;
    showProductContacts?:Map<boolean, IContact>;
    list?: Map<string, IContact>,
    favoriteList?: Map<string, IContact>,
    count: any,
    contactsLoading?: boolean;
    contactsSearch?: string;
    contactErrors?: any;
}

export const defaultState: IContactsData = fromJS({
    blockedContactNumbers: [],
    blockedContacts: {},
    contacts: {},
    showProductContacts: true,
    list: {},
    favoriteList: {},
    count: 0,
    contactsLoading: true,
    contactsSearch: "",
    contactErrors: {},
});

export default (state: IContactsData = defaultState, {type, payload}: IContactsActions): IContactsData => {
    let name: string;

    switch (type) {
        case actions.TOGGLE_CONVERSATION_MUTED:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.updateIn(["contacts", payload.id, "muted"], muted => !muted) as IContactsData;

        case actions.CONTACT_STOPPED_TYPING:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.setIn(["contacts", payload.id, "typing"], false) as IContactsData;

        case actions.CONTACT_BECAME_OFFLINE:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.updateIn(["contacts", payload.id],
                contact => contact && contact.set("status", "offline").set("lastActivity", payload.lastActivity)) as IContactsData;

        case actions.SET_CONTACTS_LOADING:
            return state.set("contactsLoading", true) as IContactsData;

        case actions.TOGGLE_MUTE_CONTACTS:
            if (!state.getIn(["contacts", payload.threadId])) {
                return state;
            }

            if (isPublicRoom(payload.threadId)) {
                return state.updateIn(["contacts", payload.threadId, "threads", "threadInfo", "muted"], muted => payload.muted) as IContactsData;
            }

            return state.updateIn(["contacts", payload.threadId, "members", payload.threadId, "muted"], muted => payload.muted) as IContactsData;

        case actions.REMOVE_CONTACTS_LOADING:
            return state.set("contactsLoading", false) as IContactsData;

        case actions.REMOVE_LAST_MESSAGE_ID:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.setIn(["contacts", payload.id, "lastMessageId"], null) as IContactsData;

        case actions.CONTACT_BECAME_ONLINE:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.setIn(["contacts", payload.id, "status"], "online") as IContactsData;

        /*
                case actions.SET_LAST_MESSAGE:
                    if (!state.getIn(["contacts", payload.id])) {
                        return state;
                    }

                    return state.setIn(["contacts", payload.id, "lastMessageId"], payload.messageId) as IContactsData;
        */

        case actions.TOGGLE_FAVORITE: {

            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            state = state.updateIn(["contacts", payload.id, "members", payload.id, "favorite"], favorite => !favorite) as IContactsData;

            if (payload.parentContactId && state.getIn(["contacts", payload.parentContactId])) {
                state = state.updateIn(["contacts", payload.parentContactId, "members", payload.parentContactId, "favorite"], favorite => !favorite) as IContactsData
            }

            return state;
        }

        case actions.TOGGLE_PRODUCT_CONTACT: {
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            state = state.updateIn(["contacts", payload.id, "members", payload.id, "isProductContact"], isProductContact => !isProductContact) as IContactsData;

            if (payload.parentContactId && state.getIn(["contacts", payload.parentContactId])) {
                state = state.updateIn(["contacts", payload.parentContactId, "members", payload.parentContactId, "isProductContact"], isProductContact => !isProductContact) as IContactsData
            }

            return state;
        }

        case actions.CREATE_CONTACT:

            state = state.setIn(["contacts", payload.id], fromJS({...payload.contact})) as IContactsData;

            // if (payload.contact.members[payload.id].isProductContact) {
            state = state.setIn(["list", payload.id], fromJS({...payload.contact.members[payload.id]})) as IContactsData;
            // }

            return state;

        /*            if (state.getIn(["contacts", payload.id])) {
                        return state
                            .updateIn(["contacts", payload.id],
                                contact => {
                                    const firstName: string = payload.firstName || contact.get("firstName") || "";
                                    const lastName: string = payload.lastName || contact.get("lastName") || "";
                                    name = firstName ? `${firstName} ${lastName}`.trim() : lastName ? lastName : contact.get("name");

                                    return contact
                                        .set("blocked", state.get("blockedContacts").includes(contact.get("username")))
                                        .set("avatarCharacter", name.substr(0, 1)) //String.fromCodePoint(name.codePointAt(0))
                                        .set("firstName", firstName)
                                        .set("saved", payload.saved)
                                        .set("isProductContact", contact.get("isProductContact") || payload.isProductContact)
                                        .set("lastName", lastName)
                                        .set("name", name)
                                }) as IContactsData;
                    }

                    name = payload.firstName ? `${payload.firstName} ${payload.lastName}`.trim() : payload.lastName ? payload.lastName : payload.phone.toString();

                    return state
                        .setIn(["contacts", payload.id], fromJS({
                            blocked: state.get("blockedContacts").includes(payload.phone.toString()),
                            isProductContact: payload.isProductContact,
                            firstName: payload.firstName || "",
                            avatarCharacter: name.substr(0, 1), //String.fromCodePoint(name.codePointAt(0))
                            username: payload.phone.toString(),
                            lastName: payload.lastName || "",
                            avatarUrl: payload.avatarUrl,
                            imageUrl: payload.imageUrl,
                            author: payload.author,
                            createdAt: Date.now(),
                            phone: payload.phone,
                            saved: payload.saved,
                            color: payload.color,
                            lastMessageId: null,
                            newMessagesIds: [],
                            status: "offline",
                            favorite: false,
                            id: payload.id,
                            typing: false,
                            muted: false,
                            name
                        })) as IContactsData;*/

        case actions.TOGGLE_BLOCK:

            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            if(payload.id && payload.id.startsWith("871")){
                return state.setIn(["contacts", payload.id, "members", payload.id, "blocked"], payload.blocked) as IContactsData;
            } else if(payload.id.includes(`@${SINGLE_CONVERSATION_EXTENSION}`)) {
                return state.setIn(["contacts", payload.id, "members", payload.id, "blocked"], payload.blocked) as IContactsData;
            } else {
                return state.setIn(["contacts", `${payload.id}@${SINGLE_CONVERSATION_EXTENSION}`, "members", `${payload.id}@${SINGLE_CONVERSATION_EXTENSION}`, "blocked"], payload.blocked) as IContactsData;
            }

        case actions.UPDATE_CONTACT:
            /* currently payload.avatarUrl should be blob */
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            const name: string = payload.firstName ?
                `${payload.firstName} ${payload.lastName}`.trim() :
                payload.lastName ?
                    payload.lastName :
                    payload.phone.toString();

            let favorite = state.getIn(["contacts", payload.id, 'members', payload.id, "favorite"]);
            let avatarUrl: string = "";
            let imageUrl: string = "";
            let saved: boolean = false;
            let isProductContact: boolean = true;
            let avatar: Blob;
            let avatarHash: string;
            let mainId: number = null;
            let parentMainId: number = null;
            let numbers: string[] = [];
            let image: Blob;
            let label: string;
            let color: any;

            avatar = state.getIn(["contacts", payload.id, 'members', payload.id, "avatar"]);
            avatarHash = state.getIn(["contacts", payload.id, 'members', payload.id, "avatarHash"]);
            image = state.getIn(["contacts", payload.id, 'members', payload.id, "image"]);
            avatarUrl = state.getIn(["contacts", payload.id, 'members', payload.id, "avatarUrl"]);
            imageUrl = state.getIn(["contacts", payload.id, 'members', payload.id, "imageUrl"]);
            mainId = state.getIn(["contacts", payload.id, 'members', payload.id, "mainId"]);
            parentMainId = state.getIn(["contacts", payload.id, 'members', payload.id, "parentMainId"]);
            numbers = state.getIn(["contacts", payload.id, 'members', payload.id, "numbers"]);
            label = state.getIn(["contacts", payload.id, 'members', payload.id, "label"]);
            color = state.getIn(["contacts", payload.id, 'members', payload.id, "color"]);

            if (payload.avatarUrl) {
                avatarUrl = `${payload.phone}/avatar`;
                imageUrl = `${payload.phone}/image`;
            }

            if (typeof (payload.saved) !== "undefined") {
                saved = payload.saved;
            }

            if (payload.mainId) {
                mainId = payload.mainId
            }

            if (payload.parentMainId) {
                parentMainId = payload.parentMainId
            }

            if (payload.numbers && payload.numbers.length) {
                numbers = payload.numbers
            }

            if (typeof (payload.image) !== "undefined") {
                image = payload.image
            }

            if (typeof (payload.avatar) !== "undefined") {
                avatar = payload.avatar
            }

            if (typeof (payload.avatarHash) !== "undefined") {
                avatarHash = payload.avatarHash
            }

            if (payload.label) {
                label = payload.label
            }

            if (payload.color) {
                color = payload.color
            }

            if (typeof (payload.favorite) !== "undefined") {
                favorite = payload.favorite;
            }
            if (typeof (payload.isProductContact) !== "undefined") {
                isProductContact = payload.isProductContact;
            }

            state = state.updateIn(["contacts", payload.id, 'members', payload.id],
                contact => contact
                    .set("phone", payload.phone ? payload.phone.toString() : null)
                    .set("avatarCharacter", getInitials(payload.firstName, payload.lastName))
                    .set("isProductContact", isProductContact)
                    .set("username", payload.phone ? payload.phone.toString() : null)
                    .set("firstName", payload.firstName)
                    .set("favorite", favorite)
                    .set("lastName", payload.lastName)
                    .set("image", image)
                    .set("saved", saved)
                    .set("name", name)
                    .set("mainId", mainId)
                    .set("parentMainId", parentMainId)
                    .set("numbers", numbers)
                    .set("avatar", avatar)
                    .set("avatarHash", avatarHash)
                    .set("avatarUrl", avatarUrl)
                    .set("imageUrl", imageUrl)
                    .set("label", label)
                    .set("color", color)
            ) as IContactsData;

            if (state.hasIn(["list", payload.id])) {
                state = state.updateIn(["list", payload.id],
                    contact => contact
                        .set("phone", payload.phone ? payload.phone.toString() : null)
                        .set("avatarCharacter", getInitials(payload.firstName, payload.lastName))
                        .set("isProductContact", isProductContact)
                        .set("username", payload.phone ? payload.phone.toString() : null)
                        .set("firstName", payload.firstName)
                        .set("favorite", favorite)
                        .set("lastName", payload.lastName)
                        .set("image", image)
                        .set("saved", saved)
                        .set("name", name)
                        .set("mainId", mainId)
                        .set("parentMainId", parentMainId)
                        .set("numbers", numbers)
                        .set("avatar", avatar)
                        .set("avatarHash", avatarHash)
                        .set("avatarUrl", avatarUrl)
                        .set("imageUrl", imageUrl)
                        .set("label", label)
                        .set("color", color)
                ) as IContactsData;
            } else {
                state = state.setIn(['list', payload.id], state.getIn(['contacts', payload.id, 'members', payload.id]))
            }

            return state;

        case actions.EDITABLE_CONTACT:

            return state.setIn(["contacts", payload.id, "editable"], payload.editable) as IContactsData;

        case actions.CONTACT_UPDATE_SUCCEED:

            // TODO handle firstName && lastName change

            if (!state.getIn(["contacts", payload.threadId])) {
                return state;
            }

            let newAvatar: Blob;
            let newImage: Blob | File;
            let newFirstName: string;
            let newLastName: string;

            newAvatar = state.getIn(["contacts", payload.threadId, 'members', payload.threadId, "avatar"]);
            newImage = state.getIn(["contacts", payload.threadId, 'members', payload.threadId, "image"]);
            // newFirstName = state.getIn(["contacts", payload.threadId, 'members', payload.threadId, "firstName"]);
            // newLastName = state.getIn(["contacts", payload.threadId, 'members', payload.threadId, "lastName"]);

            if (typeof (payload.image) !== "undefined") {
                newImage = payload.image
            }

            if (typeof (payload.avatar) !== "undefined") {
                newAvatar = payload.avatar
            }

            // if (payload.isDeleted) {
            //     if (typeof (payload.firstName) !== "undefined") {
            //         newFirstName = payload.firstName
            //     }
            //
            //     if (typeof (payload.lastName) !== "undefined") {
            //         newLastName = payload.lastName
            //     }
            // }

            state = state.updateIn(["contacts", payload.threadId, 'members', payload.threadId],
                contact => contact
                    .set("image", newImage)
                    .set("avatar", newAvatar)
                // .set("firstName", newFirstName)
                // .set("lastName", newLastName)
            ) as IContactsData;

            if (state.hasIn(["list", payload.threadId])) {
                state = state.updateIn(["list", payload.threadId],
                    contact => contact
                        .set("image", newImage)
                        .set("avatar", newAvatar)
                    // .set("firstName", newFirstName)
                    // .set("lastName", newLastName)
                ) as IContactsData;
            }

            return state;

        case actions.CONTACT_TYPING:
            if (!state.getIn(["contacts", payload.id])) {
                return state;
            }

            return state.setIn(["contacts", payload.id, "typing"], true) as IContactsData;

        case actions.SET_BLOCKED_CONTACTS:
            return state.set("blockedContacts", fromJS(payload.blockedContacts)) as IContactsData;

        case actions.SET_BLOCKED_CONTACT_IDS:
            return state.update("contacts", contacts => contacts.map(contact => {
                const threadId = contact.getIn(["threads", "threadId"]);
                return payload.contactIds.includes(threadId) ?
                    contact.setIn(["members", threadId, "blocked"], true) :
                    contact;
            })) as IContactsData;

        case actions.CONTACTS_BULK_INSERT:
            return state.update("contacts", contacts => contacts.merge(fromJS(payload.contacts))) as IContactsData;

        case actions.CONTACT_ERRORS:
            return state.set("contactErrors", fromJS(payload.contactErrors)) as IContactsData;
        case actions.RESET:
            return defaultState;

        case actions.UPDATE_FAVORITES:
            let contacts: Map<string, any> = state.get('contacts');
            let list: Map<string, any> = state.get('list');
            let favoriteList: Map<string, any> = state.get('favoriteList');
            for (const contact of payload.updatedContacts) {
                contacts = contacts.setIn([contact.contactId, "members", contact.contactId, "favorite"], contact.favorite);
                list = list.setIn([contact.contactId, "members", contact.contactId, "favorite"], contact.favorite);
                if (contact.favorite) {
                    favoriteList = favoriteList.set(contact.contactId, fromJS(contact))
                } else {
                    favoriteList = favoriteList.delete(contact.contactId);
                }
            }
            return state.set('contacts', contacts)
                .set('list', list)
                .set("favoriteList", favoriteList) as IContactsData;

        case actions.TOGGLE_CONTACTS_LOADING:
            return state.set("contactsLoading", payload.loading) as IContactsData;

        case actions.STORE_CONTACT_LIST:
            if (payload.isScrollToBottom) {
                return state
                    .set('count', payload.count)
                    .set('showProductContacts', payload.isProductContact)
                    .set('contactsSearch', payload.contactsSearch)
                    .update("list", list => list.merge(fromJS(payload.records))) as IContactsData;
            }

            return state
                .set('count', payload.count)
                .set('showProductContacts', payload.isProductContact)
                .set('contactsSearch', payload.contactsSearch)
                .set("list", fromJS(payload.records)) as IContactsData;
        case actions.UPDATE_CONTACT_AVATAR:
            return state.setIn(["contacts", payload.threadId, "members", payload.threadId, "avatar"], payload.blob)
                .setIn(["contacts", payload.threadId, "members", payload.threadId, "avatarHash"], payload.avatarHash)
              .setIn(["contacts", payload.threadId, "members", payload.threadId, "avatarBlobUrl"], (window as any).URL.createObjectURL(payload.blob))
              .setIn(["contacts", payload.threadId, "members", payload.threadId, "image"], payload.blob)
              .setIn(["list", payload.threadId, "avatar"], payload.blob)
              .setIn(["list", payload.threadId, "avatarHash"], payload.avatarHash)
              .setIn(["list", payload.threadId, "avatarBlobUrl"], (window as any).URL.createObjectURL(payload.blob))
              .setIn(["list", payload.threadId, "image"], payload.blob) as IContactsData
        case actions.STORE_FAVORITE_CONTACT_LIST:
            if (payload.isSearch) {
                return state
                    .set("favoriteList", fromJS(payload.records)) as IContactsData;

            } else {
                return state
                    .update("favoriteList", list => list.merge(fromJS(payload.records))) as IContactsData;
            }

        case actions.DELETE_CONTACT_SUCCEED:
            if (!state.getIn(["contacts", payload.contactId])) {
                return state;
            }

            const contactId: string = payload.contactId;
            const contact: any = state.getIn(["contacts", payload.contactId, 'members', payload.contactId]);

            state = updateContactProperties(state, contactId, {
                saved: false,
                favorite: false,
                numbers: null,
                parentMainId: null,
            });

            // if contact has child contacts
            if (contact.get('numbers') && contact.get('numbers').size > 1) {

                contact.get('numbers').map(item => {
                    if (!contactId.includes(item)) {
                        const childContactId: string = `${item}@${SINGLE_CONVERSATION_EXTENSION}`;
                        state = updateContactProperties(state, childContactId, {
                            saved: false,
                            favorite: false,
                            numbers: null,
                            parentMainId: null,
                            // email: null,
                        });

                        state = state.deleteIn(["favoriteList", childContactId]) as IContactsData;
                        state = state.deleteIn(["favoriteContacts", childContactId]) as IContactsData;
                    }
                })

            }

            state = state.deleteIn(["favoriteList", contactId]) as IContactsData;
            state = state.deleteIn(["favoriteContacts", contactId]) as IContactsData;

            return state;

        default:
            return state;
    }
};
