"use strict";

import * as React from "react";
import Cropper from 'react-cropper';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {AVATAR_SIZE} from "configs/constants";
import components from "configs/localization";
import "scss/pages/left-panel/AvatarPopUp";
import { ImageManager } from "helpers/ImageHelper";

interface IAvatarCropPopUpProps {
    uploadAvatar: any;
    cancel: any;
    image: any;
    croppedNode?: (node) => void;
    goBack?: () => void;
    attemptUpdateProfile?: (user, updateUser) => void;
    user?: any,
    firstName?: string,
    lastName?: string,
    isEditableModeOn?: boolean,
    isEditProfile?: boolean,
    handleAvatarLoaderChange?: () => void
}

interface IAvatarCropPopUpState {
    optimisedImage: any;
}

const selectorParams: any = {
    user: true
};

export default class CropAvatarPopUp extends React.Component<IAvatarCropPopUpProps, IAvatarCropPopUpState> {

    constructor(props) {
        super(props);
        
        this.state = {
            optimisedImage: null
        };
    }

    avatar;
    uploadedAvatar: any  = {};

    setRef = (ref) => {
      ref ? this.avatar = ref: null;
    };

    avatarCrop: any = async () => {
        const file: any = await this.avatar;

        file.getCroppedCanvas({
            width: AVATAR_SIZE.maxWidth,
            height: AVATAR_SIZE.maxHeight,
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'high'

        }).toBlob((originalBlob) => {
            this.uploadedAvatar.original = originalBlob;
        });

        file.getCroppedCanvas({
            width: AVATAR_SIZE.minWidth,
            height: AVATAR_SIZE.minHeight,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'medium'

        }).toBlob((croppedBlob) => {
            this.uploadedAvatar.cropped = croppedBlob
        });
    };

    handleAvatarCrop = (event:any) => {
        const {uploadAvatar, user, firstName, lastName, isEditableModeOn, attemptUpdateProfile} = this.props;
        event.nativeEvent.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        uploadAvatar(this.uploadedAvatar);

        if (!isEditableModeOn) {
            const updateUser = {
                firstName,
                lastName,
                isAvatarChange: !isEditableModeOn,
                image: this.uploadedAvatar,
                deleted: false
            };

            attemptUpdateProfile(user, updateUser);
        }
    };

    async componentDidMount(){
        const {image} = this.props;
        const thumb = await new Promise((resolve) => {
            ImageManager.resize(image, {
                width: 1000,
                height: 1000,
                keepOriginal: true,
                isFlex: true
            }, (blob) => {
                resolve(blob);
            });
        });
        this.setState({optimisedImage:window.URL.createObjectURL(thumb)});
    }

    render() {
        const {cancel, image, croppedNode} = this.props;
        const {optimisedImage} = this.state;
        const localization: any = components().profilePanel;

        return (
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}>
                {
                    optimisedImage &&
                    <div className="avatar-crop-popup">
                        <div className="popup-content" ref={optimisedImage ? croppedNode : null}>
                            <h2 className="crope-title">Crop the picture</h2>
                            <div className="cropping-area">
                                <div className="cropping-img">
                                    {
                                        optimisedImage && <Cropper
                                            ref={this.setRef}
                                            crop={this.avatarCrop}
                                            src={optimisedImage}
                                            style={{height: 320, width: '100%'}}
                                            aspectRatio={1}
                                            guides={false}
                                            zoomable={true}
                                            viewMode={2}
                                        />
                                    }

                                </div>
                            </div>
                            <div className="cropping-buttons">
                                <button className="crop-btn" onClick={cancel}>{localization.cancel}</button>
                                <button className="crop-btn" onClick={this.handleAvatarCrop}>{localization.done}</button>
                            </div>
                        </div>
                    </div>
                }
            </ReactCSSTransitionGroup>
        );
    }
}

