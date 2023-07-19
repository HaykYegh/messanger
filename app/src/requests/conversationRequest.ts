import {
    DEFAULT_TIME_FORMAT,
    LOAD_STATUS,
    MESSAGE_TYPES,
    MESSAGES_CHAT_LIMIT,
    REQUEST_TYPES,
    SHOW_MORE_LIMIT
} from "configs/constants";
import conf from "configs/configurations";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import selector from "services/selector";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import {getPid, isCorrectFileRemotePath, objectToUrl} from "helpers/DataHelper";
import IDBMessage from "services/database/class/Message";
import { getLinkTags, escapeText} from "helpers/MessageHelper";
import format from "date-fns/format";
import axios from "services/request";
import {replyMessage} from "modules/messages/MessagesActions";
import Log from "modules/messages/Log";
import {getBlobUri} from "helpers/FileHelper";

export const getConversations = (syncTime?: string) => {
    const url: string = syncTime ? `${conf.http + conf.api.v3.conversation.list}?updateTs=${syncTime}` : conf.http + conf.api.v3.conversation.latest
    axios.get(
        `${url}`,
    );
};

export async function getConversationMessages(conversationId: any, limit: any, messageId?: any, lastMessage?: any, scrollDown: boolean = false): Promise<any> {

    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});
    const username: string = user.get('username');

    if (!conversationId) {
        return;
    }

    let messagesRequest: any = {data: {status : "", body : ""}};
    let url: string;

    const messages: any = {};

    let conversationRealId = "";

    if(!conversationId.includes(SINGLE_CONVERSATION_EXTENSION)){
        conversationRealId = conversationId;
    }

    let remainedLimit = limit;
    let dbMessages:any;

    Log.i("showMore -> dbMessages = 1", dbMessages)

    if (scrollDown) {

        dbMessages = await IDBMessage.getNewerMessages(conversationRealId, conversationId, messageId, remainedLimit, lastMessage);
        Log.i("showMore -> dbMessages = 2", dbMessages)
    } else {
        dbMessages = await IDBMessage.getOldMessages(conversationRealId, conversationId, messageId, remainedLimit, lastMessage);
        Log.i("showMore -> dbMessages = 3", dbMessages)
    }
    const repMessages = [];
    let lastMessageId = messageId;
    let prevId = -1;

    if(dbMessages && dbMessages.length > 0) {

        dbMessages
            .filter((item: any) => {
                if(item.messages.repid && item.repMessages && item.repMessages.messageId){
                    repMessages.push(item);
                }

                if(prevId == -1 && item.messages["previousMessageId"]){
                    prevId = item.messages["previousMessageId"];

                } else if(prevId == -2 ||
                    (item.messageStatus.loadStatus != LOAD_STATUS.LOAD_START &&
                        item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_FAILURE &&
                        item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_CANCEL &&
                        prevId != item.messages["messageId"] &&
                        item.messages["type"] != MESSAGE_TYPES.missed_call &&
                        item.messages["type"] != MESSAGE_TYPES.outgoing_call &&
                        item.messages["type"] != MESSAGE_TYPES.incoming_call &&
                        item.messages["deleted"] != true)){
                    prevId = -2;
                    return false;
                }

                if(item.messages["previousMessageId"]){
                    prevId = item.messages["previousMessageId"];
                }

                return true;
            })
            .map((item:any, index: any, array: any) => {
                if(item.messageStatus.loadStatus != LOAD_STATUS.LOAD_START &&
                    item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_FAILURE &&
                    item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_CANCEL &&
                    item.messages["type"] != MESSAGE_TYPES.missed_call &&
                    item.messages["type"] != MESSAGE_TYPES.outgoing_call &&
                    item.messages["type"] != MESSAGE_TYPES.incoming_call &&
                    item.messages["deleted"] != true &&
                    item.messages["hidden"] != true){
                    lastMessageId = item.messages["messageId"];
                }
                if(item.messages.repid && item.repMessages && item.repMessages.messageId && item.repMessages.time < array[array.length - 1].messages.time){
                    repMessages.push(item);
                }
                item.messages["loadStatus"] = item.messageStatus.loadStatus;

                messages[item.messages["messageId"]] = item.messages;
            });

        Log.i("showMore -> dbMessages = 4", dbMessages)

        repMessages.map(item => {
            const message: any = item.repMessages;
            const repliedPersonally: boolean = message.threadId !== conversationId;
            const {threads: {threadInfo}} = item;
            const groupName: string = threadInfo && threadInfo.name;

            dbMessages.push({messages:{
                    ...message, hidden: false ,
                    repliedPersonally: repliedPersonally,
                    repliedFrom: repliedPersonally ? groupName: ""
                },
                messageStatus: {}
            });
        });

        Log.i("showMore -> dbMessages = 5", dbMessages)

        remainedLimit = limit - Object.keys(messages).length;

        if(dbMessages.length > 0 && prevId != -2 && dbMessages[dbMessages.length - 1]["previousMessageId"] == -1){
            remainedLimit = 0;
            Log.i("showMore -> dbMessages = 6", dbMessages)
        } else if(lastMessageId == messageId && remainedLimit <= 0) {
            remainedLimit = limit;
            Log.i("showMore -> dbMessages = 7", dbMessages)
        }
    }

    if (remainedLimit > 1 && navigator.onLine && conversationId.includes(SINGLE_CONVERSATION_EXTENSION)) {
        // const params: any = {
        //     to: conversationId.split("@").shift(),
        //     limit: remainedLimit,
        // };
        //
        // if (lastMessageId && remainedLimit < MESSAGES_CHAT_LIMIT) {
        //     params.msgId = lastMessageId;
        // }
        //
        // url = `${conf.http + conf.api.v3.conversation.getOldMessages}${objectToUrl(params)}`;
        //
        // messagesRequest = await refreshRequestIfLoggedOut({
        //     url,
        //     type: REQUEST_TYPES.get,
        // });

    } else if(remainedLimit > 1 && navigator.onLine){
        const params: any = {
            conversation_id: conversationId,
            limit: remainedLimit,
        };
        if (lastMessageId && remainedLimit < MESSAGES_CHAT_LIMIT) {
           params.msg_id = lastMessageId;
        }
        url = `${conf.http + conf.api.v3.conversation.messages}${objectToUrl(params)}`;
        messagesRequest = await axios.get(
            `${url}`
        );
    }

    let {data: {status, body}} = messagesRequest;

    if(body && body.length > 0) {
        body = body.filter(message => message.sid !== "1")
    }

    let orderedBody = [];
    let checkStatusMessages = [];

    body && body.map((item) => {
        checkStatusMessages[checkStatusMessages.length] = item.msgId;
    });

    const messagesStatuses:any = checkStatusMessages.length > 0 ? await IDBMessage.getMesssagesStatus(checkStatusMessages) : [];
    Log.i(messagesStatuses, "messagesStatuses1234")

    if(body) {
        orderedBody = body.sort((message1, message2) => {
            if (message1.time >= message2.time) {
                return -1;

            } else if (message1.time < message2.time) {
                return 1;
            }
        });
    }

    if (remainedLimit > 1 && navigator.onLine && body && status === 'SUCCESS') {
        const oldMessages = [];
        for (const [index, message] of orderedBody.entries()) {
            let target: string;
            let fileRemotePath: string = "";
            let messageType: string = "";

            if (message.from === username) {
                target = `${message.to}@${SINGLE_CONVERSATION_EXTENSION}`;
            } else {
                target = `${message.from }@${SINGLE_CONVERSATION_EXTENSION}`;
            }

            if (message.msgType === MESSAGE_TYPES.image && message.fileRemotePath && !message.fileRemotePath.includes("msgId")) {
                messageType = "GIF";
            }

            let previousMessageId = 0;

            if(orderedBody.length > 0 && orderedBody.length - 1 == index && orderedBody.length != remainedLimit ){
                //ToDo Open in future
                //previousMessageId = -1;

            } else {
                previousMessageId = orderedBody[index + 1] ? orderedBody[index + 1].msgId : 0;
            }


            if (message.fileRemotePath &&  isCorrectFileRemotePath(message.fileRemotePath)) {
                fileRemotePath = message.fileRemotePath;

            } else if([MESSAGE_TYPES.file, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.voice].includes(message.msgType)) {
                fileRemotePath = `${message.from}/${message.msgId}`;
            }

            const statusIndex = messagesStatuses.findIndex(x => x.messageId === message.msgId);
            let link: boolean;

            if ([MESSAGE_TYPES.text, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(message.msgType)) {
                link = message.msg && undefined;
            }

            let lastMessage:any = null;
            let m_options:any = null;

            if(dbMessages && dbMessages.length > 0){
                const lastMessageIndex = dbMessages.findIndex(x => x.messages.messageId == message.msgId);

                if(lastMessageIndex > -1) {
                    lastMessage = dbMessages[lastMessageIndex].messages;
                    m_options = dbMessages[lastMessageIndex].messages.m_options;
                    if (dbMessages[lastMessageIndex].messages.type === MESSAGE_TYPES.gif) {
                        messageType = "GIF";
                    }
                }
            }

            messages[message.msgId] = {
                creator: message.from.includes(SINGLE_CONVERSATION_EXTENSION) ? message.from : `${message.from}@${SINGLE_CONVERSATION_EXTENSION}`,
                loadStatus: statusIndex >= 0 ? messagesStatuses[statusIndex].loadStatus : 0,
                createdAt: format(message.time, DEFAULT_TIME_FORMAT),
                delivered: lastMessage ? lastMessage.delivered : true,
                seen: lastMessage ? lastMessage.seen : false,
                conversationId: message.conversationId,
                previousMessageId: previousMessageId,
                fileSize: message.fileSize || 0,
                own: message.from === username,
                info: message.msgInfo || '',
                repid: message.repId || "",
                messageId: message.msgId,
                deleted: message.deleted,
                text: message.msg && escapeText(message.msg) || '',
                m_options: m_options,
                edited: message.edited,
                type: messageType || message.msgType,
                time: message.time,
                isDelivered: false,
                sid: message.sid,
                pid: message.pid,
                threadId: target,
                fileRemotePath,
                fileLink: "",
                isSeen: false,
                status: true,
                linkTags: getLinkTags(message.msg),
                link: link,
            };

            oldMessages.push({message: messages[message.msgId], isLast: index === orderedBody.length -1})
            //await IDBMessage.addOldMessage(messages[message.msgId], index == orderedBody.length -1);
        }
        if(oldMessages && oldMessages.length > 0){
            await IDBMessage.addOldMessages(oldMessages);
        }

    }
    orderedBody.length > 1 && IDBMessage.update(lastMessageId, {previousMessageId: (orderedBody[0].msgId == lastMessageId && orderedBody[1].msgId) ? orderedBody[1].msgId : orderedBody[0].msgId != lastMessageId ? orderedBody[0].msgId :0});
    const checkBody = orderedBody.length > 0 ? orderedBody[orderedBody.length - 1].time : 0;
    dbMessages.length > 0 && (dbMessages.filter(item => item["messages"]["time"] > checkBody).map(item =>
    {
        if(!messages[item["messages"]["messageId"]]){
            // if (item.messages.localPath) {

                // if (!item.messages.gifUrl) {
                    item.messages.gifUrl = getBlobUri(item.messages.localPath)
                // }
                // if (!item.messages.blobUri) {
                    item.messages.blobUri = getBlobUri(item.messages.localPath)
                // }
            // }
            messages[item["messages"]["messageId"]] = item.messages;
            messages[item["messages"]["messageId"]].loadStatus = item.messageStatus.loadStatus;

        }
    }));

    Log.i("END: " + new Date() + (new Date()).getMilliseconds());

    /*
    if(navigator.onLine && remainedLimit > 1 && orderedBody.length === 0){
        return {messages, stopLoader:true};
    }
    Need to be used if used messages from server
    */

    if(scrollDown) {
        if(dbMessages.length){
            return {messages, stopLoader: false};
        }
        return {messages, stopLoader: true};

    } else {
        if(dbMessages.length < limit) {
            return {messages, stopLoader: true};
        }
        return {messages, stopLoader: false};
    }
}
