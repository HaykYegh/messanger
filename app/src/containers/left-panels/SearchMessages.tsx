"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import DatePicker from "react-datepicker";

import {
    attemptSearchMessages,
    attemptShowCalendarMessages,
    attemptShowMoreSearchMessages,
    attemptShowSearchedMessage,
    removeSearchedMessageId,
    removeSearchedMessages,
    setSearchedMessageId
} from "modules/messages/MessagesActions";
import {
    ALL_LANGUAGES_REGEX,
    DOWN_KEY_CODE,
    ENTER_KEY_CODE,
    ESC_KEY_CODE,
    MESSAGE_TYPES,
    OFFLINE_MESSAGE_BODY,
    UP_KEY_CODE
} from "configs/constants";
import {attemptChangeLeftPanel, toggleSearchMessages} from "modules/application/ApplicationActions";
import {getThread, getThreadType} from "helpers/DataHelper";
import selector, {IStoreProps} from "services/selector";
import {getFormattedDate} from "helpers/DateHelper";
import Avatar from "components/contacts/Avatar";
import components from "configs/localization";
import "scss/pages/left-panel/SearchMessages";
import {emojify} from "helpers/EmojiHelper";
import {AvatarSize} from "components/contacts/style";

interface ISearchMessagesState {
    keywordEmpty: boolean;
    openCalendar: any;
    keyword: string;
    startDate: any;
}

interface ISearchMessagesProps extends IStoreProps {
    attemptShowSearchedMessage: (id: string, message: any, text: string) => void;
    toggleSearchMessages: (showSearchMessages: boolean) => void;
    attemptShowMoreSearchMessages: (text: string) => void;
    attemptShowCalendarMessages: (time: any) => void;
    attemptChangeLeftPanel: (panel: string) => void;
    attemptSearchMessages: (text: string) => void;
    setSearchedMessageId: (id: string) => void;
    removeSearchedMessageId: () => void;
    removeSearchedMessages: () => void;
    selectedThreadId: string;
    conversations: any;
}

const selectorVariables: any = {
    user: true,
    selectedThread: true,
    selectedThreadId: true,
    conversations: true,
    application: {
        app: true
    },
    messages: {
        messages: true,
        searchedMessages: true,
        searchedActiveMessage: true,
    },
    settings: {
        languages: true,
    },
};

class SearchMessages extends React.Component<ISearchMessagesProps, ISearchMessagesState> {
    constructor(props: any) {
        super(props);
        this.state = {
            keyword: "",
            openCalendar: false,
            keywordEmpty: false,
            startDate: null
        }
    }

    componentDidMount(): void {
        document.addEventListener("keydown", this.handleKeyboardPress);
        document.addEventListener("click", this.handleOutSideClick);
        if (document.getElementById("searchMessagesInput")) {
            document.getElementById("searchMessagesInput").addEventListener("keydown", this.handleInputKeyboardPress);
        }

    }

    shouldComponentUpdate(nextProps: ISearchMessagesProps, nextState: ISearchMessagesState): boolean {
        const {searchedMessages, searchedActiveMessage, messages, languages} = this.props;
        const {keyword} = this.state;

        if (nextProps.searchedMessages && !nextProps.searchedMessages.equals(searchedMessages)) {
            return true;
        }

        if (keyword && keyword.length > 0 && !messages.equals(nextProps.messages)) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (languages.get("selectedLanguage") !== nextProps.languages.get("selectedLanguage")) {
            return true
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: ISearchMessagesProps, prevState: ISearchMessagesState): void {
        const {attemptSearchMessages, removeSearchedMessages, selectedThreadId,conversations, removeSearchedMessageId, messages, contacts} = this.props;
        const {keyword, startDate} = this.state;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const threadIsEmpty = selectedThread.get("threads").isEmpty();

        if (prevState.keyword !== keyword && keyword !== "") {
            attemptSearchMessages(keyword);
            removeSearchedMessageId();
        }

        if (startDate && prevState.startDate !== startDate) {
            this.handleCalendarDateClick();
        }

        if (prevState.keyword !== keyword && keyword === "") {
            removeSearchedMessages();
            document.dispatchEvent(new CustomEvent("messageSearch", {detail: {messageIds: [], text: ""}}));
        }

        if (!threadIsEmpty && selectedThreadId !== prevProps.selectedThreadId) {
            this.handleLeftPanelBack();
        }

        if (keyword && keyword.length > 0 && !messages.equals(prevProps.messages)) {
            attemptSearchMessages(keyword);
            removeSearchedMessageId();
        }
    }

    componentWillUnmount(): void {
        const {removeSearchedMessages} = this.props;
        removeSearchedMessages();
        document.dispatchEvent(new CustomEvent("messageSearch", {detail: {messageIds: [], text: ""}}));
        document.removeEventListener("keydown", this.handleKeyboardPress);
        document.removeEventListener("click", this.handleOutSideClick);
        if (document.getElementById("searchMessagesInput")) {
            document.getElementById("searchMessagesInput").removeEventListener("keydown", this.handleInputKeyboardPress);
        }
    }

    handleLeftPanelBack = () => {
        const {app, attemptChangeLeftPanel, toggleSearchMessages} = this.props;

        const prevLeftPanel = app.previousLeftPanel;
        if (prevLeftPanel !== app.leftPanel) {
            attemptChangeLeftPanel(prevLeftPanel);
            toggleSearchMessages(false);
        }
    };

    handleSearchMessagesInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;

        const cleanText: string = value.replace(ALL_LANGUAGES_REGEX, "").trim();
        if (value && value.length > 0 && cleanText.length === 0) {
            this.setState({keywordEmpty: true});
        } else {
            this.setState({keywordEmpty: false});
        }
        if (value !== keyword) {
            this.setState({keyword: cleanText});
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchMessagesInput") as HTMLInputElement).value = "";
    };

    handleSearchedMessageClick = (id: string, message: any, keyword: string): void => {
        const {attemptShowSearchedMessage, setSearchedMessageId} = this.props;
        attemptShowSearchedMessage(id, message, keyword);
        setSearchedMessageId(id);
    };

    handleEnterKeydown = (keyCode) => {
        const {keyword} = this.state;
        const {searchedMessages, setSearchedMessageId, searchedActiveMessage} = this.props;
        const keys: any = searchedMessages.keySeq().toArray();
        if (keyword !== "" && searchedMessages.size > 1) {
            if (searchedActiveMessage) {
                const key = keys.indexOf(searchedActiveMessage);
                let nextKey;
                if (keyCode === DOWN_KEY_CODE) {
                    if (key === keys.length - 1) {
                        nextKey = 0;
                    } else {
                        nextKey = keys.indexOf(searchedActiveMessage) + 1;
                    }
                } else if (keyCode === UP_KEY_CODE) {
                    if (key === 0) {
                        nextKey = keys.length - 1;
                    } else {
                        nextKey = keys.indexOf(searchedActiveMessage) - 1;
                    }
                }
                const nextMessageId: any = keys[nextKey];
                const message: any = searchedMessages.get(nextMessageId);
                setSearchedMessageId(nextMessageId);
                this.handleSearchedMessageClick(nextMessageId, message, keyword);
            }
        } else {
            return;
        }
    };

    handleKeyboardPress = (event: any) => {
        switch (event.keyCode) {
            case ESC_KEY_CODE:
                this.handleLeftPanelBack();
                break;
            case UP_KEY_CODE:
            case DOWN_KEY_CODE:
                this.handleEnterKeydown(event.keyCode);
                break;
        }
    };

    handleInputKeyboardPress = (event: any) => {
        switch (event.keyCode) {
            case ESC_KEY_CODE:
                this.handleLeftPanelBack();
                break;
            case ENTER_KEY_CODE:
                this.handleEnterKeydown(DOWN_KEY_CODE);
                break;
        }
    };

    handleSearchMessagesScroll = (event: any): void => {
        const {attemptShowMoreSearchMessages} = this.props;
        const {keyword} = this.state;
        const element: any = event.target;
        if (element.scrollHeight - (element.offsetHeight + element.scrollTop) <= element.scrollHeight / 200) {
            attemptShowMoreSearchMessages(keyword);
        }
    };

    handleCalendarOpen = () => {
        this.setState({
            openCalendar: true,
        });
    };

    handleOutSideClick = (event: any) => {
        const {openCalendar} = this.state;
        if (openCalendar && event.target.className && !event.target.className.includes("react-datepicker") && event.target.id !== "open-search-calendar") {
            this.setState({
                openCalendar: false,
            })
        }
    };

    handleCalendarChange = (date): void => {
        this.setState({
            startDate: date,
            openCalendar: false,
        });
    };

    handleCalendarDateClick = () => {
        const {startDate} = this.state;
        const {attemptShowCalendarMessages} = this.props;
        const milliseconds = startDate.getTime();
        attemptShowCalendarMessages(milliseconds);
    };

    render(): JSX.Element {
        const {selectedThreadId,conversations, user, searchedMessages, messages, searchedActiveMessage, contacts} = this.props;
        const selectedThread = conversations.get(selectedThreadId) || contacts.get(selectedThreadId);
        const {keyword, openCalendar, keywordEmpty} = this.state;

        const localization: any = components().searchMessages;

        const {isGroup} = getThreadType(selectedThread.getIn(["threads", "threadType"]));
        const {threadInfo}: any = getThread(selectedThread, user.get("username"), true);



        const threadId: any = selectedThread.getIn(["threads", "threadId"]);
        const singleConversationName: string = !threadInfo.get("firstName") && !threadInfo.get("lastName") ? `+${threadInfo.get("name")}` : threadInfo.get("name");
        const threadImage: any = {
            url: threadInfo.get("avatarUrl"),
            file: threadInfo.get("avatar"),
        };

        const searchClearButton: boolean = keyword && keyword !== "";

        const handleDownArrowClick: any = () => this.handleEnterKeydown(DOWN_KEY_CODE);
        const handleUpArrowClick: any = () => this.handleEnterKeydown(UP_KEY_CODE);

        return (
            <div className="left_side">
                <div className="search-messages">
                    <div className="search-input">
                        <input
                            onChange={this.handleSearchMessagesInputChange}
                            placeholder={localization.searchInput}
                            data-field="contactName"
                            className={`search-messages-input${searchClearButton ? " no-border-right" : ""}`}
                            name="firstName"
                            type="text"
                            id="searchMessagesInput"
                            autoFocus={true}
                        />
                        {searchClearButton ? <button onClick={this.handleSearchClear} className="clear-search"/> :
                            <button id="open-search-calendar" className="calendar-search"
                                    onClick={this.handleCalendarOpen}/>}
                        {
                            openCalendar && <DatePicker
                                selected={this.state.startDate}
                                onChange={this.handleCalendarChange}
                                maxDate={new Date()}
                                inline
                            />
                        }
                    </div>
                </div>
                <div className="search-in-chat-info">
                    <span className="search-messages-text">
                        <h2>{localization.searchInChat}</h2>
                    </span>
                    <div className="conversation-info">
                        <div className="info-row">
                            <AvatarSize>
                                <Avatar
                                    image={threadImage}
                                    color={threadInfo.getIn(["color", "numberColor"])}
                                    status={threadInfo.get("status")}
                                    avatarCharacter={threadInfo.get("avatarCharacter")}
                                    name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                                    meta={{threadId}}
                                />
                            </AvatarSize>
                            {isGroup && <span className="group-icon"/>}
                            <h2 className="conversation-name">{isGroup ? threadInfo.get("name") : singleConversationName}</h2>
                            <button className="close-button"
                                    onClick={this.handleLeftPanelBack}>{localization.cancel}</button>
                        </div>
                    </div>
                    <span className="search-messages-text">
                        {
                            !searchClearButton && !keywordEmpty ? <h2>{localization.searchResult}</h2> :
                                searchedMessages && searchedMessages.size > 0 ?
                                    <React.Fragment>
                                        <h2>{`${localization.foundResult} ${searchedMessages.size} ${searchedMessages.size === 1 ? localization.message : localization.messages}`}</h2>
                                        {
                                            searchedActiveMessage &&
                                            <div className="arrow-buttons">
                                                <button className="arrow-button arrow-down"
                                                        onClick={handleDownArrowClick}/>
                                                <button className="arrow-button arrow-up" onClick={handleUpArrowClick}/>
                                            </div>
                                        }
                                    </React.Fragment>
                                    : <h2>{localization.noResult}</h2>
                        }
                    </span>
                </div>
                <div className="messages-results" onScroll={this.handleSearchMessagesScroll}>
                    {messages && messages.size < 1 &&
                    <div className="no-messages">
                        <span className="no-messages-title">{localization.noMessagesTitle}</span>
                        <p className="no-messages-text">{localization.noMessagesText}</p>
                    </div>
                    }
                    {
                        searchedMessages && searchedMessages.size > 0 &&
                        searchedMessages.valueSeq().map(message => {
                            const messageId: string = message && (message.get('messageId') || message.get('id'));
                            const creatorId: string = message && message.get("creator");
                            const own: any = message && message.get("own");
                            const type: any = message && message.get("type");
                            const time: any = message && message.get("time");
                            const text: any = message && message.get("text");
                            const threadInfo: any = own ? user : selectedThread.getIn(['members', creatorId]);

                            if (!threadInfo) {
                                return null
                            }
                            const userName: any = own ? threadInfo.get("fullName") : threadInfo.get("name");
                            const threadImage: any = {
                                url: threadInfo.get("avatarUrl"),
                                file: threadInfo.get("avatar"),
                            };
                            let searchedText: string = "";
                            if (type === MESSAGE_TYPES.file) {
                                const fileMessage: any = JSON.parse(message.get("info"));
                                searchedText = fileMessage.fileName + "." + fileMessage.fileType;
                            } else if ([MESSAGE_TYPES.text, MESSAGE_TYPES.image].includes(type)) {
                                searchedText = emojify(text, true);
                            } else if ([MESSAGE_TYPES.video, MESSAGE_TYPES.stream_file].includes(type)) {
                                searchedText = (
                                    text === OFFLINE_MESSAGE_BODY || text === "null") ? "" :
                                    ((type === MESSAGE_TYPES.stream_file && text &&
                                        text.match(/text="(.*?)"[ ]?\//)) ? text.match(/text="(.*?)"[ ]?\//)[1]
                                        : text);
                            } else {
                                searchedText = text;
                            }
                            let fileType: string;
                            const localization = components().fileType;
                            switch (type) {
                                case MESSAGE_TYPES.file:
                                    fileType = `${localization.file}:`;
                                    break;
                                case MESSAGE_TYPES.image:
                                    fileType = `${localization.photo}:`;
                                    break;
                                case MESSAGE_TYPES.stream_file:
                                case MESSAGE_TYPES.video:
                                    fileType = `${localization.video}:`;
                                    break;
                                case MESSAGE_TYPES.text:
                                    fileType = `${localization.text}:`;
                                    break;
                                case MESSAGE_TYPES.contact_with_info:
                                    fileType = `${localization.contact}:`;
                                    break;
                                default:
                                    fileType = "";
                                    break;
                            }
                            const handleLoadedMessageClick: any = () => this.handleSearchedMessageClick(messageId, message, keyword);
                            const active: boolean = searchedActiveMessage === messageId;

                            return (
                                <div
                                    className={`searched-message-row${active ? " active-row" : ""}`}
                                    key={messageId}
                                    onClick={handleLoadedMessageClick}
                                >
                                    <AvatarSize>
                                        <Avatar
                                            image={threadImage}
                                            color={threadInfo.getIn(["color", "numberColor"])}
                                            status={threadInfo.get("status")}
                                            avatarCharacter={threadInfo.get("avatarCharacter")}
                                            name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                                            meta={{threadId: creatorId}}
                                            userAvatar={own}
                                        />
                                    </AvatarSize>
                                    <div className="searched-message-info">
                                        <div className="creator-info">
                                            <h2 className="creator-name">{userName}</h2>
                                            <h2 className="message-time">{time !== 0 ? getFormattedDate({
                                                date: time,
                                                left: true
                                            }) : ""}</h2>
                                        </div>
                                        <div className="searched-message-text">
                                            {fileType && <h2 className="message-text message-type">{fileType}</h2>}
                                            <h2 className="message-text">{searchedText}</h2>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptChangeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    toggleSearchMessages: (showSearchMessages: boolean) => dispatch(toggleSearchMessages(showSearchMessages)),
    attemptSearchMessages: (text: string) => dispatch(attemptSearchMessages(text)),
    attemptShowSearchedMessage: (id: string, message: any, text: string) => dispatch(attemptShowSearchedMessage(id, message, text)),
    setSearchedMessageId: (id: string) => dispatch(setSearchedMessageId(id)),
    removeSearchedMessageId: () => dispatch(removeSearchedMessageId()),
    removeSearchedMessages: () => dispatch(removeSearchedMessages()),
    attemptShowMoreSearchMessages: (text: string) => dispatch(attemptShowMoreSearchMessages(text)),
    attemptShowCalendarMessages: (time: any) => dispatch(attemptShowCalendarMessages(time)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchMessages);
