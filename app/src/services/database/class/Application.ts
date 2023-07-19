import database from "services/database";
import * as lf from "lovefield";
import {Row} from "lovefield";
import {APPLICATION} from "configs/constants";
import Table = lf.schema.Table;
import Log from "modules/messages/Log";

export const APPLICATION_PROPERTIES: any = {
    store: "store",
    user: "user",
    stickers: "stickers",
    stickerStore: "stickerStore",
    myStickers: "myStickers",
    appVersion: 'appVersion'
};

export default class IDBApplication {


    static async update(applicationId: string, data: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const application: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.APPLICATION);
        const row: Row = application
            .createRow({applicationId, value: data});
        Log.i(data, "IDBApplicationupdate")
        return db.insertOrReplace()
            .into(application)
            .values([row])
            .exec();
    }

    static async updateStickerPackages(applicationId: string, newStickerData: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const application: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.APPLICATION);

        const applicationRequest = await db.select()
            .from(application)
            .where(application.applicationId.eq(applicationId))
            .exec()
            .catch(err => Log.i(err));
        const stickerPackages = applicationRequest[0];

        if (stickerPackages.value) {
            stickerPackages.value = {...stickerPackages.value, ...newStickerData};
            return db.insertOrReplace()
                .into(application)
                .values([application.createRow(stickerPackages)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async updateStickersPreviewIcon(applicationId: string, previewIconData: any, id: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

        const applicationRequest = await db.select()
            .from(application)
            .where(application.applicationId.eq(applicationId))
            .exec()
            .catch(err => Log.i(err));

        const sticker = applicationRequest[0];

        if (sticker.value) {
            sticker.value[id].icon = previewIconData;

            return db.insertOrReplace()
                .into(application)
                .values([application.createRow(sticker)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async updateStickersPreviewImage(applicationId: string, previewImageData: any, id: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

        const applicationRequest = await db.select()
            .from(application)
            .where(application.applicationId.eq(applicationId))
            .exec()
            .catch(err => Log.i(err));

        const sticker = applicationRequest[0];

        if (sticker.value) {
            sticker.value[id].preview = previewImageData;

            return db.insertOrReplace()
                .into(application)
                .values([application.createRow(sticker)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async updateStickersIcons(applicationId, stickerIconsData, id): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const application = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

        const applicationRequest = await db.select()
            .from(application)
            .where(application.applicationId.eq(applicationId))
            .exec()
            .catch(err => Log.i(err));

        const sticker = applicationRequest[0];

        if (sticker.value) {
            sticker.value[id].icons = {...sticker.value[id].icons, ...stickerIconsData};

            return db.insertOrReplace()
                .into(application)
                .values([application.createRow(sticker)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async get(applicationId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const db: lf.Database = await database.getDB();
                const application: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.APPLICATION);
                const storeQuery: any = await db.select(application.value)
                    .from(application)
                    .where(application
                        .applicationId
                        .eq(applicationId))
                    .limit(1)
                    .exec();
                resolve(storeQuery.length === 0 ? undefined : storeQuery[0].value);
            } catch (e) {
                reject(e);
            }
        })
    }

    static async drop(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const threads: Table = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const threadContacts: Table = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const conversations: Table = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const application: Table = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);
        const messages: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const numbers: Table = schema.table(APPLICATION.DATABASE.TABLES.NUMBERS);
        const settings: Table = schema.table(APPLICATION.DATABASE.TABLES.SETTINGS);
        const networks: Table = schema.table(APPLICATION.DATABASE.TABLES.NETWORKS);
        const messageStatus: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);

        return await Promise.all([
            db.delete()
                .from(application)
                .exec(),

            db.delete()
                .from(threadContacts)
                .exec(),

            db.delete()
                .from(messageStatus)
                .exec(),

            db.delete()
                .from(messages)
                .exec(),

            db.delete()
                .from(networks)
                .exec(),

            db.delete()
                .from(conversations)
                .exec(),

            db.delete()
                .from(threads)
                .exec(),

            db.delete()
                .from(contacts)
                .exec(),

            db.delete()
                .from(numbers)
                .exec(),

            db.delete()
                .from(settings)
                .exec(),
        ]);

    }



    static async selectAllData(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();


        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const threadsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const networksTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.NETWORKS);
        const messagesTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const conversationsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const threadContactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const applicationTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);
        const numbersTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.NUMBERS);
        const settingsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.SETTINGS);
        const messageStatusTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const requestsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);

        const contactsQuery = await db
            .select()
            .from(contactsTbl)
            .exec();
        const networksQuery = await db
            .select()
            .from(networksTbl)
            .exec();
        const messagesQuery = await db
            .select()
            .from(messagesTbl)
            .exec();
        const conversationsQuery = await db
            .select()
            .from(conversationsTbl)
            .exec();
        const threadContactsQuery = await db
            .select()
            .from(threadContactsTbl)
            .exec();
        const settingsQuery = await db
            .select()
            .from(settingsTbl)
            .exec();
        const applicationQuery = await db
            .select()
            .from(applicationTbl)
            .exec();
        const numbersQuery = await db
            .select()
            .from(numbersTbl)
            .exec();
        const messageStatusQuery = await db
            .select()
            .from(messageStatusTbl)
            .exec();
        const requestsQuery = await db
            .select()
            .from(requestsTbl)
            .exec();

        const jsonData = {
            contacts: contactsQuery,
            networks: networksQuery,
            messages: messagesQuery,
            conversations: conversationsQuery,
            threadContacts: threadContactsQuery,
            settings: settingsQuery,
            application: applicationQuery,
            numbers: numbersQuery,
            messageStatus: messageStatusQuery,
            requests: requestsQuery,
        };

        return JSON.stringify(jsonData)
    }

}
