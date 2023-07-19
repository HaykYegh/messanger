import {List} from "immutable";

export interface IGroupDetails {
    avatar: {
        cropped: File | Blob,
        original?: File | Blob,
        file?: any,
    },
    name: string
}

export interface IGroupCreateParams {
    contacts: string[],
    group: IGroupDetails,
}

export interface IUploadFile {
    bucket: string,
    key: string,
    data: File | Blob,
}

export interface IDownloadFile {
    bucket: string,
    key: string,
}

export type IConversationType = 'SINGLE' | 'GROUP' | 'PRIVATE_CHAT';

export interface IGroupConversation extends ISingleConversation {
    threadId: string;
    name: string;
    info: Info;
    typeId: string;
    lastMessageId: string;
    time: number;
    newMessagesIds?: (null)[] | null;
    newMessagesCount: number;
    typing?: (null)[] | null;
}

export interface Info {
    color: Color;
    avatar: Avatar;
    disabled: boolean;
    createdAt: string;
    avatarCharacter: string;
    members?: (string)[] | null;
    author: string;
    partialId: string;
    groupMembersUsernames?: (string)[] | null;
    avatarUrl: string;
    lastMessageId?: null;
    newMessagesIds?: (null)[] | null;
    groupMembers?: (null)[] | null;
    memberEditAvatar: boolean;
    memberAddMember: boolean;
    memberEditName: boolean;
    name: string;
    isGroup: boolean;
    muted: boolean;
    imageUrl: string;
    id: string;
    image?: null;
    adminList?: (string)[] | null;
    ownerList?: (string)[] | null;
    memberList?: (null)[] | null;
    allAdmins: boolean;
    role: number;
}

export interface Color {
    numberColor: string;
    avatarColor: string;
}

export interface Avatar {
}

export interface ISingleConversation extends Map<string, any> {
    threadId: string;
    info: Info;
    parentId?: null;
    typeId: string;
    lastMessageId: string;
    time: number;
    draft: string;
    newMessagesIds?: (null)[] | null;
    newMessagesCount: number;
    typing?: (null)[] | null;
}

export interface IContact extends Map<string, any> {
    newMessagesIds: List<string>;
    avatarCharacter: string;
    color: {
        avatarColor: string;
        numberColor: string;
    };
    isProductContact: boolean;
    lastMessageId: string;
    firstName: string;
    lastActive: string;
    lastName: string;
    avatarUrl: Blob;
    favorite: boolean;
    createdAt: string;
    imageUrl: Blob;
    blocked: boolean;
    username: string;
    email: string;
    typing: boolean;
    author: string;
    saved: boolean;
    status: string;
    muted: boolean;
    phone: number | string;
    name: string;
    contactId: string;
    members?: any;

    avatar?: Blob;
    image?: Blob;
}

export interface ICountry {
    regionCode: string,
    phoneCode: string,
    name: string,
    label: string,
}
