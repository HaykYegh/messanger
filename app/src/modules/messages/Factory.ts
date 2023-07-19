import {SignalingBase} from "modules/messages/SignalingBase";
import {SignalingEventType} from "modules/messages/SignalingEventType";
import {InstMessageType} from "modules/messages/InstMessageType";
import {SignalingMessage} from "modules/messages/SignalingMessage";
import {SignalingBatch} from "modules/messages/SignalingBatch";
import {SignalingStatus} from "modules/messages/SignalingStatus";
import Log from "modules/messages/Log";

export class Factory {
    static signalingObject(data: any, type: SignalingEventType, subType: InstMessageType): SignalingBase {
        if (data == null) {
            return null
        }

        var base: SignalingBase = null
        switch (type) {
            case SignalingEventType.chat_event_type_txt_msg_server_recieved:
            case   SignalingEventType.chat_event_type_txt_msg_recieved:
            case    SignalingEventType.chat_event_result_dlv_notify:
            case    SignalingEventType.chat_event_type_txt_msg_check_delivery_response:
            case   SignalingEventType.chat_event_type_txt_msg_delivered:


                base = new SignalingStatus(data)
                break
            case SignalingEventType.chat_event_type_inst_message:
            case SignalingEventType.chat_event_type_inst_result_message:

                base = new SignalingStatus(data)
                // base = self.signalingObject(data, type:subType)
                break
            case SignalingEventType.chat_event_type_status_list:
                // base = getSignalingUserStatus(data:data!)
                break
            case SignalingEventType.group_call_event_mute:
            case SignalingEventType.group_call_event_mute_all:
            case SignalingEventType.group_call_event_change_initiator:
            case SignalingEventType.group_call_event_create:
            case SignalingEventType.group_call_event_join:
            case SignalingEventType.group_call_event_add:
            case SignalingEventType.group_call_event_check:
            case SignalingEventType.group_call_event_end:
                // base = Json.jsonObject(data!, typeface:SignalingMessageFromConference.self)
                break
            case SignalingEventType.chat_event_type_part_message:
                // base = Json.jsonObject(data!, typeface:SignalingPartMessage.self)
                break
            case SignalingEventType.chat_event_transfer_file_paths:
                // base = Json.jsonObject(data!, typeface:SignalingTransferFileUrls.self)
                break
            case SignalingEventType.call_event_result_conf_mute:
            case SignalingEventType.call_event_result_conf_mute_all:
            case SignalingEventType.call_event_result_conf_change_initiator:
            case SignalingEventType.call_event_result_conf_cancel:
                // base = Json.jsonObject(data!, typeface:SignalingStatus.self)
                break
            case SignalingEventType.event_badge_count_ack:
            case SignalingEventType.call_event_conf_call_existing_ack:
            case SignalingEventType.event_notification_sound_ack:
            case SignalingEventType.event_conversation_mute_ack:
                // base = Json.jsonObject(data!, typeface:SignalingStatus.self)
                break
            default:
                 base = new SignalingMessage(data)
                break
        }

        return base
    }

    private static getSignalingUserStatus(data: Strophe.Builder): SignalingBase {
        // let arr = Json.jsonObject(data, typeface:[SignalingUserInfo].self)
        // let signalingUserActivityList = SignalingUserActivityList()
        // signalingUserActivityList.statusList = arr ?? []
        // return signalingUserActivityList
        return new SignalingBase()
    }


    static signalingObjectbyText(text: string, type: InstMessageType): SignalingBase {
        if (text == null) {
            return null
        }

        let data = JSON.parse(text)
        return this.signalingObjectByData(data, type)
    }

    static signalingObjectByData(data: any, type: InstMessageType): SignalingBase {
        if (data == null) {
            return null
        }

        var base: SignalingBase = null
        switch (type) {
            case InstMessageType.seen:
                // base = Json.jsonObject(data!, typeface: SignalingStatus.self)
                break
            case InstMessageType.composing:
            case InstMessageType.paused:
                // base = Json.jsonObject(data!, typeface: SignalingTyping.self)
                break
            case InstMessageType.onlinestatus:
                // base = Json.jsonObject(data!, typeface: SignalingUserStatus.self)
                break
            case InstMessageType.group_create:
            case InstMessageType.group_create_info:
            case InstMessageType.group_leave:
            case InstMessageType.group_info:
            case InstMessageType.group_change_role_all:
            case InstMessageType.group_change_role:
            case InstMessageType.group_member_edit_name:
            case InstMessageType.group_member_edit_avatar:
            case InstMessageType.group_member_add_member:
            case InstMessageType.group_change_role_leave:
            case InstMessageType.group_delete_room:
            case InstMessageType.group_delete_reject:
            case InstMessageType.group_invite:
            case InstMessageType.group_kick:
            case InstMessageType.group_changename:
            case InstMessageType.group_change_group_avatar:
                // base = Json.jsonObject(data!, typeface: SignalingGroupInfo.self)
                break
            case InstMessageType.batch:
                base = new SignalingBatch(data)
                break
            default:
                // base = Json.jsonObject(data!, typeface: SignalingMessage.self)
                break
        }

        return base
    }
}
