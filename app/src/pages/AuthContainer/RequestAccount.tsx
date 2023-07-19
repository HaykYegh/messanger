"use strict";

import * as React from "react";
import CircularLoader from "components/common/loaders/CircularLoader";
import {ICountry} from "services/interfaces";
import {APPLICATION, ENTER_KEY_CODE} from "configs/constants";
import {
    Block,
    LinkButton,
    BoldText,
    SpanHidden,
    PinInputBlock,
    PinInput,
    DescriptionText, ErrorMessage, Button, MailgoButton
} from "./style";
import {IResponseMessage} from "modules/user/UserTypes";
import isEqual from "lodash/isEqual";
import {Loader, LoadingPage} from "../style";
import {getErrorMessage} from "helpers/DataHelper";
import conf from "configs/configurations";
import localizationComponent from "configs/localization";

interface IRequestAccountProps {
    handleBackToNumberChange: () => void,
}

interface IRequestAccountState {

}

export default class RequestAccount extends React.Component<IRequestAccountProps, IRequestAccountState> {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    handleBackToNumberClick = (): void => {
        const {handleBackToNumberChange} = this.props;

        handleBackToNumberChange()
    };


    render() {

        const localization: any = localizationComponent().login;

        return (
            <>
                <DescriptionText padding="0px">
                    {localization.notValidAccountText}
                </DescriptionText>
                <LinkButton
                    marginBottom="20px"
                    marginTop="20px"
                    onClick={this.handleBackToNumberClick}
                >
                    {localization.changeNumber}
                </LinkButton>
                <MailgoButton
                    href={`mailto:${APPLICATION.MAILTO}`}
                >
                    <Button
                        type={"submit"}
                        className="button button-primary"
                        // disabled={isMobileNumberDisable}
                    >
                        {localization.requestAccount}
                    </Button>
                </MailgoButton>
            </>
        );
    }

}
