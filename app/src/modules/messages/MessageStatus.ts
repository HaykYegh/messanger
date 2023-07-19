export class MessageStatus extends Number {
    get value(): Number {
        return this
    }

    static pending: MessageStatus = new MessageStatus(0)
    static preAckServer: MessageStatus = new MessageStatus(1)
    static serverRecived: MessageStatus = new MessageStatus(2)
    static delivery: MessageStatus = new MessageStatus(3)
    static seen: MessageStatus = new MessageStatus(4)
}