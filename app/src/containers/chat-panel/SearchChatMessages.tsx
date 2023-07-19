"use strict";

import "scss/pages/chat-panel/SearchChatMessages";
import {isEqual} from "lodash";
import * as React from "react";


interface ISearchChatMessagesState {
    keyword: string;
}

interface ISearchChatMessagesProps {
    toggleSearchMessages: (showSearchMessages: boolean) => void;
    attemptSearchMessages: (text: string) => void;
    removeSearchedMessages: () => void;
    searchedMessages: any;
}

export default class SearchChatMessages extends React.Component<ISearchChatMessagesProps, ISearchChatMessagesState> {

    constructor(props: any) {
        super(props);
        this.state = {
            keyword: "",
        }
    }

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps: ISearchChatMessagesProps, nextState: ISearchChatMessagesState): boolean {
        const {searchedMessages} = this.props;
        if (nextProps.searchedMessages && !nextProps.searchedMessages.equals(searchedMessages)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: ISearchChatMessagesProps, prevState: ISearchChatMessagesState): void {
        const {attemptSearchMessages, searchedMessages, removeSearchedMessages} = this.props;
        const {keyword} = this.state;

        if (prevState.keyword !== keyword && keyword !== "") {
            attemptSearchMessages(keyword);
        }

        if (prevState.keyword !== keyword && keyword === "") {
            removeSearchedMessages();
        }
    }

    componentWillUnmount(): void {

    }

    handleSearchMessagesToggle = () => {
        const {toggleSearchMessages} = this.props;
        toggleSearchMessages(false);
    };

    handleSearchMessagesInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;

        if (value !== keyword) {
            this.setState({keyword: value.toLowerCase()});
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchMessagesInput") as HTMLInputElement).value = "";
    };


    render(): JSX.Element {
        const {keyword} = this.state;
        const {searchedMessages} = this.props;
        const noSearchedMessages = searchedMessages.isEmpty();
        const messagesSize = !noSearchedMessages && searchedMessages.size;
        const searchClearButton: boolean = keyword && keyword !== "";

        return (
            <div className="search-messages">
                <div className="search-messages-content">
                    <div className="search-input-block">
                        <div className="search_input">
                            <input
                                onChange={this.handleSearchMessagesInputChange}
                                placeholder="Search messages in this chat"
                                data-field="contactName"
                                className={searchClearButton ? "search-messages-input no-border-right" : "search-messages-input"}
                                name="firstName"
                                type="text"
                                id="searchMessagesInput"
                            />
                            {searchClearButton && <button className="clear-search" onClick={this.handleSearchClear}/>}
                        </div>
                        {searchClearButton &&
                            <div className="search-result">
                                {
                                    noSearchedMessages ? <span className="result-text-info">No Results</span>
                                        : <span className="result-text-info">{`0 / ${messagesSize}`}</span>
                                }
                                <div className="buttons-block">
                                    <span className={noSearchedMessages ? "up-arrow disable-arrow" : "up-arrow"}/>
                                    <span className={noSearchedMessages ? "down-arrow disable-arrow" : "down-arrow"}/>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="search-buttons-block">
                        <button className="search-button user-button"/>
                        <button className="search-button calendar-button"/>
                        <button className="search-button close-button" onClick={this.handleSearchMessagesToggle}/>
                    </div>
                </div>
            </div>
        );
    }
}

