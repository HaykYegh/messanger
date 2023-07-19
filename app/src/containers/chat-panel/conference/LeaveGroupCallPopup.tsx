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
import {
    EndGroupCallContent, LeaveCallCancelContent,
    LeaveCallDescriptionForInitiatorContent, LeaveCallPopup,
    LeaveCallPopupContent, LeaveCallPopupM,
    LeaveGroupCallContent
} from "components/conference/ContentStyle";

export interface ILeaveGroupCallProps {
    leave: () => void;
    toggleLeaveGroupCallPopup: (leaveGroupCallPopup: boolean) => void;
    toggleInitiatorPopup?: (initiatorPopup: boolean) => void;
}

interface ILeaveGroupCallState {

}

const selectorVariables: any = {

};

class LeaveGroupCallPopup extends React.Component<ILeaveGroupCallProps, ILeaveGroupCallState> {

    audio: HTMLAudioElement;

    notificationAudio: HTMLAudioElement;
    private readonly contentEl: React.RefObject<HTMLDivElement>;

    constructor(props: ILeaveGroupCallProps) {
        super(props);


    }



    render(): JSX.Element {
        const {leave, toggleLeaveGroupCallPopup, toggleInitiatorPopup} = this.props

        const localization: any = components().conferencePanel;

        return (
            <ConferenceOptionsOvelay>
                <LeaveCallPopupM>
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
                </LeaveCallPopupM>
            </ConferenceOptionsOvelay>
        )
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);



export default connect(mapStateToProps, null)(LeaveGroupCallPopup);
