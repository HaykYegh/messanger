"use strict";

import {CONTACT_NUMBER_MAX_LENGTH} from "configs/constants";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import {email} from "configs/configurations";

interface IContactProps {
    onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleMobileNumberPast: (event: any) => void;
    handleCreateContactClose: () => void;
    disabledPhoneEdit?: boolean;
    createContact?: () => void;
    clearNumber: () => void;
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
    error: any;
    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    rightButton?: {
        onClick?: () => void;
        className: string;
        text?: string;
    };
}

export default function ContactFormNew({firstName, lastName, phone, email, error, onInputChange, clearNumber, createContact, leftButton, rightButton, disabledPhoneEdit, handleCreateContactClose, handleMobileNumberPast}: IContactProps): JSX.Element {
    const localization: any = components().contactForm;

    return (
            <div className="contact-form-content">
                <h2 className="popup-title">Add New Contact</h2>
                <div className="image-block">
                    <span className="user-img"/>
                </div>
                <div className="info-block">
                    <input
                        placeholder={localization.firstName}
                        data-field="contactName"
                        onChange={onInputChange}
                        value={firstName}
                        className={`${(error.firstName && firstName.length === 0) ? 'invalid-first-name' : ''} user-name`}
                        name="firstName"
                        type="text"
                    />
                    <input
                        placeholder={localization.lastName}
                        data-field="contactLastName"
                        className="user-surname"
                        onChange={onInputChange}
                        value={lastName}
                        name="lastName"
                        type="text"
                    />
                    <div className="number-content">
                        {/*<span className={classNames({"delete-number-icon": !disabledPhoneEdit ? true : false, "visible": !!phone})}
                          onClick={clearNumber}/>
                    <span className="type-of-number">{localization.typeOfNumber}</span>*/}
                        <input
                            maxLength={CONTACT_NUMBER_MAX_LENGTH}
                            placeholder={localization.phone}
                            data-field="keypadValue"
                            onChange={onInputChange}
                            onPaste={handleMobileNumberPast}
                            className={`${error.phone ? "invalid-input" : ""} user-number-email`}
                            value={phone}
                            name="phone"
                            type="text"
                            readOnly={disabledPhoneEdit}
                            disabled={email.length !== 0}
                        />
                    </div>
                    <div className="number-content">
                        <input
                            placeholder={localization.email}
                            data-field="keypadValue"
                            onChange={onInputChange}
                            className={`${error.email ? "invalid-input" : ""} user-number-email`}
                            value={email}
                            name="email"
                            type="email"
                            disabled={phone.toString().length !== 0}
                        />
                    </div>
                </div>
                <div className="bottom-buttons">
                    <button className="cancel-btn" onClick={handleCreateContactClose}>Cancel</button>
                    {createContact &&
                    <button className={(phone.toString().length > 3 || email.length > 3) ? "add-contact-btn" : "add-contact-btn disabled-button"}
                            disabled={phone.toString().length < 3 && email.length < 3} onClick={createContact}>Add Contact</button>}
                </div>
            </div>
    );
};
