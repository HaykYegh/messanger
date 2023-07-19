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
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import FooterNavBar from "components/common/FooterNavBar";
import ContactForm from "components/contacts/ContactForm";
import selector, {IStoreProps} from "services/selector";
import {ADD_CONTACT_TYPE, LEFT_PANELS} from "configs/constants";
import "scss/pages/left-panel/AddNewContact";

import {validateNumber} from "helpers/DataHelper";

interface ICreateContactPanelState {
    phone: number | string;
    firstName: string;
    lastName: string;
    error: boolean
}

interface ICreateContactPanelProps extends IStoreProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: number | string, saved: boolean, setThreadId: boolean, type: number) => void,
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

class CreateContactPanel extends React.Component<ICreateContactPanelProps, ICreateContactPanelState> {

    constructor(props: any) {
        super(props);
        const {app} = this.props;
        this.state = {
            firstName: "",
            lastName: "",
            phone: app.createContactNumber,
            error: false
        };
    }


    shouldComponentUpdate(nextProps: ICreateContactPanelProps, nextState: ICreateContactPanelState): boolean {
        return !isEqual(this.state, nextState) ||
            this.props.newMessagesCount !== nextProps.newMessagesCount ||
            !this.props.standardContacts.equals(nextProps.standardContacts) ||
            this.props.app !== nextProps.app;
    }

    componentDidUpdate(prevProps: any): void {
        const {selectedThreadId} = this.props;
        if (selectedThreadId && selectedThreadId !== prevProps.selectedThreadId) {
            this.changePanel(LEFT_PANELS.contacts);
        }
    }

    onInputChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        const newState: any = {...this.state};
        newState[name] = value;
        newState.error = false;
        this.setState(newState);
    };

    onInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if ((event.which < 48 || event.which > 57) && event.which !== 43 && event.which !== 42 && event.which !== 35) {
            event.preventDefault();
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

        const {firstName, lastName, phone} = this.state;
        const {user, selectedThread, attemptCreateContact} = this.props;
        const contactNumber: any = validateNumber(phone.toString(), user.get("phone"));
        if (!firstName && lastName.length > 0) {
            this.setState({error: true});
            return;
        }
        if (!contactNumber) {
            this.setState({error: true});
            return;
        }

        const id: string = `${contactNumber.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`;
        if ( id !== user.get('id')) {
            attemptCreateContact(id, firstName, lastName, user.get("username"), contactNumber.fullNumber, true, true, ADD_CONTACT_TYPE.addContactPanel);
            this.changePanel(LEFT_PANELS.contacts);
        } else {
            this.setState({error: true});
        }
    };

    render(): JSX.Element {
        const {app, newMessagesCount} = this.props;
        const {phone, firstName, lastName, error} = this.state;

        return (
            <div className="left_side">
                <ContactForm
                    onInputKeyPress={this.onInputKeyPress}
                    onInputChange={this.onInputChange}
                    createContact={this.createContact}
                    clearNumber={this.clearNumber}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    leftButton={this.addContactBack}
                    error={error}
                />
                <FooterNavBar selected={app.leftPanel} changePanel={this.changePanel}
                              newMessagesCount={newMessagesCount}/>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type)),
    removeOldCreateContactNumber: () => dispatch(removeOldCreateContactNumber()),
    removeCreateContactNumber: () => dispatch(removeCreateContactNumber()),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp())
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateContactPanel);
