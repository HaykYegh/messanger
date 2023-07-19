import database from "services/database";
import * as lf from "lovefield";
import {Order, Predicate, Row} from "lovefield";
import {
    ALL_LANGUAGES_REGEX,
    APPLICATION,
    LOAD_STATUS,
    MESSAGE_TYPES,
    MESSAGES_LIMIT,
    OFFLINE_MESSAGE_BODY
} from "configs/constants";

import {updateConversationLastMessage} from "modules/conversations/ConversationsActions";
import storeCreator from "helpers/StoreHelper";
import {Store} from "react-redux";
import Table = lf.schema.Table;
import Database = lf.schema.Database;
import Log from "modules/messages/Log";
import {getBlobUri} from "helpers/FileHelper";

export interface IMessage {
    blobUri?: string;
    conversationId: string;
    sid: string;
    pid: string;
    messageId: string;
    previousMessageId?: string,
    type: string;
    info: string;
    text: string;
    createdAt: Date;
    threadId: string;
    creator: string;
    fileLink: string;
    fileRemotePath?: any;
    m_options?: any;
    localPath?: any;
    hidden?: boolean;
    draft?: string;
    fileSize?: any;
    repid: string;
    own: boolean;
    delivered: boolean;
    isDelivered: boolean;
    isSeen: boolean;
    seen: boolean;
    deleted: boolean;
    edited: boolean;
    time: string;
    status: boolean;
    link: boolean;
    likes?: number;
    dislikes?: number;
    likeState?: number;
    linkTags: Array<string>;
}


export default class IDBMessage {

    static async getMessageById(messageId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const message = await db.select()
            .from(messagesTbl)
            .where(messagesTbl.messageId.eq(messageId))
            .limit(1)
            .exec();

        return message[0];
    }

    static async getPreviousMessage(threadId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db
            .getSchema();

        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const clause: Predicate = messages
            .threadId
            .eq(threadId);

        const message = await db.select()
            .from(messages)
            .orderBy(messages.time, lf.Order.DESC)
            .where(clause)
            .limit(1)
            .exec();

        return message[0];
    }

    //Use attempt create message action instead of calling create message
    static async createMessage(message: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const row: Row = messages.createRow(message);
        return db
            .insertOrReplace()
            .into(messages)
            .values([row])
            .exec()
            .catch(e => Log.i(e));

    }

    static async addOldMessage(data: any, isLast: boolean = false): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        if (isLast) {
            const message = await this.getMessageById(data.messageId);
            message && (data.previousMessageId = message.previousMessageId);
        }

        const row: Row = messages.createRow(data);
        return db
            .insertOrReplace()
            .into(messages)
            .values([row])
            .exec().catch(e => Log.i(e));

    }

    static async addOldMessages(messages: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const tblMessages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const rows: Array<Row> = [];
        await new Promise((resolve, reject) => {
            messages.map(async (item) => {
                if (item.isLast) {
                    const message = await IDBMessage.getMessageById(item.message.messageId);
                    message && (item.message.previousMessageId = message.previousMessageId);
                }
                rows.push(tblMessages.createRow(item.message));
                if (item.isLast) {
                    resolve();
                }
            })
        });

        if (rows && rows.length > 0) {
            return db
                .insertOrReplace()
                .into(tblMessages)
                .values(rows)
                .exec().catch(e => Log.i(e));
        }
    }

    static async addMessageStatus(messageId: string, message: any) {
        const db: lf.Database = await database.getDB();
        const schema = db.getSchema();
        const messageStatus: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const messages = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);

        // if (message.loadStatus == LOAD_STATUS.UPLOAD_CANCEL) {
        //
        //     return db
        //         .delete()
        //         .from(messages)
        //         .where(messages.messageId.eq(messageId))
        //         .exec();
        //
        // } else {
        //     const row: Row = messageStatus.createRow({messageId: messageId, loadStatus: message.loadStatus});
        //     return db
        //         .insertOrReplace()
        //         .into(messageStatus)
        //         .values([row])
        //         .exec().catch(e => console.log(e));
        // }
        const row: Row = messageStatus.createRow({messageId: messageId, loadStatus: message.loadStatus});
        return db
            .insertOrReplace()
            .into(messageStatus)
            .values([row])
            .exec().catch(e => Log.i(e));

    }

    static async getMesssagesStatus(messagesIds: Array<string>) {
        const db: lf.Database = await database.getDB();
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        return db.select()
            .from(messageStatus)
            .where(messageStatus.messageId.in(messagesIds))
            .exec();
    }

    static async messageBulkUpdateDimensions(updateRows: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const query = await db.update(schema).set(schema.m_options, lf.bind(1)).where(schema.messageId.eq(lf.bind(0)));
        for (let i = 0; i < updateRows.length; i++) {
            await query.bind([updateRows[i].msgId, updateRows[i].value]).exec();
        }
    }

    static async update(messageId: string, message: any): Promise<any> {
        try {
            const db: lf.Database = await database.getDB();
            const schema: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
            const conversations = db.getSchema().table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

            const store: Store<any> = storeCreator.getStore();

            const query = db.update(schema);
            Object.keys(message).map(item => {
                schema[item] ? query.set(schema[item], message[item]) : query.set(schema.messageId, messageId);
            });
            query.where(schema.messageId.eq(messageId));
            const success = await query.exec();


            if (success && (!message.hasOwnProperty("edited") && !message.hasOwnProperty("deleted"))) {
                const lastMessageConversation: any = await db.select()
                  .from(conversations)
                  .where(lf.op.and(
                    conversations.lastMessageId.eq(messageId)))
                  .limit(1)
                  .exec();

                if (lastMessageConversation && lastMessageConversation.length > 0) {
                    store.dispatch(updateConversationLastMessage(lastMessageConversation[0].threadId, lastMessageConversation[0].messageId || lastMessageConversation[0].lastMessageId, message));
                }
            }
        } catch(e) {
            Log.i(e);
        }
    }

    static async updateBlobUrls(): Promise<any> {
        try {
            const db: lf.Database = await database.getDB();
            const schema: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
            const conversations = db.getSchema().table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);

            const store: Store<any> = storeCreator.getStore();

            const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

            const messages: any = await db.select()
                .from(messagesTbl)
                .exec();

            const query = db.update(schema);
            // query.set(schema.blobUri, null)
            // query.set(schema.gifUrl, null)
            messages.map(message => {

                if (message.localPath) {
                    const blobUri = getBlobUri(message.localPath)
                    IDBMessage.update(message.messageId, {blobUri, gifUrl: blobUri})
                }


            });

        } catch(e) {
            Log.i(e);
        }
    }

    static async delete(messageId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);
        return db
            .update(schema)
            .set(schema.deleted, true)
            .where(schema.messageId.eq(messageId))
            .exec();
    }

    static async localDelete(messageId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db
            .delete()
            .from(schema)
            .where(schema.messageId.eq(messageId))
            .exec();
    }

    static async localDeleteMessages(messageIds: Array<string>): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db
            .delete()
            .from(schema)
            .where(schema.messageId.in(messageIds))
            .exec();
    }

    static async findAll(threadId: string, offset: number, limit: number, types?: any[]): Promise<any> {

        const db: lf.Database = await database.getDB();
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const messages: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .where(lf.op.and(
                lf.op.or(messages.type.in(types), lf.op.and(messages.type.eq(MESSAGE_TYPES.text), messages.link.eq(true))),
                messages.threadId.eq(threadId),
                messages.deleted.eq(false)))
            .orderBy(messages.createdAt, lf.Order.DESC)
            .skip(offset)
            .limit(limit)
            .exec();

    }

    static async getMessageByText(conversationId: string, offset: number, searchText: string, limit: number = 50, search: boolean = false): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();
        const messages: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const cleanedText = searchText.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").replace(ALL_LANGUAGES_REGEX, "").trim();
        Log.i(searchText, "searchText")
        Log.i(cleanedText, "cleanedText")


        if(cleanedText === "") {
            Log.i("hello")
            return []
        }

        const textMatchClause: Predicate = messages.text.match(new RegExp(`${cleanedText}`, "i"));
        const fileMatchClause: Predicate = messages.info.match(new RegExp(`${cleanedText}`, "i"));

        const clause: Predicate = lf.op.or(
            lf.op.and(messages.type.in([MESSAGE_TYPES.text, MESSAGE_TYPES.image, MESSAGE_TYPES.contact_with_info, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file]), textMatchClause, messages.text.neq(OFFLINE_MESSAGE_BODY)),
            lf.op.and(messages.type.eq(MESSAGE_TYPES.file), fileMatchClause)
        );

        const convId = search ? messages.threadId.neq(null) : messages.threadId.eq(conversationId);

        Log.i(textMatchClause, 'textMatchClause')

        Log.i(conversationId, 'conversationId')
        return db.select()
            .from(messages)
            .where(lf.op.and(
                clause,
                convId,
                messages.deleted.eq(false)))
            .orderBy(messages.createdAt, lf.Order.DESC)
            .limit(limit)
            .skip(offset)
            .exec();
    }

    static async getMessageByStartTime(threadId: string, limit: number = 50, messageTime: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .where(lf.op.and(messages.threadId.eq(threadId),
                messages.time.gt(messageTime)))
            .orderBy(messages.time, lf.Order.ASC)
            .limit(limit)
            .exec();
    }

    static async getMessageByStartTimeTop(threadId: string, limit: number = 25, messageTime: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const time = messageTime;

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .where(lf.op.and(messages.threadId.eq(threadId),
                messages.time.lt(time)))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async getTopSearchMessages(threadId: string, searchedMessageId: string = "", limit: number = 20, searchedMessage?: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        let time = 0;
        let realThreadId = "";

        if (searchedMessage && Object.keys(searchedMessage).length > 0) {
            time = searchedMessage.time;
            realThreadId = searchedMessage.threadId;

        } else if (searchedMessageId) {
            const timeQuery = await db.select()
                .from(messages)
                .where(messages.messageId.eq(searchedMessageId))
                .exec();

            if (timeQuery.length > 0) {
                time = timeQuery[0]["time"];
                realThreadId = timeQuery[0]["threadId"];
            }
        }

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .where(lf.op.and(messages.threadId.eq(realThreadId ? realThreadId : threadId),
                messages.time.lte(time)))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async getBottomSearchMessages(threadId: string, searchedMessageId: string = "", limit: number = 20, searchedMessage?: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        let time = 0;
        let realThreadId = "";

        if (searchedMessage && Object.keys(searchedMessage).length > 0) {
            time = searchedMessage.time;
            realThreadId = searchedMessage.threadId;

        } else if (searchedMessageId) {
            const timeQuery = await db.select()
                .from(messages)
                .where(messages.messageId.eq(searchedMessageId))
                .exec();

            if (timeQuery.length > 0) {
                time = timeQuery[0]["time"];
                realThreadId = timeQuery[0]["threadId"];
            }
        }

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .where(lf.op.and(messages.threadId.eq(realThreadId ? realThreadId : threadId),
                messages.time.gt(time)))
            .orderBy(messages.time, lf.Order.ASC)
            .limit(limit)
            .exec();
    }

    static async getNewerMessages(conversationId: string, threadId: string, lastMessageId: string = "", limit: number = 50, lastMessage?: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const threads: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.THREADS);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        let time = 3000000000000;
        let realThreadId = "";

        if (lastMessage && Object.keys(lastMessage).length > 0) {
            time = lastMessage.time;
            realThreadId = lastMessage.threadId;

        } else if (lastMessageId) {
            const timeQuery = await db.select()
                .from(messages)
                .where(
                    messages.messageId.eq(lastMessageId))
                .exec();

            if (timeQuery.length > 0) {
                time = timeQuery[0]["time"];
                realThreadId = timeQuery[0]["threadId"];
            }
        }

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .leftOuterJoin(threads, threads.threadId.eq(repMessages.threadId))
            .where(lf.op.and(messages.threadId.eq(realThreadId ? realThreadId : threadId),
                messages.time.gt(time)))
            .orderBy(messages.time, lf.Order.ASC)
            .limit(limit)
            .exec();
    }

    static async getMessageCount(threadId: string, types?: Array<any>): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messages: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db.select(lf.fn.count(messages.id).as('count'))
            .from(messages)
            .where(lf.op.and(
                messages.threadId.eq(threadId),
                messages.type.in(types),
                messages.deleted.eq(false)))
            .exec();

    }

    static async updateUploadMessagesStatus() {
        const db: lf.Database = await database.getDB();
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        await db.update(messageStatus)
            .set(messageStatus.loadStatus, LOAD_STATUS.UPLOAD_CANCEL)
            .where(messageStatus.loadStatus.eq(LOAD_STATUS.LOAD_START))
            .exec();
        /*compressing*/
        await db.update(messageStatus)
            .set(messageStatus.loadStatus, LOAD_STATUS.OPTIMISE_CANCEL)
            .where(messageStatus.loadStatus.eq(LOAD_STATUS.OPTIMISE_START))
            .exec();
    }

    static async getOldMessages(conversationId: string, threadId: string, lastMessageId: string = "", limit: number = 50, lastMessage?: any) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const threads: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.THREADS);
        const repMessages: Table = messages.as('repMessages');
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        let time = 3000000000000;
        let realThreadId = "";
        if (lastMessage && Object.keys(lastMessage).length > 0) {
            time = lastMessage.time;
            realThreadId = lastMessage.threadId;
        } else if (lastMessageId) {
            const timeQuery = await db.select()
                .from(messages)
                .where(
                    messages.messageId.eq(lastMessageId))
                .exec();
            if (timeQuery.length > 0) {
                time = timeQuery[0]["time"];
                realThreadId = timeQuery[0]["threadId"];
            }
        }

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .leftOuterJoin(repMessages, messages.repid.eq(repMessages.messageId))
            .leftOuterJoin(threads, threads.threadId.eq(repMessages.threadId))
            // .where(lf.op.and(messages.threadId.eq(realThreadId || threadId)))
            .where(lf.op.and(messages.threadId.eq(realThreadId || threadId),
                messages.time.lte(time)))
            // .where(lf.op.and(messages.threadId.eq(realThreadId || threadId)))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async getPrivateChatOldMessages(conversationId: string, threadId: string, lastMessageId: string = "", limit: number = 50) {
        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const messageStatus: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        let time = 3000000000000;
        let realThreadId = "";
        if (lastMessageId) {
            const timeQuery = await db.select(messages.time, messages.threadId)
                .from(messages)
                .where(lf.op.and(
                    messages.messageId.eq(lastMessageId)))
                .exec();
            if (timeQuery.length > 0) {
                time = timeQuery[0]["time"];
                realThreadId = timeQuery[0]["threadId"];
            }
        }

        return db.select()
            .from(messages)
            .leftOuterJoin(messageStatus, messages.messageId.eq(messageStatus.messageId))
            .where(lf.op.and(messages.threadId.eq(realThreadId ? realThreadId : threadId),
                messages.time.lte(time), messages.sid.eq("1")))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async getSharedMediaMessagesCount(threadId: string, types: Array<any>): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messages: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db.select(lf.fn.count(messages.id).as("count"))
            .from(messages)
            .where(lf.op.and(
                messages.threadId.eq(threadId),
                messages.type.in(types),
                messages.deleted.eq(false)))
            .exec();
    }

    // static async bulkInsert({messageId, }): Promise<any> {
    //
    //     const db: lf.Database = await database.getDB();
    //     const messages: Table = db
    //         .getSchema()
    //         .table(APPLICATION.DATABASE.TABLES.MESSAGES);
    //
    //     return db.select()
    //         .from(messages)
    //         .where(lf.op.and(
    //             messages.threadId.eq(threadId),
    //             messages.type.in(types),
    //             messages.deleted.eq(false)))
    //         .orderBy(messages.createdAt, lf.Order.DESC)
    //         .skip(offset)
    //         .limit(limit)
    //         .exec();
    //
    // }


    // refactored


    static async retrieveMediaCount(threadId: string, types: Array<any> = [MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file]): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messages: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const result: any[] = await db.select(lf.fn.count(messages.id).as("count"))
            .from(messages)
            .where(lf.op.and(
                messages.threadId.eq(threadId),
                messages.type.in(types),
                messages.deleted.eq(false)))
            .exec();

        if (result[0] && result[0].count) {
            return result[0].count
        }

        return 0

    }


    static async listPreviousMessages(threadId: string, messageId: string = null): Promise<any> {

        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const limit: number = MESSAGES_LIMIT;

        let currentMessage: any;

        if (messageId) {
            currentMessage = await db.select()
                .from(messages)
                .where(lf.op.and(
                    messages.threadId.eq(threadId),
                    messages.messageId.eq(messageId),
                    messages.deleted.eq(false))
                )
                .orderBy(messages.time, lf.Order.DESC)
                .limit(1)
                .exec();
        } else {
            currentMessage = await db.select()
                .from(messages)
                .where(lf.op.and(
                    messages.threadId.eq(threadId),
                    messages.deleted.eq(false)))
                .orderBy(messages.time, lf.Order.DESC)
                .limit(1)
                .exec();

        }


        if (!currentMessage[0]) {
            return [];
        }


        return db.select()
            .from(messages)
            .where(lf.op.and(
                messages.threadId.eq(threadId),
                messages.time.lt(currentMessage[0].time),
                messages.deleted.eq(false)))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async listNextMessages(threadId: string, messageId: string = null): Promise<any> {

        const db: lf.Database = await database.getDB();
        const messages: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const limit: number = MESSAGES_LIMIT;

        let currentMessage: any;

        if (messageId) {
            currentMessage = await db.select()
                .from(messages)
                .where(lf.op.and(
                    messages.threadId.eq(threadId),
                    messages.messageId.eq(messageId),
                    messages.deleted.eq(false))
                )
                .orderBy(messages.time, lf.Order.DESC)
                .limit(1)
                .exec();
        } else {
            currentMessage = await db.select()
                .from(messages)
                .where(lf.op.and(
                    messages.threadId.eq(threadId),
                    messages.deleted.eq(false)))
                .orderBy(messages.time, lf.Order.DESC)
                .limit(1)
                .exec();

        }


        if (!currentMessage[0]) {
            return [];
        }


        return db.select()
            .from(messages)
            .where(lf.op.and(
                messages.threadId.eq(threadId),
                messages.time.lt(currentMessage[0].time),
                messages.deleted.eq(false)))
            .orderBy(messages.time, lf.Order.DESC)
            .limit(limit)
            .exec();
    }

    static async selectMessages(params: { threadId: string, messageId: string, toTopDirection: boolean, skip?: number }): Promise<any> {
        const {threadId, messageId = null, toTopDirection = false} = params;
        const db: lf.Database = await database.getDB();

        const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const messagesStatusTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const repMessagesTbl: Table = messagesTbl.as('repMessages');

        const limit: number = MESSAGES_LIMIT;

        const messagesConditions: any[] = [messagesTbl.threadId.eq(threadId)];

        let pointOfCreatedAt: number = null;
        let defaultOrdering: Order = lf.Order.DESC;

        if (messageId) {

            const currentMessages: any[] = await db
                .select(
                    messagesTbl.threadId.as("threadId"),
                    messagesTbl.time.as("time")
                )
                .from(messagesTbl)
                .where(lf.op.and(
                    messagesTbl.threadId.eq(threadId),
                    messagesTbl.messageId.eq(messageId)
                ))
                .orderBy(messagesTbl.time, lf.Order.ASC)
                .limit(1)
                .exec();

            const currentMessage: any = currentMessages[0];

            if (currentMessage) {
                pointOfCreatedAt = currentMessage.time;
            }

            if (toTopDirection) {
                messagesConditions.push(messagesTbl.time.lte(pointOfCreatedAt));
            } else {
                messagesConditions.push(messagesTbl.time.gte(pointOfCreatedAt));
                defaultOrdering = lf.Order.ASC;
            }
        }


        const messagesPredicate: Predicate = lf.op.and.apply(null, messagesConditions);
        const messagesInfo: any[] = await db.select()
            .from(messagesTbl)
            .leftOuterJoin(messagesStatusTbl, messagesTbl.messageId.eq(messagesStatusTbl.messageId))
            .leftOuterJoin(repMessagesTbl, messagesTbl.repid.eq(repMessagesTbl.messageId))
            .where(messagesPredicate)
            .orderBy(messagesTbl.time, defaultOrdering)
            .limit(limit)
            .exec();

        const messagesMap: { [key: string]: IMessage } = {};
        const unreadMessageIds: string[] = [];
        //
        for (let i = 0; i < messagesInfo.length; i++) {
            const message: IMessage = messagesInfo[i].messages;

            const messageStatus: any = messagesInfo[i].messageStatus;
            message["loadStatus"] = messageStatus.loadStatus;
            messagesMap[message.messageId] = message;
            if (!message.isSeen) {
                const messageId: string = message.messageId;
                unreadMessageIds.push(messageId);
            }
        }

        // unreadMessagesCount -= unreadMessages.length;

        return {messagesMap, unreadMessageIds};
    }

    static async updateMessageSelfSeen(messageIds: string[], isSeen: boolean = true): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

        return db
            .update(messagesTbl)
            .set(messagesTbl.isSeen, isSeen)
            .where(messagesTbl.messageId.in(messageIds))
            .exec();
    }

}
