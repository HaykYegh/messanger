import {Map} from "immutable";
import * as React from "react";
import {
    CarouselSlideItemImgLink, CarouselSlideItemName,
    CarouselSlideItemTag,
    CarouselSlideItemVoiceActivity
} from "containers/chat-panel/conference/CarouselSliderStyle";
import UnmuteSvg from "../../../../assets/components/svg/conference/UnmuteSvg";
import MuteSvg from "../../../../assets/components/svg/conference/MuteSvg";
import {HoldDiv, PMHoldDiv} from "components/conference/ConferenceStyle";

const slideWidth = 220;

interface CSItemProps {
    pos?: number;
    idx?: number;
    activeIdx?: any;
    activeIdxOpacity?: number;
    nextClick?: (jump: number) => void;
    member?: any;
    voiceActivity?: any;
    userId?: string;
    user?: any;
    membersCount?: number;
    addMember: (member: Map<string, any>) => void;
}

interface CSItemState {
    item?: any;
}

class CarouselSlideItem extends React.Component<CSItemProps, CSItemState> {
    constructor(props: CSItemProps) {
        super(props);

        this.state = {
            item: {},
        }
    }

    componentDidMount() {
        const {pos, idx} = this.props

        const item = this.createItem(pos, idx);
        this.setState({item})
    }

    componentDidUpdate(prevProps: Readonly<CSItemProps>, prevState: Readonly<CSItemState>, snapshot?: any) {
        const {pos, idx} = this.props
        if (pos !== prevProps.pos) {
            const item = this.createItem(pos, idx);
            this.setState({item})
        }
    }

    createItem(position, idx) {
        const item = {
            styles: {
                transform: `translateX(${position * slideWidth}px)`,
                activeIdxOpacity: 1,
                transition: idx === this.props.membersCount ? "all 0.3s" : "all 0s",
                // filter: '',
                // opacity: 0
            },
        };

        switch (position) {
            // case length - 1:
            case length:
            case length + 1:
                item.styles = {
                    ...item.styles,
                    // filter: 'grayscale(1)'
                };
                break;
            case length:
                break;
            default:
                item.styles = {
                    ...item.styles,
                    // opacity: 0
                };
                break;
        }

        return item;
    };

    render () {
        const {pos, idx, activeIdx, activeIdxOpacity, nextClick, member, userId, user, voiceActivity, addMember} = this.props
        const {item} = this.state

        if(!member) {
            return null
        }

        const memberName = (): string => {
            const fistName: string = member && member.get("firstName");
            const memberName: string = member && (fistName || member.get("lastName") ?
                member.get("name") : member.get("email") ? member.get("email") :
                    `${!member.get("name").startsWith("0") ? "+" : ""}${member.get("name")}`);

            return memberName || ''
        }

        const userAvatar = userId.includes(member.get("username")) ? user.get("avatarBlobUrl") : member.get("avatarBlobUrl")

        return (
            <CarouselSlideItemTag
                style={item.styles}>
                {voiceActivity && <CarouselSlideItemVoiceActivity
                    className={"voiceActiveMember"} />}
                <CarouselSlideItemImgLink
                    style={{
                        // border: idx === activeIdx ? "2.95385px solid #259FE6" : "unset",
                        opacity: idx === activeIdx ? activeIdxOpacity : 1,
                    }}
                >
                    {member.get("hold") && <PMHoldDiv>
                        <span>Hold</span>
                    </PMHoldDiv>}
                    {userAvatar ?
                        <img src={userAvatar} alt=""/>
                        :
                        <span>
                            {member.get("avatarCharacter").toUpperCase()}
                        </span>
                    }
                    <CarouselSlideItemName>
                    <span>
                        {member.get("muted") ? <UnmuteSvg /> : <MuteSvg />}
                    </span>
                        <span>
                        {memberName()}
                    </span>
                    </CarouselSlideItemName>
                </CarouselSlideItemImgLink>
            </CarouselSlideItemTag>
        );
    }
};

export default CarouselSlideItem;
