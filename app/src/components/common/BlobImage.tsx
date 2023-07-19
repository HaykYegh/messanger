"use strict";

import * as React from "react";
import {getBlobUri} from "helpers/FileHelper";
import {isEqual} from "lodash";
import {BlobImg} from "components/messages/style";

interface IBlobImageProps {
    id?: string;
    image: Blob;
    height: number | string;
    width: number | string;
}

export default class BlobImage extends React.Component<IBlobImageProps> {

    constructor(props: any) {
        super(props);

        this.state = {
            photo: null,
            loading: true
        }
    }

    shouldComponentUpdate(nextProps: IBlobImageProps): boolean {
        const {image} = this.props;
        return !isEqual(image, nextProps.image);
    }

    render(): JSX.Element {
        const {image, height, width, id} = this.props;

        const currentImage = typeof image !== 'string' ? getBlobUri(image) : image;

        const imgStyle: any = {
            height: height,
            width: width
        };

        return (
            <BlobImg id={id} draggable={false} style={imgStyle} src={currentImage}/>
        );
    }
}
