"use strict";

import {OrderedMap} from "immutable";
import isRegExp from "lodash/isRegExp";
import escapeRegExp from "lodash/escapeRegExp";
import isString from "lodash/isString";
import flatten from "lodash/flatten";

import {IS_REPLY_PERSONALLY_ENABLED, LOAD_STATUS, MESSAGE_TYPES} from "configs/constants";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {getThreadType, getUsername} from "helpers/DataHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import {IMessage} from "modules/messages/MessagesReducer";
import {getLocationName} from "requests/locationRequest";
import * as linkifyStr from "linkifyjs/string"
import components from "configs/localization";
import {getName} from "helpers/ContactsHelper";
import {isURI} from "helpers/DomHelper";
import Log from "modules/messages/Log";

export function getMessageText(message: IMessage, contacts: OrderedMap<string, IContact>, userId: string, left?: boolean): string {
    const creatorUsername: string = getUsername(message.get("creator"));
    let localization: any;
    let fromName: string;
    let toName: string;
    let msgInfo: any;

    if (message.get("deleted")) {
        localization = components().messageElement;
        fromName = getName(message.get("creator"));

        const creatorUsername: string = getUsername(message.get("creator"));

        fromName = creatorUsername === userId ? localization.You : fromName;
        contacts.map(storeContact => {
            const contactId = storeContact.get("contactId") || storeContact.get("id");
            if (fromName !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
            }
            return true;
        });

        return fromName === localization.You ? `${fromName} ${localization.youDeletedMessage}` : `${fromName} ${localization.deletedMessage}`;
    } else {
        switch (message.get("type")) {

            case MESSAGE_TYPES.update_group_avatar:
                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = getName(message.get("creator"));

                fromName = creatorUsername === userId ? localization.You : fromName;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (msgInfo !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${localization.changedGroupAvatar}`;

            case MESSAGE_TYPES.update_group_name:

                localization = components().messageElement;
                msgInfo = getName(message.get("creator"));
                toName = creatorUsername === userId ? localization.You : msgInfo;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (msgInfo !== userId && (storeContact.get("username") === toName || contactId === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${toName} ${localization.changedGroupName}`;

            case MESSAGE_TYPES.remove_from_group:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));
                toName = message.get("info").replace(/(^\d+)(.+$)/i, '$1') === userId ? localization.you : msgInfo;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    } else if (msgInfo !== userId && (storeContact.get("username") === toName || contactId === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${fromName === localization.You ? localization.youRemoved : localization.removed} ${toName}`;

            case MESSAGE_TYPES.incoming_call:
                localization = components().messageElement;

                if (left) {
                    return localization.incomingCall;
                }

                return `${localization.incomingCall}\n ${message.get("info")}`;

            case MESSAGE_TYPES.outgoing_call:
                localization = components().messageElement;

                if (left) {
                    return localization.outgoingCall;
                }

                return `${localization.outgoingCall}\n ${message.get("info")}`;

            case MESSAGE_TYPES.missed_call:
                localization = components().messageElement;

                if (left) {
                    return localization.missedCall;
                }

                return `${localization.missedCall}`;

            case MESSAGE_TYPES.leave_group:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));
                toName = msgInfo === userId ? localization.you : msgInfo;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    } else if (msgInfo !== userId && (storeContact.get("username") === toName || contactId === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${fromName === localization.You ? localization.youLeftTheGroup : localization.leftTheGroup}`;

            case MESSAGE_TYPES.delete_room:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));
                toName = msgInfo === userId ? localization.you : msgInfo;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    } else if (msgInfo !== userId && (storeContact.get("username") === toName || contactId === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${fromName === localization.You ? localization.youRemovedTheGroup : localization.removedTheGroup}`;

            case MESSAGE_TYPES.create_room:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== "undefined" ? getName(message.get("creator")) : localization.You;
                toName = msgInfo === userId ? localization.you : msgInfo;

                contacts.map(storeContact => {
                    const contactId = storeContact.get("contactId") || storeContact.get("id");
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || contactId === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    } else if (msgInfo !== userId && (storeContact.get("username") === toName || contactId === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${fromName === localization.You ? localization.youCreatedTheGroup : localization.createdTheGroup}`;

            case MESSAGE_TYPES.join_group:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));
                toName = message.get("info").replace(/(^\d+)(.+$)/i, '$1') === userId ? localization.you : msgInfo;

                contacts.map(storeContact => {
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || storeContact.get("contactId") === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    } else if (msgInfo !== userId && (storeContact.get("username") === toName || storeContact.get("contactId") === toName) && storeContact.get("firstName")) {
                        toName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${fromName === localization.You ? localization.youAdded : localization.added} ${toName}`;

            case MESSAGE_TYPES.room_call_start:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));

                contacts.map(storeContact => {
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || storeContact.get("contactId") === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${localization.startedConferenceCall}`;

            case MESSAGE_TYPES.room_call_join:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));

                contacts.map(storeContact => {
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || storeContact.get("contactId") === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${localization.joinedConferenceCall}`;

            case MESSAGE_TYPES.room_call_leave:

                localization = components().messageElement;
                msgInfo = getName(message.get("info"));
                fromName = message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") === userId ? localization.You : getName(message.get("creator"));

                contacts.map(storeContact => {
                    if (message.get("creator").replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "") !== userId && (storeContact.get("username") === fromName || storeContact.get("contactId") === fromName) && storeContact.get("firstName")) {
                        fromName = `${storeContact.get("firstName")} ${storeContact.get("lastName")}`.trim();
                    }
                    return true;
                });

                return `${fromName} ${localization.leftConferenceCall}`;

            case MESSAGE_TYPES.room_call_end:
                localization = components().messageElement;

                return `${localization.conferenceCallEnded}`;

            default:
                return "";
        }
    }
}

export function getLinkifiedText(sentText: string) {
    let text = sentText;
    if (typeof text === "string") {
        text = text.replace(/&amp;/, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    }
    return linkifyStr(text, {
        tagName: 'span', validate: {
            url: function (value) {

                return isURI(value);

                // let urlCheck = new RegExp("^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/.*)?$");
                // return urlCheck.test(value);
            }
        }
    })
}

export function getFirstOccurance(sentText: string) {
    let text = sentText;
    let response = "";
    if (typeof text === "string") {
        text = text.replace(/&amp;/, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    }
    linkifyStr(text, {
        tagName: 'span', validate: {
            url: function (value) {
                let urlCheck = new RegExp("^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/.*)?$");
                if (urlCheck.test(value) && !response) {
                    response = value;
                }
                return false;
            }
        }
    });
    return response;
}

export function getLinkTags(messageText) {
    if (typeof messageText !== "string") {
        return [];
    }
    var regex = /(?:^|\s)(?:@)([a-zA-Z_\d]+)/gm;
    var matches = [];
    var match;
    let text = messageText;
    if (messageText && messageText.match(/text="(.*?)"[ ]?\//)) {
        text = messageText.match(/text="(.*?)"[ ]?\//)[1]
    }

    while ((match = regex.exec(text))) {
        matches.push(match[1]);
    }

    return matches;
}

export function escapeText(text) {
    if (typeof text !== "string") {
        return text;
    }
    //text = text.replace(/\&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    return text;
}

export function unEscapeText(text) {
    if (typeof text !== "string") {
        return text;
    }
    text = text.replace(/\&amp;/g, "&");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    return text;
}

export function openMessageContextMenu(contextMenuMessage, selectedThread, myStickers, handleFileDownload, handleMessageForward, handleMessageEdit, handleMessageReply, handleMessageDelete, handleShowInFolder, handleStickerPackageAdd) {
    const localization: any = components().chatPanel;
    const threadType = selectedThread.getIn(['threads', 'threadType']);
    const threadInfo = selectedThread.getIn(['threads', 'threadInfo']);
    const {isGroup} = getThreadType(threadType);
    const disabledGroup: boolean = isGroup && threadInfo.get("disabled");
    const userSelection: string = contextMenuMessage && window.getSelection().toString();
    const loadStatus = contextMenuMessage && contextMenuMessage.get("loadStatus");
    const isUpload = loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_FAILURE || loadStatus === LOAD_STATUS.OPTIMISE_CANCEL;
    const stream_file_text = contextMenuMessage && ((contextMenuMessage.get("type") === MESSAGE_TYPES.stream_file && contextMenuMessage.get("text") && contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)) ? contextMenuMessage.get("text").match(/text="(.*?)"[ ]?\//)[1] : contextMenuMessage.get("text"));
    const canCopyVideo = stream_file_text && stream_file_text !== "null";
    const canEdit = (contextMenuMessage && contextMenuMessage.get("text") && ([MESSAGE_TYPES.video, MESSAGE_TYPES.image, MESSAGE_TYPES.text].includes(contextMenuMessage.get("type") || canCopyVideo)) && contextMenuMessage.get("text") !== "#E#F#M#");
    const canCopy = userSelection || canEdit || contextMenuMessage && contextMenuMessage.get("type") === MESSAGE_TYPES.location;
    const {MenuItem, Menu} = (window as any).remote;
    const menu = new Menu();
    const showReplyPersonally: boolean = IS_REPLY_PERSONALLY_ENABLED && (isGroup && contextMenuMessage && !contextMenuMessage.get("own"));

    const doCopy = () => {
        if ((window as any).getSelection().toString()) {
            document.execCommand('copy');
        } else {
            let input: any = document.createElement("textarea");
            input.style = "position: absolute; left: -1000px; top: -1000px";
            input.value = unEscapeText(contextMenuMessage.get("text"));
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
        }
    };

    const doCopyAsync = async () => {
        const [lat, lng] = contextMenuMessage.get("info").split("*");
        if ((window as any).getSelection().toString()) {
            document.execCommand('copy');

        } else {
            let input: any = document.createElement("textarea");
            input.style = "position: absolute; left: -1000px; top: -1000px";
            const address: string = await getLocationName(parseFloat(lat), parseFloat(lng));
            input.value = unEscapeText(address);
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
        }

    };

    if ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.file].includes(contextMenuMessage.get("type"))) {
        !disabledGroup && menu.append(new MenuItem({
            label: localization.reply, click: () => {
                handleMessageReply();
            }
        }));
        showReplyPersonally && menu.append(new MenuItem({
            label: localization.replyPersonally, click: () => {
                handleMessageReply(true);
            }
        }));
        canCopy && !isUpload && ![MESSAGE_TYPES.voice].includes(contextMenuMessage.get("type")) && menu.append(new MenuItem({
            label: localization.copy,
            click: () => {
                doCopy();
            }
        }));
        !isUpload && canEdit && contextMenuMessage.get("own") && menu.append(new MenuItem({
            label: localization.editMessage,
            click: () => {
                handleMessageEdit();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        !isUpload && menu.append(new MenuItem({
            label: localization.forward, click: () => {
                handleMessageForward();
            }
        }));
        contextMenuMessage.get("type") !== MESSAGE_TYPES.stream_file && !isUpload && menu.append(new MenuItem({
            label: localization.downloadFile,
            click: () => {
                (window as any).fs ? handleShowInFolder() : handleFileDownload();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.deleteMessage, click: () => {
                handleMessageDelete();
            }
        }));

    } else if ([MESSAGE_TYPES.text, MESSAGE_TYPES.chat].includes(contextMenuMessage.get("type"))) {
        !disabledGroup && menu.append(new MenuItem({
            label: localization.reply, click: () => {
                handleMessageReply();
            }
        }));
        showReplyPersonally && menu.append(new MenuItem({
            label: localization.replyPersonally, click: () => {
                handleMessageReply(true);
            }
        }));
        canCopy && menu.append(new MenuItem({
            label: localization.copy, click: () => {
                doCopy();
            }
        }));
        !disabledGroup && (contextMenuMessage.get("own")) && menu.append(new MenuItem({
            label: localization.editMessage,
            click: () => {
                handleMessageEdit();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.forward, click: () => {
                handleMessageForward();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.deleteMessage, click: () => {
                handleMessageDelete();
            }
        }));

    } else if (contextMenuMessage.get("type") === MESSAGE_TYPES.sticker) {
        !disabledGroup && menu.append(new MenuItem({
            label: localization.reply, click: () => {
                handleMessageReply();
            }
        }));
        showReplyPersonally && menu.append(new MenuItem({
            label: localization.replyPersonally, click: () => {
                handleMessageReply(true);
            }
        }));
        canCopy && menu.append(new MenuItem({
            label: localization.copy, click: () => {
                doCopy();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        myStickers.includes(contextMenuMessage.get("info").split("_").shift()) ?
            menu.append(new MenuItem({
                label: localization.forward, click: () => {
                    handleMessageForward();
                }
            })) :
            menu.append(new MenuItem({
                label: localization.get, click: () => {
                    handleStickerPackageAdd();
                }
            }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.deleteMessage, click: () => {
                handleMessageDelete();
            }
        }));
    } else if ([MESSAGE_TYPES.outgoing_call, MESSAGE_TYPES.incoming_call, MESSAGE_TYPES.missed_call].includes(contextMenuMessage.get("type"))) {
        canCopy && menu.append(new MenuItem({
            label: localization.copy, click: () => {
                doCopy();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.deleteMessage, click: () => {
                handleMessageDelete();
            }
        }));

    } else {
        !disabledGroup && menu.append(new MenuItem({
            label: localization.reply, click: () => {
                handleMessageReply();
            }
        }));
        showReplyPersonally && menu.append(new MenuItem({
            label: localization.replyPersonally, click: () => {
                handleMessageReply(true);
            }
        }));
        canCopy && menu.append(new MenuItem({
            label: localization.copy,
            click: MESSAGE_TYPES.location === contextMenuMessage.get("type") ? doCopyAsync : doCopy
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.forward, click: () => {
                handleMessageForward();
            }
        }));
        menu.items.length > 0 && menu.append(new MenuItem({
            type: "separator"
        }));
        menu.append(new MenuItem({
            label: localization.deleteMessage, click: () => {
                handleMessageDelete();
            }
        }));
    }

    menu.popup((window as any).remote.getCurrentWindow());
}

export function stringReplace(source, match, fn) {
    if (!Array.isArray(source)) source = [source];
    const replaceString = (str, match, fn) => {
        let curCharStart = 0;
        let curCharLen = 0;

        if (str === '') {
            return str;
        } else if (!str || !isString(str)) {
            throw new TypeError('First argument must be a string');
        }

        let re = match;

        if (!isRegExp(re)) {
            re = new RegExp('(' + escapeRegExp(re) + ')', 'gi');
        }

        let result = str.split(re);

        // Apply fn to all odd elements
        for (let i = 1, length = result.length; i < length; i += 2) {
            curCharLen = result[i].length;
            curCharStart += result[i - 1].length;
            result[i] = fn(result[i], i, curCharStart);
            curCharStart += curCharLen;
        }

        return result;
    };
    return flatten(source.map(function (x) {
        return isString(x) ? replaceString(x, match, fn) : x;
    }));
}

export function isSystemMessage(messageType: string) {
    return [
        MESSAGE_TYPES.leave_group,
        MESSAGE_TYPES.join_group,
        MESSAGE_TYPES.remove_from_group,
        MESSAGE_TYPES.update_group_avatar,
        MESSAGE_TYPES.update_group_name,
        MESSAGE_TYPES.room_call_start,
        MESSAGE_TYPES.room_call_join,
        MESSAGE_TYPES.room_call_leave,
        MESSAGE_TYPES.room_call_end,
        MESSAGE_TYPES.delete_room,
        MESSAGE_TYPES.create_room,
        MESSAGE_TYPES.deleted_msg,
        MESSAGE_TYPES.delete_msg,
    ].includes(messageType);
}

export function callMessageBubbleText(type: string = ''): string {
    const localization: any = components().callMessage;

    if (type === MESSAGE_TYPES.missed_call) {
        return localization.missedCall;
    }

    if (type === MESSAGE_TYPES.incoming_call) {
        return localization.incomingCall;
    }

    if (type === MESSAGE_TYPES.outgoing_call) {
        return localization.outgoingCall;
    }

    return '';
}
