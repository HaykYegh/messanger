"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {
    attemptChangeLeftPanel,
    attemptDownloadUpdate,
    setSelectedStickerId,
    toggleOnlineStatus,
    toggleProfilePopUp,
    toggleUpdateDownloadStart,
    toggleUpdateDownloadFinish,
    toggleUpdateIsAvailable,
    toggleIsUpdateLoading,
} from "modules/application/ApplicationActions";
import {
    attemptAddSticker,
    attemptAddStickerPreviewIcon,
    attemptAddStickerPreviewImage,
    attemptChangeSetting,
    attemptCheckNewStickers,
    attemptRemoveSticker,
    attemptResetSetting,
    attemptSetStickersIcons,
    attemptStickerHide,
    attemptStickerShow,
    settingsUpdateRequest
} from "modules/settings/SettingsActions";
import {
    networkErrorSelector,
    networkJoinPopUpSelector,
    networkLeaveIdSelector,
    networkLeavePopUpSelector,
    networksSelector,
    searchedNetworkSelector
} from "modules/networks/NetworksSelector";
import {
    attemptAddNetwork,
    attemptGetNetwork,
    attemptLeaveNetwork,
    removeNetworkError,
    removeSearchedNetwork,
    setNetworkJoinPopUp,
    setNetworkLeavePopUp
} from "modules/networks/NetworksActions";
import {
    chatSelector,
    languagesSelector,
    myStickersSelector,
    notificationSelector,
    privacySelector,
    stickersSelector,
    appUpdatesSelector,
} from "modules/settings/SettingsSelector";
import {INetwork} from "modules/networks/NetworksReducer";
import CheckForUpdates from "components/settings/CheckForUpdates";
import Notifications from "components/settings/Notifications";
import {attemptDeleteAccount} from "modules/user/UserActions";
import StickerStore from "components/settings/StickerStore";
import {IContact} from "modules/contacts/ContactsReducer";
import {IStoreProps} from "services/selector";
import CreditCard from "components/settings/CreditCard";
import WhyOurApp from "components/settings/WhyOurApp";
import Languages from "components/settings/Languages";
import Account from "containers/left-panels/Account";
import Networks from "components/settings/Networks";
import Privacy from "components/settings/Privacy";
import {APP_CONFIG, APPLICATION, LEFT_PANELS} from "configs/constants";
import components from "configs/localization";
import Chat from "components/settings/Chat";
import Logs from "components/settings/Logs";
import {userSelector} from "modules/user/UserSelector";
import {applicationVersionSelector, leftPanelSelector, updateDownloadProgressSelector, updateDownloadFinishSelector, updateDownloadStartSelector, updateIsAvailableSelector, updateIsLoadingSelector} from "modules/application/ApplicationSelector";
import {
    SettingsContainer,
    SettingsIconClose,
    SettingsMenuBar,
    SettingsPageTitle,
    SettingsPopup,
    SettingsPopupBlock, SettingsPopupContainer,
    SettingsPopupContent,
    SettingsScrollBar,
    SettingsTitleBlock
} from "containers/settings/style";
import Log from "modules/messages/Log";
import WebViewContent from "../../pages/WebViewContent";
import SettingsIcon from "components/settings/SettingsIcon";
import NextIconSvg from "../../../assets/components/svg/settings/NextIcon";

interface ISettingsPassedProps {
    closeSettings: () => void,
    handleSettingsToggle: () => void,
    showSettings: boolean
    subPageToActivate: string;
}

interface ISettingsProps extends IStoreProps, ISettingsPassedProps {
    settingsUpdateRequest: (settingsType: string, settingsId: string, value: any) => void,

    attemptChangeSetting: (settingsType: string, settingsId: string, value: string | boolean, send?: boolean) => void,
    setNetworkLeavePopUp: (networkLeavePopUp: boolean, networkId: number) => void,
    attemptAddNetwork: (nicknameOrToken: any, network: any) => void,
    setNetworkJoinPopUp: (networkJoinPopUp: string) => void,
    attemptResetSetting: (settingsType: string) => void,
    attemptSetStickersIcons: (id: string, callback?: any) => void;
    attemptAddStickerPreviewIcon: (id: string) => void,
    attemptLeaveNetwork: (networkId: number) => void,
    toggleOnlineStatus: (enable: boolean) => void,
    attemptRemoveSticker: (id: string) => void,
    attemptAddSticker: (id: string) => void,
    setSelectedStickerId: (id: string) => void,
    attemptStickerHide: (id: string) => void,
    attemptStickerShow: (id: string) => void,
    changeLeftPanel: (panel: string) => void,
    attemptGetNetwork: (id: string) => void,
    attemptCheckNewStickers: () => void,
    removeSearchedNetwork: () => void,
    removeNetworkError: () => void,
    attemptAddStickerPreviewImage: (id: string) => void,
    attemptDeleteAccount: () => void,
    leftPanel: string;
    updates: any;
    applicationVersion?: string;
    attemptDownloadUpdate: (fileRemotePath: string, method: string, sha512: string, isAdminRightsRequired: boolean) => void;
    toggleUpdateDownloadStart: (updateDownloadStart: boolean) => void;
    toggleUpdateDownloadFinish: (updateDownloadFinish: boolean) => void;
    updateProgress: number;
    updateDownloadStart: boolean;
    updateDownloadFinish: boolean;
    updateIsAvailable: boolean;
    toggleUpdateIsAvailable: (updateIsAvailable: boolean) => void;
    toggleIsUpdateLoading: (updateIsLoading: boolean) => void;
    updateIsLoading: boolean;
}

interface ISettingsState {
    activeSubPage: string,
    menuBar: string[],
    showLangDropDown: boolean;
    contactToBlock: IContact;
    loading: boolean;
    menuId: string;
    menuState: string;
    showContextMenuTop: boolean;
    stickerStoreTab: string;
    keyword: string;
}

const menuBarColors = {
    account: "#00A2E2",
    sticker_store: "#4489FF",
    chat_settings: "#FF4489",
    privacy: "#4489FF",
    notifications: "#FF8D00",
    system_language: "#6767C8",
    networks: "#7DB655",
    why_us: "#4489FF",
    logs:  "#EC5B55"
}

class Settings extends React.Component<ISettingsProps, ISettingsState> {

    settingsContainer: React.RefObject<HTMLElement>;

    settingsBlock: React.RefObject<HTMLElement>;

    constructor(props: any) {
        super(props);
        const {subPageToActivate} = this.props;
        this.settingsContainer = React.createRef();
        this.settingsBlock = React.createRef();
        const menuBar = [
            LEFT_PANELS.account,
            LEFT_PANELS.add_credit,
            LEFT_PANELS.sticker_store,
            LEFT_PANELS.chat_settings,
            LEFT_PANELS.privacy,
            LEFT_PANELS.notifications,
            LEFT_PANELS.system_language,
            LEFT_PANELS.networks,
            LEFT_PANELS.check_for_updates,
            LEFT_PANELS.why_us,
            LEFT_PANELS.logs
        ].filter(el => !APP_CONFIG.ignores.includes(el));

        this.state = {
            activeSubPage: subPageToActivate || LEFT_PANELS.account,
            menuBar,
            showLangDropDown: false,
            stickerStoreTab: "",
            contactToBlock: null,
            loading: true,
            menuId: "",
            menuState: "",
            keyword: "",
            showContextMenuTop: false
        }
    }

    componentDidMount(): void {
        // this.settingsContainer.current.addEventListener("click", this.handleOutSideClick);
        // document.addEventListener('keyup', this.handleSettingsEscPress);
    }

    componentWillUnmount(): void {
        // this.settingsContainer.current.removeEventListener("click", this.handleOutSideClick);
        // document.removeEventListener('keyup', this.handleSettingsEscPress);
    }

    shouldComponentUpdate(nextProps: ISettingsProps, nextState: ISettingsState): boolean {

        if (this.props.applicationVersion !== nextProps.applicationVersion) {
            return true;
        }

        if (this.props.leftPanel !== nextProps.leftPanel) {
            return true;
        }

        if (this.props.subPageToActivate !== nextProps.subPageToActivate) {
            return true;
        }

        if (this.props.networkJoinPopUp !== nextProps.networkJoinPopUp) {
            return true;
        }

        if (this.props.networkLeavePopUp !== nextProps.networkLeavePopUp) {
            return true;
        }

        if (this.props.networkError !== nextProps.networkError) {
            return true;
        }

        if (this.props.networkLeaveId !== nextProps.networkLeaveId) {
            return true;
        }

        if (!this.props.notification.equals(nextProps.notification)) {
            return true;
        }

        if (!this.props.stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (!this.props.notification.equals(nextProps.notification)) {
            return true;
        }

        if (!this.props.privacy.equals(nextProps.privacy)) {
            return true;
        }

        if (!this.props.chat.equals(nextProps.chat)) {
            return true;
        }

        if (!this.props.languages.equals(nextProps.languages)) {
            return true;
        }

        if (!isEqual(this.props.networks, nextProps.networks)) {
            return true;
        }

        if (!isEqual(this.props.myStickers, nextProps.myStickers)) {
            return true;
        }

        if (this.props.updateProgress !== nextProps.updateProgress) {
            return true
        }

        if (this.props.updateIsLoading !== nextProps.updateIsLoading) {
            return true
        }

        if (this.props.updateIsAvailable !== nextProps.updateIsAvailable) {
            return true
        }

        if (this.props.updateDownloadStart !== nextProps.updateDownloadStart) {
            return true
        }

        if (this.props.updateDownloadFinish !== nextProps.updateDownloadFinish) {
            return true
        }

        return !isEqual(this.state, nextState);
    }

    handleSettingsEscPress = (event: any) => {
        if (event.key === "Escape") {
            this.props.handleSettingsToggle();
        }
    };

    handleChangeSubPage = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const {menuBar, activeSubPage} = this.state;
        const newState: ISettingsState = {...this.state};
        const nextSubPage: string = e.currentTarget.getAttribute('data-menu-bar');
        if (menuBar.includes(nextSubPage) && activeSubPage !== nextSubPage) {
            newState.activeSubPage = nextSubPage;
            this.setState(newState);
        }
    };

    handleSettingChange = (settings: any): void => {
        const {path, name, isChecked} = settings;
        const {attemptChangeSetting, settingsUpdateRequest} = this.props;


        if (name === "showOnlineStatus") {
            return settingsUpdateRequest(path, name, isChecked);
        }

        attemptChangeSetting(path, name, isChecked, path === "privacy");
    };

    handleLanguageChange = ({currentTarget: {dataset}}: React.MouseEvent<HTMLDivElement>): void => {
        const path: string = dataset.path;
        const selectedLanguage: string = dataset.language;
        const name: string = dataset.name;
        const {attemptChangeSetting, languages} = this.props;

        if (languages && languages.get('selectedLanguage') === selectedLanguage) {
            return;
        }

        attemptChangeSetting(path, name, selectedLanguage);
    };

    handleReset = (settingsType: string): void => {
        const {attemptResetSetting} = this.props;
        attemptResetSetting(settingsType);
    };

    handleStickerStoreTabClick = (tab: string) => {
        if (tab) {
            this.setState({stickerStoreTab: tab});
            return;
        }
        return;
    };

    handleStickerRemove = (id: string) => {
        const {attemptRemoveSticker} = this.props;
        attemptRemoveSticker(id);
    };

    handleStickerHide = (id: string) => {
        const {attemptStickerHide} = this.props;
        attemptStickerHide(id);
        this.handleMenuClose()
    };

    handleStickerShow = (id: string) => {
        const {attemptStickerShow} = this.props;
        attemptStickerShow(id);
        this.handleMenuClose()
    };

    handleChangePanel = (panel: string, id?: string) => {
        const {changeLeftPanel, setSelectedStickerId, leftPanel} = this.props;
        if (panel !== leftPanel) {
            changeLeftPanel(panel);
            if (id) {
                setSelectedStickerId(id);
            }
        }
    };

    handleMenuOpen = (menuId: string, event: any) => {
        event.stopPropagation();
        if (this.state.menuId && this.state.menuState) {
            this.setState({menuId: "", menuState: ""});
        } else {
            let showContextMenuTop = false;
            if (event && event.screenY && (((window as any).innerHeight - event.screenY - 100 < 0))) {
                showContextMenuTop = true;
            }
            this.setState({menuId, menuState: "new", showContextMenuTop});
        }
    };

    handleMenuClose = () => {
        this.setState({menuId: "", menuState: ""});
    };

    handleNetworkChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;
        if (value !== keyword) {
            this.setState({keyword: value});
        }
    };

    handleNetworkJoin = () => {
        const {attemptGetNetwork} = this.props;
        const {keyword} = this.state;
        if (keyword && keyword.length > 5) {
            attemptGetNetwork(keyword);
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
    };

    handleNetworkJoinCancel = (): void => {
        const {setNetworkJoinPopUp, removeSearchedNetwork} = this.props;
        setNetworkJoinPopUp("");
        removeSearchedNetwork();
    };

    handleNetworkAdd = (): void => {
        const {attemptAddNetwork, searchedNetwork} = this.props;
        const searchedNetworkObj = searchedNetwork.toJS();
        attemptAddNetwork(searchedNetworkObj.nickname, searchedNetworkObj);
        this.handleSearchClear();
    };

    handleLeaveNetworkPopUpOpen = (networkId: number): void => {
        const {setNetworkLeavePopUp} = this.props;
        setNetworkLeavePopUp(true, networkId);
    };

    handleLeaveNetworkPopUpClose = (): void => {
        const {setNetworkLeavePopUp} = this.props;
        setNetworkLeavePopUp(false, null);
    };

    handleNetworkLeave = (): void => {
        const {networkLeaveId, attemptLeaveNetwork} = this.props;
        attemptLeaveNetwork(networkLeaveId);
    };

    handleUserDelete = () => {
        const {attemptDeleteAccount} = this.props;
        attemptDeleteAccount();
    };

    handleOutSideClick = (event: any) => {
        const {showSettings, handleSettingsToggle} = this.props;
        const referenceNode = this.settingsBlock;

        if (showSettings && referenceNode && referenceNode.current && !referenceNode.current.contains(event.target)) {
            handleSettingsToggle();
        }
    };

    // handleUploadDbData = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const reader = new FileReader();
    //     reader.onload = this.readerOnLoad;
    //     reader.readAsText(event.target.files[0]);
    // };

    // readerOnLoad = (event) => {
    //     const obj = JSON.parse(event.target.result);
    //     alert(obj);
    // };

    // handleDownloadDbData = async (event: React.MouseEvent<HTMLButtonElement>) => {
    //     const data = await IDBApplication.selectAllData();
    //
    //     this.downloadJson(data);
    // };

    // downloadJson = (jsonData) => {
    //     let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    //
    //     let exportFileDefaultName = 'data.json';
    //
    //     let linkElement = document.createElement('a');
    //     linkElement.setAttribute('href', dataUri);
    //     linkElement.setAttribute('download', exportFileDefaultName);
    //     linkElement.click();
    // };

    get subPageContent(): JSX.Element {
        const {
            privacy, languages, chat, notification, stickers, myStickers, networkJoinPopUp, networks,
            searchedNetwork, networkLeavePopUp, networkLeaveId, networkError, removeNetworkError, user, attemptCheckNewStickers,
            attemptAddStickerPreviewIcon, attemptSetStickersIcons, attemptAddStickerPreviewImage, attemptAddSticker,updateProgress
        } = this.props;
        const {activeSubPage, showContextMenuTop, stickerStoreTab, menuId, keyword} = this.state;

        switch (activeSubPage) {
            case LEFT_PANELS.networks:
                return (
                    <Networks
                        handleLeaveNetworkPopUpClose={this.handleLeaveNetworkPopUpClose}
                        handleLeaveNetworkPopUpOpen={this.handleLeaveNetworkPopUpOpen}
                        handleNetworkJoinCancel={this.handleNetworkJoinCancel}
                        handleNetworkChange={this.handleNetworkChange}
                        handleNetworkErrorRemove={removeNetworkError}
                        handleNetworkLeave={this.handleNetworkLeave}
                        handleNetworkJoin={this.handleNetworkJoin}
                        handleSearchClear={this.handleSearchClear}
                        handleNetworkAdd={this.handleNetworkAdd}
                        networkLeavePopUp={networkLeavePopUp}
                        networkJoinPopUp={networkJoinPopUp}
                        searchedNetwork={searchedNetwork}
                        networkLeaveId={networkLeaveId}
                        networkError={networkError}
                        networks={networks}
                        keyword={keyword}
                    />
                );
            case LEFT_PANELS.add_credit:
                return (
                    <CreditCard
                        showRates={() => this.handleChangePanel(LEFT_PANELS.rates)}
                        openPromo={() => this.handleChangePanel(LEFT_PANELS.promo)}
                    />
                );
            case LEFT_PANELS.sticker_store:
                return (
                    <StickerStore
                        handleStickerStoreTabClick={this.handleStickerStoreTabClick}
                        handleStickerRemove={this.handleStickerRemove}
                        handleChangePanel={this.handleChangePanel}
                        handleStickerHide={this.handleStickerHide}
                        handleStickerShow={this.handleStickerShow}
                        showContextMenuTop={showContextMenuTop}
                        handleMenuClose={this.handleMenuClose}
                        handleMenuOpen={this.handleMenuOpen}
                        stickerStoreTab={stickerStoreTab}
                        myStickers={myStickers}
                        stickers={stickers}
                        menuId={menuId}
                        attemptCheckNewStickers={attemptCheckNewStickers}
                        attemptAddStickerPreviewIcon={attemptAddStickerPreviewIcon}
                        attemptAddStickerPreviewImage={attemptAddStickerPreviewImage}
                        attemptSetStickersIcons={attemptSetStickersIcons}
                        attemptAddSticker={attemptAddSticker}/>
                );
            case LEFT_PANELS.chat_settings:
                return (
                    <Chat
                        chatSettings={chat}
                        handleChange={this.handleSettingChange}
                    />
                );
            case LEFT_PANELS.privacy:
                return (
                    <Privacy
                        handleChange={this.handleSettingChange}
                        privacy={privacy}
                        userDelete={this.handleUserDelete}
                    />
                );
            case LEFT_PANELS.notifications:
                return (
                    <Notifications
                        notification={notification}
                        handleChange={this.handleSettingChange}
                        resetNotification={this.handleReset}
                    />
                );
            case LEFT_PANELS.system_language:
                return (
                    <Languages
                        languages={languages}
                        handleLanguageChange={this.handleLanguageChange}
                    />
                );
            case LEFT_PANELS.check_for_updates:
                return (
                    <CheckForUpdates
                      selectedLanguage={languages.get("selectedLanguage")}
                      // attemptDownloadUpdate={this.props.attemptDownloadUpdate}
                      // updateProgress={updateProgress}
                      // toggleUpdateDownloadStart={this.props.toggleUpdateDownloadStart}
                      // toggleUpdateDownloadFinish={this.props.toggleUpdateDownloadFinish}
                      // updateDownloadStart={this.props.updateDownloadStart}
                      // updateDownloadFinish={this.props.updateDownloadFinish}
                      // updateIsAvailable={this.props.updateIsAvailable}
                      // toggleUpdateIsAvailable={this.props.toggleUpdateIsAvailable}
                      // toggleIsUpdateLoading={this.props.toggleIsUpdateLoading}
                      // updateIsLoading={this.props.updateIsLoading}
                    />
                );
            case LEFT_PANELS.why_us:
                return <WhyOurApp/>;

            case LEFT_PANELS.logs:
                return <Logs user={user}/>;
            default:
                return <Account/>
        }
    }

    render() {
        const {menuBar, activeSubPage} = this.state;
        const {closeSettings, applicationVersion, updates} = this.props;
        const localization: any = components().settings;

        Log.i("menuBar -> ", menuBar)

        return (
            <SettingsPopup onClick={this.handleOutSideClick} className="settings-popup" ref={this.settingsContainer}>
                <SettingsPopupContainer onClick={(e) => e.stopPropagation()} className="settings-popup-block" id="settings-popup-block">
                    <SettingsTitleBlock>
                        <SettingsIconClose onClick={closeSettings}/>
                        <SettingsPageTitle>{localization.settings}</SettingsPageTitle>
                    </SettingsTitleBlock>
                    <SettingsPopupBlock   ref={this.settingsBlock}>
                        <SettingsMenuBar>
                            <SettingsContainer>
                                {
                                    menuBar.map(item => {
                                        return (
                                            <div

                                                key={item}
                                                className={`icon_pack${activeSubPage === item ? " icon_pack-active" : ""}`}
                                                data-menu-bar={item}
                                                onClick={this.handleChangeSubPage}
                                                style={{
                                                     backgroundColor: activeSubPage === item ? "#B7BCC6" : "unset"
                                                }}
                                            >
                                                <SettingsIcon name={item} active={activeSubPage === item ? true : false} />

                                                {/*<span className={`icon icon-${item}`}/>*/}
                                                <div className="block-info">
                                                    <span style={{
                                                        color: activeSubPage === item ? "#ffffff" : "#161616"
                                                    }} className="icon_info">{localization[item] || item}</span>
                                                    {
                                                        item === "check_for_updates" &&
                                                        // applicationVersion > APP_CONFIG.CURRENT_VERSION &&
                                                        updates && updates.get('isAvailable') &&
                                                        <span
                                                            className="update-notification">1</span>
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </SettingsContainer>
                            {/*<button onClick={this.handleDownloadDbData}>*/}
                            {/*Download Db Data*/}
                            {/*</button>*/}
                            {/*<input type={"file"} onChange={this.handleUploadDbData} />*/}

                        </SettingsMenuBar>
                        {activeSubPage === "add_credit" && APPLICATION.WITHWALLET ? <WebViewContent /> : <SettingsPopupContent>
                            {/*<SettingsTitleBlock backgroundColor={"#fff"}>*/}
                            {/*    <SettingsPageTitle>{localization[activeSubPage] || activeSubPage}</SettingsPageTitle>*/}
                            {/*</SettingsTitleBlock>*/}
                            <SettingsScrollBar userSelect={activeSubPage !== LEFT_PANELS.account ? 'none' : 'auto'}>
                                {this.subPageContent}
                            </SettingsScrollBar>
                        </SettingsPopupContent>}
                    </SettingsPopupBlock>
                </SettingsPopupContainer>
            </SettingsPopup>
        )
    }
}


const mapStateToProps: any = () => {
    const applicationVersion = applicationVersionSelector();
    const notification = notificationSelector();
    const privacy = privacySelector();
    const chat = chatSelector();
    const languages = languagesSelector();
    const updates = appUpdatesSelector();
    const myStickers = myStickersSelector();
    const stickers = stickersSelector();
    const leftPanel = leftPanelSelector();
    const updateProgress = updateDownloadProgressSelector();
    const updateDownloadStart = updateDownloadStartSelector();
    const updateDownloadFinish = updateDownloadFinishSelector();
    const updateIsAvailable = updateIsAvailableSelector();
    const updateIsLoading = updateIsLoadingSelector();
    const user = userSelector();
    const networks = networksSelector();
    const networkJoinPopUp = networkJoinPopUpSelector();
    const searchedNetwork = searchedNetworkSelector();
    const networkLeavePopUp = networkLeavePopUpSelector();
    const networkLeaveId = networkLeaveIdSelector();
    const networkError = networkErrorSelector();
    return (state, props) => {
        return {
            applicationVersion: applicationVersion(state, props),
            notification: notification(state, props),
            privacy: privacy(state, props),
            chat: chat(state, props),
            languages: languages(state, props),
            myStickers: myStickers(state, props),
            stickers: stickers(state, props),
            leftPanel: leftPanel(state, props),
            user: user(state, props),
            networks: networks(state, props),
            networkJoinPopUp: networkJoinPopUp(state, props),
            searchedNetwork: searchedNetwork(state, props),
            networkLeavePopUp: networkLeavePopUp(state, props),
            networkLeaveId: networkLeaveId(state, props),
            networkError: networkError(state, props),
            updates: updates(state,props),
            updateProgress: updateProgress(state,props),
            updateDownloadStart: updateDownloadStart(state,props),
            updateDownloadFinish: updateDownloadFinish(state,props),
            updateIsAvailable: updateIsAvailable(state,props),
            updateIsLoading: updateIsLoading(state,props),
        }
    }
};

const mapDispatchToProps: any = dispatch => ({
    toggleOnlineStatus: (enable: boolean) => dispatch(toggleOnlineStatus(enable)),
    attemptChangeSetting: (settingsType, settingsId, value, send) => dispatch(attemptChangeSetting(settingsType, settingsId, value, send)),
    attemptResetSetting: (settingsType) => dispatch(attemptResetSetting(settingsType)),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    attemptAddSticker: (id) => dispatch(attemptAddSticker(id)),
    attemptSetStickersIcons: (id, callback) => dispatch(attemptSetStickersIcons(id, callback)),
    setSelectedStickerId: id => dispatch(setSelectedStickerId(id)),
    attemptRemoveSticker: id => dispatch(attemptRemoveSticker(id)),
    attemptStickerHide: id => dispatch(attemptStickerHide(id)),
    attemptCheckNewStickers: () => dispatch(attemptCheckNewStickers()),
    attemptStickerShow: id => dispatch(attemptStickerShow(id)),
    attemptAddStickerPreviewIcon: id => dispatch(attemptAddStickerPreviewIcon(id)),
    attemptAddStickerPreviewImage: id => dispatch(attemptAddStickerPreviewImage(id)),
    attemptGetNetwork: id => dispatch(attemptGetNetwork(id)),
    setNetworkJoinPopUp: networkJoinPopUp => dispatch(setNetworkJoinPopUp(networkJoinPopUp)),
    attemptAddNetwork: (nicknameOrToken: any, network: INetwork) => dispatch(attemptAddNetwork(nicknameOrToken, network)),
    removeSearchedNetwork: () => dispatch(removeSearchedNetwork()),
    attemptLeaveNetwork: (networkId: number) => dispatch(attemptLeaveNetwork(networkId)),
    removeNetworkError: () => dispatch(removeNetworkError()),
    setNetworkLeavePopUp: (networkLeavePopUp: boolean, networkId: number) => dispatch(setNetworkLeavePopUp(networkLeavePopUp, networkId)),
    attemptDeleteAccount: () => dispatch(attemptDeleteAccount()),
    settingsUpdateRequest: (settingsType: string, settingsId: string, value: any) => dispatch(settingsUpdateRequest(settingsType, settingsId, value)),
    attemptDownloadUpdate: (fileRemotePath: string, method: string, sha512: string, isAdminRightsRequired: boolean) => dispatch(attemptDownloadUpdate(fileRemotePath, method, sha512, isAdminRightsRequired)),
    toggleUpdateDownloadStart: (updateDownloadStart: boolean) => dispatch(toggleUpdateDownloadStart(updateDownloadStart)),
    toggleUpdateDownloadFinish: (updateDownloadFinish: boolean) => dispatch(toggleUpdateDownloadFinish(updateDownloadFinish)),
    toggleUpdateIsAvailable: (updateIsAvailable: boolean) => dispatch(toggleUpdateIsAvailable(updateIsAvailable)),
    toggleIsUpdateLoading: (updateIsLoading: boolean) => dispatch(toggleIsUpdateLoading(updateIsLoading))
});

export default connect<{}, {}, ISettingsPassedProps>(mapStateToProps, mapDispatchToProps)(Settings);
