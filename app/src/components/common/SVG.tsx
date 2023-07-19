"use strict";

import * as React from "react";
import Lottie from "react-lottie";

interface ISVGProps {
    name?: string;
    height?: number;
    width?: number;
    stop?: boolean;
    pause?: boolean;
    loop?: boolean;
    autoPlay?: boolean;
    src: any;
    className: string;
    aspectRatio?: string;
    eventName?: string;
    callback?: (e) => void;
}


export default function SVG(props: ISVGProps): JSX.Element {

    const {height, width, stop, pause, loop = true, autoPlay = true, src, className, aspectRatio, eventName, callback} = props;
    let eventListeners: Array<any> = [];
    if (eventName && callback) {
        eventListeners = [
            {
                eventName: eventName,
                callback: callback
            }
        ]
    }

    const options: any = {
        loop: loop,
        autoplay: autoPlay,
        animationData: src,
        rendererSettings: {
            className: className,
            preserveAspectRatio: aspectRatio || 'xMidYMid slice'
        }
    };

    return (
        <Lottie
            name={name}
            height={height}
            width={width}
            isStopped={stop}
            isPaused={pause}
            options={options}
            eventListeners={eventListeners}
        />
    );
};
