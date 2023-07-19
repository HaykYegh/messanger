import {SignalingBase} from "modules/messages/SignalingBase";
import {Message} from "modules/messages/Message";

export class SignalingPartMessage extends SignalingBase{
    msgId: string = ""
    from: string = ""
    convId: string = ""
    type: string = ""
    fileSize: string = ""

//    var count: Int = 0
    partNumber: number = -1
    partCount: number = 0

    configure(message: Message){
        this.msgId = message.relMessageId!
        this.type = `${message.messageType.value}`
        this.convId = this.getConvId(message)
        this.from = message.from
//        self.count = message.partCount
        this.partCount = message.partCount
        this.partNumber = message.partCount - 1
        this.fileSize = message.fileSize
    }

    private getConvId(message: Message): string {
        if (message.isGroup) {
            return message.uid
        } else {
            return message.from
        }
    }
}