"use strict";

import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import conf from "configs/configurations";
import {v1 as uuid} from "uuid";
import {APPLICATION, DEVICE_TOKEN_PREFIX} from "configs/constants";
import {getDeviceToken} from "helpers/DataHelper";


export default username => {
    let deviceToken: string = getDeviceToken();
    username = `${conf.app.prefix}${username}@${SINGLE_CONVERSATION_EXTENSION}/${deviceToken}`;

    return username;
};
