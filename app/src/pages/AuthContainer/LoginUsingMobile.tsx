"use strict";

import * as React from "react";
import Select, {createFilter} from "react-select";
// import {isPossibleNumber} from 'libphonenumber-js';
import { isPossiblePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import * as ReactCSSTransitionGroup from "react-addons-css-transition-group";

import {
    Button,
    Content,
    DescriptionText,
    PhoneDescriptionText,
    Input,
    PhoneCode,
    PhoneNumberBlock,
    BoldText,
    ErrorMessage,
    LinkButton
} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import {mobileLoginValidate, passwordExist as passwordExistRequest} from "requests/loginRequest";
import LoginWithMobilePassword from "./LoginWithMobilePassword";
import localizationComponent from "configs/localization";
import LoginWithMobilePin from "./LoginWithMobilePin";
import PopUpMain from "components/common/PopUpMain";
import {renewCancelToken} from "helpers/AppHelper";
import {getErrorMessage} from "helpers/DataHelper";
import {APPLICATION, ENTER_KEY_CODE} from "configs/constants";
import countriesList from "configs/countries";
import {Loader, LoadingPage} from "../style";
import {ICountry} from "services/interfaces";
import Log from "modules/messages/Log";
import RequestAccount from "./RequestAccount";



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
    indicatorSeparator: (provided, state) => ({
        display: "none"
    }),
    singleValue: (provided, state) => ({
        color: "#1FA6FA",
        fontWeight: "500",
        fontSize: "14px",
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
    })
};

export interface ILoginUsingMobileProps {
    handleUserSignIn: (value?: string, isForgotPassword?: boolean) => void;
    userCountry: ICountry;
    loginParams: {
        pin: string,
        password: string,
        email: string,
        number: string,
    };
    responseMessage: IResponseMessage;
    handlePinChange: (pin: string) => void;
    handlePasswordChange: (password: string) => void;
    handleNumberChange: (number: string) => void;
    handleSelectedCountryChange: (selectedCountry: ICountry) => void;
    handleResponseMessageUpdate: (responseMessage: IResponseMessage) => void;
    changeIsFirstLogin: (isFirstLogin: boolean) => void;
}

export interface ILoginUsingMobileState {
    mobileDigits: string,
    isMobileNumberDisable: boolean,
    isPasswordExists: boolean,
    isPinLogIn: boolean,
    isForgotPassword: boolean,
    isFirstLogin: boolean,
    isRequestAccount: boolean,
    errorMessage: string,
    isMobileLoader: boolean,
    isSelectMenuOpened: boolean,
    isNetworkErrorPopupShown: boolean;
    userDoesNotExist: boolean;
}

export default class LoginUsingMobile extends React.Component<ILoginUsingMobileProps, ILoginUsingMobileState> {
    constructor(props) {
        super(props);
        this.state = {
            mobileDigits: "",
            isMobileNumberDisable: true,
            isPasswordExists: false,
            isPinLogIn: false,
            isRequestAccount: false,
            isForgotPassword: false,
            isFirstLogin: false,
            errorMessage: "",
            isMobileLoader: false,
            isSelectMenuOpened: false,
            isNetworkErrorPopupShown: false,
            userDoesNotExist: false,
        }
    }

    mounted: boolean;
    _input: HTMLInputElement;

    componentDidMount(): void {
        this.mounted = true;
        window.addEventListener("keypress", this.handleEnterPress);
    }

    componentWillUnmount(): void {
        this.mounted = false;
        window.removeEventListener("keypress", this.handleEnterPress);
    }

    componentDidUpdate(prevProps: Readonly<ILoginUsingMobileProps>, prevState: Readonly<ILoginUsingMobileState>, snapshot?: any): void {
        const {responseMessage} = this.props;
        const {isNetworkErrorPopupShown} = this.state;



        if (responseMessage.get("message") !== prevProps.responseMessage.get("message") && !isNetworkErrorPopupShown) {

            if (responseMessage.get("message") === "Network Error") {
                this.setState({errorMessage: "", isNetworkErrorPopupShown: true})
            } else {
                this.setState({errorMessage: responseMessage.get("message")})
            }
        } else if (this.state.errorMessage !== "" && !isNetworkErrorPopupShown && (this.state.isPinLogIn || this.state.isPasswordExists)) {
            this.setState({errorMessage: ""})
        }
    }

    handleEnterPress = (event) => {
        const {isMobileNumberDisable} = this.state;
        if (event.keyCode === ENTER_KEY_CODE && !isMobileNumberDisable) {
            if (!APPLICATION.WITHOUTPIN) {
                this.handleMobileNumberContinueClick()
            } else{
                this.handleMobileNumberContinueClickWithoutPin()
            }
        }
    };

    handleCountryChange = (selected: any): void => {
        const {handleSelectedCountryChange} = this.props;
        handleSelectedCountryChange(selected)
    };

    handleMobileNumberChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const {userCountry, handleNumberChange} = this.props;
        const newState: ILoginUsingMobileState = {...this.state};

        const caretPosition: number = event.currentTarget.selectionStart;
        let pastedValue: string = "";
        let newCaretPosition: number;
        let validInputValue = event.currentTarget.value;
        if (validInputValue.length - newState.mobileDigits.length <= 1) {
            validInputValue = validInputValue.replace(/[^0-9]/, "");
        } else {
            pastedValue = validInputValue;
            let validValues: string[] = validInputValue.split("");
            validValues = validValues.filter(value => value.charCodeAt(0) >= 48 && value.charCodeAt(0) <= 57);
            validInputValue = validValues.join("");
            newCaretPosition = caretPosition - (pastedValue.length - validInputValue.length);
        }

        const phoneNumber: string = `+${userCountry.phoneCode}${validInputValue}`;

        newState.isMobileNumberDisable = false;
        handleNumberChange(phoneNumber.substring(1));
        newState.mobileDigits = validInputValue;

        this.setState(newState, () => {
            if (newCaretPosition) {
                this.input.setSelectionRange(newCaretPosition, newCaretPosition)
            }
        });
    };

    handleMobileNumberContinueClick = () => {
        const newState: ILoginUsingMobileState = {...this.state};
        renewCancelToken();
        this.setState({isMobileLoader: true});

        const {mobileDigits, isForgotPassword} = this.state;
        const {userCountry, loginParams, handleResponseMessageUpdate, changeIsFirstLogin} = this.props;

        this.setState({isMobileNumberDisable: true});

        (async () => {
                const data = await passwordExistRequest(loginParams.number);
                const {email, firstLogin, nickname, number, passwordExist, userExist, username} = data

                if (passwordExist && !isForgotPassword) {
                    newState.isPasswordExists = true;
                    newState.isPinLogIn = false;
                } else {
                    const regionCode = userCountry.regionCode;
                    const selectedCountryPhoneCode: string = userCountry.phoneCode;
                    const isMobileLoginValid = await mobileLoginValidate(mobileDigits, regionCode, selectedCountryPhoneCode);
                    if (isMobileLoginValid) {
                        newState.isPasswordExists = false;
                        newState.isPinLogIn = true;
                        changeIsFirstLogin(!passwordExist)
                    } else {
                        const responseMessage: IResponseMessage = {
                            level: "ERROR",
                            message: "Phone Number is incorrect",
                        };
                        handleResponseMessageUpdate(responseMessage)
                    }
                }

                newState.isMobileNumberDisable = false;
                newState.isMobileLoader = false;
                this.setState(newState)
            }
        )().catch((error) => {
            Log.i(error);
            if (error.message === "USER_DOES_NOT_EXIST") {
                this.setState({userDoesNotExist: true})
            } else {
                const responseMessage: IResponseMessage = {
                    level: "ERROR",
                    message: error.message,
                    type: "NUMBER_VALIDATE_FAIL"
                };
                handleResponseMessageUpdate(responseMessage);
            }

            if (this.mounted) {
                this.setState({isMobileLoader: false})
            }
        });

    };

    handleMobileNumberContinueClickWithoutPin = () => {
        const newState: ILoginUsingMobileState = {...this.state};
        renewCancelToken();
        this.setState({isMobileLoader: true});

        const {mobileDigits, isForgotPassword} = this.state;
        const {userCountry, loginParams, handleResponseMessageUpdate, changeIsFirstLogin} = this.props;


        this.setState({isMobileNumberDisable: true});

        (async () => {
                const data = await passwordExistRequest(loginParams.number);
                const {email, firstLogin, nickname, number, passwordExist, userExist, username} = data
                const localization = localizationComponent().login;

                if (passwordExist && !isForgotPassword) {
                    newState.isPasswordExists = true;
                    newState.isPinLogIn = false;
                    newState.isRequestAccount = false;
                    newState.isFirstLogin = firstLogin;
                    changeIsFirstLogin(firstLogin)
                } else {
                    const regionCode: string = userCountry.regionCode;
                    if (!number || number === userCountry.phoneCode) {
                        const responseMessage: IResponseMessage = {
                            level: "ERROR",
                            message: localization.phoneNumberIsEmpty,
                            type: "NUMBER_VALIDATE_FAIL"
                        };
                        newState.errorMessage = responseMessage.message
                        handleResponseMessageUpdate(responseMessage);
                    } else {

                        const responseMessage: IResponseMessage = {
                            level: "",
                            message: "",
                        };
                        newState.errorMessage = responseMessage.message
                        newState.isRequestAccount = true
                        handleResponseMessageUpdate(responseMessage);
                        // if (!isValidPhoneNumber(loginParams.number, regionCode)) {
                        //     Log.i("regionCode ->", regionCode)
                        //     const responseMessage: IResponseMessage = {
                        //         level: "ERROR",
                        //         message: "Please check, invalid number",
                        //         type: "NUMBER_VALIDATE_FAIL"
                        //     };
                        //     newState.errorMessage = responseMessage.message
                        //     handleResponseMessageUpdate(responseMessage);
                        // } else {
                        //
                        // }
                    }
                }

                newState.isMobileNumberDisable = false;
                newState.isMobileLoader = false;
                this.setState(newState)
            }
        )().catch((error) => {
            Log.i(error);
            if (error.message === "USER_DOES_NOT_EXIST") {
                this.setState({userDoesNotExist: true})
            } else {
                const responseMessage: IResponseMessage = {
                    level: "ERROR",
                    message: error.message,
                    type: "NUMBER_VALIDATE_FAIL"
                };
                handleResponseMessageUpdate(responseMessage);
            }

            if (this.mounted) {
                this.setState({isMobileLoader: false})
            }
        });

    };

    get input(): HTMLInputElement {
        return this._input;
    }

    set input(ref: HTMLInputElement) {
        this._input = ref;
    }

    handleMobileLoginValidate = () => {
        this.setState({isMobileLoader: true});
        const {mobileDigits} = this.state;
        const {userCountry, handleResponseMessageUpdate} = this.props;
        const regionCode = userCountry.regionCode;
        const selectedCountryPhoneCode: string = userCountry.phoneCode;
        (
            async () => {
                const isMobileLoginValid = await mobileLoginValidate(mobileDigits, regionCode, selectedCountryPhoneCode);

                if (isMobileLoginValid) {
                    this.setState({isPinLogIn: true, isPasswordExists: false});
                } else {
                    const responseMessage: IResponseMessage = {
                        level: "ERROR",
                        message: "Phone Number is incorrect",
                    };
                    handleResponseMessageUpdate(responseMessage)
                }
            }
        )().catch((error) => {
            Log.i(error);
            const responseMessage: IResponseMessage = {
                level: "ERROR",
                message: error.message,
                type: "NUMBER_VALIDATE_FAIL"
            };
            handleResponseMessageUpdate(responseMessage);
            if (this.mounted) {
                this.setState({isMobileLoader: false})
            }
        });
    };

    handleForgotPasswordClick = () => {
        this.handleMobileLoginValidate();
        this.setState({isForgotPassword: true})
    };

    handleBackToNumberChange = () => {
        const {handlePasswordChange, handlePinChange} = this.props;
        handlePasswordChange('');
        handlePinChange("");
        this.setState({
            isForgotPassword: false,
            isPinLogIn: false,
            isPasswordExists: false,
            isMobileNumberDisable: false,
            isMobileLoader: false,
            isRequestAccount: false
        })
    };

    handleSelectMenuOpen = () => {
        this.setState({isSelectMenuOpened: true})
    };

    handleSelectMenuClose = () => {
        this.setState({isSelectMenuOpened: false})
    };

    handleErrorPopUpHide = () => {
        const {handleResponseMessageUpdate} = this.props;

        this.setState({isNetworkErrorPopupShown: false, isMobileNumberDisable: false});

        const responseMessage: IResponseMessage = {
            level: "",
            message: "",
        };
        handleResponseMessageUpdate(responseMessage);
    };

    render() {
        const {mobileDigits, isMobileNumberDisable, isPasswordExists, isPinLogIn, isRequestAccount, isFirstLogin, isForgotPassword, isMobileLoader, errorMessage, isSelectMenuOpened, isNetworkErrorPopupShown} = this.state;
        const {handleUserSignIn, userCountry, loginParams, handlePasswordChange, responseMessage, handlePinChange, handleResponseMessageUpdate} = this.props;

        const localization: any = localizationComponent().login;

        return (
            <Content>
                {/*<BoldText>{isPinLogIn ? `${localization.yourCode}` : `${localization.signIn}`}</BoldText>*/}
                {/*{*/}
                {/*    !isPasswordExists && !isPinLogIn &&*/}
                {/*    <div>*/}
                {/*        <PhoneDescriptionText>*/}
                {/*            /!*{localization.chooseCountryAndNumber ? localization.chooseCountryAndNumber : <>Please choose your country <br/> and specify your phone number</>}*!/*/}
                {/*            {localization.usePhoneText1}*/}
                {/*            </PhoneDescriptionText>*/}
                {/*        <PhoneDescriptionText padding="0" marginBottom="23px">*/}
                {/*            {localization.usePhoneText2}*/}
                {/*        </PhoneDescriptionText>*/}
                {/*    </div>*/}
                {/*}*/}
                {
                    isPasswordExists &&
                    <>
                        <DescriptionText padding="0" marginBottom="0px">
                            {localization.enterPassword ? localization.enterPassword : "Please enter your password for"}
                            <br/> <BoldText display="inline" fontSize="15px">+{loginParams.number}</BoldText></DescriptionText>
                            <LinkButton
                                lineHeight="1.35"
                                marginBottom="20px"
                                className="back-button"
                                onClick={this.handleBackToNumberChange}
                            >
                                {localization.changeNumber}
                            </LinkButton>
                    </>
                }
                {
                    isPasswordExists &&
                    <LoginWithMobilePassword
                        mobileDigits={mobileDigits}
                        selectedCountry={userCountry}
                        handleUserSignIn={handleUserSignIn}
                        handleForgotPasswordClick={this.handleForgotPasswordClick}
                        loginParams={loginParams}
                        handlePasswordChange={handlePasswordChange}
                        responseMessage={responseMessage}
                        isFirstLogin={isFirstLogin}
                    />
                }
                {
                    isPinLogIn &&
                    <LoginWithMobilePin
                        handleUserSignIn={handleUserSignIn}
                        selectedCountry={userCountry}
                        isMobileNumberDisable={isMobileNumberDisable}
                        mobileDigits={mobileDigits}
                        isForgotPassword={isForgotPassword}
                        loginParams={loginParams}
                        handlePinChange={handlePinChange}
                        handleMobileLoginValidate={this.handleMobileLoginValidate}
                        handleBackToNumberChange={this.handleBackToNumberChange}
                        responseMessage={responseMessage}
                        handleResponseMessageUpdate={handleResponseMessageUpdate}
                    />
                }
                {
                    isRequestAccount &&
                    <RequestAccount
                        handleBackToNumberChange={this.handleBackToNumberChange}
                    />
                }
                {
                    !isPasswordExists && !isPinLogIn && !isRequestAccount &&
                    <>
                        {!APPLICATION.WITHOUTCOUNTRY && <Select
                            styles={customStyles}
                            value={isSelectMenuOpened ? null : userCountry}
                            id="country"
                            name="country"
                            placeholder={"Search"}
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
                        />}
                        <PhoneNumberBlock>
                            <PhoneCode id="phoneCode">
                                +{userCountry ? userCountry.phoneCode : null}
                            </PhoneCode>
                            <Input
                                padding="25px 5px"
                                type="text"
                                id="phoneNumber"
                                autoComplete="off"
                                data-popup={false}
                                placeholder={localization.phoneNumber}
                                value={mobileDigits}
                                onChange={this.handleMobileNumberChange}
                                ref={ref => this.input = ref}
                                autoFocus={true}
                            />
                            {
                                isMobileLoader &&
                                <LoadingPage
                                    style={{
                                        transform: "translateY(-50%)"
                                    }}
                                    width="20px"
                                    height="20px"
                                    top="50%"
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
                        </PhoneNumberBlock>
                        {
                            errorMessage !== "" && <ErrorMessage>{getErrorMessage(errorMessage)}</ErrorMessage>
                        }
                        <Button
                            type={"submit"}
                            className={`button ${isMobileNumberDisable ? "button-disable " : "button-primary"}`}
                            // disabled={isMobileNumberDisable}
                            onClick={!APPLICATION.WITHOUTPIN ? this.handleMobileNumberContinueClick : this.handleMobileNumberContinueClickWithoutPin}
                        >
                            {localization.continue ? localization.continue : "Continue"}
                        </Button>
                    </>
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
