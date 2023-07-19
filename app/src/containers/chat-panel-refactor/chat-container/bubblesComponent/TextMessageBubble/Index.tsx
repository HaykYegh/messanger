"use strict";

import * as React from "react";
import {connect} from "react-redux";
import {
    ChatItemText
} from "components/messages/style";

import {EMAIL_VALIDAITON_REGEX, MESSAGE_TYPES, NETWORK_LINK_REGEX, ARABIC_LANGUAGE} from "configs/constants";
import {emojify, includesEmoji} from "helpers/EmojiHelper";
import isEqual from "lodash/isEqual";
import {getLinkifiedText} from "helpers/MessageHelper";
import selector from "services/selector";

interface ITextMessageProps {
    handleNetworkJoin?: (keyword: string, token: boolean) => void;
    text?: string;
    searchedActiveMessage?: string;
    message?: any;
    app?: any;
    isStartMessage?: boolean;
    language?: any;
    isSystemMessage?: boolean;
}

interface IImageMessageState {
    highlightText: string;
}

const selectorVariables: any = {
    application: {
        app: true
    }
};

class TextMessageBubble extends React.Component<ITextMessageProps, IImageMessageState> {

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

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== this.props.searchedActiveMessage) {
            return true;
        }

        if (this.props.message.get('link') !== nextProps.message.get('link')) {
            return true;
        }

        if (this.props.text !== nextProps.text) {
            return true;
        }

        if(!isEqual(this.props.language, nextProps.message)) {
            return true;
        }

        // if(!isEqual(this.props.searchedActiveMessage, nextProps.searchedActiveMessage)) {
        //     return true;
        // }

        return this.state.highlightText !== nextState.highlightText;
    }

    componentDidUpdate(prevProps: Readonly<ITextMessageProps>, prevState: Readonly<IImageMessageState>, snapshot?: any) {
        // const {searchedActiveMessage, app: {searchKeyword}} = this.props
        // console.log(prevProps.searchedActiveMessage !== searchedActiveMessage, 'prevPropsSearchedActiveMessage')
        // console.log(searchedActiveMessage, 'searchedActiveMessage2')
        // console.log(searchKeyword, 'searchKeyword1234')
        // console.log(this.state.highlightText, 'thisStateHighlightText')
        // if(prevProps.searchedActiveMessage !== searchedActiveMessage && this.state.highlightText === "" && searchedActiveMessage !== "") {
        //     console.log('componentDidUpdate2')
        //     this.setState({highlightText: searchKeyword})
        // }
    }

    componentWillUnmount(): void {
        document.removeEventListener("messageSearch", this.handleMessageEvent);
    }

    handleMessageEvent = ({detail: {messageIds, text}}: any): void => {
        const {message} = this.props;
        const messageId: string = message.get('messageId') || message.get('id');
        const {highlightText} = this.state;
        if (messageIds.includes(messageId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleUrlOpen = (event: React.MouseEvent<HTMLSpanElement>): void => {
        const {handleNetworkJoin} = this.props;

        const target: any = event.target;
        const href: string = target.getAttribute("href");

        if (!href) {
            return;
        }

        const networkRegex = new RegExp(NETWORK_LINK_REGEX, "gi");
        const networkLink: boolean = networkRegex.test(href);

        if (networkLink) {
            const networkToken: string = href.split("networks/").pop();
            if (!!networkToken) {
                handleNetworkJoin(networkToken, true);
            }
        } else {
            window.open(href);
        }
    };

    get isSystemMessage(): boolean {
        const {message} = this.props;
        return [
            MESSAGE_TYPES.leave_group,
            MESSAGE_TYPES.join_group,
            MESSAGE_TYPES.remove_from_group,
            MESSAGE_TYPES.update_group_avatar,
            MESSAGE_TYPES.update_group_name,
            MESSAGE_TYPES.room_call_start,
            MESSAGE_TYPES.room_call_join,
            MESSAGE_TYPES.room_call_leave,
            MESSAGE_TYPES.room_call_end,
            MESSAGE_TYPES.delete_room,
            MESSAGE_TYPES.create_room
        ].includes(message.get('type'));
    }

    render() {
        const {text, searchedActiveMessage, message, language, app: {searchKeyword}, isStartMessage} = this.props;
        const {highlightText} = this.state;
        const messageId: string = message.get('messageId') || message.get('id');
        const isLink: boolean = message.get('link');
        const linkTags: any = message.get("linkTags") && message.get("linkTags").size > 0 ?
            message.get("linkTags").toJS() : message.get("linkTags"); // Todo improvement

        const rep = new RegExp("&lt;3", 'g');
        const questionEmojy = new RegExp("&lt;[?]", 'g');
        let filteredText = text;

        if (linkTags && linkTags.length > 0) {
            linkTags.map(item => {
                filteredText = filteredText.replace(`@${item}`,
                    `<span draggable="false" data-link="${item}" class="linkified text">&#64;${item}</span>`
                );
            });
        }
        let replacedText: any = emojify(filteredText ? filteredText.replace(rep, "<3").replace(questionEmojy, "<?") : " ");
        let fontSize = "15px"

        if (replacedText.length == 2 && includesEmoji(replacedText)) {
            fontSize = "35px"
        }

        if (replacedText.length == 4 && typeof replacedText === "string") {
            const replasedTextArr = replacedText.split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/).filter(item => item !== "")
            const replasedTextBool = replasedTextArr.every(item => includesEmoji(item))
            if (replasedTextBool) {
                fontSize = "25px"
            }
        }

        if (replacedText.length == 6 && typeof replacedText === "string") {
            const replasedTextArr = replacedText.split(/([\uD800-\uDBFF][\uDC00-\uDFFF])/).filter(item => item !== "")
            const replasedTextBool = replasedTextArr.every(item => includesEmoji(item))
            if (replasedTextBool) {
                fontSize = "20px"
            }
        }

        const _isSystemMessage: boolean = this.isSystemMessage;



        if ((highlightText || searchKeyword) && !_isSystemMessage) {
            if (Array.isArray(replacedText)) {
                const highlightTextArr = replacedText.join("").replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") || searchKeyword.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")}`, "gi"));
                for (let el of replacedText) {
                    if (!(el.replace(/<[^>]*>/g, '') == "")) {
                        if (highlightTextArr && highlightTextArr.length > 0) {
                            for (let item of highlightTextArr) {
                                const index = replacedText.indexOf(el);
                                replacedText[index] = el.replace(/<[^>]*>/g, '').replace(`${item}`, `<div><span draggable="false" class=${searchedActiveMessage === messageId ? "highlight-active text" : "highlight text"}>${item}</span></div>`);
                            }
                        }
                    }
                }
            } else {
                const highlightTextArr = replacedText.replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") || searchKeyword.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")}`, "gi"));
                if (highlightTextArr && highlightTextArr.length > 0) {
                    replacedText = replacedText.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") || searchKeyword.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")}`, "gi"), match => {
                        return `<span draggable="false" class=${searchedActiveMessage === messageId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                    });
                }
            }
        }



        const linkifiedArr = Array.isArray(replacedText) ? replacedText.map(item => /<(\"[^\"]*\"|'[^']*'|[^'\">])*>/.test(item) ? item : getLinkifiedText(item)):[];

        return (
            isLink ? null :
                (text && (highlightText || searchKeyword) || (Array.isArray(replacedText) || (linkTags && linkTags.length > 0))) ?
                    <ChatItemText language={language} ><span draggable={false} className="text" onClickCapture={this.handleUrlOpen}
                               dangerouslySetInnerHTML={{__html: Array.isArray(linkifiedArr) && linkifiedArr.length > 0 ? linkifiedArr.join("") : replacedText}}
                    />
                    </ChatItemText> :
                    (text ?  <div className={language === ARABIC_LANGUAGE ? "link-ar" : "link"}>
                <span
                  style={{
                      fontSize
                  }}
                  draggable={false} className={language === ARABIC_LANGUAGE ? 'arabic-text' : isStartMessage ? "text text-startm" : 'text'} onClickCapture={this.handleUrlOpen}
                      dangerouslySetInnerHTML={{__html: Array.isArray(getLinkifiedText(replacedText)) ? getLinkifiedText(replacedText).join("") : getLinkifiedText(replacedText)}}
                />
                    </div> : null)
        );
    }

};

const mapStateToProps: any = state => selector(state, selectorVariables);

export default connect<{}, {}, ITextMessageProps>(mapStateToProps)(TextMessageBubble);
