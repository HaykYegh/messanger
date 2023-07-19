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
                    <g id="Type=info topbar">
                        <rect id="Rectangle" width="36" height="36" fill="#FF0000" fillOpacity="0.01"/>
                        <g id="info">
                            <g id="Group 19">
                                <path id="Subtract" fillRule="evenodd" clipRule="evenodd"
                                      d="M18.1818 8C12.5615 8 8 12.5615 8 18.1818C8 23.8022 12.5615 28.3636 18.1818 28.3636C23.8022 28.3636 28.3636 23.8022 28.3636 18.1818C28.3636 12.5615 23.8022 8 18.1818 8ZM18.0454 11.1818C18.8734 11.1818 19.5454 11.8538 19.5454 12.6818C19.5454 13.5096 18.8734 14.1818 18.0454 14.1818C17.2174 14.1818 16.5454 13.5096 16.5454 12.6818C16.5454 11.8538 17.2174 11.1818 18.0454 11.1818ZM19.5454 23.1818V15.1818H16.5454V16.6818H17.0454V23.1818H16.5454V24.6818H20.0454V23.1818H19.5454Z"
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
