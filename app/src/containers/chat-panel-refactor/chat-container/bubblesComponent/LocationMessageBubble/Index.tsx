"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {MAP_SRC_CREATOR} from "configs/constants";
import {getLocationName} from "requests/locationRequest";
import {
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble
} from "containers/chat-panel-refactor/chat-container/bubblesComponent/style";
import {getMessageTime} from "helpers/DateHelper";

interface ILocationMessageProps {
    toggleMap: (lat: number, lng: number, location: string) => void;
    lat: number;
    lng: number;
    message: any;
}

interface ILocationMessageState {
    height: number;
    width: number;
    location: string;
}

export default class LocationMessage extends React.Component<ILocationMessageProps, ILocationMessageState> {

    constructor(props: any) {
        super(props);

        this.state = {
            height: null,
            width: null,
            location: ""
        };
    }

    async componentDidMount() {
        const {lat, lng} = this.props;
        const location: string = await getLocationName(lat, lng);
        this.setState({location});
    }

    shouldComponentUpdate(nextProps: ILocationMessageProps, nextState: ILocationMessageState): boolean {
        const {lat, lng, message} = this.props;

        if (lat !== nextProps.lat) {
            return true;
        }

        if (lng !== nextProps.lng) {
            return true;
        }

        if (!message.equals(nextProps.message)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    handleImageLoad = ({target: img}: any): void => {
        this.setState({
            height: img.offsetHeight,
            width: img.offsetWidth
        });
    };

    handleLocationClick = (): void => {
        const {location} = this.state;
        const {lat, lng, toggleMap} = this.props;
        toggleMap(lat, lng, location);
    };

    render(): JSX.Element {
        const {lat, lng, message} = this.props;
        const {width, height, location} = this.state;

        const src: string = MAP_SRC_CREATOR(lat, lng);

        const isOwnMessage: boolean = message.get("own");
        const edited: boolean = !!message.get("edited");
        const status: boolean = message.get("status");
        const delivered: boolean = message.get("delivered");
        const seen: boolean = message.get("seen");
        const messageTime: any = message.get("time");

        const isDeliveryWaiting: boolean = isOwnMessage && !status && !delivered && !seen;
        const isSent: boolean = isOwnMessage && status && !delivered && !seen;
        const isDelivered: boolean = isOwnMessage && delivered && !seen;
        const isSeen: boolean = isOwnMessage && seen;
        const time: string = getMessageTime(messageTime);

        return (
            <div onClick={this.handleLocationClick} className="image-block" style={{height: "auto", width: "250px"}}>
                <div className="image location-image">
                    <img
                        src={src}
                        onLoad={this.handleImageLoad}
                        style={width > height ? {height: 100 + "%"} : {width: 100 + "%"}}
                    />
                </div>
                <div className='location-content'>
                    <span className="location-message-text">{location}</span>
                    <TimeBubble
                        isMediaBubble={false}
                        isOwnMessage={isOwnMessage}
                        isLocationBubble={true}
                    >
                        {edited && <EditedMessage/>}
                        <Time>{time}</Time>
                        <StatusMessage
                            isSeen={isSeen}
                            isDelivered={isDelivered}
                            isSent={isSent}/>
                        {isDeliveryWaiting &&
                        <IsDeliveryWaiting isMediaBubble={false}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                </div>
            </div>
        );
    }
}
