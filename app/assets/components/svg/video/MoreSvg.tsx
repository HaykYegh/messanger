import * as React from "react";

class MoreSvg extends React.Component {
    render(): JSX.Element {
        return (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="16" transform="matrix(-1 0 0 1 32 0)" fill="black" fill-opacity="0.4"/>
                <circle cx="9.41177" cy="16" r="1.88235" fill="white"/>
                <circle cx="16" cy="16" r="1.88235" fill="white"/>
                <circle cx="22.5882" cy="16" r="1.88235" fill="white"/>
            </svg>
        );
    }
}

export default MoreSvg;


