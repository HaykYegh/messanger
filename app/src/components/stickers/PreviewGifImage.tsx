"use strict";

import * as React from "react";
import Log from "modules/messages/Log";

interface IPreviewGifImageProps {
    originalUrl: string;
    previewUrl: string;
    id: string;
    gifSize: any;
    sendGif: () => void;
}

interface IPreviewGifImageState {
    loaded: boolean;
}

class PreviewGifImage extends React.Component<IPreviewGifImageProps, IPreviewGifImageState> {

    constructor(props: any) {
        super(props);

        this.state = {
            loaded: false
        }
    }

    handleImageLoad = (): void => {
        Log.i("handleImageLoad -> ")
        this.setState({loaded: true})
    };


    render () {
        const {originalUrl, previewUrl, id, gifSize, sendGif} = this.props
        return (
            <>

                <img
                    id={id}
                    className="searched-gif"
                    onLoad={this.handleImageLoad}
                    src={originalUrl}
                    alt=""
                    style={{display: "none"}}
                    onClick={sendGif}
                />
                {this.state.loaded ? <img
                    id={id}
                    className="searched-gif"
                    src={originalUrl}
                    alt=""
                    style={gifSize}
                    onClick={sendGif}
                /> : <img
                    id={id}
                    className="searched-gif"
                    src={previewUrl}
                    alt=""
                    style={gifSize}
                    onClick={sendGif}
                />}
            </>
        );
    }
};

export default PreviewGifImage
