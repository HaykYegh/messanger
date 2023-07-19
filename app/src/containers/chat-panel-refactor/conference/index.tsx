"use strict";

import {Map} from "immutable";
import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {
    getConferenceInfoSelector,
    getConferenceMembersSelector,
    getConferenceStatusesSelector,
    isConferenceIncomingCallSelector,
    isConferenceInitializedSelector,
    isConferenceShowSelector
} from "modules/conference/ConferenceSelector";
import {accept, decline, leave, toggleMemberMuted} from "modules/conference/ConferenceActions";
import Incoming from "components/conference/Incoming";
import {CONFERENCE_COMMANDS} from "xmpp/XMLConstants";
import Content from "components/conference/Content";
import {CALL_STATUSES} from "configs/constants";
import {getCallTime} from "helpers/DateHelper";
import "scss/pages/chat-panel/ConferencePanel";
import {IStoreProps} from "services/selector";
import Log from "modules/messages/Log";

interface IConferenceState {
    expanded: boolean;
    time: number;
    timer: any;
    callStartTime: number;
    permittedStatuses: string[];
}

interface IConferenceProps extends IStoreProps {
    updateCallPanel: (minimized, showChat) => void;
    user: any;
    showChat: boolean;
    minimized: boolean;
    isThreadEmpty: boolean;
    lastCall: any;
    toggleMemberMuted: (memberId: string, muted: boolean) => void;

    accept: () => void;
    decline: () => void;
    leave: () => void;

    members: Map<string, any>;
    statuses: Map<string, string>;
    isIncomingCall: boolean;
    initialized: boolean;
    showConference: boolean;
    info: any;
}

class Conference extends React.Component<IConferenceProps, IConferenceState> {

    constructor(props: any) {
        super(props);
        const callStartTime: number = props.lastCall && props.lastCall.get("callStartTime");
        this.state = {
            expanded: true,
            time: 0,
            timer: null,
            callStartTime,
            permittedStatuses: [CONFERENCE_COMMANDS.calling, CONFERENCE_COMMANDS.ringing, CONFERENCE_COMMANDS.join]
        }
    }

    componentDidMount() {
        Log.i("Initialized");
    }

    shouldComponentUpdate(nextProps: IConferenceProps, nextState: IConferenceState): boolean {

        if (this.props.isThreadEmpty !== nextProps.isThreadEmpty) {
            return true;
        }

        if (this.props.minimized !== nextProps.minimized) {
            return true;
        }

        if (this.props.showChat !== nextProps.showChat) {
            return true;
        }

        if (this.props.initialized !== nextProps.initialized) {
            return true;
        }

        if (!isEqual(this.props.user, nextProps.user)) {
            return true;
        }

        if (!isEqual(this.props.lastCall, nextProps.lastCall)) {
            return true;
        }

        if (!isEqual(this.props.members, nextProps.members)) {
            return true;
        }

        if (!isEqual(this.props.info, nextProps.info)) {
            return true;
        }

        if (!isEqual(this.props.statuses, nextProps.statuses)) {
            return true;
        }

        if (this.props.isIncomingCall !== nextProps.isIncomingCall) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IConferenceProps, prevState: IConferenceState) {
        const {lastCall, initialized} = this.props;
        const newState: IConferenceState = {...this.state};

        if (initialized && lastCall && lastCall.get("status") === CALL_STATUSES.answering) {
            const {timer, callStartTime} = this.state;
            if (!timer) {

                if (!callStartTime) {
                    newState.callStartTime = Date.now() / 1000;
                }

                newState.timer = setInterval(() => {
                    newState.time = Date.now() / 1000 - newState.callStartTime;
                    this.setState(newState);
                }, 1000);
            }
        }

        this.setState(newState);
    }

    componentWillUnmount(): void {
        clearInterval(this.state.timer);
    }

    handleToggleExpandedScreen = (): void => {
        this.setState({expanded: !this.state.expanded});
    };

    handleMinimizeScreen = (): void => {
        // const {minimized, updateCallPanel, showChat} = this.props;
        // updateCallPanel(!minimized, showChat);
    };

    get time(): string {
        const {lastCall} = this.props;
        const {time} = this.state;

        if (lastCall && lastCall.get("status") === CALL_STATUSES.answering && time > 0) {
            return getCallTime(time);
        } else {
            return null;
        }
    }

    render(): JSX.Element {
        const {expanded, permittedStatuses} = this.state;
        const {
            minimized, isThreadEmpty, user, initialized, lastCall,
            decline, accept, leave, isIncomingCall, members, statuses, info,
            toggleMemberMuted
        } = this.props;

        if (isIncomingCall) {
            const groupName: string = info.get('threadName') || info.getIn(['threadInfo', 'name']);
            return (
                <Incoming
                    decline={decline}
                    accept={accept}
                    groupName={groupName}
                    conferenceInfo={lastCall}
                />
            )
        }

        return (
            <div className={`conference-panel${expanded ? " expanded" : isThreadEmpty ? " empty-screen" : ""}`}>
                {
                    minimized ?
                        <div>
                            Minimized
                        </div>
                        :
                        <Content
                            toggleExpandedScreen={this.handleToggleExpandedScreen}
                            toggleMemberMuted={toggleMemberMuted}
                            leave={leave}
                            members={members}
                            statuses={statuses}
                            initialized={initialized}
                            expanded={expanded}
                            user={user}
                            permittedStatuses={permittedStatuses}
                            // time={this.time}
                        />
                }
            </div>
        )
    }
}

const mapStateToProps = () => {
    const members = getConferenceMembersSelector();
    const statuses = getConferenceStatusesSelector();
    const isIncomingCall = isConferenceIncomingCallSelector();
    const initialized = isConferenceInitializedSelector();
    const showConference = isConferenceShowSelector();
    const info = getConferenceInfoSelector();
    return (state, props) => {
        return {
            members: members(state, props),
            statuses: statuses(state, props),
            isIncomingCall: isIncomingCall(state, props),
            initialized: initialized(state, props),
            showConference: showConference(state, props),
            info: info(state, props),
        }
    }
};
const mapDispatchToProps: any = dispatch => ({
    decline: () => dispatch(decline()),
    accept: () => dispatch(accept()),
    leave: () => dispatch(leave()),
    toggleMemberMuted: (memberId: string, muted: boolean) => dispatch(toggleMemberMuted(memberId, muted)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Conference);

