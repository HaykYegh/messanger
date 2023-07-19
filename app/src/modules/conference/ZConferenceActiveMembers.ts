import {Map} from "immutable";
import Log from "modules/messages/Log";

export class ZConferenceActiveMembers {
    private activeMembers: any = []

    add(member: Map<string, any>): any {
        if (!this.activeMembers[0] || !this.activeMembers[1]) {
            Log.i("ZConferenceActiveMembers -> member = ", member)
            this.activeMembers.push([{member}])
            this.changeCoordinates()
            return this.activeMembers
        }

        if (!this.activeMembers[0][1]) {
            this.activeMembers[0].push({member})
            this.changeCoordinates()
            return this.activeMembers
        }

        if (!this.activeMembers[1][1]) {
            this.activeMembers[1].push({member})
            this.changeCoordinates()
            return this.activeMembers
        }
    }

    addAll(membersArr: any): any {
        this.activeMembers = []
        membersArr.forEach((item: Map<string, any>, index) => {
            this.add(item)
        })
    }

    remove(member: Map<string, any>, index1: number, index2: number): void {
        Log.i("activeMembers -> ", this.activeMembers)
        Log.i("activeMembers -> index1", index1)
        this.activeMembers[index1]?.splice(index2, 1)
        this.changeCoordinates()

        return

        this.activeMembers.forEach((array: any, index: number) => {
            array.forEach((item: Map<string, any>, el: number) => {
                if (item.get("username") === member.get("username")) {
                    array?.splice(el, 1)
                }
            })
        })
        this.changeCoordinates()
    }

    public changeCoordinates() {

        if (this.activeMembers[0]?.length === 0 && this.activeMembers[1]?.length > 1) {
            const arr = this.activeMembers[1][this.activeMembers.length - 1]
            this.activeMembers[0][0] = arr
            this.activeMembers[1]?.splice(this.activeMembers.length - 1, 1)
        }
        if (this.activeMembers[1]?.length === 0 && this.activeMembers[0]?.length > 1) {
            const arr = this.activeMembers[0][this.activeMembers.length - 1]
            this.activeMembers[1][0] = arr
            this.activeMembers[0]?.splice(this.activeMembers.length - 1, 1)
        }
        this.activeMembers.forEach((item, index, array) => {
            if(item.length === 0) {
                array?.splice(index, 1)
            }
        })

        Log.i("changeCoordinates -> activeMembers = ", this.activeMembers)

        if (this.activeMembers.length === 1) {
            this.activeMembers[0][0].coordinate = [1, 1]
        }

        if (this.activeMembers.length === 2) {
            if (this.activeMembers[0].length === 1) {
                this.activeMembers[0][0].coordinate = [1, 0]
            }
            if (this.activeMembers[0].length === 2) {
                this.activeMembers[0][0].coordinate = [0, 0]
                this.activeMembers[0][1].coordinate = [2, 0]
            }
            if (this.activeMembers[1].length === 1) {
                this.activeMembers[1][0].coordinate = [1, 2]
            }
            if (this.activeMembers[1].length === 2) {
                this.activeMembers[1][0].coordinate = [0, 2]
                this.activeMembers[1][1].coordinate = [2, 2]
            }
        }
    }

    public getMembers(): any {
        return this.activeMembers
    }
}
