import {SignalingBase} from "modules/messages/SignalingBase";
import parseXML from "../../custom-libs/ObjTree";
import dump from "../../custom-libs/JklDumper";
import conf from "configs/configurations";
import Log from "modules/messages/Log";

export class SignalingMessage extends SignalingBase{
    to: string = null
    from: string = null
    email: string = null
    alias: string = null
    time: string = null
    msg: string = null
    msgId: string = null
    msgType: string = null
    fileSize: string = null
    msgInfo: string = null
    fileRemotePath: string = null
    repId: string = null
    rel: string = null
    ext: string = null
    resolution: string = null
    type: string = null
    firstName: string = null
    lastName: string = null
    avatarHash: string = null
    isExistKey: number = 0
    reset: number = 0
    role: string = null
    partCount: number = 0
    transferStatus: number = 0
    xmlObject: any = null
    xmlNotification: any = null

    constructor(message: any) {
        super()
        if (message instanceof  Strophe.Builder){
            this.configureByStrophe(message)
        } else {
            this.configureByObject(message)
        }
    }

    private configureByStrophe(message: Strophe.Builder){

    }

    private configureByObject(message: any) {
        if (message.body != null && message.body != ""){
            this.msg = message.body
        } else {
            this.msg = message.msg
        }

        this.from = this.getUserNumberWithoutPrefix(message.from)
        this.to = this.getUserNumberWithoutPrefix(message.to)
        this.email = message.email
        this.alias = message.alias
        this.fileSize = message.fileSize
        if (message.id != null && message.id != ""){
            this.msgId = message.id
        } else {
            this.msgId = message.msgId
        }

        this.isExistKey = Number(message.isExistKey)
        this.msgType = message.msgType
        this.reset = Number(message.reset)
        this.time = message.time
        this.transferStatus = Number(message.transferStatus)
        this.type = message.type
        this.msgInfo = message.msgInfo
        this.fileRemotePath = message.fileRemotePath

        if (message.repId != null && message.repId != ""){
            this.repId = message.repId
        } else {
            this.repId = message.repid
        }

        this.rel = message.rel
        this.ext = message.ext
        this.resolution = message.resolution
        this.firstName = message.firstName
        this.lastName = message.lastName
        this.avatarHash = message.avatarHash
        this.role = message.role
        this.partCount = message.partCount
    }
}

