"use strict";

import {APPLICATION, COLORS, LOG_TYPES} from "configs/constants";
import {
    appReducer,
    appSaga,
    binSaga,
    callSaga,
    conferenceSaga,
    contactsSaga,
    conversationsSaga,
    groupsSaga,
    handlersSaga,
    messagesSaga,
    networksSaga,
    requestsSaga,
    settingsSaga,
    userSaga
} from "services/index";
import {History} from "history";
import storeCreator, {getBrowserHistory} from "./StoreHelper";
import {Store} from "react-redux";
import axios from "axios";
import {selectContent, writeLog} from "helpers/DataHelper";
import {contactSelector} from "modules/contacts/ContactsSelector";
import {isURI} from "helpers/DomHelper";
import {userIdSelector, userSelector} from "modules/user/UserSelector";
import Log from "modules/messages/Log";
import {phoneMask} from "helpers/UIHelper";

let CancelToken = axios.CancelToken;
let axiosCancelSource = CancelToken.source();

const file_android: any = require("assets/images/file_android.svg");
const file_archive: any = require("assets/images/file_archive.svg");
const file_code: any = require("assets/images/file_code.svg");
const file_mac: any = require("assets/images/file_mac.svg");
const file_pdf: any = require("assets/images/file_pdf.svg");
const file_presentation: any = require("assets/images/file_presentation.svg");
const file_spreadsheet: any = require("assets/images/file_spreadsheet.svg");
const file_text: any = require("assets/images/file_text.svg");
const file_windows: any = require("assets/images/file_windows.svg");
const file_unknown: any = require("assets/images/file_unknown.svg");
const file_image: any = require("assets/images/file_image.svg");


export interface IAppConfigurations {
    store: Store<any>;
    history: History;
}

export function getAppConfigurations(): IAppConfigurations {
    let store: Store<any>;
    storeCreator.setParams(appReducer, appSaga, messagesSaga, settingsSaga, contactsSaga, conversationsSaga, requestsSaga, handlersSaga, groupsSaga, userSaga, callSaga, networksSaga, binSaga, conferenceSaga);

    const history = getBrowserHistory();

    store = storeCreator.getStore();
    return {store, history};
}

export function checkNumber(phoneCode, value): string {
    let checkValue:string = value
    if (phoneCode !== "0" && value.substring(0, 1) === "0") {
        checkValue = value.replace("0", phoneCode);
    } else if (value.substring(0, 1) === "+") {
        checkValue = value.substring(1, value.length);
    } else {
        if (value.substring(0, phoneCode.length) !== phoneCode && value.substring(0, phoneCode.length) !== "871" && value.substring(0, 2) !== "10") {
            checkValue = `${phoneCode}${value}`
        } else {
            checkValue = value
        }
    }
    return checkValue;
}

export function setContextMenu(): void {
    const {Menu, MenuItem} = (window as any).remote;
    const {clipboard} = (window as any).remote;

    const menu = new Menu();
    //in Windows accelerator doesn't work that is why execCommand is used
    menu.append(new MenuItem({
        label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:", click: () => {
            document.execCommand('cut');
        }
    }));
    menu.append(new MenuItem({
        label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:", click: () => {
            document.execCommand('copy');
        }
    }));
    menu.append(new MenuItem({
        label: 'Paste', accelerator: "CmdOrCtrl+V", selector: "paste:", click: () => {
            document.execCommand('paste');
        }
    }));

    document.addEventListener("contextmenu", (event: any) => {
        event.preventDefault();
        const {textContent} = event.target;
        const _textContent = textContent && textContent.trim();

        if (_textContent && _textContent.length > 0 && isURI(_textContent)) {
            selectContent(event.target);
        }

        const userSelection = window.getSelection().toString();
        const tagName = event.target.contentEditable === "true" ? "EDITABLE" : event.target.tagName;

        switch (tagName) {
            case 'INPUT':
            case 'TEXTAREA':
            case 'EDITABLE':
                if (!userSelection.trim().length) {
                    menu.items[0].enabled = false;
                    menu.items[1].enabled = false;
                    menu.items[2].enabled = !!clipboard.readText().length || !!clipboard.readHTML().length;
                } else {
                    menu.items[0].enabled = true;
                    menu.items[1].enabled = true;
                    menu.items[2].enabled = true;
                }
                if (tagName === 'EDITABLE') {
                    menu.popup((window as any).remote.getCurrentWindow());
                    break;
                }
                menu.popup((window as any).remote.getCurrentWindow());
                break;
            default:
                return;
        }
    });
}

export function setLabelList(labelType, index, localization, handleLabelChange) {
    const {Menu, MenuItem} = (window as any).remote;

    const menu = new Menu();

    if (labelType === "phone") {
        menu.append(new MenuItem({
            label: localization.mobile, click: () => {
                handleLabelChange("phone", localization.mobile, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.home, click: () => {
                handleLabelChange("phone", localization.home, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.work, click: () => {
                handleLabelChange("phone", localization.work, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.main, click: () => {
                handleLabelChange("phone", localization.main, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.other, click: () => {
                handleLabelChange("phone", localization.other, index)
            }
        }));

    } else if (labelType === "email") {
        menu.append(new MenuItem({
            label: localization.home, click: () => {
                handleLabelChange("email", localization.home, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.work, click: () => {
                handleLabelChange("email", localization.work, index)
            }
        }));
        menu.append(new MenuItem({
            label: localization.other, click: () => {
                handleLabelChange("email", localization.other, index)
            }
        }));
    }

    menu.popup((window as any).remote.getCurrentWindow());
}


export const isProduction = () => process && process.env && process.env.NODE_ENV === "production";


export function getColor(): any {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function cancelPostRequests(): any {
    axiosCancelSource.cancel();

}

export function renewCancelToken(): any {
    CancelToken = axios.CancelToken;
    axiosCancelSource = CancelToken.source();
}

export function logger(log, type?) {
    if (type) {
        writeLog(LOG_TYPES.connection, {
            msg: log,
            type
        });
        const event = new Date()
        Log.i(`${LOG_TYPES.strophe} ${event.toLocaleTimeString('en-US')}`, {
            msg: log,
            type
        })
    }
    Log.i(log);
}

export function getOsVersion() {
    try {
        return (window as any)._os.release();
    } catch (e) {
        return "WEB";
    }
}

export function getAppVersion() {
    try {
        return require('@electron/remote').app.getVersion();
    } catch (e) {
        return APPLICATION.VERSION;
    }
}

export function getPlatform() {
    return {
        platformId: APPLICATION.PLATFORM,
        name: navigator.platform,
    }
}

export function getEnv() {
    return process.env.NODE_ENV || "development";
}

export function getLanguage() {
    return navigator.language.replace(new RegExp("-", "g"), "_")
}

export function resizeApplication(isLoginWindow: boolean) {
    (window as any).ipcRenderer.send('resizeLoginWindow', isLoginWindow);
}

export function getContactName(contactId: string) {
    const store = storeCreator.getStore();

    const thread = contactSelector(contactId)(store.getState());

    const userId = userIdSelector()(store.getState());

    let contact: any;

    if (userId === contactId) {
        contact = userSelector()(store.getState())
    } else {
        contact = thread && thread.getIn(["members", contactId]);
    }

    let name: string = "";

    if (contact) {
        if (contact.get('email')) {
            if (contact.get('name')) {
                name = contact.get('name').trim()
            } else if (contact.get("fullName")) {
                name = contact.get('fullName');
            } else {
                name = contact.get('email');
            }
        } else {
            if (contact.get('name')) {
                name = contact.get('name').trim()
            } else {
                name = phoneMask(contact.get('username'))
            }
        }
    }

    return name
}

export function getFileIcon(fileType: string) {
    switch (fileType) {
        case "apk":
            return file_android;
        case "zip":
        case "rar":
        case "ar":
        case "cpio":
        case "shar":
        case "tar":
        case "lbr":
        case "wad":
        case "gzip":
        case "bz2":
        case "z":
        case "7z":
        case "xz":
        case "lz":
        case "zst":
        case "ace":
        case "arc":
        case "ark":
        case "arj":
        case "b1":
        case "cab":
        case "cfs":
        case "dgc":
        case "egg":
        case "lzh":
        case "lha":
        case "mpq":
        case "sit":
        case "sqx":
        case "xar":
        case "pkg":
        case "xip":
        case "zoo":
        case "jar":
        case "war":
        case "ear":
            return file_archive;
        case "html":
        case "htm":
        case "js":
        case "css":
        case "scss":
        case "json":
        case "xml":
            return file_code;
        case "dmg":
            return file_mac;
        case "exe":
            return file_windows;
        case "pdf":
            return file_pdf;
        case "key":
        case "odp":
        case "pps":
        case "ppt":
        case "pptx":
        case "ppsx":
        case "gslides":
            return file_presentation;
        case "ods":
        case "xlr":
        case "xls":
        case "xlsx":
        case "csv":
        case "gsheet":
        case "numbers":
            return file_spreadsheet;
        case "doc":
        case "docx":
        case "odt":
        case "tex":
        case "txt":
        case "wks":
        case "wps":
        case "wpd":
        case "gdoc":
        case "rtf":
            return file_text;
        case "svg":
        case "eps":
        case "tif":
        case "tiff":
        case "psd":
        case "3fr":
        case "ari":
        case "arw":
        case "srf":
        case "sr2":
        case "bay":
        case "braw":
        case "cri":
        case "crw":
        case "cr2":
        case "cr3":
        case "cap":
        case "iiq":
        case "eip":
        case "dcs":
        case "dcr":
        case "drf":
        case "k25":
        case "kdc":
        case "erf":
        case "fff":
        case "gpr":
        case "mef":
        case "mdc":
        case "mos":
        case "mrw":
        case "nef":
        case "nrw":
        case "pef":
        case "ptx":
        case "pxn":
        case "R3D":
        case "raf":
        case "raw":
        case "rw2":
        case "rwl":
        case "dng":
        case "rwz":
        case "srw":
        case "x3f":
            return file_image;
        default:
            return file_unknown;
    }
}

export function createBadge(number) {
    const style = {
        fontColor: 'white',
        font: '24px arial',
        color: 'red',
        fit: true,
        decimals: 0,
        radius: 8
    };
    const radius = style.radius;
    const img: any = document.createElement('canvas');
    img.width = Math.ceil(radius * 2);
    img.height = Math.ceil(radius * 2);
    img.ctx = img.getContext('2d');
    img.radius = radius;
    img.number = number;
    img.displayStyle = style;

    style.color = style.color ? style.color : 'red';
    style.font = style.font ? style.font : '18px arial';
    style.fontColor = style.fontColor ? style.fontColor : 'white';
    style.fit = style.fit === undefined ? true : style.fit;
    style.decimals = style.decimals === undefined || isNaN(style.decimals) ? 0 : style.decimals;

    img.draw = function () {
        let fontScale, fontWidth, fontSize, number;
        this.width = Math.ceil(this.radius * 2);
        this.height = Math.ceil(this.radius * 2);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.displayStyle.color;
        this.ctx.beginPath();
        this.ctx.arc(radius, radius, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.font = this.displayStyle.font;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = this.displayStyle.fontColor;
        number = this.number.toFixed(this.displayStyle.decimals);
        number = number > 99 ? "99+" : number;
        fontSize = Number(/[0-9\.]+/.exec(this.ctx.font)[0]);

        if (!this.displayStyle.fit || isNaN(fontSize)) {
            this.ctx.fillText(number, radius, radius);
        } else {
            fontWidth = this.ctx.measureText(number).width;
            fontScale = Math.cos(Math.atan(fontSize / fontWidth)) * this.radius * 2 / fontWidth;
            this.ctx.setTransform(fontScale, 0, 0, fontScale, this.radius, this.radius);
            this.ctx.fillText(number, 0, 0);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (!this.displayStyle.fit || isNaN(fontSize)) {
            this.ctx.fillText(number, radius, radius);
        } else {
            fontScale = Math.cos(Math.atan(fontSize / fontWidth)) * this.radius * 2 / fontWidth;
            this.ctx.setTransform(fontScale, 0, 0, fontScale, this.radius, this.radius);
            this.ctx.fillText(number, 0, 0);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        return this;
    };

    img.draw();
    return img.toDataURL();
}

export async function setBadge(count: number) {
    if ((window as any).ipcRenderer) {
        if ((window as any).isMac) {
            (window as any).ipcRenderer.send('setBadge', count);
        } else {
            (window as any).ipcRenderer.send('setBadge', count ? createBadge(count) : null);
        }
    }
}

export function addAuthorizationHeader(username: string, accessToken: string) {
    [axios.defaults.headers.common['x-access-number'], axios.defaults.headers.common['x-access-token']] = [username, accessToken];
}


