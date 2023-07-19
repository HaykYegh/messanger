import * as React from "react";
import isEqual from "lodash/isEqual";
import ReactCrop from "react-image-crop";

import {getBlobUri, getImage} from "helpers/FileHelper";
import "scss/pages/components/AvatarCropper.scss";
import components from "configs/localization";
import "react-image-crop/lib/ReactCrop.scss";
import Log from "modules/messages/Log";

interface IAvatarCropperProps {
    file: File | Blob
    croppedImageUpdate: (croppedImage: { image: Blob | File, avatar: File | Blob }) => void
    cropPopupDismiss: () => void
}

interface IAvatarCropperState {
    crop: {
        width: number,
        height: number,
        x: number,
        y: number,
        aspect: number,
        keepSelection: boolean,
        maxWidth: number,
        maxHeight: number,
        minWidth: number,
        minHeight: number,
        style: any,
        imageStyle: any
    },
    image: Blob | File,
    avatar: Blob | File
}

export default class AvatarCropper extends React.Component<IAvatarCropperProps, IAvatarCropperState> {
    get ref(): any {
        return this._ref;
    }

    set ref(value: any) {
        this._ref = value;
    }

    get imageUrl(): string {
        return this._imageUrl;
    }

    set imageUrl(value: string) {
        this._imageUrl = value;
    }

    private _ref: any;
    private _imageUrl: string;

    constructor(props) {
        super(props);

        this._imageUrl = (window as any).URL.createObjectURL(this.props.file);

        this.state = {
            crop: {
                width: 0,
                height: 0,
                maxWidth: 1024,
                maxHeight: 1024,
                minWidth: 300,
                minHeight: 300,
                x: 0,
                y: 0,
                aspect: 1,
                keepSelection: true,
                style: {},
                imageStyle: {}
            },
            image: null,
            avatar: null
        };
    }

    componentDidMount(): void {
        document.getElementById("avatar-cropper-popup").addEventListener("mousedown", this.handleOutSideClick);
        document.addEventListener("keyup", this.handleEscapePress, true);
    }

    componentWillUnmount(): void {
        document.getElementById("avatar-cropper-popup").removeEventListener("mousedown", this.handleOutSideClick);
        document.removeEventListener("keyup", this.handleEscapePress, true);
    }


    shouldComponentUpdate(nextProps: Readonly<IAvatarCropperProps>, nextState: Readonly<IAvatarCropperState>, nextContext: any): boolean {
        if (!isEqual(nextState.crop, this.state.crop)) {
            return true;
        }

        return false;
    }

    handleCropComplete = crop => {
        this.attemptCropImage(crop);
    };

    handleCropChange = crop => {
        this.setState({crop});
    };

    handleRefRetrieve = ref => {
        this.ref = ref;

        const crop = {...this.state.crop};
        if (ref.width > ref.height) {
            crop.width = crop.height = ref.height - 10;
            crop.y = 5;
            crop.x = (ref.width - crop.width) / 2;
        } else {
            crop.width = crop.height = ref.width - 10;
            crop.x = 5;
            crop.y = (ref.height - crop.height) / 2;
        }
        this.handleCropChange(crop);

        this.attemptCropImage(crop);
    };


    attemptCropImage = crop => {
        if (this.ref && crop.width && crop.height) {
            (async () => {
                const croppedImage: any = await this.cropImage(this.ref, crop);
                this.setState({
                    image: croppedImage.image,
                    avatar: croppedImage.avatar
                })
            })();
        }
    };


    cropImage = async (image, crop) => {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const scaleX: number = image.naturalWidth / image.width;
        const scaleY: number = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height,
        );

        const croppedImageBlob: Blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

        return new Promise((resolve) => {
            const croppedImage = new Image();
            croppedImage.src = getBlobUri(croppedImageBlob);

            croppedImage.onload = async () => {
                const imageBlob: any = await getImage(croppedImage, 1024, 1024, 'image/jpeg');
                const avatarBlob: any = await getImage(croppedImage, 300, 300, 'image/jpeg');

                resolve({avatar: avatarBlob, image: imageBlob})
            }
        })
    };

    handleCropperUpdate = (e: React.MouseEvent<HTMLButtonElement>) => {
        const {croppedImageUpdate} = this.props;
        const {image, avatar} = this.state;

        if (image && avatar) {
            croppedImageUpdate({image, avatar});
        }

    };

    handleCropperDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
        const {cropPopupDismiss} = this.props;

        cropPopupDismiss()
    };


    handleOutSideClick = (event: any) => {
        const {cropPopupDismiss} = this.props;
        const popUpBlock = document.getElementById("avatar-cropper-popup-block");

        if (popUpBlock && !popUpBlock.contains(event.target)) {
            cropPopupDismiss();
        }
    };

    handleEscapePress = (event: any) => {
        event.stopPropagation();
        const {cropPopupDismiss} = this.props;
        if (event.key === "Escape") {
            cropPopupDismiss();
        }
    };


    render() {
        const localization: any = components().createGroupPopup;
        const {crop} = this.state;

        return (
            <div id={"avatar-cropper-popup"} className={"avatar-cropper-popup"}>
                <div id={"avatar-cropper-popup-block"} className={"avatar-cropper-popup-block"}>


                    <div className={"avatar-cropper-popup-header"}>
                        <h2>
                            {localization.cropImage}
                        </h2>
                    </div>


                    <div className={"avatar-cropper-popup-body"}>

                        <ReactCrop
                            src={this._imageUrl}
                            crop={crop}
                            onImageLoaded={this.handleRefRetrieve}
                            onComplete={this.handleCropComplete}
                            onChange={this.handleCropChange}
                        />

                    </div>


                    <div className={"avatar-cropper-popup-footer"}>
                        <div className={"btn-block"}>
                            <button className={"btn-cancel"}
                                    onClick={this.handleCropperDismiss}>{localization.cancel}</button>
                            <button className={"btn-done"}
                                    onClick={this.handleCropperUpdate}>{localization.done}</button>
                        </div>
                    </div>

                </div>

            </div>

        );
    }
};
