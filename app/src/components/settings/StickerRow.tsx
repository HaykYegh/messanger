"use strict";

import * as React from "react";
import {List, Map} from "immutable";
import classnames from "classnames";
const classNames = classnames;

import BlobImage from "components/common/BlobImage";
import StickerSubPage from "components/settings/StickerSubPage"
import components from "configs/localization";

interface IStickerRowProps {
    showStickerInfo: (e: any) => void;
    attemptAddStickerPreviewIcon: (id: string) => void;
    myStickers: List<string>;
    sticker: any;
}

interface IStickerRowState {
    isIconLoading: boolean,
}

export default class StickerRow extends React.Component<IStickerRowProps, IStickerRowState> {

    constructor(props: any) {
        super(props);

        this.state = {
            isIconLoading: false,
        };

    }

    componentDidMount(): void {
        const {attemptAddStickerPreviewIcon, sticker} = this.props;
        if (sticker && !sticker.get("icon")) {
            this.setState({isIconLoading: true});
            const stickerId: string = sticker && sticker.get("id");
            attemptAddStickerPreviewIcon(stickerId);
        }
    }

    componentDidUpdate(prevProps: IStickerRowProps): void {
        const {sticker} = this.props;

        if (sticker.get('icon') && sticker.get('icon') !== prevProps.sticker.get('icon')) {
            this.setState({isIconLoading: false});
        }
    }

    shouldComponentUpdate(nextProps: IStickerRowProps, nextState: IStickerRowState): boolean {
        const {myStickers, sticker} = this.props;
        const {isIconLoading} = this.state;

        return myStickers && !myStickers.equals(nextProps.myStickers) ||
            sticker && !sticker.equals(nextProps.sticker) ||
            isIconLoading !== nextState.isIconLoading;
    }

    render(): JSX.Element {
        const {myStickers, sticker, showStickerInfo} = this.props;
        const {isIconLoading} = this.state;
        const localization: any = components().stickerStore;

        const stickerContainerClassNames: string = classNames({
            sticker_exist: myStickers && myStickers.includes(sticker.get("id")),
            sticker_free: sticker.get("free"),
            sticker_paid: !sticker.get("free"),
            sticker: true
        });

        const stickerBlob: any = sticker && sticker.get("icon");
        const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";

        return (
            <div>
                <div className={stickerContainerClassNames} onClick={showStickerInfo}>
                    <div className="sticker_info">
                        {
                            brokenImage ? <span className="broken-sticker-icon"/> :
                                isIconLoading ? <div className="new-sticker-loader"/>
                                    : <BlobImage image={stickerBlob} width={52} height={52}/>
                        }
                        <div>
                            <span className="sticker-name">{sticker.get("name")}</span>
                            {/*<span className="sticker-count">12 Animated Stickers</span>*/}
                        </div>
                    </div>
                    <div>
                        <div
                            className="sticker_status">{myStickers && myStickers.includes(sticker.get("id")) ? "" : sticker.get("free") ? localization.free : sticker.get("price")}</div>
                        {/*<div className="arrow-right"/>*/}
                        <div className="icon-arrow"/>
                    </div>
                </div>
            </div>
        );
    }
};


