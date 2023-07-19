"use strict";

import * as React from "react";
import {Map} from "immutable";
import isEqual from "lodash/isEqual";

import {ISticker} from "modules/settings/SettingsReducer";
import {scrollToBottom} from "helpers/UIHelper";
import {getBlobUri} from "helpers/FileHelper";
import {LoadingSticker, StickerSlock} from "components/messages/StickerMessage/style";

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

        if (stickerClass !== nextProps.stickerClass) {
            return true;
        }

        return sticker !== nextProps.sticker || !isEqual(this.state, nextState);

    }

    handleStickerLoad = ({target: img}: any) => {
        const {updateMessageProperty, messagesLoadedByShowMore} = this.props;
        const container: any = document.getElementById("chatBackground");
        const {message} = this.props;
        const messageInfo = message.get("m_options");

        if (!(messageInfo && messageInfo.height && messageInfo.width)) {
            updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                height: img.naturalHeight,
                width: img.naturalWidth
            }, true);

            img.style.height = img.naturalHeight / 2 + "px";
            img.style.width = img.naturalWidth / 2 + "px";

            if (img.offsetHeight >= 200 && container.offsetHeight + container.scrollTop + 15 < container.scrollHeight) {
                // container.scrollTop = container.scrollTop + img.offsetHeight - 100;
                // container.scrollTop-=5;
            }
        }
        if (!messagesLoadedByShowMore) {
            scrollToBottom();
        }
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
        const height = messageInfo && messageInfo.height;
        const width = messageInfo && messageInfo.width;

        const elem: any = !height && document.getElementById(sticker);

        const styles: any = {};
        if (height && width || (elem && elem.naturalHeight)) {
            styles.height = height / 2 || (elem && elem.naturalHeight / 2);
            styles.width = width / 2 || (elem && elem.naturalWidth / 2);
        }

        return (
            <StickerSlock className={stickerClass} style={styles}>
                {!loaded && <LoadingSticker/>}
                <img
                    style={styles}
                    className={!loaded ? "hidden" : ""}
                    onLoad={this.handleStickerLoad}
                    id={sticker}
                    src={stickerUrl}
                    alt="sticker"
                />
            </StickerSlock>
        );
    }
};
