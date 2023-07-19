import database from "services/database";
import * as lf from "lovefield";
import {Row} from "lovefield";
import {APPLICATION} from "configs/constants";
import {getConversationType} from "helpers/DataHelper";
import Table = lf.schema.Table;

export interface IDBxNetwork {
    isProductContact: boolean;
    avatarCharacter: string;
    contactId: string;
    avatarUrl: string;
    firstName: string;
    imageUrl: string;
}



export default class IDBNetwork {

    static async addNetwork(network: IDBxNetwork): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: lf.schema.Database = db.getSchema();

        const networks = schema.table(APPLICATION.DATABASE.TABLES.NETWORKS);
        const row: Row = networks
            .createRow(network);

        const addedNetwork = await db.insertOrReplace()
            .into(networks)
            .values([row])
            .exec();

        return addedNetwork[0];
    };

    static async deleteNetwork(networkId: number): Promise<any> {
        const db: lf.Database = await database.getDB();
        const schema: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.NETWORKS);
        return db
            .delete()
            .from(schema)
            .where(schema.networkId.eq(networkId))
            .exec();
    }

    static async updateNetwork(networkId: string, data: any): Promise<any> {

        const db: lf.Database = await database.getDB();
        const networks: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.NETWORKS);
        const row: Row = networks.createRow(data);

        return db
            .insertOrReplace()
            .into(networks)
            .values([row])
            .exec();
    }

    static async getNetworks(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const db: lf.Database = await database.getDB();
                const network: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.NETWORKS);
                const storeQuery: any = await db.select(network.value)
                    .from(network)
                    .exec();

                const networks = {};
                if (storeQuery.length !== 0) {
                    for (const network of storeQuery) {
                        networks[network.networkId] = network;
                    }
                }
                resolve(networks);
            }catch(e){
                reject(e);
            }
        })
    }

}
