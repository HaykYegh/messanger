export class ZConferenceActiveUserUnit {
    private userId:number;

    private userName:string;

    private startActivityTime:bigint;

    private lastActivityTime:bigint;

    public ZConferenceActiveUserUnit(userId:number, userName:string, startActivityTime:bigint, lastActivityTime:bigint) {
        this.userId = userId;
        this.userName = userName;
        this.startActivityTime = startActivityTime;
        this.lastActivityTime = lastActivityTime;
    }

    public getUserId():number {
        return this.userId;
    }

    public getUserName():string {
        return this.userName;
    }

    public getStartActivityTime():bigint {
        return this.startActivityTime;
    }

    public getLastActivityTime():bigint {
        return this.lastActivityTime;
    }

    public setLastActivityTime(lastActivityTime:bigint): void {
        this.lastActivityTime = lastActivityTime;
    }
}
