"use strict";

import React, {Component} from 'react';
import Draggable from "react-draggable";

import "scss/pages/chat-panel/ConferencePanel";
import components from "configs/localization";

const callRingTone = require("files/ringtone.mp3");

interface IIncomingProps {
    groupName?: string;
    decline?: () => void;
    accept?: () => void;

    callSound?: boolean;
}

interface IIncomingState {
    callIgnored: boolean;
    popupOpened: boolean;
}


class Incoming extends Component<IIncomingProps, IIncomingState> {

    constructor(props: any) {
        super(props);

        this.state = {
            callIgnored: false,
            popupOpened: false,
        }
    }

    componentDidMount(): void {
        if ((window as any).ipcRenderer) {
            const ipcRenderer = (window as any).ipcRenderer;
            ipcRenderer.once('doGroupCallAction', this.handleCallAction)
        }
        window.addEventListener("beforeunload", this.props.decline, false);
    }

    componentDidUpdate(prevProps: IIncomingProps, prevState: IIncomingState): void {
        const {popupOpened} = this.state;
        const {groupName} = this.props;
        if (!popupOpened || (groupName && this.props.groupName !== prevProps.groupName)) {
            this.setState({popupOpened: true});
            this.handelSendCallRequest(groupName);
        }
    }

    componentWillUnmount() {
        if ((window as any).ipcRenderer) {
            (window as any).ipcRenderer.send('closeGroupCallPopup');
            (window as any).ipcRenderer.removeListener('doGroupCallAction', this.handleCallAction);
        }
        window.removeEventListener("beforeunload", this.props.decline, false);
    }

    handleCallAction = (event, action): void => {
        const {accept, decline} = this.props;
        switch (action) {
            case "accept":
                accept();
                break;
            case "decline":
                decline();
                break;
            case "ignore":
                this.setState({callIgnored: true});
                break;
        }
    };

    handelSendCallRequest = (groupName: string): void => {
        const localization: any = components().conferencePanel;
        (window as any).ipcRenderer &&
        (window as any).ipcRenderer.send('incomingGroupCall', {
            groupName,
            callType: localization.incomingCall
        });
    };

    render(): JSX.Element {
        const {groupName, decline, accept} = this.props;
        const localization: any = components().conferencePanel;
        const {callIgnored} = this.state;
        const isDesktop = !!(window as any).ipcRenderer;

        return (
            <Draggable bounds="parent">
                <div className={`${isDesktop && !callIgnored ? 'hidden' : 'conference-incoming'}`}>
                    <div className="content">
                        <div className='group-info'>
                            <span className='group-name'>{groupName}</span>
                            <span className="call-type">{localization.incomingCall}</span>
                        </div>
                    </div>
                    <div className="footer">
                        <div className="call-actions">
                            <div className='decline-call'>
                                <span className="icon-footer icon-decline-call" onClick={decline}/>
                                <span className='description'>Decline</span>
                            </div>
                            <div className='accept-call'>
                                <span className="icon-footer icon-accept-call" onClick={accept}/>
                                <span className='description'>Accept</span>
                            </div>
                        </div>
                    </div>
                    {
                        !callIgnored &&
                        <audio id="sound" preload="auto" autoPlay={true} loop>
                            <source src={callRingTone} type="audio/mpeg"/>
                            <embed hidden={true} src={callRingTone}/>
                        </audio>
                    }
                </div>
            </Draggable>
        );
    }
}

export default Incoming;
