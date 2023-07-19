"use strict";

import * as React from "react";

import LoginUsingMobile from "./LoginUsingMobile";
import LoginUsingMail from "./LoginUsingMail";
import {getUserLocation} from "requests/locationRequest";
import countriesList from "configs/countries";
import {ICountry} from "services/interfaces";
import isEqual from "lodash/isEqual";
import {
    AttentionSign,
    BackButton, BackButtonIcon, CheckIcon,
    ContentBlock, ContentHeader, EmailNote, ErrorMessage, JalaExclusiveText, JalaLogo, LockIcon,
    LoginBackground,
    LoginContent,
    LoginType,
    Logo,
} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import {APP_CONFIG, APPLICATION, AUTHENTICATION_TABS, EMAIL_REGISTRATION_KEY} from "configs/constants";

import {getLanguage} from "helpers/AppHelper";
import localizationComponent from "configs/localization";
import LoginWithQR from "./LoginWithQR";
import Log from "modules/messages/Log";

const appLogo: any = require("assets/images/login_logo_blue.svg");
const back = require("assets/images/InvalidUserPage/back_arrow_grey.svg");
const lockIcon = require("assets/images/InvalidUserPage/lock_icon.svg");
const checkIcon = require("assets/images/InvalidUserPage/checkicon.svg");
const jalaLogo = require("assets/images/InvalidUserPage/jala_grey.svg");

interface IAuthContainerState {
    isMobileLogin: boolean;
    isEmailOrPhoneLogin: boolean;
    isQrLogin: boolean;
    invalidUserError: boolean;
    selectedCountry: {
        name: string,
        regionCode: string,
        phoneCode: string,
        label: string,
    };
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    },
}

interface IAuthContainerProps {
    actions: {
        SIGN_IN: (selectedCountry: ICountry, number: string, email?: string, password?: string, pinCode?: string, isForgotPassword?: boolean, accessToken?: string) => void;
        UPDATE_RESPONSE_MESSAGE: (responseMessage: IResponseMessage) => void;
        changeIsFirstLogin: (isFirstLogin: boolean) => void;
    },
    user: any;
    responseMessage: IResponseMessage,
    attemptChangeSetting: (settingsType: string, settingsId: string, value: string | boolean, send?: boolean) => void,
}

export default class AuthContainer extends React.Component<IAuthContainerProps, IAuthContainerState> {

    mounted: boolean;
    emailDisabled: boolean = APP_CONFIG.ignores.includes(EMAIL_REGISTRATION_KEY.toLowerCase());

    constructor(props: any) {
        super(props);
        this.state = {
            isMobileLogin: this.emailDisabled,
            isEmailOrPhoneLogin: !this.emailDisabled,
            isQrLogin: false,
            invalidUserError: false,
            selectedCountry: {
                name: "",
                regionCode: "",
                phoneCode: "",
                label: "",
            },
            loginParams: {
                pin: "",
                password: "",
                email: "",
                number: "",
            },
        };
    }

    handleInvalidUserError = () => {
        const { invalidUserError } = this.state;
        this.setState({invalidUserError: !invalidUserError});
    };

    shouldComponentUpdate(nextProps: Readonly<IAuthContainerProps>, nextState: Readonly<IAuthContainerState>, nextContext: any): boolean {
        const {user, responseMessage} = this.props;

        if (user.get("username") !== nextProps.user.get("username")) {
            return true
        }

        if (!isEqual(responseMessage, nextProps.responseMessage)) {
            return true
        }

        return !isEqual(this.state, nextState)
    }

    componentDidMount() {
        this.mounted = true;

        // const { attemptChangeSetting } = this.props;
        // const systemLang = getLanguage();
        // const localStorageLang = localStorage.getItem('selectedLanguage');
        //
        // if(!localStorageLang || localStorageLang === "") {
        //     if (systemLang.startsWith("es")) {
        //         attemptChangeSetting('languages', 'selectedLanguage', 'es');
        //         localStorage.setItem('selectedLanguage', 'es');
        //     } else if (systemLang.startsWith("ru")) {
        //         attemptChangeSetting('languages', 'selectedLanguage', 'es');
        //         localStorage.setItem('selectedLanguage', 'ru');
        //     }
        // }

        if (localStorage.getItem("x-access-token")) {
            return
        }

        (
            async () => {
                const regionCode: any = await getUserLocation();

                const currentCountry: ICountry = APPLICATION.WITHOUTCOUNTRY ? countriesList.find(country => country.regionCode === "STK") : countriesList.find(country => country.regionCode === regionCode);

                if (this.mounted) {
                    this.setState({
                        selectedCountry: {
                            name: currentCountry.name,
                            regionCode: currentCountry.regionCode,
                            phoneCode: currentCountry.phoneCode,
                            label: currentCountry.name,
                        }
                    });
                }
            }
        )().catch((error) => {
            Log.i(error);

            if (this.mounted) {
                this.setState({
                    selectedCountry : {
                        name: countriesList[0].name,
                        regionCode: countriesList[0].regionCode,
                        phoneCode: countriesList[0].phoneCode,
                        label: countriesList[0].name,
                    }
                });
            }

        });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    handleChangeLogInType = (event: React.MouseEvent<HTMLButtonElement>) => {
        const {actions: {UPDATE_RESPONSE_MESSAGE}} = this.props;
        const loginType = event.currentTarget.getAttribute("data-login-type");
        const responseMessage: IResponseMessage = {
            level: "",
            message: "",
        };

        if (loginType === "email") {
            this.setState({isMobileLogin: false});
            this.setState({isQrLogin: false});
            this.setState({isEmailOrPhoneLogin: true});
        } else if (loginType === "phone") {
            this.setState({isMobileLogin: true});
            this.setState({isQrLogin: false});
            this.setState({isEmailOrPhoneLogin: true});
        }
        else if (loginType === "qrCode") {
            this.setState({isMobileLogin: false});
            this.setState({isQrLogin: true});
            this.setState({isEmailOrPhoneLogin: false});
        }
        this.setState({loginParams: {pin: "", password: "", email: "", number: ""}});

        UPDATE_RESPONSE_MESSAGE(responseMessage)
    };


    handleUserSignIn = (value: string = "", isForgotPassword: boolean = false) => {
        const {selectedCountry, loginParams: {pin, password, email, number}} = {...this.state};

        this.props.actions.SIGN_IN(selectedCountry, number, email, password, value || pin, isForgotPassword);
    };

    handleQrSignIn = (accessToken: string, username: string, email: string = "") => {
        const {selectedCountry} = this.state;
        this.props.actions.SIGN_IN(selectedCountry, username, email, null, null, null, accessToken);

    };

    handlePinChange = (pin) => {
        const {loginParams: {password, email, number}} = {...this.state};
        this.setState({loginParams: {pin, password, email, number}});
    };

    handlePasswordChange = (password: string) => {
        const {loginParams: {pin, email, number}} = {...this.state};
        this.setState({loginParams: {pin, password, email, number}});
    };

    handleEmailChange = (email: string) => {
        const {loginParams: {pin, password, number}} = {...this.state};
        Log.i(email)
        this.setState({loginParams: {pin, password, email, number}});
    };

    handleNumberChange = (number: string) => {
        const {loginParams: {pin, password, email}} = {...this.state};
        this.setState({loginParams: {pin, password, email, number}});
    };

    handleSelectedCountryChange = (selectedCountry: ICountry) => {
        const currentCountry = {
            name: selectedCountry.name,
            regionCode: selectedCountry.regionCode,
            phoneCode: selectedCountry.phoneCode,
            label: selectedCountry.name,
        };
        this.setState({selectedCountry: currentCountry})
    };

    handleResponseMessageUpdate = (responseMessage: IResponseMessage) => {
        const {actions: {UPDATE_RESPONSE_MESSAGE}} = this.props;
        UPDATE_RESPONSE_MESSAGE(responseMessage)
    };


    render(): JSX.Element {
        const {isMobileLogin, isQrLogin, isEmailOrPhoneLogin, selectedCountry, loginParams, invalidUserError} = this.state;
        const {responseMessage, actions: {changeIsFirstLogin}} = this.props;
        const localization = localizationComponent().login;

        return (
            <LoginBackground>
                {
                    invalidUserError === false ?
                        <LoginContent
                            width={!isEmailOrPhoneLogin ? "745px" : "450px"}
                            height={!isEmailOrPhoneLogin ? "304px" : "auto"}
                            minHeight={!isEmailOrPhoneLogin ? "304px" : !APPLICATION.WITHOUTCOUNTRY ? "480px" : "332px" }
                        >
                        <ContentBlock
                            width={!isEmailOrPhoneLogin ? "100%" : "315px"}
                            minHeight={!isEmailOrPhoneLogin ? "unset" : !APPLICATION.WITHOUTCOUNTRY ? "300px" : "230px"}
                        >
                            {isEmailOrPhoneLogin && <Logo>
                                <img draggable={false} src={appLogo} alt=""/>
                            </Logo>}
                            {/*{*/}
                            {/*    isMobileLogin ?*/}
                            {/*        <LoginUsingMobile*/}
                            {/*            handleSelectedCountryChange={this.handleSelectedCountryChange}*/}
                            {/*            handleResponseMessageUpdate={this.handleResponseMessageUpdate}*/}
                            {/*            handlePasswordChange={this.handlePasswordChange}*/}
                            {/*            handleNumberChange={this.handleNumberChange}*/}
                            {/*            handleUserSignIn={this.handleUserSignIn}*/}
                            {/*            handlePinChange={this.handlePinChange}*/}
                            {/*            responseMessage={responseMessage}*/}
                            {/*            userCountry={selectedCountry}*/}
                            {/*            loginParams={loginParams}*/}
                            {/*        />*/}
                            {/*        :*/}
                            {/*        <LoginUsingMail*/}
                            {/*            handleSelectedCountryChange={this.handleSelectedCountryChange}*/}
                            {/*            handleResponseMessageUpdate={this.handleResponseMessageUpdate}*/}
                            {/*            handlePasswordChange={this.handlePasswordChange}*/}
                            {/*            handleEmailChange={this.handleEmailChange}*/}
                            {/*            handleUserSignIn={this.handleUserSignIn}*/}
                            {/*            handlePinChange={this.handlePinChange}*/}
                            {/*            responseMessage={responseMessage}*/}
                            {/*            userCountry={selectedCountry}*/}
                            {/*            loginParams={loginParams}*/}
                            {/*            handleInvalidUserError={this.handleInvalidUserError}*/}
                            {/*            invalidUserError={invalidUserError}*/}
                            {/*        />*/}
                            {/*}*/}

                            {
                                isEmailOrPhoneLogin ? APPLICATION.WITHEMAILLOGIN ?
                                  <LoginUsingMail
                                    handleSelectedCountryChange={this.handleSelectedCountryChange}
                                    handleResponseMessageUpdate={this.handleResponseMessageUpdate}
                                    handlePasswordChange={this.handlePasswordChange}
                                    handleEmailChange={this.handleEmailChange}
                                    handleUserSignIn={this.handleUserSignIn}
                                    handlePinChange={this.handlePinChange}
                                    responseMessage={responseMessage}
                                    userCountry={selectedCountry}
                                    loginParams={loginParams}
                                    handleInvalidUserError={this.handleInvalidUserError}
                                    invalidUserError={invalidUserError}
                                  />
                                  :
                                    <LoginUsingMobile
                                        handleSelectedCountryChange={this.handleSelectedCountryChange}
                                        handleResponseMessageUpdate={this.handleResponseMessageUpdate}
                                        handlePasswordChange={this.handlePasswordChange}
                                        handleNumberChange={this.handleNumberChange}
                                        handleUserSignIn={this.handleUserSignIn}
                                        handlePinChange={this.handlePinChange}
                                        responseMessage={responseMessage}
                                        userCountry={selectedCountry}
                                        loginParams={loginParams}
                                        changeIsFirstLogin={changeIsFirstLogin}
                                    />
                                    :
                                  <LoginWithQR
                                    handleQrSignIn={this.handleQrSignIn}
                                    handleSelectedCountryChange={this.handleSelectedCountryChange}
                                    selectedCountry={selectedCountry}
                                  />
                            }
                             {/*phone registration label */}
                            {/*<LoginType*/}
                            {/*    onClick={this.handleChangeLogInType}*/}
                            {/*     data-login-type={isMobileLogin ? "email" : "phone"}*/}
                            {/*>*/}
                            {/*    {!this.emailDisabled ?*/}
                            {/*        isMobileLogin ?*/}
                            {/*            `${localization.useEmail}` :*/}
                            {/*            `${localization.usePhone}`:*/}
                            {/*        null}*/}
                            {/*</LoginType>*/}
                            <LoginType
                              onClick={this.handleChangeLogInType}
                              data-login-type={isEmailOrPhoneLogin ? "qrCode" : APPLICATION.WITHEMAILLOGIN ? "email" : "phone"}
                            >
                                {!this.emailDisabled ?
                                    isQrLogin ? APPLICATION.WITHEMAILLOGIN ?
                                        `${localization.useEmail}`:
                                        `${localization.usePhone}` :
                                    `${localization.useQR}`:
                                  null}
                            </LoginType>
                        </ContentBlock>

                    </LoginContent> :
                        <LoginContent isInvalidUser={invalidUserError}>
                            <ContentHeader>
                                <BackButton onClick={() => {this.handleInvalidUserError()}}>
                                    {/*<img src={back} style={{height: "18px"}}/>*/}
                                    <BackButtonIcon src={back}/>
                                    <span>{localization.back}</span>
                                </BackButton>
                            </ContentHeader>
                            <ContentBlock>
                                <AttentionSign>{localization.attention}</AttentionSign>
                                <LockIcon src={lockIcon}/>
                                <EmailNote>{localization.emailNotAllowed}</EmailNote>
                                <CheckIcon src={checkIcon}/>
                                <JalaExclusiveText>
                                    {localization.jalaExclusive}
                                </JalaExclusiveText>
                                <JalaLogo src={jalaLogo}/>
                            </ContentBlock>
                        </LoginContent>
                }

            </LoginBackground>
        );
    }
}
