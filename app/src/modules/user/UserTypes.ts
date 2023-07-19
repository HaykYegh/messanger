export interface IAvatar extends Partial<Map<string, any>> {
    small?: Blob,
    original?: Blob,
    fileName?: string,
}

export interface IDefaultAvatar extends Partial<Map<string, any>> {
    character?: string,
    color?: {
        character: string,
        background: string
    }
}


export interface IResponseMessage extends Partial<Map<string, any>> {
    level: "SUCCESS" | "WARNING" | "ERROR" | "",
    message: string,
    type?: "SIGN_IN_FAIL" | "EMAIL_VALIDATE_FAIL" | "NUMBER_VALIDATE_FAIL" | "",
}

export interface IUser extends Partial<Map<string, any>> {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;

    defaultAvatar: IDefaultAvatar;
    avatars?: IAvatar[];
}

