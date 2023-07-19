"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    AppUpdate,
    Header,
    HeaderButton,
    NewUpdateBlock,
    ReleaseNote,
    ReleaseNoteDescription,
    ReleaseNoteTitle,
    SettingsListBlock,
    SettingsPageTitle,
    SettingsTitle,
    UpdateBlock,
    UpdateContent,
    UpdateLogo,
    UpdateProgress,
    UpdateProgressBlock,
    VersionBlock
} from "containers/settings/style";
import "scss/pages/left-panel/settings/CheckForUpdates.scss";
import {getAppReleaseInfo} from "requests/settingsRequest";
import {Loader, LoadingPage} from "../../pages/style";
import PopUpMain from "components/common/PopUpMain";
import conf from '../../configs/configurations';
import components from "configs/localization";
import {APPLICATION} from "configs/constants";
import Log from "modules/messages/Log";

const logo = require("assets/images/login_logo_blue.svg");
const back = require("assets/images/back_arrow.svg");
const ipcRenderer = (window as any).ipcRenderer;
const delay: number = 1000;

interface ICheckForUpdatesProps {
    selectedLanguage: string
}

interface ICheckForUpdatesState {
    isLoading: boolean;

    isUpdateAvailable: boolean;
    isDownloadStarted: boolean;
    isDownloadFinished: boolean;
    isDownloadFailed: boolean;

    downloadPercentage: number;
    message: string;
    isOffline: boolean;
    isWhatsNewPageShown: boolean;

    currentVersion: {
        version: string | null,
        appReleaseNoteDescription: string
    },

    newVersion: {
        version: string | null,
        appReleaseNoteDescription: string
    },

    error: {
        message: string;
        status: boolean;
    };
}

export default class CheckForUpdates extends React.Component<ICheckForUpdatesProps, ICheckForUpdatesState> {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,

            isUpdateAvailable: false,
            isDownloadStarted: false,
            isDownloadFinished: false,
            isDownloadFailed: false,

            isWhatsNewPageShown: false,
            isOffline: !window.navigator.onLine,
            message: "",
            downloadPercentage: 0,

            currentVersion: {
                version: null,
                appReleaseNoteDescription: ""
            },

            newVersion: {
                version: null,
                appReleaseNoteDescription: ""
            },

            error: {
                message: "",
                status: false,
            },
        }
    }

    componentDidMount(): void {
        this.startListeners();
        window.addEventListener('online', this.handleOnlineStatus);
        window.addEventListener('offline', this.handleOfflineStatus);
        ipcRenderer.send("onAppUpdate", {action: "CHECK"});
        ipcRenderer.send("onAppData", {action: "GET_VERSION"});
    }

    componentWillUnmount(): void {
        window.removeEventListener('online', (data) => Log.i(data));
        window.removeEventListener('offline', (data) => Log.i(data));

        this.removeListeners();
    }

    handleOnlineStatus = () => {
        ipcRenderer.send("onAppUpdate", {action: "CONTINUE_INTERRUPTED_DOWNLOAD"});
        this.setState({isOffline: false});
    };

    handleOfflineStatus = () => {
        this.setState({isOffline: true});
    };

    startListeners(): void {
        ipcRenderer.on("appUpdate", (event, reply) => {

            if (reply) {
                switch (reply.action) {
                    case "CHECKING_FOR_UPDATE": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }
                        break;
                    }
                    case "UPDATE_NOT_AVAILABLE": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }
                        const localization: any = components().checkForUpdates;

                        // Imitation to delay
                        setTimeout(() => {
                            this.setState({
                                message: localization.appIsUpToDate,
                                isLoading: false,
                                isUpdateAvailable: false
                            });
                        }, delay);

                        break;
                    }

                    case "UPDATE_AVAILABLE": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        const {selectedLanguage} = this.props;
                        let language: string = "";

                        if (selectedLanguage === "en-US") {
                            language = "en_US"
                        }

                        let appReleaseNoteDescription: string = "";

                        getAppReleaseInfo(reply.result.version, language).then(
                          ({data}: any) => {
                              if (data.status === "SUCCESS") {
                                  appReleaseNoteDescription = data.body.appReleaseInfo.description;
                              }
                          }
                        );

                        // Imitation to delay
                        setTimeout(() => {
                            this.setState({
                                message: "",
                                isLoading: false,
                                isUpdateAvailable: true,
                                newVersion: {
                                    version: reply.result.version,
                                    appReleaseNoteDescription
                                }
                            });
                        }, delay);
                        break;
                    }
                    case "DOWNLOADING": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        const newState: ICheckForUpdatesState = {...this.state};
                        newState.message = '';
                        newState.isLoading = false;
                        newState.isDownloadStarted = true;
                        newState.isUpdateAvailable = true;
                        this.setState(newState);

                        break;
                    }
                    case "DOWNLOAD_STARTING": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        const newState: ICheckForUpdatesState = {...this.state};
                        newState.message = '';
                        newState.isLoading = false;
                        newState.isDownloadStarted = true;
                        newState.isUpdateAvailable = true;
                        this.setState(newState);

                        break;
                    }
                    case "DOWNLOAD_PROGRESS": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        if (!this.state.isOffline) {
                            const newState: ICheckForUpdatesState = {...this.state};
                            newState.message = '';
                            newState.isLoading = false;
                            newState.isDownloadStarted = true;
                            newState.downloadPercentage = reply.result && reply.result.percent;
                            newState.error.message = '';
                            newState.error.status = false;
                            this.setState(newState);
                        } else {
                            ipcRenderer.send("onAppUpdate", {action: "DOWNLOAD", cancel: true})
                            this.setState({ downloadPercentage: 0});
                        }


                        break;
                    }
                    case "UPDATE_DOWNLOADED": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        const newState: ICheckForUpdatesState = {...this.state};
                        newState.message = '';
                        newState.isLoading = false;
                        newState.isDownloadStarted = false;
                        newState.isDownloadFinished = true;
                        newState.isUpdateAvailable = false;
                        this.setState(newState);

                        break;
                    }
                    case "ERROR": {
                        this.setState({
                            message: "",
                            isLoading: false,
                        });
                        return this.handleErrorMessage(reply.error, reply.result && reply.result.code);
                    }
                    default:
                }
            }
        });

        ipcRenderer.on("appData", (event, reply) => {
            if (reply) {
                switch (reply.action) {
                    case "VERSION": {
                        if (reply.error) {
                            return this.handleErrorMessage(reply.error, reply.result);
                        }

                        this.setState({
                            currentVersion: {
                                version: reply.result,
                                appReleaseNoteDescription: ""
                            }
                        });
                        break;
                    }
                    default:
                }
            }
        });
    }

    removeListeners(): void {
        ipcRenderer.removeAllListeners("appUpdate");
        ipcRenderer.removeAllListeners("appData");
    }

    handleErrorMessage = (status = true, message = "UNKNOWN_ERROR") => {
        this.setState({
            error: {
                status,
                message,
            },
            isLoading: false
        })
    };

    handleUpdate = (e: React.MouseEvent<HTMLElement>) => {
        ipcRenderer.send("onAppUpdate", {action: "UPDATE"});
    };

    handleUpdateRequestReload = () => {
        const {isOffline} = this.state;
        this.setState({
            error: {
                status: false,
                message: '',
            },
        });
        if (!isOffline) {
            ipcRenderer.send("onAppUpdate", {action: "CHECK_AND_RELOAD"});
        }
    };

    handleDownload = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        const newState: ICheckForUpdatesState = {...this.state};
        newState.message = '';
        newState.isLoading = false;
        newState.isDownloadStarted = true;
        this.setState(newState);

        ipcRenderer.send("onAppUpdate", {action: "DOWNLOAD"})
    };

    handleWhatsNewOpen = (): void => {
        const {currentVersion: {version, appReleaseNoteDescription}} = this.state;
        const {selectedLanguage} = this.props;
        const newState: ICheckForUpdatesState = {...this.state};
        let language: string = "";

        if (selectedLanguage === "en-US") {
            language = "en_US"
        }

        this.setState({isWhatsNewPageShown: true});

        if (!appReleaseNoteDescription) {
            getAppReleaseInfo(version, language).then(
              ({data}: any) => {
                  if (data.status === "SUCCESS") {
                      newState.currentVersion.appReleaseNoteDescription = data.body.appReleaseInfo.description;
                      newState.isWhatsNewPageShown = true;
                      this.setState(newState);
                  }
              }
            );
        }
    };

    handleWhatsNewClose = (): void => {
        this.setState({isWhatsNewPageShown: false});
    };

    render() {
        const {isUpdateAvailable, isLoading, downloadPercentage, isDownloadFinished, isDownloadStarted, message, error, isOffline, isWhatsNewPageShown, currentVersion, newVersion} = this.state;
        const localization: any = components().checkForUpdates;

        return (
          <AppUpdate>
              {isWhatsNewPageShown &&
              <>
                  <Header justify_content={"space-between"}>
                      <HeaderButton
                        justify_content="flex-start"
                        onClick={this.handleWhatsNewClose}>
                          <img src={back} alt={"back"}/>
                          {localization.back}
                      </HeaderButton>
                      <SettingsPageTitle
                        width="150px"
                        justify_content="center">
                          {localization.title}
                      </SettingsPageTitle>
                      <HeaderButton justify_content="flex-end"/>
                  </Header>
                  {currentVersion.appReleaseNoteDescription &&
                  <ReleaseNote top={"20px"}>
                      <ReleaseNoteTitle>
                          {`${localization.whatsNew} ${currentVersion.version}`}
                      </ReleaseNoteTitle>
                      <ReleaseNoteDescription>
                          {currentVersion.appReleaseNoteDescription}
                      </ReleaseNoteDescription>
                  </ReleaseNote>}
              </>
              }

              {!isWhatsNewPageShown &&
              <UpdateContent className="update-content">
                  <UpdateBlock>
                      <div className="logo-block">
                          <UpdateLogo>
                              <img src={logo} alt={"logo"}/>
                          </UpdateLogo>
                          <VersionBlock>
                              <h2>{conf.app.name} Desktop</h2>
                              <p>
                                  {localization.versionText} {currentVersion.version}
                                  {APPLICATION.TEST && <span>{APPLICATION.VERSION_T}</span>}
                              </p>
                          </VersionBlock>
                      </div>
                      <NewUpdateBlock onClick={this.handleWhatsNewOpen}>
                          <p>{localization.title}</p>
                          <span/>
                      </NewUpdateBlock>
                  </UpdateBlock>
                  {
                      isLoading && message === "" &&
                      <SettingsListBlock justify_content="flex-start">
                          <LoadingPage
                            width="30px"
                            height="30px"
                            backgroundColor="#FFFFFF"
                          >
                              <Loader
                                backgroundColor="#1FA6FA"
                                width="15px"
                                height="15px"
                                background="#FFFFFF"
                              />
                          </LoadingPage>
                          <SettingsTitle color="#919193">{localization.check}</SettingsTitle>
                      </SettingsListBlock>
                  }

                  {
                      message !== "" &&
                      <SettingsListBlock justify_content="flex-start">
                          <SettingsTitle>{message}</SettingsTitle>
                      </SettingsListBlock>
                  }

                  {!error.status && isUpdateAvailable && !isLoading && !isDownloadStarted &&
                  <SettingsListBlock>
                      <SettingsTitle>{localization.newVersionText}</SettingsTitle>
                  </SettingsListBlock>
                  }

                  {!error.status && isUpdateAvailable && !isLoading && !isDownloadStarted && !isDownloadFinished &&
                  <SettingsListBlock cursor="pointer">
                      <SettingsTitle
                        color="#17ABF6"
                        onClick={this.handleDownload}
                      >{localization.download}</SettingsTitle>
                  </SettingsListBlock>
                  }

                  {!error.status && isUpdateAvailable && !isLoading && isDownloadStarted && !isDownloadFinished && !isOffline &&
                  <>
                      {
                          downloadPercentage < 100 &&
                          <UpdateProgress>
                              <UpdateProgressBlock>
                                  <SettingsTitle>{localization.downloadNewVersion}</SettingsTitle>
                                  <SettingsTitle>
                                      {downloadPercentage.toFixed(0)}%
                                  </SettingsTitle>
                              </UpdateProgressBlock>
                              <div className="progress-bar">
                                  <div className="loading" style={{width: downloadPercentage + "%"}}/>
                              </div>
                          </UpdateProgress>
                      }
                      {
                          downloadPercentage >= 100 &&

                          <SettingsListBlock justify_content="flex-start">
                              <LoadingPage
                                width="30px"
                                height="30px"
                                backgroundColor="#FFFFFF"
                              >
                                  <Loader
                                    backgroundColor="#1FA6FA"
                                    width="15px"
                                    height="15px"
                                    background="#FFFFFF"
                                  />
                              </LoadingPage>
                              <SettingsTitle color="#919193">{localization.processing}</SettingsTitle>
                          </SettingsListBlock>
                      }
                  </>

                  }
                  {!error.status && isUpdateAvailable && !isLoading && isDownloadStarted && !isDownloadFinished && isOffline &&
                  <UpdateProgress>
                      <UpdateProgressBlock>
                          <SettingsTitle>{localization.downloadFailed}</SettingsTitle>
                          <div className="progress-bar">
                              <div className="loading loading-errored" style={{width: downloadPercentage + "%"}}/>
                          </div>
                          <div>
                              <SettingsTitle>
                                  {downloadPercentage.toFixed(0)}%
                              </SettingsTitle>
                          </div>
                      </UpdateProgressBlock>
                  </UpdateProgress>
                  }

                  {!error.status && !isUpdateAvailable && !isLoading && !isDownloadStarted && isDownloadFinished &&
                  <SettingsListBlock cursor="pointer" onClick={this.handleUpdate}>
                      <SettingsTitle color="#17ABF6">
                          {localization.installAndRelaunch}
                      </SettingsTitle>
                  </SettingsListBlock>
                  }

                  {(isUpdateAvailable || isDownloadFinished) && !isLoading && newVersion.appReleaseNoteDescription &&
                  <ReleaseNote top={"188px"}>
                      <ReleaseNoteTitle>
                          {`${localization.whatsNew} ${newVersion.version}`}
                      </ReleaseNoteTitle>
                      <ReleaseNoteDescription>
                          {newVersion.appReleaseNoteDescription}
                      </ReleaseNoteDescription>
                  </ReleaseNote>
                  }

              </UpdateContent>}

              {/*<ReactCSSTransitionGroup*/}
              {/*  transitionName={{*/}
              {/*      enter: 'open',*/}
              {/*      leave: 'close',*/}
              {/*  }}*/}
              {/*  component="div"*/}
              {/*  transitionEnter={true}*/}
              {/*  transitionLeave={true}*/}
              {/*  transitionEnterTimeout={300}*/}
              {/*  transitionLeaveTimeout={230}>*/}
              {/*    {*/}
              {/*        error.status &&*/}
              {/*        <PopUpMain*/}
              {/*          showPopUpLogo={true}*/}
              {/*          confirmButton={this.handleUpdateRequestReload}*/}
              {/*          confirmButtonText={localization.ok}*/}
              {/*          cancelButton={this.handleUpdateRequestReload}*/}
              {/*          titleText={localization.errorMessageTitle}*/}
              {/*          infoText={(error.message === "UNKNOWN_ERROR" || !error.message) ? localization.errorMessage : error.message}*/}
              {/*        />*/}
              {/*    }*/}
              {/*</ReactCSSTransitionGroup>*/}

          </AppUpdate>
        );
    }
};
