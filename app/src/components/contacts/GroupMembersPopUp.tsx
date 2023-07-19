"use strict";

import "scss/pages/chat-panel/helpers/MessageActionsPopUp";
import SearchInput from "components/common/SearchInput";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import Avatar from "components/contacts/Avatar";
import {Scrollbars} from 'react-custom-scrollbars';
import {AvatarSize} from "components/contacts/style";

interface IGroupMembersPopUpProps {
    handleOwnerSearchInputChange: (currentTarget: any) => void;
    handleOwnerSelect: (contactId: string) => void;
    handleShowSelectOwnerPopUpClose: () => void;
    selectedOwnerId: string;
    changeOwner: () => void;
    groupMembers: any;
}

export default function GroupMembersPopUp({groupMembers, selectedOwnerId, handleOwnerSelect, handleShowSelectOwnerPopUpClose, changeOwner, handleOwnerSearchInputChange}: IGroupMembersPopUpProps): JSX.Element {
    const localization = components().createGroupPanel;

    const closePopUp : any = (e) => {
        if(e.target.className === 'message-action-popup') {
            handleShowSelectOwnerPopUpClose();
        }
        return;
    };
    return (
        <div className="message-action-popup" onClick={closePopUp}>
            <div className="popup-block">
                <div className="popup-content padding-input">
                    <h2 className="popup-text">{localization.ownerSelect}</h2>
                    <SearchInput  onChange={handleOwnerSearchInputChange} iconClassName="hidden"/>
                    {groupMembers.size > 0 ?
                        <Scrollbars>
                            <div className="contacts-container">
                                {groupMembers.valueSeq().map(groupMemberInfo => {
                                    const id: any = groupMemberInfo.get("contactId");
                                    const threadImage: any = {
                                        url: groupMemberInfo.get("avatarUrl"),
                                        file: groupMemberInfo.get("avatar"),
                                    };
                                    const _handleOwnerSelect: any = () => handleOwnerSelect(id);

                                    return (
                                        <div className="contact-row" onClick={_handleOwnerSelect} key={id}>
                                            <AvatarSize margin="0 12px 0 0">
                                                <Avatar
                                                    image={threadImage}
                                                    color={groupMemberInfo.getIn(["color", "numberColor"])}
                                                    status={groupMemberInfo.get("status")}
                                                    avatarCharacter={groupMemberInfo.get("avatarCharacter")}
                                                    name={groupMemberInfo.get("firstName")}
                                                    meta={{threadId: id}}
                                                />
                                            </AvatarSize>
                                                <div className="contact-info">
                                                    <span className="contact-name">{groupMemberInfo.get("name")}</span>
                                                    <span className="contact-number">{groupMemberInfo.get("email") || `+${groupMemberInfo.get("phone")}`}</span>
                                                </div>
                                                <span
                                                    className={classNames({
                                                        "delete-checked": selectedOwnerId === id,
                                                        "delete-not-checked": selectedOwnerId !== id
                                                    })}
                                                />
                                            </div>
                                    )
                                })}
                            </div>
                        </Scrollbars>
                        :
                        <span className="no-info">
                        <span className="no-info-title">{localization.noContactTitle}</span>
                        <span className="no-info-text">{localization.noContactText}</span>
                    </span>
                    }
                    <div className="send-block">
                        <button onClick={handleShowSelectOwnerPopUpClose} className="cancel-btn">{localization.cancel}</button>
                        <button className={selectedOwnerId && selectedOwnerId !== "" ? "send-btn" : "send-btn disabled-button"} onClick={changeOwner}>{localization.confirm}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
