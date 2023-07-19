"use strict";

import CropAvatarPopUp from "containers/common/CropAvatarPopUp";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import "scss/pages/left-panel/creategroup/CreateGroupName";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import Contact from "../contacts/Contact";
import * as React from "react";
import {Map} from "immutable";
import {getBlobUri} from "helpers/FileHelper";
import Avatar from "components/contacts/Avatar";
import Log from "modules/messages/Log";

interface ICreateGroupAddNameStateProps {
    inputProps: {
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
        name: string;
    };
    checkedContactsUsernames: Array<string>;
    onAvatarChange: (event: any) => void;
    uploadAvatar: (event: any) => void;
    contacts: Map<string, IContact>;
    closeCrop: () => void;
    avatar: Blob;
    image: any;
    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    rightButton?: {
        onClick?: () => void;
        className: string;
        text?: string;
    };
    user: any;
}

export default function CreateGroupAddNameState({checkedContactsUsernames, contacts, inputProps, uploadAvatar, closeCrop, image, onAvatarChange, avatar, leftButton, rightButton, user}: ICreateGroupAddNameStateProps): JSX.Element {
    const localization: any = components().createGroupAddNameState;

    const avatarStyle: any = avatar ? {
        backgroundImage: `url(${getBlobUri(avatar)})`,
        backgroundSize: "cover"
    } : {};

    Log.i("CreateGroupAddNameState ->", avatar)
    const threadImage: any = {
        url: "",
        file: avatar,
    };


    return (
        <div className="group_chat_info">
            <div className="group_chat_content">
                <div className="info-block">
                    {rightButton &&
                    <span className={rightButton.className} onClick={rightButton.onClick}>{rightButton.text}</span>}

                    {leftButton &&
                    <span className={leftButton.className} style={leftButton.style} onClick={leftButton.onClick}>{leftButton.text}</span>}

                    <span className={"user-img"}>
                        <Avatar
                            image={threadImage}
                            color={user.getIn(["color", "numberColor"])}
                            avatarCharacter={user.get("avatarCharacter")}
                            name={user.get("firstName")}
                            meta={{threadId: user.get("id")}}
                            userAvatar={true}
                        />
                        <span className="group-pic-icon">
                            <input
                                accept="image/gif,image/jpeg,image/jpg,image/png"
                                onChange={onAvatarChange}
                                className="group-pic-upload"
                                id="profPicInput"
                                name="avatar"
                                type="file"
                            />
                        </span>
                    </span>
                    <input className="user-name" type="text" placeholder="Enter Group Name" {...inputProps}/>
                    <span className="number-of-members">{`${checkedContactsUsernames.length + 1} ${localization.members}`}</span>
                </div>
                <div className="contacts">
                    <Contact
                        key={user.get("id")}
                        contact={user}
                        me={true}
                    />
                    {checkedContactsUsernames.map(username => <Contact contact={contacts.getIn([`${username}@${SINGLE_CONVERSATION_EXTENSION}`, 'members']).first()} checked={true} key={username}/>)}
                </div>
            </div>
            {image && <CropAvatarPopUp
                uploadAvatar={uploadAvatar}
                cancel={closeCrop}
                image={image}
            />}
        </div>
    );
};
