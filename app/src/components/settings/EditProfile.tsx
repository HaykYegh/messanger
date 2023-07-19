"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {attemptUpdateProfile} from "modules/user/UserActions";
import CropAvatarPopUp from "containers/common/CropAvatarPopUp";
import selector, {IStoreProps} from "services/selector";
import {LOADER} from "configs/animation/loader";
import Avatar from "components/contacts/Avatar";
import {getBlobUri} from "helpers/FileHelper";
import components from "configs/localization";
import SVG from "components/common/SVG";

import "scss/pages/left-panel/settings/EditProfile.scss";

interface IProfileState {
    deleteAvatar: boolean;
    firstName: string;
    lastName: string;
    avatar: Blob;
    file: any;
    image: any;
    isError: any;
    isLoading: boolean;
    avatarURI: string;
    isSaveLoading: boolean;
    isDisabled: boolean;
    isSaveFinished: boolean;
    isAvatarLoading: boolean
}

interface IProfileProps extends IStoreProps {
    attemptUpdateProfile: (user: any, updateUser: any) => void;
    goBack?: () => void;
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
            isLoading: true,
            image: null,
            isError: {
                firstName: false,
                lastName: false,
            },
            avatarURI: "",
            isSaveLoading: false,
            isDisabled: true,
            isSaveFinished: false,
            isAvatarLoading: false
        }
    }

    componentDidMount(): void {
        const {avatar} = this.state;
        this.setState({avatarURI: getBlobUri(avatar)})
    }


    componentWillReceiveProps(nextProps) {
        const {user} = this.props;

        if (nextProps.user && nextProps.user.size > 0 && !user.equals(nextProps.user)) {
            this.setState({
                firstName: nextProps.user && nextProps.user.get("firstName") || "",
                lastName: nextProps.user && nextProps.user.get("lastName") || ""
            })
        }
    }

    shouldComponentUpdate(nextProps: IProfileProps, nextState: IProfileState): boolean {
        return !isEqual(this.state, nextState) ||
            !this.props.user.equals(nextProps.user);
    }

    componentDidUpdate(prevProps: IProfileProps, prevState: IProfileState): void {

        if (!this.props.user.equals(prevProps.user)) {
            if (this.state.isAvatarLoading) {
                this.handleAvatarLoaderChange();
                this.setState({isSaveFinished: false, isSaveLoading: false, isDisabled: true});
                return;
            }
            this.setState({isSaveFinished: true, isSaveLoading: false, isDisabled: true});
        }

        const {user} = this.props;
        if (!prevProps.user.equals(user)) {
            this.setState({avatar: user && user.get("avatar")});
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
            newState.isError = {
                firstName: false,
                lastName: false,
            };
            newState.isDisabled = false;
            newState.isSaveFinished = false;
            this.setState(newState);
        }
    };

    handleUpdateProfile = (): void => {
        const {firstName, lastName, file} = this.state;
        const {user, attemptUpdateProfile, goBack} = this.props;

        if ((!lastName || !firstName) && user.get("email")) {
            const newState: any = {...this.state};

            if (!lastName && firstName) {
                newState.isError = {
                    lastName: true,
                    firstName: false
                };
                this.setState(newState);
            } else if (lastName && !firstName) {
                newState.isError = {
                    firstName: true,
                    lastName: false,
                };
                this.setState(newState);
            } else {
                newState.isError = {
                    lastName: true,
                    firstName: true
                };
                this.setState(newState);
            }
            return;
        } else {
            if (firstName === user.get("firstName") && lastName === user.get("lastName") && !file) {
                return;
            } else {
                this.setState({isSaveLoading: true});
                let isAvatarChange: boolean = false;

                if (file && file.original.size > 0 && file.cropped.size > 0) {
                    isAvatarChange = true;
                }

                const userImg = {
                    original: user.get("imageUrl"),
                    cropped: user.get("avatar")
                };
                const updateUser = {
                    firstName,
                    lastName,
                    isAvatarChange,
                    image: file || userImg,
                    deleted: false
                };

                attemptUpdateProfile(user, updateUser);

                this.setState({file: null, isDisabled: true});
            }
        }

    };

    handleCropClose = (): void => {
        this.setState({image: null});
    };

    handleAvatarUpload = (file: any): void => {
        if (file) {
            this.setState({
                avatar: file.cropped,
                avatarURI: getBlobUri(file.cropped),
                file,
                image: null,
                isDisabled: true,
                isLoading: false,
                isSaveFinished: false
            });
        }
    };

    handleDeleteAvatar = () => {
        this.setState({deleteAvatar: true, avatar: null});
    };

    handleAvatarLoad = (): void => {
        this.setState({isLoading: false})
    };

    handleAvatarLoaderChange = (): void => {
        this.setState({isAvatarLoading: !this.state.isAvatarLoading})
    };

    get usernameElement(): JSX.Element {
        const localization: any = components().profilePanel;
        const {firstName, lastName, isError} = this.state;

        return <div className="edit-name">
            <input
                type="text"
                name="firstName"
                value={firstName}
                className={`user-name ${isError.firstName ? "user-name-err" : ""}`}
                onChange={this.handleNameChange}
                placeholder={localization.firstName}
            />
            <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={this.handleNameChange}
                className={`user-name ${isError.lastName ? "user-name-err" : ""}`}
                placeholder={localization.lastName}
            />
        </div>
    }

    render() {
        const localization: any = components().profilePanel;
        const {avatar, isLoading, avatarURI, isSaveLoading, isDisabled, isSaveFinished, isAvatarLoading} = this.state;
        const {user, goBack} = this.props;
        const profileImage: any = getBlobUri(avatar);
        const threadImage: any = {
            url: "",
            file: avatar,
        };

        return (
            <div className="edit-profile-content">
                <div>
                    {/*<button className="arrow-left-hovered"/>*/}
                    <div className="arrow-left" onClick={goBack}/>
                </div>

                <div className="profile-img-block">
                    {/*<div className="done-btn" onClick={this.handleUpdateProfile}>{isSaveLoading? <div className="small-loader"/> : localization.done}</div>*/}
                    {/*<div className="back-btn" onClick={goBack}>{localization.back}</div>*/}
                    {avatar
                        ? <span className="profile-img" style={{backgroundImage: `url(${avatarURI})`}}>
                                {(!avatar && user) && user.get("avatar") && user.get("avatar").size > 0 &&
                                <span className="icon"/>}
                            {!isAvatarLoading && <span className="profile-pic-icon">
                                            <input
                                                accept="image/gif,image/jpeg,image/jpg,image/png"
                                                className="profile-pic-upload"
                                                onChange={this.handleAvatarChange}
                                                id="profPicInput"
                                                multiple={false}
                                                name="avatar"
                                                type="file"
                                            />
                                        </span>}
                            {isAvatarLoading && <SVG
                                width={60}
                                height={60}
                                src={LOADER}
                                className='lottie-animation'
                            />}
                            </span>
                        :
                        <span className="profile-icon"
                              style={avatar && avatar.size > 0 ? {backgroundImage: `url(${avatarURI})`} : {}}>
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
                    }
                    {/*{isLoading && avatar && <div className="profile-img-loader">*/}
                    {/*    <SVG*/}
                    {/*        width={60}*/}
                    {/*        height={60}*/}
                    {/*        src={LOADER}*/}
                    {/*        className='lottie-animation'*/}
                    {/*    />*/}
                    {/*</div>}*/}
                    {/*<Avatar*/}
                    {/*    image={threadImage}*/}
                    {/*    color={user.getIn(["color", "numberColor"])}*/}
                    {/*    avatarCharacter={user.get("avatarCharacter")}*/}
                    {/*    name={user.get("firstName")}*/}
                    {/*    meta={{threadId: user.get("id")}}*/}
                    {/*    handleAvatarLoad={this.handleAvatarLoad}*/}
                    {/*    userAvatar={true}*/}
                    {/*/>*/}
                    {/*<div className="profile-pic-input">*/}
                    {/*    <label htmlFor="profPicInput" className="button-file">Choose Profile Picture</label>*/}
                    {/*    <input*/}
                    {/*        accept="image/gif,image/jpeg,image/jpg,image/png"*/}
                    {/*        className="profile-pic-upload hidden"*/}
                    {/*        onChange={this.handleAvatarChange}*/}
                    {/*        id="profPicInput"*/}
                    {/*        multiple={false}*/}
                    {/*        name="avatar"*/}
                    {/*        type="file"*/}
                    {/*    />*/}
                    {/*    /!*{avatar !== null && <button className="button-file" onClick={this.handleDeleteAvatar}>{localization.deleteAvatar}</button>}*!/*/}
                    {/*</div>*/}
                </div>
                {/*<div className="phone-number-block">*/}
                {/*<p className="phone-number">{localization.phoneNumber}</p>*/}
                {/*<span className="profile-number">+{user && user.get("phone")}</span>*/}
                {/*</div>*/}
                {/*<div className="change-password">
                                <p className="pass">{localization.changePassword}</p>
                                <span className="icon-add"/>
                            </div>*/}

                <div>
                    {this.usernameElement}
                </div>

                <div className="edit-buttons">
                    <div className="save-status">{isSaveFinished ? "Saved" : ""}</div>
                    <button className={`button save-button`}
                            onClick={this.handleUpdateProfile}>Save
                        {/*{isSaveLoading ? "Saving..." : isSaveFinished ? "Saved" : "Save"}*/}
                    </button>
                    {/*<button className="button cancel-button" onClick={goBack}>Cancel</button>*/}
                </div>
                {/*{avatar !== null &&*/}
                {/*<button className="button-file" onClick={this.handleDeleteAvatar}>{localization.deleteAvatar}</button>}*/}
                {
                    this.state.image && <CropAvatarPopUp
                        image={this.state.image}
                        uploadAvatar={this.handleAvatarUpload}
                        cancel={this.handleCropClose}
                        goBack={this.props.goBack}
                        attemptUpdateProfile={this.props.attemptUpdateProfile}
                        user={this.props.user}
                        firstName={this.state.firstName}
                        lastName={this.state.lastName}
                        isEditProfile={true}
                        handleAvatarLoaderChange={this.handleAvatarLoaderChange}
                    />
                }
            </div>
        )
    }

}

const mapStateToProps: any = state => selector(state, selectorParams);
const mapDispatchToProps: any = dispatch => ({
    attemptUpdateProfile: (user, updateUser) => dispatch(attemptUpdateProfile(user, updateUser)),
});
export default connect<{}, {}, any>(mapStateToProps, mapDispatchToProps)(Profile);
