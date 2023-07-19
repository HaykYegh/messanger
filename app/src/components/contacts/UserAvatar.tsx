"use strict";

import * as React from "react";

import {getBlobUri} from "helpers/FileHelper";

interface IUserAvatarProps {
    user: any;
}

export default function UserAvatar(props: IUserAvatarProps): JSX.Element {
    const {user} = props;
    const userAvatar: string = user && user.get("avatar") ? getBlobUri(user.get("avatar")) : "";

    return (
        user && user.get("avatar")
            ? <img id="user_img" src={userAvatar} className="user-img"/>
            : <span id="header_logo" className="user-icon"/>
    );
}
