import * as React from "react";

interface ILogsSvgProps {
    color?: string;
}

class LogsSvg extends React.Component<ILogsSvgProps, null> {
    render(): JSX.Element {
        return (
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.97134 0.599304C9.43214 0.599304 9.80654 0.973705 9.80654 1.43451V12.5641C9.80654 13.0249 9.43214 13.3993 8.97134 13.3993H1.04174C0.580943 13.3993 0.206543 13.0249 0.206543 12.5641V1.43451C0.206543 0.973705 0.580943 0.599304 1.04174 0.599304H8.97134ZM5.80654 11.0025V10.2025H1.00654V11.0025H5.80654ZM5.80654 8.59929V7.79929H1.00654V8.59929H5.80654ZM9.00654 6.19929V5.39928H1.00654V6.19929H9.00654ZM9.00654 3.79931V2.99931H1.00654V3.79931H9.00654Z" fill="white"/>
            </svg>
        );
    }
}

export default LogsSvg;
