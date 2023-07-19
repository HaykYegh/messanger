import {SignalingStatus} from "modules/messages/SignalingStatus";
import {SignalingMessage} from "modules/messages/SignalingMessage";
import {SignalingBase} from "modules/messages/SignalingBase";
import Log from "modules/messages/Log";

export class SignalingBatch extends SignalingBase {
    statuses: SignalingStatus[] = []
    messages: SignalingMessage[] = []

    constructor(message: any) {
        super()
        let batchMessages = message.messages
        let batchStatuses = message.statuses


        for (let i = 0; i < batchMessages.length; i++){
            let msg = batchMessages[i]
            let msgObj = new SignalingMessage(msg)
            this.messages.push(msgObj)
        }

        for (let i = 0; i < batchStatuses.length; i++){
            let status = batchStatuses[i]
            let statusObj = new SignalingStatus()
            statusObj.configureWithBatchObj(status)
            this.statuses.push(statusObj)
        }
    }
}
