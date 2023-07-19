"use strict";

import {
    ACK_TO, ACK_XMLNS,
    CALL_COMMANDS,
    CALL_XMLNS,
    CARBONS_2_REQUEST_XMLNS,
    CONFERENCE_COMMANDS, MESSAGE_CALL_COMMAND,
    RECEIPTS_REQUEST_XMLNS,
    XML_MESSAGE_TYPES, XML_REQUEST_XMLNS, ZCC_TO, ZCC_XMLNS
} from "xmpp/XMLConstants";
import conf from "configs/configurations";
import {CALL_PROTOTYPE} from "configs/constants";

interface ICreate {
    id: string;
    groupId: string;
    callid: number;
}

interface IChangeInitiator {
    id: string;
    groupId: string;
    member: string;
}

interface IRinging {
    id: string;
    callId: string;
    groupId: string;
    to: string;
    info: any;
}

interface IAccept {
    id: string;
    callId: string;
    to: string;
    info: any;
}

interface IDecline {
    id: string;
    callId: string;
    to: string;
}

interface ILeave {
    id: string;
    callId: string;
    to: string;
}

interface ICheck {
    id: string;
    callId: string;
    groupId: string;
}

interface IJoin {
    id: string;
    callId: string;
    groupId: string;
}

interface IAddMembers {
    id: string;
    members: any;
    callId: string;
    groupId: string;
}

interface ICancel {
    id: string;
    callId: string;
    groupId: string;
    member: string
}

interface IAck {
    id: string;
}

export function createXML(props: ICreate): Strophe.Builder {
    const {id, groupId, callid} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
        from: groupId
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            command: CONFERENCE_COMMANDS.create,
            callid,
            roomName: groupId
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function changeInitiatorXML(props: IChangeInitiator): Strophe.Builder {
    const {id, groupId, member} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
        from: groupId
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            command: CONFERENCE_COMMANDS.changeInitiator,
            callid: "",
            roomName: groupId,
            member
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function ringingXML(props: IRinging): Strophe.Builder {
    const {callId, id, to, groupId, info} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to,
    })
        .c('private', {xmlns: CARBONS_2_REQUEST_XMLNS}).up()
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('call', {
            xmlns: CALL_XMLNS,
            dwidth: info.device.width,
            dheight: info.device.height,
            acandidate: info.audio.candidate,
            acodec: info.audio.codec,
            vcandidate: info.video.candidate,
            vcodec: info.video.codec,
            version: info.version,
            prototype: info.callPrototype,
            command: CONFERENCE_COMMANDS.ringing,
            callid: callId,
            roomName: groupId
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function acceptXML(props: IAccept): Strophe.Builder {
    const {callId, id, to, info} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to,
    })
        .c('private', {xmlns: CARBONS_2_REQUEST_XMLNS}).up()
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('call', {
            xmlns: CALL_XMLNS,
            dwidth: info.dwidth,
            dheight: info.dheight,
            acandidate: info.acandidate,
            acodec: info.acodec,
            vcandidate: info.vcandidate,
            vcodec: info.vcodec,
            version: info.version,
            prototype: info.callPrototype,
            command: CONFERENCE_COMMANDS.accept,
            callid: callId,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function declineXML(props: IDecline): Strophe.Builder {
    const {callId, id, to} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to,
    })
        .c('private', {xmlns: CARBONS_2_REQUEST_XMLNS}).up()
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('call', {
            xmlns: CALL_XMLNS,
            command: CONFERENCE_COMMANDS.decline,
            callid: callId,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function leaveXML(props: ILeave): Strophe.Builder {
    const {callId, id, to} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to,
    })
        .c('private', {xmlns: CARBONS_2_REQUEST_XMLNS}).up()
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('call', {
            xmlns: CALL_XMLNS,
            command: CONFERENCE_COMMANDS.hangup,
            callid: callId,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function checkXML(props: ICheck): Strophe.Builder {
    const {callId, id, groupId} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            roomName: groupId,
            command: CONFERENCE_COMMANDS.check,
            callid: callId,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function joinXML(props: IJoin): Strophe.Builder {
    const {callId, id, groupId} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            roomName: groupId,
            command: CONFERENCE_COMMANDS.join,
            callid: callId,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function addMembersXML(props: IAddMembers): Strophe.Builder {
    const {callId, id, groupId, members} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            roomName: groupId,
            command: CONFERENCE_COMMANDS.addMember,
            callid: callId,
            members
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function cancelXML(props: ICancel): Strophe.Builder {
    const {callId, id, groupId, member} = props;
    return $msg({
        id,
        type: XML_MESSAGE_TYPES.chat,
        to: ZCC_TO,
    })
        .c('received', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
        .c('body').up()
        .c('zcc', {
            xmlns: ZCC_XMLNS,
            roomName: groupId,
            command: CONFERENCE_COMMANDS.cancel,
            callid: callId,
            member,
        }).up()
        .c('request', {xmlns: RECEIPTS_REQUEST_XMLNS}).up()
}

export function ackConferenceXML(props: IAck): Strophe.Builder {
    const {id} = props;
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ACK_TO, xmlns: ACK_XMLNS})
        .c("ack", {command: MESSAGE_CALL_COMMAND, xmlns: ACK_XMLNS}).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"})
}
