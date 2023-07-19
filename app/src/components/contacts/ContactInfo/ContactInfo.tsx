"use strict";

import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ConversationStartPopup from "components/common/popups/conversation";
import RatesPopUpRight from "components/common/RatesPopUpRight";
import {IMAGE_TOGGLE, SYSTEM_MESSAGE_NUMBER, APPLICATION, CONTACT_NUMBER_MAX_LENGTH} from "configs/constants";
import {IGroupCreateParams} from "services/interfaces";
import {getLastVisitDate} from "helpers/DateHelper";
import {getThreadType} from "helpers/DataHelper";
import Avatar from "components/contacts/Avatar";
import {ICall} from "modules/call/CallReducer";
import components from "configs/localization";
import conf from "configs/configurations";
import {
  AvatarSize,
  DeleteContactBlock,
  DeleteContactTitle,
} from "components/contacts/style";
import {
  ContactInfoAction,
  InfoBlock,
  ActionButton,
  ContactInfoProperties,
  PropertyGrey,
  NextIcon,
  ContactNumberRow,
  NumberRowWrapper,
  NumberTypeWrapper,
  NumberType,
  ContactType,
  FavoriteIcon,
  PhoneNumber,
  RatesInfoWrapper,
  ReatesInfoText,
  ContactNameWrap,
  ContactStatusInfoWrapper,
  ContactStatusInfo,
  EditContactInput,
  EditContactInputWrapper,
  ImageBlockWrapper,
  ImageBlock,
  ContactInfoButtonsBlock,
  BlockButton,
  ContactInfoContent,
  ContactInfoRight, LeftSideIcon
} from "./style"
import {
  ContactNumber,
  IconLabelWrapper,
  Input,
  Number,
  PopupBody,
  ValidError
} from "components/common/popups/addContact/style";
import copySvg from 'assets/images/copy.svg';
import TooltipText from "components/common/tooltip/TooltipText";
import GroupStartPopup from "components/common/popups/group";
import {phoneMask} from "helpers/UIHelper";

interface IContactInfoProps {
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hadleEmailPast: (event: React.ChangeEvent<HTMLInputElement>, index: number) => Promise<any>;
  handleEditInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditEmailInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setThreadByNumber: (number: string, string?: string) => void;
  changeEditable: (number: string) => void;
  handleAddClick: (category: string) => void;
  handleClearNumber: (index: number) => void;
  handleMobileNumberPast: (event: any, index: number) => void;
  handleEditMobileNumberPast: (event: any, number: string) => void;
  handleEditEmailPast: (event: any, number: string) => Promise<any>;
  updateEditableContact: (number: string) => void;
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
  contactNumbers: any;
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
    onClick?: (e, numbersList?: string[], contactNumbers?: string[]) => void;
    className: string;
    text?: string;
  };
  error: boolean;
  user: any;
  isSaved?: boolean;
  disconnected: boolean;
  editable: boolean;

  conversationPopup: any;
  handleStartConversationPopupOpen: () => void;
  handleStartGroupPopupOpen: () => void;
  handleStartConversationPopupClose: () => void;
  handleStartGroupPopupClose: () => void;
  conversationNavigate: (contact: any) => void;
  groupConversationCreate: (group: any, username: string, setThread: boolean, details: IGroupCreateParams, contacts?: any) => void;

  handleMediaPopUpOpen?: (type: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
  handleCopyUserNumber?: () => void;
  showContactDeletePopup?: () => void;
  systemTimeFormat?: string;
  onlineUsers: any;
  copyIconScale?: number;
}

const ContactInfo: any = React.forwardRef((props: IContactInfoProps, userNumberRef: any): JSX.Element =>  {
  const {
    thread, toggleContactFavorite, toggleMutePopUp, showContactDeletePopup,
    handleSharedMediaPanelOpen, handleBlockContactToggle, getRates, lastCall, rates, sharedMediaCount,
    leftButton, rightButton, editing, firstName, lastName, handleInputChange, hadleEmailPast, handleEditInputChange, handleEditEmailInputChange, error, user, numbers, setThreadByNumber,
    isSaved, conversationPopup, handleStartConversationPopupOpen, handleStartGroupPopupOpen, groupConversationCreate, conversationNavigate,
    handleStartConversationPopupClose, handleStartGroupPopupClose, disconnected, handleMediaPopUpOpen, systemTimeFormat, contactNumbers, handleAddClick,
    handleClearNumber, handleMobileNumberPast, changeEditable, handleEditMobileNumberPast, handleEditEmailPast, updateEditableContact, onlineUsers, editable,
    handleCopyUserNumber, copyIconScale,
  } = props;

  const threadId = thread.getIn(['threads', 'threadId']);
  const threadType = thread.getIn(['threads', 'threadType']);
  const {isGroup} = getThreadType(threadType);
  const threadInfo = thread.get("members").first();
  const isProductContact: boolean = threadInfo && threadInfo.get('isProductContact');
  const ownChat: boolean = !isGroup && (threadInfo.get("phone") === user.get("phone"));
  const blocked: boolean = threadInfo && threadInfo.get('blocked');
  const contactName: string = APPLICATION.WITHEMAIL ? "email" : "username"

  if (threadInfo.isEmpty() || undefined) {
    return null;
  }
  const singleConversationName: string = threadInfo && !isGroup && (threadInfo.get("firstName") || threadInfo.get("lastName") ?
      threadInfo.get("name") : threadInfo.get("email") ? threadInfo.get(contactName) : `${threadInfo.get("name")}`);

  const getRatesForPhone: any = (event, number: string) => getRates(number);
  const localization: any = components().contactInfo;
  const localization2: any = components().contactInfoPanel;

  const labelLocalization: any = components().contactForm;
  const isInCall: boolean = lastCall && [lastCall.get("caller"), lastCall.get("receiver")].includes(threadInfo.get("id")) && !threadInfo.get("blocked");

  const threadImage: any = {
    url: threadInfo.get("avatarUrl"),
    file: threadInfo.get("avatar"),
  };

  const isSystemChat: boolean = threadInfo && threadInfo.get('phone') && threadInfo.get('phone').includes(SYSTEM_MESSAGE_NUMBER);

  const getNotificationStatus = () => {
    if (threadInfo.get("muted")) {
      const username = user.get("username");
      const encodedUsername = btoa(username);
      const mutedConversations = localStorage.getItem(encodedUsername);
      const mutedMap = mutedConversations && JSON.parse(mutedConversations) || {};
      const muteMapObj = mutedMap[threadId]
      const curDate = new Date()
      if (!muteMapObj) {
        return localization.muteStatus.on
      }
      if (muteMapObj.year - curDate.getFullYear() > 2) {
        return localization.muteStatus.off
      }
      if (muteMapObj.date - curDate.getDate() > 0) {
        return `Until Tomorow ${muteMapObj.hour}`
      }

      return `Until ${muteMapObj.hour}`

    }
    return localization.muteStatus.on
  }

  const contactInfo: any = {
    author: threadInfo.get("author"),
    avatar: threadInfo.get("avatar"),
    avatarCharacter: threadInfo.get("avatarCharacter"),
    avatarUrl: threadInfo.get("avatarUrl"),
    blocked: threadInfo.get("blocked"),
    childContactId: threadInfo.get("childContactId"),
    color: {
      avatarColor: threadInfo.get("color") && threadInfo.getIn(["color", "avatarColor"]),
      numberColor: threadInfo.get("color") && threadInfo.getIn(["color", "numberColor"])
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
    lastActivity: onlineUsers.get(threadId) && onlineUsers.get(threadId).get("lastActivity") ? onlineUsers.get(threadId).get("lastActivity") : '',
    lastName: threadInfo.get("lastName"),
    mainId: threadInfo.get("mainId"),
    muted: threadInfo.get("muted"),
    name: threadInfo.get("name"),
    numbers: threadInfo.get("numbers"),
    parentContactId: threadInfo.get("parentContactId"),
    parentMainId: threadInfo.get("parentMainId"),
    phone: threadInfo.get("phone"),
    saved: threadInfo.get("saved"),
    singleProductContact: threadInfo.get("singleProductContact") ? threadInfo.get("singleProductContact") : false,
    status: onlineUsers.get(threadId) && onlineUsers.get(threadId).get("status"),
    username: threadInfo.get("username"),
  };
  const numbersList: string[] = Object.keys(numbers);

  const boolRequestLoading = Object.values(numbers).some(item => {
    // @ts-ignore
    return item.requestLoading
  })

  // @ts-ignore
  // @ts-ignore
  return (
      <ContactInfoRight>
        <ContactInfoContent editing={editing}>
          <ContactInfoButtonsBlock>
            <BlockButton primaryColor onClick={leftButton.onClick}>{localization.cancel}</BlockButton>
            <BlockButton primaryColor
                         bold={true}
                         onClick={
                           isSaved ? (e) => rightButton.onClick(e, numbersList, contactNumbers) : rightButton.onClick}>
              {editable ?
                  <div
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
                  </div> :
                  isSaved ? localization.done : localization.create
              }
            </BlockButton>
          </ContactInfoButtonsBlock>
          <ImageBlockWrapper>
            <ImageBlock>
              <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                <Avatar
                    image={threadImage}
                    color={threadInfo.getIn(["color", "numberColor"])}
                    status={onlineUsers.get(threadId) && onlineUsers.get(threadId).get("status")}
                    avatarCharacter={threadInfo.get("avatarCharacter")}
                    name={threadInfo.get("firstName")}
                    meta={{threadId}}
                    fontSize={"39px"}
                    iconSize={"120px"}
                    border={"1px solid #F5F5F7"}
                    avatarBlobUrl={threadInfo.get("avatarBlobUrl")}
                />
              </AvatarSize>
              <EditContactInput
                  placeholder={localization.firstName}
                  data-field="contactName"
                  onChange={handleInputChange}
                  value={firstName}
                  name="firstName"
                  type="text"
                  error={error}
              />
              <EditContactInput
                  placeholder={localization.lastName}
                  data-field="contactLastName"
                  onChange={handleInputChange}
                  value={lastName}
                  name="lastName"
                  type="text"
                  error={error}
              />
              <EditContactInputWrapper>
                <ContactNumber>
                  <ReactCSSTransitionGroup
                      transitionName="list-item"
                      transitionAppear={true}
                      transitionAppearTimeout={500}
                      transitionEnter={true}
                      transitionEnterTimeout={500}
                      transitionLeave={true}
                      transitionLeaveTimeout={300}>
                    {contactNumbers.map((number, index) => {
                      let borderBottom = "1px solid #E5E7EA"
                      return (
                          (!APPLICATION.WITHEMAIL || (APPLICATION.WITHEMAIL && number.category === "number")) && <div
                              style={{
                                position: "relative"
                              }}
                              key={index}>
                            <Number
                                // style={{
                                //   borderBottom: (number.isValid && number.value) ? "1px solid #1CBEFD" : number.value ? "1px solid #F51815" : "1px solid #E5E7EA"
                                // }}
                                // isValid={number.isValid}
                            >
                              <IconLabelWrapper>
                                {/*{phoneNumbers.length > 1 &&*/}
                                <LeftSideIcon
                                    src={"assets/images/remove-item.svg"}
                                    onClick={() => {
                                      handleClearNumber(index)
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
                                  placeholder={localization.contactNumber}
                                  data-field="contactNumber"
                                  onChange={handleInputChange}
                                  data-index={index}
                                  onPaste={(event) => {
                                    handleMobileNumberPast(event, index)
                                  }}
                                  value={phoneMask(number.value)}
                                  isValid={number.isValid}
                                  name="number"
                                  type="text"
                              />
                            </Number>
                            {number.errorMessage !== "" && <ValidError>{number.errorMessage}</ValidError>}
                            {number.loading && <div
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
                          </div>
                          // <EditContactInput
                          //   // key={number + index}
                          //   placeholder={localization.contactNumber}
                          //   data-field="contactNumber"
                          //   data-index={index}
                          //   onChange={handleInputChange}
                          //   value={number}
                          //   name="number"
                          //   type="text"
                          //   error={error}
                          // />
                      )
                    })}
                  </ReactCSSTransitionGroup>
                </ContactNumber>
                <ContactInfoAction onClick={() => handleAddClick("number")}>
                  <InfoBlock>
                    <LeftSideIcon
                        src={"assets/images/add-item.svg"}
                        draggable={false}
                        alt=""
                    />
                    <ActionButton>{labelLocalization.addNumber}</ActionButton>
                  </InfoBlock>
                </ContactInfoAction>
                {APPLICATION.WITHEMAIL && <>
                  <ContactNumber>
                    <ReactCSSTransitionGroup
                        transitionName="list-item"
                        transitionAppear={true}
                        transitionAppearTimeout={500}
                        transitionEnter={true}
                        transitionEnterTimeout={500}
                        transitionLeave={true}
                        transitionLeaveTimeout={300}>
                      {contactNumbers.map((number, index) => {
                        let borderBottom = "1px solid #E5E7EA"
                        return (
                            number.category === "email" && <div
                                style={{
                                  position: "relative"
                                }}
                                key={index}>
                              <Number
                                  // style={{
                                  //   borderBottom: (number.isValid && number.value) ? "1px solid #1CBEFD" : number.value ? "1px solid #F51815" : "1px solid #E5E7EA"
                                  // }}
                                  // isValid={number.isValid}
                              >
                                <IconLabelWrapper>
                                  {/*{phoneNumbers.length > 1 &&*/}
                                  <LeftSideIcon
                                      src={"assets/images/remove-item.svg"}
                                      onClick={() => {
                                        handleClearNumber(index)
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
                                    placeholder={localization.contactEmail}
                                    data-field="contactNumber"
                                    onChange={handleInputChange}
                                    data-index={index}
                                    onPaste={(event) => {
                                      hadleEmailPast(event, index)
                                    }}
                                    value={number.email}
                                    isValid={number.isValid}
                                    name="email"
                                    type="text"
                                />
                              </Number>
                              {number.errorMessage !== "" && <ValidError>{number.errorMessage}</ValidError>}
                              {number.loading && <div
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
                            </div>
                            // <EditContactInput
                            //   // key={number + index}
                            //   placeholder={localization.contactNumber}
                            //   data-field="contactNumber"
                            //   data-index={index}
                            //   onChange={handleInputChange}
                            //   value={number}
                            //   name="number"
                            //   type="text"
                            //   error={error}
                            // />
                        )
                      })}
                    </ReactCSSTransitionGroup>
                  </ContactNumber>
                  <ContactInfoAction onClick={() => handleAddClick("email")}>
                    <InfoBlock>
                      <LeftSideIcon
                          src={"assets/images/add-item.svg"}
                          draggable={false}
                          alt=""
                      />
                      <ActionButton>{labelLocalization.addEmail}</ActionButton>
                    </InfoBlock>
                  </ContactInfoAction>
                </>}
              </EditContactInputWrapper>
            </ImageBlock>
          </ImageBlockWrapper>

          <DeleteContactBlock>
            <DeleteContactTitle
                color="#D0011B"
                onClick={showContactDeletePopup}
            >{localization.deleteContact}
            </DeleteContactTitle>
          </DeleteContactBlock>
        </ContactInfoContent>
        <ContactInfoContent editing={!editing}>
          <ContactInfoButtonsBlock>
            <BlockButton primaryColor onClick={leftButton.onClick}>{localization.close}</BlockButton>
            {((isSaved && !editable) || boolRequestLoading) &&
            <BlockButton primaryColor onClick={rightButton.onClick}>{localization.edit}</BlockButton>}
            {(!isSaved && !editable && !boolRequestLoading) &&
            <BlockButton primaryColor onClick={rightButton.onClick}>{localization.addContact}</BlockButton>}
          </ContactInfoButtonsBlock>
          <ImageBlockWrapper>
            <ImageBlock>
              <AvatarSize width="120px" height="120px" margin="45px 0 16px 0">
                <Avatar
                    image={threadImage}
                    color={threadInfo.getIn(["color", "numberColor"])}
                    status={onlineUsers.get(threadId) && onlineUsers.get(threadId).get("status")}
                    avatarCharacter={threadInfo.get("avatarCharacter")}
                    name={threadInfo.get("firstName")}
                    meta={{threadId}}
                    handleMediaPopUpOpen={handleMediaPopUpOpen}
                    fontSize={"39px"}
                    iconSize={"120px"}
                    border={"1px solid #F5F5F7"}
                    avatarBlobUrl={threadInfo.get("avatarBlobUrl")}
                />
              </AvatarSize>
              <ContactNameWrap onClick={rightButton.onClick}>
                {singleConversationName}
              </ContactNameWrap>
              <ContactStatusInfoWrapper disconnected={disconnected}>
                {isSystemChat ?
                    <ContactStatusInfo>
                      {conf.app.name} Notifications
                    </ContactStatusInfo>
                    :
                    onlineUsers.get(threadId) && onlineUsers.get(threadId).get("status") === "online" && !editing && !blocked
                        ?
                        <ContactStatusInfo online={true}>
                          {localization.online}
                        </ContactStatusInfo>
                        :
                        !editing && isProductContact &&
                        <ContactStatusInfo>
                          {onlineUsers.get(threadId) && onlineUsers.get(threadId).get("lastActivity") && !blocked ? localization.lastVisit : null} {onlineUsers.get(threadId) && onlineUsers.get(threadId).get("lastActivity") && !blocked ? getLastVisitDate({date: onlineUsers.get(threadId).get("lastActivity"), systemTimeFormat}) : null}
                        </ContactStatusInfo>
                }
              </ContactStatusInfoWrapper>
            </ImageBlock>
          </ImageBlockWrapper>

          {numbers && Object.keys(numbers).map((number, index) => {

                let itemText;
                if (numbers[number].requestLoading) {
                  itemText = ""
                } else {
                  if (!numbers[number].editable) {
                    itemText = localization.edit
                  } else {
                    itemText = localization2.save
                  }
                }
                return (<ContactNumberRow
                    style={{
                      marginBottom: index === Object.keys(numbers).length - 1 ? "0px" : "5px",
                      borderBottom: !numbers[number].editable ? "1px solid #edf2f9" : "unset",
                      height: "auto"
                    }}
                    key={number}>
                  <NumberRowWrapper style={{
                    width: "100%"
                  }} >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      minHeight: "31px"
                    }} >
                      <NumberTypeWrapper>
                        <NumberType threadId={threadId} numbers={numbers} number={number}>
                          {isProductContact ? labelLocalization.appNumber : labelLocalization[numbers[number].label] || labelLocalization.mobile}
                          {/*{labelLocalization[numbers[number].label]}*/}
                        </NumberType>
                        {!isProductContact && <ContactType>
                          {localization.productName}
                        </ContactType>}
                        {threadInfo.get("favorite") && <FavoriteIcon/>}
                      </NumberTypeWrapper>
                      {isSaved && <BlockButton style={{
                        alignSelf: "start",
                        margin: "8px"
                      }}
                                               primaryColor
                                               onClick={() => {
                                                 if (!numbers[number].editable) {
                                                   changeEditable(number)
                                                 } else {
                                                   updateEditableContact(number)
                                                 }
                                               }}
                      >
                        {itemText}
                      </BlockButton>}
                      {numbers[number].requestLoading && <div
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px"
                          }}
                          className="loader-item">
                        <div className="circular-loader">
                          <div className="loader-item-stroke">
                            <div className="loader-item-stroke-left"/>
                            <div className="loader-item-stroke-right"/>
                          </div>
                        </div>
                      </div>}
                    </div>
                    {!numbers[number].editable ? <PhoneNumber
                            style={{
                              margin: "5px 0"
                            }}
                            threadId={threadId}
                            numbers={numbers}
                            number={number}
                            scale={copyIconScale}
                            onClick={() => {
                              setThreadByNumber(number, numbers[number].isProductContact);
                              handleCopyUserNumber();
                            }}
                        >
                          <span ref={userNumberRef}>
                            {numbers[number].email ? `${phoneMask(numbers[number].email)}` : `${!number.startsWith("0") ? "+" : ""}${phoneMask(number)}`}
                          </span>
                          <TooltipText content="copy" className="right-side-user-number-copy-tooltip" withDefaultStyles={false}>
                            <img src={copySvg} alt="copy icon" className="copy-icon"/>
                          </TooltipText>
                        </PhoneNumber> :
                        <Number
                            style={{
                              height: "26px",
                            }}
                        >
                          <Input
                              style={{
                                padding: "0px",
                              }}
                              // maxLength={CONTACT_NUMBER_MAX_LENGTH}
                              placeholder={localization.addContact}
                              data-field="contactNumber"
                              onChange={APPLICATION.WITHEMAIL && (+numbers[number].email !== +numbers[number].email) ? handleEditEmailInputChange : handleEditInputChange}
                              data-index={number}
                              onPaste={(event) => {
                                if (APPLICATION.WITHEMAIL && (+numbers[number].email !== +numbers[number].email)) {
                                  handleEditEmailPast(event, number)
                                } else {
                                  handleEditMobileNumberPast(event, number)
                                }
                              }}
                              value={phoneMask(numbers[number].email)}
                              isValid={numbers[number].isValid}
                              name="number"
                              type="text"
                          />
                        </Number>
                    }
                    {numbers[number].errorMessage && <ValidError style={{
                      margin: "3px 0 0"
                    }} >{numbers[number].errorMessage}</ValidError>}
                    {numbers[number].loading && <div
                        style={{
                          position: "absolute",
                          bottom: "5px",
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
                  </NumberRowWrapper>
                  {/*<div className="loader">*/}
                  {/*  <div className="circular-loader">*/}
                  {/*    <div className="loader-stroke">*/}
                  {/*      <div className="loader-stroke-left"/>*/}
                  {/*      <div className="loader-stroke-right"/>*/}
                  {/*    </div>*/}
                  {/*  </div>*/}
                  {/*</div>*/}
                  {
                    !numbers[number].email || isSystemChat &&
                    <RatesInfoWrapper onClick={(event) => getRatesForPhone(event, number)}>
                      <ReatesInfoText>
                        {localization.rates}
                      </ReatesInfoText>
                      {/*<span className="more-ico"/>*/}
                    </RatesInfoWrapper>
                  }
                  {rates && rates.phone.toString() === number && <RatesPopUpRight rates={rates}/>}
                </ContactNumberRow>)
              }
          )
          }
          <div style={{height: "26px"}}/>

          {isProductContact && !ownChat &&
          <ContactInfoAction onClick={handleStartGroupPopupOpen}>
            <InfoBlock>
              <ActionButton>
                {localization.createGroup}
              </ActionButton>
            </InfoBlock>
          </ContactInfoAction>
          }
          {isProductContact && threadInfo.get("saved") &&
          <ContactInfoAction onClick={toggleContactFavorite}>
            <InfoBlock>
              <ActionButton>
                {threadInfo.get("favorite") ? localization.removeFav : localization.addFav}
              </ActionButton>
            </InfoBlock>
          </ContactInfoAction>
          }
          {isProductContact &&
          <ContactInfoAction onClick={handleSharedMediaPanelOpen}>
            <InfoBlock>
              <ActionButton>
                {localization.sharedMedia}
              </ActionButton>
              <ContactInfoProperties>
                <PropertyGrey>
                  {sharedMediaCount}
                </PropertyGrey>
                <NextIcon />
              </ContactInfoProperties>
            </InfoBlock>
          </ContactInfoAction>
          }
          {isProductContact && !ownChat &&
          <ContactInfoAction onClick={toggleMutePopUp}>
            <ActionButton>
              {localization.mute}
            </ActionButton>
            <ContactInfoProperties>
              <PropertyGrey>
                {getNotificationStatus()}
              </PropertyGrey>
              <NextIcon />
            </ContactInfoProperties>
          </ContactInfoAction>}
          {!ownChat &&
          <ContactInfoAction onClick={handleBlockContactToggle}>
            <InfoBlock>
              <ActionButton>
                {
                  isInCall ? (
                      <span className="block-contact-btn disable">{localization.block}</span>
                  ) : (
                      <span
                          className="block-contact-btn">{threadInfo.get("blocked") ? localization.unblock : localization.block}</span>
                  )
                }
              </ActionButton>
            </InfoBlock>
          </ContactInfoAction>}
        </ContactInfoContent>





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
          {
            conversationPopup.isGroupPopupOpened &&
            <GroupStartPopup
                groupConversationCreate={groupConversationCreate}
                conversationNavigate={conversationNavigate}
                close={handleStartGroupPopupClose}
                containerState={conversationPopup}
                contactInfo={contactInfo}
                user={user.toJS()}
            />
          }
        </ReactCSSTransitionGroup>
      </ContactInfoRight>
  );
});

export default ContactInfo;
