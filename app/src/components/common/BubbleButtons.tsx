"use strict";

import * as React from "react";

interface IBubbleButtonsProps {
    buttonsClass: string;
}

export default function BubbleButtons({buttonsClass}: IBubbleButtonsProps): JSX.Element {
    return (
        <div className={buttonsClass}>
            <span className="download-ico"/>
            <span className="delete-ico"/>
        </div>
    );
};
