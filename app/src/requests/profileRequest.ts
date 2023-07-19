import conf from "configs/configurations";
import axios from "services/request";
import {converter, types} from "helpers/DataHelper";
import {AxiosResponse} from "axios";

const CancelToken = axios.CancelToken;

let cancel;


export const profile = username => {
    return axios.get(
        `${conf.http + conf.api.v3.profile.get}?username=${username}`,
    )
};

export const profileList = numbers => {
    return axios.post(
        `${conf.http + conf.api.v3.profile.list}`,
        numbers,
    )
};


export const checkUsersByLists = (numberList: Array<string>, emailList: Array<string>) => {

    if (cancel) {
        cancel();
        cancel = null;
    }

    return axios.post(conf.http + conf.api.v3.profile.userCheck,
        converter({emailList: JSON.stringify(emailList), numberList: JSON.stringify(numberList)}, types.URL_ENCODE),
        {
            cancelToken: new CancelToken((c) => {
                cancel = c;
            }),
        });
};

export const userCheck = (numberList: Array<string>, emailList: Array<string>) => {
    const data: any = converter({
        emailList: JSON.stringify(emailList),
        numberList: JSON.stringify(numberList)
    }, types.URL_ENCODE);
    return axios.post(
        `${conf.http}${conf.api.v3.profile.userCheck}`,
        data,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
};

export const updateProfileRequest = (fName, lName, img = "", nickname = "") => {
    const data: any = converter({fName, lName, img}, types.URL_ENCODE);
    return axios.post(
        conf.http + conf.api.v3.profile.update,
        data,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
};

// refactored

export async function getUsersProfile(numbersOrEmails: string[], isEmails: boolean) {
    const body = new URLSearchParams();
    body.append(isEmails ? "emailList" : "numberList", JSON.stringify(numbersOrEmails));

    const response: AxiosResponse = await axios.post(`${conf.http + conf.api.v3.profile.userCheck}`, body);
    const data = response.data;

    if (data.status === "SUCCESS") {
        return data.body;
    } else {
        throw new Error("INVALID_RESPONSE")
    }
}

export async function setUsersPassword(password: string) {
    const body = new URLSearchParams();
    body.set("password", password);


    const response: AxiosResponse = await axios.post(`${conf.http + conf.api.v3.profile.setPassword}`, body);
    const data = response.data;

    if (data.status === "SUCCESS") {
        return true
    } else {
        throw new Error("INVALID_RESPONSE")
    }
}
