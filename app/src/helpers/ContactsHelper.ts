"use strict";

import {fromJS} from "immutable";
import {all, call, take} from "redux-saga/effects";

import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import {getColor} from "helpers/AppHelper";
import conf from "configs/configurations";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {DISPLAY_CONTATCS_COUNT, APPLICATION} from "configs/constants";
import {fetchFile} from "requests/fsRequest";
import {actions as APPLICATION_ACTIONS} from "modules/application/ApplicationReducer";
import {IContact} from "modules/contacts/ContactsReducer";
import IDBContact, {DatabaseContacts} from "services/database/class/Contact";
import {getEmailFromUsername, getInitials, getUserId, getUsername, writeLog} from "helpers/DataHelper";
import {attemptRetrieveFile} from "helpers/FileHelper";
import {checkUsersByLists, profileList} from "requests/profileRequest";
import Log from "modules/messages/Log";

export const getName = (str: string, onlyFirstName?: boolean): string => {
    const store: any = storeCreator.getStore();
    const {contacts} = selector(store.getState(), {
        contacts: true,
    });
    const username: string = getUsername(str);
    let userFullName: string;
    const userId: string = getUserId(username);

    const contactInfo: any = contacts.getIn([userId, "members", userId]);
    const nameType = APPLICATION.WITHEMAIL ? "email" : "username"
    const email: string = contactInfo && contactInfo.get(nameType) || getEmailFromUsername(str);
    const firstName: string = contactInfo && contactInfo.get("firstName");

    if (onlyFirstName) {
        return firstName || email || username;
    }

    const lastName: string = contactInfo && contactInfo.get("lastName");
    userFullName = email && !lastName && !firstName ? email : contacts.getIn([userId, "members", userId, "name"]);

    return userFullName ? userFullName : username;
};

export async function fetchSavedContactsWithFilter(params: { q: string, limit: number, offset: number }) {
    const {limit, offset} = params;
    const q: string = params.q.startsWith('+') ? params.q.replace('+', '') : params.q;
    try {
        return IDBContact.searchContacts({
            q,
            limit,
            offset,
        });

    } catch (e) {
        Log.i(e);
        writeLog(e, "fetchContactsWithFilter Error");
        return {records: [], count: 0, isLoading: false};
    }
}

export function getContactbyId(contactId: string): IContact {
    const store: any = storeCreator.getStore();
    const {contacts} = selector(store.getState(), {contacts: true});
    let creator: IContact = null;

    const creatorContact = contacts.get(contactId);
    if (creatorContact) {
        creator = creatorContact.getIn(["members", contactId]);
    }
    if (!creator) {
        creator = fromJS({phone: contactId && contactId.split("@").shift()});
    }
    return creator;
}

export function* profileListData(numbers) {
    const store: any = storeCreator.getStore();
    const {synced} = selector(store.getState(), {synced: true});
    let {savedContacts} = selector(store.getState(), {savedContacts: true});
    const numbersWithEmail: any = {};

    if (!synced.get("contacts")) {
        yield take(APPLICATION_ACTIONS.CONTACTS_SYNC_SUCCESS);

        const store: any = storeCreator.getStore();
        savedContacts = selector(store.getState(), {savedContacts: true}).savedContacts;
    }

    if (numbers && numbers.length > 0) {
        numbers = numbers.map(number => {
            const hasEmail: boolean = number.includes("|");
            const _number: string = hasEmail ? number.split("|")[0] : number;
            const email: string = hasEmail ? getEmailFromUsername(number) : "";
            email ? numbersWithEmail[_number] = email : null;
            return number.includes("|") ? number.split("|")[0] : number
        });
    }

    const profileListRequest: any = yield call(profileList, numbers);

    const {data: {body, status}} = profileListRequest;

    if (status === "SUCCESS") {
        const profileListMap: any = {};
        const imageMap: any = {};
        const avatarMap: any = {};

        const blockedContactNumbers: any = yield call(IDBContact.getBlockedContacts, DISPLAY_CONTATCS_COUNT);

        for (const profileId in body) {
            if (body.hasOwnProperty(profileId)) {
                const blocked: boolean = Object.keys(blockedContactNumbers).join().includes(profileId);
                const contactId: string = `${profileId}@${SINGLE_CONVERSATION_EXTENSION}`;
                const profile: any = body[profileId];
                if (!savedContacts.has(contactId)) {
                    const contact: any = {
                        blocked,
                        username: profileId,
                        firstName: "",
                        lastName: "",
                        isProductContact: true,
                        saved: false,
                        createdAt: Date.now(),
                        phone: profileId,
                        color: getColor(),
                        status: "offline",
                        favorite: false,
                        author: profileId,
                        contactId,
                        avatarUrl: "",
                        imageUrl: "",
                        muted: false,
                        name: '',
                        avatarCharacter: '',
                        avatar: "",
                        image: "",
                        email: numbersWithEmail[profileId] || ""
                    };

                    if (profile.firstName !== '') {
                        contact.firstName = profile.firstName;
                        contact.lastName = profile.lastName || '';
                        contact.name = `${contact.firstName} ${contact.lastName}`;
                    } else {
                        contact.name = `${profileId}`;
                    }
                    contact.avatarCharacter = getInitials(contact.firstName, contact.lastName);

                    if (profile.avatarUrl) {
                        avatarMap[profileId] = call(fetchFile, profile.avatarUrl);
                    }

                    if (profile.imgUrl) {
                        imageMap[profileId] = call(fetchFile, profile.imgUrl);
                    }

                    profileListMap[profileId] = contact;
                } else {
                    profileListMap[profileId] = {
                        ...savedContacts.getIn([contactId, 'members']).first().toJS(),
                        blocked,
                        email: numbersWithEmail[profileId] || ""
                    };
                }

            }
        }

        const imageMapResult: any = yield all(imageMap);
        const avatarMapResult: any = yield all(avatarMap);
        Object.keys(imageMapResult).map((contactId) => {
            if (profileListMap.hasOwnProperty(contactId)) {
                const imageFile: Blob = imageMapResult[contactId].type.includes('xml') || imageMapResult[contactId].type.includes('html') ? null : imageMapResult[contactId];
                const avatarFile: Blob = avatarMapResult[contactId].type.includes('xml') || avatarMapResult[contactId].type.includes('html') ? null : avatarMapResult[contactId];
                const member: any = profileListMap[contactId];
                member.avatar = avatarFile;
                member.image = imageFile;
                member.avatarUrl = `${contactId}/avatar`;
                member.imageUrl = `${contactId}/image`;
            }
        });

        return profileListMap;
    }
}

export async function fetchContactsWithFilter(params: { q: string, limit: number, offset: number, hideMultipleContacts?: boolean }) {
    const store: any = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});



    try {
        const {limit, offset} = params;
        const q: string = params.q.startsWith('+') ? params.q.replace('+', '') : params.q;

        try {
            const result: { records: any[], count: number, canceled?: boolean } = await DatabaseContacts.selectContacts({
                q,
                limit,
                skip: offset,
                isProductContact: true
            });

            Log.i(result, "result1234")

            if (result.records && result.records.length !== 0) {
                result.records = params.hideMultipleContacts ? result.records.filter(record => record.contactId !== user.get("id") && !record.parentMainId && record.saved) :
                    result.records.filter(record => record.contactId !== user.get("id") && record.saved)
            }

            if (result.records.length === 0) {
                try {
                    const response: any = await checkUsersByLists([q], [q]);

                    if (response && response.data.status === 'SUCCESS') {
                        const body: { email: string, profileInfo: { firstName: string, lastName: string, imageHash: string }, registered: boolean, username: string }[] = response.data.body;

                        const profiles: { username: string, firstName: string, lastName: string, email: string, image: string }[] = body
                            .filter(profile => profile.registered && profile.username !== user.get("username"))
                            .map(profile => ({
                                username: profile.username,
                                firstName: profile.profileInfo && profile.profileInfo.firstName? profile.profileInfo.firstName : '',
                                lastName: profile.profileInfo && profile.profileInfo.lastName ? profile.profileInfo.lastName : '',
                                email: profile.email,
                                image: profile.profileInfo && profile.profileInfo.imageHash ? profile.profileInfo.imageHash: ''
                            }));

                        const profile: { username: string, firstName: string, lastName: string, email: string, image: string } = profiles[0];

                        if (profile) {
                            const {firstName, lastName, username, email, image} = profile;
                            const contactName: string = firstName ? `${firstName} ${lastName}` : username.toString();
                            let avatar: Blob = null;
                            let avatarHash: string = null;
                            let avatarBlobUrl: string = null;

                            if (image) {
                                avatar = await attemptRetrieveFile({
                                    bucket: conf.app.aws.bucket.profile,
                                    key: `${profile.username}/avatar`
                                });
                                avatarHash = image
                                avatarBlobUrl = avatar && (window as any).URL.createObjectURL(avatar)
                            }

                            return {
                                records: [{
                                    contactId: getUserId(profile.username),
                                    avatarCharacter: getInitials(firstName, lastName),
                                    firstName: firstName || "",
                                    lastName: lastName || "",
                                    email: email || "",
                                    author: username,
                                    phone: username,
                                    isProductContact: true,
                                    createdAt: Date.now(),
                                    color: getColor(),
                                    name: contactName,
                                    status: "offline",
                                    favorite: false,
                                    blocked: false,
                                    saved: false,
                                    avatarUrl: "",
                                    imageUrl: "",
                                    muted: false,
                                    username,
                                    image: "",
                                    avatar,
                                    avatarHash,
                                    avatarBlobUrl
                                }],
                                count: 1,
                            };
                        }
                    }
                } catch (e) {
                    Log.i(e);
                    return {records: [], count: 0, canceled: true};
                }
            }
            // else {
            //     // await checkUsersByLists([""], [""]);
            //     Log.i("fetchContactsWithFilter user = ", user)
            //     Log.i("fetchContactsWithFilter params = ", params)
            //     result.records = params.hideMultipleContacts ? result.records.filter(record => record.contactId !== user.get("id") && !record.parentMainId && record.saved) :
            //         result.records.filter(record => record.contactId !== user.get("id") && record.saved)
            // }
            result.records = result.records.sort((c1, c2) => {
                const c1IsNumber = !isNaN(c1["avatarCharacter"]);
                const c2IsNumber = !isNaN(c2["avatarCharacter"]);
                const compare = c1["name"].localeCompare(c2["name"]);
                if (compare !== 0 && c1IsNumber && !c2IsNumber) {
                    return 1;
                } else if (compare !== 0 && !c1IsNumber && c2IsNumber) {
                    return -1;
                }
                return compare;
            });

            return result;
        } catch
            (e) {
            Log.i(e);
            writeLog(e, "fetchContactsWithFilter Error");
            return {records: [], count: 0, isLoading: false};
        }
    } catch (e) {
        Log.i("#######");
        Log.i(e);
    }

}
