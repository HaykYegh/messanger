import * as React from "react";
import {PROJECT_COLORS} from "configs/constants";
import Log from "modules/messages/Log";
import {ChatSvgContent} from "./style";

interface IChatSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
    unreadMessagesCount?: number;
}

interface IChatSvgState {
    isHovered: boolean;
}

class ChatSvg extends React.Component<IChatSvgProps, IChatSvgState> {

    public static defaultProps: IChatSvgProps = {
        color: "#6C6F82",
        activeColor: PROJECT_COLORS.PRIMARY,
        hoverColor: PROJECT_COLORS.PRIMARY,
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

    handleMouseEnter = (): void => {
        if (this.props.hoverColor) {
            this.setState({isHovered: true});
        }
    };

    handleMouseLeave = (): void => {
        if (this.props.hoverColor) {
            this.setState({isHovered: false});
        }
    };

    render(): JSX.Element {
        const {unreadMessagesCount} = this.props;

        return (
            <ChatSvgContent
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                unreadMessagesCount={unreadMessagesCount}
            >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0)">
                        <path
                            d="M24.739 16.5676C24.7394 16.9031 24.715 17.2382 24.6661 17.57C24.4397 18.7731 23.9283 19.9036 23.1754 20.8655C22.4224 21.8274 21.4501 22.5925 20.3407 23.0959C19.5408 23.4952 18.6906 23.7831 17.8135 23.9517C17.1727 24.0744 16.5218 24.1358 15.8695 24.1351C14.5182 24.1453 13.1789 23.8791 11.9329 23.3526C11.3497 23.4504 10.7179 23.5727 10.2441 23.7072C9.77021 23.8417 9.44216 23.9517 9.02905 24.0984L8.3122 24.3918C8.23303 24.4163 8.14837 24.4163 8.0692 24.3918C7.98523 24.3795 7.90577 24.3459 7.83835 24.294C7.76793 24.2401 7.72022 24.1616 7.7047 24.0739C7.68034 23.9943 7.68034 23.9091 7.7047 23.8294L8.3122 21.5677L8.51875 20.7975C7.54843 19.6028 7.01262 18.1105 7 16.5676C7 12.3987 10.9731 9.00006 15.8695 9.00006C17.7468 8.98614 19.5889 9.51209 21.1791 10.516C22.6166 11.3933 23.7236 12.7264 24.3259 14.3059C24.5984 15.0285 24.7383 15.7947 24.739 16.5676V16.5676Z"
                            fill={this.color}/>
                        <path
                            d="M29.429 25.8099C29.4472 25.8738 29.4472 25.9416 29.429 26.0055C29.4042 26.0693 29.367 26.1275 29.3196 26.1767C29.2686 26.2207 29.2045 26.2465 29.1374 26.25C29.0738 26.2677 29.0066 26.2677 28.943 26.25C28.4597 26.0419 27.9647 25.8623 27.4607 25.7121C27.084 25.6143 26.598 25.5165 26.1363 25.4309C25.0927 25.8736 23.9667 26.0852 22.8346 26.0515C21.7026 26.0177 20.591 25.7394 19.5753 25.2353L19.4416 25.1497C19.3795 25.0788 19.3449 24.9876 19.3444 24.893C19.3432 24.8206 19.3634 24.7494 19.4023 24.6885C19.4412 24.6276 19.4972 24.5796 19.5631 24.5507C20.2695 24.381 20.9543 24.1308 21.6043 23.8049C22.7137 23.3016 23.686 22.5365 24.439 21.5745C25.192 20.6126 25.7033 19.4822 25.9298 18.2791C25.9787 17.9472 26.003 17.6121 26.0027 17.2766C26.0005 16.6169 25.8981 15.9613 25.6989 15.3328C25.692 15.3005 25.692 15.2672 25.6989 15.235V15.235C25.6989 15.1377 25.7373 15.0444 25.8057 14.9756C25.874 14.9068 25.9667 14.8682 26.0634 14.8682H26.1242H26.2457C27.3134 15.2744 28.2382 15.9888 28.9039 16.9219C29.5697 17.8549 29.9468 18.965 29.9879 20.1129C29.9815 21.3301 29.5516 22.5067 28.7729 23.4382L28.943 24.0372L29.429 25.8099Z"
                            fill={this.color}/>
                    </g>
                    <defs>
                        <clipPath id="clip0">
                            <rect width="23" height="17.25" fill="white" transform="translate(7 9)"/>
                        </clipPath>
                    </defs>
                </svg>
            </ChatSvgContent>
        );
    }
}

export default ChatSvg;
