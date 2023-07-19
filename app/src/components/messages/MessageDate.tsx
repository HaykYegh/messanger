"use strict";

import * as React from "react";

import {getFormattedDate} from "helpers/DateHelper";

interface IMessageDateProps {
    date: any;
    languages: any;
    showRightPanel: boolean;
}

export default class MessageDate extends React.Component<IMessageDateProps> {


    shouldComponentUpdate(nextProps: IMessageDateProps) {
        const {date, languages, showRightPanel} = this.props;

        if(showRightPanel !== nextProps.showRightPanel) {
            return true;
        }

        if (!languages.equals(nextProps.languages)) {
            return true;
        }

        return date !== nextProps.date;

    }

    render() {
        const {date, showRightPanel} = this.props;
        return (
            <div
              style={{
                  transform: showRightPanel ? "translateX(157px)" : "translateX(0)",
                  transition: "transform 0.125s ease-in-out"
              }}
              className="day-data-wrapper">
                <div className="day-data-absolute-wrapper">
                    <div className="dayData">
                        <span className="left-line"/>
                        <p>{getFormattedDate({date})}</p>
                        <span className="right-line"/>
                    </div>
                </div>
            </div>
        );
    }
};
