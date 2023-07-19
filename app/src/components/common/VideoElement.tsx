import * as React from "react";
import components from "configs/localization";
import {MESSAGE_TYPES} from "../../configs/constants";
import conf from "configs/configurations";
import {isPublicRoom} from "helpers/DataHelper";
import {getSignedUrl} from "requests/fsRequest";
import {REQUEST_TYPES} from "configs/constants";
import Log from "modules/messages/Log";


interface IVideoPlayerProps {
    media: any;
    message: any;
    downloadButton: boolean;
}

interface IVideoPlayerState {
    videoLink: string;
}

export default class VideoElement extends React.Component<IVideoPlayerProps, IVideoPlayerState> {
    constructor(props) {
        super(props);

        this.state = {
            videoLink: ""
        };
    }

    shouldComponentUpdate(nextProps: IVideoPlayerProps, nextState: IVideoPlayerState) {
        const {media} = this.props;
        const {videoLink} = this.state;
        if (nextProps.media && nextProps.media.url != media.url) {
            return true;
        }
        return nextState.videoLink && nextState.videoLink != videoLink;

    }

    async componentDidUpdate(prevProps: IVideoPlayerProps, prevState: IVideoPlayerState) {
        const {media} = this.props;
        if (prevProps.media && prevProps.media.url != media.url) {
            this.getVideoUrl();
            this.updateVideo();
        }
        if (prevState.videoLink != this.state.videoLink) {
            this.updateVideo();
        }
    }

    updateVideo() {
        const {media, message, downloadButton} = this.props;
        const {videoLink} = this.state;
        const localization: any = components().mediaPopUp;

        if (message.msgType === MESSAGE_TYPES.stream_file) {
            //This code contains antipattern style, that appends raw html to DOM,
            //Problem occures when you try to add video tag
            setTimeout(function () {
                if (document.getElementById("videoElement")) {
                    document.getElementById("videoElement").innerHTML = "";
                    if ((document as any).pictureInPictureElement) {
                        (document as any).exitPictureInPicture()
                    }

                    // disablePictureInPicture="" removed in video attributes
                    document.getElementById("videoElement").innerHTML = `<video poster="${message.src}"
                                                                                    controls=""
                                                                                    autoPlay=""
                                                                                    name="media"
                                                                                    controlsList="nodownload"
                                                                                   >
                                                                                     <source src="${videoLink || media.url}" type="video/mp4">
                                                                                   </video>`;
                }
            }, 100);
            if (document.getElementById("videoElement")) {
                document.getElementById("videoElement").innerHTML = "";
            }
        } else {
            let videoPromise = new Promise((resolve, reject) => {
                try {
                    const video: HTMLVideoElement = document.createElement('video');
                    video.className = media.isChannel && downloadButton ? "video-bg" : "";

                    video.controls = !downloadButton;
                    video.innerHTML = localization.videoPopupElement;
                    video.setAttribute("controlsList", "nodownload")
                    if (message.msgType === MESSAGE_TYPES.stream_file) {
                        const source: HTMLSourceElement = document.createElement('source');
                        source.src = video || media.url;
                        source.type = "video/mp4";
                        video.appendChild(source);
                        resolve({video});
                    } else {
                        video.poster = media.isChannel && downloadButton ? message.src : "";
                        video.src = media.videoUrl ? media.videoUrl : (videoLink || media.url);
                        video.id = "video_popup_element";
                        video.addEventListener('loadedmetadata', function () {
                            if (this.duration === Infinity) {
                                video.currentTime = 1e101;
                                video.ontimeupdate = function () {
                                    if (video.currentTime == 0) {
                                        video.ontimeupdate = null;
                                        resolve({
                                            video
                                        })
                                    }
                                };
                            } else {
                                resolve({
                                    video
                                })
                            }
                        });
                    }

                } catch (err) {
                    reject(err);
                }
            });
            videoPromise.then(function (value: any) {
                if (document.getElementById("videoElement")) {
                    value.video.currentTime = 0.001;
                    value.video.autoplay = true;
                    document.getElementById("videoElement").innerHTML = "";
                    if ((document as any).pictureInPictureElement) {
                        (document as any).exitPictureInPicture()
                    }
                    document.getElementById("videoElement").appendChild(value.video);
                }
            });
            //document.getElementById("videoElement") && (document.getElementById("videoElement").innerHTML = `<img src=${media.url} />`);
        }
    }

    componentDidMount() {
        const {message, media} = this.props;
        window.addEventListener("online", this.getVideoUrl);
        this.updateVideo();
    }

    componentWillMount() {
        window.removeEventListener("online", this.getVideoUrl);
    }

     getVideoUrl = async () =>{
         const {message, media} = this.props;
         const {videoLink} = this.state;

         if((media.url === message.msgId) && !videoLink) {
             let bucket: any;
             if (message.threadId && message.threadId !== "") {
                 if (isPublicRoom(message.threadId)) {
                     bucket = conf.app.aws.bucket.group;
                 }
             } else {
                 bucket = conf.app.aws.bucket.fileTransfer;
             }
             const videoUrl = await getSignedUrl(bucket, REQUEST_TYPES.get, message.fileRemotePath);

             if (videoUrl) {
                 this.setState({videoLink: videoUrl});
             }
         }
    };

    render() {
        const {message} = this.props;

        return (
            <div id="videoElement" className="video_element"><img className="video-tumb" src={message.src}/></div>
        );
    }
};
