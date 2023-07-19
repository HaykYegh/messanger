"use strict";

import * as React from "react";
import {Scrollbars} from 'react-custom-scrollbars'; // Todo remove scrollbar element

import {getBlobUri} from "helpers/FileHelper";

interface IStickersProps {
    onStickerClick: (event: any) => void;
    sticker: any;
    added: boolean;
    display?: string;
}

export default function Stickers({sticker, onStickerClick, added, display}: IStickersProps): JSX.Element {

    if (!sticker || sticker.size === 0) {
        return null;
    }

    return added ?
        (
            <Scrollbars style={{height: "226px", display}} autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                <ul className="sticker-ok-block">
                    {sticker.get("icons").sortBy((icon, key) => parseInt(key.split("_").pop())).keySeq().map(icon => {
                        const stickerBlob: any = sticker && sticker.getIn(["icons", icon]);
                        const stickerImage: any = getBlobUri(stickerBlob);
                        const stickerUrl: any = sticker.get("defaultPackage") ? stickerBlob : stickerImage;
                        const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";
                        if (brokenImage) return;
                        return (
                            <li className="sticker" key={icon}>
                                <img onClick={onStickerClick} draggable={false} id={icon} src={stickerUrl} alt=""/>
                            </li>
                        )
                    })}
                </ul>
            </Scrollbars>
        ) : null
};
