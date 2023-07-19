"use strict";

import {IAppConfig} from "configs/configurations";

export const APP_CONFIG: IAppConfig = JSON.parse(JSON.stringify(process.env.APP_CONFIG));

export const VERSION: string = APP_CONFIG.VERSION_NAME;

export const WITHEMAILLOGIN: boolean = APP_CONFIG.WITHEMAILLOGIN;
export const WITHCONFERENCE: boolean = APP_CONFIG.WITHCONFERENCE;
export const WITHLOGINVALIDATION: boolean = APP_CONFIG.WITHLOGINVALIDATION;
export const CREATEGROUPWITHALLADMIN: boolean = APP_CONFIG.CREATEGROUPWITHALLADMIN;
export const WITHEMAIL: boolean = APP_CONFIG.WITHEMAIL;
export const VERSION_T: string = APP_CONFIG.VERSION_T;
export const TEST: boolean = APP_CONFIG.TEST;
export const WITHWALLET: boolean = APP_CONFIG.WITHWALLET;
export const WITHOUTPIN: boolean = APP_CONFIG.WITHOUTPIN;
export const WITHOUTVALIDATION: boolean = APP_CONFIG.WITHOUTVALIDATION;
export const WITHOUTCOUNTRY: boolean = APP_CONFIG.WITHOUTCOUNTRY;
export const MAILTO: string = APP_CONFIG.MAILTO;
export const BRANDURL: string = APP_CONFIG.BRANDURL;

const DESKTOP: string = "4";

const defaultStickerPreview = require("assets/images/Default_stickers/preview.png");
const defaultStickerIcon = require("assets/images/Default_stickers/avatar.png");

export const MAP_SRC_CREATOR: (lat: number, lng: number) => string =
    (lat, lng) => `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=250x250&maptype=roadmap&markers=color:red%7Clabel:S%7C${lat},${lng}&key=AIzaSyAZjDzjxTU59JQRjBGW7gUqC7c5oMcTwWI`;

export const VIDEO_REQUEST: (videoId: string) => string =
    (videoId) => `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=AIzaSyDpojwgOKdDa0jpPCwIk7WduZ54rFJ4SSI&part=snippet`;

export const LOCATION_URL: string = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDpojwgOKdDa0jpPCwIk7WduZ54rFJ4SSI";

export const LOCATION_NAME_URL: string = "https://maps.googleapis.com/maps/api/geocode/json";

export const ADD_MEMBERS_PLACES: any = {
    group_members: "group_members"
};

export const ADD_CONTACT_TYPE: any = {
    keypadPanel: 0,
    addContactPanel: 1,
    call: 2
};

export const NETWORK_JOIN_POPUP: any = {
    NICKNAME: "NICKNAME",
    TOKEN: "TOKEN",
};

export const DIFF_TIME: string = "diff_time";

export const CONVERSATION_TYPES: any = {
    conversation: 0,
    call: 1,
    group: 2
}

export const AUTOFOCUS_TYPES: any = {
    true: "true",
    false: "false",
}

export const MESSAGE_TYPES: any = {
    update_group_avatar: "CHANGE_ROOM_AVATAR",
    update_group_name: "CHANGE_ROOM",
    outgoing_call: "OUTGOING_CALL",
    incoming_call: "INCOMING_CALL",
    remove_from_group: "KICK_ROOM",
    update_room: "UPDATE_ROOM",
    missed_call: "MISSED_CALL",
    missed: "missed",
    thumb_image: "THUMB_IMAGE",
    thumb_video: "THUMB_VIDEO",
    deleted_msg: "DELETED_MSG", /*wrong type, but should be handled*/
    leave_group: "LEAVE_ROOM",
    stream_file: "STREAM_FILE",
    delete_msg: "DELETE_MSG",
    join_group: "JOIN_ROOM",
    edit_mgs: "EDITE_MSG",
    location: "LOCATION",
    contact: "CONTACT",
    contact_with_info: "CONTACT_WITH_INFO",
    sticker: "STICKER",
    image: "IMAGE",
    video: "VIDEO",
    voice: "VOICE",
    file: "FILE",
    text: "TXT",
    sync: "SYNC",
    chat: "chat",
    gif: "GIF",
    group: "group",
    notification: "NOTIFICATION",
    /*Conference call message types*/
    room_call_start: "ROOM_CALL_START",
    room_call_join: "ROOM_CALL_JOIN",
    room_call_leave: "ROOM_CALL_LEAVE",
    room_call_end: "ROOM_CALL_END",
    room_call_ringing: "ROOM_CALL_RINGING",
    room_call_decline: "ROOM_CALL_DECLINE",
    room_call_mute: "ROOM_CALL_MUTE",
    room_call_hold: "ROOM_CALL_HOLD",
    room_call_change_initiator: "ROOM_CALL_CHANGE_INITIATOR",
    room_call_current_members: "ROOM_CALL_CURRENT_MEMBERS",
    delete_room: "DELETE_ROOM",
    create_room: "CREATE_ROOM",
    room_call_video: "ROOM_CALL_VIDEO",
    /*Virtual Network message types*/
    network_join: 'NETWORK_JOIN',
    network_leave: 'NETWORK_LEAVE',
    network_kick: 'NETWORK_KICK',
    network_update: 'NETWORK_UPDATE',
    network_delete: 'NETWORK_DELETE',
    /* Transport message types*/
    transport: 'MSG_TRANSPORT',
    msg_transport_locked: 'MSG_TRANSPORT_LOCKED',
};

export const SHARED_MESSAGE_TYPES: string[] = [
    MESSAGE_TYPES.image,
    MESSAGE_TYPES.video,
    MESSAGE_TYPES.voice,
    MESSAGE_TYPES.file,
    MESSAGE_TYPES.gif,
    MESSAGE_TYPES.stream_file,
];

export const FILE_MESSAGES_TYPES = [
    MESSAGE_TYPES.file,
    MESSAGE_TYPES.voice,
    MESSAGE_TYPES.image,
    MESSAGE_TYPES.video
];

// export const UNSUPPORTED_FILE_TYPES: Array<string> = ["image/gif", ''];
export const UNSUPPORTED_FILE_TYPES: Array<string> = [];

export const WAVE_MAX_COUNT: number = 50;

export const INCORRECT_FILE_REMOTE_PATHS = ["null", "undefined"];

export const DEVICE_TOKEN_PREFIX = "web2_";

export const LEAVE_GROUP_ACTIONS: any = {
    leave_and_delete_history: "delete",
    leave_and_keep_history: "keep",
    cancel: "cancel"
};

export const CREATE_GROUP_ACTION_STATES: any = {
    add_members: "add_members",
    add_name: "add_name"
};

export const GROUP_MAX_COUNT: number = 1000;

export const GOOGLE_API_KEY: string = "AIzaSyAKji8zsJEM79Y1Li0JxPekW2KxrwnAD3s";

export const GIPHY_API_KEY: string = "e1OuEE3WqOrsVzWKyeh2FcbYXEMcNmag";

export const RIGHT_PANELS: any = {
    create_group: "create_group",
    private_chat: "private_chat",
    contact_info: "contact_info",
    add_members: "add_members",
    group_info: "group_info"
};

export const USER_IS_NOT_LOGGED_IN_MESSAGE: string = "User is not logged in";

export const LOGS_ACTION_TYPES = {
    log: "LOG"
};

export const LOGS_LEVEL_TYPE = {
    info: "info",
    verbose: "verbose",
    debug: "debug",
    error: "error"
};

export const LOG_TYPES: any = {
    message: "##message##",
    received_message: "##received_message##",
    connection: "##connection##",
    strophe: "##strophe##",
    addon: "##addon##",
    user: "##user##",
    file: "##file##",
    groups: "##groups##",
    crash: "##crash##",
    websocket_error: "##websocket_error##",
    call: "##call##",
    message_statuses: "##message_statuses##",
    sync: "##sync##",
    groupChat: "##groupChat##",
    singleChat: "##singleChat##",
    request: "##request##",
    internet: "##internet##",
    contacts: "##contacts##",
    conversations: "##conversations##",
    channels: "##channels##",
    send_status: "##send_status##",
    send_call: "##send_call##",
    notification: "##notification##",
    timer: '##TIME##',
    appCurrentVersion: '##APPLICATION CURRENT VERSION##',
    appLatestVersion: '##APPLICATION LATEST VERSION##',

};

export const USER_IP_REQUEST_URL: string = "//freegeoip.net/json/?callback";

export const CALL_VIDEO_PARAMS: any = {
    proxy: "212.32.227.130:50456",
    codec: "vp8.5;vp8.4;vp8.5_2g;vp8;vp8.1",
    candidate: "100.106.94.151:50002"
};

export const CALL_AUDIO_PARAMS: any = {
    proxy: "212.32.227.130:54800",
    codec: "opus16_16",
    candidate: "100.106.94.151:50000"
};

export const DELETE_GROUP_MEMBER_ACTIONS: any = {
    confirm: "confirm",
    cancel: "cancel"
};

export const LAST_ACTIVITY_TIME_FORMAT: "milliseconds" = "milliseconds";

export const LEFT_PANELS: any = {
    create_contact: "create_contact",
    search_messages: "search_messages",
    notifications: "notifications",
    chat_settings: "chat_settings",
    system_language: "system_language",
    sticker_store: "sticker_store",
    my_stickers: "my_stickers",
    networks: "networks",
    sticker: "sticker",
    create_group: "create_group",
    add_credit: "add_credit",
    why_us: "why_us",
    contacts: "contacts",
    channels: "channels",
    settings: "settings",
    threads: "threads",
    payments: "payments",
    privacy: "privacy",
    blocked: "blocked",
    keypad: "keypad",
    calls: "calls",
    rates: "rates",
    promo: "promo",
    profile_settings: "profile_settings",
    account: "account",
    check_for_updates: "check_for_updates",
    logs: "logs",
    closed: ""
};

export const SETTINGS_PANEL = {
    chat: 'chat',
    privacy: 'privacy',
    notification: 'notification',
    languages: 'languages',
    profile: 'profile',
    whyOurApp: 'whyOurApp',
    creditCard: 'creditCard'
};

export const DEFAULT_RIGHT_PANEL: string = RIGHT_PANELS.contact_info;

export const CHANNEL_STRING_ROLES: any = {
    follower: "Follower",
    creator: "Creator",
    admin: "Admin"
};

export const SHARED_MEDIA_TABS: any = {
    documents: "documents",
    media: "media",
    links: "links"
};
export const STICKERS_TABS: any = {
    all: "All",
    trending: "Trending",
    myStickers: "My Stickers"
};
export const MEDIA_POPUP_ACTIONS: any = {
    close: "close",
    download: "download",
    delete: "delete",
    left: 'left',
    right: 'right',
    forward: 'forward'
};

export const DEFAULT_TIME_FORMAT: string = "YYYY-MM-DD HH:mm:ss";

export const CALL_STATUSES: any = {
    answering: "answering",
    hangedUp: "hangedUp",
    decline: "decline",
    calling: "calling",
    join: "join",
    ringing: "ringing",
};

export const DEFAULT_LEFT_PANEL: string = LEFT_PANELS.contacts;

export const TIME_DIFFERENCE_DEFAULT_FORMAT: string = "ss";

export const CHANNEL_ROLES: any = {
    follower: "3",
    creator: "1",
    removed: "0",
    admin: "2"
};

export const GROUP_ROLES: any = {
    owner: 1,
    admin: 2,
    member: 3
};

export const CRYPTO_SECRET: string = "zqsw53nhi46em8j";

export const DEFAULT_STICKERS: any = (() => {
    const defaultStickers: any = {

        preview: defaultStickerPreview,
        icon: defaultStickerIcon,

        description: "Default stickers",
        defaultPackage: true,
        category: "default",
        name: "Everyday",
        featured: false,
        position: -1,
        hidden: false,
        free: true,
        price: "",
        id: "1000",
        icons: {}
    };

    for (let i: number = 0; i <= 44; i++) {
        defaultStickers.icons[`1000_${1000 + i}`] = require(`assets/images/Default_stickers/1000_${1000 + i}.png`);
    }
    return defaultStickers;
})();

export const CONTACT_NUMBER_MAX_LENGTH: number = 23;

export const RECENT_STICKERS_MAX_COUNT: number = 20;

export const REQUEST_TYPES: any = {
    get: "GET",
    post: "POST",
    put: "PUT"
};


export const GROUP_SETTINGS_PANEL_TYPE: any = {
    closed: 0,
    main: 1,
    admins: 2
};

export const EMOJI_HANDLERS: any = (() => {
    const emojiMap: Map<any, any> = new Map();
    const demojiMap: Map<any, any> = new Map();

    emojiMap.set(":)", "smile smile-smile-2x");
    emojiMap.set("(SLIGHTLY_SMILE)", "smile happy-smile-2x");
    emojiMap.set("|D", "smile hahaha-smile-2x");
    emojiMap.set("(ROFI)", "smile happytear-smile-2x");
    emojiMap.set("(BLUSH)", "smile blush-smile-2x");
    emojiMap.set(":$", "smile shy-smile-2x");
    emojiMap.set("(ANGRY)", "smile angree-smile-2x");
    emojiMap.set("(YUM)", "smile yum-smile-2x");
    emojiMap.set(";|(", "smile underblack-smile-2x");
    emojiMap.set("(TOOSAD)", "smile sob-smile-2x");
    emojiMap.set(":|", "smile speechless-smile-2x");
    emojiMap.set("(HAHA_SMILE)", "smile haha-smile-2x");
    emojiMap.set("(SCREAM)", "smile fear-smile-2x");
    emojiMap.set("(KISS)", "smile kiss-smile-2x");
    emojiMap.set("(SMIRK)", "smile smirk-smile-2x");
    emojiMap.set(":P", "smile cheeky-smile-2x");
    emojiMap.set(":(", "smile sad-smile-2x");
    emojiMap.set("(ZZZ)", "smile sleep-smile-2x");
    emojiMap.set("(DEVIL)", "smile devil-smile-red-2x");
    emojiMap.set("(ANGRY_BLUE)", "smile tired-smile-2x");
    emojiMap.set("(ANGRY_SIK)", "smile angre-sik-smile-2x");
    emojiMap.set("(WOW)", "smile bigeye-pink-smile-2x");
    emojiMap.set(";)", "smile wink-smile-2x");
    emojiMap.set("(BLISS_PINK)", "smile bliss-pink-smile-2x");
    emojiMap.set("(BOOM)", "smile boom-smile-2x");
    emojiMap.set("(KISSED)", "smile kissed-smile-2x");
    emojiMap.set(":X", "smile cant-talk-smile-2x");
    emojiMap.set(";(", "smile hmm-smile-2x");
    emojiMap.set(":D", "smile laugh-smile-2x");
    emojiMap.set("(WINK_BLUE)", "smile wink-blue-smile-2x");
    emojiMap.set("(YAWN)", "smile yawn-smile-2x");
    emojiMap.set("(PUKE)", "smile puke-smile-2x");
    emojiMap.set("(BOOM_VIOLET)", "smile boom-violet-smile-2x");
    emojiMap.set("B|", "smile cool-smile-2x");
    emojiMap.set("O)", "smile angel-smile-2x");
    emojiMap.set("(EVIL)", "smile devil-smile-2x");
    emojiMap.set("(WONDERING_VIOLET)", "smile wondering-smile-2x");
    emojiMap.set("(CHRP)", "smile hendtrail-smile-2x");
    emojiMap.set("<3", "smile inlove-smile-2x");
    emojiMap.set("(HEADSET)", "smile intro-smile-2x");
    emojiMap.set("(SAD)", "smile surprised-smile-2x");
    emojiMap.set("(SWEAT)", "smile sweat-smile-2x");
    emojiMap.set("(GRUMPY)", "smile grumpy-smile-2x");
    emojiMap.set("(GHOST)", "smile kissing-heart-smile-2x");
    emojiMap.set(":'(", "smile cry-smile-2x");
    emojiMap.set("(CRY_BLUE)", "smile cry-blue-smile-2x");
    emojiMap.set("(HYPNOS)", "smile dizziness-smile-2x");
    emojiMap.set("(ANGREE_BLUE_GREEN)", "smile angree-blue-green-smile-2x");
    emojiMap.set("(COLD)", "smile frozen-smile-2x");
    emojiMap.set(":O", "smile surprised-smile-two-2x");
    emojiMap.set(";P", "smile cheky-wink-smile-2x");
    emojiMap.set("(CLAWN)", "smile clawn-smile-2x");
    emojiMap.set("(CLOWN)", "smile clown-smile-2x");
    emojiMap.set(";|)", "smile laughing-smile-2x");
    emojiMap.set("(STAREYE)", "smile stareye-smile-2x");
    emojiMap.set("(DP)", "smile wink2-smile-2x");
    emojiMap.set("(HMM)", "smile wondering-smile-2x");
    emojiMap.set(":S", "smile worried-smile-2x");
    emojiMap.set("(SING)", "smile bliss-smile-2x");
    emojiMap.set("$)", "smile money-smile-2x");
    emojiMap.set("(NERD)", "smile smart-smile-2x");
    emojiMap.set("(BIGEYE_PINK)", "smile bigeye-smile-2x");
    emojiMap.set("(CHECKY_WINK_GREEN)", "smile cheky-wink-green-smile-2x");
    emojiMap.set("(SMILE_BLUE)", "smile smile-blue-smile-2x");
    emojiMap.set("(GIRL)", "smile girl-smile-2x");
    emojiMap.set("(GHOST_WHITE)", "smile ghost-white-smile-2x");
    emojiMap.set("(NINJA)", "smile ninja-smile-2x");
    emojiMap.set("(COWBOY)", "smile cowboy-smile-2x");
    emojiMap.set("(DRACULA)", "smile dracula-smile-2x");
    emojiMap.set("(ZORROZ)", "smile zorro-smile-2x");
    emojiMap.set("(GRALIEN)", "smile alien-smile-2x");
    emojiMap.set("(!)", "smile wow-smile-2x");
    emojiMap.set("<?", "smile question-smile-2x");
    emojiMap.set("(OX)", "smile stop-smile-2x");
    emojiMap.set("(HEART)", "smile heart-smile-2x");
    emojiMap.set("(BHEART)", "smile broken-heart-smile-2x");
    emojiMap.set("(LIPS)", "smile kiss2-smile-2x");
    emojiMap.set("(LIKE)", "smile hand-like-smile-2x");
    emojiMap.set("(DISLIKE)", "smile hand-dislike-smile-2x");
    emojiMap.set("(OK)", "smile hand-ok-smile-2x");
    emojiMap.set("(V)", "smile hand-victory-smile-2x");
    emojiMap.set("(HANDSHAKE)", "smile hand-deal-smile-2x");
    emojiMap.set("(POWER)", "smile hand-power-smile-2x");
    emojiMap.set("(STOP)", "smile hand-stop-smile-2x");
    emojiMap.set("(NOLISTEN)", "smile monkey3-smile-2x");
    emojiMap.set("(NOTELL)", "smile monkey2-smile-2x");
    emojiMap.set("(NOSEE)", "smile monkey-smile-2x");
    emojiMap.set("(LETER)", "smile mail-smile-2x");
    emojiMap.set("(LAMP)", "smile lamp-smile-2x");
    emojiMap.set("(SUNNY)", "smile sun-smile-2x");
    emojiMap.set("(MOON)", "smile moon-smile-2x");
    emojiMap.set("(REIN)", "smile rain-smile-2x");
    emojiMap.set("(RAINBOW)", "smile rainbow-smile-2x");
    emojiMap.set("(PALMA)", "smile beach-smile-2x");
    emojiMap.set("(MUSIC)", "smile music-smile-2x");
    emojiMap.set("(BELL)", "smile bell-smile-2x");
    emojiMap.set("(DRUM)", "smile drum-smile-2x");
    emojiMap.set("(GUITAR)", "smile guitar-smile-2x");
    emojiMap.set("(PALETTE)", "smile palette-smile-2x");
    emojiMap.set("(BEER)", "smile bear-smile-2x");
    emojiMap.set("(COFFEE)", "smile cup-smile-2x");
    emojiMap.set("(WINE)", "smile wine-smile-2x");
    emojiMap.set("(COCKTAIL)", "smile martini-smile-2x");
    emojiMap.set("(JUICE)", "smile juice-smile-2x");
    emojiMap.set("(COLA)", "smile cola-smile-2x");
    emojiMap.set("(ICE_CR)", "smile ice-cream-smile-2x");
    emojiMap.set("(ICE_CREAM)", "smile ice-cream2-smile-2x");
    emojiMap.set("(BIKE)", "smile bike-smile-2x");
    emojiMap.set("(CAR)", "smile car-smile-2x");
    emojiMap.set("(VAN)", "smile car2-smile-2x");
    emojiMap.set("(FAMILY)", "smile family-smile-2x");
    emojiMap.set("(TOGETHER)", "smile together-smile-2x");
    emojiMap.set("(CAT)", "smile cat-smile-2x");
    emojiMap.set("(DOG)", "smile dog-smile-2x");
    emojiMap.set("(SNAIL)", "smile snail-smile-2x");
    emojiMap.set("(BUG)", "smile bug-smile-2x");
    emojiMap.set("(EARTH)", "smile earth-smile-2x");
    emojiMap.set("(CARDS)", "smile card-smile-2x");
    emojiMap.set("(CLOVER)", "smile clover-smile-2x");
    emojiMap.set("(CACTUS)", "smile cactus-smile-2x");
    emojiMap.set("(ROSE)", "smile rose-smile-2x");
    emojiMap.set("(FLOWER)", "smile flower-smile-2x");
    emojiMap.set("(LEAF)", "smile plant-smile-2x");
    emojiMap.set("(DONUT)", "smile donut-smile-2x");
    emojiMap.set("(FRIES)", "smile fries-smile-2x");
    emojiMap.set("(CAKE)", "smile cake-smile-2x");
    emojiMap.set("(HAM)", "smile hamburger-smile-2x");
    emojiMap.set("(PIZZA)", "smile pizza-smile-2x");
    emojiMap.set("(CHERRY)", "smile cherry-smile-2x");
    emojiMap.set("(APPLE)", "smile apple-smile-2x");
    emojiMap.set("(LEMON)", "smile lemon-smile-2x");
    emojiMap.set("(PEAR)", "smile pear-smile-2x");
    emojiMap.set("(BASKET_BALL)", "smile basketball-smile-2x");
    emojiMap.set("(BALL)", "smile ball-smile-2x");
    emojiMap.set("(FOOT_BALL)", "smile football-smile-2x");
    emojiMap.set("(SHIT)", "smile shit-smile-2x");

    demojiMap.set("smile smile-smile-2x", ":)");
    demojiMap.set("smile happy-smile-2x", "(SLIGHTLY_SMILE)");
    demojiMap.set("smile hahaha-smile-2x", "|D");
    demojiMap.set("smile happytear-smile-2x", "(ROFI)");
    demojiMap.set("smile blush-smile-2x", "(BLUSH)");
    demojiMap.set("smile shy-smile-2x", ":$");
    demojiMap.set("smile angree-smile-2x", "(ANGRY)");
    demojiMap.set("smile yum-smile-2x", "(YUM)");
    demojiMap.set("smile underblack-smile-2x", ";|(");
    demojiMap.set("smile sob-smile-2x", "(TOOSAD)");
    demojiMap.set("smile speechless-smile-2x", ":|");
    demojiMap.set("smile haha-smile-2x", "(HAHA_SMILE)");
    demojiMap.set("smile fear-smile-2x", "(SCREAM)");
    demojiMap.set("smile kiss-smile-2x", "(KISS)");
    demojiMap.set("smile smirk-smile-2x", "(SMIRK)",);
    demojiMap.set("smile cheeky-smile-2x", ":P");
    demojiMap.set("smile sad-smile-2x", ":(");
    demojiMap.set("smile sleep-smile-2x", "(ZZZ)");
    demojiMap.set("smile devil-smile-red-2x", "(DEVIL)");
    demojiMap.set("smile tired-smile-2x", "(ANGRY_BLUE)");
    demojiMap.set("smile angre-sik-smile-2x", "(ANGRY_SIK)");
    demojiMap.set("smile bigeye-pink-smile-2x", "(WOW)");
    demojiMap.set("smile wink-smile-2x", ";)");
    demojiMap.set("smile bliss-pink-smile-2x", "(BLISS_PINK)");
    demojiMap.set("smile boom-smile-2x", "(BOOM)");
    demojiMap.set("smile kissed-smile-2x", "(KISSED)");
    demojiMap.set("smile cant-talk-smile-2x", ":X");
    demojiMap.set("smile hmm-smile-2x", ";(");
    demojiMap.set("smile laugh-smile-2x", ":D");
    demojiMap.set("smile wink-blue-smile-2x", "(WINK_BLUE)");
    demojiMap.set("smile yawn-smile-2x", "(YAWN)");
    demojiMap.set("smile puke-smile-2x", "(PUKE)");
    demojiMap.set("smile boom-violet-smile-2x", "(BOOM_VIOLET)");
    demojiMap.set("smile cool-smile-2x", "B|");
    demojiMap.set("smile angel-smile-2x", "O)");
    demojiMap.set("smile devil-smile-2x", "(EVIL)",);
    demojiMap.set("smile wondering-smile-2x", "(WONDERING_VIOLET)");
    demojiMap.set("smile hendtrail-smile-2x", "(CHRP)");
    demojiMap.set("smile inlove-smile-2x", "<3");
    demojiMap.set("smile intro-smile-2x", "(HEADSET)");
    demojiMap.set("smile surprised-smile-2x", "(SAD)");
    demojiMap.set("smile sweat-smile-2x", "(SWEAT)");
    demojiMap.set("smile grumpy-smile-2x", "(GRUMPY)");
    demojiMap.set("smile kissing-heart-smile-2x", "(GHOST)");
    demojiMap.set("smile cry-smile-2x", ":'(");
    demojiMap.set("smile cry-blue-smile-2x", "(CRY_BLUE)");
    demojiMap.set("smile dizziness-smile-2x", "(HYPNOS)");
    demojiMap.set("smile angree-blue-green-smile-2x", "(ANGREE_BLUE_GREEN)");
    demojiMap.set("smile frozen-smile-2x", "(COLD)");
    demojiMap.set("smile surprised-smile-two-2x", ":O");
    demojiMap.set("smile cheky-wink-smile-2x", ";P");
    demojiMap.set("smile clawn-smile-2x", "(CLAWN)");
    demojiMap.set("smile clown-smile-2x", "(CLOWN)");
    demojiMap.set("smile laughing-smile-2x", ";|)");
    demojiMap.set("smile stareye-smile-2x", "(STAREYE)");
    demojiMap.set("smile wink2-smile-2x", "(DP)");
    demojiMap.set("smile wondering-smile-2x", "(HMM)");
    demojiMap.set("smile worried-smile-2x", ":S");
    demojiMap.set("smile bliss-smile-2x", "(SING)");
    demojiMap.set("smile money-smile-2x", "$)");
    demojiMap.set("smile smart-smile-2x", "(NERD)");
    demojiMap.set("smile bigeye-smile-2x", "(BIGEYE_PINK)");
    demojiMap.set("smile cheky-wink-green-smile-2x", "(CHECKY_WINK_GREEN)");
    demojiMap.set("smile smile-blue-smile-2x", "(SMILE_BLUE)");
    demojiMap.set("smile girl-smile-2x", "(GIRL)");
    demojiMap.set("smile ghost-white-smile-2x", "(GHOST_WHITE)");
    demojiMap.set("smile ninja-smile-2x", "(NINJA)");
    demojiMap.set("smile cowboy-smile-2x", "(COWBOY)");
    demojiMap.set("smile dracula-smile-2x", "(DRACULA)");
    demojiMap.set("smile zorro-smile-2x", "(ZORROZ)");
    demojiMap.set("smile alien-smile-2x", "(GRALIEN)");
    demojiMap.set("smile wow-smile-2x", "(!)");
    demojiMap.set("smile question-smile-2x", "<?");
    demojiMap.set("smile stop-smile-2x", "(OX)");
    demojiMap.set("smile heart-smile-2x", "(HEART)");
    demojiMap.set("smile broken-heart-smile-2x", "(BHEART)");
    demojiMap.set("smile kiss2-smile-2x", "(LIPS)");
    demojiMap.set("smile hand-like-smile-2x", "(LIKE)");
    demojiMap.set("smile hand-dislike-smile-2x", "(DISLIKE)");
    demojiMap.set("smile hand-ok-smile-2x", "(OK)");
    demojiMap.set("smile hand-victory-smile-2x", "(V)");
    demojiMap.set("smile hand-deal-smile-2x", "(HANDSHAKE)");
    demojiMap.set("smile hand-power-smile-2x", "(POWER)");
    demojiMap.set("smile hand-stop-smile-2x", "(STOP)");
    demojiMap.set("smile monkey3-smile-2x", "(NOLISTEN)");
    demojiMap.set("smile monkey2-smile-2x", "(NOTELL)");
    demojiMap.set("smile monkey-smile-2x", "(NOSEE)");
    demojiMap.set("smile mail-smile-2x", "(LETER)");
    demojiMap.set("smile lamp-smile-2x", "(LAMP)");
    demojiMap.set("smile sun-smile-2x", "(SUNNY)");
    demojiMap.set("smile moon-smile-2x", "(MOON)");
    demojiMap.set("smile rain-smile-2x", "(REIN)");
    demojiMap.set("smile rainbow-smile-2x", "(RAINBOW)");
    demojiMap.set("smile beach-smile-2x", "(PALMA)");
    demojiMap.set("smile music-smile-2x", "(MUSIC)");
    demojiMap.set("smile bell-smile-2x", "(BELL)");
    demojiMap.set("smile drum-smile-2x", "(DRUM)");
    demojiMap.set("smile guitar-smile-2x", "(GUITAR)");
    demojiMap.set("smile palette-smile-2x", "(PALETTE)");
    demojiMap.set("smile bear-smile-2x", "(BEER)");
    demojiMap.set("smile cup-smile-2x", "(COFFEE)");
    demojiMap.set("smile wine-smile-2x", "(WINE)");
    demojiMap.set("smile martini-smile-2x", "(COCKTAIL)");
    demojiMap.set("smile juice-smile-2x", "(JUICE)");
    demojiMap.set("smile cola-smile-2x", "(COLA)");
    demojiMap.set("smile ice-cream-smile-2x", "(ICE_CR)");
    demojiMap.set("smile ice-cream2-smile-2x", "(ICE_CREAM)");
    demojiMap.set("smile bike-smile-2x", "(BIKE)");
    demojiMap.set("smile car-smile-2x", "(CAR)");
    demojiMap.set("smile car2-smile-2x", "(VAN)");
    demojiMap.set("smile family-smile-2x", "(FAMILY)");
    demojiMap.set("smile together-smile-2x", "(TOGETHER)");
    demojiMap.set("smile cat-smile-2x", "(CAT)");
    demojiMap.set("smile dog-smile-2x", "(DOG)");
    demojiMap.set("smile snail-smile-2x", "(SNAIL)");
    demojiMap.set("smile bug-smile-2x", "(BUG)");
    demojiMap.set("smile earth-smile-2x", "(EARTH)");
    demojiMap.set("smile card-smile-2x", "(CARDS)");
    demojiMap.set("smile clover-smile-2x", "(CLOVER)");
    demojiMap.set("smile cactus-smile-2x", "(CACTUS)");
    demojiMap.set("smile rose-smile-2x", "(ROSE)");
    demojiMap.set("smile flower-smile-2x", "(FLOWER)");
    demojiMap.set("smile plant-smile-2x", "(LEAF)");
    demojiMap.set("smile donut-smile-2x", "(DONUT)");
    demojiMap.set("smile fries-smile-2x", "(FRIES)");
    demojiMap.set("smile cake-smile-2x", "(CAKE)");
    demojiMap.set("smile hamburger-smile-2x", "(HAM)");
    demojiMap.set("smile pizza-smile-2x", "(PIZZA)");
    demojiMap.set("smile cherry-smile-2x", "(CHERRY)");
    demojiMap.set("smile apple-smile-2x", "(APPLE)");
    demojiMap.set("smile lemon-smile-2x", "(LEMON)");
    demojiMap.set("smile pear-smile-2x", "(PEAR)");
    demojiMap.set("smile basketball-smile-2x", "(BASKET_BALL)");
    demojiMap.set("smile ball-smile-2x", "(BALL)");
    demojiMap.set("smile football-smile-2x", "(FOOT_BALL)");
    demojiMap.set("smile shit-smile-2x", "(SHIT)");

    const emojiContainer: Array<any> = [];

    emojiMap.forEach((value, key) => {
        const obj: any = {
            emojiClass: value,
            emojiName: key
        };
        emojiContainer.push(obj);
    });

    return {
        emojiContainer,
        demojiMap,
        emojiMap
    }
})();

export const GROUP_MAX_MEMBERS_COUNT: number = 50;

export const CONFERENCE_CALL_MEMBERS_COUNT: number = 4;

export const CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM: number = 1000;

export const MOUSE_MOVE_STOPPED_TIME_OUT: number = 7000; // millisecond

export const DISPLAY_MESSAGES_COUNT: number = 50;

export const DISPLAY_CONTATCS_COUNT: number = 50;

export const IMAGE_MIME_TYPE: string = "image";

export const VIDEO_MIME_TYPE: string = "video";

export const AUDIO_MIME_TYPE: string = "voice";

export const RED5_1: string = "212.32.227.130";

export const ZANGI_APP_NAME: string = "Zangi";

export const PASSWORD_MIN_LENGTH: number = 6;

export const LEARN_MORE: any = {
    secureAndSafe: 'https://zangi.com/features/security',
    saveWith: 'https://zangi.com/features/bandwidth-usage',
    beConnected: 'https://zangi.com/features/free-voice-and-video-chat',
    addSomeFun: 'https://zangi.com/features/security',
};

export const CALL_DEVICE_PARAMS: any = {
    height: 768,
    width: 1024
};

export const OFFLINE_MESSAGE_BODY: string = "#E#F#M#";

export const AVATAR_SIZE: any = {
    minHeight: 230,
    minWidth: 230,
    maxHeight: 230,
    maxWidth: 230
};

export const AVATAR_MAX_HEIGHT: number = 400;

export const AVATAR_MAX_WIDTH: number = 400;


export const NAKA_APP_NAME: string = "Naka";

export const VIDEO_TOGGLE: string = "video";

export const STREAM_TOGGLE: string = "stream_file";

export const IMAGE_TOGGLE: string = "image";

export const GIF_TOGGLE: string = "gif";

export const VOICE_TOGGLE: string = "voice";

export const CALL_VERSION: string = "4.2.1";

export const CALL_PROTOTYPE: string = "scp";

export const ENTER_KEY_CODE: number = 13;

export const UP_KEY_CODE: number = 38;

export const DOWN_KEY_CODE: number = 40;

export const ESC_KEY_CODE: number = 27;

export const TAB_KEY_CODE: number = 9;

export const KEYPAD: Array<any> = [
    {
        keyNum: 1,
        keyLetter: ""
    }, {
        keyNum: 2,
        keyLetter: "A B C"
    }, {
        keyNum: 3,
        keyLetter: "D E F"
    }, {
        keyNum: 4,
        keyLetter: "G H I"
    }, {
        keyNum: 5,
        keyLetter: "J K L"
    }, {
        keyNum: 6,
        keyLetter: "M N O"
    }, {
        keyNum: 7,
        keyLetter: "P Q R S"
    }, {
        keyNum: 8,
        keyLetter: "T U V"
    }, {
        keyNum: 9,
        keyLetter: "W X Y Z"
    }, {
        keyNum: "*",
        keyLetter: "*"
    }, {
        keyNum: 0,
        keyLetter: "+"
    }, {
        keyNum: "#",
        keyLetter: "#"
    }
];

export const PROJECT_COLORS: any = {
    PRIMARY: "#00A2FF",
    RIGHT_PANEL_BACKGROUND: "#F9FAFF",
};

export const COLORS: Array<any> = [
    {numberColor: "#00D5CC", avatarColor: "linear-gradient(to bottom, #91aaf9 0%, #7b68ee 100%)"},
    {numberColor: "#00A2FF", avatarColor: "linear-gradient(to bottom, #ff9966 0%, #ff5050 100%)"},
    {numberColor: "#8174FF", avatarColor: "linear-gradient(to bottom, #ff99ff 0%, #e650ff 100%)"},
    {numberColor: "#D968EC", avatarColor: "linear-gradient(to bottom, #E29EEF 0%, #E26CC3 100%)"},
    {numberColor: "#FF6358", avatarColor: "linear-gradient(to bottom, #00ffcc 0%, #009999 100%)"},
    {numberColor: "#FF9455", avatarColor: "linear-gradient(to bottom, #ffcc66 0%, #ff8566 100%)"},
];

export const AUDIO_TYPES: Array<string> = ["mp3", "aac", "wav", "3gpp", "smf", "ogg"];

export const LIKE_STATES: any = {
    defaultState: 0,
    dislike: 2,
    like: 1
};


export const APPLICATION: any = {
    DEVICE_TOKEN: btoa(`DEVICE_TOKEN_${VERSION}`),
    PLATFORM: DESKTOP,
    DEVICE_TYPE: 'Desktop',
    VERSION,
    WITHEMAILLOGIN,
    WITHCONFERENCE,
    WITHLOGINVALIDATION,
    CREATEGROUPWITHALLADMIN,
    WITHEMAIL,
    VERSION_T,
    TEST,
    WITHWALLET,
    WITHOUTPIN,
    WITHOUTVALIDATION,
    WITHOUTCOUNTRY,
    MAILTO,
    BRANDURL,
    DATABASE: {
        NAME: VERSION.toUpperCase(),
        TABLES: {
            CACHE: "cache",
            CONTACTS: "contacts",
            NETWORKS: "networks",
            MESSAGES: "messages",
            CONVERSATIONS: "conversations",
            UNREAD_MESSAGE_COUNTS: "unreadMessageCounts",
            THREADS: "threads",
            THREAD_CONTACTS: "threadContacts",
            SETTINGS: "settings",
            APPLICATION: "application",
            NUMBERS: "numbers",
            MESSAGE_STATUS: "messageStatus",
            REQUESTS: "requests",
            USERS: "users",
            AVATARS: "avatars",
            PROFILES: "profiles",
            STICKER_PACKAGES: "stickerPackages",
            STICKER_ICONS: "stickerIcons",
            GROUP_THREAD_DATA: "groupThreadData",
            BLOCKED_CONTACTS: "blockedContacts",
            MUTED_THREADS: "mutedThreads",
            PENDING: "Pending"
        }
    }
};

export const MUTE_TIMES: any = {
    muteUnlimited: {
        expires: 2147483647,
        key: "0"
    },
    muteOneMinute: {
        expires: 6,
        key: "1"
    },
    muteMinutes: {
        expires: 900,
        key: "2"
    },
    muteHour: {
        expires: 3600,
        key: "3"
    },
    muteHours: {
        expires: 28800,
        key: "4"
    },
    muteDay: {
        expires: 86400,
        key: "5"
    }
};

export const SYNC_MUTE_TIMES: any = {
    "0": MUTE_TIMES.muteUnlimited.expires,
    "1": MUTE_TIMES.muteOneMinute.expires,
    "2": MUTE_TIMES.muteMinutes.expires,
    "3": MUTE_TIMES.muteHour.expires,
    "4": MUTE_TIMES.muteHours.expires,
    "5": MUTE_TIMES.muteDay.expires,
    "unmute": "6"
};


export const MODAL_TYPES: any = {
    AUTHENTICATION: {
        CLOSED: 0,
        CONFIRM_PHONE_NUMBER: 1,
    }
};


export const AUTHENTICATION_STEPS: any = {
    LOGIN_USING_MOBILE: {
        PHONE_CONFIRMATION: 0,
        SEND_VERIFY_CODE: 1,
        SET_PASSWORD: 2,
        TYPE_PASSWORD: 3,
    },
    SIGN_UP_USING_EMAIL: {
        EMAIL_CONFIRMATION: 0,
        VERIFY_CODE_CONFIRMATION: 1,
        SET_PROFILE_DETAILS: 2,
        SET_PASSWORD: 3,
        TYPE_PASSWORD: 4,
    }
};

export const EMAIL_REGISTRATION_KEY: string = "EMAIL_REGISTRATION";

export const AUTHENTICATION_TABS: any = [
    {
        KEY: "EMAIL_REGISTRATION",
        NAME: "Email"
    },
    {
        KEY: "LOGIN_USING_MOBILE",
        NAME: "Phone"
    },
    // {
    //     KEY: "LOGIN_USING_QR",
    //     NAME: "QR code"
    // }
];

export const CONVERSATION_TYPE = {
    PRIVATE_CHAT: "PRIVATE_CHAT",
    CHANNEL: "CHANNEL",
    SINGLE: "SINGLE",
    GROUP: "GROUP"
};

export const MESSAGE_BOX_TYPES = {
    question: "question",
    info: "info",
    error: "error",
    warning: "warning"
};

export const LOAD_STATUS = {
    UPLOAD_SUCCESS: 1,
    UPLOAD_FAILURE: 2,
    UPLOAD_CANCEL: 3,
    DOWNLOAD_SUCCESS: 4,
    DOWNLOAD_FAILURE: 5,
    DOWNLOAD_CANCEL: 6,
    LOAD_START: 7,
    /*compressing*/
    OPTIMISE_START: 8,
    OPTIMISE_CANCEL: 9,
    OPTIMISE_FAILURE: 10,
    /*compressing*/
    DOWNLOAD_404: 11,
    UPLOAD_404: 12
};

export const new_LOAD_STATUS = {
    uploadSuccess: "UPLOAD_SUCCESS",
    uploadFailure: "UPLOAD_FAILURE",
    uploadCancel: "UPLOAD_CANCEL",
    downloadSuccess: "DOWNLOAD_SUCCESS",
    downloadFailure: "DOWNLOAD_FAILURE",
    downloadCancel: "DOWNLOAD_CANCEL",
    loadStarted: "LOAD_START",
};

export const CHANNEL_FETCH = {
    STOPPED: 0,
    STARTED: 1,
    FAILED: 2
};

export const BLOB_TYPES: any = {
    STREAM: "application/octet-stream",
    IMAGE: "application/image/jpeg",
};

export const CHANNEL_LINK_PREFIX = "www.pinn.ch/";

export const NETWORK_LINK_REGEX = "zangi.com/networks/";

export const CHANNEL_LINK_REGEX = /^(?!http:\/\/www.pinn.ch\/.*$).*/gi;

export const EMAIL_VALIDAITON_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const ALL_LANGUAGES_REGEX = /\([.?*+^$[\]\\(){}|-]\[\w\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\s+;.,?!]+/ig;

// export const ALL_LANGUAGES_REGEX = /[^\w\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\s+;.,?!]+/ig;

export const ARABIC_LANGUAGE = "ar";

export const CONVERSATIONS_LIMIT: number = 40;

export const CONNECTION_ERROR_TYPES: Array<string> = ["Failed to fetch", "Network Error", "User Credentials Error"];

export const SET_PASSWORD_ERROR: string = "SET_PASSWORD_ERROR";

export const MESSAGES_CHAT_LIMIT: number = 50;

export const SHOW_MORE_LIMIT: number = 25;

export const TYPING_LIST_SIZE: number = 3;

export const GROUP_MESSAGES_LIMIT: number = 30;

export const CHANNEL_MESSAGES_LIMIT: number = 30;

export const GIF_SEARCH_LIMIT: number = 25;

export const SEARCH_MESSAGES_LIMIT: number = 50;

export const MOUSE_WHEEL_SPEED: number = 30;

export const FILE_PREVIEW_MAX_SIZE: number = 10;
/* Mb */

export const SUPPORTED_IMAGE_FORMATS = ['bmp', 'jpg', 'jpeg', 'png', 'gif'];

export const sizeInfo = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];

export const CHANNELS_ENABLED: boolean = false;

export const SYSTEM_MESSAGE_NUMBER: string = "000000002";

export const MEDIA_ACCESS_TYPE: any = {
    MICROPHONE: "microphone",
    CAMERA: "camera"
};

export const RESPONSE_STATUS_TYPE = {
    FAILED: "FAILED",
    SUCCESS: "SUCCESS"
};


export const
    URL_SCHEME = "zangi";

export const DIGITS_REGEX = /^\d+$/;


// refactored


export const MESSAGES_LIMIT = 50;
export const MESSAGES_BADGE_LIMIT = 99;
export const CONTACTS_LIMIT: number = 50;
export const SHARED_MEDIA_LIMIT: number = 30;
export const RESOLUTION_SEPARATOR: string = 'x';

// Application Config

export const IS_REPLY_PERSONALLY_ENABLED: boolean = false;

export const SHARED_MEDIA_TYPES = {
    MEDIA: "media",
    FILE: "file",
    LINK: "link",
};

export const MEDIA_TYPES: {[key: string]: string[]} = {
    media: [
        MESSAGE_TYPES.image, MESSAGE_TYPES.gif, MESSAGE_TYPES.video
    ],
    file: [
        MESSAGE_TYPES.file, MESSAGE_TYPES.voice, MESSAGE_TYPES.stream_file
    ]
};

export const VIDEO_EXT_LIST: string[] = ["flac", "m4a", "ogv", "ogm", "opus", "webm", "mpeg", "wav", "x-m4a", "aac"];
export const MUSIC_EXT_LIST: string[] = ["3gp", "aa", "aac", "aax", "act", "aiff", "alac", "amr", "ape", "au", "awb", "dct", "flac", "gsm", "m4a", "m4b", "m4p", "mmf", "mp3", "mpc", "msv", "nmf", "nsf", "ogg", "oga", "mogg", "opus", "ra", "rm", "sln", "tta", "voc", "vox", "wav", "wma", "wv", "webm"];



