"use strict";

import * as React from "react";
import {Map} from "immutable";

import {ISticker} from "modules/settings/SettingsReducer";
import {getBlobUri} from "helpers/FileHelper";

interface IStickerProps {
    updateMessageProperty: (msgId, property, value, updateToDb?: boolean) => void;
    stickers: Map<string, ISticker>;
    stickerClass?: string;
    sticker: string;
    message?: any;
    attemptSetStickersIcons: (id: string, callback: Function, iconId) => void;
    messagesLoadedByShowMore?: boolean
}

interface IStickerState {
    loaded: boolean;
}

export default class StickerMessage extends React.Component<IStickerProps, IStickerState> {

    constructor(props: any) {
        super(props);
        this.state = {
            loaded: false,
        };
    }

    componentDidMount() {
        const {sticker, stickers, attemptSetStickersIcons} = this.props;
        const stickerIcons: any = stickers && stickers.getIn([sticker.split("_").shift().toString(), "icons"]);
        if (stickerIcons && stickerIcons.isEmpty() || stickerIcons && !stickerIcons.isEmpty() && !stickerIcons.get(sticker)) {
            const id: string = sticker.split("_").shift().toString();
            attemptSetStickersIcons(id, undefined, sticker);
        }
    }

    shouldComponentUpdate(nextProps: IStickerProps, nextState: IStickerState) {
        const {sticker, stickerClass, stickers} = this.props;

        if (!stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (stickerClass !== nextProps.stickerClass) {
            return true;
        }

        if (this.state.loaded !== nextState.loaded) {
            return true;
        }

        if (sticker !== nextProps.sticker) {
            return true;
        }

        return sticker !== nextProps.sticker;
    }

    handleStickerLoad = (): void => {
        this.setState({loaded: true});
    };

    render() {
        const {sticker, stickerClass, stickers, message} = this.props;
        const {loaded} = this.state;

        const stickerId: string = sticker.split("_").shift().toString();
        const stickerBlob: any = stickers && stickers.getIn([stickerId, "icons", sticker]);
        const stickerImage: any = getBlobUri(stickerBlob);
        const stickerUrl: any = stickers.getIn([stickerId, "defaultPackage"]) ? stickerBlob : stickerImage;

        const messageInfo = message.get("m_options");
        const height = messageInfo && messageInfo.get('height');
        const width = messageInfo && messageInfo.get('width');

        const elem: any = !height && document.getElementById(sticker);
        const styles: any = {width, height};

        if (!(height || width) && elem && elem.naturalHeight) {
            styles.height = elem.naturalHeight / 2;
            styles.width = elem.naturalWidth / 2;
        }

        return (
            <div className={stickerClass} style={styles}>
                {!loaded && <span className="loading-sticker"/>}
                <img
                    style={styles}
                    className={!loaded ? "hidden" : ""}
                    onLoad={this.handleStickerLoad}
                    id={sticker}
                    src={stickerUrl}
                    alt="sticker"
                />
            </div>
        );
    }
};
