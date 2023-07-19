"use strict";

import conf from "configs/configurations";
import axios from "services/request";

export default (updateTs, conversationId) => axios.get(`${conf.http}${conf.api.v3.conversation.getNewMessages}?updateTs=${updateTs}&conversation_id=${conversationId}`);
