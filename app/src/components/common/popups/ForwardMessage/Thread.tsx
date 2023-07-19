import * as React from "react";
import isEqual from "lodash/isEqual";

import Avatar from "components/contacts/Avatar";
import {AvatarSize} from "components/contacts/style";
import components from "configs/localization";
import {getThreadType} from "helpers/DataHelper";
import Log from "modules/messages/Log";
import {APPLICATION} from "configs/constants";
import {phoneMask} from "helpers/UIHelper";


interface IThreadProps {
    thread: any;
    isSelected?: boolean;
    onSelect?: (username: string) => void;
    blockedContactIds: any[];
    handleShowUnblockContactPopup: (contactId: string) => void;
}

interface IThreadState {


}

export default class Thread extends React.Component<IThreadProps, IThreadState> {
    constructor(props) {
        super(props);
        this.state = {};
    }


    shouldComponentUpdate(nextProps: Readonly<IThreadProps>, nextState: Readonly<IThreadState>, nextContext: any): boolean {

        if (!isEqual(nextProps.thread, this.props.thread)) {
            return true
        }

        if (this.props.blockedContactIds.length !== nextProps.blockedContactIds.length) {
            return true
        }

        return !isEqual(nextProps.isSelected, this.props.isSelected);


    }

    handleContactClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        const {isSelected, onSelect, thread, blockedContactIds, handleShowUnblockContactPopup} = this.props;

        const isBlocked = blockedContactIds.some(element => element.contactId === thread.contactId);

        if (isBlocked) {
            handleShowUnblockContactPopup(thread.contactId);
            return
        }

        if (typeof isSelected !== 'undefined' && typeof onSelect === 'function' && !isBlocked) {
            const username: string = thread.username || thread.name;
            onSelect(username);
        }
    };

    render() {
        const {thread, isSelected = false, blockedContactIds} = this.props;
        const contactId: string = thread.contactId;
        const blockedLocalization: any = components().blockedPopUp;
        const threadImage: any = {
            url: thread.avatarUrl,
            file: thread.avatar,
        };
        const isBlocked: boolean = blockedContactIds.some(contact => contact.contactId === contactId);
        const username = thread.isGroup ? thread.name : `+${thread.phone}`;
        const isGroup = thread.isGroup
        return (
            <div onClick={this.handleContactClick} data-value={username} className="contact">
                <div className="contact-block">
                    <AvatarSize margin="0 12px 0 0">
                        <Avatar
                            image={threadImage}
                            color={thread.color ? thread.color.numberColor : ""}
                            status={thread.status}
                            avatarCharacter={thread.avatarCharacter}
                            name={thread.isGroup ? thread.name : thread.firstName}
                            meta={{threadId: contactId}}
                            avatarBlobUrl={thread.avatarBlobUrl}
                        />
                    </AvatarSize>
                    <div className="contact-content">

                        <div className="text-block">

                            <div className="user-name"
                                 style={{display: !thread.firstName && !thread.lastName ? "none" : "block"}}>{thread.firstName} {thread.lastName} </div>
                            <div className="contact_name-info">
                                {isGroup && <span className="group-icon"/>}
                                <div className={`user-info ${isGroup ? "no-name" : ""}`}>
                                    {APPLICATION.WITHEMAIL ? (thread.email || phoneMask(username)) : phoneMask(username)}</div>
                            </div>

                        </div>
                        {
                            isBlocked ?
                                <div className="blocked-Contact">
                                    <div className="blocked-info">
                                        {blockedLocalization.blockedContact}
                                    </div>
                                    <div className="blocked-description">
                                        {blockedLocalization.unblockContact}
                                    </div>
                                </div>
                                :
                                <div className={`select ${isSelected ? "isSelected" : ""}`}/>
                        }
                    </div>

                </div>
            </div>
        );
    }
};
