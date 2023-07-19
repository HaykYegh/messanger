import * as lf from "lovefield";
import {Transaction} from "lovefield";

import {APPLICATION} from "configs/constants";
import database from "services/database";
import Table = lf.schema.Table;
import {APPLICATION_PROPERTIES} from "services/database/class/Application";
import Log from "modules/messages/Log";

export default class UserModel {

    static async signOut(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const applicationTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);

        return await db.delete()
            .from(applicationTbl)
            .where(applicationTbl.applicationId.eq(APPLICATION_PROPERTIES.user))
            .exec()

        // return await Promise.all([
        //     db.delete()
        //         .from(applicationTbl)
        //         .exec(),
        // ]);
    }

    static async purgeUser() {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const applicationTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.APPLICATION);
        const avatarsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.AVATARS);
        const conversationsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONVERSATIONS);
        const messageStatusTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGE_STATUS);
        const messagesTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.MESSAGES);
        const profilesTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.PROFILES);
        const threadsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.THREADS);
        const threadContactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.THREAD_CONTACTS);
        const usersTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.USERS);

        const tx: Transaction = db.createTransaction();

        tx.begin([usersTbl, messagesTbl, conversationsTbl, threadsTbl, profilesTbl, avatarsTbl, applicationTbl, threadContactsTbl, messageStatusTbl]).then(() => {
            // delete application
            const applicationQuery: lf.query.Delete = db.delete().from(applicationTbl).where(applicationTbl.applicationId.eq(APPLICATION_PROPERTIES.user));
            return tx.attach(applicationQuery);
        }).then(() => {
            // delete messages
            const messagesQuery: lf.query.Delete = db.delete().from(messagesTbl);
            return tx.attach(messagesQuery);
        }).then(() => {
            // delete conversations
            const conversationsQuery: lf.query.Delete = db.delete().from(conversationsTbl);
            return tx.attach(conversationsQuery);
        }).then(() => {
            // delete threads
            const threadsQuery: lf.query.Delete = db.delete().from(threadsTbl);
            return tx.attach(threadsQuery);
        }).then(() => {
            // delete profiles
            const profilesQuery: lf.query.Delete = db.delete().from(profilesTbl);
            return tx.attach(profilesQuery);
        }).then(() => {
            // delete avatars
            const avatarsQuery: lf.query.Delete = db.delete().from(avatarsTbl);
            return tx.attach(avatarsQuery);
        }).then(() => {
            // delete users
            const usersQuery: lf.query.Delete = db.delete().from(usersTbl);
            return tx.attach(usersQuery);
        }).then(() => {
            // delete message status
            const messageStatusQuery: lf.query.Delete = db.delete().from(messageStatusTbl);
            return tx.attach(messageStatusQuery);
        }).then(() => {
            // delete thread contacts
            const threadContactsQuery: lf.query.Delete = db.delete().from(threadContactsTbl);
            return tx.attach(threadContactsQuery);
        }).then(() => {
            Log.i("commit purgeUser");
            return tx.commit();
        }).catch(e => {
            Log.i(e);
            return tx.rollback();
        });
    }

}
