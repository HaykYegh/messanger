"use strict";

import * as React from "react";

import {base64ToFile} from "helpers/FileHelper";
import {ESC_KEY_CODE} from "configs/constants";
import components from "configs/localization";
import Audio from "components/common/Audio";

interface ITakePhotoProps {
    send: (object: any) => void;
    mediaToggle: (e?: any, mediaName?: string) => void;
}

interface ITakePhotoState {
    base64: string;
    error: string;
}

export default class TakePhoto extends React.Component<ITakePhotoProps, ITakePhotoState> {

    constructor(props: any) {
        super(props);

        this.state = {
            base64: null,
            error: ""
        }
    }

    get photoContainer(): HTMLDivElement {
        return this._photoContainer;
    }

    set photoContainer(ref: HTMLDivElement) {
        this._photoContainer = ref;
    }

    get photoContent(): HTMLDivElement {
        return this._photoContent;
    }

    set photoContent(ref: HTMLDivElement) {
        this._photoContent = ref;
    }

    get photo(): any {
        return this._photo;
    }

    set photo(value: any) {
        this._photo = value;
    }

    private _photoContent: HTMLDivElement = null;
    private _photoContainer: HTMLDivElement = null;
    private _photo: any = null;
    public audio: any;

    componentDidMount(): void {

        document.addEventListener("keydown", this.handleEscPress);
        this.photoContainer.addEventListener("click", this.handleOutSideClick);

        this.photo = (window as any).videojs("myVideo", {
            controls: false,
            width: 455,
            height: 340,
            plugins: {
                record: {
                    image: true
                }
            }
        });

        this.photo.record().enumerateDevices();

        this.photo.on("enumerateReady", () => {
            this.photo.record().getDevice();
        });

        this.photo.on("enumerateError", () => {
            this.setState({error: this.photo.enumerateErrorCode.message || "Permission Denied"})
        });

        this.photo.on("deviceError", () => {
            this.setState({error: this.photo.deviceErrorCode.message || "Permission Denied"})
        });

        this.photo.on("error", error => {
            console.dir("error:", error);
        });

        this.photo.on("startRecord", () => {
            if (this.audio) {
                return this.audio.play();
            }
        });

        this.photo.on("finishRecord", () => {
            const base64: string = this.photo.recordedData;
            this.setState({base64});
        });
    };

    shouldComponentUpdate(nextProps: ITakePhotoProps, nextState: ITakePhotoState): boolean {
        return this.state.base64 !== nextState.base64 || this.state.error !== nextState.error;
    }

    componentWillUnmount(): void {
        this.photo.record().destroy();
        document.removeEventListener("keydown", this.handleEscPress);
        this.photoContainer.removeEventListener("click", this.handleOutSideClick);
    }

    handleEscPress = (event: any) => {
        if (event.keyCode === ESC_KEY_CODE) {
            this.handleClosePopUp();
        }
    };

    handleOutSideClick = (event: any): any => {
        if (this.photoContent && !this.photoContent.contains(event.target)) {
            this.handleClosePopUp();
        }
    };

    handleClosePopUp = (): void => {
        const {mediaToggle} = this.props;
        mediaToggle(null, 'takePhoto');
    };

    handlePhotoRetake = () => {
        this.setState({base64: null});
        this.photo.record().reset();
        this.photo.record().enumerateDevices();
    };

    handlePhotoSend = (): void => {
        const {send} = this.props;
        const {base64} = this.state;
        const file: File = base64ToFile(base64, `screenShot${Date.now()}.jpeg`);
        const files: any = [file];
        const currentTarget: any = {files};
        send({currentTarget}); // Todo Move to saga
        this.handleClosePopUp();
    };

    handleScreenShot = (): void => {
        this.photo.record().start();
    };

    setAudioRef = (ref: HTMLAudioElement): void => {
        this.audio = ref;
    };

    render(): JSX.Element {
        const {base64, error} = this.state;
        const {mediaToggle} = this.props;
        const localization: any = components().takePhoto;

        return (
            <div className="take_photo" ref={ref => this.photoContainer = ref}>
                {
                    error ?
                        <div
                            className="photo_content"
                            ref={ref => this.photoContent = ref}
                        >{error}
                        </div> :
                        <div className="photo_content" ref={ref => this.photoContent = ref}>
                            <div className="close_photo" onClick={mediaToggle} data-media="takePhoto"/>
                            <div className="top-block">
                                <video id="myVideo" className="video-js vjs-default-skin"/>
                            </div>
                            <div className="bottom-block">
                                <div className="bottom-content">
                                    {base64 ?
                                        <div className="send_btn">
                                            <span onClick={this.handlePhotoRetake}>{localization.retake}</span>
                                            <span onClick={this.handlePhotoSend}>{localization.sendPhoto}</span>
                                        </div> :
                                        <div className="take-video-photo">
                                            <div className="photo_btn" onClick={this.handleScreenShot}>
                                                <span className="photo_btn_ico"/>
                                                <span className="photo_btn_info">{localization.takePhoto}</span>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                }
                <Audio setRef={this.setAudioRef} fileName="camerasound"/>
            </div>
        )
    }
}
