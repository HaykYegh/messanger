import * as React from "react";
import {connect, Store} from "react-redux";
import selector from "services/selector";
import components from "configs/localization";
import {ConferenceAPContent, ConferenceOptionsOvelay} from "containers/chat-panel/conference/settingsPopupStyle";

export interface IAnotherCallProps {
    toggleAnotherCallPopup: (anotherCall: boolean) => void;
}

interface IAnotherCallState {

}

const selectorVariables: any = {

};

class AnotherCallPopup extends React.Component<IAnotherCallProps, IAnotherCallState> {
    constructor(props: IAnotherCallProps) {
        super(props);

        this.state = {

        }
    }


    render(): JSX.Element {
        const localization: any = components().contactInfo;

        return (
            <ConferenceOptionsOvelay>
                <ConferenceAPContent>
                    <h4>{localization.productName}</h4>
                    <p>You are already on another call.</p>
                    <button onClick={() => {
                        this.props.toggleAnotherCallPopup(false);
                    }} >Ok</button>
                </ConferenceAPContent>
            </ConferenceOptionsOvelay>
        )
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(AnotherCallPopup);
