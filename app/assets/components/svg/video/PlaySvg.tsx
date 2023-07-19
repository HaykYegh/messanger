import * as React from "react";

class PlaySvg extends React.Component {
    render(): JSX.Element {
        return (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="black" fill-opacity="0.4"/>
                <path d="M19.5066 32.9026C19.624 32.9677 19.7537 33 19.8833 33C20.0265 33 20.1694 32.9605 20.2952 32.8819L32.7274 25.1118C32.9546 24.9698 33.0926 24.7208 33.0926 24.4529C33.0926 24.185 32.9546 23.936 32.7274 23.794L20.2952 16.0238C20.0556 15.874 19.7537 15.8662 19.5066 16.0031C19.2596 16.14 19.1063 16.4002 19.1063 16.6827V32.223C19.1063 32.5054 19.2596 32.7656 19.5066 32.9026Z" fill="white"/>
            </svg>
        );
    }
}

export default PlaySvg;

