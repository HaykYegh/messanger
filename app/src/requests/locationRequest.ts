"use strict";

import conf from "configs/configurations";
import axios from "services/request";
import {GOOGLE_API_KEY, LOCATION_NAME_URL, LOCATION_URL} from "configs/constants";


export async function getLocationName(lat, lng): Promise<any> {
    const request = await axios.get(`${LOCATION_NAME_URL}?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
    const {data : {status, results}} = request;
    if (status === "OK") {
        return results[0].formatted_address
    }
    return "unknown address";
}

export async function getLocation(): Promise<any> {
    const request = await axios.post(`${LOCATION_URL}`);
    const {data : {location}} = request;
    return location;
}


export async function getUserLocation(): Promise<any> {
    const response: any = await axios.get(conf.http + conf.api.v3.location.byUserIP);
    const {data}: any = response;

    if (data.status === "SUCCESS") {
        if (data.body.countryCode) {
            return data.body.countryCode
        } else {
            throw new Error("COUNTRY_CODE_EMPTY")
        }
    } else {
        throw new Error("STATUS_FAILED")
    }
}
