"use strict";

import * as React from "react";
import Avatar from "components/contacts/Avatar";
import {getBlobUri, getThumbnail} from "helpers/FileHelper";
import {getDeepLink} from "requests/getDeepLink";
import AvatarCropper from "components/common/AvatarCropper";
import WhyOurApp from "components/settings/WhyOurApp"
import {setUsersPassword} from "requests/profileRequest";
import SetUserPassword from "./SetUserPassword";
import {
    AppNumber,
    NumberDescriptionText,
    BackButtonN,
    BackIcon,
    Block,
    Button,
    ProfileInfo,
    UserImage,
    IconUser,
    UserNameContent,
    Input,
    Content, BoldText, DescriptionText, InputContent, AvatarSize, ErrorMessage
} from "./style";
import {getColor} from "helpers/AppHelper";
import {getInitials} from "helpers/DataHelper";
import {element} from "prop-types";
import {IResponseMessage} from "modules/user/UserTypes";
import localizationComponent from "configs/localization";
import {APPLICATION} from "configs/constants";
import Log from "modules/messages/Log";

const avatarLogo: any = require("assets/images/set_avatar.svg");


interface ISetProfileState {
    file: any;
    image: File | Blob;
    avatar: Blob;
    imageUrl: Blob;
    userFirstName: string;
    userLastName: string;
    passwordSet: {
        password: string,
        confirmedPassword: string,
    },
    errorMessage: string,
    showAppNumber: boolean,
    whyApp: boolean,
    deepLink: string,
}

interface ISetProfileProps {
    actions: {
        UPDATE_PROFILE: (profile: { firstName?: string, lastName?: string, avatar?: Blob, imageUrl: Blob | File}) => void;
    }
    shouldProfileInfoSet: boolean,
    shouldPasswordSet: boolean,
    handleForgotPasswordSetCase: () => void,
    handleProfileInfoSetCase: (profile: any) => void,
    user: any,
    responseMessage: IResponseMessage,
}

export default class SetProfile extends React.Component<ISetProfileProps, ISetProfileState> {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            image: null,
            avatar: null,
            imageUrl: null,
            userFirstName: "",
            userLastName: "",
            passwordSet: {
                password: "",
                confirmedPassword: "",
            },
            errorMessage: "",
            showAppNumber: false,
            whyApp: false,
            deepLink: ""
        }
    }

    componentDidUpdate(prevProps: Readonly<ISetProfileProps>, prevState: Readonly<ISetProfileState>, snapshot?: any): void {
        if (prevProps.responseMessage.get("message") !== this.props.responseMessage.get("message")) {
            this.setState({errorMessage: this.props.responseMessage.get("message")})
        }
    }

    handleForgotPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {passwordSet: {confirmedPassword}} = {...this.state};
        this.setState({
            passwordSet: {
                password: event.currentTarget.value,
                confirmedPassword,
            },
            errorMessage: "",
        })
    };

    handleConfirmedPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {passwordSet: {password}} = {...this.state};
        this.setState({
            passwordSet: {
                password,
                confirmedPassword: event.currentTarget.value,
            },
            errorMessage: ""
        })
    };

    handlePasswordSetContinue = () => {
        const {passwordSet: {password, confirmedPassword}} = {...this.state};
        const {handleForgotPasswordSetCase} = this.props;

        const isPasswordExist: boolean = password !== "";
        const isValidPassword: boolean = password.length >= 6;
        const isSamePassword: boolean = isValidPassword ? password === confirmedPassword : false;
        let errorMessage: string = "";

        const passwordPattern: RegExp = new RegExp(/\s/, "g");

        if (passwordPattern.test(password)) {
            errorMessage = "Invalid password"
        }

        if (isPasswordExist && !isSamePassword) {
            errorMessage = "Password don't match";
        }

        if (errorMessage !== "") {
            this.setState({
                passwordSet: {
                    password,
                    confirmedPassword,
                },
                errorMessage
            })
        } else {
            (
                async () => {
                    const response = await setUsersPassword(password);
                    if (response) {
                        handleForgotPasswordSetCase();
                    }
                }
            )().catch((error) => {
                Log.e(error);
            });
        }
    };

    handleAvatarChange = async ({currentTarget}: React.ChangeEvent<HTMLInputElement>): Promise<any> => {
        if (currentTarget.files[0]) {
            this.setState({image: currentTarget.files[0]});
        }
        currentTarget.value = "";
    };

    handleCroppedImageUpdate = (croppedFile: any): void => {

        const uploadedAvatar = {
            original: croppedFile.image,
            cropped: croppedFile.avatar
        };

        if (croppedFile && croppedFile.image && croppedFile.avatar) {
            this.setState({
                avatar: croppedFile.avatar,
                file: uploadedAvatar,
                image: null,
            });
        }
    };

    handleCropPopupDismiss = (): void => {
        this.setState({file: null});
    };

    handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const isFirstNameInput: boolean = event.currentTarget.name === "firstName";

        if (isFirstNameInput) {
            this.setState({userFirstName: event.currentTarget.value})
        } else {
            this.setState({userLastName: event.currentTarget.value})
        }
    };

    handleProfileInfoSet = () => {
        const {handleProfileInfoSetCase} = this.props;
        const {userFirstName, userLastName, avatar, file} = this.state;
        const profile = {
            firstName: userFirstName,
            lastName: userLastName,
            avatar: file && file.cropped,
            imageUrl: file && file.original,
            isAvatarChanged: !!avatar,
            isAvatarDeleted: false
        };
        handleProfileInfoSetCase(profile);
    };

    handleShowAppNumber = () => {
        // getDeepLink().then(({ data }) => {
        //     if (data.status === "SUCCESS") {
        //         this.setState({showAppNumber: !this.state.showAppNumber})
        //     }
        //     console.log(data, "getDeepLink1234")
        // })
        this.setState({showAppNumber: !this.state.showAppNumber})
        if (APPLICATION.BRANDURL) {
            this.handleProfileInfoSet()
        }
    }

    handleWhyApp = () => {
        this.setState({whyApp: true})
    }

    render() {
        const {avatar, file, userFirstName, userLastName, passwordSet: {password, confirmedPassword}, errorMessage, image, showAppNumber, whyApp, deepLink} = this.state;
        const {shouldPasswordSet, shouldProfileInfoSet, user} = this.props;
        const threadImage: {
            url: string,
            file: Blob,
            loadFromWeb?: boolean,
        } = {
            url: avatar ? URL.createObjectURL(avatar) : "",
            file: avatar,
        };
        const color: string = getColor();
        const avatarCharacter: string = getInitials(userFirstName, userLastName);
        const name: string = userFirstName;
        const localization = localizationComponent().login;
        const localization2 = localizationComponent().afterRegistrationShowNumber;
        const localization3 = localizationComponent().inviteNumber;
        let title = "";
        if (showAppNumber) {
            title = localization2.title
        } else {
            title = shouldProfileInfoSet ? "Your Profile" : "Set Password"
        }

        return (
            <Content whyApp={whyApp} >
                {
                    !whyApp &&
                    <BoldText showAppNumber={showAppNumber} >{title}</BoldText>
                }
                {
                    shouldProfileInfoSet && !showAppNumber &&
                        <DescriptionText padding="0" marginBottom="23px">Please fill your profile info that <br/> will be visible to your friends</DescriptionText>
                }
                {
                    shouldPasswordSet &&
                        <DescriptionText padding="0" marginBottom="23px">
                            {localization.setAndConfirmPass}
                        </DescriptionText>
                }
                {
                    !shouldPasswordSet && shouldProfileInfoSet && !showAppNumber &&
                    <Block>
                        <ProfileInfo>
                            <UserImage>
                                <AvatarSize
                                    width="80px"
                                    height="80px"
                                >
                                    {
                                        avatar ? <Avatar
                                            image={threadImage}
                                            color={color}
                                            avatarCharacter={avatarCharacter}
                                            name={name}
                                            iconSize={"80px"}
                                            avatarBlobUrl={threadImage.url}
                                        /> : <img src={avatarLogo} alt="Avatar Logo"/>
                                    }
                                </AvatarSize>
                                <IconUser>
                                    <input
                                        accept="image/gif,image/jpeg,image/jpg,image/png"
                                        onChange={this.handleAvatarChange}
                                        id="profPicInput"
                                        name="avatar"
                                        type="file"
                                    />
                                </IconUser>
                            </UserImage>
                            <UserNameContent>
                                <InputContent marginBottom="0">
                                    <Input
                                        textAlign="left"
                                        padding="0 10px"
                                        width="200px"
                                        type="text"
                                        placeholder="First name"
                                        name="firstName"
                                        value={userFirstName}
                                        onChange={this.handleNameChange}
                                        autoComplete="off"
                                        autoFocus={true}
                                    />
                                </InputContent>
                                <InputContent marginBottom="0">
                                    <Input
                                        textAlign="left"
                                        padding="0 10px"
                                        width="200px"
                                        type="text"
                                        placeholder="Second name"
                                        name="lastName"
                                        value={userLastName}
                                        onChange={this.handleNameChange}
                                        autoComplete="off"
                                    />
                                </InputContent>
                            </UserNameContent>
                        </ProfileInfo>
                        {
                            errorMessage !== "" && shouldProfileInfoSet && <ErrorMessage>{errorMessage}</ErrorMessage>
                        }
                        <Button
                            onClick={this.handleShowAppNumber}
                            disabled={!userFirstName}
                        >
                            Continue
                        </Button>
                        {
                            image &&
                            <AvatarCropper
                                cropPopupDismiss={this.handleCropPopupDismiss}
                                croppedImageUpdate={this.handleCroppedImageUpdate}
                                file={image}
                            />
                        }
                    </Block>
                }
                {
                    showAppNumber && !whyApp &&
                    <>
                        <AppNumber>
                            {`+${user.get("username")}`}
                        </AppNumber>
                        <NumberDescriptionText>
                            {localization2.description}
                        </NumberDescriptionText>
                        <BackButtonN
                            onClick={this.handleShowAppNumber}
                        >
                            <BackIcon>&#8249;</BackIcon>
                            Back
                        </BackButtonN>

                            <a href="#mailgo"
                               data-address=""
                               data-domain=""
                               data-subject=""
                               data-body={APPLICATION.BRANDURL ? localization3.description2 : `${localization3.description} ${user.get("deepLink")}`}
                            >
                                <Button
                                  style={{
                                      marginTop: "14px",
                                      border: "1px solid #99D38E",
                                      background: "#FFFFFF",
                                      color: "#99D38E",
                                      // visibility: "hidden"
                                  }}
                                >
                                    {localization2.inviteButtonText}
                                </Button>
                            </a>

                        <Button
                          style={{
                              marginTop: "10px"
                          }}
                          onClick={this.handleWhyApp}
                        >
                            Continue
                        </Button>
                    </>
                }
                {
                    whyApp &&
                      <>
                          <WhyOurApp />
                          <Button
                            className="whyApp"
                            style={{
                                marginTop: "0px"
                            }}
                            onClick={this.handleProfileInfoSet}
                          >
                              Continue
                          </Button>
                      </>
                }
                {
                    shouldPasswordSet &&
                    <SetUserPassword
                        password={password}
                        confirmedPassword={confirmedPassword}
                        handleForgotPasswordChange={this.handleForgotPasswordChange}
                        handleConfirmedPasswordChange={this.handleConfirmedPasswordChange}
                        handlePasswordSetContinue={this.handlePasswordSetContinue}
                        errorMessage={errorMessage}
                    />
                }
            </Content>
        );
    }
}
