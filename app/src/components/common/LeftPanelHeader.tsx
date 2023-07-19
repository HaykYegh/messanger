"use strict";

import "scss/pages/left-panel/LeftHeader";
import * as React from "react";

interface ILeftPanelHeaderProps {
    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    children?: any;
    rightButton?: {
        onClick?: () => void;
        className: string;
        text?: string;
    };
    title?: string
    updateProfile?: () => void;
    done?: string
}

export default function LeftPanelHeader({leftButton, children, rightButton, title, updateProfile,done}: ILeftPanelHeaderProps): JSX.Element {
    return (
        <div className="left_side_header">
            <div className="title">
                {leftButton &&
                <span className={leftButton.className} style={leftButton.style} onClick={leftButton.onClick}>{leftButton.text}</span>}
                {title &&
                    <span className="title_info">{title}</span>
                }
                {children &&
                <div className="right-side-info">
                    <span className="right-side-info-text">{children}</span>
                </div>
                }
                {rightButton &&
                <span className={rightButton.className} onClick={rightButton.onClick}>{rightButton.text}</span>}
                {
                    (updateProfile && done) && <span className="save-btn" onClick={updateProfile}>{done}</span>
                }

            </div>
        </div>
    );
};
