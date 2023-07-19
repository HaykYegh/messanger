"use strict";

export const MESSAGE_XMLNS: string = "http://www.jivesoftware.com/xmlns/xmpp/properties";

export const GROUP_CONVERSATION_EXTENSION: string = "conference.msg.hawkstream.com";

export const LAST_ACTIVITY_EXTENSION: string = "zpresence.msg.hawkstream.com";

export const SINGLE_CONVERSATION_EXTENSION: string = "msg.hawkstream.com";

export const VOIP_CALL_EXTENSION: string = "voip.msg.hawkstream.com";

export const CALL_COMMANDS: any = {
    local_description: "local_description",
    ice_candidate: "ice_candidate",
    web_answer: "web_answer",
    web_offer: "web_offer",
    ringing: "ringing",
    decline: "decline",
    invite: "invite",
    hangup: "hangup",
    accept: "accept",
    unhold: "unhold",
    status: "status",
    video: "video",
    media: "media",
    hold: "hold"
};

export const CONFERENCE_COMMANDS: any = {
    create: 'create',
    invite: "invite",
    state: "state",
    start: "start",
    ringing: 'ringing',
    accept: 'accept',
    decline: 'decline',
    hangup: "hangup",
    leave: 'leave',
    end: 'end',
    cancel: 'cancel',
    join: 'join',
    addMember: 'addMember',
    check: 'check',
    calling: 'calling',
    changeInitiator: 'changeInitiator'
};

export const ZPRESENCE_TO: string = "111@zpresence.msg.hawkstream.com";


export const ZSYNC_TO: string = "111@zsync.msg.hawkstream.com";
export const ZOFFLINE_TO: string = "111@zoffline.msg.hawkstream.com";

export const PRESENCE_XMLNS: string = "http://jabber.org/protocol/muc";

export const PRIVACY_TO: string = "111@privacy.msg.hawkstream.com";

export const RECEIPTS_REQUEST_XMLNS: string = "urn:xmpp:receipts";

export const CARBONS_2_REQUEST_XMLNS: string = "urn:xmpp:carbons:2";

export const XML_MESSAGE_TYPES: any = {
    group: "groupchat",
    chat: "chat",
    cancel: "cancel"
};

export const ZANGI_ZPRESENCE_XMLNS: string = "zangi:zpresence";

export const ZSYNC_XMLNS: string = "zangi:zsync";

export const ZOFFLINE_XMLNS: string = "zangi:zoffline";

export const ZMUC_TO: string = "111@zmuc.msg.hawkstream.com";

export const APP_VERSION_TO: string = "100@login.msg.hawkstream.com";

export const CONVERSATION_COMMAND: string = "sst_conversation";

export const CHANGE_ROLE_COMMAND: string = "changeRole";

export const CHANGE_ROLE_ALL_COMMAND: string = "changeRoleAll";

export const MEMBER_EDIT_NAME_COMMAND: string = "memberEditName";

export const MEMBER_EDIT_AVATAR_COMMAND: string = "memberEditAvatar";

export const MEMBER_ADD_MEMBER_COMMAND: string = "memberAddMember";

export const DELETE_ROOM_COMMAND: string = "deleteRoom";

export const OWNER_LEAVE_COMMAND: string = "leaveOwner";

export const XML_REQUEST_XMLNS: string = "urn:xmpp:receipts";

export const MESSAGE_DELIVERED_COMMAND: string = "delivered";

export const MY_MESSAGE_DELIVERED_COMMAND: string = "self";

export const REMOVE_FROM_BLOCKED_COMMAND: string = "remove";

export const JABBER_CLIENT_XMLNS: string = "jabber:client";

export const ACK_TO: string = "111@ack.msg.hawkstream.com";

export const DELETE_GROUP_MEMBER_COMMAND: string = "kick";

export const GET_GROUPS_XML_COMMAND: string = "getRooms";

export const GET_STATUS_COMMAND: string = "getStatus";

export const ONLINE_CONTACT_STATUS: string = "available";

export const CREATE_GROUP_XML_COMMAND: string = "create";

export const CHANGE_GROUP_XML_COMMAND: string = "subject";

export const MESSAGE_SEEN_COMMAND: string = "displayed";

export const MESSAGE_CALL_COMMAND: string = "call";

export const PRESENCE_HASH: any = {
    hash: "sha-1",
    ver: "NfJ3flI83zSdUDzCEICtbypursw=",
    xmlns: "http://jabber.org/protocol/caps",
    node: "http://www.igniterealtime.org/projects/smack",
};

export const PRIVACY_SETTINGS: any = {
    ShowMyOnlineStatus: "showOnlineStatus",
    ShowSeenForMessage: "showSeenStatus",
    ShowWhenImTyping: "showTyping"
};

export const FOREGROUND_COMMAND: string = "foreground";

export const BACKGROUND_COMMAND: string = "background";

export const GET_INFO_XML_COMMAND: string = "getInfo";

export const VERSION_UPDATE_XML_COMMAND: string = "update";

export const ZANGI_ZMUC_XMLNS: string = "zangi:zmuc";

export const PRIVACY_XMLNS: string = "zangi:privacy";

export const ZANGI_HTTP_XMLNS: string = "zangi:http";

export const ADD_TO_BLOCKED_COMMAND: string = "add";

export const EVENT_XMLNS: string = "jabber:x:event";

export const LEAVE_GROUP_COMMAND: string = "leave";

export const XML_EMPTY_TAG: string = "emptyTag";

export const INVITE_REASON: string = "Welcome";

export const INVITE_COMMAND: string = "invite";

export const NOT_ENOUGH_CREDIT: string = "402";

export const CALL_XMLNS: string = "zangi:call";

export const ACK_XMLNS: string = "zangi:ack";

export const LOGIN_COMMAND: string = 'login';

// Conference

export const ZCC_XMLNS: string = "zangi:zcc";

export const ZCC_TO: string = "111@zcc.msg.hawkstream.com";

