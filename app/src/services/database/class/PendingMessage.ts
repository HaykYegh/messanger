import database from "services/database";
import * as lf from "lovefield";
import {Predicate, Row} from "lovefield";
import {APPLICATION} from "configs/constants";
import {defaultState as contactDefaultState} from "modules/contacts/ContactsReducer";
import {getConversationType} from "helpers/DataHelper";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import Table = lf.schema.Table;
import {APPLICATION_PROPERTIES} from "services/database/class/Application";
import {Pending} from "modules/messages/Pending";
import {PendingType} from "modules/messages/PendingType";
import {PendingMessageType} from "modules/messages/PendingMessageType";

export default class IDBPending {


  static createPendingObject(pendings) {
    let pendingArray = pendings.reduce((acm, item) => {
      let obj = new Pending()
      obj.id = item.pending_id
      obj.dictMessage = JSON.parse(item.pending_message)
      obj.time = item.pending_time
      obj.messageId = item.pending_message_id
      obj.isLock = item.pending_is_block_batch
      obj.isInternalMessage = item.pending_is_internal
      obj.type = PendingType.get(item.pending_type)
      obj.parentId = item.pending_parent_id
      obj.messageType = PendingMessageType.get(item.pending_message_type)

      acm.push(obj)
      return acm
    }, [])

    return pendingArray
  }


  //insert
  static async createPending(pending): Promise<any> {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendings = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const row: Row = pendings
      .createRow(pending);

    const addedPending = await db.insertOrReplace()
      .into(pendings)
      .values([row])
      .exec();

    return this.createPendingObject(addedPending)[0]
  }

  static async getPendingById(pendingId: number): Promise<any> {

    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendings = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const clause: Predicate = pendings
      .pending_id
      .eq(pendingId);

    const pending = await db.select()
      .from(pendings)
      .where(clause)
      .limit(1)
      .exec();

    return this.createPendingObject(pending)[0]
  }

  static async getPendingByParentId(pendingParentId: number) {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingsTbl = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const clause: Predicate = pendingsTbl
      .pending_parent_id
      .eq(pendingParentId);

    const pendings = await db.select()
      .from(pendingsTbl)
      .where(clause)
      .exec();

    return this.createPendingObject(pendings)
  }

  static async getPendingsByMessageId(pendingMessageId: string) {

    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingsTbl = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const clause: Predicate = pendingsTbl
      .pending_message_type
      .eq(pendingMessageId);


    const pendings = await db.select()
      .from(pendingsTbl)
      .where(clause)
      .exec();

    return this.createPendingObject(pendings)
  }

  static async getPendingsByPendingType(messageId: string, pendingType: number): Promise<any> {

    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingsTbl = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const pendingTypeClause: Predicate = pendingsTbl
      .pending_type
      .eq(pendingType);
    const messageIdClause:  Predicate = pendingsTbl.pending_message_id.eq(messageId);

    const pendings = await db.select()
      .from(pendingsTbl)
      .where(lf.op.and(pendingTypeClause, messageIdClause))
      .exec();

    return this.createPendingObject(pendings)
  }

  static async getPendings(): Promise<any> {

    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingTable = schema.table(APPLICATION.DATABASE.TABLES.PENDING);

    const pendings = await db.select()
      .from(pendingTable)
      .exec()

    return this.createPendingObject(pendings)
  }



  static  async getPendingsByPendingTypeAndBatch(pendingType: number, batch: boolean): Promise<any> {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingsTable = schema.table(APPLICATION.DATABASE.TABLES.PENDING);
    const pendingTypeClause: Predicate = pendingsTable.pending_type.eq(pendingType);
    const batchClause:  Predicate = pendingsTable.pending_is_block_batch.eq(batch);
    const pendings = await db.select()
      .from(pendingsTable)
      .where(lf.op.and(pendingTypeClause, batchClause))
      .exec();

    return this.createPendingObject(pendings)
  }



  static async updatePending(pendingObj): Promise<any> {

    const {
      id,
      time,
      isLock,
      isInternalMessage,
      messageId,
      type,
      parentId,
      messageType
    } = pendingObj

    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();
    const pendingsTbl = schema.table(APPLICATION.DATABASE.TABLES.PENDING);

    let whereCondition = lf.op.or(
      pendingsTbl.pending_id.eq(id),
      pendingsTbl.pending_time.eq(time),
      pendingsTbl.pending_message.eq(JSON.stringify(pendingObj.dictMessage)),
      pendingsTbl.pending_is_block_batch.eq(isLock),
      pendingsTbl.pending_is_internal.eq(isInternalMessage),
      pendingsTbl.pending_message_id.eq(messageId),
      pendingsTbl.pending_type.eq(type),
      pendingsTbl.pending_parent_id.eq(parentId),
      pendingsTbl.pending_message_type.eq(messageType),
    );


    const pendings: any[] = await db
      .select()
      .from(pendingsTbl)
      .where(whereCondition)
      .exec();

    return this.createPendingObject(pendings)[0]
  }

  static async deletePendingByMessageId(messageId: string): Promise<any> {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.PENDING);

    return db.delete()
      .from(pendingTbl)
      .where(pendingTbl.pending_message_id.eq(messageId))
      .exec()
  }

  static async deletePendingById(pendingId: number): Promise<any> {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.PENDING);

    return db.delete()
      .from(pendingTbl)
      .where(pendingTbl.pending_id.eq(pendingId))
      .exec()
  }

  static async deleteAllPendings(): Promise<any> {
    const db: lf.Database = await database.getDB();
    const schema: lf.schema.Database = db.getSchema();

    const pendingTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.PENDING);

    return db.delete()
      .from(pendingTbl)
      .exec()
  }
}
