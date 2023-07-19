import conf from "configs/configurations";
import axios from "services/request";

export const getBalance = () => {
    return axios.get(conf.http + conf.api.v3.balance.get);
};

export const deleteUser = () => {
    return axios.get(conf.http + conf.api.v3.profile.userDelete);
};

export const checkUser = userName => {
    return axios.get(conf.http + conf.api.v3.profile.list + `?username=${userName}`);
};

export const getStickers = () => {
    return axios.get(conf.http + conf.api.v3.settings.stickers);
};

export const getWalletURL = () => {
    return axios.get(conf.http + conf.api.v3.settings.walletUrl);
};

export const getAppReleaseInfo = (appVersion: string, language: string) => {
    return axios.get(conf.http + conf.api.v3.settings.appReleaseInfo, {
        params: {appVersion, language}
    });
};
