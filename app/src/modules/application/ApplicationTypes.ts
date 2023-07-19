import {Map} from "immutable";
import {IContact} from "modules/contacts/ContactsReducer";
import {IApplicationState} from "modules/application/ApplicationReducer";

export interface ICurrentThread extends Map<string, any> {
    threadId: string,
    isLoading: boolean,
    media: {
        count: number
    },
    mute: {
        isMuted: boolean,
        interval: number
    },
    presence: {
        lastVisit: string
    },
    isBlocked: boolean,
    isFavorite: boolean,
    thread: {
        type: 'SINGLE' | 'GROUP',
        value: any,
    },
    draft: string
}


export interface IMediaType {
    label: string,
    isLoading: boolean,
    count: number,
    skip: number,
    records: any,
    imageUrls?: any,
}

export interface ISharedMessagesUpdater extends Map<string, any> {
    sharedMediaType: string,
    messageId: string,
    property: string,
    sharedMediaUpdater: any
}

export interface IApplicationData extends Map<string, any> {
    rightCreateGroupMember: IContact;
    oldCreateContactNumber: number;
    selectedThread: Map<any, any>;
    selectedInfoThreadId: string;
    createContactNumber: number;
    previousRightPanel: string;
    selectedStickerId: string;
    previousLeftPanel: string;
    showProfilePopUp: boolean;
    selectedThreadId: string;
    selectedAvatarUrl: string;
    threadSavedTexts: any;
    showRightPanel: boolean;
    previousGroupId: string;
    addMembersPlace: string,
    showSharedMedia?: boolean;
    synced: Map<any, any>;
    failedSync: Array<any>;
    sharedMediaPanel: boolean;
    createNewContactPopUp: boolean;
    files: Array<File>;
    rightPanel: string;
    showChat: boolean;
    minimized: boolean;
    leftPanel: string;
    loading: boolean;
    gifsLoading: false;
    keyword: string;
    privateChatError: string;
    showSearchMessages: string;
    sharedMediaCount: number;
    canNotDoCallPopup: boolean;
    canNotDeleteGroupPopup: boolean;
    messageModal: {
        name?: string,
        isOpen: boolean,
        coords: {
            top: number | string,
            left: number | string,
        },
    }


    //refactored
    currentThread: ICurrentThread
    applicationState: IApplicationState,


    sharedMedia: {
        isInitialized: boolean,
        total: number,
        types: {
            media: IMediaType,
            file: IMediaType,
            link: IMediaType
        }
    }
}
