"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

interface IAvatarProps {
    image?: {
        url: string,
        file: Blob,
        loadFromWeb?: boolean,
    };
    color: string
    status?: string;
    avatarCharacter: string;
    name: string;
    meta?: any;
    userAvatar?: boolean;
}

interface IAvatarState {
    photo: Blob,
}

export default class Avatar extends React.Component<IAvatarProps, IAvatarState> {

    get imageUrl(): string {
        return this._imageUrl;
    }

    set imageUrl(value: string) {
        this._imageUrl = value;
    }

    private _imageUrl: string;

    constructor(props: any) {
        super(props);
        this.state = {
            photo: null,
        }
    }

    componentDidMount(): void {

        const {image}: IAvatarProps = this.props;

        (async () => {
            await this.getImage(image)
        })();
    }

    shouldComponentUpdate(nextProps: IAvatarProps, nextState: IAvatarState): boolean {
        const {name, avatarCharacter, image} = this.props;

        if (!isEqual(image, nextProps.image)) {
            return true;
        }

        if (name !== nextProps.name) {
            return true;
        }

        if (avatarCharacter !== nextProps.avatarCharacter) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: Readonly<IAvatarProps>, prevState: Readonly<IAvatarState>, snapshot?: any): void {
        if (!isEqual(prevProps.image, this.props.image)) {
            (async () => {
                await this.getImage(this.props.image)
            })();
        }
    }

    getImage = async (image: {
        url: string,
        file: Blob
    }) => {
        let file: File | Blob = null;
        if (!image.file) {
            // if (image.url !== '') {
            //     try {
            //         const fetching: any = await fetch(image.url);
            //         const blob = await fetching.blob();
            //         if (blob && blob.type !== "application/xml") {
            //             file = blob;
            //         }
            //     } catch (e) {
            //         console.log("CANT'T RETRIEVE IMAGE");
            //     }
            // }

        } else {
            file = image.file;
        }

        if (file) {
            this.imageUrl = (window as any).URL.createObjectURL(file);
            this.setState({photo: file});
        } else {
            (window as any).URL.revokeObjectURL(this.imageUrl);
            this.imageUrl = "";
            this.setState({photo: null});
        }
    };

    render(): JSX.Element {
        const {color, avatarCharacter, name, userAvatar} = this.props;
        const avatarStyle: any = {
            color: color,
        };

        return (
            this.imageUrl ?
                <img src={this.imageUrl} className="contact_img" alt=""/> :
                name && !userAvatar ?
                    <span className="contact_icon" style={avatarStyle} data-line={avatarCharacter}>
                        <span>{avatarCharacter}</span>
                    </span>
                    :
                    <span className="no-name_icon"/>
        );
    }
}
