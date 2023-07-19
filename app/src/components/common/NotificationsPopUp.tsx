"use strict";
import "scss/pages/chat-panel/helpers/NotificationsPopUp";
import {ESC_KEY_CODE, MUTE_TIMES} from "configs/constants";
import components from "configs/localization";
import * as React from "react";

interface INotificationsPopUpProps {
    toggleIsPublicMutePopUp?: () => void;
    setUnlimitTimeMuteIsPublic?: () => void;
    setUnlimitTimeMute?: () => void;
    toggleMutePopUp?: () => void;
    isPublicMutePopUp?: boolean;

    setMuteTime?: (time: number) => void;
    setIsPublicMuteTime?: (time: number) => void;
}

interface INotificationsPopUpState {

}

export default class NotificationsPopUp extends React.Component<INotificationsPopUpProps, INotificationsPopUpState> {

    componentDidMount() {
        document.addEventListener("keydown",  this.handleEscPress);
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown",  this.handleEscPress);
    }

    handleEscPress = (event: any) => {
        const {toggleMutePopUp, isPublicMutePopUp, toggleIsPublicMutePopUp} = this.props;
        if (event.keyCode === ESC_KEY_CODE) {
            isPublicMutePopUp ? toggleIsPublicMutePopUp() : toggleMutePopUp();
        }
    };


    render(): JSX.Element {
        const {toggleMutePopUp, setUnlimitTimeMute, toggleIsPublicMutePopUp, isPublicMutePopUp, setUnlimitTimeMuteIsPublic, setMuteTime, setIsPublicMuteTime} = this.props
        const localization: any = components().muteNotifications;

        const setMinutes: any = () => setMuteTime(MUTE_TIMES.muteMinutes);
        const setHour: any = () => setMuteTime(MUTE_TIMES.muteHour);
        const setHours: any = () => setMuteTime(MUTE_TIMES.muteHours);
        const setDay: any = () => setMuteTime(MUTE_TIMES.muteDay);
        const setUnlimited: any = () => setMuteTime(MUTE_TIMES.muteUnlimited);

        const setIsGroupMinutes: any = () => setIsPublicMuteTime(MUTE_TIMES.muteMinutes);
        const setIsGroupHour: any = () => setIsPublicMuteTime(MUTE_TIMES.muteHour);
        const setIsGroupHours: any = () => setIsPublicMuteTime(MUTE_TIMES.muteHours);
        const setIsGroupDay: any = () => setIsPublicMuteTime(MUTE_TIMES.muteDay);
        const setIsGroupUnlimited: any = () => setIsPublicMuteTime(MUTE_TIMES.muteUnlimited);

        const closePopUp: any = (e) => {
            if (e.target.className === 'notifications-popup') {
                isPublicMutePopUp ? toggleIsPublicMutePopUp() : toggleMutePopUp();
            }
            return;
        };
        return (
            <div className="notifications-popup" onClick={closePopUp}>
                {/*<span className="popup-close" onClick={isGroupMutePopUp ? toggleIsGroupMutePopUp : toggleMutePopUp}/>*/}
                <div className="notifications-popup-content">
                    <span className="title">{localization.title}</span>
                    <div className="buttons-contnet">
                        <div className="set-time-row">
                            <span className="time-btn"
                                  onClick={isPublicMutePopUp ? setIsGroupMinutes : setMinutes}>{localization.minutes}</span>
                        </div>
                        <div className="set-time-row">
                            <span className="time-btn"
                                  onClick={isPublicMutePopUp ? setIsGroupHour : setHour}>{localization.hour}</span>
                        </div>
                        <div className="set-time-row">
                            <span className="time-btn"
                                  onClick={isPublicMutePopUp ? setIsGroupHours : setHours}>{localization.hours}</span>
                        </div>
                        <div className="set-time-row">
                            <span className="time-btn"
                                  onClick={isPublicMutePopUp ? setIsGroupDay : setDay}>{localization.day}</span>
                        </div>
                        <div className="set-time-row">
                            <span className="time-btn"
                                  onClick={isPublicMutePopUp ? setIsGroupUnlimited : setUnlimited}>{localization.unlimit}</span>
                        </div>
                    </div>
                </div>
            </div>
        )};
}
