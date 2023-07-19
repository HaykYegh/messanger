"use strict";

import * as React from "react";
import {ESC_KEY_CODE} from "configs/constants";

interface IMapPopUpProps {
    onMediaKeyDown: (event: any) => void;
    closePopUp: () => void;
    location: string;
    lat: number;
    lng: number;
}

export default class MapPopUp extends React.Component<IMapPopUpProps, undefined> {

    marker: any;
    map: any;

    constructor(props: IMapPopUpProps) {
        super(props);
    }

    componentDidMount(): void {
        const {lat, lng} = this.props;

        document.addEventListener("keydown",  this.handleEscPress);

        this.map = new (window as any).google.maps.Map(this.map, {
            center: {lat, lng},
            zoom: 14
        });

        this.marker = new (window as any).google.maps.Marker({
            position: {lat, lng},
            map: this.map
        });
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown",  this.handleEscPress);
    }

    handleEscPress = (event: any) => {
        const {closePopUp} = this.props;
        if (event.keyCode === ESC_KEY_CODE) {
            closePopUp();
        }
    };

    shouldComponentUpdate(): boolean {
        return false;
    }

    render(): JSX.Element {
        const {closePopUp, onMediaKeyDown, location} = this.props;

        const closePopUpOutside: any = (event: any) => {
            if (event.target.id === "map-popup") {
                closePopUp();
            }
            return;
        };

        return (
            <div className="media-popup show" onKeyDown={onMediaKeyDown} tabIndex={0}>
                <div className="media-popup-content" id="map-popup" onClick={closePopUpOutside}>
                    <div className="header-popup right_side_header">
                        <div className="chat_status_wrapper">
                            <div className="header_info">
                                <span style={{color: "white"}}>{location}</span>
                            </div>
                        </div>
                    </div>
                    <div className="close_popup">
                        <span onClick={closePopUp} className="close"/>
                    </div>
                    <div className="image_block" style={{width: "100%", height: "100%",  maxWidth: "65%", maxHeight: "65%"}}>
                        <div style={{width: "100%", height: "100%"}} ref={ref => this.map = ref}/>
                    </div>
                </div>
            </div>
        );
    }
};
