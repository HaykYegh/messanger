"use strict";

import conf from "configs/configurations";
import {AxiosPromise, AxiosResponse} from "axios";
import axios from "services/request";
import {Blowfish} from "../custom-libs/Blowfish";
import {converter, getAppData, types} from "helpers/DataHelper";
import {EMAIL_VALIDAITON_REGEX} from "configs/constants";
import Log from "modules/messages/Log";

export const sendVerificationCode: any = (args: any) => {
    const params = {
        password: args.password,
        verifycode: args.pin,
        username: args.username
    };
    return axios.get(conf.http + conf.api.v3.authentication.setVerify, {
        params: params,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        }
    });
};


export const getQRCode: any = (args: any) => {
    if (!args) {
        return axios.post(conf.http + conf.api.v3.authentication.qr)
            .then(data => {
                const resp: any = data.data;
                return {QRValue: resp.qr}
            });
    } else {
        const appData = getAppData();
        // _os.release() on Mac OS returns Darwin Kernal version
        const headers: any = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const body = new URLSearchParams();
        body.append('language', appData.language);
        body.append('platformVersion', appData.platformVersion);
        body.append('dev', appData.dev);
        body.append('appVersion', appData.appVersion);
        body.append('deviceName', appData.deviceName);
        body.append('deviceToken', appData.deviceToken);
        body.append('platform', appData.platform);
        body.append('QRCODE', args);

        return axios.post(conf.http + conf.api.v3.authentication.qr, body, headers)
            .then(data => {
                const resp: any = data.data;
                const bf: any = new Blowfish("Z@NgIwEbL0G1N");
                const encrypted: string = bf.base64Decode(resp.fe);
                const decrypted: string = bf.decrypt(encrypted);
                const splitedData: Array<string> = decrypted.split(" ");
                const username: string = splitedData[0].split("=")[1];
                const accessToken: string = splitedData[1].split("=")[1].replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
                const responseEmail: string = splitedData[2].split("=")[1].replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
                const emailReg = new RegExp(EMAIL_VALIDAITON_REGEX, "i");
                let email: string = "";

                if (emailReg.test(responseEmail)) {
                    email = responseEmail;
                }

                Log.i("splitedData -> ", splitedData)

                return {username, accessToken, email}
            })
            .catch(error => {
                throw new Error(error.message);
            })
    }
};

export const loginRequest = (username: string, password: string): AxiosPromise => {
    const data: any = converter({username: conf.app.prefix + username, password}, types.URL_ENCODE);
    return axios.post(
        conf.http + conf.api.v3.authentication.login,
        data,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
};

export const getEmailLoginDetails = (email: string, regionCode: string, pinCode?: string, password?: string): any => {
    const appData = getAppData();

    let url: string;
    const headers: any = {'Content-Type': 'application/x-www-form-urlencoded'};
    const body = new URLSearchParams();
    body.append('language', appData.language);
    body.append('platform_version', appData.platformVersion);
    body.append('dev', appData.dev);
    body.append('app_version', appData.appVersion);
    body.append('device_name', appData.deviceName);
    body.append('device_token', appData.deviceToken);
    body.append('platform', appData.platform);
    body.append('regionCode', regionCode);
    body.append('email', email);
    if (pinCode && !password) {
        body.append('verifyCode', pinCode);
        url = conf.api.v3.emailRegistration.signInByEmail;
    } else {
        body.append('password', password);
        url = conf.api.v3.emailRegistration.signInByEmailPass
    }

    return axios.post(conf.http + url, body, headers)
        .then(data => {
            const {status, body} = data.data;
            if (status === "SUCCESS") {
                if (pinCode && !password) {
                    return {
                        username: body.username || body.number,
                        accessToken: body.deviceToken || body.accessToken,
                        isRegistered: true,
                        status: status,
                        networks: body.virtualNetworkList
                    }
                } else {
                    return {
                        username: body.number,
                        accessToken: body.accessToken,
                        isRegistered: true,
                        status: status,
                        networks: body.virtualNetworkList
                    }
                }
            } else {
                return {username: "", accessToken: "", isRegistered: false, status: status, virtualNetworkList: []}
            }
        })
        .catch(error => {
            throw new Error(error.message);
        })
};

export const mobilePinSignIn = (username: string, regionCode: string, pinCode: string, countryCode: string): any => {
    const appData = getAppData();
    const headers: any = {'Content-Type': 'application/x-www-form-urlencoded'};
    const body = new URLSearchParams();
    body.append('language', appData.language);
    body.append('platform_version', appData.platformVersion);
    body.append('dev', appData.dev);
    body.append('app_version', appData.appVersion);
    body.append('device_name', appData.deviceName);
    body.append('device_token', appData.deviceToken);
    body.append('platform', appData.platform);
    body.append('regionCode', regionCode);
    body.append('countryCode', countryCode);
    body.append('username', username);
    body.append('verifyCode', pinCode);

    return axios.post(conf.http + conf.api.v3.authentication.signInVN, body, headers)
        .then(data => {
            const {status, body} = data.data;
            if (status === "SUCCESS") {
                return {
                    username: body.number,
                    accessToken: body.accessToken,
                    isRegistered: true,
                    status: status,
                    networks: body.virtualNetworkList
                }
            } else {
                return {username: "", accessToken: "", isRegistered: false, status: status, virtualNetworkList: []}
            }
        })
        .catch(error => {
            throw new Error(error.message);
        })
};

export const signInByPassword = data => {
    const convertedData = converter(data, types.URL_ENCODE);
    return axios.post(
        `${conf.http}${conf.api.v3.authentication.signInByPassword}`,
        convertedData,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )
};


// refactored


export interface ISignInParams {
    number?: string,
    password?: string,
    deviceToken?: string,
    language?: string,
    platformVersion?: string,
    appVersion?: string,
    platformId?,
    deviceName?,
    regionCode?,
    isDevEnv?,
    pinCode?,
    phoneCode?: string,
    email?: string
}

export const singInUsingNumberAndPassword = async (params: ISignInParams) => {

    const body: URLSearchParams = new URLSearchParams();

    body.append("username", params.number);
    body.append("password", params.password);
    body.append("device_token", params.deviceToken);
    body.append("language", params.language);
    body.append("platform_version", params.platformVersion);
    body.append("app_version", params.appVersion);
    body.append("platform", params.platformId);
    body.append("device_name", params.deviceName);
    body.append('regionCode', params.regionCode);
    body.append('dev', params.isDevEnv);
    body.append('countryCode', params.phoneCode);
    body.append('verifyCode', params.pinCode);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.authentication.signInByPassword, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    const data = response.data;

    if (data.status === "SUCCESS") {
        return {
            headers: {
                "X-Access-Prefix": data.body.prefix,
                "X-Access-Number": data.body.number,
                "X-Access-Token": data.body.accessToken,
            },
            result: {
                networks: data.body.networkList,
                isNewUser: data.body.newUser
            }
        };
    } else {
        throw new Error(data.message)
    }
};


export const singInUsingNumberAndPinCode = async (params: ISignInParams) => {

    const body = new URLSearchParams();
    body.append("username", params.number);
    body.append("password", params.password);
    body.append("device_token", params.deviceToken);
    body.append("language", params.language);
    body.append("platform_version", params.platformVersion);
    body.append("app_version", params.appVersion);
    body.append("platform", params.platformId);
    body.append("device_name", params.deviceName);
    body.append('regionCode', params.regionCode);
    body.append('dev', params.isDevEnv);
    body.append('countryCode', params.phoneCode);
    body.append('verifyCode', params.pinCode);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.authentication.signInVN, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    const data = response.data;

    if (data.status === "SUCCESS") {
        return {
            headers: {
                "X-Access-Prefix": data.body.prefix,
                "X-Access-Number": data.body.number,
                "X-Access-Token": data.body.accessToken,
            },
            result: {
                networks: data.body.networkList,
                isNewUser: data.body.newUser
            }
        };
    } else {
        throw new Error(data.message)
    }
};


export const singInUsingEmailAndPassword = async (params: ISignInParams) => {

    const body = new URLSearchParams();
    body.append("email", params.email);
    body.append("password", params.password);
    body.append("device_token", params.deviceToken);
    body.append("language", params.language);
    body.append("platform_version", params.platformVersion);
    body.append("app_version", params.appVersion);
    body.append("platform", params.platformId);
    body.append("device_name", params.deviceName);
    body.append('regionCode', params.regionCode);
    body.append('dev', params.isDevEnv);
    body.append('countryCode', params.phoneCode);
    body.append('verifyCode', params.pinCode);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.emailRegistration.signInByEmailPass, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    const data = response.data;

    if (data.status === "SUCCESS") {
        return {
            headers: {
                "X-Access-Prefix": data.body.prefix,
                "X-Access-Number": data.body.number,
                "X-Access-Token": data.body.accessToken,
            },
            result: {
                networks: data.body.networkList,
                isNewUser: data.body.newUser
            }
        };
    } else {
        throw new Error(data.message)
    }
};


export const singInUsingEmailAndPinCode = async (params: ISignInParams) => {

    const body = new URLSearchParams();
    body.append("email", params.email);
    body.append('regionCode', params.regionCode);
    body.append("platform", params.platformId);
    body.append("device_token", params.deviceToken);
    body.append('dev', params.isDevEnv);
    body.append("password", params.password);
    body.append("language", params.language);
    body.append("platform_version", params.platformVersion);
    body.append("app_version", params.appVersion);
    body.append("device_name", params.deviceName);
    body.append('countryCode', params.phoneCode);
    body.append('verifyCode', params.pinCode);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.emailRegistration.signInByEmail, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    const data = response.data;

    if (data.status === "SUCCESS") {
        return {
            headers: {
                "X-Access-Prefix": data.body.prefix,
                "X-Access-Number": data.body.username,
                "X-Access-Token": data.body.deviceToken,
            },
            result: {
                networks: data.body.networkList,
                isNewUser: data.body.newUser
            }
        };
    } else {
        throw new Error(data.message)
    }
};


export async function passwordExist(number: string): Promise<any> {
    const response: any = await axios.get(`${conf.http}${conf.api.v3.authentication.passwordExist}?number=${number}`,);
    const {data} = response;
    if (data.status) {
        return data.body;
    } else {
        throw new Error(data.message)
    }
}

export async function mobileLoginValidate(username: string, regionCode: string, countryCode: string): Promise<any> {
    const response: any = await axios.get(
        `${conf.http}${conf.api.v3.authentication.validate}?username=${username}&regionCode=${regionCode}&countryCode=${countryCode}`,
    );
    const {data} = response;

    Log.i(data, "data_response")
    if (data.status === "SUCCESS" && data.body !== "INVALID") {
        return true
    } else {
        throw new Error(data.message || data.body);
    }
}

export async function checkPasswordExistEmail(email: string): Promise<any> {
    const response: any = await axios.get(
        `${conf.http}${conf.api.v3.emailRegistration.emailExist}?email=${email}`,
    );

    const {data} = response;
    if (data.status === "SUCCESS") {
        return data.body
    } else {
        throw new Error(data.message)
    }
}

export async function checkPasswordExistNumber(number: string): Promise<any> {
    const response: any = await axios.get(
        `${conf.http}${conf.api.v3.numberRegistration.numberExist}?number=${number}`,
    );

    const {data} = response;
    if (data.status === "SUCCESS") {
        return data.body
    } else {
        throw false
    }
}

export async function checkEmailValidate(email: string, regionCode: string): Promise<any> {
    const response: any = await axios.get(
        `${conf.http}${conf.api.v3.emailRegistration.emailValidate}?email=${email}&regionCode=${regionCode}`,
    );

    const {data} = response;
    if (data.status === "SUCCESS") {
        return true
    } else {
        throw new Error(data.message)
    }
}

export async function setPassword(isEmail: boolean, username: string, password: string): Promise<boolean> {

    const body: URLSearchParams = new URLSearchParams();
    body.append("password", password);
    body.append(isEmail ? "email" : "phone", username);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.profile.setPassword, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

    const {data} = response;
    if (data.status === "SUCCESS") {
        return true
    } else {
        throw new Error(data.message)
    }
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<boolean> {

    const body: URLSearchParams = new URLSearchParams();
    body.append("oldPassword", oldPassword);
    body.append("newPassword", newPassword);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.profile.updatePassword, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

    const {data} = response;
    if (data.status === "SUCCESS") {
        return data
    } else {
        throw new Error(data.message)
    }
}

export async function deletePassword(oldPassword: string): Promise<boolean> {

    const body: URLSearchParams = new URLSearchParams();
    body.append("oldPassword", oldPassword);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.profile.deletePassword, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

    const {data} = response;
    if (data.status === "SUCCESS") {
        return true
    } else {
        throw new Error(data.message)
    }
}

export const singInUsingEmailAndToken = async (params: ISignInParams) => {

    const body = new URLSearchParams();
    body.append("email", params.email);
    body.append('regionCode', params.regionCode);
    body.append("platformId", params.platformId);
    body.append("dev", params.isDevEnv);
    body.append("resource", params.deviceToken);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.authentication.signInByToken, body, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    const data = response.data;

    if (data.status === "SUCCESS") {
        return data.body || "";
    } else {
        throw new Error(data.message)
    }
};
