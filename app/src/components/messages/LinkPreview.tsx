"use strict";

import * as React from 'react';
import isEqual from 'lodash/isEqual';

import {IMessage} from "modules/messages/MessagesReducer";
import {
    getURIOrigin,
    getWebContentDescription,
    getWebContentImageUrl,
    getWebContentTitle, normalizeURI
} from "helpers/DomHelper";
import {getLinkPreview} from "requests/getLinkPreview";
import {MESSAGE_TYPES, NETWORK_LINK_REGEX, SHARED_MEDIA_TYPES} from "configs/constants";
import {getLinkifiedText} from "helpers/MessageHelper";
import {emojify} from "helpers/EmojiHelper";
import {EditedMessage, IsDeliveryWaiting, StatusMessage, Time, TimeBubble} from "components/messages/style";
import Log from "modules/messages/Log";
import {updateMessageLinkProps} from "modules/messages/MessagesActions";
import IDBMessage from "services/database/class/Message";
import {scrollToBottom} from "helpers/UIHelper";


interface ILinkPreviewProps {
    updateMessageProperty?: (msgId, property, value, updateToDB?: boolean) => void;
    message: IMessage;
    classForTimes?: any;
    classForStatus?: any;
    isSharedMedia?: boolean;
    ADD_MEDIA_RECORD: (sharedMediaType: string, sharedMediaRecords: any) => void
    UPDATE_MEDIA_RECORD: (sharedMediaType: string, messageId: string, property: string, sharedMediaUpdater: any) => void,
    isOnline: boolean;
    isDeliveryWaiting: boolean;
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    language?: any;
    selectedConversation?: any;
    conversationLastMessageId?: string;
    changeConversationLastMessageId: (msgId: string) => void
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
        const {message, isOnline,  language} = this.props;

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

        if (message.get('linkSiteURL') !== nextProps.message.get('linkSiteURL')) {
            return true;
        }

        if (message.get('linkTitle') !== nextProps.message.get('linkTitle')) {
            return true;
        }

        if (message.get('linkDescription') !== nextProps.message.get('linkDescription')) {
            return true;
        }

        if (message.get('linkImagePreviewUrl') !== nextProps.message.get('linkImagePreviewUrl')) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true;
        }

        if(language !== nextProps.language) {
            return true;
        }

        return !isEqual(nextState, this.state);
    }


    componentDidUpdate(prevProps: ILinkPreviewProps, prevState: ILinkPreviewState): void {
        const {message, isOnline, selectedConversation, conversationLastMessageId, changeConversationLastMessageId} = this.props;
        const {description, title} = this.state;

        if (message.get("linkTitle") !== prevProps.message.get("linkTitle") ||
            message.get("linkDescription") !== prevProps.message.get("linkDescription")
        ) {
            scrollToBottom();
            changeConversationLastMessageId(message.get("messageId"));
        }

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
                if (!message.get("linkTitle") && !message.get("linkDescription")) {
                    const webContent: any = await getLinkPreview(normalizedURI);
                    const linkTitle: string = getWebContentTitle(webContent);
                    const linkDescription: string = getWebContentDescription(webContent);
                    const linkSiteURL: string = getURIOrigin(url);
                    const linkImagePreviewUrl: string = getWebContentImageUrl(webContent, normalizedURI);

                    updateMessageLinkProps(message.get("messageId"), linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl)
                    IDBMessage.update(message.get("messageId"), {linkTitle, linkDescription, linkSiteURL, linkImagePreviewUrl})

                    newState.title = linkTitle.trim();
                    newState.description = linkDescription.trim();
                    newState.imagePreviewUrl = linkImagePreviewUrl;
                    newState.siteURL = linkSiteURL.trim();
                    newState.isLoaded = false;
                    this.setState(newState);

                    updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                        linkInfo: {
                            title: linkTitle,
                            description: linkDescription,
                            siteURL: linkSiteURL,
                            imagePreviewUrl: linkImagePreviewUrl,
                            url
                        }
                    }, true);

                    UPDATE_MEDIA_RECORD(SHARED_MEDIA_TYPES.LINK, message.get("messageId") || message.get("id"), "m_options", {
                        linkInfo: {
                            title: linkTitle,
                            description: linkDescription,
                            siteURL: linkSiteURL,
                            imagePreviewUrl: linkImagePreviewUrl,
                            url
                        }
                    })
                }




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
        const {isLoaded, title, description, imagePreviewUrl, isLoadedImagePreview, siteURL} = this.state;
        const {classForTimes, message, classForStatus, isSharedMedia, isDeliveryWaiting} = this.props;
        const messageTime: any = message.get("time");
        const time: any = ("0" + new Date(messageTime).getHours()).slice(-2) + ":" + ("0" + new Date(messageTime).getMinutes()).slice(-2);

        // if (isLoaded) {
        //     return null;
        //     // return <div>Loading ...</div>;
        // }
        //
        // if (title === "" && description === "") {
        //     return null;
        // }
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        let filteredText = getLinkifiedText(message.get('text'));
        let replacedText: any = emojify(filteredText.replace(rep, "<3").replace(questionEmojy, "<?"));
        const isPreviewShown: boolean = message.get("linkTitle") || message.get("linkDescription");
        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");
        const isSent = message.get("own") && message.get("status") && !message.get("delivered") && !message.get("seen");
        const isDelivered = message.get("own") && message.get("delivered") && !message.get("seen");
        const isSeen = message.get("own") && message.get("seen");
        const isLinkBubble = !message.get("deleted") && message.get("type") === MESSAGE_TYPES.text && message.get("link");
        {/*<span className={classForTimes}>*/}
                        {/*{!!message.get("edited") && <span className="edited-icon"/>}*/}
            {/*<span className="time">{time}</span>*/}
                            {/*<span className={classForStatus}/>*/}
            {/*{isDeliveryWaiting && <IsDeliveryWaiting> <span/></IsDeliveryWaiting>}*/}
                        {/*</span>*/}

        return (
            <>
                <div className={this.props.language === "ar" ? "link link-ar" : "link"}>
                <span draggable={false} className="text" onClickCapture={this.handleUrlOpen}
                      dangerouslySetInnerHTML={{__html: Array.isArray(replacedText) ? replacedText.join("") : replacedText}}/>
                </div>
                {
                    !isPreviewShown &&


                    <TimeBubble isOwnMessage={isOwnMessage} isLinkBubble={isLinkBubble}>
                        {edited && <EditedMessage/>}
                        <Time>{time}</Time>
                        <StatusMessage isSeen={isSeen} isDelivered={isDelivered} isSent={isSent}/>
                        {isDeliveryWaiting && <IsDeliveryWaiting isLinkBubble={isLinkBubble}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                }
                {isPreviewShown &&
                <div className={this.props.language === "ar" ? "link-preview link-preview-ar link-preview-reverse" : "link-preview link-preview-reverse"} ref={this.linkContainer}>
                    {/*web site preview image*/}

                    <div className="link-preview-block">
                        {
                            message.get("linkImagePreviewUrl") &&
                            <div className="link-preview-image">
                                <img
                                    className={message.get("linkImagePreviewUrl") ? "" : "hidden"}
                                    src={message.get("linkImagePreviewUrl")}
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
                                message.get("linkSiteURL") &&
                                <div className="site-url" dangerouslySetInnerHTML={{__html: message.get("linkSiteURL")}}
                                     draggable={false}/>
                            }

                            {/*web site title*/}
                            {
                                message.get("linkTitle") &&
                                <div className="title" dangerouslySetInnerHTML={{__html: message.get("linkTitle")}} draggable={false}/>
                            }

                            {/*web site description*/}
                            {
                                message.get("linkDescription") &&
                                <div
                                    className="description"
                                    dangerouslySetInnerHTML={{__html: message.get("linkDescription")}}
                                    draggable={false}
                                />
                            }

                        </div>
                    </div>
                    <div className="info">
                        <TimeBubble isOwnMessage={isOwnMessage} isLinkBubble={isLinkBubble} language={this.props.language} >
                            {edited && <EditedMessage/>}
                            <Time>{time}</Time>
                            <StatusMessage isSeen={isSeen} isDelivered={isDelivered} isSent={isSent}/>
                            {isDeliveryWaiting && <IsDeliveryWaiting isLinkBubble={isLinkBubble}><span/></IsDeliveryWaiting>}
                        </TimeBubble>
                    </div>
                </div>}
            </>

        );
    }
}

export default LinkPreview;
