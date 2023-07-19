"use strict";

import * as React from "react";

import components from "configs/localization";
import "scss/pages/SplashScreen";
import {APPLICATION} from "configs/constants";

interface ISplashScreenProps {
    user: any;
}

export default function SplashScreen({user}: ISplashScreenProps): JSX.Element {
    let username: string = "";
    if (user && !user.isEmpty()) {
        const nameType = APPLICATION.WITHEMAIL ? "email" : "username"
        username = (user.get("firstName") || user.get("lastName")) ? user.get("fullName") : `${user.get(nameType)}`;
    }
    const localization: any = components().splashScreen;

    return (
        <div className="splash-screen">
            <div className="splash-screen-content">
                <img className="app-logo" draggable={false} src={require("assets/images/zangi_contact.svg")} alt=""/>
                <h2 className="app-name">{`${localization.welcome} ${username}`}</h2>
                {/*<h2 className="app-info">{localization.info}</h2>*/}
            </div>
        </div>
    );
};
