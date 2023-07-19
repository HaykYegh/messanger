"use strict";

import * as React from "react";

import InputSelectable from "components/common/popups/conference/InputSelectable";
import {IGroupCreateParams, IGroupDetails} from "services/interfaces";
import Contact from "components/common/popups/conference/Contact";
import {CONFERENCE_CALL_MEMBERS_COUNT} from "configs/constants";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import "scss/pages/Popup.scss";
import Log from "modules/messages/Log";
import CreateCall from "components/common/popups/conference/CreateCall";

interface IIndexProps {
    inviteToCall: (isVideo: boolean, contact: IContact, outCall: boolean) => void;
    conferenceCreate: (details: any) => void;
    singleCallCreate: (contact: IContact) => void;
    close: () => void;
    containerState: {
        isOpened: boolean;
    };
    leftPanel?: string;
    user?: any;
}

export default class ConferenceCallPopup extends React.Component<IIndexProps, null> {
    newCallPopup: any = React.createRef();
    newCallPopupBlock: any = React.createRef();

    dismissPopup = (event = null): void => {
        const {close, containerState} = this.props;
        if (!event) {
            close();
            return;
        }
        if (containerState.isOpened && this.newCallPopupBlock.current && !this.newCallPopupBlock.current.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    render() {
        const {conferenceCreate, close, containerState, leftPanel, user} = this.props



        return (
            <div
                id="new-call-start-popup"
                className="popup"
                onClick={this.handleOutsideFromPopupClick}
                ref={this.newCallPopup}
            >
                <div
                    id="new-call-start-popup-block"
                    className="popup-block"
                    ref={this.newCallPopupBlock}
                >
                    <CreateCall
                        leftPanel={leftPanel}
                        conferenceCreate={conferenceCreate}
                        close={close}
                        containerState={containerState}
                        user={user}
                    />
                </div>
            </div>
        );
    }
};
