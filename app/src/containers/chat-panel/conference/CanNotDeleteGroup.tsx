import * as React from "react";
import {ConferenceOptionsOvelay} from "containers/chat-panel/conference/settingsPopupStyle";
import components from "configs/localization";
import {CanNotDoCallContent} from "containers/chat-panel/conference/CanNotDoCallStyle";

export interface ICanNotDoCallProps {
    toggleCanNotDeleteGroup: (canNotDoCall: boolean) => void;
}

class CanNotDeleteGroup extends React.Component<ICanNotDoCallProps> {

    render(): JSX.Element {
        const {toggleCanNotDeleteGroup} = this.props
        const localization: any = components().conferencePanel;

        return (
            <ConferenceOptionsOvelay>
                <CanNotDoCallContent>
                    <h4>{localization.canNotDeleteGroupTitle}</h4>
                    <p>{localization.canNotDeleteGroupDesc}</p>
                    <button onClick={() => toggleCanNotDeleteGroup(false)} >{localization.canNotCallOk}</button>
                </CanNotDoCallContent>
            </ConferenceOptionsOvelay>
        )
    }
}

export default CanNotDeleteGroup;
