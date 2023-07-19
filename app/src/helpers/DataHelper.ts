"use strict";

import {is} from "immutable";
import {v1 as uuid} from "uuid";
import isEqual from "lodash/isEqual";
import isObject from "lodash/isObject";
import transform from "lodash/transform";
import phoneParse from "libphonenumber-js/es6/parse";
import isValidNumber from "libphonenumber-js/es6/validate";
import {createSelectorCreator, defaultMemoize} from "reselect";
import {
    CHANGE_ROLE_ALL_COMMAND,
    CHANGE_ROLE_COMMAND,
    CREATE_GROUP_XML_COMMAND,
    DELETE_ROOM_COMMAND,
    GROUP_CONVERSATION_EXTENSION,
    MEMBER_ADD_MEMBER_COMMAND,
    MEMBER_EDIT_AVATAR_COMMAND,
    MEMBER_EDIT_NAME_COMMAND,
    OWNER_LEAVE_COMMAND,
    SINGLE_CONVERSATION_EXTENSION
} from "xmpp/XMLConstants";
import {
    APPLICATION,
    CONVERSATION_TYPE,
    DEVICE_TOKEN_PREFIX,
    GROUP_ROLES,
    INCORRECT_FILE_REMOTE_PATHS,
    LOGS_ACTION_TYPES,
    LOGS_LEVEL_TYPE,
    MESSAGE_TYPES,
    RIGHT_PANELS,
    WAVE_MAX_COUNT, WITHOUTVALIDATION
} from "configs/constants";
import {defaultState as userDefaultObject} from "modules/user/UserReducer";
import {getColor, isProduction} from "helpers/AppHelper";
import {profileList} from "requests/profileRequest";
import conf from "configs/configurations";
import {getCredentials, ICredentials} from "services/request";
import Log from "modules/messages/Log";
import localizationComponent from "configs/localization";

const metadata = require('libphonenumber-js/metadata.min.json');

export function converter(data: any, type: string | Array<string>, options?: any): any {
    if (Array.isArray(type)) {
        let ret: any = data;

        type.forEach((singleType) => {
            if (Object.keys(types).includes(singleType)) {
                ret = converter(ret, singleType, options);
            }
        });

        return ret;
    } else {
        switch (type) {
            case types.JSON_ENCODE:
                return jsonEncoded(data);
            case types.JSON_DECODE:
                return jsonDecoded(data);
            // case types.ENCRYPT:
            //     return options.secret ? encrypted(data, options.secret) : undefined;
            // case types.DECRYPT:
            //     return options.secret ? decrypted(data, options.secret) : undefined;
            case types.URL_ENCODE:
                return urlEncoded(data);
            default:
                return data;
        }
    }
}

export const createSelector: any = createSelectorCreator(defaultMemoize, is);

export const types: any = {
    JSON_ENCODE: "JSON_ENCODE",
    JSON_DECODE: "JSON_DECODE",
    ENCRYPT: "ENCRYPT",
    DECRYPT: "DECRYPT",
    URL_ENCODE: "URL_ENCODE"
};

function jsonEncoded(data: any): string {
    try {
        return JSON.stringify(data);
    } catch (error) {
        return undefined;
    }

}

function jsonDecoded(data: string): any {
    try {
        return JSON.parse(data);
    } catch (error) {
        return undefined;
    }

}


export const validateNumber = (phone: string, userPhoneNumber: string, isEmail: boolean = false) => {
    // if (isEmail) {
        return {
            phoneNumber: phone.substr(0, 1) === "+" ? phone.substr(1) : phone,
            phoneCode: "",
            fullNumber: phone.substr(0, 1) === "+" ? phone.substr(1) : phone,
        };
    // }

    if (APPLICATION.WITHOUTVALIDATION) {
        return {
            phoneNumber: phone,
            phoneCode: "",
            fullNumber: phone,
        };
    }

    const parsedNumber: any = phoneParse.call(this, `${phone}`, {extended: true}, metadata);
    Log.i("handleAddContact -> parsedNumber = ", phone)
    if (isValidNumber.call(this, parsedNumber, metadata)) {
        return {
            phoneNumber: parsedNumber.phone,
            phoneCode: parsedNumber.countryCallingCode,
            fullNumber: phone.substr(1)
        };
    } else {
        const userCountryPhone = phoneParse.call(this, `+${userPhoneNumber}`, {extended: true}, metadata);

        if (userCountryPhone && userCountryPhone.countryCallingCode && phone.substr(0, userCountryPhone.countryCallingCode.length) === userCountryPhone.countryCallingCode) {
            phone = `+${phone}`
        }

        if (isValidNumber.call(this, phone, userCountryPhone.country, metadata)) {
            const parsedNumber = phoneParse.call(this, phone, {
                defaultCountry: userCountryPhone.country,
                extended: true
            }, metadata);

            if (parsedNumber.possible) {
                return {
                    phoneNumber: parsedNumber.phone,
                    phoneCode: userCountryPhone.countryCallingCode,
                    fullNumber: `${userCountryPhone.countryCallingCode}${parsedNumber.phone}`
                };
            }
        }

    }
};

export const isNetworkAction = (type: string): boolean =>
    [MESSAGE_TYPES.network_join,
        MESSAGE_TYPES.network_leave,
        MESSAGE_TYPES.network_kick,
        MESSAGE_TYPES.network_update,
        MESSAGE_TYPES.network_delete,]
        .includes(type);

function urlEncoded(data: any): string {

    const str: Array<string> = [];
    Object.keys(data).map(key => {
        if (data[key] !== null) {
            str.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }

    });
    return str.join("&");

}

export const getThreadType = type => {
   return type === CONVERSATION_TYPE.GROUP ?
        {isGroup: true, isProductContact: false} :
        {isGroup: false, isProductContact: true};
};

export const getConversationType = id =>
    id.includes("gid") ?
        CONVERSATION_TYPE.GROUP :
        CONVERSATION_TYPE.SINGLE;

export const isPublicRoom = id => id.includes("gid");


export const bulkFetchProfile = async (phoneNumbers: Array<any>) => {
    const numbers: string = phoneNumbers.join(";");
    const {data: {body}}: any = await profileList(numbers);
    const profiles = body;
    const contacts: any = {};
    Object.keys(profiles).map((phoneNumber, index) => {

        const profile: any = profiles[phoneNumber];

        const contact = {
            blocked: false,
            username: phoneNumber,
            firstName: "",
            lastName: "",
            isProductContact: true,
            saved: false,
            createdAt: Date.now(),
            phone: phoneNumber,
            color: getColor(),
            status: "offline",
            favorite: false,
            author: phoneNumber,
            contactId: `${phoneNumber}@${SINGLE_CONVERSATION_EXTENSION}`,
            avatarUrl: "",
            imageUrl: "",
            muted: false,
            name: phoneNumber,
            avatarCharacter: '',
        };
        if (profile) {
            if (profile.firstName !== '') {
                contact.firstName = profile.firstName;
                contact.lastName = profile.lastName || '';
                contact.name = `${contact.firstName} ${contact.lastName}`;
            } else {
                contact.name = `${phoneNumber}`;
            }
            contact.avatarUrl = profile.avatarUrl || '';
            contact.imageUrl = profile.imgUrl || '';
            contact.avatarCharacter = getInitials(contact.firstName, contact.lastName);
        }
        const key: string = `${phoneNumber}@${SINGLE_CONVERSATION_EXTENSION}`;

        contacts[key] = contact;
    });
    return contacts;
};


export const objectToUrl = (params) => {
    let str = "?";
    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            if (str != "") {
                str += "&";
            }
            str += key + "=" + encodeURIComponent(params[key]);
        }
    }
    return str;
};

export const getPid = (id) => {

    if (id && id.includes(`@${SINGLE_CONVERSATION_EXTENSION}`) && id.includes("pid")) {
        return id.split("/").pop()
    }

    return "";
};

export const isThreadIdPrivateChat = (id) => id && id.includes(`@${SINGLE_CONVERSATION_EXTENSION}`) && id.includes("pid");

export const isVideoStreamOrImage = (type: string): boolean => [MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.gif].includes(type);

export const isVideoOrImage = (type: string): boolean => [MESSAGE_TYPES.image, MESSAGE_TYPES.video].includes(type);

export const isVideo = (type: string): boolean => [MESSAGE_TYPES.video].includes(type);

export const isGroupOrCallAction = (type: string): boolean =>
    [MESSAGE_TYPES.update_group_avatar,
        MESSAGE_TYPES.update_group_name,
        MESSAGE_TYPES.remove_from_group,
        MESSAGE_TYPES.outgoing_call,
        MESSAGE_TYPES.incoming_call,
        MESSAGE_TYPES.missed_call,
        MESSAGE_TYPES.leave_group,
        MESSAGE_TYPES.join_group,
        MESSAGE_TYPES.room_call_end,
        MESSAGE_TYPES.delete_room,
        MESSAGE_TYPES.create_room]
        .includes(type);

export const isMediaOrLocation = (type: string): boolean =>
    [MESSAGE_TYPES.voice, MESSAGE_TYPES.image, MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file, MESSAGE_TYPES.file, MESSAGE_TYPES.location, MESSAGE_TYPES.gif]
        .includes(type);

export const getMediaOrLocationText = (type: string): string => `${type.substr(0, 1)}${type.toLowerCase().substr(1)} message`;

export const getUserId = (username: any): string => (username && username.includes(SINGLE_CONVERSATION_EXTENSION)) ?
    username :
    `${(username && username.includes("|")) ? username.split("|")[0] : username}@${SINGLE_CONVERSATION_EXTENSION}`;

export const getPartialId = (roomId: string): string => roomId.includes(GROUP_CONVERSATION_EXTENSION) ?
    roomId.split("@").shift() :
    roomId;


// if you want to get full name of user use getUsername from contactsHelper
export const getUsername = (str: string): any => {
    let username: string;

    if (str && !(str.includes("pid") && str.includes(`@${SINGLE_CONVERSATION_EXTENSION}`))) {
        let strArr: string[] = str.includes("/") ?
            str.split("/") :
            str.split(conf.app.prefix);

        const _strArr: string[] = [...strArr];
        const __strArr: string[] = [..._strArr];

        if (_strArr.shift().includes(conf.app.prefix) && !__strArr.shift().includes("pid")) {
            username = strArr.shift()

        } else {
            username = strArr.pop();
        }
    } else {
        username = str && str.split("/").shift();
    }

    username = username && username
        .replace(conf.app.prefix, "")
        .replace("+", "")
        .replace(`@${SINGLE_CONVERSATION_EXTENSION}`, "");

    return (username && username.match(/\d+/g)) ? username.match(/\d+/g)[0] : username;

};

export const getNotificationText = (message: any, getMessageText: Function): string => {
    let text: string = "";

    if (isMediaOrLocation(message.type)) {
        text = getMediaOrLocationText(message.type);

    } else if (message.type === MESSAGE_TYPES.sticker) {
        text = "Sticker"

    } else if (isGroupOrCallAction(message.type)) {
        text = getMessageText();

    } else {
        text = message.text
    }

    return text;
};

export const isLeaveJoinRemove = (type: string): boolean => [MESSAGE_TYPES.join_group, MESSAGE_TYPES.leave_group, MESSAGE_TYPES.remove_from_group].includes(type);

export const isEdited = (type: string): boolean => MESSAGE_TYPES.edit_mgs === type;

export const isDeleted = (type: string): boolean => [MESSAGE_TYPES.delete_msg, MESSAGE_TYPES.deleted_msg].includes(type);

export function createUserObject(user) {
    user.id = `${user.username}@${SINGLE_CONVERSATION_EXTENSION}`;
    user.avatarCharacter = getInitials(user.firstName, user.lastName);
    user.color = getColor();
    user.phone = user.username;

    const userDefaultState = userDefaultObject;

    return userDefaultState.withMutations((item) => {
        Object.keys(user).map(key => {
            item.set(key, user[key])
        })
    });
}

export const isSubPanelOpened = (panel: string) => [RIGHT_PANELS.create_group, RIGHT_PANELS.add_members].includes(panel);

export function setSynced(type) {

    const credentials: ICredentials = getCredentials();
    const username: string = credentials["X-Access-Number"];


    if (username !== "") {
        const key = `synced_${APPLICATION.VERSION}`;
        const synced = localStorage.getItem(key);
        const obj = {};

        obj[type] = true;

        if (!synced) {
            localStorage.setItem(key, JSON.stringify(obj))

        } else {
            localStorage.setItem(key, JSON.stringify({...JSON.parse(synced), ...obj}));
        }
    }
}

export function setFailed(effect) {

    const credentials: ICredentials = getCredentials();
    const username: string = credentials["X-Access-Number"];


    if (username !== "") {
        const key = `synced_${APPLICATION.VERSION}`;
        const synced: any = localStorage.getItem(key);
        const obj = {};
        let failedSync = synced ? JSON.parse(synced).failed ? JSON.parse(synced).failed : [] : [];

        obj["failed"] = [...failedSync, effect];

        if (!synced) {
            localStorage.setItem(key, JSON.stringify(obj))

        } else {
            localStorage.setItem(key, JSON.stringify({...JSON.parse(synced), ...obj}));
        }
    }
}

export function resetFailed() {
    const key = `synced_${APPLICATION.VERSION}`;
    const synced: any = localStorage.getItem(key);
    const obj = {};

    obj["failed"] = [];

    if (synced) {
        localStorage.setItem(key, JSON.stringify({...JSON.parse(synced), ...obj}));
    }
}

export function checkForSyncFinish() {
    const syncedKey = `synced_${APPLICATION.VERSION}`;
    const synced = localStorage.getItem(syncedKey);

    if (synced) {
        const _synced = JSON.parse(synced);

        if (Object.keys(_synced).length === 5) {
            return Object.values(_synced).every(val => val === true)
        }
    }
}

export function isSyncFinished(type: string) {
    const syncedKey = `synced_${APPLICATION.VERSION}`;
    const synced = localStorage.getItem(syncedKey);

    if (synced) {
        const _synced = JSON.parse(synced);
        return _synced[type];
    }
}

export function getThread(thread: any, username: string, checkForOwnChannel: boolean = false): any {
    let threadInfo: any;
    let isPrivateChatOwnChannel: boolean = false;
    const threadType = thread && thread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);

    if (isGroup) {
        threadInfo = thread && thread.getIn(["threads", "threadInfo"]);
    } else {
        threadInfo = thread && thread.get("members") ? thread.get("members").first() : null;
    }

    return checkForOwnChannel ? {threadInfo, isPrivateChatOwnChannel} : threadInfo;
}

export function pluralForm(n, forms): any {
    return forms[(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2)];
}

export const difference = (object, base) => {
    const changes = (object, base) => {
        return transform(object, (result, value, key) => {
            if (!isEqual(value, base[key])) {
                result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value;
            }
        });
    };
    return changes(object, base);
};


export const getDeviceToken = (): string => {
    let token: string = localStorage.getItem(APPLICATION.DEVICE_TOKEN);
    if (!token || token === "") {
        token = `${DEVICE_TOKEN_PREFIX}${uuid()}`;
        localStorage.setItem(APPLICATION.DEVICE_TOKEN, token)
    } else if (!token.includes(DEVICE_TOKEN_PREFIX)) {
        token = `${DEVICE_TOKEN_PREFIX}${token}`;
        localStorage.setItem(APPLICATION.DEVICE_TOKEN, token);
    }

    if (token.includes(DEVICE_TOKEN_PREFIX + "web_")) {
        token = token.replace(DEVICE_TOKEN_PREFIX + "web_", DEVICE_TOKEN_PREFIX)
        localStorage.setItem(APPLICATION.DEVICE_TOKEN, token);
    }

    return token;

};

export const getGroupRole = (username: string, lists: {
    memberList: Array<string>,
    adminList: Array<string>,
    ownerList: Array<string>
}, allAdmins: string): number => {
    if(allAdmins === "1" && !lists.ownerList.includes(username)) {
        return GROUP_ROLES.admin
    }

    if(lists.memberList.includes(username)) {
        return GROUP_ROLES.member
    }

    if(lists.adminList.includes(username)) {
        return GROUP_ROLES.admin
    }

    if(lists.ownerList.includes(username)) {
        return GROUP_ROLES.owner
    }

    let username2 = username.split("|")[0]

    if(allAdmins === "1" && !lists.ownerList.includes(username2)) {
        return GROUP_ROLES.admin
    }

    if(lists.memberList.includes(username2)) {
        return GROUP_ROLES.member
    }

    if(lists.adminList.includes(username2)) {
        return GROUP_ROLES.admin
    }

    if(lists.ownerList.includes(username2)) {
        return GROUP_ROLES.owner
    }

    return null

    // return +allAdmins && !lists.ownerList.includes(username) ? GROUP_ROLES.admin :
    //   lists.memberList.includes(username) ? GROUP_ROLES.member :
    //     lists.adminList.includes(username) ? GROUP_ROLES.admin :
    //       lists.ownerList.includes(username) ? GROUP_ROLES.owner :
    //         null;
}


export const groupActionCommands = () => [
    CHANGE_ROLE_COMMAND,
    CHANGE_ROLE_ALL_COMMAND,
    MEMBER_EDIT_NAME_COMMAND,
    MEMBER_EDIT_AVATAR_COMMAND,
    MEMBER_ADD_MEMBER_COMMAND,
    OWNER_LEAVE_COMMAND,
    DELETE_ROOM_COMMAND,
    CREATE_GROUP_XML_COMMAND
];

export const isDeleteOrCreateRoom = (command) => [DELETE_ROOM_COMMAND, CREATE_GROUP_XML_COMMAND].includes(command);

export const getRoomId = (partialId: string, username: string): string =>
    partialId.includes(GROUP_CONVERSATION_EXTENSION) ?
        partialId :
        partialId.includes("gid") ?
            `${partialId}@${GROUP_CONVERSATION_EXTENSION}/${username}` : "";

export const isCorrectFileRemotePath = (fileRemotePath) => !INCORRECT_FILE_REMOTE_PATHS.includes(fileRemotePath) && !fileRemotePath.includes("storage");

export const getInitials = (firstName: string, lastName?: string): string => {
    let initials: string = "";

    // regExp for special characters & digits & Emojis
    const regExp = /[!@#$%^&*(),.?":{}|<>]|\d|(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;

    // special characters, digits or Emoji should not be set as first character
    if (firstName && firstName.trim().length > 0 && !regExp.test(firstName.charAt(0))) {
        initials = firstName.charAt(0);
    }

    if (lastName && lastName.trim().length > 0 && !regExp.test(lastName.charAt(0))) {
        initials += lastName.charAt(0);
    }

    return initials;
};


export const getName = (contactInfo): string => {
    let name: string = "";

    if (contactInfo) {
        if (contactInfo.get('email') && !contactInfo.get('firstName') && !contactInfo.get('lastName')) {
            name = APPLICATION.WITHEMAIL ? contactInfo.get('email') : contactInfo.get('username')
        } else if (contactInfo.get('firstName') || contactInfo.get('lastName')) {
            name = contactInfo.get('name').trim()
        } else {
            name = `+${contactInfo.get('phone')}`
        }
    }
    return name;
};

export const getAppData = () => {
    return {
        language: navigator.language.replace(new RegExp("-", "g"), "_"),
        platformVersion: (window as any)._os.release(),
        dev: isProduction() ? "0" : "1",
        appVersion: APPLICATION.VERSION,
        deviceName: navigator.platform,
        deviceToken: getDeviceToken(),
        platform: APPLICATION.PLATFORM,
    };
};


export const includesInNumbers = (phone: string, numbers: any, keyword: string) => {
    if (numbers && (numbers.size > 1 || numbers.length > 1)) {
        return numbers.join().includes(keyword);
    }
    return phone && phone.toString().includes(keyword);
};

export const getUserNumberWithEmail = (username, email) => email ? `${username}|${email}` : username;

export const getEmailFromUsername = (username) => (username && username.includes("|")) ? username.split("|")[1] : "";

export const getUsernameIfEmail = (str) => (str && str.includes("|")) ? str.split("|")[0] : str;

export const writeLog = (message: string = "", meta: any = {}, level: string = LOGS_LEVEL_TYPE.info) => {
    // process.env.IS_LOGS_ENABLED && (window as any).ipcRenderer.send("onLogs", {
    (window as any).ipcRenderer.send("onLogs", {
        level,
        meta,
        message,
        action: LOGS_ACTION_TYPES.log
    });
};

export const isThumbnail = (data) => typeof data === "string" ? data.includes(getThumbFileDir()) : /^data:image\/[^;]+;base64,/i.test(data);

export const getThumbFileDir = () => (window as any).remote.getGlobal("thumbFileDir");

export const base64MimeType = (encoded) => {
    let result = null;

    if (typeof encoded !== 'string') {
        return result;
    }

    const mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

    if (mime && mime.length) {
        result = mime[1] && mime[1].split("/").pop();
    }

    return result;
};

export const writeThumbnail = (base64, msgId) => {
    const path = (window as any).remote.require("path");
    const {fs} = (window as any);
    const buf = Buffer.from(base64, 'base64');
    const thumbPath = path.join(getThumbFileDir(), `${msgId}.jpeg`);
    fs.writeFile(thumbPath, buf, err => err && console.warn(err));
    return thumbPath;
};


export const getBase64FromThumb = (path: string) => {
    const {fs} = (window as any);
    try {
        return Buffer.from(fs.readFileSync(path)).toString("base64")

    } catch (e) {
        return "";
    }
};

export const setUserMessagesLimit = (username: string) => {
    const key = `${username}_${APPLICATION.VERSION}`;
    if(!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(0));
    }
};

export const getWaves = (arr) => {
    const arrayTotal: Array<number> = [];
    const arraySimple: Array<number> = arr;
    let stepWithReminder: number = arraySimple.length / WAVE_MAX_COUNT;
    let stepCount: number = 0;
    let constStep = stepWithReminder;


    for (let i = 0; i < arraySimple.length; i++) {
        if (stepWithReminder < 1) {
            stepCount += arraySimple[i] * stepWithReminder;
            arrayTotal.push(stepCount / constStep);
            stepCount = 0;

            let localRemainder = 1 - stepWithReminder;

            while (localRemainder > constStep) {
                stepCount += arraySimple[i] * constStep;
                arrayTotal.push(stepCount / constStep);
                stepCount = 0;
                localRemainder -= constStep;
            }

            stepCount += arraySimple[i] * localRemainder;
            stepWithReminder = constStep;
            stepWithReminder -= localRemainder;

        } else {
            stepCount += arraySimple[i];
            stepWithReminder -= 1;
        }
    }

    while (arrayTotal.length < WAVE_MAX_COUNT) {
        arrayTotal.push(0.01);
    }

    return arrayTotal;
};

export const showMessageBox = (
    showDetail: boolean,
    type: string,
    buttons: string[],
    message: string,
    detail: string,
    checkboxChecked: boolean,
    checkboxLabel: string,
    defaultId: number,
    cancelId: number,
    callback
) => {
    const {dialog, getCurrentWindow} = (window as any).remote;

    dialog.showMessageBox(getCurrentWindow(), {
        type,
        buttons,
        icon: (window as any).remote.getGlobal("_iconPath"),
        message,
        detail: showDetail ? detail : undefined,
        checkboxChecked: showDetail ? undefined : checkboxChecked,
        checkboxLabel: showDetail ? undefined : checkboxLabel,
        defaultId,
        cancelId
    }, callback);
};


export const getErrorMessage = (error: string): string => {
    switch (error) {
        case "User does not exist.":
        case "Password is short.":
            return "Invalid Password";
        case "Network Error":
            return "";
        case "INVALID":
            return "Please check, invalid number";
        default:
            return error;
    }
};


export const selectContent = (node) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
};
