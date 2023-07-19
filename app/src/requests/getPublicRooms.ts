"use strict";

import axios from "services/request";
import conf from "configs/configurations";

export default (roomIds, roomType) => axios.post(
    `${conf.http}${conf.api.v3.publicRooms.getRooms}?roomType=${roomType}`,
    roomIds,
    {headers:{"Content-Type": "application/json"}}
);
