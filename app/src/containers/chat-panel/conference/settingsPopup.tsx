import * as React from "react";
import * as Raven from 'raven-js';
import {connect, Store} from "react-redux";
import selector from "services/selector";
import {
    CallStatusMembers,
    ConferenceOptionsBody,
    ConferenceOptionsContainer, ConferenceOptionsContBlock,
    ConferenceOptionsContent, ConferenceOptionsFooter,
    ConferenceOptionsHeader,
    ConferenceOptionsMemberContent, ConferenceOptionsOvelay, ConferenceSearch, ConferenceTextBlock, FooterItem,
    HeaderItem,
    MemberContentInfo,
    TextBlock, UserInfo, UserName
} from "containers/chat-panel/conference/settingsPopupStyle";
import InputSelectable from "components/common/popups/conversation/InputSelectable";
import EnterGroupDetails from "components/common/popups/conversation/EnterGroupDetails";
import Contact from "components/common/popups/conversation/Contact";
import {IContact} from "modules/contacts/ContactsReducer";
import {AvatarSize} from "components/contacts/style";
import Avatar from "components/contacts/Avatar";
import Search from "containers/sidebars/ContactsSidebar/Search";
import MuteSvg from "../../../../assets/components/svg/conference/MuteSvg";
import UnmuteSvg from "../../../../assets/components/svg/conference/UnmuteSvg";
import ContactsForConference from "containers/chat-panel/conference/ContactsForConference";
import Log from "modules/messages/Log";
import {
    addAllMembersMuted, intToParticipant,
    removeAllMembersMuted, setConferenceProperty,
    toggleAddMembersPopup,
    toggleMemberMuted, toggleUnMuteLoading
} from "modules/conference/ConferenceActions";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import {ConfIntToParticipantId} from "modules/conference/ConfIntToParticipantId";
import {CALL_STATUSES, CONFERENCE_CALL_MEMBERS_COUNT, CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM} from "configs/constants";
import components from "configs/localization";
import {updateConversationProps} from "modules/conversations/ConversationsActions";

export interface IConfSettingsProps {
    conferenceDetails: any;
    user?: any;
    toggleSettingsPopup: (settingsPopup: boolean) => void;
    toggleAddMembersPopup?: (addMembersPopup: boolean) => void;
    toggleMemberMuted?: (memberId: string, muted: boolean) => void;
    updateConversationProps?: (groupId: string, props: any) => void;
    setConferenceProperty?: (propertyId: ConfPropertyId, value: string) => void;
    intToParticipant?: (rawValue: number, memberNumber: string) => void;
    addAllMembersMuted?: (members: any) => void;
    removeAllMembersMuted?: (members: any) => void;
    toggleUnMuteLoading?: (memberId:string, unMuteBool: boolean) => void;
    conversations?: any;
}

interface IConfSettingsState {
    searchValue: string;
}

const selectorVariables: any = {
    conferenceDetails: true,
    user: true
};

class ConferenceSettings extends React.Component<IConfSettingsProps, IConfSettingsState> {

    audio: HTMLAudioElement;

    notificationAudio: HTMLAudioElement;
    private readonly contentEl: React.RefObject<HTMLDivElement>;

    constructor(props: IConfSettingsProps) {
        super(props);

        this.state = {
            searchValue: ""
        }
    }
    get membersArray(): any {
        const {conferenceDetails, conversations} = this.props
        const {searchValue} = this.state
        const groupId: string = conferenceDetails.getIn(["info", "threadId"]);
        const groupInfo = conversations.getIn([groupId, "threads"])
        const threadInfo: any = groupInfo.get("threadInfo")

        Log.i("conference -> membersArray -> threadInfo = ", threadInfo)

        return threadInfo
                            .get("statusMap")
                            .keySeq()
                            .toArray()
                            .filter(el => {
                                const member = threadInfo.getIn(["joinedList", el])
                                const status = threadInfo.getIn(["statusMap", el])

                                if (status !== CALL_STATUSES.calling && status !== CALL_STATUSES.join) {
                                    return false
                                }

                                if (!searchValue) {
                                    return true
                                }
                                if (member.get("firstName").includes(searchValue)) {
                                    return true
                                }
                                if (member.get("lastName").includes(searchValue)) {
                                    return true
                                }
                                if (member.get("username").includes(searchValue)) {
                                    return true
                                }
                                return false
                            })
    }

    get notInCallMembersArray(): any {
        const {conferenceDetails, conversations} = this.props
        const {searchValue} = this.state
        const groupId: string = conferenceDetails.getIn(["info", "threadId"]);
        const groupInfo = conversations.getIn([groupId, "threads"])
        const threadInfo: any = groupInfo.get("threadInfo")
        return threadInfo
            .get("statusMap")
            .keySeq()
            .toArray()
            .filter(el => {
                const member = threadInfo.getIn(["joinedList", el])
                const status = threadInfo.getIn(["statusMap", el])

                if (status !== CALL_STATUSES.decline) {
                    return false
                }

                if (!searchValue) {
                    return true
                }
                if (member.get("firstName").includes(searchValue)) {
                    return true
                }
                if (member.get("lastName").includes(searchValue)) {
                    return true
                }
                if (member.get("username").includes(searchValue)) {
                    return true
                }
                return false
            })
    }

    get bool(): boolean {
        const {conferenceDetails, user} = this.props
        return conferenceDetails.get("memberId") === user.get("id") ||
            !conferenceDetails.get("memberId") ||
            user.get("id").includes(conferenceDetails.get("initiator"))
    }

    render(): JSX.Element {
        const {toggleSettingsPopup, toggleAddMembersPopup, conferenceDetails, toggleMemberMuted, updateConversationProps, setConferenceProperty, intToParticipant, user, toggleUnMuteLoading, conversations} = this.props
        const {searchValue} = this.state
        const localization: any = components().conferencePanel;
        const C_Count = user.get("premium") === "true" ? CONFERENCE_CALL_MEMBERS_COUNT_PREMIUM : CONFERENCE_CALL_MEMBERS_COUNT

        return (
            <ConferenceOptionsOvelay onClick={() => {
                toggleSettingsPopup(!conferenceDetails.get("settingsPopup"))
            }}>
                <ConferenceOptionsContent>
                    <ConferenceOptionsContainer onClick={(e) => {
                        e.stopPropagation();
                    }}>
                        <ConferenceTextBlock>
                            <ConferenceOptionsHeader>
                                <HeaderItem>
                                    <button onClick={() => {
                                        toggleSettingsPopup(!conferenceDetails.get("settingsPopup"))
                                    }}>Cancel</button>
                                </HeaderItem>
                                <HeaderItem className="middle">
                                    <h2>Members:</h2>
                                    <span>{this.membersArray.length}/{C_Count}</span>
                                </HeaderItem>
                                {user.get("premium") !== "true" && <HeaderItem>
                                    <button disabled={user.get("premium") !== "true"} onClick={() => {
                                        toggleAddMembersPopup(!conferenceDetails.get("addMembersPopup"))
                                    }}>Add
                                    </button>
                                </HeaderItem>}
                            </ConferenceOptionsHeader>
                            <Search
                                value={searchValue}
                                handleClearButtonClick={() => this.setState({
                                    searchValue: ""
                                })}
                                handleInputChange={(value) => this.setState({
                                    searchValue: value
                                })}
                            />
                        </ConferenceTextBlock>
                        <ConferenceOptionsBody>
                            <ConferenceOptionsContBlock>
                                {/*{!!this.membersArray.length && <CallStatusMembers>{localization.inCall}</CallStatusMembers>}*/}
                                {this.membersArray.map(item => {
                                    const groupId: string = conferenceDetails.getIn(["info", "threadId"]);
                                    const groupInfo = conversations.getIn([groupId, "threads"])
                                    const threadInfo: any = groupInfo.get("threadInfo")
                                    const member = threadInfo.getIn(["joinedList", item])
                                    const joinedList = threadInfo.get("joinedList").toJS()
                                    if (!member) {
                                        return null
                                    }
                                    const image: any = {
                                        url: member.avatarUrl,
                                        file: member.avatar,
                                    };
                                    Log.i("conferenceDetails -> item = ", conferenceDetails.getIn(["members", item]))
                                    return (
                                        <ConferenceOptionsMemberContent key={item}>
                                            <AvatarSize margin="0 12px 0 0">
                                                <Avatar
                                                    image={image}
                                                    color={member.getIn(["color", "numberColor"])}
                                                    avatarCharacter={member.get("avatarCharacter")}
                                                    name={member.get("firstName")}
                                                    avatarBlobUrl={member.get("avatarBlobUrl")}
                                                />
                                            </AvatarSize>
                                            <MemberContentInfo>
                                                <TextBlock>
                                                    <UserName>
                                                        {(!member.get("firstName") && !member.get("lastName")) ? member.get("username") : `${member.get("firstName")} ${member.get("lastName")}`}
                                                    </UserName>
                                                    <UserInfo>
                                                        {conferenceDetails.get("initiator") === member.get("username") ? "In Call (Host)" : "In Call"}
                                                    </UserInfo>
                                                </TextBlock>
                                                <div>
                                                    {(this.bool || item === user.get("id")) && <button
                                                        onClick={() => {
                                                            if(member.get("username") === user.get("username")) {
                                                                // toggleMemberMuted(item, !member.get("muted"))
                                                                joinedList[item].muted = !joinedList[item].muted
                                                                updateConversationProps(groupId, {joinedList})
                                                                setConferenceProperty(ConfPropertyId.mute, member.get("muted") ? "0" : "1")
                                                            } else {
                                                                if (member.get("muted")) {
                                                                    intToParticipant(ConfIntToParticipantId.unMute, member.get("username"))
                                                                    joinedList[item].unMuteLoader = !joinedList[item].unMuteLoader
                                                                    updateConversationProps(groupId, {joinedList})
                                                                    // toggleUnMuteLoading(item, !member.get("unMuteLoader"))
                                                                } else {
                                                                    intToParticipant(ConfIntToParticipantId.mute, member.get("username"))
                                                                }
                                                            }
                                                        }}
                                                        // onClick={() => setConferenceProperty(ConfPropertyId.mute, member.get("muted") ? "1" : "0")}
                                                        style={{marginRight: "5px"}}
                                                    >
                                                        {joinedList[item].unMuteLoader && <div
                                                            style={{
                                                                position: "absolute",
                                                                top: "11px",
                                                                right: "27px"
                                                            }}
                                                            className="loader-item">
                                                            <div className="circular-loader">
                                                                <div className="loader-item-stroke">
                                                                    <div className="loader-item-stroke-left"/>
                                                                    <div className="loader-item-stroke-right"/>
                                                                </div>
                                                            </div>
                                                        </div>}
                                                        {member.get("muted") ? <UnmuteSvg/> : <MuteSvg/>}
                                                    </button>}
                                                </div>
                                            </MemberContentInfo>
                                        </ConferenceOptionsMemberContent>
                                    )
                                })}
                            </ConferenceOptionsContBlock>
                        </ConferenceOptionsBody>
                        {this.bool && <ConferenceOptionsFooter>
                            <FooterItem>
                                <button
                                    onClick={() => {
                                        setConferenceProperty(ConfPropertyId.muteAll, "1")
                                    }}
                                >
                                    {localization.muteAll}
                                </button>
                            </FooterItem>
                            <FooterItem>
                                <button
                                    onClick={() => {
                                        setConferenceProperty(ConfPropertyId.muteAll, "0")
                                    }}
                                >
                                    {localization.unmuteAll}
                                </button>
                            </FooterItem>
                        </ConferenceOptionsFooter>}
                        {conferenceDetails.get("addMembersPopup") && <ContactsForConference/>}
                    </ConferenceOptionsContainer>
                </ConferenceOptionsContent>
            </ConferenceOptionsOvelay>
        )
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    toggleMemberMuted: (memberId: string, muted: boolean) => dispatch(toggleMemberMuted(memberId, muted)),
    updateConversationProps: (groupId: string, props: any) => dispatch(updateConversationProps(groupId, props)),
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => dispatch(setConferenceProperty(propertyId, value)),
    intToParticipant: (rawValue: number, memberNumber: string) => dispatch(intToParticipant(rawValue, memberNumber)),
    addAllMembersMuted: (members: any) => dispatch(addAllMembersMuted(members)),
    removeAllMembersMuted: (members: any) => dispatch(removeAllMembersMuted(members)),
    toggleUnMuteLoading: (memberId:string, unMuteBool: boolean) => dispatch(toggleUnMuteLoading(memberId, unMuteBool)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConferenceSettings);
