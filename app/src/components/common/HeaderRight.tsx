"use strict";

import * as React from "react";
import "scss/pages/Header";

interface IHeaderRightState {
}

interface IHeaderRightProps {
    headerTitle:string;
}



export default class HeaderRight extends React.Component<IHeaderRightProps, IHeaderRightState> {

    constructor(props: any) {
        super(props);

        this.state = {
        }
    }

    render(): JSX.Element {
        const {headerTitle} = this.props;
        return (
             <div className="header-right">
                  <div className="right-side-content">
                       <h2 className="right-title">{headerTitle}</h2>
                  </div>
             </div>
        )
    }
}
