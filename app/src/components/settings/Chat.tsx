"use strict";

import * as React from "react";

import components from "configs/localization";
import "scss/pages/left-panel/settings/ChatSettings";
import {SettingsListBlock, SettingsText, SettingsTitle, SwitchButton} from "containers/settings/style";

interface IChatProps {
    handleChange: (setting: {path: string, name: string, isChecked: boolean}) => void;
    chatSettings: any;
}

interface IChatState {

}

export default class Chat extends React.Component<IChatProps, IChatState> {

    render() {

        const {handleChange, chatSettings} = this.props;
        const localization: any = components().chatSettings;

        return (
            <>
                <SettingsListBlock cursor="pointer"
                    onClick={() => handleChange({path: "chat", name: "useEnterToSend", isChecked: !chatSettings.get("useEnterToSend")})}>
                    <SettingsTitle cursor="pointer">{localization.sendWithEnter}</SettingsTitle>
                    <SwitchButton>
                        <input data-path="chat" name="useEnterToSend" type="checkbox"
                               checked={chatSettings.get("useEnterToSend")}/>
                        <span className="slider"/>
                    </SwitchButton>
                </SettingsListBlock>
                <SettingsText>{localization.description}</SettingsText>
            </>
        );
    }

};
