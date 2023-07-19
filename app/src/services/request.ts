"use strict";

import axios from "axios";
import {COOKIE_CONST} from "helpers/CookieHelper";
import configurations from "configs/configurations";
import {DIFF_TIME} from "configs/constants";

export interface ICredentials {
    "X-Access-Prefix",
    "X-Access-Number",
    "X-Access-Token"
}

const credentials: ICredentials = {
    "X-Access-Prefix": "",
    "X-Access-Number": "",
    "X-Access-Token": "",
};


export const updateCredentials = (prefix, number, token) => {
    localStorage.setItem("x-access-prefix", prefix);
    localStorage.setItem("x-access-number", number);
    localStorage.setItem("x-access-token", token);

    credentials["X-Access-Prefix"] = prefix;
    credentials["X-Access-Number"] = number;
    credentials["X-Access-Token"] = token;
};

export const deleteCredentials = () => {
    localStorage.removeItem("x-access-prefix");
    localStorage.removeItem("x-access-number");
    localStorage.removeItem("x-access-token");
    localStorage.removeItem(DIFF_TIME);

    credentials["X-Access-Prefix"] = "";
    credentials["X-Access-Number"] = "";
    credentials["X-Access-Token"] = "";
};

export const getCredentials = (): ICredentials => {
    const prefix: string = localStorage.getItem("x-access-prefix") || "";
    const number: string = localStorage.getItem("x-access-number") || "";
    const token: string = localStorage.getItem("x-access-token") || "";

    credentials["X-Access-Prefix"] = prefix;
    credentials["X-Access-Number"] = number;
    credentials["X-Access-Token"] = token;

    return credentials;
};


const workground: any = () => {
    const encodedUser = localStorage.getItem(COOKIE_CONST.AUTHORIZATION);
    const userCredentials = encodedUser && JSON.parse(atob(encodedUser));

    if (userCredentials) {
        const {username, accessToken} = userCredentials;
        updateCredentials(configurations.app.prefix, username, accessToken);
        localStorage.removeItem(COOKIE_CONST.AUTHORIZATION);
        return getCredentials();
    }
    return null;
};

export const isLoggedIn: any = (sess: boolean = false) => {
    const credentials = getCredentials();
    if (credentials["X-Access-Prefix"] !== "" && credentials["X-Access-Number"] !== "" && credentials["X-Access-Token"] !== "") {
        return sess ? credentials : true
    } else {
        const oldAuthMechanism = workground();

        if (oldAuthMechanism) {
            return sess ? oldAuthMechanism : true
        }

        return false
    }
};

axios.interceptors.request.use(config => {
    if (credentials["X-Access-Number"] !== "" && credentials["X-Access-Token"] !== "" && credentials["X-Access-Prefix"] !== "") {
        config.headers['x-access-prefix'] = credentials["X-Access-Prefix"];
        config.headers['x-access-number'] = credentials["X-Access-Number"];
        config.headers['x-access-token'] = credentials["X-Access-Token"];
    } else {
        getCredentials();
        config.headers['x-access-prefix'] = credentials["X-Access-Prefix"];
        config.headers['x-access-number'] = credentials["X-Access-Number"];
        config.headers['x-access-token'] = credentials["X-Access-Token"];
    }

    config.withCredentials = true;
    return config;
}, (err) => {
    return Promise.reject(err);
});

export default axios;
