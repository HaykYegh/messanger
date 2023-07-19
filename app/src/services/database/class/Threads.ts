"use strict";

import * as lf from "lovefield";

import {APPLICATION} from "configs/constants";
import database from "services/database";

export default class IDBThreads {

    static async selectGroupMembers(params: { groupId: string }): Promise<any> {

        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const tblContacts: lf.schema.Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const tblThreadContacts: lf.schema.Table = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

        const recordsQuery: any = await db.select()
            .from(tblThreadContacts)
            .innerJoin(tblContacts, tblThreadContacts.contactId.eq(tblContacts.contactId))
            .where(tblThreadContacts.threadId.eq(params.groupId))
            .exec();

        const records: any = {};

        for (const record of recordsQuery) {
            records[record.contacts.contactId] = record.contacts;
        }

        return {records};
    }

    static async selectGroup(params: { groupId: string }): Promise<any> {

        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const tblThreads: lf.schema.Table = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        const recordsQuery: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(params.groupId))
            .exec();

        return {records: recordsQuery[0]};

    }

    static async isThreadContactExist(params: { contactId: string }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const tblThreadContacts: lf.schema.Table = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);

        const recordsQuery: any = await db.select()
            .from(tblThreadContacts)
            .where(tblThreadContacts.contactId.eq(params.contactId))
            .exec();
        return !!recordsQuery[0];

    }

}
