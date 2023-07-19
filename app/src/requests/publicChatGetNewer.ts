"use strict";
import conf from "configs/configurations";
import axios from "services/request";

export default (roomId: string, updateTs: string, msgId?: string) => {
    const url: string = msgId ?
        `${conf.http}${conf.api.v3.group.publicMessagesNewer}?channelId=${roomId}&updateTs=${updateTs}&messageId=${msgId}`:
        `${conf.http}${conf.api.v3.group.publicMessagesNewer}?channelId=${roomId}&updateTs=${updateTs}`;
    axios.get(
        `${url}`,
    )};
