export class InstMessageType extends Number {
    get value(): number {
        return this.valueOf()
    }

    private constructor(value: any) {
        super(value);
    }

    static get(value: any) {
        switch (value.valueOf()){
            case InstMessageType.request.valueOf():
                return InstMessageType.request
            case InstMessageType.recived.valueOf():
                return InstMessageType.recived
            case InstMessageType.composing.valueOf():
                return InstMessageType.composing
            case InstMessageType.paused.valueOf():
                return InstMessageType.paused
            case InstMessageType.onlinestatus.valueOf():
                return InstMessageType.onlinestatus
            case InstMessageType.visiblestatus.valueOf():
                return InstMessageType.visiblestatus
            case InstMessageType.group_create.valueOf():
                return InstMessageType.group_create
            case InstMessageType.group_join.valueOf():
                return InstMessageType.group_join
            case InstMessageType.group_invite.valueOf():
                return InstMessageType.group_invite
            case InstMessageType.group_destroy.valueOf():
                return InstMessageType.group_destroy
            case InstMessageType.group_leave.valueOf():
                return InstMessageType.group_leave
            case InstMessageType.group_kick.valueOf():
                return InstMessageType.group_kick
            case InstMessageType.group_info.valueOf():
                return InstMessageType.group_info
            case InstMessageType.group_member_join.valueOf():
                return InstMessageType.group_member_join
            case InstMessageType.group_member_leave.valueOf():
                return InstMessageType.group_member_leave
            case InstMessageType.group_changename.valueOf():
                return InstMessageType.group_changename
            case InstMessageType.group_change_group_avatar.valueOf():
                return InstMessageType.group_change_group_avatar
            case InstMessageType.seen.valueOf():
                return InstMessageType.seen
            case InstMessageType.switch_to_audio.valueOf():
                return InstMessageType.switch_to_audio
            case InstMessageType.decline_audio.valueOf():
                return InstMessageType.decline_audio
            case InstMessageType.audio_accept.valueOf():
                return InstMessageType.audio_accept
            case InstMessageType.online_status.valueOf():
                return InstMessageType.online_status
            case InstMessageType.group_member_edit_name.valueOf():
                return InstMessageType.group_member_edit_name
            case InstMessageType.group_member_edit_avatar.valueOf():
                return InstMessageType.group_member_edit_avatar
            case InstMessageType.group_member_add_member.valueOf():
                return InstMessageType.group_member_add_member
            case InstMessageType.group_change_role.valueOf():
                return InstMessageType.group_change_role
            case InstMessageType.group_change_role_all.valueOf():
                return InstMessageType.group_change_role_all
            case InstMessageType.group_delete_room.valueOf():
                return InstMessageType.group_delete_room
            case InstMessageType.group_change_role_leave.valueOf():
                return InstMessageType.group_change_role_leave
            case InstMessageType.group_create_info.valueOf():
                return InstMessageType.group_create_info
            case InstMessageType.group_kick_reject.valueOf():
                return InstMessageType.group_kick_reject
            case InstMessageType.group_delete_reject.valueOf():
                return InstMessageType.group_delete_reject
            case InstMessageType.batch.valueOf():
                return InstMessageType.batch
            case InstMessageType.showjoinpush.valueOf():
                return InstMessageType.showjoinpush
            default:
                return InstMessageType.unknown
        }
    }

    static unknown: InstMessageType = new InstMessageType(0)
    static request: InstMessageType = new InstMessageType(1)
    static recived: InstMessageType = new InstMessageType(2)
    static composing: InstMessageType = new InstMessageType(3)
    static paused: InstMessageType = new InstMessageType(4)
    static onlinestatus: InstMessageType = new InstMessageType(5)
    static visiblestatus: InstMessageType = new InstMessageType(6)
    static group_create: InstMessageType = new InstMessageType(7)
    static group_join: InstMessageType = new InstMessageType(8)
    static group_invite: InstMessageType = new InstMessageType(9)
    static group_destroy: InstMessageType = new InstMessageType(10)
    static group_leave: InstMessageType = new InstMessageType(11)
    static group_kick: InstMessageType = new InstMessageType(12)
    static group_info: InstMessageType = new InstMessageType(13)
    static group_member_join: InstMessageType = new InstMessageType(14)
    static group_member_leave: InstMessageType = new InstMessageType(15)
    static group_changename: InstMessageType = new InstMessageType(16)
    static group_change_group_avatar: InstMessageType = new InstMessageType(17)
    static seen: InstMessageType = new InstMessageType(19)
    static switch_to_audio: InstMessageType = new InstMessageType(20)
    static decline_audio: InstMessageType = new InstMessageType(21)
    static audio_accept: InstMessageType = new InstMessageType(22)
    static online_status: InstMessageType = new InstMessageType(27)
    static group_member_edit_name: InstMessageType = new InstMessageType(28)
    static group_member_edit_avatar: InstMessageType = new InstMessageType(29)
    static group_member_add_member: InstMessageType = new InstMessageType(30)
    static group_change_role: InstMessageType = new InstMessageType(31)
    static group_change_role_all: InstMessageType = new InstMessageType(32)
    static group_delete_room: InstMessageType = new InstMessageType(33)
    static group_change_role_leave: InstMessageType = new InstMessageType(34)
    static group_create_info: InstMessageType = new InstMessageType(35)
    static group_kick_reject: InstMessageType = new InstMessageType(36)
    static group_delete_reject: InstMessageType = new InstMessageType(37)
    static batch: InstMessageType = new InstMessageType(999997)
    static showjoinpush: InstMessageType = new InstMessageType(999998)

    get localizedDescription(): string {
        switch (this) {
            case InstMessageType.request:
                return "request"
            case InstMessageType.recived:
                return "recived"
            case InstMessageType.composing:
                return "composing"
            case InstMessageType.paused:
                return "paused"
            case InstMessageType.onlinestatus:
                return "onlinestatus"
            case InstMessageType.visiblestatus:
                return "visiblestatus"
            case InstMessageType.group_create:
                return "group_create"
            case InstMessageType.group_join:
                return "group_join"
            case InstMessageType.group_invite:
                return "group_invite"
            case InstMessageType.group_destroy:
                return "group_destroy"
            case InstMessageType.group_leave:
                return "group_leave"
            case InstMessageType.group_kick:
                return "group_kick"
            case InstMessageType.group_info:
                return "group_info"
            case InstMessageType.group_member_join:
                return "group_member_join"
            case InstMessageType.group_member_leave:
                return "group_member_leave"
            case InstMessageType.group_changename:
                return "group_changename"
            case InstMessageType.group_change_group_avatar:
                return "group_change_group_avatar"
            case InstMessageType.seen:
                return "seen"
            case InstMessageType.switch_to_audio:
                return "switch_to_audio"
            case InstMessageType.decline_audio:
                return "decline_audio"
            case InstMessageType.audio_accept:
                return "audio_accept"
            case InstMessageType.online_status:
                return "online_status"
            case InstMessageType.group_member_edit_name:
                return "group_member_edit_name"
            case InstMessageType.group_member_edit_avatar:
                return "group_member_edit_avatar"
            case InstMessageType.group_member_add_member:
                return "group_member_add_member"
            case InstMessageType.group_change_role:
                return "group_change_role"
            case InstMessageType.group_change_role_all:
                return "group_change_role_all"
            case InstMessageType.group_delete_room:
                return "group_delete_room"
            case InstMessageType.group_change_role_leave:
                return "group_change_role_leave"
            case InstMessageType.group_create_info:
                return "group_create_info"
            case InstMessageType.group_kick_reject:
                return "group_kick_reject"
            case InstMessageType.group_delete_reject:
                return "group_delete_reject"
            case InstMessageType.batch:
                return "batch"
            case InstMessageType.showjoinpush:
                return "showjoinpush"
            default:
                return "unknown"
        }
    }
}
