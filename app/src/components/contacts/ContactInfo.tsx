"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ConversationStartPopup from "components/common/popups/conversation";
import RatesPopUpRight from "components/common/RatesPopUpRight";
import {IMAGE_TOGGLE, SYSTEM_MESSAGE_NUMBER} from "configs/constants";
import {IGroupCreateParams} from "services/interfaces";
import {getLastVisitDate} from "helpers/DateHelper";
import {getThreadType} from "helpers/DataHelper";
import Avatar from "components/contacts/Avatar";
import {ICall} from "modules/call/CallReducer";
import components from "configs/localization";
import conf from "configs/configurations";
import {AvatarSize, DeleteContactBlock, DeleteContactTitle} from "components/contacts/style";
import {bool} from "aws-sdk/clients/signer";


interface IContactInfoProps {
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    setThreadByNumber: (number: string) => void;
    handleSharedMediaPanelOpen: () => void;
    handleBlockContactToggle: () => void;
    toggleContactFavorite: () => void;
    getRates: (phone: string) => void;
    toggleMutePopUp: () => void;
    sharedMediaCount: number;
    firstName: string;
    editing: boolean;
    lastName: string;
    numbers: any;
    lastCall: ICall;
    thread: any;
    rates: {
        currencyCode: string;
        countryName: string;
        phoneCode: string;
        phone: number;
        callBack: {
            quantity: number;
            price: number;
        },
        outCall: {
            quantity: number;
            price: number;
        }
    }

    leftButton?: {
        onClick: () => void;
        className: string;
        text?: string;
        style?: any;
    };
    rightButton?: {
        onClick?: (e, numbersList?: string[], contactInfo?: any) => void;
        className: string;
        text?: string;
    };
    error: boolean;
    user: any;
    isSaved?: boolean;
    disconnected: boolean;

    conversationPopup: any;
    handleStartConversationPopupOpen: () => void;
    handleStartConversationPopupClose: () => void;
    conversationNavigate: (contact: any) => void;
    groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts?: any) => void;

    handleMediaPopUpOpen?: (type: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    showContactDeletePopup?: () => void;
}

export default function ContactInfo(props: IContactInfoProps): JSX.Element {
    const {
        thread, toggleContactFavorite, toggleMutePopUp, showContactDeletePopup,
        handleSharedMediaPanelOpen, handleBlockContactToggle, getRates, lastCall, rates, sharedMediaCount,
        leftButton, rightButton, editing, firstName, lastName, handleInputChange, error, user, numbers, setThreadByNumber,
        isSaved, conversationPopup, handleStartConversationPopupOpen, groupConversationCreate, conversationNavigate,
        handleStartConversationPopupClose, disconnected, handleMediaPopUpOpen
    } = props;

    const threadId = thread.getIn(['threads', 'threadId']);
    const threadType = thread.getIn(['threads', 'threadType']);
    const {isGroup} = getThreadType(threadType);
    const threadInfo = thread.get("members").first();
    const isProductContact: boolean = threadInfo && threadInfo.get('isProductContact');
    const ownChat: boolean = !isGroup && (threadInfo.get("phone") === user.get("phone"));
    const blocked: boolean = threadInfo && threadInfo.get('blocked');
    // const singleConversationName: string = threadInfo && !isGroup && (threadInfo.get("firstName") || threadInfo.get("lastName") ?
    //     threadInfo.get("name") : threadInfo.get("email") ? threadInfo.get("email") : `${!threadInfo.get("name").startsWith("0") ? "+" : ""}${threadInfo.get("name")}`);

    let singleConversationName: string;
    if (threadInfo && !isGroup && threadInfo.get("contactId") === "000000002@msg.hawkstream.com") {
        singleConversationName = "RASED";
    }
    else if (threadInfo && !isGroup && threadInfo.get("contactId") === "111@msg.hawkstream.com") {
        singleConversationName = "RASED Admin";
    } else {
        singleConversationName = threadInfo && !isGroup && (threadInfo.get("firstName") || threadInfo.get("lastName") ? threadInfo.get("name") : threadInfo.get("email") ? threadInfo.get("email") : `${!threadInfo.get("name").startsWith("0") ? "+" : ""}${threadInfo.get("name")}`);
    }

    if (threadInfo.isEmpty()) {
        return null;
    }
    const getRatesForPhone: any = (event, number: string) => getRates(number);
    const localization: any = components().contactInfo;
    const labelLocalization: any = components().contactForm;
    const isInCall: boolean = lastCall && [lastCall.get("caller"), lastCall.get("receiver")].includes(threadInfo.get("id")) && !threadInfo.get("blocked");

    const threadImage: any = {
        url: threadInfo.get("avatarUrl"),
        file: threadInfo.get("avatar"),
    };

    const isSystemChat: boolean = threadInfo && threadInfo.get('phone') && threadInfo.get('phone').includes(SYSTEM_MESSAGE_NUMBER);

    const contactInfo: any = {
        author: threadInfo.get("author"),
        avatar: threadInfo.get("avatar"),
        avatarCharacter: threadInfo.get("avatarCharacter"),
        avatarUrl: threadInfo.get("avatarUrl"),
        blocked: threadInfo.get("blocked"),
        childContactId: threadInfo.get("childContactId"),
        color: {
            avatarColor: threadInfo.get("color").get("avatarColor"),
            numberColor: threadInfo.get("color").get("numberColor")
        },
        contactId: threadInfo.get("contactId"),
        createdAt: threadInfo.get("createdAt"),
        email: threadInfo.get("email"),
        favorite: threadInfo.get("favorite"),
        firstName: threadInfo.get("firstName"),
        image: threadInfo.get("image"),
        imageUrl: threadInfo.get("imageUrl"),
        isProductContact: threadInfo.get("isProductContact"),
        label: threadInfo.get("label"),
        lastActivity: threadInfo.get("lastActivity"),
        lastName: threadInfo.get("lastName"),
        mainId: threadInfo.get("mainId"),
        muted: threadInfo.get("muted"),
        name: threadInfo.get("name"),
        numbers: threadInfo.get("numbers"),
        parentContactId: threadInfo.get("parentContactId"),
        parentMainId: threadInfo.get("parentMainId"),
        phone: threadInfo.get("phone"),
        saved: threadInfo.get("saved"),
        singleProductContact: threadInfo.get("singleProductContact"),
        status: threadInfo.get("status"),
        username: threadInfo.get("username"),
    };

    const numbersList: string[] = Object.keys(numbers);
    const contactInfoNumbers = contactInfo.numbers;
    const contactInfoEmails = contactInfo.email;
    return (
        <div className="contact_info_right">

            <div className={`contact-info-content${!editing ? " transparent" : ""}`}>
                <div className="btn-block">
                    <span
                        className="done_btn"
                        onClick={isSaved ? (e) => rightButton.onClick(e, numbersList, contactInfo) : rightButton.onClick}
                    >{isSaved ? localization.done : localization.create}</span>

                    <span className="cancel_close_btn" onClick={leftButton.onClick}>{localization.cancel}</span>

                </div>
                <div className="image-block">
                    <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                        <Avatar
                            image={threadImage}
                            color={threadInfo.getIn(["color", "numberColor"])}
                            status={threadInfo.get("status")}
                            avatarCharacter={threadInfo.get("avatarCharacter")}
                            name={threadInfo.get("firstName")}
                            meta={{threadId}}
                            contactId={threadInfo.get("contactId")}
                            fontSize={"39px"}
                            iconSize={"120px"}
                            border={"1px solid #F5F5F7"}
                        />
                    </AvatarSize>
                    <div className="edit-inputs">
                        <input
                            placeholder={localization.firstName}
                            data-field="contactName"
                            onChange={handleInputChange}
                            className={`${error ? 'invalid-name' : ''} user-name`}
                            value={firstName}
                            name="firstName"
                            type="text"
                        />
                        <input
                            placeholder={localization.lastName}
                            data-field="contactLastName"
                            className="user-surname"
                            onChange={handleInputChange}
                            value={lastName}
                            name="lastName"
                            type="text"
                        />
                    </div>
                </div>
                <DeleteContactBlock>
                    <DeleteContactTitle
                        color="#D0011B"
                        onClick={showContactDeletePopup}
                    >{localization.deleteContact}
                    </DeleteContactTitle>
                </DeleteContactBlock>
            </div>

            <div className={`contact-info-content${editing ? " transparent" : ""}`}>
                <div className='btn-block'>

                    <span className='edit_btn'
                          onClick={rightButton.onClick}>{isSaved ? localization.edit : localization.addContact}</span>

                    <span className={"cancel_close_btn"} onClick={leftButton.onClick}>{localization.close}</span>

                </div>
                <div className="image-block">
                    <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                        <Avatar
                            image={threadImage}
                            color={threadInfo.getIn(["color", "numberColor"])}
                            status={threadInfo.get("status")}
                            avatarCharacter={threadInfo.get("avatarCharacter")}
                            name={threadInfo.get("firstName")}
                            meta={{threadId}}
                            handleMediaPopUpOpen={handleMediaPopUpOpen}
                            contactId={threadInfo.get("contactId")}
                            fontSize={"39px"}
                            iconSize={"120px"}
                            border={"1px solid #F5F5F7"}
                        />
                    </AvatarSize>
                    <span className="contact-name"><span
                        onClick={rightButton.onClick}>{singleConversationName}</span></span>
                    <div className={`contact-status-info${disconnected ? " visibility-hidden" : ""}`}>
                        {isSystemChat ? <span className="contact-status">{conf.app.name} Notifications</span>
                            :
                            threadInfo.get("status") === "online" && !editing && !blocked
                                ?
                                <span className="contact-status online-contact">{localization.online}</span>
                                :
                                !editing && isProductContact &&
                                <span className="contact-status">
                                    {threadInfo.get("lastActivity") && !blocked ? localization.lastVisit : null} {threadInfo.get("lastActivity") && !blocked ? getLastVisitDate({date: threadInfo.get("lastActivity")}) : null}
                        </span>}
                    </div>
                </div>
                {/*CLOSED for further revision do not delete until contact architecture is final*/}
                {/*{numbers && Object.keys(numbers).map(number =>*/}
                {/*    <div className="number-row" key={number}>*/}
                {/*        <div className="number">*/}
                {/*            <div className="number-type">*/}
                {/*                <span*/}
                {/*                    className={`${Object.keys(numbers).length > 1 && threadId.includes(number) ? "selected-contact " : ""}type-of-number`}>{labelLocalization[numbers[number].label]}</span>*/}
                {/*                {*/}
                {/*                    numbers[number].isProductContact &&*/}
                {/*                    <span className="contact">{localization.productName}</span>*/}
                {/*                }*/}
                {/*                {numbers[number].favorite && <span className="favorites-ico"/>}*/}
                {/*            </div>*/}
                {/*            <span className="number"*/}
                {/*                  onClick={numbers[number].isProductContact ? () => setThreadByNumber(number) : null}*/}
                {/*                  style={(Object.keys(numbers).length > 1 && threadId.includes(number)) ? {*/}
                {/*                      color: "#17ABF6",*/}
                {/*                      cursor: "pointer"*/}
                {/*                  } : Object.keys(numbers).length > 1 ? {cursor: "pointer"} : null}>*/}
                {/*                    {numbers[number].email ? `${numbers[number].email}` : `${!number.startsWith("0") ? "+" : ""}${number}`}*/}
                {/*                    </span>*/}
                {/*        </div>*/}
                {/*        {*/}
                {/*            !numbers[number].email || isSystemChat &&*/}
                {/*            <div className="more-info" onClick={(event) => getRatesForPhone(event, number)}>*/}
                {/*                <span className="more-text">{localization.rates}</span>*/}
                {/*                <span className="more-ico"/>*/}
                {/*            </div>*/}
                {/*        }*/}
                {/*        {rates && rates.phone.toString() === number && <RatesPopUpRight rates={rates}/>}*/}
                {/*    </div>)*/}
                {/*}*/}

                {/*SINCE CONTACT ARCHITECTURE IS WRONG WE ONLY SHOW ONE LABEL PER CONTACT WHICH IS RENDERED BELOW*/}
                <div className="number-row" style={{borderBottom: "none", height: "fit-content"}}>
                    <div className="number">
                        <div className="number-type">
                                <span
                                    className={`type-of-number`}>{labelLocalization[contactInfo.label]}
                                </span>
                            {
                                // numbers[number].isProductContact &&
                                <span className="contact">{localization.productName}</span>
                            }
                            {contactInfo.favorite && <span className="favorites-ico"/>}
                        </div>
                    </div>
                </div>
                {
                    isProductContact && contactInfoEmails && typeof contactInfoEmails === "object" ? contactInfoEmails.map(email => {
                            return (
                                <div className="number-row" key={email}>
                                    <div className="number">
                                        {email}
                                    </div>

                                </div>
                            )
                        }) : isProductContact && contactInfoEmails && typeof contactInfoEmails === "string" ?
                        <div className="number-row" key={contactInfoEmails}>
                        <div className="number">
                            {contactInfoEmails}
                        </div>
                    </div> : ""
                }
                {
                    !isProductContact && contactInfoEmails && typeof contactInfoEmails === "object" ? contactInfoEmails.map(email => {
                        return (
                            <div className="number-row" key={email}>
                                <div className="number">
                                    <span className="number"
                                        // onClick={numbers[number].isProductContact ? () => setThreadByNumber(number) : null}
                                          style={(Object.keys(contactInfoEmails).length > 1 && threadId.includes(email)) ? {
                                              color: "#17ABF6",
                                              cursor: "pointer"
                                          } : Object.keys(numbers).length > 1 ? {cursor: "pointer"} : null}>
                                    {email}
                                </span>
                                </div>
                            </div>
                        )
                    }) : ''
                }
                {
                    (!isProductContact && contactInfoNumbers && (threadInfo.get("contactId") !== "000000002@msg.hawkstream.com" && threadInfo.get("contactId") !== "111@msg.hawkstream.com")) || (isProductContact && contactInfoEmails && contactInfoNumbers) ? contactInfoNumbers.map(number => {
                        if (threadInfo.get("contactId").includes("@msg.hawkstream.com") && number && number.toString() !== threadInfo.get("contactId").slice(0, threadInfo.get("contactId").indexOf("@"))){
                            return (
                                <div className="number-row" key={number}>
                                    <div className="number">
                                <span className="number"
                                      style={(Object.keys(numbers).length > 1 && threadId.includes(number)) ? {
                                          color: "#17ABF6",
                                          cursor: "pointer"
                                      } : Object.keys(numbers).length > 1 ? {cursor: "pointer"} : null}>
                                    {number}
                                </span>
                                    </div>
                                </div>
                            )
                        } else if (!threadInfo.get("contactId").includes("@msg.hawkstream.com")) {
                            return (
                                <div className="number-row" key={number}>
                                    <div className="number">
                                <span className="number"
                                    // onClick={numbers[number].isProductContact ? () => setThreadByNumber(number) : null}
                                      style={(Object.keys(numbers).length > 1 && threadId.includes(number)) ? {
                                          color: "#17ABF6",
                                          cursor: "pointer"
                                      } : Object.keys(numbers).length > 1 ? {cursor: "pointer"} : null}>
                                    {number}
                                </span>
                                    </div>
                                </div>
                            )
                        }
                        }) : ""
                    }
                <div style={{height: "26px"}}/>

                {isProductContact && !ownChat &&
                <div className="create-group" onClick={handleStartConversationPopupOpen}>
                    <span className="create-group-ico"/>
                    <div className="info-block">
                        <span className="create-group-btn">{localization.createGroup}</span>
                        {/*<span className="create-group-ico-next"/>*/}
                    </div>
                </div>}

                {isProductContact && threadInfo.get("saved") &&
                <div className="add-favorites" onClick={toggleContactFavorite}>
                    <span className="add-favorites-ico"/>
                    <div className="info-block">
                        <span
                            className="add-favorites-btn">{threadInfo.get("favorite") ? localization.removeFav : localization.addFav}</span>
                        {/*<span className="add-favorites-ico-next"/>*/}
                    </div>
                </div>}

                {isProductContact &&
                <div className="shared-media" onClick={handleSharedMediaPanelOpen}>
                    <span className="shared-media-ico"/>
                    <div className="info-block">
                        <span className="shared-media-btn">{localization.sharedMedia}</span>
                        <div className="shared-media-icons">
                            <span className="shared-media-length">{sharedMediaCount}</span>
                            <span className="shared-media-ico-next"/>
                        </div>
                    </div>
                </div>}
                {isProductContact && !ownChat &&
                <div className="mute-row" onClick={toggleMutePopUp}>
                    <span className="mute-ico"/>
                    <div className="info-block">
                        <span className="mute-btn">{localization.mute}</span>
                        <div className="mute-icons">
                            <span
                                className="mute-status">{!threadInfo.get("muted") ? localization.muteStatus.on : localization.muteStatus.off}</span>
                            <span className="mute-ico-next"/>
                        </div>
                    </div>
                </div>}
                {!ownChat &&
                <div className="block-contact" onClick={handleBlockContactToggle}>
                    <span className={threadInfo.get("blocked") ? "unblock-contact-ico" : "block-contact-ico"}/>
                    <div className="info-block">
                        {
                            isInCall ? (
                                <span className="block-contact-btn disable">{localization.block}</span>
                            ) : (
                                <span
                                    className="block-contact-btn">{threadInfo.get("blocked") ? localization.unblock : localization.block}</span>
                            )
                        }
                    </div>
                </div>
                }
            </div>

            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={200}>
                {
                    conversationPopup.isOpened &&
                    <ConversationStartPopup
                        groupConversationCreate={groupConversationCreate}
                        conversationNavigate={conversationNavigate}
                        close={handleStartConversationPopupClose}
                        containerState={conversationPopup}
                        contactInfo={contactInfo}
                        user={user.toJS()}
                    />
                }
            </ReactCSSTransitionGroup>

        </div>

    );
};
