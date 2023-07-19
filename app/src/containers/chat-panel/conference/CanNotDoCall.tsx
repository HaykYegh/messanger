import * as React from "react";
import {ConferenceOptionsOvelay} from "containers/chat-panel/conference/settingsPopupStyle";
import components from "configs/localization";
import {CanNotDoCallContent} from "containers/chat-panel/conference/CanNotDoCallStyle";

export interface ICanNotDoCallProps {
    toggleCanNotDoCall: (canNotDoCall: boolean) => void;
}

class CanNotDoCall extends React.Component<ICanNotDoCallProps> {

    render(): JSX.Element {
        const {toggleCanNotDoCall} = this.props
        const localization: any = components().conferencePanel;

        return (
            <ConferenceOptionsOvelay>
                <CanNotDoCallContent>
                    <h4>{localization.canNotCallTitle}</h4>
                    <p>{localization.canNotCallDesc}</p>
                    <button onClick={() => toggleCanNotDoCall(false)} >{localization.canNotCallOk}</button>
                </CanNotDoCallContent>
            </ConferenceOptionsOvelay>
        )
    }
}

export default CanNotDoCall;
