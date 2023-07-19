"use strict";

import * as React from "react";
import {connect} from "react-redux";
import {isEqual} from "lodash";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {attemptUpdateProfile} from "modules/user/UserActions";
import CropAvatarPopUp from "containers/common/CropAvatarPopUp";
import selector, {IStoreProps} from "services/selector";
import PopUpMain from "components/common/PopUpMain";
import {getBlobUri} from "helpers/FileHelper";
import components from "configs/localization";
import {attemptChangeLeftPanel} from "modules/application/ApplicationActions";
import LeftPanelHeader from "components/common/LeftPanelHeader";
import "scss/pages/left-panel/settings/ProfileSettings";
import Avatar from "components/contacts/Avatar";
import SVG from "components/common/SVG";
import {LOADER} from "configs/animation/loader";

interface IProfileState {
    deleteAvatar: boolean;
    firstName: string;
    lastName: string;
    avatar: Blob;
    file: any;
    popup: boolean;
    image: any;
    err: boolean;
    loading: boolean;
}

interface IProfileProps extends IStoreProps {
    attemptUpdateProfile: (user: any, updateUser: any) => void;
    changeLeftPanel: (panel: string) => void;
    setReferral: (referral: string) => void;
    signOut: () => void;
    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    children?: any;
    rightButton?: {
        onClick?: () => void;
        className: string;
        text?: string;
    };
    title?: string;
}

const selectorParams: any = {
    application: {
        app: true
    },
    user: true
};

class Profile extends React.Component<IProfileProps, IProfileState> {
    constructor(props: any) {
        super(props);
        const {user} = this.props;
        this.state = {
            firstName: user && user.get("firstName") || "",
            lastName: user && user.get("lastName") || "",
            avatar: user && user.get("avatar") || null,
            file: null,
            deleteAvatar: false,
            loading: true,
            popup: false,
            image: null,
            err: false
        };
    }

    componentWillReceiveProps(nextProps: IProfileProps) {
        if (!this.props.user.equals(nextProps.user)) {
            const {app, changeLeftPanel} = this.props;

            this.setState({file: null});
            changeLeftPanel(app.previousLeftPanel);
        }
    }

    shouldComponentUpdate(nextProps: IProfileProps, nextState: IProfileState): boolean {
        return !isEqual(this.state, nextState) || !this.props.user.equals(nextProps.user) || this.props.newMessagesCount !== nextProps.newMessagesCount;
    }

    componentDidUpdate(prevProps: IProfileProps, prevState: IProfileState): void {
        const {user} = this.props;

        if (!prevProps.user.equals(user)) {
            this.setState({file: null});
        }
    }

    handleAvatarChange = ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => {
        if (currentTarget.files[0]) {
            this.setState({image: currentTarget.files[0]});
        }
        currentTarget.value = "";
    };

    handleNameChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value) {
            const newState: any = {...this.state};
            newState[name] = value;
            newState.err = false;
            this.setState(newState);
        }
    };

    handleUpdateProfile = (): void => {
        const {firstName, lastName, file} = this.state;
        const {user, attemptUpdateProfile, leftButton} = this.props;

        /*if (!lastName && !firstName) {
            this.setState({err: true});
            return;
        } else {
            if (firstName === user.get("firstName") && lastName === user.get("lastName") && !file) {
                leftButton.onClick();
            }
            else {
                let isAvatarChange: boolean = false;

                if (file && file.original.size > 0 && file.cropped.size > 0) {
                    isAvatarChange = true;
                }

                const userImg = {
                    original: user.get('imageUrl'),
                    cropped: user.get('avatar')
                };
                const updateUser = {
                    firstName: firstName,
                    lastName: lastName,
                    image: file || userImg,
                    isAvatarChange: isAvatarChange,
                    deleted: false
                };

                attemptUpdateProfile(user, updateUser);
            }
        }*/
        if (firstName === user.get("firstName") && lastName === user.get("lastName") && !file) {
            leftButton.onClick();
        }
        else {
            let isAvatarChange: boolean = false;

            if (file && file.original.size > 0 && file.cropped.size > 0) {
                isAvatarChange = true;
            }

            const userImg = {
                original: user.get('imageUrl'),
                cropped: user.get('avatar')
            };
            const updateUser = {
                firstName: firstName,
                lastName: lastName,
                image: file || userImg,
                isAvatarChange: isAvatarChange,
                deleted: false
            };

            attemptUpdateProfile(user, updateUser);
        }

    };

    handleCropClose = (): void => {
        this.setState({image: null});
    };

    handleAvatarUpload = (file: any): void => {
        if (file) {
            this.setState({avatar: file.cropped, file: file, image: null});
        }
    };

    // handleDeleteAvatar = () => {
    //     this.setState({deleteAvatar: true, avatar: null});
    // };

    handleAvatarLoad = (): void => {
        this.setState({loading: false})
    };

    get usernameElement(): JSX.Element {
        const localization: any = components().profilePanel;
        const {firstName, lastName, err} = this.state;

        return <div className="edit-name">
            <input
                type="text"
                name="firstName"
                value={firstName}
                className={`user-name ${err ? 'user-name-err' : ''}`}
                onChange={this.handleNameChange}
                placeholder={localization.firstName}
            />
            <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={this.handleNameChange}
                className="user-lastName"
                placeholder={localization.lastName}
            />
        </div>
    }

    togglePopup = (): void => {
        const {popup} = this.state;
        this.setState({popup: !popup});
    };

    signOut = () => {
        const {signOut} = this.props;
        signOut();
    };

    render() {
        const localization: any = components().profilePanel;
        const {avatar, popup, loading} = this.state;
        const {user, leftButton, rightButton, title} = this.props;
        const profileImage: any = getBlobUri(avatar);
        const threadImage: any = {
            url: "",
            file: avatar,
        };

        return (
            <div className="settings-content">
                <LeftPanelHeader
                    leftButton={leftButton}
                    rightButton={rightButton}
                    title={title}
                    updateProfile={this.handleUpdateProfile}
                    done={localization.done}
                >
                </LeftPanelHeader>
                <div className="">

                    {/*{avatar !== "" && <div className="avatar_delete" onClick={this.handleDeleteAvatar}>{localization.deleteAvatar}</div>}*/}
                    <div className="info-block">
                        <div className="image-block">
                            {/*{
                                avatar ?
                                    <span className="profile-img" style={{backgroundImage: `url(${profileImage})`}}>
                                        {(!avatar && user) && user.get("avatar") && user.get("avatar").size > 0 &&
                                        <span className="icon"/>}

                                        <span className="profile-pic-icon">
                                            <input
                                                accept="image/gif,image/jpeg,image/jpg,image/png"
                                                className="profile-pic-upload"
                                                onChange={this.handleAvatarChange}
                                                id="profPicInput"
                                                multiple={false}
                                                name="avatar"
                                                type="file"
                                            />
                                        </span>
                                    </span>
                                    :
                                    <span className="profile-icon"
                                          style={avatar && avatar.size > 0 ? {backgroundImage: `url(${profileImage})`} : {}}>
                                        {(!avatar && user) && user.get("avatar") && user.get("avatar").size > 0 &&
                                        <span className="icon"/>}

                                    </span>
                            }*/}
                            {loading && avatar &&  <div className="profile-img loader">
                                <SVG
                                    width={60}
                                    height={60}
                                    src={LOADER}
                                    className='lottie-animation'
                                />
                            </div>}
                            <Avatar
                                image={threadImage}
                                color={user.getIn(["color", "avatarColor"])}
                                avatarCharacter={user.get("avatarCharacter")}
                                name={user.get("firstName")}
                                meta={{threadId: user.get("id")}}
                                // handleAvatarLoad={this.handleAvatarLoad}
                                userAvatar={true}
                            />
                            <span className="profile-pic-icon">
                                <input
                                    accept="image/gif,image/jpeg,image/jpg,image/png"
                                    className="profile-pic-upload"
                                    onChange={this.handleAvatarChange}
                                    id="profPicInput"
                                    multiple={false}
                                    name="avatar"
                                    type="file"
                                />
                            </span>
                        </div>
                        <div className="number-block">
                            <div className="name-edit">
                                {this.usernameElement}
                            </div>
                            {/*<div className="phone-number-block">*/}
                                {/*<p className="phone-number">{localization.phoneNumber}</p>*/}
                                {/*<span className="profile-number">+{user && user.get("phone")}</span>*/}
                            {/*</div>*/}
                            {/*<div className="change-password">
                                <p className="pass">{localization.changePassword}</p>
                                <span className="icon-add"/>
                            </div>*/}
                        </div>

                    </div>

                    {/*<div className="sign-out" onClick={this.togglePopup}>*/}
                        {/*<span className="sign-out-btn">{localization.signOut}</span>*/}
                    {/*</div>*/}
                </div>
                {
                    this.state.image && <CropAvatarPopUp
                        image={this.state.image}
                        uploadAvatar={this.handleAvatarUpload}
                        cancel={this.handleCropClose}
                    />
                }

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
                    {
                        popup &&
                        <PopUpMain
                            showPopUpLogo={true}
                            confirmButton={this.signOut}
                            cancelButton={this.togglePopup}
                            confirmButtonText={localization.signOut}
                            cancelButtonText={localization.cancel}
                            titleText={localization.handleSignOut}
                            infoText={localization.sureLeave}
                        />
                    }
                </ReactCSSTransitionGroup>
            </div>
        )
    }

}

const mapStateToProps: any = state => selector(state, selectorParams);
const mapDispatchToProps: any = dispatch => ({
    attemptUpdateProfile: (user, updateUser) => dispatch(attemptUpdateProfile(user, updateUser)),
    signOut: () => undefined,
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
});
export default connect<{}, {}, any>(mapStateToProps, mapDispatchToProps)(Profile);
