import * as React from "react";

interface ISearchSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
}

interface ISearchSvgState {
    isHovered: boolean;
}

class SearchSvg extends React.Component<ISearchSvgProps, ISearchSvgState> {

    public static defaultProps: ISearchSvgProps = {
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
                    <g id="Type=search topbar">
                        <rect id="Rectangle" width="36" height="36" fill="#FF0000" fillOpacity="0.01"/>
                        <g id="Search">
                            <g id="Group 17">
                                <path id="Stroke 3" fillRule="evenodd" clipRule="evenodd"
                                      d="M16.7123 9C20.9688 9 24.4245 12.4608 24.4245 16.7237C24.4245 20.9864 20.9688 24.4473 16.7123 24.4473C12.4558 24.4473 9 20.9864 9 16.7237C9 12.4608 12.4558 9 16.7123 9Z"
                                      stroke={this.color} strokeWidth="2.77052" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                                <path id="Stroke 4" d="M22.5176 22.5658L26.9996 27.0083" stroke={this.color}
                                      strokeWidth="2.77052" strokeLinecap="round" strokeLinejoin="round"/>
                            </g>
                        </g>
                    </g>
                </svg>
            </span>
        );
    }
}

export default SearchSvg;
