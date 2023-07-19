"use strict";

import * as React from 'react';
import isEqual from 'lodash/isEqual';

import {IMessage} from "modules/messages/MessagesReducer";
import {
    getURIOrigin,
    getWebContentDescription,
    getWebContentImageUrl,
    getWebContentTitle,
    normalizeURI
} from "helpers/DomHelper";
import {getLinkPreview} from "requests/getLinkPreview";
import {NETWORK_LINK_REGEX, SHARED_MEDIA_TYPES} from "configs/constants";
import {getLinkifiedText} from "helpers/MessageHelper";
import {emojify} from "helpers/EmojiHelper";
import {
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble
} from "containers/chat-panel-refactor/chat-container/bubblesComponent/style";
import {getMessageTime} from "helpers/DateHelper";
import Log from "modules/messages/Log";


interface ILinkPreviewProps {
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void,
    updateMessageProperty?: (msgId, property, value, updateToDB?: boolean) => void;
    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    message: IMessage;
    isOnline: boolean;
}

interface ILinkPreviewState {
    isLoaded: boolean;
    title: string;
    description: string;
    siteURL: string;
    imagePreviewUrl: any;
    isLoadedImagePreview: boolean;
}

class LinkPreview extends React.Component<ILinkPreviewProps, ILinkPreviewState> {

    _mounted: boolean = true;

    linkContainer: any = React.createRef();

    constructor(props: ILinkPreviewProps) {
        super(props);
        const {message} = props;
        const linkInfo: any = message.getIn(['m_options', 'linkInfo']);
        const title: string = linkInfo && linkInfo.get('title') || "";
        const description: string = linkInfo && linkInfo.get('description') || "";
        const siteURL: string = linkInfo && linkInfo.get('siteURL') || "";
        const imagePreviewUrl: string = linkInfo && linkInfo.get('imagePreviewUrl') || "";

        this.state = {
            isLoaded: !linkInfo,
            title,
            description,
            siteURL,
            imagePreviewUrl,
            isLoadedImagePreview: false
        }
    }

    componentDidMount(): void {
        const {isLoaded} = this.state;
        const {ADD_MEDIA_RECORD, message} = this.props;

        // Create a new link message
        if (isLoaded) {
            const sharedMediaRecordsMap = {
                messageStatus: null,
                messages: message.toJS(), //TODO
            };

            ADD_MEDIA_RECORD(SHARED_MEDIA_TYPES.LINK, sharedMediaRecordsMap);

            const {url, normalizedURI} = normalizeURI(message.get('text'));
            this.handleGetLinkPreviewInfo(url, normalizedURI);
        }
    }

    shouldComponentUpdate(nextProps: ILinkPreviewProps, nextState: ILinkPreviewState): boolean {
        const {message, isOnline} = this.props;

        // Update component if message is changed (edited)
        if (message.get('text') !== nextProps.message.get('text')) {
            return true;
        }

        if (message.get('seen') !== nextProps.message.get('seen')) {
            return true;
        }

        if (message.get('delivered') !== nextProps.message.get('delivered')) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true;
        }

        return !isEqual(nextState, this.state);
    }

    componentDidUpdate(prevProps: ILinkPreviewProps, prevState: ILinkPreviewState): void {
        const {message, isOnline} = this.props;
        const {description, title} = this.state;

        // Update link preview if message is edited
        if (message.get('text') !== prevProps.message.get('text')) {
            const {url, normalizedURI} = normalizeURI(message.get('text'));
            const previousURLInfo = normalizeURI(prevProps.message.get('text'));
            // Check if url changed
            if (url !== previousURLInfo.url) {
                this.handleGetLinkPreviewInfo(url, normalizedURI);
            }
        } else if (isOnline !== prevProps.isOnline && (!description || !title)) {
            const {url, normalizedURI} = normalizeURI(message.get('text'));
            this.handleGetLinkPreviewInfo(url, normalizedURI);
        }
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    handleGetLinkPreviewInfo = (url: string, normalizedURI: string): void => {
        const {message, updateMessageProperty, UPDATE_MEDIA_RECORD} = this.props;
        const newState: ILinkPreviewState = {...this.state};

        (async () => {
            try {
                const webContent: any = await getLinkPreview(normalizedURI);
                const title: string = getWebContentTitle(webContent);
                const description: string = getWebContentDescription(webContent);
                const siteURL: string = getURIOrigin(url);
                const imagePreviewUrl: string = getWebContentImageUrl(webContent, normalizedURI);

                newState.title = title.trim();
                newState.description = description.trim();
                newState.imagePreviewUrl = imagePreviewUrl;
                newState.siteURL = siteURL.trim();
                newState.isLoaded = false;
                this.setState(newState);

                updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                    linkInfo: {
                        title,
                        description,
                        siteURL,
                        imagePreviewUrl,
                    }
                }, true);

                UPDATE_MEDIA_RECORD(SHARED_MEDIA_TYPES.LINK, message.get("messageId") || message.get("id"), "m_options", {
                    linkInfo: {
                        title,
                        description,
                        siteURL,
                        imagePreviewUrl
                    }
                })

            } catch (e) {
                Log.i(e);
                newState.isLoaded = false;
                this.setState(newState);
            }
        })();
    };

    handleImageOnLoaded = (e: any): void => {
        const width: number = e.currentTarget.width;
        const newState: ILinkPreviewState = {...this.state};
        newState.isLoadedImagePreview = true;
        if (width < 400) {
            this.linkContainer.current.classList.add('link-preview-reverse')
        }

        this.setState(newState);

    };

    handleImageOnError = (): void => {
        Log.i("Failed to load image");
    };

    handleUrlOpen = (event: React.MouseEvent<HTMLSpanElement>) => {
        const {handleNetworkJoin} = this.props;

        const target: any = event.target;
        const href: string = target.getAttribute("href");

        if (href) {
            const networkRegex = new RegExp(NETWORK_LINK_REGEX, "gi");
            const networkLink: boolean = networkRegex.test(href);

            if (networkLink) {
                const networkToken: string = href.split("networks/").pop();
                if (!!networkToken) {
                    handleNetworkJoin(networkToken, true);
                }
            } else {
                window.open(href)
            }
        }
        return false;
    };


    render(): JSX.Element {
        const {title, description, imagePreviewUrl, isLoadedImagePreview, siteURL} = this.state;
        const {message} = this.props;

        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');

        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");
        const status = message.get("status");
        const delivered = message.get("delivered");
        const seen = message.get("seen");
        const messageTime: any = message.get("time");

        const isSent: boolean = isOwnMessage && status && !delivered && !seen;
        const isDelivered: boolean = isOwnMessage && delivered && !seen;
        const isSeen = isOwnMessage && seen;
        const isDeliveryWaiting: boolean = isOwnMessage && !status && !delivered && !seen;
        const isPreviewShown: boolean = title !== "" || description !== "";

        const filteredText: any = getLinkifiedText(message.get('text'));
        const replacedText: any = emojify(filteredText.replace(rep, "<3").replace(questionEmojy, "<?"));
        const time: string = getMessageTime(messageTime);

        return (
            <>
                <div className={"link"}>
                <span draggable={false} className="text" onClickCapture={this.handleUrlOpen}
                      dangerouslySetInnerHTML={{__html: Array.isArray(replacedText) ? replacedText.join("") : replacedText}}/>
                </div>
                {
                    !isPreviewShown &&


                    <TimeBubble isOwnMessage={isOwnMessage} isLinkBubble={true}>
                        {edited && <EditedMessage/>}
                        <Time>{time}</Time>
                        <StatusMessage isSeen={isSeen} isDelivered={isDelivered} isSent={isSent}/>
                        {isDeliveryWaiting && <IsDeliveryWaiting isLinkBubble={true}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                }
                {isPreviewShown &&
                <div className="link-preview" ref={this.linkContainer}>
                    {/*web site preview image*/}

                    <div className="link-preview-block">
                        {
                            imagePreviewUrl !== "" &&
                            <div className="link-preview-image">
                                <img
                                    className={isLoadedImagePreview ? "" : "hidden"}
                                    src={imagePreviewUrl}
                                    alt="logo"
                                    draggable={false}
                                    onLoad={this.handleImageOnLoaded}
                                    onError={this.handleImageOnError}
                                />
                            </div>
                        }


                        <div className="link-preview-content">
                            {/*web site url*/}
                            {
                                siteURL !== "" &&
                                <div className="site-url" dangerouslySetInnerHTML={{__html: siteURL}}
                                     draggable={false}/>
                            }

                            {/*web site title*/}
                            {
                                title !== "" &&
                                <div className="title" dangerouslySetInnerHTML={{__html: title}} draggable={false}/>
                            }

                            {/*web site description*/}
                            {
                                description !== "" &&
                                <div
                                    className="description"
                                    dangerouslySetInnerHTML={{__html: description}}
                                    draggable={false}
                                />
                            }

                        </div>
                    </div>
                    <div className="info">
                        <TimeBubble isOwnMessage={isOwnMessage} isLinkBubble={true}>
                            {edited && <EditedMessage/>}
                            <Time>{time}</Time>
                            <StatusMessage isSeen={isSeen} isDelivered={isDelivered} isSent={isSent}/>
                            {isDeliveryWaiting && <IsDeliveryWaiting isLinkBubble={true}><span/></IsDeliveryWaiting>}
                        </TimeBubble>
                    </div>
                </div>}
            </>

        );
    }
}

export default LinkPreview;
