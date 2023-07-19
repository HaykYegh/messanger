"use strict";

import components from "configs/localization";
import * as React from "react";

interface IKeyProps {
    getCountryData: (countryName: string) => void;
    country: any;
    rate: string;
    code: string;
}

export default function Country({country, rate, code, getCountryData}: IKeyProps): JSX.Element {
    if (!country) {
        return null;
    }

    const getData: any = () => getCountryData(country.description);
    const localization: any = components().ratesPanel;

    return (
        <div className="info" onClick={getData}>
            <div
                className="flag"
                style={{

                }}
            />
            <div className="country-info">
                <div className="country-name">
                    {country.description}
                </div>
                <div className="rates">
                    <span className="rate-amount">{(country.lendline * parseInt(rate)).toFixed(2)} {code}/{localization.min}</span>
                    <span className="rate-amount">{(country.mobile * parseInt(rate)).toFixed(2)} {code}/{localization.min}</span>
                </div>
            </div>
        </div>
    );
};
