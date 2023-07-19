import * as React from "react";
import * as Raven from 'raven-js';
import {connect, Store} from "react-redux";
import selector from "services/selector";
import {
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
    toggleMemberMuted, toggleUnMutePopup
} from "modules/conference/ConferenceActions";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import {ConfIntToParticipantId} from "modules/conference/ConfIntToParticipantId";
import components from "configs/localization";
import {
    UnMuteButtonsContent,
    UnMutePopupContent,
    UnMutePopupOvelay
} from "containers/chat-panel/conference/unMutePopupStyle";

export interface IConfUnMutePopupProps {
    toggleUnMutePopup?: (unMuteBool: boolean) => void,
    setConferenceProperty?: (propertyId: ConfPropertyId, value: string) => void;
    toggleMemberMuted?: (memberId: string, muted: boolean) => void;
    user?:any;
}

const selectorVariables: any = {
    user:true
};

class UnMutePopup extends React.Component<IConfUnMutePopupProps> {

    constructor(props: IConfUnMutePopupProps) {
        super(props);
    }

    render(): JSX.Element {
        const {toggleUnMutePopup, setConferenceProperty, toggleMemberMuted, user} = this.props
        const localization: any = components().callPanel

        return (
            <UnMutePopupOvelay>
                <UnMutePopupContent>
                    <h4>{localization.unMuteMicrophoneTitle}</h4>
                    <p>{localization.unMuteMicrophoneDesc}</p>
                    <UnMuteButtonsContent>
                        <button onClick={() => {
                            toggleMemberMuted(user.get("id"), true)
                            setConferenceProperty(ConfPropertyId.mute, "1")
                            toggleUnMutePopup(false)
                        }} >{localization.unMuteDecline}</button>
                        <button onClick={() => {
                            toggleMemberMuted(user.get("id"), false)
                            setConferenceProperty(ConfPropertyId.mute, "0")
                            toggleUnMutePopup(false)
                        }}>{localization.unMuteConfirm}</button>
                    </UnMuteButtonsContent>
                </UnMutePopupContent>
            </UnMutePopupOvelay>
        )
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    toggleUnMutePopup: (unMuteBool: boolean) => dispatch(toggleUnMutePopup(unMuteBool)),
    setConferenceProperty: (propertyId: ConfPropertyId, value: string) => dispatch(setConferenceProperty(propertyId, value)),
    toggleMemberMuted: (memberId: string, muted: boolean) => dispatch(toggleMemberMuted(memberId, muted)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UnMutePopup);
