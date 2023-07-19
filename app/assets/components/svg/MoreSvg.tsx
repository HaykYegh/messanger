import * as React from "react";

interface IMoreSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
}

interface IMoreSvgState {
    isHovered: boolean;
}

class MoreSvg extends React.Component<IMoreSvgProps, IMoreSvgState> {

    public static defaultProps: IMoreSvgProps = {
        color: "#6C6F82",
        activeColor: "#000000",
        hoverColor: "#4E4F5B",
        active: false,
    };

    constructor(props: any) {
        super(props);

        this.state = {
            isHovered: false,
        };
    }

    get color(): string {
        if (this.state.isHovered) {
            return this.props.hoverColor;
        }

        if (this.props.active) {
            return this.props.activeColor;
        }

        return this.props.color;
    }

    handleMouseMove = (): void => {
        if (this.state.isHovered === false && this.props.hoverColor) {
            this.setState({isHovered: true});
        }
    };

    handleMouseLeave = (): void => {
        if (this.props.hoverColor) {
            this.setState({isHovered: false});
        }
    };

    render(): JSX.Element {
        return (
            <span onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="Type=more topbar">
                        <rect id="Rectangle" width="36" height="36" fill="#FF0000" fillOpacity="0.01"/>
                        <g id="more">
                            <g id="Group 16">
                                <path id="Fill 9" fillRule="evenodd" clipRule="evenodd"
                                      d="M8 17.625C8 16.1763 9.17731 15 10.625 15C12.074 15 13.25 16.1763 13.25 17.625C13.25 19.0737 12.074 20.25 10.625 20.25C9.17731 20.25 8 19.0737 8 17.625Z"
                                      fill={this.color}/>
                                <path id="Fill 10" fillRule="evenodd" clipRule="evenodd"
                                      d="M15.9414 17.625C15.9414 16.1761 17.1178 15 18.5664 15C20.015 15 21.1914 16.1761 21.1914 17.625C21.1914 19.0737 20.015 20.25 18.5664 20.25C17.1178 20.25 15.9414 19.0737 15.9414 17.625Z"
                                      fill={this.color}/>
                                <path id="Fill 11" fillRule="evenodd" clipRule="evenodd"
                                      d="M23.75 17.6226C23.75 16.1752 24.9263 15 26.375 15C27.8237 15 29 16.1752 29 17.6226C29 19.0702 27.8237 20.2454 26.375 20.2454C24.9263 20.2454 23.75 19.0702 23.75 17.6226Z"
                                      fill={this.color}/>
                            </g>
                        </g>
                    </g>
                </svg>
            </span>
        );
    }
}

export default MoreSvg;
