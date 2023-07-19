"use strict";

import conf from "configs/configurations";
import axios from "services/request";

export default phone => axios.get(
    `${conf.http + conf.api.v3.settings.rates}?number=${phone}`,
);
