import {Pending} from "modules/messages/Pending";
import Log from "modules/messages/Log";


export interface PendingTimerDelegate {
    onTimerTick()
}

export class PendingTimer {
    private TAG: String = "PendingTimer"
    delegate: PendingTimerDelegate = null
    responseTimeOutTime: any = 5
    private timer: any = null
    private objects: any = {}
    first: Pending = null

    get size() {
        return Object.keys(this.objects).length
    }


    addObject(obj: Pending) {
        if (obj.messageId == null) {
            return
        }

        this.createTimer()


        let oldObj = this.objects[obj.messageId]

        if (oldObj == null) {
            if (this.size == 0) {
                this.first = obj
            }

            this.objects[obj.messageId] = obj
        }
    }

    resset() {
        this.invalidateTimer()
        this.objects = {}
    }

    removeWithId(id: string) {
        if (id == null) {
            return
        }

        delete this.objects[id]

        if (this.size == 0) {
            this.first = null
            this.invalidateTimer()
        } else if (this.first.messageId == id) {
            this.first = this.objects[Object.keys(this.objects)[0]]
        }
    }

    remove(ids: string[]) {
        if (ids == null) {
            return
        }

        for (let id in ids) {
            this.removeWithId(id)
        }
    }

    removeWithObj(obj: Pending) {
        this.removeWithId(obj.messageId)
    }

    getObjects() : {string:Pending} {
        return this.objects as {string:Pending}
    }

    getObject(id: string) : Pending {
        return this.objects[id] as Pending
    }

    private createTimer() {
        if (this.timer != null) {
            return
        }

        this.timer = setInterval(() => {
            this.checkTimeFired()
        }, 4000)
    }

    private checkTimeFired() {
        this.delegate.onTimerTick()

        if (Object.keys(this.objects).length == 0) {
            this.invalidateTimer()
        }
    }

    private invalidateTimer() {
        clearInterval(this.timer)
        this.timer = null
    }
}
