"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {profileList} from "requests/profileRequest";
import BlobImage from "components/common/BlobImage";
import {getThumbnail} from "helpers/FileHelper";
import {fetchFile} from "requests/fsRequest";
import {SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import {getUserId} from "helpers/DataHelper";
import {ContactBlock, ContactIcon, ContactInfo, ContactName} from "components/messages/ContactMessage/style";
import {SearchText} from "components/messages/style";

interface IContactMessageProps {
    updateMessageProperty: (msgId, property, value, updateToDb?: boolean) => void;
    attemptSetCreateContactNumber: (phone: string) => void;
    message?: any;
    searchedActiveMessage?: string;
    language: string;
    attemptCreateContact: (id: string, firstName: string, lastName: string, author: string, phone: string[], saved: boolean, setThreadId: boolean, type: number, email: string[], labels: any[]) => void,

    attemptSetSelectedThread: (threadId: any) => void;
    userId: string;
    contacts: any
}

interface IContactMessageState {
    number: string;
    isProductContact: boolean;
    contactAvatar: any;
    highlightText: string;
}

export default class ContactMessage extends React.Component<IContactMessageProps, IContactMessageState> {

    mounted: boolean = true;

    constructor(props) {
        super(props);

        this.state = {
            number: "",
            isProductContact: false,
            highlightText: "",
            contactAvatar: null,
        }
    };

    async componentDidMount() {
        const {message, updateMessageProperty} = this.props;
        const msgInfo: string = message.get("info");

        document.addEventListener("messageSearch", this.handleMessageEvent);
        if (msgInfo && msgInfo.includes("fullNumber")) {
            const contactInfo: any = JSON.parse(msgInfo)[0];
            if (contactInfo && this.mounted) {

                let contactNumber = contactInfo.fullNumber;
                if (contactInfo.email && contactInfo.email.length > 0) {
                    contactNumber = contactInfo.number;
                }
                this.setState({number: contactNumber});

                if (message.get("m_options") && !message.get("m_options").isEmpty()) {

                    const messageInfo = message.get("m_options").toJS();
                    this.setState({
                        isProductContact: true,
                        contactAvatar: `data:image/jpeg;base64,${messageInfo.img}`
                    });

                } else if (contactInfo.zangi) {

                    const {data: {body}}: any = await profileList([contactInfo.fullNumber]);
                    const response = body[contactInfo.fullNumber];
                    if (response.avatarUrl) {

                        const imageBlob = await fetchFile(response.avatarUrl);

                        const imageFile: Blob = imageBlob.type.includes('xml') || imageBlob.type.includes('html') ? null : imageBlob;
                        const avatarThumb: any = imageFile ? await getThumbnail(imageFile) : "";

                        updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", avatarThumb);
                        updateMessageProperty(message.get("messageId") || message.get("id"), "m_options", avatarThumb, true);
                        this.setState({
                            isProductContact: contactInfo.zangi,
                            contactAvatar: `data:image/jpeg;base64,${avatarThumb.img}`
                        });

                    }

                }
            }
        }
    }

    shouldComponentUpdate(nextProps: IContactMessageProps, nextState: IContactMessageState): boolean {
        const {message, searchedActiveMessage, language} = this.props;

        if (!message.equals(nextProps.message)) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if(!isEqual(language, nextProps.message)) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentWillUnmount(): void {
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        this.mounted = false;
    }

    handleMessageEvent = ({detail: {messageIds, text}}: any): void => {
        const {message} = this.props;
        const {highlightText} = this.state;
        const msgId: string = message.get("messageId") || message.get("id");
        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleContactCreate = () => {
        const {number} = this.state;
        const {message, contacts} = this.props;
        const {attemptCreateContact, attemptSetSelectedThread, userId} = this.props;

        const msgInfo: string = message.get("info");

        const creator: string = message.get("creator");
        if (creator.substr(0, creator.indexOf("@")) === userId) {
            const contact = contacts.get(`${number}@${SINGLE_CONVERSATION_EXTENSION}`).toJS();
            attemptSetSelectedThread(contact)
        } else {
            const firstName: string = message.get("firstName") || message.get("text");
            const lastName: string = message.get("lastName") || "";

            const phone: string[] = JSON.parse(msgInfo).map(item => !item.email ? item.fullNumber : "").filter(number => number !== "");
            const email: string[] = JSON.parse(msgInfo).map(item => item.email || "").filter(email => email !== "");

            const labels: any[] = JSON.parse(msgInfo).map(item => {
                    return {value: item.email || item.fullNumber, label: item.type}
                }
            );

            if (number) {
                attemptCreateContact(getUserId(phone), firstName, lastName, creator, phone.length ? phone : null, false, true, 1, email.length ? email : null, labels)
            }
        }
    };

    render()
        :
        JSX.Element {
        const {message, searchedActiveMessage} = this.props;
        const {isProductContact, contactAvatar, highlightText} = this.state;
        const msgId: string = message.get("messageId") ? message.get("messageId") : message.get("id");
        let filteredText = message.get("text");
        if (highlightText) {
            const highlightTextArr = filteredText.replace(/<[^>]*>/g, '').match(new RegExp(`${highlightText}`, "gi"));
            if (highlightTextArr && highlightTextArr.length > 0) {
                filteredText = filteredText.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText}`, "gi"), match => {
                    return `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                });
            }
        }

        return (
            <ContactBlock>
                {
                    isProductContact && contactAvatar ?
                        <BlobImage image={contactAvatar} width={35} height={35}/> :
                        <ContactIcon/>
                }
                <ContactInfo>
                    {
                        highlightText ? <ContactName onClick={this.handleContactCreate}
                                              dangerouslySetInnerHTML={{__html: filteredText}}/> :
                            <ContactName onClick={this.handleContactCreate}>{filteredText}</ContactName>
                    }
                </ContactInfo>
            </ContactBlock>
        );
    }
}
;
