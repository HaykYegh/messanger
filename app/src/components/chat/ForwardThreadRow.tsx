"use strict";

import * as React from "react";
import Avatar from "components/contacts/Avatar";
import {getThread, getThreadType} from "helpers/DataHelper";

interface IForwardThreadRowProps {
    thread: any;
    username: string;
    checked: boolean;
    handleForwardReceiverToggle: () => void;
}


export default class ForwardThreadRow extends React.Component<IForwardThreadRowProps> {

    shouldComponentUpdate(nextProps: IForwardThreadRowProps) {
        const {checked} = this.props;

            return checked !== nextProps.checked;
    }

    render() {
        const {thread, handleForwardReceiverToggle, checked, username} = this.props;


        const {isGroup} = getThreadType(thread.getIn(["threads", "threadType"]));
        const {threadInfo}: any = getThread(thread, username, true);
        const id: any = thread.getIn(["threads", "threadId"]);
        const threadImage: any = {
            url: threadInfo.get("avatarUrl"),
            file: threadInfo.get("avatar"),
        };
        const singleConversationName: string = threadInfo && !isGroup && (threadInfo.get("firstName") || threadInfo.get("lastName") ? threadInfo.get("name") : threadInfo.get("email") ? threadInfo.get("email") : `${!threadInfo.get("name").startsWith("0") ? "+": ""}${threadInfo.get("name")}`);

        return (
            <div className="contact-row" onClick={handleForwardReceiverToggle} key={id}>
                <Avatar
                    image={threadImage}
                    color={threadInfo.getIn(["color", "numberColor"])}
                    status={threadInfo.get("status")}
                    avatarCharacter={threadInfo.get("avatarCharacter")}
                    name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                    meta={{threadId: id}}
                />
                <div className="contact-info">
                    <div className="forward-name">
                        {isGroup && <span className="group-icon"/>}
                        <span className="contact-name">{isGroup  ? threadInfo.get("name") : singleConversationName}</span>
                    </div>
                </div>
                <span className={checked ? "delete-checked" : "delete-not-checked"}/>
            </div>
        );
    };
}
