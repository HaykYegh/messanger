"use strict";

import {List, Map} from "immutable";
import * as React from "react";
import {getBlobUri} from "helpers/FileHelper";
import { Scrollbars } from 'react-custom-scrollbars';

interface IRecentStickersProps {
    onStickerClick: (event: any) => void;
    stickers: Map<string, any>;
    recentStickers: List<string>;
    display?: string;
}

export default function RecentStickers({stickers, onStickerClick, recentStickers, display}: IRecentStickersProps): JSX.Element {

    if (!recentStickers || recentStickers.size === 0) {
        return (
            <div style={{display: display === "block" ? "flex" : "none"}} className="no-resent-sticker">
                <h2 className="no-resent-sticker-text">Recent Sticker</h2>
            </div>
        )
    };

    return  (
        <Scrollbars style={{height:"226px", display}} autoHide autoHideTimeout={2000} autoHideDuration={1000}>
            <ul className="sticker-recent-block" onClick={onStickerClick}>
                {recentStickers.reverse().map(stickerId => {
                    const stickerBlob: any = stickers && stickers.getIn([stickerId.split("_").shift(), "icons", stickerId]);
                    const stickerImage: any = getBlobUri(stickerBlob);
                    const stickerUrl: any =  stickers.getIn([stickerId.split("_").shift(), "defaultPackage"]) ? stickerBlob : stickerImage;
                    return (
                    <li className="sticker" key={stickerId}>
                            <img draggable={false} id={stickerId} src={stickerUrl}/>
                    </li>
                    )
                })}
            </ul>
        </Scrollbars>
    )
};
