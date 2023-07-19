import * as lf from "lovefield";
import database from "services/database";
import {APPLICATION} from "configs/constants";
import {getInitials} from "helpers/DataHelper";
import {getColor} from "helpers/AppHelper";
import Table = lf.schema.Table;
import Log from "modules/messages/Log";

interface IUpdateContactProps {
    threadId: string;
    firstName?: string;
    lastName?: string;
    avatar?: Blob;
    image?: File | Blob;
    isDeleted?: boolean;
    imageHash?: string;
    email?: string;
    username?: string;
}

export default class ContactsModel {

    static async updateContact(params: IUpdateContactProps): Promise<any> {
        const db: lf.Database = await database.getDB();
        const contactsTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const profilesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.PROFILES);
        const avatarsTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.AVATARS);
        const contactQuery = db.update(contactsTbl);
        const contactInfoQuery = db.
        select(contactsTbl.username, contactsTbl.firstName, contactsTbl.lastName, contactsTbl.contactId, contactsTbl.name, contactsTbl.avatar, contactsTbl.image).from(contactsTbl);
        const contactInfoQueryRes:any = await contactInfoQuery.exec().then(function(rows) {
            return rows;
        });

        if(contactInfoQueryRes && contactInfoQueryRes.length !== 0) {
            if(params.threadId) {
                for(let i = 0; i < contactInfoQueryRes.length; i++) {
                    if (contactInfoQueryRes[i].contactId === params.threadId) {
                        if (params.firstName !== contactInfoQueryRes[i].firstName || params.lastName !== contactInfoQueryRes[i].lastName || params.isDeleted){
                            contactQuery.set(contactsTbl.firstName, params["firstName"]);
                            contactQuery.set(contactsTbl.lastName, params["lastName"]);
                            contactQuery.set(contactsTbl.name, `${params["firstName"]} ${params["lastName"]}`)
                        }
                        if (params.avatar && params.avatar !== contactInfoQueryRes[i].avatar) {
                            contactQuery.set(contactsTbl.avatar, params["avatar"])
                        }
                        if (params.image && params.image !== contactInfoQueryRes[i].image) {
                            contactQuery.set(contactsTbl.image, params["image"])
                        }
                    }
                }
            }
        }

        for (const param in params) {
            if (param === "avatar") {
                contactQuery.set(contactsTbl.avatar, params["avatar"]);
            }

            if (param === "image") {
                contactQuery.set(contactsTbl.image, params["image"]);
            }
        }

        const firstName: string = params.firstName;
        const lastName: string = params.lastName;
        const email: string = params.email;
        const username: string = params.username;
        const fullName: string = firstName && lastName ? `${firstName} ${lastName}`.trim() : (firstName || lastName || email || username);

        const profile: any = {
            threadId: params.threadId,
            firstName,
            lastName,
            avatarColorCharacter: getInitials(firstName, lastName),
            avatarColorBackground: getColor(),
            fullName
        };

        const avatar: any = {
            threadId: params.threadId,
            fileName: params.imageHash,
            small: params.imageHash === '' ? null : params.avatar,
            original: params.imageHash === '' ? null : params.avatar,
        };

        const profileQuery: any = await db
            .insertOrReplace()
            .into(profilesTbl)
            .values([profilesTbl.createRow(profile)])
            .exec();

        const avatarQuery: any = await db
            .insertOrReplace()
            .into(avatarsTbl)
            .values([avatarsTbl.createRow(avatar)])
            .exec();


        await Promise.all([
            profileQuery,
            avatarQuery,
            contactQuery
                .where(contactsTbl.contactId.eq(params.threadId))
                .exec()
        ]);
    }

    static async updateContactAvatar(params: IUpdateContactProps): Promise<any> {
        try {
            const db: lf.Database = await database.getDB();
            const contactsTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.CONTACTS);
            const contactQuery = db.update(contactsTbl);
            const contactInfoQuery = db.
            select(contactsTbl.avatar, contactsTbl.image, contactsTbl.avatarHash).from(contactsTbl);
            const contactInfoQueryRes:any = await contactInfoQuery.exec().then(function(rows) {
                return rows;
            });


            // if(contactInfoQueryRes && contactInfoQueryRes.length !== 0) {
            //     if(params.threadId) {
            //         for(let i = 0; i < contactInfoQueryRes.length; i++) {
            //             if (contactInfoQueryRes[i].contactId === params.threadId) {
            //                 if (params.avatar !== contactInfoQueryRes[i].avatar) {
            //                     contactQuery.set(contactsTbl.avatar, params["avatar"])
            //                 }
            //
            //                 if(params.imageHash !== contactInfoQueryRes[i].avatarHash) {
            //                     contactQuery.set(contactsTbl.avatarHash, params.imageHash)
            //                 }
            //             }
            //         }
            //     }
            // }

            for (const param in params) {

                // Log.i("contactInfoQueryRes -> ", contactInfoQueryRes)
                // Log.i("contactInfoQueryRes -> param = ", param)
                // if (param === "avatar") {
                //     contactQuery.set(contactsTbl.avatar, params["avatar"]);
                // }

                if (param === "imageHash") {
                    contactQuery.set(contactsTbl.avatarHash, params["imageHash"]);
                    contactQuery.set(contactsTbl.avatar, params["avatar"]);
                    contactQuery.set(contactsTbl.image, params["image"]);
                }

                // if (param === "image") {
                //     contactQuery.set(contactsTbl.image, params["image"]);
                // }
            }


            await Promise.all([
                contactQuery
                    .where(contactsTbl.contactId.eq(params.threadId))
                    .exec()
            ]);
        } catch (e) {
            Log.i("#############  updateContactAvatar error start  ##############")
            Log.i(e)
            Log.i("#############  updateContactAvatar error end  ##############")
        }

    }

    static async getAvatar(threadId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const avatarsTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.AVATARS);

        const result = await db.select()
            .from(avatarsTbl)
            .where(avatarsTbl.threadId.eq(threadId))
            .exec();

        return result[0];
    }
}
