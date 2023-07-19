import * as React from "react";
import isEqual from "lodash/isEqual";
import {List, Map} from "immutable";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";

import {
    getThread,
    getPartialId,
    getThreadType,
    getUserId,
    isGroupOrCallAction,
    isMediaOrLocation,
    isPublicRoom
} from "helpers/DataHelper";
import {AUDIO_TYPES, CALL_STATUSES, MESSAGE_TYPES, TYPING_LIST_SIZE, APPLICATION} from "configs/constants";
import {getMessageText, unEscapeText} from "helpers/MessageHelper";
import {IMessage} from "modules/messages/MessagesReducer";
import {getFormattedDate} from "helpers/DateHelper";
import Avatar from "components/contacts/Avatar";
import {getName} from "helpers/ContactsHelper";
import components from "configs/localization";
import {emojify} from "helpers/EmojiHelper";
import "scss/pages/left-panel/ThreadBlock";
import {AvatarSize} from "components/contacts/style";
import {IsDeliveryWaiting, StatusMessage} from "components/messages/style";
import Log from "modules/messages/Log";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import {changingConferenceDetails, initialized, showConference} from "modules/conference/ConferenceActions";
import {removeRequest} from "modules/requests/RequestsActions";

interface IThreadState {
    selectedId: string;
}

interface IThreadProps {
    onRightClick?: (event: React.MouseEvent<HTMLLIElement>) => void;
    isOnline?: boolean;
    toggleDeletePopup: (threadId: string) => void;
    fetchTread: any;
    setSelectedThreadId: (threadId: string) => void;
    thread: any;
    // selectedThreadID: string;
    lastMessage: IMessage;
    userId: string;
    pendingRequests:any;
    contacts: any;
    draft?: any;
    selectedLanguage: string;

    lastCall?: any;
    time?: string;
    hangUp?: (e: React.MouseEvent<HTMLSpanElement>) => void;
    toggleMic?: (e: React.MouseEvent<HTMLSpanElement>) => void;
    acceptCall?: (isVideo?: boolean) => void;
    declineCall?: () => void;
    selectedThreadId: string;
    conferenceInfo?: any;
    checkConference?: (groupId: string, callId: string) => void;
}

export default class Thread extends React.Component<IThreadProps, IThreadState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedId: "",
        }
    }

    shouldComponentUpdate(nextProps: IThreadProps, nextState:IThreadState): boolean {
        const {thread, lastMessage, contacts, selectedThreadId, draft, lastCall, time, isOnline} = this.props;

        if (this.state.selectedId !== nextState.selectedId) {
            return true;
        }

        if (selectedThreadId != nextProps.selectedThreadId) {
            return true;
        }

        if (isOnline !== nextProps.isOnline) {
            return true
        }

        if (!thread.equals(nextProps.thread)) {
            return true;
        }

        if (lastMessage && nextProps.lastMessage && !lastMessage.equals(nextProps.lastMessage)) {
            return true;
        }

        if (draft !== nextProps.draft) {
            return true;
        }

        // if (selectedThreadID != nextProps.selectedThreadID) {
        //     // Todo check this and maybe remove
        //     const threadId = thread.getIn(['threads', 'threadId']);
        //     if (threadId === selectedThreadID || threadId === nextProps.selectedThreadID) {
        //         return true;
        //     }
        // }

        if (lastCall && !lastCall.equals(nextProps.lastCall)) {
            return true;
        }

        if (!lastCall && !!nextProps.lastCall) {
            return true;
        }

        if (time !== nextProps.time) {
            return true;
        }

        if (this.props.selectedLanguage !== nextProps.selectedLanguage) {
            return true;
        }

        if (!isEqual(this.props.conferenceInfo, nextProps.conferenceInfo)) {
            return true;
        }


        return !contacts.equals(nextProps.contacts);
    }

    componentDidMount() {
        // const store: Store<any> = storeCreator.getStore();
        // const {thread, pendingRequests} = this.props;
        // const groupId: string = getPartialId(thread.getIn(["threads", "threadId"]));
        //
        // if (pendingRequests.size > 0 && pendingRequests.get(groupId)) {
        //     const callId = pendingRequests.getIn([groupId, "params", "callId"])
        //     const threadId = pendingRequests.getIn([groupId, "params", "threadId"])
        //     const messageInfo = pendingRequests.getIn([groupId, "params", "messageInfo"]).toJS()
        //     const from = pendingRequests.getIn([groupId, "params", "from"])
        //     const initiator = pendingRequests.getIn([groupId, "params", "initiator"])
        //     store.dispatch(initialized());
        //     store.dispatch(changingConferenceDetails(callId, threadId, messageInfo, from, initiator))
        //     store.dispatch(removeRequest(groupId));
        // }
    }

    handleCheckConference = (e: React.MouseEvent<HTMLElement>): void => {
        e.preventDefault();
        const store: Store<any> = storeCreator.getStore();
        const dispatch: any = store.dispatch;
        const {thread, checkConference, conferenceInfo} = this.props;
        Log.i("conference -> checkConference -> thread = ", thread)
        Log.i("conference -> conferenceInfo -> ", conferenceInfo.threadId)
        const groupId: string = getPartialId(thread.getIn(["threads", "threadId"]));

        const callId: string = thread.getIn(["threads", "threadInfo", "callId"])
        if (conferenceInfo.threadId) {
            return
        }
        Log.i("conference -> groupId -> ", groupId)
        dispatch(showConference())
        checkConference(groupId, callId);
    };

    handleDeletePopupOpen = (event: React.MouseEvent<HTMLDivElement>, data: { threadId: string }) => {
        const {toggleDeletePopup} = this.props;

        toggleDeletePopup(data.threadId)
    };

    handleFetchThread = (e: React.MouseEvent<HTMLElement>): void => {
        const threadId: string = e.currentTarget.getAttribute('data-thread-id');

        // this.setState({selectedId: threadId})

        if (threadId !== this.props.selectedThreadId) {
            this.props.fetchTread((window as any).isRefactor ? threadId : this.props.thread);
        }
    };

    get typing() {
        const {thread} = this.props;
        const typingList: any = thread.getIn(['conversations', 'typing']);
        const threadId: string = thread.getIn(["threads", "threadId"]);
        let text: string = "typing";
        let names: any;

        if (isPublicRoom(threadId)) {



            names = typingList.map(username => {
                const contactId: string = getUserId(username);
                return getName(contactId, true);
            });

            const restSize: number = names.size - TYPING_LIST_SIZE;
            text = names.slice(0, 3).join(", ");

            if (restSize > 0) {
                text = `${text} and ${restSize} more`
            }
        }

        return (
            <div className="thread-typing">
                <div className="typing-animation">
                    <span className="type-ico"/>
                    <span className="type-ico"/>
                    <span className="type-ico"/>
                </div>
                <p className="typing-text">{text}</p>
            </div>
        );
    }

    get isSystemMessage(): boolean {
        const {lastMessage} = this.props;
        const lMessage = lastMessage ? lastMessage.get('type') : ""
        return [
            MESSAGE_TYPES.leave_group,
            MESSAGE_TYPES.join_group,
            MESSAGE_TYPES.remove_from_group,
            MESSAGE_TYPES.update_group_avatar,
            MESSAGE_TYPES.update_group_name,
            MESSAGE_TYPES.room_call_start,
            MESSAGE_TYPES.room_call_join,
            MESSAGE_TYPES.room_call_leave,
            MESSAGE_TYPES.room_call_end,
            MESSAGE_TYPES.delete_room,
            MESSAGE_TYPES.create_room,
            MESSAGE_TYPES.outgoing_call,
            MESSAGE_TYPES.incoming_call,
            MESSAGE_TYPES.deleted_msg,
            MESSAGE_TYPES.delete_msg,
        ].includes(lMessage);
    }

    get lastMessageTextGetter(): any {
        const {draft, lastMessage, contacts, userId, thread} = this.props;
        const threadInfo = getThread(thread, userId);
        const localization: any = components().messageTypes;
        const showDraft: boolean = draft && !threadInfo.get("disabled");

        if (showDraft) {
            return emojify(unEscapeText(draft), true);
        }

        if (lastMessage) {

            if (lastMessage.get("deleted")) {
                return getMessageText(lastMessage, contacts, userId, true);
            }

            const type: any = lastMessage.get("type");

            if (isMediaOrLocation(type)) {
                const lastMessageInfo = lastMessage.get("info");
                let lastMessageInfoJSON = null;

                try {
                    lastMessageInfoJSON = JSON.parse(lastMessageInfo);
                } catch (e) {
                    Log.i('######JSON MESSAGE PARSE ERROR (THREAD)#######');
                    Log.i(e);
                    Log.i('######JSON MESSAGE PARSE ERROR (THREAD)#######');
                }

                if (lastMessageInfoJSON && lastMessageInfoJSON.fileType && AUDIO_TYPES.includes(lastMessageInfoJSON.fileType)) {
                    return localization.audio;
                }

                if (localization[type.toLowerCase()]) {
                    return localization[type.toLowerCase()];
                }

                return `${type.substr(0, 1)}${type.toLowerCase().substr(1)} message`;
            }

            if (type === MESSAGE_TYPES.sticker) {
                return localization.sticker;

            }

            if (isGroupOrCallAction(type)) {
                return getMessageText(lastMessage, contacts, userId, true);

            }
            return lastMessage.get("text") && emojify(unEscapeText(lastMessage.get("text")), true);
        }

        return "";
    }

    get lastMessageSenderGetter(): string {
        const {draft, lastMessage, contacts, userId, thread} = this.props;
        let senderName: string = "";
        const threadType = thread && thread.getIn(['threads', 'threadType']);
        const {isGroup} = getThreadType(threadType);

        if (!draft && lastMessage && isGroup && !this.isSystemMessage) {
            const creatorId: string = lastMessage.get("creator");
            if (creatorId && creatorId.split("@").shift() === userId) {
                const localization: any = components().messageElement;
                senderName = `${localization.You}: `;
            } else {
                const contactInfo = contacts && contacts.getIn([creatorId, 'members', creatorId]);
                if (contactInfo) {
                    senderName = `${contactInfo.get("firstName") || contactInfo.get("lastName") || contactInfo.get("email") || `+${contactInfo.get("phone")}`}: `;
                }
            }
        }

        return senderName;
    }

    render() {
        const {
            selectedThreadId, thread, lastMessage, onRightClick, userId,
            draft, lastCall, time, hangUp, toggleMic, acceptCall, declineCall, contacts, conferenceInfo, isOnline
        } = this.props;

        if (!thread) {
            return null;
        }

        const conversation = thread.get("conversations");
        const typingList: List<string> = conversation.get('typing');
        const isTyping: boolean = List.isList(typingList) && typingList.size > 0;
        const threadType = thread.getIn(['threads', 'threadType']);
        const threadId = thread.getIn(['threads', 'threadId']);

        const {isGroup} = getThreadType(threadType);
        const threadInfo = getThread(thread, userId);

        const conferenceCallId = threadInfo.get("callId");
        Log.i("conference -> conferenceInfo = 2 ", conferenceInfo)

        const contactThread = contacts.get(threadId)
        const contactInfo = getThread(contactThread, userId);

        const localization: any = components().messageTypes;
        const showDraft: boolean = draft && !threadInfo.get("disabled");


        const lastMessageSender: string = this.lastMessageSenderGetter;

        const lastMessageText: any = this.lastMessageTextGetter;

        const messageStatusNumberIcon: boolean = lastMessage && !lastMessage.get("own") && conversation.get("newMessagesIds") && conversation.get("newMessagesIds").size > 0;

        const threadImage: any = {
            url: threadInfo.get("avatarUrl"),
            file: threadInfo.get("avatar"),
        };

        let singleConversationName: string;
        if (threadInfo && !isGroup && threadInfo.get("contactId") === "000000002@msg.hawkstream.com") {
            singleConversationName = "RASED";
        }
        else if (threadInfo && !isGroup && threadInfo.get("contactId") === "111@msg.hawkstream.com") {
            singleConversationName = "RASED Admin";
        } else {
            const nameType = APPLICATION.WITHEMAIL ? "email" : "username"
            if (contactInfo) {
                singleConversationName = !isGroup && ((contactInfo.get("firstName") && contactInfo.get("firstName") !== "") || (contactInfo.get("lastName") && contactInfo.get("lastName") !== "") ? contactInfo.get("name") : contactInfo.get("email") ? contactInfo.get(nameType) : `${!contactInfo.get("name").startsWith("0") ? "+" : ""}${contactInfo.get("name")}`);
            } else {
                singleConversationName = threadInfo && !isGroup && ((threadInfo.get("firstName") && threadInfo.get("firstName") !== "") || (threadInfo.get("lastName") && threadInfo.get("lastName") !== "") ? threadInfo.get("name") : threadInfo.get("email") ? threadInfo.get(nameType) : `${!threadInfo.get("name").startsWith("0") ? "+" : ""}${threadInfo.get("name")}`);
            }

        }


        const isCallStarted: boolean = lastCall && (threadId === lastCall.get('receiver') || threadId === lastCall.get('caller'));
        const isOwnCall: boolean = lastCall && lastCall.get('ownCall');
        const isCallIgnored: boolean = lastCall && lastCall.getIn(['showInThread', 'ignored']);
        const isAnswering: boolean = lastCall && lastCall.get('status') === CALL_STATUSES.answering;

        const isOwn: boolean = lastMessage && lastMessage.get("own");
        const isDeleted: boolean = lastMessage && lastMessage.get("deleted");

        const isDeliveryWaiting: boolean = isOwn && !lastMessage.get("status") && !lastMessage.get("delivered") && !lastMessage.get("seen");
        const isSent: boolean = isOwn && lastMessage.get("status") && !lastMessage.get("delivered") && !lastMessage.get("seen");
        const isDelivered: boolean = isOwn && lastMessage.get("delivered") && !lastMessage.get("seen");
        const isSeen: boolean = isOwn && lastMessage.get("seen");
        const isLastMessageStatusShown: boolean = isOwn && lastMessage && !isGroup && !isDeleted && !showDraft && !messageStatusNumberIcon && !this.isSystemMessage;
        const member = thread && thread.get("members").first();
        const avatarGroupUrl = thread.getIn(["threads", "threadInfo", "avatarBlobUrl"])
        const threadLocalization: any = components().threadsPanel;

        const showJoinToConference: boolean = (isGroup && !conferenceInfo.showConference && conferenceInfo.initialized && threadId === conferenceInfo.threadId);


        return (
          <>
                <ContextMenuTrigger id={threadId}>
                    <li
                        className={`thread_block${threadId === selectedThreadId ? ' active' : ''}`}
                        // className={`thread_block${threadId === selectedThreadID ? ' active' : ''}`}
                        onClick={this.handleFetchThread}
                        onContextMenu={onRightClick}
                        data-thread-id={threadId}
                    >
                        <AvatarSize width="42px" height="42px">
                            <Avatar
                                image={threadImage}
                                color={threadInfo.getIn(["color", "numberColor"])}
                                status={threadInfo.get("status")}
                                avatarCharacter={threadInfo.get("avatarCharacter")}
                                name={isGroup ? threadInfo.get("name") : threadInfo.get("firstName")}
                                meta={{threadId}}
                                isGroup={isGroup}
                                contactId={threadInfo.get("contactId")}
                                fontSize={"15px"}
                                iconSize={isGroup ? "29px" : "42px"}
                                avatarBlobUrl={isGroup ? avatarGroupUrl : member ? member.get("avatarBlobUrl") : ""}
                                // active={threadId === selectedThreadId}
                            />
                        </AvatarSize>
                        <div className="conversation-info">
                            {
                                isCallStarted &&
                                <div className='call-actions'>
                                    {
                                        (isOwnCall || (!isCallIgnored && isAnswering)) &&
                                        <React.Fragment>
                                            {
                                                time &&
                                                <span
                                                    className={`icon-call-actions icon-microphone ${lastCall.get('mic') ? ' on' : ' off'}`}
                                                    onClick={toggleMic}
                                                />
                                            }
                                            <span className='icon-call-actions icon-end-call' onClick={hangUp}/>
                                        </React.Fragment>
                                    }

                                    {
                                        !isOwnCall && isCallIgnored &&
                                        <React.Fragment>
                                            <span className='icon-call-actions icon-end-call' onClick={declineCall}/>
                                            <span className={`icon-call-actions icon-video-call ${lastCall.get("receiverRequest") && !lastCall.get("receiverRequest").includes('web') ? "disabled" : ""}`}
                                                  onClick={() => acceptCall(true)}/>
                                            <span className='icon-call-actions icon-accept-call'
                                                  onClick={() => acceptCall()}/>
                                        </React.Fragment>
                                    }
                                </div>
                            }
                            <div className="info-row">
                                <div className="contact_name-info">
                                    {isGroup && <span className="group-icon"/>}
                                    <span
                                        className={isGroup ? "group_name" : "contact_name"}>
                                        {isGroup ? threadInfo.get("name") : singleConversationName ===  "++000000002" ? "RASED" : singleConversationName}
                                    </span>
                                    {
                                        (isCallStarted && isOwnCall) || (!isCallIgnored && isAnswering) || isCallIgnored || !lastMessage || (!lastCall && showDraft && draft) || conferenceCallId ? null :
                                            <span
                                                className="contact_time">{lastMessage.get("time") !== 0 ? getFormattedDate({
                                                date: lastMessage.get("time"),
                                                left: true,

                                            }) : ""}</span>
                                    }
                                    {/*{*/}
                                    {/*    !showJoinToConference &&*/}
                                    {/*    <span className="contact_time">{conversation.get("time") !== 0 ? getFormattedDate({*/}
                                    {/*        date: conversation.get("time"),*/}
                                    {/*        left: true*/}
                                    {/*    }) : ""}</span>*/}
                                    {/*}*/}
                                </div>
                            </div>

                            {
                                isCallStarted && isAnswering ?
                                    <div className="message-row">
                                        {threadInfo.get("muted") && <span className="mute-icon"/>}
                                        <span data-unread={conversation.get("newMessagesIds").size}
                                              className={`${messageStatusNumberIcon ? 'icon-status_msg_number' : ''}`}/>
                                        <span className="last-message-text" title="">
                                    {time ? `${localization.ongoingCall} (${time})` : lastMessageText}
                                </span>
                                    </div> :
                                    <div className="message-row">

                                    <span data-unread={conversation.get("newMessagesIds").size}
                                          className={`${messageStatusNumberIcon ? 'icon-status_msg_number' : ''}`}/>

                                        {isTyping ? this.typing :
                                            <>
                                                {threadInfo.get("muted") && <span className="mute-icon"/>}
                                                {isLastMessageStatusShown &&
                                                (!isDeliveryWaiting ? <StatusMessage
                                                        isLastMessage={true}
                                                        isActiveThread={threadId === selectedThreadId}
                                                        // isActiveThread={threadId === selectedThreadID}
                                                        isSeen={isSeen}
                                                        isDelivered={isDelivered}
                                                        isSent={isSent}/> :
                                                    <IsDeliveryWaiting isLastMessage={true}
                                                                       isActiveThread={threadId === selectedThreadId}
                                                                       // isActiveThread={threadId === selectedThreadID}
                                                    ><span/></IsDeliveryWaiting>)}

                                                <span
                                                    className={`${isLastMessageStatusShown ? "status " : ""}last-message-text`}
                                                    title="">
                                            {
                                                !lastCall && showDraft && draft &&
                                                <span className="draft">{localization.draft}</span>
                                            }

                                                    {lastMessageSender &&
                                                    <span className="sender">{lastMessageSender}</span>}

                                                    {lastMessageText}
                                        </span>
                                            </>}
                                    </div>
                            }
                        </div>
                        {
                            // showJoinToConference &&
                            conferenceCallId && isOnline && !conferenceInfo.callId &&
                            <button
                                className="join-to-call"
                                onClick={this.handleCheckConference}
                            >{threadLocalization.join}</button>
                        }
                    </li>
                </ContextMenuTrigger>
                <ContextMenu
                    id={threadId}
                >
                    <MenuItem data={{threadId}} onClick={this.handleDeletePopupOpen}>
                        {localization.delete}
                    </MenuItem>
                </ContextMenu>
            </>
        )
    }
};
