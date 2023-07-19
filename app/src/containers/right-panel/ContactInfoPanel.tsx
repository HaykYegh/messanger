"use strict";

import * as React from "react";
import clone from "lodash/clone";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {
    ADD_CONTACT_TYPE,
    IMAGE_TOGGLE,
    SHARED_MEDIA_TYPES,
    VIDEO_TOGGLE,
    APPLICATION,
    CONTACT_NUMBER_MAX_LENGTH
} from "configs/constants";
import {getInitials, getThread, getUserId} from "helpers/DataHelper";
import NotificationsPopUp from "components/common/NotificationsPopUp";
import ContactForm from "components/contacts/ContactForm";
import ContactInfo from "components/contacts/ContactInfo/ContactInfo";
import {checkNumber} from "helpers/AppHelper";
import rateRequest from "requests/getRatesRequest";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";
import "scss/pages/right-panel/ContactInfo";
import { RightPanel } from "./style";
import {IGroupCreateParams} from "services/interfaces";
import {IContact} from "modules/contacts/ContactsReducer";
import {fromJS} from "immutable";
import SharedMedia from "containers/SharedMedia";
import {ContactInfoRight} from "components/contacts/ContactInfo/style";
import {checkUsersByLists, userCheck} from "requests/profileRequest";
import Log from "modules/messages/Log";
import {clearSelection, selectElementText} from "helpers/DomHelper";
import {getPhone} from "helpers/UIHelper";

interface IContactInfoPanelState {
    requestId: string | number;
    firstName: string;
    lastName: string;
    editing: boolean;
    editable: boolean;
    contactNumbers: any;
    number: string;
    deletePopup: boolean;
    phone: string;
    mutePopUp: boolean;
    blockPopup: boolean;
    saveContact: boolean;
    numbers: any;
    rates: {
        phone: number;
        countryName: string;
        currencyCode: string;
        phoneCode: string;
        callBack: {
            price: number;
            quantity: number;
        },
        outCall: {
            price: number;
            quantity: number;
        }
    };
    sharedFilesCount: number;
    error: boolean;

    conversationPopup: {
        isOpened: boolean
        isGroupPopupOpened: boolean
    },
    copyIconScale: number;
    // isSharedMediaOpened: boolean
}

interface IContactInfoPanelProps {
    attemptCreateContact: (id: string, firsName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,
    attemptUpdateContact: (idList: string[], firstName: string, lastName: string, phoneList: any, username: string, contact: any) => void;
    attemptUpdateConversation: (id: string, firstName: string, lastName: string, phone: number | string, username: string, contact: any) => void;
    togglePopUp: (popUp: typeof VIDEO_TOGGLE | typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    attemptToggleFavorite?: (id: string, favorite: boolean, parentContactId: string) => void;
    attemptMuteConversation: (threadId: string, expirationDate: number) => void;
    attemptSendForwardMessage: (messages: any, threadIds: string[]) => void;
    attemptDeleteMessage?: (id: string, message?: any) => void;
    messageLocalDelete: (id: string, threadId: string) => void;
    attemptSetSharedMediaMessages: (threadId: string) => void;
    updateMessageProperty: (msgId, property, value) => void;
    attemptUnmuteConversation: (threadId: string) => void;
    handleAudioChange: (audio: HTMLAudioElement) => void;
    setRightCreateGroupMember: (contact: any) => void;
    attemptSetSelectedThread: (thread: any) => void;
    saveContact: (id: string, contact: any) => void;
    setSelectedInfoThreadId: (id: string) => void;
    setSearchKeyword: (keyword: string) => void;
    setForwardMessage: (message: any) => void;
    downloadFile: (downloadFile: any) => void;
    changeRightPanel: (panel: string) => void;
    toggleRightPanel: (show: boolean) => void;
    removeSharedMediaMessages?: () => void;
    removeMessage: (id: string) => void;
    toggleMuted: (id: string) => void;
    clearForwardMessage: () => void;
    closeSharedMedia: () => void;
    openSharedMedia: () => void;
    sharedMediaPanel: boolean;
    sharedMediaCount: number;
    sharedMediaMessages: any;
    selectedThreadId: any;
    forwardMessage: any;
    selectedThread: any;
    savedContacts: any;
    languages: any;
    lastCall: any;
    user: any;
    app: any;
    disconnected: boolean;
    messages: any

    groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts?: any) => void;
    contacts: any;
    conversations: any;
    sharedMedia: any;

    DELETE_CONTACT: (threadId: string) => void;
    fetchSharedMedia: (threadId: string, sharedMediaType: string) => void

    attemptFavoritesUpdate: (changes: { prevValue: boolean, value: boolean, username: string }[]) => void
    UNBLOCK_CONTACT: (contactIds: string[]) => void;
    BLOCK_CONTACT: (contactIds: string[]) => void;
    onlineUsers: any;
}

export default class ContactInfoPanel extends React.Component<IContactInfoPanelProps, IContactInfoPanelState> {
    private userNumberREf: React.RefObject<HTMLSpanElement> =  React.createRef();

    constructor(props: any) {
        super(props);
        this.state = {
            deletePopup: false,
            blockPopup: false,
            saveContact: false,
            mutePopUp: false,
            editing: false,
            editable: false,
            requestId: "",
            firstName: "",
            lastName: "",
            number: "",
            contactNumbers: [],
            rates: null,
            phone: "",
            sharedFilesCount: 0,
            error: false,
            numbers: {},
            conversationPopup: {
                isOpened: false,
                isGroupPopupOpened: false
            },
            copyIconScale: 1,
        }
    }

    componentDidMount() {
        document.addEventListener("click", this.hideOpenPanel);
        this.getNumbers()
    }

    shouldComponentUpdate(nextProps: IContactInfoPanelProps, nextState: IContactInfoPanelState): boolean {

        if (this.props.lastCall && nextProps.lastCall && !this.props.lastCall.equals(nextProps.lastCall)) {
            return true;
        }

        if (this.props.selectedThread.get("threads") && !this.props.selectedThread.get("threads").isEmpty() && !this.props.selectedThread.equals(nextProps.selectedThread)) {
            return true;
        }

        if (!isEqual(this.props.selectedThread, nextProps.selectedThread)) {
            return true;
        }
        if (!isEqual(this.props.selectedThread.get('members').first().get('saved'), nextProps.selectedThread.get('members').first().get('saved'))) {
            return true;
        }

        if (!isEqual(this.props.selectedThread.get('members').first().get('muted'), nextProps.selectedThread.get('members').first().get('muted'))) {
            return true;
        }


        if(this.props.onlineUsers.get(this.props.selectedThreadId) !== nextProps.onlineUsers.get(this.props.selectedThreadId)) {
            return  true
        }

        if (this.props.app.previousGroupId !== nextProps.app.previousGroupId) {
            return true;
        }

        if (this.props.app.showSharedMedia != nextProps.app.showSharedMedia) {
            return true;
        }

        if (this.props.sharedMediaPanel !== nextProps.sharedMediaPanel) {
            return true;
        }

        if (this.props.selectedThread.get("threads") && this.props.selectedThread.get("threads").isEmpty() && !nextProps.selectedThread.get("threads").isEmpty()) {
            return true;
        }

        if (this.props.languages.get('selectedLanguage') !== nextProps.languages.get('selectedLanguage')) {
            return true;
        }

        if (this.props.lastCall && !nextProps.lastCall) {
            return true;
        }

        if (!isEqual(this.props.sharedMediaMessages, nextProps.sharedMediaMessages)) {
            return true;
        }

        if (!isEqual(this.props.sharedMediaCount, nextProps.sharedMediaCount)) {
            return true;
        }

        if (!isEqual(this.props.savedContacts, nextProps.savedContacts)) {
            return true;
        }

        if (this.props.disconnected !== nextProps.disconnected) {
            return true;
        }

        if (!isEqual(this.props.sharedMedia, nextProps.sharedMedia)) {
            return true;
        }

        if (!isEqual(this.props.forwardMessage, nextProps.forwardMessage)) {
            return true
        }

        if (!isEqual(this.props.messages, nextProps.messages)) {
            return true
        }

        if(JSON.stringify(this.state.contactNumbers) === JSON.stringify(nextState.contactNumbers)) {
            return true
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IContactInfoPanelProps, prevState: IContactInfoPanelState): void {
        const {selectedThread, selectedThreadId, sharedMediaPanel, savedContacts, contacts, user, app: {applicationState}} = this.props;
        const {editing, saveContact, contactNumbers, numbers} = this.state;
        const curThreadInfo = selectedThread.get("members").first();
        // if (curThreadInfo.get("muted")) {
        //     const username = user.get("username");
        //     const encodedUsername = btoa(username);
        //     const mutedConversations = localStorage.getItem(encodedUsername);
        //     const mutedMap = mutedConversations && JSON.parse(mutedConversations) || {};
        //     const muteMapObj = mutedMap[threadId]
        //     const curDate = new Date()
        //     if (!muteMapObj) {
        //         return localization.muteStatus.on
        //     }
        //     if (muteMapObj.year - curDate.getFullYear() > 2) {
        //         return localization.muteStatus.off
        //     }
        //     if (muteMapObj.date - curDate.getDate() > 0) {
        //         return `Until Tomorow ${muteMapObj.hour}`
        //     }
        //
        //     return `Until ${muteMapObj.hour}`
        //
        // }
        // return localization.muteStatus.on

        Log.i("componentDidUpdate222 -> curThreadInfo = ", curThreadInfo.get("muted"))

        const threadInfo = getThread(prevProps.selectedThread, prevProps.user.get("username"));

        if ((prevProps.selectedThreadId !== selectedThreadId) && (sharedMediaPanel || editing || saveContact)) {
            this.setState({
                editing: false,
                saveContact: false,
                error: false
            });
            if (sharedMediaPanel) {
                this.handleSharedMediaPanelClose();
            }
        }

        if (prevProps.app.applicationState.isOnline !== applicationState.isOnline && prevProps.app.applicationState.isOnline === false) {
            const contactNumbersCopy = JSON.parse(JSON.stringify(contactNumbers))
            contactNumbersCopy.forEach(async item => {
                if (item.loading) {
                    const {data: {body}} = await userCheck([item.value], []);
                    const registered = body[0].registered
                    item.loading = false
                    item.isValid = registered
                    this.setState({contactNumbers: contactNumbersCopy})
                }
            })
            const numbersCopy: object = JSON.parse(JSON.stringify(numbers))
            Object.keys(numbersCopy).forEach(async item => {
                if (numbersCopy[item].loading) {
                    const {data: {body}} = await userCheck([numbersCopy[item].email], []);
                    const registered = body[0].registered
                    numbersCopy[item].loading = false
                    numbersCopy[item].isValid = registered
                    this.setState({numbers: numbersCopy})
                }
            })
        }

        if (prevProps.selectedThreadId !== selectedThreadId) {
            this.getNumbers()
        }

        const numberValues: any = Object.values(numbers);
        const boolNumbers = numberValues.some(item => item.email === "") || !contactNumbers.length
        const bool = threadInfo.get("numbers") && threadInfo.get("numbers").some(item => {
            const contactId = item + "@msg.hawkstream.com"
            return (
                (prevProps.contacts.getIn([contactId, "editable"]) === true && contacts.getIn([contactId, "editable"]) === false) ||
                (prevProps.contacts.getIn([contactId, "editable"]) !== contacts.getIn([contactId, "editable"]) && boolNumbers)
            )
        })

        if (
            (prevProps.contacts.getIn([prevProps.selectedThreadId, "editable"]) === true && contacts.getIn([prevProps.selectedThreadId, "editable"]) === false) ||
            (prevProps.contacts.getIn([prevProps.selectedThreadId, "editable"]) !== contacts.getIn([prevProps.selectedThreadId, "editable"]) && boolNumbers) ||
            bool
        ) {
            if (editing) {
                this.toggleEditContact();
            } else {
                this.getNumbers()
            }
        }
    }

    componentWillUnmount(): void {
        const {sharedMediaPanel} = this.props;
        document.removeEventListener("click", this.hideOpenPanel);
        if (sharedMediaPanel) {
            this.handleSharedMediaPanelClose();
        }
    }

    getNumbers = () => {
        const { selectedThread, user, savedContacts, selectedThreadId, contacts } = this.props;
        const { numbers } = this.state


        const threadInfo = getThread(selectedThread, user.get("username"));
        const getedNumbers: any = {};

        if (!selectedThreadId) {
            return
        }

        const threadNumbers: any = threadInfo.get("numbers");

        if (threadNumbers) {
            for (const number of threadNumbers) {
                if (!getedNumbers[number]) {
                    const contact = contacts.get(getUserId(number));
                    const contactInfo = contact && contact.get("members").first();

                    if (contactInfo) {
                        getedNumbers[number] = {
                            isProductContact: contactInfo.get("isProductContact"),
                            favorite: contactInfo.get("favorite"),
                            email: APPLICATION.WITHEMAIL ? (contactInfo.get("email") || contactInfo.get("phone")) : contactInfo.get("username"),
                            label: contactInfo.get("label"),
                            editable: false,
                            isValid: true,
                            errorText: "",
                            loading: false,
                            requestLoading: (numbers[number] && numbers[number].email) ? numbers[number].requestLoading : false
                        };
                    }

                    // Log.i("getedNumbers -> number = ", getedNumbers[number])
                }
            }
        } else {
            getedNumbers[threadInfo.get("phone")] = {
                isProductContact: threadInfo.get("isProductContact"),
                favorite: threadInfo.get("favorite"),
                email: APPLICATION.WITHEMAIL ? (threadInfo.get("email") || threadInfo.get("phone")) : threadInfo.get("username"),
                label: threadInfo.get("label"),
                editable: false,
                isValid: true,
                errorMessage: "",
                loading: false,
                requestLoading:  (numbers[threadInfo.get("phone")] && numbers[threadInfo.get("phone")].email) ? numbers[threadInfo.get("phone")].requestLoading : false
            };
        }

        this.setState({ numbers: getedNumbers }, () => {


            this.setState({
                editable: false
            })
        })
    }

    returnNumbers = () => {
        const { selectedThread, user, savedContacts, selectedThreadId } = this.props;
        const threadInfo = getThread(selectedThread, user.get("username"));
        const numbers: any = {};

        if (!selectedThreadId) {
            return
        }

        const threadNumbers: any = threadInfo.get("numbers");

        if (threadNumbers) {
            for (const number of threadNumbers) {
                if (!numbers[number]) {
                    const contact = savedContacts.get(getUserId(number));
                    const contactInfo = contact && contact.get("members").first();

                    if (contactInfo) {
                        numbers[number] = {
                            isProductContact: contactInfo.get("isProductContact"),
                            favorite: contactInfo.get("favorite"),
                            email: APPLICATION.WITHEMAIL ? (contactInfo.get("email") || contactInfo.get("phone")) : contactInfo.get("username"),
                            label: contactInfo.get("label"),
                            editable: false,
                            isValid: true,
                            errorText: "",
                            loading: false,
                            requestLoading: false
                        };
                    }
                }
            }
        } else {
            numbers[threadInfo.get("phone")] = {
                isProductContact: threadInfo.get("isProductContact"),
                favorite: threadInfo.get("favorite"),
                email: APPLICATION.WITHEMAIL ? (threadInfo.get("email") ||  threadInfo.get("phone")) : threadInfo.get("username"),
                label: threadInfo.get("label"),
                editable: false,
                isValid: true,
                errorMessage: "",
                loading: false,
                requestLoading: false
            };
        }

        return numbers
    }

    changeEditable = (number) => {
        const numbers = {...this.state.numbers}
        numbers[number].editable = true
        this.setState({numbers})
    }

    handleInputChange = async ({currentTarget: {name, value, dataset}}: React.ChangeEvent<HTMLInputElement>): Promise<any> => {
        const {user} = this.props
        if(name === "number") {
            const newState: any = {...this.state};


            let isValid;

            newState[name] = value;
            newState.error = false;

            const checkValue = checkNumber(user.get("phoneCode"), getPhone(value))
            newState.contactNumbers[parseInt(dataset.index)].loading = true
            newState.contactNumbers[parseInt(dataset.index)].value = getPhone(value)
            this.setState(newState)
            const {data: {body, status}} = await checkUsersByLists([checkValue], []);
            const registered = body[0] && body[0].registered
            if(status === "SUCCESS") {
                isValid = registered
            }


            newState.contactNumbers[parseInt(dataset.index)].value = value
            newState.contactNumbers[parseInt(dataset.index)].errorMessage = ""
            newState.contactNumbers[parseInt(dataset.index)].isValid = isValid
            newState.contactNumbers[parseInt(dataset.index)].loading = false
            this.setState(newState)
        } else if (name === "email") {
            const newState: any = {...this.state};


            let isValid;

            newState[name] = value;
            newState.error = false;

            newState.contactNumbers[parseInt(dataset.index)].loading = true
            newState.contactNumbers[parseInt(dataset.index)].email = value
            this.setState(newState)
            const {data: {body, status}} = await checkUsersByLists([], [value]);
            const registered = body[0] && body[0].registered
            if(status === "SUCCESS") {
                isValid = registered
            } else {
                isValid = false
            }
            newState.contactNumbers[parseInt(dataset.index)].email = value
            newState.contactNumbers[parseInt(dataset.index)].errorMessage = ""
            newState.contactNumbers[parseInt(dataset.index)].isValid = isValid
            newState.contactNumbers[parseInt(dataset.index)].loading = false
            this.setState(newState)
        } else {
            if (this.state[name] !== value) {
                const newState: any = {...this.state};
                newState[name] = value;
                newState.error = false;
                this.setState(newState)
            }
        }
    };

    handleEditInputChange = async ({currentTarget: {value, dataset}}: React.ChangeEvent<HTMLInputElement>) => {
        const newState: any = {...this.state};
        const {user} = this.props;
        let isValid = true;


        const checkValue = checkNumber(user.get("phoneCode"), getPhone(value))
        newState.numbers[dataset.index].loading = true
        newState.numbers[dataset.index].email = value
        this.setState(newState)
        const {data: {body, status}} = await checkUsersByLists([checkValue], []);
        const registered = body[0] && body[0].registered
        if(status === "SUCCESS") {
            isValid = registered
        } else {
            isValid = false
        }

        newState.numbers[dataset.index].email = value
        newState.numbers[dataset.index].errorMessage = ""
        newState.numbers[dataset.index].isValid = isValid
        newState.numbers[dataset.index].loading = false
        this.setState(newState)
    }

    handleEditEmailInputChange = async ({currentTarget: {value, dataset}}: React.ChangeEvent<HTMLInputElement>) => {
        const newState: any = {...this.state};
        const {user} = this.props;
        let isValid = true;
        const checkValue = value
        newState.numbers[dataset.index].loading = true
        newState.numbers[dataset.index].email = value
        this.setState(newState)
        const {data: {body, status}} = await checkUsersByLists([], [checkValue]);
        const registered = body[0] && body[0].registered
        if(status === "SUCCESS") {
            isValid = registered
        } else {
            isValid = false
        }


        newState.numbers[dataset.index].email = value
        newState.numbers[dataset.index].errorMessage = ""
        newState.numbers[dataset.index].isValid = isValid
        newState.numbers[dataset.index].loading = false

        this.setState(newState)
    }

    handleAddClick = (category: string) => {
        const localization: any = components().contactForm;
        const newState: IContactInfoPanelState = {...this.state};

        newState.contactNumbers.push({
            value: "",
            label: localization.mobile,
            isValid: true,
            errorMessage: "",
            loading: false,
            email: "",
            category,
        });
        this.setState(newState);
    };

    handleMobileNumberPast = async (event: any, index): Promise<any> => {
        event.preventDefault();
        const {user} = this.props
        const localization: any = components().contactForm;
        const currentPosition: number = event.target.selectionStart;
        const clipboardData = event.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: IContactInfoPanelState = {...this.state};

            // const phoneNumber: string = newState.contactNumbers[index].value.slice(0, currentPosition) + filteredNumbers.join("") + newState.contactNumbers[index].value.slice(currentPosition);
            const phoneNumber: string = filteredNumbers.join("");

            newState.contactNumbers[index].value = phoneNumber.slice(0, CONTACT_NUMBER_MAX_LENGTH);
            let isValid
            if (getPhone(newState.contactNumbers[index].value).length < 5) {
                isValid = false
            } else {
                const checkValue = checkNumber(user.get("phoneCode"), getPhone(newState.contactNumbers[index].value))
                newState.contactNumbers[index].loading = true
                this.setState(newState);
                const {data: {body}} = await userCheck([checkValue], []);
                const registered = body[0].registered
                isValid = registered
            }
            newState.contactNumbers[index].isValid = isValid;
            newState.contactNumbers[index].loading = false;

            this.setState(newState);
        }
    };

    hadleEmailPast = async (event: any, index): Promise<any> => {
        event.preventDefault();
        const {user} = this.props
        const localization: any = components().contactForm;
        const currentPosition: number = event.target.selectionStart;
        const clipboardData = event.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData;
        if (filteredNumbers) {
            const newState: IContactInfoPanelState = {...this.state};

            const emailNumber: string = filteredNumbers

            newState.contactNumbers[index].email = emailNumber;
            let isValid
            if (newState.contactNumbers[index].email.length < 5) {
                isValid = false
            } else {
                const checkValue = newState.contactNumbers[index].email
                newState.contactNumbers[index].loading = true
                this.setState(newState);
                const {data: {body}} = await userCheck([], [checkValue]);
                const registered = body[0].registered
                isValid = registered
            }
            newState.contactNumbers[index].isValid = isValid;
            newState.contactNumbers[index].loading = false;

            this.setState(newState);
        }
    }

    handleEditMobileNumberPast = async (event: any, number): Promise<any> => {
        event.preventDefault();
        const {user} = this.props;
        const localization: any = components().contactForm;
        const currentPosition: number = event.target.selectionStart;
        const clipboardData = event.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData && pastedData.match(/\d+/g);
        if (filteredNumbers) {
            const newState: IContactInfoPanelState = {...this.state};

            // const phoneNumber: string = newState.numbers[number].email.slice(0, currentPosition) + filteredNumbers.join("") + newState.numbers[number].email.slice(currentPosition);
            const phoneNumber: string = filteredNumbers.join("");

            newState.numbers[number].email = phoneNumber.slice(0, CONTACT_NUMBER_MAX_LENGTH);
            let isValid = true
            if (newState.numbers[number].email.length < 5 && newState.numbers[number].email.length > 0) {
                isValid = false
            } else {
                if(newState.numbers[number].email !== "") {
                    const checkValue = checkNumber(user.get("phoneCode"), getPhone(newState.numbers[number].email))
                    newState.numbers[number].loading = true
                    this.setState(newState);
                    const {data: {body}} = await userCheck([checkValue], []);
                    const registered = body[0].registered
                    isValid = registered
                }
            }
            newState.numbers[number].isValid = isValid;
            newState.numbers[number].errorMessage = "";
            newState.numbers[number].loading = false;

            this.setState(newState);
        }
    };

    handleEditEmailPast = async (event: any, number): Promise<any> => {
        event.preventDefault();
        const {user} = this.props;
        const localization: any = components().contactForm;
        const currentPosition: number = event.target.selectionStart;
        const clipboardData = event.clipboardData;
        let pastedData = clipboardData.getData("Text");
        const filteredNumbers = pastedData;
        if (filteredNumbers) {
            const newState: IContactInfoPanelState = {...this.state};

            // const phoneNumber: string = newState.numbers[number].email.slice(0, currentPosition) + filteredNumbers.join("") + newState.numbers[number].email.slice(currentPosition);
            const emailNumber: string = filteredNumbers;

            newState.numbers[number].email = emailNumber;
            let isValid = true
            if (newState.numbers[number].email.length < 5 && newState.numbers[number].email.length > 0) {
                isValid = false
            } else {
                if(newState.numbers[number].email !== "") {
                    const checkValue = newState.numbers[number].email
                    newState.numbers[number].loading = true
                    this.setState(newState);
                    const {data: {body}} = await userCheck([], [checkValue]);
                    const registered = body[0].registered
                    isValid = registered
                }
            }
            newState.numbers[number].isValid = isValid;
            newState.numbers[number].errorMessage = "";
            newState.numbers[number].loading = false;

            this.setState(newState);
        }
    };

    handleClearNumber = (index: number): void => {
        const newState: IContactInfoPanelState = {...this.state};
        newState.contactNumbers.splice(index, 1);
        this.setState(newState);
    };

    onInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if ((event.which < 48 || event.which > 57) && event.which !== 43 && event.which !== 42 && event.which !== 35) {
            event.preventDefault();
        }
    };

    attemptToggleContactBlocked = () => {
        const {selectedThread, user, BLOCK_CONTACT, UNBLOCK_CONTACT} = this.props;

        const threadInfo = selectedThread.get('members').first();

        const thread = getThread(selectedThread, user.get("username"));
        const numbers = thread.get("numbers");
        const contactId: string[] = numbers && numbers.toArray() || [threadInfo.get("contactId")];

        if (threadInfo.get("blocked")) {
            UNBLOCK_CONTACT(contactId);
        } else {
            BLOCK_CONTACT(contactId);
        }
    };

    toggleContactFavorite = () => {
        const {selectedThread, attemptFavoritesUpdate} = this.props;
        const thread = selectedThread.get("members").first();
        const changes: { prevValue: boolean, value: boolean, username: string }[] = [{
            prevValue: thread.get("favorite"),
            value: !thread.get("favorite"),
            username: thread.get("username")
        }];
        attemptFavoritesUpdate(changes);
    };

    getRates = (phone: string) => {
        rateRequest(phone).then(({data: {body}}) => body && this.setState({rates: {...body, phone}}));
    };

    toggleEditContact = () => {
        const {selectedThread, user, savedContacts, contacts} = this.props;
        const threadInfo = getThread(selectedThread, user.get("username"));
        const contactNumber: string = threadInfo.get("username");
        const localization: any = components().contactForm;

        let contactNumbers = [];
        if(threadInfo.get("numbers")) {
            const numbersInfo = threadInfo.get("numbers")
            contactNumbers = numbersInfo.reduce((acc, currentValue) => {
                const contact = savedContacts.get(getUserId(currentValue));
                const contactInfo = contact && contact.get("members").first();

                acc.push({
                    value: currentValue,
                    label: localization.home,
                    isValid: true,
                    errorMessage: "",
                    loading: false,
                    email: contactInfo.get("email"),
                    category: contactInfo.get("email") ? "email" : "number"
                })
                return acc;
            }, [])
        } else {
            contactNumbers = [{
                value: contactNumber,
                label: localization.home,
                isValid: true,
                errorMessage: "",
                loading: false,
                email: threadInfo.get("email"),
                category: threadInfo.get("email") ? "email" : "number"
            }]
        }

        const {editing} = this.state;
        const thread = selectedThread.get("members").first();

        this.setState({contactNumbers})

        if (editing) {
            this.setState({editing: false});
        } else {
            this.setState({
                firstName: thread.get("firstName"),
                lastName: thread.get("lastName"),
                phone: thread.get("phone"),
                editing: true
            });
        }
        this.getNumbers()
    };

    closeEditContact = () => {
        const {editing} = this.state;
        if (editing) {
            this.setState({editing: false});
        }
    };

    handleContactDeletePopupToggle = (): void => {
        const {deletePopup} = this.state;
        this.setState({deletePopup: !deletePopup});
    };

    handleDeleteContact = () => {
        const {selectedThread, DELETE_CONTACT} = this.props;
        const threadId: string = selectedThread.getIn(["threads", "threadId"]);

        // Saga handler
        DELETE_CONTACT(threadId);

        // Show initial state
        this.setState({editing: false, deletePopup: false, saveContact: false});
    };

    updateContact = (e, numbersList, contactNumbers) => {
        const {attemptUpdateContact, user, savedContacts} = this.props;
        let {firstName, lastName} = this.state;
        const localization: any = components().contactInfo;
        contactNumbers.forEach(item => {
            if (!item.isValid) {
                item.errorMessage = item.category === "email" ? localization.notBrandEmail : localization.notBrandNumber
            }
            if (item.value === "" && item.category === "number") {
                item.errorMessage = localization.dontPushEmptyField
            }
            if (item.email === "" && item.category ==="email") {
                item.errorMessage = localization.dontPushEmptyField
            }
        })

        const bool = contactNumbers.every(item => {
            if(item.category === "number") {
                return (item.isValid && item.value !== "")
            } else {
                return (item.isValid && item.email !== "")
            }

        })

        if (!bool) {
            this.setState({contactNumbers});
            return
        }

        contactNumbers.forEach(item => {
            item.value = user.get("email") ? item.value : item.value ? checkNumber(user.get("phoneCode"), item.value) : "";
        })



        firstName = firstName.replace(/\s+/g, ' ').trim();
        lastName = lastName.replace(/\s+/g, ' ').trim();
        this.setState({firstName, lastName, editable: true});

        // const phoneObj = contactNumbers.reduce((acc, currentObj) => {
        //     acc[currentObj.value] = true;
        //     return acc
        // }, {})

        numbersList = numbersList.reduce((acc, currentValue) => {
            // if (!phoneObj.hasOwnProperty(currentValue)) {
            acc.push(getUserId(currentValue));
            // }
            return acc;
        },[])

        attemptUpdateContact(numbersList, firstName, lastName, contactNumbers, user.get('username'), savedContacts);

    };

    updateEditableContact = (number) => {
        const {attemptUpdateContact, user, savedContacts} = this.props;
        const numbers = {...this.state.numbers}
        const localization: any = components().contactInfo;

        if (!numbers[number].isValid) {
            numbers[number].errorMessage = APPLICATION.WITHEMAIL ? localization.notBrandEmailOrNumber : numbers[number].category === "email" ? localization.notBrandEmail : localization.notBrandNumber;
        }

        const returnNumbers = this.returnNumbers()

        const numbersIds = Object.keys(returnNumbers).reduce((acc, currentValue) => {
            // acc.push(getUserId(returnNumbers[currentValue].email));
            acc.push(getUserId(currentValue));
            return acc;
        },[])

        const contactNumbers = Object.keys(numbers).reduce((acc, currentValue) => {
            if(numbers[currentValue].email !== "") {
                acc.push({
                    errorMessage: numbers[currentValue].errorMessage,
                    isValid: numbers[currentValue].isValid,
                    label: numbers[currentValue].label,
                    value: +numbers[currentValue].email !== +numbers[currentValue].email ? getPhone(numbers[currentValue].email) : checkNumber(user.get("phoneCode"), getPhone(numbers[currentValue].email)),
                    loading: false,
                    email: numbers[currentValue].email,
                    category: +numbers[currentValue].email !== +numbers[currentValue].email ? "email" : "nnumber"
                });
            }
            return acc;
        },[])

        const contact = savedContacts.get(getUserId(number));
        const contactInfo = contact && contact.get("members").first();

        if (!numbers[number].errorMessage) {
            numbers[number].editable = false
            if(returnNumbers[number].email !== numbers[number].email) {
                this.setState({editable: true});
                numbers[number].requestLoading = true

                attemptUpdateContact(numbersIds, contactInfo.get("firstName"), contactInfo.get("lastName"), contactNumbers, user.get('username'), savedContacts);
            }
        }
        this.setState({numbers})
    }

    saveContact = () => {
        const {firstName, lastName, phone} = this.state;
        const {saveContact, selectedThread, selectedThreadId} = this.props;

        const contact = selectedThread.toJS();
        const name = (firstName !== "" || lastName !== "") ? `${firstName} ${lastName}` : phone.toString();
        const avatarCharacter = getInitials(firstName, lastName);
        const savedContact = {...contact};

        savedContact.members[selectedThreadId].lastName = lastName;
        savedContact.members[selectedThreadId].firstName = firstName;
        savedContact.members[selectedThreadId].avatarCharacter = avatarCharacter;
        savedContact.members[selectedThreadId].name = name;

        saveContact(selectedThreadId, savedContact);

        this.handleContactSaveClose();
    };

    clearNumber = () => {
        this.setState({phone: ""});
    };

    removeRates = () => {
        this.setState({rates: null});
    };

    backToGroup = () => {
        const {setSelectedInfoThreadId, app} = this.props;
        setSelectedInfoThreadId(app.previousGroupId);
    };

    onClick = () => {
        const {toggleRightPanel} = this.props;
        toggleRightPanel(false);
        this.getNumbers()
    };

    toggleMutePopUp = () => {
        const {mutePopUp} = this.state;
        Log.i("toggleMutePopUp -> muted = ", this.props.selectedThread.get('members').first().get('muted'))
        this.setState({mutePopUp: !mutePopUp});
    };

    handleSharedMediaPanelOpen = () => {
        this.props.openSharedMedia()
    };

    handleSharedMediaPanelClose = () => {
        this.props.closeSharedMedia()
    };

    handleBlockContactToggle = () => {
        const {blockPopup} = this.state;
        this.setState({blockPopup: !blockPopup});
    };

    handleBlockButtonConfirm = () => {
        this.attemptToggleContactBlocked();
        this.setState({blockPopup: false});
    };

    setUnlimitTimeMute = () => {
        const {mutePopUp} = this.state;
        // const {toggleMuted, selectedThreadId} = this.props;
        // toggleMuted(selectedThreadId);
        this.deleteMuteTime();
        this.setState({mutePopUp: !mutePopUp});
    };

    setMuteTime = (time: number) => {
        const {selectedThreadId, attemptMuteConversation} = this.props;
        // toggleMuted(selectedThreadId);
        attemptMuteConversation(selectedThreadId, time);
        this.toggleMutePopUp();
    };

    deleteMuteTime = () => {
        const {selectedThread, attemptUnmuteConversation, selectedThreadId} = this.props;
        const muted = selectedThread.getIn(["members", selectedThreadId, "muted"]);

        if (muted) {
            attemptUnmuteConversation(selectedThreadId);
        }
    };

    hideOpenPanel = ({target}: any) => {
        const {rates} = this.state;

        if (rates !== null) {
            if (
                target.className !== "rates-popup"
            ) {
                this.removeRates();
            }
        }

    };

    handleContactSaveToggle = () => {
        const {selectedThread} = this.props;
        const {saveContact} = this.state;
        const thread = selectedThread.get("members").first();


        if (saveContact) {
            this.setState({saveContact: false});
        } else {
            this.setState({
                firstName: thread.get("firstName"),
                lastName: thread.get("lastName"),
                phone: thread.get("phone"),
                saveContact: true
            });
        }
    };

    handleContactSaveClose = () => {
        const {saveContact} = this.state;
        if (saveContact) {
            this.setState({saveContact: false, error: false});
        }
    };

    onInputChange = ({currentTarget: {name, value}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value) {
            const newState: any = clone(this.state);
            newState[name] = value;
            this.setState(newState)
        }
    };

    setThreadByNumber = (number: string, productContact: any) => {

        const {savedContacts, attemptSetSelectedThread, selectedThreadId} = this.props;
        const contactId: string = getUserId(number);
        const contact = savedContacts.get(contactId);

        if(productContact) {
            if (contact && !selectedThreadId.includes(number)) {
                attemptSetSelectedThread(contact.toJS());
            }
        } else {
            attemptSetSelectedThread(contact.toJS());
        }


    };

    get contactInfoLeft(): any {
        const {app} = this.props;
        const {editing, saveContact} = this.state;
        const localization: any = components().contactInfoPanel;

        if (app.previousGroupId) {
            return {
                onClick: this.backToGroup,
                className: "back_btn"
            }
        } else if (editing) {
            return {
                onClick: this.closeEditContact,
                className: "cancel_btn",
                text: localization.cancel
            }
        } else if (saveContact) {
            return {
                onClick: this.handleContactSaveClose,
                className: "left_btn",
                text: localization.cancel
            }
        } else {
            return {
                onClick: this.onClick,
                className: "close_btn",
                text: localization.close
            }
        }
    }

    get contactInfoRight(): any {
        const {editing, saveContact} = this.state;
        const {selectedThread} = this.props;
        const localization: any = components().contactInfoPanel;
        const thread = selectedThread.get("members").first();

        if (editing && thread.get("saved")) {
            return {
                onClick: this.updateContact,
                className: "done_btn",
                text: localization.done
            }
        } else if (thread.get("saved")) {
            return {
                onClick: this.toggleEditContact,
                className: "right_btn",
                text: localization.edit
            }
        } else if (saveContact) {
            return {
                onClick: this.saveContact,
                className: "right_btn next_btn_active",
                text: localization.create
            }
        } else {
            return {
                onClick: this.handleContactSaveToggle,
                className: "right_btn",
                text: localization.addContact
            }
        }
    }

    handleStartConversationPopupOpen = () => {
        this.setState({conversationPopup: {isOpened: true, isGroupPopupOpened: false}});
    };

    handleStartConversationPopupClose = () => {
        this.setState({conversationPopup: {isOpened: false, isGroupPopupOpened: false}});
    };

    handleStartGroupPopupOpen = () => {
        this.setState({conversationPopup: {isOpened: false, isGroupPopupOpened: true}});
    };

    handleStartGroupPopupClose = () => {
        this.setState({conversationPopup: {isOpened: false, isGroupPopupOpened: false}});
    };

    handleCopyUserNumber = (): void => {
        const selectionObj: any = window?.getSelection();
        const selectedText = selectionObj?.rangeCount ? selectionObj?.getRangeAt(0)?.toString() : "";

        if (this.userNumberREf?.current && selectedText.length === 0) {
            this.setState({copyIconScale: 1.2});
            setTimeout(() => {
                this.setState({copyIconScale: 1});
            }, 100);

            selectElementText(this.userNumberREf.current);
            document.execCommand('copy');
            clearSelection();
            // const handleClearSelection = () => {
            //     clearSelection();
            //     document.removeEventListener('click', handleClearSelection);
            // };
            // document.addEventListener('click', handleClearSelection);
        }
    };

    conversationNavigate = (contact: IContact) => {
        const {attemptSetSelectedThread, contacts, attemptCreateContact, user} = this.props;
        const contactId: string = contact.contactId;
        const thread = contacts.get(contactId);

        if (thread && thread.has("members")) {
            attemptSetSelectedThread(contacts.get(contactId).toJS());
        } else {
            const labels = [{value: contact.email || contact.phone, label: contact.email ? "home" : "mobile"}];
            attemptCreateContact(contact.contactId, '', '', user.get("username"), contact.phone ? [contact.phone.toString()] : null, false, true, ADD_CONTACT_TYPE.keypadPanel, contact.email ? contact.email : null, labels);
        }
    };

    get content(): JSX.Element {
        const { selectedThread, togglePopUp, lastCall, user, handleAudioChange, sharedMediaPanel, savedContacts, sharedMedia,
            groupConversationCreate, disconnected, app, languages, onlineUsers } = this.props;
        const {editing, firstName, lastName, phone, rates, error, saveContact, conversationPopup, contactNumbers, numbers, editable, copyIconScale} = this.state;
        const isSaved: boolean = !!selectedThread.get("members").first().get("saved");

        const threadInfo = getThread(selectedThread, user.get("username"));
        // const numbers: any = {};
        // const threadNumbers: any = threadInfo.get("numbers");
        const sharedMediaCount: number = fromJS(sharedMedia).get("total");

        // console.log(threadNumbers, "threadNumbers")
        //
        // if (threadNumbers) {
        //     for (const number of threadNumbers) {
        //         if (!numbers[number]) {
        //             const contact = savedContacts.get(getUserId(number));
        //             const contactInfo = contact && contact.get("members").first();
        //
        //             console.log(contactInfo, "contactInfo");
        //
        //             if (contactInfo) {
        //                 numbers[number] = {
        //                     isProductContact: contactInfo.get("isProductContact"),
        //                     favorite: contactInfo.get("favorite"),
        //                     email: APPLICATION.WITHEMAIL ? contactInfo.get("email") : contactInfo.get("username"),
        //                     label: contactInfo.get("label"),
        //                 };
        //             }
        //         }
        //     }
        // } else {
        //     numbers[threadInfo.get("phone")] = {
        //         isProductContact: threadInfo.get("isProductContact"),
        //         favorite: threadInfo.get("favorite"),
        //         email: APPLICATION.WITHEMAIL ? threadInfo.get("email") : threadInfo.get("username"),
        //         label: threadInfo.get("label")
        //     };
        // }
        //
        // console.log(threadInfo, "threadInfo2")


        if (saveContact) {
            return (
                <ContactInfoRight>
                    <ContactForm
                        onInputKeyPress={this.onInputKeyPress}
                        onInputChange={this.onInputChange}
                        clearNumber={this.clearNumber}
                        firstName={firstName}
                        lastName={lastName}
                        phone={phone}
                        error={error}
                        disabledPhoneEdit={true}
                        selectedThread={selectedThread}
                        leftButton={this.contactInfoLeft}
                        rightButton={this.contactInfoRight}
                    />
                </ContactInfoRight>
            );
        } else {
            return (
                <ContactInfo
                    handleBlockContactToggle={this.handleBlockContactToggle}
                    toggleContactFavorite={this.toggleContactFavorite}
                    handleSharedMediaPanelOpen={this.handleSharedMediaPanelOpen}
                    toggleMutePopUp={this.toggleMutePopUp}
                    thread={selectedThread}
                    getRates={this.getRates}
                    lastCall={lastCall}
                    setThreadByNumber={this.setThreadByNumber}
                    rates={rates}
                    numbers={numbers}
                    leftButton={this.contactInfoLeft}
                    rightButton={this.contactInfoRight}
                    editing={editing}
                    firstName={firstName}
                    lastName={lastName}
                    handleInputChange={this.handleInputChange}
                    hadleEmailPast={this.hadleEmailPast}
                    handleEditInputChange={this.handleEditInputChange}
                    handleEditEmailInputChange={this.handleEditEmailInputChange}
                    sharedMediaCount={sharedMediaCount}
                    error={error}
                    user={user}
                    isSaved={isSaved}
                    disconnected={disconnected}
                    contactNumbers={contactNumbers}
                    handleAddClick={this.handleAddClick}
                    handleClearNumber={this.handleClearNumber}
                    handleMobileNumberPast={this.handleMobileNumberPast}
                    handleEditMobileNumberPast={this.handleEditMobileNumberPast}
                    handleEditEmailPast={this.handleEditEmailPast}
                    changeEditable={this.changeEditable}
                    updateEditableContact={this.updateEditableContact}
                    onlineUsers={onlineUsers}
                    conversationPopup={conversationPopup}
                    handleStartConversationPopupOpen={this.handleStartConversationPopupOpen}
                    handleStartGroupPopupOpen={this.handleStartGroupPopupOpen}
                    handleStartConversationPopupClose={this.handleStartConversationPopupClose}
                    handleStartGroupPopupClose={this.handleStartGroupPopupClose}
                    conversationNavigate={this.conversationNavigate}
                    groupConversationCreate={groupConversationCreate}
                    editable={editable}
                    handleMediaPopUpOpen={togglePopUp}
                    showContactDeletePopup={this.handleContactDeletePopupToggle}
                    systemTimeFormat={app.systemTimeFormat}
                    handleCopyUserNumber={this.handleCopyUserNumber}
                    ref={this.userNumberREf}
                    copyIconScale={copyIconScale}
                />
            );
        }
    }

    get popup(): JSX.Element {
        const {deletePopup, mutePopUp, blockPopup} = this.state;
        const {selectedThread, user} = this.props;

        const thread = selectedThread.get("members").first();
        const localization: any = components().contactInfoPanel;
        const muteLocalization = components().muteNotifications;
        const blockLocalization = components().blockedPopUp;
        const blocked: boolean = thread && thread.get("blocked");
        const threadId = selectedThread.getIn(['threads', 'threadId']);

        const username = user.get("username");
        const encodedUsername = btoa(username);
        const mutedConversations = localStorage.getItem(encodedUsername);
        const mutedMap = mutedConversations && JSON.parse(mutedConversations) || {};
        const muteMapObj = mutedMap[threadId]

        return (
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}
            >
                {
                    mutePopUp && !muteMapObj &&
                    <NotificationsPopUp
                        toggleMutePopUp={this.toggleMutePopUp}
                        setUnlimitTimeMute={this.setUnlimitTimeMute}
                        setMuteTime={this.setMuteTime}
                    />
                }

                {
                    mutePopUp && muteMapObj &&
                    <PopUpMain
                        confirmButton={this.setUnlimitTimeMute}
                        confirmButtonText={localization.confirm}
                        cancelButton={this.toggleMutePopUp}
                        cancelButtonText={localization.cancel}
                        titleText={muteLocalization.title}
                        infoText={muteLocalization.turnOff}
                        showPopUpLogo={true}
                    />
                }

                {
                    deletePopup &&
                    <PopUpMain
                        confirmButton={this.handleDeleteContact}
                        confirmButtonText={localization.yes}
                        cancelButton={this.handleContactDeletePopupToggle}
                        cancelButtonText={localization.no}
                        titleText={localization.title}
                        infoText={localization.sureDelete}
                        showPopUpLogo={true}
                    />
                }

                {
                    blockPopup &&
                    <PopUpMain
                        confirmButton={this.handleBlockButtonConfirm}
                        confirmButtonText={blockLocalization.confirm}
                        cancelButton={this.handleBlockContactToggle}
                        cancelButtonText={blockLocalization.cancel}
                        titleText={blocked ? blockLocalization.unblockTitle : blockLocalization.blockTitle}
                        infoText={blocked ? blockLocalization.unblockInfo : blockLocalization.blockInfo}
                        showPopUpLogo={true}
                    />

                }
            </ReactCSSTransitionGroup>
        );
    }

    render(): JSX.Element {
        const thread = this.props.selectedThread && this.props.selectedThread.get("members").first();
        const {togglePopUp,handleAudioChange,app,languages,sharedMediaPanel,sharedMediaCount, selectedThread} = this.props

        if (!thread) {
            return null;
        }

        return (
            <RightPanel style={{position: 'relative'}}>
                <div
                    className="right-panel-content"
                    style={{
                        display: 'block',
                        height:'100%',
                        opacity: sharedMediaPanel ? 1 : 0,
                        zIndex: sharedMediaPanel ? 5 : -2,
                        position:'relative',
                        overflow: 'hidden',
                        transition: '0.3s ease-in-out',
                    }}
                >
                    <SharedMedia
                        togglePopUp={togglePopUp}
                        handleAudioChange={handleAudioChange}
                        handleSharedMediaClose={this.handleSharedMediaPanelClose}
                        systemTimeFormat={app.systemTimeFormat}
                        languages={languages}
                        sharedMediaPanel={sharedMediaPanel}
                        sharedMediaCount={sharedMediaCount}
                    />
                </div>

                <div style={{position: "absolute", height: '100%',top: 0, zIndex: sharedMediaPanel ? 0: 5, width: '100%', opacity: sharedMediaPanel ?  0 : 1, transition: '0.3s ease-in-out'}}>
                    {this.content}
                </div>
                {this.popup}
            </RightPanel>
        )
    }
}
