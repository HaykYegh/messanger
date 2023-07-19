"use strict";

import {all, call, fork, put, select, take, takeEvery, takeLatest, delay} from "redux-saga/effects";
import {Store} from "react-redux";

import {
    attemptSetContacts as attemptSetContactsAction,
    contactCreationDone,
    contactErrors,
    contactsBulkInsert,
    contactUpdateError,
    contactUpdateSucceed,
    createContact,
    DELETE_CONTACT,
    DELETE_CONTACT_SUCCEED,
    IContactsActions,
    removeLastMessageId,
    setBlockedContactIds,
    setBlockedContacts,
    setContactsLoading,
    STORE_CONTACT_LIST,
    STORE_FAVORITE_CONTACT_LIST,
    TOGGLE_CONTACTS_LOADING,
    toggleBlocked,
    toggleFavorite,
    toggleProductContact,
    UPDATE_FAVORITES,
    updateContact,
    attemptEnableContactEditable,
} from "modules/contacts/ContactsActions";
import {
    attemptSetSelectedThread,
    contactsSyncSuccess,
    removeSelectedThreadId as removeSelectedThreadIdFromStore,
    resetSelectedThread,
    syncFailed,
    updateSelectedThread
} from "../application/ApplicationActions";
import {sendHangUp} from "../call/CallActions";
import {getConversationType, getInitials, getUserId, getUsername, setFailed, writeLog} from "helpers/DataHelper";
import {
    ADD_CONTACT_TYPE,
    APPLICATION,
    CONNECTION_ERROR_TYPES,
    DEFAULT_TIME_FORMAT,
    DISPLAY_CONTATCS_COUNT,
    LEFT_PANELS,
    LOG_TYPES,
    LOGS_LEVEL_TYPE
} from "configs/constants";
import {
    attemptCreateEmptyConversation,
    conversationPropertyUpdateSuccess,
    setBlockedConversations,
    toggleProductContactConversation,
    updateConversation,
    updateConversationAvatar,
    updateConversationsBlocked
} from "modules/conversations/ConversationsActions";
import {updateContactAvatar} from "modules/contacts/ContactsActions";
import {attemptCreateContact as attemptCreateContactAction,} from './ContactsActions';
import {ADD_TO_BLOCKED_COMMAND, REMOVE_FROM_BLOCKED_COMMAND, SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {actions as APPLICATION_ACTIONS} from "../application/ApplicationReducer";
import {deleteThreadMessages} from "../messages/MessagesActions";
import {getUsersProfile, profileList, userCheck} from "requests/profileRequest";
import {addRequest} from "modules/requests/RequestsActions";
import IDBContact, {DatabaseContacts} from "services/database/class/Contact";
import {getContactsData, deleteContact, saveContact} from "requests/contactRequest";
import {toggleContactBlockXML} from "xmpp/XMLBuilders";
import connectionCreator from "xmpp/connectionCreator";
import storeCreator from "helpers/StoreHelper";
import {fetchFile, generateSignedUrl} from "requests/fsRequest";
import {getColor, logger} from "helpers/AppHelper";
import {actions} from "./ContactsReducer";
import selector from "services/selector";
import {selectedThreadIdSelector} from "modules/application/ApplicationSelector";
import {format} from "date-fns";
import isEmpty from "lodash/isEmpty";
import {attemptRetrieveFile} from "helpers/FileHelper";
import conf from "configs/configurations";
import ContactsModel from "modules/contacts/ContactsModel";
import IDBThreads from "services/database/class/Threads";
import {fromJS, Map} from "immutable";
import {checkUser} from "requests/settingsRequest";
import {getContactsSelectorOld} from "modules/contacts/ContactsSelector";
import {isPrimitive} from "util";
import Log from "modules/messages/Log";

function* attemptCreateContact({payload: {id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels, createConversation, editableId, notSaved, notificationMessage}}: any): any {
    try {
        phone = Array.isArray(phone) ? phone : phone ? [phone] : null;
        email = Array.isArray(email) ? email : email && typeof email === 'string' ? [email] : null;
        const response: any = yield call(userCheck, phone, email);

        const {data: {status, body: contactsRes}} = response;
        let mainContact: any = null;
        const store: Store<any> = storeCreator.getStore();
        const {conversations, blockedContactNumbers, selectedThreadId} = selector(store.getState(), {
            conversations: true,
            blockedContactNumbers: true,
            selectedThreadId: true
        });

        const contacts = contactsRes.map(item => {
            if (notificationMessage !== null) {
                item.registered = true
            }
            if(!item.username && item.email){
                item.username = item.email
            }
            return item
        })

        const errors = {};
        const checkRegister = contacts.every(item => {
            if (item.registered) {
                errors[item.username] = false
            } else {
                errors[item.username] = true
            }
            return notificationMessage !== null ? true : item.registered
        })

        if(!checkRegister) {
            yield put(contactErrors(errors))

            return false
        }

        if (status === "SUCCESS" && Array.isArray(contacts)) {
            const primaryNumber = contacts.find(item => item.registered && item.email) || contacts[0];
            const {profileInfo, username, email, registered} = primaryNumber;

            if (!firstName && !lastName) {
                firstName = profileInfo && profileInfo.firstName || "";
                lastName = profileInfo && profileInfo.lastName || ""
            }

            const contactId = getUserId(username);
            const contactName: string = firstName && lastName ? `${firstName} ${lastName}`.trim() : (firstName || lastName || email || username);
            let mainId: number;

            mainContact = yield call(IDBContact.getContactById, contactId);



            // @ts-ignore
            String.prototype.hashCode = function(){
                var hash = 0;
                for (var i = 0; i < this.length; i++) {
                    var character = this.charCodeAt(i);
                    hash = ((hash<<5)-hash)+character;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
            }

            // const name: string = mainContact.firstName ? `${mainContact.firstName} ${mainContact.lastName || ""}`.trim() : mainContact.lastName ? mainContact.lastName : mainContact.username;
            const date = new Date()
            const identifier: any = date.getTime() + ""
            // @ts-ignore
            const hashKey = `${contactName}${identifier.hashCode()}`.hashCode()


            // if(registered) {
            //     yield call(saveContact, [{number: mainContact.username, hashKey, firstName: mainContact.firstName, lastName: mainContact.lastName, identifier, isInternal: registered, editNumber: false}]);
            // }
            //
            // mainContact.hashKey = hashKey
            // mainContact.identifier = identifier



            if (registered && mainContact) {
                mainId = mainContact.mainId || +(Math.random() * 10000000000).toFixed(0);
                const numbers = mainContact.numbers ? [...mainContact.numbers, ...contacts.map(item => item.username)] : contacts.map(item => item.username);



                mainContact.hashKey = hashKey
                mainContact.identifier = identifier



                if (type === ADD_CONTACT_TYPE.addContactPanel) {
                    mainContact.firstName = firstName;
                    mainContact.lastName = lastName;
                    mainContact.name = contactName;
                    mainContact.saved = saved;
                    mainContact.avatarCharacter = getInitials(firstName, lastName);
                    mainContact.numbers = numbers.filter((item, index) => numbers.indexOf(item) === index); // removing duplicate numbers
                    mainContact.mainId = mainId;
                    // mainContact.label = labels && labels.length && Array.isArray(labels) && labels.find(label => label.value === email || label.value === username).label || (email ? "home" : "mobile");
                    mainContact.label = "home"

                    if (!notSaved) {
                        yield call(saveContact, [{number: phone || email, hashKey, firstName: firstName, lastName: lastName, identifier, internal: registered, editNumber: false}]);
                    }

                    yield all([
                        call(IDBContact.updateContact, contactId, {
                            firstName: mainContact.firstName,
                            lastName: mainContact.lastName,
                            saved: mainContact.saved,
                            name: mainContact.name,
                            avatarCharacter: mainContact.avatarCharacter,
                            numbers: mainContact.numbers,
                            mainId: mainContact.mainId,
                            label: mainContact.label
                        }),
                        put(updateContact(contactId, mainContact.firstName, mainContact.lastName, username, mainContact.avatarUrl, mainContact.imageUrl, registered, mainContact.saved, null, mainContact.mainId, null, mainContact.numbers, mainContact.image, mainContact.avatar, mainContact.label, null, mainContact.avatarHash))
                    ]);

                    if (selectedThreadId === contactId) {
                        yield put(updateSelectedThread({
                            firstName: mainContact.firstName,
                            lastName: mainContact.lastName,
                            saved: mainContact.saved,
                            name: mainContact.name,
                            avatarCharacter: mainContact.avatarCharacter,
                            numbers: mainContact.numbers
                        }))
                    }
                }
            } else {

                mainId = +(Math.random() * 10000000000).toFixed(0);

                mainContact = {
                    blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(email || username)),
                    username: username,
                    isProductContact: notificationMessage !== null ? true : false,
                    createdAt: Date.now(),
                    avatarCharacter: getInitials(firstName, lastName),
                    color: getColor(),
                    status: "offline",
                    favorite: false,
                    avatarUrl: "",
                    contactId,
                    imageUrl: "",
                    email: email || "",
                    muted: false,
                    firstName,
                    lastName,
                    name: contactName,
                    author,
                    saved,
                    phone: username,
                    mainId,
                    numbers: contacts.map(item => item.username),
                    label: labels && labels.length && Array.isArray(labels) && labels.find(label => label.value === email || label.value === username).label || (email ? "home" : "mobile")
                };

                mainContact.numbers = mainContact.numbers.filter((item, index) => mainContact.numbers.indexOf(item) === index);

                if (notificationMessage !== null && notificationMessage.image && notificationMessage.image.key) {
                    const signedUrl: string =  yield call(generateSignedUrl, notificationMessage.image.bucket, 'GET', notificationMessage.image.key)
                    const avatar = yield call(fetchFile, signedUrl);
                    mainContact.avatar = avatar;
                }

                const {data: {body}}: any = yield call(profileList, [mainContact.username]);

                if (body[mainContact.username]) {
                    const response = body[mainContact.username];

                    mainContact.isProductContact = true;
                    if (type === ADD_CONTACT_TYPE.keypadPanel || type === ADD_CONTACT_TYPE.call) {
                        mainContact.firstName = response.firstName || firstName;
                        mainContact.lastName = response.lastName || lastName;
                        mainContact.name = mainContact.firstName || mainContact.lastName ? `${mainContact.firstName + " "}${mainContact.lastName}` : phone.toString();
                    } else if (!firstName && !lastName) {
                        mainContact.firstName = response.firstName || firstName;
                        mainContact.lastName = response.lastName || lastName;
                        mainContact.name = mainContact.firstName || mainContact.lastName ? `${mainContact.firstName + " "} ${mainContact.lastName}` : phone.toString();
                    } else {
                        mainContact.name = contactName;
                    }

                    if (response.avatarUrl) {
                        mainContact.avatarUrl = `${mainContact.phone}/avatar`;
                        mainContact.imageUrl = `${mainContact.phone}/image`;

                        const image = yield call(fetchFile, response.imgUrl);
                        const avatar = yield call(fetchFile, response.avatarUrl);
                        // const imageFile: Blob = image.type.includes('xml') || image.type.includes('html') ? null : image;
                        const avatarFile: Blob = avatar.type.includes('xml') || avatar.type.includes('html') ? null : avatar;

                        mainContact.avatar = avatarFile;
                        mainContact.image = avatarFile;
                        mainContact.avatarHash = response.imgHash
                    }

                } else {
                    mainContact.name = contactName;
                }

                mainContact.avatarCharacter = getInitials(mainContact.firstName, mainContact.lastName);


                const thread: any = {
                    conversations: {},
                    messages: {},
                    threads: {
                        threadId: mainContact.contactId,
                        threadType: getConversationType(mainContact.contactId),
                        threadInfo: {}
                    },
                    members: {}
                };

                thread.members[mainContact.contactId] = mainContact;

                if(thread.members[mainContact.contactId]['avatar']) {
                    thread.members[mainContact.contactId]['avatarBlobUrl'] = (window as any).URL.createObjectURL(thread.members[mainContact.contactId]['avatar'])
                }

                if (!notSaved) {
                    yield call(saveContact, [{number: mainContact.username, hashKey, firstName: mainContact.firstName, lastName: mainContact.lastName, identifier, internal: registered, editNumber: false}]);
                }


                mainContact.hashKey = hashKey
                mainContact.identifier = identifier

                yield all([
                    put(createContact(contactId, thread)),
                    call(IDBContact.createContact, mainContact)
                ]);
            }

            if (contacts.length > 1) {
                // let i = 0
                for (let contact of contacts) {
                    const {username, email, registered} = contact;

                    if (username === primaryNumber.username) continue;
                    // i++

                    // const sec_identifier = identifier + "/" + i
                    // const sec_hashkey = `${contactName}${sec_identifier.hashCode()}`.hashCode()

                    const sec_identifier = identifier;
                    const sec_hashkey = hashKey;

                    const contactId = getUserId(username);
                    let secondaryContact = yield call(IDBContact.getContactById, contactId);

                    if (registered && secondaryContact) {

                        if (type === ADD_CONTACT_TYPE.addContactPanel) {
                            secondaryContact.firstName = mainContact.firstName;
                            secondaryContact.isProductContact = notificationMessage !== null ? true : registered;
                            secondaryContact.lastName = mainContact.lastName;
                            secondaryContact.name = mainContact.name;
                            secondaryContact.saved = saved;
                            secondaryContact.avatarCharacter = mainContact.avatarCharacter;
                            secondaryContact.numbers = mainContact.numbers;
                            secondaryContact.parentMainId = mainContact.mainId;
                            secondaryContact.image = mainContact.image;
                            secondaryContact.avatar = mainContact.avatar;
                            secondaryContact.avatarHash = mainContact.avatarHash;
                            // secondaryContact.label = labels.find(label => label.value === email || label.value === username).label;
                            secondaryContact.label = "home"
                            secondaryContact.color = mainContact.color;

                            secondaryContact.hashKey = sec_hashkey
                            secondaryContact.identifier = sec_identifier

                            if (!notSaved) {
                                yield call(saveContact, [{number: username, hashKey: sec_hashkey, firstName: firstName, lastName: lastName, identifier: sec_identifier, internal: registered, editNumber: false}]);
                            }



                            yield all([
                                call(IDBContact.updateContact, contactId, {
                                    firstName: secondaryContact.firstName,
                                    lastName: secondaryContact.lastName,
                                    saved: secondaryContact.saved,
                                    name: secondaryContact.name,
                                    avatarCharacter: secondaryContact.avatarCharacter,
                                    numbers: secondaryContact.numbers,
                                    parentMainId: secondaryContact.parentMainId,
                                    avatar: secondaryContact.avatar,
                                    avatarHash: secondaryContact.avatarHash,
                                    image: secondaryContact.image,
                                    label: secondaryContact.label,
                                    color: secondaryContact.color,
                                    isProductContact: secondaryContact.isProductContact,
                                    hashKey: secondaryContact.hashKey,
                                    identifier: secondaryContact.identifier
                                }),
                                put(updateContact(contactId, secondaryContact.firstName, secondaryContact.lastName, username, secondaryContact.avatarUrl, secondaryContact.imageUrl, registered, secondaryContact.saved, null, null, secondaryContact.parentMainId, secondaryContact.numbers, secondaryContact.image, secondaryContact.avatar, secondaryContact.label, secondaryContact.color, secondaryContact.avatarHash))
                            ]);
                        }
                    } else {
                        secondaryContact = {
                            blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(email || username)),
                            username,
                            isProductContact: false,
                            createdAt: Date.now(),
                            avatarCharacter: mainContact.avatarCharacter,
                            color: getColor(),
                            status: "offline",
                            favorite: false,
                            avatarUrl: "",
                            contactId,
                            imageUrl: "",
                            email: email || "",
                            muted: false,
                            firstName: mainContact.firstName,
                            lastName: mainContact.lastName,
                            name: mainContact.name,
                            author,
                            saved,
                            phone: username,
                            parentMainId: mainContact.mainId,
                            numbers: mainContact.numbers,
                            image: mainContact.image,
                            avatar: mainContact.avatar,
                            avatarHash: mainContact.avatarHash,
                            label: labels ? labels.find(label => label.value === email || label.value === username).label : "home",
                            // label: "home",
                            hashKey,
                            identifier
                        };

                        const {data: {body}}: any = yield call(profileList, [secondaryContact.username]);

                        if (body[contact.username]) {
                            secondaryContact.isProductContact = true;
                        }

                        const thread: any = {
                            conversations: {},
                            messages: {},
                            threads: {
                                threadId: secondaryContact.contactId,
                                threadType: getConversationType(secondaryContact.contactId),
                                threadInfo: {}
                            },
                            members: {}
                        };

                        thread.members[secondaryContact.contactId] = secondaryContact;

                        if (!notSaved) {
                            yield call(saveContact, [{number: username, hashKey: sec_hashkey, firstName: firstName, lastName: lastName, identifier: sec_identifier, internal: registered, editNumber: false}]);
                        }

                        yield all([
                            put(createContact(contactId, thread)),
                            call(IDBContact.createContact, secondaryContact)
                        ]);
                    }
                }
            }

            if (mainContact) {
                yield put(contactCreationDone(mainContact.contactId));
            } else {
                console.log("contact is not created #attemptCreateContact");
            }

            if (setThreadId && selectedThreadId !== contactId) {
                let thread: any;
                if (conversations.has(mainContact.contactId)) {
                    thread = conversations.get(mainContact.contactId).toJS();

                } else {
                    thread = {
                        conversations: {},
                        messages: {},
                        threads: {
                            threadId: mainContact.contactId,
                            threadType: getConversationType(mainContact.contactId),
                            threadInfo: {}
                        },
                        members: {}
                    };
                    thread.members[mainContact.contactId] = mainContact;
                }
                if(createConversation) {
                    yield put(attemptCreateEmptyConversation(mainContact.contactId))
                }
                yield put(attemptSetSelectedThread(thread));
            }

        }

        if (editableId) {
            yield put(attemptEnableContactEditable(editableId, false))
        }

        yield put(contactErrors({}))
    } catch (error) {
        console.log(error);
    }
}

function* attemptToggleBlock({payload: {contactsToBlock, command}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {contacts, selectedThreadId, app} = selector(store.getState(), {
        contacts: true,
        selectedThreadId: true,
        app: true
    });
    const connection: any = connectionCreator.getConnection();
    const blocked = command === ADD_TO_BLOCKED_COMMAND;
    const requestEffects: Array<any> = [];
    const effects: Array<any> = [];
    const messages: Array<any> = [];
    const blockedContacts: any = yield call(IDBContact.getBlockedContacts, DISPLAY_CONTATCS_COUNT);

    contactsToBlock = Array.isArray(contactsToBlock) ? contactsToBlock : contactsToBlock.split();

    contactsToBlock.map(number => {
        const threadId: string = getUserId(number);
        const isInBlockedList: boolean = Object.keys(blockedContacts).join().includes(number);

        if (contacts.has(threadId)) {
            const contact = contacts.get(threadId);
            if (!contact.getIn(["members", threadId, "isProductContact"])) return;
        }

        if (blocked && blockedContacts && isInBlockedList) {
            return;

        } else if (!blocked && blockedContacts && !isInBlockedList) {
            return;
        }

        const requestId: number = Math.floor(Math.random() * 9999 + 1);
        console.log(requestId, "########################################");
        const id: string = `block${Date.now()}${number}`;
        messages.push(toggleContactBlockXML({id, contactToBlock: number, command, requestId: requestId.toString()}));

        const request: any = {
            id,
            xmlBuilder: "toggleContactBlockXML",
            params: {id, contactToBlock: number, command, requestId},
            createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
        };

        requestEffects.push(put(addRequest(request)));

        if (selectedThreadId && selectedThreadId.includes(number)) {
            effects.push(put(updateSelectedThread({blocked})));
        }

        effects.push(call(IDBContact.updateContact, `${number}@${SINGLE_CONVERSATION_EXTENSION}`, {blocked}));
        effects.push(put(updateConversationsBlocked(threadId, blocked)));
        effects.push(put(toggleBlocked(threadId, blocked)));
    });

    if (requestEffects.length > 0) {
        yield all(requestEffects);
    }

    if (effects.length > 0) {
        yield all(effects);
    }

    if (app.leftPanel === LEFT_PANELS.blocked) {
        yield call(attemptGetBlockedContacts, {payload: {limit: DISPLAY_CONTATCS_COUNT}});
    }

    messages.map(msg => {
        if (connection.connected) {
            connection.send(msg);
        }
    });

}

export function* checkForProfileUpdates(username: string, selectedThreadId: string, thread) {
    const selectedThread = Map.isMap(thread) ? thread : fromJS(thread);
    let avatarIsTheSame: boolean = false;
    const updatedThread: any = {};
    const isSavedContact: boolean = selectedThread && selectedThread.getIn(["members", selectedThreadId, "saved"]);

    try {
        if (selectedThreadId && selectedThreadId.includes(username)) {
            const {data: {body}}: any = yield call(profileList, [username]);

            const response = body[username];



            if (response) {
                if (response.imgHash) {
                    const currentAvatar: Blob = selectedThread && selectedThread.getIn(["members", selectedThreadId, "avatar"]);
                    const image = yield response.avatarUrl && call(fetchFile, response.avatarUrl);
                    const imageFile: Blob = image.type.includes('xml') || image.type.includes('html') ? null : image;
                    avatarIsTheSame = (currentAvatar && currentAvatar.size) === (imageFile && imageFile.size);


                    if (imageFile && !avatarIsTheSame) {
                        updatedThread["threadId"] = selectedThreadId;
                        updatedThread["avatar"] = imageFile;
                        updatedThread["image"] = imageFile;
                        updatedThread["imageHash"] = response.imgHash;
                        yield put(updateConversationAvatar(selectedThreadId, updatedThread["avatar"], updatedThread["imageHash"]));
                        yield put(updateContactAvatar(selectedThreadId, updatedThread["avatar"], updatedThread["imageHash"]));
                        yield fork(ContactsModel.updateContactAvatar, updatedThread)
                    }
                }

                if ((response.firstName || response.lastName) && !isSavedContact) {
                    const currentFirstName: string = selectedThread && selectedThread.getIn(["members", selectedThreadId, "firstName"]);
                    const currentLastName: string = selectedThread && selectedThread.getIn(["members", selectedThreadId, "lastName"]);
                    const isFirstNameChanged: boolean = response.firstName && currentFirstName !== response.firstName;
                    const isLastNameChanged: boolean = response.lastName && currentLastName !== response.lastName;
                    // rror: Cannot read property 'firstName' of undefined
                    if ((isFirstNameChanged || isLastNameChanged)) {
                        updatedThread["threadId"] = selectedThreadId;
                        updatedThread["firstName"] = response.firstName ? response.firstName : '';
                        updatedThread["lastName"] = response.lastName ? response.lastName: '';
                        updatedThread["name"] = response.firstName && response.lastName ? `${response.firstName} ${response.lastName}` : response.firstName ? response.firstName : response.lastName;
                        updatedThread["avatarCharacter"] = response.firstName && response.lastName ? getInitials(response.firstName, response.lastName) : '';

                        if (selectedThread) {
                            yield put(updateConversation(selectedThreadId, updatedThread["firstName"], updatedThread["lastName"], selectedThread.getIn(["members", selectedThreadId, "phone"])));
                            yield put(updateContact(selectedThreadId, updatedThread["firstName"], updatedThread["lastName"], selectedThread.getIn(["members", selectedThreadId, "phone"])))
                        }

                        if (Object.keys(updatedThread).length > 0) {
                            yield all([
                                put(updateSelectedThread(updatedThread)),
                                fork(ContactsModel.updateContact, updatedThread),
                            ]);
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.log(e, "### checkForProfileUpdates");
    }
}

function* deleteConversation({payload: {id, removeSelectedThreadId}}: any): any {
    yield put(deleteThreadMessages(id));
    yield put(removeLastMessageId(id));
    if (removeSelectedThreadId) {
        yield put(removeSelectedThreadIdFromStore());
    }
}

function* attemptUpdateContact({payload: {idList, firstName, lastName, phoneList, avatarUrl, imageUrl, username, svContacts, favorite}}) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId, savedContacts, selectedThread, contacts} = selector(store.getState(), {
        selectedThreadId: true,
        savedContacts: true,
        selectedThread: true,
        contacts: true
    });
    const effects: Array<any> = [];
    const updateFavorite: boolean = favorite !== undefined;
    // the username passed to this function is the users username, not the contact username so the new id is `${phone}@${SINGLE_CONVERSATION_EXTENSION} every time,
    const newId = username && username.toString().startsWith('87') ? `${phoneList[0].value}@${SINGLE_CONVERSATION_EXTENSION}` : phoneList[0].value.toString();
    // const newId = `${phone}@${SINGLE_CONVERSATION_EXTENSION}`;
    //
    //
    // let parentContactId: string;
    // let avatarBlob: Blob;
    // if (selectedThreadId === id) {
    //     parentContactId = selectedThread.getIn(["members", id, "parentContactId"]);
    // }

    const deletedContactRequests = idList.reduce((acc, currentId) => {
        acc.push(put(DELETE_CONTACT(currentId)))
        // acc.push(call(DatabaseContacts.deleteContact, currentId))

        return acc
    }, [])
    const phones = phoneList.reduce((acc, currentPhone) => {

        if(currentPhone.category === "email" && APPLICATION.WITHEMAIL) {
            return acc
        }

        acc.push(currentPhone.value)
        return acc
    }, [])

    const emails = phoneList.reduce((acc, currentEmail) => {

        if(currentEmail.category === "email" && APPLICATION.WITHEMAIL) {
            acc.push(currentEmail.email)
        }

        return acc
    }, [])


    // yield all(deletedContactRequests);
    // yield delay(50)
    yield put(attemptEnableContactEditable(idList[0], true));
    const isThreadExists: boolean = yield call(IDBThreads.isThreadContactExist, {contactId: idList[0]});
    const {contact, isMainContact, childContact}: any = yield call(DatabaseContacts.selectContact, idList[0], true);

    if (contact) {
        const mainId: string = contact.contactId;


        const response: any = yield call(deleteContact, [{number: contact.username, hashKey: contact.hashKey}]);

        const {data: {body, status}} = response;
        if (status === "SUCCESS") {
            yield call(DatabaseContacts.deleteContact, mainId);

            yield put(DELETE_CONTACT_SUCCEED(mainId));
            if (!isThreadExists) {
                // If conversation is empty show splash s`creen (welcome page)
                yield put(resetSelectedThread());
            } else {
                const contactToUpdate: any = isMainContact ? contact : childContact;

                yield all([
                    put(conversationPropertyUpdateSuccess(mainId, [
                        {key: 'saved', value: false},
                        {key: 'favorite', value: false},
                        {key: 'numbers', value: null},
                        {key: 'parentMainId', value: null},
                        {key: 'firstName', value: contactToUpdate.firstName},
                        {key: 'lastName', value: contactToUpdate.lastName},
                        {key: 'name', value: contactToUpdate.name},
                        {key: 'avatarCharacter', value: contactToUpdate.avatarCharacter},
                        {key: 'color', value: fromJS(contactToUpdate.color)},
                        {key: 'avatar', value: contactToUpdate.avatar},
                        {key: 'image', value: contactToUpdate.image},
                    ])),
                    put(updateSelectedThread({
                        saved: false,
                        favorite: false,
                        numbers: null,
                        parentMainId: null,
                        firstName: contactToUpdate.firstName,
                        lastName: contactToUpdate.lastName,
                        name: contactToUpdate.name,
                        avatarCharacter: contactToUpdate.avatarCharacter,
                        color: contactToUpdate.color,
                        avatar: contactToUpdate.avatar,
                        image: contactToUpdate.image,
                    }))
                ]);
            }
        }
    }

    if(phoneList.length) {
        yield put(attemptCreateContactAction(newId, firstName, lastName, username, phones, true, true, ADD_CONTACT_TYPE.addContactPanel, emails, phoneList, null, idList[0]));
    } else {
        yield put(attemptEnableContactEditable(idList[0], false))
    }




    // return

    // if (id !== newId) {
    //     console.log(firstName, lastName, "firstName_lastName")
    //     yield put(DELETE_CONTACT(id));
    //     yield put(attemptCreateContactAction(newId, firstName, lastName, username, [phone], true, true, ADD_CONTACT_TYPE.addContactPanel));
    // } else {
    //     /*        if(avatarUrl) {
    //                 at this moment it's unnecessary
    //                 try {
    //                     const response = yield call(profileList, [avatarUrl]);
    //                     const {data: {body, status}} = response;
    //
    //                     if(status === "SUCCESS" && body && body.hasOwnProperty(avatarUrl)) {
    //                         avatarBlob = yield call(fetchFile, body[avatarUrl].avatarUrl);
    //                         avatarBlob = avatarBlob.type.includes('xml') || avatarBlob.type.includes('html') ?
    //                             null :
    //                             avatarBlob;
    //
    //                     }
    //
    //                 } catch (e) {
    //                     console.log(e, "attemptUpdateContact");
    //                 }
    //             }*/
    //
    //     mapKeys.map(key => {
    //         if (key.includes(`${childContactId}/1/`) && key !== parentContactId && key !== id) {
    //             privateChatIdsToUpdate.push(key);
    //         }
    //     });
    //     const email: string = contact && contact.getIn(['members', id, 'email']) || '';
    //     const contactName = (firstName !== "" || lastName !== "") ? `${firstName} ${lastName}`.trim() :
    //       (email || phone).toString();
    //     const avatarCharacter = getInitials(firstName, lastName);
    //     const updatedContact = {
    //         firstName,
    //         lastName,
    //         name: contactName,
    //         avatarCharacter
    //     };
    //
    //     if (avatarUrl) {
    //         updatedContact["avatarCharacter"] = avatarCharacter;
    //         updatedContact["avatarUrl"] = `${phone}/avatar`;
    //         updatedContact["imageUrl"] = `${phone}/image`;
    //         updatedContact["avatar"] = avatarBlob;
    //         updatedContact["image"] = avatarBlob;
    //     }
    //
    //     updateFavorite ? updatedContact["favorite"] = favorite : null;
    //
    //     effects.push(call(IDBContact.updateContact, id, updatedContact));
    //
    //     if (selectedThreadId === id) {
    //         const updatedThread = {
    //             firstName,
    //             lastName,
    //             name: contactName,
    //             avatarCharacter
    //         };
    //
    //         if (avatarUrl) {
    //             updatedThread["avatarCharacter"] = avatarCharacter;
    //             updatedThread["avatarUrl"] = `${phone}/avatar`;
    //             updatedThread["imageUrl"] = `${phone}/image`;
    //             updatedThread["avatar"] = avatarBlob;
    //             updatedThread["image"] = avatarBlob;
    //         }
    //
    //
    //         updateFavorite ? updatedThread["favorite"] = favorite : null;
    //         effects.push(put(updateSelectedThread(updatedThread)));
    //     }
    //
    //     const response: any = yield call(userCheck, [phone], []);
    //     const {data: {status, body: contacts}} = response;
    //     let isRegistered;
    //     if (status === "SUCCESS" && Array.isArray(contacts)) {
    //         const primaryNumber = contacts.find(item => item.registered && item.email) || contacts[0];
    //         const {registered} = primaryNumber;
    //         isRegistered = registered
    //     }
    //
    //     String.prototype.hashCode = function(){
    //         var hash = 0;
    //         for (var i = 0; i < this.length; i++) {
    //             var character = this.charCodeAt(i);
    //             hash = ((hash<<5)-hash)+character;
    //             hash = hash & hash; // Convert to 32bit integer
    //         }
    //         return hash;
    //     }
    //
    //     const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : phone;
    //     const date = new Date()
    //     const identifier = date.getTime() + ""
    //     const hashKey = `${name}${identifier.hashCode()}`.hashCode()
    //
    //     const contactData: any = yield call(saveContact, [{number: phone, hashKey, firstName, lastName, identifier, internal: isRegistered, editNumber: false}]);
    //
    //     // const {data: {body, status}} = data;
    //
    //     console.log(isRegistered, "isRegistered")
    //
    //     effects.push(put(updateContact(id, firstName, lastName, phone, avatarBlob, imageUrl, status !== "FAILED" && isRegistered && isRegistered !== false ? true : false, savedContacts.has(id), favorite)));
    //     effects.push(put(updateConversation(id, firstName, lastName, phone, undefined, undefined, avatarBlob, imageUrl)));
    //
    //     if (parentContactId && contacts.has(parentContactId)) {
    //         effects.push(put(updateConversation(parentContactId, firstName, lastName, phone, avatarUrl, imageUrl)));
    //         effects.push(put(updateContact(parentContactId, firstName, lastName, phone, avatarUrl, imageUrl, savedContacts.has(parentContactId), favorite)));
    //     }
    //
    //     if (privateChatIdsToUpdate.length > 0) {
    //         privateChatIdsToUpdate.map(privateChatId => {
    //             if (contacts.has(privateChatId)) {
    //                 effects.push(put(updateConversation(privateChatId, firstName, lastName, phone, avatarUrl, imageUrl)));
    //                 effects.push(put(updateContact(privateChatId, firstName, lastName, phone, avatarUrl, imageUrl, savedContacts.has(privateChatId), favorite)));
    //             }
    //         });
    //     }
    //
    //     yield all(effects);
    // }

}

// function* attemptUpdateContact({payload: {id, firstName, lastName, phone, avatarUrl, imageUrl, username, contact, favorite}}) {
//     const store: Store<any> = storeCreator.getStore();
//     const {selectedThreadId, savedContacts, selectedThread, contacts} = selector(store.getState(), {
//         selectedThreadId: true,
//         savedContacts: true,
//         selectedThread: true,
//         contacts: true
//     });
//     const effects: Array<any> = [];
//     const updateFavorite: boolean = favorite !== undefined;
//     // the username passed to this function is the users username, not the contact username so the new id is `${phone}@${SINGLE_CONVERSATION_EXTENSION} every time,
//     // const newId = username && username.toString().startsWith('87') ? `${phone}@${SINGLE_CONVERSATION_EXTENSION}` : phone.toString();
//     const newId = `${phone}@${SINGLE_CONVERSATION_EXTENSION}`;
//     const childContactId = id.split("/").shift();
//     const mapKeys = contacts.keySeq().toArray();
//     const privateChatIdsToUpdate: Array<string> = [];
//
//     let parentContactId: string;
//     let avatarBlob: Blob;
//     if (selectedThreadId === id) {
//         parentContactId = selectedThread.getIn(["members", id, "parentContactId"]);
//     }
//
//     console.log("attemptUpdateContact")
//
//     return
//
//     if (id !== newId) {
//         console.log(firstName, lastName, "firstName_lastName")
//         yield put(DELETE_CONTACT(id));
//         yield put(attemptCreateContactAction(newId, firstName, lastName, username, [phone], true, true, ADD_CONTACT_TYPE.addContactPanel));
//     } else {
//         /*        if(avatarUrl) {
//                     at this moment it's unnecessary
//                     try {
//                         const response = yield call(profileList, [avatarUrl]);
//                         const {data: {body, status}} = response;
//
//                         if(status === "SUCCESS" && body && body.hasOwnProperty(avatarUrl)) {
//                             avatarBlob = yield call(fetchFile, body[avatarUrl].avatarUrl);
//                             avatarBlob = avatarBlob.type.includes('xml') || avatarBlob.type.includes('html') ?
//                                 null :
//                                 avatarBlob;
//
//                         }
//
//                     } catch (e) {
//                         console.log(e, "attemptUpdateContact");
//                     }
//                 }*/
//
//         mapKeys.map(key => {
//             if (key.includes(`${childContactId}/1/`) && key !== parentContactId && key !== id) {
//                 privateChatIdsToUpdate.push(key);
//             }
//         });
//         const email: string = contact && contact.getIn(['members', id, 'email']) || '';
//         const contactName = (firstName !== "" || lastName !== "") ? `${firstName} ${lastName}`.trim() :
//             (email || phone).toString();
//         const avatarCharacter = getInitials(firstName, lastName);
//         const updatedContact = {
//             firstName,
//             lastName,
//             name: contactName,
//             avatarCharacter
//         };
//
//         if (avatarUrl) {
//             updatedContact["avatarCharacter"] = avatarCharacter;
//             updatedContact["avatarUrl"] = `${phone}/avatar`;
//             updatedContact["imageUrl"] = `${phone}/image`;
//             updatedContact["avatar"] = avatarBlob;
//             updatedContact["image"] = avatarBlob;
//         }
//
//         updateFavorite ? updatedContact["favorite"] = favorite : null;
//
//         effects.push(call(IDBContact.updateContact, id, updatedContact));
//
//         if (selectedThreadId === id) {
//             const updatedThread = {
//                 firstName,
//                 lastName,
//                 name: contactName,
//                 avatarCharacter
//             };
//
//             if (avatarUrl) {
//                 updatedThread["avatarCharacter"] = avatarCharacter;
//                 updatedThread["avatarUrl"] = `${phone}/avatar`;
//                 updatedThread["imageUrl"] = `${phone}/image`;
//                 updatedThread["avatar"] = avatarBlob;
//                 updatedThread["image"] = avatarBlob;
//             }
//
//
//             updateFavorite ? updatedThread["favorite"] = favorite : null;
//             effects.push(put(updateSelectedThread(updatedThread)));
//         }
//
//         const response: any = yield call(userCheck, [phone], []);
//         const {data: {status, body: contacts}} = response;
//         let isRegistered;
//         if (status === "SUCCESS" && Array.isArray(contacts)) {
//             const primaryNumber = contacts.find(item => item.registered && item.email) || contacts[0];
//             const {registered} = primaryNumber;
//             isRegistered = registered
//         }
//
//         String.prototype.hashCode = function(){
//             var hash = 0;
//             for (var i = 0; i < this.length; i++) {
//                 var character = this.charCodeAt(i);
//                 hash = ((hash<<5)-hash)+character;
//                 hash = hash & hash; // Convert to 32bit integer
//             }
//             return hash;
//         }
//
//         const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : phone;
//         const date = new Date()
//         const identifier = date.getTime() + ""
//         const hashKey = `${name}${identifier.hashCode()}`.hashCode()
//
//         const contactData: any = yield call(saveContact, [{number: phone, hashKey, firstName, lastName, identifier, internal: isRegistered, editNumber: false}]);
//
//         // const {data: {body, status}} = data;
//
//         console.log(isRegistered, "isRegistered")
//
//         effects.push(put(updateContact(id, firstName, lastName, phone, avatarBlob, imageUrl, status !== "FAILED" && isRegistered && isRegistered !== false ? true : false, savedContacts.has(id), favorite)));
//         effects.push(put(updateConversation(id, firstName, lastName, phone, undefined, undefined, avatarBlob, imageUrl)));
//
//         if (parentContactId && contacts.has(parentContactId)) {
//             effects.push(put(updateConversation(parentContactId, firstName, lastName, phone, avatarUrl, imageUrl)));
//             effects.push(put(updateContact(parentContactId, firstName, lastName, phone, avatarUrl, imageUrl, savedContacts.has(parentContactId), favorite)));
//         }
//
//         if (privateChatIdsToUpdate.length > 0) {
//             privateChatIdsToUpdate.map(privateChatId => {
//                 if (contacts.has(privateChatId)) {
//                     effects.push(put(updateConversation(privateChatId, firstName, lastName, phone, avatarUrl, imageUrl)));
//                     effects.push(put(updateContact(privateChatId, firstName, lastName, phone, avatarUrl, imageUrl, savedContacts.has(privateChatId), favorite)));
//                 }
//             });
//         }
//
//         yield all(effects);
//     }
//
// }

function* attemptSaveContact({payload: {id, contact}}) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {contacts} = selector(store.getState(), {contacts: true});



        const {lastName, firstName, phone, name, avatarCharacter, username, isProductContact} = contact.members[id];
        const effects: Array<any> = [];
        const mapKeys = contacts.keySeq().toArray();
        const privateChatIdsToUpdate: Array<string> = [];
        const childContactId: string = id.split("/").shift();

        effects.push(put(updateSelectedThread({saved: true, lastName, firstName, avatarCharacter, name})));
        effects.push(put(updateConversation(id, firstName, lastName, phone,undefined,undefined,undefined,undefined, true,)));

        const savedContact = {...contact};
        savedContact.members[id].saved = true;

        // @ts-ignore
        String.prototype.hashCode = function(){
            var hash = 0;
            for (var i = 0; i < this.length; i++) {
                var character = this.charCodeAt(i);
                hash = ((hash<<5)-hash)+character;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }

        const date = new Date()
        const identifier: any = date.getTime() + ""
        // @ts-ignore
        const hashKey = `${name}${identifier.hashCode()}`.hashCode()

        yield call(saveContact, [{number: username, hashKey, firstName, lastName, identifier, internal: isProductContact, editNumber: false}])

        effects.push(call(IDBContact.updateContact, id, {saved: true, lastName, firstName, avatarCharacter, name, identifier, hashKey}));
        effects.push(put(createContact(id, savedContact)));

        mapKeys.map(key => {
            if ((key.includes(`${childContactId}/1/`) && key !== id)) {
                privateChatIdsToUpdate.push(key);
            }
        });

        if (privateChatIdsToUpdate.length > 0) {
            privateChatIdsToUpdate.map(privateChatId => {
                effects.push(put(updateConversation(privateChatId, firstName, lastName, phone)));
            })
        }

        if (effects.length > 0) {
            yield all(effects);
        }

    } catch (error) {
        console.log(error);
    }
}

function* attemptSetBlockedContactNumbers({payload: {blockedContactNumbers}}) {
    const store: Store<any> = storeCreator.getStore();
    const {synced} = selector(store.getState(), {selectedThreadId: true, synced: true});
    const contactIds = blockedContactNumbers.map(number => getUserId(number));

    if (!synced.get("contacts")) {
        yield take(APPLICATION_ACTIONS.CONTACTS_SYNC_SUCCESS);
    }
    // Temporary disabled for zz
    // if(!synced.get("conversations")) {
    //     yield take(APPLICATION_ACTIONS.CONVERSATIONS_SYNC_SUCCESS);
    // }

    yield all([
        call(IDBContact.setBlockedContacts, contactIds),
        put(setBlockedConversations(contactIds)),
        put(setBlockedContactIds(contactIds))
    ]);

    {
        const store: Store<any> = storeCreator.getStore();
        const {selectedThreadId} = selector(store.getState(), {selectedThreadId: true});

        if (selectedThreadId && blockedContactNumbers.includes(getUsername(selectedThreadId))) {
            yield put(updateSelectedThread({blocked: true}));
        }
    }

}

function* attemptToggleFavorite({payload: {id, favorite, parentContactId}}) {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId} = selector(store.getState(), {selectedThreadId: true});
    try {
        const requests: any[] = [
            call(IDBContact.updateContact, id, {favorite: !favorite}),
            put(toggleFavorite(id, parentContactId))
        ];
        if (selectedThreadId === id) {
            requests.push(put(updateSelectedThread({favorite: !favorite})));
        }
        yield all(requests);

    } catch (error) {
        console.log(error);
    }

}

function* attemptFavoritesUpdate({payload}) {
    try {
        const selectedThreadId = yield select(selectedThreadIdSelector());

        const changes: { prevValue: boolean, value: boolean, username: string }[] = payload.favoritesChanges;
        let selectedThreadFavorite: boolean;

        const queries: any[] = [];
        const updates: { contactId: string, isFavorite: boolean }[] = [];
        for (let change of changes) {

            const contactId: string = getUserId(change["username"]);
            const isFavorite: boolean = change["value"];

            const {contact, isMainContact, childContact}: any = yield call(DatabaseContacts.selectContact, contactId, true);

            const mainId: string = contact.contactId;


            queries.push(
                call(IDBContact.updateFavorite, mainId, isFavorite),
            );

            if (selectedThreadId === contactId) {
                selectedThreadFavorite = isFavorite;
            }
            updates.push({
                contactId,
                isFavorite
            })
        }

        const result = yield all(queries);

        const updatedContacts = Array.prototype.concat.apply([], result);

        const effects: any[] = [];

        if (typeof selectedThreadFavorite !== 'undefined') {
            effects.push(put(updateSelectedThread({favorite: selectedThreadFavorite})));
        }

        effects.push(put(UPDATE_FAVORITES(updatedContacts)));

        yield all(effects)
    } catch (error) {
        console.log(error)
    }
}

// function* _attemptSetContacts({payload: {username}}) {
//
//     window.addEventListener("beforeunload", () => {
//         const key = `synced_${APPLICATION.VERSION}`;
//         const synced: any = localStorage.getItem(key);
//
//         if (!(synced && JSON.parse(synced).contacts) || !synced) {
//             setFailed(put(attemptSetContactsAction(username)));
//         }
//     });
//
//     yield put(setContactsLoading());
//     const store: Store<any> = storeCreator.getStore();
//     const {user, savedContacts, blockedContactNumbers} = selector(store.getState(), {
//         user: true,
//         savedContacts: true,
//         blockedContactNumbers: true,
//     });
//
//     try {
//         const response: any = yield call(getContactsData);
//
//         const {data: {body, status}} = response;
//         const contactsMap = {};
//         const productContacts: any = [];
//
//         if (status === "SUCCESS" && body) {
//             for (const contact of body) {
//                 const existingNumber = contact.numbers.length > 0 ? contact.numbers[0].fullNumber : null;
//
//                 if (existingNumber) {
//                     const contactNumbers = validateNumber(existingNumber, username);
//                     const fullNumber = contactNumbers && contactNumbers.fullNumber || existingNumber;
//                     const id = `${fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`;
//                     const isProductContact = contact.numbers[0].zangi;
//                     const lastName: string = contact.lastName || "";
//                     const name: string = contact.firstName ? `${contact.firstName} ${lastName}`.trim() : lastName ? lastName : fullNumber;
//
//                     if (isProductContact) {
//                         productContacts.push(fullNumber)
//                     }
//
//                     if (!savedContacts.has(id)) {
//                         contactsMap[id] = {
//                             threads: {
//                                 threadId: id,
//                                 threadType: getConversationType(id)
//                             },
//                             conversations: {
//                                 conversationId: id,
//                                 lastMessageId: "",
//                                 newMessagesIds: [],
//                                 typing: [],
//                                 time: 0
//                             },
//                             messages: {},
//                             members: {}
//                         };
//
//                         contactsMap[id].members[id] = {
//                             isProductContact,
//                             avatarCharacter: getInitials(contact.firstName || "", lastName || ""),
//                             blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(fullNumber)),
//                             favorite: contact.numbers[0].favorite,
//                             firstName: contact.firstName || "",
//                             lastName: lastName || "",
//                             createdAt: Date.now(),
//                             username: fullNumber,
//                             status: "offline",
//                             phone: fullNumber,
//                             color: getColor(),
//                             author: username,
//                             avatarUrl: "",
//                             imageUrl: "",
//                             avatar: null,
//                             image: null,
//                             contactId: id,
//                             muted: false,
//                             saved: true,
//                             name
//                         };
//
//                     } else {
//                         contactsMap[id] = savedContacts.get(id).toJS();
//                         contactsMap[id].members[id].saved = true;
//                     }
//                 }
//             }
//             if (productContacts.length) {
//                 const contactsInfo: any = yield call(profileList, productContacts);
//                 const imageMap: any = {};
//                 if (contactsInfo && contactsInfo.data.status === "SUCCESS" && contactsInfo.data.body) {
//                     const contactProfiles: any = contactsInfo.data.body;
//                     Object.keys(contactProfiles).map((contactNumber) => {
//                         const id: string = `${contactNumber}@${SINGLE_CONVERSATION_EXTENSION}`;
//                         if (contactProfiles[contactNumber].avatarUrl) {
//                             imageMap[id] = call(fetchFile, contactProfiles[contactNumber].avatarUrl);
//                         }
//                     });
//                     const imageMapResult: any = yield all(imageMap);
//                     Object.keys(imageMapResult).map((contactId) => {
//                         if (contactsMap.hasOwnProperty(contactId)) {
//                             const imageFile: Blob = imageMapResult[contactId].type.includes('xml') || imageMapResult[contactId].type.includes('html') ? null : imageMapResult[contactId];
//                             const member: any = contactsMap[contactId]['members'][contactId];
//                             member.avatar = imageFile;
//                             member.image = imageFile;
//                             member.avatarUrl = `${contactId.split("@")[0]}/avatar`;
//                             member.imageUrl = `${contactId.split("@")[0]}/image`;
//                         }
//                     });
//                 }
//             }
//
//             const userCredentials: ICredentials = getCredentials();
//             const username: string = userCredentials["X-Access-Number"];
//
//             if (username !== username) {
//                 throw new Error("User Credentials Error");
//             }
//
//             yield all([
//                 put(contactsBulkInsert(contactsMap)),
//                 call(IDBContact.contactsBulkInsert, contactsMap)
//             ]);
//         }
//
//         if (status === "SUCCESS") {
//             yield put(contactsSyncSuccess());
//
//         } else {
//             const effect = put(attemptSetContactsAction(username));
//             yield put(syncFailed(effect));
//         }
//
//     } catch (e) {
//         if (CONNECTION_ERROR_TYPES.includes(e.message) || !navigator.onLine) {
//             const effect = put(attemptSetContactsAction(username));
//             yield put(syncFailed(effect));
//         }
//
//     } finally {
//         yield put(removeContactsLoading());
//     }
// }

function* attemptSetContacts({payload: {username}}) {

    window.addEventListener("beforeunload", () => {
        const key = `synced_${APPLICATION.VERSION}`;
        const synced: any = localStorage.getItem(key);

        if (!(synced && JSON.parse(synced).contacts) || !synced) {
            setFailed(put(attemptSetContactsAction(username)));
        }
    });

    yield put(setContactsLoading());
    const store: Store<any> = storeCreator.getStore();
    const {savedContacts, blockedContactNumbers} = selector(store.getState(), {
        savedContacts: true,
        blockedContactNumbers: true
    });

    if (!savedContacts.isEmpty()) {
        return;
    }

    try {
        const response: any = yield call(getContactsData);

        const {data: {body, status}} = response;
        const contactsMap = {};
        const productContacts: any = [];

        if (status === "SUCCESS" && body) {
            // const secondaryContacts = {}
            const mainIds = {}

            for (const contact in body) {
                const { number, identifier } = body[contact];
                // mainIds[identifier] = number;

                if(mainIds[identifier]){
                    mainIds[identifier].push(number)
                } else {
                    mainIds[identifier] = [number]
                }

                // const secArr = identifier.split("/")
                // if(secArr.length > 1) {
                //     if(secondaryContacts[secArr[0]]) {
                //         secondaryContacts[secArr[0]][identifier] = number
                //     } else {
                //         secondaryContacts[secArr[0]] = {}
                //         secondaryContacts[secArr[0]][identifier] = number
                //     }
                // }
            }

            for (const contact in body) {
                const { number, fullNumber, firstName, lastName, email, hashKey, identifier, internal } = body[contact];
                const fNumber = fullNumber ? fullNumber : number;
                const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : fNumber;

                if (internal === false) {
                    continue;
                }

                // @ts-ignore
                String.prototype.hashCode = function(){
                    var hash = 0;
                    for (var i = 0; i < this.length; i++) {
                        var character = this.charCodeAt(i);
                        hash = ((hash<<5)-hash)+character;
                        hash = hash & hash; // Convert to 32bit integer
                    }
                    return hash;
                }


                const contactId = getUserId(number);
                contactsMap[contactId] = {
                    threads: {
                        threadId: contactId,
                        threadType: getConversationType(contactId)
                    },
                    conversations: {
                        conversationId: contactId,
                        lastMessageId: "",
                        newMessagesIds: [],
                        typing: [],
                        time: 0
                    },
                    messages: {},
                    members: {}
                };

                let numbers = []
                let parentMainId;

                // const idArr = identifier.split("/");
                //
                // if(secondaryContacts[identifier]) {
                //     numbers = [mainIds[identifier],...Object.values(secondaryContacts[identifier])]
                // }
                //
                // if(idArr.length > 1) {
                //     numbers = [mainIds[idArr[0]], ...Object.values(secondaryContacts[idArr[0]])];
                //     parentMainId = mainIds[idArr[0]]
                // }

                if (mainIds[identifier].length > 1) {
                    numbers = [...mainIds[identifier]]
                    parentMainId = mainIds[identifier][0]
                }


                if (internal) {
                    productContacts.push(fNumber)
                }

                contactsMap[contactId].members[contactId] = {
                    blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(fNumber)),
                    avatarCharacter: getInitials(firstName || "", lastName || ""),
                    firstName: firstName || "",
                    lastName: lastName || "",
                    isProductContact: internal,
                    label: "label",
                    createdAt: Date.now(),
                    username: fNumber,
                    favorite: false,
                    status: "offline",
                    phone: fNumber,
                    color: getColor(),
                    author: username,
                    avatarUrl: "",
                    imageUrl: "",
                    avatar: null,
                    email: email,
                    muted: false,
                    saved: true,
                    image: null,
                    mainId: number,
                    contactId,
                    name,
                    hashKey,
                    identifier,
                    internal,
                    numbers: numbers.length > 1 ? numbers : null,
                    parentMainId
                };
            }



            // for (const contact of body) {
            //     const {numbers, firstName, lastName, id} = contact;
            //
            //     if (Array.isArray(numbers) && numbers.length > 0) {
            //         if (numbers.length === 1) {
            //             let {fullNumber, favorite, zangi, email, label} = numbers[0];
            //
            //             if (fullNumber) {
            //                 //const isEmail: boolean = !!email;
            //                 //const contactNumbers = validateNumber(fullNumber, username, isEmail);
            //                 //fullNumber = contactNumbers && contactNumbers.fullNumber || fullNumber;
            //                 //fullNumber = getUsername(fullNumber);
            //                 const contactId = getUserId(fullNumber);
            //                 const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : fullNumber;
            //
            //                 if (zangi) {
            //                     productContacts.push(fullNumber)
            //                 }
            //
            //                 if (!savedContacts.has(contactId)) {
            //                     contactsMap[contactId] = {
            //                         threads: {
            //                             threadId: contactId,
            //                             threadType: getConversationType(contactId)
            //                         },
            //                         conversations: {
            //                             conversationId: contactId,
            //                             lastMessageId: "",
            //                             newMessagesIds: [],
            //                             typing: [],
            //                             time: 0
            //                         },
            //                         messages: {},
            //                         members: {}
            //                     };
            //
            //                     contactsMap[contactId].members[contactId] = {
            //                         blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(fullNumber)),
            //                         avatarCharacter: getInitials(firstName || "", lastName || ""),
            //                         firstName: firstName || "",
            //                         lastName: lastName || "",
            //                         isProductContact: zangi,
            //                         label: label,
            //                         createdAt: Date.now(),
            //                         username: fullNumber,
            //                         favorite: favorite,
            //                         status: "offline",
            //                         phone: fullNumber,
            //                         color: getColor(),
            //                         author: username,
            //                         avatarUrl: "",
            //                         imageUrl: "",
            //                         avatar: null,
            //                         email: email,
            //                         muted: false,
            //                         saved: true,
            //                         image: null,
            //                         mainId: id,
            //                         contactId,
            //                         name
            //                     };
            //
            //                 } else {
            //                     contactsMap[contactId] = savedContacts.get(contactId).toJS();
            //                     contactsMap[contactId].members[contactId].saved = true;
            //                 }
            //             }
            //
            //         } else {
            //             const _numbers: Array<any> = numbers.filter(number => number.fullNumber);
            //             const primaryNumber = _numbers.find(number => number.zangi) || _numbers.find(number => !number.zangi);
            //             let singleProductContact: boolean = false;
            //
            //             if (!primaryNumber) continue;
            //
            //             let {favorite, zangi, fullNumber, email, label} = primaryNumber;
            //
            //             // const contactNumbers = validateNumber(fullNumber, username);
            //             // fullNumber = contactNumbers && contactNumbers.fullNumber || fullNumber;
            //             // fullNumber = getUsername(fullNumber);
            //             const contactId = getUserId(fullNumber);
            //             const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : fullNumber;
            //
            //             if (zangi) {
            //                 singleProductContact = true;
            //                 productContacts.push(fullNumber)
            //             }
            //
            //             contactsMap[contactId] = {
            //                 threads: {
            //                     threadId: contactId,
            //                     threadType: getConversationType(contactId)
            //                 },
            //                 conversations: {
            //                     conversationId: contactId,
            //                     lastMessageId: "",
            //                     newMessagesIds: [],
            //                     typing: [],
            //                     time: 0
            //                 },
            //                 messages: {},
            //                 members: {}
            //             };
            //
            //             contactsMap[contactId].members[contactId] = {
            //                 blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(fullNumber)),
            //                 numbers: _numbers.map(number => number.fullNumber),
            //                 avatarCharacter: getInitials(firstName || "", lastName || ""),
            //                 firstName: firstName || "",
            //                 lastName: lastName || "",
            //                 isProductContact: zangi,
            //                 label: label,
            //                 createdAt: Date.now(),
            //                 username: fullNumber,
            //                 favorite: favorite,
            //                 status: "offline",
            //                 phone: fullNumber,
            //                 color: getColor(),
            //                 author: username,
            //                 email: email,
            //                 avatarUrl: "",
            //                 imageUrl: "",
            //                 avatar: null,
            //                 muted: false,
            //                 saved: true,
            //                 image: null,
            //                 mainId: id,
            //                 contactId,
            //                 name
            //             };
            //
            //             for (const number of _numbers) {
            //                 let {favorite, zangi, fullNumber, email, label} = number;
            //                 if (!favorite && !zangi && !fullNumber && !email) continue;
            //
            //                 if (fullNumber.includes(primaryNumber.fullNumber)) continue;
            //
            //                 //const contactNumbers = validateNumber(fullNumber, username);
            //                 //fullNumber = contactNumbers && contactNumbers.fullNumber || fullNumber;
            //                 //fullNumber = getUsername(fullNumber);
            //                 const contactId = getUserId(fullNumber);
            //                 const name: string = firstName ? `${firstName} ${lastName || ""}`.trim() : lastName ? lastName : fullNumber;
            //
            //                 if (zangi) {
            //                     singleProductContact = false;
            //                     productContacts.push(fullNumber)
            //                 }
            //
            //                 contactsMap[contactId] = {
            //                     threads: {
            //                         threadId: contactId,
            //                         threadType: getConversationType(contactId)
            //                     },
            //                     conversations: {
            //                         conversationId: contactId,
            //                         lastMessageId: "",
            //                         newMessagesIds: [],
            //                         typing: [],
            //                         time: 0
            //                     },
            //                     messages: {},
            //                     members: {}
            //                 };
            //
            //                 contactsMap[contactId].members[contactId] = {
            //                     blocked: !!(blockedContactNumbers && blockedContactNumbers.includes(fullNumber)),
            //                     numbers: _numbers.map(number => number.fullNumber),
            //                     avatarCharacter: getInitials(firstName || "", lastName || ""),
            //                     firstName: firstName || "",
            //                     lastName: lastName || "",
            //                     isProductContact: zangi,
            //                     label: label,
            //                     createdAt: Date.now(),
            //                     username: fullNumber,
            //                     favorite: favorite,
            //                     status: "offline",
            //                     email: email,
            //                     phone: fullNumber,
            //                     color: getColor(),
            //                     author: username,
            //                     parentMainId: id,
            //                     avatarUrl: "",
            //                     imageUrl: "",
            //                     avatar: null,
            //                     muted: false,
            //                     saved: true,
            //                     image: null,
            //                     contactId,
            //                     name
            //                 };
            //
            //             }
            //
            //             if (contactsMap[contactId] && contactsMap[contactId].members[contactId]) {
            //                 contactsMap[contactId].members[contactId].singleProductContact = singleProductContact;
            //             }
            //         }
            //     }
            // }


            if (productContacts.length) {
                const contactsInfo: any = yield call(profileList, productContacts);
                let avatarMap: any = {};
                // let imageMap: any = {};
                if (contactsInfo && contactsInfo.data.status === "SUCCESS" && contactsInfo.data.body) {
                    const contactProfiles: any = contactsInfo.data.body;
                    Object.keys(contactProfiles).map((contactNumber) => {
                        const id: string = getUserId(contactNumber);
                        if (contactProfiles[contactNumber].avatarUrl) {
                            avatarMap[id] = call(fetchFile, contactProfiles[contactNumber].avatarUrl);
                        }
                        // if (contactProfiles[contactNumber].imgUrl) {
                        //     imageMap[id] = call(fetchFile, contactProfiles[contactNumber].imgUrl);
                        // }
                    });
                    // const imageMapResult: any = yield all(imageMap);
                    const avatarMapResult: any = yield all(avatarMap);

                    Object.keys(avatarMapResult).map((contactId) => {
                        if (contactsMap.hasOwnProperty(contactId)) {
                            const username = getUsername(contactId);
                            // const imageFile: Blob = imageMapResult[contactId].type.includes('xml') || imageMapResult[contactId].type.includes('html') ? null : imageMapResult[contactId];
                            const avatarFile: Blob = avatarMapResult[contactId].type.includes('xml') || avatarMapResult[contactId].type.includes('html') ? null : avatarMapResult[contactId];
                            const member: any = contactsMap[contactId]['members'][contactId];
                            member.avatar = avatarFile;
                            member.image = avatarFile;
                            member.avatarUrl = `${username}/avatar`;
                            member.imageUrl = `${username}/image`;
                            member.avatarHash = contactProfiles[username].imgHash
                        }
                    });
                }
            }

            // const contacts = yield call(IDBContact.getContactsFromDB);
            // yield put(contactsBulkInsert(contacts));



            // yield all([
            //     put(contactsBulkInsert(contactsMap)),
            //     call(IDBContact.contactsBulkInsert, contactsMap)
            // ]);

            yield call(IDBContact.contactsBulkInsert, contactsMap)
            const dbContacts = yield call(IDBContact.getContactsFromDB)
            yield put(contactsBulkInsert(dbContacts))

        }

        if (status === "SUCCESS") {
            writeLog(LOG_TYPES.contacts, {
                info: "CONTACTS SYNC SUCCESS",
                username
            });
            yield put(contactsSyncSuccess());
        }

    } catch (e) {
        console.log(e, "### attemptSetContacts");
        writeLog(LOG_TYPES.contacts, {
            username,
            info: e
        }, LOGS_LEVEL_TYPE.error);
        if (CONNECTION_ERROR_TYPES.includes(e.message) || !navigator.onLine) {
            const effect = put(attemptSetContactsAction(username));
            yield put(syncFailed(effect));
        }

    } finally {
        yield put(TOGGLE_CONTACTS_LOADING(false));
    }
}

function* attemptGetBlockedContacts({payload: {limit}}) {
    try {
        const blockedContactsQuery = yield call(IDBContact.getBlockedContacts, limit);

        if (blockedContactsQuery) {
            yield put(setBlockedContacts(blockedContactsQuery));
        }

    } catch (error) {
        console.log(error);
    }
}

function* attemptToggleProductContact({payload: {id}}) {
    const store: Store<any> = storeCreator.getStore();
    const {contacts, selectedThreadId} = selector(store.getState(), {contacts: true, selectedThreadId: true});
    const effects: Array<any> = [];

    if (contacts.has(id)) {
        const isProductContact: boolean = contacts.getIn([id, "members", id, "isProductContact"]);

        effects.push(call(IDBContact.updateContact, id, {isProductContact: !isProductContact}));
        effects.push(put(toggleProductContactConversation(id)));
        effects.push(put(toggleProductContact(id)));

        if (selectedThreadId === id) {
            effects.push(put(updateSelectedThread({isProductContact: !isProductContact})));
        }

        yield all(effects);
    }
}

// function* fetchContactList({payload}: IContactsActions) {
//     try {
//         const {records, count} = yield call(IDBContact.getContacts, {skip: payload.skip, limit: payload.limit});
//         yield put(STORE_CONTACT_LIST(records, count));
//         yield put(TOGGLE_CONTACTS_LOADING(false));
//
//     } catch (e) {
//         console.error(e);
//     }
// }

// function* fetchFavoriteContactList() {
//     try {
//         const {records} = yield call(IDBContact.getFavoriteContacts);
//         yield put(STORE_FAVORITE_CONTACT_LIST(records));
//
//     } catch (e) {
//         console.error(e);
//     }
// }

function* FETCH_CONTACT_LIST_HANDLER({payload}: IContactsActions) {
    let isContactsEmpty: boolean = false;
    try {

        const q: string = payload.q;
        const skip: number = payload.skip;
        const limit: number = payload.limit;
        const isProductContact: boolean = payload.isProductContact;
        const isScrollToBottom: boolean = payload.isScrollToBottom;

        const {contacts, count} = yield call(DatabaseContacts.selectContacts, {
            skip,
            limit,
            q,
            isProductContact
        });
        const isSearch = q !== '';
        yield put(STORE_CONTACT_LIST(contacts, count, isSearch, isProductContact, isScrollToBottom, q));
        // yield put(STORE_CONTACT_LIST(contacts, count, isSearch, isScrollToBottom));

        isContactsEmpty = isEmpty(contacts);

    } catch (e) {
        console.error(e);
    } finally {
        if (payload.skip === 0 && payload.q !== '' && !isContactsEmpty) {
            yield put(TOGGLE_CONTACTS_LOADING(false));
        }
    }
}

function* FETCH_FAVORITE_CONTACT_LIST_HANDLER({payload}: IContactsActions) {
    try {
        const q: string = payload.q;
        const {contacts} = yield call(DatabaseContacts.selectFavoriteContacts, {q});
        const isSearch = q !== '';

        yield put(STORE_FAVORITE_CONTACT_LIST(contacts, isSearch));
    } catch (e) {
        console.error(e);
    }
}

function* deleteContactHandler({payload: {contactId}}: IContactsActions) {
    try {
        const isThreadExists: boolean = yield call(IDBThreads.isThreadContactExist, {contactId});
        const {contact, isMainContact, childContact}: any = yield call(DatabaseContacts.selectContact, contactId, true);
        if (contact) {
            const mainId: string = contact.contactId;

            const response: any = yield call(deleteContact, [{number: contact.username, hashKey: contact.hashKey}]);

            const {data: {body, status}} = response;
            if (status === "SUCCESS") {
                yield call(DatabaseContacts.deleteContact, mainId);

                yield put(DELETE_CONTACT_SUCCEED(mainId));
                if (!isThreadExists) {
                    // If conversation is empty show splash s`creen (welcome page)
                    yield put(resetSelectedThread());
                } else {
                    const contactToUpdate: any = isMainContact ? contact : childContact;

                    yield all([
                        put(conversationPropertyUpdateSuccess(mainId, [
                            {key: 'saved', value: false},
                            {key: 'favorite', value: false},
                            {key: 'numbers', value: null},
                            {key: 'parentMainId', value: null},
                            {key: 'firstName', value: contactToUpdate.firstName},
                            {key: 'lastName', value: contactToUpdate.lastName},
                            {key: 'name', value: contactToUpdate.name},
                            {key: 'avatarCharacter', value: contactToUpdate.avatarCharacter},
                            {key: 'color', value: fromJS(contactToUpdate.color)},
                            {key: 'avatar', value: contactToUpdate.avatar},
                            {key: 'image', value: contactToUpdate.image},
                        ])),
                        put(updateSelectedThread({
                            saved: false,
                            favorite: false,
                            numbers: null,
                            parentMainId: null,
                            firstName: contactToUpdate.firstName,
                            lastName: contactToUpdate.lastName,
                            name: contactToUpdate.name,
                            avatarCharacter: contactToUpdate.avatarCharacter,
                            color: contactToUpdate.color,
                            avatar: contactToUpdate.avatar,
                            image: contactToUpdate.image,
                        }))
                    ]);
                }
            }
        }

    } catch (e) {
        console.log('#########DELETE_CONTACT_HANDLER ERROR###########');
        console.log(e);
        console.log('#########DELETE_CONTACT_HANDLER ERROR###########');
    }
}

function* UNBLOCK_CONTACT_HANDLER({payload}: IContactsActions) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const contactIds: string[] = Array.isArray(payload.contactIds[0]) ? payload.contactIds[0] : payload.contactIds;
        const connection: any = connectionCreator.getConnection();
        const {selectedThreadId} = selector(store.getState(), {
            selectedThreadId: true
        });

        for (let i: number = 0; i < contactIds.length; i++) {
            const effects: Array<any> = [];
            const requestId: number = Math.floor(Math.random() * 9999 + 1);
            const id: string = `block${Date.now()}${contactIds[i]}`;
            const number: string = contactIds[i].includes("@") ? contactIds[i].substr(0, contactIds[i].indexOf("@")) : contactIds[i];

            const request: any = {
                id,
                xmlBuilder: "toggleContactBlockXML",
                params: {
                    id,
                    contactToBlock: number,
                    command: REMOVE_FROM_BLOCKED_COMMAND,
                    requestId: requestId.toString()
                },
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            const msg: Strophe.Builder = toggleContactBlockXML(request.params);
            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(call(IDBContact.updateContact, contactIds[i], {blocked: false})):effects.push(call(IDBContact.updateContact, `${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, {blocked: false}))
            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(put(updateConversationsBlocked(contactIds[i], false))):effects.push(put(updateConversationsBlocked(`${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, false)));
            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(put(toggleBlocked(contactIds[i], false))):effects.push(put(toggleBlocked(`${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, false)))
            effects.push(put(addRequest(request)));

            // let presenceMsg: Strophe.Builder = null;
            if (selectedThreadId === contactIds[i] || selectedThreadId === `${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`) {
                effects.push(put(updateSelectedThread({blocked: false})));
                // presenceMsg = lastActivityRequestXML({id: selectedThreadId});
            }

            yield all(effects);

            if (connection.connected) {
                connection.send(msg);
                // if (presenceMsg) {
                //     connection.send(presenceMsg);
                // }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function* BLOCK_CONTACT_HANDLER({payload}: IContactsActions) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const contactIds: string[] = payload.contactIds;
        const connection: any = connectionCreator.getConnection();
        const {selectedThreadId, lastCall} = selector(store.getState(), {
            selectedThreadId: true,
            calls: {
                lastCall: true,
            },
        });

        for (let i: number = 0; i < contactIds.length; i++) {
            const effects: Array<any> = [];
            const requestId: number = Math.floor(Math.random() * 9999 + 1);
            const id: string = `block${Date.now()}${contactIds[i]}`;
            const number: string = contactIds[i].includes("@") ? contactIds[i].substr(0, contactIds[i].indexOf("@")) : contactIds[i];

            const request: any = {
                id,
                xmlBuilder: "toggleContactBlockXML",
                params: {
                    id,
                    contactToBlock: number,
                    command: ADD_TO_BLOCKED_COMMAND,
                    requestId: requestId.toString()
                },
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            const msg: Strophe.Builder = toggleContactBlockXML(request.params);

            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(call(IDBContact.updateContact, contactIds[i], {blocked: true})):effects.push(call(IDBContact.updateContact, `${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, {blocked: true}))
            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(put(updateConversationsBlocked(contactIds[i], true))):effects.push(put(updateConversationsBlocked(`${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, true)));
            contactIds[i].includes(`@${SINGLE_CONVERSATION_EXTENSION}`) ? effects.push(put(toggleBlocked(contactIds[i], true))):effects.push(put(toggleBlocked(`${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`, true)))
            effects.push(put(addRequest(request)));

            if (selectedThreadId === contactIds[i] || selectedThreadId === `${contactIds[i]}@${SINGLE_CONVERSATION_EXTENSION}`) {
                effects.push(put(updateSelectedThread({blocked: true})));
            }

            if (lastCall) {
                const caller: any = lastCall.get('ownCall') ? lastCall.get('receiver') : lastCall.get('caller');

                if (caller.substr(0, caller.indexOf("@")) === number) {
                    effects.push(put(sendHangUp(lastCall.get("id"), lastCall.get("to"), false)));
                }
            }

            yield all(effects);

            if (connection.connected) {
                connection.send(msg);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function* updateContactHandler({payload: {threadId, isDeleted}}: IContactsActions) {
    try {

        const number = threadId.split("@").shift();

        const profiles = yield call(getUsersProfile, [number], false);

        const profile = profiles[0];

        const firstName: string = profile && profile.profileInfo && profile.profileInfo.firstName || "";
        const lastName: string = profile && profile.profileInfo && profile.profileInfo.lastName || "";
        const imageHash: string = profile && profile.profileInfo && profile.profileInfo.imageHash || "";
        const email: string = profile && profile.email || "";
        const username: string = profile && profile.username || "";
        let avatar: Blob = null;
        let currentImageHash: string = "";

        const currentAvatar = yield call(ContactsModel.getAvatar, threadId);

        if (currentAvatar) {
            currentImageHash = currentAvatar.fileName;
            avatar = currentAvatar.small
        }

        if (imageHash && currentImageHash !== imageHash) {
            avatar = yield call(attemptRetrieveFile, {
                bucket: conf.app.aws.bucket.profile,
                key: `${number}/avatar`
            });
        }

        yield call(ContactsModel.updateContact, {
            threadId,
            firstName,
            lastName,
            avatar,
            image: avatar,
            imageHash,
            isDeleted,
            email,
            username,
        });

        // update everywhere
        yield put(contactUpdateSucceed(threadId, firstName, lastName, avatar, avatar));
        // yield put(updateSelectedThread({firstName, lastName, avatar, image: avatar})); // Todo Sevak complete

        // update contact in db

        // update store

    } catch (e) {
        logger(e);
        yield put(contactUpdateError());
    }
}

function* contactsSaga(): any {
    yield takeEvery(actions.ATTEMPT_SET_BLOCKED_CONTACT_NUMBERS, attemptSetBlockedContactNumbers);
    yield takeEvery(actions.ATTEMPT_TOGGLE_PRODUCT_CONTACT, attemptToggleProductContact);
    yield takeEvery(actions.ATTEMPT_GET_BLOCKED_CONTACTS, attemptGetBlockedContacts);
    yield takeEvery(actions.ATTEMPT_TOGGLE_FAVORITE, attemptToggleFavorite);
    yield takeLatest(actions.ATTEMPT_FAVORITES_UPDATE, attemptFavoritesUpdate);
    yield takeEvery(actions.ATTEMPT_CREATE_CONTACT, attemptCreateContact);
    yield takeEvery(actions.ATTEMPT_UPDATE_CONTACT, attemptUpdateContact);
    yield takeEvery(actions.ATTEMPT_SAVE_CONTACT, attemptSaveContact);
    yield takeEvery(actions.ATTEMPT_TOGGLE_BLOCK, attemptToggleBlock);
    yield takeEvery(actions.DELETE_CONVERSATION, deleteConversation);
    yield takeEvery(actions.ATTEMPT_SET_CONTACTS, attemptSetContacts);

    yield takeEvery(actions.FETCH_FAVORITE_CONTACT_LIST, FETCH_FAVORITE_CONTACT_LIST_HANDLER);
    yield takeLatest(actions.FETCH_CONTACT_LIST, FETCH_CONTACT_LIST_HANDLER);
    yield takeLatest(actions.DELETE_CONTACT, deleteContactHandler);
    yield takeLatest(actions.UNBLOCK_CONTACT, UNBLOCK_CONTACT_HANDLER);
    yield takeLatest(actions.BLOCK_CONTACT, BLOCK_CONTACT_HANDLER);
    yield takeLatest(actions.CONTACT_UPDATE, updateContactHandler);

}

export default contactsSaga;
