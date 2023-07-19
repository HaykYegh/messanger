"use strict";

import * as React from "react";

import {IContact} from "modules/contacts/ContactsReducer";
import {MESSAGE_TYPES} from "configs/constants";
import {
    CallBlock,
    CallIcon,
    CallStatus,
    CallStatusDuration,
    CallStatusText
} from "./style";
import {callMessageBubbleText} from "helpers/MessageHelper";
import CallSvg from "../../../../../../assets/components/svg/CallSvg";

interface ICallMessageProps {
    inviteToCall?: (isVideo: boolean, selectedThread: IContact) => void;
    selectedContact?: IContact;
    message?: any;
    language?: any;
}

export default function CallMessage(props: ICallMessageProps): JSX.Element {
    const {selectedContact, inviteToCall, message, language } = props;

    const duration: any = message.get('info');
    const type: any = message.get('type');

    const inviteToAudioCall: any = () => inviteToCall(false, selectedContact);
    const isMissedCall: boolean = type === MESSAGE_TYPES.missed_call;
    const text: string = callMessageBubbleText(type);

    return (
        <CallBlock language={language}>
            <CallSvg
                containerWidth="32"
                containerHeight="32"
                color={isMissedCall ? "#FF1E1C" : "#17ABF6"}
                hoverColor={isMissedCall ? "#FF1E1C" : "#17ABF6"}
                activeColor={isMissedCall ? "#FF1E1C" : "#17ABF6"}
            />
            <CallStatus>
                <CallStatusText statusCall={isMissedCall}>{text}</CallStatusText>
                <CallStatusDuration statusCall={isMissedCall}>{duration}</CallStatusDuration>
            </CallStatus>
        </CallBlock>
    );
};
