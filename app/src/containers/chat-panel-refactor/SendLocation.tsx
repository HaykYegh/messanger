"use strict";

import * as React from "react";

import {getLocationName} from "requests/locationRequest";
import components from "configs/localization";
import Log from "modules/messages/Log";

interface ISendLocationProps {
    send: (lat: number, lng: number) => void;
    handleMediaKeyDown: (event: any) => void;
    closePopUp: () => void;
    lang: string;
    lat: number;
    lng: number;
}

interface ISendLocationState {
    locationName: string;
}

export default class SendLocation extends React.Component<ISendLocationProps, ISendLocationState> {

    marker: any;
    map: any;
    resetLocation: HTMLElement = null;

    constructor(props: ISendLocationProps) {
        super(props);

        this.state = {
            locationName: ""
        }
    }

    componentDidMount(): void {
        const {lat, lng} = this.props;

        this.handleGetLocationName(lat, lng);


        this.map = new (window as any).google.maps.Map(this.map, {
            center: {lat, lng},
            zoom: 14,
        });

        this.marker = new (window as any).google.maps.Marker({
            position: {lat, lng},
            draggable: true,
            map: this.map
        });

        const showMyLocation = document.createElement('div');
        this.showMyLocation(showMyLocation);

        this.map.controls[(window as any).google.maps.ControlPosition.RIGHT_BOTTOM].push(showMyLocation);

        (window as any).google.maps.event.addListener(this.map, "click", this.handleChangeLocation);

        (window as any).google.maps.event.addListener(this.marker, "dragend", (event: any): void => {
            this.handleGetLocationName(event.latLng.lat(), event.latLng.lng());
        });
    }

    shouldComponentUpdate(nextProps: ISendLocationProps, nextState: ISendLocationState): boolean {
        return nextState.locationName !== this.state.locationName;
    }

    showMyLocation = (locationDiv: HTMLDivElement): void => {

        const locationUI = document.createElement('div');
        locationUI.style.backgroundColor = 'rgba(255,255,255,1)';
        locationUI.style.position = 'relative';
        locationUI.style.borderRadius = '2px';
        locationUI.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
        locationUI.style.width = '40px';
        locationUI.style.height = '40px';
        locationUI.style.right = '10px';
        locationUI.style.overflow = 'hidden';
        locationUI.style.cursor = 'pointer';
        locationUI.style.transition = 'background-color 0.16s ease-out';
        locationDiv.appendChild(locationUI);

        const locationBtn = document.createElement('div');
        locationBtn.id = 'resetLocation';
        locationBtn.style.display = 'block';
        locationBtn.style.height = '18px';
        locationBtn.style.width = '18px';
        locationBtn.style.left = '11px';
        locationBtn.style.top = '11px';
        locationBtn.style.margin = '0';
        locationBtn.style.padding = '0';
        locationBtn.style.position = 'absolute';
        locationBtn.style.backgroundImage = `url(${require("assets/images/show_my_location.png")})`;
        locationBtn.style.backgroundSize = '180px 18px';
        locationUI.appendChild(locationBtn);
        this.resetLocation = locationBtn;

        locationUI.addEventListener('click', this.handleLocationReset);

    };

    handleChangeLocation = (event: any): void => {
        const clickedLocation: any = event.latLng;

        if (!this.marker) {
            this.marker = new (window as any).google.maps.Marker({
                position: clickedLocation,
                draggable: true,
                map: this.map
            });
        } else {
            this.marker.setPosition(clickedLocation);
        }

        this.handleGetLocationName(clickedLocation.lat(), clickedLocation.lng());
        this.resetLocation.style.backgroundPosition = '0 0';
    };

    handleGetLocationName = (lat: any, lng: any): void => {
        (
            async () => {
                const address = await getLocationName(lat, lng);
                this.setState({locationName: address});
            }
        )().catch(err => Log.i(err));
    };

    handleLocationSend = (): void => {
        const {send} = this.props;
        const position: any = this.marker.getPosition();
        send(position.lat(), position.lng());
    };

    handleLocationReset = (): void => {
        const {lat, lng} = this.props;

        this.marker.setPosition({lat, lng});
        this.marker.map.setCenter(this.marker.getPosition());

        this.handleGetLocationName(lat, lng);

        this.resetLocation.style.backgroundPosition = '-144px 0';

    };

    render(): JSX.Element {
        const {locationName} = this.state;
        const {closePopUp, handleMediaKeyDown, lang} = this.props;
        const localization: any = components(true)[lang].locationPicker;

        return (
            <div className="media-popup show" onKeyDown={handleMediaKeyDown} tabIndex={0} id="media-popup">
                <div className="media-popup-content">
                    <div className="header-popup right_side_header">
                        <div className="chat_status_wrapper">
                            <div className="header_info">
                                <span style={{color: "white"}}>{locationName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="close_popup">
                        <span onClick={closePopUp} className="close"/>
                    </div>
                    <div className="image_block"
                         style={{width: "100%", height: "100%", maxWidth: "100%", maxHeight: "calc(100% - 60px)"}}>
                        <div style={{width: "100%", height: "100%"}} ref={ref => this.map = ref}/>
                        <button className="location-send-button"
                                onClick={this.handleLocationSend}>{localization.send}</button>
                    </div>
                </div>
            </div>
        );
    }
};
