import {SignalingBase} from "modules/messages/SignalingBase";
import {third} from "configs/animation/settings/whyOurApp/3";
import Log from "modules/messages/Log";

export class SignalingStatus extends SignalingBase {
    isE2ESupport: number = -1
    msgId: string = null
    from: string = null
    status: string = null
    to: string = null
    roomName: string = null
    xmlObject: any = null

    constructor(message: any = null) {
        super()

        if (message == null){
            return
        }

        if (message instanceof  Strophe.Builder){
            this.configureByStrophe(message)
        } else {
            this.configureByObject(message)
        }
    }

    private configureByStrophe(message: Strophe.Builder){

    }

    private configureByObject(message: any) {
        this.to = this.getUserNumberWithoutPrefix(message.to)
        this.from = this.getUserNumberWithoutPrefix(message.from)

        if (message.id != null && message.id != ""){
            this.msgId = message.id
        } else {
            this.msgId = message.msgId
        }

        if (message.ack == "1"){
            this.status = message.ack
        } else {
            this.status = message.status
        }

        this.roomName = message.roomName

        this.isE2ESupport = message.isE2ESupport
        this.xmlObject = message
    }

    configureWithBatchObj(status: any){
        this.configureByObject(status)
        this.xmlObject = this.getXmlObject()
    }

    private getXmlObject(){
        return {
            isE2ESupport: this.isE2ESupport,
            from: this.from,
            to: this.to,
            msgId: this.msgId,
            roomId: this.roomName,
            roomName: this.roomName,
            threadId: this.to
        }
    }
}
