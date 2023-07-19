"use strict";

import components from "configs/localization";
import * as QRCode from "qrcode.react";
import * as React from "react";

interface ILoginQRProps {
    closeQr: () => void;
    QRValue: string;
}

export default function LoginQr({closeQr, QRValue}: ILoginQRProps): JSX.Element {
    const localization: any = components().loginQR;

    return (
        <div className="login_qr">
            <div className="login_qr_content">
                <div className="close_login_qr" onClick={closeQr}/>
                <div className="login_qr_title">
                    <span>{localization.loginQrTitle}</span>
                </div>
                <div className="qr_code">
                    <QRCode value={QRValue} size={220} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"}/>
                    <div className="logo-qr"/>
                </div>
            </div>
        </div>
    );
};
