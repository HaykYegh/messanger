import database from "services/database";
import * as lf from "lovefield";
import {Predicate, Row} from "lovefield";
import {APPLICATION} from "configs/constants";
import {defaultState as contactDefaultState} from "modules/contacts/ContactsReducer";
import {getConversationType} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import Table = lf.schema.Table;
import Log from "modules/messages/Log";

export interface IDBxContact {
    isProductContact: boolean;
    avatarCharacter: string;
    contactId: string;
    avatarUrl: string;
    firstName: string;
    imageUrl: string;
    blocked: boolean;
    username: string;
    lastName: string;
    createdAt: number;
    favorite: false;
    saved: boolean;
    muted: boolean;
    author: string;
    status: string;
    phone: string;
    color: IColor;
    name: string;
}

export interface IColor {
    numberColor: string;
    avatarColor: string;
}

export default class IDBContact {

    static async createContact(contact: IDBxContact): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const row: Row = contacts
            .createRow(contact);

        const addedContact = await db.insertOrReplace()
            .into(contacts)
            .values([row])
            .exec();
        return addedContact[0];
    }

    static async getContactById(contactId: any): Promise<any> {

        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const clause: Predicate = contacts
            .contactId
            .eq(contactId);

        const contact = await db.select()
            .from(contacts)
            .where(clause)
            .limit(1)
            .exec();
        return contact[0];
    }

    static  async getContactByEmailAndName(email: any, name: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const emailClause: Predicate = contacts.email.eq(email);
        const nameClause:  Predicate = contacts.name.eq(name);
        const contact = await db.select()
            .from(contacts)
            .where(lf.op.and(emailClause, nameClause))
            .limit(1).
            exec();
        return contact[0];
    }

    static async getBlockedContacts(limit: number): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const blockedContacts: any = {};

        const blockedContactsQuery: any = await db.select()
            .from(contacts)
            .where(contacts.blocked.eq(true))
            .limit(limit)
            .exec();

        blockedContactsQuery.map((blockedContact) => {
            !Object.keys(blockedContacts).join().includes(blockedContact.username) ?
                blockedContacts[blockedContact.contactId] = blockedContact : null;
        });

        return blockedContacts;
    }

    static async getBlockedContactsCount(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        return db.select(lf.fn.count(contacts.contactId).as("count"))
            .from(contacts)
            .where(lf.op.and(
                contacts.blocked.eq(true)))
            .exec();
    }

    static async getContacts(params: { skip: number, limit: number }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts: any = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const limit: number = params.limit;
        const skip: number = params.skip * limit;

        const recordsQuery: any = await db.select()
            .from(contacts)
            .where(lf.op.and(contacts.saved.eq(true), contacts.isProductContact.eq(true)))
            .orderBy(contacts.firstName, lf.Order.ASC)
            .orderBy(contacts.lastName, lf.Order.ASC)
            .limit(limit)
            .skip(skip)
            .exec();

        const countQuery: any = await db.select(lf.fn.count(contacts.contactId)
            .as('count'))
            .from(contacts)
            .where(lf.op.and(contacts.saved.eq(true), contacts.isProductContact.eq(true)))
            .exec();

        const [records, count] = await Promise.all([
            recordsQuery,
            countQuery
        ]);

        return {
            records, count: +count[0].count
        };
    }

    static async getAllContacts(condition?: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return db.select()
            .from(contacts)
            .orderBy(contacts.firstName, lf.Order.ASC)
            .exec();
    }

    static getContactsFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const contactsState = contactDefaultState;
                const contactsMap = {};
                const getContacts = await IDBContact.getAllContacts();
                getContacts.map(item => {
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
                        members: {},
                        editable: false
                    };
                    contactsMap[item.contactId].members[item.contactId] = item;
                    if (item.avatar) {
                        contactsMap[item.contactId].members[item.contactId]["avatarBlobUrl"] = (window as any).URL.createObjectURL(item.avatar)
                    } else {
                        contactsMap[item.contactId].members[item.contactId]["avatarBlobUrl"] = ""
                    }
                    // console.log(item.avatar, "getAvatar")
                });

                resolve(contactsMap);

            } catch (e) {
                reject(e);
            }
        })
    }

    static async getContact(condition?: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return db.select()
            .from(contacts)
            .where(contacts.saved.eq(true))
            .limit(1)
            .exec();

    }

    static async updateContact(contactId, contactData, exact?: boolean, registered?: any): Promise<any> {
        const childContactId: string = registered ?  `${contactId.split("@").shift()}@${SINGLE_CONVERSATION_EXTENSION}` : contactId.toString();

        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        Log.i(contactData, "contactData")

        let whereCondition: any = null;
        // previous condition was !contactData.muted && contactData.muted !== false) && !exact, that makes no sense, updating it to !contactData.muted && contactData.muted !== false) && !exact
        if ((contactData.muted && contactData.muted !== false) && !exact) {
            whereCondition = lf.op.or(
                contactsTbl.contactId.eq(contactId),
                contactsTbl.contactId.eq(childContactId),
                contactsTbl.childContactId.eq(childContactId)
            );
        } else {
            whereCondition = contactsTbl.contactId.eq(contactId);
        }

        const contact: any[] = await db
            .select()
            .from(contactsTbl)
            .where(whereCondition)
            .exec();

        Log.i(contact, "contactAdd")

        if (contact && contact[0]) {
            const selectedContact: any = contact[0];
            for (const key in contactData) {
                if (contactData.hasOwnProperty(key)) {
                    selectedContact[key] = contactData[key];
                }
            }

            console

            return await db
                .insertOrReplace()
                .into(contactsTbl)
                .values([contactsTbl.createRow(selectedContact)])
                .exec()
                .catch(e => Log.i(e));
        }
    }

    static async setBlockedContacts(contactIds: Array<string>): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return db
            .update(contacts)
            .set(contacts.blocked, true)
            .where(contacts.contactId.in(contactIds))
            .exec();
    }

    static async getNumbersOfContact(id: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const response: any = await db
            .select(contacts.numbers, contacts.phone)
            .from(contacts)
            .where(contacts.mainId.eq(id))
            .exec();

        return (response[0] && response[0].numbers || response[0] && [response[0].phone]) || [];
    }

    static async getContactsByMainId(id: string | number): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return db
            .select()
            .from(contacts)
            .where(lf.op.or(contacts.mainId.eq(id), contacts.parentMainId.eq(id)))
            .exec();
    }

    static async contactsBulkInsert(contactsMap: any) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const tblContacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const rows = {contacts: []};

        Object.keys(contactsMap).map(contactId =>
            rows.contacts.push(tblContacts.createRow(contactsMap[contactId].members[contactId]))
        );

        Log.i(rows, "rowscContactsMapDB")
        Log.i(db, "db1234")
        Log.i(tblContacts, "tblContacts")

        return db.insertOrReplace()
            .into(tblContacts)
            .values(rows.contacts)
            .exec()
            .catch(e => Log.i(e))
    }

    static async updateContactsParentIds(contactIdsMap: any) {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const tblContacts = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const rows: Array<any> = [];

        const contactsArr: Array<any> = await db.select()
            .from(tblContacts)
            .where(tblContacts.contactId.in(Object.keys(contactIdsMap)))
            .exec();

        if (contactsArr.length > 0) {
            contactsArr.map(contact => rows.push(tblContacts.createRow({
                ...contact,
                parentContactId: contactIdsMap[contact.contactId]
            })))
        }

        return db.insertOrReplace()
            .into(tblContacts)
            .values(rows)
            .exec();
    }

    static async searchContacts(params: { q: string, offset: number, limit: number, isAllContacts?: boolean }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const limit: number = params.limit;
        const offset: number = params.offset * limit;
        let whereConditions: any;
        let q: string = params.q || '';

        if (q !== '') {
            const searchConditions: any = lf.op.or(
                contactsTbl.firstName.match(new RegExp('^' + q, 'i')),
                contactsTbl.lastName.match(new RegExp('^' + q, 'i')),
                contactsTbl.name.match(new RegExp('^' + q, 'i')),
                lf.op.and(
                    contactsTbl.username.match(new RegExp('^' + q, 'i')),
                    contactsTbl.email.isNull()
                ),
                lf.op.and(
                    contactsTbl.email.match(new RegExp('^' + q, 'i')),
                    contactsTbl.email.isNotNull()
                )
            );
            whereConditions = lf.op.and(contactsTbl.saved.eq(true), lf.op.and(searchConditions));
        } else {
            whereConditions = contactsTbl.saved.eq(true);
        }

        // Todo recordsQuery query from db takes wrong data in delete contact case

        const recordsQuery: any = db.select()
            .from(contactsTbl)
            .where(whereConditions)
            .orderBy(contactsTbl.firstName, lf.Order.ASC)
            .orderBy(contactsTbl.username, lf.Order.ASC)
            .limit(limit)
            .skip(offset)
            .exec();

        const countQuery: any = db.select(lf.fn.count(contactsTbl.contactId)
            .as('count'))
            .from(contactsTbl)
            .where(whereConditions)
            .exec();

        const [records, count] = await Promise.all([
            recordsQuery,
            countQuery
        ]);

        const temporaryResult: any[] = records.filter(item => item.saved);

        return {records: temporaryResult, count: +count[0].count};
    }

    static async updateFavorite(contactId, isFavorite): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const contact: any[] = await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.contactId.eq(contactId))
            .exec();

        const selectedContact: any = contact[0];

        if (selectedContact) {
            const mainId: number = selectedContact.mainId;

            selectedContact.favorite = isFavorite;

            // Contact update query
            const contactQuery: any = await db
                .insertOrReplace()
                .into(contactsTbl)
                .values([contactsTbl.createRow(selectedContact)])
                .exec();

            let childContactQuery: any = null;
            // Update child contacts
            if (selectedContact.numbers && selectedContact.numbers.length > 1) {
                childContactQuery = await db
                    .update(contactsTbl)
                    .set(contactsTbl.favorite, isFavorite)
                    .where(lf.op.and(contactsTbl.parentMainId.eq(mainId), contactsTbl.isProductContact.eq(true)))
                    .exec();
            }

            await Promise.all([
                contactQuery,
                childContactQuery
            ]);

            return await db.select()
                .from(contactsTbl)
                .where(lf.op.and(contactsTbl.isProductContact.eq(true), lf.op.or(contactsTbl.mainId.eq(mainId), contactsTbl.parentMainId.eq(mainId))))
                .exec();
        }
    }

    static async getContactsNew(params: { skip: number, limit: number, q?: string }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts: any = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const limit: number = params.limit;
        const skip: number = params.skip * limit;


        let conditions: any = lf.op.and(contacts.isProductContact.eq(true));

        const q: string = params.q || '';
        if (q !== '') {
            conditions = lf.op.or(
                contacts.firstName.match(new RegExp('^' + q, 'i')),
                contacts.lastName.match(new RegExp('^' + q, 'i')),
                lf.op.and(
                    contacts.username.match(new RegExp('^' + q, 'i')),
                    contacts.email.isNull()
                ),
                lf.op.and(
                    contacts.email.match(new RegExp('^' + q, 'i')),
                    contacts.email.isNotNull()
                )
            );

        }

        const recordsQuery: any = await db.select()
            .from(contacts)
            .where(lf.op.and(contacts.saved.eq(true), contacts.isProductContact.eq(true), conditions))
            .orderBy(contacts.firstName, lf.Order.ASC)
            .orderBy(contacts.lastName, lf.Order.ASC)
            .limit(limit)
            .skip(skip)
            .exec();

        const countQuery: any = await db.select(lf.fn.count(contacts.contactId)
            .as('count'))
            .from(contacts)
            .where(lf.op.and(contacts.saved.eq(true), contacts.isProductContact.eq(true), conditions))
            .exec();

        const [records, count] = await Promise.all([
            recordsQuery,
            countQuery
        ]);


        return {
            records, count: +count[0].count
        };
    }

    static async getFavoriteContacts(params: { q?: string }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contacts: any = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        let conditions: any = lf.op.and(contacts.isProductContact.eq(true));

        const q: string = params.q;
        if (q) {
            conditions = lf.op.or(
                contacts.firstName.match(new RegExp('^' + q, 'i')),
                contacts.lastName.match(new RegExp('^' + q, 'i')),
                lf.op.and(
                    contacts.username.match(new RegExp('^' + q, 'i')),
                    contacts.email.isNull()
                ),
                lf.op.and(
                    contacts.email.match(new RegExp('^' + q, 'i')),
                    contacts.email.isNotNull()
                )
            );
        }

        const recordsQuery: any = await db.select()
            .from(contacts)
            .where(lf.op.and(contacts.saved.eq(true), contacts.isProductContact.eq(true), contacts.favorite.eq(true), conditions))
            .orderBy(contacts.firstName, lf.Order.ASC)
            .orderBy(contacts.lastName, lf.Order.ASC)
            .exec();


        const [records] = await Promise.all([
            recordsQuery,
        ]);
        return {records};
    }
}

export class DatabaseContacts {

    static async selectContacts(params: { skip: number, limit: number, q?: string, isProductContact?: boolean }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const limit: number = params.limit;
        const skip: number = params.skip * limit;
        const isProductContact: boolean = params.isProductContact;
        const nameType = APPLICATION.WITHEMAIL ? "email" : "username";
        let isProductContactCondition: any;
        let q: string = params.q || '';
        if (q !== "" && q.startsWith("+")) {
            q = q.replace("+", "")
        }

        if (isProductContact) {
            isProductContactCondition = contactsTbl.isProductContact.eq(true);
        } else {
            // isProductContactCondition = lf.op.or(
            //   contactsTbl.isProductContact.eq(true),
            //   contactsTbl.isProductContact.eq(false),
            // )
            isProductContactCondition = contactsTbl.isProductContact.eq(true);
        }

        const searchCondition: any = lf.op.or(
          contactsTbl.firstName.match(new RegExp('^' + q, 'i')),
          contactsTbl.lastName.match(new RegExp('^' + q, 'i')),
          lf.op.and(
            contactsTbl.contactId.match(new RegExp('^' + q, 'i')),
            lf.op.or(
              contactsTbl[nameType].eq(''),
              contactsTbl[nameType].isNull(),
            )
          ),
          lf.op.and(
            contactsTbl[nameType].match(new RegExp('^' + q, 'i')),
            lf.op.or(
              contactsTbl[nameType].neq(''),
              contactsTbl[nameType].isNotNull()
            ),
          )
        );
        const recordsQuery: any = db.select()
          .from(contactsTbl)
          .where(
            lf.op.and(
              // contactsTbl.saved.eq(true),
              isProductContactCondition,
              lf.op.and(contactsTbl.contactId.neq(""), contactsTbl.contactId.isNotNull()),
              searchCondition)
          )
          .orderBy(contactsTbl.name, lf.Order.ASC)
          .limit(limit)
          .skip(skip)
          .exec();
        const countQuery: any = db.select(lf.fn.count(contactsTbl.contactId).as("count"))
          .from(contactsTbl)
          .where(lf.op.and(contactsTbl.saved.eq(true), isProductContactCondition, searchCondition))
          .exec();
        const AllCont: any = db.select().from(contactsTbl).exec();
        const [records, count, all]: [any, number, any] = await Promise.all([
            recordsQuery,
            countQuery,
            AllCont
        ]);
        const contacts: { [key: string]: any } = {};
        if(records.length > 0) {
            for (const record of records) {
                contacts[record.contactId] = {
                    author: record.author,
                    avatar: record.avatar,
                    avatarBlobUrl: record.avatar ? (window as any).URL.createObjectURL(record.avatar) : "",
                    avatarCharacter: record.avatarCharacter,
                    avatarUrl: record.avatarUrl,
                    blocked: record.blocked,
                    childContactId: record.childContactId,
                    color: record.color,
                    createdAt: record.createdAt,
                    email: record.email,
                    favorite: record.favorite,
                    firstName: record.firstName,
                    image: record.image,
                    imageUrl: record.imageUrl,
                    isProductContact: record.isProductContact,
                    label: record.label,
                    lastName: record.lastName,
                    mainId: record.mainId,
                    muted: record.muted,
                    name: record.name,
                    numbers: record.numbers,
                    parentContactId: record.parentContactId,
                    parentMainId: record.parentMainId,
                    phone: record.phone,
                    saved: record.saved,
                    singleProductContact: record.singleProductContact,
                    status: record.status,
                    username: record.username,
                    contactId: record.contactId,
                };
            }
        }
        if (records.length === 0 && all.length > 0 && q === "") {
            for (const record of all) {
                if(!isProductContact && record.saved) {
                    contacts[record.contactId] = {
                        author: record.author,
                        avatar: record.avatar,
                        avatarBlobUrl: record.avatar ? (window as any).URL.createObjectURL(record.avatar) : "",
                        avatarCharacter: record.avatarCharacter,
                        avatarUrl: record.avatarUrl,
                        blocked: record.blocked,
                        childContactId: record.childContactId,
                        color: record.color,
                        createdAt: record.createdAt,
                        email: record.email,
                        favorite: record.favorite,
                        firstName: record.firstName,
                        image: record.image,
                        imageUrl: record.imageUrl,
                        isProductContact: record.isProductContact,
                        label: record.label,
                        lastName: record.lastName,
                        mainId: record.mainId,
                        muted: record.muted,
                        name: record.name,
                        numbers: record.numbers,
                        parentContactId: record.parentContactId,
                        parentMainId: record.parentMainId,
                        phone: record.phone,
                        saved: record.saved,
                        singleProductContact: record.singleProductContact,
                        status: record.status,
                        username: record.username,
                        contactId: record.contactId,
                    };
                } else if(isProductContact && record.saved && record.isProductContact) {
                    contacts[record.contactId] = {
                        author: record.author,
                        avatar: record.avatar,
                        avatarCharacter: record.avatarCharacter,
                        avatarUrl: record.avatarUrl,
                        blocked: record.blocked,
                        childContactId: record.childContactId,
                        color: record.color,
                        createdAt: record.createdAt,
                        email: record.email,
                        favorite: record.favorite,
                        firstName: record.firstName,
                        image: record.image,
                        imageUrl: record.imageUrl,
                        isProductContact: record.isProductContact,
                        label: record.label,
                        lastName: record.lastName,
                        mainId: record.mainId,
                        muted: record.muted,
                        name: record.name,
                        numbers: record.numbers,
                        parentContactId: record.parentContactId,
                        parentMainId: record.parentMainId,
                        phone: record.phone,
                        saved: record.saved,
                        singleProductContact: record.singleProductContact,
                        status: record.status,
                        username: record.username,
                        contactId: record.contactId,
                    };
                }
            }
        }
        return {
            contacts, count: records.length > 0 ? +count[0].count : contacts.length, records
        };
    }

    static async selectFavoriteContacts(params: { q?: string }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        let q: string = params.q;
        if (q && q.startsWith("+")) {
            q = q.replace("+", "")
        }

        let conditions: any;

        if (q !== "" && q) {
            conditions = lf.op.and(contactsTbl.saved.eq(true), contactsTbl.isProductContact.eq(true), contactsTbl.favorite.eq(true), lf.op.or(
                contactsTbl.firstName.match(new RegExp('^' + q, 'i')),
                contactsTbl.lastName.match(new RegExp('^' + q, 'i')),
                lf.op.and(
                    contactsTbl.contactId.match(new RegExp('^' + q, 'i')),
                    lf.op.or(
                        contactsTbl.email.eq(''),
                        contactsTbl.email.isNull(),
                    )
                ),
                lf.op.and(
                    contactsTbl.email.match(new RegExp('^' + q, 'i')),
                    lf.op.or(
                        contactsTbl.email.neq(''),
                        contactsTbl.email.isNotNull()
                    ),
                )
            ))
        } else {
            conditions = lf.op.and(contactsTbl.saved.eq(true), contactsTbl.isProductContact.eq(true), contactsTbl.favorite.eq(true))
        }

        const recordsQuery: any = await db.select()
            .from(contactsTbl)
            // .innerJoin(profilesTbl, profilesTbl.threadId.eq(contactsTbl.contactId))
            // .leftOuterJoin(avatarsTbl, avatarsTbl.threadId.eq(contactsTbl.contactId))
            // .leftOuterJoin(blockedContactsTbl, contactsTbl.contactId.eq(blockedContactsTbl.contactId))
            .where(conditions)

            // .orderBy(profilesTbl.firstName, lf.Order.ASC)
            // .orderBy(profilesTbl.lastName, lf.Order.ASC)
            .orderBy(contactsTbl.phone, lf.Order.ASC)
            .exec();


        const [records] = await Promise.all([
            recordsQuery,
        ]);
        const contacts: { [key: string]: any } = {};

        for (const record of records) {
            contacts[record.contactId] = {
                author: record.author,
                avatar: record.avatar,
                avatarCharacter: record.avatarCharacter,
                avatarUrl: record.avatarUrl,
                blocked: record.blocked,
                childContactId: record.childContactId,
                color: record.color,
                createdAt: record.createdAt,
                email: record.email,
                favorite: record.favorite,
                firstName: record.firstName,
                image: record.image,
                imageUrl: record.imageUrl,
                isProductContact: record.isProductContact,
                label: record.label,
                lastName: record.lastName,
                mainId: record.mainId,
                muted: record.muted,
                name: record.name,
                numbers: record.numbers,
                parentContactId: record.parentContactId,
                parentMainId: record.parentMainId,
                phone: record.phone,
                saved: record.saved,
                singleProductContact: record.singleProductContact,
                status: record.status,
                username: record.username,
                contactId: record.contactId,
            };
        }
        return {
            contacts
        };
    }

    static async deleteContact(contactId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const contact: any[] = await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.contactId.eq(contactId))
            .exec();


        const selectedContact: any = contact[0];
        const selectedContact2: any = JSON.parse(JSON.stringify(contact[0]));

        if (selectedContact) {
            const mainId: number = selectedContact.mainId;

            selectedContact.saved = false;
            selectedContact.favorite = false;
            selectedContact.numbers = null;
            selectedContact.parentMainId = null;

            // Contact update query


            const contactQuery = await db
              .insertOrReplace()
              .into(contactsTbl)
              .values([contactsTbl.createRow(selectedContact)])
              .exec();

            let childContactQuery: any = null;
            // Update child contacts

            if (selectedContact2.numbers && selectedContact2.numbers.length > 1) {

                // childContactQuery = await db
                //     .update(contactsTbl)
                //     .set(contactsTbl.saved, false)
                //     .set(contactsTbl.favorite, false)
                //     .set(contactsTbl.numbers, null)
                //     .set(contactsTbl.parentMainId, null)
                //     .where(contactsTbl.parentMainId.eq(mainId))
                //     .exec();

                const contacts: any[] = await db
                  .select()
                  .from(contactsTbl)
                  .where(contactsTbl.parentMainId.eq(mainId))
                  .exec();

                const changeContacts = contacts.map(item => {
                    item.saved = false;
                    item.favorite = false;
                    item.numbers = null;
                    item.parentMainId = null;
                    return item
                })


                const newRows = changeContacts.reduce((acm, item) => {
                    const row = contactsTbl.createRow(item)
                    acm.push(row)
                    return acm
                },[])
                Log.i(changeContacts, 'changeContacts')
                childContactQuery = await db
                  .insertOrReplace()
                  .into(contactsTbl)
                  .values(newRows)
                  .exec();
            }
            await Promise.all([
                contactQuery,
                childContactQuery
            ]);
        }
    }

    static async selectContact(contactId: string, isDeleted: boolean = false): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const contact: any[] = await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.contactId.eq(contactId))
            .exec();

        if (contact) {
            const selectedContact: any = contact[0];

            // Get default Profile&Avatar and replace in contacts table
            if (isDeleted) {
                const profilesTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.PROFILES);
                const avatarsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.AVATARS);

                const profile: any = await db
                    .select()
                    .from(profilesTbl)
                    .where(profilesTbl.threadId.eq(contactId))
                    .exec();

                const avatar: any = await db
                    .select()
                    .from(avatarsTbl)
                    .where(avatarsTbl.threadId.eq(contactId))
                    .exec();

                // Set default profile
                if (profile && profile[0]) {
                    const defaultProfile = profile[0];
                    selectedContact.avatarCharacter = defaultProfile.avatarColorCharacter;
                    selectedContact.color = {
                        numberColor: defaultProfile.avatarColorBackground.numberColor,
                        avatarColor: "linear-gradient(to bottom, #66edff 0%, #1481d6 100%)"
                    };
                    selectedContact.firstName = defaultProfile.firstName ? defaultProfile.firstName.trim() : '';
                    selectedContact.lastName = defaultProfile.lastName ? defaultProfile.lastName.trim() : '';
                    selectedContact.name = defaultProfile.fullName ? defaultProfile.fullName.trim() : '';
                }

                // Set default avatar
                if (avatar && avatar[0]) {
                    const defaultAvatars = avatar[0];
                    selectedContact.avatar = defaultAvatars.small;
                    selectedContact.image = defaultAvatars.small;
                }

                await db
                    .insertOrReplace()
                    .into(contactsTbl)
                    .values([contactsTbl.createRow(selectedContact)])
                    .exec();
            }

            const parentMainId: number = selectedContact.parentMainId;
            // if contact main contact return this
            if (!parentMainId) {
                return {contact: selectedContact, isMainContact: true};
            }

            // else find parent contact and return this
            const parentContact: any[] = await db
                .select()
                .from(contactsTbl)
                .where(contactsTbl.mainId.eq(parentMainId))
                .exec();
            return {childContact: selectedContact, contact: parentContact[0], isMainContact: false};
        }

        return null;
    };

    static async selectSavedContacts(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.saved.eq(true))
            .exec();

    }

    static async selectBlockedContactIds(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        return await db
            .select(contactsTbl.contactId)
            .from(contactsTbl)
            .where(contactsTbl.blocked.eq(true))
            .exec()
    }

    static async insertMissingContacts(contacts: any): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);
        const rows = [];

        const contactIds: string[] = Object.keys(contacts).map(username => {
            return contacts[username].contactId;
        });

        const contactsFromDb: any = await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.contactId.in(contactIds))
            .exec();

        const contactIdsFromDb: string [] = contactsFromDb.map(contact => {
            return contact.contactId;
        });

        const missingContactIds: string[] = contactIds.filter(id => !contactIdsFromDb.includes(id));


        if (missingContactIds.length !== 0) {
            for (let contact in contacts) {
                if (contacts.hasOwnProperty(contact) && missingContactIds.includes(contacts[contact].contactId)) {
                    rows.push(contactsTbl.createRow(contacts[contact]))
                }
            }
        }

        return await db.insertOrReplace()
            .into(contactsTbl)
            .values(rows)
            .exec()
            .catch(e => Log.i(e))

    }

    static async selectDBContact(contactId: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const contactsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.CONTACTS);

        const contact: any[] = await db
            .select()
            .from(contactsTbl)
            .where(contactsTbl.contactId.eq(contactId))
            .exec();

        if (contact.length !== 0) {
            return contact[0]
        }

        return null
    }
}
