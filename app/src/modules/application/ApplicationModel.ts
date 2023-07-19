import * as lf from "lovefield";
import database from "services/database";
import {APPLICATION, MESSAGE_TYPES, SHARED_MEDIA_LIMIT} from "configs/constants";
import Table = lf.schema.Table;
import {logger} from "helpers/AppHelper";
import {SHARED_MEDIA_TYPES} from "configs/constants";
import set = Reflect.set;
import Log from "modules/messages/Log";
import {getBlobUri} from "helpers/FileHelper";


export default class ApplicationModel {

    private static mediaTypes: any = {
        media: [
            MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file
        ],
        file: [
            MESSAGE_TYPES.file, MESSAGE_TYPES.voice
        ]
    };

    static async selectSharedMediaCount(threadId): Promise<any> {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const mediaTypes: string[] = [...ApplicationModel.mediaTypes.media, ...ApplicationModel.mediaTypes.file];

        const result: any[] = await db.select(lf.fn.count(messagesTbl.id).as("count"))
            .from(messagesTbl)
            .where(lf.op.and(
                messagesTbl.threadId.eq(threadId),
                messagesTbl.deleted.eq(false),
                lf.op.or(
                    messagesTbl.link.eq(true),
                    messagesTbl.type.in(mediaTypes)
                ),
            ))
            .exec();
        if (result[0] && result[0].count) {
            return result[0].count
        }
        return 0
    }


    static async selectSharedMediaCountByType(threadId: string, types?: string[]): Promise<any> {

        if (!types) {
            logger("unknown types");
            return 0
        }

        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const conditions: any[] = [];

        if (types.includes(SHARED_MEDIA_TYPES.MEDIA)) {
            conditions.push(lf.op.or(messagesTbl.type.in([...ApplicationModel.mediaTypes.media])))
        }

        if (types.includes(SHARED_MEDIA_TYPES.FILE)) {
            conditions.push(lf.op.or(messagesTbl.type.in([...ApplicationModel.mediaTypes.file])))
        }

        if (types.includes(SHARED_MEDIA_TYPES.LINK)) {
            conditions.push(lf.op.or(
                lf.op.and(messagesTbl.type.eq(MESSAGE_TYPES.text), messagesTbl.link.eq(true))
            ))
        }

        if (conditions.length === 0) {
            logger("media count type error");
            return 0
        }

        conditions.push(messagesTbl.threadId.eq(threadId));
        conditions.push(messagesTbl.deleted.eq(false));

        const result: any[] = await db.select(lf.fn.count(messagesTbl.id).as("count"))
            .from(messagesTbl)
            .where(lf.op.and.apply(null, conditions))
            .exec();

        if (result[0] && result[0].count) {
            return result[0].count
        }

        logger("media count undefined result");
        return 0
    }

    static async selectSharedMediaByType(threadId: string, type: string, skip: number): Promise<any> {

        if (!type) {
            logger("unknown type");
            return 0
        }

        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const messagesStatusTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);

        const conditions: any[] = [];

        if (type === SHARED_MEDIA_TYPES.MEDIA) {
            conditions.push(lf.op.or(messagesTbl.type.in([...ApplicationModel.mediaTypes.media])))
        }

        if (type === SHARED_MEDIA_TYPES.FILE) {
            conditions.push(lf.op.or(messagesTbl.type.in([...ApplicationModel.mediaTypes.file])))
        }

        if (type === SHARED_MEDIA_TYPES.LINK) {
            conditions.push(lf.op.or(
                lf.op.and(messagesTbl.type.eq(MESSAGE_TYPES.text), messagesTbl.link.eq(true))
            ))
        }
        if (conditions.length === 0) {
            logger("media count type error");
            return 0
        }

        conditions.push(messagesTbl.threadId.eq(threadId));
        conditions.push(messagesTbl.deleted.eq(false));

        const nextSkip1 = skip * SHARED_MEDIA_LIMIT;

        const nextSkip = 0;


        const result: any[] = await db.select()
            .from(messagesTbl)
            .leftOuterJoin(messagesStatusTbl, messagesTbl.messageId.eq(messagesStatusTbl.messageId))
            .where(lf.op.and.apply(null, conditions))
            .orderBy(messagesTbl.time, lf.Order.DESC)
            // .orderBy(messagesTbl.time, lf.Order.DESC)
            // .orderBy(messagesTbl.createdAt, lf.Order.ASC)
            .skip(nextSkip1)
            .limit(SHARED_MEDIA_LIMIT)
            .exec();

        if (result.length === 0) {
            logger("media count undefined result");
            return;
        }
        const sharedMediaRecordsMap: any = {};
        for (const media of result) {
            if (media.messages.localPath) {
                media.messages.gifUrl = getBlobUri(media.messages.localPath)
            }
            sharedMediaRecordsMap[media.messages.messageId] = media
        }
        return sharedMediaRecordsMap;
    }

    static async deleteSharedMediaMessages(messageIds: string[]) {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const messagesStatusTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);

        const messageQuery = db
            .update(messagesTbl)
            .set(messagesTbl.deleted, true)
            .where(messagesTbl.messageId.in(messageIds))
            .exec();

        const messageStatusQuery = db
            .update(messagesStatusTbl)
            .set(messagesTbl.deleted, true)
            .where(messagesTbl.messageId.in(messageIds))
            .exec();

        await Promise.all([messageQuery, messageStatusQuery])
    }

}
