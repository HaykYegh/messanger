"use strict";

import * as React from "react";
import {Map} from "immutable";

import EnterGroupDetails from "components/common/popups/conversation/EnterGroupDetails";
import InputSelectable from "components/common/popups/conversation/InputSelectable";
import {IGroupCreateParams, IGroupDetails} from "services/interfaces";
import Contact from "components/common/popups/conversation/Contact";
import {fetchContactsWithFilter} from "helpers/ContactsHelper";
import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";

import "scss/pages/Popup.scss";
import {validateNumber} from "helpers/DataHelper";
import {CONVERSATION_TYPES, ENTER_KEY_CODE} from "configs/constants";
import isMap = Map.isMap;
import phoneParse from "libphonenumber-js/es6/parse";
const metadata = require('libphonenumber-js/metadata.min.json');
import isValidNumber from "libphonenumber-js/es6/validate";
import Log from "modules/messages/Log";
import ConversationCreateGroup from "components/common/popups/conversation/CreateGroup";
import CreateCall from "components/common/popups/conference/CreateCall";
import CreateConversation from "components/common/popups/conversation/CreateConversation";

interface IGroupStartPopupProps {
    close: () => void;
    conferenceCreate?: (details: any) => void;
    containerState: {
        isOpened: boolean,
        isGroupPopupOpened: boolean,
    };
    groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, selectedContacts?: any, conferenceCall?: boolean) => void;
    conversationNavigate: (contact: IContact) => void;
    contactInfo?: any;
    user: any
}

interface IGroupStartPopupState {
    conversationType: number,
}

export default class GroupStartPopup extends React.Component<IGroupStartPopupProps, IGroupStartPopupState> {

    popupContent: React.RefObject<HTMLDivElement>;

    popupBlockContent: React.RefObject<HTMLDivElement>;


    constructor(props) {
        super(props);

        this.popupContent = React.createRef();
        this.popupBlockContent = React.createRef();

        this.state = {
            conversationType: CONVERSATION_TYPES.group,
        };
    }

    changeConversationType = (type) => {
        this.setState({conversationType: type})
    }

    dismissPopup = (event = null): void => {
        const {close, containerState} = this.props;
        if (!event) {
            close();
            return;
        }
        const popupBlock: any = this.popupBlockContent && this.popupBlockContent.current;
        if (containerState.isGroupPopupOpened && popupBlock && !popupBlock.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    render() {
        const {conversationType} = this.state
        const {user, contactInfo, close, containerState, groupConversationCreate, conversationNavigate, conferenceCreate} = this.props;

        return (
            <div
                className="popup"
                onClick={this.handleOutsideFromPopupClick}
            >
                <div
                    className="popup-block"
                    ref={this.popupBlockContent}
                >
                    <ConversationCreateGroup
                        user={user}
                        conversationType={conversationType}
                        changeConversationType={this.changeConversationType}
                        contactInfo={contactInfo}
                        close={close}
                        containerState={containerState}
                        groupConversationCreate={groupConversationCreate}
                        conversationNavigate={conversationNavigate}
                        rendering={true}
                        withoutConversation={true}
                        forGroup={true}
                    />
                </div>
            </div>
        );
    }
};
