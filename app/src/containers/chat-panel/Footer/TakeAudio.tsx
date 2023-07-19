"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {getAudioFile} from "helpers/FileHelper";
import components from "configs/localization";
import {getTime} from "helpers/DateHelper";
import {checkForMediaAccess} from "helpers/MessageBoxHelper";
import {ENTER_KEY_CODE, ESC_KEY_CODE, MEDIA_ACCESS_TYPE} from "configs/constants";
import {getWaves} from "helpers/DataHelper";
import Log from "modules/messages/Log";

interface ITakeAudioProps {
    send: (object: any) => void;
    mediaToggle: (event: any) => void;
    setAudioContainerRef: (ref: HTMLDivElement) => void;
    isAudioRecording: boolean;
    handleAudioRecording: (isRecording: boolean) => void;
    language: string;
}

interface ITakeAudioState {
    currentTime: number;
    isPaused: boolean;
    error: string;
    blob: Blob;
    timer: any;
}

export default class TakeAudio extends React.Component<ITakeAudioProps, ITakeAudioState> {

    constructor(props: any) {
        super(props);
        this.state = {
            currentTime: 0,
            isPaused: false,
            timer: null,
            blob: null,
            error: ""
        }
    }

    mounted: boolean;

    get audio(): any {
        return this._audio;
    }

    set audio(value: any) {
        this._audio = value;
    }

    private _audio: any;
    audioContext: AudioContext;
    analyser: AnalyserNode;
    scriptProcessor: ScriptProcessorNode;
    input: MediaStreamAudioSourceNode;
    bars: any = [];

    componentDidMount(): void {
        const {handleAudioRecording} = this.props;
        this.mounted = true;
        this.audio = (window as any).videojs("audio-instance", {
            controls: true,
            width: 600,
            height: 300,
            plugins: {
                wavesurfer: {
                    progressColor: "#2E732D",
                    hideScrollbar: true,
                    waveColor: "black",
                    cursorWidth: 1,
                    src: "live"
                },
                record: {
                    audioMimeType: "audio/mp3",
                    audioWorkerURL: "./js/worker-realtime.js",
                    audioEngine: "lamejs",
                    maxLength: 7200,
                    video: false,
                    audio: true
                }
            }
        });

        setTimeout(() => {
            this.audio.record().enumerateDevices();
        }, 0);

        this.audio.on("enumerateReady", () => {
            this.audio.record().getDevice();
        });

        this.audio.on("enumerateError", () => {
            this.setState({error: this.audio.enumerateErrorCode.message || "Permission Denied"})
        });

        this.audio.on("deviceError", () => {
            this.setState({error: this.audio.deviceErrorCode.message || "Permission Denied"})
        });

        this.audio.on("error", error => {
            console.dir("error:", error);
        });

        this.audio.on("startRecord", () => {
            const timer: any = setInterval(() => {
                const {currentTime} = this.state;
                this.setState({currentTime: currentTime + 1});
            }, 1000);
            this.setState({timer});
            handleAudioRecording(true);
        });

        this.audio.on("finishRecord", () => {

            const blob: Blob = this.audio.recordedData;
            clearInterval(this.state.timer);
            (async (blob) => {
                const audioFile: any = await getAudioFile(blob);
                this.setState({isPaused: false, blob: audioFile, timer: null});
                handleAudioRecording(false);
            })(blob);

        });
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 1024;

        document.addEventListener('keydown', this.handleKeydown);
    };

    shouldComponentUpdate(nextProps: ITakeAudioProps, nextState: ITakeAudioState): boolean {
        if (this.props.isAudioRecording !== nextProps.isAudioRecording) {
            return true;
        }

        return !isEqual(this.state, nextState);
    };

    componentWillUnmount(): void {
        this.mounted = false;
        this.disconnectAudioContext();
        this.audio.record().destroy();
        clearInterval(this.state.timer);
        document.removeEventListener('keydown', this.handleKeydown);

    };

    disconnectAudioContext = () => {
        this.scriptProcessor && this.scriptProcessor.removeEventListener("audioProcess", this.processInput);
        this.scriptProcessor && this.scriptProcessor.disconnect();
        this.input && this.input.disconnect();
        this.audioContext && this.audioContext.close()
            .then(res => Log.i(res))
            .catch(err => Log.i(err));
    };


    handleKeydown = (event) => {
        const {isAudioRecording} = this.props;
        const {blob} = this.state;

        if (event.keyCode === ESC_KEY_CODE && !isAudioRecording) {
            this.props.mediaToggle(event);
        }

        if(event.keyCode === ENTER_KEY_CODE && blob && !isAudioRecording) {
            this.handleAudioSend(event);
        }

        event.preventDefault();
    };

    handleAudioSend = (event: any) => {
        const waves = getWaves(this.bars);
        const {send, mediaToggle} = this.props;
        const {blob} = this.state;
        const voiceDuration: number = Math.round(this.audio.record().streamDuration);
        const files: any = [blob];
        const currentTarget: any = {files};
        if (voiceDuration && voiceDuration >= 1) {
            send({currentTarget, voiceDuration, amplitudes: JSON.stringify(waves)});
            mediaToggle(event);
        } else {
            this.setState({
                currentTime: 0,
                isPaused: false,
                timer: null,
                blob: null,
                error: ""
            })
        }
    };

    handleRecordingStop = (): void => {
        if(this.mounted) {
            this.disconnectAudioContext();
            this.audio.record().stop();
            clearInterval(this.state.timer);
            this.setState({timer: null});
        }
    };

    getAverageVolume = (array) => {
        const length = array.length;

        let values = 0;
        let i = 0;

        for (; i < length; i++) {
            values += array[i];
        }

        return values / length;
    };

    processInput = () => {
        const array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        this.bars.push(this.getAverageVolume(array));
    };


    handleRecordingStart = (): void => {
        checkForMediaAccess(MEDIA_ACCESS_TYPE.MICROPHONE, () => {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(stream => {
                    Log.i(stream);
                    if(this.mounted && !this.audio.record().isRecording()) {
                        this.audio.record().start();
                        this.input = this.audioContext.createMediaStreamSource(stream);
                        this.input.connect(this.analyser);
                        this.analyser.connect(this.scriptProcessor);
                        this.scriptProcessor.connect(this.audioContext.destination);
                        this.scriptProcessor.addEventListener("audioprocess", this.processInput);
                    }
                })
                .catch(e => console.error(e))
        });
    };

    render(): JSX.Element {
        const {blob, currentTime, error} = this.state;
        const {mediaToggle, setAudioContainerRef, isAudioRecording, language} = this.props;
        const localization: any = components().takeAudio;

        return (
                <div className={language === "ar" ? "audio_record audio-record-reverse": "audio_record"} id="audio_record" ref={setAudioContainerRef}>
                    {error ?
                        <div className="record_content">
                            {error}
                        </div>
                        : <div className="record_content">
                            <div className="top-block">
                                <span className="duration">{getTime(currentTime)}</span>
                                {
                                    blob &&
                                    <span className="cancel-btn" onClick={mediaToggle}>{localization.cancel}</span>
                                }
                            </div>
                            <div className="record-block">
                                <audio id="audio-instance" className="video-js vjs-default-skin"
                                       style={{opacity: 0, position: "absolute", zIndex: -1, display: "none"}}/>
                                <div
                                    onClick={(!isAudioRecording && !blob) ? this.handleRecordingStart : isAudioRecording ? this.handleRecordingStop : this.handleAudioSend}
                                    className={`record_btn${isAudioRecording ? ' record_btn_animation' : ''}`}
                                >
                                <span className="record-btn-text">
                                    {
                                        !isAudioRecording && !blob ? localization.record :
                                            isAudioRecording ? localization.stop : blob ? localization.send : ''
                                    }
                                </span>
                                </div>
                            </div>
                            <div className="bottom-block">
                                <span className="audio-info">{localization.audioInfo}</span>
                            </div>
                        </div>
                    }
                </div>
        )
    }
}
