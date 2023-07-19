"use strict";

import * as React from "react";
import CircularLoader from "components/common/loaders/CircularLoader";
import {ICountry} from "services/interfaces";
import {ENTER_KEY_CODE} from "configs/constants";
import {
    Block,
    LinkButton,
    BoldText,
    SpanHidden,
    PinInputBlock,
    PinInput,
    DescriptionText, ErrorMessage
} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import isEqual from "lodash/isEqual";
import {Loader, LoadingPage} from "../style";
import {getErrorMessage} from "helpers/DataHelper";
import conf from "configs/configurations";
import localizationComponent from "configs/localization";

interface ILoginWithPinProps {
    mobileDigits: string,
    isMobileNumberDisable: boolean,
    selectedCountry: ICountry,
    isForgotPassword: boolean,
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void,
    handlePinChange: (pin: string) => void,
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    };
    handleMobileLoginValidate: () => void,
    handleBackToNumberChange: () => void,
    handleResponseMessageUpdate: (responseMessage: IResponseMessage) => void
    responseMessage: IResponseMessage
}

interface ILoginWithPinState {
    isMobileLoader: boolean,
    resendCodeTimer: number;
    isResendPin: boolean;
    isNumberDisable: boolean
    errorMessage: string,
}

export default class LoginWithMobilePin extends React.Component<ILoginWithPinProps, ILoginWithPinState> {
    constructor(props) {
        super(props);
        this.state = {
            isMobileLoader: false,
            resendCodeTimer: 90,
            isResendPin: false,
            isNumberDisable: false,
            errorMessage: "",
        }
    }

    resendCodeTimeOut: any;
    mounted: boolean;

    componentDidMount() {
        this.mounted = true;
        this.resendCodeTimeOut = setInterval(this.handleResendCodeTimeOut, 1000);
        window.addEventListener("keypress", this.handleEnterPress);
    };

    componentWillUnmount(): void {
        this.mounted = false;
        clearInterval(this.resendCodeTimeOut);
        window.removeEventListener("keypress", this.handleEnterPress);
    };

    componentDidUpdate(prevProps: Readonly<ILoginWithPinProps>, prevState: Readonly<ILoginWithPinState>, snapshot?: any): void {
        const {responseMessage} = this.props;
        if (this.props.responseMessage.get("message") !== prevProps.responseMessage.get("message")) {
            this.setState({errorMessage: responseMessage.get("message"), isMobileLoader: false})
        }
    }

    handleEnterPress = (event) => {
        const {loginParams: {pin}} = this.props;
        if (event.keyCode === ENTER_KEY_CODE && pin.length === 4) {
            this.handleMobilePinCodeContinueClick(event);
        }
    };

    handleResendCodeTimeOut = (): void => {
        const {resendCodeTimer} = this.state;
        this.setState({resendCodeTimer: resendCodeTimer - 1});
        if (resendCodeTimer <= 0) {
            clearInterval(this.resendCodeTimeOut);
            this.setState({isResendPin: true});
        }
    };

    handleMobilePinCodeContinueClick = (event, value: string = ""): void => {
        const {handleUserSignIn, isForgotPassword, loginParams: {pin}} = this.props;

        this.setState({isMobileLoader: true});

        if (pin !== "" || value !== "") {
            handleUserSignIn(value, isForgotPassword);
        } else {
            if (this.mounted) {
                this.setState({isMobileLoader: false});
            }
        }

    };

    handleMobilePinChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const {handlePinChange, loginParams: {pin}} = this.props;
        let validValue = event.currentTarget.value;
        validValue = validValue.replace(/[^0-9]/, "");

        if (validValue !== pin) {
            handlePinChange(validValue);
            if (validValue.length === 4) {
                this.handleMobilePinCodeContinueClick(event, validValue);
            }
        }
    };

    handleBackToNumberClick = (): void => {
        const {handleBackToNumberChange} = this.props;
        this.setState({
            isResendPin: false,
            resendCodeTimer: 90,
            isMobileLoader: false,
        });
        clearInterval(this.resendCodeTimeOut);
        handleBackToNumberChange()
    };

    handleResendMobilePinClick = () => {
        const {handlePinChange, handleMobileLoginValidate, handleResponseMessageUpdate} = this.props;
        this.setState({resendCodeTimer: 90, isNumberDisable: true});
        handlePinChange("");
        handleMobileLoginValidate();
        const responseMessage: IResponseMessage = {
            level: "",
            message: "",
            type: ""
        };
        handleResponseMessageUpdate(responseMessage);
        this.resendCodeTimeOut = setInterval(this.handleResendCodeTimeOut, 1000);
        this.setState({isResendPin: false, isNumberDisable: false});
    };

    render() {
        const {isMobileLoader, resendCodeTimer, isNumberDisable, isResendPin, errorMessage} = this.state;
        const {loginParams: {pin, number}} = this.props;
        const localization: any = localizationComponent().login;

        return (
            <>
                <Block>
                    <PinInputBlock>
                        <PinInput
                            type="text"
                            maxLength={4}
                            autoFocus={true}
                            onChange={this.handleMobilePinChange}
                            value={pin}
                        />
                        <SpanHidden/>
                        {
                            isMobileLoader &&
                            <LoadingPage
                                width="20px"
                                height="20px"
                                top="10px"
                                right="10px"
                                position="absolute"
                                backgroundColor="#FFFFFF"
                            >
                                <Loader
                                    backgroundColor="#fff"
                                    width="20px"
                                    height="20px"
                                    background="#FFFFFF"
                                />
                            </LoadingPage>
                        }
                    </PinInputBlock>
                    <DescriptionText padding="0px">
                        {localization.codeSent}<br/><BoldText display="inline" fontSize="15px">+{number}</BoldText>
                    </DescriptionText>
                    <LinkButton
                        marginBottom="58px"
                        onClick={this.handleBackToNumberClick}
                    >
                        {localization.changeNumber}
                    </LinkButton>
                    {
                        isResendPin ?
                            <LinkButton
                                marginBottom="36px"
                                disabled={isNumberDisable}
                                onClick={this.handleResendMobilePinClick}
                            >
                                Resend code
                            </LinkButton> :
                            <DescriptionText marginBottom="28px">{localization.resendSMSTimer(resendCodeTimer)}</DescriptionText>
                    }
                </Block>
                {
                    errorMessage && <ErrorMessage top="146px">{getErrorMessage(errorMessage)}</ErrorMessage>
                }
            </>
        );
    }
}
