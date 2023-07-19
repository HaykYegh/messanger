import {writeLog} from "helpers/DataHelper";
import IDBConversation from "services/database/class/Conversation";
import Log from "modules/messages/Log";
import {CONVERSATION_TYPE} from "configs/constants";

export async function getAllConversations(searchKeyword: string = "") {
    let conversations: Array<any> = [];

    try {
        const dbConversations: any = await IDBConversation.getConversations();
        dbConversations.sort((conversation1, conversation2) => {
            (item) => item.getIn(['conversations', 'time'])
            const value1: string = conversation1.getIn(["conversations", "time"]);
            const value2: string = conversation2.getIn(["conversations", "time"]);

            if (value1 < value2) {
                return 1;

            } else if (value1 > value2) {
                return -1;

            } else {
                return 0;
            }
        })
        .filter((item, key) => {

            const disabled: boolean = item.getIn(["threads", "threadInfo"]) && item.getIn(["threads", "threadInfo", "disabled"])

            return disabled === false
        })
        for (const conversation of dbConversations.valueSeq()) {
            if (conversation.getIn(["threads", "threadType"]) !== CONVERSATION_TYPE.GROUP) {

                if (conversation.getIn(["members", conversation.getIn(["threads", "threadId"])])) {
                    conversations = [...conversations, conversation.getIn(["members", conversation.getIn(["threads", "threadId"])]).toJS()]
                } else {
                    conversations = [...conversations, conversation.get("members").toJS()]
                }
            } else {
                if (conversation.getIn(["threads", "threadInfo", "disabled"])) {
                    continue;
                }
                conversations = [...conversations, conversation.getIn(["threads", "threadInfo"]).toJS()]
            }
        }

        if (searchKeyword !== "") {
            conversations = conversations.filter(chat =>
                chat.name && chat.name.includes(searchKeyword) ||
                (chat.username && chat.username.includes(searchKeyword)) ||
                (chat.email && chat.email.includes(searchKeyword)) ||
                (chat.phone && chat.phone.includes(searchKeyword)))
        }
        return conversations
    } catch (e) {
        Log.i(e);
        writeLog(e, "getAllConversations Error");
        return conversations
    }
}
