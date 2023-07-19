"use strict";

import * as lf from "lovefield";

import {isLoggedIn, getCredentials, ICredentials} from "services/request";
import {APPLICATION} from "configs/constants";

import {openDB} from "idb";
import Log from "modules/messages/Log";

let dbVersion = 13

const initDB: any = async (name, version): Promise<any> => {
    const getDB = lf.schema.create(name, version);

    getDB
        .createTable("conversations")
        .addColumn('conversationId', lf.Type.STRING)
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('lastMessageId', lf.Type.STRING)
        .addColumn('typing', lf.Type.OBJECT)
        .addColumn('time', lf.Type.NUMBER)
        .addColumn('draft', lf.Type.STRING)
        .addColumn('newMessagesIds', lf.Type.OBJECT)
        .addColumn('newMessagesCount', lf.Type.NUMBER)
        .addNullable(['typing', 'newMessagesCount', 'draft'])
        .addIndex('idxConversationIdAsc', ['conversationId'], false, lf.Order.ASC)
        .addPrimaryKey(['threadId'], false);
    getDB
        .createTable("threads")
        .addColumn('threadInfo', lf.Type.OBJECT)
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('threadType', lf.Type.INTEGER)
        .addColumn('parentThreadId', lf.Type.STRING)
        .addColumn('hidden', lf.Type.BOOLEAN)
        .addColumn('threadName', lf.Type.STRING)
        .addNullable(['threadName', 'parentThreadId', 'hidden'])
        .addIndex('idxThreadNameAsc', ['threadName'], false, lf.Order.ASC)
        .addPrimaryKey(['threadId'], false);
    getDB
        .createTable("threadContacts")
        .addColumn('threadContactId', lf.Type.INTEGER)
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('contactId', lf.Type.STRING)
        .addPrimaryKey(['threadContactId'], true);
    getDB/*TODO maybe remove contactId from primary key */
        .createTable("contacts")
        .addColumn('contactId', lf.Type.STRING)
        .addColumn('mainId', lf.Type.INTEGER)
        .addColumn('parentMainId', lf.Type.INTEGER)
        .addColumn('childContactId', lf.Type.STRING)
        .addColumn('parentContactId', lf.Type.STRING)
        .addColumn('avatarCharacter', lf.Type.STRING)
        .addColumn('numbers', lf.Type.OBJECT)
        .addColumn('blocked', lf.Type.BOOLEAN)
        .addColumn('author', lf.Type.STRING)
        .addColumn('avatarUrl', lf.Type.STRING)
        .addColumn('imageUrl', lf.Type.STRING)
        .addColumn('avatar', lf.Type.OBJECT)
        .addColumn('avatarHash', lf.Type.STRING)
        .addColumn('image', lf.Type.OBJECT)
        .addColumn('status', lf.Type.STRING)
        .addColumn('singleProductContact', lf.Type.BOOLEAN)
        .addColumn('username', lf.Type.STRING)
        .addColumn('color', lf.Type.OBJECT)
        .addColumn('createdAt', lf.Type.NUMBER)
        .addColumn('firstName', lf.Type.STRING)
        .addColumn('email', lf.Type.STRING)
        .addColumn('lastName', lf.Type.STRING)
        .addColumn('name', lf.Type.STRING)
        .addColumn('phone', lf.Type.STRING)
        .addColumn('muted', lf.Type.BOOLEAN)
        .addColumn('unMuteloader', lf.Type.BOOLEAN)
        .addColumn('hold', lf.Type.BOOLEAN)
        .addColumn('isProductContact', lf.Type.BOOLEAN)
        .addColumn('label', lf.Type.BOOLEAN)
        .addColumn('saved', lf.Type.BOOLEAN)
        .addColumn('favorite', lf.Type.BOOLEAN)
        .addColumn('hashKey', lf.Type.STRING)
        .addColumn('identifier', lf.Type.STRING)
        .addColumn('internal', lf.Type.BOOLEAN)
        .addIndex('idxSavedAsc', ['saved'], false, lf.Order.DESC)
        .addNullable([
            'firstName',
            'email',
            'singleProductContact',
            'numbers',
            'mainId',
            'parentMainId',
            'lastName',
            'avatarUrl',
            'imageUrl',
            'status',
            'label',
            'favorite',
            'childContactId',
            'parentContactId',
            'avatar',
            'avatarHash',
            'hashKey',
            'identifier',
            'internal',
            'image',
            'hold',
            'unMuteloader'
        ])
        .addPrimaryKey(['contactId'], false);

    getDB
        .createTable("networks")
        .addColumn('callName', lf.Type.STRING)
        .addColumn('description', lf.Type.STRING)
        .addColumn('label', lf.Type.STRING)
        .addColumn('networkId', lf.Type.NUMBER)
        .addColumn('nickname', lf.Type.STRING)
        .addNullable([
            'callName',
            'description',
            'label',
            'nickname'
        ])
        .addPrimaryKey(['networkId'], false);

    getDB
        .createTable("messages")
        .addColumn('messageId', lf.Type.STRING)
        .addColumn('previousMessageId', lf.Type.STRING)
        .addColumn('conversationId', lf.Type.STRING)
        .addColumn('sid', lf.Type.STRING)
        .addColumn('pid', lf.Type.STRING)
        .addColumn('createdAt', lf.Type.STRING)
        .addColumn('creator', lf.Type.STRING)
        .addColumn('deleted', lf.Type.BOOLEAN)
        .addColumn('delivered', lf.Type.BOOLEAN)
        .addColumn('edited', lf.Type.BOOLEAN)
        .addColumn('fileLink', lf.Type.STRING)
        .addColumn('likeState', lf.Type.NUMBER)
        .addColumn('dislikes', lf.Type.NUMBER)
        .addColumn('likes', lf.Type.NUMBER)
        .addColumn('fileRemotePath', lf.Type.STRING)
        .addColumn('fileSize', lf.Type.INTEGER)
        .addColumn('hidden', lf.Type.BOOLEAN)
        .addColumn('repid', lf.Type.STRING)
        .addColumn('m_options', lf.Type.OBJECT)
        .addColumn('info', lf.Type.STRING)
        .addColumn('isDelivered', lf.Type.BOOLEAN)
        .addColumn('isSeen', lf.Type.BOOLEAN)
        .addColumn('seen', lf.Type.BOOLEAN)
        .addColumn('own', lf.Type.BOOLEAN)
        .addColumn('text', lf.Type.STRING)
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('time', lf.Type.INTEGER)
        .addColumn('type', lf.Type.STRING)
        .addColumn('status', lf.Type.BOOLEAN)
        .addColumn('link', lf.Type.BOOLEAN)
        .addColumn('linkTags', lf.Type.OBJECT)
        .addColumn('linkTitle', lf.Type.STRING)
        .addColumn('linkDescription', lf.Type.STRING)
        .addColumn('linkSiteURL', lf.Type.STRING)
        .addColumn('linkImagePreviewUrl', lf.Type.STRING)
        .addColumn('gifUrl', lf.Type.STRING)
        .addColumn('localPath', lf.Type.STRING)
        .addColumn('email', lf.Type.STRING)
        .addColumn('blobUri', lf.Type.STRING)
        .addNullable([
            'text',
            'type',
            'sid',
            'hidden',
            'pid',
            'email',
            'info',
            'fileSize',
            'fileRemotePath',
            "repid",
            "fileLink",
            "time",
            "status",
            "likes",
            "likeState",
            "dislikes",
            "previousMessageId",
            "deleted",
            "edited",
            "link",
            "linkTags",
            "linkTitle",
            "linkDescription",
            "linkSiteURL",
            "linkImagePreviewUrl",
            "gifUrl",
            "localPath",
            "m_options",
            "blobUri"
        ])
        // .addIndex('idxConversation_id', ['conversationId', 'messageId'], false, lf.Order.ASC)
        // .addUnique('idxUn', ['conversationId', 'messageId'])
        .addPrimaryKey(['messageId'], false);
    getDB
        .createTable("messageStatus")
        .addColumn('messageId', lf.Type.STRING)
        .addColumn('loadStatus', lf.Type.INTEGER)
        .addPrimaryKey(['messageId'], false);
    getDB
        .createTable("numbers")
        .addColumn('numberId', lf.Type.STRING)
        .addColumn('contactId', lf.Type.STRING)
        .addPrimaryKey(['numberId'], false);
    getDB
        .createTable("settings")
        .addColumn('settingsId', lf.Type.STRING)
        .addColumn('settingsType', lf.Type.STRING)
        .addColumn('value', lf.Type.STRING)
        .addPrimaryKey(['settingsId'], false);

    getDB
        .createTable("application")
        .addColumn('applicationId', lf.Type.STRING)
        .addColumn('value', lf.Type.OBJECT)
        .addPrimaryKey(['applicationId'], false);
    getDB
        .createTable("requests")
        .addColumn("xmlBuilder", lf.Type.STRING)
        .addColumn("createdAt", lf.Type.STRING)
        .addColumn("id", lf.Type.STRING)
        .addColumn("params", lf.Type.OBJECT)
        .addColumn("messageToSave", lf.Type.OBJECT)
        .addColumn("file", lf.Type.OBJECT)
        .addPrimaryKey(['id'], false)

    getDB
        .createTable("users")
        .addColumn("userId", lf.Type.STRING)
        .addColumn("username", lf.Type.STRING)
        .addColumn("phone", lf.Type.STRING)
        .addColumn("email", lf.Type.STRING)
        .addPrimaryKey(['userId'], false);


    getDB.createTable("profiles")
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('firstName', lf.Type.STRING)
        .addColumn('lastName', lf.Type.STRING)
        .addColumn('avatarColorBackground', lf.Type.STRING)
        .addColumn('avatarColorCharacter', lf.Type.STRING)
        .addColumn('fullName', lf.Type.STRING)
        .addNullable([
            'avatarColorBackground',
            'avatarColorCharacter',
            'firstName',
            'lastName',
            'fullName',
        ])
        .addPrimaryKey(['threadId'], false);


    // User can have multiple avatars
    getDB.createTable("avatars")
        .addColumn('threadId', lf.Type.STRING)
        .addColumn('fileName', lf.Type.STRING)
        .addColumn('small', lf.Type.OBJECT)
        .addColumn('original', lf.Type.OBJECT)
        .addNullable([
            'small',
            'original',
            'fileName',
        ])
        .addUnique("uidx_avatar_filename", ["threadId", "fileName"])
        .addPrimaryKey(['threadId'], false);


    getDB
        .createTable("stickerPackages")
        .addColumn("isDefaultPackage", lf.Type.BOOLEAN)
        .addColumn("description", lf.Type.STRING)
        .addColumn("isFeatured", lf.Type.BOOLEAN)
        .addColumn("isHidden", lf.Type.BOOLEAN)
        .addColumn("preview", lf.Type.STRING)
        .addColumn("price", lf.Type.STRING)
        .addColumn("free", lf.Type.STRING)
        .addColumn("avatar", lf.Type.STRING)
        .addColumn("name", lf.Type.STRING)
        .addColumn("packageId", lf.Type.STRING)
        .addPrimaryKey(['packageId'], false);

    getDB
        .createTable("stickerIcons")
        .addColumn("packageId", lf.Type.STRING)
        .addColumn("stickerIconId", lf.Type.STRING)
        .addColumn("file", lf.Type.OBJECT)
        .addPrimaryKey(['stickerIconId'], false);

    getDB
      .createTable("Pending")
      .addColumn('pending_id', lf.Type.INTEGER)
      .addColumn('pending_message', lf.Type.STRING)
      .addColumn('pending_time', lf.Type.INTEGER)
      .addColumn('pending_message_id', lf.Type.STRING)
      .addColumn('pending_is_internal', lf.Type.BOOLEAN)
      .addColumn('pending_type', lf.Type.INTEGER)
      .addColumn('pending_parent_id', lf.Type.INTEGER)
      .addColumn('pending_is_block_batch', lf.Type.BOOLEAN)
      .addColumn('pending_message_type', lf.Type.STRING)
      .addPrimaryKey(['pending_id'], true);


    async function onUpgrade(rawDb): Promise<any> {
        const dbVersion = rawDb.getVersion()
        let promises = [];

        if (dbVersion < 5) {
            promises.push(rawDb.addTableColumn('contacts', 'avatarHash'))
        }

        if (dbVersion < 7) {
            promises.push(rawDb.addTableColumn('contacts', 'hashKey'))
            promises.push(rawDb.addTableColumn('contacts', 'identifier'))
            promises.push(rawDb.addTableColumn('contacts', 'internal'))
        }


        if (dbVersion < 8) {
            promises.push(rawDb.addTableColumn('messages', 'linkTitle'))
            promises.push(rawDb.addTableColumn('messages', 'linkDescription'))
            promises.push(rawDb.addTableColumn('messages', 'linkSiteURL'))
            promises.push(rawDb.addTableColumn('messages', 'linkImagePreviewUrl'))
        }

        if (dbVersion < 9) {
            promises.push(rawDb.addTableColumn('messages', 'gifUrl'))
        }

        if (dbVersion < 10) {
            promises.push(rawDb.addTableColumn('messages', 'localPath'))
        }

        if (dbVersion < 11) {
            promises.push(rawDb.addTableColumn('messages', 'blobUri'))
        }

        if (dbVersion < 12) {
            promises.push(rawDb.addTableColumn('contacts', 'hold'))
        }

        return Promise.all(promises);
    }

    return getDB.connect({storeType: lf.schema.DataStoreType.INDEXED_DB, onUpgrade});
};



let db: lf.Database;
let cacheDB: any;


export async function getDB() {
    if (isLoggedIn()) {
        const credentials: ICredentials = getCredentials();
        const username: string = credentials["X-Access-Number"];
        const DATABASE_NAME = `${username}_${APPLICATION.VERSION}`;
        if (!db && username !== "") {
          db = await initDB(DATABASE_NAME, dbVersion)
        }
    }

    return db;
}


export async function getCacheDB() {
    if (isLoggedIn()) {
        const credentials: ICredentials = getCredentials();
        const username: string = credentials["X-Access-Number"];
        const DATABASE_NAME = `${username}_${APPLICATION.VERSION}_cache`;
        if (!cacheDB && username !== "") {
            cacheDB = await openDB(DATABASE_NAME, 1, {
                upgrade(database): void {
                    database.createObjectStore("cache");
                }
            });
        }
    }
    return cacheDB;
}


export async function initialize() {
    await Promise.all([getDB(), getCacheDB()]);
}


export function release() {
    db = null;
    cacheDB = null
}

export default {
    getDB,
    getCacheDB
}
