"use strict";

import * as React from "react";
import {List, Map} from "immutable";

import RecentStickers from "components/stickers/RecentStickers";
import Stickers from "components/stickers/Stickers";
import BlobImage from "components/common/BlobImage";
import Smiles from "components/stickers/Smiles";
import {getBlobUri} from "helpers/FileHelper";
import Gifs from "components/stickers/Gifs";
import {APP_CONFIG, ARABIC_LANGUAGE, LEFT_PANELS} from "configs/constants";
import SettingsSvg from "../../../assets/components/svg/SettingsSvg";

interface IStickerContainerProps {
    changeStickerKind: (event: any, emoji?: boolean) => void;
    emojiClick: (emoji: string, emojiName?: string) => void;
    setStickerContainerRef: (ref: HTMLDivElement) => void;
    handleGifSend: (url: string, id: string, options?: any) => void;
    handleStickerClick: (sticker: string, options?: any) => void;
    recentStickers: List<string>;
    stickers: Map<string, any>;
    myStickers: List<string>;
    closePopup: () => void;
    stickerKind: string;
    showSmiles: boolean;
    language?: string;
}

interface IStickerContainerState {
    showSmilesContent: boolean;
}


export default class StickerContainer extends React.Component<IStickerContainerProps, IStickerContainerState> {
    constructor(props) {
        super(props);

        this.state = {
            showSmilesContent: false
        }
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.handleEscPress);
        // setTimeout(() => {
            this.setState({showSmilesContent: true})
        // }, 100)
    }

    shouldComponentUpdate(nextProps: IStickerContainerProps, nextState: IStickerContainerState) {
        const {showSmilesContent} = this.state

        const {stickerKind, myStickers, stickers, showSmiles} = this.props;

        if (stickerKind !== nextProps.stickerKind) {
            return true;
        }

        if (!myStickers.equals(nextProps.myStickers)) {
            return true;
        }

        if (showSmiles !== nextProps.showSmiles) {
            return true;
        }

        if (showSmilesContent !== nextState.showSmilesContent) {
            return true;
        }

        return !stickers.equals(nextProps.stickers);
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.handleEscPress);
    };

    handleEscPress = (event): void => {
        if (event.key === "Escape") {
            this.props.closePopup();
        }
    };

    get stickerState(): JSX.Element {
        const {showSmilesContent} = this.state
        const {stickerKind, stickers, myStickers, handleStickerClick, recentStickers, handleGifSend, emojiClick} = this.props;

        return (
            <>
                <Stickers
                    display={!(stickerKind === "recents" || stickerKind === "emoji" || stickerKind === "gif" || stickers.getIn([stickerKind, "hidden"])) ? "block" : "none"}
                    onStickerClick={handleStickerClick}
                    sticker={stickers.get(stickerKind)}
                    added={myStickers.includes(stickerKind)}
                />
                <RecentStickers
                    display={stickerKind === "recents" ? "block" : "none"}
                    onStickerClick={handleStickerClick}
                    stickers={stickers}
                    recentStickers={recentStickers}
                />
                <Gifs display={stickerKind === "gif" ? "block" : "none"} handleGifSend={handleGifSend}/>
                <Smiles display={stickerKind === "emoji" ? "block" : "none"} showSmilesContent={showSmilesContent} emojiClick={emojiClick}/>
            </>
        )

        if (!(stickerKind === "recents" || stickerKind === "emoji" || stickerKind === "gif" || stickers.getIn([stickerKind, "hidden"]))) {
            return (
                <Stickers
                    onStickerClick={handleStickerClick}
                    sticker={stickers.get(stickerKind)}
                    added={myStickers.includes(stickerKind)}
                />
            )
        } else if (stickerKind === "recents") {
            return (
                <RecentStickers
                    onStickerClick={handleStickerClick}
                    stickers={stickers}
                    recentStickers={recentStickers}
                />
            )
        } else if (stickerKind === "gif") {
            return <Gifs handleGifSend={handleGifSend}/>;
        } else {
            return (<Smiles emojiClick={emojiClick}/>)
        }
    }

    get stickerFound(): boolean {
        const {stickerKind, myStickers, stickers} = this.props;
        let stickerFound = stickerKind === "emoji" || stickerKind === "recents" || stickerKind === "stickerSettings" || stickerKind === "gif";
        myStickers && myStickers.map(stickerId => {
            const sticker: any = stickers.get(stickerId);
            if (!sticker.get("hidden")) {
                if (stickerKind === sticker.get("id")) {
                    stickerFound = true;
                }
            }
        }); // Todo refactor simple for loop
        return stickerFound;
    }

    render() {
        const {showSmilesContent} = this.state
        const {stickerKind, changeStickerKind, stickers, myStickers, showSmiles, setStickerContainerRef, language} = this.props;
        const stickerFound = this.stickerFound;
        !stickerFound && changeStickerKind("", true);

        return (
            <div
              // className="sticker-block open"
              className={`sticker-block${showSmiles ? " open" : ""} ${language === ARABIC_LANGUAGE ? "sticker-block-arabic" : ""}`}
            >
                <div className={language === "ar" ? "sticker-block-content sticker-reverse": "sticker-block-content"} ref={setStickerContainerRef}>
                    <div className="top-block">
                        {this.stickerState}
                    </div>
                    {/*{showSmilesContent && <div className="top-block">*/}
                    {/*    {this.stickerState}*/}
                    {/*</div>}*/}
                    {/*{showSmiles && <div className="top-block">*/}
                    {/*    {this.stickerState}*/}
                    {/*</div>}*/}
                    <div className="bottom-block">
                        <ul className="bottom-menu" onClick={changeStickerKind}>
                            <li className={stickerKind === "emoji" || !stickerFound ? "selected" : ""}>
                                <a id="emoji"/>
                            </li>
                            <li className={stickerKind === "recents" ? "selected" : ""}>
                                <a id="recents"/>
                            </li>
                            <li className={stickerKind === "gif" ? "selected" : ""}>
                                <a id="gif"/>
                            </li>
                            {
                                !APP_CONFIG.ignores.includes(LEFT_PANELS.sticker_store) &&
                                <li>
                                    <SettingsSvg id="stickerSettings" color="#919DAA" hoverColor="#919DAA"/>
                                </li>
                            }
                            {myStickers && myStickers.map(stickerId => {
                                const sticker: any = stickers.get(stickerId);
                                const stickerBlob: any = sticker && sticker.get("icon");
                                const stickerImage: any = getBlobUri(stickerBlob);
                                const stickerUrl: any = sticker.get("defaultPackage") ? stickerBlob : stickerImage;
                                const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";
                                if (!sticker.get("hidden")) {
                                    const stickerStyle: any = {
                                        width: "26px"
                                    };
                                    return (
                                        <li key={sticker.get("id")}
                                            className={stickerKind === sticker.get("id") ? "selected" : ""}>
                                            {
                                                brokenImage ?
                                                    <a
                                                        id={sticker.get("id")}
                                                        className={`broken-sticker-icon${stickerKind === sticker.get("id") ? " selected" : ""}`}
                                                    /> :
                                                    <a
                                                        style={stickerStyle}
                                                        className={stickerKind === sticker.get("id") ? "selected" : ""}
                                                    >
                                                        <BlobImage id={sticker.get("id")} image={stickerUrl} height={26}
                                                                   width={26}/>
                                                    </a>
                                            }
                                        </li>
                                    )
                                }
                            })}
                            {/*{stickers.valueSeq().map(sticker => {
                            if (myStickers.includes(sticker.get("id")) || !sticker.get("featured")) {
                                return null;
                            }

                            if (!sticker.get("hidden")) {
                                const stickerStyle: any = {
                                    backgroundImage: `url(${sticker.get("icon")})`,
                                    backgroundSize: "contain",
                                    filter: "grayscale(100%)",
                                    opacity: 0.5
                                };

                                return <li key={sticker.get("id")}>
                                    <a style={stickerStyle} id={sticker.get("id")}
                                       className={stickerKind === sticker.get("id") ? "selected" : ""}/>
                                </li>
                            }
                        })}*/}
                            <span className="empty"/>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}
