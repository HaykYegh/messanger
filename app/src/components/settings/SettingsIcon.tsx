"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import BlockedContacts from "components/settings/BlockedContacts";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";

import "scss/pages/left-panel/settings/Privacy";
import IDBContact from "services/database/class/Contact";
import {
    SettingsBlockNext, SettingsIconBackground, SettingsLabelTitle,
    SettingsListBlock,
    SettingsNextIcon, SettingsNumber,
    SettingsText,
    SettingsTitle,
    SwitchButton
} from "containers/settings/style";
import CircularLoader from "components/common/loaders/CircularLoader";
import AccountSvg from "../../../assets/components/svg/settings/Account";
import StickerSvg from "../../../assets/components/svg/settings/Sticker";
import ChatSvg from "../../../assets/components/svg/settings/Chat";
import PrivacySvg from "../../../assets/components/svg/settings/Privacy";
import NotificationsSvg from "../../../assets/components/svg/settings/Notifications";
import LanguagesSvg from "../../../assets/components/svg/settings/Languages";
import NetworksSvg from "../../../assets/components/svg/settings/Network";
import WhyZangiSvg from "../../../assets/components/svg/settings/WhyZangi";
import LogsSvg from "../../../assets/components/svg/settings/Logs";

interface ISettingsIconProps {
    name: string;
    active: boolean;
}

interface ISettingsIconState {

}

export default class SettingsIcon extends React.Component<ISettingsIconProps, ISettingsIconState> {

    constructor(props) {
        super(props);
    }

    getedIcon = (name: string, active: boolean) => {
        switch (name) {
            case 'account':
                return (
                    <SettingsIconBackground color={"#6565E0"}>
                        <AccountSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'sticker_store':
                return (
                    <SettingsIconBackground color={"#FC3D70"}>
                        <StickerSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'chat_settings':
                return (
                    <SettingsIconBackground color={"#0CA9F3"}>
                        <ChatSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'privacy':
                return (
                    <SettingsIconBackground color={"#4ED85E"}>
                        <PrivacySvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'notifications':
                return (
                    <SettingsIconBackground color={"#FF4743"}>
                        <NotificationsSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'system_language':
                return (
                    <SettingsIconBackground color={"#0CA9F3"}>
                        <LanguagesSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'networks':
                return (
                    <SettingsIconBackground color={"#0CA9F3"}>
                        <NetworksSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'why_us':
                return (
                    <SettingsIconBackground color={"#0CA9F3"}>
                        <WhyZangiSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            case 'logs':
                return (
                    <SettingsIconBackground color={"#1F96F2"}>
                        <LogsSvg color={"#ffffff"} />
                    </SettingsIconBackground>
                )
            default:
                return null
        }
    }

    render() {
        const {name, active} = this.props;

        return this.getedIcon(name, active)
    }
};
