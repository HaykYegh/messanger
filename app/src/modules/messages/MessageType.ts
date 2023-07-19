import {int} from "aws-sdk/clients/datapipeline";

export class MessageType extends Number {
    get value(): Number {
        return this
    }

    private constructor(value: any) {
        super(value);
    }

    static get(value: any) {
        switch (value.valueOf()) {
            case MessageType.image.valueOf():
                return MessageType.image
            case MessageType.video.valueOf():
                return MessageType.video
            case MessageType.location.valueOf():
                return MessageType.location
            case MessageType.voice.valueOf():
                return MessageType.voice
            case MessageType.sticker.valueOf():
                return MessageType.sticker
            case MessageType.zangi.valueOf():
                return MessageType.zangi
            case MessageType.caption.valueOf():
                return MessageType.caption
            case MessageType.url.valueOf():
                return MessageType.url
            case MessageType.file.valueOf():
                return MessageType.file
            case MessageType.deleteNotUse.valueOf():
                return MessageType.deleteNotUse
            case MessageType.edit.valueOf():
                return MessageType.edit
            case MessageType.unread.valueOf():
                return MessageType.unread
            case MessageType.thumb_image.valueOf():
                return MessageType.thumb_image
            case MessageType.thumb_video.valueOf():
                return MessageType.thumb_video
            case MessageType.system.valueOf():
                return MessageType.system
            case MessageType.contact.valueOf():
                return MessageType.contact
            case MessageType.crypt.valueOf():
                return MessageType.crypt
            case MessageType.network_join.valueOf():
                return MessageType.network_join
            case MessageType.network_leave.valueOf():
                return MessageType.network_leave
            case MessageType.network_kick.valueOf():
                return MessageType.network_kick
            case MessageType.network_update.valueOf():
                return MessageType.network_update
            case MessageType.network_delete.valueOf():
                return MessageType.network_delete
            case MessageType.join_service.valueOf():
                return MessageType.join_service
            case MessageType.remove_service.valueOf():
                return MessageType.remove_service
            case MessageType.transport.valueOf():
                return MessageType.transport
            case MessageType.transport_locked.valueOf():
                return MessageType.transport_locked
            case MessageType.notification.valueOf():
                return MessageType.notification
            case MessageType.group_begin.valueOf():
                return MessageType.group_begin
            case MessageType.join.valueOf():
                return MessageType.join
            case MessageType.leave.valueOf():
                return MessageType.leave
            case MessageType.kick.valueOf():
                return MessageType.kick
            case MessageType.changename.valueOf():
                return MessageType.changename
            case MessageType.invite.valueOf():
                return MessageType.invite
            case MessageType.change_avatar.valueOf():
                return MessageType.change_avatar
            case MessageType.delete.valueOf():
                return MessageType.delete
            case MessageType.contact_join.valueOf():
                return MessageType.contact_join
            case MessageType.group_delete.valueOf():
                return MessageType.group_delete
            case MessageType.group_create.valueOf():
                return MessageType.group_create
            case MessageType.crypt_status.valueOf():
                return MessageType.crypt_status
            case MessageType.start_group_call.valueOf():
                return MessageType.start_group_call
            case MessageType.ringing_group_call.valueOf():
                return MessageType.ringing_group_call
            case MessageType.join_group_call.valueOf():
                return MessageType.join_group_call
            case MessageType.leave_group_call.valueOf():
                return MessageType.leave_group_call
            case MessageType.decline_group_call.valueOf():
                return MessageType.decline_group_call
            case MessageType.group_call_video.valueOf():
                return MessageType.group_call_video
            case MessageType.group_call_current_members.valueOf():
                return MessageType.group_call_current_members
            case MessageType.group_call_mute.valueOf():
                return MessageType.group_call_mute
            case MessageType.group_change_initiator.valueOf():
                return MessageType.group_change_initiator
            case MessageType.group_call_hold.valueOf():
                return MessageType.group_call_hold
            case MessageType.end_group_call.valueOf():
                return MessageType.end_group_call
            case MessageType.group_end.valueOf():
                return MessageType.group_end
            default:
                return MessageType.text
        }
    }

    static text: MessageType = new MessageType(0)
    static image: MessageType = new MessageType(1)
    static video: MessageType = new MessageType(2)
    static location: MessageType =  new MessageType(3)
    static voice: MessageType =  new MessageType(4)
    static sticker: MessageType =  new MessageType(5)
    static zangi: MessageType =  new MessageType(6)
    static caption: MessageType =  new MessageType(7)
    static url: MessageType =  new MessageType(8)
    static file: MessageType =  new MessageType(9)
    static deleteNotUse: MessageType =  new MessageType(10)
    static edit: MessageType =  new MessageType(11)
    static unread: MessageType =  new MessageType(12)
    static thumb_image: MessageType =  new MessageType(13)
    static thumb_video: MessageType =  new MessageType(14)
    static system: MessageType =  new MessageType(15)
    static contact: MessageType =  new MessageType(16)
    static crypt: MessageType =  new MessageType(17)
    //network change types
    static network_join: MessageType =  new MessageType(18)
    static network_leave: MessageType =  new MessageType(19)
    static network_kick: MessageType =  new MessageType(20)
    static network_update: MessageType =  new MessageType(21)
    static network_delete: MessageType =  new MessageType(22)
    static join_service: MessageType =  new MessageType(23)
    static remove_service: MessageType =  new MessageType(24)
    static transport: MessageType =  new MessageType(25)
    static transport_locked: MessageType =  new MessageType(26)
    static notification: MessageType =  new MessageType(27)
    static group_begin: MessageType =  new MessageType(100)
    static join: MessageType =  new MessageType(101)
    static leave: MessageType =  new MessageType(102)
    static kick: MessageType =  new MessageType(103)
    static changename: MessageType =  new MessageType(104)
    static invite: MessageType =  new MessageType(105)
    static change_avatar: MessageType =  new MessageType(106)
    static delete: MessageType =  new MessageType(112)
    static contact_join: MessageType =  new MessageType(113)
    static group_delete: MessageType =  new MessageType(114)
    static group_create: MessageType =  new MessageType(115)
    static crypt_status: MessageType =  new MessageType(151)
    static start_group_call: MessageType =  new MessageType(160)
    static ringing_group_call: MessageType =  new MessageType(161)
    static join_group_call: MessageType =  new MessageType(162)
    static leave_group_call: MessageType =  new MessageType(163)
    static decline_group_call: MessageType =  new MessageType(164)
    static group_call_video: MessageType =  new MessageType(165)
    static group_call_current_members: MessageType =  new MessageType(166)
    static group_call_mute: MessageType =  new MessageType(167)
    static group_change_initiator: MessageType =  new MessageType(168)
    static group_call_hold: MessageType =  new MessageType(169)
    static end_group_call: MessageType =  new MessageType(175)
    static group_end: MessageType =  new MessageType(199)
    
    static fromString(value: string) : MessageType {
        let type: MessageType = MessageType.text

        if (value == null){
            return type
        }

        switch (value!) {
            case "LOCATION":
                type = MessageType.location
                break
            case "CREATE_ROOM":
                type = MessageType.group_create
                break
            case "JOIN_ROOM":
                type = MessageType.join
                break
            case "STICKER":
                type = MessageType.sticker
                break
            case "FILE_TYPE":
                type = MessageType.file
                break
            case "FILE":
                type = MessageType.file
                break
            case "IMAGE":
                type = MessageType.image
                break
            case "VOICE":
                type = MessageType.voice
                break
            case "VIDEO":
                type = MessageType.video
                break
            case "CHANGE_ROOM_AVATAR":
                type = MessageType.change_avatar
                break
            case "LEAVE_ROOM":
                type = MessageType.leave
                break
            case "KICK_ROOM":
                type = MessageType.kick
                break
            case "CHANGE_ROOM":
                type = MessageType.changename
                break
            case "ROOM_INVITE":
                type = MessageType.invite
                break
            case "ENCRYPT_INFO":
                type = MessageType.crypt
                break
            case "DELETE_MSG":
                type = MessageType.delete
                break
            case "EDITE_MSG":
                type = MessageType.edit
                break
            case "THUMB_IMAGE":
                type = MessageType.thumb_image
                break
            case "THUMB_VIDEO":
                type = MessageType.thumb_video
                break
            case "SYSTEM":
                type = MessageType.system
                break
            case "CONTACT_JOIN_MSG":
                type = MessageType.contact_join
                break
            case "CONTACT_WITH_INFO":
                type = MessageType.contact
                break
            case "DELETE_ROOM":
                type = MessageType.group_delete
                break
            case "NETWORK_JOIN":
                type = MessageType.network_join
                break
            case "NETWORK_LEAVE":
                type = MessageType.network_leave
                break
            case "NETWORK_KICK":
                type = MessageType.network_kick
                break
            case "NETWORK_UPDATE":
                type = MessageType.network_update
                break
            case "NETWORK_DELETE":
                type = MessageType.network_delete
                break
            case "ROOM_CALL_START":
                type = MessageType.start_group_call
                break
            case "ROOM_CALL_RINGING":
                type = MessageType.ringing_group_call
                break
            case "ROOM_CALL_JOIN":
                type = MessageType.join_group_call
                break
            case "ROOM_CALL_LEAVE":
                type = MessageType.leave_group_call
                break
            case "ROOM_CALL_DECLINE":
                type = MessageType.decline_group_call
                break
            case "ROOM_CALL_CURRENT_MEMBERS":
                type = MessageType.group_call_current_members
                break
            case "ROOM_CALL_MUTE":
                type = MessageType.group_call_mute
                break
            case "ROOM_CALL_CHANGE_INITIATOR":
                type = MessageType.group_change_initiator
                break
            case "ROOM_CALL_HOLD":
                type = MessageType.group_call_hold
                break
            case "ROOM_CALL_END":
                type = MessageType.end_group_call
                break
            case "ROOM_CALL_VIDEO":
                type = MessageType.group_call_video
                break
            case "ADD_SERVICE":
                type = MessageType.join_service
                break
            case "REMOVE_SERVICE":
                type = MessageType.remove_service
                break
            case "MSG_TRANSPORT_LOCKED":
                type = MessageType.transport_locked
                break
            case "MSG_TRANSPORT":
                type = MessageType.transport
                break
            case "NOTIFICATION":
                type = MessageType.notification
                break
            default:
                type = MessageType.text
                break
        }

        return type
    }

    get localizedDescription(): string {
        return MessageType.fromType(this.valueOf())
    }

    static fromType(value: number) : string {
        var type = "TXT"
        let messageType: MessageType = new MessageType(value)
        switch (messageType) {
            case MessageType.location:
                type = "LOCATION"
                break
            case MessageType.group_create:
                type = "CREATE_ROOM"
                break
            case MessageType.join:
                type = "JOIN_ROOM"
                break
            case MessageType.sticker:
                type = "STICKER"
                break
            case MessageType.file:
                type = "FILE"
                break
            case MessageType.image:
                type = "IMAGE"
                break
            case MessageType.voice:
                type = "VOICE"
                break
            case MessageType.video:
                type = "VIDEO"
                break
            case MessageType.change_avatar:
                type = "CHANGE_ROOM_AVATAR"
                break
            case MessageType.leave:
                type = "LEAVE_ROOM"
                break
            case MessageType.kick:
                type = "KICK_ROOM"
                break
            case MessageType.changename:
                type = "CHANGE_ROOM"
                break
            case MessageType.invite:
                type = "ROOM_INVITE"
                break
            case MessageType.crypt:
                type = "ENCRYPT_INFO"
                break
            case MessageType.delete:
                type = "DELETE_MSG"
                break
            case MessageType.edit:
                type = "EDITE_MSG"
                break
            case MessageType.thumb_image:
                type = "THUMB_IMAGE"
                break
            case MessageType.thumb_video:
                type = "THUMB_VIDEO"
                break
            case MessageType.system:
                type = "SYSTEM"
                break
            case MessageType.contact_join:
                type = "CONTACT_JOIN_MSG"
                break
            case MessageType.contact:
                type = "CONTACT_WITH_INFO"
                break
            case MessageType.group_delete:
                type = "DELETE_ROOM"
                break
            case MessageType.network_join:
                type = "NETWORK_JOIN"
                break
            case MessageType.network_leave:
                type = "NETWORK_LEAVE"
                break
            case MessageType.network_kick:
                type = "NETWORK_KICK"
                break
            case MessageType.network_update:
                type = "NETWORK_UPDATE"
                break
            case MessageType.network_delete:
                type = "NETWORK_DELETE"
                break
            case MessageType.start_group_call:
                type = "ROOM_CALL_START"
                break
            case MessageType.ringing_group_call:
                type = "ROOM_CALL_RINGING"
                break
            case MessageType.join_group_call:
                type = "ROOM_CALL_JOIN"
                break
            case MessageType.leave_group_call:
                type = "ROOM_CALL_LEAVE"
                break
            case MessageType.decline_group_call:
                type = "ROOM_CALL_DECLINE"
                break
            case MessageType.group_call_current_members:
                type = "ROOM_CALL_CURRENT_MEMBERS"
                break
            case MessageType.group_call_mute:
                type = "ROOM_CALL_MUTE"
                break
            case MessageType.group_change_initiator:
                type = "ROOM_CALL_CHANGE_INITIATOR"
                break
            case MessageType.group_call_hold:
                type = "ROOM_CALL_HOLD"
                break
            case MessageType.end_group_call:
                type = "ROOM_CALL_END"
                break
            case MessageType.group_call_video:
                type = "ROOM_CALL_VIDEO"
                break
            case MessageType.join_service:
                type = "ADD_SERVICE"
                break
            case MessageType.remove_service:
                type = "REMOVE_SERVICE"
                break
            case MessageType.transport_locked:
                type = "MSG_TRANSPORT_LOCKED"
                break
            case MessageType.transport:
                type = "MSG_TRANSPORT"
                break
            case MessageType.notification:
                type = "NOTIFICATION"
                break
            default:
                type = "TXT"
                break
        }

        return type
    }

    static fromInt(value: number) : MessageType {
        return new MessageType(value)
    }

    static isVideoOrImage(type: number) : boolean {
        return type == MessageType.image.value || type == MessageType.video.value
    }

    static isMedia(type: number) : boolean {
        return type == MessageType.image.value || type == MessageType.video.value || type == MessageType.file.value || type == MessageType.voice.value
    }
}