"use strict";

import * as React from "react";

interface IAudioProps {
    setRef: (ref: any) => void;
    fileName: string;
}

export default function Audio({setRef, fileName}: IAudioProps): JSX.Element {
    return (
        <audio id="sound" preload="auto" ref={setRef}>
            <source src={require(`files/${fileName}.mp3`)} type="audio/mpeg"/>
            <source src={require(`files/${fileName}.ogg`)} type="audio/ogg"/>
            <embed hidden={true} src={require(`files/${fileName}.mp3`)}/>
        </audio>
    );
};
