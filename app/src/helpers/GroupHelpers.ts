"use strict";

import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import IDBMessage from "services/database/class/Message";
import {GROUP_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {LOAD_STATUS, MESSAGE_TYPES} from "configs/constants";
import Log from "modules/messages/Log";
import {getBlobUri} from "helpers/FileHelper";

export async function getGroupMessages(groupId: string, limit: number, lastMessageId: string, lastMessage?: any, scrollDown: boolean = false) {

    try {
        const store: Store<any> = storeCreator.getStore();
        const {user} = selector(store.getState(), {user: true});

        const messages: any = {};
        const repMessages = [];

        const groupRealId  = `${groupId}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`;

        let dbMessages: any;

        if (scrollDown) {
            dbMessages = await IDBMessage.getNewerMessages(groupRealId, groupId, lastMessageId, limit, lastMessage);

        } else {
            dbMessages = await IDBMessage.getOldMessages(groupRealId, groupId, lastMessageId, limit, lastMessage);
        }

        let updatedLastMessageId = lastMessageId;
        let prevId = -1;
        if(dbMessages && dbMessages.length > 0) {
            dbMessages
                .filter((item:any) => {
                    if(item.messages.repid && item.repMessages && item.repMessages.messageId){
                        repMessages.push(item.repMessages);
                    }
                    if(prevId == -1 && item.messages["previousMessageId"]){
                        prevId = item.messages["previousMessageId"];
                    }else if(prevId == -2 ||
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
                }).map((item:any, index: any, array: any) => {
                if(item.messageStatus.loadStatus != LOAD_STATUS.LOAD_START &&
                    item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_FAILURE &&
                    item.messageStatus.loadStatus != LOAD_STATUS.UPLOAD_CANCEL &&
                    item.messages["type"] != MESSAGE_TYPES.missed_call &&
                    item.messages["type"] != MESSAGE_TYPES.outgoing_call &&
                    item.messages["type"] != MESSAGE_TYPES.incoming_call &&
                    item.messages["deleted"] != true &&
                    item.messages["hidden"] != true){
                    updatedLastMessageId = item.messages["messageId"];
                }
                if(item.messages.repid && item.repMessages && item.repMessages.messageId && item.repMessages.time < array[array.length - 1].messages.time){
                    repMessages.push(item.repMessages);
                }
                item.messages["loadStatus"] = item.messageStatus.loadStatus;
                messages[item.messages["messageId"]] = item.messages;
            });

            repMessages.map(item => {
                dbMessages.push({messages:{...item, hidden: true}, messageStatus: {}});
            });
        }

        dbMessages.length > 0 && dbMessages.map(item =>
        {
            !messages[item["messages"]["messageId"]] && (messages[item["messages"]["messageId"]] = item["messages"]);



            // if (item.messages.localPath) {
            //     if (!item.messages.gifUrl) {
                    item.messages.gifUrl = getBlobUri(item.messages.localPath)
                // }
                // if (!item.messages.blobUri) {
                    item.messages.blobUri = getBlobUri(item.messages.localPath)
                // }
            // }

            if(!messages[item["messages"]["messageId"]]){

                messages[item["messages"]["messageId"]] = item["messages"];
                messages[item["messages"]["messageId"]].loadStatus = item["messageStatus"].loadStatus;
            }
        });

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
    } catch (err) {
        Log.i(err);
    }
}
