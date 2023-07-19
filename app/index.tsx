"use strict";

import * as React from "react";
import {render} from "react-dom";
import {AppContainer} from "react-hot-loader";

import {getAppConfigurations, IAppConfigurations} from "helpers/AppHelper";
import {initialize as DBInitialize} from "services/database"
import Root from "./src/Root";
import Log from "modules/messages/Log";

if (process.env.NODE_ENV !== 'production') {
    const Immutable = require("immutable");
    const installDevTools = require("immutable-devtools");
    installDevTools(Immutable);
}


(async function () {

    const db = await DBInitialize();
    const {store, history}: IAppConfigurations = getAppConfigurations();

    render((
        <AppContainer>
            <Root store={store} history={history}/>
        </AppContainer>
    ), document.getElementById("root"));

    if ((module as any).hot) {
        (module as any).hot.accept('./src/Root', () => {
            const NextRoot = require('./src/Root').default;
            render(
                <AppContainer>
                    <NextRoot store={store} history={history}/>
                </AppContainer>,
                document.getElementById('root')
            );
        });
    }
})();
