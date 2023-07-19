"use strict";

import * as React from "react";
import {connect} from "react-redux";
import components from "configs/localization";

import {initializeApplication, UPDATE_APPLICATION_STATE} from "modules/application/ApplicationActions";

import "scss/utils/_helpers.scss";
import {
    responseMessageSelector,
    userNameSelector,
    userSelector
} from "modules/user/UserSelector";
import App from "./App";
import {isLoggedIn} from "services/request";
import {applicationStateSelector} from "modules/application/ApplicationSelector";
import {attemptChangeSetting} from "modules/settings/SettingsActions";
import {IApplicationState} from "modules/application/ApplicationReducer";
import {Loader, LoadingPage, TextLoading} from "./style";
import {ICountry} from "services/interfaces";
import {SIGN_IN, UPDATE_PROFILE, UPDATE_RESPONSE_MESSAGE, attemptSignIn, SET_PASSWORD, changeIsFirstLogin} from "modules/user/UserActions";
import AuthContainer from "./AuthContainer";
import {IResponseMessage} from "modules/user/UserTypes";
import {ContentBlock, LoginBackground, LoginContent, Logo} from "./AuthContainer/style";
import SetProfile from "./AuthContainer/SetProfile";

const appLogo: any = require("assets/images/login_logo_blue.svg");
import isEqual from "lodash/isEqual";
import localization from "configs/localization";
import Password from "components/settings/Password";
import Log from "modules/messages/Log";



interface ILayoutState {
}

interface ILayoutProps {
    SIGN_IN: (selectedCountry: ICountry, number: string, email?: string, password?: string, pinCode?: string, isForgotPassword?: boolean) => void;
    UPDATE_RESPONSE_MESSAGE: (responseMessage: IResponseMessage) => void;
    UPDATE_APPLICATION_STATE: (applicationState: IApplicationState) => void;
    UPDATE_PROFILE: (profile: { firstName?: string, lastName?: string, avatar?: Blob, imageUrl: Blob, isAvatarDeleted?: boolean, isAvatarChanged: boolean }) => void;
    SET_PASSWORD: (password: string) => void;
    changeIsFirstLogin: (isFirstLogin: boolean) => void;
    attemptChangeSetting: (settingsType: string, settingsId: string, value: string | boolean, send?: boolean) => void,

    initializeApplication: () => void,
    username: string,
    applicationState: IApplicationState,
    user: any
    responseMessage: IResponseMessage
}


class Layout extends React.Component<ILayoutProps, ILayoutState> {

    constructor(props: any) {
        super(props);
        this.state = {};
    }

    handleForgotPasswordSetCase = () => {
        const {UPDATE_APPLICATION_STATE} = this.props;

        UPDATE_APPLICATION_STATE({shouldUserPasswordSet: false})
    };

    handleProfileInfoSetCase = (profile) => {
        const {UPDATE_PROFILE, UPDATE_APPLICATION_STATE} = this.props;

        UPDATE_APPLICATION_STATE({shouldUserProfileSet: false});
        UPDATE_PROFILE(profile)
    };

    componentDidMount(): void {
        const {initializeApplication} = this.props;
        if (isLoggedIn()) {
            initializeApplication();
        }
    }

    shouldComponentUpdate(nextProps: Readonly<ILayoutProps>, nextState: Readonly<ILayoutState>) {
        const {user, username, applicationState, responseMessage} = this.props;

        if (username !== nextProps.username) {
            return true;
        }

        if (applicationState.get("isLoading") !== nextProps.applicationState.get("isLoading")) {
            return true
        }

        if (applicationState.get("shouldUserPasswordSet") !== nextProps.applicationState.get("shouldUserPasswordSet")) {
            return true
        }

        if (applicationState.get("shouldUserProfileSet") !== nextProps.applicationState.get("shouldUserProfileSet")) {
            return true
        }

        if (!isEqual(responseMessage.get("message"), nextProps.responseMessage.get("message"))) {
            return true
        }

        if (user.get("id") !== nextProps.user.get("id")) {
            return true
        }

        if (user.get("isFirstLogin") !== nextProps.user.get("isFirstLogin")) {
            return true
        }

        return false;
    }

    render(): JSX.Element {
        const {username, applicationState, user, responseMessage, UPDATE_RESPONSE_MESSAGE, SIGN_IN, SET_PASSWORD, UPDATE_PROFILE, attemptChangeSetting, changeIsFirstLogin} = this.props;
        const localization = components().app;
        const shouldUserPasswordSet: boolean = applicationState.get("shouldUserPasswordSet");
        const shouldUserProfileSet: boolean = applicationState.get("shouldUserProfileSet");

        return (
            <div>
                {
                    !shouldUserPasswordSet &&
                    !shouldUserProfileSet && (
                        applicationState.get("isLoading") ?
                            <LoadingPage>
                                <Loader/>
                                <TextLoading>{localization.initializing}</TextLoading>
                            </LoadingPage> :
                            (
                                username !== "" ? <App/> :
                                    <AuthContainer
                                        user={user}
                                        actions={{
                                            SIGN_IN,
                                            UPDATE_RESPONSE_MESSAGE,
                                            changeIsFirstLogin
                                        }}
                                        responseMessage={responseMessage}
                                        attemptChangeSetting={attemptChangeSetting}
                                    />
                            )
                    )
                }
                {
                    (shouldUserPasswordSet || shouldUserProfileSet || (user && user.get("isFirstLogin"))) && username !== "" &&
                    true &&
                    <LoginBackground>
                        <LoginContent>
                            <ContentBlock>
                                <Logo>
                                    <img draggable={false} src={appLogo} alt=""/>
                                </Logo>
                                {user && !user.get("isFirstLogin") ? <SetProfile
                                    actions={{
                                        UPDATE_PROFILE
                                    }}
                                    shouldPasswordSet={applicationState.get("shouldUserPasswordSet")}
                                    shouldProfileInfoSet={shouldUserProfileSet}
                                    handleForgotPasswordSetCase={this.handleForgotPasswordSetCase}
                                    handleProfileInfoSetCase={this.handleProfileInfoSetCase}
                                    user={user}
                                    responseMessage={responseMessage}
                                /> :
                                <div>
                                    <Password
                                        // handleSetPasswordPageHide={this.handleSetPasswordPageHide}
                                        isPasswordSet={false}
                                        afterLogin={true}
                                        actions={
                                            {SET_PASSWORD}
                                        }
                                    />
                                </div>}
                            </ContentBlock>
                        </LoginContent>
                    </LoginBackground>
                }
            </div>
        );
    }
}

const mapStateToProps = () => {
    const username = userNameSelector();
    const applicationState = applicationStateSelector();
    const user = userSelector();
    const responseMessage = responseMessageSelector();

    return (state, props) => {
        return {
            username: username(state, props),
            applicationState: applicationState(state, props),
            user: user(state, props),
            responseMessage: responseMessage(state, props),
        }
    }
};

const mapDispatchToProps: any = dispatch => ({
    SIGN_IN: (country: ICountry, number?: string, email?: string, password?: string, pinCode?: string, isForgotPassword?: boolean, accessToken?: string) => dispatch(SIGN_IN(country, number, email, password, pinCode, isForgotPassword, accessToken)),
    UPDATE_RESPONSE_MESSAGE: (responseMessage: IResponseMessage) => dispatch(UPDATE_RESPONSE_MESSAGE(responseMessage)),
    UPDATE_PROFILE: (profile: { firstName?: string, lastName?: string, avatar?: Blob, imageUrl: Blob, isAvatarDeleted?: boolean, isAvatarChanged: boolean }) => dispatch(UPDATE_PROFILE(profile)),
    UPDATE_APPLICATION_STATE: (applicationState: IApplicationState) => dispatch(UPDATE_APPLICATION_STATE(applicationState)),
    initializeApplication: () => dispatch(initializeApplication()),
    attemptChangeSetting: (settingsType, settingsId, value, send) => dispatch(attemptChangeSetting(settingsType, settingsId, value, send)),
    SET_PASSWORD: (password: string) => dispatch(SET_PASSWORD(password)),
    changeIsFirstLogin: (isFirstLogin: boolean) => dispatch(changeIsFirstLogin(isFirstLogin)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Layout);
