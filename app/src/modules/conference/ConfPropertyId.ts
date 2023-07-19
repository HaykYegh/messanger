export class ConfPropertyId extends Number {
    get value(): Number {
        return this
    }

    get rawValue(): Number {
        return this
    }

    private constructor(value: any) {
        super(value);
    }

    static get(value: any) {
        switch (value.valueOf()) {
            case ConfPropertyId.mute.valueOf():
                return ConfPropertyId.mute
            case ConfPropertyId.muteAll.valueOf():
                return ConfPropertyId.muteAll
            case ConfPropertyId.hold.valueOf():
                return ConfPropertyId.hold
            default:
                return ConfPropertyId.mute
        }
    }

    static mute: ConfPropertyId = new ConfPropertyId(0)
    static muteAll: ConfPropertyId = new ConfPropertyId(1)
    static hold: ConfPropertyId = new ConfPropertyId(2)

    get localizedDescription(): string {
        return ConfPropertyId.fromType(this.valueOf())
    }

    static fromType(value: number) : string {
        var type = "TXT"
        let messageType: ConfPropertyId = new ConfPropertyId(value)
        switch (messageType) {
            case ConfPropertyId.muteAll:
                type = "MUTE_ALL"
                break
            case ConfPropertyId.hold:
                type = "HOLD"
                break
            default:
                type = "MUTE"
                break
        }

        return type
    }

    static fromInt(value: number) : ConfPropertyId {
        return new ConfPropertyId(value)
    }
}
