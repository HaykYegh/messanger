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
import {AUTOFOCUS_TYPES, CONVERSATION_TYPES, ENTER_KEY_CODE} from "configs/constants";
import isMap = Map.isMap;
import phoneParse from "libphonenumber-js/es6/parse";
const metadata = require('libphonenumber-js/metadata.min.json');
import isValidNumber from "libphonenumber-js/es6/validate";
import Log from "modules/messages/Log";
import ConversationCreateGroup from "components/common/popups/conversation/CreateGroup";
import CreateCall from "components/common/popups/conference/CreateCall";
import CreateConversation from "components/common/popups/conversation/CreateConversation";

interface IConversationStartPopupProps {
    close: () => void;
    conferenceCreate?: (details: any) => void;
    containerState: {
        isOpened: boolean
    };
    groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, selectedContacts?: any, conferenceCall?: boolean) => void;
    conversationNavigate: (contact: IContact) => void;
    contactInfo?: any;
    user: any
}

interface IConversationStartPopupState {
   conversationType: number,
    rendering: boolean
}

export default class ConversationStartPopup extends React.Component<IConversationStartPopupProps, IConversationStartPopupState> {

    popupContent: React.RefObject<HTMLDivElement>;

    popupBlockContent: React.RefObject<HTMLDivElement>;


    constructor(props) {
        super(props);

        this.popupContent = React.createRef();
        this.popupBlockContent = React.createRef();

        this.state = {
            conversationType: CONVERSATION_TYPES.conversation,
            rendering: false
        };
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({rendering: true})
        }, 250)
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
        if (containerState.isOpened && popupBlock && !popupBlock.contains(event.target)) {
            close();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    render() {
        const {conversationType, rendering} = this.state
        const {user, contactInfo, close, containerState, groupConversationCreate, conversationNavigate, conferenceCreate} = this.props;

        return (
            <div
                className="popup"
                onClick={this.handleOutsideFromPopupClick}
            >
                <div
                    className="popup-block"
                    style={{
                        overflow: rendering ? "hidden" : "unset"
                    }}
                    ref={this.popupBlockContent}
                >

                     <CreateConversation
                        user={user}
                        changeConversationType={this.changeConversationType}
                        conversationType={conversationType}
                        contactInfo={contactInfo}
                        close={close}
                        containerState={containerState}
                        groupConversationCreate={groupConversationCreate}
                        conversationNavigate={conversationNavigate}
                        autoFocus={AUTOFOCUS_TYPES.true}
                    />

                    <CreateCall
                        conferenceCreate={conferenceCreate}
                        conversationType={conversationType}
                        changeConversationType={this.changeConversationType}
                        close={close}
                        containerState={containerState}
                        rendering={rendering}
                        autoFocus={AUTOFOCUS_TYPES.false}
                        user={user}
                    />

                     <ConversationCreateGroup
                        user={user}
                        conversationType={conversationType}
                        changeConversationType={this.changeConversationType}
                        contactInfo={contactInfo}
                        close={close}
                        containerState={containerState}
                        groupConversationCreate={groupConversationCreate}
                        conversationNavigate={conversationNavigate}
                        rendering={rendering}
                        autoFocus={AUTOFOCUS_TYPES.false}
                        forGroup={true}
                    />
                    </div>
                </div>
        );
    }
};
