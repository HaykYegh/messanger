import * as React from "react";
import {connect} from "react-redux";
import {messageModalSelector} from "modules/application/ApplicationSelector";
import {MessageModalContent} from "components/messages/style";
import {Map} from "immutable";

interface IMessageModalProps {
    modal?: Map<string, any>;
    children?: React.ReactNode;
    render?: (modal: any) => React.ReactNode;
}

interface IMessageModalState {
    scrollPosition: { top?: number | null, left?: number | null };
    modalPosition: { top?: number | null, left?: number | null };
}

class MessageModal extends React.Component<IMessageModalProps, IMessageModalState> {
    private isActiveScrollEventListener = false;

    constructor(props) {
        super(props);

        this.state = {
            scrollPosition: {
                top: null,
                left: null,
            },
            modalPosition: {
                top: null,
                left: null,
            },
        };
    }

    get chatDOMElement(): HTMLElement {
        return document.getElementById("chatBackground");
    }

    componentDidUpdate(prevProps: Readonly<IMessageModalProps>, prevState: Readonly<IMessageModalState>) {
        if (this.props.modal.get("isOpen") && (this.props.modal.get("isOpen") !== prevProps.modal.get("isOpen"))) {
            this.chatDOMElement.addEventListener("scroll", this.handleDocumentScroll, true);
        }
    }

    componentWillUnmount(): void {
        if (this.isActiveScrollEventListener) {
            this.chatDOMElement.removeEventListener("scroll", this.handleDocumentScroll);
        }
    }

    componentWillReceiveProps(nextProps: Readonly<IMessageModalProps>) {
        if (this.props.modal.get("isOpen") !== nextProps.modal.get("isOpen")) {
            this.setState((state, props) => {
                state.scrollPosition.top = this.chatDOMElement.scrollTop;
                state.modalPosition.top = props.modal.getIn(["coords", "top"]) +
                    (state.scrollPosition.top - this.chatDOMElement.scrollTop);
                state.modalPosition.left = props.modal.getIn(["coords", "left"]);

                return state;
            });
        }
    }

    handleDocumentScroll = (): void => {
        this.setState((state, props) => {
            state.modalPosition.top = props.modal.getIn(["coords", "top"]) +
                (state.scrollPosition.top - this.chatDOMElement.scrollTop);
            state.modalPosition.left = props.modal.getIn(["coords", "left"]);

            return state;
        });

        this.isActiveScrollEventListener = true;
    }

    prepareRenderData(): object {
        const {modal} = this.props;

        const top = modal.getIn(["coords", "top"]);
        const left = modal.getIn(["coords", "left"]);
        const isOpen = modal.get("isOpen");
        const callbacks = modal.get("callbacks").toObject();

        return {top, left, isOpen, ...callbacks};
    }

    render(): JSX.Element {
        const {modalPosition} = this.state;
        const {children, render, modal} = this.props;

        if (!modal.get("isOpen")) {
            return null;
        }

        return (
            <MessageModalContent top={modalPosition.top} left={modalPosition.left}>
                {render && render(this.prepareRenderData())}

                {children}
            </MessageModalContent>
        );
    }
}

const mapStateToProps: any = () => (state, props) => {
    const modal = messageModalSelector();

    return {
        modal: modal(state, props),
    };
};

export default connect<{}, {}, IMessageModalProps>(mapStateToProps, null)(MessageModal);
