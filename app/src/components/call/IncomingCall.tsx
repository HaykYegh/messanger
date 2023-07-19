"use strict";

import * as React from "react";

import {IContact} from "modules/contacts/ContactsReducer";
import components from "configs/localization";
import "scss/pages/chat-panel/CallPanel";
import {getName} from "helpers/DataHelper";
import Log from "modules/messages/Log";

interface IIncomingCallState {
    callIgnored: boolean;
    loaded: boolean;
}

interface IIncomingCallProps {
    acceptCall: (myVideo: boolean) => void;
    ignoreCall: () => void;
    declineCall: () => void;
    callerPhone: string;
    callSound: boolean;
    caller: IContact;
    avatar: any;
    showInThread: any;
    isVideo: boolean;
    lastCall?: any;
}

export default class IncomingCall extends React.Component<IIncomingCallProps, IIncomingCallState> {

    constructor(props: any) {
        super(props);

        this.state = {
            callIgnored: false,
            loaded: false
        }
    }

    componentDidMount(): void {
        const {declineCall} = this.props;
        if ((window as any).ipcRenderer) {
            const ipcRenderer = (window as any).ipcRenderer;
            ipcRenderer.once('doCallAction', this.handleCallAction)
        }
        window.addEventListener("beforeunload", declineCall, false);
    }

    componentDidUpdate(prevProps: IIncomingCallProps, prevState: IIncomingCallState): void {
        const {loaded} = this.state;
        const {caller, callerPhone, avatar, showInThread} = this.props;

        if ((caller && !loaded) || (caller && !caller.equals(prevProps.caller)) || (callerPhone && !loaded)) {
            const reader = new FileReader();
            this.setState({loaded: true});
            const callerInfo: any = {};

            if (caller) {
                callerInfo.avatarCharacter = caller.get('avatarCharacter');
                callerInfo.name = getName(caller);
                callerInfo.color = caller.getIn(['color', 'numberColor']);
                callerInfo.phone = caller.get('phone');
            }

            if (avatar && avatar.file) {
                reader.readAsDataURL(avatar.file);
                reader.onloadend = () => {
                    this.handleSendCallRequest(callerInfo, callerPhone, reader.result);
                }
            } else {
                this.handleSendCallRequest(callerInfo, callerPhone, "");
            }

            if (!(avatar && avatar.file)) {
                this.handleSendCallRequest(callerInfo, callerPhone, "");
            }
        }

        if (showInThread && !showInThread.get('ignored') && showInThread.get('ignored') !== prevProps.showInThread.get('ignored')) {
            const {acceptCall} = this.props;
            Log.i('accept call', '######################');
            acceptCall(showInThread.get('isVideo'));
        }
    }

    componentWillUnmount() {
        const {declineCall} = this.props;
        const ipcRenderer: any = (window as any).ipcRenderer;
        if (ipcRenderer) {
            ipcRenderer.send('closeCallPopup');
            ipcRenderer.removeListener('doCallAction', this.handleCallAction);
        }
        window.removeEventListener("beforeunload", declineCall, false);
    }

    handleCallAction = (event, action) => {
        Log.i("conference -> handleCallAction -> action = ", action)
        const {acceptCall, declineCall, ignoreCall} = this.props;
        switch (action) {
            case "take":
                acceptCall(false);
                break;
            case "decline":
                declineCall();
                break;
            case "takeVideo":
                acceptCall(true);
                break;
            case "ignore":
                this.setState({callIgnored: true});
                ignoreCall();
                break;
        }
    };


    handleSendCallRequest = (callerInfo, callerPhone, avatarInfo) => {
        const {isVideo, lastCall} = this.props;
        const localization: any = components().callPanel;
        const ipcRenderer: any = (window as any).ipcRenderer;

        if (ipcRenderer) {
            ipcRenderer.send('incomingCall', {
                callerInfo,
                callerPhone,
                avatarInfo,
                isGroupCall: false,
                mobileCall: lastCall.get("receiverRequest") && !lastCall.get("receiverRequest").includes("web"),
                text: {
                    callText: localization.incomingCallText,
                    callTypeText: localization[isVideo ? 'incomingVideoCallText' : 'incomingAudioCallText'],
                    declineDescription: localization.incomingDeclineCallDesc,
                    acceptDescription: localization.incomingAcceptCallDesc,
                    videoDescription: localization.incomingVideoCallDesc,
                }
            });
        }
    };

    render(): JSX.Element {
        const {callSound} = this.props;
        const {callIgnored} = this.state;

        if (!callIgnored && callSound) {
            return (
                <audio
                    id="sound"
                    preload="auto"
                    autoPlay={true}
                    loop={true}
                >
                    <source src={require("files/ringtone.mp3")} type="audio/mpeg"/>
                    <embed hidden={true} src={require("files/ringtone.mp3")}/>
                </audio>
            )
        }
        return null;
    }


};
