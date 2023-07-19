import {number} from "prop-types";

export class SignalingEventType extends Number {
    private constructor(value: any) {
        super(value);
    }

    get value(): number {
        return this.valueOf()
    }

    static event_type_unknown: SignalingEventType = new SignalingEventType(0)

    //rtmp messages
    static event_connected: SignalingEventType = new SignalingEventType(1)
    static event_disconnected: SignalingEventType = new SignalingEventType(2)
    static event_audiodata: SignalingEventType = new SignalingEventType(3)
    static event_videodata: SignalingEventType = new SignalingEventType(4)
    static event_publisher_stream_created: SignalingEventType = new SignalingEventType(5)
    static event_publishe_started: SignalingEventType = new SignalingEventType(6)
    static event_ping: SignalingEventType = new SignalingEventType(7)
    static event_pong: SignalingEventType = new SignalingEventType(8)
    static chat_event_type_change_udp_2_tcp: SignalingEventType = new SignalingEventType(9)

    //rtmp response messages
    static call_event_result_accept: SignalingEventType = new SignalingEventType(51)
    static call_event_result_call: SignalingEventType = new SignalingEventType(52)
    static call_event_result_trying: SignalingEventType = new SignalingEventType(53)
    static call_event_result_hangup: SignalingEventType = new SignalingEventType(54)
    static call_event_result_decline: SignalingEventType = new SignalingEventType(55)
    static call_event_result_ringing: SignalingEventType = new SignalingEventType(56)
    static call_event_result_hold: SignalingEventType = new SignalingEventType(57)
    static call_event_result_unhold: SignalingEventType = new SignalingEventType(58)
    static call_event_result_end: SignalingEventType = new SignalingEventType(59)

    //rtmp register messages
    static reg_event_type_registration_success: SignalingEventType = new SignalingEventType(101)
    static reg_event_type_unregistration_success: SignalingEventType = new SignalingEventType(102)
    static reg_event_type_registration_failure: SignalingEventType = new SignalingEventType(103)
    static reg_event_type_login: SignalingEventType = new SignalingEventType(104)

    //rtmp call messages
    static call_event_type_status: SignalingEventType = new SignalingEventType(121)
    static call_event_type_incoming: SignalingEventType = new SignalingEventType(122)
    static call_event_type_inprogress: SignalingEventType = new SignalingEventType(123)
    static call_event_type_ringing: SignalingEventType = new SignalingEventType(124)
    static call_event_type_accepted: SignalingEventType = new SignalingEventType(125)
    static call_event_type_connected: SignalingEventType = new SignalingEventType(126)
    static call_event_type_closed: SignalingEventType = new SignalingEventType(127)
    static call_event_type_decline: SignalingEventType = new SignalingEventType(128)
    static call_event_type_canceled: SignalingEventType = new SignalingEventType(129)
    static call_event_type_busy_here: SignalingEventType = new SignalingEventType(130)
    static call_event_type_not_acceptable_here: SignalingEventType = new SignalingEventType(131)
    static call_event_type_request_terminated: SignalingEventType = new SignalingEventType(132)
    static call_event_type_temporarily_unavailable: SignalingEventType = new SignalingEventType(133)
    static call_event_type_not_found: SignalingEventType = new SignalingEventType(134)
    static call_event_type_notenoughcredit: SignalingEventType = new SignalingEventType(135)
    static call_event_type_calllimitreached: SignalingEventType = new SignalingEventType(136)
    static call_event_type_requesttimeout: SignalingEventType = new SignalingEventType(137)
    static call_event_type_local_hold_ok: SignalingEventType = new SignalingEventType(138)
    static call_event_type_local_hold_nok: SignalingEventType = new SignalingEventType(139)
    static call_event_type_local_resume_ok: SignalingEventType = new SignalingEventType(140)
    static call_event_type_local_resume_nok: SignalingEventType = new SignalingEventType(141)
    static call_event_type_remote_hold: SignalingEventType = new SignalingEventType(142)
    static call_event_type_remote_unhold: SignalingEventType = new SignalingEventType(143)
    static call_event_type_refer: SignalingEventType = new SignalingEventType(144)
    static call_event_type_forbidden: SignalingEventType = new SignalingEventType(145)
    static call_event_type_ringing_wm: SignalingEventType = new SignalingEventType(146)
    static call_event_type_media: SignalingEventType = new SignalingEventType(147)
    static call_event_type_changemedia: SignalingEventType = new SignalingEventType(148)
    static call_event_type_acceptchangemedia: SignalingEventType = new SignalingEventType(149)
    static call_event_type_missedcall: SignalingEventType = new SignalingEventType(150)
    static call_event_type_nosuchcall: SignalingEventType = new SignalingEventType(151)
    static call_event_type_incompleteaddress: SignalingEventType = new SignalingEventType(152)
    static call_event_type_service_unavailable: SignalingEventType = new SignalingEventType(153)
    static call_event_type_incoming_second: SignalingEventType = new SignalingEventType(154)
    static call_event_type_busy_here_2: SignalingEventType = new SignalingEventType(155)
    static call_event_type_response: SignalingEventType = new SignalingEventType(156)
    static call_event_end: SignalingEventType = new SignalingEventType(157)

    //rtmp  other messages
    static status_event_increase: SignalingEventType = new SignalingEventType(201)
    static status_event_decrease: SignalingEventType = new SignalingEventType(202)
    static status_event_initmedia: SignalingEventType = new SignalingEventType(203)
    static status_event_video_rtrnsmt: SignalingEventType = new SignalingEventType(204)
    static status_event_call_prepared: SignalingEventType = new SignalingEventType(205)
    static status_event_service: SignalingEventType = new SignalingEventType(206)
    static status_event_changeaudiosettings: SignalingEventType = new SignalingEventType(207)
    static status_event_video_on: SignalingEventType = new SignalingEventType(208)
    static status_event_video_bitrate: SignalingEventType = new SignalingEventType(209)
    static status_event_type_callfailed: SignalingEventType = new SignalingEventType(210)
    static status_event_noaudio: SignalingEventType = new SignalingEventType(211)
    static status_event_audio: SignalingEventType = new SignalingEventType(212)
    static status_event_tcpconnected: SignalingEventType = new SignalingEventType(213)
    static status_event_tcpdisconnected: SignalingEventType = new SignalingEventType(214)
    static status_event_type_acceptfailed: SignalingEventType = new SignalingEventType(215)
    static status_event_activity: SignalingEventType = new SignalingEventType(216)
    //rtmp chat messages
    static chat_event_type_txt_message: SignalingEventType = new SignalingEventType(301)
    static chat_event_type_txt_msg_delivered: SignalingEventType = new SignalingEventType(302)
    static chat_event_type_roster: SignalingEventType = new SignalingEventType(303)
    static chat_event_type_presence: SignalingEventType = new SignalingEventType(304)
    static chat_event_result_txt_message: SignalingEventType = new SignalingEventType(305)
    static chat_event_result_dlv_notify: SignalingEventType = new SignalingEventType(306)
    static chat_event_type_txt_msg_server_recieved: SignalingEventType = new SignalingEventType(307)
    static chat_event_type_txt_msg_check_status: SignalingEventType = new SignalingEventType(308)
    static chat_event_type_txt_msg_check_delivery_response: SignalingEventType = new SignalingEventType(309)
    static chat_event_type_inst_message: SignalingEventType = new SignalingEventType(310)
    static chat_event_type_inst_result_message: SignalingEventType = new SignalingEventType(311)
    static chat_event_type_secret_message: SignalingEventType = new SignalingEventType(312)
    static chat_event_type_secret_result_message: SignalingEventType = new SignalingEventType(313)
    static chat_event_e2e_state: SignalingEventType = new SignalingEventType(314)
    static chat_event_type_txt_msg_recieved: SignalingEventType = new SignalingEventType(315)
    static chat_event_type_synchronization: SignalingEventType = new SignalingEventType(316)
    static chat_event_type_result_sync: SignalingEventType = new SignalingEventType(317)
    static chat_event_type_msg_status_batch: SignalingEventType = new SignalingEventType(318)
    static chat_event_type_msg_status_batch_result: SignalingEventType = new SignalingEventType(319)
    static call_event_result_conf_cancel: SignalingEventType = new SignalingEventType(320)
    static chat_event_type_status_list: SignalingEventType = new SignalingEventType(321)
    static call_event_conf_call_existing_ack: SignalingEventType = new SignalingEventType(322)
    static chat_event_type_reject: SignalingEventType = new SignalingEventType(323)
    static chat_event_type_part_message: SignalingEventType = new SignalingEventType(324)
    static call_event_result_conf_mute: SignalingEventType = new SignalingEventType(325)
    static call_event_result_conf_mute_all: SignalingEventType = new SignalingEventType(326)
    static call_event_result_conf_change_initiator: SignalingEventType = new SignalingEventType(327)
    static chat_event_transfer_file_paths: SignalingEventType = new SignalingEventType(328)
    static chat_event_end: SignalingEventType = new SignalingEventType(329)

    //rtmp file transfer
    static file_transfer_send: SignalingEventType = new SignalingEventType(351)
    static file_transfer_accept: SignalingEventType = new SignalingEventType(352)
    static file_transfer_reject: SignalingEventType = new SignalingEventType(353)
    static file_transfer_cancel: SignalingEventType = new SignalingEventType(354)
    static file_transfer_eof: SignalingEventType = new SignalingEventType(355)
    static file_transfer_delivered: SignalingEventType = new SignalingEventType(356)
    static file_transfer_end: SignalingEventType = new SignalingEventType(357)

    static group_chat_event_searched_channels: SignalingEventType = new SignalingEventType(401)
    static group_chat_event_join_public_room: SignalingEventType = new SignalingEventType(402)
    static group_chat_event_public_room_info: SignalingEventType = new SignalingEventType(403)
    static group_chat_event_public_room_exist_link: SignalingEventType = new SignalingEventType(404)
    static group_chat_event_public_room_set_link: SignalingEventType = new SignalingEventType(405)
    static group_chat_event_public_room_remove_link: SignalingEventType = new SignalingEventType(406)
    static group_chat_event_public_room_edit_room: SignalingEventType = new SignalingEventType(407)
    static group_chat_event_public_room_add_members: SignalingEventType = new SignalingEventType(408)
    static group_chat_event_public_room_add_admins: SignalingEventType = new SignalingEventType(409)
    static group_chat_event_public_room_delete: SignalingEventType = new SignalingEventType(410)
    static group_chat_event_public_room_kick_member: SignalingEventType = new SignalingEventType(411)
    static group_chat_event_public_room_member_leave: SignalingEventType = new SignalingEventType(412)
    static group_chat_event_public_room_revoke_admin: SignalingEventType = new SignalingEventType(413)
    static group_chat_event_public_room_revoke_link: SignalingEventType = new SignalingEventType(414)
    static group_chat_event_public_room_check_limit: SignalingEventType = new SignalingEventType(415)
    static group_chat_event_public_get_room_users: SignalingEventType = new SignalingEventType(416)
    static group_chat_event_get_user_rooms: SignalingEventType = new SignalingEventType(417)
    static group_chat_event_public_get_sup_users: SignalingEventType = new SignalingEventType(418)
    static group_chat_event_get_user_status: SignalingEventType = new SignalingEventType(419)
    static group_chat_event_updated_public_rooms: SignalingEventType = new SignalingEventType(420)
    static group_chat_event_end: SignalingEventType = new SignalingEventType(421)

    static group_call_event_create: SignalingEventType = new SignalingEventType(451)
    static group_call_event_join: SignalingEventType = new SignalingEventType(452)
    static group_call_event_add : SignalingEventType= new SignalingEventType(453)
    static group_call_event_check: SignalingEventType = new SignalingEventType(454)
    static group_call_event_mute: SignalingEventType = new SignalingEventType(455)
    static group_call_event_mute_all: SignalingEventType = new SignalingEventType(456)
    static group_call_event_change_initiator: SignalingEventType = new SignalingEventType(457)
    static group_call_event_end: SignalingEventType = new SignalingEventType(458)

    static event_badge_count_ack: SignalingEventType = new SignalingEventType(801)
    static event_notification_sound_ack: SignalingEventType = new SignalingEventType(802)
    static event_conversation_mute_ack: SignalingEventType = new SignalingEventType(803)

    //Only For Android
    static call_event_type_outgoing_call: SignalingEventType = new SignalingEventType(1000)
    static call_event_type_faild: SignalingEventType = new SignalingEventType(1001)
    static status_close_answering: SignalingEventType = new SignalingEventType(1002)
    static status_close_call_result: SignalingEventType = new SignalingEventType(1003)

    static get(value: any) {
        switch (value.valueOf()) {
            case SignalingEventType.event_disconnected.valueOf():
                return SignalingEventType.event_disconnected
            case SignalingEventType.event_audiodata.valueOf():
                return SignalingEventType.event_audiodata
            case SignalingEventType.event_videodata.valueOf():
                return SignalingEventType.event_videodata
            case SignalingEventType.event_publisher_stream_created.valueOf():
                return SignalingEventType.event_publisher_stream_created
            case SignalingEventType.event_publishe_started.valueOf():
                return SignalingEventType.event_publishe_started
            case SignalingEventType.event_ping.valueOf():
                return SignalingEventType.event_ping
            case SignalingEventType.event_pong.valueOf():
                return SignalingEventType.event_pong
            case SignalingEventType.chat_event_type_change_udp_2_tcp.valueOf():
                return SignalingEventType.chat_event_type_change_udp_2_tcp
            case SignalingEventType.call_event_result_accept.valueOf():
                return SignalingEventType.call_event_result_accept
            case SignalingEventType.call_event_result_call.valueOf():
                return SignalingEventType.call_event_result_call
            case SignalingEventType.call_event_result_trying.valueOf():
                return SignalingEventType.call_event_result_trying
            case SignalingEventType.call_event_result_hangup.valueOf():
                return SignalingEventType.call_event_result_hangup
            case SignalingEventType.call_event_result_decline.valueOf():
                return SignalingEventType.call_event_result_decline
            case SignalingEventType.call_event_result_ringing.valueOf():
                return SignalingEventType.call_event_result_ringing
            case SignalingEventType.call_event_result_hold.valueOf():
                return SignalingEventType.call_event_result_hold
            case SignalingEventType.call_event_result_unhold.valueOf():
                return SignalingEventType.call_event_result_unhold
            case SignalingEventType.call_event_result_end.valueOf():
                return SignalingEventType.call_event_result_end
            case SignalingEventType.reg_event_type_registration_success.valueOf():
                return SignalingEventType.reg_event_type_registration_success
            case SignalingEventType.reg_event_type_unregistration_success.valueOf():
                return SignalingEventType.reg_event_type_unregistration_success
            case SignalingEventType.reg_event_type_registration_failure.valueOf():
                return SignalingEventType.reg_event_type_registration_failure
            case SignalingEventType.reg_event_type_login.valueOf():
                return SignalingEventType.reg_event_type_login
            case SignalingEventType.call_event_type_status.valueOf():
                return SignalingEventType.call_event_type_status
            case SignalingEventType.call_event_type_incoming.valueOf():
                return SignalingEventType.call_event_type_incoming
            case SignalingEventType.call_event_type_inprogress.valueOf():
                return SignalingEventType.call_event_type_inprogress
            case SignalingEventType.call_event_type_ringing.valueOf():
                return SignalingEventType.call_event_type_ringing
            case SignalingEventType.call_event_type_accepted.valueOf():
                return SignalingEventType.call_event_type_accepted
            case SignalingEventType.call_event_type_connected.valueOf():
                return SignalingEventType.call_event_type_connected
            case SignalingEventType.call_event_type_closed.valueOf():
                return SignalingEventType.call_event_type_closed
            case SignalingEventType.call_event_type_decline.valueOf():
                return SignalingEventType.call_event_type_decline
            case SignalingEventType.call_event_type_canceled.valueOf():
                return SignalingEventType.call_event_type_canceled
            case SignalingEventType.call_event_type_busy_here.valueOf():
                return SignalingEventType.call_event_type_busy_here
            case SignalingEventType.call_event_type_not_acceptable_here.valueOf():
                return SignalingEventType.call_event_type_not_acceptable_here
            case SignalingEventType.call_event_type_request_terminated.valueOf():
                return SignalingEventType.call_event_type_request_terminated
            case SignalingEventType.call_event_type_temporarily_unavailable.valueOf():
                return SignalingEventType.call_event_type_temporarily_unavailable
            case SignalingEventType.call_event_type_not_found.valueOf():
                return SignalingEventType.call_event_type_not_found
            case SignalingEventType.call_event_type_notenoughcredit.valueOf():
                return SignalingEventType.call_event_type_notenoughcredit
            case SignalingEventType.call_event_type_calllimitreached.valueOf():
                return SignalingEventType.call_event_type_calllimitreached
            case SignalingEventType.call_event_type_requesttimeout.valueOf():
                return SignalingEventType.call_event_type_requesttimeout
            case SignalingEventType.call_event_type_local_hold_ok.valueOf():
                return SignalingEventType.call_event_type_local_hold_ok
            case SignalingEventType.call_event_type_local_hold_nok.valueOf():
                return SignalingEventType.call_event_type_local_hold_nok
            case SignalingEventType.call_event_type_local_resume_ok.valueOf():
                return SignalingEventType.call_event_type_local_resume_ok
            case SignalingEventType.call_event_type_local_resume_nok.valueOf():
                return SignalingEventType.call_event_type_local_resume_nok
            case SignalingEventType.call_event_type_remote_hold.valueOf():
                return SignalingEventType.call_event_type_remote_hold
            case SignalingEventType.call_event_type_remote_unhold.valueOf():
                return SignalingEventType.call_event_type_remote_unhold
            case SignalingEventType.call_event_type_refer.valueOf():
                return SignalingEventType.call_event_type_refer
            case SignalingEventType.call_event_type_forbidden.valueOf():
                return SignalingEventType.call_event_type_forbidden
            case SignalingEventType.call_event_type_ringing_wm.valueOf():
                return SignalingEventType.call_event_type_ringing_wm
            case SignalingEventType.call_event_type_media.valueOf():
                return SignalingEventType.call_event_type_media
            case SignalingEventType.call_event_type_changemedia.valueOf():
                return SignalingEventType.call_event_type_changemedia
            case SignalingEventType.call_event_type_acceptchangemedia.valueOf():
                return SignalingEventType.call_event_type_acceptchangemedia
            case SignalingEventType.call_event_type_missedcall.valueOf():
                return SignalingEventType.call_event_type_missedcall
            case SignalingEventType.call_event_type_nosuchcall.valueOf():
                return SignalingEventType.call_event_type_nosuchcall
            case SignalingEventType.call_event_type_incompleteaddress.valueOf():
                return SignalingEventType.call_event_type_incompleteaddress
            case SignalingEventType.call_event_type_service_unavailable.valueOf():
                return SignalingEventType.call_event_type_service_unavailable
            case SignalingEventType.call_event_type_incoming_second.valueOf():
                return SignalingEventType.call_event_type_incoming_second
            case SignalingEventType.call_event_type_busy_here_2.valueOf():
                return SignalingEventType.call_event_type_busy_here_2
            case SignalingEventType.call_event_type_response.valueOf():
                return SignalingEventType.call_event_type_response
            case SignalingEventType.call_event_end.valueOf():
                return SignalingEventType.call_event_end
            case SignalingEventType.status_event_increase.valueOf():
                return SignalingEventType.status_event_increase
            case SignalingEventType.status_event_decrease.valueOf():
                return SignalingEventType.status_event_decrease
            case SignalingEventType.status_event_initmedia.valueOf():
                return SignalingEventType.status_event_initmedia
            case SignalingEventType.status_event_video_rtrnsmt.valueOf():
                return SignalingEventType.status_event_video_rtrnsmt
            case SignalingEventType.status_event_call_prepared.valueOf():
                return SignalingEventType.status_event_call_prepared
            case SignalingEventType.status_event_service.valueOf():
                return SignalingEventType.status_event_service
            case SignalingEventType.status_event_changeaudiosettings.valueOf():
                return SignalingEventType.status_event_changeaudiosettings
            case SignalingEventType.status_event_video_on.valueOf():
                return SignalingEventType.status_event_video_on
            case SignalingEventType.status_event_video_bitrate.valueOf():
                return SignalingEventType.status_event_video_bitrate
            case SignalingEventType.status_event_type_callfailed.valueOf():
                return SignalingEventType.status_event_type_callfailed
            case SignalingEventType.status_event_noaudio.valueOf():
                return SignalingEventType.status_event_noaudio
            case SignalingEventType.status_event_audio.valueOf():
                return SignalingEventType.status_event_audio
            case SignalingEventType.status_event_tcpconnected.valueOf():
                return SignalingEventType.status_event_tcpconnected
            case SignalingEventType.status_event_tcpdisconnected.valueOf():
                return SignalingEventType.status_event_tcpdisconnected
            case SignalingEventType.status_event_type_acceptfailed.valueOf():
                return SignalingEventType.status_event_type_acceptfailed
            case SignalingEventType.status_event_activity.valueOf():
                return SignalingEventType.status_event_activity
            case SignalingEventType.chat_event_type_txt_message.valueOf():
                return SignalingEventType.chat_event_type_txt_message
            case SignalingEventType.chat_event_type_txt_msg_delivered.valueOf():
                return SignalingEventType.chat_event_type_txt_msg_delivered
            case SignalingEventType.chat_event_type_roster.valueOf():
                return SignalingEventType.chat_event_type_roster
            case SignalingEventType.chat_event_type_presence.valueOf():
                return SignalingEventType.chat_event_type_presence
            case SignalingEventType.chat_event_result_txt_message.valueOf():
                return SignalingEventType.chat_event_result_txt_message
            case SignalingEventType.chat_event_result_dlv_notify.valueOf():
                return SignalingEventType.chat_event_result_dlv_notify
            case SignalingEventType.chat_event_type_txt_msg_server_recieved.valueOf():
                return SignalingEventType.chat_event_type_txt_msg_server_recieved
            case SignalingEventType.chat_event_type_txt_msg_check_status.valueOf():
                return SignalingEventType.chat_event_type_txt_msg_check_status
            case SignalingEventType.chat_event_type_txt_msg_check_delivery_response.valueOf():
                return SignalingEventType.chat_event_type_txt_msg_check_delivery_response
            case SignalingEventType.chat_event_type_inst_message.valueOf():
                return SignalingEventType.chat_event_type_inst_message
            case SignalingEventType.chat_event_type_inst_result_message.valueOf():
                return SignalingEventType.chat_event_type_inst_result_message
            case SignalingEventType.chat_event_type_secret_message.valueOf():
                return SignalingEventType.chat_event_type_secret_message
            case SignalingEventType.chat_event_type_secret_result_message.valueOf():
                return SignalingEventType.chat_event_type_secret_result_message
            case SignalingEventType.chat_event_e2e_state.valueOf():
                return SignalingEventType.chat_event_e2e_state
            case SignalingEventType.chat_event_type_txt_msg_recieved.valueOf():
                return SignalingEventType.chat_event_type_txt_msg_recieved
            case SignalingEventType.chat_event_type_synchronization.valueOf():
                return SignalingEventType.chat_event_type_synchronization
            case SignalingEventType.chat_event_type_result_sync.valueOf():
                return SignalingEventType.chat_event_type_result_sync
            case SignalingEventType.chat_event_type_msg_status_batch.valueOf():
                return SignalingEventType.chat_event_type_msg_status_batch
            case SignalingEventType.chat_event_type_msg_status_batch_result.valueOf():
                return SignalingEventType.chat_event_type_msg_status_batch_result
            case SignalingEventType.call_event_result_conf_cancel.valueOf():
                return SignalingEventType.call_event_result_conf_cancel
            case SignalingEventType.chat_event_type_status_list.valueOf():
                return SignalingEventType.chat_event_type_status_list
            case SignalingEventType.call_event_conf_call_existing_ack.valueOf():
                return SignalingEventType.call_event_conf_call_existing_ack
            case SignalingEventType.chat_event_type_reject.valueOf():
                return SignalingEventType.chat_event_type_reject
            case SignalingEventType.chat_event_type_part_message.valueOf():
                return SignalingEventType.chat_event_type_part_message
            case SignalingEventType.call_event_result_conf_mute.valueOf():
                return SignalingEventType.call_event_result_conf_mute
            case SignalingEventType.call_event_result_conf_mute_all.valueOf():
                return SignalingEventType.call_event_result_conf_mute_all
            case SignalingEventType.call_event_result_conf_change_initiator.valueOf():
                return SignalingEventType.call_event_result_conf_change_initiator
            case SignalingEventType.chat_event_transfer_file_paths.valueOf():
                return SignalingEventType.chat_event_transfer_file_paths
            case SignalingEventType.chat_event_end.valueOf():
                return SignalingEventType.chat_event_end
            case SignalingEventType.file_transfer_send.valueOf():
                return SignalingEventType.file_transfer_send
            case SignalingEventType.file_transfer_accept.valueOf():
                return SignalingEventType.file_transfer_accept
            case SignalingEventType.file_transfer_reject.valueOf():
                return SignalingEventType.file_transfer_reject
            case SignalingEventType.file_transfer_cancel.valueOf():
                return SignalingEventType.file_transfer_cancel
            case SignalingEventType.file_transfer_eof.valueOf():
                return SignalingEventType.file_transfer_eof
            case SignalingEventType.file_transfer_delivered.valueOf():
                return SignalingEventType.file_transfer_delivered
            case SignalingEventType.file_transfer_end.valueOf():
                return SignalingEventType.file_transfer_end
            case SignalingEventType.group_chat_event_searched_channels.valueOf():
                return SignalingEventType.group_chat_event_searched_channels
            case SignalingEventType.group_chat_event_join_public_room.valueOf():
                return SignalingEventType.group_chat_event_join_public_room
            case SignalingEventType.group_chat_event_public_room_info.valueOf():
                return SignalingEventType.group_chat_event_public_room_info
            case SignalingEventType.group_chat_event_public_room_exist_link.valueOf():
                return SignalingEventType.group_chat_event_public_room_exist_link
            case SignalingEventType.group_chat_event_public_room_set_link.valueOf():
                return SignalingEventType.group_chat_event_public_room_set_link
            case SignalingEventType.group_chat_event_public_room_remove_link.valueOf():
                return SignalingEventType.group_chat_event_public_room_remove_link
            case SignalingEventType.group_chat_event_public_room_edit_room.valueOf():
                return SignalingEventType.group_chat_event_public_room_edit_room
            case SignalingEventType.group_chat_event_public_room_add_members.valueOf():
                return SignalingEventType.group_chat_event_public_room_add_members
            case SignalingEventType.group_chat_event_public_room_add_admins.valueOf():
                return SignalingEventType.group_chat_event_public_room_add_admins
            case SignalingEventType.group_chat_event_public_room_delete.valueOf():
                return SignalingEventType.group_chat_event_public_room_delete
            case SignalingEventType.group_chat_event_public_room_kick_member.valueOf():
                return SignalingEventType.group_chat_event_public_room_kick_member
            case SignalingEventType.group_chat_event_public_room_member_leave.valueOf():
                return SignalingEventType.group_chat_event_public_room_member_leave
            case SignalingEventType.group_chat_event_public_room_revoke_admin.valueOf():
                return SignalingEventType.group_chat_event_public_room_revoke_admin
            case SignalingEventType.group_chat_event_public_room_revoke_link.valueOf():
                return SignalingEventType.group_chat_event_public_room_revoke_link
            case SignalingEventType.group_chat_event_public_room_check_limit.valueOf():
                return SignalingEventType.group_chat_event_public_room_check_limit
            case SignalingEventType.group_chat_event_public_get_room_users.valueOf():
                return SignalingEventType.group_chat_event_public_get_room_users
            case SignalingEventType.group_chat_event_get_user_rooms.valueOf():
                return SignalingEventType.group_chat_event_get_user_rooms
            case SignalingEventType.group_chat_event_public_get_sup_users.valueOf():
                return SignalingEventType.group_chat_event_public_get_sup_users
            case SignalingEventType.group_chat_event_get_user_status.valueOf():
                return SignalingEventType.group_chat_event_get_user_status
            case SignalingEventType.group_chat_event_updated_public_rooms.valueOf():
                return SignalingEventType.group_chat_event_updated_public_rooms
            case SignalingEventType.group_chat_event_end.valueOf():
                return SignalingEventType.group_chat_event_end
            case SignalingEventType.group_call_event_create.valueOf():
                return SignalingEventType.group_call_event_create
            case SignalingEventType.group_call_event_join.valueOf():
                return SignalingEventType.group_call_event_join
            case SignalingEventType.group_call_event_add.valueOf():
                return SignalingEventType.group_call_event_add
            case SignalingEventType.group_call_event_check.valueOf():
                return SignalingEventType.group_call_event_check
            case SignalingEventType.group_call_event_mute.valueOf():
                return SignalingEventType.group_call_event_mute
            case SignalingEventType.group_call_event_mute_all.valueOf():
                return SignalingEventType.group_call_event_mute_all
            case SignalingEventType.group_call_event_change_initiator.valueOf():
                return SignalingEventType.group_call_event_change_initiator
            case SignalingEventType.group_call_event_end.valueOf():
                return SignalingEventType.group_call_event_end
            case SignalingEventType.call_event_type_outgoing_call.valueOf():
                return SignalingEventType.call_event_type_outgoing_call
            case SignalingEventType.call_event_type_faild.valueOf():
                return SignalingEventType.call_event_type_faild
            case SignalingEventType.status_close_answering.valueOf():
                return SignalingEventType.status_close_answering
            case SignalingEventType.status_close_call_result.valueOf():
                return SignalingEventType.status_close_call_result
            case SignalingEventType.event_badge_count_ack.valueOf():
                return SignalingEventType.event_badge_count_ack
            case SignalingEventType.event_notification_sound_ack.valueOf():
                return SignalingEventType.event_notification_sound_ack
            default:
                return SignalingEventType.event_type_unknown
        }
    }

    get localizedDescription(): string {
        switch (this) {
            case SignalingEventType.event_disconnected:
                return "event_disconnected"
            case SignalingEventType.event_audiodata:
                return "event_audiodata"
            case SignalingEventType.event_videodata:
                return "event_videodata"
            case SignalingEventType.event_publisher_stream_created:
                return "event_publisher_stream_created"
            case SignalingEventType.event_publishe_started:
                return "event_publishe_started"
            case SignalingEventType.event_ping:
                return "event_ping"
            case SignalingEventType.event_pong:
                return "event_pong"
            case SignalingEventType.chat_event_type_change_udp_2_tcp:
                return "chat_event_type_change_udp_2_tcp"
            case SignalingEventType.call_event_result_accept:
                return "call_event_result_accept"
            case SignalingEventType.call_event_result_call:
                return "call_event_result_call"
            case SignalingEventType.call_event_result_trying:
                return "call_event_result_trying"
            case SignalingEventType.call_event_result_hangup:
                return "call_event_result_hangup"
            case SignalingEventType.call_event_result_decline:
                return "call_event_result_decline"
            case SignalingEventType.call_event_result_ringing:
                return "call_event_result_ringing"
            case SignalingEventType.call_event_result_hold:
                return "call_event_result_hold"
            case SignalingEventType.call_event_result_unhold:
                return "call_event_result_unhold"
            case SignalingEventType.call_event_result_end:
                return "call_event_result_end"
            case SignalingEventType.reg_event_type_registration_success:
                return "reg_event_type_registration_success"
            case SignalingEventType.reg_event_type_unregistration_success:
                return "reg_event_type_unregistration_success"
            case SignalingEventType.reg_event_type_registration_failure:
                return "reg_event_type_registration_failure"
            case SignalingEventType.reg_event_type_login:
                return "reg_event_type_login"
            case SignalingEventType.call_event_type_status:
                return "call_event_type_status"
            case SignalingEventType.call_event_type_incoming:
                return "call_event_type_incoming"
            case SignalingEventType.call_event_type_inprogress:
                return "call_event_type_inprogress"
            case SignalingEventType.call_event_type_ringing:
                return "call_event_type_ringing"
            case SignalingEventType.call_event_type_accepted:
                return "call_event_type_accepted"
            case SignalingEventType.call_event_type_connected:
                return "call_event_type_connected"
            case SignalingEventType.call_event_type_closed:
                return "call_event_type_closed"
            case SignalingEventType.call_event_type_decline:
                return "call_event_type_decline"
            case SignalingEventType.call_event_type_canceled:
                return "call_event_type_canceled"
            case SignalingEventType.call_event_type_busy_here:
                return "call_event_type_busy_here"
            case SignalingEventType.call_event_type_not_acceptable_here:
                return "call_event_type_not_acceptable_here"
            case SignalingEventType.call_event_type_request_terminated:
                return "call_event_type_request_terminated"
            case SignalingEventType.call_event_type_temporarily_unavailable:
                return "call_event_type_temporarily_unavailable"
            case SignalingEventType.call_event_type_not_found:
                return "call_event_type_not_found"
            case SignalingEventType.call_event_type_notenoughcredit:
                return "call_event_type_notenoughcredit"
            case SignalingEventType.call_event_type_calllimitreached:
                return "call_event_type_calllimitreached"
            case SignalingEventType.call_event_type_requesttimeout:
                return "call_event_type_requesttimeout"
            case SignalingEventType.call_event_type_local_hold_ok:
                return "call_event_type_local_hold_ok"
            case SignalingEventType.call_event_type_local_hold_nok:
                return "call_event_type_local_hold_nok"
            case SignalingEventType.call_event_type_local_resume_ok:
                return "call_event_type_local_resume_ok"
            case SignalingEventType.call_event_type_local_resume_nok:
                return "call_event_type_local_resume_nok"
            case SignalingEventType.call_event_type_remote_hold:
                return "call_event_type_remote_hold"
            case SignalingEventType.call_event_type_remote_unhold:
                return "call_event_type_remote_unhold"
            case SignalingEventType.call_event_type_refer:
                return "call_event_type_refer"
            case SignalingEventType.call_event_type_forbidden:
                return "call_event_type_forbidden"
            case SignalingEventType.call_event_type_ringing_wm:
                return "call_event_type_ringing_wm"
            case SignalingEventType.call_event_type_media:
                return "call_event_type_media"
            case SignalingEventType.call_event_type_changemedia:
                return "call_event_type_changemedia"
            case SignalingEventType.call_event_type_acceptchangemedia:
                return "call_event_type_acceptchangemedia"
            case SignalingEventType.call_event_type_missedcall:
                return "call_event_type_missedcall"
            case SignalingEventType.call_event_type_nosuchcall:
                return "call_event_type_nosuchcall"
            case SignalingEventType.call_event_type_incompleteaddress:
                return "call_event_type_incompleteaddress"
            case SignalingEventType.call_event_type_service_unavailable:
                return "call_event_type_service_unavailable"
            case SignalingEventType.call_event_type_incoming_second:
                return "call_event_type_incoming_second"
            case SignalingEventType.call_event_type_busy_here_2:
                return "call_event_type_busy_here_2"
            case SignalingEventType.call_event_type_response:
                return "call_event_type_response"
            case SignalingEventType.call_event_end:
                return "call_event_end"
            case SignalingEventType.status_event_increase:
                return "status_event_increase"
            case SignalingEventType.status_event_decrease:
                return "status_event_decrease"
            case SignalingEventType.status_event_initmedia:
                return "status_event_initmedia"
            case SignalingEventType.status_event_video_rtrnsmt:
                return "status_event_video_rtrnsmt"
            case SignalingEventType.status_event_call_prepared:
                return "status_event_call_prepared"
            case SignalingEventType.status_event_service:
                return "status_event_service"
            case SignalingEventType.status_event_changeaudiosettings:
                return "status_event_changeaudiosettings"
            case SignalingEventType.status_event_video_on:
                return "status_event_video_on"
            case SignalingEventType.status_event_video_bitrate:
                return "status_event_video_bitrate"
            case SignalingEventType.status_event_type_callfailed:
                return "status_event_type_callfailed"
            case SignalingEventType.status_event_noaudio:
                return "status_event_noaudio"
            case SignalingEventType.status_event_audio:
                return "status_event_audio"
            case SignalingEventType.status_event_tcpconnected:
                return "status_event_tcpconnected"
            case SignalingEventType.status_event_tcpdisconnected:
                return "status_event_tcpdisconnected"
            case SignalingEventType.status_event_type_acceptfailed:
                return "status_event_type_acceptfailed"
            case SignalingEventType.status_event_activity:
                return "status_event_activity"
            case SignalingEventType.chat_event_type_txt_message:
                return "chat_event_type_txt_message"
            case SignalingEventType.chat_event_type_txt_msg_delivered:
                return "chat_event_type_txt_msg_delivered"
            case SignalingEventType.chat_event_type_roster:
                return "chat_event_type_roster"
            case SignalingEventType.chat_event_type_presence:
                return "chat_event_type_presence"
            case SignalingEventType.chat_event_result_txt_message:
                return "chat_event_result_txt_message"
            case SignalingEventType.chat_event_result_dlv_notify:
                return "chat_event_result_dlv_notify"
            case SignalingEventType.chat_event_type_txt_msg_server_recieved:
                return "chat_event_type_txt_msg_server_recieved"
            case SignalingEventType.chat_event_type_txt_msg_check_status:
                return "chat_event_type_txt_msg_check_status"
            case SignalingEventType.chat_event_type_txt_msg_check_delivery_response:
                return "chat_event_type_txt_msg_check_delivery_response"
            case SignalingEventType.chat_event_type_inst_message:
                return "chat_event_type_inst_message"
            case SignalingEventType.chat_event_type_inst_result_message:
                return "chat_event_type_inst_result_message"
            case SignalingEventType.chat_event_type_secret_message:
                return "chat_event_type_secret_message"
            case SignalingEventType.chat_event_type_secret_result_message:
                return "chat_event_type_secret_result_message"
            case SignalingEventType.chat_event_e2e_state:
                return "chat_event_e2e_state"
            case SignalingEventType.chat_event_type_txt_msg_recieved:
                return "chat_event_type_txt_msg_recieved"
            case SignalingEventType.chat_event_type_synchronization:
                return "chat_event_type_synchronization"
            case SignalingEventType.chat_event_type_result_sync:
                return "chat_event_type_result_sync"
            case SignalingEventType.chat_event_type_msg_status_batch:
                return "chat_event_type_msg_status_batch"
            case SignalingEventType.chat_event_type_msg_status_batch_result:
                return "chat_event_type_msg_status_batch_result"
            case SignalingEventType.call_event_result_conf_cancel:
                return "call_event_result_conf_cancel"
            case SignalingEventType.chat_event_type_status_list:
                return "chat_event_type_status_list"
            case SignalingEventType.call_event_conf_call_existing_ack:
                return "call_event_conf_call_existing_ack"
            case SignalingEventType.chat_event_type_reject:
                return "chat_event_type_reject"
            case SignalingEventType.chat_event_type_part_message:
                return "chat_event_type_part_message"
            case SignalingEventType.call_event_result_conf_mute:
                return "call_event_result_conf_mute"
            case SignalingEventType.call_event_result_conf_mute_all:
                return "call_event_result_conf_mute_all"
            case SignalingEventType.call_event_result_conf_change_initiator:
                return "call_event_result_conf_change_initiator"
            case SignalingEventType.chat_event_transfer_file_paths:
                return "chat_event_transfer_file_paths"
            case SignalingEventType.chat_event_end:
                return "chat_event_end"
            case SignalingEventType.file_transfer_send:
                return "file_transfer_send"
            case SignalingEventType.file_transfer_accept:
                return "file_transfer_accept"
            case SignalingEventType.file_transfer_reject:
                return "file_transfer_reject"
            case SignalingEventType.file_transfer_cancel:
                return "file_transfer_cancel"
            case SignalingEventType.file_transfer_eof:
                return "file_transfer_eof"
            case SignalingEventType.file_transfer_delivered:
                return "file_transfer_delivered"
            case SignalingEventType.file_transfer_end:
                return "file_transfer_end"
            case SignalingEventType.group_chat_event_searched_channels:
                return "group_chat_event_searched_channels"
            case SignalingEventType.group_chat_event_join_public_room:
                return "group_chat_event_join_public_room"
            case SignalingEventType.group_chat_event_public_room_info:
                return "group_chat_event_public_room_info"
            case SignalingEventType.group_chat_event_public_room_exist_link:
                return "group_chat_event_public_room_exist_link"
            case SignalingEventType.group_chat_event_public_room_set_link:
                return "group_chat_event_public_room_set_link"
            case SignalingEventType.group_chat_event_public_room_remove_link:
                return "group_chat_event_public_room_remove_link"
            case SignalingEventType.group_chat_event_public_room_edit_room:
                return "group_chat_event_public_room_edit_room"
            case SignalingEventType.group_chat_event_public_room_add_members:
                return "group_chat_event_public_room_add_members"
            case SignalingEventType.group_chat_event_public_room_add_admins:
                return "group_chat_event_public_room_add_admins"
            case SignalingEventType.group_chat_event_public_room_delete:
                return "group_chat_event_public_room_delete"
            case SignalingEventType.group_chat_event_public_room_kick_member:
                return "group_chat_event_public_room_kick_member"
            case SignalingEventType.group_chat_event_public_room_member_leave:
                return "group_chat_event_public_room_member_leave"
            case SignalingEventType.group_chat_event_public_room_revoke_admin:
                return "group_chat_event_public_room_revoke_admin"
            case SignalingEventType.group_chat_event_public_room_revoke_link:
                return "group_chat_event_public_room_revoke_link"
            case SignalingEventType.group_chat_event_public_room_check_limit:
                return "group_chat_event_public_room_check_limit"
            case SignalingEventType.group_chat_event_public_get_room_users:
                return "group_chat_event_public_get_room_users"
            case SignalingEventType.group_chat_event_get_user_rooms:
                return "group_chat_event_get_user_rooms"
            case SignalingEventType.group_chat_event_public_get_sup_users:
                return "group_chat_event_public_get_sup_users"
            case SignalingEventType.group_chat_event_get_user_status:
                return "group_chat_event_get_user_status"
            case SignalingEventType.group_chat_event_updated_public_rooms:
                return "group_chat_event_updated_public_rooms"
            case SignalingEventType.group_chat_event_end:
                return "group_chat_event_end"
            case SignalingEventType.group_call_event_create:
                return "group_call_event_create"
            case SignalingEventType.group_call_event_join:
                return "group_call_event_join"
            case SignalingEventType.group_call_event_add:
                return "group_call_event_add"
            case SignalingEventType.group_call_event_check:
                return "group_call_event_check"
            case SignalingEventType.group_call_event_mute:
                return "group_call_event_mute"
            case SignalingEventType.group_call_event_mute_all:
                return "group_call_event_mute_all"
            case SignalingEventType.group_call_event_change_initiator:
                return "group_call_event_change_initiator"
            case SignalingEventType.group_call_event_end:
                return "group_call_event_end"
            case SignalingEventType.call_event_type_outgoing_call:
                return "call_event_type_outgoing_call"
            case SignalingEventType.call_event_type_faild:
                return "call_event_type_faild"
            case SignalingEventType.status_close_answering:
                return "status_close_answering"
            case SignalingEventType.status_close_call_result:
                return "status_close_call_result"
            case SignalingEventType.event_badge_count_ack:
                return "event_badge_count_ack"
            case SignalingEventType.event_notification_sound_ack:
                return "event_notification_sound_ack"
            default:
                return "event_type_unknown"
        }
    }
}
