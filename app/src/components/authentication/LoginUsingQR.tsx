"use strict";
import * as React from 'react';
import * as QRCode from "qrcode.react";
const qrLogoBlack: any = require("assets/images/logo_qr_black.svg");
const zangiLogo: any = require("assets/icons/png/128x128.png");
import "assets/styles/pages/authentication/Login.scss";
import {Icon} from "containers/left-menu/style";
import components from "configs/localization";

interface IQRCodeProps {
    qrValue?: string;
    qrRefresh: boolean;
    qrLoader: boolean;
    handleQrRefreshClick: () => void;
}

export default function LoginUsingQR({qrValue = '', qrRefresh, handleQrRefreshClick, qrLoader}: IQRCodeProps): JSX.Element {
  const localization: any = components().login;

    return (
        <div className="qr">
            <div className="qr-block">
                {
                    qrRefresh && <div className="refresh-content">
                                    <div className="refresh-button" onClick={handleQrRefreshClick}>
                                        <span className="refresh-icon"/>
                                        <span className="refresh-text">Click to reload qr code</span>
                                    </div>
                                </div>
                }
              {!qrLoader &&
                  <QRCode
                    value={qrValue}
                    size={217}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    imageSettings={{
                      src:qrLogoBlack,
                      height: 50,
                      width: 50
                    }}
                  />
              }
                {qrRefresh && <div className="refresh-content">
                    <div className="refresh-button" onClick={handleQrRefreshClick}>
                        <span className="refresh-icon"/>
                        <span className="refresh-text">Click to reload qr code</span>
                    </div>
                </div>}
                {
                    qrLoader && qrValue === "" &&
                        <div className="loader-content">
                            <div className="loader">
                                <div className="circular-loader">
                                    <div className="loader-stroke">
                                        <div className="loader-stroke-left"/>
                                        <div className="loader-stroke-right"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                }
            </div>
            <div style={{width: "320px"}}>
                <p className="qr-intro">{localization.qrLoginTitle}</p>
                <div className="qr-info">
                    <div style={{display: 'flex', alignItems: "center", marginBottom: "15px"}}>
                        <p className="qr-text" style={{paddingRight: '5px'}}>{localization.qrLoginInstruction1}</p>
                        <img src={zangiLogo} style={{width: '15px', height: '15px'}}/>
                    </div>
                    <div style={{display: 'flex', alignItems: "center", marginBottom: "15px"}}>
                        <p className="qr-text" style={{paddingRight: '5px'}}>{localization.qrLoginInstruction2}</p>
                        <Icon
                            content="'\E97C'"
                            style={{fontSize: '22px'}}
                        />
                    </div>
                    <p className="qr-text">{localization.qrLoginInstruction3}</p>
                </div>
            </div>
        </div>
    );
};

