"use strict";

import * as React from "react";

import components from "configs/localization";

import "scss/pages/Header";
import {ICurrentThread} from "modules/application/ApplicationTypes";
import {getThreadType} from "helpers/DataHelper";
import CallSvg from "../../assets/components/svg/CallSvg";

interface IHeaderContainerButtonsState {

}

interface IHeaderContainerButtonsProps {
    currentThread: ICurrentThread;
    userId: string;
    userName: string;
}

export default class HeaderContainerButtons extends React.Component<IHeaderContainerButtonsProps, IHeaderContainerButtonsState> {

    constructor(props: any) {
        super(props);
        this.state = {
        }
    }

    get isGroupMember() {
        const {currentThread, userName} = this.props;
        const threadIsEmpty = currentThread.get("threadId") === "";
        const groupMembersUsernames = threadIsEmpty && currentThread.getIn(['thread', 'value', 'groupMembersUsernames']);

        return groupMembersUsernames && groupMembersUsernames.includes(userName);
    }

    render(): JSX.Element {
        const {currentThread, userId} = this.props;
        const localization: any = components().contactInfo;
        const isGroup: boolean = currentThread.getIn(["thread", "threadType"]) !== "SINGLE";
        const isOwnChat: boolean = currentThread.get("threadId") === userId;
        const isThreadDisabled: boolean = currentThread.getIn(["thread", "value", "disabled"]);

        return (
            <div className="header-buttons">
                <ul className="action-buttons">
                    <li
                        className={`item-icon`}
                    >
                        <span className="call-audio"/>
                        <span className="item-icon-name">{localization.call}</span>
                    </li>
                    <li
                        className={`item-icon`}
                    >
                        <span className="call-video"/>
                        <span className="item-icon-name">{localization.video}</span>
                    </li>
                    <li
                        className={`item-icon`}
                    >
                        <span className="search-icon"/>
                        <span className="item-icon-name">{localization.search}</span>
                    </li>
                    <li className="item-icon"
                    >
                        <span className={"open-right-icon"}/>
                        <span className="item-icon-name">{localization.info}</span>
                    </li>

                    <li className={`item-icon`} id="header-more-info" >
                        <span className="icon-more-info"/>
                        <span className="item-icon-name">{localization.more}</span>
                    </li>
                </ul>
                <div className={`menuPopUp$`} >
                    <ul className="popup-list">
                        {
                            !isGroup && !isOwnChat &&
                            <li className="list-item" >
                                <button className="btn-item">
                                    {localization.block}
                                </button>
                            </li>
                        }
                        {
                            isGroup && (!isThreadDisabled && this.isGroupMember) &&
                            <>
                                <li className="list-item" >
                                    <button className="btn-item">{localization.addMembers}</button>
                                </li>
                                <li className="list-item" >
                                <button className="btn-item">{localization.leaveGroup}</button>
                                </li>
                            </>
                        }
                    </ul>
                </div>
            </div>
        )
    }
}
