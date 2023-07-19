import database from "services/database";
import * as lf from "lovefield";
import {Row} from "lovefield";
import {APPLICATION, SETTINGS_PANEL} from "configs/constants";
import {defaultState as settingDefaultState} from "modules/settings/SettingsReducer";

import {differenceWith, isEqual} from "lodash"
import Table = lf.schema.Table;
import Database = lf.schema.Database;

export default class IDBSettings {

    public static initialValues: Array<any> = [
        {settingsId: 'useEnterToSend', settingsType: SETTINGS_PANEL.chat, value: true},
        {settingsId: 'showOnlineStatus', settingsType: SETTINGS_PANEL.privacy, value: true},
        {settingsId: 'showTyping', settingsType: SETTINGS_PANEL.privacy, value: true},
        {settingsId: 'showSeenStatus', settingsType: SETTINGS_PANEL.privacy, value: true},
        {settingsId: 'showPreview', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'sound', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'messagePreview', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'groupSound', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'callSound', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'groupMessagePreview', settingsType: SETTINGS_PANEL.notification, value: true},
        {settingsId: 'selectedLanguage', settingsType: SETTINGS_PANEL.languages, value: "en-US"},
    ];

    static async initialize(): Promise<any> {

        const settingsIDs: Array<any> = IDBSettings.initialValues.map(value => value.settingsId);
        const db: lf.Database = await database.getDB();
        const settings: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.SETTINGS);
        const existingSettings: any = await db.select()
            .from(settings)
            .where(settings.settingsId.in(settingsIDs))
            .exec();

        if (settingsIDs.length > existingSettings.length) {
            const settingsDiffs: Array<any> = differenceWith(IDBSettings.initialValues, existingSettings, isEqual);
            const settingsRows: Array<Row> = [];
            settingsDiffs.forEach((value) => {
                settingsRows.push(settings.createRow(value));
            });
            return db.insertOrReplace()
                .into(settings)
                .values(settingsRows)
                .exec();
        }
    }

    static async update(property: string, value: boolean | string, settingsType?: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const settings: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.SETTINGS);
        const row = settings.createRow({ settingsId: property, settingsType:settingsType, value:value });
        return db.insertOrReplace()
            .into(settings)
            .values([row])
            .exec();
    }

    static async reset(property: string): Promise<any> {
        const db: lf.Database = await database.getDB();
        const settings: Table = db
            .getSchema()
            .table(APPLICATION.DATABASE.TABLES.SETTINGS);

        const selectedSettings: Array<any> = IDBSettings.initialValues.filter((value) => value.settingsType === property);
        const query: any = db.insertOrReplace();

        const rows: Array<Row> = [];
        query.into(settings);

        selectedSettings.map(item => {
            rows.push(settings.createRow(item));
        });
        query.values(rows);

        return query.exec();
    }

    static getStoreSettings(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const db: lf.Database = await database.getDB();
                const schema: Database = db.getSchema();
                const settings = schema.table(APPLICATION.DATABASE.TABLES.SETTINGS);
                let settingsState = settingDefaultState;
                const existingSettings: any = await db.select()
                    .from(settings)
                    .exec();
                if (existingSettings.length > 0) {
                    resolve(settingsState.withMutations((stateitem) => {
                        existingSettings.map(item => {
                            stateitem.setIn([item.settingsType, item.settingsId], item.value);
                        });
                    }))
                }
                resolve(settingsState);
            }catch(e){
                reject(e);
            }

        })
    }


}
