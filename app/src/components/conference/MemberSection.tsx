"use strict";

import React, {Component} from 'react';
import Log from "modules/messages/Log";
import {ZConferenceActiveMembers} from "modules/conference/ZConferenceActiveMembers";
import {Map} from "immutable";
import isEqual from "lodash/isEqual";
import {AMMutedIcon, HoldDiv, NoMember} from "components/conference/ConferenceStyle";
import components from "configs/localization";
import UnmuteSvg from "../../../assets/components/svg/conference/UnmuteSvg";
import MuteSvg from "../../../assets/components/svg/conference/MuteSvg";
import ActiveMember from "components/conference/ActiveMember";

interface IMemberSectionProps {
    member: any;
    localization: any;
    initialized: boolean;
    isNotCurrentUser: boolean;
    ownCall: boolean;
    isRevokeMember: boolean;
    expanded: boolean;
    cancel: () => void;
    sectionClassName: string;
    status: string;
    userId: string;
    user: any;
    voiceActivityMembers: any;
    arr: any;
    prevArr: any;
    removeMember: (member: Map<string, any>, index1: number, index2: number) => void;
    activeMembers: Map<string, any>;
    members: Map<string, any>;
    minimized: boolean;
    currentActiveMember: any;
}

interface IMemberSectionState {
    avatarURL: string,
    hide: boolean,
    arr: any,
    prevArr: any;
    showNM: boolean;
}

const membersArr = new ZConferenceActiveMembers()

class MemberSection extends Component<IMemberSectionProps, IMemberSectionState> {

    constructor(props) {
        super(props);
        this.state = {
            avatarURL: '',
            hide: false,
            arr: [],
            prevArr: [],
            showNM: true,
        }
    }


    avatarContent(member): JSX.Element {
        const {userId, user, members} = this.props;
        const {avatarURL} = this.state;
        const fistName: string = member.get("firstName");
        // const avatarBlobUrl = userId.includes(member.get("username")) ? user.get("avatarBlobUrl") : member.get("avatarBlobUrl")
        const avatarBlobUrl = member.get("avatarBlobUrl")
        const memberId = member.get("contactId")

        if (avatarBlobUrl) {
            return <img src={avatarBlobUrl} className="contact_img" alt=""/>;
        }

        if (fistName) {
            const avatarCharacter: string = member.get("avatarCharacter");
            return (
                <>
                    <span
                        className="contact_icon"
                        style={{color: member.getIn(["color", "numberColor"])}}
                        data-line={avatarCharacter}
                    >
                      <span>{avatarCharacter}</span>
                    </span>
                    {members.getIn([memberId, "muted"]) && <AMMutedIcon>
                        <UnmuteSvg/>
                    </AMMutedIcon>}
                    {members.getIn([memberId, "hold"]) && <HoldDiv>
                        <span>Hold</span>
                    </HoldDiv>}
                </>
            )
        }

        return <span className="no-name_icon"/>;
    }

    memberName(member): string {
        // const {member} = this.props;
        const fistName: string = member && member.get("firstName");
        const memberName: string = member && (fistName || member.get("lastName") ?
            member.get("name") : member.get("email") ? member.get("email") :
                `${!member.get("name")?.startsWith("0") ? "+" : ""}${member.get("name")}`);

        return memberName || '';
    }

    getCurrentActiveMembers() {
        const {activeMembers, currentActiveMember, minimized} = this.props;
        const mObj = {};

        if (!activeMembers) {
            return
        }
        Log.i("componentDidMount -> activeMembers = ", activeMembers)
        const prevMembersArr = JSON.parse(JSON.stringify(membersArr.getMembers()))
        let activMembersArr = activeMembers.valueSeq().toArray()
        Log.i("activeMembers -> ", activeMembers)
        Log.i("currentActiveMember -> ", currentActiveMember)
        Log.i("currentActiveMember minimized -> ", minimized)
        if (minimized && currentActiveMember) {
            const contactId = currentActiveMember.get('contactId')
            if (activeMembers.get(contactId)) {
                activMembersArr = [currentActiveMember]
            } else {
                if(activeMembers.size > 0) {
                    activMembersArr = [activeMembers. valueSeq().first()]
                }
            }

            // mObj[currentActiveMember.contactId] = currentActiveMember
        }

        membersArr.addAll(activMembersArr)
        this.setState({arr: membersArr.getMembers(), prevArr: prevMembersArr})
    }

    componentDidMount() {
        this.getCurrentActiveMembers()
    }

    componentDidUpdate(prevProps: Readonly<IMemberSectionProps>, prevState: Readonly<IMemberSectionState>, snapshot?: any) {
        const {activeMembers, minimized} = this.props;

        if (!isEqual(prevProps.activeMembers, activeMembers)) {
            this.getCurrentActiveMembers()
        }

        if (prevProps.minimized !== minimized) {
            this.getCurrentActiveMembers()
        }

        if (prevState.arr.length === 0 && this.state.arr.length > 0) {
            this.setState({showNM: false})
        }

        if (prevState.arr.length > 0 && this.state.arr.length === 0) {
            setTimeout(() => {
                this.setState({showNM: true})
            }, 300)
        }
    }

    render(): JSX.Element {
        const {sectionClassName, member, voiceActivityMembers, removeMember, members, expanded, minimized} = this.props;
        const {avatarURL, arr, prevArr, showNM} = this.state;
        const localization: any = components().conferencePanel;

        if (!member) {
            return null
        }

        Log.i("conference -> member", member)

        return (
            <div className={`section${sectionClassName} ${expanded ? "current-section" : "current-section no-expanded-cs"}`}
            >
                {arr.length === 0 && showNM && <NoMember>{localization.noMembers}</NoMember>}
                {
                    avatarURL &&
                    <div
                        className='avatar-image'
                        style={{
                            backgroundImage: `url(${avatarURL})`
                        }}
                    />
                }
                <ActiveMember
                    arr={arr}
                    index1={0}
                    index2={0}
                    voiceActivityMembers={voiceActivityMembers}
                    members={members}
                    member={member}
                    removeMember={removeMember}
                    prevArr={prevArr}
                    minimized={minimized}
                    expanded={expanded}
                />
                <ActiveMember
                    arr={arr}
                    index1={0}
                    index2={1}
                    voiceActivityMembers={voiceActivityMembers}
                    members={members}
                    member={member}
                    removeMember={removeMember}
                    prevArr={prevArr}
                    minimized={minimized}
                    expanded={expanded}
                />
                <ActiveMember
                    arr={arr}
                    index1={1}
                    index2={0}
                    voiceActivityMembers={voiceActivityMembers}
                    members={members}
                    member={member}
                    removeMember={removeMember}
                    prevArr={prevArr}
                    minimized={minimized}
                    expanded={expanded}
                />
                <ActiveMember
                    arr={arr}
                    index1={1}
                    index2={1}
                    voiceActivityMembers={voiceActivityMembers}
                    members={members}
                    member={member}
                    removeMember={removeMember}
                    prevArr={prevArr}
                    minimized={minimized}
                    expanded={expanded}
                />
                {/*<div className={arr[0] && arr[0][0] ? `member member_${arr[0][0].coordinate[0]}_${arr[0][0].coordinate[1]}` : (prevArr[0] && prevArr[0][0]) ? `member member_${prevArr[0][0].coordinate[0]}_${prevArr[0][0].coordinate[1]} member_hide` : "member_hide"}*/}
                {/*    onClick={() => removeMember(member, 0, 0)}*/}
                {/*>*/}
                {/*    <div className='member-info'>*/}
                {/*        <div className='avatar'>*/}
                {/*            {arr[0] && arr[0][0] && voiceActivityMembers.get(`${arr[0][0].member.get("username")}@msg.hawkstream.com`) && <div className='first-layer'/>}*/}
                {/*            <div className='second-layer'/>*/}
                {/*            <div className='avatar-content'>*/}
                {/*                {arr[0] && arr[0][0] && this.avatarContent(arr[0][0].member)}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*        <div className='member-name'>*/}
                {/*            <span>{arr[0] && arr[0][0] && this.memberName(arr[0][0].member)}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
                {/*<div className={arr[0] && arr[0][1] ? `member member_${arr[0][1].coordinate[0]}_${arr[0][1].coordinate[1]}` : (prevArr[0] && prevArr[0][1]) ? `member member_${prevArr[0][1].coordinate[0]}_${prevArr[0][1].coordinate[1]} member_hide`: "member_hide"}*/}
                {/*     onClick={() => removeMember(member, 0, 1)}*/}
                {/*>*/}
                {/*    <div className='member-info'>*/}
                {/*        <div className='avatar'>*/}
                {/*            {arr[0] && arr[0][1] && voiceActivityMembers.get(`${arr[0][1].member.get("username")}@msg.hawkstream.com`) &&  <div className='first-layer'/>}*/}
                {/*            <div className='second-layer'/>*/}
                {/*            <div className='avatar-content'>*/}
                {/*                {arr[0] && arr[0][1] && this.avatarContent(arr[0][1].member)}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*        <div className='member-name'>*/}
                {/*            <span>{arr[0] && arr[0][1] && this.memberName(arr[0][1].member)}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
                {/*<div className={arr[1] && arr[1][0] ? `member member_${arr[1][0].coordinate[0]}_${arr[1][0].coordinate[1]}` : (prevArr[1] && prevArr[1][0]) ? `member member_${prevArr[1][0].coordinate[0]}_${prevArr[1][0].coordinate[1]} member_hide` : "member_hide"}*/}
                {/*     onClick={() => removeMember(member, 1, 0)}*/}
                {/*>*/}
                {/*    <div className='member-info'>*/}
                {/*        <div className='avatar'>*/}
                {/*            {arr[1] && arr[1][0] && voiceActivityMembers.get(`${arr[1][0].member.get("username")}@msg.hawkstream.com`) &&  <div className='first-layer'/>}*/}
                {/*            <div className='second-layer'/>*/}
                {/*            <div className='avatar-content'>*/}
                {/*                {arr[1] && arr[1][0] && this.avatarContent(arr[1][0].member)}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*        <div className='member-name'>*/}
                {/*            <span>{arr[1] && arr[1][0] && this.memberName(arr[1][0].member)}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
                {/*<div className={arr[1] && arr[1][1] ? `member member_${arr[1][1].coordinate[0]}_${arr[1][1].coordinate[1]}` : (prevArr[1] && prevArr[1][1]) ? `member member_${prevArr[1][1].coordinate[0]}_${prevArr[1][1].coordinate[1]} member_hide` : "member_hide"}*/}
                {/*     onClick={() => removeMember(member, 1, 1)}*/}
                {/*>*/}
                {/*    <div className='member-info'>*/}
                {/*        <div className='avatar'>*/}
                {/*            {arr[1] && arr[1][1] && voiceActivityMembers.get(`${arr[1][1].member.get("username")}@msg.hawkstream.com`) &&  <div className='first-layer'/>}*/}
                {/*            <div className='second-layer'/>*/}
                {/*            <div className='avatar-content'>*/}
                {/*                {arr[1] && arr[1][1] && this.avatarContent(arr[1][1].member)}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*        <div className='member-name'>*/}
                {/*            <span>{arr[1] && arr[1][1] && this.memberName(arr[1][1].member)}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        );
    }
}

export default MemberSection;
