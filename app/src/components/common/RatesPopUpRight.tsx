"use strict";

import * as React from "react";
import phoneParse from "libphonenumber-js/es6/parse";
const metadata = require('libphonenumber-js/metadata.min.json');

import components from "configs/localization";

import "scss/pages/right-panel/RatesPopUp";

interface IRatesPopUpRightProps {
    rates: {
        phone: number;
        countryName: string;
        currencyCode: string;
        phoneCode: string;
        callBack: {
            price: number;
            quantity: number;
        },
        outCall: {
            price: number;
            quantity: number;
        }
    }
}

export default function RatesPopUpRight({rates}: IRatesPopUpRightProps): JSX.Element {

    if (!rates) {
        return null;
    }

    const phoneInfo: any = phoneParse.call(this, `+${rates.phone}`, {extended: true}, metadata);
    const countryCode: string = phoneInfo && phoneInfo.country && phoneInfo.country.toLowerCase();
    const localization: any = components().ratesPopUp;

    return (
        <div className="rates-popup">
            <div className="rates-popup-content">
                <div className="info">
                    <div className="price">{rates.outCall.price.toFixed(2)} {rates.currencyCode}/{localization.min}</div>
                    <div className="country-info">
                        <div className="flag" style={countryCode ? {backgroundImage: `url(${require(`assets/images/flags/${countryCode}.png`)})`}: null}/>
                        <div className="country-name">{rates.countryName}</div>
                    </div>
                </div>
                <span className="call-icon"/>
            </div>
        </div>
    );
};
