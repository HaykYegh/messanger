"use strict";

import * as React from "react";

import {LOADER} from "configs/animation/loader";
import {LEFT_PANELS} from "configs/constants";
import components from "configs/localization";
import SVG from "components/common/SVG";
import "scss/pages/left-panel/Settings";
import {Scrollbars} from 'react-custom-scrollbars';

interface IMainProps {
    changeSubPage: (subPage: string) => void;
    handleCheckForUpdates: () => void;
    fullName?: string;
    avatar?: string;
    phoneNumber?: string;
    loading?: boolean;
    handleAvatarLoad?: () => void;
    previousLeftPanel?: string;
}

interface IMainState {

}

export default class Main extends React.Component<IMainProps, IMainState> {

    render() {

        const {changeSubPage, fullName, avatar, phoneNumber, loading, handleAvatarLoad, previousLeftPanel, handleCheckForUpdates} = this.props;
        const openProfileSettings: any = () => changeSubPage(LEFT_PANELS.profile_settings);
        const openNetworks: any = () => changeSubPage(LEFT_PANELS.networks);
        const openNotifications: any = () => changeSubPage(LEFT_PANELS.notifications);
        const openStickerStore: any = () => changeSubPage(LEFT_PANELS.sticker_store);
        const openChatSettings: any = () => changeSubPage(LEFT_PANELS.chat_settings);
        const openAddCredit: any = () => changeSubPage(LEFT_PANELS.add_credit);
        const openPrivacy: any = () => changeSubPage(LEFT_PANELS.privacy);
        const openLanguageSettings: any = () => changeSubPage(LEFT_PANELS.system_language);
        const openWhy: any = () => changeSubPage(LEFT_PANELS.why_us);
        const openLogs: any = () => changeSubPage(LEFT_PANELS.logs);

        const localization: any = components().settings;
        const emptyNameLocalization = components().profilePanel;

        const leftAnimation: boolean = [LEFT_PANELS.profile_settings, LEFT_PANELS.notifications, LEFT_PANELS.sticker_store, LEFT_PANELS.chat_settings, LEFT_PANELS.add_credit, LEFT_PANELS.privacy, LEFT_PANELS.system_language].includes(previousLeftPanel);

        return (
            <div className={leftAnimation ? "left-to-right-animation settings-block" : "settings-block"}>
                <div className="profile-content" onClick={openProfileSettings}>
                    <div className="profile-image">
                        {
                            avatar ?
                                <div>
                                    {loading && <div className="loader">
                                        <SVG
                                            width={60}
                                            height={60}
                                            src={LOADER}
                                            className='lottie-animation'
                                        />
                                    </div>}
                                    <img src={avatar} onLoad={handleAvatarLoad}
                                         style={{display: loading ? 'none' : 'block'}}/>
                                </div>
                                : <span className="img"/>
                        }
                    </div>
                    <div className="profile-info">
                        <p className={fullName.length ? "profile-name" : "placeholder-color"}>
                            {fullName.length ? fullName : emptyNameLocalization.enterYourName}
                        </p>
                        <p className="profile-number">
                            {phoneNumber}
                        </p>
                    </div>
                </div>
                <Scrollbars autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                    <div className="icons_container">
                        <div className="icon_pack" onClick={openNetworks}>
                            <span className="icon networks"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.networks}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openAddCredit}>
                            <span className="icon add_credit"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.add_credit}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openStickerStore}>
                            <span className="icon sticker_store"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.sticker_store}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openChatSettings}>
                            <span className="icon chat_settings"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.chat_settings}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openPrivacy}>
                            <span className="icon privacy"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.privacy}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openNotifications}>
                            <span className="icon notifications"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.notifications}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openLanguageSettings}>
                            <span className="icon system_language"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.system_language}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={handleCheckForUpdates}>
                            <span className="icon check_for_updates"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.check_for_updates}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openWhy}>
                            <span className="icon why_us"/>
                            <div className="block-info">
                                <span className="icon_info">{localization.why_us}</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                        <div className="icon_pack" onClick={openLogs}>
                            <span className="icon why_us"/>
                            <div className="block-info">
                                <span className="icon_info">Logs</span>
                                <span className="icon_arrow"/>
                            </div>
                        </div>
                    </div>
                </Scrollbars>
            </div>
        )
    }

};
