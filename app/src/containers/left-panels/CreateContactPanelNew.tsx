"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {
    attemptChangeLeftPanel,
    removeCreateContactNumber,
    removeOldCreateContactNumber,
    toggleProfilePopUp
} from "modules/application/ApplicationActions";
import {userCheck} from "requests/profileRequest";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import ContactFormNew from "components/contacts/ContactFormNew";
import {ADD_CONTACT_TYPE, CONTACT_NUMBER_MAX_LENGTH} from "configs/constants";
import selector, {IStoreProps} from "services/selector";
import {validateNumber} from "helpers/DataHelper";

import "scss/pages/left-panel/AddNewContact";
import Log from "modules/messages/Log";

interface ICreateContactPanelNewState {
    phone: string;
    referenceNode: any;
    firstName: string;
    lastName: string;
    error: any;
    email: string
}

interface ICreateContactPanelNewPassedProps {
    handleCreateContactClose: () => void,
    createContactPopUp: boolean,
}

interface ICreateContactPanelNewProps extends IStoreProps, ICreateContactPanelNewPassedProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: number | string, saved: boolean, setThreadId: boolean, type: number, email: string) => void,
    changeLeftPanel: (panel: string) => void,
    removeOldCreateContactNumber: () => void,
    removeCreateContactNumber: () => void,
    toggleProfilePopUp: () => void
}

const selectorVariables: any = {
    newMessagesCount: true,
    application: {
        app: true
    },
    selectedThreadId: true,
    selectedThread: true,
    contacts: {
        standardContacts: true,
        contacts: true
    },
    user: {
        user: true
    }
};

class CreateContactPanelNew extends React.Component<ICreateContactPanelNewProps, ICreateContactPanelNewState> {

    constructor(props: any) {
        super(props);
        const {app} = this.props;
        this.state = {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            error: {
                firstName: false,
                phone: false,
                email: false
            },
            referenceNode: {},
        };
    }


    shouldComponentUpdate(nextProps: ICreateContactPanelNewProps, nextState: ICreateContactPanelNewState): boolean {
        return !isEqual(this.state, nextState) ||
            this.props.newMessagesCount !== nextProps.newMessagesCount ||
            !this.props.standardContacts.equals(nextProps.standardContacts) ||
            this.props.app !== nextProps.app;
    }

    componentDidUpdate(prevProps: any): void {
        const {selectedThreadId} = this.props;
        /*if (selectedThreadId && selectedThreadId !== prevProps.selectedThreadId) {
            this.changePanel(LEFT_PANELS.contacts);
        }*/
    }

    componentDidMount(): void {
        document.addEventListener("click", this.handleOutSideClick);
        document.addEventListener("keyup", this.handleEscapePress);

    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
        document.removeEventListener("keyup", this.handleEscapePress);
    }

    setReferenceNode = (node) => {
        this.setState({referenceNode: node});
    };

    handleOutSideClick = (event: any): void => {
        const {referenceNode} = this.state;
        const {handleCreateContactClose, createContactPopUp} = this.props;

        if (createContactPopUp && referenceNode && event.target.id !== "contact-form-btn" && !referenceNode.contains(event.target)) {
            handleCreateContactClose();
        }

    };

    handleEscapePress = (event: any): void => {
        if (event.key === "Escape") {
            this.props.handleCreateContactClose();
        }
    };

    onInputChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        const newState: ICreateContactPanelNewState = {...this.state};

        if (name === "phone") {
            const regExpression = /^\+?\d{0,23}$/;

            if (regExpression.test(value)) {
                newState[name] = value;
                newState.error[name] = false;
                this.setState(newState);
            }

        } else {
            newState[name] = value;
            newState.error[name] = false;
            this.setState(newState);
        }

        // if (name === "firstName") {
        //     newState.error.firstName = false;
        // } else if (name === "phone") {
        //     newState.error.phone = false;
        // } else if (name === "email") {
        //     newState.error.email = value === "" ? false : !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
        // }
    };

    handleMobileNumberPast = (e: any): void => {
        e.preventDefault();
        const currentPosition: number = e.target.selectionStart;
        const clipboardData = e.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: ICreateContactPanelNewState = {...this.state};

            const phoneNumber: string = newState.phone.slice(0, currentPosition) + filteredNumbers.join("") + newState.phone.slice(currentPosition);

            newState.phone = phoneNumber.slice(0, CONTACT_NUMBER_MAX_LENGTH);
            newState.error.phone = false;

            this.setState(newState);
        }
    };

    get headerLeftButton(): any {
        const {toggleProfilePopUp} = this.props;

        return {
            style: {},
            className: "user_icon",
            onClick: toggleProfilePopUp
        };
    }

    get addContactBack(): any {
        const {app} = this.props;

        return {
            className: "left_btn",
            onClick: () => this.changePanel(app.previousLeftPanel)
        }
    }

    changePanel = (panel: string) => {
        const {app, changeLeftPanel, removeOldCreateContactNumber} = this.props;

        if (panel !== app.leftPanel) {
            if (panel !== app.previousLeftPanel && app.oldCreateContactNumber) {
                removeOldCreateContactNumber();
            }
            changeLeftPanel(panel);
        }
    };

    clearNumber = () => {
        this.setState({phone: ""});
    };

    createContact = (): void => {

        const {firstName, lastName, phone, email} = this.state;
        const {user, selectedThread, attemptCreateContact, handleCreateContactClose} = this.props;
        const isEmail = !!user.get("email");
        const contactNumber: any = validateNumber(phone.toString(), user.get("phone"), isEmail);
        if (!firstName && lastName.length > 0) {
            const error = {...this.state.error, firstName: true};
            this.setState({error});
            return;
        }
        if (phone && !contactNumber) {
            const error = {...this.state.error};
            error.phone = true;
            this.setState({error});
            return;
        }

        if (!phone && !email) {
            const error = {
                phone: true,
                email: true,
                firstName: false
            };
            this.setState({error});
            return;
        }

        // if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        //     userCheck([],[email]).then((res) => [
        //         console.log(res)
        //     ]);
        //     const error = {...this.state.error};
        //     error.email = true;
        //     this.setState({error});
        //     return;
        // }

        if (phone) {
            const id: string = `${contactNumber.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`;
            if (id !== user.get("id")) {
                attemptCreateContact(id, firstName, lastName, user.get("username"), contactNumber.fullNumber, true, true, ADD_CONTACT_TYPE.addContactPanel, email);
                handleCreateContactClose();
            } else {
                const error = {
                    phone: true,
                    email: true,
                    firstName: true
                };
                this.setState({error});
            }
        } else if (email) {
            userCheck([], [email]).then(({data: {body}}) => {
                if (body[0]["registered"]) {
                    attemptCreateContact(null, firstName, lastName, user.get("username"), null, true, true, ADD_CONTACT_TYPE.addContactPanel, email);
                    handleCreateContactClose();
                } else {
                    const error = {...this.state.error};
                    error.email = true;
                    this.setState({error});
                }
            }).catch((e) => {
                Log.i(e);
                const error = {...this.state.error};
                error.email = true;
                this.setState({error});
            });
        } else {
            const error = {
                phone: true,
                email: true,
                firstName: true
            };
            this.setState({error});
        }
    };

    render(): JSX.Element {
        const {app, newMessagesCount, handleCreateContactClose} = this.props;
        const {phone, firstName, lastName, error, email} = this.state;

        return (
            <div className="contact-form" id="contact-form-id" ref={this.setReferenceNode}>
                <ContactFormNew
                    handleCreateContactClose={handleCreateContactClose}
                    handleMobileNumberPast={this.handleMobileNumberPast}
                    onInputChange={this.onInputChange}
                    createContact={this.createContact}
                    clearNumber={this.clearNumber}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    email={email}
                    leftButton={this.addContactBack}
                    error={error}
                />
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, false, email)),
    removeOldCreateContactNumber: () => dispatch(removeOldCreateContactNumber()),
    removeCreateContactNumber: () => dispatch(removeCreateContactNumber()),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp())
});

export default connect<{}, {}, ICreateContactPanelNewPassedProps>(mapStateToProps, mapDispatchToProps)(CreateContactPanelNew);
