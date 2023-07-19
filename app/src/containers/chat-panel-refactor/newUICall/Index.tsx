"use strict";

import * as React from "react";
import {v4 as uuid} from "uuid";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import throttle from "lodash/throttle";

import {
    acceptCall,
    attemptRemoveCall,
    attemptToggleHold,
    attemptToggleVideo,
    declineCall,
    inviteToCall,
    removeIceCandidate,
    sendHangUp,
    sendIceCandidate,
    sendLocalDescription,
    TOGGLE_IGNORE,
    toggleMic
} from "modules/call/CallActions";
import {
    CALL_AUDIO_PARAMS,
    CALL_DEVICE_PARAMS,
    CALL_PROTOTYPE,
    CALL_STATUSES,
    CALL_VERSION,
    CALL_VIDEO_PARAMS,
    LOG_TYPES,
    LOGS_LEVEL_TYPE,
    MEDIA_ACCESS_TYPE,
    RED5_1
} from "configs/constants";
import {ACTIVATE_CALLER_THREAD} from "modules/application/ApplicationActions";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import IncomingCall from "components/call/IncomingCall";
import {checkForMediaAccess} from "helpers/MessageBoxHelper";
import CallContent from "components/newUICall/CallContent";
import {IContact} from "modules/contacts/ContactsReducer";
import selector, {IStoreProps} from "services/selector";
import PopUpMain from "components/common/PopUpMain";
import {getCallTime} from "helpers/DateHelper";
import {ICall} from "modules/call/CallReducer";
import components from "configs/localization";
import {writeLog} from "helpers/DataHelper";
import "scss/pages/chat-panel/NewCallPanelUI.scss";
import {Strophe} from "strophe";
import Log from "modules/messages/Log";

navigator.getUserMedia = navigator.getUserMedia || (navigator as any).mozGetUserMedia || (navigator as any).webkitGetUserMedia;
const SessionDescription: any = (window as any).RTCSessionDescription || (window as any).mozRTCSessionDescription;
const PeerConnection: any = (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
const IceCandidate: any = (window as any).RTCIceCandidate || (window as any).mozRTCIceCandidate;

interface ICallPanelPassedProps {
    showNotification?: (message: string, contactId: string, threadId: string) => void;
    handleInviteToCall?: (isVideo: boolean, contact: IContact) => void;
    setParentState: (data: any) => void;
    removeCallDetails: () => void;
    minimized: boolean;
    showChat: boolean;
    threadIsEmpty: boolean;
    callDetails: any;

    showCallRadial: boolean;
    handleRadialScreenShow: () => void;
    handleRadialScreenClose: () => void;
}

interface ICallPanelProps extends IStoreProps, ICallPanelPassedProps {
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean) => void;
    sendIceCandidate: (to: string, callid: string, sdpMLineIndex: number, sdpMin: string, candidate: string, outCall: boolean) => void;
    sendLocalDescription: (to: string, callid: string, sdp: string, type: string, onlySet: boolean) => void;
    attemptToggleVideo: (id: string, isVideo: boolean, to: string) => void;
    attemptToggleHold: (id: string, holded: boolean, to: string) => void;
    declineCall: (id: string, to: string, outCall: boolean) => void;
    sendHangUp: (id: string, to: string, outCall: boolean) => void;
    removeIceCandidate: (id: string, candidateId: string) => void;
    acceptCall: (id: string, to: string, sdp: string) => void;
    removeCall: (call: ICall, showNotification: any) => void;
    inviteToCall: (call: any, addNewCall?: boolean) => void;
    resetConnectionVersion: () => void;
    dispatch: any;
    toggleMic: (id: string, mic: boolean) => void;

    ACTIVATE_CALLER_THREAD: () => void;
    TOGGLE_IGNORE: (id: string, ignored?: boolean, isVideo?: boolean) => void;
}

interface ICallPanelState {
    errorMessageIncomingCall: string;
    errorMessageOutgoingCall: string;
    callStartTime: number;
    showKeypad: boolean;
    connected: boolean;
    callerContact: any;
    expanded: boolean;
    outCall: boolean;
    otherUrl: string
    status: string;
    myUrl: string;
    time: number;
    timer: any;
}

const selectorVariables: any = {
    application: {
        app: true
    },
    settings: {
        notification: true,
        languages: true
    },
    contacts: true,
    calls: {
        lastCall: true,
        calls: true
    },
    user: true
};

class CallPanel extends React.Component<ICallPanelProps, ICallPanelState> {

    constructor(props: any) {
        super(props);

        const callStartTime: number = this.props.lastCall && this.props.lastCall.get("callStartTime");
        this.state = {
            errorMessageOutgoingCall: "",
            errorMessageIncomingCall: "",
            callerContact: null,
            showKeypad: false,
            connected: false,
            outCall: false,
            expanded: true,
            callStartTime,
            status: null,
            otherUrl: "",
            timer: null,
            myUrl: "",
            time: 0
        }
    }

    peerConnection: any;

    mediaConstraints: any = {audio: {echoCancellation: true}, video: false};

    sender: any;

    hangupTimer: any;

    handleICECandidateEvent = (event: RTCPeerConnectionIceEvent): void => {
        const {sendIceCandidate, lastCall} = this.props;
        const {outCall} = this.state;

        if (event.candidate && event.candidate.candidate.includes("udp") && lastCall) {
            sendIceCandidate(
                lastCall.get("to"),
                lastCall.get("id"),
                event.candidate.sdpMLineIndex,
                event.candidate.sdpMid,
                event.candidate.candidate,
                outCall
            );
        }
    };

    handleNewICECandidate = (iceCandidate: RTCIceCandidateInit) => {
        const candidate: RTCIceCandidate = new IceCandidate(iceCandidate);

        if (this.peerConnection && this.peerConnection.localDescription.sdp && this.peerConnection.remoteDescription.sdp) {
            if (candidate.candidate.includes("udp")) {
                this.peerConnection.addIceCandidate(candidate)
                    .catch(this.reportError);
            }
        }
    };

    handleCallAccepted = (sdp: RTCSessionDescriptionInit) => {
        const remoteDescription: RTCSessionDescription = new SessionDescription(sdp);
        return this.peerConnection.setRemoteDescription(remoteDescription)
            .catch(this.reportError);
    };

    handleGetUserMediaError = (errorDetails) => {
        writeLog(LOG_TYPES.call, {
            fn: "handleGetUserMediaError",
            errorDetails
        }, LOGS_LEVEL_TYPE.error);
        const {error, outgoing, incoming} = errorDetails;
        const keyName: any = outgoing ? "errorMessageOutgoingCall" : "errorMessageIncomingCall";
        const localization: any = components().callPanel;

        if (!incoming) {
            this.removePeerConnection();
        }

        // switch (error.name) {
        //     case "NotFoundError":
        //         // @ts-ignore
        //         this.setState({[keyName]: "Unable to open your call because no camera and/or microphone were found."});
        //         break;
        //     case "SecurityError":
        //     case "PermissionDeniedError":
        //         console.dir(error.message);
        //         break;
        //     default:
        //         // @ts-ignore
        //         this.setState({[keyName]: `Can not open your camera and/or microphone: ${error.message}`});
        //         break;
        // }
        // @ts-ignore
        this.setState({[keyName]: localization.deviceErrorText});


        Log.i(error, "######### device error");
    };

    handleCallStart = (isVideo: boolean, contact: IContact, outCall: boolean) => {
        const {user} = this.props;

        const call: any = {
            id: `${uuid()}`,
            status: CALL_STATUSES.calling,
            callerData: {
                callPrototype: CALL_PROTOTYPE,
                device: CALL_DEVICE_PARAMS,
                audio: CALL_AUDIO_PARAMS,
                video: CALL_VIDEO_PARAMS,
                version: CALL_VERSION,
                red5: RED5_1
            },
            to: contact.get("username"),
            receiver: contact.get("contactId"),
            caller: user.get("id"),
            callTime: Date.now(),
            iceCandidates: {},
            otherVideo: false,
            myVideo: isVideo,
            ownCall: true,
            email: user.get("email") || "",
            firstName: user.get("firstName") || "",
            lastName: user.get("lastName") || "",
            outCall: outCall,
            mic: true,
            ignored: false
        };

        if (this.peerConnection) {
            this.removePeerConnection();
        }

        this.createPeerConnection();

        navigator.mediaDevices.getUserMedia({
            ...this.mediaConstraints, video: isVideo ? {
                optional: [
                    {minWidth: 320},
                    {minWidth: 640},
                    {minWidth: 1024},
                    {minWidth: 1280},
                    {minWidth: 1920},
                    {minWidth: 2560},
                ]
            } : false
        })
            .then(stream => {
                (window as any).localStream = stream;
                this.setState({myUrl: URL.createObjectURL(stream)});
                stream.getAudioTracks().map(track => this.peerConnection.addTrack(track, stream));
                stream.getVideoTracks().map(track => this.sender = this.peerConnection.addTrack(track, stream));
            })
            .then(() => {
                this.peerConnection.createOffer({offerToReceiveAudio: 1, offerToReceiveVideo: 1})
                    .then(offer => {
                        return this.peerConnection.setLocalDescription(offer);
                    })
                    .then(() => {
                        const {inviteToCall} = this.props;
                        call.callerSdp = this.peerConnection.localDescription.sdp;
                        inviteToCall(call);
                    })
                    .catch(this.reportError);
            })
            .catch((e) => this.handleGetUserMediaError({error: e, outgoing: true}));
    };

    handleAddTrackEvent = (event: RTCTrackEvent) => {
        (window as any).remoteStream = null;
        (window as any).remoteStream = event.streams[0];
        this.setState({otherUrl: URL.createObjectURL((window as any).remoteStream)});
    };

    handleICEConnectionStateChangeEvent = () => {
        if (this.peerConnection) {
            const localization: any = components().callPanel;
            writeLog(LOG_TYPES.call, {
                fn: "handleICEConnectionStateChangeEvent",
                iceConnectionState: this.peerConnection.iceConnectionState
            });
            console.warn("###############################", this.peerConnection.iceConnectionState);
            switch (this.peerConnection.iceConnectionState) {
                case "completed":
                case "connected":
                    if (!this.state.connected) {
                        this.setState({connected: true});
                    }
                    if (this.state.status === localization.connecting) {
                        this.setState({status: ""});
                    }
                    break;
                case "disconnected":
                    if (this.state.status !== localization.connecting) {
                        this.setState({status: localization.connecting});
                    }
                    if (this.state.connected) {
                        this.setState({connected: false});
                    }
                    break;
                case "checking":
                    this.setState({status: localization.connecting});
                    break;
                case "new":
                    if (this.state.connected) {
                        this.setState({connected: false});
                    }
                    break;
                case "failed":
                    this.hangUp();
                    break;
                default:
                    break;
            }
        }
    };

    reportError = (errMessage: any) => {
        writeLog(LOG_TYPES.call, {
            fn: "reportError",
            errorMessage: `Error ${errMessage.name}: ${errMessage.message}`
        }, LOGS_LEVEL_TYPE.error);
        console.dir(`Error ${errMessage.name}: ${errMessage.message}`);
    };

    acceptCall = (isVideo: boolean) => {
        const {errorMessageIncomingCall} = this.state;
        const {attemptToggleVideo, lastCall, acceptCall, removeIceCandidate, setParentState} = this.props;

        setParentState({showChat: false, minimized: false});

        if (isVideo && !errorMessageIncomingCall) {
            attemptToggleVideo(lastCall.get("id"), isVideo, lastCall.get("to"));
        }

        if (this.peerConnection) {
            this.removePeerConnection();
        }

        this.createPeerConnection();

        const desc: RTCSessionDescription = new SessionDescription({type: "offer", sdp: lastCall.get("videoOffer")});

        this.peerConnection.setRemoteDescription(desc).then(() => {
            return navigator.mediaDevices.getUserMedia({
                ...this.mediaConstraints, video: isVideo ? {
                    optional: [
                        {minWidth: 320},
                        {minWidth: 640},
                        {minWidth: 1024},
                        {minWidth: 1280},
                        {minWidth: 1920},
                        {minWidth: 2560},
                    ]
                } : false
            });
        })
            .then(stream => {
                (window as any).localStream = stream;

                this.setState({myUrl: URL.createObjectURL(stream)});

                if (!this.peerConnection) {
                    stream.stop();
                } else {
                    stream.getAudioTracks().map(track => this.peerConnection.addTrack(track, stream));
                    return stream.getVideoTracks().map(track => this.sender = this.peerConnection.addTrack(track, stream));
                }
            })
            .then(() => {
                return this.peerConnection.createAnswer();
            })
            .then(answer => {
                return this.peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                acceptCall(lastCall.get("id"), lastCall.get("to"), this.peerConnection.localDescription.sdp);
                if (lastCall.get("iceCandidates").size > 0) {
                    lastCall.get("iceCandidates").forEach((candidate, id) => {
                        this.handleNewICECandidate(candidate.toJS());
                        removeIceCandidate(lastCall.get("id"), id);
                    });
                }
            })
            .catch((e) => {
                const stream = new MediaStream();
                this.setState({myUrl: URL.createObjectURL(stream)});

                if (!this.peerConnection) {
                    stream.stop();

                } else {
                    stream.getTracks().map(track => this.peerConnection.addTrack(track, stream));
                }

                this.peerConnection.createAnswer()
                    .then((answer) => {
                        return this.peerConnection.setLocalDescription(answer);
                    })
                    .then(() => {
                        acceptCall(lastCall.get("id"), lastCall.get("to"), this.peerConnection.localDescription.sdp);

                        if (lastCall.get("iceCandidates").size > 0) {
                            lastCall.get("iceCandidates").forEach((candidate, id) => {
                                this.handleNewICECandidate(candidate.toJS());
                                removeIceCandidate(lastCall.get("id"), id);
                            });
                        }
                    });
                this.handleGetUserMediaError({
                    error: e,
                    incoming: true
                })
            });
    };

    createPeerConnection = () => {
        this.peerConnection = new PeerConnection({
            iceServers: [{
                urls: ["turn:red011.hawkstream.com:3578"],
                username: "aaa",
                credential: "123456"
            }],
            // iceTransportPolicy: "relay",
            iceCandidatePoolSize: "0"
        });

        this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
        this.peerConnection.onicecandidate = this.handleICECandidateEvent;
        this.peerConnection.ontrack = this.handleAddTrackEvent;
        // this.peerConnection.onnegotiationneeded = this.handleNegotiationNeeded;
    };

    removePeerConnection = () => {
        if (this.peerConnection) {
            (window as any).localStream && (window as any).localStream.getTracks().forEach((track) => {
                track.stop();
            });
            (window as any).remoteStream && (window as any).remoteStream.getTracks().forEach((track) => {
                track.stop();
            });
            this.peerConnection.getLocalStreams().forEach(stream => stream.getTracks().forEach(track => {
                stream.removeTrack(track);
                track.stop();
                stream.stop();
            }));
            this.peerConnection.getRemoteStreams().forEach(stream => stream.getTracks().forEach(track => {
                stream.removeTrack(track);
                track.stop();
                stream.stop();
            }));
            this.peerConnection.signalingState !== "closed" && this.peerConnection.close();
            this.peerConnection = null;
        }
    };

    toggleMinimize = () => {
        const {minimized, setParentState} = this.props;
        this.setState({expanded: false});
        setParentState({minimized: !minimized});
    };

    toggleExpanded = () => {
        const {expanded} = this.state;
        const {showChat, setParentState} = this.props;
        this.setState({expanded: !expanded});

        setParentState({showChat: expanded, minimized: false});
    };

    toggleShowChat = () => {
        const {showChat, setParentState} = this.props;
        setParentState({showChat: !showChat});
    };

    toggleKeypad = () => {
        const {showKeypad} = this.state;
        this.setState({showKeypad: !showKeypad});
    };

    restartCall = () => {
        const {lastCall, inviteToCall} = this.props;

        this.removePeerConnection();

        this.createPeerConnection();

        navigator.mediaDevices.getUserMedia(this.mediaConstraints)
            .then(stream => {
                (window as any).localStream = stream;
                this.setState({myUrl: URL.createObjectURL(stream)});
                stream.getTracks().map(track => this.peerConnection.addTrack(track, stream));
            })
            .then(() => {
                return this.peerConnection.createOffer()
            })
            .then(offer => {
                return this.peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                inviteToCall({...lastCall.toJS(), callerSdp: this.peerConnection.localDescription.sdp}, false);
            })
            .catch(this.handleGetUserMediaError);
    };

    toggleVideo = () => {
        const {lastCall, attemptToggleVideo, sendLocalDescription} = this.props;

        checkForMediaAccess(MEDIA_ACCESS_TYPE.CAMERA, () => {
            if (!lastCall.get("myVideo")) {
                this.setState({myUrl: URL.createObjectURL((window as any).localStream)});
                navigator.mediaDevices
                    .getUserMedia({video: true})
                    .then(stream => {
                        const videoTracks = stream.getVideoTracks();

                        (window as any).localStream ?
                            (window as any).localStream.addTrack(videoTracks[0]) :
                            (window as any).localStream = stream;
                        this.sender = this.peerConnection.addTrack(videoTracks[0], (window as any).localStream);
                        return this.peerConnection.createOffer()
                    })
                    .then(offer => this.peerConnection.setLocalDescription(offer))
                    .then(() => {
                        if (this.peerConnection.localDescription.sdp && this.peerConnection.localDescription.type) {
                            sendLocalDescription(lastCall.get("to"), lastCall.get("id"), this.peerConnection.localDescription.sdp, this.peerConnection.localDescription.type, false);
                            attemptToggleVideo(lastCall.get("id"), !lastCall.get("myVideo"), lastCall.get("to"));
                        }
                    })
                    .catch(e => Log.i(e));

            } else {
                const videoTracks = (window as any).localStream.getVideoTracks();
                videoTracks.forEach(videoTrack => {
                    videoTrack.stop();
                    (window as any).localStream.removeTrack(videoTrack);
                });
                this.peerConnection && this.sender ? this.peerConnection.removeTrack(this.sender) : null;
                this.setState({myUrl: URL.createObjectURL((window as any).localStream)});
                attemptToggleVideo(lastCall.get("id"), !lastCall.get("myVideo"), lastCall.get("to"));
            }
        });

    };

    _toggleVideo = throttle(this.toggleVideo, 1500);

    declineCall = () => {
        const {declineCall, lastCall} = this.props;
        const {outCall} = this.state;
        declineCall(lastCall.get("id"), lastCall.get("to"), outCall);
    };

    ignoreCall = (): void => {
        const {lastCall} = this.props;

        if (lastCall) {
            const callId: string = lastCall.get('id');
            this.props.TOGGLE_IGNORE(callId);
        }
    };

    hold = () => {
        this.peerConnection.getLocalStreams().forEach(stream => stream.getTracks().forEach(track => track.enabled = false));
        this.peerConnection.getRemoteStreams().forEach(stream => stream.getTracks().forEach(track => track.enabled = false));
    };

    unhold = () => {
        const {lastCall} = this.props;

        if (lastCall && lastCall.get('mic')) {
            this.peerConnection.getLocalStreams().forEach(stream => stream.getAudioTracks().forEach(track => track.enabled = true));
        }
        this.peerConnection.getRemoteStreams().forEach(stream => stream.getAudioTracks().forEach(track => track.enabled = true));
        this.peerConnection.getLocalStreams().forEach(stream => stream.getVideoTracks().forEach(track => track.enabled = true));
        this.peerConnection.getRemoteStreams().forEach(stream => stream.getVideoTracks().forEach(track => track.enabled = true));
    };

    toggleHold = () => {
        const {lastCall, attemptToggleHold} = this.props;
        attemptToggleHold(lastCall.get("id"), lastCall.get("myHolded"), lastCall.get("to"));
    };

    handleToggleMic = () => {
        const {lastCall, toggleMic} = this.props;
        toggleMic(lastCall.get('id'), lastCall.get('mic'));
    };

    hangUp = () => {
        const {sendHangUp, lastCall} = this.props;
        const {outCall} = this.state;
        sendHangUp(lastCall.get("id"), lastCall.get("to"), outCall);
    };

    get isAnswering(): boolean {
        const {lastCall} = this.props;

        return lastCall.get("status") && ![CALL_STATUSES.calling, CALL_STATUSES.ringing].includes(lastCall.get("status"));
    }

    get avatar(): any {
        const {lastCall} = this.props;
        const {callerContact} = this.state;
        if (!lastCall || lastCall.size === 0) {
            return {};
        }

        if (!callerContact) {
            return {};
        }

        return callerContact && {
            url: callerContact.get("avatarUrl"),
            file: callerContact.get("avatar"),
        };
    }

    get isVideo(): boolean {
        const {lastCall} = this.props;

        return lastCall.get("otherVideo") && this.isAnswering && !lastCall.get("otherHolded") && !lastCall.get("myHolded");
    }

    get status(): string {
        const localization: any = components().callPanel;
        const {status} = this.state;
        const {lastCall} = this.props;
        if (lastCall.get("myHolded")) {
            return localization.myHolded;
        } else if (lastCall.get("otherHolded")) {
            return localization.otherHolded;
        } else if (lastCall.get("hangedUp")) {
            return localization.hangedUp;
        } else if (status) {
            return status;
        } else if (lastCall.get("status") === CALL_STATUSES.answering) {
            return null;
        } else if (lastCall.get("status") === CALL_STATUSES.ringing && !lastCall.get("ownCall")) {
            return localization.incomingCall;
        } else {
            return localization[lastCall.get("status")];
        }
    }

    get time(): string {
        const {lastCall} = this.props;
        const {time} = this.state;

        if (lastCall.get("status") === CALL_STATUSES.answering && time > 0) {
            return getCallTime(time, false);
        } else {
            return null;
        }
    }

    handleCallRadial = (): void => {
        const {callerContact} = this.state;
        const {handleInviteToCall} = this.props;

        handleInviteToCall(false, callerContact);
        this.handleCallStart(false, callerContact, false);
    };

    componentDidMount(): void {
        const {callDetails, lastCall, setParentState, contacts, removeCall, showNotification} = this.props;

        if (callDetails && Object.keys(callDetails).length === 3) {
            this.handleCallStart(callDetails.isVideo, callDetails.contact, callDetails.outCall);
            setParentState({showChat: false, minimized: false});
            if (callDetails.outCall) {
                this.setState({
                    outCall: callDetails.outCall,
                })
            }
        }

        if (lastCall && lastCall.get("status") === CALL_STATUSES.answering) {
            this.hangUp();
        }
        if (callDetails) {
            this.setState({
                callerContact: callDetails.contact,
            });
        } else if (!lastCall.get("ownCall")) {
            const caller: any = contacts.get(lastCall.get("caller"));
            this.setState({
                callerContact: caller && caller.get("members").first(),
            });
        }


        if (lastCall && !lastCall.get("ownCall") && lastCall.get("status") === CALL_STATUSES.ringing) {
            setTimeout(() => {
                const {lastCall} = this.props;
                if (lastCall && lastCall.get("status") === CALL_STATUSES.ringing) {
                    removeCall(this.props.lastCall, showNotification);
                }
            }, 75000);
        }

    }

    shouldComponentUpdate(nextProps: ICallPanelProps, nextState: ICallPanelState): boolean {
        const {lastCall, languages, minimized, showChat, app, contacts, showCallRadial, callDetails} = this.props;
        const {callerContact} = this.state;

        if (languages.get("selectedLanguage") !== nextProps.languages.get("selectedLanguage")) {
            return true
        }

        if (lastCall && !lastCall.equals(nextProps.lastCall)) {
            return true;
        }

        if (!contacts.equals(nextProps.contacts)) {
            return true;
        }

        if (callerContact && !callerContact.equals(nextState.callerContact)) {
            return true;
        }

        if (!lastCall && !!nextProps.lastCall) {
            return true;
        }

        if (minimized !== nextProps.minimized) {
            return true
        }

        if (showChat !== nextProps.showChat) {
            return true
        }

        if (showCallRadial !== nextProps.showCallRadial) {
            return true
        }

        if (!isEqual(app, nextProps.app)) {
            return true;
        }

        if (!isEqual(callDetails, nextProps.callDetails)) {
            return true
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: ICallPanelProps, prevState: ICallPanelState): void {
        const {lastCall, callDetails, removeCallDetails, removeIceCandidate, contacts, showNotification, sendLocalDescription, showCallRadial, setParentState, threadIsEmpty} = this.props;
        const {callerContact} = this.state;

        if (lastCall && callDetails) {
            removeCallDetails();
        }

        if (lastCall && !prevProps.lastCall && showCallRadial) {
            const {handleRadialScreenClose, minimized, setParentState} = this.props;
            handleRadialScreenClose();
            if (minimized && !lastCall.get("ownCall")) {
                setParentState({minimized: false});
            }
        }

        if (lastCall && prevProps.lastCall) {
            if (lastCall.get("videoAnswer") && (!prevProps.lastCall.get("videoAnswer") || lastCall.get("videoAnswer") !== prevProps.lastCall.get("videoAnswer"))) {
                this.handleCallAccepted({type: "answer", sdp: lastCall.get("videoAnswer")})
                    .then(() => {
                        if (lastCall.get("iceCandidates").size > 0) {
                            lastCall.get("iceCandidates").forEach((candidate, id) => {
                                this.handleNewICECandidate(candidate.toJS());
                                removeIceCandidate(lastCall.get("id"), id);
                            });
                        }
                    });
            }

            if (lastCall.get("videoOffer") && ((!prevProps.lastCall.get("videoOffer") || lastCall.get("videoOffer") !== prevProps.lastCall.get("videoOffer"))) && lastCall.get("status") === CALL_STATUSES.answering) {
                this.acceptCall(lastCall.get("myVideo"));
            }

            if (lastCall.get("iceCandidates") && lastCall.get("iceCandidates").size > 0 && (!prevProps.lastCall.get("iceCandidates") || !lastCall.get("iceCandidates").equals(prevProps.lastCall.get("iceCandidates"))) && this.peerConnection && this.peerConnection.localDescription && this.peerConnection.localDescription.sdp && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.sdp) {
                lastCall.get("iceCandidates").forEach((candidate, id) => {
                    this.handleNewICECandidate(candidate.toJS());
                    removeIceCandidate(lastCall.get("id"), id);
                });
            }

            if (lastCall.get("status") !== prevProps.lastCall.get("status") && [CALL_STATUSES.hangedUp].includes(lastCall.get("status"))) {
                const {removeCall} = this.props;
                removeCall(lastCall, showNotification);
            }

            if (lastCall.get("status") !== prevProps.lastCall.get("status") && [CALL_STATUSES.decline].includes(lastCall.get("status"))) {
                const {removeCall, handleRadialScreenShow} = this.props;

                if (lastCall.get("ownCall")) {
                    // peerConnection must be removed when show user busy screen
                    this.removePeerConnection();
                    handleRadialScreenShow();
                    removeCall(lastCall, showNotification);

                } else {
                    removeCall(lastCall, showNotification);
                }
            }


            if (lastCall.get("otherHolded") && !prevProps.lastCall.get("otherHolded") && !lastCall.get("myHolded")) {
                this.hold();
            } else if (!lastCall.get("otherHolded") && prevProps.lastCall.get("otherHolded") && !lastCall.get("myHolded")) {
                this.unhold();
            }

            if (lastCall.get("myHolded") && !prevProps.lastCall.get("myHolded") && !lastCall.get("otherHolded")) {
                this.hold();
            } else if (!lastCall.get("myHolded") && prevProps.lastCall.get("myHolded") && !lastCall.get("otherHolded")) {
                this.unhold();
            }

            if (lastCall.get('mic') !== prevProps.lastCall.get("mic")) {
                const localization: any = components().callPanel;
                for (const track of this.peerConnection.getLocalStreams()[0].getAudioTracks()) {
                    track.enabled = lastCall.get('mic');
                }
                this.setState({status: !lastCall.get('mic') ? localization.muted : ""});
            }

        } else if (lastCall && !prevProps.lastCall) {
            if (lastCall.get("ownCall")) {
                this.hangupTimer = setTimeout(() => {
                    const {lastCall: last} = this.props;
                    if (last && [CALL_STATUSES.calling, CALL_STATUSES.ringing].includes(last.get("status"))) {
                        this.hangUp();
                    }
                }, 50000);
            }
        }

        if (!prevState.connected && this.state.connected) {
            if (!this.state.timer) {
                if (!this.state.callStartTime) {
                    const time: number = Date.now() / 1000;
                    this.setState({callStartTime: time});
                }
                const timer: any = setInterval(() => {
                    this.setState({time: Date.now() / 1000 - this.state.callStartTime});
                }, 1000);
                this.setState({timer});
            }
        }
        if (!lastCall && !callDetails && !showCallRadial) {
            this.setState({
                callerContact: null,
            })
        }

        if (!contacts.equals(prevProps.contacts) && !callerContact && lastCall && lastCall.get("caller")) {
            const callerContactId = lastCall.get("caller");

            if (contacts.has(callerContactId)) {
                const caller = contacts.get(callerContactId);
                const callerInfo = caller.get("members").first();
                Log.i("################# caller contact set");
                this.setState({
                    callerContact: callerInfo
                })
            }
        }

        if (prevProps.lastCall && lastCall && prevProps.lastCall.get("localDescription") !== lastCall.get("localDescription")) {
            const localDescription = lastCall.get("localDescription").toJS();

            if (localDescription && localDescription.sdp && localDescription.type) {

                if (localDescription.onlySet) {
                    const desc: RTCSessionDescription = new SessionDescription({
                        sdp: localDescription.sdp,
                        type: localDescription.type
                    });

                    this.peerConnection.setRemoteDescription(desc)
                        .catch(e => Log.i(e))

                } else {
                    const desc: RTCSessionDescription = new SessionDescription({
                        sdp: localDescription.sdp,
                        type: localDescription.type
                    });

                    this.peerConnection.setRemoteDescription(desc)
                        .then(() => this.peerConnection.createAnswer())
                        .then(answer => this.peerConnection.setLocalDescription(answer))
                        .then(() => sendLocalDescription(lastCall.get("to"), lastCall.get("id"), this.peerConnection.localDescription.sdp, this.peerConnection.localDescription.type, true))
                        .catch(e => Log.i(e))
                }
            }
        }

        if (!isEqual(callDetails, prevProps.callDetails) && !prevProps.callDetails) {

            // this.handleCallRadial();

            // this.handleCallStart(callDetails.isVideo, callDetails.contact, callDetails.outCall);
            // setParentState({showChat: true});
            // if (callDetails.outCall) {
            //     this.setState({
            //         outCall: callDetails.outCall,
            //     })
            // }
        }

        // Change left menu and set thread to selected if i show welcome screen and invite call
        // if (lastCall && !lastCall.get('ownCall') && CALL_STATUSES.answering === lastCall.get("status") && threadIsEmpty) {
        // this.props.ACTIVATE_CALLER_THREAD();
        // }

    }

    componentWillUnmount(): void {
        this.removePeerConnection();
        clearInterval(this.state.timer);
        clearTimeout(this.hangupTimer);
        this.props.setParentState({minimized: false, showChat: false});
    }

    render(): JSX.Element {
        const {expanded, callerContact, errorMessageOutgoingCall} = this.state;
        const {lastCall, minimized, threadIsEmpty, showCallRadial} = this.props;
        const localization: any = components().callPanel;

        if (errorMessageOutgoingCall) {
            const {removeCallDetails} = this.props;
            return (
                <PopUpMain
                    confirmButton={removeCallDetails}
                    titleTransform={false}
                    confirmButtonText={localization.deviceErrorConfirm}
                    cancelButton={removeCallDetails}
                    titleText={localization.deviceErrorTitle}
                    infoText={errorMessageOutgoingCall}
                    showPopUpLogo={true}
                />
            )
        }

        if (showCallRadial) {
            // Show user busy screen

            const {handleRadialScreenClose} = this.props;
            const name: string = callerContact && (callerContact.get("firstName") || callerContact.get("lastName") ?
                callerContact.get("name") : callerContact.get("email") ? callerContact.get("email") :
                    `${!callerContact.get("name").startsWith("0") ? "+" : ""}${callerContact.get("name")}`);

            return (
                <CallContent
                    localization={localization}
                    handleCallRadial={this.handleCallRadial}
                    handleRadialScreenClose={handleRadialScreenClose}
                    toggleExpanded={this.toggleExpanded}
                    toggleMinimize={this.toggleMinimize}
                    color={callerContact && callerContact.getIn(["color", "numberColor"])}
                    avatarCharacter={callerContact && callerContact.get("avatarCharacter")}
                    threadId={callerContact && callerContact.get("contactId")}
                    firstName={callerContact && callerContact.get("firstName")}
                    avatar={{
                        url: callerContact && callerContact.get("avatarUrl"),
                        file: callerContact && callerContact.get("avatar"),
                    }}
                    name={name}
                    redial={showCallRadial}
                    expanded={expanded}
                    miniWindow={minimized}
                    threadIsEmpty={threadIsEmpty}
                />
            )

        } else {
            if (!lastCall || lastCall.size === 0) {
                return null;

            } else if (!lastCall.get("ownCall") && (!lastCall.get("videoOffer") && !this.isAnswering)) {
                return null;
            }
        }

        const {myUrl, otherUrl, connected, status, outCall, errorMessageIncomingCall} = this.state;
        const {contacts, notification} = this.props;

        const receiver = lastCall && contacts.get(lastCall.get("receiver")) && contacts.getIn([lastCall.get("receiver"), "members"]).first();
        const caller = lastCall && contacts.get(lastCall.get("caller")) && contacts.getIn([lastCall.get("caller"), "members"]).first();
        const name: string = lastCall && lastCall.get("ownCall") ? receiver && receiver.get("name") : caller && caller.get("name");
        const firstName: string = lastCall && lastCall.get("ownCall") ? receiver && receiver.get("firstName") : caller && caller.get("firstName");

        return (
            lastCall && lastCall.get("ownCall") || this.isAnswering ? (
                    <React.Fragment>
                        <CallContent
                            otherHolded={lastCall.get("otherHolded")}
                            holded={status === CALL_STATUSES.holded}
                            myHolded={lastCall.get("myHolded")}
                            myVideo={lastCall.get("myVideo")}
                            toggleKeypad={this.toggleKeypad}
                            isAnswering={this.isAnswering}
                            errorMessage={errorMessageIncomingCall}

                            avatar={this.avatar}
                            color={callerContact && callerContact.getIn(["color", "numberColor"])}
                            avatarCharacter={callerContact && callerContact.get("avatarCharacter")}
                            threadId={callerContact && callerContact.get("contactId")}
                            status={this.status}
                            time={this.time}

                            toggleVideo={this._toggleVideo}
                            declineCall={this.declineCall}
                            toggleHold={this.toggleHold}
                            toggleMic={this.handleToggleMic}
                            isVideo={this.isVideo}
                            connected={connected}
                            hangUp={this.hangUp}
                            otherUrl={otherUrl}
                            outCall={outCall}
                            myUrl={myUrl}
                            mic={lastCall.get('mic')}

                            name={name}
                            firstName={firstName}
                            toggleExpanded={this.toggleExpanded}
                            toggleMinimize={this.toggleMinimize}
                            toggleShowChat={this.toggleShowChat}

                            handleCallRadial={this.handleCallRadial}
                            localization={localization}
                            expanded={expanded}
                            miniWindow={minimized}
                            threadIsEmpty={threadIsEmpty}
                        />
                        {
                            [CALL_STATUSES.ringing, CALL_STATUSES.calling].includes(lastCall.get("status")) && lastCall.get("ownCall") &&
                            (
                                <audio id="sound" preload="auto" autoPlay={true} loop={true}>
                                    <source src={require("files/ringing.mp3")} type="audio/mpeg"/>
                                    <embed hidden={true} src={require("files/ringing.mp3")}/>
                                </audio>
                            )
                        }
                        {
                            lastCall.get("otherHolded") &&
                            (
                                <audio id="sound" preload="auto" autoPlay={true}>
                                    <source src={require("files/hold-sound.mp3")} type="audio/mpeg"/>
                                    <embed hidden={true} src={require("files/hold-sound.mp3")}/>
                                </audio>
                            )
                        }
                    </React.Fragment>
                ) :
                (
                    <IncomingCall
                        callerPhone={lastCall.get("email") || lastCall.get("caller").split("@").shift()}
                        callSound={notification.get("callSound")}
                        caller={callerContact}
                        isVideo={lastCall.get('otherVideo')}
                        avatar={this.avatar}
                        declineCall={this.declineCall}
                        acceptCall={this.acceptCall}
                        ignoreCall={this.ignoreCall}
                        showInThread={lastCall.get('showInThread')}
                    />
                )
            // )
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved)),
    sendIceCandidate: (to, callid, sdpMLineIndex, sdpMid, candidate, outCall) => dispatch(sendIceCandidate(to, callid, sdpMLineIndex, sdpMid, candidate, outCall)),
    sendLocalDescription: (to, callid, sdp, type, onlySet) => dispatch(sendLocalDescription(to, callid, sdp, type, onlySet)),
    removeIceCandidate: (id, candidateId) => dispatch(removeIceCandidate(id, candidateId)),
    attemptToggleVideo: (id, isVideo, to) => dispatch(attemptToggleVideo(id, isVideo, to)),
    attemptToggleHold: (id, holded, to) => dispatch(attemptToggleHold(id, holded, to)),
    inviteToCall: (call, addNewCall) => dispatch(inviteToCall(call, addNewCall)),
    acceptCall: (id, to, sdp) => dispatch(acceptCall(id, to, sdp)),
    declineCall: (id, to, outCall) => dispatch(declineCall(id, to, outCall)),
    removeCall: (call, showNotification) => dispatch(attemptRemoveCall(call, showNotification)),
    sendHangUp: (id, to, outCall) => dispatch(sendHangUp(id, to, outCall)),
    toggleMic: (id, mic) => dispatch(toggleMic(id, mic)),
    ACTIVATE_CALLER_THREAD: () => dispatch(ACTIVATE_CALLER_THREAD()),
    TOGGLE_IGNORE: (id: string, ignored?: boolean, isVideo?: boolean) => dispatch(TOGGLE_IGNORE(id, ignored, isVideo))
});

export default connect<{}, {}, ICallPanelPassedProps>(mapStateToProps, mapDispatchToProps)(CallPanel);
