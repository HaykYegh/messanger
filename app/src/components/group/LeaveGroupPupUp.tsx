"use strict";

import {LEAVE_GROUP_ACTIONS} from "configs/constants";
import components from "configs/localization";
import * as React from "react";

interface ILeaveGroupPupUpProps {
    choseAction: (action: string) => void;
}

export default function LeaveGroupPupUp({choseAction}: ILeaveGroupPupUpProps): JSX.Element {
    const leaveAndDeleteHistory: any = () => choseAction(LEAVE_GROUP_ACTIONS.leave_and_delete_history);
    const leaveButKeepHistory: any = () => choseAction(LEAVE_GROUP_ACTIONS.leave_and_keep_history);
    const cancle: any = () => choseAction(LEAVE_GROUP_ACTIONS.cancel);
    const localization: any = components().leaveGroupPopUp;

    return (
        <div className="group_leave_pupup">
            <div className="group_leave_pupup_content">
                <div className="close_group_leave_pupup" onClick={cancle}/>
                <div className="content_text">
                    <span className="info">{localization.info}</span>
                </div>
                <div className="content_btn">
                    <span className="kick-member" onClick={leaveButKeepHistory}>{localization.kickMember}</span>
                    <span className="cancel-kick" onClick={leaveAndDeleteHistory}>{localization.cancelKick}</span>
                </div>
            </div>
        </div>
    );
};
