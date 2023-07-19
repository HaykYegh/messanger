import * as React from "react";

interface IVideoCallSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
    containerWidth: string,
    containerHeight: string,
    className: string,
    styles: any,
}

interface IVideoCallSvgState {
    isHovered: boolean;
}

class VideoCallSvg extends React.Component<IVideoCallSvgProps, IVideoCallSvgState> {

    public static defaultProps: IVideoCallSvgProps = {
        color: "#6C6F82",
        activeColor: "#000000",
        hoverColor: "#4E4F5B",
        active: false,
        containerWidth: "36",
        containerHeight: "36",
        styles: {},
        className: "",
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
        const {containerWidth, containerHeight, className, styles} = this.props;

        return (
            <span className={className} onMouseLeave={this.handleMouseLeave} onMouseMove={this.handleMouseMove} style={styles}>
                <svg width={containerWidth} height={containerHeight} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="Type=video topbar">
                        <rect id="Rectangle" width="36" height="36" fill="#FF0000" fillOpacity="0.01"/>
                        <g id="video">
                            <g id="Group 18">
                                <path id="Fill 1" fillRule="evenodd" clipRule="evenodd"
                                      d="M31 15.0016C31 14.6146 30.7894 14.254 30.4411 14.0445C30.0928 13.8352 29.6545 13.8056 29.2776 13.966C27.9061 14.5499 26.0965 15.3203 25.3475 15.6392C25.1358 15.7293 25 15.9267 25 16.1441C25 17.0774 25 19.5836 25 20.5303C25 20.7554 25.1395 20.96 25.3577 21.0551C26.1101 21.383 27.8994 22.1626 29.2629 22.7568C29.641 22.9215 30.0831 22.8944 30.435 22.6849C30.7869 22.4753 31 22.1123 31 21.7223C31 19.8348 31 16.8806 31 15.0016Z"
                                      fill={this.color}/>
                                <path id="Fill 2" fillRule="evenodd" clipRule="evenodd"
                                      d="M23.1818 13.166C23.1818 11.9705 22.292 11 21.1963 11H7.98548C6.88965 11 6 11.9705 6 13.166V23.5613C6 24.7567 6.88965 25.7273 7.98548 25.7273H21.1963C22.292 25.7273 23.1818 24.7567 23.1818 23.5613V13.166Z"
                                      fill={this.color}/>
                            </g>
                        </g>
                    </g>
                </svg>
            </span>
        );
    }
}

export default VideoCallSvg;
