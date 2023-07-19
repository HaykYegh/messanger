import database from "services/database";
import * as lf from "lovefield";
import {Predicate, Row} from "lovefield";
import {APPLICATION, CONVERSATION_TYPE, CONVERSATIONS_LIMIT} from "configs/constants";
import {getConversationType, getThreadType, isPublicRoom} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {fromJS} from "immutable";
import {APPLICATION_PROPERTIES} from "services/database/class/Application";
import Database = lf.schema.Database;
import Table = lf.schema.Table;
import Log from "modules/messages/Log";

export interface IDBxConversation {
    newMessagesIds?: Array<string>;
    conversationId: string;
    lastMessageId: string;
    threadId: string;
    time: number;
}

export default class IDBConversation {

    static async createConversation(conversation: IDBxConversation, threadInfo: any = {}, parentThreadId: any = null): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

        const {threadId} = conversation;
        const threadType = parentThreadId ? CONVERSATION_TYPE.PRIVATE_CHAT : getConversationType(threadId);

        const threadContactRows: Array<Row> = [];
        const conversationRow = conversations.createRow(conversation);
        const threadRow = threads.createRow({threadId, threadType, threadInfo, parentThreadId});

        if (threadInfo.members) {
            threadInfo.members.map(username => {
                const contactId = `${username}@${SINGLE_CONVERSATION_EXTENSION}`;
                threadContactRows.push(threadContacts.createRow({threadId, contactId}))
            })
        } else {
            threadContactRows.push(threadContacts.createRow({threadId, contactId: threadId}));
        }

        const threadExists = await IDBConversation.getFullConversationById(conversation.conversationId);

        if (!threadExists) {
            await db.insertOrReplace()
                .into(threads)
                .values([threadRow])
                .exec()
                .catch(e => Log.i(e));

            await db.insertOrReplace()
                .into(threadContacts)
                .values(threadContactRows)
                .exec()
                .catch(e => Log.i(e));
        }

        return db.insertOrReplace()
            .into(conversations)
            .values([conversationRow])
            .exec()
            .catch(e => Log.i(e));

    }

    static async updateConversation(threadId, conversationData): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const query = db.update(conversations);

        Object.keys(conversationData).map(key => query.set(conversations[key], conversationData[key]));

        query.where(conversations.threadId.eq(threadId));
        return query.exec().catch(e => Log.i(e));
    }

    static async getFullConversationById(conversationId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const clause: Predicate = conversations
            .conversationId
            .eq(conversationId);

        const conversation: any = await db.select()
            .from(conversations)
            .innerJoin(messages, conversations.lastMessageId.eq(messages.messageId))
            .innerJoin(contacts, conversations.conversationId.eq(contacts.contactId))
            .where(clause)
            .exec();

        if (conversation && conversation.length > 0) {
            return {
                ...conversation[0].contacts,
                lastMessage: conversation[0].messages,
                conversation: conversation[0].conversations
            };
        } else {
            return null;
        }

    }

    /*static async getAllThreads(threadType: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        const threadRequest: any = await db.select()
            .from(threads)
            .where(lf.op.and(threads
                .threadType
                .eq(threadType), threads.hidden.neq(true)))
            .exec().catch(err => console.log(err));

        return threadRequest;
    }*/

    static async getAllConversations(threadType: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        const conversationRequest: any = await db.select()
            .from(conversations)
            .innerJoin(threads, threads.threadId.eq(conversations.threadId))
            .where(threads
                .threadType
                .eq(threadType))
            .exec().catch(err => Log.i(err));

        return conversationRequest;
    }

    static async getThread(threadId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const privateChat = threads.as("privateChat");

        const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

        const threadRequest: Promise<any> = db.select()
            .from(threads)
            .innerJoin(conversations, conversations.threadId.eq(threads.threadId))
            .leftOuterJoin(messages, messages.messageId.eq(conversations.lastMessageId))
            .leftOuterJoin(privateChat, privateChat.threadId.eq(threads.parentThreadId))
            .where(threads
                .threadId
                .eq(threadId))
            .exec().catch(err => Log.i(err));

        const threadContactsRequest: Promise<any> = db.select()
            .from(threadContacts)
            .innerJoin(contacts, contacts.contactId.eq(threadContacts.contactId))
            .where(threadContacts.threadId.eq(threadId))
            .exec().catch(err => Log.i(err));


        const userRequest: Promise<any> = db.select(application.value)
            .from(application)
            .where(application.applicationId.eq(APPLICATION_PROPERTIES.user))
            .limit(1)
            .exec().catch(err => Log.i(err));


        const threadData = await Promise.all([
            threadRequest,
            threadContactsRequest,
            userRequest
        ]);

        if (threadData[0][0]) {
            const members = {};
            const threads = threadData[0][0].threads;
            const threadType = threads.threadType;
            const {isGroup} = getThreadType(threadType);
            const groupMembers = isGroup ? threads.threadInfo.groupMembersUsernames : [];

            if (groupMembers.includes(threadData[2][0].value.username)) {
                members[threadData[2][0].value.id] = threadData[2][0].value;
            }

            threadData[1].map(thread => {
                const threadUsername = thread.contacts.username;

                if (isGroup && groupMembers && !groupMembers.includes(threadUsername)) {
                    groupMembers.push(threadUsername);
                }

                members[thread.contacts.contactId] = thread.contacts;
            });

            return {
                ...threadData[0][0],
                members
            };
        }

        return null;
    }

    static async bulkCreateConversations(profiles: any) {

        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

        const rows: any = {
            contacts: [],
            threads: [],
            threadContacts: [],
            conversations: [],
        };

        Object.keys(profiles).map((contactId) => {
            const contact: any = profiles[contactId];
            rows.contacts.push(contacts.createRow(contact));
        });
        const transaction = await db.createTransaction();

        await transaction.begin([contacts, threads, threadContacts, conversations])
            .then(async () => {
                const insertContacts = await db.insertOrReplace()
                    .into(contacts)
                    .values(rows.contacts);
                return transaction.attach(insertContacts);
            })
            .then(async (contactsResult) => {
                const threadContactsRows = contactsResult.map((contact: any) => {
                    return threadContacts.createRow({
                        threadId: contact.contactId,
                        contactId: contact.contactId
                    });
                });
                const insertThreadContacts = await db
                    .insertOrReplace()
                    .into(threadContacts)
                    .values(threadContactsRows);
                return transaction.attach(insertThreadContacts);
            })
            .then(async (threadContactsResult) => {
                const threadsRows = threadContactsResult.map((threadContact: any) => {
                    return threads.createRow({
                        threadId: threadContact.contactId,
                        threadType: 'SINGLE'
                    });
                });
                const insertThreads = await db
                    .insertOrReplace()
                    .into(threads)
                    .values(threadsRows);
                return transaction.attach(insertThreads);
            })
            .then(async (threadsResult) => {
                const conversationRows = threadsResult.map((thread: any) => {
                    return conversations.createRow({
                        conversationId: thread.threadId,
                        threadId: thread.threadId,
                        lastMessageId: '',
                        newMessagesIds: []
                    });
                });
                const insertConversations = await db
                    .insertOrReplace()
                    .into(conversations)
                    .values(conversationRows);
                return transaction.attach(insertConversations);
            }).then(() => {
                return transaction.commit();
            });
    }

    static async addConversationMember(threadId: string, contactId: string) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

        const threadContactRow = threadContacts.createRow({threadId, contactId});

        return db.insertOrReplace()
            .into(threadContacts)
            .values([threadContactRow])
            .exec()
            .catch(e => Log.i(e))
    }

    static async getNewMessagesCountByConversationIds(conversations: Array<string>) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversationsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const messagesTbl = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        return db.select()
            .from(conversationsTbl)
            .leftOuterJoin(messagesTbl, conversationsTbl.lastMessageId.eq(messagesTbl.messageId))
            .where(conversationsTbl.threadId.in(conversations))
            .exec();
    }

    static async EXPERIMENTAL_bulkCreateConversations(conversationsMap: any) {

        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblContacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const tblConversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const rows: any = {
            contacts: [],
            threads: [],
            threadContacts: [],
            conversations: [],
            messages: [],
        };

        conversationsMap.map((thread) => {
            rows.contacts.push(tblContacts.createRow(thread.contact));
            rows.threads.push(tblThreads.createRow(thread.thread));
            rows.threadContacts.push(tblThreadContacts.createRow(thread.threadContact));
            rows.conversations.push(tblConversations.createRow(thread.conversation));
            rows.messages.push(tblMessages.createRow(thread.message));
        });

        const transaction = await db.createTransaction();

        await transaction.begin([tblContacts, tblThreads, tblThreadContacts, tblConversations, tblMessages])
            .then(async () => {
                const insertContacts = await db.insertOrReplace()
                    .into(tblContacts)
                    .values(rows.contacts);
                return transaction.attach(insertContacts);
            })
            .then(async () => {
                const insertThreadContacts = await db
                    .insertOrReplace()
                    .into(tblThreadContacts)
                    .values(rows.threadContacts);
                return transaction.attach(insertThreadContacts);
            })
            .then(async () => {
                const insertThreads = await db
                    .insertOrReplace()
                    .into(tblThreads)
                    .values(rows.threads);
                return transaction.attach(insertThreads);
            })
            .then(async () => {
                const insertConversations = await db
                    .insertOrReplace()
                    .into(tblConversations)
                    .values(rows.conversations);
                return transaction.attach(insertConversations);
            })
            .then(async () => {
                const insertConversations = await db
                    .insertOrReplace()
                    .into(tblMessages)
                    .values(rows.messages);
                return transaction.attach(insertConversations);
            }).then(() => {
                return transaction.commit();
            });
    }

    static async createGroupConversations(groups, contacts, messages) {
        const db: lf.Database = await database.getDB();
        const transaction = await db.createTransaction();
        const schema: Database = db.getSchema();

        const tblContacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const tblConversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const rows: any = {
            contacts: [],
            threads: [],
            threadContacts: [],
            conversations: [],
            messages: [],
        };

        Object.keys(groups).map(groupId => {
            const group = groups[groupId];
            const {threadId} = group.threads;
            rows.conversations.push(tblConversations.createRow(group.conversations));
            rows.threads.push(tblThreads.createRow(group.threads));
            if (group.messages.messageId) {
                rows.messages.push(tblMessages.createRow(group.messages));
            }
            group.threads.threadInfo.groupMembersUsernames.map(username => {
                const contactId = `${username}@${SINGLE_CONVERSATION_EXTENSION}`;
                rows.threadContacts.push(tblThreadContacts.createRow({threadId, contactId}))
            })
        });

        Object.keys(contacts).map(username => {
            const contact = contacts[username];
            rows.contacts.push(tblContacts.createRow(contact))
        });
        Log.i("GROUPSLOG");
        Log.i(groups);
        Log.i("CONTACTS");
        Log.i(contacts);
        await transaction.begin([tblContacts, tblThreads, tblThreadContacts, tblConversations, tblMessages])
            .then(async () => {
                const insertContacts = await db.insertOrReplace()
                    .into(tblContacts)
                    .values(rows.contacts);
                return transaction.attach(insertContacts);
            })
            .then(async () => {
                const insertThreadContacts = await db
                    .insertOrReplace()
                    .into(tblThreadContacts)
                    .values(rows.threadContacts);
                return transaction.attach(insertThreadContacts);
            })
            .then(async () => {
                const insertThreads = await db
                    .insertOrReplace()
                    .into(tblThreads)
                    .values(rows.threads);
                return transaction.attach(insertThreads);
            })
            .then(async () => {
                const insertConversations = await db
                    .insertOrReplace()
                    .into(tblConversations)
                    .values(rows.conversations);
                return transaction.attach(insertConversations);
            })
            .then(async () => {
                const insertConversations = await db
                    .insertOrReplace()
                    .into(tblMessages)
                    .values(rows.messages);
                return transaction.attach(insertConversations);
            }).then(() => {
                return transaction.commit();
            });
    }

    static async changeGroupContactsInfo(groups, contacts, messages) {
        const db: lf.Database = await database.getDB();
        const transaction = await db.createTransaction();
        const schema: Database = db.getSchema();

        const tblContacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const tblConversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const rows: any = {
            contacts: [],
            threads: [],
            threadContacts: [],
            conversations: [],
            messages: [],
        };

        Object.keys(groups).map(groupId => {
            const group = groups[groupId];
            const {threadId} = group.threads;
            rows.conversations.push(tblConversations.createRow(group.conversations));
            rows.threads.push(tblThreads.createRow(group.threads));
            if (group.messages.messageId) {
                rows.messages.push(tblMessages.createRow(group.messages));
            }
            group.threads.threadInfo.groupMembersUsernames.map(username => {
                const contactId = `${username}@${SINGLE_CONVERSATION_EXTENSION}`;
                rows.threadContacts.push(tblThreadContacts.createRow({threadId, contactId}))
            })
        });

        Object.keys(contacts).map(username => {
            const contact = contacts[username];
            rows.contacts.push(tblContacts.createRow(contact))
        });
        Log.i("GROUPSLOG");
        Log.i(groups);
        Log.i("CONTACTS");
        Log.i(contacts);
        await transaction.begin([tblContacts, tblThreads, tblThreadContacts, tblConversations, tblMessages])
            .then(async () => {
                const insertContacts = await db.insertOrReplace()
                    .into(tblContacts)
                    .values(rows.contacts);
                return transaction.attach(insertContacts);
            })
            .then(async () => {
                const insertThreadContacts = await db
                    .insertOrReplace()
                    .into(tblThreadContacts)
                    .values(rows.threadContacts);
                return transaction.attach(insertThreadContacts);
            })
            // .then(async () => {
            //     const insertThreads = await db
            //         .insertOrReplace()
            //         .into(tblThreads)
            //         .values(rows.threads);
            //     return transaction.attach(insertThreads);
            // })
            // .then(async () => {
            //     const insertConversations = await db
            //         .insertOrReplace()
            //         .into(tblConversations)
            //         .values(rows.conversations);
            //     return transaction.attach(insertConversations);
            // })
            .then(() => {
                return transaction.commit();
            });
    }

    static async removeConversation(threadId: string) {
        try {
            const db: lf.Database = await database.getDB();
            const transaction = await db.createTransaction();
            const schema: Database = db.getSchema();

            const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
            const tblConversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
            const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
            const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

            if (isPublicRoom(threadId) && threadId.includes("pid")) {
                const privateChat = await db.select()
                    .from(tblThreads)
                    .where(tblThreads.parentThreadId.eq(threadId))
                    .exec();

                if (privateChat.length > 0) {
                    return db.update(tblThreads)
                        .set(tblThreads.hidden, true)
                        .where(tblThreads.threadId.eq(threadId))
                        .exec();
                }
            }

            await transaction.begin([tblThreads, tblConversations, tblMessages, tblThreadContacts])
                .then(async () => {
                    const deleteFromThreads = await db
                        .delete()
                        .from(tblThreads)
                        .where(tblThreads.threadId.eq(threadId));
                    return transaction.attach(deleteFromThreads);
                })
                .then(async () => {
                    const deleteFromConversations = await db
                        .delete()
                        .from(tblConversations)
                        .where(tblConversations.conversationId.eq(threadId));
                    return transaction.attach(deleteFromConversations);
                })
                .then(async () => {
                    const deleteFromThreadContacts = await db
                        .delete()
                        .from(tblThreadContacts)
                        .where(tblThreadContacts.threadId.eq(threadId));
                    return transaction.attach(deleteFromThreadContacts);
                })
                .then(async () => {
                    const deleteFromMessages = await db
                        .delete()
                        .from(tblMessages)
                        .where(tblMessages.threadId.eq(threadId));
                    return transaction.attach(deleteFromMessages);
                }).then(() => {
                    return transaction.commit();
                });

        } catch (e) {
            console.error(e, "########################");
        }

    }

    static async removeConversations(threadIds: Array<string>) {
        try {
            const db: lf.Database = await database.getDB();
            const transaction = await db.createTransaction();
            const schema: Database = db.getSchema();

            const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
            const tblConversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
            const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
            const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

            const privateChats: Array<any> = await db.select()
                .from(tblThreads)
                .where(tblThreads.parentThreadId.in(threadIds))
                .exec();

            if (privateChats.length > 0) {
                await db.update(tblThreads)
                    .set(tblThreads.hidden, true)
                    .where(tblThreads.parentThreadId.in(threadIds))
                    .exec();

                privateChats.map(privateChat => {
                    if (threadIds.includes(privateChat.parentThreadId)) {
                        const index = threadIds.indexOf(privateChat.parentThreadId);
                        threadIds.splice(index, 1);
                    }
                });
            }

            if (threadIds.length > 0) {
                await transaction.begin([tblThreads, tblConversations, tblMessages, tblThreadContacts])
                    .then(async () => {
                        const deleteFromThreads = await db
                            .delete()
                            .from(tblThreads)
                            .where(tblThreads.threadId.in(threadIds));
                        return transaction.attach(deleteFromThreads);
                    })
                    .then(async () => {
                        const deleteFromConversations = await db
                            .delete()
                            .from(tblConversations)
                            .where(tblConversations.conversationId.in(threadIds));
                        return transaction.attach(deleteFromConversations);
                    })
                    .then(async () => {
                        const deleteFromThreadContacts = await db
                            .delete()
                            .from(tblThreadContacts)
                            .where(tblThreadContacts.threadId.in(threadIds));
                        return transaction.attach(deleteFromThreadContacts);
                    })
                    .then(async () => {
                        const deleteFromMessages = await db
                            .delete()
                            .from(tblMessages)
                            .where(tblMessages.threadId.in(threadIds));
                        return transaction.attach(deleteFromMessages);
                    }).then(() => {
                        return transaction.commit();
                    });
            }

        } catch (e) {
            console.error(e, "########################");
        }

    }

    static async updateThreadInfo(threadId: string, threadInfo: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const threads: any = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        const getThread: any = await db
            .select(threads.threadInfo)
            .from(threads)
            .where(threads.threadId.eq(threadId))
            .exec();

        const updatedThreadInfo: any = getThread[0].threadInfo;

        //updatedThreadInfo.avatarUrl = "";
        //updatedThreadInfo.imageUrl = "";
        if(threadInfo.avatar) {
            updatedThreadInfo.avatar = threadInfo.avatar;
            updatedThreadInfo.avatarBlobUrl = (window as any).URL.createObjectURL(threadInfo.avatar)
        }


        return db
            .update(threads)
            .set(threads.threadInfo, updatedThreadInfo)
            .where(threads.threadId.eq(threadId))
            .exec();

    }


    static async removeGroupMember(threadId: string, memberId: string) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const tblThreadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

        return db
            .delete()
            .from(tblThreadContacts)
            .where(lf.op.and(tblThreadContacts.contactId.eq(memberId), tblThreadContacts.threadId.eq(threadId)))
            .exec();

    }

    static async addMessageId(threadId: string, messageId: string) {
        const db: lf.Database = await database.getDB();
        const conversationsTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

        const transaction = await db.createTransaction();

        await transaction.begin([conversationsTbl])
            .then(async () => {
                const selectConversation = await db.select()
                    .from(conversationsTbl)
                    .where(conversationsTbl.threadId.eq(threadId));
                return transaction.attach(selectConversation);
            })
            .then(async (conversationResult: any) => {
                let newMessagesIds = [];
                if (conversationResult.length > 0) {
                    newMessagesIds = conversationResult[0].newMessagesIds || [];
                    if (!newMessagesIds.includes(messageId)) {
                        newMessagesIds.push(messageId);
                    }
                }
                const updateConversation = await db.update(conversationsTbl)
                    .set(conversationsTbl.newMessagesIds, newMessagesIds)
                    .set(conversationsTbl.newMessagesCount, newMessagesIds.length)
                    .where(conversationsTbl.threadId.eq(threadId));
                return transaction.attach(updateConversation);
            })
            .then(() => {
                return transaction.commit();
            });

    }

    static async getMessagesCount(threadType) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let clause: Predicate = "";

        if (threadType === CONVERSATION_TYPE.CHANNEL) {
            clause = lf.op.and(tblThreads.threadType.eq(CONVERSATION_TYPE.CHANNEL), conversations.newMessagesCount.gt(0));
        } else {
            clause = lf.op.and(tblThreads.threadType.neq(CONVERSATION_TYPE.CHANNEL), conversations.newMessagesCount.gt(0));
        }
        const selectQuery: any = await db.select(lf.fn.sum(conversations.newMessagesCount).as('count')).from(conversations)
            .innerJoin(tblThreads, conversations.threadId.eq(tblThreads.threadId))
            .where(clause)
            .exec();
        return selectQuery[0]["count"] ? selectQuery[0]["count"] : 0;
    }

    static async updateGroup(threadId: string, groupData: any) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const threadsTbl = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        const threadRequest = await db.select()
            .from(threadsTbl)
            .where(threadsTbl.threadId.eq(threadId))
            .exec()
            .catch(err => Log.i(err));

        const thread = threadRequest[0];

        if (thread && thread.threadInfo) {
            if (groupData.disabled) {
                const username = groupData.disabled.username;
                if (groupData.disabled.value) {
                    thread.threadInfo.groupMembersUsernames = thread.threadInfo.groupMembersUsernames
                        .filter(groupMemberUsername => groupMemberUsername !== username);
                    thread.threadInfo.members = thread.threadInfo.members
                        .filter(member => member !== username);

                    groupData = {disabled: true};
                } else {
                    !thread.threadInfo.groupMembersUsernames.includes(username) ?
                        thread.threadInfo.groupMembersUsernames.push(username) : null;
                    !thread.threadInfo.members.includes(username) ?
                        thread.threadInfo.members.push(username) : null;

                    groupData = {disabled: false};
                }
            }

            thread.threadInfo = {...thread.threadInfo, ...groupData};

            return db.insertOrReplace()
                .into(threadsTbl)
                .values([threadsTbl.createRow(thread)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async getConversations(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const conversationsMap = {};

        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const privateChat = threads.as("privateChat");

        const result: any = await db.select()
            .from(threads)
            .innerJoin(conversations, conversations.threadId.eq(threads.threadId))
            .leftOuterJoin(messages, conversations.lastMessageId.eq(messages.messageId))
            .leftOuterJoin(contacts, threads.threadId.eq(contacts.contactId))
            .leftOuterJoin(privateChat, privateChat.threadId.eq(threads.parentThreadId))
            .exec();

        if (result.length === 0) {
            return undefined
        }

        result.map(item => {
            if (!item.conversations.newMessagesIds) {
                item.conversations.newMessagesIds = [];
            }
            conversationsMap[item.threads.threadId] = {
                conversations: item.conversations,
                threads: item.threads,
                messages: item.messages,
                // members: [CONVERSATION_TYPE.SINGLE, CONVERSATION_TYPE.PRIVATE_CHAT].includes(item.threads.threadType) ? {
                //     [item.threads.threadId]: item.contacts
                // } : null,
                members: item.contacts,
                privateChat: item.privateChat
            };
        });

        return fromJS(conversationsMap)
            .sort((conversation1, conversation2) => {
                const value1: string = !conversation1.get("messages").isEmpty() ? conversation1.get("messages").get("time") : 0;

                const value2: string = !conversation2.get("messages").isEmpty() ? conversation2.get("messages").get("time") : 0;

                if (value1 < value2) {
                    return 1;
                } else if (value1 > value2) {
                    return -1;
                } else {
                    return 0;
                }
            });
    }

    static async getConversationsMembers(threadId) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const privateChat = threads.as("privateChat");
        const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

            const threadRequest: Promise<any> = db.select()
              .from(threads)
              .innerJoin(conversations, conversations.threadId.eq(threads.threadId))
              .leftOuterJoin(messages, messages.messageId.eq(conversations.lastMessageId))
              .leftOuterJoin(privateChat, privateChat.threadId.eq(threads.parentThreadId))
              .where(threads
                .threadId
                .eq(threadId))
              .exec().catch(err => Log.i(err));

            const threadContactsRequest: Promise<any> = db.select()
              .from(threadContacts)
              .innerJoin(contacts, contacts.contactId.eq(threadContacts.contactId))
              .where(threadContacts.threadId.eq(threadId))
              .exec().catch(err => Log.i(err));


            const userRequest: Promise<any> = db.select(application.value)
              .from(application)
              .where(application.applicationId.eq(APPLICATION_PROPERTIES.user))
              .limit(1)
              .exec().catch(err => Log.i(err));


            const threadData = await Promise.all([
                threadRequest,
                threadContactsRequest,
                userRequest
            ]);

            if (threadData[0][0]) {
                const members = {};
                const threads = threadData[0][0].threads;
                const threadType = threads.threadType;
                const {isGroup} = getThreadType(threadType);
                const groupMembers = isGroup ? threads.threadInfo.groupMembersUsernames : [];

                if (threadData[2][0] && groupMembers && groupMembers.includes(threadData[2][0].value.username)) {
                    members[threadData[2][0].value.id] = threadData[2][0].value;
                }

                threadData[1].map(thread => {
                    const threadUsername = thread.contacts.username;

                    if (isGroup && groupMembers && !groupMembers.includes(threadUsername)) {
                        groupMembers.push(threadUsername);
                    }

                    members[thread.contacts.contactId] = thread.contacts;
                });

                return {
                    members
                };
            }
        // }

        // members test end
    }

    static async getLocalConversations(page = 1, skip: boolean = false, threadType = "", searchText = "", limit = CONVERSATIONS_LIMIT): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const db: lf.Database = await database.getDB();
                const schema: Database = db.getSchema();

                const conversationsMap = {};

                const conversations = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
                const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
                const threads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
                const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
                const privateChat = threads.as("privateChat");
                const threadContacts = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
                const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);
                let clause: Predicate = "";

                if (!searchText) {
                    switch (threadType) {
                        case "":
                        case CONVERSATION_TYPE.SINGLE:
                            clause = lf.op.or(threads.threadType.eq(CONVERSATION_TYPE.SINGLE), threads.threadType.eq(CONVERSATION_TYPE.GROUP), threads.threadType.eq(CONVERSATION_TYPE.PRIVATE_CHAT));
                            break;

                        case CONVERSATION_TYPE.GROUP:
                            clause = threads.threadType.eq(CONVERSATION_TYPE.GROUP);
                            break;

                        case CONVERSATION_TYPE.CHANNEL:
                            clause = lf.op.and(threads.threadType.eq(CONVERSATION_TYPE.CHANNEL), threads.hidden.neq(true));
                            break;
                    }

                } else {
                    switch (threadType) {
                        case "":
                        case CONVERSATION_TYPE.SINGLE:
                            const cleanedText = searchText.replace(/\\/g, "");
                            clause = lf.op.and(
                                lf.op.or(threads.threadType.eq(CONVERSATION_TYPE.SINGLE), threads.threadType.eq(CONVERSATION_TYPE.GROUP)),
                                lf.op.or(threads.threadName.match(new RegExp("[" + cleanedText + "]", "i")), contacts.name.match(new RegExp("[" + cleanedText + "]", "i"))));
                            break;

                        case CONVERSATION_TYPE.GROUP:
                            const cleanedTextForGroups = searchText.replace(/\\/g, "");
                            clause = lf.op.and(threads.threadType.eq(CONVERSATION_TYPE.GROUP), threads.threadName.match(new RegExp("[" + cleanedTextForGroups + "]", "i")));
                            break;
                    }
                }


                const storeQuery: any = db.select()
                    .from(threads)
                    .innerJoin(conversations, conversations.threadId.eq(threads.threadId))
                    .leftOuterJoin(messages, conversations.lastMessageId.eq(messages.messageId))
                    .leftOuterJoin(contacts, threads.threadId.eq(contacts.contactId))
                    .leftOuterJoin(privateChat, privateChat.threadId.eq(threads.parentThreadId))
                    .where(clause);
                storeQuery.orderBy(conversations.time, lf.Order.DESC);
                skip && !searchText && storeQuery.limit(limit).skip((page - 1) * limit);
                !skip && !searchText && storeQuery.limit(limit * page);

                const result = await storeQuery.exec();

                if (result.length === 0) {
                    resolve(undefined);
                }

                for (const item of result) {
                    if (!item.conversations.newMessagesIds) {
                        item.conversations.newMessagesIds = [];
                    }
                    const membrions = await IDBConversation.getConversationsMembers(item.threads.threadId);
                    if(item.threads.threadInfo && item.threads.threadInfo.avatar) {
                        item.threads.threadInfo.avatarBlobUrl = (window as any).URL.createObjectURL(item.threads.threadInfo.avatar)
                    }
                    if(item.contacts.avatar && !item.contacts.avatarBlobUrl) {
                        item.contacts.avatarBlobUrl = (window as any).URL.createObjectURL(item.contacts.avatar)
                    }
                    conversationsMap[item.threads.threadId] = {
                        conversations: item.conversations,
                        threads: item.threads,
                        messages: item.messages,
                        members: [CONVERSATION_TYPE.SINGLE, CONVERSATION_TYPE.PRIVATE_CHAT].includes(item.threads.threadType) ? {
                            [item.threads.threadId]: item.contacts
                        } : membrions.members,
                        privateChat: item.privateChat
                    };

                }
                resolve(conversationsMap);
            } catch (e) {
                reject(e);
            }

        })
    }


    // refactored


    static async retrieveThread(threadId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const conversationsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const threadsTbl = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const messagesTbl = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const contactsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const threads: any[] = await db.select()
            .from(threadsTbl)
            .innerJoin(conversationsTbl, conversationsTbl.threadId.eq(threadsTbl.threadId))
            .leftOuterJoin(messagesTbl, messagesTbl.messageId.eq(conversationsTbl.lastMessageId))
            .where(threadsTbl.threadId.eq(threadId))
            .exec();


        const threadType: string = getConversationType(threadId);
        let thread: any = threads[0];

        if (!thread) {
            try {
                const contacts: any[] = await db.select()
                    .from(contactsTbl)
                    .where(contactsTbl.contactId.eq(threadId))
                    .exec();
                thread = contacts[0];
            } catch (e) {
                console.error(e);
            }
        } else {
            thread = null
        }

        return {
            type: threadType,
            value: thread
        };

    }

    static async updateDraftMessage(threadId: string, message: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversationsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

        return db.update(conversationsTbl)
            .set(conversationsTbl.draft, message)
            .where(conversationsTbl.conversationId.eq(threadId))
            .exec()
            .catch(e => Log.i(e));
    }

    static async updateUnreadMessages(threadId: string, messageIds: string[], count: number): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const conversationsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

        return db
            .update(conversationsTbl)
            .set(conversationsTbl.newMessagesCount, count)
            .set(conversationsTbl.newMessagesIds, messageIds)
            .where(conversationsTbl.threadId.eq(threadId))
            .exec();
    }
}
