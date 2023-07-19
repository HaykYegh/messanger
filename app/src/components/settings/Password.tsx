"use strict";

import * as React from "react";
import components from "configs/localization";
import "scss/pages/left-panel/settings/Privacy";
import {
    Alert,
    CloseButton,
    Header,
    HeaderButton,
    PasswordInput,
    SettingsLabelTitle,
    SettingsPageTitle,
    SettingsPageTitleAfterLogin,
    SettingsText,
    PasswordContainer, PasswordInputsContent
} from "containers/settings/style";
import {updatePassword} from "requests/loginRequest";
import {Button} from "../../pages/AuthContainer/style";
import Log from "modules/messages/Log";
import {APPLICATION} from "configs/constants";

const back = require("assets/images/back_arrow.svg");


interface IPasswordProps {
    handleSetPasswordPageHide?: (e: React.MouseEvent<HTMLDivElement>, isPasswordSet?: boolean) => void;
    isPasswordSet: boolean;
    actions: {
        SET_PASSWORD: (password: string) => void;
    };
    afterLogin?: boolean;
}

interface IPasswordState {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    isDisabled: boolean;
    isError: boolean;
    errorMessage: string;
    isAlertShown: boolean;
    isLoading: boolean;
    timerId: number;
}

export default class Password extends React.Component<IPasswordProps, IPasswordState> {

    constructor(props) {
        super(props);
        this.state = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            isDisabled: true,
            isError: false,
            errorMessage: '',
            isAlertShown: false,
            isLoading: false,
            timerId: null,
        }
    }

    handleSetPassword = (event: React.MouseEvent<HTMLDivElement>) => {
        const {newPassword, currentPassword} = this.state;
        const {handleSetPasswordPageHide, isPasswordSet, actions: {SET_PASSWORD}, afterLogin} = this.props;
        const localization: any = components().profilePanel;
        if (isPasswordSet) {
            (async () => {
                const status = await updatePassword(currentPassword, newPassword);
                if (status && !afterLogin) {
                    handleSetPasswordPageHide(event, true);
                }
            })().catch(error => {
                Log.i(error);

                if (this.state.timerId) {
                    clearTimeout(this.state.timerId);
                }

                const timerId: any = setTimeout(this.handleCancel, 5000);

                this.setState({
                    isAlertShown: true,
                    isLoading: false,
                    isError: true,
                    errorMessage: error.message === "WRONG_OLD_PASSWORD" ? `${localization.wrongCurrentPassword}` : "Unknown Error",
                    isDisabled: true,
                    timerId
                })

            });
        } else {
            SET_PASSWORD(newPassword);
            if (!afterLogin) {
                handleSetPasswordPageHide(event, true);
            }
        }
    };

    handlePasswordChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value) {
            const {isPasswordSet} = this.props;
            const newState: IPasswordState = {...this.state};
            newState[name] = value.trim();

            if (name === "currentPassword" && newState.isError) {
                newState.isError = false;
            }

            const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

            const bool = APPLICATION.WITHLOGINVALIDATION ? strongRegex.test(value) : true

            newState.isDisabled = !(
                (newState.currentPassword.length >= 6 || !isPasswordSet) &&
                newState.confirmPassword.length >= 6 &&
                newState.newPassword.length >= 6 &&
                newState.confirmPassword === newState.newPassword &&
                bool &&
                !newState.isError);

            this.setState(newState);
        }
    };

    handleCancel = () => {
        if (this.state.timerId) {
            clearTimeout(this.state.timerId)
        }

        this.setState({isAlertShown: false, timerId: null})
    };

    render() {
        const localization: any = components().profilePanel;
        const {handleSetPasswordPageHide, isPasswordSet, afterLogin} = this.props;
        const {currentPassword, newPassword, confirmPassword, isDisabled, errorMessage, isAlertShown, isError} = this.state;

        return (
            <>

                <Alert id="message"
                       isErrorMessage={errorMessage}
                       isAlertShown={isAlertShown}
                >
                    {errorMessage || ""}
                    <CloseButton onClick={this.handleCancel}/>
                </Alert>

                <PasswordContainer isAlertShown={isAlertShown} className="settings-scroll">
                    {!afterLogin ? <Header justify_content={"space-between"}>
                        <HeaderButton
                            justify_content="flex-start"
                            onClick={handleSetPasswordPageHide}>
                            <img src={back} alt={"back"}/>
                            {localization.back}
                        </HeaderButton>
                        <SettingsPageTitle width="150px">
                            {isPasswordSet ? localization.changePassword : localization.setPassword}
                        </SettingsPageTitle>
                        <HeaderButton
                            fontWeight={!isDisabled ? "600" : "400"}
                            isDisabled={isDisabled}
                            justify_content="flex-end"
                            onClick={!isDisabled ? this.handleSetPassword : null}>
                            {localization.save}
                        </HeaderButton>
                    </Header> :
                        <SettingsPageTitleAfterLogin width="100%">
                            {isPasswordSet ? localization.changePassword : localization.setPassword}
                        </SettingsPageTitleAfterLogin>
                    }
                    <div>
                        <SettingsText>{isPasswordSet ? localization.changePasswordInfo : !afterLogin ? localization.setPasswordInfo : ""}</SettingsText>
                        <SettingsLabelTitle>{localization.newPassword}</SettingsLabelTitle>
                        <PasswordInputsContent>
                            {isPasswordSet &&
                            <PasswordInput
                                isError={isError}
                                autoFocus={true}
                                value={currentPassword}
                                name="currentPassword"
                                type="password"
                                placeholder={localization.currentPassword}
                                onChange={this.handlePasswordChange}
                                autoComplete="off"
                            />
                            }

                            <PasswordInput
                                autoFocus={!isPasswordSet}
                                value={newPassword}
                                name="newPassword"
                                type="password"
                                placeholder={localization.newPassword}
                                onChange={this.handlePasswordChange}
                                autoComplete="off"
                            />
                            <PasswordInput
                                value={confirmPassword}
                                name="confirmPassword"
                                type="password"
                                placeholder={localization.confirmPassword}
                                onChange={this.handlePasswordChange}
                                autoComplete="off"
                            />
                        </PasswordInputsContent>
                        {APPLICATION.WITHLOGINVALIDATION && <SettingsText>{localization.passwordInfo}</SettingsText>}
                    </div>
                    {afterLogin &&
                    <Button
                        type={"submit"}
                        className="button button-primary"
                        onClick={!isDisabled ? this.handleSetPassword : null}
                        disabled={isDisabled}
                    >
                        {localization.save}
                    </Button>
                    }
                </PasswordContainer>
            </>
        );

    }
};
