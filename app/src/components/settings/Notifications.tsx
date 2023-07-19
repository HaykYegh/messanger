"use strict";

import * as React from "react";

import components from "configs/localization";
import {SETTINGS_PANEL} from "configs/constants";
import "scss/pages/left-panel/settings/Notifications";
import {
    ResetNotificationsButton, SepLine, SettingsLabelTitle,
    SettingsListBlock, SettingsListBlockContent,
    SettingsText,
    SettingsTitle,
    SwitchButton
} from "containers/settings/style";

interface INotificationsProps {
    handleChange: (setting: {path: string, name: string, isChecked: boolean}) => void;
    resetNotification: (settingsType: string) => void
    notification: any;
}

interface INotificationsState {

}

export default class Notifications extends React.Component<INotificationsProps, INotificationsState> {

    render(): JSX.Element {
        const {handleChange, notification, resetNotification} = this.props;
        const localization: any = components().notification;

        return (
            <div>
                <SettingsListBlock cursor="pointer"
                                   onClick={() => handleChange({path: "notification", name: "showPreview", isChecked: !notification.get("showPreview")})}>
                    <SettingsTitle cursor="pointer">{localization.showPreviews}</SettingsTitle>
                    <SwitchButton>
                        <input
                            type="checkbox"
                            name="showPreview"
                            data-path="notification"
                            checked={notification.get("showPreview")}
                        />
                        <span className="slider"/>
                    </SwitchButton>
                </SettingsListBlock>
                <SettingsText>{localization.pushNotInfo}</SettingsText>


                <SettingsLabelTitle>{localization.messageNotification}</SettingsLabelTitle>
                <SettingsListBlockContent>
                    <SettingsListBlock cursor="pointer"
                                       onClick={() => handleChange({path: "notification", name: "sound", isChecked: !notification.get("sound")})}>
                        <SettingsTitle cursor="pointer">{localization.sound}</SettingsTitle>
                        <SwitchButton>
                            <input
                                type="checkbox"
                                name="sound"
                                data-path="notification"
                                checked={notification.get("sound")}
                            />
                            <span className="slider"/>
                        </SwitchButton>
                        <SepLine />
                    </SettingsListBlock>
                    <SettingsListBlock cursor="pointer"
                                       onClick={() => handleChange({path: "notification", name: "messagePreview", isChecked: !notification.get("messagePreview")})}>
                        <SettingsTitle cursor="pointer">{localization.messagePreview}</SettingsTitle>
                        <SwitchButton >
                            <input
                                type="checkbox"
                                name="messagePreview"
                                data-path="notification"
                                checked={notification.get("messagePreview")}
                            />
                            <span className="slider"/>
                        </SwitchButton>
                    </SettingsListBlock>
                </SettingsListBlockContent>
                <SettingsLabelTitle>{localization.groupNotification}</SettingsLabelTitle>
                <SettingsListBlockContent>
                    <SettingsListBlock cursor="pointer"
                                       onClick={() => handleChange({path: "notification", name: "groupSound", isChecked: !notification.get("groupSound")})}>
                        <SettingsTitle cursor="pointer">{localization.groupSound}</SettingsTitle>
                        <SwitchButton>
                            <input
                                type="checkbox"
                                name="groupSound"
                                data-path="notification"
                                checked={notification.get("groupSound")}
                            />
                            <span className="slider"/>
                        </SwitchButton>
                        <SepLine />
                    </SettingsListBlock>
                    <SettingsListBlock cursor="pointer"
                                       onClick={() => handleChange({path: "notification", name: "groupMessagePreview", isChecked: !notification.get("groupMessagePreview")})}>
                        <SettingsTitle cursor="pointer">{localization.groupPrevTitle}</SettingsTitle>
                        <SwitchButton>
                            <input
                                type="checkbox"
                                data-path="notification"
                                name="groupMessagePreview"
                                checked={notification.get("groupMessagePreview")}
                            />
                            <span className="slider"/>
                        </SwitchButton>
                    </SettingsListBlock>
                </SettingsListBlockContent>
                <SettingsLabelTitle>{localization.callNotification}</SettingsLabelTitle>
                <SettingsListBlock cursor="pointer"
                                   onClick={() => handleChange({path: "notification", name: "callSound", isChecked: !notification.get("callSound")})}>
                    <SettingsTitle cursor="pointer">{localization.sound}</SettingsTitle>
                    <SwitchButton>
                        <input
                            type="checkbox"
                            name="callSound"
                            data-path="notification"
                            checked={notification.get("callSound")}
                        />
                        <span className="slider"/>
                    </SwitchButton>
                </SettingsListBlock>
                <SettingsLabelTitle/>
                <SettingsListBlock onClick={() => resetNotification(SETTINGS_PANEL.notification)} cursor="pointer" >
                    <SettingsTitle cursor="pointer">{localization.resetNotification}</SettingsTitle>
                </SettingsListBlock>
            </div>
        );
    }

};
