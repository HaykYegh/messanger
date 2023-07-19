'use strict';

import * as React from 'react';
import {connect} from 'react-redux';
import isEqual from 'lodash/isEqual';
import throttle from "lodash/throttle";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    applicationVersionSelector, applicationWalletUrlSelector,
    leftPanelSelector,
    newMessagesCountSelector
} from "modules/application/ApplicationSelector";
import {activeSubPageSelector, languagesSelector, appUpdatesSelector} from "modules/settings/SettingsSelector";
import {
    attemptChangeLeftPanel,
    emptyWalletUrl,
    getWalletUrl,
    hideCreateNewContactPopUp
} from 'modules/application/ApplicationActions';
import {setActiveSubPage} from "modules/settings/SettingsActions";
import {userSelector} from "modules/user/UserSelector";
import {APP_CONFIG, LEFT_PANELS, MESSAGES_BADGE_LIMIT} from 'configs/constants';
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
import {Loader, LoadingPage, TextLoading} from "./style";
import localization from "configs/localization";
import components from "configs/localization";
import Log from "modules/messages/Log";
const ipcRenderer = (window as any).ipcRenderer;

interface IWebViewContentProps {
    walletUrl: string;
    getWalletUrl: () => void;
    emptyWalletUrl: () => void;
    leftPanel: string;
}

interface IWebViewContentState {
    loading: boolean;
}

class WebViewContent extends React.Component<IWebViewContentProps, IWebViewContentState> {

    constructor(props: any) {
        super(props);
        this.state = {
            loading: false,
        }
    }

    componentDidMount () {
        this.props.emptyWalletUrl()
        this.props.getWalletUrl()
    }

    componentDidUpdate(prevProps: Readonly<IWebViewContentProps>, prevState: Readonly<IWebViewContentState>, snapshot?: any) {
        if(this.props.walletUrl && prevProps.walletUrl !== this.props.walletUrl) {
            const webview = document.querySelector('webview')

            if (webview) {
                webview.addEventListener('did-start-loading', this.loadstart)
                webview.addEventListener('did-stop-loading', this.loadstop)
            }
        }
    }

    componentWillUnmount() {
        if(this.props.leftPanel !== LEFT_PANELS.payments) {
            this.props.emptyWalletUrl()
        }
    }

    loadstart = () => {
        this.setState({loading: true})
    }

    loadstop = () => {
        this.setState({loading: false})
    }

    render() {
        const {walletUrl} = this.props;
        const {loading} = this.state
        const localization = components().app;

        return (
            <div style={{
                width: "100%",
                height: "100%",
            }} >
                {(loading || !walletUrl) && <LoadingPage>
                    <Loader/>
                    <TextLoading>{localization.loadingText}</TextLoading>
                </LoadingPage>}
                {walletUrl ? <webview
                    id="webview"
                    src={walletUrl}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "inline-flex",
                    }}>
                </webview> : <div />}
            </div>
        );
    }
}

const mapStateToProps: any = () => {
    const applicationVersion = applicationVersionSelector();
    const walletUrl = applicationWalletUrlSelector();
    const user = userSelector();
    const leftPanel = leftPanelSelector();
    const newMessagesCount = newMessagesCountSelector();
    const languages = languagesSelector();
    const updates = appUpdatesSelector();
    const activeSubPage = activeSubPageSelector();

    return (state, props) => {
        return {
            applicationVersion: applicationVersion(state, props),
            walletUrl: walletUrl(state, props),
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
    getWalletUrl: () => dispatch(getWalletUrl()),
    emptyWalletUrl: () => dispatch(emptyWalletUrl()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WebViewContent);

