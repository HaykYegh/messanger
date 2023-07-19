"use strict";

import * as React from "react";

import Avatar from "components/contacts/Avatar";
import components from "configs/localization";
import "scss/pages/left-panel/AddNewContact.scss";
import {AvatarSize} from "components/contacts/style";

interface IContactProps {
    onInputKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabledPhoneEdit?: boolean;
    createContact?: () => void;
    clearNumber: () => void;
    phone: number | string;
    selectedThread?: any;
    firstName: string;
    lastName: string;
    error: boolean;
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

export default function ContactForm(props: IContactProps): JSX.Element {
    const {
        firstName, lastName, phone, error, onInputChange, createContact, leftButton,
        rightButton, selectedThread,
    } = props;
    const localization: any = components().contactForm;
    const threadId: string = selectedThread.getIn(['threads', 'threadId']);
    const threadInfo: any = selectedThread.get("members").first();
    const threadImage: any = {
        url: threadInfo.get("avatarUrl"),
        file: threadInfo.get("avatar"),
    };

    return (
        <div className="add-new-contact settings-scroll">
            <div className="add-new-contact-content">
                {rightButton &&
                <span className={rightButton.className} onClick={rightButton.onClick}>{rightButton.text}</span>}
                {leftButton &&
                <span className={leftButton.className} style={leftButton.style}
                      onClick={leftButton.onClick}>{leftButton.text}</span>}

                <div className="info-block">
                    <div className="image-block">
                        <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                            <Avatar
                                image={threadImage}
                                color={threadInfo.getIn(["color", "numberColor"])}
                                status={threadInfo.get("status")}
                                avatarCharacter={threadInfo.get("avatarCharacter")}
                                name={threadInfo.get("firstName")}
                                meta={{threadId}}
                                iconSize={"80px"}
                                border={"1px solid #F5F5F7"}
                                avatarBlobUrl={threadInfo.get("avatarBlobUrl")}
                            />
                        </AvatarSize>
                    </div>
                    <div className="inputs-block">
                        <input
                            placeholder={localization.firstName}
                            data-field="contactName"
                            onChange={onInputChange}
                            value={firstName}
                            className={`${(error && firstName.length === 0) ? 'invalid-first-name' : ''} user-name`}
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
                    </div>
                </div>
                {/*<div className="number-block">*/}
                {/*    <div className="number-content">*/}
                {/*    <span className={classNames({"delete-number-icon": !disabledPhoneEdit ? true : false, "visible": !!phone})}*/}
                {/*          onClick={clearNumber}/>*/}
                {/*        <span className="type-of-number">{emailContact ? localization.typeOfNumberEmail : localization.typeOfNumber}</span>*/}
                {/*        <input*/}
                {/*            maxLength={CONTACT_NUMBER_MAX_LENGTH}*/}
                {/*            placeholder={localization.phone}*/}
                {/*            onKeyPress={onInputKeyPress}*/}
                {/*            data-field="keypadValue"*/}
                {/*            onChange={onInputChange}*/}
                {/*            className={`${error ? 'invalid-number' : ''} user-number`}*/}
                {/*            value={emailContact ? threadInfo.get("email") : phone}*/}
                {/*            name="phone"*/}
                {/*            type="text"*/}
                {/*            readOnly={disabledPhoneEdit}*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}
                {createContact && <div className="add-contact-btn">
                    <button
                        className={`add-btn${(phone.toString().length > 3) ? " add-btn-active" : ""}`}
                        disabled={phone.toString().length < 3} onClick={createContact}>Add Contact
                    </button>
                </div>}
            </div>
        </div>
    );
};
