import * as React from "react";

interface INotificationsSvgProps {
    color?: string;
}

class NotificationsSvg extends React.Component<INotificationsSvgProps, null> {
    render(): JSX.Element {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.79952 0.599976H4.33194C2.27201 0.599976 0.599609 2.27238 0.599609 4.33242V11.6675C0.599609 13.7276 2.27201 15.4 4.33194 15.4H11.6672C13.7272 15.4 15.3996 13.7276 15.3996 11.6675V8.19977" stroke="white" stroke-width="1.20097" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.1994 5.60086C14.7458 5.60086 15.9994 4.34726 15.9994 2.80086C15.9994 1.25446 14.7458 0.000854492 13.1994 0.000854492C11.653 0.000854492 10.3994 1.25446 10.3994 2.80086C10.3994 4.34726 11.653 5.60086 13.1994 5.60086Z" fill="white"/>
            </svg>
        );
    }
}

export default NotificationsSvg;


