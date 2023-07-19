"use strict";

import OutcomingCallButtons from "components/call/OutcomingCallButtons";
import Draggable from "react-draggable";
import * as React from "react";
import Avatar from "components/contacts/Avatar";
import conf from "configs/configurations";
import {listOfButtons} from "aws-sdk/clients/lexruntime";

interface ICallPanelContentProps {
    errorMessage?: string;
    otherHolded: boolean;
    isAnswering: boolean;
    connected: boolean;
    myHolded: boolean;
    toggleKeypad: any;
    isVideo: boolean;
    otherUrl: string;
    dataLine: string;
    avatar: any;
    color: any;
    avatarCharacter: string;
    threadId: any;
    myVideo: boolean;
    outCall: boolean;
    toggleVideo: any;
    declineCall: any;
    toggleHold: any;
    holded: boolean;
    toggleMic: any;
    myUrl: string;
    mic: boolean;
    hangUp: any;

    toggleMinimize: () => void;
    toggleExpanded: () => void;
    toggleShowChat: () => void;
    name: any;
    firstName: string;

    status: string;
    time: string;

    redial: boolean;
    handleRadialScreenClose: () => void;
}

export default class CallPanelContent extends React.Component<ICallPanelContentProps, undefined> {

/*
    shouldComponentUpdate(prevProps: ICallPanelContentProps): boolean {
        const {isVideo, otherUrl, dataLine, avatarStyle, myVideo, myHolded, isAnswering, myUrl, mic, connected, otherHolded} = this.props;

        if (!isEqual(avatarStyle, prevProps.avatarStyle)) {
            if (!connected) {
                return true;
            }
        }

        if (isAnswering !== prevProps.isAnswering) {
            return true;
        }

        if (otherHolded !== prevProps.otherHolded) {
            return true;
        }

        if (connected !== prevProps.connected) {
            return true;
        }

        if (lastCall !== prevProps.lastCall) {
            return false;
        }

        if (myHolded !== prevProps.myHolded) {
            return true;
        }

        if (otherUrl !== prevProps.otherUrl) {
            return true;
        }

        if (dataLine !== prevProps.dataLine) {
            return true;
        }

        if (isVideo !== prevProps.isVideo) {
            return true;
        }

        if (myVideo !== prevProps.myVideo) {
            return true;
        }

        if (myUrl !== prevProps.myUrl) {
            return true;
        }

        return mic !== prevProps.mic;
    }
*/

    componentDidMount(){
        const {hangUp} = this.props;
        window.addEventListener("beforeunload", hangUp, false);
    }

    componentWillUnmount(){
        const {hangUp} = this.props;
        window.removeEventListener("beforeunload", hangUp, false);
    }

    render(): JSX.Element {
        const {
            isVideo, otherUrl, dataLine, avatar, myVideo, myHolded, isAnswering, toggleKeypad, toggleVideo,
            toggleHold, myUrl, toggleMic, declineCall, hangUp, mic, holded, connected, otherHolded,
            toggleMinimize, toggleExpanded, name, color, avatarCharacter, threadId, status, time, firstName, outCall, redial, handleRadialScreenClose,
            errorMessage
        } = this.props;

        return (
            <div className="call-panel-content">
                <div className="call-screen">
                    <div className="draggable-block">
                        <div className="draggable-area">
                            <div className={errorMessage ? "header-buttons-top header-buttons" : "header-buttons"}>
                                <button className="minimize-button" onClick={toggleMinimize}/>
                                <button className="expanded-button" onClick={toggleExpanded}/>
                            </div>
                            {
                               isVideo ?
                                   <video className="guest-video" autoPlay={true} src={otherUrl}/> :
                                   <div className="caller-info">
                                       <div className="caller-info-content">
                                           <Avatar
                                               image={avatar}
                                               color={color}
                                               avatarCharacter={avatarCharacter}
                                               name={firstName}
                                               meta={{threadId}}
                                           />
                                           <h2 className="name">{name}</h2>
                                           <div className="call-status">
                                               {time && <span className="status">{time}</span>}
                                               {status && <span className="status">{outCall ? `Zangi-Out ${status}`: status}</span>}
                                           </div>
                                       </div>
                                       <audio autoPlay={true} src={otherUrl} id="remote_stream"/>
                                   </div>
                            }
                            {

                                connected && myVideo && isAnswering && !myHolded && !otherHolded ?
                                    <Draggable handle=".handle" bounds="parent">
                                        <video autoPlay={true} className="handle" muted={true} src={myUrl}/>
                                    </Draggable> :
                                    null
                            }
                            <div className="call-panel-footer">
                                {
                                    redial ?
                                        <div className="call-buttons">
                                            <span className="footer-icon redial_call"/>
                                            <span className="footer-icon cancel_call" onClick={handleRadialScreenClose}/>
                                        </div>
                                        : <OutcomingCallButtons
                                            toggleKeypad={toggleKeypad}
                                            toggleVideo={toggleVideo}
                                            toggleHold={toggleHold}
                                            answering={isAnswering}
                                            toggleMic={toggleMic}
                                            decline={declineCall}
                                            holded={holded}
                                            video={myVideo}
                                            hangUp={hangUp}
                                            myHolded={myHolded}
                                            otherHolded={otherHolded}
                                            mic={mic}
                                            errorMessage={errorMessage}
                                        />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
