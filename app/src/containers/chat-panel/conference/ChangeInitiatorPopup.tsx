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
import {CALL_STATUSES} from "configs/constants";
import components from "configs/localization";

export interface IConfSettingsProps {
    conferenceDetails: any;
    user?: any;
    toggleSettingsPopup: (settingsPopup: boolean) => void;
    toggleAddMembersPopup: (addMembersPopup: boolean) => void;
    toggleMemberMuted?: (memberId: string, muted: boolean) => void;
    toggleInitiatorPopup: (initiatorPopup: boolean) => void;
    setConferenceProperty?: (propertyId: ConfPropertyId, value: string) => void;
    intToParticipant?: (rawValue: number, memberNumber: string) => void;
    addAllMembersMuted?: (members: any) => void;
    removeAllMembersMuted?: (members: any) => void;
    toggleUnMuteLoading?: (memberId:string, unMuteBool: boolean) => void;
    changeInitiatorAccess: (groupId: string, member: string) => void;
}

interface IConfSettingsState {
    searchValue: string;
}

const selectorVariables: any = {
    conferenceDetails: true,
    user: true
};

class ChangeInitiator extends React.Component<IConfSettingsProps, IConfSettingsState> {

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
        const {conferenceDetails, user} = this.props
        const {searchValue} = this.state
        return conferenceDetails
            .get("statuses")
            .keySeq()
            .toArray()
            .filter(el => {
                const member = conferenceDetails.getIn(["members", el])
                const status = conferenceDetails.getIn(["statuses", el])

                // if (status !== CALL_STATUSES.calling && status !== CALL_STATUSES.join) {
                //     return false
                // }

                if (user.get("id").includes(member.get("username"))) {
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
        const {toggleSettingsPopup, toggleAddMembersPopup, conferenceDetails,
            toggleMemberMuted,
            setConferenceProperty, intToParticipant, user, toggleUnMuteLoading,
            toggleInitiatorPopup, changeInitiatorAccess} = this.props
        const {searchValue} = this.state
        const localization: any = components().conferencePanel;

        return (
            <ConferenceOptionsOvelay>
                <ConferenceOptionsContent>
                    <ConferenceOptionsContainer>
                        <ConferenceTextBlock>
                            <ConferenceOptionsHeader>
                                <HeaderItem className="middle">
                                    <h2>Members:</h2>
                                    <span>{`${this.membersArray.length} / 10000`}</span>
                                </HeaderItem>
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
                                {this.membersArray.map(item => {
                                    const member = conferenceDetails.getIn(["members", item])
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
                                            <MemberContentInfo
                                                onClick={() => {
                                                    changeInitiatorAccess(conferenceDetails.getIn(["info", "threadId"]), member.get("username"))
                                                }}
                                            >
                                                <TextBlock>
                                                    <UserName>
                                                        {(!member.get("firstName") && !member.get("lastName")) ? member.get("username") : `${member.get("firstName")} ${member.get("lastName")}`}
                                                    </UserName>
                                                    <UserInfo>
                                                        {conferenceDetails.get("initiator") === member.get("username") ? "In Call (Host)" : "In Call"}
                                                    </UserInfo>
                                                </TextBlock>
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
                                        toggleInitiatorPopup(false)
                                    }}
                                >
                                    {localization.cancel}
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
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => dispatch(setConferenceProperty(propertyId, value)),
    intToParticipant: (rawValue: number, memberNumber: string) => dispatch(intToParticipant(rawValue, memberNumber)),
    addAllMembersMuted: (members: any) => dispatch(addAllMembersMuted(members)),
    removeAllMembersMuted: (members: any) => dispatch(removeAllMembersMuted(members)),
    toggleUnMuteLoading: (memberId:string, unMuteBool: boolean) => dispatch(toggleUnMuteLoading(memberId, unMuteBool)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChangeInitiator);
