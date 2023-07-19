import IDBPending from "services/database/class/PendingMessage";
import {Pending} from "modules/messages/Pending";
import {PendingMessageType} from "modules/messages/PendingMessageType";
import {PendingType} from "modules/messages/PendingType";
import Log from "modules/messages/Log";

export class PendingDao {
    private static TAG = "PendingDao"

    static insertWithArray(pendings: Pending[]) {
        for (var i = 0; i < pendings.length; i++) {
            let obj = pendings[i]

            if (obj.messageId == null) {
                Log.e(this.TAG, "MQ -> Critical Error -> messageId is NULL")
                continue
            }

            this.insert(obj)
        }
    }

    static async insert(pending: Pending) {
        let newPending: Pending = await IDBPending.createPending({
            pending_message: JSON.stringify(pending.dictMessage),
            pending_time: pending.time,
            pending_message_id: pending.messageId,
            pending_is_block_batch: pending.isLock,
            pending_is_internal: pending.isInternalMessage,
            pending_type: pending.type.value,
            pending_parent_id: pending.parentId,
            pending_message_type: pending.messageType.value
        })

        pending.id = newPending.id
        return pending
    }

    static getById(id: number) {
        if (id == null) {
            return null
        }

        return IDBPending.getPendingById(id)
    }

    static getByParentId(parentId: number) {
        if (parentId == -1) {
            return []
        }

        return IDBPending.getPendingByParentId(parentId)
    }

    static getbyMessageId(messageId: string) {
        if (messageId == null) {
            return []
        }


        return IDBPending.getPendingsByMessageId(messageId)
    }

    static getByType(messageId: string, type: number) {
        if (messageId == null) {
            return null
        }

        return IDBPending.getPendingsByPendingType(messageId, type)
    }

    static get() {
        return IDBPending.getPendings()
    }

    static async getPendingBatch() {
        const pendings = await IDBPending.getPendingsByPendingTypeAndBatch( 1, true)

        if (pendings.length > 0){
            return pendings[0]
        }

        return null
    }

    static update(pending: Pending) {
        if (pending?.messageId == null) {
            return
        }

        IDBPending.updatePending(pending)

    }

    static deleteByMessageId(messageId: string) {
        if (messageId == null) {
            return
        }

        IDBPending.deletePendingByMessageId(messageId)
    }

    static deleteById(id: number) {
        if (id == null) {
            return
        }

        IDBPending.deletePendingById(id)
    }

    static deleteAll() {
        IDBPending.deleteAllPendings()
    }
}
