import * as React from "react";
import components from "configs/localization";
import {phoneMask} from "helpers/UIHelper";

interface IContactToShareProps {
    isSelected?: boolean,
    contactNumber: any,
    handleContactToShareClick: (number) => void
}

export default function ContactToShare({isSelected = true, contactNumber, handleContactToShareClick}: IContactToShareProps): JSX.Element {
    const localization: any = components().contactInfo;
    const contactLabelLocalization: any = components().contactForm;

    return <li className="contact-to-share" onClick={() => handleContactToShareClick(contactNumber.username)}>
        <div className={`select ${isSelected ? "isSelected" : ""}`}/>
        <div className="info-content">
            <div className="text-block">
                {/*<div className="type-of-number">{contactLabelLocalization[contactNumber.label]}</div>*/}
                {
                    contactNumber.isProductContact && <div className="product-name">{localization.productName}</div>
                }
            </div>
            <div className="number-block">{contactNumber.email || contactNumber.username.includes("@") ? `${contactNumber.username}` :`${phoneMask(contactNumber.username)}`}</div>
        </div>
    </li>
}
