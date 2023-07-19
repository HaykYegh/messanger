import * as lf from "lovefield";
import database from "services/database";
import {APPLICATION, MESSAGE_TYPES, SHARED_MEDIA_LIMIT} from "configs/constants";
import Table = lf.schema.Table;
import {logger} from "helpers/AppHelper";
import {SHARED_MEDIA_TYPES} from "configs/constants";
import set = Reflect.set;


export default class SettingsModel {

    static async updateSettings({settingsType, settingsId, value}: { settingsType: string, settingsId: string, value: boolean | string }): Promise<any> {
        const db: lf.Database = await database.getDB();
        const settingsTbl: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.SETTINGS);

        return db.update(settingsTbl)
            .set(settingsTbl.value, value)
            .where(lf.op.and(
                settingsTbl.settingsType.eq(settingsType),
                settingsTbl.settingsId.eq(settingsId),
            ))
            .exec();
    }
}
