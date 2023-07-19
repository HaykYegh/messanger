"use strict";

import {checkNumber} from "helpers/AppHelper";
import {userSelector} from "modules/user/UserSelector";
import storeCreator from "helpers/StoreHelper";
import Log from "modules/messages/Log";

export function scrollToBottomOld(element: Element = document.body, to: number = element.scrollHeight, duration: number = 300): void {
    if (duration <= 0) {
        return;
    }
    if (!element.classList.contains("scroll-smooth")) {
        element.classList.add('scroll-smooth');
    }

    const difference: number = to - element.scrollTop;
    const perTick: number = difference / duration * 10;
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) {
        return;
    }

    scrollToBottomOld(element, to, duration - 10);
}

export function scrollToBottom(): any {
    const chatContainer: any = document.getElementById("chatBackground");
    if(chatContainer) {
        // if(!chatContainer.classList.contains("scroll-smooth")) {
        //     chatContainer.classList.add('scroll-smooth');
        // }
        chatContainer.scrollTop = (chatContainer as any).firstChild.scrollHeight;
        // chatContainer.classList.remove('scroll-smooth');
    }
}

export function phoneMask(value: string): any {
    const store = storeCreator.getStore();
    const user = userSelector()(store.getState())

    const checkValue = checkNumber(user.get("phoneCode"), getPhone(value))
    if( typeof +value.split("-").join("") !== "number") {
        return value
    }
    if (checkValue.substring(0, user.get("phoneCode").length) === user.get("phoneCode") && value !== "87-") {
        return value
    }
    const num = value.replace(/\D/g,'');

    const removed1 = num.length > 2 ? '-' : ''
    const removed2 = num.length > 6 ? '-' : ''
    const removed3 = num.length > 10 ? '-' : ''
    return (num.substring(0,2) + removed1 + num.substring(2,6) + removed2 + num.substring(6,10) + removed3 + num.substring(10,num.length))
}

export function getPhone(value: string): string {
    if(!value) {
        return value
    }
    Log.i("getPhone -> value = ", +value.split("-").join(""))

    let checkNan = +value.split("-").join("")

    if(checkNan !== checkNan) {
        return value
    }
    return value.split("-").join("")
}

