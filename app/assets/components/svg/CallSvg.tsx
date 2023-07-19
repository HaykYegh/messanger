import * as React from "react";

interface ICallSvgProps {
    color?: string;
    hoverColor?: string;
    activeColor?: string;
    active?: boolean;
    containerWidth?: string,
    containerHeight?: string,
}

interface ICallSvgState {
    isHovered: boolean;
}

class CallSvg extends React.Component<ICallSvgProps, ICallSvgState> {

    public static defaultProps: ICallSvgProps = {
        color: "#6C6F82",
        activeColor: "#000000",
        hoverColor: "#4E4F5B",
        active: false,
        containerWidth: "36",
        containerHeight: "36",
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
        const {containerWidth, containerHeight} = this.props;

        return (
            <span onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                <svg width={containerWidth} height={containerHeight} viewBox="0 0 36 36" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M26.2558 25.4549C26.1822 25.7731 26.041 26.0717 25.8417 26.3304C25.6425 26.5892 25.3898 26.802 25.101 26.9544C24.0627 27.6458 22.8407 28.0091 21.5934 27.9972C21.5934 27.9972 20.0507 28.1351 18.1461 26.4632C16.3778 24.7589 14.7601 22.9048 13.3113 20.9217L13.251 20.8355C11.8213 18.8207 10.5671 16.6871 9.50204 14.458C8.59713 12.0277 9.19178 10.5798 9.19178 10.5798C9.58658 9.39743 10.3284 8.36133 11.3205 7.60656C11.5636 7.37848 11.8545 7.20752 12.1721 7.10614C12.4897 7.00476 12.8259 6.97551 13.1562 7.02052C13.3458 7.02052 14.0611 6.88263 15.0522 10.2782C15.2855 10.9886 15.4557 11.7183 15.5606 12.4586C15.5997 12.8054 15.5489 13.1565 15.413 13.478C15.2772 13.7994 15.0609 14.0806 14.785 14.2943L14.1214 14.8976C13.8688 15.0949 13.6852 15.3671 13.597 15.6752C13.5087 15.9833 13.5203 16.3115 13.6302 16.6126C14.653 18.5065 15.9065 20.2665 17.3618 21.8525C17.6029 22.0464 17.8983 22.1606 18.2072 22.1791C18.516 22.1976 18.823 22.1196 19.0855 21.9559V21.9559L19.8784 21.525C20.1685 21.3318 20.5043 21.2181 20.8522 21.1954C21.2 21.1728 21.5478 21.2418 21.8605 21.3957C22.528 21.7325 23.1628 22.1307 23.7566 22.585C26.6954 24.6448 26.2731 25.2308 26.2558 25.4549Z"
                        fill={this.color}/>
                </svg>
            </span>
        );
    }
}

export default CallSvg;
