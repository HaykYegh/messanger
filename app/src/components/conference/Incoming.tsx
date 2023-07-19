"use strict";

import React, {Component} from 'react';
import Draggable from "react-draggable";

interface IIncomingProps {
    groupName: string;
    conferenceInfo: any;
    decline: () => void;
    accept: () => void;
}

interface IIncomingState {

}


class Incoming extends Component<IIncomingProps, IIncomingState> {

    constructor(props: any) {
        super(props);

        this.state = {}
    }

    render(): JSX.Element {
        const {groupName, decline, accept} = this.props;
        return (
            <Draggable bounds="parent">
                <div className="incoming">
                    <div className="content">
                        <span style={{color: "white"}}>{groupName}</span>
                    </div>
                    <div className="footer">
                        <div className="btn-groups">
                            <span className="icon-footer icon-accept-call" onClick={accept}/>
                            <span className="icon-footer icon-decline-call" onClick={decline}/>
                        </div>
                    </div>
                </div>
            </Draggable>
        );
    }
}

export default Incoming;