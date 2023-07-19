import * as React from "react";
import "scss/pages/authentication/CircularLoader";

export default function CircularLoader(size): JSX.Element {
    return (
        <div className="content-loader" style={size && size.padding ? {paddingBottom:`${size.padding}px`} : {}} >
            <div className="circular-loader" style={size ? {fontSize: `${size.size}px`}:{}}>
                <div className="loader-stroke">
                    <div className="loader-stroke-left"/>
                    <div className="loader-stroke-right"/>
                </div>
            </div>
        </div>
    );
}



