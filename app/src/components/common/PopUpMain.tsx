"use strict";

import * as React from "react";
import "scss/pages/PopUpMain";
import {ENTER_KEY_CODE, ESC_KEY_CODE} from "configs/constants";

const appLogo: any = require("assets/images/login_logo_blue.svg");

interface IPopUpMainProps {
    confirmButton?: (shouldDeleteHistory?: boolean) => void;
    confirmSecondaryButton?: () => void;
    cancelButton?: () => void;
    titleTransform?: boolean;

    confirmButtonText?: string;
    confirmSecondaryButtonText?: string;
    cancelButtonText?: string;
    titleText?: string;
    infoText?: string;
    showPopUpLogo?: boolean;

    customStyle?: any;

    confirmLinkButtonText?: string;
    confirmLinkButtonHref?: string;
    confirmLinkButton?: () => void;
    shouldCheckOnPopupApprove?: boolean,
    checkInfo?: string,
    isChecked?: boolean
    isPasswordSet?: boolean
    cancelButtonP?: () => void
    account?: boolean

}

interface IThreadsPanelState {
    checkBox: {
        active: boolean,
    };
    time: any;
    seconds: number;
}

export default class PopUpMain extends React.Component<IPopUpMainProps, IThreadsPanelState> {
    timer: any
    constructor(props) {
        super(props);
        this.state = {
            checkBox: {
                active: this.props.isChecked || false,
            },
            time: {},
            seconds: 5
        }

        this.timer = 0;
        this.startTimer = this.startTimer.bind(this);
        this.countDown = this.countDown.bind(this);
    }

    secondsToTime(secs){
        let hours = Math.floor(secs / (60 * 60));

        let divisor_for_minutes = secs % (60 * 60);
        let minutes = Math.floor(divisor_for_minutes / 60);

        let divisor_for_seconds = divisor_for_minutes % 60;
        let seconds = Math.ceil(divisor_for_seconds);

        let obj = {
            "h": hours,
            "m": minutes,
            "s": seconds
        };
        return obj;
    }

    componentDidMount() {
        document.addEventListener("keydown",  this.handleEscPress);
        let timeLeftVar = this.secondsToTime(this.state.seconds);
        this.setState({ time: timeLeftVar });
        this.startTimer()
    }

    startTimer() {
        if (this.timer == 0 && this.state.seconds > 0) {
            this.timer = setInterval(this.countDown, 1000);
        }
    }

    countDown() {
        // Remove one second, set state so a re-render happens.
        let seconds = this.state.seconds - 1;
        this.setState({
            time: this.secondsToTime(seconds),
            seconds: seconds,
        });

        // Check if we're at zero.
        if (seconds == 0) {
            clearInterval(this.timer);
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown",  this.handleEscPress);
    }

    handleEscPress = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        const {cancelButton, cancelButtonText, confirmButton, confirmButtonText} = this.props;
        const {checkBox: {active}} = this.state;


        switch (event.keyCode) {
            case ESC_KEY_CODE:
                if (cancelButtonText || confirmButtonText) {
                    cancelButton();
                } else {
                    return;
                }
                break;
            case ENTER_KEY_CODE:
                if (confirmButtonText) {
                    confirmButton(active);
                } else {
                    cancelButton();
                }
                break;
        }
    };

    handleConfirmButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const {confirmButton} = this.props;
        const {checkBox: {active}} = this.state;
        confirmButton(active);
    };

    handleCheckClick = () => {
        const {checkBox: {active}} = {...this.state};
        this.setState({checkBox: {active: !active}})
    };

    render(): JSX.Element {
        const {confirmButton, cancelButton, confirmButtonText, confirmSecondaryButtonText, cancelButtonText,
               confirmLinkButtonText, confirmLinkButtonHref, confirmLinkButton, titleText, infoText, checkInfo,
            confirmSecondaryButton, showPopUpLogo, titleTransform, customStyle, shouldCheckOnPopupApprove, isPasswordSet, cancelButtonP, account} = this.props;
        const {checkBox: {active}} = this.state;
        const closePopUp : any = (e) => {
            if(e.target.className === 'popup' && typeof cancelButtonP === "function") {
                cancelButtonP();
                return
            }
            if(e.target.className === 'popup') {
                cancelButton();
            }
            return;
        };
        return (
            <div className="popup" onClick={closePopUp}>
                <div className="popup-content" style={customStyle || null}>
                    {
                        showPopUpLogo &&
                        <div className="popup-logo">
                            {/*<img className="image" src={require("assets/icons/dialog/logo@2x.png")} alt=""/>*/}
                            <img className="image" src={appLogo} alt=""/>
                        </div>
                    }
                    <div className="action-content">
                        <h1 className="title" style={titleTransform === false ? {textTransform: "none"}: null}>{titleText}</h1>
                        <h2 className="info">{infoText}</h2>
                        {
                            shouldCheckOnPopupApprove &&
                                <div>
                                    <label className="CheckboxBlock">
                                        {checkInfo}
                                        <input type="checkbox" checked={active} onChange={this.handleCheckClick}/>
                                            <span className="checkMark"/>
                                    </label>
                                </div>
                        }
                        <div className="button-block">
                            {((cancelButtonText && isPasswordSet) || !account) && <button className="cancel-btn" onClick={cancelButton}>{cancelButtonText}</button>}
                            {((cancelButtonText && isPasswordSet) || !account) && <button className="confirm-btn" onClick={this.handleConfirmButtonClick}>{confirmButtonText}</button>}
                            {cancelButtonText && !isPasswordSet && account && <button className="cancel-btn cancel-btn-wsp" onClick={cancelButton}>{cancelButtonText}</button>}
                            {confirmButtonText && !isPasswordSet && account && <button className="confirm-btn confirm-btn-wsp" disabled={!!this.state.time.s} onClick={this.handleConfirmButtonClick}>{this.state.time.s ? `${confirmButtonText} ${this.state.time.s} s` : confirmButtonText}</button>}
                            {confirmLinkButtonText && <a target="_blank" href={confirmLinkButtonHref} className="confirm-btn" onClick={cancelButton}>{confirmLinkButtonText}</a>}
                            {confirmSecondaryButtonText && <button className="confirm-secondary-btn" onClick={confirmSecondaryButton}>{confirmSecondaryButtonText}</button>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

};
