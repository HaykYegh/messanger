"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import {connect} from "react-redux";
import {Scrollbars} from 'react-custom-scrollbars';

import {attemptSetGifMessages, attemptShowMoreGifMessages} from "modules/application/ApplicationActions";
import selector, {IStoreProps} from "services/selector";
import {GIF_SEARCH_LIMIT} from "configs/constants";
import components from "configs/localization";
import Log from "modules/messages/Log";
import PreviewGifImage from "components/stickers/PreviewGifImage";

interface IGifState {
    searchWord: string,
    isGifMessagesLoading: boolean,
}

interface IGifPassedProps {
    handleGifSend: (url: string, id: string, options?: any) => void;
    display?: string;
}

interface IGifProps extends IStoreProps, IGifPassedProps {
    attemptSetGifMessages: (keyword: string) => void;
    attemptShowMoreGifMessages: (keyword: string) => void;
    selectedThreadId: string;
}

const selectorParams: any = {
    selectedThreadId: true,
    selectedThread: true,
    gifMessages: true,
    gifMessagesCount: true,
    user: true,
    application: {
        app: true
    },
    settings: {
        languages: true,
    },
};


class Gifs extends React.Component<IGifProps, IGifState> {

    constructor(props: any) {
        super(props);
        this.state = {
            searchWord: "",
            isGifMessagesLoading: false,
        };
    }

    componentDidMount() {
        const {attemptSetGifMessages} = this.props;
        attemptSetGifMessages("");
    }

    shouldComponentUpdate(nextProps: IGifProps, nextState: IGifState): boolean {
        if (this.props.app.gifsLoading !== nextProps.app.gifsLoading || this.props.app.showMoreGifLoading !== nextProps.app.showMoreGifLoading) {
            return true;
        }

        if (!isEqual(nextProps.gifMessagesCount, this.props.gifMessagesCount)) {
            return true;
        }

        if (!nextProps.gifMessages.equals(this.props.gifMessages)) {
            return true;
        }

        if (nextProps.selectedThreadId !== this.props.selectedThreadId) {
            // this.handleSearchClear();
            return true
        }

        if (nextProps.display !== this.props.display) {
            // this.handleSearchClear();
            return true
        }

        if (this.props.languages.get("selectedLanguage") !== nextProps.languages.get("selectedLanguage")) {
            return true
        }
        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IGifProps, prevState: IGifState): void {
        const {gifMessages, attemptSetGifMessages} = this.props;

        /*if (!prevProps.gifMessages.equals(gifMessages)) {
            console.log(gifMessages);
        }*/

        if (prevState.searchWord !== this.state.searchWord) {
            attemptSetGifMessages(this.state.searchWord.trim());
        }

        if (this.state.isGifMessagesLoading && !prevProps.gifMessages.equals(gifMessages)) {
            this.setState({
                isGifMessagesLoading: false
            });
        }
    }

    handleGifSearchChange = (event: any): void => {
        const {searchWord} = this.state;
        if (searchWord !== event.target.value.trim()) {
            this.setState({searchWord: event.target.value.trim()});
        }
    };

    handleGifScrollBarScroll = (event): void => {
        const {searchWord} = this.state;
        const {attemptShowMoreGifMessages, gifMessagesCount} = this.props;
        const element: any = event.target;
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            const gifMessageCount: number = !gifMessagesCount.isEmpty() ? gifMessagesCount.get("count") : 25;
            if (gifMessageCount >= GIF_SEARCH_LIMIT) {

                if (!this.state.isGifMessagesLoading && navigator.onLine) {
                    this.setState({
                        isGifMessagesLoading: true,
                    });
                    attemptShowMoreGifMessages(searchWord);
                }
            }
        }
    };

    handleSearchClear = (): void => {
        this.setState({searchWord: ""});
        (document.getElementById("search_gif") as HTMLInputElement).value = "";
    };

    render() {
        const {app, gifMessages, handleGifSend, display} = this.props;
        const {searchWord} = this.state;
        const searchClearButton: boolean = searchWord && searchWord !== "";
        const localization: any = components().searchInput;

        return (
            <div style={{
                display
            }} className="gif-block">
                <div className="gif-search">
                    <span className="search_input">
                        <input id="search_gif" type="text" autoComplete="off" placeholder={localization.gifPlaceholder} autoFocus={true}
                               onKeyUp={this.handleGifSearchChange}/>
                        {searchClearButton && <button className="clear-search" onClick={this.handleSearchClear}/>}
                    </span>
                </div>
                <div className="gif-content">
                    {
                        app.gifsLoading ? <div className="loader">
                                <div className="circular-loader">
                                    <div className="loader-stroke">
                                        <div className="loader-stroke-left"/>
                                        <div className="loader-stroke-right"/>
                                    </div>
                                </div>
                            </div> :
                            <Scrollbars onScroll={this.handleGifScrollBarScroll} className="gifs-scroll" autoHide
                                        autoHideTimeout={2000} autoHideDuration={1000}>
                                <div className="gifs">
                                    {gifMessages && gifMessages.valueSeq().map(gif => {
                                        if((window as any).isRefactor){
                                            const url: string = gif.getIn(["preview", "url"]);
                                            let previewWidth: number = gif.getIn(["preview", "width"]);
                                            let previewHeight: number = (gif.getIn(["preview", "height"]) / previewWidth) * 281;

                                            if (previewWidth > 336) {
                                                previewWidth = 336;
                                                previewHeight = previewHeight * (336 / previewWidth);
                                            }
                                            // const gifSize: any = {
                                            //     height: `${previewHeight}px`,
                                            //     width: "100%"
                                            // };

                                            const gifSize: any = {
                                                height: `${previewHeight}px`,
                                                width: `${previewWidth}px`,
                                            };
                                            const id = gif.get("id");

                                            let width: number = +gif.getIn(["original", "width"]);
                                            let height: number = +gif.getIn(["original", "height"]);
                                            if (width > 400) {
                                                width = 400;
                                                height = height * (400 / width);
                                            }

                                            const sendGif: any = () => {
                                                handleGifSend(url, id, {width, height})
                                            };

                                            return (
                                                <div
                                                    key={id}
                                                    className="image-gif-block"
                                                >
                                                    <img
                                                        id={id}
                                                        className="searched-gif"
                                                        src={url}
                                                        alt=""
                                                        style={gifSize}
                                                        onClick={sendGif}
                                                    />
                                                </div>
                                            )
                                        } else {
                                            const originalUrl: string = gif.getIn(["original", "url"]);
                                            const previewUrl: string = gif.getIn(["original", "url"]);
                                            let originalWidth: number = gif.getIn(["original", "width"]);
                                            let originalHeight: number = gif.getIn(["original", "height"]);
                                            const gifHeight: number = (originalHeight / originalWidth) * 281;
                                            // if (originalWidth > 336) {
                                                originalHeight = originalHeight * (336 / originalWidth);
                                                originalWidth = 336;
                                            // }
                                            // const gifSize: any = {
                                            //     height: `${gifHeight}px`,
                                            //     width: "100%"
                                            // };

                                            const gifSize: any = {
                                                height: `${originalHeight}px`,
                                                width: `${originalWidth}px`,
                                            };
                                            const id = gif.get("id");

                                            let width: number = +gif.getIn(["original", "width"]);
                                            let height: number = +gif.getIn(["original", "height"]);
                                            if (width > 400) {
                                                width = 400;
                                                height = height * (400 / width);
                                            }


                                            const sendGif: any = () => {
                                                handleGifSend(originalUrl, id, {width, height})
                                            };

                                            return (
                                                <div
                                                    key={id}
                                                    className="image-gif-block"
                                                >
                                                    <PreviewGifImage
                                                        id={id}
                                                        originalUrl={originalUrl}
                                                        previewUrl={previewUrl}
                                                        gifSize={gifSize}
                                                        sendGif={sendGif}
                                                    />
                                                    {/*<img*/}
                                                    {/*    id={id}*/}
                                                    {/*    className="searched-gif"*/}
                                                    {/*    src={originalUrl}*/}
                                                    {/*    alt=""*/}
                                                    {/*    style={gifSize}*/}
                                                    {/*    onClick={sendGif}*/}
                                                    {/*/>*/}
                                                </div>
                                            )
                                        }
                                    })}
                                </div>
                                {app.showMoreGifLoading &&
                                <div className="show-more-loader">
                                    <div className="sticker-loader"/>
                                </div>
                                }
                            </Scrollbars>
                    }
                </div>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorParams);
const mapDispatchToProps: any = dispatch => ({
    attemptSetGifMessages: (keyword) => dispatch(attemptSetGifMessages(keyword)),
    attemptShowMoreGifMessages: (keyword) => dispatch(attemptShowMoreGifMessages(keyword))
});
export default connect<{}, {}, IGifPassedProps>(mapStateToProps, mapDispatchToProps)(Gifs);
