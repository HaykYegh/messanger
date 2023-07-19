"use strict";

import "scss/pages/left-panel/ContactBlock";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import Avatar from "components/contacts/Avatar";
import {getUsername} from "helpers/DataHelper";
import {AvatarSize} from "components/contacts/style";
import {SwitchButton} from "containers/settings/style";
import Log from "modules/messages/Log";

interface IGroupMemberProps {
    adminList?: Array<string>;
    handleChangeRole?: (event, contactId) => void;
    loader?: JSX.Element;
    userIsOwner?: boolean;
    disabled?: boolean;
    loading?: boolean;
    isUser?: boolean;
    memberData: any;
    text?: string;
}

export default function GroupMember({memberData, text, disabled, adminList, userIsOwner, isUser, handleChangeRole, loading, loader}: IGroupMemberProps): JSX.Element {
    const contactId: string = memberData.get("contactId") || memberData.get("id");
    const name: string = (memberData.get("fullName") && memberData.get("fullName").trim() && memberData.get("fullName")) || memberData.get("name") || memberData.get("email") || memberData.get("username");
    const threadImage: any = {
        url: memberData.get("avatarUrl"),
        file: memberData.get("avatar"),
    };

    Log.i("adminList ->", adminList && adminList.includes(getUsername(contactId)))

    return (
        <li className={classNames({contact_block: true})} data-threadid={contactId}>
            <AvatarSize margin="0 12px 0 0">
            <Avatar
                image={threadImage}
                color={memberData.getIn(["color", "avatarColor"])}
                status={memberData.get("status")}
                avatarCharacter={memberData.get("avatarCharacter")}
                name={memberData.get("firstName")}
                meta={{threadId: contactId}}
                userAvatar={true}
            />
            </AvatarSize>
            <div className="contact_info">
                <span className="contact_name">{name}</span>
                <div className="member-info">
                    {text && <span className={"group-member-role"}>{text}</span>}
                    {loading && loader}
                    <SwitchButton style={disabled ? {opacity: 0.5}: null} >
                        <input
                            disabled={disabled || loading}
                            defaultChecked={disabled}
                            onChange={event => handleChangeRole(event, contactId)}
                            type="checkbox"
                            name="showPreview"
                            data-path="notification"
                            checked={adminList && adminList.includes(getUsername(contactId))}
                        />
                        <span className="slider"/>
                    </SwitchButton>
                </div>
            </div>
        </li>
    );
};
