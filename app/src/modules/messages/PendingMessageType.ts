export class PendingMessageType extends Number{
    private constructor(value: any) {
        super(value);
    }

    get value(): number {
        return this.valueOf()
    }

    static get(value: any){
        switch (value.valueOf()) {
            case PendingMessageType.notificationSound.valueOf():
                return PendingMessageType.notificationSound
            case PendingMessageType.delivery.valueOf():
                return PendingMessageType.delivery
            case PendingMessageType.deliveryAck.valueOf():
                return PendingMessageType.deliveryAck
            case PendingMessageType.seen.valueOf():
                return PendingMessageType.seen
            case PendingMessageType.seen.valueOf():
                return PendingMessageType.seen
            case PendingMessageType.seenAck.valueOf():
                return PendingMessageType.seenAck
            default:
                return PendingMessageType.message
        }
    }

    static message: PendingMessageType = new PendingMessageType(0)
    static delivery: PendingMessageType = new PendingMessageType(1)
    static deliveryAck: PendingMessageType = new PendingMessageType(2)
    static seen: PendingMessageType = new PendingMessageType(3)
    static seenAck: PendingMessageType = new PendingMessageType(4)
    static notificationSound: PendingMessageType = new PendingMessageType(5)
}
