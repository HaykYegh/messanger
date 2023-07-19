"use strict";

import {APPLICATION} from "configs/constants";

export const COOKIE_CONST: any = {
    AUTHORIZATION: `${APPLICATION.VERSION}_zmsu`
};

export function setCookie(name: string, value: string, timeOff: number): void {
    let expires: string = "";
    if (timeOff) {
        const date: Date = new Date();
        date.setTime(date.getTime() + (timeOff * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getCookie(name: string): any {
    const nameEQ: string = name + "=";
    const ca: any = document.cookie.split(';');
    for (let i: number = 0; i < ca.length; i++) {
        let c: any = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

export function eraseCookie(name: string) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


export function setAuthorizationToken(name: string, value: string): void {
    localStorage.setItem(name, value);
}

export function removeAuthorizationToken(name: string): void {
    localStorage.removeItem(name);
}

export function getAuthorizationToken(name: string): string {
    return localStorage.getItem(name);
}

// export function getUserCredentials() {
//     const encodedUser = getAuthorizationToken(COOKIE_CONST.AUTHORIZATION);
//     const userCredentials = encodedUser && JSON.parse(atob(encodedUser));
//     return userCredentials;
// }
