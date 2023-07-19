"use strict";

import * as React from "react";
import CircularLoader from "components/common/loaders/CircularLoader";
import {ENTER_KEY_CODE} from "configs/constants";
import {Block, Button, ErrorMessage, Input, InputContent, LinkButton} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import isEqual from "lodash/isEqual";
import {Loader, LoadingPage} from "../style";
import {getErrorMessage} from "helpers/DataHelper";
import {is} from "immutable";
import localizationComponent from "configs/localization";

interface ILoginWithMailPasswordState {
    isEmailLoader: boolean;
    signInLoader: boolean;
    errorMessage: string;
    everBeenShownErrorMessage: boolean;
}

interface ILoginWithMailPasswordProps {
    selectedCountry: any;
    handleForgotPasswordClick: () => void;
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void;
    loginParams: {
        pin: string;
        password: string;
        email: string;
        number: string;
    };
    handlePasswordChange: (password: string) => void;
    responseMessage: IResponseMessage;
}

export default class LoginWithMailPassword extends React.Component<ILoginWithMailPasswordProps, ILoginWithMailPasswordState> {
    constructor(props) {
        super(props);
        this.state = {
            isEmailLoader: false,
            signInLoader: false,
            errorMessage: "",
            everBeenShownErrorMessage: false,
        }
    }

    mounted: boolean;
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
        this.mounted = true;
        window.addEventListener("keypress", this.handleEnterPress);
    }

    componentWillUnmount(): void {
        this.mounted = false;
        window.removeEventListener("keypress", this.handleEnterPress);
    }

    componentDidUpdate(prevProps: Readonly<ILoginWithMailPasswordProps>, prevState: Readonly<ILoginWithMailPasswordState>, snapshot?: any): void {
        const {responseMessage} = this.props;
        const {everBeenShownErrorMessage, signInLoader} = this.state;

        if (this.props.responseMessage.get("message") !== prevProps.responseMessage.get("message")) {
            const newState: ILoginWithMailPasswordState = {...this.state};
            newState.errorMessage = responseMessage.get("message");
            newState.isEmailLoader = false;

            if (!everBeenShownErrorMessage && responseMessage.get("message").length > 0) {
                newState.everBeenShownErrorMessage = true;
            }
            this.setState(newState);
        }

        if (this.props.loginParams.password !== prevProps.loginParams.password && this.caretPosition) {
            this.input.setSelectionRange(this.caretPosition, this.caretPosition)
        }
    }

    handleEnterPress = (event) => {
        const {loginParams: {password}} = this.props;
        if (event.keyCode === ENTER_KEY_CODE && password.length !== 0) {
            this.handleEmailPasswordCheck();
        }
    };

    handleEmailPasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const {loginParams: {password}, handlePasswordChange} = this.props;
        const caretPosition: number = event.currentTarget.selectionStart;
        let newCaretPosition: number;
        const value: string = event.currentTarget.value;
        const validValue = value.split("").filter(el => el.charCodeAt(0) !== 32 && el.charCodeAt(0) !== 9);
        newCaretPosition = caretPosition - (value.length - validValue.length);

        this.caretPosition = newCaretPosition;

        if (validValue.join("") !== password) {
            handlePasswordChange(validValue.join(""));
        }
    };

    handleForgotPasswordContinue = () => {
        const {handleForgotPasswordClick, handlePasswordChange} = this.props;
        handlePasswordChange("");
        handleForgotPasswordClick();
    };

    handleEmailPasswordCheck = (): void => {
        const {handleUserSignIn} = this.props;
        const {isEmailLoader} = {...this.state};

        if (!isEmailLoader) {
            this.setState({isEmailLoader: true, signInLoader: true});

            setTimeout(() => {
                this.setState({signInLoader: false});
            }, 1000);

            if (this.mounted) {
                handleUserSignIn()
            }
        }
    };

    render() {
        const {isEmailLoader, errorMessage, everBeenShownErrorMessage, signInLoader} = this.state;
        const {loginParams: {password}} = this.props;
        const localization =localizationComponent().login;

        return (
            <>
                <Block>
                    <InputContent marginBottom="25px">
                        <Input
                            textAlign="left"
                            padding="0 5px"
                            onChange={this.handleEmailPasswordChange}
                            id="registration_input"
                            autoFocus={true}
                            type="password"
                            placeholder={localization.password}
                            value={password}
                            pattern="\w{8}"
                            ref={ref => this.input = ref}
                        />
                        {
                            isEmailLoader &&
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
                    <LinkButton marginBottom="36px"
                                onClick={this.handleForgotPasswordContinue}
                    >{localization.forgotPassword}
                    </LinkButton>
                    <Button
                        disabled={!password || password.length === 0}
                        onClick={this.handleEmailPasswordCheck}>
                        {signInLoader ? <Loader
                            backgroundColor="#fff"
                            width="20px"
                            height="20px"
                            circleColor="#FFFFFF"
                            background="#17ABF6"
                        /> : localization.continue}
                    </Button>
                </Block>
                {(errorMessage || everBeenShownErrorMessage) && <ErrorMessage height="24px">
                    {getErrorMessage(errorMessage) === "Invalid Password" ? localization.invalidPassword : getErrorMessage(errorMessage)}
                </ErrorMessage>}
            </>
        );
    }

}
