"use strict";

import * as React from "react";

interface ITypingBubbleProps {
    avatarCharacter: string;
    hideAvatar: boolean;
    avatarUrl: any;
    avatarStyle: any;
    color: any;
}

export default function TypingBubble({color, hideAvatar, avatarCharacter, avatarStyle, avatarUrl}: ITypingBubbleProps): JSX.Element {

    return (
        <div className={`guest_msg_box message_container${hideAvatar ? " guest_notfirst_msg" : ""}`}>
            <span
                data-character={!avatarUrl ? avatarCharacter : ""}
                className="message_avatar contact_icon_color1"
                style={avatarStyle}
            />
            <div className="guest_bubble typing_bubble bubble">
                <span className="type-ico"/>
                <span className="type-ico"/>
                <span className="type-ico"/>
            </div>
        </div>
    );
};
