"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import BlockedContacts from "components/settings/BlockedContacts";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";

import "scss/pages/left-panel/settings/Privacy";
import IDBContact from "services/database/class/Contact";
import {
    SepLine,
    SettingsBlockNext, SettingsLabelTitle,
    SettingsListBlock, SettingsListBlockContent,
    SettingsNextIcon, SettingsNumber,
    SettingsText,
    SettingsTitle,
    SwitchButton
} from "containers/settings/style";
import CircularLoader from "components/common/loaders/CircularLoader";

interface IPrivacyProps {
    handleChange: (setting: {path: string, name: string, isChecked: boolean}) => void;
    privacy: any;
    userDelete: any;
}

interface IPrivacyState {
    isBlockedContactsShown: boolean;
    deleteAccount: boolean;
    blockedContactsCount: number;
    loader: boolean;
}

export default class Privacy extends React.Component<IPrivacyProps, IPrivacyState> {

    constructor(props) {
        super(props);
        this.state = {
            isBlockedContactsShown: false,
            deleteAccount: false,
            blockedContactsCount: 0,
            loader: false
        }
    }

    componentDidMount(): void {
        (async () => {
            const blockedContactsCount: number = await IDBContact.getBlockedContactsCount();
            this.setState({blockedContactsCount: blockedContactsCount[0].count});
        })();
    }

    componentDidUpdate(prevProps: Readonly<IPrivacyProps>, prevState: Readonly<IPrivacyState>, snapshot?: any): void {
        const {privacy} = this.props;
        if (prevState.isBlockedContactsShown === true) {
            (async () => {
                const blockedContactsCount: number = await IDBContact.getBlockedContactsCount();
                this.setState({blockedContactsCount: blockedContactsCount[0].count});
            })();
        }
        // if(prevProps.privacy.get("showOnlineStatus") !== privacy.get("showOnlineStatus")){
        //     this.setState({loader: false})
        // }
    }

    handleBlockedContactsShow = () => {
        const newState: IPrivacyState = this.state;
        newState.isBlockedContactsShown = !newState.isBlockedContactsShown;
        this.setState(newState);
    };

    handleShowDeleteAccountPopUp = () => {
        const newState: IPrivacyState = this.state;
        newState.deleteAccount = true;
        this.setState(newState);
    };

    handleDeleteAccount = () => {
        const {userDelete} = this.props;
        userDelete();
    };

    handleAccountDeleteCancel = () => {
        const newState: IPrivacyState = this.state;
        newState.deleteAccount = false;
        this.setState(newState);
    };

    render() {
        const localization: any = components().privacy;
        const deleteAccountLocalization: any = components().deleteAccount;
        const {handleChange, privacy} = this.props;
        const {isBlockedContactsShown, deleteAccount, blockedContactsCount} = this.state;

        return (
            <div className="privacy-content">
                {isBlockedContactsShown ?
                    <BlockedContacts handleBlockedContactsShow={this.handleBlockedContactsShow}/> :
                    <>
                        <SettingsListBlockContent>
                            <SettingsListBlock cursor="pointer"
                                onClick={() => {handleChange({path: "privacy", name: "showOnlineStatus", isChecked: !privacy.get("showOnlineStatus")})}}>
                                <SettingsTitle cursor="pointer">{localization.onlineStatus}</SettingsTitle>
                                <SwitchButton>
                                    <input
                                        type="checkbox"
                                        data-path="privacy"
                                        name="showOnlineStatus"
                                        checked={privacy.get("showOnlineStatus")}
                                    />
                                    <span className="slider"/>
                                </SwitchButton>
                                {/*{this.state.loader ? <CircularLoader size={8} padding={4} /> : ""}*/}
                                <SepLine />
                            </SettingsListBlock>
                            <SettingsListBlock cursor="pointer"
                                onClick={() => handleChange({path: "privacy", name: "showTyping", isChecked: !privacy.get("showTyping")})}>
                                <SettingsTitle cursor="pointer">{localization.showTyping}</SettingsTitle>
                                <SwitchButton>
                                    <input
                                        type="checkbox"
                                        name="showTyping"
                                        data-path="privacy"
                                        checked={privacy.get("showTyping")}
                                    />
                                    <span className="slider"/>
                                </SwitchButton>
                                <SepLine />
                            </SettingsListBlock>
                            <SettingsListBlock cursor="pointer"
                                onClick={() => handleChange({path: "privacy", name: "showSeenStatus", isChecked: !privacy.get("showSeenStatus")})}>
                                <SettingsTitle cursor="pointer">{localization.showSeenStatus}</SettingsTitle>
                                <SwitchButton>
                                    <input
                                        type="checkbox"
                                        name="showSeenStatus"
                                        data-path="privacy"
                                        checked={privacy.get("showSeenStatus")}
                                    />
                                    <span className="slider"/>
                                </SwitchButton>
                            </SettingsListBlock>
                        </SettingsListBlockContent>
                        <SettingsText className="settings_text">
                            {localization.seenInfo}
                        </SettingsText>
                        <SettingsLabelTitle/>
                        <SettingsListBlock cursor="pointer" onClick={this.handleBlockedContactsShow}>
                            <SettingsTitle className="settings_title" cursor="pointer">{localization.blocked}</SettingsTitle>
                            <SettingsBlockNext>
                            <SettingsNumber className="blocked-count">{blockedContactsCount}</SettingsNumber>
                            <SettingsNextIcon/>
                            </SettingsBlockNext>
                        </SettingsListBlock>
                        <SettingsText>{localization.blockedInfo}</SettingsText>
                        <SettingsLabelTitle/>
                        <SettingsListBlock cursor="pointer" onClick={this.handleShowDeleteAccountPopUp}>
                            <SettingsTitle cursor="pointer">{localization.deleteMyAccount}</SettingsTitle>
                            <SettingsNextIcon/>
                        </SettingsListBlock>
                        <SettingsText className="settings_text">{localization.deleteMyAccountInfo}</SettingsText>
                        {
                            <ReactCSSTransitionGroup
                                transitionName={{
                                    enter: 'open',
                                    enterActive: 'openActive',
                                    leaveActive: 'leaveActive',
                                    leave: 'close',
                                }}
                                component="div"
                                transitionEnter={true}
                                transitionLeave={true}
                                transitionEnterTimeout={250}
                                transitionLeaveTimeout={250}
                            >
                                {
                                    deleteAccount ?
                                        <PopUpMain
                                            confirmButton={this.handleDeleteAccount}
                                            confirmButtonText={deleteAccountLocalization.delete}
                                            cancelButton={this.handleAccountDeleteCancel}
                                            cancelButtonText={deleteAccountLocalization.cancel}
                                            titleText={deleteAccountLocalization.title}
                                            infoText={deleteAccountLocalization.info}
                                            showPopUpLogo={true}
                                        /> : null
                                }
                            </ReactCSSTransitionGroup>
                        }
                    </>
                }
            </div>
        );
    }
};
