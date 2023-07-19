// "use strict";
//
// import {CALL_AUDIO_PARAMS, CALL_DEVICE_PARAMS, CALL_PROTOTYPE, CALL_STATUSES, CALL_VERSION, CALL_VIDEO_PARAMS, RED5_1} from "configs/constants";
// import {removeConferenceCallData, sendIceCandidate, toggleShowConferenceCall} from "modules/call/CallActions";
// import CallContent from "components/conference/Content";
// import selector, {IStoreProps} from "services/selector";
// import "scss/pages/chat-panel/ConferenceCallPanel";
// import components from "configs/localization";
// import {connect} from "react-redux";
// import {isEqual} from "lodash";
// import * as React from "react";
// import {v4 as uuid} from "uuid";
// import MinimizedConferenceCallScreen from "components/conference/MinimizedCallScreen";
//
// navigator.getUserMedia = navigator.getUserMedia || (navigator as any).mozGetUserMedia || (navigator as any).webkitGetUserMedia;
// const SessionDescription: any = (window as any).RTCSessionDescription || (window as any).mozRTCSessionDescription;
// const PeerConnection: any = (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
// const IceCandidate: any = (window as any).RTCIceCandidate || (window as any).mozRTCIceCandidate;
//
//
// interface IConferenceCallPanelState {
//     errorMessageIncomingCall: string;
//     errorMessageOutgoingCall: string;
//     addMemberPopUp: boolean;
//     expanded: boolean;
//     connected: boolean;
//     otherUrl: string;
//     status: string;
//     myUrl: string;
// }
//
// interface IConferenceCallPanelPassedProps {
//     minimized?: boolean;
//     threadIsEmpty?: boolean;
//     setParentState: (data: any) => void;
// }
//
// interface IConferenceCallPanelProps extends IStoreProps, IConferenceCallPanelPassedProps {
//     sendIceCandidate: (to: string, callid: string, sdpMLineIndex: number, sdpMin: string, candidate: string, outCall: boolean) => void;
//     toggleShowConferenceCall: (showConfCall: boolean) => void;
//     removeConferenceCallData: () => void;
// }
//
// const selectorVariables: any = {
//     user: true,
//     confCallDetails: true
// };
//
// class ConferenceCallPanel extends React.Component<IConferenceCallPanelProps, IConferenceCallPanelState> {
//
//     constructor(props: any) {
//         super(props);
//
//         this.state = {
//             errorMessageOutgoingCall: "",
//             errorMessageIncomingCall: "",
//             addMemberPopUp: false,
//             connected: false,
//             expanded: true,
//             status: null,
//             otherUrl: "",
//             myUrl: "",
//         }
//     }
//
//     peerConnection: any;
//
//     mediaConstraints: any = {audio: {echoCancellation: true}, video: true};
//
//     sender: any;
//
//     componentDidMount() {
//         const {setParentState, confCallDetails} = this.props;
//
//         if (confCallDetails && confCallDetails.size === 3) {
//             this.handleCallStart(false, confCallDetails.get("callInfo"));
//             setParentState({showChat: true});
//         }
//     }
//
//     shouldComponentUpdate(nextProps: IConferenceCallPanelProps, nextState: IConferenceCallPanelState): boolean {
//         const {threadIsEmpty, confCallDetails, minimized} = this.props;
//
//         if (threadIsEmpty !== nextProps.threadIsEmpty) {
//             return true;
//         }
//
//         if (minimized !== nextProps.minimized) {
//             return true;
//         }
//
//         if (!isEqual(confCallDetails, nextProps.confCallDetails)) {
//             return true;
//         }
//
//         return !isEqual(this.state, nextState);
//     }
//
//     componentDidUpdate(prevProps: IConferenceCallPanelProps, prevState: IConferenceCallPanelState): void {
//
//     }
//
//     componentWillUnmount(): void {
//         const {setParentState, toggleShowConferenceCall} = this.props;
//         toggleShowConferenceCall(false);
//         setParentState({minimized: false, showChat: false});
//     }
//
//     handleNewICECandidate = (iceCandidate: RTCIceCandidateInit) => {
//         const candidate: RTCIceCandidate = new IceCandidate(iceCandidate);
//
//         if (this.peerConnection && this.peerConnection.localDescription.sdp && this.peerConnection.remoteDescription.sdp) {
//             if(candidate.candidate.includes("udp")) {
//                 this.peerConnection.addIceCandidate(candidate)
//                     .catch(this.handleErrorReport);
//             }
//         }
//     };
//
//     handleAddTrackEvent = (event: RTCTrackEvent) => {
//         (window as any).remoteStream = null;
//         (window as any).remoteStream = event.streams[0];
//         this.setState({otherUrl: URL.createObjectURL((window as any).remoteStream)});
//     };
//
//     handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
//         /*const {sendIceCandidate, lastCall} = this.props;*/
//
//         /*if (event.candidate && event.candidate.candidate.includes("udp") && lastCall) {
//             sendIceCandidate(
//                 lastCall.get("to"),
//                 lastCall.get("id"),
//                 event.candidate.sdpMLineIndex,
//                 event.candidate.sdpMid,
//                 event.candidate.candidate
//             );
//         }*/
//     };
//
//     handleICEConnectionStateChangeEvent = () => {
//         if (this.peerConnection) {
//             const localization: any = components().callPanel;
//
//             switch (this.peerConnection.iceConnectionState) {
//                 case "completed":
//                 case "connected":
//                     if (!this.state.connected) {
//                         this.setState({connected: true});
//                     }
//                     if (this.state.status === localization.connecting) {
//                         this.setState({status: ""});
//                     }
//                     break;
//                 case "disconnected":
//                     if (this.state.status !== localization.connecting) {
//                         this.setState({status: localization.connecting});
//                     }
//                     if (this.state.connected) {
//                         this.setState({connected: false});
//                     }
//                     break;
//                 case "checking":
//                 case "new":
//                     if (this.state.connected) {
//                         this.setState({connected: false});
//                     }
//                     break;
//                 case "failed":
//                     this.handleCallHangUp();
//                     break;
//                 default:
//                     break;
//             }
//         }
//     };
//
//     handleExpandedToggle = () => {
//         const {expanded} = this.state;
//         this.setState({expanded: !expanded});
//     };
//
//     handleMinimizeToggle= () => {
//         const {minimized, setParentState} = this.props;
//         setParentState({minimized: !minimized});
//     };
//
//     handleCallHangUp = () => {
//         const {removeConferenceCallData} = this.props;
//         removeConferenceCallData();
//     };
//
//     handleAddMemberPopUpToggle = () => {
//         const {addMemberPopUp} = this.state;
//         this.setState({addMemberPopUp: !addMemberPopUp});
//     };
//
//     handleCallStart = (isVideo: boolean, contact: any) => {
//         const {user} = this.props;
//
//         const call: any = {
//             id: `${uuid()}`,
//             status: CALL_STATUSES.calling,
//             callerData: {
//                 callPrototype: CALL_PROTOTYPE,
//                 device: CALL_DEVICE_PARAMS,
//                 audio: CALL_AUDIO_PARAMS,
//                 video: CALL_VIDEO_PARAMS,
//                 version: CALL_VERSION,
//                 red5: RED5_1
//             },
//             to: contact.get("threadId"),
//             receiver: contact.get("threadId"),
//             caller: user.get("id"),
//             callTime: Date.now(),
//             iceCandidates: {},
//             otherVideo: false,
//             myVideo: isVideo,
//             ownCall: true,
//         };
//
//         if (this.peerConnection) {
//             this.handlePeerConnectionRemove();
//         }
//
//         this.handlePeerConnectionCreate();
//
//         navigator.mediaDevices.getUserMedia({...this.mediaConstraints, video: isVideo})
//             .then(stream => {
//                 (window as any).localStream = stream;
//                 this.setState({myUrl: URL.createObjectURL(stream)});
//                 stream.getAudioTracks().map(track => this.peerConnection.addTrack(track, stream));
//                 stream.getVideoTracks().map(track => this.sender = this.peerConnection.addTrack(track, stream));
//             })
//             .then(() => {
//                 this.peerConnection.createOffer().then(offer => {
//                     return this.peerConnection.setLocalDescription(offer);
//                 })
//                     .then(() => {
//                         call.callerSdp = this.peerConnection.localDescription.sdp;
//                         console.log("call-----------", call);
//                     })
//                     .catch(this.handleErrorReport);
//             })
//             .catch((e) => this.handleGetUserMediaError({error: e, outgoing: true}));
//     };
//
//     handlePeerConnectionRemove = () => {
//         if (this.peerConnection) {
//             (window as any).localStream && (window as any).localStream.getTracks().forEach((track) => {
//                 track.stop();
//             });
//             (window as any).remoteStream && (window as any).remoteStream.getTracks().forEach((track) => {
//                 track.stop();
//             });
//             this.peerConnection.getLocalStreams().forEach(stream => stream.getTracks().forEach(track => {
//                 stream.removeTrack(track);
//                 track.stop();
//                 stream.stop();
//             }));
//             this.peerConnection.getRemoteStreams().forEach(stream => stream.getTracks().forEach(track => {
//                 stream.removeTrack(track);
//                 track.stop();
//                 stream.stop();
//             }));
//             this.peerConnection.signalingState !== "closed" && this.peerConnection.close();
//             this.peerConnection = null;
//         }
//     };
//
//     handlePeerConnectionCreate = () => {
//         this.peerConnection = new PeerConnection({
//             iceServers: [{
//                 urls: ["turn:85.25.43.39"],
//                 username: "aaa",
//                 credential: "123456"
//             }],
//             // iceTransportPolicy: "relay",
//             iceCandidatePoolSize: "0"
//         });
//
//         this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
//         this.peerConnection.onicecandidate = this.handleICECandidateEvent;
//         this.peerConnection.ontrack = this.handleAddTrackEvent;
//     };
//
//     handleErrorReport = (errMessage: any) => {
//         console.dir(`Error ${errMessage.name}: ${errMessage.message}`);
//     };
//
//     handleGetUserMediaError = (errorDetails) => {
//         const {error, outgoing, incoming} = errorDetails;
//         const keyName: any = outgoing ? "errorMessageOutgoingCall": "errorMessageIncomingCall";
//         const localization: any = components().callPanel;
//
//         if(!incoming) {
//             this.handlePeerConnectionRemove();
//         }
//         // @ts-ignore
//         this.setState({[keyName]: localization.deviceErrorText});
//
//         console.log(error, "######### device error");
//     };
//
//     /*get status(): string {
//         const localization: any = components().callPanel;
//         const {status} = this.state;
//         const {lastCall} = this.props;
//         if (lastCall.get("myHolded")) {
//             return localization.myHolded;
//         } else if (lastCall.get("otherHolded")) {
//             return localization.otherHolded;
//         } else if (lastCall.get("hangedUp")) {
//             return localization.hangedUp;
//         } else if (status) {
//             return status;
//         } else if (lastCall.get("status") === CALL_STATUSES.answering) {
//             return null;
//         } else if (lastCall.get("status") === CALL_STATUSES.ringing && !lastCall.get("ownCall")) {
//             return localization.incomingCall;
//         } else {
//             return localization[lastCall.get("status")];
//         }
//     }*/
//
//     render(): JSX.Element {
//         const {expanded, addMemberPopUp, myUrl} = this.state;
//         const {minimized, threadIsEmpty, user, confCallDetails} = this.props;
//
//         return (
//             minimized ?
//                 (
//                     <MinimizedConferenceCallScreen
//                         handleCallHangUp={this.handleCallHangUp}
//                         handleMinimizeToggle={this.handleMinimizeToggle}
//                         confCallDetails={confCallDetails}
//                         otherHolded={false}
//                         ringing={false}
//                     />
//                 ):
//                 (
//                     <div className={expanded ? "conf-single-call expanded"  : threadIsEmpty ? "conf-single-call empty-screen" : "conf-single-call"}>
//                         <CallContent
//                             handleAddMemberPopUpToggle={this.handleAddMemberPopUpToggle}
//                             handleExpandedToggle={this.handleExpandedToggle}
//                             handleMinimizeToggle={this.handleMinimizeToggle}
//                             handleCallHangUp={this.handleCallHangUp}
//                             confCallDetails={confCallDetails}
//                             addMemberPopUp={addMemberPopUp}
//                             expanded={expanded}
//                             myUrl={myUrl}
//                             user={user}
//                         />
//                     </div>
//                 )
//         );
//     }
// }
//
// const mapStateToProps: any = state => selector(state, selectorVariables);
//
// const mapDispatchToProps: any = dispatch => ({
//     removeConferenceCallData: () => dispatch(removeConferenceCallData()),
//     toggleShowConferenceCall: (showConfCall) => dispatch(toggleShowConferenceCall(showConfCall)),
//     sendIceCandidate: (to, callid, sdpMLineIndex, sdpMid, candidate, outCall) => dispatch(sendIceCandidate(to, callid, sdpMLineIndex, sdpMid, candidate, outCall)),
// });
//
// export default connect<{}, {}, IConferenceCallPanelPassedProps>(mapStateToProps, mapDispatchToProps)(ConferenceCallPanel);
