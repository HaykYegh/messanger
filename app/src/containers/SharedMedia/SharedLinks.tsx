"use strict";

import * as React from "react";
import {ScrollBar} from "containers/settings/style";
import {Map} from "immutable";
import {
    ButtonContent,
    Icon,
    LinkDomain,
    LinkTitle, MessageBlock, MessageIcon, MessageInfo, NoMedia, SelectButton,
    SharedMediaElement,
    SharedMediaList
} from "containers/SharedMedia/style";
import {SHARED_MEDIA_TYPES} from "configs/constants";
import {BoldText, DescriptionText} from "../../pages/AuthContainer/style";
import components from "configs/localization";
import {Loader, LoadingPage} from "../../pages/style";
import {normalizeURI} from "helpers/DomHelper";
import Log from "modules/messages/Log";

export interface ISharedLinksState {
}

export interface ISharedLinksProps {
    links: Map<string, any>;
    handleFilesChecked: (message: any, type: string, isOwnMessage: boolean) => void;
    isFilesEditing: boolean,
    checkedFiles: {
        [key: string]: {
            type: string,
            index: number
        }
    },
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void;
    selectedThreadId: string
    link: any
}


export default class SharedLinks extends React.Component<ISharedLinksProps, ISharedLinksState> {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount(): void {
        const {fetchSharedMedia, selectedThreadId, links} = this.props;
        // fetchSharedMedia(selectedThreadId, SHARED_MEDIA_TYPES.LINK)
    }

    handleMediaMessagesScroll = (event: any) => {
        const {links} = this.props;
        if (event.target.scrollTop >= (event.target.scrollHeight - event.target.offsetHeight) && links.get("count") > links.get("records").size) {
            const {fetchSharedMedia, selectedThreadId} = this.props;
            fetchSharedMedia(selectedThreadId, SHARED_MEDIA_TYPES.LINK)
        }
    };

    handleMessageSelect = (msgId) => {
        const {handleFilesChecked, links} = this.props;
        const isOwnMessage: boolean = links.getIn(["records", msgId, "messages", "own"]);
        handleFilesChecked(msgId, SHARED_MEDIA_TYPES.LINK, isOwnMessage)
    };

    handleMediaElementClick = (msgId) => {
        const {isFilesEditing} = this.props;
        if (isFilesEditing) {
            this.handleMessageSelect(msgId)
        }
    };

    handleUrlClick = (event: React.MouseEvent<HTMLSpanElement>) => {
        const url: string = event.currentTarget.getAttribute("data-value");
        const {isFilesEditing} = this.props;

        if (!isFilesEditing) {
            window.open(`https://${url}`);
        }
    };

    render() {
        const {links, isFilesEditing, checkedFiles, link} = this.props;
        const messages: Map<string, any> = link;
        const localization: any = components().sharedLinks;
        const messagesCount: number = links.get("count");

        return (
            <>
                {
                    links.get("isLoading") && messages.size === 0 && messagesCount !== 0 &&
                    <LoadingPage
                        width="30px"
                        height="30px"
                        top="50%"
                        right="50%"
                        position="absolute"
                        backgroundColor="#FFFFFF"
                    >
                        <Loader
                            backgroundColor="#fff"
                            width="30px"
                            height="30px"
                            background="#FFFFFF"
                        />
                    </LoadingPage>
                }
                {
                    messages.size !== 0 &&
                    <ScrollBar height="inherit" padding="0" onScroll={this.handleMediaMessagesScroll}>

                        <SharedMediaList padding="0 14px" margin={isFilesEditing ? "0 auto 60px" : "none"}>
                            {messages.valueSeq().sortBy(
                                (item) => item.getIn(['messages', 'time'])
                            ).reverse().map((messageData, key) => {

                                const message: any = messageData.get("messages");
                                const msgId: string = message.get("messageId") || message.get("id");

                                const linkInfo: any = message.getIn(['m_options', 'linkInfo']);
                                // const linkTitle: string = linkInfo && linkInfo.get('title') || "";
                                // const siteURL: string = linkInfo && linkInfo.get('siteURL') || "";
                                // const imagePreviewUrl: string = linkInfo && linkInfo.get('imagePreviewUrl') || "";

                                const linkTitle: string = message.get('linkTitle') || (linkInfo && linkInfo.get('title')) || "";
                                const siteURL: string = message.get('linkSiteURL') || (linkInfo && linkInfo.get('siteURL')) || "";
                                const imagePreviewUrl: string = message.get('linkImagePreviewUrl') || (linkInfo && linkInfo.get('imagePreviewUrl')) || "";
                                const firstCharacter: string = linkTitle.substring(0, 1);
                                const content = checkedFiles[msgId] && checkedFiles[msgId].index.toString();

                                // const linkUrl: string = message.get("text").replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
                                const linkUrl = linkInfo && linkInfo.get('url') || "";

                                return (
                                    <SharedMediaElement
                                        onClick={() => this.handleMediaElementClick(msgId)}
                                        key={key}
                                        elementType={SHARED_MEDIA_TYPES.LINK}
                                        isEditing={isFilesEditing}
                                    >
                                        <MessageBlock>
                                            {/*web site preview image*/}
                                            <MessageIcon isLink={true}>
                                                {
                                                    imagePreviewUrl !== "" ?
                                                        <Icon
                                                            width="50px"
                                                            height="50px"
                                                            objectFit="cover"
                                                            borderRadius="5px"
                                                            src={imagePreviewUrl}
                                                            alt="link"
                                                            draggable={false}
                                                        /> :
                                                        firstCharacter
                                                }
                                            </MessageIcon>
                                            <MessageInfo margin="0 0 0 12px">
                                                <LinkTitle draggable={false}>{linkTitle}</LinkTitle>
                                                <LinkDomain draggable={false} onClick={this.handleUrlClick}
                                                            data-value={siteURL}>{siteURL}</LinkDomain>
                                            </MessageInfo>
                                        </MessageBlock>
                                        {
                                            isFilesEditing &&
                                            <SelectButton
                                                top="unset"
                                                right="0"
                                                isSelected={checkedFiles.hasOwnProperty(msgId)}
                                            >
                                                <ButtonContent>{content}</ButtonContent>
                                            </SelectButton>
                                        }
                                    </SharedMediaElement>
                                )
                            })
                            }
                        </SharedMediaList>
                    </ScrollBar>
                }
                {
                    messages.size === 0 && !links.get("isLoading") &&
                    <NoMedia>
                        <BoldText>{localization.noLinks}</BoldText>
                        <DescriptionText>{localization.noLinksText}</DescriptionText>
                    </NoMedia>
                }
            </>
        );
    }

}
