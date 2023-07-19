"use strict";

import * as React from "react";

import components from "configs/localization";
import "scss/pages/left-panel/settings/AddCredit";
import {getBalance} from "requests/settingsRequest";
import {SettingsListBlock, SettingsText, SettingsTitle} from "containers/settings/style";
import {Loader, LoadingPage} from "../../pages/style";

interface ICreditCardProps {
    showRates: () => void;
    openPromo: () => void;
}

interface ICreditCardState {
    balance: string;
    currencyCode: string;
    isLoading: boolean;
}

export default class CreditCard extends React.Component<ICreditCardProps, ICreditCardState> {


    constructor(props) {
        super(props);

        this.state = {
            balance: "0",
            currencyCode: "",
            isLoading: true
        };
    }

    componentDidMount() {
        getBalance().then(({data}: any) =>
            this.setState({
                balance: data.body ? data.body.balance : 0,
                currencyCode: data.body ? data.body.currencyCode : "USD",
                isLoading: false
            })
        );
    }

    render() {
        const localization: any = components().addCreditCard;
        const {balance, currencyCode, isLoading} = this.state;

        return (
            <div>
                <SettingsListBlock>
                    <SettingsTitle>{localization.myBalance}</SettingsTitle>
                    {isLoading ? <LoadingPage
                            width="30px"
                            height="30px"
                            backgroundColor="#FFFFFF"
                        >
                            <Loader
                                backgroundColor="#fff"
                                width="15px"
                                height="15px"
                                background="#FFFFFF"
                            />
                        </LoadingPage> :
                        <SettingsTitle color="#919193">
                            <span className="balance">{parseFloat(balance).toFixed(2)}</span>
                            <span> {currencyCode}</span>
                        </SettingsTitle>}
                </SettingsListBlock>
                < SettingsText className="settings_text"> {localization.rateText1}</SettingsText>
            </div>
        );
    }

};
