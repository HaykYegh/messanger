import * as React from "react";

class MuteSvg extends React.Component {
    render(): JSX.Element {
        return (
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="21" height="21" fill="#FF0000" fill-opacity="0.01"/>
                <rect x="8.30605" y="4.12759" width="4.39344" height="8.98873" rx="2.19672" fill="#88C64A" stroke="#88C64A" stroke-width="1.25517"/>
                <path d="M14.5833 11.0121C14.5833 12.0989 14.1531 13.1411 13.3873 13.9096C12.6215 14.678 11.5829 15.1097 10.5 15.1097C9.41699 15.1097 8.37838 14.678 7.61261 13.9096C6.84683 13.1411 6.41663 12.0989 6.41663 11.0121" stroke="#88C64A" stroke-width="1.25517" stroke-linecap="round"/>
                <path d="M10.5001 15.1097V17.5" stroke="#88C64A" stroke-width="1.25517" stroke-linecap="round"/>
            </svg>
        );
    }
}

export default MuteSvg;


