import * as React from "react";

interface IWhyZangiSvgProps {
    color?: string;
}

class WhyZangiSvg extends React.Component<IWhyZangiSvgProps, null> {
    render(): JSX.Element {
        return (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.93982 15.0193H10.34" stroke="white" stroke-width="1.56019" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.93982 5.27901H9.13995" stroke="white" stroke-width="1.3172" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.13953 5.42053V15.0201V5.64885" stroke="white" stroke-width="1.59673" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.1997 2.20796C10.1946 1.54528 9.6531 1.01336 8.99045 1.01983C8.32779 1.02631 7.79501 1.56855 7.80033 2.23099C7.80565 2.89368 8.3469 3.4256 9.00955 3.41912C9.67221 3.41264 10.205 2.8704 10.1997 2.20796Z" fill="white"/>
            </svg>

        );
    }
}

export default WhyZangiSvg;
