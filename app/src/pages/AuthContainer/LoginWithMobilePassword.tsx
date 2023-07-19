"use strict";

import * as React from "react";
import {ICountry} from "services/interfaces";
import {APPLICATION, ENTER_KEY_CODE} from "configs/constants";
import {Block, Button, ErrorMessage, Input, InputContent, LinkButton, MailgoButton} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import {getErrorMessage} from "helpers/DataHelper";
import isEqual from "lodash/isEqual";
import {Loader, LoadingPage} from "../style";
import localizationComponent from "configs/localization";


interface ILoginWithPasswordProps {
    selectedCountry: ICountry;
    mobileDigits: string;
    handleForgotPasswordClick: () => void;
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void;
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    };
    handlePasswordChange: (password: string) => void;
    responseMessage: IResponseMessage;
    isFirstLogin: boolean
}

interface ILoginWithPasswordState {
    errorMessage: string
    isMobileLoader: boolean
}

export default class LoginWithMobilePassword extends React.Component<ILoginWithPasswordProps, ILoginWithPasswordState> {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: "",
            isMobileLoader: false
        }
    }

    _input: HTMLInputElement;
    _caretPosition: number;

    get input(): HTMLInputElement {
        return this._input;
    }

    set input(ref: HTMLInputElement) {
        this._input = ref;
    }

    get caretPosition(): number {
        return this._caretPosition;
    }

    set caretPosition(value: number) {
        this._caretPosition = value;
    }


    componentDidMount(): void {
        window.addEventListener("keypress", this.handleEnterPress);
    }

    componentWillUnmount(): void {
        window.removeEventListener("keypress", this.handleEnterPress);
    }

    componentDidUpdate(prevProps: Readonly<ILoginWithPasswordProps>, prevState: Readonly<ILoginWithPasswordState>, snapshot?: any): void {
        const {responseMessage} = this.props;
        if (this.props.responseMessage.get("message") !== prevProps.responseMessage.get("message")) {
            this.setState({errorMessage: responseMessage.get("message"), isMobileLoader: false})
        }

        if (this.props.loginParams.password !== prevProps.loginParams.password && this.caretPosition) {
            this.input.setSelectionRange(this.caretPosition, this.caretPosition)
        }
    }

    handleEnterPress = (event) => {
        if (event.keyCode === ENTER_KEY_CODE) {
            this.handleMobilePasswordClick();
        }
    };

    handleMobilePasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const {handlePasswordChange, loginParams} = this.props;

        const caretPosition: number = event.currentTarget.selectionStart;
        let newCaretPosition: number;
        const value: string = event.currentTarget.value;
        const validValue = value.split("").filter(el => el.charCodeAt(0) !== 32 && el.charCodeAt(0) !== 9);
        newCaretPosition = caretPosition - (value.length - validValue.length);

        this.caretPosition = newCaretPosition;

        if (validValue.join("") !== loginParams.password) {
            handlePasswordChange(validValue.join(""))
        }
    };

    handleMobilePasswordClick = () => {
        const {handleUserSignIn, loginParams: {password}} = this.props;
        const {isMobileLoader} = this.state;

        if (!password.length) {
            return
        }

        if (!isMobileLoader) {
            this.setState({isMobileLoader: true});

            handleUserSignIn();
        }
    };

    handleMobileForgotPasswordClick = () => {
        const {handleForgotPasswordClick, handlePasswordChange} = this.props;
        handlePasswordChange("");

        handleForgotPasswordClick();
    };

    render() {
        const {loginParams: {password}} = this.props;
        const {errorMessage, isMobileLoader} = this.state;
        const localization: any = localizationComponent().login;
        return (
            <>
                <Block>
                    <InputContent marginBottom="25px">
                        <Input
                            textAlign="left"
                            padding="0 5px"
                            onChange={this.handleMobilePasswordChange}
                            id="registration_input"
                            autoFocus={true}
                            type="password"
                            placeholder={localization.password}
                            value={password}
                            pattern="\w{8}"
                            ref={ref => this.input = ref}
                        />
                        {
                            isMobileLoader &&
                            <LoadingPage
                                width="20px"
                                height="20px"
                                top="15px"
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
                    </InputContent>
                    {!APPLICATION.WITHOUTPIN ? <LinkButton marginBottom="36px"
                                 onClick={this.handleMobileForgotPasswordClick}
                    >
                        {localization.forgotPassword}?
                    </LinkButton> : <MailgoButton
                        href={`mailto:${APPLICATION.MAILTO}`}
                    >
                        {localization.forgotPassword}?
                    </MailgoButton>}
                    <Button
                        disabled={!password || password.length === 0}
                        onClick={this.handleMobilePasswordClick}
                    >
                        {localization.continue}
                    </Button>
                </Block>
                {
                    errorMessage && <ErrorMessage>{getErrorMessage(errorMessage) === "Invalid Password" ? localization.invalidPassword : getErrorMessage(errorMessage)}</ErrorMessage>
                }
            </>
        );
    }
}
