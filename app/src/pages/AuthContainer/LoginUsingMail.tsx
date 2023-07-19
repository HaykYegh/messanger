"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import Select, {createFilter, components} from "react-select";
import * as ReactCSSTransitionGroup from "react-addons-css-transition-group";

import {
    Button,
    Content,
    DescriptionText,
    Input,
    InputContent,
    BoldText,
    ErrorMessage,
    LinkButton
} from "./style";
import {
    checkEmailValidate,
    checkPasswordExistEmail,
    ISignInParams,
    singInUsingEmailAndToken
} from "requests/loginRequest";
import {EMAIL_VALIDAITON_REGEX, ENTER_KEY_CODE} from "configs/constants";
import LoginWithMailPassword from "./LoginWIthMailPassword";
import {IResponseMessage} from "modules/user/UserTypes";
import PopUpMain from "components/common/PopUpMain";
import {getAppVersion, getEnv, getLanguage, getOsVersion, getPlatform, renewCancelToken} from "helpers/AppHelper";
import LoginWithMailPin from "./LoginWithMailPin";
import localizationComponent from "configs/localization";
import countriesList from "configs/countries";
import {ICountry} from "services/interfaces";
import {Loader, LoadingPage} from "../style";
import {getDeviceToken, getErrorMessage} from "helpers/DataHelper";

const down_arrow: any = require("assets/images/down_arrow.svg");

import conf from "configs/configurations";
import Log from "modules/messages/Log";

export interface ILoginUsingMailProps {
    userCountry: ICountry;
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void;
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    };
    responseMessage: IResponseMessage;
    handlePinChange: (pin: string) => void;
    handlePasswordChange: (password: string) => void;
    handleEmailChange: (email: string) => void;
    handleResponseMessageUpdate: (responseMessage: IResponseMessage) => void;
    handleSelectedCountryChange: (selectedCountry: ICountry) => void;
    handleInvalidUserError: () => void;
    invalidUserError?: boolean;
}

export interface ILoginUsingMailState {
    isPasswordExists: boolean,
    isPinLogIn: boolean,
    isValidEmail: boolean,
    isEmailLoader: boolean,
    isForgotPassword: boolean,
    isCheckingEmailValidation: boolean,
    errorMessage: string,
    isSelectMenuOpened: boolean,
    isNetworkErrorPopupShown: boolean;
}

const customStyles = {
    option: (provided, state) => ({
        ...provided,
        fontWeight: "500 !important",
        fontSize: "14px !important",
        ":hover": {
            backgroundColor: "#f4f5f7 !important"
        },
        backgroundColor: state.isFocused ? "#f4f5f7 !important" : "#fff"
    }),
    control: (provided, state) => ({
        alignItems: "center",
        borderBottom: "1px solid rgba(199,206,216,0.5)",
        cursor: "pointer",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        minHeight: "50px",
        outline: "0 !important",
        position: "relative",
        boxSizing: "border-box",
        caretColor: state.selectProps.menuIsOpen ? "#1FA6FA" : "transparent",
    }),
    indicatorSeparator: () => ({
        display: "none"
    }),
    singleValue: (provided, state) => ({
        color: "#1FA6FA",
        fontWeight: "500",
        fontSize: "14px",
        display: state.selectProps.menuIsOpen ? 'none' : 'block',
    }),
    container: () => ({
        position: "relative",
        boxSizing: "border-box",
        width: "100%"
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#999999",
        fontSize: "15px",
        fonWeight: "500",
    }),
    // indicatorsContainer: (provided, state) => ({
    //     ...provided,
    //     width: "12px",
    //     height: "6px"
    // }),
};

export default class LoginUsingMail extends React.Component<ILoginUsingMailProps, ILoginUsingMailState> {
    constructor(props) {
        super(props);
        this.state = {
            isPasswordExists: false,
            isPinLogIn: false,
            isValidEmail: false,
            isEmailLoader: false,
            isForgotPassword: false,
            isCheckingEmailValidation: false,
            errorMessage: "",
            isSelectMenuOpened: false,
            isNetworkErrorPopupShown: false
        };
    }

    mounted: boolean;
    _input: HTMLInputElement;
    _caretPosition: number;
    _socket: WebSocket;

    get input(): HTMLInputElement {
        return this._input;
    }

    set input(ref: HTMLInputElement) {
        this._input = ref;
    }

    get socket(): WebSocket {
        return this._socket;
    }

    set socket(ref: WebSocket) {
        this._socket = ref;
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
        const newState: ILoginUsingMailState = {...this.state};
        const {loginParams: {email}} = this.props;
        const pattern: any = new RegExp(EMAIL_VALIDAITON_REGEX, "i");
        newState.isValidEmail = pattern.test(email);
        this.setState(newState);

    }

    componentWillUnmount(): void {
        const {handleEmailChange, handleResponseMessageUpdate} = this.props;
        this.mounted = false;
        if (this.socket) {
            this.socket.close();
        }
        window.removeEventListener("keypress", this.handleEnterPress);
        handleEmailChange("");
        handleResponseMessageUpdate({level: "",
            message: "",
            type: ""})
    }

    componentDidUpdate(prevProps: Readonly<ILoginUsingMailProps>, prevState: Readonly<ILoginUsingMailState>, snapshot?: any): void {
        const {responseMessage} = this.props;
        const {isNetworkErrorPopupShown} = this.state;
        const newState: ILoginUsingMailState = {...this.state};

        if (responseMessage.get("message") === "CUSTOMER_NOT_ALLOWED" && prevProps.responseMessage.get("message") !== "CUSTOMER_NOT_ALLOWED") {
            newState.errorMessage="CUSTOMER_NOT_ALLOWED";
        }

        if (responseMessage.get("message") !== prevProps.responseMessage.get("message") && !isNetworkErrorPopupShown) {
            if (responseMessage.get("message") === "Network Error") {
                newState.errorMessage = '';
                newState.isNetworkErrorPopupShown = true;
            } else {
                newState.errorMessage = responseMessage.get("message");
            }

        } else if (this.state.errorMessage !== "" && !isNetworkErrorPopupShown && (this.state.isPinLogIn || this.state.isPasswordExists)) {
            newState.errorMessage = '';

        }

        if (this.props.loginParams.email !== prevProps.loginParams.email && this.caretPosition) {
            this.input.setSelectionRange(this.caretPosition, this.caretPosition)
        }

        if (!isEqual(newState, this.state)) {
            this.setState(newState);
        }
    }

    handleEnterPress = (event) => {
        const {isValidEmail, isCheckingEmailValidation} = this.state;
        if (event.keyCode === ENTER_KEY_CODE && isValidEmail && !isCheckingEmailValidation) {
            this.handleMailCheck(null);
        }
    };

    handleOldSocketClose = () => {
        if (this.socket) {
            this.socket.close();
        }
    };

    handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const {handleEmailChange, loginParams} = this.props;
        const {email} = loginParams;
        const {isCheckingEmailValidation, isEmailLoader} = this.state;
        const newState: ILoginUsingMailState = {...this.state};
        const caretPosition: number = event.currentTarget.selectionStart;

        let newCaretPosition: number;
        const value: string = event.currentTarget.value;
        const pattern: any = new RegExp(EMAIL_VALIDAITON_REGEX, "i");
        const validValue = value.split("").filter(el => el.charCodeAt(0) !== 32 && el.charCodeAt(0) !== 9);
        newCaretPosition = caretPosition - (value.length - validValue.length);

        this.caretPosition = newCaretPosition;

        const newEmail: string = validValue.join("");
        newState.isValidEmail = pattern.test(validValue.join(""));
        if (newEmail !== email) {
            handleEmailChange(newEmail.toLowerCase())
        }

        if (isCheckingEmailValidation && !isEmailLoader) {
            newState.isCheckingEmailValidation = false;
        }
        this.setState(newState);
    };

    handleMailCheck = (event, isResend: boolean = false): void => {
        renewCancelToken();
        const {userCountry, loginParams: {email}, handleResponseMessageUpdate} = this.props;
        Log.i(email)
        this.setState({isEmailLoader: true, isCheckingEmailValidation: true, isNetworkErrorPopupShown: false});

        (
            async () => {
                let isEmailPasswordExists: boolean  = false;
                if (!isResend) {
                    isEmailPasswordExists = await checkPasswordExistEmail(email);
                }
                if (isEmailPasswordExists) {
                    this.setState({isPasswordExists: true, isPinLogIn: false})
                } else {
                    this.setState({isPasswordExists: false, isPinLogIn: true});

                    const signInParams: ISignInParams = {
                        isDevEnv: getEnv() === "development",
                        platformId: getPlatform().platformId,
                        deviceToken: getDeviceToken(),
                        regionCode: userCountry.regionCode,
                        email,
                    };

                    const username = await singInUsingEmailAndToken(signInParams);

                    if (username !== "") {
                        this.createSocketConnection(username)
                    } else {
                        const responseMessage: IResponseMessage = {
                            level: "ERROR",
                            message: "Email address is incorrect",
                            type: "EMAIL_VALIDATE_FAIL"
                        };
                        handleResponseMessageUpdate(responseMessage)
                    }
                }

                if (this.mounted) {
                    this.setState({isEmailLoader: false, isCheckingEmailValidation: false});
                }
            }
        )().catch(error => {
            Log.i(error);
            const responseMessage: IResponseMessage = {
                level: "ERROR",
                message: error.message,
                type: "EMAIL_VALIDATE_FAIL"
            };
            handleResponseMessageUpdate(responseMessage);
            if (this.mounted) {
                this.setState({isEmailLoader: false});
            }
        });
    };

    createSocketConnection = (username: string) => {
        const {handlePinChange} = this.props;
        try {
            let socket: WebSocket = new WebSocket(conf.signInSocket);
            this.socket = socket;

            socket.onopen = (event) => {
                socket.send(username);
            };

            socket.onmessage = (event) => {
                if (event.data) {
                    if (event.data.includes(username) && event.data.includes("ping")) {
                        const timeStamp: string = event.data.substring(event.data.indexOf("-", event.data.indexOf("-") + 1), event.data.length);
                        socket.send(`pong-${username}${timeStamp}`)
                    } else {
                        handlePinChange(event.data);
                        socket.close();
                    }
                }
            };

            socket.onclose = (event) => {
                Log.i(event);
            };

            socket.onerror = (event) => {
                Log.i(event);
            };

            setTimeout(() => {
                socket.close();
            }, 600000)


        } catch (error) {
            Log.i(error)
        }
    };

    handleForgotPasswordClick = () => {
        this.setState({isForgotPassword: true});
        this.handleMailCheck(null, true);
    };

    handleBackToEmailChange = () => {
        const {handlePasswordChange, handlePinChange} = this.props;
        this.handleOldSocketClose();
        handlePasswordChange('');
        handlePinChange("");
        this.setState({
            isPinLogIn: false,
            isPasswordExists: false,
            isForgotPassword: false,
            isEmailLoader: false,
            isValidEmail: true,
            isCheckingEmailValidation: false
        });
    };

    handleCountryChange = (selected: any): void => {
        const {handleSelectedCountryChange} = this.props;
        handleSelectedCountryChange(selected)
    };

    handleSelectMenuOpen = () => {
        this.setState({isSelectMenuOpened: true})
    };

    handleSelectMenuClose = () => {
        this.setState({isSelectMenuOpened: false})
    };

    handleErrorPopUpHide = () => {
        const {handleResponseMessageUpdate} = this.props;

        this.setState({isNetworkErrorPopupShown: false, isCheckingEmailValidation: false});

        const responseMessage: IResponseMessage = {
            level: "",
            message: "",
        };
        handleResponseMessageUpdate(responseMessage);
    };

    DropdownIndicator = props => {
        return <components.DropdownIndicator {...props}>
            <img src={down_arrow} alt={"down_arrow"}/>
        </components.DropdownIndicator>
    };

    render() {
        const {isValidEmail, isEmailLoader, isCheckingEmailValidation, isPasswordExists, isPinLogIn, isForgotPassword, errorMessage, isSelectMenuOpened, isNetworkErrorPopupShown} = this.state;
        const {userCountry, handleUserSignIn, loginParams, handlePasswordChange, handlePinChange, responseMessage, handleResponseMessageUpdate, handleInvalidUserError, invalidUserError} = this.props;
        const localization: any = localizationComponent().login;

        if (errorMessage === "CUSTOMER_NOT_ALLOWED") {
            handleInvalidUserError();
        }

        return (
            <Content>
                <BoldText>{localization.signIn}</BoldText>

                {
                    !isPasswordExists && !isPinLogIn ?
                    <DescriptionText padding="0" marginBottom="23px">
                        {localization.chooseCountryAndMail}
                    </DescriptionText> :
                        <>
                            {
                                isPasswordExists &&
                                <DescriptionText padding="0" marginBottom="0px">
                                    {localization.enterPassword ? localization.enterPassword : "Please enter your password for"}
                                    <br/>
                                    <BoldText display="inline" fontSize="15px">{loginParams.email}</BoldText>
                                </DescriptionText>
                            }
                            {
                                isPinLogIn &&
                                <DescriptionText padding="0" marginBottom="0px">A verification email was sent to <br/> <BoldText
                                    display="inline" fontSize="15px">{loginParams.email}</BoldText></DescriptionText>
                            }
                            <LinkButton
                                lineHeight="1.35"
                                marginBottom={isPinLogIn ? "41px" : "20px"}
                                className="back-button"
                                onClick={this.handleBackToEmailChange}
                            >
                                {localization.changeEmail}
                            </LinkButton>
                        </>
                }
                {
                    isPasswordExists &&
                    <LoginWithMailPassword
                        handleForgotPasswordClick={this.handleForgotPasswordClick}
                        handlePasswordChange={handlePasswordChange}
                        handleUserSignIn={handleUserSignIn}
                        responseMessage={responseMessage}
                        selectedCountry={userCountry}
                        loginParams={loginParams}
                    />
                }
                {
                    isPinLogIn &&
                    <LoginWithMailPin
                        handleResponseMessageUpdate={handleResponseMessageUpdate}
                        handleBackToEmailChange={this.handleBackToEmailChange}
                        handleUserSignIn={handleUserSignIn}
                        handleOldSocketClose={this.handleOldSocketClose}
                        handleCreateSocketConnection={this.createSocketConnection}
                        isForgotPassword={isForgotPassword}
                        handlePinChange={handlePinChange}
                        responseMessage={responseMessage}
                        selectedCountry={userCountry}
                        loginParams={loginParams}
                    />
                }
                {
                    !isPasswordExists && !isPinLogIn &&
                    <>
                        <Select
                            styles={customStyles}
                            value={isSelectMenuOpened ? null : userCountry}
                            placeholder={"Search"}
                            // components={{DropdownIndicator: this.DropdownIndicator}}
                            id="country"
                            name="country"
                            isMulti={false}
                            closeMenuOnSelect={true}
                            onChange={this.handleCountryChange}
                            options={countriesList}
                            onMenuOpen={this.handleSelectMenuOpen}
                            onMenuClose={this.handleSelectMenuClose}
                            filterOption={createFilter({
                                ignoreCase: false,
                                ignoreAccents: false,
                                trim: false,
                                matchFromStart: true,
                            })}
                        />
                        <InputContent marginBottom="42px" height="51px">
                            <Input
                                textAlign="left"
                                padding="0 5px"
                                placeholder={localization.emailAddress}
                                type="text"
                                value={loginParams.email}
                                onChange={this.handleEmailChange}
                                disabled={isEmailLoader}
                                autoFocus={true}
                                ref={ref => this.input = ref}
                            />
                            {
                                isEmailLoader &&
                                <LoadingPage
                                    width="20px"
                                    height="20px"
                                    top="15px"
                                    right="15px"
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
                        <Button
                            onClick={this.handleMailCheck}
                            disabled={!isValidEmail || isCheckingEmailValidation || loginParams.email === ""}
                        >
                            {localization.continue}
                        </Button>
                    </>
                }
                {
                    errorMessage !== "" && <ErrorMessage>{getErrorMessage(errorMessage)}</ErrorMessage>
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
                        isNetworkErrorPopupShown && <PopUpMain confirmButton={this.handleErrorPopUpHide}
                                                               cancelButton={this.handleErrorPopUpHide}
                                                               confirmButtonText={localization.ok}
                                                               titleText={localization.title}
                                                               infoText={localization.info}
                                                               showPopUpLogo={true}/>
                    }
                </ReactCSSTransitionGroup>
            </Content>
        );
    }
}
