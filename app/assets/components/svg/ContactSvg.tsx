import * as React from "react";

interface IContactSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
}

interface IContactSvgState {
    isHovered: boolean;
}

class ContactSvg extends React.Component<IContactSvgProps, IContactSvgState> {

    public static defaultProps: IContactSvgProps = {
        color: "#6C6F82",
        activeColor: "#8174FF",
        hoverColor: "#8174FF",
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
        return (
            <span onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M30 24.2218C30 24.7834 30 25.8494 29.1634 25.8494H16.9824C16.1459 25.8494 16.1459 24.7834 16.1459 24.2218C16.2181 23.326 16.4518 22.4607 16.8301 21.6875C17.2085 20.9142 17.7224 20.2521 18.335 19.7483C19.3485 18.8305 20.5382 18.2439 21.7907 18.0446C22.2131 17.9745 22.6389 17.9395 23.0651 17.9399C27.6779 17.9399 30.0078 21.8899 30 24.2218Z"
                        fill={this.color}/>
                    <path
                        d="M23.0729 16.9208C24.9559 16.9208 26.4824 15.3715 26.4824 13.4604C26.4824 11.5493 24.9559 10 23.0729 10C21.19 10 19.6635 11.5493 19.6635 13.4604C19.6635 15.3715 21.19 16.9208 23.0729 16.9208Z"
                        fill={this.color}/>
                    <path
                        d="M14.4541 24.2218C14.4464 24.4963 14.4661 24.7709 14.5131 25.0404C14.5364 25.1347 14.5401 25.2338 14.524 25.33C14.508 25.4263 14.4725 25.517 14.4203 25.5953C14.3682 25.6735 14.3008 25.7371 14.2234 25.7812C14.146 25.8253 14.0607 25.8486 13.974 25.8494H7.90124C7.00001 25.8494 7 24.7834 7 24.2218C7 21.8899 9.52683 17.94 14.4541 17.94C15.3084 17.9361 16.1589 18.0674 16.9809 18.3302C17.0856 18.3653 17.1791 18.4335 17.2506 18.5267C17.3221 18.6198 17.3685 18.7341 17.3844 18.8561C17.4004 18.9782 17.3851 19.1028 17.3405 19.2153C17.2959 19.3278 17.2237 19.4236 17.1325 19.4914C16.3941 19.9938 15.7682 20.6821 15.3036 21.5025C14.8391 22.323 14.5484 23.2536 14.4541 24.2218V24.2218Z"
                        fill={this.color}/>
                    <path
                        d="M14.5501 16.9208C16.4331 16.9208 17.9595 15.3715 17.9595 13.4604C17.9595 11.5493 16.4331 10 14.5501 10C12.6671 10 11.1407 11.5493 11.1407 13.4604C11.1407 15.3715 12.6671 16.9208 14.5501 16.9208Z"
                        fill={this.color}/>
                </svg>
            </span>
        );
    }
}

export default ContactSvg;
