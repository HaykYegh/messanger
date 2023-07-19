import * as React from "react";

interface IPrivacySvgProps {
    color?: string;
}

class PrivacySvg extends React.Component<IPrivacySvgProps, null> {
    render(): JSX.Element {
        return (
            <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1150_4537)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.21 8.83V15.57C13.21 16.03 12.84 16.4 12.38 16.4H2.03C1.57 16.4 1.2 16.03 1.2 15.57V8.83C1.2 8.37 1.57 8 2.03 8H12.38C12.84 8 13.21 8.37 13.21 8.83ZM14.41 8.83C14.41 7.71 13.5 6.8 12.38 6.8H2.03C0.91 6.8 0 7.71 0 8.83V15.57C0 16.69 0.91 17.6 2.03 17.6H12.38C13.5 17.6 14.41 16.69 14.41 15.57V8.83Z" fill="white"/>
                    <path d="M11.6 8.01H2.79999V4C2.79999 1.79 4.58999 0 6.79999 0H7.59999C9.80999 0 11.6 1.79 11.6 4V8.01ZM3.99999 6.81H10.4V4C10.4 2.46 9.13999 1.2 7.59999 1.2H6.79999C5.25999 1.2 3.99999 2.46 3.99999 4V6.81Z" fill="white"/>
                </g>
                <defs>
                    <clipPath id="clip0_1150_4537">
                        <rect width="14.41" height="17.6" fill="white"/>
                    </clipPath>
                </defs>
            </svg>

        );
    }
}

export default PrivacySvg;


