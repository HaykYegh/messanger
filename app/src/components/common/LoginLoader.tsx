"use strict";

import * as React from "react";

const appLogo: any = require("assets/images/login-logo.svg");

import "scss/pages/SignInLoader";

interface ILoginLoaderProps {

}

export default function LoginLoader(props: ILoginLoaderProps): JSX.Element {
    return (
        <div className="authentication-page">
            <div className="logo">
                <img className="app-logo" draggable={false} src={appLogo} alt=""/>
            </div>
            <div className="authentication-loader-content">
                <div className="content-block">
                    <div className="loader">
                        <div className={"logging-in-loader"}/>
                    </div>
                </div>
            </div>
        </div>
    );
}



