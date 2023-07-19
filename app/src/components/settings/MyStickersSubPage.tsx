"use strict";

import "scss/pages/left-panel/settings/StickerStore";
import components from "configs/localization";
import {LEFT_PANELS} from "configs/constants";
import {List, Map} from "immutable";
import * as React from "react";
import {getBlobUri} from "helpers/FileHelper";
import BlobImage from "components/common/BlobImage";

interface IMyStickersSubPageProps {
    handleChangePanel: (page: string, id: string) => void;
    handleStickerRemove: (id: string) => void;
    handleMenuOpen: (menuId: string, event?: any) => void;
    handleStickerHide: (id: string) => void;
    handleStickerShow: (id: string) => void;
    handleMenuClose: () => void
    stickers: Map<string, any>;
    myStickers: List<string>;
    menuId: string;
    showContextMenuTop: boolean;
}

export default function MyStickersSubPage({myStickers, stickers, handleStickerHide, handleStickerRemove, handleStickerShow, handleChangePanel, menuId, handleMenuOpen, showContextMenuTop,handleMenuClose}: IMyStickersSubPageProps): JSX.Element {
    const localization: any = components().myStickers;

    return (
        <div className="stickers-store settings-scroll" onScroll={handleMenuClose}>
            {stickers.valueSeq().map(sticker => {

                const showStickerInfo: any = () => {
                    if (!sticker.get("defaultPackage")) {
                        handleChangePanel(LEFT_PANELS.sticker, sticker.get("id"));
                    }
                    return;
                };
                const openActionMenu: any = (event) => handleMenuOpen(sticker.get("id"), event);
                const setStickerVisible: any = () => handleStickerShow(sticker.get("id"));
                const setStickerHidden: any = () => handleStickerHide(sticker.get("id"));
                const removeMySticker: any = () => handleStickerRemove(sticker.get("id"));
                
                const stickerMenu = (menuId === sticker.get("id") ? {display: "block", bottom: "auto", top: "35px"} : {});
                if(showContextMenuTop){
                    stickerMenu.bottom = "45px";
                    stickerMenu.top = "auto";
                }

                const stickerBlob: any = sticker && sticker.get("icon");
                const stickerImage: any = getBlobUri(stickerBlob);
                const stickerUrl: any =  sticker.get("defaultPackage") ? stickerBlob : stickerImage;
                const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";

                return !myStickers.includes(sticker.get("id")) ? null : (
                    <div className="sticker my-sticker" key={sticker.get("id")}>
                        <div className="sticker_info">
                            {brokenImage ? <span className="broken-sticker-icon"/> : <BlobImage image={stickerUrl} width={62} height={62} />}
                            <span className="sticker-name" onClick={showStickerInfo}>{sticker.get("name")}</span>
                            <button className="sticker-store-menu" onClick={openActionMenu}/>
                        </div>
                        <div className="my-sticker-menu" style={stickerMenu}>
                            {sticker.get("hidden") ?
                                <div className="contextMenu--option" onClick={setStickerVisible}>{localization.show}</div> :
                                <div className="contextMenu--option" onClick={setStickerHidden}>{localization.hide}</div>}
                            {!sticker.get("defaultPackage") && <div className="contextMenu--option" onClick={removeMySticker}>{localization.deleteSticker}</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
