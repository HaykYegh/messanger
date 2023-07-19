"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {getThumbnail, getVideoFile} from "helpers/FileHelper";
import components from "configs/localization";
import {ESC_KEY_CODE} from "configs/constants";
import {VideoWrapper} from "containers/chat-panel/Footer/style";
import Log from "modules/messages/Log";

interface ITakeVideoProps {
    send: (file: File, voiceDuration: number, caption: string, thumb: string, blob: Blob, amplitudes?: string, m_options?: any) => void;
    mediaToggle: (e?: any, mediaName?: string) => void;
}

interface ITakeVideoState {
    currentTime: number;
    recording: boolean;
    paused: boolean;
    error: string;
    blob: Blob;
    timer: any;
}

export default class TakeVideo extends React.Component<ITakeVideoProps, ITakeVideoState> {

    constructor(props: any) {
        super(props);

        this.state = {
            recording: false,
            paused: false,
            currentTime: 0,
            timer: null,
            blob: null,
            error: ""
        }
    }

    get videoContainer(): HTMLDivElement {
        return this._videoContainer;
    }

    set videoContainer(ref: HTMLDivElement) {
        this._videoContainer = ref;
    }

    get videoContent(): HTMLDivElement {
        return this._videoContent;
    }

    set videoContent(ref: HTMLDivElement) {
        this._videoContent = ref;
    }

    get video(): any {
        return this._video;
    }

    set video(value: any) {
        this._video = value;
    }

    private _videoContent: HTMLDivElement = null;
    private _videoContainer: HTMLDivElement = null;
    private _video: any = null;

    componentDidMount(): void {

        document.addEventListener("keydown", this.handleEscPress);
        this.videoContainer.addEventListener("click", this.handleOutSideClick);

        this.video = (window as any).videojs("video-instance", {
            controls: false,
            width: 455,
            height: 340,
            autoplay: true,
            plugins: {
                record: {
                    videoMimeType: "video/webm;codecs=H264",
                    maxLength: 7200,
                    video: true,
                    audio: true
                }
            }
        });

        this.video.record().enumerateDevices();

        this.video.on("enumerateReady", () => {
            this.video.record().getDevice();
        });

        this.video.on("enumerateError", () => {
            this.setState({error: this.video.enumerateErrorCode.message || "Permission Denied"})
        });

        this.video.on("deviceError", () => {
            this.setState({error: this.video.deviceErrorCode.message || "Permission Denied"})
        });

        this.video.on("error", error => {
            console.dir("error:", error);
        });

        this.video.on("startRecord", () => {
            const timer: any = setInterval(() => {
                const {currentTime} = this.state;
                this.setState({currentTime: currentTime + 0.2});
            }, 200);
            this.setState({recording: true, timer});
        });

        this.video.on("finishRecord", () => {
            this.setState({recording: false, paused: false});
            const blob: Blob | any = this.video.recordedData.video;
            clearInterval(this.state.timer);

            (async (blob) => {
                const videoFile: any = await getVideoFile(blob);

                videoFile.duration = this.state.currentTime;
                this.setState({blob: videoFile});
            })(blob)
        });
    };

    shouldComponentUpdate(nextProps: ITakeVideoProps, nextState: ITakeVideoState): boolean {
        return !isEqual(this.state, nextState);
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleEscPress);
        this.videoContainer.removeEventListener("click", this.handleOutSideClick);
        this.video.record().destroy();
    }

    handleEscPress = (event: any): any => {
        if (event.keyCode === ESC_KEY_CODE) {
            this.handleClosePopUp();

        } else {
            event.preventDefault();
        }
    };

    handleOutSideClick = (event: any): any => {
        if (this.videoContent && !this.videoContent.contains(event.target)) {
            this.handleClosePopUp();
        }
    };

    handleClosePopUp = (): void => {
        const {mediaToggle} = this.props;
        mediaToggle(null, 'takeVideo');
    };

    handleRecordingStart = (): void => {
        this.video.record().start();
    };

    handleRecordingResume = (): void => {
        this.setState({paused: false});
        this.video.record().resume();
    };

    handleRecordingPause = (): void => {
        this.setState({paused: true});
        this.video.record().pause();
    };

    handleRecordingStop = (): void => {
        this.video.record().stop();
    };

    handleVideoReset = (): void => {
        this.setState({blob: null});
        this.video.record().reset();
        this.video.record().enumerateDevices();
    };

    handleVideoSend = async (): Promise<any> => {
        const {send} = this.props;
        const {blob} = this.state;
        const files: any = [blob];

        // var dataUrl = window.URL.createObjectURL(blob)
        // var link = document.createElement('a')
        // link.href = dataUrl
        // link.download = 'recording.mp4'
        // link.click()

        this.handleClosePopUp();
        const thumb = await getThumbnail(blob, true, false, true);

        const m_options: any = {
            width: thumb.toSaveWidth,
            height: thumb.toSaveHeight
        }
        send(files[0],  undefined, undefined, thumb.url, null, undefined, m_options); // Todo Move to saga
    };

    render(): JSX.Element {
        const {blob, recording, paused, error} = this.state;
        const {mediaToggle} = this.props;
        const localization: any = components().takeVideo;

        return (
            <div className="take_photo" ref={ref => this.videoContainer = ref}>
                {error ?
                    <div className="photo_content" ref={ref => this.videoContent = ref}>
                        {error}
                    </div> :
                    <div className="photo_content" ref={ref => this.videoContent = ref}>
                        <div className="close_photo" onClick={mediaToggle} data-media="takeVideo"/>
                        <div className="top-block">
                            <VideoWrapper>
                                <video id="video-instance" className="video-js vjs-default-skin"/>
                            </VideoWrapper>
                        </div>
                        <div className="bottom-block">
                            <div className="bottom-content">
                                {blob ?
                                    <div className="send_btn">
                                        <span onClick={this.handleVideoReset}>{localization.retake}</span>
                                        <span onClick={this.handleVideoSend}>{localization.sendVideo}</span>
                                    </div> :
                                    <div className="take-video-photo">
                                        {!recording ?
                                            <div className="video_btn" onClick={this.handleRecordingStart}>
                                                <span className="video_btn_ico"/>
                                                <span className="video_btn_info">{localization.takeVideo}</span>
                                            </div> :
                                            <React.Fragment>
                                                <div
                                                    className="video_btn"
                                                    onClick={paused ? this.handleRecordingResume : this.handleRecordingPause}
                                                >
                                                    <span
                                                        className={`video_btn_ico${paused ? ' video_btn_resume_ico' : ' video_btn_pause_ico'}`}/>
                                                    <span className="video_btn_info">
                                                        {paused ? localization.resume : localization.pause}
                                                    </span>
                                                </div>
                                                <div className="video_btn" onClick={this.handleRecordingStop}>
                                                    <span className="video_stop_recording-ico"/>
                                                    <span className="video_btn_info">{localization.stopRecording}</span>
                                                </div>
                                            </React.Fragment>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}
