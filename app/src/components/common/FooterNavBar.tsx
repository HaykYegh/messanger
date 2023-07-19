"use strict";

import {LEFT_PANELS} from "configs/constants";
import containers from "configs/localization";
import "scss/pages/left-panel/LeftFooter";
import classnames from "classnames";
const classNames = classnames;
import * as React from "react";

interface IFooterNavBarProps {
    changePanel: (menu: string) => void;
    newMessagesCount: number;
    selected: string;
}

export default function FooterNavBar({selected, changePanel, newMessagesCount}: IFooterNavBarProps): JSX.Element {
    const showSettings: any = () => changePanel(LEFT_PANELS.settings);
    const showContacts: any = () => changePanel(LEFT_PANELS.contacts);
    const showThreads: any = () => changePanel(LEFT_PANELS.threads);
    const showKeypad: any = () => changePanel(LEFT_PANELS.keypad);
    const localization: any = containers().footerNav;

    return (
        <div className="left_side_footer hidden">
            <span
                className={classNames({
                    "icon-messages_icon-active": [LEFT_PANELS.threads, LEFT_PANELS.create_group].includes(selected),
                    "icon-messages_icon cursor icon_footer": true,
                    "unread-messages": newMessagesCount > 0
                })}
                data-unread={newMessagesCount}
                title={localization.chats}
                onClick={showThreads}
            />
            <span
                className={classNames({
                    "icon-contacts_icon-active": [LEFT_PANELS.contacts, LEFT_PANELS.create_contact].includes(selected),
                    "icon-contacts_icon cursor icon_footer": true
                })}
                title={localization.contacts}
                onClick={showContacts}
            />
            <span
                className={classNames({
                    "icon-keypad_icon-active": selected === LEFT_PANELS.keypad,
                    "icon-keypad_icon cursor icon_footer": true
                })}
                title={localization.keypad}
                onClick={showKeypad}
            />
            <span
                className={classNames({
                    "icon-settings_icon-active": [
                        LEFT_PANELS.settings, LEFT_PANELS.my_stickers, LEFT_PANELS.sticker, LEFT_PANELS.blocked, LEFT_PANELS.chat_settings, LEFT_PANELS.privacy,
                        LEFT_PANELS.add_credit, LEFT_PANELS.notifications, LEFT_PANELS.sticker_store, LEFT_PANELS.why_us, LEFT_PANELS.system_language, LEFT_PANELS.profile_settings
                    ].includes(selected),
                    "icon-settings_icon cursor icon_footer": true
                })}
                title={localization.settings}
                onClick={showSettings}
            />
        </div>
    );
};
