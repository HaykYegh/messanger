"use strict";

import {APP_CONFIG} from "configs/constants";

export interface IConfigurations {
    http: string;
    httpV4: string;
    socket: string;
    app: App;
    api: Api;
    signInSocket: string
}

export interface App {
    name: string;
    prefix: string;
    languages?: (LanguagesEntity)[] | null;
    aws: Aws;
    store: string;
    versionName: string;
}

export interface LanguagesEntity {
    label: string;
    name: string;
    value: string;
}

export interface Aws {
    key: string;
    bucket: Bucket;
}

export interface Bucket {
    fileTransfer: string;
    sticker: string;
    profile: string;
    group: string;
    amazon: string;
    desktopReleases: string;
}

export interface Api {
    v2: V2;
    v3: V3;
    v4: V4;
}

export interface V2 {
    virtualNetwork: VirtualNetworkOrPromo;
    authentication: Authentication;
    promo: VirtualNetworkOrPromo;
    balance: BalanceOrContact;
    contact: BalanceOrContact;
    conversation: Conversation;
    privateChat: PrivateChat;
    publicRooms: PublicRooms;
    settings: Settings;
    location: Location;
    channel: Channel;
    profile: Profile;
    sticker: Sticker;
    group: Group;
    sync: Sync;
    fs: Fs;
}

export interface V3 {
    virtualNetwork: VirtualNetworkOrPromo;
    authentication: Authentication;
    promo: VirtualNetworkOrPromo;
    balance: BalanceOrContact;
    contact: BalanceOrContact;
    conversation: Conversation;
    privateChat: PrivateChat;
    publicRooms: PublicRooms;
    emailRegistration: email;
    numberRegistration: numberI;
    settings: Settings;
    location: Location;
    channel: Channel;
    profile: Profile;
    sticker: Sticker;
    group: Group;
    sync: Sync;
    fs: Fs;
}

export interface V4 {
    networks: string;
}

export interface Authentication {
    signInByPassword: string;
    signInByToken?: string;
    passwordExist: string;
    getVerify: string;
    setVerify: string;
    validate: string;
    signInVN: string;
    login: string;
    qr: string;
}

export interface email {
    emailExist: string;
    emailValidate: string;
    signInByEmail: string;
    signInByEmailPass: string;
}

export interface numberI {
    numberExist: string;
    emailValidate: string;
    signInByEmail: string;
    signInByEmailPass: string;
}

export interface Location {
    byUserIP: string;
}

export interface Profile {
    get: string;
    update: string;
    check: string;
    list: string;
    userCheck: string;
    userDelete?: string;
    setPassword?: string;
    updatePassword?: string;
    deletePassword?: string;
}

export interface BalanceOrContact {
    get?: string;
    delete?: string;
    save?: string;
}

export interface Group {
    publicMessagesNewer: string;
    publicMessages: string
    getPublicLast: string;
    groupMessages: string;
    getPublicChatLikes: string;
}

export interface Sync {
    getSyncUpdates: string;
}

export interface Conversation {
    get: string;
    list: string;
    latest: string;
    messages: string;
    getOldMessages: string;
    getNewMessages: string;
    getConversationDeepLink?: string;
}

export interface PrivateChat {
    list: string;
    lastList: string;
}

export interface PublicRooms {
    getRooms: string;
}

export interface Sticker {
    virus: string;
    get: string;
}

export interface VirtualNetworkOrPromo {
    set: string;
}

export interface Settings {
    countryPrices: string;
    rates: string;
    stickers: string;
    appReleaseInfo: string;
    walletUrl: string

}

export interface Channel {
    like: string;
}

export interface Fs {
    signedUrl: string;
    fileTransfer: string;
    updateProfile: string;
    url: string;
    multipleUrl: string;
}

export interface IAppConfig {
    "LANGUAGES": Array<LanguagesEntity>
    "SIGN_IN_SOCKET_URL": string;
    "CURRENT_VERSION": string;
    "SECURITY_LINK": {
        href: string;
        target: string;
    };
    "VERSION_NAME": string;
    "WITHEMAILLOGIN": boolean;
    "WITHCONFERENCE": boolean;
    "WITHLOGINVALIDATION": boolean;
    "CREATEGROUPWITHALLADMIN": boolean;
    "WITHEMAIL": boolean;
    "VERSION_T": string;
    "TEST": boolean;
    "WITHWALLET": boolean;
    "WITHOUTPIN": boolean;
    "WITHOUTVALIDATION": boolean;
    "WITHOUTCOUNTRY": boolean;
    "MAILTO": string;
    "BRANDURL": string;
    "SOCKET_URL": string;
    "APP_NAME": string;
    "API_URL": string;
    "PREFIX": string;
    "BUCKETS": {
        "fileTransfer": string;
        "profile": string;
        "amazon": string;
        "group": string;
        "desktopReleases": string;
    },
    "ignores": Array<string>;
}


const prefix: string = APP_CONFIG.PREFIX;

const configurations: IConfigurations = {
    http: APP_CONFIG.API_URL,
    httpV4: "https://v4-services.zangi.com",
    socket: APP_CONFIG.SOCKET_URL,
    signInSocket: APP_CONFIG.SIGN_IN_SOCKET_URL,
    // socket: "wss://smstest.hawkstream.com:9443/ws/",
    app: {
        name: APP_CONFIG.APP_NAME,
        versionName: APP_CONFIG.VERSION_NAME,
        prefix,
        store: "g67f47657fsdnun34765rg",
        languages: APP_CONFIG.LANGUAGES,
        aws: {
            key: "AKIAJX7TPCQK3BZFFICA",
            bucket: {
                fileTransfer: APP_CONFIG.BUCKETS.fileTransfer,
                sticker: "ios",
                profile: APP_CONFIG.BUCKETS.profile,
                group: APP_CONFIG.BUCKETS.group,
                amazon: APP_CONFIG.BUCKETS.amazon,
                desktopReleases: APP_CONFIG.BUCKETS.desktopReleases,
            },
        }
    },
    api: {
        v2: {
            authentication: {
                signInByPassword: "",
                getVerify: "/v2/getverify",
                passwordExist: "",
                setVerify: "/v2/setverify",
                validate: "",
                signInVN: "",
                qr: "/v2/qr_web",
                login: "/v2/loginweb"
            },
            location: {
                byUserIP: "/v2/location2",
            },
            profile: {
                get: "/v2/profileGet",
                update: "/v2/profileEdit",
                check: "/v2/checknumber",
                list: "/v2/getProfileList",
                userCheck: ""
            },
            balance: {
                get: "/v2/getuserbalance"
            },
            sticker: {
                virus: "/v2/packagebycountryvirus",
                get: "/v2/getpackage"
            },
            virtualNetwork: {
                set: "/v2/addReseller"
            },
            promo: {
                set: "/v2/chargingCard"
            },
            settings: {
                countryPrices: "",
                rates: "/v2/getCallPrice2",
                stickers: "/v2/packagebycountryvirus",
                appReleaseInfo: "/v3/getAppReleaseInfo",
                walletUrl: `/v3/getPrimeOnePaymentToken/${prefix}`
            },
            contact: {
                get: "/v2/getcontacts",
            },
            conversation: {
                get: "",
                list: "/v2/getLastConversationList",
                latest: "/v2/getConversationList",
                messages: "/v2/getConversation",
                getOldMessages: "/v2/getOldMessages",
                getNewMessages: "/v2/getNewMessages",
            },
            privateChat: {
                list: "/v2/getPrivateConversationList",
                lastList: "/v2/getLastPrivateConversationList"
            },
            publicRooms: {
                getRooms: "/v2/getRoomInfo"
            },
            sync: {
                getSyncUpdates: "/v2/getSyncUpdates"
            },
            group: {
                publicMessagesNewer: "/v2/publicChatGetNewer",
                publicMessages: "/v2/publicChatGetOlder",
                groupMessages: "/v2/publicChatGetNewer",
                getPublicLast: "/v2/getPublicLast",
                getPublicChatLikes: `/v3/getPublicChatLikes/${prefix}`
            },
            channel: {
                like: "/v2/publicChatLike"
            },
            fs: {
                signedUrl: "/v2/getSignedUrl",
                fileTransfer: "https://web.pinngle.me/awskey.php",
                updateProfile: "https://web.pinngle.me/aws_key_profile.php",
                url: "https://web.pinngle.me/i.php",
                multipleUrl: "https://web.pinngle.me/multiplePublicUrls.php"
            }
        },
        v3: {
            authentication: {
                // passwordExist: `/v3/auth/isPasswordExist/${prefix}`,
                passwordExist: `/v3/auth/status/${prefix}`,
                signInByPassword: `/v3/auth/signInByPassword/${prefix}`,
                signInByToken: `/v3/auth/validateByToken/${prefix}`,
                validate: `/v3/auth/validate/${prefix}`,
                signInVN: `/v3/auth/signInVN/${prefix}`,
                getVerify: "/v2/getverify",
                setVerify: "/v2/setverify",
                login: "/v2/loginweb",
                qr: "/v2/qr_web"
            },
            location: {
                byUserIP: "/v2/location2",
            },
            profile: {
                get: `/v3/profileGet/${prefix}`,
                update: `/v3/profileEdit/${prefix}`,
                check: `/v3/checknumber/${prefix}`,
                list: `/v3/getProfileList/${prefix}`,
                userCheck: `/v3/userCheck/${prefix}`,
                userDelete: `/v3/deleteUser/${prefix}`,
                setPassword: `/v3/auth/setPassword/${prefix}`,
                updatePassword: `/v3/auth/updatePassword/${prefix}`,
                deletePassword: `/v3/auth/deletePassword/${prefix}`,
            },
            balance: {
                get: `/v3/getuserbalance/${prefix}`
            },
            sticker: { // - mher
                virus: `/v3/packagebycountryvirus/${prefix}`,
                get: "/v2/getpackage"
            },
            virtualNetwork: {
                set: `/v3/addReseller/${prefix}`
            },
            promo: { // ?
                set: "/v2/chargingCard"
            },
            settings: { // - for sticker mher
                countryPrices: "",
                rates: `/v3/getCallPrice2/${prefix}`,
                stickers: `/v3/packagebycountryvirus/${prefix}`,
                appReleaseInfo: `/v3/getAppReleaseInfo/${prefix}`,
                walletUrl: `/v3/getPrimeOnePaymentToken/${prefix}`
            },
            contact: {
                // get: `/v3/getcontacts/${prefix}`
                get: `/v3/getUserConversationNumbers/${prefix}`,
                delete: `/v3/deleteUserConversationNumbers/${prefix}`,
                save: `/v3/saveUserConversations/${prefix}`
            },
            conversation: {
                get: "",
                list: `/v3/getLastConversationList/${prefix}`,
                latest: `/v3/getConversationList/${prefix}`,
                messages: `/v3/getConversation/${prefix}`,
                getOldMessages: `/v3/getOldMessages/${prefix}`,
                getNewMessages: `/v3/getNewMessages/${prefix}`,
                getConversationDeepLink: `/v3/getConversationDeepLink/${prefix}`,
            },
            privateChat: {
                list: `/v3/getPrivateConversationList/${prefix}`,
                lastList: `/v3/getLastPrivateConversationList/${prefix}`
            },
            publicRooms: {
                getRooms: `/v3/getRoomInfo/${prefix}`
            },
            sync: {
                getSyncUpdates: `/v3/getSyncUpdates/${prefix}`
            },
            group: {
                publicMessagesNewer: `/v3/publicChatGetNewer/${prefix}`,
                publicMessages: `/v3/publicChatGetOlder/${prefix}`,
                groupMessages: `/v3/publicChatGetNewer/${prefix}`,
                getPublicLast: `/v3/getPublicLast/${prefix}`,
                getPublicChatLikes: `/v3/getPublicChatLikes/${prefix}`
            },
            channel: {
                like: `/v3/publicChatLike/${prefix}`
            },
            fs: {
                signedUrl: `/v3/getSignedUrl/${prefix}`,
                fileTransfer: "https://web.pinngle.me/awskey.php",
                updateProfile: "https://web.pinngle.me/aws_key_profile.php",
                url: "https://web.pinngle.me/i.php",
                multipleUrl: "https://web.pinngle.me/multiplePublicUrls.php"
            },
            emailRegistration: {
                emailExist: `/v3/auth/isPasswordExist/${prefix}`,
                emailValidate: `/v3/auth/validateByEmail/${prefix}`,
                signInByEmail: `/v3/auth/signInByEmailVN/${prefix}`,
                signInByEmailPass: `/v3/auth/signInByEmailPass/${prefix}`,
            },
            numberRegistration: {
                numberExist: `/v3/auth/isPasswordExist/${prefix}`,
                emailValidate: `/v3/auth/validateByEmail/${prefix}`,
                signInByEmail: `/v3/auth/signInByEmailVN/${prefix}`,
                signInByEmailPass: `/v3/auth/signInByEmailPass/${prefix}`,
            }

        },
        v4: {
            networks: "/v4/networks"
        }
    }
};

export default configurations;
