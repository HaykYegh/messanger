"use strict";

import React, {Component} from 'react';

interface ISectionProps {
    member: any;
    localization: any;
    initialized: boolean;
    isNotCurrentUser: boolean;
    ownCall: boolean;
    isRevokeMember: boolean;
    cancel: () => void;
    sectionClassName: string;
    status: string;
}

interface ISectionState {
    avatarURL: string
}

class Section extends Component<ISectionProps, ISectionState> {

    constructor(props) {
        super(props);
        this.state = {
            avatarURL: ''
        }
    }

    componentDidMount(): void {
        const {member} = this.props;
        const avatarURL: string = member && member.get("avatar");
        if (avatarURL) {
            this.setState({avatarURL: URL.createObjectURL(avatarURL)});
        }
    }

    shouldComponentUpdate(nextProps: ISectionProps, nextState: ISectionState): boolean {

        if (this.props.initialized !== nextProps.initialized) {
            return true;
        }

        if (this.props.isRevokeMember !== nextProps.isRevokeMember) {
            return true;
        }

        if (this.props.isNotCurrentUser !== nextProps.isNotCurrentUser) {
            return true;
        }

        if (this.props.ownCall !== nextProps.ownCall) {
            return true;
        }

        if (this.props.status !== nextProps.status) {
            return true;
        }

        if (this.props.sectionClassName !== nextProps.sectionClassName) {
            return true;
        }

        return this.state.avatarURL !== nextState.avatarURL;
    }

    get avatarContent(): JSX.Element {
        const {member} = this.props;
        const {avatarURL} = this.state;
        const fistName: string = member.get("firstName");

        if (avatarURL) {
            return <img src={avatarURL} className="contact_img" alt=""/>;
        }

        if (fistName) {
            const avatarCharacter: string = member.get("avatarCharacter");
            return (
                <span
                    className="contact_icon"
                    style={{color: member.getIn(["color", "numberColor"])}}
                    data-line={avatarCharacter}
                >
                  <span>{avatarCharacter}</span>
                </span>
            )
        }

        return <span className="no-name_icon"/>;
    }

    get memberName(): string {
        const {member} = this.props;
        const fistName: string = member && member.get("firstName");
        const memberName: string = member && (fistName || member.get("lastName") ?
            member.get("name") : member.get("email") ? member.get("email") :
                `${!member.get("name").startsWith("0") ? "+" : ""}${member.get("name")}`);

        return memberName || '';
    }

    render(): JSX.Element {
        const {isNotCurrentUser, initialized, localization, status, cancel, isRevokeMember, ownCall, sectionClassName} = this.props;
        const {avatarURL} = this.state;

        const showStatus: boolean = !isRevokeMember && isNotCurrentUser && initialized;

        return (
            <div className={`section${sectionClassName}`}>

                {
                    avatarURL &&
                    <div
                        className='avatar-image'
                        style={{
                            backgroundImage: `url(${avatarURL})`
                        }}
                    />
                }

                <div className="member">
                    <div className='member-info'>
                        <div className='avatar'>
                            <div className='first-layer'/>
                            <div className='second-layer'/>
                            <div className='avatar-content'>
                                {this.avatarContent}
                            </div>
                        </div>
                        <div className='member-name'>
                            <span>{this.memberName}</span>
                        </div>
                    </div>
                    <div className='revoke-member'>
                        {
                            (ownCall && !isRevokeMember && isNotCurrentUser) ?
                                <span onClick={cancel}>{localization.cancel}</span> :
                                <span className='empty'>&nbsp;</span>
                        }
                    </div>

                    {
                        showStatus &&
                        <div className='status'>
                            <span>{localization[status]}</span>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default Section;
