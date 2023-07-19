"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {NETWORK_JOIN_POPUP} from "configs/constants";
import PopUpMain from "components/common/PopUpMain";
import "scss/pages/left-panel/settings/Networks";
import components from "configs/localization";
import {
    ClearButton,
    InputNetworks, NetworkIdBlock,
    NetworksContent,
    NwtworksTextLink,
    ResetNotificationsButton, SettingsInfo,
    SettingsLabelTitle,
    SettingsListBlock, SettingsListContent, SettingsText,
    SettingsTitle
} from "containers/settings/style";

interface INetworksProps {
    handleNetworkJoin: () => void;
    handleSearchClear: () => void;
    handleNetworkJoinCancel: () => void;
    handleLeaveNetworkPopUpClose: () => void;
    handleNetworkAdd: () => void;
    handleNetworkChange: (event: any) => void;
    handleLeaveNetworkPopUpOpen: (networkId: number) => void;
    keyword: string;
    networkJoinPopUp: string;
    networkLeavePopUp: boolean;
    networks: any;
    searchedNetwork: any;
    handleNetworkLeave: () => void;
    handleNetworkErrorRemove: () => void;
    networkLeaveId: number;
    networkError: string;
}

interface INetworksState {

}

export default class Networks extends React.Component<INetworksProps, INetworksState> {

    handleKeyPress = (target) => {
        if (target.charCode == 13) {
            this.props.handleNetworkJoin();
        }
    };

    render() {
        const {
            handleNetworkJoin, handleNetworkChange, keyword, handleSearchClear, networkJoinPopUp, handleNetworkJoinCancel, handleNetworkAdd, networks, searchedNetwork,
            handleLeaveNetworkPopUpOpen, networkLeavePopUp, handleNetworkLeave, networkLeaveId, networkError, handleNetworkErrorRemove, handleLeaveNetworkPopUpClose
        } = this.props;

        const JoinedNetwork = networks && networks.size > 0 && !networks.first().isEmpty();
        const localization: any = components().networks;
        const searchClearButton: boolean = keyword && keyword !== "";
        const showErrorPopUp: boolean = !!networkError && networkError === NETWORK_JOIN_POPUP.NICKNAME;
        const networkId: string = networkLeaveId && networkLeaveId.toString();

        return (
            <div className="networks settings-scroll">

                {
                    JoinedNetwork ?
                        <div className="networks-content">

                            <SettingsLabelTitle margin="0">{localization.joinedNetwork}</SettingsLabelTitle>
                            {
                                networks && networks.size > 0 && networks.valueSeq().map(network => {
                                    return <div className="network-row" key={network.get("networkId")}>
                                        <SettingsListBlock>
                                        <SettingsTitle user_select="text" >{`${network.get("callName")}`}</SettingsTitle>
                                        </SettingsListBlock>
                                        <SettingsListBlock cursor="pointer" onClick={() => handleLeaveNetworkPopUpOpen(network.get("networkId"))}>
                                            <NwtworksTextLink font_size="14px">
                                                {localization.leaveThisNetwork}
                                            </NwtworksTextLink>
                                        </SettingsListBlock>
                                    </div>
                                })
                            }
                            <SettingsText>
                             {localization.leaveNetworkText2}
                            </SettingsText>
                        </div> :
                        <div>
                            <SettingsInfo>{localization.info}</SettingsInfo>
                            <SettingsLabelTitle>{localization.networksIdTitle}</SettingsLabelTitle>
                            <NetworksContent>
                                <NetworkIdBlock>
                                    <SettingsListContent>
                                        <InputNetworks maxLength={12} value={keyword} onKeyPress={this.handleKeyPress}
                                                       className={searchClearButton && "network-input-clear"} type="text"
                                                       placeholder={localization.placeholder} onChange={handleNetworkChange}
                                                       autoComplete="off"/>
                                        {searchClearButton &&
                                        <ClearButton onClick={handleSearchClear}/>}
                                    </SettingsListContent>
                                    <ResetNotificationsButton
                                        disabled= {keyword !== "" && keyword.length > 5}
                                        onClick={handleNetworkJoin}>{localization.join.toUpperCase()}
                                    </ResetNotificationsButton>
                                </NetworkIdBlock>

                            </NetworksContent>
                            <SettingsText>{localization.networksIdText}</SettingsText>
                            <NwtworksTextLink href="https://zangi.com/networks">{localization.link}</NwtworksTextLink>
                        </div>
                }
                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={230}>
                    {
                        networkJoinPopUp && networkJoinPopUp === NETWORK_JOIN_POPUP.NICKNAME && searchedNetwork && !searchedNetwork.isEmpty() &&
                        <PopUpMain
                            confirmButton={handleNetworkAdd}
                            confirmButtonText={localization.confirmAddButton}
                            cancelButton={handleNetworkJoinCancel}
                            cancelButtonText={localization.cancelAddButton}
                            titleText={localization.joinNetworkTitle}
                            infoText={`${localization.joinNetworkText1} "${searchedNetwork.get("nickname")}"`}
                            showPopUpLogo={true}
                        />
                    }
                    {
                        networkLeavePopUp && networkLeaveId && networkLeaveId !== null &&
                        <PopUpMain
                            confirmButton={handleNetworkLeave}
                            confirmButtonText={localization.confirmAddButton}
                            cancelButton={handleLeaveNetworkPopUpClose}
                            cancelButtonText={localization.cancelAddButton}
                            titleText={localization.leaveNetworkTitle}
                            infoText={`${localization.leaveNetworkText} "${networks.getIn([networkId, "nickname"])}". ${localization.leaveNetworkText1}`}
                            showPopUpLogo={true}
                        />
                    }
                    {
                        showErrorPopUp &&
                        <PopUpMain
                            confirmButton={handleNetworkErrorRemove}
                            confirmButtonText="Ok"
                            cancelButton={handleNetworkErrorRemove}
                            cancelButtonText=""
                            titleText={localization.incorrectNetworkId}
                            infoText={localization.incorrectNetworkIdText}
                            showPopUpLogo={true}
                        />
                    }
                </ReactCSSTransitionGroup>
            </div>
        );
    }

};
