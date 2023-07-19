import * as React from "react";
import selector from "services/selector";
import {connect} from "react-redux";
import {
    CarouselBtn,
    CarouselContainer,
    CarouselInner,
    CarouselSlideList,
    CarouselWrap
} from "containers/chat-panel/conference/CarouselSliderStyle";
import NextSvg from "../../../../assets/components/svg/conference/NextSvg";
import PrevSvg from "../../../../assets/components/svg/conference/PrevSvg";
import Log from "modules/messages/Log";
import {Map} from "immutable";
import CarouselSlideItem from "containers/chat-panel/conference/CarouselSliderItem";
import {isEqual} from "lodash";

const slideWidth = 220;

const sleep = (ms = 0) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

interface CCarProps {
    setConferenceCurrentMember?: (currentMember: string) => void;
    members?: any;
    pasiveMembers?: any;
    permittedStatuses?: any;
    userId?: string;
    statuses?: any;
    user?: any;
    contacts?: any;
    voiceActivityMembers?: Map<string, any>;
    addMember: (member: Map<string, any>) => void;
}

interface CCarState {
    items?: any;
    isTicking?: boolean;
    activeIdx?: number;
    activeIdxOpacity?: number;
    memberNumbers?: any;
    showSlider?: boolean;
    membersCount?: number;
}

const selectorVariables: any = {
    user: true,
    contacts: true
};

class ConferenceCarousel extends React.Component<CCarProps, CCarState> {
    content: any;
    overlay: any;
    constructor(props: CCarProps) {
        super(props);

        this.state = {
            items: props.pasiveMembers ? Array.from(Array(props.pasiveMembers.size).keys()) : [],
            isTicking: false,
            activeIdx: 0,
            activeIdxOpacity: 1,
            memberNumbers: [],
            showSlider: false,
            membersCount: props.pasiveMembers ? props.pasiveMembers.size : 0,
        }

        this.content = React.createRef()
        this.overlay = React.createRef()
    }

    prevClickState = (prev, jump, bigLength) => {
        return prev.map((_, i) => prev[(i + jump) % bigLength]);
    }

    nextClickState = (prev, jump, bigLength) => {
        Log.i("conference -> prev = ", this.state.items)
        return prev.map(
            (_, i) => prev[(i - jump + bigLength) % bigLength]
        );
    }

    prevClick = (jump = 1) => {
        if (!this.state.isTicking) {
            const self = this
            this.setState({
                isTicking: true,
                items: self.prevClickState(self.state.items, jump, self.state.items.length),
                activeIdxOpacity: 0
            })
        }
    };

    nextClick = (jump = 1) => {
        if (!this.state.isTicking) {
            const self = this
            this.setState({
                isTicking: true,
                items: self.nextClickState(self.state.items, jump, self.state.items.length),
            })
        }
    };

    handleDotClick = (idx) => {
        if (idx < this.state.activeIdx) {
            this.prevClick(this.state.activeIdx - idx);
        }
        if (idx > this.state.activeIdx) {
            this.nextClick(idx - this.state.activeIdx);
        }
    };

    getSliderContent(resize) {
        Log.i("conference -> props = ", this.props)
        const {members, permittedStatuses, statuses, setConferenceCurrentMember, pasiveMembers} = this.props

        if (pasiveMembers) {
            Log.i("conference -> pasiveMembers -> ", pasiveMembers)
            const arr = []
            const memberNumbers = []
            let sum = 0
            pasiveMembers.keySeq().toArray().map((item, index) => {
                const member = pasiveMembers?.get(item)
                if (!member) {
                    return
                }
                arr.push(sum)
                sum++
                memberNumbers.push(member?.get("username"))
            })
            if (this.overlay.current) {
                Log.i("conference -> slideWidth -> ", slideWidth)
                Log.i("conference -> memberNumbersLength -> ", memberNumbers.length)
                Log.i("conference -> clientWidth -> ", this.overlay.current.clientWidth)
                if (slideWidth*memberNumbers.length <= this.overlay.current.clientWidth) {
                    this.setState({showSlider: false, membersCount: sum})
                } else {
                    this.setState({showSlider: true, membersCount: sum})
                }
            }

            if (!resize) {
                Log.i("conference -> arr = ", arr)
                setConferenceCurrentMember(memberNumbers[0])
                this.setState({items: arr, memberNumbers})
            }
        }
    }

    componentDidMount() {
        (window as any).addEventListener("resize", this.getSliderContent.bind(this, true));
        this.getSliderContent(false)
    }

    componentDidUpdate(prevProps: Readonly<CCarProps>, prevState: Readonly<CCarState>, snapshot?: any) {
        if (this.state.isTicking && prevState.isTicking !== this.state.isTicking) {
            const {setConferenceCurrentMember, members, permittedStatuses, statuses} = this.props
            Log.i("conference -> setConferenceCurrentMember -> ", setConferenceCurrentMember)
            sleep(300).then(() => this.setState({
                isTicking: false,
                activeIdxOpacity: 1
            })).then(() => {
                Log.i("conference -> memberNumbers = ", this.state.memberNumbers)
            })
            sleep(200).then(() => this.setState({
                activeIdxOpacity: 1
            }))
        }

        if (!isEqual(prevState.items, this.state.items)) {
            const length = this.state.items.length
            this.setState({
                activeIdx: (length - (this.state.items[0] % length)) % length
            })
        }

        if (!isEqual(prevProps.statuses, this.props.statuses) || !isEqual(prevProps.pasiveMembers, this.props.pasiveMembers)) {
            this.getSliderContent(false)
        }
    }

    render(): JSX.Element {
        const {userId, user, voiceActivityMembers, addMember, pasiveMembers, members} = this.props
        Log.i("conference -> pasiveMembers www -> ", pasiveMembers)
        Log.i("conference -> members www -> ", members)


        return (
            <CarouselWrap>
                <CarouselInner>
                    {this.state.showSlider && this.state.activeIdx !== 0 && <CarouselBtn className="prev" onClick={() => this.prevClick()}>
                        <PrevSvg/>
                    </CarouselBtn>}
                    <CarouselContainer className={!this.state.showSlider ? "center" : ""} ref={this.overlay} >
                        <CarouselSlideList
                            ref={this.content}
                            style={{
                                width: slideWidth*this.state.items.length,
                            }}
                        >
                            {pasiveMembers && pasiveMembers.keySeq().toArray()
                                .map((item, i) => {
                                const member = members?.get(item)

                                return (
                                    <CarouselSlideItem
                                        key={i}
                                        idx={i}
                                        pos={this.state.showSlider ? this.state.items[i] : i}
                                        nextClick={() => this.nextClick(i - this.state.activeIdx)}
                                        activeIdx={this.state.activeIdx}
                                        voiceActivity={voiceActivityMembers?.get(item)}
                                        activeIdxOpacity={this.state.activeIdxOpacity}
                                        member={member}
                                        userId={userId}
                                        user={user}
                                        membersCount={this.state.membersCount}
                                        addMember={addMember}
                                    />
                                )
                            })}
                        </CarouselSlideList>
                    </CarouselContainer>
                    {this.state.showSlider && this.state.activeIdx !== this.state.items.length - 1 && <CarouselBtn className="next" onClick={() => this.nextClick()}>
                        <NextSvg/>
                    </CarouselBtn>}
                </CarouselInner>
            </CarouselWrap>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

export default connect(mapStateToProps, null)(ConferenceCarousel);
