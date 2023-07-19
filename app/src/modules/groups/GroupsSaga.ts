"use strict";

import {
    changeGroupNameXML,
    changeRole,
    changeRoleAll,
    createGroupXML,
    deleteRoom,
    getGroupInfoXML,
    inviteGroupMembersXML,
    joinToGroupXML,
    leaveOrRemoveSomeoneFromGroupXML,
    leaveOwner,
    memberAddMember,
    memberEditAvatar,
    memberEditName
} from "xmpp/XMLBuilders";
import {
    addMemberSelectedThread,
    attemptSetSelectedThread,
    changeLeftPanel,
    changeRightPanel,
    disableGroupSelectedThread,
    groupsSyncSuccess,
    sendXMLReceived,
    setSelectedThread,
    syncFailed,
    updateSelectedThread
} from "modules/application/ApplicationActions";
import {
    conversationBulkReplace,
    disableGroupConversationThread,
    updateSelectedConversationThread
} from "modules/conversations/ConversationsActions";
import {
    addConversation, addConversationMember,
    attemptCreateConversation,
    attemptRemoveConversation,
    attemptRemoveConversations as attemptRemoveConversationsAction,
    conversationBulkInsert, removeConversations, updateConversationProps
} from "modules/conversations/ConversationsActions";
import {addMessage, deleteThreadsMessages, removeMessages, sendMessage} from "modules/messages/MessagesActions";
import {contactsBulkInsert} from "modules/contacts/ContactsActions";
import {
    attemptCreateGroups as attemptCreateGroupsAction,
    groupCreated,
    setGroupSettingsPanel
} from "modules/groups/GroupsActions";
import IDBConversation from "services/database/class/Conversation";
import {
    CHANGE_ROLE_ALL_COMMAND,
    CHANGE_ROLE_COMMAND,
    CREATE_GROUP_XML_COMMAND,
    DELETE_ROOM_COMMAND,
    GROUP_CONVERSATION_EXTENSION,
    MEMBER_ADD_MEMBER_COMMAND,
    MEMBER_EDIT_AVATAR_COMMAND,
    MEMBER_EDIT_NAME_COMMAND,
    OWNER_LEAVE_COMMAND,
    RECEIPTS_REQUEST_XMLNS,
    SINGLE_CONVERSATION_EXTENSION,
    XML_MESSAGE_TYPES
} from "xmpp/XMLConstants";
import {addRequest, removeRequest} from "modules/requests/RequestsActions";
import {updateAvatar, updateName} from "./GroupsActions";
import connectionCreator from "xmpp/connectionCreator";
import {
    getConversationType,
    getGroupRole,
    getPartialId,
    getRoomId,
    getUserId,
    getUsernameIfEmail,
    getUserNumberWithEmail,
    isCorrectFileRemotePath,
    isDeleted,
    setFailed,
    writeLog,
    getInitials, getEmailFromUsername
} from "helpers/DataHelper";
import {all, call, fork, put, select, take, takeEvery} from "redux-saga/effects";
import {
    APPLICATION,
    CONNECTION_ERROR_TYPES,
    CONVERSATION_TYPE,
    DEFAULT_TIME_FORMAT, DISPLAY_CONTATCS_COUNT,
    GROUP_ROLES,
    GROUP_SETTINGS_PANEL_TYPE,
    LEFT_PANELS,
    LOG_TYPES,
    LOGS_LEVEL_TYPE,
    MESSAGE_TYPES,
    RIGHT_PANELS
} from "configs/constants";
import storeCreator from "helpers/StoreHelper";
import {actions} from "./GroupsReducer";
import selector from "services/selector";
import format from "date-fns/format";
import {Store} from "react-redux";
import {chunk, forEach, orderBy} from 'lodash';
import conf from 'configs/configurations';
import {includesEmoji, sanitizeEmoji} from "helpers/EmojiHelper";
import {profileListData} from "helpers/ContactsHelper";
import getPublicRooms from "requests/getPublicRooms";
import {getColor, logger} from "helpers/AppHelper";
import getConnectionUsername from "xmpp/getConnectionUsername";
import publicChatGetNewer from "requests/publicChatGetNewer";
import IDBMessage from "services/database/class/Message";
import {getChannelsThumbnails, isURI} from "helpers/DomHelper";
import {List} from "immutable";
import {delay} from "redux-saga/effects";
import {IGroupCreateParams} from "services/interfaces";
import {userNameSelector} from "modules/user/UserSelector";
import {attemptUploadFile} from "helpers/FileHelper";
import {appStateSelector} from "modules/application/ApplicationSelector";
import {getCredentials} from "services/request";
import IDBContact, {DatabaseContacts} from "services/database/class/Contact";
import Log from "modules/messages/Log";
import {actions as APPLICATION_ACTIONS} from "modules/application/ApplicationReducer";
import {fetchFile} from "requests/fsRequest";
import {changingConferenceDetails, initialized} from "modules/conference/ConferenceActions";

function* attemptLeaveOrDeleteMember({payload: {partialId, memberUsername, command, waitForServerResponse}}: any): any {
    const groupId = `${partialId}@${GROUP_CONVERSATION_EXTENSION}/${memberUsername}`;
    const connection: any = connectionCreator.getConnection();
    const id: string = `msgId${Date.now()}`;
    const msg: Strophe.Builder = leaveOrRemoveSomeoneFromGroupXML({
        id,
        groupPartialId: partialId,
        username: memberUsername,
        command
    });

    const request: any = {
        id,
        xmlBuilder: "leaveOrRemoveSomeoneFromGroupXML",
        params: {id, groupPartialId: partialId, username: memberUsername, command},
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    if (waitForServerResponse) {
        yield put(attemptRemoveConversation(groupId));
        request["waitForServerResponse"] = true;
    }

    yield put(addRequest(request));

    if (connection.connected) {
        connection.send(msg);
    }
}

function* invitedToGroup({payload: {id, username, getInfo}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `join${Date.now()}`;
    const msg: Strophe.Builder = joinToGroupXML({id: msgId, groupId: id, username});

    if (connection.connected) {
        connection.send(msg);
    }

    if (getInfo) {
        yield put(attemptCreateGroupsAction([id]));
    }
}


interface ICreateGroupPayload {
    group: any,
    username: string,
    setThread: boolean,
    details: IGroupCreateParams,
    contacts?: any
    conferenceCall?: boolean
}


function* attemptCreateGroup({payload: {group, username, setThread, details = null, contacts, conferenceCall}}: { payload: ICreateGroupPayload }): any {
    try {


        if (details) {
            // collect data
            const username: string = yield select(userNameSelector());
            const groupId: string = `gid${Date.now().toString()}-${username}`;
            const groupNamespace: string = `${groupId}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
            const appState: Map<string, any> = yield select(appStateSelector);
            const store: Store<any> = storeCreator.getStore();

            if (conferenceCall) {
                const pendingRequest: any = {
                    id: groupNamespace,
                    action: "startingConference",
                    params: {selectedThreadId: groupNamespace},
                    createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
                };

                store.dispatch(addRequest(pendingRequest));
            }



            const sidebars: Map<string, any> = appState.get('sidebars');

            const members: string[] = [username, ...details.contacts];
            const membersAsString: string = [username, ...details.contacts].join(";");


            const groupData = {
                avatarCharacter: getInitials(details.group.name),
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                members: members,
                role: GROUP_ROLES.owner,
                memberAddMember: true,
                memberEditAvatar: true,
                memberEditName: true,
                ownerList: [username],
                adminList: APPLICATION.CREATEGROUPWITHALLADMIN ? details.contacts : [],
                lastMessageId: null,
                newMessagesIds: [],
                disabled: false,
                allAdmins: APPLICATION.CREATEGROUPWITHALLADMIN ? true : false,
                memberList: [],
                isGroup: true,
                muted: false,
                id: groupNamespace,
                groupMembersUsernames: members,
                author: username,
                color: getColor(),
                avatar: details.group.avatar.cropped,
                image: details.group.avatar.original,
                name: details.group.name,
                partialId: groupId,
            };

            const conversation = {
                conversationId: groupNamespace,
                threadId: groupNamespace,
                lastMessageId: "",
                newMessagesIds: [],
                typing: [],
                time: Date.now()
            };
            // collect data end


            // upload avatar to amazon
            if (details.group.avatar.cropped) {
                yield fork(attemptUploadFile, {
                    bucket: conf.app.aws.bucket.group,
                    key: `${groupId}/profile/avatar`,
                    data: details.group.avatar.cropped,
                });
            }

            // if (details.group.avatar.original) {
            //     yield fork(attemptUploadFile, {
            //         bucket: conf.app.aws.bucket.group,
            //         key: `${groupId}/profile/image`,
            //         data: details.group.avatar.original,
            //     });
            // }
            // upload end


            // create group in local
            yield call(IDBConversation.createConversation, conversation, groupData);

            if (contacts) {
                yield call(DatabaseContacts.insertMissingContacts, contacts);
                const contactsMap = {};
                const contactValues: any = Object.values(contacts);
                contactValues.map(item => {
                    contactsMap[item.contactId] = {
                        threads: {
                            threadId: item.contactId,
                            threadType: getConversationType(item.contactId)
                        },
                        conversations: {
                            conversationId: item.contactId,
                            lastMessageId: "",
                            newMessagesIds: [],
                            time: 0,
                            typing: []
                        },
                        messages: {},
                        members: {}
                    };
                    contactsMap[item.contactId].members[item.contactId] = item;
                });
                yield put(contactsBulkInsert(contactsMap));
            }

            const thread = yield call(IDBConversation.getThread, groupNamespace);

            if (thread.threads.threadInfo.avatar) {
                const avatarBlobUrl = thread.threads.threadInfo.avatar && (window as any).URL.createObjectURL(thread.threads.threadInfo.avatar)
                thread.threads.threadInfo.avatarBlobUrl = avatarBlobUrl
            }

            yield put(addConversation(thread));
            // create end


            // focus thread on this group
            yield put(attemptSetSelectedThread(thread, null, null,null, true));

            if (sidebars.get("left") !== LEFT_PANELS.threads) {
                yield put(changeLeftPanel(LEFT_PANELS.threads));
            }
            if (sidebars.get("right") !== RIGHT_PANELS.group_info) {
                yield put(changeRightPanel(RIGHT_PANELS.group_info));
            }

            // focus end


            // send group creating via sockets
            const connection: any = connectionCreator.getConnection();
            const id: string = `create${groupId}`;
            const msg: Strophe.Builder = createGroupXML({
                id,
                groupId: groupId,
                groupName: details.group.name,
                admins: APPLICATION.CREATEGROUPWITHALLADMIN ? membersAsString: "",
                members: APPLICATION.CREATEGROUPWITHALLADMIN ? "" : membersAsString,
            });

            const request: any = {
                params: {id, groupId, admins: "", members: membersAsString, groupName: details.group.name},
                xmlBuilder: "createGroupXML",
                id,
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            yield put(addRequest(request));

            if (connection.connected) {
                connection.send(msg);
            }
            // send end


        } else {
            const store: Store<any> = storeCreator.getStore();
            const {app} = selector(store.getState(), {app: true});
            const members: Array<string> = group.groupMembersUsernames.filter(memberUsername => memberUsername !== username);
            const membersString: string = members.join(";").replace(conf.app.prefix, "");

            const groupData = {
                avatarCharacter: group.name && getInitials(group.name),
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                members: group.groupMembersUsernames,
                role: GROUP_ROLES.owner,
                memberAddMember: true,
                memberEditAvatar: false,
                memberEditName: false,
                ownerList: [username],
                adminList: APPLICATION.CREATEGROUPWITHALLADMIN ? members : "",
                lastMessageId: null,
                newMessagesIds: [],
                disabled: false,
                allAdmins: APPLICATION.CREATEGROUPWITHALLADMIN ? true : false,
                memberList: [],
                isGroup: true,
                muted: false,
                ...group,
            };

            const conversation = {
                conversationId: group.id,
                threadId: group.id,
                lastMessageId: "",
                newMessagesIds: [],
                typing: [],
                time: Date.now()
            };

            yield call(IDBConversation.createConversation, conversation, groupData);
            const thread = yield call(IDBConversation.getThread, group.id);

            yield put(addConversation(thread));

            if (setThread) {
                yield put(setSelectedThread(thread));

                if (app.leftPanel !== LEFT_PANELS.threads) {
                    yield put(changeLeftPanel(LEFT_PANELS.threads));
                }
                if (app.rightPanel !== RIGHT_PANELS.group_info) {
                    yield put(changeRightPanel(RIGHT_PANELS.group_info));
                }

                const currentThreadElement = document.querySelector(`li[data-threadid="${group.id}"]`);
                const activeThreadElement = document.querySelector("li.thread_block.active");

                if (currentThreadElement && activeThreadElement && currentThreadElement !== activeThreadElement) {
                    !currentThreadElement.classList.contains("active") && currentThreadElement.classList.add("active");
                    activeThreadElement && activeThreadElement.classList.remove("active");
                }
            }

            const connection: any = connectionCreator.getConnection();
            const id: string = `create${group.partialId}`;
            const msg: Strophe.Builder = createGroupXML({
                id,
                groupId: group.partialId,
                groupName: group.name,
                admins: APPLICATION.CREATEGROUPWITHALLADMIN ? membersString : "",
                members: APPLICATION.CREATEGROUPWITHALLADMIN ? "" : membersString
            });

            const request: any = {
                params: {
                    id,
                    groupId: group.partialId,
                    admins: APPLICATION.CREATEGROUPWITHALLADMIN ? membersString : "",
                    members: APPLICATION.CREATEGROUPWITHALLADMIN ? "" : membersString,
                    groupName: group.name},
                xmlBuilder: "createGroupXML",
                id,
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
            };

            // yield put(addRequest(request));

            if (connection.connected) {
                connection.send(msg);
            }
        }
    } catch (e) {
        logger("group create error");
        logger(e);
    }
}

function* attemptCreateGroups({payload: {groupIds, isOfflineSync, isSync}}) {
    window.addEventListener("beforeunload", () => {
        const key = `synced_${APPLICATION.VERSION}`;
        const synced: any = localStorage.getItem(key);

        if (!(synced && JSON.parse(synced).groups) || !synced) {
            setFailed(put(attemptCreateGroupsAction(groupIds, isOfflineSync, isSync)));
        }
    });
    const store: Store<any> = storeCreator.getStore();
    const {user, conversations, selectedThreadId, contacts, pendingRequests} = selector(store.getState(), {
        user: true,
        conversations: true,
        selectedThreadId: true,
        contacts: true,
        pendingRequests: true
    });

    try {
        const localDeletedMsgIds: Array<string> = [];
        const conversationIds: Array<string> = [];
        const deletedGroupsIds: Array<string> = [];
        const chunks = chunk(groupIds, 20);
        const username = user.get("username");
        const callEffects: Array<any> = [];
        const effects: Array<any> = [];
        const groupMembersArr = [];
        const groupMembersMap = {};
        const groupsMap: any = {};
        const imageMap: any = {};
        const contactsMap = {};
        const messages = {};
        let body: any = {};

        chunks.map(chunk => effects.push(call(getPublicRooms, chunk, 0)));

        const groupResponses: Array<any> = yield all(effects);

        groupResponses.map(groupResponse => {
            if (groupResponse.data && groupResponse.data.status === "SUCCESS") {
                body = {...body, ...groupResponse.data.body};
            }
        });

        const groupConversations = yield call(IDBConversation.getAllConversations, CONVERSATION_TYPE.GROUP);

        for (const groupPartialId in body) {
            if (body.hasOwnProperty(groupPartialId)) {
                const {avatarUrl, lastMessage, groupInfo} = body[groupPartialId];
                let newMessagesIds: Array<string> = [];
                let newMessagesCount: number = 0;



                if (!groupInfo || !groupInfo.subject) {
                    continue;
                }

                if (isOfflineSync) {
                    conversationIds.push(groupPartialId);
                }

                const groupId: string = `${groupPartialId}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`;

                //imageMap[groupId] = call(fetchFile, avatarUrl);

                let groupExists: any = conversations && conversations.get(groupId);

                newMessagesIds = groupExists ?
                    groupExists.getIn(["conversations", "newMessagesIds"]) ?
                        groupExists.getIn(["conversations", "newMessagesIds"]).toArray() : [] : [];

                newMessagesCount = newMessagesIds.length;

                let {
                    adminList,
                    memberList,
                    ownerList,
                    allAdmins,
                    memberAddMember,
                    memberEditAvatar,
                    memberEditName
                } = groupInfo;

                const lists: any = {
                    memberList,
                    adminList,
                    ownerList
                };

                const role: number = getGroupRole(getUserNumberWithEmail(username, user.get("email")), lists, allAdmins);

                let groupMembersUsernames: any = [...adminList, ...memberList, ...ownerList];

                let groupName = groupInfo.subject;
                let fileRemotePath: string = "";

                const dbConversation = groupConversations.find(groupConversation => groupConversation.conversations.threadId === groupId);

                if (!groupExists) {
                    const res = dbConversation;
                    groupExists = !!res;
                    newMessagesIds = groupExists ? res && res.conversations.newMessagesIds : [];
                    newMessagesCount = newMessagesIds.length;
                }

                if ((groupExists && !isOfflineSync) || !groupName && groupMembersUsernames.length === 0) {
                    continue;
                }

                groupName = groupName ? groupName : groupMembersUsernames.join(", ");

                groupMembersArr.push(...groupMembersUsernames);

                adminList = adminList.map(admin => getUsernameIfEmail(admin));
                memberList = memberList.map(member => getUsernameIfEmail(member));
                ownerList = ownerList.map(owner => getUsernameIfEmail(owner));
                groupMembersUsernames = [...adminList, ...memberList, ...ownerList];


                // const group_Id: string = `gid${Date.now().toString()}-${username}`;
                // const groupNamespace: string = `${groupId}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                // const thread = yield call(IDBConversation.getThread, groupNamespace);
                //
                // console.log(thread, "thread_groupNamespace")
                // console.log(groupId, "groupId_groupNamespace")
                // console.log(groupNamespace, "groupNamespace_groupNamespace")
                //
                // groupsMap[groupId] = thread




                groupsMap[groupId] = {
                    conversations: {
                        newMessagesCount: newMessagesCount,
                        newMessagesIds: newMessagesIds,
                        conversationId: groupId,
                        threadId: groupId,
                        lastMessageId: "",
                        typing: [],
                        time: 0
                    },
                    threads: {
                        threadId: groupId,
                        threadType: getConversationType(groupId),
                        threadInfo: {
                            color: dbConversation && dbConversation.threads.threadInfo.color ? dbConversation.threads.threadInfo.color : getColor(),
                            avatar: dbConversation && dbConversation.threads.threadInfo.avatar ? dbConversation.threads.threadInfo.avatar : null,
                            disabled: !groupMembersUsernames.includes(user.get("username")),
                            createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                            avatarCharacter: getInitials(groupName),
                            members: groupMembersUsernames,
                            author: user.get("username"),
                            partialId: groupPartialId,
                            groupMembersUsernames,
                            avatarUrl: avatarUrl,
                            lastMessageId: null,
                            newMessagesIds: [],
                            groupMembers: [],
                            memberEditAvatar,
                            memberAddMember,
                            memberEditName,
                            name: groupName,
                            isGroup: true,
                            muted: false,
                            imageUrl: "",
                            id: groupId,
                            image: null,
                            adminList,
                            ownerList,
                            memberList,
                            allAdmins,
                            role
                        },
                        threadName: groupName
                    },
                    messages: {},
                    members: {}
                };

                if (!lastMessage) {
                    continue;
                }

                if (lastMessage.msgType.includes("THUMB") ||
                    lastMessage.msgType === "UPDATE_ROOM" ||
                    lastMessage.msgType === "PIN_MESSAGE" ||
                    lastMessage.msgType === "PIN") {
                    continue;
                }

                if (isDeleted(lastMessage.msgType)) {
                    messages[lastMessage.rel].deleted = true;
                    continue;
                }

                if (lastMessage.msgType === MESSAGE_TYPES.edit_mgs) {
                    messages[lastMessage.rel].text = lastMessage.msg;
                    messages[lastMessage.rel].edited = true;
                    continue;
                }

                if ([MESSAGE_TYPES.join_group, MESSAGE_TYPES.leave_group, MESSAGE_TYPES.remove_from_group].includes(lastMessage.msgType) && conf.app.prefix) {
                    lastMessage.msgInfo = lastMessage.msgInfo.split(conf.app.prefix).pop();
                }

                if (lastMessage.msgType === MESSAGE_TYPES.update_group_avatar) {
                    // const avatarUrl: string = yield call(getSignedUrl, `${conf.app.aws.bucket.group}`, "get", `${lastMessage.to}/profile/avatar`);
                    // const imageUrl: string = avatarUrl;
                    // yield put(updateAvatar(`${lastMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`, avatarUrl, imageUrl));
                } else if (lastMessage.msgType === MESSAGE_TYPES.update_group_name) {
                    let groupName = lastMessage.msgInfo;
                    if (includesEmoji(groupName)) {
                        groupName = sanitizeEmoji(groupName);
                    }
                    if (!groupName) {
                        groupName = "Unknown Group";
                    }
                    yield put(updateName(`${lastMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`, groupName));
                }

                if (lastMessage.fileRemotePath && isCorrectFileRemotePath(lastMessage.fileRemotePath)) {
                    fileRemotePath = lastMessage.fileRemotePath.includes("gid") ? lastMessage.fileRemotePath : `${lastMessage.to}/${lastMessage.fileRemotePath}`;

                } else if ([MESSAGE_TYPES.file, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.voice].includes(lastMessage.msgType)) {
                    fileRemotePath = `${lastMessage.to}/${lastMessage.from}/${lastMessage.msgId}`;
                }

                const message: any = {
                    creator: lastMessage.from.includes(SINGLE_CONVERSATION_EXTENSION) ? lastMessage.from : `${lastMessage.from}@${SINGLE_CONVERSATION_EXTENSION}`,
                    info: lastMessage.msgInfo,
                    fileRemotePath,
                    threadId: `${lastMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`,
                    createdAt: format(lastMessage.time, DEFAULT_TIME_FORMAT),
                    own: lastMessage.from === user.get("username"),
                    deleted: !!lastMessage.deleted,
                    edited: !!lastMessage.edited,
                    fileSize: lastMessage.fileSize,
                    conversationId: `${lastMessage.to}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`,
                    repid: lastMessage.repId || "",
                    type: lastMessage.msgType,
                    text: lastMessage.msg,
                    id: lastMessage.msgId,
                    time: lastMessage.time,
                    messageId: lastMessage.msgId,
                    isDelivered: true,
                    delivered: true,
                    isSeen: true,
                    seen: true
                };

                groupsMap[message.threadId].conversations.lastMessageId = message.id;
                groupsMap[message.threadId].conversations.time = message.time;
                groupsMap[message.threadId].messages = message;
                messages[message.id] = message;

            }
        }


        conversationIds.map(conversationId => {
            const groupId: string = `${conversationId}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
            let msgId: string = "";

            if (groupsMap[groupId] && groupsMap[groupId].messages) {
                msgId = groupsMap[groupId].messages.messageId;
            }

            callEffects.push(call(publicChatGetNewer, conversationId, isOfflineSync, msgId));
        });

        if (callEffects.length > 0) {
            const responses = yield all(callEffects);
            responses.map(response => {
                const {data: {body, status}} = response;

                if (status === "SUCCESS") {
                    if (body.length > 0) {
                        const threadId: string = `${body[0].to}@${GROUP_CONVERSATION_EXTENSION}/${username}`;
                        const isGroupDeleted: boolean = body.every(message => message.localDeleted);

                        if (isGroupDeleted) {
                            deletedGroupsIds.push(threadId);

                        } else {
                            body.map(message => {
                                const {localDeleted, msgId} = message;
                                localDeleted ? localDeletedMsgIds.push(msgId) : null;
                            });
                        }

                    }
                }

            });
        }

        if (localDeletedMsgIds.length > 0) {
            yield all([
                call(IDBMessage.localDeleteMessages, localDeletedMsgIds),
                put(removeMessages(localDeletedMsgIds))
            ])
        }

        if (deletedGroupsIds.length > 0) {
            yield put(attemptRemoveConversationsAction(deletedGroupsIds));
        }

        // const imageMapResult: any = yield all(imageMap);
        // Object.keys(imageMapResult).map((groupId) => {
        //     if (groupsMap.hasOwnProperty(groupsMap)) {
        //         const imageFile: Blob = imageMapResult[groupId].type.includes('xml') || imageMapResult[groupId].type.includes('html') ? null : imageMapResult[groupId];
        //         const threadInfo: any = groupsMap[groupId]['threads']['threadInfo'];
        //         threadInfo.avatar = imageFile;
        //         threadInfo.image = imageFile;
        //         threadInfo.avatarUrl = `${groupId.split("@")[0]}/avatar`;
        //         threadInfo.imageUrl = `${groupId.split("@")[0]}/image`;
        //
        //     }
        // });


        //changed getProfileList functionality


        Object.keys(groupsMap).map(threadId =>
            deletedGroupsIds.includes(threadId) ?
                delete groupsMap[threadId] :
                null);



        if (Object.keys(groupsMap).length === 1) {

            const {synced} = selector(store.getState(), {synced: true});
            let {savedContacts} = selector(store.getState(), {savedContacts: true});
            const numbersWithEmail: any = {};
            const contacts = {}

            if (!synced.get("contacts")) {
                yield take(APPLICATION_ACTIONS.CONTACTS_SYNC_SUCCESS);

                const store: any = storeCreator.getStore();
                savedContacts = selector(store.getState(), {savedContacts: true}).savedContacts;
            }

            const blockedContactNumbers: any = yield call(IDBContact.getBlockedContacts, DISPLAY_CONTATCS_COUNT);

            groupMembersArr.forEach(profileId => {
                const hasEmail: boolean = profileId.includes("|");
                const _number: string = hasEmail ? profileId.split("|")[0] : profileId;
                const email: string = hasEmail ? getEmailFromUsername(profileId) : "";
                email ? numbersWithEmail[_number] = email : null;
                const blocked: boolean = Object.keys(blockedContactNumbers).join().includes(profileId);
                const contactId: string = `${_number}@${SINGLE_CONVERSATION_EXTENSION}`;

                if (!savedContacts.has(contactId)) {
                    const contact: any = {
                        blocked,
                        username: _number,
                        firstName: "",
                        lastName: "",
                        isProductContact: true,
                        saved: false,
                        createdAt: Date.now(),
                        phone: _number,
                        color: getColor(),
                        status: "offline",
                        favorite: false,
                        author: _number,
                        contactId,
                        avatarUrl: "",
                        imageUrl: "",
                        muted: false,
                        name: '',
                        avatarCharacter: '',
                        avatar: "",
                        image: "",
                        email: numbersWithEmail[_number] || ""
                    };

                    contacts[_number] = contact;
                } else {
                    contacts[_number] = {
                        ...savedContacts.getIn([contactId, 'members']).first().toJS(),
                        blocked,
                        email: numbersWithEmail[_number] || ""
                    };
                }

            })

            yield put(conversationBulkInsert(groupsMap));
            yield call(IDBConversation.createGroupConversations, groupsMap, contacts, messages);
            yield put(groupCreated(Object.keys(groupsMap)[0], Object.values(groupsMap)[0]));

            Log.i("conference -> groupsMap = ", Object.values(groupsMap)[0])
            Log.i("conference -> pendingRequests = ", pendingRequests)

            const group: any = Object.values(groupsMap)[0]

            const id: string = group?.threads?.threadId;
            const groupId: string = getPartialId(id);

            if (pendingRequests.size > 0 && pendingRequests.get(groupId)) {
                const callId = pendingRequests.getIn([groupId, "params", "callId"])
                const threadId = pendingRequests.getIn([groupId, "params", "threadId"])
                const messageInfo = pendingRequests.getIn([groupId, "params", "messageInfo"]).toJS()
                const from = pendingRequests.getIn([groupId, "params", "from"])
                const initiator = pendingRequests.getIn([groupId, "params", "initiator"])
                store.dispatch(initialized());
                store.dispatch(changingConferenceDetails(callId, threadId, messageInfo, from, initiator))
                store.dispatch(removeRequest(groupId));
            }

            if (isOfflineSync && groupsMap[selectedThreadId]) {
                yield put(attemptSetSelectedThread(groupsMap[selectedThreadId]));
            }

            groupMembersArr.map(memberNumber => memberNumber ? groupMembersMap[memberNumber] = memberNumber : null);

            const _contacts: any = yield call(profileListData, Object.keys(groupMembersMap));

            Object.keys(_contacts).map(username => {
                const id: string = `${username}@${SINGLE_CONVERSATION_EXTENSION}`;
                contactsMap[id] = {
                    threads: {
                        threadId: id,
                        threadType: getConversationType(id)
                    },
                    conversations: {
                        conversationId: id,
                        lastMessageId: "",
                        newMessagesIds: [],
                        typing: [],
                        time: 0
                    },
                    messages: {},
                    members: {}
                };
                contactsMap[id].members[id] = _contacts[username];
            });
            const conversations = yield call(IDBConversation.getLocalConversations, 1, false);
            // const membrions = yield call(IDBConversation.getConversationsMembers, groupsMap.threads.threadId);

            if (conversations) {
                yield put(conversationBulkReplace(conversations));
            }
            yield put(contactsBulkInsert(contactsMap));
            yield call(IDBConversation.changeGroupContactsInfo, groupsMap, _contacts, messages);
        }

        writeLog(LOG_TYPES.groups, {
            reason: "GROUPS SYNC SUCCESS",
            user: username
        });

        yield put(groupsSyncSuccess());
        yield call(getChannelsThumbnails, false);



        // return
        //
        // if (Object.keys(groupsMap).length > 0) {
        //     Object.keys(groupsMap).map(threadId =>
        //         deletedGroupsIds.includes(threadId) ?
        //             delete groupsMap[threadId] :
        //             null);
        //
        //     groupMembersArr.map(memberNumber => memberNumber ? groupMembersMap[memberNumber] = memberNumber : null);
        //
        //     const _contacts: any = yield call(profileListData, Object.keys(groupMembersMap));
        //
        //     Log.i("_contacts -> ", _contacts)
        //     // const _contacts: any = {};
        //
        //
        //
        //     const userCredentials = getCredentials();
        //     const username: string = userCredentials["X-Access-Number"];
        //
        //     if (username !== username) {
        //         writeLog(LOG_TYPES.groups, {
        //             reason: "USER CREDENTIALS ERROR",
        //             storeUser: username,
        //             localStorageUser: username
        //         }, LOGS_LEVEL_TYPE.error);
        //         throw new Error("User Credentials Error");
        //     }
        //
        //     for (const key in _contacts) {
        //         const label = contacts.size && contacts.getIn([_contacts[key].contactId, "label"]);
        //         _contacts[key].label = label ? label : "mobile";
        //     }
        //
        //
        //
        //     Object.keys(_contacts).map(username => {
        //         const id: string = `${username}@${SINGLE_CONVERSATION_EXTENSION}`;
        //         contactsMap[id] = {
        //             threads: {
        //                 threadId: id,
        //                 threadType: getConversationType(id)
        //             },
        //             conversations: {
        //                 conversationId: id,
        //                 lastMessageId: "",
        //                 newMessagesIds: [],
        //                 typing: [],
        //                 time: 0
        //             },
        //             messages: {},
        //             members: {}
        //         };
        //         contactsMap[id].members[id] = _contacts[username];
        //     });
        //     yield put(conversationBulkInsert(groupsMap));
        //
        //     Log.i("groupsMap ->", groupsMap)
        //     // yield call(IDBConversation.createGroupConversations, groupsMap, _contacts, messages);
        //
        //
        //
        //     const conversations = yield call(IDBConversation.getLocalConversations, 1, false);
        //     // const membrions = yield call(IDBConversation.getConversationsMembers, groupsMap.threads.threadId);
        //
        //     if (conversations) {
        //         yield put(conversationBulkReplace(conversations));
        //     }
        //
        //     // console.log(conversations, "conversations_membrions")
        //     // console.log(membrions, "membrions")
        //
        //     if (isOfflineSync && groupsMap[selectedThreadId]) {
        //         yield put(attemptSetSelectedThread(groupsMap[selectedThreadId]));
        //     }
        //     yield put(contactsBulkInsert(contactsMap));
        // }
        //
        //
        // yield put(conversationBulkInsert(groupsMap));
        // if (Object.keys(groupsMap).length === 1) {
        //     yield put(groupCreated(Object.keys(groupsMap)[0], Object.values(groupsMap)[0]));
        // }
        //
        // writeLog(LOG_TYPES.groups, {
        //     reason: "GROUPS SYNC SUCCESS",
        //     user: username
        // });
        //
        //
        //
        // yield put(groupsSyncSuccess());
        // yield call(getChannelsThumbnails, false);

    } catch (e) {
        writeLog(LOG_TYPES.groups, {
            reason: "GROUPS SYNC ERROR",
            info: e
        }, LOGS_LEVEL_TYPE.error);
        Log.i(e, "#attemptCreateGroups");
        if (CONNECTION_ERROR_TYPES.includes(e.message) || !navigator.onLine) {
            const effect = put(attemptCreateGroupsAction(groupIds, isOfflineSync, isSync));
            yield put(syncFailed(effect));
        }

    } finally {

    }

}

function* inviteMembers({payload: {groupId, members, isManualAdd, admins}}: any): any {
    const store: Store<any> = storeCreator.getStore();
    const {selectedThreadId, contacts} = selector(store.getState(), {selectedThreadId: true, contacts: true});
    const effects: Array<any> = [];

    const connection: any = connectionCreator.getConnection();
    const id: string = `invite${Date.now()}`;
    const msg: Strophe.Builder = inviteGroupMembersXML({id, groupId, members, admins});

    const request: any = {
        xmlBuilder: "inviteGroupMembersXML",
        params: {id, groupId, members, admins},
        id,
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    if (isManualAdd) {
        yield put(addRequest(request));

        if (connection.connected) {
            connection.send(msg);
        }

        const membersUsernames: Array<string> = [
            ...(members !== "" ? members.split(";") : []),
            ...(admins !== "" ? admins.split(";") : [])
        ];

        for (let memberUsername of membersUsernames) {
            const contactId = `${memberUsername}@${SINGLE_CONVERSATION_EXTENSION}`;
            effects.push(call(IDBConversation.addConversationMember, selectedThreadId, contactId));
            if (contacts.getIn([contactId, "members"])) {
                effects.push(put(addConversationMember(selectedThreadId, contacts.getIn([contactId, "members"]).first().toJS())))
            }
        }

        yield all(effects);
        Log.i("############################ members added");
    }
}

function* joinGroups({payload: {groupIds, username}}: any): any {
    const connection: any = connectionCreator.getConnection();

    forEach(groupIds, groupId => {
        const id: string = `join${Date.now()}`;
        const msg: Strophe.Builder = joinToGroupXML({id, groupId, username});

        if (connection.connected) {
            connection.send(msg);
        }
    });
}

function* attemptDeleteGroup({payload: {id, keepHistory}}: any): any {
    !keepHistory ? yield put(attemptRemoveConversation(id)) : null;
    // synchronization case
    // const store: Store<any> = storeCreator.getStore();
    // const {user} = selector(store.getState(), {user: true});
    // const username = user.get("username");
    //
    // const connectionUsername = getConnectionUsername(username);
    // const connection: any = connectionCreator.getConnection();
    //
    // const message: any = {
    //     keepHistory: keepHistory? "1": "0",
    //     roomName: getPartialId(id),
    //     from: connectionUsername,
    //     id: `sync${Date.now()}`
    // };
    //
    // const msg: Strophe.Builder = deleteGroupXML(message);
    // const xmlBuilder: string = "deleteGroupXML";
    // const request: any = {
    //     params: message,
    //     id: message.id,
    //     xmlBuilder
    // };
    //
    // yield put(addRequest(request));
    //
    // if (connection.connected) {
    //     connection.send(msg);
    // }
}

function* getGroupInfo({payload: {groupId}}: any): any {
    const connection: any = connectionCreator.getConnection();
    const groupInfoMsgId: string = `getInfo${Date.now()}`;
    const groupInfoMsg: Strophe.Builder = getGroupInfoXML({id: groupInfoMsgId, groupId});

    if (connection.connected) {
        connection.send(groupInfoMsg);
    }
}


function* attemptChangeGroupName({payload: {id, name}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});
    const username: string = user.get("username");
    const connection: any = connectionCreator.getConnection();
    const msgId: string = `msgId${Date.now()}`;
    const partialGroupId: string = getPartialId(id);
    const params: any = {id: msgId, groupId: partialGroupId, groupName: name};
    const changeGroupNameMsg: Strophe.Builder = changeGroupNameXML(params);
    const request: any = {
        id: msgId,
        xmlBuilder: "changeGroupNameXML",
        params,
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    yield put(addRequest(request));

    if (connection.connected) {
        connection.send(changeGroupNameMsg);
    }

    {
        const {payload: {id, name}} = yield take(actions.GROUP_NAME_UPDATED_SERVER);

        if (partialGroupId === id) {
            const messageToSave: any = {
                text: `${conf.app.prefix}${user.get("username")} has change the group`,
                type: MESSAGE_TYPES.update_group_name,
                createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
                threadId: getRoomId(id, username),
                creator: user.get("id"),
                id: `msgId${Date.now()}`,
                fileRemotePath: null,
                info: name,
                fileSize: null,
                time: Date.now(),
                own: true
            };

            const messageToSend: any = {
                to: `${partialGroupId}@${GROUP_CONVERSATION_EXTENSION}`,
                author: messageToSave.creator,
                type: XML_MESSAGE_TYPES.group,
                msgType: messageToSave.type,
                msgText: messageToSave.text,
                msgInfo: messageToSave.info,
                id: messageToSave.id
            };

            yield put(sendMessage(messageToSend, messageToSave));
        }
    }
}

function* attemptUpdateGroupInfo({payload: {groupInfo}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId, groupSettingsPanel, selectedThread, conversations} = selector(store.getState(), {
        user: true,
        selectedThreadId: true,
        groupSettingsPanel: true,
        selectedThread: true
    });
    const {allAdmins, memberAddMember, memberEditAvatar, memberEditName, members, name, owners, admins} = groupInfo;

    if (!name) {
        console.warn("######## attemptUpdateGroupInfo ####### groupInfo without info", groupInfo);
        return;
    }
    const username: string = user.get("username");
    // const threadInfo: any = selectedThread.getIn(["threads", "threadInfo"]);
    const threadInfo: any = conversations.getIn([`${name}@${GROUP_CONVERSATION_EXTENSION}/${username}`, "threads", "threadInfo"]);

    //@${GROUP_CONVERSATION_EXTENSION}/${username}
    const currentOwnerList: List<string> = threadInfo && threadInfo.get("ownerList");
    const currentOwnerNumber: any = currentOwnerList && currentOwnerList.get(0);


    const [adminList, memberList, ownerList, threadId] = [
        admins ? admins.split(";") : [],
        members ? members.split(";") : [],
        owners ? owners.split(";") : [],
        getRoomId(name, username)
    ];

    const role: number = getGroupRole(getUserNumberWithEmail(username, user.get("email")), {
        memberList,
        adminList,
        ownerList
    }, allAdmins);

    if (ownerList.length === 2) {
        const index: number = ownerList.indexOf(currentOwnerNumber);
        ownerList.splice(index, 1);
    }

    const updatedGroupInfo: any = {
        allAdmins: allAdmins === "1" || (ownerList.includes(username) && memberList.length === 0),
        memberAddMember: memberAddMember === "1",
        memberEditAvatar: memberEditAvatar === "1",
        memberEditName: memberEditName === "1",
        adminList: adminList.map(admin => getUsernameIfEmail(admin)),
        memberList: memberList.map(member => getUsernameIfEmail(member)),
        ownerList: ownerList.map(owner => getUsernameIfEmail(owner)),
        role
    };

    if (selectedThreadId === getRoomId(threadId, username)) {
       // yield put(updateSelectedThread(updatedGroupInfo));
        yield put(updateSelectedConversationThread(threadId, updatedGroupInfo));

        if (![GROUP_ROLES.owner, GROUP_ROLES.admin].includes(role) && groupSettingsPanel) {
            yield put(setGroupSettingsPanel(GROUP_SETTINGS_PANEL_TYPE.closed));
        }
    }
    yield call(IDBConversation.updateGroup, threadId, updatedGroupInfo);

}

function* attemptChangeGroupSettings({payload: {id, settingType, members, role, allow, requestId}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThread, conversations,} = selector(store.getState(), {user: true, selectedThread: true});
    // const threadInfo: any = selectedThread.getIn(["threads", "threadInfo"]);
    const threadInfo: any = conversations.getIn([id, "threads", "threadInfo"]);
    const [adminList, memberList] = [
        threadInfo.get("adminList"),
        threadInfo.get("memberList")
    ];
    const username: string = user.get("username");

    const connectionUsername = getConnectionUsername(username);
    const connection: any = connectionCreator.getConnection();

    const msgId: string = requestId;

    const params: any = {
        id: msgId,
        from: connectionUsername,
        groupId: getPartialId(id)
    };

    const request: any = {
        id: msgId,
        keep: true
    };

    let messageToSend: Strophe.Builder;
    let updatedInfo: any = {};

    if (settingType) {

        switch (settingType) {

            case MEMBER_EDIT_NAME_COMMAND: {
                params["allow"] = `${+allow}`;
                request["xmlBuilder"] = settingType;
                request["params"] = params;
                messageToSend = memberEditName(params);

                break;
            }

            case MEMBER_EDIT_AVATAR_COMMAND: {
                params["allow"] = `${+allow}`;
                request["xmlBuilder"] = settingType;
                request["params"] = params;
                messageToSend = memberEditAvatar(params);

                break;
            }

            case MEMBER_ADD_MEMBER_COMMAND: {
                params["allow"] = `${+allow}`;
                request["xmlBuilder"] = settingType;
                request["params"] = params;
                messageToSend = memberAddMember(params);
                break;
            }

            case CHANGE_ROLE_ALL_COMMAND: {
                params["role"] = role;
                request["xmlBuilder"] = settingType;
                request["params"] = params;
                messageToSend = changeRoleAll(params);
                break;
            }

            case CHANGE_ROLE_COMMAND: {
                params["role"] = role;
                params["members"] = members;
                request["xmlBuilder"] = settingType;
                request["params"] = params;
                messageToSend = changeRole(params);
                break;
            }
        }

        if ([MEMBER_ADD_MEMBER_COMMAND, MEMBER_EDIT_AVATAR_COMMAND, MEMBER_EDIT_NAME_COMMAND].includes(settingType)) {
            updatedInfo = {
                [settingType]: allow
            };
            yield put(updateConversationProps(id, updatedInfo));
            yield put(updateSelectedThread(updatedInfo));
        }

        if (settingType === CHANGE_ROLE_ALL_COMMAND) {
            updatedInfo = {
                allAdmins: role === "2",
                memberList: [...adminList.toArray()],
                adminList: []
            };
            yield put(updateConversationProps(id, updatedInfo));
            yield put(updateSelectedThread(updatedInfo));
        }

        if (settingType === CHANGE_ROLE_COMMAND) {
            const updatedLists: any = {
                adminList,
                memberList
            };

            if (role === "2" && !adminList.includes(members)) {
                updatedLists.adminList = updatedLists.adminList.push(members);

                if (memberList.includes(members)) {
                    const index = memberList.indexOf(members);
                    updatedLists.memberList = updatedLists.memberList.splice(index, 1);
                }
            }

            if (role === "3" && !memberList.includes(members)) {
                updatedLists.memberList = updatedLists.memberList.push(members);

                if (adminList.includes(members)) {
                    const index = adminList.indexOf(members);
                    updatedLists.adminList = updatedLists.adminList.splice(index, 1);
                }
            }

            updatedInfo["adminList"] = updatedLists.adminList.toArray();
            updatedInfo["memberList"] = updatedLists.memberList.toArray();
            yield put(updateConversationProps(id, updatedLists));
            yield put(updateSelectedThread(updatedLists));
        }

        request.createdAt = format(new Date(), DEFAULT_TIME_FORMAT);
        if (request.xmlBuilder) {
            yield put(addRequest(request));
        }

        if (connection.connected && messageToSend) {
            connection.send(messageToSend);
            yield put(removeRequest(request.id));
        }

        yield call(handleGroupActionsResponse, id, requestId, updatedInfo);

    }
}

function* handleGroupActionsResponse(threadId: string, requestId: string, updatedInfo: any) {
    yield delay(10000);
    const store: Store<any> = storeCreator.getStore();
    const {pendingRequests, selectedThreadId} = selector(store.getState(), {
        pendingRequests: true,
        selectedThreadId: true
    });

    if (!pendingRequests.get(requestId)) {
        yield call(IDBConversation.updateGroup, threadId, updatedInfo);

    } else {
        yield put(removeRequest(requestId));

        if (selectedThreadId === threadId) {
            const {threads: {threadInfo}} = yield call(IDBConversation.getThread, threadId);
            yield put(updateSelectedThread(threadInfo));
        }
    }
}

function* attemptRemoveGroup({payload: {id, requestId}}) {
    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});
    const username: string = user.get("username");

    const connectionUsername = getConnectionUsername(username);
    const connection: any = connectionCreator.getConnection();

    const msgId: string = requestId;
    const params: any = {
        id: msgId,
        from: connectionUsername,
        groupId: getPartialId(id)
    };
    const msg: Strophe.Builder = deleteRoom(params);
    const request: any = {
        id: msgId,
        keep: true,
        xmlBuilder: DELETE_ROOM_COMMAND,
        params,
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    yield put(addRequest(request));

    yield put(attemptRemoveConversation(id));


    if (connection.connected) {
        connection.send(msg);
    }

}

function* attemptLeaveAndChangeOwner({payload: {id, owner, keepHistory, requestId}}) {
    const connection: any = connectionCreator.getConnection();

    const msgId: string = requestId;

    const params: any = {
        id: msgId,
        groupId: getPartialId(id),
        owner
    };
    const msg: Strophe.Builder = leaveOwner(params);

    const request: any = {
        id: msgId,
        xmlBuilder: OWNER_LEAVE_COMMAND,
        params,
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT)
    };

    if (!keepHistory) {
        request["waitForServerResponse"] = true;
    }

    yield put(addRequest(request));

    if (connection.connected) {
        connection.send(msg);
    }
}

function* handleGroupResponse({payload: {response}}) {
    const {zmuc: {name}, request: {xmlns}, id, from} = response;
    const store: Store<any> = storeCreator.getStore();
    const {user, conversations} = selector(store.getState(), {user: true, conversations: true});
    const username: string = user.get("username");

    if (xmlns && xmlns === RECEIPTS_REQUEST_XMLNS) {
        yield put(sendXMLReceived({from: getUserId(username), id, to: from}));
    }
    const threadId: string = getRoomId(name, username);
    // const thread = yield call(IDBConversation.getThread, threadId);
    let thread = conversations.get(threadId);

    Log.i("conference -> handleGroupResponse -> thread = 1", thread)

    if (!thread) {
        thread = yield call(IDBConversation.getThread, threadId);
    }

    Log.i("conference -> handleGroupResponse -> thread = 2", thread)

    if (!thread) {
        // while (true) {
            yield put(attemptCreateGroupsAction([name]));
            const {payload: {groupId, group}} = yield take(actions.GROUP_CREATED);

            if (threadId === groupId) {
                yield fork(_handleGroupResponse, group, response);
            }
        // }
    } else {
        yield fork(_handleGroupResponse, thread, response);
    }
}

function* _handleGroupResponse(thread, response) {
    const store: Store<any> = storeCreator.getStore();
    const {user, selectedThreadId} = selector(store.getState(), {
        user: true,
        selectedThreadId: true
    });
    const username: string = user.get("username");
    const {zmuc: {command}, id} = response;
    Log.i("conference -> _handleGroupResponse -> thread = 1", thread)
    if (thread.size) {
        thread = thread.toJS()
    }
    const {threads: {threadId, threadInfo}}: any = thread;
    Log.i("conference -> _handleGroupResponse -> thread = 2", thread)
    const {ownerList}: any = threadInfo;
    const ownerUsername: string = ownerList[0];
    let seenSent: boolean = false;
    const effects: Array<any> = [];
    const currentTime: any = Date.now();
    const msgId: string = `msgId${currentTime}`;
    const message: any = {
        createdAt: format(new Date(), DEFAULT_TIME_FORMAT),
        creator: getUserId(ownerUsername),
        own: ownerUsername === username,
        info: ownerUsername,
        fileRemotePath: "",
        time: Date.now(),
        fileSize: null,
        likeState: 0,
        linkTags: [],
        dislikes: 0,
        link: false,
        threadId,
        repid: "",
        text: "",
        likes: 0,
        ext: "",
        id
    };

    // const message: any = {
    //     conversationId: threadId,
    //     createdAt: format(currentTime, DEFAULT_TIME_FORMAT),
    //     creator: getUserId(ownerUsername),
    //     deleted: false,
    //     delivered: false,
    //     dislikes: 0,
    //     edited: false,
    //     email: '',
    //     fileLink: '',
    //     fileRemotePath: '',
    //     fileSize: null,
    //     hidden: undefined,
    //     info: ownerUsername,
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
    //     own: ownerUsername === username,
    //     pid: undefined,
    //     previousMessageId: undefined,
    //     repid: "",
    //     seen: false,
    //     sid: undefined,
    //     status: false,
    //     text: '',
    //     ext: "",
    //     threadId,
    //     time: currentTime,
    //     type: MESSAGE_TYPES.text,
    // };

    switch (command) {

        case DELETE_ROOM_COMMAND: {
            message["type"] = MESSAGE_TYPES.delete_room;
            effects.push(call(IDBConversation.updateGroup, threadId, {disabled: {value: true, username}}));
            effects.push(call(IDBConversation.removeGroupMember, threadId, `${username}@${SINGLE_CONVERSATION_EXTENSION}`));
            // effects.push(put(disableGroupSelectedThread(threadId, username)));
            effects.push(put(disableGroupConversationThread(threadId, username)));
            break;
        }

        case CREATE_GROUP_XML_COMMAND: {
            message["type"] = MESSAGE_TYPES.create_room;
            break;
        }

    }

    if (selectedThreadId === threadId) {
        yield put(addMessage(message));

        if (document.hasFocus()) {
            seenSent = true;
        }
    }

    yield put(attemptCreateConversation(message, false, seenSent));

    if (effects.length > 0) {
        yield all(effects);
    }
}

function* groupsSaga(): any {
    yield takeEvery(actions.ATTEMPT_LEAVE_OR_DELETE_MEMBER, attemptLeaveOrDeleteMember);
    yield takeEvery(actions.ATTEMPT_LEAVE_AND_CHANGE_OWNER, attemptLeaveAndChangeOwner);
    yield takeEvery(actions.ATTEMPT_CHANGE_GROUP_SETTINGS, attemptChangeGroupSettings);
    yield takeEvery(actions.HANDLE_GROUP_RESPONSE, handleGroupResponse);
    yield takeEvery(actions.ATTEMPT_CHANGE_GROUP_NAME, attemptChangeGroupName);
    yield takeEvery(actions.ATTEMPT_UPDATE_GROUP_INFO, attemptUpdateGroupInfo);
    yield takeEvery(actions.ATTEMPT_CREATE_GROUPS, attemptCreateGroups);
    yield takeEvery(actions.ATTEMPT_REMOVE_GROUP, attemptRemoveGroup);
    yield takeEvery(actions.ATTEMPT_CREATE_GRPOUP, attemptCreateGroup);
    yield takeEvery(actions.ATTEMPT_DELETE_GROUP, attemptDeleteGroup);
    yield takeEvery(actions.IVITED_TO_GROUP, invitedToGroup);
    yield takeEvery(actions.INVITE_MEMBERS, inviteMembers);
    yield takeEvery(actions.JOIN_GROUPS, joinGroups);
    yield takeEvery(actions.GET_INFO, getGroupInfo);
}

export default groupsSaga;
