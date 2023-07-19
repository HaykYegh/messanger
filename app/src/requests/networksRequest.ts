import axios from "services/request";
import conf from "configs/configurations";
import {AxiosPromise} from "axios";

export function getNetwork (nicknameOrToken: string): AxiosPromise {
    return axios.get(conf.httpV4 + conf.api.v4.networks + `/${nicknameOrToken}`);
}

export function joinNetwork (nicknameOrToken: string): AxiosPromise {
    return axios.post(conf.httpV4 + conf.api.v4.networks, {token: nicknameOrToken});
}

export function leaveNetwork (networkId: number): AxiosPromise {
    return axios.delete(conf.httpV4 + conf.api.v4.networks + `/${networkId}`);
}
