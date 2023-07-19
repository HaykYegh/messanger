import database from "services/database";
import * as lf from "lovefield";
import {Row} from "lovefield";
import {APPLICATION} from "configs/constants";
import {IRequest} from "modules/requests/RequestsReducer";
import Table = lf.schema.Table;
import Log from "modules/messages/Log";

export default class IDBRequest {

    static async addRequest(request): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const requests: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);

        const row: Row = requests.createRow(request);

        return db
            .insertOrReplace()
            .into(requests)
            .values([row])
            .exec()
            .catch(e => Log.i(e));
    }

    static async deleteRequest(id): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const requests: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);

        return db
            .delete()
            .from(requests)
            .where(requests.id.eq(id))
            .exec()
            .catch(e => Log.i(e));
    }

    static async getRequests(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const requests: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);

        return db
            .select()
            .from(requests)
            .exec();
    }

    static async getRequestsCount(): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const requests: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);

        return db.select(lf.fn.count(requests.id).as('count'))
            .from(requests)
            .exec()
            .catch(e => Log.i(e));

    }

    static async insertRequests(requests: IRequest[]): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();
        const requestsTbl: Table = schema.table(APPLICATION.DATABASE.TABLES.REQUESTS);


        const rows: Row[] = requests.map(request => requestsTbl.createRow({
            id: request.id,
            xmlBuilder: request.xmlBuilder,
            params: request.params,
            createdAt: request.createdAt
        }));

        return db
            .insertOrReplace()
            .into(requestsTbl)
            .values(rows)
            .exec()

    }
}
