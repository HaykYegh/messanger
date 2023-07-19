"use strict";

import {Map} from "immutable";
import * as React from "react";

import {CONFERENCE_COMMANDS} from "xmpp/XMLConstants";
import Section from "components/conference/Section";
import components from "configs/localization";
import Log from "modules/messages/Log";
import ConferenceCarousel from "containers/chat-panel/conference/CarouselSlider";
import MemberSection from "components/conference/MemberSection";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import {
    EndGroupCallContent, LeaveCallCancelContent,
    LeaveCallDescriptionForInitiatorContent,
    LeaveCallPopup,
    LeaveCallPopupContent, LeaveGroupCallContent
} from "components/conference/ContentStyle";

interface IContentProps {
    leave: () => void;
    toggleSettingsPopup?: (settingsPopup: boolean) => void;
    settingsPopup?: boolean
    cancel?: (memberId: string) => void;
    toggleExpanded?: () => void;
    toggleMemberMuted: (memberId: string, muted: boolean) => void;
    setConferenceProperty?: (propertyId: ConfPropertyId, value: string) => void;
    members: Map<string, any>;
    pasiveMembers?: Map<string, any>;
    activeMembers?: Map<string, any>;
    voiceActivityMembers?: Map<string, any>;
    statuses: Map<string, any>;
    initialized: boolean;
    expanded: boolean;
    userId?: any;
    memberId?: string;
    timeOrStatus?: string;
    permittedStatuses: string[];
    ownCall?: boolean;
    count?: number;
    roomClassNames?: {
        content: string,
        section: string,
    };
    groupName?: string;
    groupId?: string;
    contentRefs?: any;
    setConferenceCurrentMember?: (currentMember: string) => void;
    toggleLeaveGroupCallPopup?: (leaveGroupCallPopup: boolean) => void;
    toggleInitiatorPopup?: (initiatorPopup: boolean) => void;
    updateConversationProps?: (groupId: string, props: any) => void;
    toggleExpandedScreen?: () => void;
    conferenceCurrentMember?: string;
    leaveGroupCallPopup?: boolean;
    initiator?: string;
    user: any;
    arr?: any;
    prevArr?: any;
    addMember?: (member: Map<string, any>) => void;
    removeMember?: (member: Map<string, any>, index1: number, index2: number) => void;
    toggleMinimize?: () => void;
    minimized?: boolean;
    currentActiveMember?: any;
}

interface IContentState {
    leaveGroupCallPopup: boolean;
}

export default class Content extends React.Component<IContentProps, IContentState> {
    constructor(props: any) {
        super(props);
        this.state = {
            leaveGroupCallPopup: false
        }
    }

    get activeMembers() {
        const {members, permittedStatuses, statuses} = this.props

        const arr = statuses ? statuses.keySeq().toArray()
            .filter((el, index) => {
                const member = members?.get(el)
                const key: string = member?.get("contactId");
                const status: string = statuses?.get(key);

                // Not support conference
                if (!status) {
                    return false;
                }

                // If not calling or not ringing or not joined hide member
                if (!permittedStatuses.includes(status)) {
                    return false;
                }
                return true
            }) : []

        return arr;
    }

    componentWillUnmount() {
        const { expanded, toggleMinimize } = this.props;
        if (!expanded) {
            toggleMinimize()
        }
    }

    leaveGroupCall = (): void =>  {
        const { leave, toggleLeaveGroupCallPopup, initiator, userId, members } = this.props;

        // Log.i("conference -> leaveGroupCall -> members = ", members.size)

        // toggleLeaveGroupCallPopup(true)

        if (userId.includes(initiator) && this.activeMembers.length > 1) {
            toggleLeaveGroupCallPopup(true)
        } else {
            leave()
        }

        // this.setState({leaveGroupCallPopup: true})
    }

    render () {
        const {
            leave, roomClassNames, groupName, timeOrStatus, contentRefs, userId, members, expanded,
            statuses, initialized, permittedStatuses, ownCall, cancel, toggleExpanded, toggleSettingsPopup,
            settingsPopup, setConferenceCurrentMember, conferenceCurrentMember, toggleMemberMuted, setConferenceProperty,
            toggleLeaveGroupCallPopup, leaveGroupCallPopup, toggleInitiatorPopup, user, voiceActivityMembers, arr, prevArr,
            addMember, removeMember, activeMembers, pasiveMembers, groupId, updateConversationProps, toggleMinimize, minimized, currentActiveMember
        } = this.props;
        const localization: any = components().conferencePanel;
        const isRevokeMember: boolean = ownCall ? statuses?.some((value, key) => {
            return userId && !userId.includes(key) && value === CONFERENCE_COMMANDS.join;
        }) : false;


        // Log.i("conference -> conferenceCurrentMember -> ", members.get(`${conferenceCurrentMember}@msg.hawkstream.com`))
        // Log.i("conference -> userId -> ", userId)

        return (
            <div className='conference-panel-block'>
                <div className={`${expanded ? 'header' : minimized ? 'header no-expanded-header header-m' : 'header no-expanded-header'} `} ref={contentRefs.headerRef}>
                    <div className='left-content'>
                        {expanded ? <span className={'icon-minimize'} onClick={toggleExpanded}/> : <span className="icon-footer icon-max-window" onClick={toggleExpanded} />}
                        <div className={`${expanded ? 'group-info' : minimized ? 'group-info minimized-gi' : 'group-info no-expanded-gi'} `}>
                            <span className='group-name'>{groupName}</span>
                            <span className='status'>{timeOrStatus || ""}&nbsp;</span>
                        </div>
                    </div>
                    {expanded && <ConferenceCarousel
                        members={members}
                        pasiveMembers={pasiveMembers}
                        voiceActivityMembers={voiceActivityMembers}
                        setConferenceCurrentMember={setConferenceCurrentMember}
                        permittedStatuses={permittedStatuses}
                        userId={userId}
                        statuses={statuses}
                        addMember={addMember}
                    />}
                </div>
                <div
                    className={minimized ? "content content-minimized" : "content"}
                    // className={`content${roomClassNames.content}`}
                    ref={contentRefs.contentRef}>
                     <MemberSection
                        status={status}
                        userId={userId}
                        user={user}
                        members={members}
                        member={members?.get(`${conferenceCurrentMember}@msg.hawkstream.com`)}
                        localization={localization}
                        initialized={initialized}
                        isNotCurrentUser={null}
                        isRevokeMember={isRevokeMember}
                        ownCall={ownCall}
                        voiceActivityMembers={voiceActivityMembers}
                        cancel={null}
                        sectionClassName={roomClassNames.section}
                        expanded={expanded}
                        arr={arr}
                        prevArr={prevArr}
                        removeMember={removeMember}
                        activeMembers={activeMembers}
                        minimized={minimized}
                        currentActiveMember={currentActiveMember}
                     />
                    {/*{*/}
                    {/*    members && members.valueSeq().map(member => {*/}
                    {/*        const key: string = member.get("contactId");*/}
                    {/*        const status: string = statuses.get(key);*/}

                    {/*        // Not support conference*/}
                    {/*        if (!status) {*/}
                    {/*            return;*/}
                    {/*        }*/}

                    {/*        // If not calling or not ringing or not joined hide member*/}
                    {/*        if (!permittedStatuses.includes(status)) {*/}
                    {/*            return;*/}
                    {/*        }*/}

                    {/*        const revokeMember: any = () => cancel(key);*/}
                    {/*        const isNotCurrentUser: boolean = userId !== key;*/}

                    {/*        return (*/}
                    {/*            <Section*/}
                    {/*                key={key}*/}
                    {/*                status={status}*/}
                    {/*                member={member}*/}
                    {/*                localization={localization}*/}
                    {/*                initialized={initialized}*/}
                    {/*                isNotCurrentUser={isNotCurrentUser}*/}
                    {/*                isRevokeMember={isRevokeMember}*/}
                    {/*                ownCall={ownCall}*/}
                    {/*                cancel={revokeMember}*/}
                    {/*                sectionClassName={roomClassNames.section}*/}
                    {/*            />*/}
                    {/*        )*/}
                    {/*    })*/}
                    {/*}*/}
                </div>
                <div
                    style={{
                        transform: leaveGroupCallPopup ? 'translateY(-100%)' : 'translateY(0)'
                    }}
                    className={`${expanded ? "footer" : minimized ? "footer no-expanded-footer minimized-footer" : "footer no-expanded-footer"}`}
                    ref={contentRefs.footerRef}>
                    <div className={`${minimized ? "mini-window mini-window-minimized" : expanded ? "mini-window mini-window-expanded" : "mini-window"}`} onClick={toggleMinimize}>
                        <span className="icon-footer icon-mini-window"></span>
                        {(!minimized || expanded) && <span className="description">mini window</span>}
                    </div>
                    <div className="call-actions">
                        <div className='add-to-call'>
                            <span className={`${expanded ? 'icon-footer' : 'icon-footer no-expanded-if'} icon-add-to-call`} onClick={() => {
                                toggleSettingsPopup(!settingsPopup)
                            }}/>
                            {(!minimized || expanded) && <span className='description'>{localization.addToCall}</span>}
                        </div>

                        <div className='microphone' onClick={() => {
                            const joinedList: any = members.toJS()
                            joinedList[userId].muted = !joinedList[userId].muted
                            updateConversationProps(groupId, {joinedList})
                            setConferenceProperty(ConfPropertyId.mute, members?.getIn([userId, "muted"]) ? "0" : "1")
                            // toggleMemberMuted(userId, !members.getIn([userId, "muted"]))
                            // setConferenceProperty(ConfPropertyId.mute, members.getIn([userId, "muted"]) ? "0" : "1")
                        }}>
                            <span className={members?.getIn([userId, "muted"]) ? `${expanded ? 'icon-footer' : 'icon-footer no-expanded-if'} icon-microphone-on` : `${expanded ? 'icon-footer' : 'icon-footer no-expanded-if'} icon-microphone-off`}/>
                            {(!minimized || expanded) && <span className='description'>{localization.muteCall}</span>}
                        </div>


                    </div>

                    <div className={`${expanded ? 'end-call' : minimized ? 'end-call minimized-ec' : 'end-call no-expanded-ec'}`}>
                        <span className={`${expanded ? 'icon-footer' : 'icon-footer no-expanded-if'} icon-end-call`} onClick={this.leaveGroupCall}/>
                        {(!minimized || expanded) && <span className='description'>{localization.endCall}</span>}
                        {leaveGroupCallPopup && !minimized && <LeaveCallPopup>
                            <LeaveCallPopupContent>
                                <LeaveCallDescriptionForInitiatorContent>
                                    {localization.leaveCallDescriptionForInitiator}
                                </LeaveCallDescriptionForInitiatorContent>
                                <LeaveGroupCallContent>
                                    <button onClick={() => {
                                        toggleInitiatorPopup(true)
                                        toggleLeaveGroupCallPopup(false)
                                    }}>{localization.leaveGroupCall}</button>
                                </LeaveGroupCallContent>
                                <EndGroupCallContent>
                                    <button onClick={leave}>{localization.endGroupCall}</button>
                                </EndGroupCallContent>
                            </LeaveCallPopupContent>
                            <LeaveCallCancelContent onClick={() => toggleLeaveGroupCallPopup(false)}>
                                <button>{localization.cancel}</button>
                            </LeaveCallCancelContent>
                        </LeaveCallPopup>}
                    </div>
                    {/*{!expanded && <div className={`${minimized ? "max-window max-window-minimized" : "max-window"}`} onClick={toggleExpanded} >*/}
                    {/*    <span className="icon-footer icon-max-window"></span>*/}
                    {/*    {(!minimized || expanded) && <span className="description">maximize</span>}*/}
                    {/*</div>}*/}
                </div>
            </div>
        )
    }
}
