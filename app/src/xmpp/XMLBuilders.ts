"use strict";

import {
    ACK_TO,
    ACK_XMLNS,
    APP_VERSION_TO,
    BACKGROUND_COMMAND,
    CALL_COMMANDS,
    CALL_XMLNS,
    CHANGE_GROUP_XML_COMMAND,
    CHANGE_ROLE_ALL_COMMAND,
    CHANGE_ROLE_COMMAND,
    CONVERSATION_COMMAND,
    CREATE_GROUP_XML_COMMAND,
    DELETE_ROOM_COMMAND,
    EVENT_XMLNS,
    FOREGROUND_COMMAND,
    GET_GROUPS_XML_COMMAND,
    GET_INFO_XML_COMMAND,
    GET_STATUS_COMMAND,
    GROUP_CONVERSATION_EXTENSION,
    INVITE_COMMAND,
    JABBER_CLIENT_XMLNS,
    LAST_ACTIVITY_EXTENSION,
    LOGIN_COMMAND,
    MEMBER_ADD_MEMBER_COMMAND,
    MEMBER_EDIT_AVATAR_COMMAND,
    MEMBER_EDIT_NAME_COMMAND, MESSAGE_CALL_COMMAND,
    MESSAGE_DELIVERED_COMMAND,
    MESSAGE_SEEN_COMMAND,
    MESSAGE_XMLNS, MY_MESSAGE_DELIVERED_COMMAND,
    OWNER_LEAVE_COMMAND,
    PRESENCE_HASH,
    PRESENCE_XMLNS,
    PRIVACY_TO,
    PRIVACY_XMLNS,
    SINGLE_CONVERSATION_EXTENSION,
    VOIP_CALL_EXTENSION,
    XML_MESSAGE_TYPES,
    XML_REQUEST_XMLNS,
    ZANGI_HTTP_XMLNS,
    ZANGI_ZMUC_XMLNS,
    ZANGI_ZPRESENCE_XMLNS,
    ZMUC_TO,
    ZOFFLINE_TO,
    ZOFFLINE_XMLNS,
    ZPRESENCE_TO,
    ZSYNC_TO,
    ZSYNC_XMLNS,
} from "xmpp/XMLConstants";
import {APP_CONFIG, APPLICATION, CALL_PROTOTYPE, MESSAGE_TYPES} from "configs/constants";
import conf from "configs/configurations";
import {getDeviceToken} from "helpers/DataHelper";
import {stringify} from "querystring";
import Log from "modules/messages/Log";

interface IMessageDisplayedReceivedXMLParams {
    id: string;
}

interface IMessageDeliveredReceivedXMLParams {
    id: string;
}

interface ILastActivityRequestXMLParams {
    id: string;
}

interface IInviteGroupMembersXMLParams {
    groupId: string;
    members: string;
    admins: string;
    id: string;
}

interface IStopTypingMessageXMLParams {
    to: string;
}

interface ISendIceCandidateXMLParams {
    sdpMLineIndex: string;
    candidate: string;
    callid: string;
    sdpMid: string;
    to: string;
    outCall: boolean;
}

interface ISendLocalDescriptionXMLParams {
    callid: string;
    sdp: string;
    to: string;
    type: boolean;
    onlySet: boolean;
}

interface IInvitedToCallXMLParams {
    to: string;
    email: string;
    firstName: string;
    lastName: string;
    callid: string;
    sdp: string;
    audioParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    videoParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    deviceParams: {
        height: number;
        width: number;
    };
    prototype: string;
    isVideo: boolean;
    outCall: boolean;
    callTime: number;
    version: string;
}

interface ITypingMessageXMLParams {
    to: string;
    type: string;
    groupTyping: any,
}

interface ICarbonEnablingXMLParams {
    from: string;
}

interface ICallAcceptedXMLParams {
    to: string;
    id: string;
    callid: string;
    audioParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    videoParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    deviceParams: {
        height: number;
        width: number;
    };
    version: string;
    sdp: string;
}

interface IToggleContactBlockXML {
    contactToBlock: string;
    requestId: string;
    command: string;
    id: string;
}

interface IGetGroupInfoXMLParams {
    groupId: string;
    id: string;
}

interface ISendMessageXMLParams {
    contactId?: string;
    msgText: string;
    msgInfo: string;
    msgType: string;
    repid?: string;
    email: string;
    author: string;
    rel?: string;
    type: string;
    sid: string;
    pid: string;
    to: string;
    id: string;
}

interface ICallVideoOnOffParams {
    isvideo?: string;
    videoon?: string;
    callid: string;
    to: string;
    id: string;
}

interface ICreateGroupXMLParams {
    groupName: string;
    groupId: string;
    admins: string;
    members: string;
    id: string;
}

interface IChangeGroupNameXMLParams {
    groupName: string;
    groupId: string;
    id: string;
}

interface IMessageSeenXMLParams {
    roomId: string;
    msgId: string;
    id: string;
    to: string;
    isE2ESupport: string;
}

interface IMessageSeenXMLParamsService {
    roomName: string;
    msgId: string;
    from: string;
    to: string;
    isE2ESupport: string;
}

interface IJoinToGroupXMLParams {
    username: string;
    groupId: string;
    id: string;
}

interface IXMLReceivedXMLParams {
    from: string;
    roomId: string;
    id: string;
    to: string;
    isE2ESupport: string;
}

interface IXMLReceivedXMLParamsService {
    from: string;
    roomName: string;
    msgId: string;
    to: string;
    isE2ESupport: string;
}

interface IHangUpCallXMLParams {
    to: string;
    callid: string;
    id: string;
    outCall: boolean;
}

interface ISendMediaXMLParams {
    fileRemotePath: string;
    awsId?: string;
    fileSize: string;
    msgType: string;
    msgText: string;
    msgInfo: string;
    author: string;
    repid?: string;
    email: string;
    type: string;
    sid?: string;
    pid?: string;
    rel: string;
    to: string;
    id: string;
    ext?: string;
    imageVideoResolution?: string;
}

interface ISendGifXMLParams {
    fileRemotePath: string;
    msgType: string;
    msgText: string;
    msgInfo: string;
    author: string;
    repid?: string;
    email: string;
    type: string;
    rel: string;
    ext: string;
    to: string;
    id: string;
}

interface IChangeAvatarParams {
    msgType: string;
    msgText: string;
    msgInfo: string;
    type: string;
    to: string;
    id: string;
}

interface IGetGroupsXMLParams {
    id: string;
}

interface ISendFileXMLParams {
    fileSize: string;
    msgText: string;
    msgInfo: string;
    msgType: string;
    author: string;
    repid?: string;
    email?: string;
    awsId: string;
    type: string;
    sid: string;
    pid: string;
    to: string;
    id: string;
}

interface IToggleCallHoldXML {
    callid: string;
    hold: boolean;
    to: string;
    id: string;
}

interface IPresneceXMLParams {
    id: string;
}

interface IDeclineCallParams {
    to: string;
    callid: string;
    outCall: boolean;
    id: string;
}

interface IRingingXMLParams {
    to: string;
    id: string;
    callid: string;
    audioParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    videoParams: {
        candidate: string;
        codec: string;
        proxy: string;
    };
    deviceParams: {
        height: number;
        width: number;
    };
    version: string;
}

interface IPongXMLParams {
    from: string;
    to: string;
    id: string;
}

interface IChangeRoleXMLParams {
    members: string;
    groupId: string;
    from: string;
    role: string;
    id: string;
}

interface IChangeRoleAllXMLParams {
    groupId: string;
    from: string;
    role: string;
    id: string;
}

interface IMemberEditNameXMLParams {
    groupId: string;
    allow: string;
    from: string;
    id: string;
}

interface IMemberEditAvatarXMLParams {
    groupId: string;
    allow: string;
    from: string;
    id: string;
}

interface IMemberAddMemberXMLParams {
    groupId: string;
    allow: string;
    from: string;
    id: string;
}

interface IDeleteRoomXMLParams {
    groupId: string;
    from: string;
    id: string;
}

interface ILeaveOwnerXMLParams {
    groupId: string;
    owner: string;
    id: string;
}

interface IPingParams {
    jid: string;
}

interface IAppLatestVersionParams {
    username: string;
    password: string;
    appCurrentVersion: string;
}

export function inviteToCallXML({to, callid, audioParams, videoParams, deviceParams, isVideo, outCall, callTime, version, sdp, email, firstName, lastName}: IInvitedToCallXMLParams): Strophe.Builder {

    if (outCall && !to.includes(VOIP_CALL_EXTENSION)) {
        to = `${to}@${VOIP_CALL_EXTENSION}`
    } else if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({
        to: `${conf.app.prefix}${to}`,
        type: XML_MESSAGE_TYPES.chat,
        xmlns: JABBER_CLIENT_XMLNS,
        id: callid
    })
        .c("body").t(`${conf.app.prefix}${to}`).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {
            isvideo: isVideo ? "1" : "0",
            acandidate: audioParams.candidate,
            vcandidate: videoParams.candidate,
            command: CALL_COMMANDS.invite,
            dheight: deviceParams.height,
            dwidth: deviceParams.width,
            acodec: audioParams.codec,
            aproxy: audioParams.proxy,
            vcodec: videoParams.codec,
            vproxy: videoParams.proxy,
            prototype: CALL_PROTOTYPE,
            xmlns: CALL_XMLNS,
            callTime,
            version,
            callid,
            email,
            firstName,
            lastName
        })
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("sdp").up()
        .c("value", {type: "string"}).t(sdp).up().up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function callAcceptedXML({to, id, callid, audioParams, videoParams, deviceParams, version, sdp}: ICallAcceptedXMLParams): Strophe.Builder {

    if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({
        to: `${conf.app.prefix}${to}`,
        type: XML_MESSAGE_TYPES.chat,
        id
    })
        .c("body").up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {
            acandidate: audioParams.candidate,
            vcandidate: videoParams.candidate,
            command: CALL_COMMANDS.accept,
            dheight: deviceParams.height,
            dwidth: deviceParams.width,
            acodec: audioParams.codec,
            aproxy: audioParams.proxy,
            vcodec: videoParams.codec,
            vproxy: videoParams.proxy,
            prototype: CALL_PROTOTYPE,
            xmlns: CALL_XMLNS,
            version,
            callid
        })
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("sdp").up()
        .c("value", {type: "string"}).t(sdp).up().up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function getMessageXMLForSend({to, id, rel="", msgText, fileSize,awsId, fileRemotePath, author, msgInfo, msgType, type, sid = "0", pid = "", repid = "", email = "", ext = "", imageVideoResolution = ""}: ISendMediaXMLParams) {
    const xmlMsg = new MessageXML();
    switch (msgType) {
        case MESSAGE_TYPES.image:
        case MESSAGE_TYPES.video:
        case MESSAGE_TYPES.stream_file:
            if(ext === 'gif') {
                return buildGifMessageXML({xmlMsg, msgType, to, id, type, msgText, fileRemotePath, awsId, repid, sid, pid, email, author, ext, imageVideoResolution})
            } else {
                return buildImageVideoStreamMessageXML({xmlMsg, msgType, to, id, type, msgText, fileSize, fileRemotePath,repid, sid, pid, email, author, ext, imageVideoResolution})
            }
            break;
        case MESSAGE_TYPES.gif:
            return buildGifMessageXML({xmlMsg, msgType, to, id, type, msgText, fileRemotePath, awsId, repid, sid, pid, email, author,ext, imageVideoResolution})
            break;
        case MESSAGE_TYPES.voice:
        case MESSAGE_TYPES.file:
            return buildFileMessageXML({xmlMsg, msgType, to, id, type, msgText,fileSize,awsId,repid,author, sid, pid, email, fileRemotePath, msgInfo})
            break;
        case MESSAGE_TYPES.text:
        case MESSAGE_TYPES.contact_with_info:
        case MESSAGE_TYPES.sticker:
        case MESSAGE_TYPES.delete_msg:
        case MESSAGE_TYPES.edit_mgs:
        case MESSAGE_TYPES.location:
            return buildTextMessageXML({xmlMsg,msgInfo, rel, msgType, to, id, type, msgText,author,repid, sid, pid, email})
            break;
        default:
    }
}

export function getMessageXMLForSendService({to, id, rel="", msgText, fileSize,awsId, fileRemotePath, author, msgInfo, msgType, type, sid = "0", pid = "", repid = "", email = "", ext, imageVideoResolution = ""}: ISendMediaXMLParams) {
    const xmlMsg = new MessageXML();
    switch (msgType) {
        case MESSAGE_TYPES.image:
        case MESSAGE_TYPES.video:
        case MESSAGE_TYPES.stream_file:
            if(ext === 'gif') {
                return buildGifMessageXML({xmlMsg, msgType, to: convertXmlParamWithPrefixAndHackstream(to), id, type, msgText, fileRemotePath, awsId, repid, sid, pid, email, author, ext, imageVideoResolution})
            } else {
                return buildImageVideoStreamMessageXML({xmlMsg, msgType, to: convertXmlParamWithPrefixAndHackstream(to), id, type, msgText, fileSize, fileRemotePath, repid, sid, pid, email,author, ext,  imageVideoResolution})
            }
            break;
        case MESSAGE_TYPES.gif:
            return buildGifMessageXML({xmlMsg, msgType, to: convertXmlParamWithPrefixAndHackstream(to), id, type, msgText, fileRemotePath, awsId, repid, sid, pid, email, author, ext,  imageVideoResolution})
            break;
        case MESSAGE_TYPES.voice:
        case MESSAGE_TYPES.file:
            return buildFileMessageXML({xmlMsg, msgType, to: convertXmlParamWithPrefixAndHackstream(to), id, type, msgText,fileSize,awsId,repid,author, sid, pid, email, fileRemotePath, msgInfo})
            break;
        case MESSAGE_TYPES.text:
        case MESSAGE_TYPES.contact_with_info:
        case MESSAGE_TYPES.sticker:
        case MESSAGE_TYPES.delete_msg:
        case MESSAGE_TYPES.edit_mgs:
            return buildTextMessageXML({xmlMsg,msgInfo, rel, msgType, to: convertXmlParamWithPrefixAndHackstream(to), id, type, msgText,author,repid, sid, pid, email})
            break;
        default:
    }
}

export function getBatchMessageXMLForSend({msgId, msgInfo, msgType, to}) {
    Log.i(msgInfo, "msgInfo")
    // const xmlMsg = new MessageXML();
    const time=Date.now();
    return $msg({to: `${time}@ack.msg.hawkstream.com`, id: msgId, type: MESSAGE_TYPES.chat, "xml:lang": "en"})
      .c("body").t("#E#F#M#").up()
      .c("properties", {xmlns: MESSAGE_XMLNS})
      .c("property").c("name").t("msgType").up()
      .c("value", {type: "string"}).t(msgType).up().up()
      .c("property")
      .c("name").t("time").up()
      .c("value", {type: "string"}).t("" + time).up().up()
      .c("property")
      .c("name").t("msgInfo").up()
      .c("value", {type: "string"}).t(msgInfo.replace(/&quot;/g, '"')).up().up().up()
      .c("request", {xmlns: XML_REQUEST_XMLNS})
}

function buildTextMessageXML({xmlMsg,msgInfo = "", rel="", msgType, to, id, type, msgText,author,repid, sid, pid, email}) {
    xmlMsg.initialMessageXML({msgType, to, id, type, msgText});
    xmlMsg.addMessageSpecificProps([{name: 'msgInfo', value: msgInfo}, {name: 'rel', value: rel}]);
    xmlMsg.addDefaultXMLMessageProps({repid, sid, pid, email,msgType, author});
    xmlMsg.addRequestProp();
    return xmlMsg.xmlMessage
}
function buildFileMessageXML({xmlMsg, msgType, to, id, type, msgText,fileSize, awsId, repid, author, sid, pid, email, fileRemotePath, msgInfo}) {

    let msg;
    let ext;

    if (msgInfo) {
        const msgInfoObj = JSON.parse(msgInfo)
        msg = msgInfoObj.fileName
        ext = msgInfoObj.fileType
        Log.i("buildFileMessageXML -> msgInfoObj = ", msgInfoObj)
    }

    xmlMsg.initialMessageXML({msgType, to, id, type, msgText: msg ? msg : msgText});
    if(fileRemotePath){
        xmlMsg.addMessageSpecificProps([{name: 'msgInfo', value: msgInfo}, {name: 'fileSize', value: fileSize},{name: 'fileRemotePath', value: fileRemotePath}]);
    } else {
        xmlMsg.addMessageSpecificProps([{name: 'msgInfo', value: msgInfo}, {name: 'fileSize', value: fileSize},{name: 'fileRemotePath', value: awsId}]);
    }
    if (msg && ext) {
        xmlMsg.addMessageSpecificProps([{name: 'msg', value: msg}, {name: 'ext', value: ext}])
    }
    xmlMsg.addDefaultXMLMessageProps({repid, sid, pid, email,msgType, author});
    xmlMsg.addRequestProp();
    return xmlMsg.xmlMessage
}

function buildImageVideoStreamMessageXML({xmlMsg,msgType, to, id, type, msgText,fileSize, fileRemotePath,repid, sid, pid, email,author, ext, imageVideoResolution}) {
    if (msgType === MESSAGE_TYPES.stream_file) {
        msgType = MESSAGE_TYPES.video
    }

    if (msgType === MESSAGE_TYPES.video) {
        ext = ext || "webm"
    }

    xmlMsg.initialMessageXML({msgType, to, id, type, msgText});
    xmlMsg.addMessageSpecificProps([{name: 'fileSize', value: fileSize},{name: 'fileRemotePath', value: fileRemotePath}, {name: 'ext', value: ext}, {name: 'imageVideoResolution', value: imageVideoResolution}]);
    xmlMsg.addDefaultXMLMessageProps({repid, sid, pid, email,msgType, author});
    xmlMsg.addRequestProp();
    return xmlMsg.xmlMessage
}

function buildGifMessageXML({xmlMsg,msgType, to, id, type, msgText, fileRemotePath,awsId, repid, sid, pid, email, author,ext, imageVideoResolution}) {
    xmlMsg.initialMessageXML({msgType, to, id, type, msgText});
    if(fileRemotePath) {
        xmlMsg.addMessageSpecificProps([{name: 'fileRemotePath', value: fileRemotePath}, {name: 'ext', value: ext}, {name: 'imageVideoResolution', value: imageVideoResolution}]);
    } else {
        xmlMsg.addMessageSpecificProps([{name: 'fileRemotePath', value: awsId},{name: 'ext', value: ext}, {name: 'imageVideoResolution', value: imageVideoResolution}]);
    }
    xmlMsg.addDefaultXMLMessageProps({repid, sid, pid, email,msgType:"IMAGE", author});
    xmlMsg.addRequestProp();
    return xmlMsg.xmlMessage
}

function MessageXML(){
    this.xmlMessage;
    this.initialMessageXML = ({msgType, to, id, type, msgText}) => {
        this.xmlMessage =  $msg({...defaultXMLAttributes({msgType, to, id, type})})
          .c("body").t(msgText).up()
          .c("properties", {xmlns: MESSAGE_XMLNS});
        return this.xmlMessage;
    };
    this.addRequestProp = () => {this.xmlMessage.c("request", {xmlns: XML_REQUEST_XMLNS}); return this.xmlMessage}
    this.addMessageSpecificProps = (props) => {props.map(item => {
        this.xmlMessage.c('property')
          .c('name').t(item.name).up()
          .c('value', {type: 'string'}).t(item.value).up().up();
    });
        return this.xmlMessage;
    };
    this.addDefaultXMLMessageProps = ({repid = "", sid = "0", pid = "", email = "",msgType, author}) => {
        return this.xmlMessage.c("property").c("name").t("alias").up()
          // .c("value", {type: "string"}).t(conf.app.prefix + author).up().up()
          .c("value", {type: "string"}).t(conf.app.prefix + author.replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "")).up().up()
          .c("property")
          .c("name").t("repid").up()
          .c("value", {type: "string"}).t(repid).up().up()
          .c("property")
          .c("name").t("email").up()
          .c("value", {type: "string"}).t(email).up().up()
          .c("property")
          .c("name").t("pid").up()
          .c("value", {type: "string"}).t(pid).up().up()
          .c("property")
          .c("name").t("sid").up()
          .c("value", {type: "string"}).t(sid).up().up()
          .c("property")
          .c("name").t("msgType").up()
          .c("value", {type: "string"}).t(msgType).up().up().up();
    };
}

export function defaultXMLAttributes({msgType, to, id, type}) {
    return [MESSAGE_TYPES.stream_file, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.gif, MESSAGE_TYPES.voice].includes(msgType) ?
      {
        to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
        id,
        type,
        xmlns: JABBER_CLIENT_XMLNS
    } :
      {
          to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
          id,
          type,
          xmlns: JABBER_CLIENT_XMLNS
      }
}

export function sendMediaXML({to, id, rel, msgText, fileSize, fileRemotePath, author, msgInfo, msgType, type, sid = "0", pid = "", repid = "", email = ""}: ISendMediaXMLParams): Strophe.Builder {
    return $msg({
        to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
        id,
        type,
        xmlns: JABBER_CLIENT_XMLNS
    })
        .c("body").t(msgText).up()
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("fileSize").up()
        .c("value", {type: "string"}).t(fileSize).up().up()
        .c("property")
        .c("name").t("fileRemotePath").up()
        .c("value", {type: "string"}).t(fileRemotePath).up().up()
        .c("property")
        .c("name").t("alias").up()
        .c("value", {type: "string"}).t(conf.app.prefix + author).up().up()
        .c("property")
        .c("name").t("msgInfo").up()
        .c("value", {type: "string"}).t(msgInfo).up().up()
        .c("property")
        .c("name").t("repid").up()
        .c("value", {type: "string"}).t(repid).up().up()
        .c("property")
        .c("name").t("email").up()
        .c("value", {type: "string"}).t(email).up().up()
        .c("property")
        .c("name").t("pid").up()
        .c("value", {type: "string"}).t(pid).up().up()
        .c("property")
        .c("name").t("sid").up()
        .c("value", {type: "string"}).t(sid).up().up()
        .c("property")
        .c("name").t("msgType").up()
        .c("value", {type: "string"}).t(msgType).up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function sendGifXML({to, id, rel, msgText, fileRemotePath, author, msgInfo, msgType, type, ext, repid = "", email = ""}: ISendGifXMLParams): Strophe.Builder {
    return $msg({
        to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
        id,
        type,
        xmlns: JABBER_CLIENT_XMLNS
    })
        .c("body").t(msgText).up()
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("msgType").up()
        .c("value", {type: "string"}).t(msgType).up().up()
        .c("property")
        .c("name").t("msgInfo").up()
        .c("value", {type: "string"}).t(msgInfo).up().up()
        .c("property")
        .c("name").t("repid").up()
        .c("value", {type: "string"}).t(repid).up().up()
        .c("property")
        .c("name").t("email").up()
        .c("value", {type: "string"}).t(email).up().up()
        .c("property")
        .c("name").t("ext").up()
        .c("value", {type: "string"}).t(ext).up().up()
        .c("property")
        .c("name").t("fileRemotePath").up()
        .c("value", {type: "string"}).t(fileRemotePath).up().up()
        .c("property")
        .c("name").t("alias").up()
        .c("value", {type: "string"}).t(conf.app.prefix + author).up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function updateGroupAvatarXML({to, id, msgText, type, msgType, msgInfo}: IChangeAvatarParams): Strophe.Builder {
    return $msg({
        to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
        id,
        type
    })
        .c("body").t(msgText).up()
        .c("properties")
        .c("property")
        .c("name").t("msgType").up()
        .c("value", {type: "string"}).t(msgType).up().up()
        .c("property")
        .c("name").t("msgInfo").up()
        .c("value", {type: "string"}).t(msgInfo).up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function sendMessageXML({to, id, type, author, msgText, msgInfo = "", msgType, rel = "", repid = "", sid = "0", pid = "", email = ""}: ISendMessageXMLParams): Strophe.Builder {
    return $msg({to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to, type, id})
        .c("body").t(msgText).up()
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("alias").up()
        .c("value", {type: "string"}).t(conf.app.prefix + author.replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "")).up().up()
        .c("property")
        .c("name").t("msgInfo").up()
        .c("value", {type: "string"}).t(msgInfo).up().up()
        .c("property")
        .c("name").t("email").up()
        .c("value", {type: "string"}).t(email).up().up()
        .c("property")
        .c("name").t("rel").up()
        .c("value", {type: "string"}).t(rel).up().up()
        .c("property")
        .c("name").t("repid").up()
        .c("value", {type: "string"}).t(repid).up().up()
        .c("property")
        .c("name").t("pid").up()
        .c("value", {type: "string"}).t(pid).up().up()
        .c("property")
        .c("name").t("sid").up()
        .c("value", {type: "string"}).t(sid).up().up()
        .c("property")
        .c("name").t("msgType").up()
        .c("value", {type: "string"}).t(msgType).up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function sendFileXML({to, id, msgText, fileSize, awsId, author, msgInfo, msgType, type, sid = "0", pid = "", repid = "", email = ""}: ISendFileXMLParams): Strophe.Builder {
    return $msg({
        to: type === XML_MESSAGE_TYPES.group ? to : conf.app.prefix + to,
        id,
        type,
        xmlns: JABBER_CLIENT_XMLNS
    })
        .c("body").t(msgText).up()
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("fileSize").up()
        .c("value", {type: "string"}).t(fileSize).up().up()
        .c("property")
        .c("name").t("fileRemotePath").up()
        .c("value", {type: "string"}).t(awsId).up().up()
        .c("property")
        .c("name").t("alias").up()
        .c("value", {type: "string"}).t(conf.app.prefix + author).up().up()
        .c("property")
        .c("name").t("email").up()
        .c("value", {type: "string"}).t(email).up().up()
        .c("property")
        .c("name").t("msgInfo").up()
        .c("value", {type: "string"}).t(msgInfo).up().up()
        .c("property")
        .c("name").t("repid").up()
        .c("value", {type: "string"}).t(repid).up().up()
        .c("property")
        .c("name").t("pid").up()
        .c("value", {type: "string"}).t(pid).up().up()
        .c("property")
        .c("name").t("sid").up()
        .c("value", {type: "string"}).t(sid).up().up()
        .c("property")
        .c("name").t("msgType").up()
        .c("value", {type: "string"}).t(msgType).up().up().up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function ringingXML({to, id, callid, audioParams, videoParams, deviceParams, version}: IRingingXMLParams): Strophe.Builder {

    if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({
        to: `${conf.app.prefix}${to}`,
        type: XML_MESSAGE_TYPES.chat,
        id
    })
        .c("body").t(`${conf.app.prefix}${to}`).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {
            acandidate: audioParams.candidate,
            vcandidate: videoParams.candidate,
            command: CALL_COMMANDS.ringing,
            dheight: deviceParams.height,
            dwidth: deviceParams.width,
            acodec: audioParams.codec,
            aproxy: audioParams.proxy,
            vcodec: videoParams.codec,
            vproxy: videoParams.proxy,
            prototype: CALL_PROTOTYPE,
            xmlns: CALL_XMLNS,
            version,
            callid
        })
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function sendIceCandidateXML({to, callid, sdpMLineIndex, sdpMid, candidate, outCall}: ISendIceCandidateXMLParams): Strophe.Builder {

    if (outCall && !to.includes(VOIP_CALL_EXTENSION)) {
        to = `${to}@${VOIP_CALL_EXTENSION}`
    } else if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({
        to: `${conf.app.prefix}${to}`,
        type: XML_MESSAGE_TYPES.chat,
        xmlns: JABBER_CLIENT_XMLNS,
        id: callid
    })
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {
            command: CALL_COMMANDS.ice_candidate,
            xmlns: CALL_XMLNS,
            sdpMLineIndex,
            candidate,
            callid,
            sdpMid
        });
}

export function sendLocalDescriptionXML({to, callid, sdp, type, onlySet}: ISendLocalDescriptionXMLParams): Strophe.Builder {

    if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({
        to: `${conf.app.prefix}${to}`,
        type: XML_MESSAGE_TYPES.chat,
        xmlns: JABBER_CLIENT_XMLNS,
        id: callid
    })
        .c("body").up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS}).up()
        .c("call", {
            command: CALL_COMMANDS.local_description,
            xmlns: CALL_XMLNS,
            type,
            callid,
            onlySet: onlySet ? "1" : "0"
        })
        .c("properties", {xmlns: MESSAGE_XMLNS})
        .c("property")
        .c("name").t("sdp").up()
        .c("value", {type: "string"}).t(sdp).up().up().up().up()
}

export function carbonEnablingXML({from}: ICarbonEnablingXMLParams): Strophe.Builder {
    return $iq(({
        xmlns: "jabber:client",
        from,
        id: "enable1",
        type: "set"
    })).c("enable", {xmlns: "urn:xmpp:carbons:2"})
}

export function toggleContactBlockXML({id, contactToBlock, command, requestId}: IToggleContactBlockXML): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: PRIVACY_TO})
        .c("privacy", {
            items: contactToBlock ? conf.app.prefix + contactToBlock : "",
            command,
            xmlns: PRIVACY_XMLNS,
            requestId
        });
}

export function leaveOrRemoveSomeoneFromGroupXML({id, groupPartialId, username, command}: any): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {room_name: groupPartialId, members: username, command, xmlns: ZANGI_ZMUC_XMLNS});
}

export function inviteGroupMembersXML({id, groupId, members, admins}: IInviteGroupMembersXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {room_name: groupId, members, admins, command: INVITE_COMMAND, xmlns: ZANGI_ZMUC_XMLNS});
}

export function createGroupXML({id, groupId, groupName, admins, members}: ICreateGroupXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {
            room_name: groupId,
            room_desc: groupName,
            room_subject: groupName,
            members,
            admins,
            command: CREATE_GROUP_XML_COMMAND,
            xmlns: ZANGI_ZMUC_XMLNS
        });
}

export function changeGroupNameXML({id, groupId, groupName}: IChangeGroupNameXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {
            room_name: groupId,
            room_subject: groupName,
            command: CHANGE_GROUP_XML_COMMAND,
            xmlns: ZANGI_ZMUC_XMLNS
        });
}

export function messageSeenXML({msgId, to, id, roomId, isE2ESupport}: IMessageSeenXMLParams): Strophe.Builder {
    return $msg({to, id: msgId, type: MESSAGE_TYPES.chat, roomId, isE2ESupport})
        .c("body").t("seen").up()
        // .c("displayed", {xmlns: XML_REQUEST_XMLNS, id: `displayed${msgId}`}).up()
        .c("displayed", {xmlns: XML_REQUEST_XMLNS, id}).up()
        // .c("request", {xmlns: XML_REQUEST_XMLNS})
        // .c("isE2ESupport", 0)
}

export function messageSeenXMLService({from, msgId, to, roomName, isE2ESupport}: IMessageSeenXMLParamsService): Strophe.Builder {
    return $msg({to: convertXmlParamWithPrefixAndHackstream(to), id: msgId, type: MESSAGE_TYPES.chat, roomId: roomName, isE2ESupport})
      .c("body").t("seen").up()
      // .c("displayed", {xmlns: XML_REQUEST_XMLNS, id: `displayed${msgId}`}).up()
      .c("displayed", {xmlns: XML_REQUEST_XMLNS, from: convertXmlParamWithPrefixAndHackstream(from)}).up()
    // .c("request", {xmlns: XML_REQUEST_XMLNS})
    // .c("isE2ESupport", 0)
}

export function messageDisplayedReceivedXML({id}: IMessageDisplayedReceivedXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ACK_TO})
        .c("ack", {command: MESSAGE_SEEN_COMMAND, xmlns: ACK_XMLNS});
}

export function messageDeliveredReceivedXML({id}: IMessageDeliveredReceivedXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ACK_TO})
        .c("ack", {command: MESSAGE_DELIVERED_COMMAND, xmlns: ACK_XMLNS});
}
export function deliveredMessageForMyMessageFromOtherDeviceXML({id}: IMessageDeliveredReceivedXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ACK_TO})
        .c("ack", {command: MY_MESSAGE_DELIVERED_COMMAND, xmlns: ACK_XMLNS});
}
export function messageCallReceivedXML({id}: IMessageDeliveredReceivedXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ACK_TO})
        .c("ack", {command: MESSAGE_CALL_COMMAND, xmlns: ACK_XMLNS});
}

export function callVideoOnOffXML({to, id, callid, videoon}: ICallVideoOnOffParams): Strophe.Builder {
    if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({to: `${conf.app.prefix}${to}`, id, type: XML_MESSAGE_TYPES.chat})
        .c("body").up()
        .c("call", {command: CALL_COMMANDS.video, xmlns: CALL_XMLNS, callid, videoon});
}

export function lastActivityRequestXML({id}: ILastActivityRequestXMLParams): Strophe.Builder {
    id = id.split("@").shift();
    return $msg({id: Date.now(), to: `${conf.app.prefix}${id}@${LAST_ACTIVITY_EXTENSION}`})
        .c("zpresence", {command: GET_STATUS_COMMAND, xmlns: ZANGI_ZPRESENCE_XMLNS})
}

export function joinToGroupXML({id, groupId, username}: IJoinToGroupXMLParams): Strophe.Builder {
    return $pres({id, to: `${groupId}@${GROUP_CONVERSATION_EXTENSION}/${conf.app.prefix + username}`})
        .c("c", PRESENCE_HASH).up().c("x", {xmlns: PRESENCE_XMLNS});
}

export function toggleCallHoldXML({to, id, callid, hold}: IToggleCallHoldXML): Strophe.Builder {

    if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({to: `${conf.app.prefix}${to}`, id, type: XML_MESSAGE_TYPES.chat})
        .c("body").t(`${conf.app.prefix}${to}`).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {command: hold ? CALL_COMMANDS.hold : CALL_COMMANDS.unhold, xmlns: CALL_XMLNS, callid});
}

export function stopTypingMessageXML({to}: IStopTypingMessageXMLParams): Strophe.Builder {
    const id: string = `msgIdStop${Date.now()}`;
    return $msg({to: conf.app.prefix + to, id})
        .c("x", {xmlns: EVENT_XMLNS})
        .c("id").t(id);
}

export function getGroupInfoXML({id, groupId}: IGetGroupInfoXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {
            room_name: groupId.includes("@") ? groupId.split("@").shift() : groupId,
            command: GET_INFO_XML_COMMAND,
            xmlns: ZANGI_ZMUC_XMLNS
        });
}

export function hangUpCallXML({to, id, callid, outCall}: IHangUpCallXMLParams): Strophe.Builder {

    if (outCall && !to.includes(VOIP_CALL_EXTENSION)) {
        to = `${to}@${VOIP_CALL_EXTENSION}`
    } else if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({to: `${conf.app.prefix}${to}`, id, type: XML_MESSAGE_TYPES.chat})
        .c("body").t(`${conf.app.prefix}${to}`).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {command: CALL_COMMANDS.hangup, xmlns: CALL_XMLNS, callid});
}

export function sendVideoEnabledXML({id, to, callid, videoon}) {
    /*to is from*/
    return $msg({to: `${to}`, id, type: XML_MESSAGE_TYPES.chat})
        .c("body").up()
        .c("call", {command: CALL_COMMANDS.video, xmlns: CALL_XMLNS, callid, videoon});
}

export function XMLReceivedXML({from, id, to, roomId, isE2ESupport}: IXMLReceivedXMLParams): Strophe.Builder {
    return $msg({to, id, from, type: MESSAGE_TYPES.chat, roomId, isE2ESupport})
        .c("body").t("delivered").up()
        .c("received", {xmlns: XML_REQUEST_XMLNS, id: `${id}`}).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS})
        // .c("isE2ESupport", 0)
}

export function convertXmlParamWithPrefixAndHackstream (param) {
    let prefix = ""
    let hackstream = ""
    if(param && !param.includes(APP_CONFIG.PREFIX)){
        prefix = APP_CONFIG.PREFIX
    }
    if(param && !param.includes("@msg.hawkstream.com")){
        hackstream = "@msg.hawkstream.com"
    }

    return prefix + param + hackstream

}

export function XMLReceivedXMLService({from, msgId, to, roomName, isE2ESupport}: IXMLReceivedXMLParamsService): Strophe.Builder {
    return $msg({to: convertXmlParamWithPrefixAndHackstream (to), id: msgId, from: convertXmlParamWithPrefixAndHackstream (from), type: MESSAGE_TYPES.chat, roomId: roomName, isE2ESupport})
      .c("body").t("delivered").up()
      .c("received", {xmlns: XML_REQUEST_XMLNS, id: `${msgId}`}).up()
      .c("request", {xmlns: XML_REQUEST_XMLNS})
    // .c("isE2ESupport", 0)
}

export function declineCallXML({to, id, callid, outCall}: IDeclineCallParams): Strophe.Builder {

    if (outCall && !to.includes(VOIP_CALL_EXTENSION)) {
        to = `${to}@${VOIP_CALL_EXTENSION}`
    } else if (!to.includes(SINGLE_CONVERSATION_EXTENSION)) {
        to = `${to}@${SINGLE_CONVERSATION_EXTENSION}`
    }

    return $msg({to: `${conf.app.prefix}${to}`, id, type: XML_MESSAGE_TYPES.chat})
        .c("body").t(`${conf.app.prefix}${to}`).up()
        .c("private", {xmlns: "urn:xmpp:carbons:2"}).up()
        .c("call", {command: CALL_COMMANDS.decline, xmlns: CALL_XMLNS, callid});
}

export function typingMessageXML({to, type, groupTyping}: ITypingMessageXMLParams): Strophe.Builder {
    return $msg({to, type, id: `msgId${Date.now()}`, xmlns: JABBER_CLIENT_XMLNS})
        .c("x", {xmlns: EVENT_XMLNS})
        .c("composing", {isGroup: groupTyping}).up()
        .c("id").t(`msgId${Date.now()}`);
}

export function pongXML({to, id, from}: IPongXMLParams): Strophe.Builder {
    return $iq({type: "result", to, id, from});
}

export function getGroupsXML({id}: IGetGroupsXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("zmuc", {command: GET_GROUPS_XML_COMMAND, xmlns: ZANGI_ZMUC_XMLNS});
}

export function presenceXML({id}: IPresneceXMLParams): Strophe.Builder {
    return $pres({id}).c("status").t("available").up().c("priority").t("24");
}


export function showOnlineStatusXML(isEnabled: boolean): Strophe.Builder {
    return $msg({id: Date.now(), to: ZPRESENCE_TO})
        .c("zpresence", {command: isEnabled ? "available" : "unavailable", xmlns: ZANGI_ZPRESENCE_XMLNS});
}


export function foregroundXML(isSettings?: boolean): Strophe.Builder {
    return $msg({id: Date.now(), to: ZPRESENCE_TO})
        .c("zpresence", {command: isSettings ? "available" : FOREGROUND_COMMAND, xmlns: ZANGI_ZPRESENCE_XMLNS});
}

export function backgroundXML(isSettings?: boolean): Strophe.Builder {
    return $msg({id: Date.now(), to: ZPRESENCE_TO})
        .c("zpresence", {command: isSettings ? "unavailable" : BACKGROUND_COMMAND, xmlns: ZANGI_ZPRESENCE_XMLNS});
}


export function syncCompletedXML(): Strophe.Builder {
    return $msg({id: Date.now(), to: ZSYNC_TO})
        .c("zsync", {command: CONVERSATION_COMMAND, xmlns: ZSYNC_XMLNS});
}


export function offlineCompletedXML(): Strophe.Builder {
    return $msg({id: Date.now(), to: ZOFFLINE_TO})
        .c("zoffline", {command: CONVERSATION_COMMAND, xmlns: ZOFFLINE_XMLNS});
}


export function changeRole({id, from, members, groupId, role}: IChangeRoleXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            members,
            room_name: groupId,
            role,
            command: CHANGE_ROLE_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function changeRoleAll({id, from, groupId, role}: IChangeRoleAllXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            role,
            command: CHANGE_ROLE_ALL_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function memberEditName({id, from, groupId, allow}: IMemberEditNameXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            allow,
            command: MEMBER_EDIT_NAME_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function memberEditAvatar({id, from, groupId, allow}: IMemberEditAvatarXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            allow,
            command: MEMBER_EDIT_AVATAR_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function memberAddMember({id, from, groupId, allow}: IMemberAddMemberXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            allow,
            command: MEMBER_ADD_MEMBER_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function deleteRoom({id, from, groupId}: IDeleteRoomXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO, from})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            command: DELETE_ROOM_COMMAND,
            requestId: id,
            email: ""
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function leaveOwner({id, groupId, owner}: ILeaveOwnerXMLParams): Strophe.Builder {
    return $msg({id, type: XML_MESSAGE_TYPES.chat, to: ZMUC_TO})
        .c("body").up()
        .c("zmuc", {
            xmlns: ZANGI_ZMUC_XMLNS,
            room_name: groupId,
            owner,
            command: OWNER_LEAVE_COMMAND,
            requestId: id
        }).up()
        .c("request", {xmlns: XML_REQUEST_XMLNS});
}

export function ping({jid}: IPingParams): Strophe.Builder {
    return $iq({type: 'get', to: jid, id: Date.now()})
        .c('ping', {xmlns: 'urn:xmpp:ping'});
}

export function appLatestVersionXML(props: IAppLatestVersionParams): Strophe.Builder {
    const {username, password}: IAppLatestVersionParams = props;
    return $msg({id: Date.now(), type: XML_MESSAGE_TYPES.chat, to: APP_VERSION_TO})
        .c("body").up()
        .c("http", {
            ip: '',
            prefix: conf.app.prefix,
            version: '',
            command: LOGIN_COMMAND,
            xmlns: ZANGI_HTTP_XMLNS,
            uid: getDeviceToken(),
            password,
            username: `${conf.app.prefix}${username}`,
            device_type: APPLICATION.DEVICE_TYPE,
            platform: APPLICATION.PLATFORM,
            appVersion: props.appCurrentVersion
        }).up()
}
