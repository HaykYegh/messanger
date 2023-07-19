"use strict";

import * as React from "react";
import {List} from "immutable";
import {Scrollbars} from 'react-custom-scrollbars';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    GROUP_ROLES,
    GROUP_SETTINGS_PANEL_TYPE,
    IMAGE_TOGGLE,
    LEAVE_GROUP_ACTIONS,
    VIDEO_TOGGLE
} from "configs/constants";
import AvatarCropper from "components/common/AvatarCropper";
import {IContact} from "modules/contacts/ContactsReducer";
import {IGroup} from "modules/groups/GroupsReducer";
import PopUpMain from "components/common/PopUpMain";
import Avatar from "components/contacts/Avatar";
import components from "configs/localization";
import {AvatarSize} from "components/contacts/style";
import Log from "modules/messages/Log";

interface IGroupInfoProps {
    handleLeaveGroupAction: (action: string, isOwner: boolean) => void;
    //handleDeleteMemberAction: (action: string) => void;
    handleGroupSettingsPanelChange: (type) => void;
    handleCroppedImageUpdate: (event: any) => void;
    handleAvatarChange: (event: any) => void;
    handleNameChange: (event: any) => void;
    handleSharedMediaPanelOpen: () => void;
    handleLeaveGroupPopUpOpen: () => void;
    handleRightPanelToggle: () => void;
    toggleIsGroupMutePopUp: () => void;
    selectedThread: IGroup | IContact;
    handleAddMembersOpen: () => void;
    showDeleteMemberPopUp: boolean;
    handleGroupUpdate: () => void;
    showLeaveGroupPopUp: boolean;
    isGroupMember: () => boolean;
    handleGroupEdit: () => void;
    handleCropPopupDismiss: () => void;
    showGroupSettings: boolean;
    members: List<JSX.Element>;
    showSharedMedia: boolean;
    threadInfo: any;
    groupName: any;
    avatar: Blob;
    avatarBlobUrl: string;
    editing: any;
    image: any;
    sharedMediaCount?: number;
    handleMediaPopUpOpen: (type: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    handleAddMembersPopUpOpen: () => void;
    groupCallId: string;
    user: any;
}

const GroupInfoToMemo = (props: IGroupInfoProps): JSX.Element  => {
    const localization: any = components().groupInfo;
    //const confirm: any = () => handleDeleteMemberAction(DELETE_GROUP_MEMBER_ACTIONS.confirm);
    //const cancelDeleteMember: any = () => handleDeleteMemberAction(DELETE_GROUP_MEMBER_ACTIONS.cancel);

    const {
        showLeaveGroupPopUp, handleLeaveGroupAction, showDeleteMemberPopUp, handleRightPanelToggle,
        toggleIsGroupMutePopUp, members, selectedThread, handleSharedMediaPanelOpen, threadInfo,
        handleAddMembersOpen, handleLeaveGroupPopUpOpen, handleGroupEdit, groupName, avatar, handleNameChange, image,
        handleAvatarChange, handleCropPopupDismiss, handleCroppedImageUpdate, handleGroupUpdate, editing, isGroupMember,
        showSharedMedia, handleGroupSettingsPanelChange, showGroupSettings, sharedMediaCount, handleMediaPopUpOpen, handleAddMembersPopUpOpen, avatarBlobUrl,
        groupCallId, user
    } = props;
    const role: any = threadInfo.get("role");
    const allAdmins: any = threadInfo.get("allAdmins");
    const disabled: boolean = threadInfo.get("disabled");
    const threadName: string = threadInfo.get("name");
    const isOwner: boolean = role === GROUP_ROLES.owner;
    const threadId: string = selectedThread.getIn(['threads', 'threadId']);

    const threadImage: any = {
        url: "",
        file: avatar || threadInfo.get("avatar"),
    };

    const showDone: boolean = groupName && typeof groupName === "string" && groupName.trim() !== "";
    const canAddMembers: boolean = (threadInfo.get("memberAddMember") || [GROUP_ROLES.admin, GROUP_ROLES.owner].includes(role)) || allAdmins;
    const canEditAvatar: boolean = (threadInfo.get("memberEditAvatar") || [GROUP_ROLES.admin, GROUP_ROLES.owner].includes(role)) || allAdmins;
    const canEditName: boolean = (threadInfo.get("memberEditName") || [GROUP_ROLES.admin, GROUP_ROLES.owner].includes(role)) || allAdmins;

    const titleText: string = isOwner ? localization.pleaseConfirm : localization.leaveGroup;
    const infoText: string = isOwner ? localization.leaveConfirmationInfo : localization.leaveGroupText;

    const cancel: any = () => handleLeaveGroupAction(LEAVE_GROUP_ACTIONS.cancel, isOwner);
    const openGroupSettingsPanel = () => handleGroupSettingsPanelChange(GROUP_SETTINGS_PANEL_TYPE.main);

    const leaveGroup: any = (deleteHistory: boolean): void => {
        handleLeaveGroupAction(deleteHistory ? LEAVE_GROUP_ACTIONS.leave_and_delete_history : LEAVE_GROUP_ACTIONS.leave_and_keep_history, isOwner);
    };

    const getNotificationStatus = () => {
        if (threadInfo.get("muted")) {
            const username = user.get("username");
            const encodedUsername = btoa(username);
            const mutedConversations = localStorage.getItem(encodedUsername);
            const mutedMap = mutedConversations && JSON.parse(mutedConversations) || {};
            const muteMapObj = mutedMap[threadId]
            const curDate = new Date()
            if (!muteMapObj) {
                return localization.muteStatus.on
            }
            if (muteMapObj.year - curDate.getFullYear() > 2) {
                return localization.muteStatus.off
            }
            if (muteMapObj.date - curDate.getDate() > 0) {
                return `Until Tomorow ${muteMapObj.hour}`
            }

            return `Until ${muteMapObj.hour}`

        }
        return localization.muteStatus.on
    }

    return (
        <div className="group-profile-right">
            <Scrollbars autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                <div className={`group-profile-content${!editing ? " transparent" : ""}`}>

                    <span title={localization.closeGroup} className={"close_btn"} onClick={handleGroupEdit}>
                        {localization.cancel}
                    </span>

                    {!disabled && isGroupMember && showDone &&
                    <span className="right_btn done" onClick={handleGroupUpdate}>{localization.done}</span>
                    }


                    <div className="image-block">
                                <span className="img-edit" style={!canEditAvatar ? {pointerEvents: "none"} : null}>
                                    <AvatarSize width="120px" height="120px">
                                    <Avatar
                                        image={threadImage}
                                        color={threadInfo.getIn(["color", "numberColor"])}
                                        avatarCharacter={threadInfo.get("avatarCharacter")}
                                        name={groupName}
                                        meta={{threadId: threadInfo.get("id")}}
                                        userAvatar={false}
                                        isGroup={true}
                                        border={"1px solid #F5F5F7"}
                                        fontSize={"39px"}
                                        iconSize={"62px"}
                                        avatarBlobUrl={avatarBlobUrl || threadInfo.get("avatarBlobUrl")}
                                    />
                                    </AvatarSize>


                                    <span className={`${!threadImage.file ? "no-image " : ""}group-pic-icon`}>
                                    <input
                                        accept="image/gif,image/jpeg,image/jpg,image/png"
                                        className="group-pic-upload"
                                        onChange={handleAvatarChange}
                                        id="groupPicInput"
                                        name="avatar"
                                        type="file"
                                        disabled={!canEditAvatar}
                                    />
                                    </span>
                                </span>
                        <input
                            id={"group-name-input"}
                            type="text"
                            name="groupName"
                            value={groupName}
                            onChange={handleNameChange}
                            className="group-name-input"
                            placeholder="Enter Group Name"
                            disabled={!canEditName}
                            autoFocus={true}
                            maxLength={50}
                        />
                        <ReactCSSTransitionGroup
                            transitionName={{
                                enter: 'open',
                                leave: 'close',
                            }}
                            component="div"
                            transitionEnter={true}
                            transitionLeave={true}
                            transitionEnterTimeout={300}
                            transitionLeaveTimeout={200}>
                            {image && <AvatarCropper cropPopupDismiss={handleCropPopupDismiss}
                                                     croppedImageUpdate={handleCroppedImageUpdate}
                                                     file={image}/>}
                        </ReactCSSTransitionGroup>

                    </div>

                    {
                        !disabled && isGroupMember && canAddMembers &&
                        <div className="add-members" onClick={handleAddMembersPopUpOpen}>
                            <span className="add-members-ico"/>
                            <span className="add-members-btn">{localization.addMembers}</span>
                        </div>
                    }

                    <div className="contacts">
                        <div className="contacts-container">
                            {members}
                        </div>
                    </div>
                </div>

                <div className={`group-profile-content${editing ? " transparent" : ""}`}>

                    <span title={localization.closeGroup} className={"close_btn"} onClick={handleRightPanelToggle}>
                        {localization.close}
                    </span>

                    {!disabled && isGroupMember &&
                    <span className="right_btn" onClick={handleGroupEdit}>{localization.edit}</span>
                    }


                    <div className="image-block">
                        <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                            <Avatar
                                image={threadImage}
                                color={threadInfo.getIn(["color", "numberColor"])}
                                avatarCharacter={threadInfo.get("avatarCharacter")}
                                name={groupName}
                                meta={{threadId}}
                                handleMediaPopUpOpen={handleMediaPopUpOpen}
                                isGroup={true}
                                fontSize={"39px"}
                                iconSize={"62px"}
                                border={"1px solid #F5F5F7"}
                                avatarBlobUrl={avatarBlobUrl || threadInfo.get("avatarBlobUrl")}
                            />
                        </AvatarSize>
                        <span className="group-name"><span onClick={handleGroupEdit}>{groupName}</span></span>
                        <span className="number-of-members">{members && members.size} {localization.members}</span>
                    </div>


                    {
                        !disabled && isGroupMember &&
                        <div className="mute-row" onClick={toggleIsGroupMutePopUp}>
                            <span className="mute-ico"/>
                            <span className="mute-name">{localization.mute}</span>
                            <div className="mute-icons">
                                <span
                                    className="mute-status">{getNotificationStatus()}</span>
                                <span className="mute-ico-next"/>
                            </div>
                        </div>
                    }


                    <div className="shared-media" onClick={handleSharedMediaPanelOpen}>
                        <span className="shared-media-ico"/>
                        <span className="shared-media-btn">{localization.sharedMedia}</span>
                        <div className="shared-media-icons">
                            <span className="shared-media-length">{sharedMediaCount}</span>
                            <span className="shared-media-ico-next"/>
                        </div>
                    </div>


                    {
                        showGroupSettings &&
                        <div className="shared-media" onClick={openGroupSettingsPanel}>
                            <span className="shared-media-ico"/>
                            <span className="shared-media-btn">{localization.groupSettings}</span>
                            <div className="shared-media-icons">
                                <span className="shared-media-length"/>
                                <span className="shared-media-ico-next"/>
                            </div>
                        </div>
                    }

                    {
                        (!disabled && isGroupMember && canAddMembers) &&
                        <div className="add-members" onClick={handleAddMembersPopUpOpen}>
                            <span className="add-members-ico"/>
                            <span className="add-members-btn">{localization.addMembers}</span>
                        </div>
                    }

                    <div className="contacts">
                        <div className="contacts-container">
                            {members}
                        </div>
                    </div>

                    {
                        !disabled && isGroupMember && !groupCallId &&
                        <div className="leave-group" onClick={handleLeaveGroupPopUpOpen}>
                            <span className="leave-group-btn">{localization.leaveGroup}</span>
                        </div>
                    }
                </div>
            </Scrollbars>
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}>

                {/*showDeleteMemberPopUp ? <PopUpMain confirmButton={confirm}
                                                        confirmButtonText={localization.delete}
                                                        cancelButton={cancelDeleteMember}
                                                        cancelButtonText={localization.cancel}
                                                        titleText={localization.deleteMember}
                                                        infoText={localization.deleteGroupText}
                                                        showPopUpLogo={true}/> :*/
                    showLeaveGroupPopUp &&
                    <PopUpMain
                        confirmButton={leaveGroup}
                        confirmButtonText={localization.confirm}
                        cancelButton={cancel}
                        cancelButtonText={localization.cancel}
                        titleText={titleText}
                        infoText={infoText}
                        showPopUpLogo={true}
                        shouldCheckOnPopupApprove={true}
                        checkInfo={localization.checkInfo}
                    />
                }
            </ReactCSSTransitionGroup>
        </div>
    );
};

// const Groupinfo = React.memo(GroupInfoToMemo)
const Groupinfo = GroupInfoToMemo

export default Groupinfo;
