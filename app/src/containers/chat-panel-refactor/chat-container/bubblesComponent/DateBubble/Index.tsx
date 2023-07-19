"use strict";

import * as React from "react";
import {DateBubblePosition} from "containers/chat-panel-refactor/chat-container/bubblesComponent/DateBubble/style";

import {getFormattedDate} from "helpers/DateHelper";

interface IDateBubbleProps {
    date: any;
}

export default function DateBubble(props: IDateBubbleProps) {
    const {date} = props;

    return (
        <DateBubblePosition>
            <p>{getFormattedDate({date})}</p>
        </DateBubblePosition>
    );
}
