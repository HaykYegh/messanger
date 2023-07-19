"use strict";

import * as React from "react";
import {render} from "react-dom";
import {Provider} from "react-redux";

import {getAppConfigurations, IAppConfigurations} from "helpers/AppHelper";
import {initialize as DBInitialize} from "services/database"
import Layout from "./pages/Layout";

(async function () {

    // await DBInitialize();
    const {store}: IAppConfigurations = getAppConfigurations();

    render((
        <Provider store={store}>
            <Layout/>
        </Provider>
    ), document.getElementById("root"));
})();
