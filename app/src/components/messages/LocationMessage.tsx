"use strict";

import {MAP_SRC_CREATOR, MESSAGE_TYPES, OFFLINE_MESSAGE_BODY} from "configs/constants";
import * as React from "react";
import {isEqual} from "lodash";
import {getLocationName} from "requests/locationRequest";
import {EditedMessage, IsDeliveryWaiting, StatusMessage, Time, TimeBubble} from "components/messages/style";
import Log from "modules/messages/Log";
import IDBMessage from "services/database/class/Message";

interface ILocationMessageProps {
    toggleMap: (lat: number, lng: number, location: string) => void;
    lat: number;
    lng: number;
    message: any;
    updateMessageProperty: (msgId, property, value, updateToDb?: boolean) => void;
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
            location: props.message.get("m_options") && props.message.get("m_options").location || ""
        };
    }

    async componentDidMount() {
        const {lat, lng, updateMessageProperty, message} = this.props;
        if (!message.getIn(["m_options", "location"])) {
            const location: string = await getLocationName(lat, lng);
            updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", {
                location
            }, true);
            IDBMessage.update(message.get("messageId") || message.get("id"), {m_options: {location}})
            this.setState({location});
        }

    }

    shouldComponentUpdate(nextProps: ILocationMessageProps, nextState: ILocationMessageState): boolean {
        const {lat, lng, message} = this.props;

        if(lat !== nextProps.lat) {
            return true;
        }

        if(lng !== nextProps.lng) {
            return true;
        }

        if(!message.equals(nextProps.message)) {
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
        const {lat, lng, toggleMap, message} = this.props;
        toggleMap(lat, lng, location || message.getIn(["m_options", "location"]));
    };

    render(): JSX.Element {
        const {lat, lng, message} = this.props;
        const {width, height, location} = this.state;

        const src: string = MAP_SRC_CREATOR(lat, lng);

        const text = message.get("text") === OFFLINE_MESSAGE_BODY || message.get("text") === "null" ? "" : message.get("text");
        const isDeliveryWaiting: boolean = message.get("own") && !message.get("status") && !message.get("delivered") && !message.get("seen");
        const isSent = message.get("own") && message.get("status") && !message.get("delivered") && !message.get("seen");
        const isDelivered = message.get("own") && message.get("delivered") && !message.get("seen");
        const isSeen = message.get("own") && message.get("seen");
        const imageBubble = [MESSAGE_TYPES.image, MESSAGE_TYPES.location, MESSAGE_TYPES.gif].includes(message.get("type")) && !message.get("deleted") && !text;
        const videoBubble = (message.get("type") === MESSAGE_TYPES.video || message.get("type") === MESSAGE_TYPES.stream_file) && !message.get("deleted") && !text;
        const isMediaBubble = videoBubble || imageBubble;
        const edited = !!message.get("edited");
        const isOwnMessage = message.get("own");

        let time: any = new Date(message.get("time"));
        time = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2);

        return (
            <div onClick={this.handleLocationClick} className="image-block" style={{height: "auto", width:"250px"}}>
                <div className="image location-image">
                    <img src={src} onLoad={this.handleImageLoad}
                         style={width > height ? {height: 100 + "%"} : {width: 100 + "%"}}/>
                </div>
                <div className='location-content'>
                    <span className="location-message-text">{message.getIn(["m_options", "location"]) || location}</span>
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
                        <IsDeliveryWaiting isMediaBubble={isMediaBubble}><span/></IsDeliveryWaiting>}
                    </TimeBubble>
                </div>
            </div>
        );
    }
}
