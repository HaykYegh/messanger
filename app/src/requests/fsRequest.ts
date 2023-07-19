"use strict";

import conf from "configs/configurations";
import axios from "services/request";


export async function generateSignedUrl(bucket: string, method: 'PUT' | 'DELETE' | 'GET', key: string): Promise<any> {
    const request: any = await axios.get(conf.http + conf.api.v3.fs.signedUrl, {
        params: {
            bucket,
            method,
            path: key
        }
    });
    const {data: {body, status}} = request;
    if (status === "SUCCESS") {
        return body;
    }
    return null;
}


export async function getSignedUrl(bucket: any, method: any, path: any): Promise<any> {
    const request: any = await axios.get(conf.http + conf.api.v3.fs.signedUrl, {
        params: {
            bucket,
            method,
            path
        }
    });
    const {data: {body, status}} = await request;
    if (status === "SUCCESS") {
        return body;
    }
    return "";
}

export async function getAWSFile(bucket: any, method: any, path: any): Promise<any> {
    const request: any = await axios.get(conf.http + conf.api.v3.fs.signedUrl, {
        params: {
            bucket,
            method,
            path
        }
    });
    const {data: {body, status}} = request;

    if (status === "SUCCESS") {
        const fetchFile: any = await fetch(body);
        return fetchFile.blob();
    }
    return null;
}

export async function fetchFile(url: any): Promise<any> {
    const request: any = await fetch(url);
    return request.blob();
}
