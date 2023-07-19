"use strict";

import * as React from "react";
import Draggable from "react-draggable";

import {MOUSE_MOVE_STOPPED_TIME_OUT} from "configs/constants";
// import Avatar from "components/newUICall/Avatar";
import Avatar from "components/contacts/Avatar"
import {AvatarSize} from "components/contacts/style";
import Log from "modules/messages/Log";


interface ICallContentProps {
    errorMessage?: string;
    otherHolded?: boolean;
    isAnswering?: boolean;
    connected?: boolean;
    myHolded?: boolean;
    toggleKeypad?: any;
    isVideo?: boolean;
    otherUrl?: string;
    avatar?: any;
    color?: any;
    avatarCharacter?: string;
    threadId?: any;
    myVideo?: boolean;
    outCall?: boolean;
    toggleVideo?: any;
    declineCall?: any;
    toggleHold?: any;
    holded?: boolean;
    toggleMic?: any;
    myUrl?: string;
    mic?: boolean;
    hangUp?: any;

    toggleMinimize?: () => void;
    toggleExpanded?: () => void;
    toggleShowChat?: () => void;
    name?: any;
    firstName?: string;

    status?: string;
    time?: string;

    redial?: boolean;
    handleCallRadial?: () => void;
    handleRadialScreenClose?: () => void;

    localization?: any;
    expanded?: boolean;
    miniWindow?: boolean;
    threadIsEmpty?: boolean;
    receiverRequest?: string;
    selectedThreadId?: string;
}

interface ICallContentState {
    avatarURL: string;
}

export default class CallContent extends React.Component<ICallContentProps, ICallContentState> {

    callContainer: any = React.createRef();

    headerContainer: any = React.createRef();

    footerContainer: any = React.createRef();

    mouseMoveTimeOut: any = null;

    constructor(props) {
        super(props);
        this.state = {
            avatarURL: ''
        }
    }

    componentDidMount(): void {
        const {hangUp, avatar} = this.props;

        const avatarURL: string = avatar && avatar.file;
        if (avatarURL) {
            this.setState({avatarURL: URL.createObjectURL(avatarURL)});
        }
        window.addEventListener("beforeunload", hangUp, false);
        this.handleAddEventListeners();
        this.handleMouseMove();
    }

    componentDidUpdate(prevProps: Readonly<ICallContentProps>, prevState: Readonly<ICallContentState>, snapshot?: any): void {
        const {redial, miniWindow, isVideo, isAnswering} = this.props;
        if (redial !== prevProps.redial) {
            redial ? this.handleRemoveEventListeners() : this.handleAddEventListeners();
            this.handleMouseMove();
        }

        if (isVideo !== prevProps.isVideo) {
            isVideo ? this.handleAddEventListeners() : this.handleRemoveEventListeners();
            this.handleMouseMove();
        }

        if (miniWindow !== prevProps.miniWindow) {
            // if (miniWindow) {
            //     this.callContainer.current.addEventListener('mousedown', this.dragStart, false);
            //     this.callContainer.current.addEventListener('mouseup', this.dragEnd, false);
            // } else {
            //     this.callContainer.current.removeEventListener('mousedown', this.dragStart, false);
            //     this.callContainer.current.removeEventListener('mouseup', this.dragEnd, false);
            //     this.callContainer.current.addEventListener('mousemove', this.handleMouseMove, false);
            // }
        }
    }

    componentWillUnmount(): void {
        const {hangUp} = this.props;
        window.removeEventListener("beforeunload", hangUp, false);
        this.handleRemoveEventListeners();
    }

    handleAddEventListeners = (): void => {
        this.callContainer && this.callContainer.current && this.callContainer.current.addEventListener('mousemove', this.handleMouseMove);
    };

    handleRemoveEventListeners = (): void => {
        this.callContainer && this.callContainer.current && this.callContainer.current.removeEventListener('mousemove', this.handleMouseMove);
    };

    handleMouseMove = (): void => {
        const {redial, isVideo, isAnswering} = this.props;
        const header: any = this.headerContainer && this.headerContainer.current;
        const footer: any = this.footerContainer && this.footerContainer.current;

        // Show header
        if (header && !header.classList.contains('show')) {
            header.classList.add('show');
        }

        // Show footer
        if (footer && !footer.classList.contains('show')) {
            footer.classList.add('show');
        }

        // Mouse move stopped timer start

        if (this.mouseMoveTimeOut) {
            clearTimeout(this.mouseMoveTimeOut);
        }

        if (!redial) {
            if (isVideo && isAnswering) {
                this.mouseMoveTimeOut = setTimeout(() => {
                    this.handleMouseLeave(); // Hide footer and header
                }, MOUSE_MOVE_STOPPED_TIME_OUT);
                // Mouse move stopped timer start
            }
        }
    };

    handleMouseLeave = (): void => {
        const header: any = this.headerContainer && this.headerContainer.current;
        const footer: any = this.footerContainer && this.footerContainer.current;

        if (header && header.classList.contains('show')) {
            header.classList.remove('show');
        }

        if (footer && footer.classList.contains('show')) {
            footer.classList.remove('show');
        }

        if (this.mouseMoveTimeOut) {
            clearTimeout(this.mouseMoveTimeOut);
        }
    };

    get content(): JSX.Element {
        const {
            isVideo, otherUrl, avatar, myVideo, myHolded, receiverRequest, isAnswering, toggleVideo, handleCallRadial,
            myUrl, toggleMic, hangUp, mic, connected, otherHolded, toggleExpanded, name, color,
            avatarCharacter, threadId, status, time, firstName, outCall, redial, handleRadialScreenClose,
            errorMessage, localization, expanded, threadIsEmpty, miniWindow, toggleMinimize
        } = this.props;
        const {avatarURL} = this.state;
        const callStatus: string = status ? `${outCall ? 'Zangi-Out ' : ''}${status}` : time;

        const threadImage: any = {
            url: avatarURL || "",
            file: avatar.file || "",
        };

        return (
            <div
                className={`single-call-panel show-chat${expanded ? " expanded" : miniWindow ? '' : " minimized"}${threadIsEmpty ? " empty-screen" : ""}${redial ? " redial" : ''}${isVideo ? ' video-on' : ''}${miniWindow ? ' mini-window' : ''}`}
                ref={this.callContainer}
                draggable={miniWindow}
            >
                {
                    !errorMessage &&
                    <div className="no-internet">
                        <h2 className="no-internet-text">{errorMessage}</h2>
                    </div>
                }
                <div className="call-panel-block">

                    {/*Header*/}

                    <div className={`header show${isVideo ? "" : " no-background"}`}
                         ref={this.headerContainer}>
                        <div className='left-content'>
                            {
                                expanded && !miniWindow && <span className='icon-minimize' onClick={toggleExpanded}/>
                            }

                            <div className='caller-info'>
                                <span className='caller-name'>{name}</span>
                                <span
                                    className='call-status'>{redial ? localization.decline : (callStatus || '')}&nbsp;</span>
                            </div>
                            {
                                miniWindow &&
                                <React.Fragment>
                                    <span className='icon-max-window' onClick={toggleMinimize}/>
                                </React.Fragment>
                            }
                        </div>

                    </div>

                    {/*Content*/}

                    <div className="content">
                        {
                            avatarURL && !isVideo &&
                            <img
                                className='avatar-image'
                                src={avatarURL}
                                alt={'contact-avatar'}
                            />
                        }
                        {
                            isVideo ?
                                <video className="guest-video" autoPlay={true} src={otherUrl}/>
                                :
                                <div className='caller-info'>
                                    <AvatarSize width="65px" height="65px">
                                        <Avatar
                                            image={threadImage}
                                            color={color}
                                            avatarCharacter={avatarCharacter}
                                            name={firstName}
                                            fontSize={"21px"}
                                            iconSize={"65px"}
                                        />
                                    </AvatarSize>
                                    <audio autoPlay={true} src={otherUrl} id="remote_stream"/>
                                </div>
                        }

                        {

                            connected && myVideo && isAnswering && !myHolded && !otherHolded && !miniWindow &&
                            <Draggable handle=".handle" bounds="parent">
                                <video autoPlay={true} className="handle" muted={true} src={myUrl}/>
                            </Draggable>
                        }

                    </div>

                    {/*Footer*/}

                    <div className={`footer show${isVideo ? "" : " no-background"}`}
                         ref={this.footerContainer}>
                        {
                            !expanded && !miniWindow &&
                            <div className='max-window'>
                                <span className='icon-footer icon-max-window' onClick={toggleExpanded}/>
                                <span className='description'>{localization.maxWindow}</span>
                            </div>
                        }

                        <div className="call-actions">
                            {
                                redial ?
                                    <React.Fragment>
                                        <div className='action cancel-call'>
                                            <span className="icon-footer icon-cancel-call"
                                                  onClick={handleRadialScreenClose}/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.cancel}</span>
                                            }
                                        </div>
                                        <div className='action redial-call'>
                                            <span className="icon-footer icon-redial-call" onClick={handleCallRadial}/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.redialCall}</span>
                                            }
                                        </div>
                                    </React.Fragment>
                                    :
                                    <React.Fragment>
                                        <div className='action add-members disabled'>
                                            <span className="icon-footer icon-add-members "/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.addMembers}</span>
                                            }
                                        </div>
                                        <div
                                            className={`action mute-call${!isAnswering || errorMessage ? " disabled" : ""}`}>
                                            <span
                                                className={`icon-footer icon-microphone${mic ? ' on' : ' off'}`}
                                                onClick={toggleMic}/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.muteCall}</span>
                                            }
                                        </div>

                                        <div
                                            className={`action video-call${!isAnswering || myHolded || otherHolded || errorMessage || (receiverRequest && !receiverRequest.includes('web')) ? " disabled " : ""}`}>
                                            <span
                                                className={`icon-footer icon-video-call${myVideo ? ' on' : ' off'}`}
                                                onClick={toggleVideo}/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.videoCall}</span>
                                            }
                                        </div>

                                        <div className='action end-call'>
                                            <span className="icon-footer icon-end-call" onClick={hangUp}/>
                                            {
                                                !miniWindow &&
                                                <span className='description'>{localization.endCall}</span>
                                            }
                                        </div>
                                    </React.Fragment>
                            }
                        </div>
                        {
                            !miniWindow &&
                            <div className='mini-window'>
                                <span className='icon-footer icon-mini-window' onClick={toggleMinimize}/>
                                <span className='description'>{localization.miniWindow}</span>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }

    render(): JSX.Element {
        const {miniWindow} = this.props;

        return (
            <Draggable bounds="parent" disabled={!miniWindow}>
                {this.content}
            </Draggable>
        )

    }
}
