import * as React from "react";
import {connect} from "react-redux";
import selector from "services/selector";
import {IContact} from "modules/contacts/ContactsReducer";
import {acceptCall, declineCall, sendHangUp, TOGGLE_IGNORE, toggleMic} from "modules/call/CallActions";
import {CALL_STATUSES} from "configs/constants";
import Avatar from "components/contacts/Avatar";
import {getName} from "helpers/DataHelper";
import conf from "configs/configurations";

import {ContactInfo, ContactListBlock, ContactName} from "containers/sidebars/ContactsSidebar/style";
import {AvatarSize, CallActions} from "components/contacts/style";
import "scss/pages/left-panel/ContactBlock";
import Log from "modules/messages/Log";

interface IContactBlockProps {
    fetchThread: (threadId: string) => void;
    contact: IContact;
    active: boolean;
    lastCall?: any;
    conversations?: any;
    toggleMic?: (id: string, mic: boolean) => void;
    sendHangUp?: (id: string, to: string, outCall: boolean) => void;
    declineCall?: (id: string, to: string) => void;
    toggleIgnore?: (id: string, ignored?: boolean, isVideo?: boolean) => void;
}

const ContactBlock = (props: IContactBlockProps): JSX.Element => {
    const {contact, active, fetchThread, lastCall, toggleMic, sendHangUp, toggleIgnore, declineCall} = props;

    if(!contact) {
        return null
    }

    const contactId: string = contact && contact.get("contactId");
    const name: string = getName(contact);
    const isOwnCall: boolean = lastCall && lastCall.get('ownCall');
    const isCallIgnored: boolean = lastCall && lastCall.getIn(['showInThread', 'ignored']);
    const isCallStarted: boolean = lastCall && (contactId === lastCall.get('receiver') ||
        contactId === lastCall.get('caller'));
    const isAnswering: boolean = lastCall && lastCall.get('status') === CALL_STATUSES.answering;
    const isMyContact = contact && lastCall && contact?.get('contactId') === lastCall?.get('caller');

    const handleThreadFetch = (e: React.MouseEvent<HTMLLIElement>): void => {
        const threadId: string = e.currentTarget.getAttribute('data-thread-id');
        fetchThread(threadId);
    };

    const handleAcceptCall = (isVideo: boolean = false): void => {
        lastCall && toggleIgnore(lastCall.get("id"), false, isVideo);
    };

    const handleDeclineCall = (): void => {
        lastCall && declineCall(lastCall.get("id"), lastCall.get("to"));
    };

    const handleToggleMic = (): void => {
        lastCall && toggleMic(lastCall.get("id"), lastCall.get('mic'));
    };

    const hangUp = (): void => {
        lastCall && sendHangUp(lastCall.get("id"), lastCall.get("to"), false);
    };

    return (
        <div>
            <ContactListBlock
                onClick={handleThreadFetch}
                data-thread-id={contactId}
                active={active}
            >
                <AvatarSize>
                    <Avatar
                        image={{
                            url: contact.get("avatarUrl"),
                            file: contact.get("avatar"),
                        }}
                        color={contact.getIn(["color", "numberColor"])}
                        status={contact.get("status")}
                        avatarCharacter={contact.get("avatarCharacter")}
                        name={contact.get("firstName")}
                        meta={{threadId: contactId}}
                        avatarBlobUrl={contact.get("avatarBlobUrl")}
                    />
                </AvatarSize>
                <ContactInfo>
                    <ContactName>{name}</ContactName>
                    {contact.get("isProductContact") && <span className="product-contact hidden">{conf.app.name}</span>}

                    {(isCallStarted && !isMyContact) && <CallActions>
                        {((isOwnCall) || (!isCallIgnored && isAnswering)) && <React.Fragment>
                            <span
                                className={`icon-call-actions icon-microphone ${lastCall.get('mic') ? ' on' : ' off'}`}
                                onClick={handleToggleMic}/>
                            <span className="icon-call-actions icon-end-call" onClick={hangUp}/>
                        </React.Fragment>}

                        {!isOwnCall && isCallIgnored && <React.Fragment>
                            <span className="icon-call-actions icon-end-call" onClick={handleDeclineCall}/>
                            <span className="icon-call-actions icon-video-call" onClick={() => handleAcceptCall(true)}/>
                            <span className="icon-call-actions icon-accept-call"
                                  onClick={() => handleAcceptCall(false)}/>
                        </React.Fragment>}
                    </CallActions>}
                </ContactInfo>
            </ContactListBlock>
        </div>
    );
};

const mapStateToProps: any = state => selector(state);

const mapDispatchToProps: any = (dispatch) => ({
    toggleMic: (id, mic) => dispatch(toggleMic(id, mic)),
    sendHangUp: (id, to, outCall) => dispatch(sendHangUp(id, to, outCall)),
    acceptCall: (id, to, sdp) => dispatch(acceptCall(id, to, sdp)),
    declineCall: (id, to, outCall) => dispatch(declineCall(id, to, outCall)),
    toggleIgnore: (id: string, ignored?: boolean, isVideo?: boolean) => dispatch(TOGGLE_IGNORE(id, ignored, isVideo)),
});

export default connect<{}, {}, IContactBlockProps>(mapStateToProps, mapDispatchToProps)(ContactBlock);
