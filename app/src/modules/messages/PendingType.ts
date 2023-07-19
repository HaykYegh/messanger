export class PendingType extends Number{
    private constructor(value: any) {
        super(value);
    }

    static get(value: any){
        switch (value.valueOf()) {
            case PendingType.none.valueOf():
                return PendingType.none
            case PendingType.batch.valueOf():
                return PendingType.batch
            case PendingType.lockBatch.valueOf():
                return PendingType.lockBatch
            case PendingType.setting.valueOf():
                return PendingType.setting
        }
    }
    get value(): number {
        return this.valueOf()
    }

    static none: PendingType = new PendingType(0)
    static batch: PendingType = new PendingType(1)
    static lockBatch: PendingType = new PendingType(2)
    static setting: PendingType = new PendingType(3)
}
