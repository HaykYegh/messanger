export class MessageTransferStatus extends Number {
    get value(): Number {
        return this
    }

    private constructor(value: any) {
        super(value);
    }

    static get(value: any) {
        switch (value.valueOf()) {
            case MessageTransferStatus.transferDone.valueOf():
                return MessageTransferStatus.transferDone
            case MessageTransferStatus.transferCompress.valueOf():
                return MessageTransferStatus.transferCompress
            case MessageTransferStatus.transferSending.valueOf():
                return MessageTransferStatus.transferSending
            case MessageTransferStatus.transferDownloading.valueOf():
                return MessageTransferStatus.transferDownloading
            case MessageTransferStatus.transferCloud.valueOf():
                return MessageTransferStatus.transferCloud
            case MessageTransferStatus.transferCancel.valueOf():
                return MessageTransferStatus.transferCancel
            case MessageTransferStatus.transferFailed.valueOf():
                return MessageTransferStatus.transferFailed
            case MessageTransferStatus.transferFaildByLowDataUsage.valueOf():
                return MessageTransferStatus.transferFaildByLowDataUsage
            case MessageTransferStatus.transferFaildByEncryption.valueOf():
                return MessageTransferStatus.transferFaildByEncryption
            case MessageTransferStatus.transferFaildByPremium.valueOf():
                return MessageTransferStatus.transferFaildByPremium
            default:
                return MessageTransferStatus.transferNone
        }
    }

    static transferNone: MessageTransferStatus = new MessageTransferStatus(0)
    static transferDone: MessageTransferStatus =  new MessageTransferStatus(1)
    static transferCompress: MessageTransferStatus =  new MessageTransferStatus(2)
    static transferSending: MessageTransferStatus =  new MessageTransferStatus(3)
    static transferDownloading: MessageTransferStatus =  new MessageTransferStatus(4)
    static transferCloud: MessageTransferStatus =  new MessageTransferStatus(5)
    static transferCancel: MessageTransferStatus =  new MessageTransferStatus(6)
    static transferFailed: MessageTransferStatus =  new MessageTransferStatus(7)
    static transferFaildByLowDataUsage: MessageTransferStatus =  new MessageTransferStatus(8)
    static transferFaildByEncryption: MessageTransferStatus =  new MessageTransferStatus(9)
    static transferFaildByPremium: MessageTransferStatus =  new MessageTransferStatus(10)
}