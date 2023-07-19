"use strict";

import * as React from "react";
import Select from "react-select";
import {connect} from "react-redux";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import phoneParse from "libphonenumber-js/es6/parse";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const metadata = require('libphonenumber-js/metadata.min.json');

import {
    APPLICATION,
    AUTHENTICATION_STEPS,
    AUTHENTICATION_TABS,
    DOWN_KEY_CODE, EMAIL_REGISTRATION_KEY, EMAIL_VALIDAITON_REGEX,
    ENTER_KEY_CODE, LOG_TYPES,
    MODAL_TYPES,
    SET_PASSWORD_ERROR,
    UP_KEY_CODE
} from "configs/constants";
import {
    checkEmailValidate,
    checkPasswordExistEmail,
    getEmailLoginDetails
} from "requests/loginRequest";
import {attemptSignIn, CLEAR_ERROR_MESSAGE} from "modules/user/UserActions";
import {sendVerificationCode} from "requests/loginRequest";
import AvatarCropper from "components/common/AvatarCropper";
import {mobileLoginValidate} from "requests/loginRequest";
import {getUserLocation} from "requests/locationRequest";
import {getAppData, writeLog} from "helpers/DataHelper";
import selector, {IStoreProps} from "services/selector";
import {signInByPassword} from "requests/loginRequest";
import {mobilePinSignIn} from "requests/loginRequest";
import {passwordExist} from "requests/loginRequest";
import PopUpMain from "components/common/PopUpMain";
import {renewCancelToken} from "helpers/AppHelper";
import Avatar from "components/contacts/Avatar";
import {getThumbnail} from "helpers/FileHelper";
import components from "configs/localization";
import countriesList from "configs/countries";

import "scss/pages/authentication/Login";
import CircularLoader from "components/common/loaders/CircularLoader";
import Log from "modules/messages/Log";

interface ILoginUsingMobileProps extends IStoreProps {
    attemptSignIn: (data: { username: string, accessToken?: string, password?: string, email?: string, firstName?: string, lastName?: string, avatar?: any, networks?: any }) => void;
    changeSetting: (path: string[], value: boolean | string) => void;
    CLEAR_ERROR_MESSAGE: () => void;
    loading: boolean;
}

interface ILoginUsingMobileState {
    countries: Array<any>;
    selectedCountry: any;
    location: any;
    capsLock: boolean;
    showError: boolean;
    qrRefresh: boolean;
    qrLoader: boolean;
    form: {
        phoneNumber: string;
        disabled: boolean;
        typedNumber: string;
        phoneDigits: string,
        err: any;
    };
    credentials: {
        pin?: string;
        password?: string;
        confirmPassword?: string;
    };
    modal: {
        type: any;
        show: boolean;

    };
    onLine?: boolean;
    hasPassword: any;
    step: any;
    emailRegistrationStep: any;
    loadingAnimation: boolean;
    tabs: any;
    activeTab: any;
    QRValue: string;
    //email state
    email: string;
    emailLoader: boolean;
    emailPin: string;
    resendEmailCodeTimer: number;
    resendEmailPin: boolean;
    pinCode: string;
    validEmail: boolean;
    emailPassword: string;
    emailNumber: string;
    emailAccessToken: string;
    emailFirstName: string;
    emailLastName: string;
    emailError: string;
    networks: any;
    file: File | Blob;
    avatar: any;
    isCheckingEmailValidation: boolean;
    // mobile number new state
    mobileNumber: string;
    mobileDigits: string;
    mobilePin: string;
    resendMobileCodeTimer: number;
    resendMobilePin: boolean;
    mobileNumberDisable: boolean;
    mobilePassword: string;
    mobilePinCode: string;
    mobileLoader: boolean;
    mobileError: string;
}

class LoginUsingMobile extends React.Component<ILoginUsingMobileProps, ILoginUsingMobileState> {

    qrTimeOut: any;
    timeOut: any;
    mounted: boolean;
    resendEmailCodeTimeOut: any;
    resendMobileCodeTimeOut: any;

    constructor(props) {
        super(props);

        this.state = {
            countries: countriesList,
            selectedCountry: {},
            capsLock: false,
            qrRefresh: false,
            qrLoader: false,
            location: {},
            showError: true,
            form: {
                phoneNumber: "",
                typedNumber: "",
                phoneDigits: "",
                disabled: true,
                err: ""
            },
            credentials: {
                pin: "",
                password: "",
                confirmPassword: ""
            },
            email: "",
            emailPin: "",
            validEmail: false,
            emailLoader: false,
            resendEmailCodeTimer: 90,
            resendEmailPin: false,
            pinCode: "",
            emailPassword: "",
            emailNumber: "",
            emailAccessToken: "",
            emailFirstName: "",
            emailLastName: "",
            networks: null,
            file: null,
            avatar: null,
            isCheckingEmailValidation: false,
            emailError: "",
            modal: {
                type: MODAL_TYPES.AUTHENTICATION.CLOSED,
                show: false,
            },
            onLine: false,
            hasPassword: false,
            step: AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION,
            emailRegistrationStep: AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.EMAIL_CONFIRMATION,
            loadingAnimation: true, /** <- put this to layout **/

            tabs: AUTHENTICATION_TABS,

            activeTab: AUTHENTICATION_TABS[0],
            QRValue: '',

            mobileNumber: "",
            mobileDigits: "",
            mobileNumberDisable: true,
            resendMobileCodeTimer: 90,
            resendMobilePin: false,
            mobilePassword: "",
            mobilePinCode: "",
            mobilePin: "",
            mobileLoader: false,
            mobileError: "",
        }
    }

    componentDidMount() {
        this.mounted = true;
        this.handleQrRefreshShow();
        window.addEventListener("online", this.onlineHandler);
        window.addEventListener("offline", this.onlineHandler);
        window.addEventListener("keypress", this.handleEnterPress);
        window.addEventListener("keydown", this.handleInputKeyboardPress);
        if (navigator.onLine) {
            this.handleGetQRAndLogin();
        }
    };

    shouldComponentUpdate(nextProps: ILoginUsingMobileProps, nextState: ILoginUsingMobileState): boolean {
        return !isEqual(this.state, nextState);
    }

    componentWillUnmount(): void {
        window.removeEventListener("online", this.onlineHandler);
        window.removeEventListener("offline", this.onlineHandler);
        window.removeEventListener("keypress", this.handleEnterPress);
        window.removeEventListener("keydown", this.handleInputKeyboardPress);
        this.mounted = false;
        clearTimeout(this.timeOut);
        clearTimeout(this.qrTimeOut);
        clearInterval(this.resendEmailCodeTimeOut);
        clearInterval(this.resendMobileCodeTimeOut);
    }

    handleCountryChange = (selected: any): void => {
        const {form} = this.state;
        const newState: ILoginUsingMobileState = {...this.state};
        const phoneNumber: string = `+${selected.phone_code + form.typedNumber}`;
        const parsedNumber: any = phoneParse.call(this, phoneNumber, {extended: true}, metadata);
        newState.selectedCountry = selected;
        newState.form.disabled = !parsedNumber.possible;
        this.setState(newState);
    };

    handlePhoneNumberChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const {selectedCountry}: ILoginUsingMobileState = this.state;
        const newState: ILoginUsingMobileState = {...this.state};
        const phoneNumber: string = `+${selectedCountry.phone_code + value}`;
        const parsedNumber: any = phoneParse.call(this, phoneNumber, {extended: true}, metadata);
        newState.form.disabled = !parsedNumber.possible;
        newState.form.phoneNumber = phoneNumber;
        newState.form.phoneDigits = value;
        this.setState(newState);
    };

    handleCapsLockStatus = (event): void => {
        const kc: number = event.keyCode ? event.keyCode : event.which;
        const sk: boolean = event.shiftKey || kc === 16;
        this.setState({capsLock: ((kc >= 65 && kc <= 90) && !sk) || ((kc >= 97 && kc <= 122) && sk)});
    };

    handleQrRefreshShow = () => {
        this.qrTimeOut = setTimeout(() => {
            this.setState({qrRefresh: true, QRValue: "", qrLoader: false});
            clearTimeout(this.timeOut);
        }, 600000)
    };

    handleQrRefreshClick = () => {
        clearTimeout(this.qrTimeOut);
        this.setState({qrRefresh: false, qrLoader: true});
        if (navigator.onLine) {
            this.handleGetQRAndLogin();
        }
        this.handleQrRefreshShow();
    };

    handleForgotPassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const newState: ILoginUsingMobileState = {...this.state};

        localStorage.removeItem('setVerifyCodeCount');

        newState.step = AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION;
        newState.modal.type = MODAL_TYPES.AUTHENTICATION.CLOSED;
        newState.modal.show = false;
        newState.form.disabled = true;
        this.setState(newState);

    };

    handleGetQRAndLogin = (state?: ILoginUsingMobileState): void => {
        const {countries} = this.state;
        const newState: ILoginUsingMobileState = state || {...this.state};

        // getQRCode(false).then(data => {
        //     const {qrRefresh} = this.state;
        //     if (this.mounted && !qrRefresh) {
        //         this.setState({QRValue: data.QRValue, qrLoader: false}, () => {
        //             getQRCode(data.QRValue)
        //                 .then(data => {
        //                     if (data && data.username && data.accessToken) {
        //                         const {username, accessToken, email} = data;
        //                         attemptSignIn({username, accessToken, email});
        //                     }
        //                 })
        //                 .catch(() => {
        //                     this.timeOut = setTimeout(() => {
        //                         handleGetQRAndLogin();
        //                     }, 5000)
        //                 });
        //         })
        //     }
        // }).catch((e) => {
        //     console.log(e, "#### handleGetQRAndLogin");
        //     this.timeOut = setTimeout(() => {
        //         handleGetQRAndLogin();
        //     }, 5000)
        // });

        getUserLocation().then(resp => {
            const {data: {status, body: {countryCode}}}: any = resp;
            let country: any = {};
            if (status === "SUCCESS" && countryCode) {
                country = countries.find(country => country.sort_name === countryCode);
            } else {
                country = countries[0];
            }

            if (country && !isEmpty(country)) {
                newState.selectedCountry = country;
            }

            newState.location = window.location;
            newState.loadingAnimation = false;
            newState.showError = false;
            newState.onLine = navigator.onLine;
            if (this.mounted) {
                this.setState(newState);

            }
        }).catch(err => {
            Log.e(err);
            newState.loadingAnimation = false;
            if (this.mounted) {
                this.setState(newState);
            }
        });
    };

    onlineHandler = (): void => {
        const {loadingAnimation} = this.state;
        const newState: ILoginUsingMobileState = {...this.state};
        const onLine: boolean = navigator.onLine;

        if (onLine && loadingAnimation) {
            this.handleGetQRAndLogin(newState);
        }

        writeLog(LOG_TYPES.internet, {
            status: onLine ? "online" : "offline",
            loginPage: true
        });
        newState.onLine = onLine;
        this.setState(newState);
    };

    handlePinCodeChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};
        newState.credentials.pin = value;
        this.setState(newState);
    };

    handlePasswordChange = ({currentTarget: {value, name}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};

        if (name === "password") {
            newState.credentials["password"] = value;
        }
        if (name === "confirmPassword") {
            newState.credentials["confirmPassword"] = value;
        }

        this.setState(newState);
    };

    handleUserPasswordChange = ({currentTarget: {value, name}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};

        if (name === "password") {
            newState.credentials["password"] = value;
        }

        this.setState(newState);
    };

    handlePinCodeSubmit = async (e: React.MouseEvent<HTMLFormElement>): Promise<any> => {
        e.preventDefault();
        const {form, credentials: {pin}} = this.state;
        const newState: ILoginUsingMobileState = {...this.state};
        const username: any = form.phoneNumber.substring(1);
        const password: any = Date.now();
        const verified: any = await sendVerificationCode({username, pin, password});
        if (verified.data.status === "SUCCESS") {
            newState.form.err = "";
            newState.form.disabled = true;
            newState.step = AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.SET_PASSWORD;
        } else {
            newState.form.err = "Invalid code";
        }
        this.setState(newState);
        return false;
    };

    handlePasswordSubmit = async (e: React.MouseEvent<HTMLFormElement>): Promise<any> => {
        e.preventDefault();

        const {form, credentials: {pin, password, confirmPassword}} = this.state;
        const {attemptSignIn} = this.props;
        const newState: ILoginUsingMobileState = {...this.state};

        if (password === confirmPassword) {
            const username: any = form.phoneNumber.substring(1);
            const verified: any = await sendVerificationCode({username, pin, password});

            if (verified.data.status === "SUCCESS") {
                newState.form.err = "";
                localStorage.setItem("setVerifyCodeCount", "1");
                attemptSignIn({username, password});
            } else {
                newState.form.err = "Cannot set password";
                newState.form.disabled = true;
                this.setState(newState);

            }
        } else {
            newState.form.err = "Password does not match";
            newState.form.disabled = true;
            this.setState(newState);
        }
        return false;
    };

    handleUserLoginSubmit = async (e: React.MouseEvent<HTMLFormElement>): Promise<any> => {
        e.preventDefault();
        this.handleLogin();
    };

    handleLogin = (): void => {
        const {form, credentials: {password}} = this.state;
        const {attemptSignIn} = this.props;
        const newState: ILoginUsingMobileState = {...this.state};
        const username: any = form.phoneNumber.substring(1);
        newState.showError = true;
        newState.form.disabled = true;
        this.setState(newState);
        attemptSignIn({username, password});
    };

    handleTabChange = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        const activeTabKey = e.currentTarget.getAttribute("data-tab");
        this.setState({activeTab: {KEY: activeTabKey}});
    };

    handleSignUp = (): void => {
        const newState: ILoginUsingMobileState = {...this.state};
        newState.form = {
            phoneNumber: "",
            typedNumber: "",
            phoneDigits: "",
            disabled: true,
            err: ""
        };
        newState.activeTab = AUTHENTICATION_TABS[0].KEY;
        newState.step = AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION;
        this.setState(newState);
    };

    handleEnterPress = async (e: any): Promise<any> => {
        const {emailRegistrationStep, activeTab, validEmail, emailPin, emailFirstName, emailLastName, emailPassword, step} = this.state;
        if (e.keyCode === ENTER_KEY_CODE) {
            switch (activeTab.KEY) {
                case "LOGIN_USING_MOBILE":
                    if (step === AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION) {
                        this.handleMobileNumberContinueClick();
                    } else if (step === AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.TYPE_PASSWORD) {
                        this.handleMobilePasswordClick();
                    }
                    break;
                case EMAIL_REGISTRATION_KEY:
                    switch (emailRegistrationStep) {
                        case AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.EMAIL_CONFIRMATION:
                            if (validEmail) {
                                this.handleMailCheck();
                            }
                            break;
                        case AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.VERIFY_CODE_CONFIRMATION:
                            if (emailPin && emailPin.length === 4) {
                                this.handleEmailPinCodeContinueClick();
                            }
                            break;
                        case AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.SET_PROFILE_DETAILS:
                            if (emailFirstName && emailLastName) {
                                this.handleProfileInfoSet();
                            }
                            break;
                        case AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.TYPE_PASSWORD:
                            if (emailPassword && emailPassword.length > 0) {
                                this.handleEmailPasswordCheck();
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "LOGIN_USING_QR":
                default:
                    break;
            }
        }
    };

    handleInputKeyboardPress = (e: any): void => {
        if (e.keyCode === DOWN_KEY_CODE || e.keyCode === UP_KEY_CODE) {
            e.preventDefault();
        }
    };

    clearErrorMessage = (): void => {
        const {CLEAR_ERROR_MESSAGE} = this.props;
        CLEAR_ERROR_MESSAGE();
    };

    handleResendEmailCodeTimeOut = (): void => {
        const {resendEmailCodeTimer} = this.state;
        this.setState({resendEmailCodeTimer: resendEmailCodeTimer - 1});
        if (resendEmailCodeTimer <= 0) {
            clearInterval(this.resendEmailCodeTimeOut);
            this.setState({resendEmailPin: true});

        }
    };

    handleResendEmailPinClick = async (): Promise<any> => {
        const {email, selectedCountry} = this.state;
        const regionCode: string = selectedCountry.sort_name || "AM"; // Todo remove hard code region code
        this.setState({resendEmailCodeTimer: 90, isCheckingEmailValidation: true});
        try {
            const {data: {status}} = await checkEmailValidate(email, regionCode);
            if (status === "SUCCESS") {
                this.resendEmailCodeTimeOut = setInterval(this.handleResendEmailCodeTimeOut, 1000);
                this.setState({resendEmailPin: false});
            }
        } catch (error) {
            Log.i(error);
        } finally {
            this.setState({isCheckingEmailValidation: false});
        }
    };

    handleMailCheck = (): void => {
        renewCancelToken();
        const {email, selectedCountry} = this.state;
        const newState: ILoginUsingMobileState = {...this.state};
        newState.emailLoader = true;
        newState.isCheckingEmailValidation = true;
        this.setState(newState);

        (
            async () => {
                const {data: {body}} = await checkPasswordExistEmail(email);

                if (body) {
                    newState.emailRegistrationStep = AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.TYPE_PASSWORD
                } else {
                    const regionCode: string = selectedCountry.sort_name || "AM"; // Todo

                    const {data: {status}} = await checkEmailValidate(email, regionCode);

                    if (status === "SUCCESS") {
                        newState.emailRegistrationStep = AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.VERIFY_CODE_CONFIRMATION;
                        this.resendEmailCodeTimeOut = setInterval(this.handleResendEmailCodeTimeOut, 1000);
                    } else {
                        Log.i("Status Failed");
                    }
                }

                newState.emailLoader = false;
                newState.isCheckingEmailValidation = false;
                if (this.mounted) {
                    this.setState(newState);
                }


            }
        )().catch(err => {
            Log.i(err);
            newState.emailLoader = false;
            if (this.mounted) {
                this.setState(newState);
            }
        });
    };

    handleBackToMailClick = (): void => {
        this.setState({
            emailRegistrationStep: AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.EMAIL_CONFIRMATION,
            resendEmailPin: false,
            resendEmailCodeTimer: 90,
            pinCode: ""
        });
        clearInterval(this.resendEmailCodeTimeOut);
    };

    handleEmailPinCodeContinueClick = (): void => {
        const {emailPin, email, selectedCountry} = this.state;
        const {attemptSignIn} = this.props;

        this.setState({emailLoader: true});

        if (emailPin) {
            (
                async () => {
                    const regionCode = selectedCountry.sort_name || "AM"; // Todo 'AM' refactor
                    const loginData = await getEmailLoginDetails(email, regionCode, emailPin);
                    const {username, accessToken, isRegistered, networks} = loginData;
                    if (username && accessToken) {
                        if (isRegistered) {
                            this.setState({
                                emailRegistrationStep: AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.SET_PROFILE_DETAILS,
                                resendEmailPin: false,
                                resendEmailCodeTimer: 90,
                                emailNumber: username,
                                emailAccessToken: accessToken,
                                networks: networks,
                                emailError: ""
                            });
                            clearInterval(this.resendEmailCodeTimeOut);
                        } else {
                            attemptSignIn({username, accessToken, email, networks});
                        }
                    } else {
                        this.setState({emailError: "Wrong Pin", emailLoader: false})
                    }
                }
            )().catch(() => {
                if (this.mounted) {
                    this.setState({emailLoader: false});
                }
            })
        } else {
            this.setState({emailLoader: false});
        }
    };

    handleEmailChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};
        const pattern: any = new RegExp(EMAIL_VALIDAITON_REGEX, "i");
        newState.validEmail = pattern.test(value);
        if (value !== newState.email) {
            newState.email = value.toLowerCase();
        }
        this.setState(newState);
    };

    handleEmailPinChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};

        const regexp = /[^0-9]/;
        value = value.replace(regexp, "");

        if (value !== newState.emailPin) {
            newState.emailPin = value;
            newState.emailError = "";
            this.setState(newState, () => {
                if (value.length === 4) {
                    this.handleEmailPinCodeContinueClick();
                }
            })
        }
    };

    handleEmailPinPast = (e: any): void => {
        e.preventDefault();
        const currentPosition: number = e.target.selectionStart;
        const clipboardData: any = e.clipboardData;
        let pastedData: string = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: ILoginUsingMobileState = {...this.state};

            const filteredNumbersText = filteredNumbers.join("");
            const newPin: string = newState.emailPin.slice(0, currentPosition) + filteredNumbersText + newState.emailPin.slice(currentPosition);

            newState.emailPin = newPin.slice(0, 4);
            newState.emailError = "";

            if (newState.emailPin.length === 4) {
                this.setState(newState, () => this.handleEmailPinCodeContinueClick());

            } else {
                this.setState(newState);
            }
        }
    };

    handleEmailPasswordChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const {emailPassword} = this.state;
        if (value !== emailPassword) {
            this.setState({emailPassword: value.toLowerCase()});
        }
    };

    handleEmailPasswordCheck = (): void => {
        const {emailPassword, email, selectedCountry} = this.state;
        const {attemptSignIn} = this.props;
        const newState: ILoginUsingMobileState = {...this.state};
        newState.emailLoader = true;
        this.setState(newState);

        if (!emailPassword.length) {
            return
        }

        (async () => {
                const regionCode = selectedCountry.sort_name || "AM";// Todo 'AM' refactor

                const loginData: any = await getEmailLoginDetails(email, regionCode, "", emailPassword);
                const {username, accessToken, status} = loginData;

                newState.emailLoader = false;
                if (this.mounted) {
                    if (status === "SUCCESS") {
                        newState.emailError = " ";
                        if (username && accessToken) {
                            this.setState(newState);
                            attemptSignIn({username, accessToken, email});
                        }
                    } else {
                        newState.emailError = "Wrong Password";
                        this.setState(newState);
                    }
                }
            }
        )().catch(err => {
            Log.i(err);
            newState.emailLoader = false;
            if (this.mounted) {
                this.setState(newState);
            }
        });
    };

    handleAvatarChange = async ({currentTarget}: React.ChangeEvent<HTMLInputElement>): Promise<any> => {
        if (currentTarget.files[0]) {
            const avatar = await getThumbnail(currentTarget.files[0], false);
            const dataURI: string = atob(avatar.img);
            const ab: ArrayBuffer = new ArrayBuffer(dataURI.length);
            const ia: Uint8Array = new Uint8Array(ab);
            for (let i: number = 0; i < dataURI.length; i++) {
                ia[i] = dataURI.charCodeAt(i);
            }
            const avatarBlob = new Blob([new Uint8Array(ab)]);
            this.setState({file: avatarBlob});
        }
        currentTarget.value = "";
    };

    handleProfileInfoSet = (): void => {
        const {emailNumber, emailAccessToken, email, emailFirstName, emailLastName, avatar, networks} = this.state;
        const {attemptSignIn} = this.props;
        attemptSignIn({
            username: emailNumber,
            accessToken: emailAccessToken,
            email: email,
            firstName: emailFirstName,
            lastName: emailLastName,
            avatar: avatar,
            networks: networks
        })
    };

    handleNameChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>): void => {
        if (this.state[name] !== value) {
            const newState: ILoginUsingMobileState = {...this.state};
            newState[name] = value.trimLeft();
            newState['err'] = false;
            this.setState(newState);
        }
    };

    handleForgotPasswordClick = async (): Promise<any> => {
        const {email, selectedCountry} = this.state;
        this.setState({
            emailLoader: true,
            emailError: ""
        });
        try {
            const regionCode = selectedCountry.sort_name || "AM"; // Todo 'AM' refactor
            const {data: {status}} = await checkEmailValidate(email, regionCode);
            if (status === "SUCCESS") {
                this.setState({
                    emailRegistrationStep: AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.VERIFY_CODE_CONFIRMATION
                });
                this.resendEmailCodeTimeOut = setInterval(this.handleResendEmailCodeTimeOut, 1000);
            }
        } catch (error) {
            Log.i(error);
        } finally {
            if (this.mounted) {
                this.setState({emailLoader: false});
            }
        }
    };

    handleMobileNumberChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const {selectedCountry} = this.state;

        const regexp = /[^0-9]/;
        value = value.replace(regexp, "");

        const newState: ILoginUsingMobileState = {...this.state};
        const phoneNumber: string = `+${selectedCountry.phone_code + value}`;
        const parsedNumber: any = phoneParse.call(this, phoneNumber, {extended: true}, metadata);

        newState.mobileNumberDisable = !parsedNumber.possible;
        newState.mobileNumber = phoneNumber.substring(1);
        newState.mobileDigits = value;
        newState.mobileError = "";

        this.setState(newState);
    };

    handleMobileNumberPast = (e: any): void => {
        e.preventDefault();
        const currentPosition: number = e.target.selectionStart;
        const clipboardData: any = e.clipboardData;
        let pastedData: string = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: ILoginUsingMobileState = {...this.state};

            const filteredNumbersText: string = filteredNumbers.join("");
            const newNumber: string = newState.mobileDigits.slice(0, currentPosition) + filteredNumbersText + newState.mobileDigits.slice(currentPosition);

            const phoneNumber: string = `+${newState.selectedCountry.phone_code + newNumber}`;
            const parsedNumber: any = phoneParse.call(this, phoneNumber, {extended: true}, metadata);

            newState.mobileNumberDisable = !parsedNumber.possible;
            newState.mobileNumber = phoneNumber.substring(1);
            newState.mobileDigits = newNumber;
            newState.mobileError = "";

            this.setState(newState);
        }
    };

    handleResendMobileCodeTimeOut = (): void => {
        const {resendMobileCodeTimer} = this.state;
        this.setState({resendMobileCodeTimer: resendMobileCodeTimer - 1});
        if (resendMobileCodeTimer <= 0) {
            clearInterval(this.resendMobileCodeTimeOut);
            this.setState({resendMobilePin: true});

        }
    };

    handleMobileNumberContinueClick = async (): Promise<any> => {
        renewCancelToken();
        const {mobileNumber, selectedCountry, mobileDigits} = this.state;
        this.setState({mobileNumberDisable: true});
        const {data: {status, body}} = await passwordExist(mobileNumber);

        if (status === "SUCCESS" && body) {
            this.setState({step: AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.TYPE_PASSWORD});
        } else {
            const regionCode = selectedCountry.sort_name ? selectedCountry.sort_name : "AM";
            const {data: {status}} = await mobileLoginValidate(mobileDigits, regionCode, selectedCountry.phone_code);
            if (status === "SUCCESS") {
                this.setState({step: AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.SEND_VERIFY_CODE});
                this.resendMobileCodeTimeOut = setInterval(this.handleResendMobileCodeTimeOut, 1000);
                this.setState({resendMobilePin: false});
            } else {
                this.setState({mobileError: "Too Many Attempts"})
            }
        }
        this.setState({mobileNumberDisable: false});
    };

    handleMobilePasswordChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const {mobilePassword} = this.state;
        if (value !== mobilePassword) {
            this.setState({
                mobilePassword: value.toLowerCase(),
                mobileError: ""
            });
        }
    };

    handleMobilePasswordClick = async (): Promise<any> => {
        const {mobileNumber, mobilePassword} = this.state;
        const {attemptSignIn} = this.props;
        this.setState({emailLoader: true});
        try {
            const appData: any = getAppData();
            const loginData = await signInByPassword({
                username: mobileNumber,
                password: mobilePassword,
                device_token: appData.deviceToken,
                device_name: appData.deviceName,
                platform_version: appData.platformVersion,
                app_version: appData.appVersion,
                language: appData.language,
                platform: appData.platform,
                dev: appData.dev
            });

            const {data: {body, status}}: any = loginData;
            if (status === "SUCCESS" && body) {
                attemptSignIn({
                    username: body.number,
                    accessToken: body.accessToken,
                    networks: body.virtualNetworkList
                });
            } else {
                this.setState({mobileError: "Wrong Password"});
            }

        } catch (error) {
            Log.i(error);
        } finally {
            if (this.mounted) {
                this.setState({emailLoader: false});
            }
        }
    };

    handleResendMobilePinClick = async (): Promise<any> => {
        const {selectedCountry, mobileDigits} = this.state;
        const regionCode = selectedCountry.sort_name || "AM";// Todo 'AM' refactor
        this.setState({resendMobileCodeTimer: 90, mobileNumberDisable: true});
        const {data: {status}} = await mobileLoginValidate(mobileDigits, regionCode, selectedCountry.phone_code);

        if (status === "SUCCESS") {
            this.resendMobileCodeTimeOut = setInterval(this.handleResendMobileCodeTimeOut, 1000);
            this.setState({resendMobilePin: false, mobileNumberDisable: false});
        } else {
            this.setState({mobileError: "Too Many Attempts"})
        }
    };

    handleBackToNumberClick = (): void => {
        this.setState({
            step: AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION,
            resendMobilePin: false,
            resendMobileCodeTimer: 90,
        });
        clearInterval(this.resendMobileCodeTimeOut);
    };

    handleMobileForgotPasswordClick = async (): Promise<any> => {
        const {selectedCountry, mobileDigits} = this.state;
        const regionCode = selectedCountry.sort_name ? selectedCountry.sort_name : "AM"; // Todo

        const {data: {status}} = await mobileLoginValidate(mobileDigits, regionCode, selectedCountry.phone_code);
        if (status === "SUCCESS") {
            this.setState({step: AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.SEND_VERIFY_CODE});
            this.resendMobileCodeTimeOut = setInterval(this.handleResendMobileCodeTimeOut, 1000);
            this.setState({resendMobilePin: false});
        } else {
            this.setState({mobileError: "Too Many Attempts"})
        }
    };

    handleMobilePinChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>): void => {
        const newState: ILoginUsingMobileState = {...this.state};

        const regexp = /[^0-9]/;
        value = value.replace(regexp, "");

        if (value !== newState.mobilePin) {
            newState.mobilePin = value;
            newState.mobileError = "";
            this.setState(newState, () => {
                if (value.length === 4) {
                    this.handleMobilePinCodeContinueClick();
                }
            });
        }
    };

    handleMobilePinPast = (e: any): void => {
        e.preventDefault();
        const currentPosition: number = e.target.selectionStart;
        const clipboardData: any = e.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: ILoginUsingMobileState = {...this.state};

            const filteredNumbersText = filteredNumbers.join("");
            const newPin: string = newState.mobilePin.slice(0, currentPosition) + filteredNumbersText + newState.mobilePin.slice(currentPosition);

            newState.mobilePin = newPin.slice(0, 4);
            newState.mobileError = "";


            if (newState.mobilePin.length === 4) {
                this.setState(newState, () => this.handleMobilePinCodeContinueClick());

            } else {
                this.setState(newState);
            }
        }
    };

    handleMobilePinCodeContinueClick = (): void => {
        const {mobilePin, selectedCountry, mobileNumber} = this.state;
        const {attemptSignIn} = this.props;

        this.setState({mobileLoader: true});

        if (mobilePin !== "") {

            (
                async () => {
                    const regionCode = selectedCountry.sort_name ? selectedCountry.sort_name : "AM";
                    const loginData = await mobilePinSignIn(mobileNumber, regionCode, mobilePin, selectedCountry.phone_code);
                    const {username, accessToken, isRegistered, status, networks} = loginData;
                    if (username && accessToken) {
                        clearInterval(this.resendEmailCodeTimeOut);
                        attemptSignIn({username, accessToken, networks});
                    } else {
                        this.setState({mobileError: "Wrong Pin", mobileLoader: false});
                    }
                }
            )().catch(() => {
                this.setState({mobileLoader: false});
            });
        } else {
            if (this.mounted) {
                this.setState({mobileLoader: false});
            }
        }

    };

    handleCroppedImageUpdate = (croppedFile: any): void => {
        if (croppedFile && croppedFile.avatar) {
            this.setState({avatar: croppedFile.avatar, file: null});
        }
    };

    handleCropPopupDismiss = (): void => {
        this.setState({file: null});
    };

    render(): JSX.Element {
        const {
            countries, selectedCountry, form: {disabled, err, phoneNumber, phoneDigits}, modal, step, credentials: {pin, password},
            hasPassword, tabs, activeTab, QRValue, loadingAnimation, onLine, capsLock, showError, qrRefresh, qrLoader, mobilePassword, mobileNumberDisable, mobileLoader, mobileError, mobileNumber, mobilePin, isCheckingEmailValidation,
            validEmail, emailRegistrationStep, email, emailLoader, emailPin, resendEmailCodeTimer, resendMobileCodeTimer, resendEmailPin, resendMobilePin, file, avatar, emailPassword, emailFirstName, emailLastName, emailError, mobileDigits
        } = this.state;
        const localization: any = components().common;
        const {errorMessage, loading} = this.props;

        const errorPopUpStyle: any = {
            width: "450px",
        };

        const threadImage: any = {
            url: "",
            file: avatar,
        };

        return (
            <div>
                <div className="content-block">
                    <ul className="buttons-list">
                        {
                            tabs.map((tab, index) => {
                                return (
                                    <li
                                        key={index}
                                        className={`list-item${tab.KEY === activeTab.KEY ? " active-tab" : ""}`}
                                    >
                                        <button
                                            className="login-tab"
                                            data-tab={tab.KEY}
                                            onClick={this.handleTabChange}
                                        >{tab.NAME}</button>
                                    </li>
                                )
                            })
                        }
                    </ul>

                    {
                        loadingAnimation && onLine &&
                        <div className="loader">
                            <div className="logging-in-loader"/>
                        </div>
                    }

                    {/*QR_REGISTRATION*/}

                    {/*{*/}
                    {/*activeTab.KEY === "LOGIN_USING_QR" && (!loadingAnimation || !onLine) &&*/}
                    {/*<div className="main-content">*/}
                    {/*{*/}
                    {/*((errorMessage && showError) || !navigator.onLine) &&*/}
                    {/*<span className="error">{errorMessage || localization.noConnection}</span>*/}
                    {/*}*/}
                    {/*<LoginUsingQR*/}
                    {/*qrValue={QRValue}*/}
                    {/*handleQrRefreshClick={this.handleQrRefreshClick}*/}
                    {/*qrRefresh={qrRefresh}*/}
                    {/*qrLoader={qrLoader}*/}
                    {/*/>*/}
                    {/*</div>*/}
                    {/*}*/}

                    {/*EMAIL_REGISTRATION*/}

                    {
                        activeTab.KEY === EMAIL_REGISTRATION_KEY && (!loadingAnimation || !onLine) &&
                        <div className="main-content">
                            {
                                ((errorMessage && showError) || !onLine) &&
                                <span className="error">{errorMessage || localization.noConnection}</span>
                            }
                            {
                                emailRegistrationStep === AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.EMAIL_CONFIRMATION &&
                                <div className="action-content">
                                    <div className='login-form'>
                                        {errorMessage && !showError && onLine &&
                                        <span className="error">{errorMessage}</span>}
                                        <p className="title email-title">Your Email</p>
                                        <div className="email-registration-details">
                                            <input
                                                autoFocus={true}
                                                type="email"
                                                value={email}
                                                onChange={this.handleEmailChange}
                                            />
                                            {
                                                emailLoader && <CircularLoader/>
                                            }
                                        </div>
                                        <p className="email-registration-info">Please enter your email to sign in</p>
                                        <button
                                            onClick={this.handleMailCheck}
                                            className={`button ${!validEmail || isCheckingEmailValidation ? "button-disable " : "button-primary"}`}
                                            disabled={!validEmail || isCheckingEmailValidation}
                                        >Continue
                                        </button>
                                    </div>
                                </div>
                            }
                            {
                                emailRegistrationStep === AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.VERIFY_CODE_CONFIRMATION &&
                                <div className="action-content">
                                    <div className='login-form'>
                                        <p className="title pin-confirmation-title">Enter Code</p>
                                        <div className="email-registration-details pin-code">
                                            <input
                                                className="pin-input"
                                                type="text"
                                                maxLength={4}
                                                autoFocus={true}
                                                onChange={this.handleEmailPinChange}
                                                onPaste={this.handleEmailPinPast}
                                            />
                                            <span className="hidden-span"/>
                                            {
                                                emailLoader && <CircularLoader/>
                                            }
                                        </div>
                                        <p className="pin-registration-info">Your code was sent to<br/>
                                            <span className="bold-text">{email}</span>
                                        </p>
                                        {emailError && onLine && <span className="error">{emailError}</span>}
                                        <button className="back-button" onClick={this.handleBackToMailClick}>Change
                                            email
                                        </button>
                                        {
                                            resendEmailPin ?
                                                <button className="back-button"
                                                        disabled={isCheckingEmailValidation}
                                                        onClick={this.handleResendEmailPinClick}>Resend
                                                    code</button> :
                                                <p className="pin-registration-info">{`you can resend email code in ${resendEmailCodeTimer} sec.`}</p>
                                        }

                                        <button onClick={this.handleEmailPinCodeContinueClick}
                                                className={`button ${emailPin && emailPin.length === 4 && !emailError ? "button-primary" : "button-disable "}`}
                                                disabled={!emailPin || emailPin.length !== 4 || !!emailError}>Continue
                                        </button>
                                    </div>
                                </div>
                            }
                            {
                                emailRegistrationStep === AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.SET_PROFILE_DETAILS &&
                                <div className="action-content">
                                    <div className='login-form'>
                                        <p className="title pin-confirmation-title">Your Profile</p>
                                        <div className="email-registration-details profile-info">
                                            <div className="avatar-content">
                                                <div className="user-img">
                                                    <Avatar
                                                        image={threadImage}
                                                        color={" "}
                                                        avatarCharacter={" "}
                                                        name={""}
                                                        userAvatar={true}
                                                    />
                                                    <span className="group-pic-icon">
                                                <input
                                                    accept="image/gif,image/jpeg,image/jpg,image/png"
                                                    onChange={this.handleAvatarChange}
                                                    className="group-pic-upload"
                                                    id="profPicInput"
                                                    name="avatar"
                                                    type="file"
                                                />
                                            </span>
                                                </div>
                                            </div>
                                            <div className="user-name-content">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    name="emailFirstName"
                                                    value={emailFirstName}
                                                    onChange={this.handleNameChange}
                                                    autoComplete="off"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Surname"
                                                    name="emailLastName"
                                                    value={emailLastName}
                                                    onChange={this.handleNameChange}
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                        <p className="pin-registration-info">Please fill your profile info that<br/>will
                                            be visible to your friends.</p>
                                        <button onClick={this.handleProfileInfoSet}
                                                className={`button ${emailFirstName && emailLastName ? "button-primary" : "button-disable "}`}
                                                disabled={!emailFirstName || !emailLastName}>Continue
                                        </button>
                                    </div>
                                </div>
                            }
                            {
                                emailRegistrationStep === AUTHENTICATION_STEPS.SIGN_UP_USING_EMAIL.TYPE_PASSWORD &&
                                <div className="action-content">
                                    <div className='login-form'>
                                        <p className="title email-title">Enter Your Password</p>
                                        <div className="email-registration-details">
                                            <input
                                                onChange={this.handleEmailPasswordChange}
                                                id="registration_input"
                                                autoFocus={true}
                                                className="password-input"
                                                type="password"
                                                placeholder=""
                                                pattern="\w{8}"
                                            />
                                            {
                                                emailLoader && <CircularLoader/>
                                            }
                                        </div>
                                        {emailError && onLine && <span className="error">{emailError}</span>}
                                        <button
                                            className="forgot-button"
                                            onClick={this.handleForgotPasswordClick}
                                        >{localization.forgotPassword}?
                                        </button>
                                        <button
                                            className={`button ${emailPassword && emailPassword.length > 0 ? "button-primary" : "button-disable "}`}
                                            disabled={!emailPassword || emailPassword.length === 0}
                                            onClick={this.handleEmailPasswordCheck}>Continue
                                        </button>
                                    </div>
                                </div>
                            }
                        </div>
                    }


                    {/*MOBILE_REGISTRATION*/}


                    {activeTab.KEY === "LOGIN_USING_MOBILE" && (!loadingAnimation || !onLine) &&
                    <div className="main-content">
                        {/* <div className="action-content">
                            <form onSubmit={this.handleUserLoginSubmit} className='login-form'>
                                {((errorMessage && showError && errorMessage !== SET_PASSWORD_ERROR) || !navigator.onLine) && <span className="error">{errorMessage ? errorMessage : localization.noConnection}</span>}
                                <p className="title email-title">Your Phone</p>
                                <div className="login-details">
                                    <Select
                                        name="country"
                                        value={selectedCountry.index}
                                        options={countryList}
                                        searchable={true}
                                        clearable={false}
                                        onChange={this.handleCountryChange}
                                    />
                                    <div className="number-group">
                                        <span className="phone-code" id="phoneCode">+{selectedCountry.phone_code}</span>
                                        <input type="number" onChange={this.handlePhoneNumberChange}
                                               min="0" step="1"
                                               id="phoneNumber"
                                               autoComplete="off"
                                               className="phone-number"
                                               data-popup={disabled}
                                               value={phoneDigits}
                                               placeholder='Phone number'/>
                                    </div>
                                    <div className="password-group">
                                        <input
                                            className="password-input"
                                            name={"password"}
                                            onChange={this.handleUserPasswordChange}
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onKeyPress={this.handleCapsLockStatus}
                                        />
                                    </div>
                                    <p className="phone-text">Please confirm your country,<br/> enter your <span className="bold-text">mobile phone number</span></p>
                                </div>*/}
                        {
                            step === AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.PHONE_CONFIRMATION &&
                            <div className="action-content">
                                <div className='login-form'>
                                    {
                                        ((errorMessage && showError && errorMessage !== SET_PASSWORD_ERROR) || !onLine) &&
                                        <span className="error">
                                            {errorMessage || localization.noConnection}
                                        </span>
                                    }
                                    {
                                        errorMessage && !showError && onLine &&
                                        <span className="error">{errorMessage}</span>
                                    }
                                    <p className="title email-title">Your Phone</p>
                                    <div className="login-details">
                                        <Select
                                            value={selectedCountry}
                                            id="country"
                                            name="country"
                                            placeholder={"Country"}
                                            isMulti={false}
                                            closeMenuOnSelect={true}
                                            onChange={this.handleCountryChange}
                                            options={countries}
                                        />

                                        <div className="number-group">
                                            <span className="phone-code"
                                                  id="phoneCode">+{selectedCountry.phone_code}</span>
                                            <input type="text"
                                                   id="phoneNumber"
                                                   autoComplete="off"
                                                   className="phone-number"
                                                   data-popup={disabled}
                                                   placeholder='Phone number'
                                                   value={mobileDigits}
                                                   onChange={this.handleMobileNumberChange}
                                                   onPaste={this.handleMobileNumberPast}
                                            />
                                        </div>
                                        <div className="password-group">
                                            {/*<input
                                            className="password-input"
                                            name={"password"}
                                            onChange={this.handleUserPasswordChange}
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onKeyPress={this.handleCapsLockStatus}
                                        />*/}
                                        </div>
                                        <p className="phone-text">Please confirm your country,<br/> enter your <span
                                            className="bold-text">mobile phone number</span></p>
                                    </div>
                                    {password && capsLock && <span className="warning">Caps Lock is on</span>}
                                    {mobileError && onLine && <span className="error">{mobileError}</span>}
                                    <button
                                        type={"submit"}
                                        className={`button ${mobileNumberDisable ? "button-disable " : "button-primary"}`}
                                        disabled={mobileNumberDisable}
                                        onClick={this.handleMobileNumberContinueClick}
                                    >Continue
                                    </button>
                                </div>
                            </div>}

                        {
                            step === AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.TYPE_PASSWORD &&
                            <div className="action-content">
                                <div className='login-form'>
                                    {
                                        !onLine &&
                                        <span className="error">{localization.noConnection}</span>
                                    }
                                    <p className="title email-title">Enter Your Password</p>
                                    <div className="email-registration-details">
                                        <input
                                            onChange={this.handleMobilePasswordChange}
                                            id="registration_input"
                                            autoFocus={true}
                                            className="password-input"
                                            type="password"
                                            placeholder=""
                                            value={mobilePassword}
                                            pattern="\w{8}"
                                        />
                                        {
                                            mobileLoader && <CircularLoader/>
                                        }
                                    </div>
                                    {mobileError && onLine && <span className="error">{mobileError}</span>}
                                    <button
                                        className="forgot-button"
                                        onClick={this.handleMobileForgotPasswordClick}
                                    >{localization.forgotPassword}?
                                    </button>
                                    <button
                                        className={`button ${mobilePassword && mobilePassword.length > 0 ? "button-primary" : "button-disable "}`}
                                        disabled={!mobilePassword || mobilePassword.length === 0}
                                        onClick={this.handleMobilePasswordClick}>Continue
                                    </button>
                                </div>
                            </div>}

                        {
                            step === AUTHENTICATION_STEPS.LOGIN_USING_MOBILE.SEND_VERIFY_CODE &&
                            <div className="action-content">
                                <div className='login-form'>
                                    <p className="title pin-confirmation-title">Enter Code</p>
                                    <div className="email-registration-details pin-code">
                                        <input
                                            className="pin-input"
                                            type="text"
                                            maxLength={4}
                                            autoFocus={true}
                                            onChange={this.handleMobilePinChange}
                                            onPaste={this.handleMobilePinPast}
                                            value={mobilePin}
                                        />
                                        <span className="hidden-span"/>
                                        {
                                            mobileLoader && <CircularLoader/>
                                        }
                                    </div>
                                    <p className="pin-registration-info">Your code was sent to<br/><span
                                        className="bold-text">+{mobileNumber}</span></p>
                                    {mobileError && onLine && <span className="error">{mobileError}</span>}
                                    <button className="back-button" onClick={this.handleBackToNumberClick}>Change Number
                                    </button>
                                    {
                                        resendMobilePin ?
                                            <button className="back-button"
                                                    disabled={mobileNumberDisable}
                                                    onClick={this.handleResendMobilePinClick}>Resend
                                                code</button> :
                                            <p className="pin-registration-info">
                                                {localization.resendSMS(resendMobileCodeTimer)}
                                            </p>
                                    }

                                    <button
                                        className={`button ${mobilePin && mobilePin.length === 4 && !mobileError ? "button-primary" : "button-disable "}`}
                                        disabled={!mobilePin || mobilePin.length !== 4 || !!mobileError}
                                        onClick={this.handleMobilePinCodeContinueClick}>Continue
                                    </button>
                                </div>
                            </div>}

                    </div>}

                </div>

                <div className="additional-info" style={{display: "none"}}>
                    <p className="not-register">Not registered?</p>
                    <button onClick={this.handleSignUp} className="additional-button button-white">Sign Up</button>
                </div>
                {
                    loading && <div className="loading-screen"/>
                }
                <ReactCSSTransitionGroup
                    transitionName={{enter: 'open', leave: 'close'}}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={230}>
                    {
                        errorMessage === SET_PASSWORD_ERROR &&
                        <PopUpMain
                            confirmButton={this.clearErrorMessage}
                            cancelButton={this.clearErrorMessage}
                            confirmButtonText={localization.close}
                            titleText={localization.set_password_title}
                            infoText={localization.set_password_info}
                            customStyle={errorPopUpStyle}
                            showPopUpLogo={true}
                        />
                    }
                </ReactCSSTransitionGroup>

                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={200}
                >
                    {
                        file &&
                        <AvatarCropper
                            cropPopupDismiss={this.handleCropPopupDismiss}
                            croppedImageUpdate={this.handleCroppedImageUpdate}
                            file={file}
                        />
                    }
                </ReactCSSTransitionGroup>

            </div>

        )
    }
}

const mapStateToProps: any = state => selector(state, {
    user: {user: true, errorMessage: true}
});

const mapDispatchToProps: any = dispatch => ({
    attemptSignIn: ({username, accessToken, password, email, firstName, lastName, avatar, networks}) => dispatch(attemptSignIn({
        username,
        accessToken,
        password,
        email,
        firstName,
        lastName,
        avatar,
        networks
    })),
    clearErrorMessage: () => dispatch(CLEAR_ERROR_MESSAGE()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginUsingMobile);
