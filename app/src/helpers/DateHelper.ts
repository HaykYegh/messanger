"use strict";

import format from "date-fns/format";
import addDays from "date-fns/add_days";
import isAfter from "date-fns/is_after";
import isEqual from "date-fns/is_equal";
import isToday from "date-fns/is_today";
import isYesterday from "date-fns/is_yesterday";

const enLocale = require('date-fns/locale/en');
const ruLocale = require('date-fns/locale/ru');
const esLocale = require('date-fns/locale/es');

import {TIME_DIFFERENCE_DEFAULT_FORMAT} from "configs/constants";
import storeCreator from "helpers/StoreHelper";
import components from "configs/localization";
import selector from "services/selector";
import {isBefore} from "date-fns";
import Log from "modules/messages/Log";

interface IGetFormattedDateArgs {
    left?: boolean;
    time?: boolean;
    date: string;
    systemTimeFormat?: any;
}

export function getFormattedDate({date, left, time}: IGetFormattedDateArgs): string {
    const store: any = storeCreator.getStore();
    let languages: any;
    if (store) {
        const state: any = store.getState();
        if (state) {
            languages = selector(state).languages;
        }
    }

    const showDate = new Date(date);
    const today = new Date();
    const localization: any = components().common;

    if (time) {
        return ("0" + showDate.getHours()).slice(-2) + ":" + ("0" + showDate.getMinutes()).slice(-2);
    }

    if (showDate.toDateString() === today.toDateString()) {
        return left ? ("0" + showDate.getHours()).slice(-2) + ":" + ("0" + showDate.getMinutes()).slice(-2) : localization.today;
    }

    const yesterday = new Date(today.setDate(today.getDate() - 1));

    if (showDate.toDateString() === yesterday.toDateString()) {
        return localization.yesterday;
    }

    const sevenDaysAgo = today.setDate(today.getDate() - 7);

    if (showDate.getTime() > sevenDaysAgo) {
        const selectedLanguage: string = getLocale(languages);
        return format(date, "dddd", {locale: selectedLanguage});
    } else {
        return `${("0" + showDate.getDate()).slice(-2)}.${("0" + (showDate.getMonth() + 1)).slice(-2)}.${("0" + showDate.getFullYear()).slice(-2)}`;
    }
}

export function getLastVisitDate({date}: IGetFormattedDateArgs): string {
    const store: any = storeCreator.getStore();
    const localization: any = components().common;
    const showDate: any = new Date(date);
    const today: any = new Date();
    let languages: any;
    if (store) {
        const state: any = store.getState();
        if (state) {
            languages = selector(state).languages;
        }
    }

    const selectedLanguage: string = languages.get("selectedLanguage");

    let dateToProduce: string = "";

    if (isToday(showDate)) {
        dateToProduce = selectedLanguage === "en-US" ? `${localization.at} ${format(showDate, "h:mm A")}` : `${localization.at} ${format(showDate, "HH:mm")}`;
        return dateToProduce;
    }

    if (isYesterday(showDate)) {
        dateToProduce = selectedLanguage === "en-US" ? `${localization.yesterday} ${localization.at} ${format(showDate, "h:mm A")}` : `${localization.yesterday} ${localization.at} ${format(showDate, "HH:mm")}`;
        return dateToProduce;
    }

    if (isAfter(showDate, addDays(today, -31))) {
        dateToProduce = selectedLanguage === "en-US" ? `${localization.on} ${format(showDate, "M/D/YY")} ${localization.at} ${format(showDate, "h:mm A")}` : `${localization.on} ${format(showDate, "DD.MM.YYYY")} ${localization.at} ${format(showDate, "HH:mm")}`;
        return dateToProduce;
    }

    return selectedLanguage === "en-US" ? `${localization.on} ${format(showDate, "M/D/YY")}` : `${localization.on} ${format(showDate, "DD.MM.YYYY")}`;

}

export function getDateDifference(date1: string, date2: string): number {
    const moment1: Date = new Date(date1);
    const moment2: Date = new Date(date2);
    const timeDiffInUTC: number = Math.abs(moment1.getTime() - moment2.getTime());
    const diff: string = format(new Date(timeDiffInUTC), TIME_DIFFERENCE_DEFAULT_FORMAT);
    return parseInt(diff);
}

export function getCallTime(time: number, isH: boolean = true): string {
    if (Number.isNaN(time)) {
        return "00:00:00";
    }

    const h: number = Math.floor(time / 3600);
    const m: number = Math.floor(time % 3600 / 60);
    const s: number = Math.floor(time % 3600 % 60);

    if (!isH) {
        return ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
    }

    return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
}

export function getTime(duration: any): string {
    let minutes: any = Math.floor(duration / 60);
    let seconds: any = duration - (minutes * 60);

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + Math.floor(seconds);
        return minutes + ":" + seconds;
    }

    return minutes + ":" + Math.floor(seconds);
}

function getLocale(languages: any): string {
    if (languages && languages.get("selectedLanguage") === "ru") {
        return ruLocale;
    }
    if (languages && languages.get("selectedLanguage") === "es") {
        return  esLocale
    }
    return enLocale;
}

export function getMessageTime(messageTime: any): string {
    const time: any = new Date(messageTime);
    const hours = ("0" + time.getHours()).slice(-2);
    let minute = time.getMinutes();

    if (minute < 10) {
        minute = '0' + minute;
    }

    return time ? `${hours}:${minute}` : '';
}
