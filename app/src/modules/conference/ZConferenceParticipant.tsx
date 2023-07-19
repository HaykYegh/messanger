

export class ZConferenceParticipant {
    private participantId:number

    private name:string;

    private properties:Map<number, string>

    public ZConferenceParticipant(participantId: number, name: string, properties: Map<number, string>) {
        this.participantId = participantId;
        this.name = name;
        this.properties = properties;
    }

    public ZConferenceParticipantSecond(participantId: number, name: string) {
        this.participantId = participantId;
        this.name = name;
        this.properties = new Map();
    }

    public getId(): number {
        return this.participantId;
    }

    public getName():string {
        return name;
    }

    public setProperty(propertyId:number, value: string): void {
        this.properties.set(propertyId, value);
    }

    public getProperty(propertyId: number): string {
        return this.properties.get(propertyId);
    }

    public getAll():Map<number, string> {
            return this.properties;
    }
}
