"use strict";

import React, {Component} from 'react';
import {Map} from "immutable";
import {AMMutedIcon, HoldDiv, NoMember} from "components/conference/ConferenceStyle";
import UnmuteSvg from "../../../assets/components/svg/conference/UnmuteSvg";

interface IActiveMemberProps {
    member: any;
    voiceActivityMembers: any;
    arr: any;
    prevArr: any;
    removeMember: (member: Map<string, any>, index1: number, index2: number) => void;
    members: Map<string, any>;
    index1: number;
    index2: number;
    minimized: boolean;
    expanded: boolean;
}

interface IActiveMemberState {

}

class ActiveMember extends Component<IActiveMemberProps, IActiveMemberState> {

    constructor(props) {
        super(props);
    }


    avatarContent(member): JSX.Element {
        const {members} = this.props;
        const fistName: string = member.get("firstName");
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
        const fistName: string = member && member.get("firstName");
        const memberName: string = member && (fistName || member.get("lastName") ?
            member.get("name") : member.get("email") ? member.get("email") :
                `${!member.get("name")?.startsWith("0") ? "+" : ""}${member.get("name")}`);

        return memberName || '';
    }

    render(): JSX.Element {
        const {member, voiceActivityMembers, removeMember, arr, index1, index2, prevArr, minimized, expanded} = this.props;

        return (
            <div className={arr[index1] && arr[index1][index2] ? `member member_${arr[index1][index2].coordinate[0]}_${arr[index1][index2].coordinate[1]}` : (prevArr[index1] && prevArr[index1][index2]) ? `member member_${prevArr[index1][index2].coordinate[0]}_${prevArr[index1][index2].coordinate[1]} member_hide` : "member_hide"}
                 onClick={() => removeMember(member, index1, index2)}
            >
                <div className={`${minimized ? 'member-info member-info-minimized' : 'member-info'}`}>
                    <div className='avatar'>
                        {arr[index1] && arr[index1][index2] && voiceActivityMembers.get(`${arr[index1][index2].member.get("username")}@msg.hawkstream.com`) && <div className={`${minimized ? 'first-layer first-layer-minimized' : 'first-layer'}`}/>}
                        <div className={`${minimized ? 'second-layer second-layer-minimized' : 'second-layer'}`}/>
                        <div className={`${minimized ? 'avatar-content avatar-content-minimized' : 'avatar-content'}`}>
                            {arr[index1] && arr[index1][index2] && this.avatarContent(arr[index1][index2].member)}
                        </div>
                    </div>
                    {(!minimized || expanded) && <div className='member-name'>
                        <span>{arr[index1] && arr[index1][index2] && this.memberName(arr[index1][index2].member)}</span>
                    </div>}
                </div>
            </div>
        );
    }
}

export default ActiveMember;
