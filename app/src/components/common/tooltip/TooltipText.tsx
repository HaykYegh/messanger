import * as React from "react";
import {TooltipTextContent} from "components/common/tooltip/style";

interface ITooltipTextProps {
    content?: string;
    styles?: any;
    withDefaultStyles?: boolean;
    className?: string,
}

interface ITooltipTextState {
    //
}

class TooltipText extends React.Component<ITooltipTextProps, ITooltipTextState> {
    public static defaultProps = {
        content: "",
        styles: "",
        withDefaultStyles: true,
        className: "",
    };

    render(): JSX.Element {
        const {children, content, styles, withDefaultStyles, className} = this.props;

        return (
            <TooltipTextContent styles={styles} content={content} default={withDefaultStyles} className={className}>
                <div>{children}</div>
            </TooltipTextContent>
        );
    }
}

export default TooltipText;
