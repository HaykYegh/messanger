"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {EMAIL_VALIDAITON_REGEX, NETWORK_LINK_REGEX} from "configs/constants";
import {emojify} from "helpers/EmojiHelper";

interface ITextMessageProps {
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    text: string;
    isLink?: boolean;
    linkTags?: any;
    searchedActiveMessage?: string;
    msgId: string;
}

interface IImageMessageState {
    highlightText: string;
}

export default class TextMessage extends React.Component<ITextMessageProps, IImageMessageState> {

    constructor(props: any) {
        super(props);

        this.state = {
            highlightText: ""
        };
    }

    componentDidMount() {
        document.addEventListener("messageSearch", this.handleMessageEvent);
    }

    shouldComponentUpdate(nextProps: ITextMessageProps, nextState: IImageMessageState) {
        const {text, isLink, searchedActiveMessage} = this.props;

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        return !isEqual(this.state, nextState) || text !== nextProps.text || isLink !== nextProps.isLink;
    }

    componentWillUnmount(): void {
        document.removeEventListener("messageSearch", this.handleMessageEvent);
    }

    handleMessageEvent = ({detail: {messageIds, text}}: any): void => {
        const {msgId} = this.props;
        const {highlightText} = this.state;
        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
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

    render() {
        const {text, isLink, linkTags, searchedActiveMessage, msgId} = this.props;
        const {highlightText} = this.state;
        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        let filteredText = text;

        if (linkTags && linkTags.length > 0) {
            linkTags.map(item => {
                filteredText = filteredText.replace(`@${item}`, `<span draggable="false" data-link="${item}" class="linkified text">&#64;${item}</span>`);
            });
        }
        let replacedText: any = emojify(filteredText.replace(rep, "<3").replace(questionEmojy, "<?"));
        const isEmail : boolean = EMAIL_VALIDAITON_REGEX.test(replacedText);
        const emailOpts: any = {};

        if(isEmail) {
            emailOpts["href"] = `mailto:${replacedText}`;
        }

        if (highlightText) {
            if (Array.isArray(replacedText)) {
                const highlightTextArr = replacedText.join("").replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText}`, "gi"));
                for (let el of replacedText) {
                    if (!(el.replace(/<[^>]*>/g, '') == "")) {
                        if (highlightTextArr && highlightTextArr.length > 0) {
                            for (let item of highlightTextArr) {
                                const index = replacedText.indexOf(el);
                                replacedText[index] = el.replace(/<[^>]*>/g, '').replace(`${item}`, `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${item}</span>`);
                            }
                        }
                    }
                }
            } else {
                const highlightTextArr = replacedText.replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText}`, "gi"));
                if (highlightTextArr && highlightTextArr.length > 0) {
                    replacedText = replacedText.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText}`, "gi"), match => {
                        return `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                    });
                }
            }
        }
        return (
            isLink ? null :
            (text && highlightText || (Array.isArray(replacedText) || (linkTags && linkTags.length > 0))) ?
                <div><span draggable={false} className="text" onClickCapture={this.handleUrlOpen}
                           dangerouslySetInnerHTML={{__html: Array.isArray(replacedText) ? replacedText.join("") : replacedText}}/> </div>:
                (text ? <div><span draggable={false} onClick={this.handleUrlOpen} {...emailOpts}
                                   className={isEmail ? "linkified" : "text"}>{replacedText.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</span> </div>: null)
        );
    }

};
