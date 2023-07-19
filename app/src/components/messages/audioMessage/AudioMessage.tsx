"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import format from "date-fns/format";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {getAudioMeta, getBlobUri} from "helpers/FileHelper";
import MessagesModel from "modules/messages/MessagesModel";
import IDBMessage from "services/database/class/Message";
import "scss/pages/chat-panel/helpers/VoiceMessagePopUp";
import PopUpMain from "components/common/PopUpMain";
import {LOAD_STATUS} from "configs/constants";
import components from "configs/localization";
import {
    AudioBlock,
    AudioProgressBar,
    ProgressBar,
    VoiceAmplitude,
    AudioDuration, VoiceAmplitudesContainer
} from "components/messages/audioMessage/style";
import Log from "modules/messages/Log";

interface IAudioMessageProps {
    handleAudioChange?: (audio: HTMLAudioElement) => void;
    createMessage?: (message: any) => void;
    downloadFile?: (downloadInfo: any) => void;
    updateMessageProperty?: (msgId, property, value) => void;
    deleteMessage?: (msgId) => void;
    stopProcess?: (uploadStarted: any) => void;
    uploadFile?: (messages: any, file: any) => void;
    resetConversationLastMessage?: (threadId: string) => void;
    fromSharedMedia?: boolean;
    sharedMediaPanel?: boolean;
    message?: any;
    messagesLoadStatus?: any;
    file: File;
}

interface IAudioMessageState {
    audioFile: Blob | File;
    showLoader: boolean;
    audioTime: number;
    progress: number;
    playing: boolean;
    loadCancelled: boolean;
    uploadStarted: boolean;
    meta: any;
    showErrorPopup: boolean;
}

export default class AudioMessage extends React.Component<IAudioMessageProps, IAudioMessageState> {

    audio: HTMLAudioElement;

    mounted: boolean = true;

    blobUri: string;

    constructor(props: IAudioMessageProps) {
        super(props);

        this.state = {
            showLoader: false,
            loadCancelled: false,
            uploadStarted: false,
            audioFile: null,
            playing: false,
            audioTime: 0,
            progress: 0,
            meta: {},
            showErrorPopup: false
        }
    }

    async componentDidMount() {
        const {message} = this.props;
        let loadStatus = message.get("loadStatus");
        const msgId = message.get("id") || message.get("messageId");

        document.addEventListener(msgId, this.handleAudioUpload);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true});
        } else {
            this.startLoadProcess(true);
        }
    }

    get amplitudes() {
        const {message} = this.props;
        const msgInfo: string = message.get("info");
        let amplitudes: number[] = null;
        try {
            amplitudes = msgInfo && JSON.parse(msgInfo);

        } catch (e) {
            Log.i(e);
        }
        const {audioTime, meta} = this.state;
        const perLineDuration: number = meta.duration / 50;

        if (amplitudes && amplitudes.length > 0) {
            const len: number = amplitudes.length;
            const voiceAmplitudeView: JSX.Element[] = [];
            for (let k: number = 0; k < len; k++) {
                const durationOnIndex = perLineDuration * k;
                voiceAmplitudeView.push(
                    <VoiceAmplitude
                        key={k}
                        onClick={() => this._handleMovePosition(durationOnIndex)}
                        style={{
                            width: "2px",
                            height: `${Math.round(amplitudes[k])}%`,
                            minHeight: "10%",
                            maxHeight: "30px",
                            backgroundColor: durationOnIndex < audioTime ? "RGB(23,171,246)" : "RGBA(23,171,246,0.5)"
                        }}
                    />
                )
            }


            return (
                <VoiceAmplitudesContainer>
                    {voiceAmplitudeView}
                </VoiceAmplitudesContainer>
            );
        }
        return null;
    }

    shouldComponentUpdate(nextProps: IAudioMessageProps, nextState: IAudioMessageState): boolean {
        const {message} = this.props;

        if (message.get("text") !== nextProps.message.get("text")) {
            return true;
        }

        if (message && message.get("IsTransferred") !== nextProps.message.get("IsTransferred")) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IAudioMessageProps, prevState: IAudioMessageState) {
        const {message} = this.props;
        const {showLoader, uploadStarted} = this.state;
        const isUpload = showLoader && uploadStarted;
        const messageIsEmpty = !message && !prevProps.message;

        if ((!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred"))) {
            this.setState({showLoader: false, progress: 0, uploadStarted: false});
        }

        if (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload) {
            this.setState({showLoader: false, uploadStarted: false});
        }
    }

    componentWillUnmount(): void {
        const {message} = this.props;
        this.mounted = false;
        document.removeEventListener(message.get("id") || message.get("messageId"), this.handleAudioUpload);
    }

    startLoadProcess = async (loadStarted?: any) => {
        const {message, createMessage, file, downloadFile, uploadFile, fromSharedMedia} = this.props;
        const {loadCancelled, audioFile, meta, uploadStarted} = this.state;
        const msgId = message.get("id") || message.get("messageId");
        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;

        if ((!file && !audioFile) || message.get("IsTransferred")) {
            let audio: Blob | File;
            audio = await MessagesModel.get(message.get("fileRemotePath"));
            const {showLoader} = this.state;

            if (!audio && (loadStatus === LOAD_STATUS.UPLOAD_SUCCESS || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS) && loadStarted === true) {
                this.setState({showLoader: true, loadCancelled: true});
            } else if (!audio) {
                if (this.mounted) {
                    this.setState({showLoader: true, loadCancelled: false});
                }

                const downloadInfo = {
                    fileRemotePath: message.get("fileRemotePath"),
                    method: "GET",
                    time: message.get("time"),
                    threadId: message.get("threadId"),
                    msgId
                };

                if (!showLoader || loadCancelled) {
                    downloadFile(downloadInfo);
                }

            } else if ((!file && !audioFile) && uploadStarted) {
                uploadedFileDeleted = true;
            } else {
                const audioUrl = getBlobUri(audio);
                const meta = await getAudioMeta(audioUrl);
                if (message.get("loadStatus") === LOAD_STATUS.LOAD_START) {
                    this.setState({meta, audioFile: audio, showLoader: true, uploadStarted: true});
                } else {
                    this.setState({meta, audioFile: audio});
                }
            }

        } else {
            if (loadStarted !== true) {
                const sendMessage = createMessage(message.toJS());

                if ((window as any).fs) {
                    const fileExist = await MessagesModel.checkFileInFolder(message);
                    if (!fileExist) {
                        uploadedFileDeleted = true;
                    }
                }

                !uploadedFileDeleted && uploadFile({
                    message: sendMessage,
                    messageToSave: message.toJS()
                }, file || audioFile);
            }
            if (!uploadedFileDeleted) {
                let audioMeta: any = null;
                if (Object.keys(meta).length === 0) {
                    const audioUrl = getBlobUri(file);
                    audioMeta = await getAudioMeta(audioUrl);
                }
                !fromSharedMedia && this.setState({
                    meta: (audioMeta || meta),
                    showLoader: true,
                    uploadStarted: true,
                    loadCancelled: false
                });
            }
        }
        if (uploadedFileDeleted) {
            this.setState({showErrorPopup: true, showLoader: true, loadCancelled: false})
        }
    };

    deleteMessage = async () => {
        const {message, deleteMessage, resetConversationLastMessage} = this.props;
        const messageId = message.get("messageId") || message.get("id");
        if (messageId) {
            await IDBMessage.addMessageStatus(messageId, {loadStatus: LOAD_STATUS.UPLOAD_CANCEL});
            deleteMessage(messageId);
        }
        resetConversationLastMessage(message.get("threadId"));
    };

    handleAudioUpload = async ({detail: {progress, blob, loadStatus}}) => {
        const {deleteMessage, resetConversationLastMessage, message} = this.props;
        const obj: any = {};
        const msgId = message.get("id") || message.get("messageId");
        if (blob) {
            const audioUrl = getBlobUri(blob);
            const meta = await getAudioMeta(audioUrl);
            obj["uploadStarted"] = false;
            obj["showLoader"] = false;
            obj["progress"] = 0;
            obj["audioFile"] = blob;
            obj["meta"] = meta;

        } else {
            const {showLoader} = this.state;
            if (!showLoader) {
                obj["showLoader"] = true;
            }
            obj["progress"] = progress;
        }
        if (loadStatus) {
            obj["loadCancelled"] = true;
            const {updateMessageProperty} = this.props;

            if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL) {
                deleteMessage(msgId);
                resetConversationLastMessage(message.get("threadId"));
            } else {
                updateMessageProperty(msgId, "loadStatus", loadStatus);
            }
        } else {
            obj["loadCancelled"] = false;
        }
        if (this.mounted) {
            this.setState(obj);
        }
    };

    handleMovePosition = ({currentTarget: {valueAsNumber}}: React.ChangeEvent<HTMLInputElement>): void => {
        if (!this.audio) {
            return;
        }
        if (this.state.audioTime !== valueAsNumber) {
            this.setState({audioTime: valueAsNumber}, () => {
                this.audio.currentTime = valueAsNumber;
            });
        }
    };

    _handleMovePosition = (durationAtIndex: number): void => {
        const {meta} = this.state;

        if (!this.audio) {
            return;
        }
        if (this.state.audioTime !== durationAtIndex && meta.duration > durationAtIndex) {
            this.setState({audioTime: durationAtIndex}, () => {
                this.audio.currentTime = durationAtIndex;
            });
        }
    };

    handleTimeUpdate = (): void => {
        this.setState({audioTime: this.audio.currentTime});
    };

    handleAudioEnd = (): void => {
        this.setState({audioTime: 0, playing: false}, () => {
            this.audio.currentTime = 0;
        });
    };

    handleAudioPause = (): void => {
        this.audio.pause();
        this.setState({playing: false});
    };

    handleAudioPlay = (): void => {
        const {handleAudioChange} = this.props;
        handleAudioChange(this.audio);
        this.setState({playing: true});
    };

    handlePause = (): void => {
        this.setState({playing: false});
    };

    handleAudioRef = (ref) => {
        this.audio = ref;
    };


    render(): JSX.Element {
        const {file, stopProcess, message} = this.props;
        const {playing, audioTime, audioFile, meta, showLoader, progress, loadCancelled, uploadStarted, showErrorPopup} = this.state;
        const audio = file || audioFile;
        const infoDuration = audio && message.get("info");
        const duration = meta.duration && meta.duration > 0 ? Math.ceil(meta.duration) : (infoDuration ? Math.ceil(infoDuration) : 0.01);
        const localization: any = components().notification;
        const isStream = audio && audio.size > 0;
        let fileUrl: string = this.blobUri;

        if (audio && !this.blobUri) {
            fileUrl = getBlobUri(audio);
            this.blobUri = fileUrl;
        }

        const _audioTime: string = !isNaN(audioTime) ? format(audioTime * 1000, "mm:ss") : format(0, "mm:ss");
        const _duration: string = !isNaN(duration) ? format(duration * 1000, "mm:ss") : format(0, "mm:ss");

        return (
            <AudioBlock className="audio-block">
                {
                    showLoader ?
                        <div className='bg-circle'>
                            <div className="ko-progress-circle" data-progress={progress}>
                                <div className="ko-circle">
                                    <div className="full ko-progress-circle__slice">
                                        <div className="ko-progress-circle__fill"/>
                                    </div>
                                    <div className="ko-progress-circle__slice">
                                        <div className="ko-progress-circle__fill"/>
                                        <div className="ko-progress-circle__fill ko-progress-circle__bar"/>
                                    </div>
                                </div>
                                <div className='ko-progress-circle__overlay'/>
                            </div>
                            <button
                                onClick={!loadCancelled ? (() => stopProcess(uploadStarted)) : this.startLoadProcess}
                                className={`${showLoader && uploadStarted ? (loadCancelled ? " resend-icon" : " cancel-icon") : (loadCancelled ? " download-icon" : " cancel-icon")}`}
                            />
                        </div> :
                        <span
                            className={`audio-block-icon${playing ? " pause-btn" : " play-btn"}`}
                            onClick={playing ? this.handleAudioPause : isStream ? this.handleAudioPlay : null}
                        />
                }
                <AudioProgressBar>
                    <ProgressBar>
                        {this.amplitudes}
                    </ProgressBar>
                    {isStream ?
                        <React.Fragment>
                            <audio onEnded={this.handleAudioEnd}
                                   onTimeUpdate={this.handleTimeUpdate}
                                   ref={this.handleAudioRef}
                                   preload="auto" controls={true} onPause={this.handleAudioPause}>
                                <source src={fileUrl} type="audio/mpeg"/>
                            </audio>
                        </React.Fragment> : ""}
                    {/*{duration && <span className="audio-duration">{moment.utc(audioTime * 1000).format("mm:ss")} / {moment.utc(duration * 1000).format("mm:ss")}</span>}*/}
                    {
                        duration &&
                        <AudioDuration>{_audioTime} / {_duration}</AudioDuration>
                    }

                </AudioProgressBar>
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
                        showErrorPopup && <PopUpMain confirmButton={this.deleteMessage}
                                                     cancelButton={this.deleteMessage}
                                                     confirmButtonText={localization.close}
                                                     titleText={localization.problemTitle}
                                                     infoText={localization.fileWasDeleted}
                                                     showPopUpLogo={true}/>
                    }
                </ReactCSSTransitionGroup>
            </AudioBlock>
        );
    }
}
