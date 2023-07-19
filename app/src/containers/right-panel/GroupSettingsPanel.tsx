"use strict";

import * as React from "react";
import {List} from "immutable";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {v4 as uuid} from "uuid";
import {CHANGE_ROLE_ALL_COMMAND, CHANGE_ROLE_COMMAND} from "xmpp/XMLConstants";
import {GROUP_ROLES, GROUP_SETTINGS_PANEL_TYPE} from "configs/constants";
import GroupMember from "components/contacts/GroupMember";
import {getUserId, getUsername} from "helpers/DataHelper";
import SearchInput from "components/common/SearchInput";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";

import "scss/pages/right-panel/GroupSettingsPanel";
import {
    GroupSettingsLabelTitle, SettingsLabelTitle,
    SettingsListBlock,
    SettingsText,
    SettingsTitle,
    SwitchButton
} from "containers/settings/style";
import {
    Header,
    BackArrow,
    Title,
    Button
} from "containers/right-panel/style";

const back_arrow: any = require("assets/images/back_arrow.svg");

interface IGroupSettingsProps {
    attemptChangeGroupSettings: (id, settingType, members, role, allow, requestId) => void;
    toggleCanNotDeleteGroup: (canNotDeleteGroup: boolean) => void;
    handleGroupSettingsPanelChange: (type) => void;
    attemptRemoveGroup: (id, requestId) => void;
    pendingRequests: any;
    selectedThread: any;
    threadInfo: any;
    threadId: string;
    type: number;
    user: any;
    groupSettingsLocalization:any;
    groupCallId: string;
}

interface IGroupSettingsPanelState {
    showGroupDeletePopup: boolean;
    keyword: string;
}

export default class GroupSettingsPanel extends React.Component<IGroupSettingsProps, IGroupSettingsPanelState> {

    pendingUpdates: any = {};

    currentSettings: string;

    contextMenu: any;

    groupSettingsOptions: any = [
        {
            admins: true,
            key: "allAdmins",
            getValue: (bool: boolean) => bool ?
                this.props.groupSettingsLocalization.allAreAdmins :
                "",
            name:() => this.props.groupSettingsLocalization.admins
        },
        {
            key: "memberEditName",
            getValue: (bool: boolean, allAdmins?: boolean) =>
                allAdmins ?
                    this.props.groupSettingsLocalization.allMembers :
                    bool ?
                        this.props.groupSettingsLocalization.allMembers :
                        this.props.groupSettingsLocalization.onlyAdmins,
            name: () => this.props.groupSettingsLocalization.editGroupName
        },
        {
            key: "memberEditAvatar",
            getValue: (bool: boolean, allAdmins?: boolean) =>
                allAdmins ?
                    this.props.groupSettingsLocalization.allMembers :
                    bool ?
                        this.props.groupSettingsLocalization.allMembers :
                        this.props.groupSettingsLocalization.onlyAdmins,
            name: () => this.props.groupSettingsLocalization.editGroupPhoto
        },
        {
            key: "memberAddMember",
            getValue: (bool: boolean, allAdmins?: boolean) =>
                allAdmins ?
                    this.props.groupSettingsLocalization.allMembers :
                    bool ?
                        this.props.groupSettingsLocalization.allMembers :
                        this.props.groupSettingsLocalization.onlyAdmins,
            name: () => this.props.groupSettingsLocalization.whoCanAddMembers
        }
    ];

    contextMenuOptions: Array<any> = [
        {name: () => this.props.groupSettingsLocalization.allMembers, value: true},
        {name: () => this.props.groupSettingsLocalization.onlyAdmins, value: false}
    ];

    constructor(props) {
        super(props);
        this.state = {
            showGroupDeletePopup: false,
            keyword: ""
        };
    }

    closeGroupSettingsPanel = () => {
        const {handleGroupSettingsPanelChange} = this.props;
        handleGroupSettingsPanelChange(GROUP_SETTINGS_PANEL_TYPE.closed)
    };

    openAdminsPanel = () => {
        const {handleGroupSettingsPanelChange} = this.props;
        handleGroupSettingsPanelChange(GROUP_SETTINGS_PANEL_TYPE.admins)
    };

    openMainPanel = () => {
        const {handleGroupSettingsPanelChange} = this.props;
        handleGroupSettingsPanelChange(GROUP_SETTINGS_PANEL_TYPE.main)
    };

    handleDeleteGroup = () => {
        const {attemptRemoveGroup, threadId} = this.props;
        const requestId: string = `msgId${Date.now()}`;
        this.pendingUpdates["deleteRoom"] = requestId;
        attemptRemoveGroup(threadId, requestId);
    };

    searchInputChange = ({currentTarget: {value, name}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value.trim()) {
            const newState: IGroupSettingsPanelState = {...this.state};
            newState[name] = value.trim().toLowerCase();
            this.setState(newState);
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("group-settings-group-search") as HTMLInputElement).value = "";
    };

    updateGroupSettings = (value: boolean) => {
        const {attemptChangeGroupSettings, threadId} = this.props;
        const requestId: string = `msgId${Date.now()}`;
        this.pendingUpdates[this.currentSettings] = requestId;
        attemptChangeGroupSettings(threadId, this.currentSettings, "", "", value, requestId);

        this.currentSettings = "";
    };

    handleAllAdminsChange = (event) => {
        const {currentTarget: {checked}} = event;
        const {attemptChangeGroupSettings, threadId} = this.props;
        const requestId: string = `msgId${Date.now()}`;
        const key: string = CHANGE_ROLE_ALL_COMMAND;
        this.pendingUpdates["allAdmins"] = requestId;

        attemptChangeGroupSettings(threadId, key, "", checked ? "2" : "3", "", requestId);

        this.setState({keyword: ""})
    };

    handleChangeRole = (event, contactId) => {
        const {currentTarget: {checked}} = event;
        const {attemptChangeGroupSettings, threadId} = this.props;
        const requestId: string = `msgId${Date.now()}`;
        const key: string = CHANGE_ROLE_COMMAND;
        this.pendingUpdates[contactId] = requestId;

        attemptChangeGroupSettings(threadId, key, getUsername(contactId), checked ? "2" : "3", "", requestId);
    };

    toggleGroupDeletePopup = () => {
        const {toggleCanNotDeleteGroup, groupCallId} = this.props
        const {showGroupDeletePopup} = this.state;

        if (groupCallId) {
            toggleCanNotDeleteGroup(true)
        } else {
            this.setState({
                showGroupDeletePopup: !showGroupDeletePopup
            })
        }
    };

    handleDocumentClick = (event: MouseEvent) => {
        if (!(event.target as any).contains(this.contextMenu) && this.contextMenu && this.contextMenu.style.display === "block") {
            this.contextMenu.style.display = "none";
        }
    };

    showOptions = (event: React.MouseEvent, key) => {
        this.currentSettings = key;
        document.removeEventListener("click", this.handleDocumentClick);
        event.preventDefault();
        event.stopPropagation();
        const rootH: number = this.contextMenu.offsetHeight !== 0 ? this.contextMenu.offsetHeight : 74;
        const rootW: number = this.contextMenu.offsetWidth !== 0 ? this.contextMenu.offsetWidth : 119;
        const screenH: number = window.innerHeight;
        const screenW: number = window.innerWidth;
        const clickX: number = event.clientX;
        const clickY: number = event.clientY;

        const right: boolean = (screenW - clickX) > rootW;
        const top: boolean = (screenH - clickY) > rootH;
        const bottom: boolean = !top;
        const left: boolean = !right;

        if (right) {
            this.contextMenu.style.left = `${clickX + 5}px`;
        }

        if (left) {
            this.contextMenu.style.left = `${clickX - rootW - 5}px`;
        }

        if (top) {
            this.contextMenu.style.top = `${clickY + 5}px`;
        }

        if (bottom) {
            this.contextMenu.style.top = `${clickY - rootH - 5}px`;
        }

        this.contextMenu.style.display = "block";
        document.addEventListener("click", this.handleDocumentClick);
    };

    get isMainPanel(): boolean {
        const {type} = this.props;
        return type === GROUP_SETTINGS_PANEL_TYPE.main;
    }

    get title() {
        const {title, admins} = this.props.groupSettingsLocalization;
        return this.isMainPanel ? title : admins;
    }

    get back() {
        return this.isMainPanel ? this.closeGroupSettingsPanel : this.openMainPanel;
    }

    get header() {
        return (
            <Header>
                <BackArrow onClick={this.back} src={back_arrow} alt={"back"}/>
                <Title>{this.title}</Title>
                <Button/>
            </Header>
        );
    }

    get groupMembers() {
        const {selectedThread, user, pendingRequests, threadInfo} = this.props;
        const {keyword} = this.state;
        const {creator, you, chatMembers} = this.props.groupSettingsLocalization;
        const members = selectedThread.get("members");
        const ownerList: List<string> = threadInfo.get("ownerList");
        const ownerNumber: any = ownerList.get(0);
        const ownerId: string = getUserId(ownerNumber);
        const userId: string = user.get("id");
        const adminList: string[] = threadInfo.get("adminList");
        const userIsOwner: boolean = userId === ownerId;
        const searchClearButton: boolean = keyword && keyword !== "";

        return <React.Fragment>
            <div className="group-creator">
                <GroupMember
                    key={ownerId}
                    disabled={true}
                    text={creator}
                    memberData={userIsOwner ? user : members.get(ownerId)}
                />
                {
                    !userIsOwner &&
                    <GroupMember
                        isUser={true}
                        disabled={true}
                        text={you}
                        key={userId}
                        memberData={user}
                    />
                }
            </div>
            <div className="option-description">
                <p>{chatMembers}</p>
            </div>
            <SearchInput onChange={this.searchInputChange}
                         name="keyword"
                         newId={true}
                         searchId="group-settings-group-search"
                         iconClassName="hidden"
                         handleSearchClear={this.handleSearchClear}
                         clearButton={searchClearButton}/>
            <div className="group-members">
                {members.valueSeq().map(member => {
                    const contactId: string = member.get("contactId");
                    const name: string = member.get("name");
                    const phone: string = member.get("phone");
                    const loading: boolean = !!(Object.keys(this.pendingUpdates).length > 0 && pendingRequests && pendingRequests.get(this.pendingUpdates[contactId]));

                    return ![ownerId, userId].includes(contactId) && (name && name.toLowerCase().includes(keyword) || phone.includes(keyword)) &&
                        <GroupMember loading={loading} loader={GroupSettingsPanel.loader}
                                     handleChangeRole={this.handleChangeRole} adminList={adminList} key={contactId}
                                     memberData={member}/>
                })}
            </div>
        </React.Fragment>;
    }

    get adminsPanel() {
        const {pendingRequests, threadInfo} = this.props;
        const {onlyAdminsDescription, allMembersAreAdmins} = this.props.groupSettingsLocalization;
        const key: string = "allAdmins";
        const allAdmins: boolean = threadInfo.get(key);
        const loading: boolean = !!(Object.keys(this.pendingUpdates).length > 0 && pendingRequests && pendingRequests.get(this.pendingUpdates[key]));

        return <React.Fragment>
            <SettingsListBlock cursor={"pointer"}>
                <SettingsTitle>{allMembersAreAdmins}</SettingsTitle>
                {loading && GroupSettingsPanel.loader}
                <SwitchButton>
                    <input
                        disabled={loading}
                        type="checkbox"
                        name="showPreview"
                        onChange={this.handleAllAdminsChange}
                        data-path="notification"
                        checked={allAdmins}
                    />
                    <span className="slider"/>
                </SwitchButton>
            </SettingsListBlock>
            <SettingsText>{onlyAdminsDescription}</SettingsText>
            {!allAdmins && this.groupMembers}
        </React.Fragment>;
    }

    static get loader() {
        return (<div className="loader">
            <div className="circular-loader">
                <div className="loader-stroke">
                    <div className="loader-stroke-left"/>
                    <div className="loader-stroke-right"/>
                </div>
            </div>
        </div>);
    }

    get mainPanel() {
        const {deleteGroup} = this.props.groupSettingsLocalization;
        const {pendingRequests, threadInfo} = this.props;
        const allAdmins: boolean = threadInfo.get("allAdmins");
        const adminListSize: number = threadInfo.get("adminList").size + 1;
        const role: number = threadInfo.get("role");
        const isOwner: boolean = GROUP_ROLES.owner === role;

        return <React.Fragment>
            {this.groupSettingsOptions.map(option => {
                const {key, getValue, admins, name} = option;
                const value: string = getValue(threadInfo.get(key), allAdmins);
                const loading: boolean = !!(Object.keys(this.pendingUpdates).length > 0 && pendingRequests && pendingRequests.get(this.pendingUpdates[key]));

                return (
                    <SettingsListBlock key={uuid()}
                                       cursor={(allAdmins && admins || !allAdmins)  ? "pointer" : "default"}
                                       onClick={(event) => admins ? this.openAdminsPanel() : allAdmins || loading ? null : this.showOptions(event, key)}>
                        <SettingsTitle>{name()}</SettingsTitle>
                        <GroupSettingsLabelTitle>
                            <span className="setting-option">{admins && !allAdmins ? adminListSize : loading ? GroupSettingsPanel.loader : value}</span>
                        </GroupSettingsLabelTitle>
                    </SettingsListBlock>
                )
            })}
            {isOwner &&
            <>
                <SettingsLabelTitle/>
                <SettingsListBlock cursor={"pointer"}>
                    <SettingsTitle color="#E92E28" onClick={this.toggleGroupDeletePopup}>{deleteGroup}</SettingsTitle>
                </SettingsListBlock>
            </>}
        </React.Fragment>;
    }

    get content() {
        return this.isMainPanel ? this.mainPanel : this.adminsPanel;
    }

    get groupDeletePopup() {
        const {showGroupDeletePopup} = this.state;
        const {confirm, cancel, deleteGroupText, deleteGroup} = this.props.groupSettingsLocalization;

        return (
            <ReactCSSTransitionGroup
                transitionName={{enter: 'open', leave: 'close'}}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}>
                {showGroupDeletePopup &&
                <PopUpMain
                    showPopUpLogo={true}
                    confirmButton={this.handleDeleteGroup}
                    confirmButtonText={confirm}

                    cancelButton={this.toggleGroupDeletePopup}
                    cancelButtonText={cancel}

                    titleText={deleteGroup}
                    infoText={deleteGroupText}
                />}
            </ReactCSSTransitionGroup>
        );
    }

    get options() {

        return <div className="contextMenu" ref={ref => this.contextMenu = ref}>
            {this.contextMenuOptions.map(option => {
                return (<div className="contextMenu--option" key={option.name}
                             onClick={() => this.updateGroupSettings(option.value)}>{option.name()}</div>)
              }

            )}
        </div>
    }

    render() {
        return (
            <div className="group-st-pn">
                {this.header}
                <div className="group-st-pn-content">
                    {this.content}
                    {this.options}
                    {this.groupDeletePopup}
                </div>
            </div>
        )
    }
}
