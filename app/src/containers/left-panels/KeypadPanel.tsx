"use strict";

import * as React from "react";
import {connect} from "react-redux";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import {ADD_CONTACT_TYPE, CONTACT_NUMBER_MAX_LENGTH, KEYPAD, RIGHT_PANELS} from "configs/constants";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import FooterNavBar from "components/common/FooterNavBar";
import selector, {IStoreProps} from "services/selector";
import {validateNumber} from "helpers/DataHelper";
import components from "configs/localization";
import Key from "components/common/Key";
import {Scrollbars} from 'react-custom-scrollbars';

import "scss/pages/left-panel/Keypad";
import PopUpMain from "components/common/PopUpMain";
import {
    attemptChangeLeftPanel,
    attemptSetCreateContactNumber,
    removeCreateContactNumber,
    removeOldCreateContactNumber,
    toggleProfilePopUp
} from "modules/application/ApplicationActions";
import {email} from "configs/configurations";
import {checkNumber} from "helpers/AppHelper";
import {getPhone, phoneMask} from "helpers/UIHelper";
import Log from "modules/messages/Log";

interface IKeypadPanelState {
    phone: string;
    cursorPosition: number;
    error: boolean;
    ownNumber: boolean;
}

interface IKeypadPanelProps extends IStoreProps {
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[], createConversation: any, editableId: any, notSaved: boolean) => void,
    attemptSetCreateContactNumber: (phone: string) => void;
    removeOldCreateContactNumber: () => void;
    changeLeftPanel: (panel: string) => void;
    removeCreateContactNumber: () => void,
    toggleProfilePopUp: () => void;
}

const selectorVariables: any = {
    selectedThreadId: true,
    newMessagesCount: true,
    contacts: true,
    application: {
        app: true
    },
    user: true
};

class KeypadPanel extends React.Component<IKeypadPanelProps, IKeypadPanelState> {

    constructor(props: any) {
        super(props);
        const {app} = this.props;
        this.state = {
            phone: app.createContactNumber ? app.createContactNumber.toString() : "",
            cursorPosition: 0,
            error: false,
            ownNumber: false,
        }
    }

    timeOut: any;
    mounted: boolean;

    handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const startPos = event.currentTarget.selectionStart;
        this.setState({cursorPosition: startPos});

        const value = event.currentTarget.value;
        const {phone} = this.state;



        if (value !== phone) {
            const prevPhone = this.state.phone

            this.setState({phone: phoneMask(getPhone(value.toString())), error: false}, () => {
                console.log("startPos ->", (prevPhone.length - this.state.phone.length) > 1 )
                // this.setCaretPosition(this.state.phone[startPos - 1] === "-" ? startPos + 1 : (prevPhone.length - this.state.phone.length > 1) ? startPos - 1 : startPos);
            });

        }
    };

    handleInputKeyPress = (event: any) => {
        if ((event.which < 48 || event.which > 57) && event.which !== 37 && event.which !== 38 && event.which !== 39 && event.which !== 40 && event.which !== 43 && event.which !== 42 && event.which !== 35) {
            event.preventDefault();
        } else {
            this.highlightKeypadPanel(event.key, 100);
            if(event.which === 48 && event.target.value.length == 0){
                event.preventDefault();
                this.handleKeypadClick(0);
            }
        }
    };

    handleKeypadClick = (key: number) => {
        const {phone, cursorPosition} = this.state;
        let newPhone = "";
        let cursorNewPosition = cursorPosition;
        if((cursorPosition === 0 || cursorPosition === 1) && key === 0 && phone && phone[0] === "0"){
            newPhone = ["+", phone.slice(1)].join('');
        } else {
            newPhone = [phone.slice(0, cursorPosition), key, phone.slice(cursorPosition)].join('');
            const phoneWithMask = phoneMask(getPhone(newPhone))

            if(phoneWithMask[phoneWithMask.length - 2] === "-") {
                cursorNewPosition = cursorNewPosition + 2
            } else {
                cursorNewPosition++;
            }
        }

        this.setState({phone: phoneMask(getPhone(newPhone)), cursorPosition: cursorNewPosition});
        this.setCaretPosition(cursorNewPosition);
    };

    setCaretPosition(cursorPosition){
        const element:any = document.getElementById("number-input");
        setTimeout(() => {
            element.focus();
            element.selectionStart = cursorPosition;
            element.selectionEnd = cursorPosition;
        }, 0)
    }

    handlePanelChange = (panel: string) => {
        const {app, changeLeftPanel} = this.props;

        if (panel !== app.leftPanel) {
            changeLeftPanel(panel);
        }
    };

    handleAddContact = () => {
        const {phone} = this.state;
        const {user, attemptCreateContact, selectedThreadId} = this.props;
        const email = !!user.get("email");
        const checkValue = checkNumber(user.get("phoneCode"), getPhone(phone))
        const contactNumber = validateNumber(checkValue, user.get("phone"), email);

        if (!contactNumber) {
            this.setState({error: true});
            return;
        }

        const id: string = `${contactNumber.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`;

        if (id !== selectedThreadId) {
            if (id === user.get('id')) {
                this.setState({
                    ownNumber: true,
                });
                return;
            }

            const labels = [{value: contactNumber.fullNumber, label: "mobile"}];
            attemptCreateContact(id, '', '', user.get("username"), [contactNumber.fullNumber], false, true, ADD_CONTACT_TYPE.keypadPanel, null, labels, null, null, false);
        }
    };

    handleEnterPress = (event: any) => {
        const {cursorPosition, phone} = this.state;
        if (event.keyCode === 13) {
            event.preventDefault();
            //this.handleContactCreate();
            this.handleAddContact();
        }
        if (cursorPosition >= 0) {
            if (event.keyCode == 37) {
                if (cursorPosition == 0) return;
                this.setState({cursorPosition: cursorPosition - 1})
            }
            if (event.keyCode == 38) {
                this.setState({cursorPosition: 0})
            }
            if (event.keyCode == 39) {
                if (cursorPosition > phone.length - 1) return;
                this.setState({cursorPosition: cursorPosition + 1})
            }
            if (event.keyCode == 40) {
                this.setState({cursorPosition: phone.length})
            }
        }
    };


    handleInputPaste = (e) => {
        const clipboardData = e.clipboardData;
        e.preventDefault();
        let pastedData = clipboardData.getData('Text');
        const filteredNumbers = pastedData && pastedData.match(/([0-9]|[*#+])+/g)
        if (filteredNumbers) {
            let filteredNumbersText = filteredNumbers.join("");
            filteredNumbersText = phoneMask(filteredNumbersText)
            const selectionStart:number = e.currentTarget.selectionStart;
            e.currentTarget.value = e.currentTarget.value.slice(0, e.currentTarget.selectionStart) + filteredNumbersText + e.currentTarget.value.slice(e.currentTarget.selectionEnd);
            this.setCaretPosition(selectionStart + filteredNumbersText.length);
        }
        this.setState({phone: phoneMask(e.currentTarget.value)});
    };

    highlightKeypadPanel = (key: string, leaveTime: number) => {
        if (key === "+") {
            key = "0";
        }
        const pressedKey: HTMLElement = document.getElementById(`keypad_key_${key}`);
        pressedKey.className += " active";
        setTimeout(() => {
            pressedKey.className = pressedKey.className.replace(" active", "");
        }, leaveTime);
    };

    handleKeyUp = (event: any) => {
        if (
            document.activeElement !== document.getElementsByClassName("user-lastname-input")[0] &&
            document.activeElement !== document.getElementsByClassName("user-name-input")[0] &&
            document.activeElement !== document.getElementById("number-input")
        ) {
            switch (event.key) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    this.highlightKeypadPanel(event.key, 100);
                    this.handleKeypadClick(event.key);
                    break;
                case "Enter":
                    //this.handleContactCreate();
                    this.handleAddContact();
                    break;
                case "Backspace":
                    const {phone} = this.state;
                    this.setState({phone: phoneMask(phone.substr(0, phone.length - 1))});
                    break;
                default:
                    break;
            }
        }
    };

    handleContactCreate = () => {
        const {attemptSetCreateContactNumber} = this.props;
        const {phone} = this.state;

        attemptSetCreateContactNumber(phone);

    };

    handlePhoneDelete = () => {
        const {phone, cursorPosition} = this.state;
        if (phone) {
            const nphone = phoneMask(phone)

            Log.i("handlePhoneDelete -> phone = ", nphone)
            if (cursorPosition) {
                const newPhone = [nphone.slice(0, cursorPosition - 1), nphone.slice(cursorPosition)].join('');
                Log.i("handlePhoneDelete -> newPhone = ", phoneMask(newPhone))
                this.setState({phone: phoneMask(getPhone(newPhone)), cursorPosition: nphone[cursorPosition - 2] === "-" ? cursorPosition - 2 : cursorPosition - 1});
                this.setCaretPosition(nphone[cursorPosition - 2] === "-" ? cursorPosition - 2 : cursorPosition - 1);
            } else {
                Log.i("handlePhoneDelete -> cursorPosition = 2 ", cursorPosition)
                this.setState({phone: phoneMask(getPhone(nphone.substring(0, nphone.length - 1)))});
                this.setCaretPosition(nphone.length - 1);
            }
        }
    };

    handlePhoneDeleteLongClick = (): void => {
        if (this.mounted) {
            this.timeOut = setTimeout(() => {
                this.setState({phone: ""});
            }, 1500);
        }
    };

    handlePhoneDeleteLongClickCancel = (): void => {
        clearTimeout(this.timeOut);
    };

    handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
        const startPos = event.currentTarget.selectionStart;
        this.setState({cursorPosition: startPos});
    };

    handleOwnNumberPopUpClose = () => {
        this.setState({ownNumber: false})
    };

    get keys(): Array<JSX.Element> {
        return KEYPAD.map(keyNumObj => (
            <Key
                onClick={this.handleKeypadClick}
                letters={keyNumObj.keyLetter}
                keyNumber={keyNumObj.keyNum}
                key={keyNumObj.keyNum}
            />
        ));
    }

    componentDidMount(): void {
        const {app, removeOldCreateContactNumber, removeCreateContactNumber} = this.props;
        this.mounted = true;
        if (app.oldCreateContactNumber) {
            removeOldCreateContactNumber();
        }
        if (app.previousLeftPanel !== RIGHT_PANELS.contact_info) {
            removeCreateContactNumber();
        }
        document.getElementById("keypad-panel").focus();
    }

    shouldComponentUpdate(nextProps: IKeypadPanelProps, nextState: IKeypadPanelState): boolean {
        return this.state.phone !== nextState.phone ||
            this.state.error !== nextState.error ||
            this.state.ownNumber !== nextState.ownNumber ||
            this.props.newMessagesCount !== nextProps.newMessagesCount ||
            this.props.app.showProfilePopUp !== nextProps.app.showProfilePopUp ||
            !this.props.user.equals(nextProps.user);
    }

    componentDidUpdate(prevProps: any, prevState: any): void {
        if (prevState.phone !== this.state.phone) {
            this.setState({error: false});
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        clearTimeout(this.timeOut);
    }

    render(): JSX.Element {
        const {app, newMessagesCount} = this.props;
        const localization: any = components().keypadPanel;
        const {phone, error, ownNumber} = this.state;

        return (
            <div className="left_side" onKeyUp={this.handleKeyUp} tabIndex={0} id="keypad-panel">
                <div className="left_side_content">
                    <Scrollbars autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                        <div className="keypad_content">
                            <form className="number-input-form">
                                <input
                                    maxLength={CONTACT_NUMBER_MAX_LENGTH}
                                    onKeyPress={this.handleInputKeyPress}
                                    onChange={this.handlePhoneChange}
                                    onKeyDown={this.handleEnterPress}
                                    onPaste={this.handleInputPaste}
                                    onClick={this.handleInputClick}
                                    id="number-input"
                                    className={error ? "phone-number-error" : ""}
                                    value={phone}
                                    type="text"
                                    autoComplete="off"
                                    placeholder={localization.phoneNumber}
                                />
                                {
                                    phone &&
                                    <div className="delete-icon_container">
                                        <span className="back-ico"
                                              onMouseUp={this.handlePhoneDeleteLongClickCancel}
                                              onMouseDown={this.handlePhoneDeleteLongClick}
                                              onClick={this.handlePhoneDelete}
                                        />
                                    </div>
                                }
                                <span className="add-new-contact-btn" onClick={this.handleContactCreate}>{localization.addNewContact}</span>
                            </form>
                            <div className="keypad">
                                {this.keys}
                            </div>
                            <div className="keypad-action-buttons">
                                {/*<div className={phone.length >= 3 ? "call-icon_container" : "call-icon_container inactive"}>*/}
                                    {/*<span className="icon-free_call"/>*/}
                                {/*</div>*/}
                                <button disabled={phone.length < 3} onClick={this.handleAddContact}
                                        className={phone.length >= 3 ? "call-icon_container" : "call-icon_container inactive"}>
                                    <span className="icon-free_call"/>
                                </button>
                            </div>
                        </div>
                    </Scrollbars>
                </div>
                <FooterNavBar selected={app.leftPanel} changePanel={this.handlePanelChange}
                              newMessagesCount={newMessagesCount}/>
                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={230}>
                    {
                        ownNumber && <PopUpMain   confirmButton={this.handleOwnNumberPopUpClose}
                                                  cancelButton={this.handleOwnNumberPopUpClose}
                                                  confirmButtonText={localization.failedPopUpButton}
                                                  titleText={localization.failedPopUpTitle}
                                                  infoText={localization.failedPopUpText}
                                                  showPopUpLogo={true}/>
                    }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptSetCreateContactNumber: phone => dispatch(attemptSetCreateContactNumber(phone)),
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels, createConversation, editableId, notSaved) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels, createConversation, editableId, notSaved)),
    removeOldCreateContactNumber: () => dispatch(removeOldCreateContactNumber()),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    removeCreateContactNumber: () => dispatch(removeCreateContactNumber()),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp())
});

export default connect(mapStateToProps, mapDispatchToProps)(KeypadPanel);
