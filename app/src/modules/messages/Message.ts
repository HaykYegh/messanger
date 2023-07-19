import {MessageType} from "modules/messages/MessageType";
import {MessageStatus} from "modules/messages/MessageStatus";
import {MessageTransferStatus} from "modules/messages/MessageTransferStatus";
import conf, {Conversation} from "configs/configurations";
import {SignalingMessage} from "modules/messages/SignalingMessage";
import {Double} from "aws-sdk/clients/pi";
import Log from "modules/messages/Log";
import {string} from "prop-types";
import {UserManager} from "modules/messages/UserManager";
import {CARBONS_2_REQUEST_XMLNS, RECEIPTS_REQUEST_XMLNS} from "xmpp/XMLConstants";

export class Message{
    private static TAG: string = "Message"
    generalType: string = "chat"
    to: string = ""
    messageTime: Date = new Date()
    messageTimeTick: number = 0
    message: string = ""
    msgId: string = `msgId${Date.now()}`
    msgInfo: string
    email: string
    relMessageId: string
    reset: boolean = false
    isExistKey: boolean = false
    messageType: MessageType = MessageType.text
    messageTypeString: string = "TXT"
    fileSize: string = ""
    fileRemotePath: string = ""
    status: MessageStatus = MessageStatus.pending
    transferStatus: MessageTransferStatus = MessageTransferStatus.transferNone
    fileExtension: string
    isGroup: boolean = false
    uid: string = ""
    from: string = ""
    conversation: Conversation
    isIncoming: boolean = false
    mediaAssetsLibraryURL: string
    isPlaySound: boolean = true
    replyId: string
    shareUrlPath: string = ""
    isEncryption: boolean = false
    encryptMessage: string
    encryptMessageInfo: string
    encryptFileRemotePath: string
    role:string
    isServerRecived: boolean = false
    isServerMessage: boolean = false
    isSyncProfile: boolean = false
    pid: string = null
    isCommit: boolean = true
    isSilent: boolean = false
    isVerified: boolean = false
    isVisible: boolean = true
    isPrivate: boolean = false


    groupName: string = null
    firstName: string
    lastName: string
    avatarHash: string
    isCarbon: boolean = false
    callId: string = null
    resolution: string = null
    partCount: number = 0
    isMyMessageFromOtherDevice: boolean = false

    //Tranfer Data
    isDelivery: boolean = false
    isSeen: boolean = false
    xmlObject: any = null
    xmlNotification: any = null

    private static _offlineMessageDiff: number = 0
    static get offlineMessageDiff(): number {
        // let time = UserDefaultsManager.standard.object("offlineMessageDiff") as Number
        //
        // if (time == null) {
        //     Log.i(this.TAG, "_offlineMessageDiff is NULL")
        //     this._offlineMessageDiff = 0
        // } else {
        //     this._offlineMessageDiff = time!.doubleValue
        // }

        return this._offlineMessageDiff
    }

    static set offlineMessageDiff(newValue: number) {
        this._offlineMessageDiff = newValue


        // UserDefaultsManager.standard.set(NSNumber(value: _offlineMessageDiff), forKey: "offlineMessageDiff")
        // UserDefaultsManager.standard.synchronize()


        Log.i(this.TAG, `offlineMessageDiff is ${newValue}`)
    }

    configure(message: SignalingMessage) {
        if (message == null) {
            return
        }

        let msg = message

        this.generalType = msg.type ?? "chat"
        if (this.generalType.includes("|")) {
            this.generalType = this.generalType.split("|")[0]
            this.isSyncProfile = true
        }

        this.messageType = MessageType.fromString(msg.msgType)
        this.messageTypeString = msg.msgType != null ? msg.msgType : "TXT"

        Log.i("message12345 ->", message)

        this.isMyMessageFromOtherDevice = this.isMessageFromMeFromMyOtherDevice(msg.from)

        if (this.isMyMessageFromOtherDevice){
            this.isIncoming = false
        } else {
            this.isIncoming = true
        }

        this.to = msg.to != null ? msg.to : ""
        this.from = msg.from != null ? msg.from : ""

        if (this.messageType == MessageType.end_group_call && this.generalType != "groupchat") {
            this.generalType = "groupchat"

            if (!this.from.includes("gid")) {
                this.from = `${UserManager.sharedInstance.userNumber}/gid${this.from}`
            }
        }

        var split = this.from.split("/")
        if (split.length > 0) {
            this.from = split[0]

            if (split.length > 1) {
                this.uid = split[1]
                this.isGroup = true
            }
        }


        split = this.from.split("@")
        if (split.length > 0) {
            this.from = split[0]
        }

        if (this.isIncoming) {
            if (!this.isGroup) {
                this.uid = this.from
            }
        } else if (this.uid == "") {
            this.uid = this.to

            if (this.to.includes("gid")) {
                this.isGroup = true
            }
        }

        if (this.isGroup) {
            this.generalType = "groupchat"
        }

        this.email = msg.email
        this.msgId = msg.msgId ?? ""
        this.msgInfo = msg.msgInfo
        this.reset = this.getDictProperty(msg.reset)
        this.relMessageId = msg.rel
        this.isExistKey = this.getDictProperty(msg.isExistKey)
        this.fileSize = msg.fileSize != null ? msg.fileSize : ""
        this.partCount = msg.partCount
        this.avatarHash = msg.avatarHash
        this.replyId = msg.repId
        this.message = msg.msg
        this.resolution = msg.resolution
        this.fileRemotePath = msg.fileRemotePath ?? ""
        this.firstName = msg.firstName
        this.lastName = msg.lastName
        this.avatarHash = msg.avatarHash
        this.relMessageId = msg.rel
        this.fileExtension = msg.ext

        let transferStatus = MessageTransferStatus.get(msg.transferStatus)
        this.changeTransferStatus(transferStatus)


        var receiveDate = new Date()

        if (msg.time != null && msg.time != "") {
            let receiveTime = Number(msg.time)
            var timeInterval = receiveTime
            timeInterval += Message.offlineMessageDiff
            if (timeInterval > 0) {
                receiveDate = new Date(timeInterval / 1000)
            }
        }

        this.messageTime = receiveDate;
        this.messageTimeTick = this.messageTime != null ? this.messageTime.getMilliseconds(): 0

        this.status = MessageStatus.delivery

        if (this.messageType == MessageType.change_avatar) {
            if (this.message == "") {
                this.message = this.msgInfo ?? ""
            }
        }

        if (this.messageType == MessageType.changename) {
            this.groupName = this.msgInfo
        }

        this.xmlNotification = message.xmlNotification

        if (message.xmlObject != null){
            this.xmlObject = message.xmlObject
        } else {
            this.xmlObject = this.getXmlObject()
        }
    }

    private getXmlObject() {
        var from = this.getNumberInWebFormat(this.from)
        var to = this.getNumberInWebFormat(this.to)

        if (this.isGroup) {
            from =  this.uid + "@conference.msg.hawkstream.com/" + from
        }

        if (this.isMyMessageFromOtherDevice){
            to = this.uid + "@conference.msg.hawkstream.com/" + to
        }

        return {
            msg: this.message,
            body: this.message,
            text: this.message,
            fileSize: this.fileSize,
            from: from,
            id: this.msgId,
            isExistKey: this.isExistKey,
            msgType: this.messageTypeString,
            request: {xmlns: this.getXmlType()},
            reset: this.reset,
            time: this.messageTime,
            to: to,
            transferStatus: this.transferStatus,
            type: this.generalType,
            repid: this.replyId,
            fileRemotePath: this.fileRemotePath,
            ext: this.fileExtension,
            rel: this.relMessageId,
            email: this.email,
            // alias: from,
            msgInfo: this.msgInfo,
            resolution: this.resolution,
            firstName: this.firstName,
            lastName: this.lastName,
            avatarHash: this.avatarHash,
            role: this.role,
            partCount: this.partCount,
            threadId: this.uid,
            conversationId: this.uid,
            "xml:lang": "en"
        }
    }

    private getXmlType() : string {
        if (this.isMyMessageFromOtherDevice){
            return CARBONS_2_REQUEST_XMLNS
        }

        return RECEIPTS_REQUEST_XMLNS
    }

    private getNumberInWebFormat(number: string) : string {
        if (number == null || number == ""){
            return ""
        }

        if (!number.startsWith(conf.app.prefix)){
            number = conf.app.prefix + number
        }

        if (!this.isGroup){
            if (!number.includes("@msg.hawkstream.com")){
                number = number + "@msg.hawkstream.com"
            }
        }

        return number
    }

    changeTransferStatus(tStatus: MessageTransferStatus) {
        this.transferStatus = tStatus
    }

    private getDictProperty(any: any, defaultValue: boolean = false): boolean {
        if (any == null) {
            return defaultValue
        }

        if ((any instanceof string)) {
            return any as string == "1"
        } else if (any instanceof Boolean) {
            return any as boolean
        }

        return defaultValue
    }

    get senderNumber(): string {
        var from: string = this.from
        if (from != "") {
            let split = from.split("/")
            if (split.length > 0) {
                if (split.length > 1) {
                    if (split[0].includes("gid")) {
                        from = split[1]
                    } else {
                        from = split[0]
                    }
                } else {
                    from = split[0]
                }
            } else {
                from = ""
            }
        }

        return from
    }

    getGroupId(): string {
        if (this.isGroup) {
            return this.uid
        } else {
            return ""
        }
    }

    private isMessageFromMeFromMyOtherDevice(from: string): boolean {
        if (from == null){
            return false
        }

        var number = from

        if (from.includes("/")){
            let split = from.split("/")

            if (split.length > 0) {
                number = split[0]
            }
        }

        Log.i("isMessageFromMeFromMyOtherDevice -> number", number)
        Log.i("isMessageFromMeFromMyOtherDevice -> userNumber", UserManager.sharedInstance.userNumber)

        return number == UserManager.sharedInstance.userNumber
    }
}
