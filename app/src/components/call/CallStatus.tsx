"use strict";

import {CALL_STATUSES} from "configs/constants";
import {getCallTime} from "helpers/DateHelper";
import components from "configs/localization";
import * as React from "react";


interface ICallStatusProps  {
    lastCall: any;
    connected: boolean;
}

interface ICallStatusState {
    timer: any;
    time: number;
    callStartTime: number;
    status: string;
}


export default class CallStatus extends React.Component<ICallStatusProps, ICallStatusState> {

    constructor(props: any) {
        super(props);

        const callStartTime: number = this.props.lastCall && this.props.lastCall.get("callStartTime");
        this.state = {
            callStartTime,
            time: 0,
            status: null,
            timer: null
        }
    }

    componentDidUpdate(prevProps: ICallStatusProps, prevState: ICallStatusState): void {

        if (!prevProps.connected && this.props.connected) {
            if (!this.state.timer) {
                if (!this.state.callStartTime) {
                    const time: number = Date.now() / 1000;
                    this.setState({callStartTime: time});
                }
                const timer: any = setInterval(() => {
                    this.setState({time: Date.now() / 1000 - this.state.callStartTime});
                }, 1000);
                this.setState({timer});
            }
        }

    }

    shouldComponentUpdate(nextProps: ICallStatusProps, nextState: ICallStatusState): boolean {
        const {connected, lastCall} = this.props;

        if (connected !== nextProps.connected) {
            return true;
         }

        if (lastCall !== nextProps.lastCall) {
            return true;
        }

        return this.state.time !== nextState.time;

    }

    componentWillUnmount(): void {
        clearInterval(this.state.timer);
    }

    get status(): string {
        const localization: any = components().callPanel;
        const {status} = this.state;
        const {lastCall} = this.props;
        if (lastCall.get("myHolded")) {
            return localization.myHolded;
        } else if (lastCall.get("otherHolded")) {
            return localization.otherHolded;
        } else if (status) {
            return status;
        } else if (lastCall.get("status") === CALL_STATUSES.answering) {
            return null;
        } else if (lastCall.get("status") === CALL_STATUSES.ringing && !lastCall.get("ownCall")) {
            return localization.incomingCall;
        } else {
            return localization[lastCall.get("status")];
        }
    }

    get time(): string {
        const {lastCall} = this.props;
        const {time} = this.state;

        if (lastCall.get("status") === CALL_STATUSES.answering && time > 0) {
            return getCallTime(time);
        } else {
            return null;
        }
    }

    render(): JSX.Element {

        const {connected, lastCall} = this.props;
        const localization: any = components().callPanel;
        return (
            <div className="call-status">
                {
                    connected ? <span className="status">{this.time ? this.time : ""}</span>
                        : <h2 className="status">{this.status}</h2>
                }
            </div>
        );
    }
}