"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {getDeepLink} from "requests/getDeepLink";

import {APPLICATION} from "configs/constants";
import {
    SettingsLabelTitle,
    SettingsListBlock,
    SettingsText,
    SettingsTitle,
    UserNumber,
    CopyUserNumberIcon,
    SettingsAccountListBlock,
    SettingsNumberContainer,
    SettingsSmallText,
    AppNumber,
    SettingsPasswordText,
    SettingsAccountText
} from "containers/settings/style";
import {SET_PASSWORD, SIGN_OUT, UPDATE_PROFILE} from "modules/user/UserActions";
import AvatarCropper from "components/common/AvatarCropper";
import selector, {IStoreProps} from "services/selector";
import {getBalance} from "requests/settingsRequest";
import PopUpMain from "components/common/PopUpMain";
import Password from "components/settings/Password";
import {getBlobUri} from "helpers/FileHelper";
import components from "configs/localization";
import {selectElementText} from "helpers/DomHelper";

import "scss/pages/left-panel/settings/ProfileSettings.scss";
import TooltipText from "components/common/tooltip/TooltipText";
import Log from "modules/messages/Log";
import {phoneMask} from "helpers/UIHelper";
import {call} from "redux-saga/effects";

const share: any = require("assets/images/share.svg");
const copy: any = require("assets/images/copy.svg");

interface IAccountState {
    currencyCode: string;
    balanceSet: boolean;
    firstName: string;
    lastName: string;
    balance: number;
    avatar: Blob;
    isSignOutPopUpShown: boolean;
    file: any;
    image: any;
    isNameError: any;
    avatarURI: string;
    isEditableModeOn: boolean;
    isSetPasswordPageShown: boolean;
    isPasswordSet: boolean;
    isAvatarDeleted: boolean;
    copyUserNumberIconProps: any;
    shareIconProps: any;
}

interface IAccountProps extends IStoreProps {
    changeLeftPanel: (panel: string) => void;
    setReferral: (referral: string) => void;
    handleNodeDelete: () => void;
    showProfilePopUp: boolean;
    SIGN_OUT: (shouldDeleteHistory: boolean) => void;
    SET_PASSWORD: (password: string) => void;
    UPDATE_PROFILE: (profile: { firstName?: string, lastName?: string, avatar?: Blob, imageUrl: Blob | File, isAvatarDeleted?: boolean, isAvatarChanged: boolean }) => void;
}

const selectorParams: any = {
    application: {
        app: true
    },
    user: true
};

class Account extends React.Component<IAccountProps, IAccountState> {

    // startTimer: any
    // countDown: any
    constructor(props: any) {
        super(props);

        const {user} = this.props;

        this.state = {
            firstName: user && user.get("firstName") || "",
            lastName: user && user.get("lastName") || "",
            avatar: user && user.get("avatar") || null,
            balanceSet: false,
            currencyCode: "",
            isSignOutPopUpShown: false,
            file: null,
            image: null,
            balance: 0,
            isNameError: {
                firstName: false,
                lastName: false,
            },
            avatarURI: "",
            isEditableModeOn: false,
            isSetPasswordPageShown: false,
            isPasswordSet: user && user.get("isPasswordSet"),
            isAvatarDeleted: false,
            copyUserNumberIconProps: {
                scale: 1,
            },
            shareIconProps: {
                scale: 1,
            },
        };


    }

    isComponentMounted: boolean = true;
    userNumberRef: any = React.createRef();



    componentDidMount() {
        const {avatar} = this.state;
        this.setState({avatarURI: getBlobUri(avatar)});
        this.setBalance();
    }



    componentWillReceiveProps(nextProps) {
        const {user} = this.props;
        const {isAvatarDeleted} = this.state;

        if (nextProps.user && nextProps.user.size > 0 && !user.equals(nextProps.user) && !isAvatarDeleted) {
            this.setState({
                firstName: nextProps.user && nextProps.user.get("firstName") || "",
                lastName: nextProps.user && nextProps.user.get("lastName") || "",
            })
        }
    }


    shouldComponentUpdate(nextProps: IAccountProps, nextState: IAccountState): boolean {
        return !isEqual(this.state, nextState) ||
            !this.props.user.equals(nextProps.user) ||
            this.props.showProfilePopUp !== nextProps.showProfilePopUp;
    }

    componentDidUpdate(prevProps: IAccountProps, prevState: IAccountState): void {
        const {user, showProfilePopUp} = this.props;
        const {balanceSet} = this.state;

        if (!balanceSet && navigator.onLine) {
            this.setBalance();
        }

        if (!isEqual(prevProps.user, this.props.user) || (!showProfilePopUp && showProfilePopUp !== undefined)) {
            this.setState({avatar: user && user.get("avatar")});
        }
    }

    componentWillUnmount(): void {
        this.isComponentMounted = false;
    }

    setBalance = async () => {
        const {data: {body}} = await getBalance();
        if (body) {
            const balance: number = body.balance.toFixed(2) || 0;
            const currency: string = body.currencyCode || "";
            if (this.isComponentMounted) {
                this.setState({
                    balance: balance,
                    currencyCode: currency,
                    balanceSet: true
                });
            }
        }
    };


    handleUpdateProfile = () => {
        let {firstName, lastName, isAvatarDeleted} = this.state;
        const {file} = this.state;
        const {user, UPDATE_PROFILE} = this.props;

        firstName = firstName.replace(/\s+/g, ' ').trim();
        lastName = lastName.replace(/\s+/g, ' ').trim();

        if ((!firstName) && user.get("email")) {
            if (firstName) {
                this.setState({isNameError: {lastName: true, firstName: false}, lastName: ""});
            } else if (lastName && !firstName) {
                this.setState({isNameError: {lastName: false, firstName: true}, firstName: ""});
            } else {
                this.setState({isNameError: {lastName: true, firstName: true}, lastName: ""});
            }
            return;
        } else {
            if (firstName === user.get("firstName") && lastName === user.get("lastName") && (!file && !isAvatarDeleted)) {
                this.setState({isEditableModeOn: false, firstName, lastName});
                return;
            } else {
                let isAvatarChanged: boolean = false;
                this.setState({isEditableModeOn: false});

                if (file && file.original.size > 0 && file.cropped.size > 0) {
                    isAvatarChanged = true;
                }

                const userImg = {
                    original: user.get("imageUrl"),
                    cropped: user.get("avatar")
                };

                const updateUser = {
                    firstName,
                    lastName,
                    imageUrl: isAvatarChanged ? file.original : userImg.original,
                    avatar: isAvatarChanged ? file.cropped : userImg.cropped,
                    isAvatarChanged,
                    isAvatarDeleted
                };

                UPDATE_PROFILE(updateUser);

                this.setState({
                    file: null,
                    lastName,
                    firstName
                });
            }
        }
    };

    handleAvatarChange = ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => {
        if (currentTarget.files[0]) {
            this.setState({image: currentTarget.files[0]});
        }
        currentTarget.value = "";
    };

    handleNameChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {user} = this.props;
        const newState: any = {...this.state};
        newState[name] = value;

        if (user.get("email")) {
            newState.isNameError = {
                firstName: name === 'firstName' && value === '',

            }
        }
        this.setState(newState);
    };

    handleDeleteAvatar = (): void => {
        this.setState({
            avatarURI: "",
            avatar: null,
            file: null,
            image: null,
            isAvatarDeleted: true
        });
    };

    handleSignOutPopupToggle = (pset=false): void => {
        const {isSignOutPopUpShown} = this.state;
        this.setState({isSignOutPopUpShown: !isSignOutPopUpShown});

        if(pset) {
            this.handleSetPasswordPageShow()
        }
    };

    handleSignOut = (shouldDeleteHistory: boolean): void => {
        const {SIGN_OUT} = this.props;
        SIGN_OUT(shouldDeleteHistory);
    };

    get fullName(): string {
        const {user} = this.props;

        if (!user.isEmpty()) {
            return user.get("fullName").trim();
        }
    }

    get enableClickForInput(): boolean {
        return this.fullName === "";
    }

    handleEditableModeOn = (): void => {
        this.setState({isEditableModeOn: true, isAvatarDeleted: false});
    };

    handleSetPasswordPageShow = (): void => {
        this.setState({isSetPasswordPageShown: true});
    };

    handleSetPasswordPageHide = (e: React.MouseEvent<HTMLDivElement>, isPasswordSet: boolean = false): void => {
        const newState: IAccountState = {...this.state};
        newState.isSetPasswordPageShown = false;
        if (isPasswordSet) {
            newState.isPasswordSet = isPasswordSet
        }
        this.setState(newState);
    };

    handleCancel = (): void => {
        const {user} = this.props;
        const {file, isAvatarDeleted} = this.state;
        const newState: IAccountState = {...this.state};

        newState.isEditableModeOn = false;
        newState.firstName = user && user.get("firstName") || "";
        newState.lastName = user && user.get("lastName") || "";
        newState.image = null;

        if (file || isAvatarDeleted) {
            const avatar: any = user && user.get("avatar") || null;
            newState.file = null;
            newState.avatar = avatar;
            newState.avatarURI = getBlobUri(avatar);
        }

        this.setState(newState);
    };

    handleCropPopupDismiss = () => {
        this.setState({
            image: null,
        })
    };

    handleCroppedImageUpdate = async (croppedFile: any) => {

        const {firstName, lastName, isEditableModeOn} = this.state;

        const {UPDATE_PROFILE} = this.props;

        const uploadedAvatar = {
            original: croppedFile && croppedFile.image,
            cropped: croppedFile && croppedFile.avatar
        };

        if (croppedFile && croppedFile.avatar) {
            this.setState({
                avatar: croppedFile.avatar,
                avatarURI: getBlobUri(croppedFile.avatar),
                file: uploadedAvatar,
                image: null,
            });
        }

        if (!isEditableModeOn) {
            const updateUser = {
                firstName,
                lastName,
                imageUrl: uploadedAvatar.original,
                avatar: uploadedAvatar.cropped,
                isAvatarChanged: true,
                isAvatarDeleted: false
            };

            UPDATE_PROFILE(updateUser);
        }
    };

    handleCopyUserNumber = (): void => {
        const selectedText = window.getSelection()?.getRangeAt(0)?.toString() || "";

        if (this.userNumberRef?.current && selectedText.length === 0) {
            this.setState({copyUserNumberIconProps: {...this.state.copyUserNumberIconProps, scale: 1.2}});
            setTimeout(() => {
                this.setState({copyUserNumberIconProps: {...this.state.copyUserNumberIconProps, scale: 1}});
            }, 100);

            selectElementText(this.userNumberRef.current);
            document.execCommand('copy');
        }
    }

    handleShareIconClick = async (): Promise<any> => {
        const {data} = await getDeepLink()
        Log.i("handleShareIconClick", data)
        if (data.status === "SUCCESS") {
            const deepLink = data.body
            localStorage.setItem("deepLink", deepLink)

            this.setState({shareIconProps: {...this.state.shareIconProps, scale: 1.2}});
            setTimeout(() => {
                this.setState({shareIconProps: {...this.state.shareIconProps, scale: 1}});
            }, 100);
        }
    }

    get popup(): JSX.Element {
        const {isSignOutPopUpShown, image, isPasswordSet} = this.state;
        const localization: any = components().profilePanel;

        return (
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
                {
                    image &&
                    <AvatarCropper cropPopupDismiss={this.handleCropPopupDismiss}
                                   croppedImageUpdate={this.handleCroppedImageUpdate}
                                   file={image}/>}


                {
                    isSignOutPopUpShown &&
                    <PopUpMain
                        showPopUpLogo={true}
                        confirmButton={this.handleSignOut}
                        confirmButtonText={isPasswordSet ? localization.signOut : localization.continueToSignOut}
                        cancelButton={() => isPasswordSet ? this.handleSignOutPopupToggle() : this.handleSignOutPopupToggle(!isPasswordSet)}
                        cancelButtonP={() => this.handleSignOutPopupToggle()}
                        cancelButtonText={isPasswordSet ? localization.cancel : localization.setYourPassword}
                        titleText={localization.signOut}
                        infoText={isPasswordSet ? localization.sureLeave : localization.leaveWithoutPasswordText}
                        checkInfo={localization.checkInfo}
                        shouldCheckOnPopupApprove={true}
                        isPasswordSet={isPasswordSet}
                        account={true}
                    />
                }
            </ReactCSSTransitionGroup>
        )
    }

    render(): JSX.Element {
        const localization: any = components().profilePanel;
        const localization2: any = components().contactForm;
        const localization3: any = components().inviteNumber;

        const {avatar, firstName, lastName, avatarURI, isEditableModeOn, isNameError, isSetPasswordPageShown, isPasswordSet, copyUserNumberIconProps, shareIconProps} = this.state;
        const {user, SET_PASSWORD} = this.props;
        const nameType: string = APPLICATION.WITHEMAIL ? "email" : "username"
        const userNumber: string = user && !user.isEmpty() && (user.get(nameType) || `+${user.get("phone")}`);
        const fullName = `${firstName} ${lastName}`;


        return (
            <div className="profile-popup-content">
                {
                    isSetPasswordPageShown &&
                    <Password
                        handleSetPasswordPageHide={this.handleSetPasswordPageHide}
                        isPasswordSet={isPasswordSet}
                        actions={
                            {SET_PASSWORD}
                        }
                    />
                }
                {
                    !isSetPasswordPageShown &&
                    <div className="profile-main-block">
                        {
                            <div
                                className={`edit-btn${isEditableModeOn ? " transparent" : ""}`}
                                onClick={this.handleEditableModeOn}
                            >{localization.edit}</div>
                        }

                        {
                            <div
                                className={`done-btn${!isEditableModeOn ? " transparent" : ""}`}
                                onClick={this.handleUpdateProfile}
                            >{localization.done}</div>
                        }

                        {
                            <div
                                className={`cancel-btn${!isEditableModeOn ? " transparent" : ""}`}
                                onClick={this.handleCancel}
                            >{localization.cancel}</div>
                        }

                        {
                            <div className={`info-block${isEditableModeOn ? " transparent" : ""}`}>
                                <div className="image-block">
                                    <div className="profile-img-block">
                                        {
                                            <span className={`profile-img${!avatarURI ? " default-avatar" : ""}`}
                                                  style={{backgroundImage: `url(${avatarURI})`}}>

                                        <span id="profile-pic-icon" className='profile-pic-icon'>
                                            <input
                                                accept="image/gif,image/jpeg,image/jpg,image/png"
                                                className="profile-pic-upload"
                                                onChange={this.handleAvatarChange}
                                                id="profPicInput"
                                                multiple={false}
                                                name="avatar"
                                                type="file"
                                                title=''
                                            />
                                        </span>
                            </span>
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="profile-name">
                                <span
                                    id="profile-name"
                                    className='profile-name-pointer'
                                    onClick={this.handleEditableModeOn}
                                >{fullName}</span>
                                    </div>

                                    <div>
                                        <SettingsLabelTitle/>
                                        <SettingsAccountListBlock id="user-contact">
                                            <SettingsNumberContainer>
                                                <SettingsSmallText>{`${!APPLICATION.WITHEMAIL ? localization2.userNumber : user.get("email") ? localization.email : localization.phoneNumber}`}</SettingsSmallText>
                                                <AppNumber
                                                    onClick={this.handleCopyUserNumber}
                                                    cursor="pointer"
                                                    selectionMode={true}
                                                    user_select="auto"
                                                    ref={this.userNumberRef}>
                                                    {phoneMask(userNumber)}
                                                </AppNumber>
                                            </SettingsNumberContainer>
                                            <UserNumber>
                                                <TooltipText content="copy" styles="left: -3px;">
                                                    <CopyUserNumberIcon {...copyUserNumberIconProps} onClick={this.handleCopyUserNumber}>
                                                        <img className="copy-icon" src={copy} alt=""/>
                                                    </CopyUserNumberIcon>
                                                </TooltipText>

                                                <div
                                                  style={{
                                                      cursor: "pointer",
                                                      userSelect: "none",
                                                      transform: `scale(${shareIconProps.scale})`,
                                                  }}
                                                    /*@ts-ignore ex*/
                                                  href="#mailgo"
                                                  data-address=""
                                                  data-domain=""
                                                  data-subject=""
                                                  data-body={APPLICATION.BRANDURL ? localization3.description2 : `${localization3.description} ${localStorage.getItem("deepLink")}`}
                                                  onClick={this.handleShareIconClick}
                                                >
                                                    <TooltipText content="share" styles="left: -9px;">
                                                        <img className="share-icon selectable-text" src={share} alt=""/>
                                                    </TooltipText>
                                                </div>
                                            </UserNumber>
                                        </SettingsAccountListBlock>
                                        <SettingsAccountListBlock
                                            cursor='pointer'
                                            id="password"
                                            onClick={this.handleSetPasswordPageShow}
                                            style={{
                                                marginTop: "8px",
                                                height: "33px"
                                            }}
                                        >
                                            <SettingsPasswordText cursor="pointer">
                                                {isPasswordSet ? localization.changePassword : localization.setPassword}
                                            </SettingsPasswordText>
                                        </SettingsAccountListBlock>
                                        <SettingsAccountText userSelect="none">
                                            {isPasswordSet ? localization.changePasswordInfo : localization.setPasswordInfo}
                                        </SettingsAccountText>
                                        <SettingsLabelTitle/>
                                        <SettingsAccountListBlock
                                            cursor="pointer"
                                            id="sign-out"
                                            onClick={() => this.handleSignOutPopupToggle()}
                                            style={{
                                                height: "33px"
                                            }}
                                        >
                                            <SettingsPasswordText cursor="pointer">
                                                {localization.signOut}
                                            </SettingsPasswordText>
                                        </SettingsAccountListBlock>
                                    </div>

                                </div>
                            </div>
                        }

                        {
                            <div className={`info-block${!isEditableModeOn ? " transparent" : ""}`}>
                                <div className="image-block">
                                    <div className="profile-img-block">
                                    <span className={`profile-img${!avatarURI ? " default-avatar" : ""}`}
                                          style={avatarURI ? {backgroundImage: `url(${avatarURI})`} : {}}>
                                        <span
                                            className={`profile-pic-icon profile-pic-icon-edit`}>
                                            <input
                                                accept="image/gif,image/jpeg,image/jpg,image/png"
                                                className="profile-pic-upload"
                                                onChange={this.handleAvatarChange}
                                                id="profPicInput"
                                                multiple={false}
                                                name="avatar"
                                                type="file"
                                                title=''
                                            />
                                        </span>
                            </span>

                                    </div>
                                </div>
                                <div className='editable'>
                                    <div className="profile-name">
                                <span
                                    id="profile-name"
                                    className='profile-name-pointer'
                                    onClick={this.handleEditableModeOn}
                                >
                                {this.enableClickForInput ? localization.enterYourName : fullName}</span>
                                    </div>

                                    <div>
                                        <div className={"edit-photo"}>
                                            <div className={`choose-photo`}>
                                                <span className="">{localization.choosePhoto}</span>
                                                <input
                                                    accept="image/gif,image/jpeg,image/jpg,image/png"
                                                    className="file-input"
                                                    onChange={this.handleAvatarChange}
                                                    multiple={false}
                                                    name="avatar"
                                                    type="file"
                                                    title=''
                                                />
                                            </div>

                                            {avatar &&
                                            <div
                                                className={"delete-photo"}
                                                onClick={this.handleDeleteAvatar}>
                                                {localization.deletePhoto}
                                            </div>}
                                        </div>

                                        <div className="edit-name">
                                            <input
                                                id="first_name_popup"
                                                type="text"
                                                name="firstName"
                                                value={firstName}
                                                className={`user-first-name ${isNameError.firstName ? 'user-name-err' : ''}`}
                                                onChange={this.handleNameChange}
                                                placeholder={localization.firstName}
                                                autoComplete="off"
                                                autoFocus={true}
                                                title=''
                                            />
                                            <input
                                                id="last_name_popup"
                                                type="text"
                                                name="lastName"
                                                value={lastName}
                                                onChange={this.handleNameChange}
                                                className={`user-last-name ${isNameError.lastName ? 'user-name-err' : ''}`}
                                                placeholder={localization.lastName}
                                                autoComplete="off"
                                                title=''

                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }

                    </div>
                }

                {/*Popup contents*/}
                {this.popup}
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorParams);

const mapDispatchToProps: any = dispatch => ({
    SIGN_OUT: (deleteHistory: boolean) => dispatch(SIGN_OUT(deleteHistory)),
    UPDATE_PROFILE: (profile: { firstName?: string, lastName?: string, avatar?: Blob, imageUrl: Blob, isAvatarDeleted?: boolean, isAvatarChanged: boolean }) => dispatch(UPDATE_PROFILE(profile)),
    SET_PASSWORD: (password: string) => dispatch(SET_PASSWORD(password)),
});

export default connect<{}, {}, any>(mapStateToProps, mapDispatchToProps)(Account);
