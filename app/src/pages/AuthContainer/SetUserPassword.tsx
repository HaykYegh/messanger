"use strict";

import * as React from "react";
import {getErrorMessage} from "helpers/DataHelper";
import {Block, Button, Input, InputContent, DescriptionText, ErrorMessage} from "./style";
import localizationComponent from "configs/localization";

export interface ISetUserPasswordProps {
    password: string,
    confirmedPassword: string,
    handleForgotPasswordChange: (event) => void,
    handleConfirmedPasswordChange: (event) => void
    handlePasswordSetContinue: () => void,
    errorMessage: string,
}

export default function SetUserPassword({password, confirmedPassword, handleForgotPasswordChange, handleConfirmedPasswordChange, handlePasswordSetContinue, errorMessage}: ISetUserPasswordProps): JSX.Element {
    const isValidPassword: boolean = password.length >= 6;
    const isSamePassword: boolean = isValidPassword ? password === confirmedPassword : false;
    const localization = localizationComponent().login;

    return (
        <Block>
            <InputContent marginBottom="0" isErrorMessage={errorMessage !== ""}>
                <Input
                    textAlign="left"
                    padding="0 10px"
                    onChange={handleForgotPasswordChange}
                    id="password_input"
                    autoFocus={true}
                    type="password"
                    placeholder={localization.newPass}
                    value={password}
                    pattern="\w{8}"
                />
            </InputContent>
            <InputContent isErrorMessage={errorMessage !== ""}>
                <Input
                    textAlign="left"
                    padding="0 10px"
                    onChange={handleConfirmedPasswordChange}
                    id="confirmed_password_input"
                    type="password"
                    placeholder={localization.confirmPass}
                    value={confirmedPassword}
                    pattern="\w{8}"
                />
            </InputContent>
            {
                errorMessage !== "" && <ErrorMessage>{getErrorMessage(errorMessage)}</ErrorMessage>
            }
            <Button marginBottom="24px" onClick={handlePasswordSetContinue} disabled={!isSamePassword}>{localization.continue}</Button>
            <DescriptionText padding="0" fontSize="13px">{localization.passLength}</DescriptionText>
        </Block>
    )
}
