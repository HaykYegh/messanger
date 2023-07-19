"use strict";

import * as React from "react";

interface IKeyProps {
    onClick: (key: number) => void;
    keyNumber: number;
    letters: string;
}

export default function Key({keyNumber, letters, onClick}: IKeyProps): JSX.Element {
    const onlySymbol: boolean = (letters === "*" || letters === "#");
    const symbolName: string = letters === "*" ? "asterisk" : letters === "#" ? "hashtag" : "";
    const clickKey: any = () => onClick(keyNumber);

    return (
        <div className={`key${onlySymbol ? ` only-symbol-key ${symbolName}` : ""}`} id={`keypad_key_${keyNumber}`} onClick={clickKey}>
            <span className={onlySymbol ? "only-symbol display-none" : "key-numbers"}>
                {keyNumber}
            </span>
            <span className={onlySymbol ? "display-none" : "letters"}>
                {letters}
            </span>
        </div>
    );
};
