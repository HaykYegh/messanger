import {PendingTimer, PendingTimerDelegate} from "modules/messages/PendingTimer";
import Log from "modules/messages/Log";
import {RegistrationService} from "modules/messages/RegistrationService";
import connectionCreator from "xmpp/connectionCreator";
import {Pending} from "modules/messages/Pending";
import {PendingMessageType} from "modules/messages/PendingMessageType";
import {PendingType} from "modules/messages/PendingType";
import {PendingDao} from "modules/messages/PendingDao";
import {TransportManager} from "modules/messages/TransportManager";

export class PendingQueue implements PendingTimerDelegate {
    static instance: PendingQueue = new PendingQueue()
    timer: PendingTimer = new PendingTimer()

    private TAG: String = "PendingQueue"
    private isLogs = true

    constructor() {
        this.timer.delegate = this
    }

    async addMessageToQueue(pending: Pending) {
        if (pending == null) {
            if (this.isLogs) {
                Log.e(this.TAG, "MQ -> Critical Error -> message not send, beacause pending is NULL")
            }
            return
        }

        if (RegistrationService.instance.isConnected) {
            this.sendPendingMessageFromQueue(pending)
        } else {
            pending.isLock = this.timer.size == 0

            await PendingDao.insert(pending!)

            this.insertWithPending(pending)
        }


    }

    async addLockMessageToQueue(pending: Pending) {
        if (pending == null) {
            if (this.isLogs) {
                Log.e(this.TAG, "MQ -> Critical Error -> message not send, beacause pending is NULL")
            }
            return
        }

        pending.isLock = true

        if (RegistrationService.instance.isConnected) {
            this.sendPendingMessageFromQueue(pending)
        }

        await PendingDao.insert(pending)

        this.insertWithPending(pending)
    }

    addMessagesToQueue(pendings: Pending[]) {
        if (pendings.length == 0){
            return
        }

        for (let i = 0; i < pendings.length; i++) {
            let pending = pendings[i]
            pending.isLock = false
        }

        PendingDao.insertWithArray(pendings)


        this.insert(pendings)


        this.createBatchAndSend()
    }

    async addBlockToQueue(pendings: Pending[]) {
        if (pendings.length == 0){
            return
        }

        let pending = await this.createEmptyLockBatchPendingInDbAndQueue()
        this.insertPendingsToBatchAndDB(pendings, pending)
        PendingDao.update(pending)
        this.updateChildPendingIdsInDb(pending)
        this.sendPendingMessageFromQueue(pending)

    }

    async forceResendFromDb() {
        this.timer.resset()
        let pendings = await PendingDao.get()

        if (pendings.length > 0) {
            let msgs = pendings.sort((first, second) => {
                if (first.time < second.time) {
                    return -1;
                } else if (first.time > second.time) {
                    return 1;
                } else {
                    return 0;
                }
            })

            for (let i = 0; i < msgs.length; i++) {
                let pending = msgs[i]
                this.insertWithPending(pending)
            }
        }

        this.createBatchAndSend()
    }

    removeAndSendNextPending(msgId: string) : Pending[] {
        msgId = this.containsMsgIdifNotAdd(msgId)
        var pendings: Pending[] = []

        let firstPending = this.getFirstPendingFromQueue()

        pendings = this.findPendings(msgId)

        this.removeMessageFromQueue(msgId)

        if (firstPending?.messageId == msgId) {
            this.createBatchAndSend()
        }

        return pendings
    }

    private containsMsgIdifNotAdd(msgId: string) : string {
        if (msgId && !msgId.startsWith("msgId")){
            msgId = `msgId${msgId}`
        }

        return msgId
    }

    findPendings(msgId: string) {
        var pendings: Pending[] = []

        for (let key in this.timer.getObjects()) {
            let messageQueueObject = this.timer.getObjects()[key] as Pending;
            if (messageQueueObject.messageId == msgId) {
                pendings.push(messageQueueObject)
                if (messageQueueObject.isBatch()) {
                    for (var i = 0; i < messageQueueObject.batches.length; i++) {
                        let queueObj = messageQueueObject.batches[i]

                        if (queueObj.messageId == null) {
                            continue
                        }

                        pendings.push(queueObj)
                    }
                }
            } else if (messageQueueObject.isBatch()) {
                for (var i = 0; i < messageQueueObject.batches.length; i++) {
                    let queueObj = messageQueueObject.batches[i]

                    if (queueObj.messageId == msgId) {
                        if (queueObj.messageId == null) {
                            continue
                        }

                        pendings.push(queueObj)
                    }
                }
            }
        }

        return pendings
    }

    private async createBatchAndSend(){
        if (this.timer.size > 0) {
            await this.createBatch()

            let pending = this.getFirstPendingFromQueue()

            if (pending != null) {
                this.sendPendingMessageFromQueue(pending)
            } else if (this.isLogs) {
                Log.i(this.TAG, "pending object's finish")
            }
        }
    }

    private getFirstPendingFromQueue() {
        var pending: Pending = this.timer.first

        for (let key in this.timer.getObjects()) {
            let obj = this.timer.getObjects()[key] as Pending;
            if (!obj.isBatch()) {
                pending = obj
                break
            }
        }

        return pending
    }

    private updateChildPendingIdsInDb(pending: Pending){
        for (var i = 0; i < pending.batches.length; i++) {
            let childPending = pending.batches[i]

            if (childPending.parentId == pending.id) {
                continue
            }

            childPending.parentId = pending.id
            PendingDao.update(childPending)
        }
    }

    insertPendingsToBatchAndDB(pendings: Pending[], batchPending: Pending){
        for (var i = 0; i < pendings.length; i++) {
            let obj = pendings[i]

            if (obj.messageId == null) {
                if (this.isLogs){
                    Log.e(this.TAG, "MQ -> Critical Error -> messageId is NULL")
                }
                continue
            }

            batchPending.insertWithPending(obj)
            PendingDao.insert(obj)
        }
    }

    onTimerTick() {
        if (!RegistrationService.instance.isConnected) {
            return
        }

        this.createBatchAndSend()
    }

     private async createBatch() {
        let pendingsForCreateBatch = this.getPendingsIfNotBatchAndLockFromQueue()
        let batchPending = await this.createBatchPendingIfNeededAndGet()

        if (pendingsForCreateBatch.length < 2 && batchPending.batches.length == 0){
            return
        }

        batchPending.insert(pendingsForCreateBatch)
        this.removePendingsFromQueue(pendingsForCreateBatch)

        PendingDao.update(batchPending)
        this.updateChildPendingIdsInDb(batchPending)
    }

    private removePendingsFromQueue(pendings: Pending[]) {
        for (var i = 0; i < pendings.length; i++) {
            let obj = pendings[i]
            this.remove(obj)
        }
    }

    private getPendingsIfNotBatchAndLockFromQueue() {
        var pendings: Pending[] = []
        for (let key in this.timer.getObjects()) {
            let objectQueue = this.timer.getObjects()[key] as Pending

            if (objectQueue.isBatch() || objectQueue.isLock) {
                continue
            }

            pendings.push(objectQueue)
        }

        return pendings
    }

    private async createBatchPendingIfNeededAndGet() {
        var pending: Pending = this.getBatchPendingFromQueue()

        if (pending == null) {
            pending = await PendingDao.getPendingBatch()
        }

        if (pending == null) {
            pending = await this.createEmptyBatchPendingInDbAndQueue()
        }

        return pending!
    }


    private getBatchPendingFromQueue() {
        if (this.timer.size == 0) {
            return null
        }

        for (let key in this.timer.getObjects()) {
            let queueObj = this.timer.getObjects()[key] as Pending;
            if (queueObj.isLock || queueObj.type == PendingType.none) {
                continue
            }

            return queueObj
        }

        return null
    }

    private async createEmptyBatchPendingInDbAndQueue() {
        let pending = new Pending()
        pending.isInternalMessage = true
        pending.time = Date.now()
        pending.messageId = `msgId${pending.time}`
        pending.isLock = false
        pending.type = PendingType.batch

        await PendingDao.insert(pending)
        await this.insertWithPending(pending)

        return pending
    }


    private async createEmptyLockBatchPendingInDbAndQueue() {
        let pending = new Pending()
        pending.isInternalMessage = true
        pending.time = Date.now()
        pending.messageId = `msgId${pending.time}`
        pending.isLock = true
        pending.type = PendingType.lockBatch

        await PendingDao.insert(pending)

        this.insertWithPending(pending)

        return pending
    }

    removeMessagesFromQueue() {
        PendingDao.deleteAll()
        this.timer.resset()
    }

    removeMessageFromQueue(msgId: string) {

        var removedObjs: Pending[] = []

        for (let key in this.timer.getObjects()) {
            let messageQueueObject = this.timer.getObjects()[key] as Pending;
            if (messageQueueObject.messageId == msgId) {
                if (this.isLogs) {
                    Log.i(this.TAG, `MQ -> removeMessageFromQueue remove ${messageQueueObject.messageId}`)
                }

                removedObjs.push(messageQueueObject)
                PendingDao.deleteByMessageId(messageQueueObject.messageId)

                if (messageQueueObject.isBatch()) {
                    var removedBatches: Pending[] = []
                    for (var i = 0; i < messageQueueObject.batches.length; i++) {
                        let obj = messageQueueObject.batches[i]
                        if (this.isLogs) {
                            Log.i(this.TAG, `MQ -> removeMessageFromQueue remove from batch ${obj.messageId}`)
                        }

                        PendingDao.deleteByMessageId(obj.messageId)
                        removedBatches.push(obj)
                        removedObjs.push(obj)
                    }

                    for (var i = 0; i < removedBatches.length; i++) {
                        let pending = removedBatches[i]
                        messageQueueObject.removePendingFromBatch(pending)
                    }
                }
            } else if (messageQueueObject.isBatch()) {
                var removedBatches: Pending[] = []

                for (var i = 0; i < messageQueueObject.batches.length; i++) {
                    let obj = messageQueueObject.batches[i]

                    if (obj.messageId == msgId) {
                        if (this.isLogs) {
                            Log.i(this.TAG, `MQ -> removeMessageFromQueue remove from batch ${obj.messageId}`)
                        }

                        PendingDao.deleteByMessageId(messageQueueObject.messageId)
                        removedBatches.push(obj)
                    }
                }

                for (var i = 0; i < removedBatches.length; i++) {
                    let pending = removedBatches[i]

                    messageQueueObject.removePendingFromBatch(pending)
                }

                if (messageQueueObject.batches.length == 0) {
                    if (this.isLogs) {
                        Log.i(this.TAG, `MQ -> removeMessageFromQueue batch ${messageQueueObject.messageId}`)
                    }

                    PendingDao.deleteByMessageId(messageQueueObject.messageId)
                    removedObjs.push(messageQueueObject)
                }
            }
        }

        for (var i = 0; i < removedObjs.length; i++) {
            let pending = removedObjs[i]
            this.remove(pending)
        }
    }

    private sendPendingMessageFromQueue(pending: Pending) {

        if (!RegistrationService.instance.isConnected) {
            if (this.isLogs) {
                Log.e(this.TAG, "don't have internet connection can't send messages")
            }

            this.timer.resset()

            return
        }

        if (pending.isBatch()) {
            this.sendBatchMessageFromQueue(pending)
        } else if (pending.type == PendingType.setting) {
            this.sendSettingMessageFromQueue(pending)
        } else {
            this.sendMessageFromQueue(pending)
        }

        if (!pending.isLock) {
            pending.isLock = true
            PendingDao.update(pending)
        }
    }

    private sendBatchMessageFromQueue(pending: Pending) {
        let json = pending.getJson()

        if (json == null) {
            this.remove(pending)
            this.createBatchAndSend()
            return
        }



        if (pending.type == PendingType.batch) {
            if (this.isLogs) {
                Log.i(this.TAG, `SIGNALING_EVENT -> send batch ${json}`)
            }
        } else if (pending.type == PendingType.lockBatch) {
            if (this.isLogs) {
                Log.i(this.TAG, `SIGNALING_EVENT -> send lock batch ${json}`)
            }
        }

        // const xml = (new DOMParser()).parseFromString(json.toString().replace(/&quot;/g, '"'), "text/xml")
        // console.log(xml, "xml1234")

        // Strophe.xmlGenerator().createElement(json.tree())

        connectionCreator.getConnection().send(json)
    }

    private sendMessageFromQueue(pending: Pending) {
        let json = pending.getJson()
        Log.i("sendMessageFromQueue -> ", json)
        switch (pending.messageType) {
            case PendingMessageType.delivery:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send delivery ${json}`)
                }

                TransportManager.sharedInstance.sendDelivery(json)
                break
            case PendingMessageType.deliveryAck:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send deliveryAck ${json}`)
                }

                connectionCreator.getConnection().send(json)
                break
            case PendingMessageType.seen:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send seen ${json}`)
                }

                TransportManager.sharedInstance.sendSeen(json)
                break
            case PendingMessageType.seenAck:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send seenAck ${json}`)
                }

                connectionCreator.getConnection().send(json)
                break
            default:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send message ${json}`)
                }

                if (json == null) {
                    this.remove(pending)
                    this.createBatchAndSend()
                } else {
                    connectionCreator.getConnection().send(json)
                }
                break
        }
    }

    private sendSettingMessageFromQueue(pending: Pending) {
        let dict = pending.dictMessage

        if (dict == null) {
            this.remove(pending)
            this.createBatchAndSend()
            return
        }

        switch (pending.messageType) {
            case PendingMessageType.notificationSound:
                if (this.isLogs) {
                    Log.i(this.TAG, `SIGNALING_EVENT -> send notification sound ${dict}`)
                }

                // TransportManager.sharedInstance()?.sendNotificationSound(dict)
                break
            default:
                break
        }
    }

    private insert(pendings: Pending[]) {
        for (var i = 0; i < pendings.length; i++) {
            let pending = pendings[i]
            this.insertWithPending(pending)
        }
    }

    private insertWithPending(pending: Pending) {
        this.timer.addObject(pending)
    }

    private remove(pending: Pending) {
        this.timer.removeWithObj(pending)
    }

    async isPendingExist(msgId: string) {
        const pendings = await PendingDao.getbyMessageId(msgId)
        return pendings.length > 0
    }
}
