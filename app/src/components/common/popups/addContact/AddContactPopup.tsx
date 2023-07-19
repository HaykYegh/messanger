"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";

import {ADD_CONTACT_TYPE, CONTACT_NUMBER_MAX_LENGTH, ENTER_KEY_CODE, APPLICATION} from "configs/constants";
import {attemptCreateContact} from "modules/contacts/ContactsActions";
import selector, {IStoreProps} from "services/selector";
import {validateNumber} from "helpers/DataHelper";
import {checkUsersByLists, userCheck} from "requests/profileRequest";
import {setLabelList, checkNumber, cancelPostRequests, renewCancelToken} from "helpers/AppHelper";
import components from "configs/localization";
import {
    PopupBlock,
    PopupContainer,
    PopupHeader,
    PopupBody,
    PopupContent,
    Title,
    NameBlock,
    ContactNumber,
    Number,
    Label,
    Input,
    GreyTextBar,
    FormFooterContainer,
    CancelButton,
    CreateButton,
    IconLabelWrapper,
    ValidError
} from "components/common/popups/addContact/style";

import {ContactInfoAction, InfoBlock, ActionButton, LeftSideIcon} from "components/contacts/ContactInfo/style";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Log from "modules/messages/Log";
import {getPhone, phoneMask} from "helpers/UIHelper";

interface IAddContactPopupState {
    firstName: string;
    lastName: string;
    phoneNumbers: [{
        value: string,
        label: string
        isValid: boolean,
        isVisible: boolean,
        loading: boolean
    }];
    emails: [{
        value: string,
        label: string
        isValid: boolean
        loading: boolean
    }];
    isProcessing: boolean;
}

interface IAddContactPopupPassedProps {
    handleAddContactPopupClose: () => void,
    containerState?: {
        isOpened: boolean
    };
}

interface IAddContactPopupProps extends IStoreProps, IAddContactPopupPassedProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,
}

const selectorVariables: any = {
    user: {
        user: true
    },
    contacts: true
};

class AddContactPopup extends React.Component<IAddContactPopupProps, IAddContactPopupState> {

    popupBlockContent: React.RefObject<HTMLDivElement>;

    constructor(props: any) {
        super(props);
        this.popupBlockContent = React.createRef();
        const localization: any = components().contactForm;
        this.state = {
            firstName: "",
            lastName: "",
            phoneNumbers: [{
                value: "",
                label: localization.mobile,
                isValid: true,
                isVisible: true,
                loading: false
            }],
            emails: APPLICATION.WITHEMAIL ?  [{
                value: "",
                label: localization.home,
                isValid: true,
                loading: false
            }] : null,
            isProcessing: false
        };
    }


    componentDidMount(): void {
        document.getElementById("add-contact-popup").addEventListener("click", this.handleOutSideClick);
        document.addEventListener("keyup", this.handleKeyup);
    }

    componentDidUpdate(prevProps: Readonly<IAddContactPopupProps>, prevState: Readonly<IAddContactPopupState>, snapshot?: any) {
        const {app: {applicationState}} = this.props;
        const {phoneNumbers} = this.state;

        if (prevProps.app.applicationState.isOnline !== applicationState.isOnline && prevProps.app.applicationState.isOnline === false) {
            const numbers = JSON.parse(JSON.stringify(phoneNumbers))
            numbers.forEach(async item => {
                if (item.loading) {
                    const {data: {body}} = await userCheck([getPhone(item.value)], []);
                    const registered = body[0].registered
                    item.loading = false
                    item.isValid = registered
                    this.setState({phoneNumbers: numbers})
                }
            })
        }

        // if(!isEqual(prevProps.contacts, this.props.contacts)){
        //     this.props.handleAddContactPopupClose()
        // }
    }

    componentWillUnmount(): void {
        document.getElementById("add-contact-popup").removeEventListener("click", this.handleOutSideClick);
        document.removeEventListener("keyup", this.handleKeyup);
    }

    handleOutSideClick = (event: any): void => {
        const referenceNode = document.getElementById(" add-contact-popup-block");
        const {handleAddContactPopupClose} = this.props;

        if (referenceNode && !referenceNode.contains(event.target)) {
            handleAddContactPopupClose();
        }
    };

    handleKeyup = (event: any): void => {
        const {isProcessing, phoneNumbers, emails} = this.state;

        if (event.key === "Escape") {
            this.props.handleAddContactPopupClose();
        }

        if (event.keyCode === ENTER_KEY_CODE && !isProcessing) {
            const isDisabled: boolean = phoneNumbers[0].value.length < 3 && emails[0].value.length < 3 || phoneNumbers.some(number => !number.isValid) || emails.some(email => !email.isValid);
            if (!isDisabled) {
                this.handleCreateContact();
            }
        }

        event.preventDefault();
    };

    handleInputChange = async ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>, index?: number): Promise<any> => {
        const newState: IAddContactPopupState = {...this.state};
        const {user} = this.props;
        const localization: any = components().contactForm;

        switch (name) {
            case "firstName":
            case "lastName":
                newState[name] = value;
                break;
            case "phone":
                const checkValue:string = checkNumber(user.get("phoneCode"), getPhone(value))
                let isValid;
                const regExpression = /^\+?\d{0,23}$/;
                if (regExpression.test(getPhone(value))) {

                    newState.phoneNumbers[index] = {
                        ...newState.phoneNumbers[index],
                        value: phoneMask(value),
                        loading: true
                    };
                    this.setState(newState);
                    const {data: {body, status}} = await checkUsersByLists([checkValue], []);
                    if(status === "SUCCESS") {
                        const registered = body[0].registered
                        isValid = registered

                        newState.phoneNumbers[index] = {
                            ...newState.phoneNumbers[index],
                            value: phoneMask(value),
                            isValid,
                            loading: false
                        };
                    } else {
                        newState.phoneNumbers[index] = {
                            ...newState.phoneNumbers[index],
                            value: phoneMask(value),
                            isValid: false,
                            loading: false
                        };
                    }

                }
                break;
            case "email":
                const checkEmailValue:string = value
                let isEmailValid;

                newState.emails[index] = {
                    ...newState.emails[index],
                    value,
                    loading: true
                };
                this.setState(newState);

                const {data: {body, status}} = await checkUsersByLists([], [checkEmailValue]);

                if(status === "SUCCESS") {
                    const registered = body[0] && body[0].registered
                    isEmailValid = registered

                    newState.emails[index] = {
                        ...newState.emails[index],
                        value,
                        isValid: isEmailValid,
                        loading: false
                    };
                } else {
                    newState.emails[index] = {
                        ...newState.emails[index],
                        value,
                        isValid: false,
                        loading: false
                    };
                }

                break;
        }

        this.setState(newState);
    };

    handleInputKeyDown = async ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>, index?: number): Promise<any> => {
        const newState: IAddContactPopupState = {...this.state};
        const {user} = this.props;
        const localization: any = components().contactForm;


        switch (name) {
            case "phone":
                break;
            case "email":


                break;
        }

        this.setState(newState);
    };

    handleMobileNumberPast = async (event: any, index): Promise<any> => {
        event.preventDefault();
        const {user} = this.props;
        const localization: any = components().contactForm;
        const currentPosition: number = event.target.selectionStart;
        const clipboardData = event.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: IAddContactPopupState = {...this.state};

            // const phoneNumber: string = newState.phoneNumbers[index].value.slice(0, currentPosition) + filteredNumbers.join("") + newState.phoneNumbers[index].value.slice(currentPosition);
            const phoneNumber: string = filteredNumbers.join("");

            newState.phoneNumbers[index].value = phoneMask(phoneNumber.slice(0, CONTACT_NUMBER_MAX_LENGTH));
            let isValid
            if (getPhone(newState.phoneNumbers[index].value).length < 5) {
                isValid = false
            } else {
                const checkValue:string = checkNumber(user.get("phoneCode"), getPhone(newState.phoneNumbers[index].value))
                newState.phoneNumbers[index] = {
                    ...newState.phoneNumbers[index],
                    value: phoneMask(newState.phoneNumbers[index].value),
                    loading: true,
                };
                this.setState(newState);
                const {data: {body}} = await userCheck([checkValue], []);
                const registered = body[0].registered
                isValid = registered
            }
            newState.phoneNumbers[index].isValid = isValid;
            newState.phoneNumbers[index].loading = false;


            this.setState(newState);
        }
    };

    handleClearNumber = (index: number): void => {
        const newState: IAddContactPopupState = {...this.state};
        newState.phoneNumbers[index].isVisible = false;
        newState.phoneNumbers.splice(index, 1);
        this.setState(newState);
    };

    handleAddClick = (category: string) => {
        const localization: any = components().contactForm;
        const newState: IAddContactPopupState = {...this.state};
        if (category === "number") {
            newState.phoneNumbers.push({
                value: "",
                label: localization.mobile,
                isValid: true,
                isVisible: true,
                loading: false
            });
            this.setState(newState);
        } else if (category === "email") {
            newState.emails.push({
                value: "",
                label: localization.home,
                isValid: true,
                loading: false
            });
            this.setState(newState);
        } else return;
    };

    handleClearEmail = (index): void => {
        const newState: IAddContactPopupState = {...this.state};
        newState.emails.splice(index, 1);
        this.setState(newState);
    };

    handleLabelClick = (event: React.MouseEvent<HTMLDivElement>, labelType: string, index: number) => {
        event.preventDefault();
        const localization: any = components().contactForm;
        setLabelList(labelType, index, localization, this.handleLabelChange)
    };

    handleLabelChange = (labelType, label, index) => {
        const newState: IAddContactPopupState = {...this.state};

        if (labelType === "phone") {
            newState.phoneNumbers[index] = {
                ...newState.phoneNumbers[index],
                label
            };
        } else if (labelType === "email") {
            newState.emails[index] = {
                ...newState.emails[index],
                label
            };
        }

        this.setState(newState);
    };

    handleCreateContact = async (): Promise<any> => {
        const {firstName, lastName, phoneNumbers, emails} = {...this.state};
        const {user, attemptCreateContact, handleAddContactPopupClose} = this.props;
        const isEmail: boolean = !!user.get("email");
        this.setState({isProcessing: true});
        const contactNumbers: any[] = [];
        for (let i: number = 0; i < phoneNumbers.length; i++) {
            if (phoneNumbers[i].value !== "") {
                const contactNumber: any = validateNumber(checkNumber(user.get("phoneCode"),getPhone(phoneNumbers[i].value)), user.get("phone"), isEmail);
                if (!contactNumber) {
                    phoneNumbers[i].isValid = false;
                } else {
                    phoneNumbers[i].value = contactNumber.fullNumber;
                    contactNumbers.push(contactNumber);
                }
            }
        }

        const emailAddresses: string[] = emails ? emails.map(email => email.value) : [];

        // emailAddresses.pop()

        // if (emailAddresses.length) {
        //     console.log("EMAIL ADDRESS CHECK");
        //     const {data: {body}} = await userCheck([], emailAddresses);
        //
        //     // for (let i: number = 0; i < emails.length - 1; i++) {
        //     //   emails[i].isValid = body[i].registered;
        //     // }
        // }

        this.setState({phoneNumbers, emails, isProcessing: false});

        if (phoneNumbers.some(phone => !phone.isValid) || (emails && emails.some(email => !email.isValid))) {
            return;
        }

        const fullNumbers: string[] = contactNumbers.map((number) => number.fullNumber);

        const getedEmails = emails || []

        let labels = [...phoneNumbers, ...getedEmails];

        attemptCreateContact(null, firstName, lastName, user.get("username"), fullNumbers.length ? fullNumbers : null, true, true, ADD_CONTACT_TYPE.addContactPanel, emailAddresses.length ? emailAddresses : null, labels);
        const bool = phoneNumbers.every(item => item.isValid)
        if (bool) {
            handleAddContactPopupClose();
        }
    };


    dismissPopup = (event = null): void => {
        const {handleAddContactPopupClose, containerState} = this.props;
        if (!event) {
            handleAddContactPopupClose();
            return;
        }
        const popupBlock: any = this.popupBlockContent && this.popupBlockContent.current;
        if (containerState.isOpened && popupBlock && !popupBlock.contains(event.target)) {
            handleAddContactPopupClose();
        }
    };

    handleOutsideFromPopupClick = (event: any): void => {
        this.dismissPopup(event);
    };

    render(): JSX.Element {
        const {handleAddContactPopupClose, app: {applicationState}, contactErrors} = this.props;
        const {phoneNumbers, firstName, lastName, emails, isProcessing} = this.state;
        const localization: any = components().contactForm;
        const isDisabled: boolean = (phoneNumbers && phoneNumbers.some(number => !number.isValid || !number.value.length)) ||
            (emails && emails.some(email => !email.isValid || !email.value.length))

        let disabled;

        if (!applicationState.isOnline) {
            disabled = true;
        } else {
            disabled = phoneNumbers.length > 0 ? isDisabled : true;
        }

        return (
            <PopupContent id={"add-contact-popup"} onClick={this.handleOutsideFromPopupClick}>
                <PopupBlock id={"add-contact-popup-block"} className={"popup-block"} ref={this.popupBlockContent}>
                    <PopupContainer>
                        <PopupHeader>
                            <Title>
                                {localization.title}
                            </Title>
                        </PopupHeader>

                        {/*Input Fields*/}
                        <PopupBody overflowScroll={phoneNumbers.length > 1 || (emails && emails.length > 1) ? true : false} hasMarginTop>
                            <NameBlock>
                                <input
                                    placeholder={localization.firstName}
                                    onChange={this.handleInputChange}
                                    value={firstName}
                                    name="firstName"
                                    type="text"
                                    autoFocus={true}
                                />
                                <input
                                    placeholder={localization.lastName}
                                    data-field="lastName"
                                    onChange={this.handleInputChange}
                                    value={lastName}
                                    name="lastName"
                                    type="text"
                                />
                            </NameBlock>
                            {/*<Space/>*/}
                            <GreyTextBar hasMarginTop>{localization.addEmailOrMobile}</GreyTextBar>
                            <ContactNumber>
                                <ReactCSSTransitionGroup
                                    transitionName="list-item"
                                    transitionAppear={true}
                                    transitionAppearTimeout={500}
                                    transitionEnter={true}
                                    transitionEnterTimeout={500}
                                    transitionLeave={true}
                                    transitionLeaveTimeout={300}>
                                    {phoneNumbers.map((phone, i) => {
                                        return (
                                            <div
                                                style={{
                                                    position: "relative"
                                                }}
                                                key={i}>
                                                <Number
                                                    isValid={phone.isValid}
                                                >
                                                    <IconLabelWrapper>
                                                        {/*{phoneNumbers.length > 1 &&*/}
                                                        <LeftSideIcon
                                                            src={"assets/images/remove-item.svg"}
                                                            onClick={() => {
                                                                this.handleClearNumber(i)
                                                            }}
                                                            draggable={false}
                                                            alt=""
                                                        />
                                                        {/*}*/}
                                                        {/*<Label onClick={(e) => this.handleLabelClick(e, "phone", i)}>*/}
                                                        {/*    /!*<span>{phone.label}</span>*!/*/}
                                                        {/*    <span>PrimeOne number</span>*/}
                                                        {/*</Label>*/}
                                                    </IconLabelWrapper>
                                                    <Input
                                                        maxLength={CONTACT_NUMBER_MAX_LENGTH}
                                                        placeholder={localization.appNumber}
                                                        onChange={(event) => {
                                                            this.handleInputChange(event, i)
                                                        }}
                                                        onPaste={(event) => {
                                                            this.handleMobileNumberPast(event, i)
                                                        }}
                                                        value={phone.value}
                                                        isValid={phone.isValid}
                                                        name="phone"
                                                        type="text"
                                                    />
                                                </Number>
                                                {phone.loading && phone.value.length > 0 && <div
                                                    style={{
                                                        position: "absolute",
                                                        top: "10px",
                                                        right: "0"
                                                    }}
                                                    className="loader-item">
                                                    <div className="circular-loader">
                                                        <div className="loader-item-stroke">
                                                            <div className="loader-item-stroke-left"/>
                                                            <div className="loader-item-stroke-right"/>
                                                        </div>
                                                    </div>
                                                </div>}
                                                {contactErrors.get(phone.value) && <ValidError>It is not PrimeOne number</ValidError>}
                                            </div>
                                        )
                                    })}
                                </ReactCSSTransitionGroup>
                            </ContactNumber>
                            <ContactInfoAction onClick={() => this.handleAddClick("number")}>
                                <InfoBlock>
                                    <LeftSideIcon
                                        src={"assets/images/add-item.svg"}
                                        draggable={false}
                                        alt=""
                                    />
                                    <ActionButton>{localization.addNumber}</ActionButton>
                                </InfoBlock>
                            </ContactInfoAction>
                            {APPLICATION.WITHEMAIL && <ContactNumber hasMarginTop>
                                <ReactCSSTransitionGroup
                                    transitionName="list-item"
                                    transitionAppear={true}
                                    transitionAppearTimeout={500}
                                    transitionEnter={true}
                                    transitionEnterTimeout={500}
                                    transitionLeave={true}
                                    transitionLeaveTimeout={300}
                                >
                                    {emails.map((email, i) => {
                                        return (
                                            <div
                                                style={{
                                                    position: "relative"
                                                }}
                                                key={i}>
                                                <Number isValid={email.isValid}
                                                        key={i}>
                                                    <IconLabelWrapper>
                                                        {/*{emails.length > 1 &&*/}
                                                        <LeftSideIcon
                                                            src={"assets/images/remove-item.svg"}
                                                            onClick={() => {
                                                                this.handleClearEmail(i)
                                                            }}
                                                            draggable={false}
                                                            alt=""
                                                        />
                                                        {/*}*/}
                                                        {/*<Label onClick={(e) => this.handleLabelClick(e, "email", i)}>*/}
                                                        {/*    <span>{email.label}</span>*/}
                                                        {/*</Label>*/}
                                                    </IconLabelWrapper>
                                                    <Input
                                                        placeholder={localization.email}
                                                        onChange={(event) => {
                                                            this.handleInputChange(event, i)
                                                        }}
                                                        // onKeyDown={(event) => {
                                                        //     this.handleInputKeyDown(event, i)
                                                        // }}
                                                        value={email.value}
                                                        isValid={email.isValid}
                                                        name="email"
                                                        type="email"
                                                    />
                                                    {email.loading && <div
                                                        style={{
                                                            position: "absolute",
                                                            top: "10px",
                                                            right: "0"
                                                        }}
                                                        className="loader-item">
                                                        <div className="circular-loader">
                                                            <div className="loader-item-stroke">
                                                                <div className="loader-item-stroke-left"/>
                                                                <div className="loader-item-stroke-right"/>
                                                            </div>
                                                        </div>
                                                    </div>}
                                                    {contactErrors.get(email.value) && <ValidError>It is not PrimeOne email</ValidError>}
                                                </Number>
                                            </div>
                                        )
                                    })}
                                </ReactCSSTransitionGroup>
                            </ContactNumber>}
                            {APPLICATION.WITHEMAIL && <ContactInfoAction onClick={() => this.handleAddClick("email")}>
                                <InfoBlock>
                                    <LeftSideIcon
                                        src={"assets/images/add-item.svg"}
                                        draggable={false}
                                        alt=""
                                    />
                                    <ActionButton>{localization.addEmail}</ActionButton>
                                </InfoBlock>
                            </ContactInfoAction>}
                        </PopupBody>
                        <FormFooterContainer>
                            <CancelButton onClick={handleAddContactPopupClose}>{localization.cancel}</CancelButton>
                            <CreateButton disabled={disabled || isProcessing}
                                          onClick={!(disabled || isProcessing) ? this.handleCreateContact : null}>{localization.create}</CreateButton>
                        </FormFooterContainer>
                    </PopupContainer>
                </PopupBlock>
            </PopupContent>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    attemptCreateContact: (id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels) => dispatch(attemptCreateContact(id, firstName, lastName, author, phone, saved, setThreadId, type, email, labels)),
});

export default connect<{}, {}, IAddContactPopupPassedProps>(mapStateToProps, mapDispatchToProps)(AddContactPopup);
