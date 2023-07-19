"use strict";

import {Map} from "immutable";
import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {
    conferenceDetailsSelector,
    getAllowedMembersCountSelector,
    getConferenceCurrentMember,
    getConferenceInfoSelector,
    getConferenceMemberIdSelector,
    getConferenceOrderedMembersSelector,
    getConferencesettingsPopupSelector,
    getConferenceStatusesSelector,
    getConferenceVoiceActivityMembersSelector,
    getGroupCallInitiator,
    getLeaveGroupCallPopupSelector, getStartedConferenceSelector,
    isConferenceIncomingCallSelector,
    isConferenceInitializedSelector,
    isConferenceShowSelector,
} from "modules/conference/ConferenceSelector";
import {
    CALL_STATUSES,
    CONFERENCE_CALL_MEMBERS_COUNT,
    CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM,
    MOUSE_MOVE_STOPPED_TIME_OUT
} from "configs/constants";
import {
    accept,
    cancel,
    decline,
    leave, setConferenceProperty,
    setCurrentMember, toggleInitiatorPopup, toggleLeaveGroupCallPopup, toggleMemberMuted,
    toggleSettingsPopup
} from "modules/conference/ConferenceActions";
import Incoming from "containers/chat-panel/conference/Incoming";
import {userIdSelector} from "modules/user/UserSelector";
import {CONFERENCE_COMMANDS} from "xmpp/XMLConstants";
import Content from "components/conference/Content";
import {getCallTime} from "helpers/DateHelper";
import "scss/pages/chat-panel/ConferencePanel";
import {IStoreProps} from "services/selector";
import components from "configs/localization";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import Log from "modules/messages/Log";
import ErrorContent from "components/conference/ErrorContent";
import {ZConferenceActiveMembers} from "modules/conference/ZConferenceActiveMembers";
import {updateConversationProps} from "modules/conversations/ConversationsActions";
import Draggable from "react-draggable";

interface IConferenceState {
    expanded: boolean;
    time: number;
    timer: any;
    callStartTime: number;
    permittedStatuses: string[];
    currentIndex: number;
    arr: any,
    prevArr: any;
}

interface IConferenceProps extends IStoreProps {
    setConferenceCurrentMember: (currentMember: string) => void;
    updateCallPanel: (minimized, showChat) => void;
    threadInfo?: any;
    showChat: boolean;
    minimized: boolean;
    lastCall: any;
    userId: string;
    toggleMemberMuted: (memberId: string, muted: boolean) => void;
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => void;
    toggleLeaveGroupCallPopup: (leaveGroupCallPopup: boolean) => void;
    toggleInitiatorPopup: (initiatorPopup: boolean) => void;
    updateConversationProps?: (groupId: string, props: any) => void;
    user: any;
    setParentState:  (data: any) => void;
    accept: () => void;
    decline: () => void;
    leave: () => void;
    toggleSettingsPopup: (settingsPopup: boolean) => void;
    settingsPopup: boolean;
    cancel: (memberId: string) => void;

    members: Map<string, any>;
    voiceActivityMembers: Map<string, any>;
    statuses: Map<string, string>;
    isIncomingCall: boolean;
    initialized: boolean;
    showConference: boolean;
    info: any;
    allowedMembersCount: number;
    memberId: string;
    conferenceCurrentMember: string;
    leaveGroupCallPopup: boolean;
    initiator: string;
    startedConference: boolean;
}

const membersArr = new ZConferenceActiveMembers()

class Conference extends React.Component<IConferenceProps, IConferenceState> {

    conferenceContainer: any = React.createRef();

    headerContainer: any = React.createRef();

    footerContainer: any = React.createRef();

    contentContainer: any = React.createRef();

    mouseMoveTimeOut: any = null;

    constructor(props: any) {
        super(props);
        const callStartTime: number = props.lastCall && props.lastCall.get("callStartTime");
        this.state = {
            expanded: true,
            time: 0,
            timer: null,
            callStartTime,
            permittedStatuses: [CONFERENCE_COMMANDS.calling, CONFERENCE_COMMANDS.ringing, CONFERENCE_COMMANDS.join],
            currentIndex: null,
            arr: [],
            prevArr: []
        }
    }

    componentDidMount(): void {
        const {isIncomingCall, threadInfo} = this.props;
        !isIncomingCall && this.handleAddEventListeners();
    }

    shouldComponentUpdate(nextProps: IConferenceProps, nextState: IConferenceState): boolean {

        if (this.props.conferenceCurrentMember !== nextProps.conferenceCurrentMember) {
            return true
        }

        if (this.props.startedConference !== nextProps.startedConference) {
            return true
        }

        if (this.props.leaveGroupCallPopup !== nextProps.leaveGroupCallPopup) {
            return true
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

        if (!isEqual(this.props.threadInfo, nextProps.threadInfo)) {
            return true;
        }

        if (this.props.isIncomingCall !== nextProps.isIncomingCall) {
            return true;
        }

        if (this.props.allowedMembersCount !== nextProps.allowedMembersCount) {
            return true;
        }

        if (this.props.memberId && this.props.memberId !== nextProps.memberId) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IConferenceProps, prevState: IConferenceState): void {
        const {lastCall, initialized, startedConference} = this.props;
        const {} = this.state;
        const newState: IConferenceState = {...this.state};

        if (initialized && lastCall && lastCall.get("status") === CALL_STATUSES.join && startedConference) {
            const {timer, callStartTime} = this.state;
            if (!timer) {

                if (!callStartTime) {
                    newState.callStartTime = Date.now() / 1000;
                }

                newState.timer = setInterval(() => {
                    this.setState({time: Date.now() / 1000 - newState.callStartTime});
                }, 1000);
            }
        }

        if (!this.props.isIncomingCall && prevProps.isIncomingCall !== this.props.isIncomingCall) {
            this.handleAddEventListeners();
        }

        this.setState(newState);
    }

    componentWillUnmount(): void {
        clearInterval(this.state.timer);
        // this.conferenceContainer && this.conferenceContainer.current && this.conferenceContainer.current.removeEventListener('mousemove', this.handleMouseMove);
        // this.conferenceContainer && this.conferenceContainer.current && this.conferenceContainer.current.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    handleAddEventListeners = (): void => {
        // this.conferenceContainer && this.conferenceContainer.current && this.conferenceContainer.current.addEventListener('mousemove', this.handleMouseMove);
        // this.conferenceContainer && this.conferenceContainer.current && this.conferenceContainer.current.addEventListener('mouseleave', this.handleMouseLeave);
    };

    handleMouseMove = (): void => {
        const {} = this.state;
        const header: any = this.headerContainer && this.headerContainer.current;
        const footer: any = this.footerContainer && this.footerContainer.current;

        // Show header
        if (header && !header.classList.contains('show')) {
            header.classList.add('show');
        }

        // Show footer
        if (footer && !footer.classList.contains('show')) {
            footer.classList.add('show');
        }


        // Mouse move stopped timer start

        if (this.mouseMoveTimeOut) {
            clearTimeout(this.mouseMoveTimeOut);
        }

        this.mouseMoveTimeOut = setTimeout(() => {
            this.handleMouseLeave(); // Hide footer and header
        }, MOUSE_MOVE_STOPPED_TIME_OUT);

        // Mouse move stopped timer start

    };

    handleMouseLeave = (): void => {
        const header: any = this.headerContainer && this.headerContainer.current;
        const footer: any = this.footerContainer && this.footerContainer.current;

        if (header && header.classList.contains('show')) {
            header.classList.remove('show');
        }

        if (footer && footer.classList.contains('show')) {
            footer.classList.remove('show');
        }

        if (this.mouseMoveTimeOut) {
            clearTimeout(this.mouseMoveTimeOut);
        }
    };

    handleToggleExpended = (): void => {
        const {minimized, setParentState} = this.props;
        this.setState({expanded: !this.state.expanded});
        setParentState({minimized: false});
    };

    get timeOrStatus(): string {
        const {lastCall, statuses, userId, startedConference, threadInfo} = this.props;
        const {time} = this.state;

        Log.i("conference -> timeOrStatus -> lastCall = ", lastCall)
        Log.i("conference -> timeOrStatus -> time = ", time)

        if (lastCall && lastCall.get("status") === CALL_STATUSES.join && time > 0 && startedConference) {
            return getCallTime(time);
        } else {
            const localization: any = components().conferencePanel;

            if (!navigator.onLine) {
                return localization.waitingForNetwork;
            }

            // if (statuses && statuses.size > 0 && [CONFERENCE_COMMANDS.calling, CONFERENCE_COMMANDS.ringing].includes(statuses.get(userId))) {
            if (threadInfo.get("statusMap") && threadInfo.get("statusMap").size > 0 && [CONFERENCE_COMMANDS.calling, CONFERENCE_COMMANDS.ringing].includes(threadInfo.get("statusMap").get(userId))) {
                if (threadInfo.get("joinedList").size > 1) {
                    return localization.inCall;
                }
                return localization.connecting;
            }
            return null;
        }
    }

    get getRoomClassNames(): any {
        const {allowedMembersCount, members, memberId, threadInfo, user} = this.props;
        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT
        let contentClassName: string = '';
        let sectionClassName: string = '';

        if (memberId !== '') {
            let i: number = 1;
            let currentIndex: number = null;

            if (threadInfo) {
                threadInfo.get("joinedList").mapKeys(key => {
                    // members.mapKeys(key => {
                    if (memberId === key) {
                        currentIndex = i;
                    }
                    i++;
                });
            }

            if (currentIndex) {
                if (currentIndex === 4) {
                    sectionClassName = ' fourth';
                } else if (currentIndex === 3) {
                    sectionClassName = ' third';
                } else if (currentIndex === 2) {
                    sectionClassName = ' second';
                } else if (currentIndex === 1) {
                    sectionClassName = ' first';
                }
            }
        }

        if (allowedMembersCount >= C_Count) {
            contentClassName = ' four-room-group';
        } else if (allowedMembersCount === 3) {
            contentClassName = ` three-room-group`;
        } else if (allowedMembersCount === 2) {
            contentClassName = ` two-room-group`;
        } else if (allowedMembersCount === 1) {
            contentClassName = ' one-room-group';
        }

        return {
            content: contentClassName,
            section: sectionClassName,
        };
    }

    // handleToggleMinimize = () => {
    //     const {minimized, setParentState} = this.props;
    //     this.setState({expanded: false});
    //     setParentState({minimized: !minimized});
    // };

    addMember = (member: Map<string, any>): void => {
        const prevArr = JSON.parse(JSON.stringify(membersArr.getMembers()))
        membersArr.add(member)
        this.setState({arr: membersArr.getMembers(), prevArr}, () => {
            Log.i("addMember -> prevArr = ", this.state.prevArr)
        })
    }

    removeMember = (member: Map<string, any>, index1, index2): void => {
        const prevArr = JSON.parse(JSON.stringify(membersArr.getMembers()))
        membersArr.remove(member, index1, index2)
        this.setState({arr: membersArr.getMembers(), prevArr})
    }

    toggleMinimize = () => {
        const {minimized, setParentState} = this.props;
        this.setState({expanded: false});
        setParentState({minimized: !minimized});
    };



    get content(): JSX.Element {
        const {expanded, permittedStatuses, arr, prevArr} = this.state;
        const {
            minimized, userId, initialized, lastCall, allowedMembersCount, memberId,
            decline, accept, leave, isIncomingCall, members, statuses, info, cancel,
            toggleSettingsPopup, settingsPopup, setConferenceCurrentMember, conferenceCurrentMember,
            toggleMemberMuted, setConferenceProperty, leaveGroupCallPopup, toggleLeaveGroupCallPopup,
            initiator, toggleInitiatorPopup, user, voiceActivityMembers, threadInfo, updateConversationProps
        } = this.props;

        Log.i("conference -> minimized = ", minimized)
        Log.i("conference -> threadInfo = r", threadInfo)

        if (!info) {
            return null
        }

        const groupName: string = info.get('threadName') || info.getIn(['threadInfo', 'name']);
        const groupId: string = info.get('threadId');


        if (isIncomingCall) {
            return (
                <Incoming
                    decline={decline}
                    accept={accept}
                    groupName={groupName}
                />
            )
        }

        return (
            <div className={`conference-panel${expanded ? ' expanded' : minimized ? ' p-minimized' : ''}`} ref={this.conferenceContainer}>
                {
                    !threadInfo.get("unValid") ? <Content
                        leaveGroupCallPopup={leaveGroupCallPopup}
                        toggleLeaveGroupCallPopup={toggleLeaveGroupCallPopup}
                        toggleInitiatorPopup={toggleInitiatorPopup}
                        initiator={initiator}
                        leave={leave}
                        user={user}
                        toggleMemberMuted={toggleMemberMuted}
                        setConferenceProperty={setConferenceProperty}
                        conferenceCurrentMember={conferenceCurrentMember}
                        setConferenceCurrentMember={setConferenceCurrentMember}
                        toggleSettingsPopup={toggleSettingsPopup}
                        settingsPopup={settingsPopup}
                        cancel={cancel}
                        // members={members}
                        members={threadInfo.get("joinedList")}
                        voiceActivityMembers={voiceActivityMembers}
                        // statuses={statuses}
                        statuses={statuses.size > 0 ? statuses : threadInfo.get("statusMap")}
                        pasiveMembers={threadInfo.get("pasiveMembers")}
                        activeMembers={threadInfo.get("activeMembers")}
                        currentActiveMember={threadInfo.get("currentActiveMember")}
                        // statuses={threadInfo.get("statusMap")}
                        initialized={initialized}
                        toggleExpanded={this.handleToggleExpended}
                        updateConversationProps={updateConversationProps}
                        expanded={expanded}
                        userId={userId}
                        memberId={memberId}
                        permittedStatuses={permittedStatuses}
                        timeOrStatus={this.timeOrStatus}
                        ownCall={lastCall && lastCall.get('ownCall')}
                        count={allowedMembersCount}
                        roomClassNames={this.getRoomClassNames}
                        groupId={groupId}
                        groupName={groupName || threadInfo.get("name")}
                        contentRefs={{
                            headerRef: this.headerContainer,
                            footerRef: this.footerContainer,
                            contentRef: this.contentContainer,
                        }}
                        arr={arr}
                        prevArr={prevArr}
                        addMember={this.addMember}
                        removeMember={this.removeMember}
                        toggleMinimize={this.toggleMinimize}
                        minimized={minimized}
                    /> :
                    <ErrorContent
                        groupName={groupName || threadInfo.get("name")}
                        contentRefs={{
                            headerRef: this.headerContainer,
                            footerRef: this.footerContainer,
                            contentRef: this.contentContainer,
                        }}
                        expanded={expanded}
                        toggleExpanded={this.handleToggleExpended}
                        leave={leave}
                    />
                }
                <audio id="audio-element"> </audio>

            </div>
        )
    }

    render(): JSX.Element {
        const {minimized} = this.props
        return (
            <Draggable bounds="parent" disabled={!minimized}>
                {this.content}
            </Draggable>
        )
    }
}

const mapStateToProps = () => {
    const userId = userIdSelector();
    const memberId = getConferenceMemberIdSelector();
    const settingsPopup = getConferencesettingsPopupSelector();
    const members = getConferenceOrderedMembersSelector();
    const voiceActivityMembers = getConferenceVoiceActivityMembersSelector();
    const statuses = getConferenceStatusesSelector();
    const isIncomingCall = isConferenceIncomingCallSelector();
    const initialized = isConferenceInitializedSelector();
    const showConference = isConferenceShowSelector();
    const info = getConferenceInfoSelector();
    const allowedMembersCount = getAllowedMembersCountSelector();
    const conferenceCurrentMember = getConferenceCurrentMember();
    const startedConference = getStartedConferenceSelector();
    const leaveGroupCallPopup = getLeaveGroupCallPopupSelector();
    const initiator = getGroupCallInitiator();

    return (state, props) => {
        return {
            members: members(state, props),
            voiceActivityMembers: voiceActivityMembers(state, props),
            conferenceCurrentMember: conferenceCurrentMember(state, props),
            statuses: statuses(state, props),
            isIncomingCall: isIncomingCall(state, props),
            initialized: initialized(state, props),
            showConference: showConference(state, props),
            info: info(state, props),
            allowedMembersCount: allowedMembersCount(state, props),
            userId: userId(state, props),
            memberId: memberId(state, props),
            settingsPopup: settingsPopup(state, props),
            leaveGroupCallPopup: leaveGroupCallPopup(state, props),
            initiator: initiator(state, props),
            startedConference: startedConference(state, props)
        }
    }
};
const mapDispatchToProps: any = dispatch => ({
    decline: () => dispatch(decline()),
    accept: () => dispatch(accept()),
    leave: () => dispatch(leave()),
    toggleMemberMuted: (memberId: string, muted: boolean) => dispatch(toggleMemberMuted(memberId, muted)),
    updateConversationProps: (groupId: string, props: any) => dispatch(updateConversationProps(groupId, props)),
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => dispatch(setConferenceProperty(propertyId, value)),
    toggleSettingsPopup: (settingsPopup: boolean) => dispatch(toggleSettingsPopup(settingsPopup)),
    cancel: (memberId: string) => dispatch(cancel(memberId)),
    setConferenceCurrentMember: (currentMember: string) => dispatch(setCurrentMember(currentMember)),
    toggleLeaveGroupCallPopup: (leaveGroupCallPopup: boolean) => dispatch(toggleLeaveGroupCallPopup(leaveGroupCallPopup)),
    toggleInitiatorPopup: (initiatorPopup: boolean) => dispatch(toggleInitiatorPopup(initiatorPopup)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Conference);

