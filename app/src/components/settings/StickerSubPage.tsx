"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";

import "scss/pages/left-panel/settings/StickerStore";
import CircularLoader from "components/common/loaders/CircularLoader";
import Log from "modules/messages/Log";

interface IStickerSubPageProps {
    attemptAddStickerPreviewImage: (id: string) => void;
    handleStickerAdd: () => void;
    available: boolean;
    sticker: any;
    goBack?: () => void;
}

interface IStickerSubPageState {
    previewLoad: boolean;
    isDisabled: boolean
}


export default class StickerSubPage extends React.Component<IStickerSubPageProps, IStickerSubPageState> {

    constructor(props: any) {
        super(props);

        this.state = {
            previewLoad: true,
            isDisabled: false
        };

    }

    componentDidMount(): void {
        const {attemptAddStickerPreviewImage, sticker} = this.props;
        if (sticker && !sticker.get("preview")) {
            const stickerId: string = sticker && sticker.get("id");
            attemptAddStickerPreviewImage(stickerId);
        }
    }

    shouldComponentUpdate(nextProps: IStickerSubPageProps, nextState: IStickerSubPageState): boolean {
        const {available, sticker} = this.props;

        if (available !== nextProps.available) {
            return true;
        }

        if (sticker && !sticker.equals(nextProps.sticker)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: Readonly<IStickerSubPageProps>, prevState: Readonly<IStickerSubPageState>, snapshot?: any): void {
        if (this.props.available !== prevProps.available && this.props.available === true) {
            this.setState({isDisabled: false})
        }
    }

    handlePreviewLoad = (): void => {
        this.setState({previewLoad: false})
    };

    handleStickerAdd = (): void => {
        this.setState({isDisabled: true});
        this.props.handleStickerAdd();
    };

    render() {
        const {handleStickerAdd, available, sticker, goBack} = this.props;
        const {previewLoad, isDisabled} = this.state;
        const localization: any = components().stickerSubPage;
        if (!sticker || sticker.size === 0) {
            return null;
        }

        const stickerBlob: any = sticker && sticker.get("icon");
        const stickerImage: any = getBlobUri(stickerBlob);
        const stickerUrl: any = sticker.get("defaultPackage") ? stickerBlob : stickerImage;
        let stickerPreviewBlob: any = sticker && sticker.get("preview");
        Log.i("stickerPreviewBlob -> ", stickerPreviewBlob.slice(0, 5));
        if (typeof stickerPreviewBlob === "string" && stickerPreviewBlob.slice(0, 5) !== "data:") {
            stickerPreviewBlob = stickerPreviewBlob && (window as any).URL.createObjectURL(stickerPreviewBlob)
        }
        const stickerImagePreview: any = getBlobUri(stickerPreviewBlob);
        const stickerPreviewUrl: any = sticker.get("defaultPackage") ? stickerPreviewBlob : stickerImagePreview;
        // const stickerPreviewUrl: any = stickerPreviewBlob;

        const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";
        return (
            <div className="sticker-individual">
                <div className="settings-scroll sticker-content">
                    <div className="icon-back" onClick={goBack}/>

                    <img draggable={false} onLoad={this.handlePreviewLoad}
                         className={previewLoad ? "hidden" : "preview"} src={stickerPreviewUrl}/>
                    {
                        previewLoad &&
                        <div className="new-sticker-loader new-sticker-loader-middle"/>
                    }
                </div>
                <div className="info">
                    <div className="sticker-info">
                        <h2 className="name">{sticker.get("free") ? localization.free : sticker.get("price")}</h2>
                        {/*<h2 className="price">{sticker.get("free") ? localization.free : sticker.get("price")}</h2>*/}
                        {/*<p className="description">{sticker.get("description")}</p>*/}
                        <button className="add-button" style={available ? {pointerEvents: "none"} : {}}
                                disabled={isDisabled}
                                onClick={!available ? this.handleStickerAdd : null}>
                            {available ? localization.added : isDisabled ? <CircularLoader/> : localization.download}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
}
