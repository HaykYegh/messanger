"use strict";

import * as React from "react";
import CircularLoader from "components/common/loaders/CircularLoader";
import {checkEmailValidate, ISignInParams, singInUsingEmailAndToken} from "requests/loginRequest";
import {ICountry} from "services/interfaces";
import {ENTER_KEY_CODE} from "configs/constants";
import {
    Block,
    LinkButton,
    SpanHidden,
    PinInputBlock,
    PinInput,
    DescriptionText, BoldText, ErrorMessage
} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import {getDeviceToken, getErrorMessage} from "helpers/DataHelper";
import isEqual from "lodash/isEqual";
import {Loader, LoadingPage} from "../style";
import {getEnv, getPlatform} from "helpers/AppHelper";
import localizationComponent from "configs/localization";
import Log from "modules/messages/Log";


interface ILoginWithMailPinState {
    isResendPin: boolean,
    isEmailLoader: boolean,
    isCheckingEmailValidation: boolean,
    resendCodeTimer: number,
    errorMessage: string,
}

interface ILoginWithMailPinProps {
    selectedCountry: ICountry,
    isForgotPassword: boolean,
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void;
    handlePinChange: (pin: string) => void,
    handleBackToEmailChange: () => void,
    handleResponseMessageUpdate: (responseMessage: IResponseMessage) => void
    handleCreateSocketConnection: (username: string) => void
    handleOldSocketClose: () => void

    responseMessage: IResponseMessage,
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    };
}

export default class LoginWithMailPin extends React.Component<ILoginWithMailPinProps, ILoginWithMailPinState> {
    constructor(props) {
        super(props);
        this.state = {
            isEmailLoader: false,
            isCheckingEmailValidation: false,
            resendCodeTimer: 90,
            isResendPin: false,
            errorMessage: "",
        }
    }

    mounted: boolean;
    resendEmailCodeTimeOut: any;

    componentDidMount() {
        this.mounted = true;
        this.resendEmailCodeTimeOut = setInterval(this.handleResendEmailCodeTimeOut, 1000);
    };

    componentWillUnmount(): void {
        this.mounted = false;
        clearInterval(this.resendEmailCodeTimeOut);
    };

    componentDidUpdate(prevProps: Readonly<ILoginWithMailPinProps>, prevState: Readonly<ILoginWithMailPinState>, snapshot?: any): void {
        const {responseMessage, loginParams, handleUserSignIn, isForgotPassword} = this.props;
        if (this.props.responseMessage.get("message") !== prevProps.responseMessage.get("message")) {
            this.setState({errorMessage: responseMessage.get("message"), isEmailLoader: false})
        }

        if (loginParams.pin.length === 4 && loginParams.pin !== prevProps.loginParams.pin) {
            handleUserSignIn(null, isForgotPassword);
        }
    }

    handleResendEmailPinClick = () => {
        const {selectedCountry, loginParams: {email}, handleResponseMessageUpdate,
            handleCreateSocketConnection, handleOldSocketClose} = this.props;
        const regionCode: string = selectedCountry.regionCode;
        handleOldSocketClose();
        this.setState({resendCodeTimer: 90, isCheckingEmailValidation: true});

        (
            async () => {
                const signInParams: ISignInParams = {
                    isDevEnv: getEnv() === "development",
                    platformId: getPlatform().platformId,
                    deviceToken: getDeviceToken(),
                    regionCode,
                    email,
                };

                const username = await singInUsingEmailAndToken(signInParams);

                if (username !== "") {
                    this.resendEmailCodeTimeOut = setInterval(this.handleResendEmailCodeTimeOut, 1000);
                    this.setState({isResendPin: false});
                    handleCreateSocketConnection(username)
                }
                this.setState({isCheckingEmailValidation: false});
                const responseMessage: IResponseMessage = {
                    level: "",
                    message: "",
                    type: ""
                };
                handleResponseMessageUpdate(responseMessage)
            }
        )().catch((error) => {
            Log.i(error);
            const responseMessage: IResponseMessage = {
                level: "ERROR",
                message: error.message,
                type: "EMAIL_VALIDATE_FAIL"
            };
            handleResponseMessageUpdate(responseMessage);
        });
    };

    handleResendEmailCodeTimeOut = (): void => {
        const {resendCodeTimer} = {...this.state};
        this.setState({resendCodeTimer: resendCodeTimer - 1});
        if (resendCodeTimer <= 0) {
            clearInterval(this.resendEmailCodeTimeOut);
            this.setState({isResendPin: true});

        }
    };

    render() {
        const {isEmailLoader, isResendPin, isCheckingEmailValidation, resendCodeTimer, errorMessage} = this.state;
        const {loginParams: {pin, email}} = this.props;
        const localization = localizationComponent().login;
        return (
            <>
                <Block>
                    <DescriptionText padding="0px" marginBottom="41px">
                        {localization.clickEmailLink}
                    </DescriptionText>
                    {
                        isResendPin ?
                            <LinkButton
                                marginBottom="20px"
                                disabled={isCheckingEmailValidation}
                                onClick={this.handleResendEmailPinClick}
                            >
                                {localization.resendEmail}
                            </LinkButton> :
                            <DescriptionText marginBottom="20px">
                                {localization.resendEmailTimer(resendCodeTimer)}
                            </DescriptionText>
                    }
                </Block>
                {
                    errorMessage && <ErrorMessage top="146px">{getErrorMessage(errorMessage)}</ErrorMessage>
                }
            </>
        );
    }

}
