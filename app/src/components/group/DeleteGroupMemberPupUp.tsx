"use strict";

import {DELETE_GROUP_MEMBER_ACTIONS} from "configs/constants";
import components from "configs/localization";
import * as React from "react";

interface IDeleteGroupMemberPupUpProps {
    choseAction: (action: string) => void;
}

export default function DeleteGroupMemberPupUp({choseAction}: IDeleteGroupMemberPupUpProps): JSX.Element {
    const localization: any = components().deleteGroupMemberPopUp;

    const confirm: any = () => choseAction(DELETE_GROUP_MEMBER_ACTIONS.confirm);
    const cancel: any = () => choseAction(DELETE_GROUP_MEMBER_ACTIONS.cancel);

    return (
        <div className="group_delete_pupup">
            <div className="group_delete_pupup_content">
                <div className="close_group_delete_pupup" onClick={cancel}/>
                <div className="content_text">
                    <span className="info">{localization.info}</span>
                </div>
                <div className="content_btn">
                    <span className="kick-member" onClick={confirm}>{localization.yes}</span>
                    <span className="cancel-kick" onClick={cancel}>{localization.no}</span>
                </div>
            </div>
        </div>
    );
};
