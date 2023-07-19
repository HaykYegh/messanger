"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import {MESSAGE_TYPES} from "configs/constants";
import components from "configs/localization";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";
import {
    CallBlock,
    CallIcon,
    CallStatus,
    CallStatusDuration,
    CallStatusText
} from "components/messages/CallMessage/style";

interface ICallMessageProps {
    inviteToCall?: (isVideo: boolean, selectedThread: IContact) => void;
    selectedContact?: IContact;
    otherVideo: boolean;
    duration?: string;
    myVideo: boolean;
    time: string;
    text: string;
    own: boolean;
    type: string;
    language: string;
}

export default class CallMessage extends React.Component<ICallMessageProps> {


    shouldComponentUpdate(nextProps: ICallMessageProps) {
        const {text, time, selectedContact, duration, otherVideo, myVideo, own, language} = this.props;

        if (text !== nextProps.text) {
            return true;
        }

        if (time !== nextProps.time) {
            return true;
        }

        if (duration !== nextProps.duration) {
            return true;
        }

        if (otherVideo !== nextProps.otherVideo) {
            return true;
        }

        if (myVideo !== nextProps.myVideo) {
            return true;
        }

        if (own !== nextProps.own) {
            return true;
        }

        if (language !== nextProps.language) {
            return true;
        }

        return !selectedContact.equals(nextProps.selectedContact);

    }

    render() {
        const {text, time, selectedContact, inviteToCall, duration,type, otherVideo, myVideo, own, language} = this.props;
        const localization: any = components().callMessage;

        const statusClassNames: string = classNames({
            "call-status-text-outgoing": MESSAGE_TYPES.outgoing_call,
            "call-status-text-incoming": MESSAGE_TYPES.incoming_call,
            "call-status-text-missed": MESSAGE_TYPES.missed_call
        });

        const inviteToAudioCall: any = () => inviteToCall(false, selectedContact);
        const inviteToVideoCall: any = () => inviteToCall(true, selectedContact);

        return (
            <CallBlock language={language}>
                <CallIcon
                    statusCall={type === MESSAGE_TYPES.missed_call}
                    className={selectedContact && selectedContact.get("blocked") ? "disable call-back-icon" : "call-back-icon"}
                    onClick={inviteToAudioCall}/>
                <CallStatus>
                    <CallStatusText statusCall={type === MESSAGE_TYPES.missed_call}>{text}</CallStatusText>
                    <CallStatusDuration statusCall={type === MESSAGE_TYPES.missed_call}>{duration}</CallStatusDuration>
                </CallStatus>
            </CallBlock>
        );
    }
};
