import * as React from "react";
import {IContact} from "modules/contacts/ContactsReducer";
import {getThreadType} from "helpers/DataHelper";
import components from "configs/localization";
import "scss/pages/Header";
import {ButtonItem, ListItem, ContextMenuPopUp, PopUpList} from "components/common/contextmenu/style";
import CallSvg from "../../../assets/components/svg/CallSvg";
import MoreSvg from "../../../assets/components/svg/MoreSvg";
import InfoSvg from "../../../assets/components/svg/InfoSvg";
import VideoCallSvg from "../../../assets/components/svg/VideoCallSvg";
import SearchSvg from "../../../assets/components/svg/SearchSvg";
import {APPLICATION, GROUP_ROLES} from "configs/constants";
import Log from "modules/messages/Log";

interface IHeaderButtonsState {
    isDisabledCallButtons: boolean;
    redialScreenThread: any;
}

interface IHeaderButtonsProps {
    inviteToCall?: (isVideo: boolean, contact: IContact, outCall: boolean) => void;
    handleSearchMessagesPanelOpen: () => void;
    handleBlockContactToggle: () => void;
    handleSharedMediaToggle: () => void;
    toggleContactFavorite: () => void;
    openLeaveGroupPopUp: () => void;
    toggleDeletePopup: () => void;
    isGroupMember: () => boolean;
    toggleMenuPopUp: () => void;
    openCreateGroup: () => void;
    toggleCallOut: () => void;
    openAddMembers: () => void;
    sharedMediaPanel: boolean
    saveContact: () => void;
    selectedInfoThread: any;
    showRightPanel: boolean;
    alreadyInCall: boolean;
    showSearchMessages: boolean;
    showInfo: () => void;
    selectedContact: any;
    menuPopup: boolean
    user: any;
    startConference: () => void;
    showConference: boolean;
    isDisconnected: boolean;
    conferenceId?:string;
    handleAddMembersPopUpOpen: () => void;
    toggleCanNotDoCall?: (canNotDoCall: boolean) => void;
    isRedialScreenShown?: boolean;
}

export default class HeaderButtons extends React.Component<IHeaderButtonsProps, IHeaderButtonsState> {

    menuPopupContainer: any = React.createRef();

    constructor(props: any) {
        super(props);
        this.state = {
            isDisabledCallButtons: false,
            redialScreenThread: null,
        }
    }

    componentDidMount(): void {
        document.addEventListener("click", this.handleOutSideClick);
    }

    componentDidUpdate(prevProps: Readonly<IHeaderButtonsProps>, prevState: Readonly<IHeaderButtonsState>, snapshot?: any) {
        const {selectedInfoThread, isRedialScreenShown} = this.props;
        const {redialScreenThread, isDisabledCallButtons} = this.state;

        if (prevProps.isRedialScreenShown !== isRedialScreenShown && isRedialScreenShown === true) {
            this.setState({redialScreenThread: selectedInfoThread});
        }

        if (!isDisabledCallButtons && prevProps.selectedInfoThread !== selectedInfoThread && isRedialScreenShown) {
            this.setState({isDisabledCallButtons: true});
        }

        if (prevProps.selectedInfoThread !== selectedInfoThread && redialScreenThread === selectedInfoThread && isRedialScreenShown) {
            this.setState({isDisabledCallButtons: false});
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
    }

    handleOutSideClick = (event: any) => {
        const {toggleMenuPopUp, menuPopup} = this.props;
        const moreInfoNode: any = document.getElementById('header-more-info');

        if (menuPopup && this.menuPopupContainer && this.menuPopupContainer.current && !moreInfoNode.contains(event.target) && !this.menuPopupContainer.current.contains(event.target)) {
            toggleMenuPopUp();
        }
    };

    handleShowRightInfo = () => {
        const {showInfo, toggleMenuPopUp} = this.props;
        showInfo();

        // console.log(document.getElementById("chatBackground"), "document");
        // setTimeout(() => {
        //     showInfo();
        //     // toggleMenuPopUp();
        // }, 2000)
    };

    // saveSelectedContact = (): void => {
    //     const {saveContact, toggleMenuPopUp} = this.props;
    //     saveContact();
    //     toggleMenuPopUp();
    // };

    addRemoveFavoriteContact = () => {
        const {toggleContactFavorite} = this.props;
        toggleContactFavorite();
    };

    createGroup = () => {
        const {openCreateGroup, toggleMenuPopUp, showRightPanel, showInfo} = this.props;
        if (!showRightPanel) {
            showInfo();
        }

        openCreateGroup();
        toggleMenuPopUp();
    };

    addGroupMembers = () => {
        const {handleAddMembersPopUpOpen, toggleMenuPopUp} = this.props;
        handleAddMembersPopUpOpen();
        toggleMenuPopUp()
    };

    handleSharedMediaOpen = () => {
        const {showRightPanel, toggleMenuPopUp, showInfo, handleSharedMediaToggle} = this.props;
        if (!showRightPanel) {
            showInfo();
        }
        handleSharedMediaToggle();
        toggleMenuPopUp();
    };

    render(): JSX.Element {
        const {
            toggleMenuPopUp, menuPopup, selectedInfoThread, inviteToCall, handleBlockContactToggle,
            openLeaveGroupPopUp, isGroupMember, user, sharedMediaPanel, handleSearchMessagesPanelOpen,
            showSearchMessages, alreadyInCall, isDisconnected, isRedialScreenShown, showConference, startConference, toggleCanNotDoCall, conferenceId
        } = this.props;
        const {isDisabledCallButtons} = this.state;
        const localization: any = components().contactInfo;
        const {isGroup} = getThreadType(selectedInfoThread.getIn(['threads', 'threadType']));
        const threadId = selectedInfoThread.getIn(['threads', 'threadId']);
        const threadInfo = isGroup ? selectedInfoThread.getIn(['threads', 'threadInfo']) : selectedInfoThread.get('members').first();
        const ownChat: boolean = threadInfo && (threadId === user.get("id"));
        const isProductContact: boolean = !isGroup && threadInfo && threadInfo.get('isProductContact');
        const inviteToVideoCall: any = () => inviteToCall(true, threadInfo, false);
        const inviteToAudioCall: any = () => inviteToCall(false, threadInfo, false);
        const role: any = threadInfo.get("role");
        const allAdmins: any = threadInfo.get("allAdmins");

        const canAddMembers: boolean = (threadInfo.get("memberAddMember") || [GROUP_ROLES.admin, GROUP_ROLES.owner].includes(role)) || allAdmins;

        if (!threadInfo) {
            return null;
        }

        return (
            <div className="header-buttons">
                <ul className="action-buttons">
                    {
                        !selectedInfoThread.isEmpty() && !isGroup && isProductContact && !ownChat &&
                        <li
                            className={`item-icon${(threadInfo.get("blocked") || alreadyInCall || isDisconnected || isDisabledCallButtons) ? " disable" : ""}`}
                            onClick={inviteToAudioCall}
                        >
                            <CallSvg containerWidth="32" containerHeight="32" hoverColor="#88C64A"/>
                            {/*<span className="item-icon-name">{localization.call}</span>*/}
                        </li>
                    }
                    {
                        !selectedInfoThread.isEmpty() && !isGroup && isProductContact && !ownChat &&
                        <li
                            className={`item-icon${(!selectedInfoThread.isEmpty() && threadInfo.get("blocked") || alreadyInCall || isDisconnected || isRedialScreenShown) ? " disable" : ""}`}
                            onClick={inviteToVideoCall}
                        >
                            <VideoCallSvg hoverColor="#4D94FF"/>
                            {/*<span className="item-icon-name">{localization.video}</span>*/}
                        </li>
                    }
                    {
                        (isGroup || isProductContact) &&
                        <li
                            className={`item-icon${showSearchMessages ? " search-active" : ""}`}
                            onClick={handleSearchMessagesPanelOpen}
                        >
                            <SearchSvg hoverColor="#8174FF"/>
                            {/*<span className="item-icon-name">{localization.search}</span>*/}
                        </li>
                    }

                    {/*Conference call start*/}
                    {
                        !selectedInfoThread.isEmpty() && isGroup && (!threadInfo.get("disabled") && isGroupMember) && APPLICATION.WITHCONFERENCE &&
                        <li
                            className={`item-icon${(selectedInfoThread.isEmpty() || (showConference && threadId === conferenceId) || threadInfo.get("callId")) ? " disable" : ""}`}
                            onClick={() => {
                                if (!navigator.onLine) {
                                    return
                                }
                                if (canAddMembers) {
                                    startConference()
                                } else {
                                    toggleCanNotDoCall(true)
                                }
                            }}
                        >
                            <CallSvg containerWidth="32" containerHeight="32" hoverColor="#88C64A" />
                        </li>
                    }

                    <li className="item-icon"
                        onClick={this.handleShowRightInfo}
                    >
                        <InfoSvg hoverColor="#00A2FF"/>
                        {/*<span className="item-icon-name">{localization.info}</span>*/}
                    </li>

                    <li className={`item-icon more-icon${isGroup && !isGroupMember ? " hidden" : ""}`}
                        id="header-more-info"
                        onClick={toggleMenuPopUp}>
                        <MoreSvg/>
                        {/*<span className="item-icon-name">{localization.more}</span>*/}
                    </li>

                    {/*{*/}
                    {/*!selectedInfoThread.isEmpty() && !isGroup && !isChannel &&*/}
                    {/*<li*/}
                    {/*className={`call-icon${!selectedInfoThread.isEmpty() && threadInfo.get("blocked") ? " disable" : ""}`}*/}
                    {/*onClick={inviteToOutCall}*/}
                    {/*>*/}
                    {/*<span className="call-out"/>*/}
                    {/*<span>Search</span>*/}
                    {/*</li>*/}
                    {/*}*/}
                </ul>
                <ContextMenuPopUp menuPopup={menuPopup} ref={this.menuPopupContainer}>
                    <PopUpList>
                        {/*<li className="list-item" onClick={this.handleShowRightInfo}>*/}
                        {/*    <button*/}
                        {/*        className="btn-item">{!showRightPanel ? localization.infoShow : localization.infoHide}</button>*/}
                        {/*</li>*/}
                        {
                            !ownChat && (isProductContact || isGroup) &&
                            <ListItem  onClick={this.handleSharedMediaOpen}>
                                <ButtonItem
                                >{sharedMediaPanel ? localization.hideSharedMedia : localization.showSharedMedia}</ButtonItem>
                            </ListItem>
                        }
                        {
                            false && !isGroup && !ownChat && threadInfo.get("saved") && isProductContact &&
                            <ListItem  onClick={this.createGroup}>
                                <ButtonItem>{localization.createGroup}</ButtonItem>
                            </ListItem>
                        }
                        {
                            false && !isGroup && threadInfo.get("saved") &&
                            <ListItem  onClick={this.addRemoveFavoriteContact}>
                                <ButtonItem>
                                    {!selectedInfoThread.isEmpty() && threadInfo.get("favorite") ? localization.removeFav : localization.addFav}
                                </ButtonItem>
                            </ListItem>
                        }
                        {/*
                            !isGroup && !isChannel && !threadInfo.get("saved") &&
                            <li className="list-item" onClick={this.saveSelectedContact}>
                                <button className="btn-item">{localization.saveContact}</button>
                            </li>
                        */}
                        {
                            !isGroup && !ownChat &&
                            <ListItem  onClick={handleBlockContactToggle}>
                                <ButtonItem>
                                    {!selectedInfoThread.isEmpty() && threadInfo.get("blocked") ? localization.unblock : localization.block}
                                </ButtonItem>
                            </ListItem>
                        }
                        {/*{
                            !isGroup && threadInfo.get("saved") &&
                            <li className="list-item" onClick={toggleDeletePopup}>
                                <button className="btn-item">{localization.deleteContact}</button>
                            </li>
                        }*/}
                        {
                            isGroup && (!threadInfo.get("disabled") && isGroupMember) && canAddMembers &&
                            <ListItem  onClick={this.addGroupMembers}>
                                <ButtonItem>{localization.addMembers}</ButtonItem>
                            </ListItem>
                        }
                        {
                            isGroup && (!threadInfo.get("disabled") && isGroupMember) &&
                            <ListItem onClick={openLeaveGroupPopUp}>
                                <ButtonItem>{localization.leaveGroup}</ButtonItem>
                            </ListItem>
                        }
                    </PopUpList>
                </ContextMenuPopUp>
            </div>
        )
    }
}
