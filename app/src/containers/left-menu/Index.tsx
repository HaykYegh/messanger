'use strict';

import * as React from 'react';
import {connect} from 'react-redux';
import isEqual from 'lodash/isEqual';
import throttle from "lodash/throttle";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    applicationVersionSelector,
    leftPanelSelector,
    newMessagesCountSelector
} from "modules/application/ApplicationSelector";
import {activeSubPageSelector, languagesSelector, appUpdatesSelector} from "modules/settings/SettingsSelector";
import {attemptChangeLeftPanel, setSendingLocation} from 'modules/application/ApplicationActions';
import {setActiveSubPage} from "modules/settings/SettingsActions";
import {userSelector} from "modules/user/UserSelector";
import {APP_CONFIG, APPLICATION, LEFT_PANELS, MESSAGES_BADGE_LIMIT, PROJECT_COLORS} from 'configs/constants';
import Avatar from 'components/contacts/Avatar';
import containers from 'configs/localization';
import Settings from 'containers/settings';
import 'scss/pages/left-menu/LeftMenu';
import {
    AppLeftMenu,
    Icon,
    LeftIcons,
    LeftMenuContent,
    SettingsBlock,
    SettingsContent
} from "containers/left-menu/style";
import {AvatarSize} from "components/contacts/style";
import {BackArrow, Header} from "containers/right-panel/style";
import SettingsSvg from "../../../assets/components/svg/SettingsSvg";
import CallSvg from "../../../assets/components/svg/CallSvg";
import ChatSvg from "../../../assets/components/svg/ChatSvg";
import ContactSvg from "../../../assets/components/svg/ContactSvg";
import Log from "modules/messages/Log";
const ipcRenderer = (window as any).ipcRenderer;

interface ILeftMenuProps {
    changeLeftPanel: (panel: string) => void
    setSendingLocation: (location: string) => void
    setActiveSubPage: (activeSubPage: string) => void;
    leftPanel: string;
    user: any;
    applicationVersion: string;
    newMessagesCount: any;
    languages: any;
    activeSubPage: string;
    updates: any;
    app: any;
}

interface ILeftMenuState {
    showSettings: boolean,
    croppedNode: any,
    avatar: Blob,
}

class LeftMenu extends React.Component<ILeftMenuProps, ILeftMenuState> {

    constructor(props: any) {
        super(props);
        const {user} = this.props;
        this.state = {
            showSettings: false,
            croppedNode: null,
            avatar: user && user.get('avatar') || null,
        }
    }

    shouldComponentUpdate(nextProps: ILeftMenuProps, nextState: ILeftMenuState): boolean {

        if (this.props.newMessagesCount !== nextProps.newMessagesCount) {
            return true;
        }

        if (this.props.leftPanel !== nextProps.leftPanel) {
            return true;
        }

        if (this.props.activeSubPage !== nextProps.activeSubPage) {
            return true;
        }

        if (this.props.user !== nextProps.user) {
            return true;
        }

        if (!this.props.languages.equals(nextProps.languages)) {
            return true;
        }

        if (this.props.applicationVersion !== nextProps.applicationVersion) {
            return true;
        }
        if (this.props.updates.get('count') !== nextProps.updates.get('count')) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidMount(): void {
        ipcRenderer.send("onAppUpdate", {action: "CHECK"});
        ipcRenderer.send("onAppData", {action: "GET_VERSION"});
    }

    componentDidUpdate(prevProps: ILeftMenuProps, prevState: ILeftMenuState) {
        const {user, activeSubPage} = this.props;

        if (activeSubPage !== LEFT_PANELS.closed && prevState.showSettings !== true) {
            this.setState({
                showSettings: true
            });
        }

        if (!prevProps.user.equals(user)) {
            this.setState({avatar: user && user.get('avatar')});
        }
    }

    handleChangePanel = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        const nextLeftPanel: string = e.currentTarget.getAttribute('data-left-menu');
        const {changeLeftPanel, leftPanel} = this.props;
        const leftMenuList: string[] = [LEFT_PANELS.threads, LEFT_PANELS.contacts, LEFT_PANELS.keypad, LEFT_PANELS.settings, LEFT_PANELS.calls, LEFT_PANELS.payments];

        if (nextLeftPanel !== leftPanel && leftMenuList.includes(nextLeftPanel)) {
            changeLeftPanel(nextLeftPanel);
        }
    };


    handleSettingsToggle = () => {
        const {activeSubPage, setActiveSubPage} = this.props;
        const {showSettings} = this.state;

        if (activeSubPage && showSettings) {
            setActiveSubPage(LEFT_PANELS.closed);
        }

        this.setState({showSettings: !showSettings});
    };

    _handleSettingsToggle = throttle(this.handleSettingsToggle, 500);

    get popup(): JSX.Element {
        const {showSettings} = this.state;
        return (
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component='div'
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}
            >
                {
                    showSettings &&
                    <Settings
                        closeSettings={this._handleSettingsToggle}
                        handleSettingsToggle={this._handleSettingsToggle}
                        showSettings={showSettings}
                        subPageToActivate={this.props.activeSubPage}
                    />
                }
            </ReactCSSTransitionGroup>
        );
    }

    render() {
        const {leftPanel, newMessagesCount, user, applicationVersion, updates} = this.props;

        Log.i(applicationVersion);
        Log.i(APP_CONFIG);


        const {avatar} = this.state;
        const localization: any = containers().leftMenu;
        const threadImage: any = {
            url: '',
            file: avatar,
        };

        return (
            <AppLeftMenu
                onKeyDown={(event) => event.key === "Escape" && setSendingLocation(null)}
                className="app-left-menu">
                <LeftMenuContent>
                    <LeftIcons
                        data-left-menu={LEFT_PANELS.threads}
                        onClick={this.handleChangePanel}
                        color={PROJECT_COLORS.PRIMARY}
                    >
                        <ChatSvg
                            unreadMessagesCount={newMessagesCount > MESSAGES_BADGE_LIMIT ? `${MESSAGES_BADGE_LIMIT}+` : newMessagesCount}
                            active={[LEFT_PANELS.threads, LEFT_PANELS.create_group, LEFT_PANELS.search_messages].includes(leftPanel)}
                        />
                    </LeftIcons>
                    <LeftIcons
                        data-left-menu={LEFT_PANELS.contacts}
                        onClick={this.handleChangePanel}
                        color="#8174FF"
                    >
                        <ContactSvg active={[LEFT_PANELS.contacts, LEFT_PANELS.create_contact].includes(leftPanel)}/>
                    </LeftIcons>
                    <LeftIcons
                        data-left-menu={LEFT_PANELS.keypad}
                        onClick={this.handleChangePanel}
                        color="#88C64A"
                    >
                        <CallSvg active={leftPanel === LEFT_PANELS.keypad}
                                 color="#6C6F82"
                                 activeColor="#88C64A"
                                 hoverColor="#88C64A"/>
                    </LeftIcons>
                    {APPLICATION.WITHWALLET && < LeftIcons
                        data-left-menu={LEFT_PANELS.payments}
                        onClick={this.handleChangePanel}
                        color="#FF9800"
                        >
                        <Icon
                        content="'\E913'"
                        color="#FF9800"
                        active={leftPanel === LEFT_PANELS.payments}
                        title={localization.keypad}
                        />
                        </LeftIcons>}
                    <SettingsBlock className='settings'>
                        <SettingsContent
                            className="settings-content"
                            onClick={this._handleSettingsToggle}
                            data-update={applicationVersion > APP_CONFIG.CURRENT_VERSION ? '1' : null}
                            isAvatarSet={!!avatar}
                        >
                            <SettingsSvg/>
                        </SettingsContent>

                        {/*Popup block*/}
                        {this.popup}
                    </SettingsBlock>
                </LeftMenuContent>
            </AppLeftMenu>
        );
    }
}

const mapStateToProps: any = () => {
    const applicationVersion = applicationVersionSelector();
    const user = userSelector();
    const leftPanel = leftPanelSelector();
    const newMessagesCount = newMessagesCountSelector();
    const languages = languagesSelector();
    const updates = appUpdatesSelector();
    const activeSubPage = activeSubPageSelector();

    return (state, props) => {
        return {
            applicationVersion: applicationVersion(state, props),
            user: user(state, props),
            leftPanel: leftPanel(state, props),
            newMessagesCount: newMessagesCount(state, props),
            languages: languages(state, props),
            activeSubPage: activeSubPage(state, props),
            updates: updates(state,props),
        }
    }
};

const mapDispatchToProps: any = dispatch => ({
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    setSendingLocation: location => dispatch(setSendingLocation(location)),
    setActiveSubPage: activeSubPage => dispatch(setActiveSubPage(activeSubPage)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LeftMenu);

