import database from "services/database";
import * as lf from "lovefield";
import {APPLICATION} from "configs/constants";
import Database = lf.schema.Database;
import Log from "modules/messages/Log";


export default class IDBPublicChat {

    static async setFollowers(channelId, followers) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let thread: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(channelId))
            .exec()
            .catch(e => Log.i(e));

        if(thread.length > 0) {
            thread[0].threadInfo.followers = followers;

            return db.insertOrReplace()
                .into(tblThreads)
                .values([tblThreads.createRow(thread[0])])
                .exec()
                .catch(e => Log.i(e));

        }
    }

    static async setFollowersCount(channelId, count) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let thread: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(channelId))
            .exec()
            .catch(e => Log.i(e));

        if(thread.length > 0) {
            thread[0].threadInfo.followersCount = count;

            return db.insertOrReplace()
                .into(tblThreads)
                .values([tblThreads.createRow(thread[0])])
                .exec()
                .catch(e => Log.i(e));

        }
    }

    static async addFollower(channelId, username) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let thread: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(channelId))
            .exec()
            .catch(e => Log.i(e));

        if(thread.length > 0) {
            const channelInfo = thread[0].threadInfo;

            channelInfo.followers.push(username);
            ++channelInfo.followersCount;

            return db.insertOrReplace()
                .into(tblThreads)
                .values([tblThreads.createRow(thread[0])])
                .exec()
                .catch(e => Log.i(e));

        }
    }

    static async revokeAdmin(channelId, username) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let thread: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(channelId))
            .exec()
            .catch(e => Log.i(e));

        if(thread.length > 0) {
            const channelInfo = thread[0].threadInfo;
            const index = channelInfo.admins.indexOf(username);

            channelInfo.admins.splice(index, 1);
            channelInfo.followers.push(username);

            return db.insertOrReplace()
                .into(tblThreads)
                .values([tblThreads.createRow(thread[0])])
                .exec()
                .catch(e => Log.i(e));

        }
    }

    static async addAdmin(channelId, username) {
        const db: lf.Database = await database.getDB();
        const schema: Database = db.getSchema();

        const tblThreads = schema.table(APPLICATION.DATABASE.TABLES.THREADS);

        let thread: any = await db.select()
            .from(tblThreads)
            .where(tblThreads.threadId.eq(channelId))
            .exec()
            .catch(e => Log.i(e));

        if(thread.length > 0) {
            const channelInfo = thread[0].threadInfo;

            channelInfo.admins.push(username);
            ++channelInfo.followersCount;
            channelInfo.followers = channelInfo.followers.filter(follower => follower !== username);

            return db.insertOrReplace()
                .into(tblThreads)
                .values([tblThreads.createRow(thread[0])])
                .exec()
                .catch(e => Log.i(e));

        }
    }
}
