import selector from "services/selector";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import {
    messageDeliveredToReceiver, messageDeliveredToReceiverService,
    messageDisplayedToReceiver, messageDisplayedToReceiverService,
    sendMessageSeen as SEND_MESSAGE_SEEN,
    showLoading
} from "modules/messages/MessagesActions";
import {LoginManager} from "modules/messages/LoginManager";
import Log from "modules/messages/Log";
import {SignalingBase} from "modules/messages/SignalingBase";
import {SignalingEventType} from "modules/messages/SignalingEventType";
import {Factory} from "modules/messages/Factory";
import {InstMessageType} from "modules/messages/InstMessageType";
import {PendingQueue} from "modules/messages/PendingQueue";
import {SignalingStatus} from "modules/messages/SignalingStatus";
import {SignalingMessage} from "modules/messages/SignalingMessage";
import {MessageType} from "modules/messages/MessageType";
import {Pending} from "modules/messages/Pending";
import {SignalingBatch} from "modules/messages/SignalingBatch";
import {MessageStatus} from "modules/messages/MessageStatus";
import {Message} from "modules/messages/Message";
import {PendingMessageType} from "modules/messages/PendingMessageType";
import {UserManager} from "modules/messages/UserManager";
import {RegistrationService} from "modules/messages/RegistrationService";
import {MessageTransferStatus} from "modules/messages/MessageTransferStatus";
import {SignalingPartMessage} from "modules/messages/SignalingPartMessage";
import {MessageEvent} from "modules/messages/MessageEvent";
import {TransportManager} from "modules/messages/TransportManager";
import conf from "configs/configurations";
import connectionCreator from "xmpp/connectionCreator";
import {carbonMessageHandler, groupMessageHandler, messageHandlerService} from "modules/handlers/HandlersActions";
import {getPartialId, getUserId, getUsername} from "helpers/DataHelper";
import {all, call, put, select} from "redux-saga/effects";
import {minimizedSelector, showChatSelector} from "modules/application/ApplicationSelector";
import {getLastCallSelector} from "modules/call/CallSelector";
import {deleveryHandler, responseRecived} from "xmpp/handlers";
import {messageDeliveredReceivedXML, messageDisplayedReceivedXML} from "xmpp/XMLBuilders";
import IDBMessage from "services/database/class/Message";
import {Dispatch} from "redux";
import {ZCC_XMLNS} from "xmpp/XMLConstants";

export class MessagingService {
    static sharedInstance = new MessagingService()
    private TAG: string = "MessagingService"

    private _isSeenOn: Boolean = null
    private get isSeenOn(): Boolean {
        if (this._isSeenOn == null) {
            const store: Store<any> = storeCreator.getStore();
            const {privacy} = selector(store.getState(), {
                settings: {privacy: true}
            });
            this._isSeenOn = privacy && privacy.get("showSeenStatus")
        }

        return this._isSeenOn
    }

    private get isLogIn(): Boolean {
        return LoginManager.sharedInstance.autoLogin
    }

    xmlMessageRecived(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_type_txt_message.value
        messageEvent.instMessageType = InstMessageType.unknown.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    xmlServerRecived(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_type_txt_msg_server_recieved.value
        messageEvent.instMessageType = InstMessageType.unknown.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    xmlDelivery(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_type_txt_msg_delivered.value
        messageEvent.instMessageType = InstMessageType.unknown.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    xmlSeen(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_type_inst_message.value
        messageEvent.instMessageType = InstMessageType.seen.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    xmlAckDelivereRecived(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_result_dlv_notify.value
        messageEvent.instMessageType = InstMessageType.unknown.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    xmlAckSeenRecived(showNotification: any, message: any){
        let messageEvent = new MessageEvent()
        messageEvent.eventType = SignalingEventType.chat_event_type_inst_result_message.value
        messageEvent.instMessageType = InstMessageType.seen.value
        messageEvent.message = message
        messageEvent.xmlNotification = showNotification
        this.onEvent(messageEvent)
    }

    private getDispatch() {
        const store: Store<any> = storeCreator.getStore();
        return store.dispatch
    }

    onEvent(eventObject: MessageEvent) {
        if (!this.isLogIn) {
            Log.e(this.TAG, "user is not log in")
            return
        }

        if (eventObject == null) {
            Log.e(this.TAG, "event is null")
            return
        }

        let event: MessageEvent = eventObject

        let type: SignalingEventType = SignalingEventType.get(event.eventType)
        let instType: InstMessageType = InstMessageType.get(event.instMessageType)


        if (event.message == null) {
            Log.e(this.TAG, "event messageType is null")
            return
        }

        let jData: any = event.message

        Log.i(this.TAG, "SIGNALING_EVENT <- ", jData, `type = ${type.localizedDescription}, instType = ${instType.localizedDescription}`)

        let signalingObj: SignalingBase = Factory.signalingObject(jData, type, instType)

        if (signalingObj == null) {
            Log.e(this.TAG, "can't parse event")
            return
        }

        switch (type) {
            case SignalingEventType.chat_event_type_txt_msg_recieved:
                this.recived((signalingObj as SignalingStatus).msgId)
                return
            case SignalingEventType.chat_event_type_txt_msg_server_recieved:
                this.serverRecived((signalingObj as SignalingStatus).msgId)
                responseRecived(eventObject.message)
                return
            case SignalingEventType.chat_event_type_txt_msg_delivered:
                this.delivery(signalingObj as SignalingStatus)
                return
            case SignalingEventType.chat_event_result_dlv_notify, SignalingEventType.chat_event_type_txt_msg_check_delivery_response:
                this.deliveryResponse((signalingObj as SignalingStatus).msgId)
                return
            case SignalingEventType.chat_event_type_inst_message:
                if (instType == InstMessageType.seen) {
                    if (this.isSeenOn) {
                        this.seen(signalingObj as SignalingStatus)
                    } else {
                        this.delivery(signalingObj as SignalingStatus)
                    }
                    return
                }
                break
            case SignalingEventType.chat_event_type_inst_result_message:
                if (instType == InstMessageType.seen) {
                    this.seenResponse((signalingObj as SignalingStatus).msgId)
                    return
                }
                break
            case SignalingEventType.event_badge_count_ack,
                SignalingEventType.event_notification_sound_ack:
                PendingQueue.instance.removeAndSendNextPending((signalingObj as SignalingStatus).msgId)
                return
            case SignalingEventType.event_conversation_mute_ack:
                // MuteManager.sharedInstance.responseFromServer((signalingObj as SignalingStatus).msgId)
                return
            case SignalingEventType.chat_event_type_txt_message:
                let event = signalingObj as SignalingMessage
                event.xmlNotification = eventObject.xmlNotification
                event.xmlObject = eventObject.message
                this.onMessageRecive(event)
                break
            default:
                break
        }

    }

    private onMessageRecive(obj: SignalingMessage) {
        if (obj == null) {
            return
        }

        let message = new Message()
        message.configure(obj)
        Log.i("onMessageRecive -> 1", obj)
        if (message.messageType == MessageType.transport || message.messageType == MessageType.transport_locked) {
            Log.i("onMessageRecive -> 2", obj)
            // if (!CryptManager.sharedInstance().isSentKeysToServer && SwiftDefines.isEncryption()) {
            //     return
            // }

            this.onBatchRecive(message)
            // this.updateBadgeCout()
        } else {
            Log.i("onMessageRecive -> 3", obj)
            // if (!CryptManager.sharedInstance().isSentKeysToServer && SwiftDefines.isEncryption()) {
            //     return
            // }


            let pending = this.getSeenDeliveryPending(message)

            Log.i("onMessageRecive -> 3.1 pending = ", pending)

            if (pending != null) {
                PendingQueue.instance.addMessageToQueue(pending)
            }

            message.isSilent = pending?.messageType != PendingMessageType.seen

            Log.i("onMessageRecive ->", message)


            this.didReceiveMessage(message)


            // this.updateBadgeCout()
        }
    }

    onBatchRecive(batchMessage: Message) {
        Log.i(this.TAG, "onBatchRecived")

        let pending = this.getSeenDeliveryPending(batchMessage)
        Log.i("onBatchRecive ->", pending)
        if (pending != null) {
            PendingQueue.instance.addMessageToQueue(pending)
        }

        let info = Factory.signalingObjectbyText(batchMessage.msgInfo, InstMessageType.batch) as SignalingBatch

        if (info != null) {
            let messages: SignalingMessage[] = info.messages
            let statuses: SignalingStatus[] = info.statuses
            var pendings: Pending[] = []
            var conversations: any = {}

            if (messages != null) {
                let msgs = messages.sort((first, second) => {
                    if (first.time == null || first.time == "") {
                        return -1
                    } else if (second.time == null || second.time == "") {
                        return 1
                    } else if (first.time < second.time) {
                        return -1;
                    } else if (first.time > second.time) {
                        return 1;
                    } else {
                        return 0;
                    }
                })

                // MessagingServiceEncryption.sharedInstance.lockBadMessages()

                Log.i("onBatchRecive sort ->", msgs)

                for (var i = 0; i < msgs.length; i++) {
                    let signalingObj = msgs[i]
                    let message = new Message()
                    message.configure(signalingObj)
                    message.xmlNotification = batchMessage.xmlNotification

                    if (batchMessage.messageType != MessageType.transport_locked) {
                        let pending = this.getSeenDeliveryPending(message)
                        if (pending != null) {
                            if (messages.length == 1) {
                                PendingQueue.instance.addMessageToQueue(pending)
                            } else {
                                pendings.push(pending)
                            }
                        }
                    }

                    var conversation = conversations[message.uid]
                    if (conversation == null) {

                    }

                    message.conversation = conversation
                    let isCommit = (messages.length == 1) || i == messages.length - 1
                    message.isSilent = !isCommit
                    message.isIncoming = true
                    message.isCommit = isCommit

                    if (message.messageType == MessageType.transport_locked) {
                        this.onBatchRecive(message)
                    } else {
                        this.didReceiveMessage(message)
                    }
                }

                if (messages.length > 1) {
                    // DERHManagedObjectContextManager.sharedDEDatamodel().commit()
                }

                if (statuses != null) {
                    for (let i = 0; i < statuses.length; i++) {
                        let status: SignalingStatus = statuses[i]

                        if (status.status == "seen") {
                            if (this.isSeenOn) {
                                this.seen(status, false)
                            } else {
                                this.delivery(status, false)
                            }
                        } else if (status.status == "delivered") {
                            this.delivery(status, false)
                        }
                    }

                    if (statuses.length > 0) {
                        // DERHManagedObjectContextManager.sharedDEDatamodel().commit()
                        for (var status in statuses) {
                            // NotificationCenter.default.post(name: NSNotification.Name(rawValue: "UPDATE_CONVERSATION_STATUS"), object: status.msgId)
                        }
                    }
                }

                if (pendings.length > 0) {
                    PendingQueue.instance.addMessagesToQueue(pendings)
                }

                // MessagingServiceEncryption.sharedInstance.unlockBadMessages()
                // MessagingServiceEncryption.sharedInstance.sendAllBadMessages()
            }
        } else {
            Log.e(this.TAG, `info is null can't pars msgInfo ${batchMessage.msgInfo}`)
        }
    }

    private getSeenDeliveryPending(message: Message): Pending {
        var pending: Pending = null

        // if (message.from == "" || (message.isMyMessageFromOtherDevice && !message.isGroup)) {
        if (message.from == "") {
            return null
        }

        pending = this.checkMessageSeen(message)

        Log.i("pending checkMessageSeen ->", pending)

        if (pending == null) {
            message.status = MessageStatus.delivery
            pending = this.createPendingForStatus(PendingMessageType.delivery, message)
        } else {
            message.status = MessageStatus.seen
        }

        return pending
    }

    private recived(msgId: string) {
        if (msgId == null) {
            return
        }

        let pendings = PendingQueue.instance.removeAndSendNextPending(msgId)
        // this.updateView(pendings: pendings)
        for (let i = 0; i < pendings.length; i++) {
            let pending: Pending = pendings[i]
            if (pending.messageType == PendingMessageType.message) {
                // idoubs2AppDelegate.sharedInstance()?.coreDataService.updateMessageTransferStatus([pending.messageId ?? "", MessageStatus.serverRecived.rawValue, 0], isCommit: pendings.count == 1)
            }
        }
    }

    private serverRecived(msgId: string) {
        if (msgId == null) {
            Log.i(this.TAG, "serverRecived msgId is null")
            return
        }

        let pendings: Pending[] = PendingQueue.instance.removeAndSendNextPending(msgId)


        // this.updateView(pendings: pendings)
        for (let i = 0; i < pendings.length; i++) {
            let pending: Pending = pendings[i]
            if (pending.messageType == PendingMessageType.message) {
                // idoubs2AppDelegate.sharedInstance()?.coreDataService.updateMessageTransferStatus([pending.messageId ?? "", MessageStatus.serverRecived.rawValue, 0], isCommit:pendings.count == 1)
            }
        }
    }

    private delivery(status: SignalingStatus, isCommit: boolean = true) {
        if (status == null) {
            return
        }

        let e2e = status.isE2ESupport == 1
        let msgId = status.msgId
        let from = status.from
        Log.i("delivery -> 1", status)
        if (from == null || msgId == null) {
            return
        }

        Log.i("delivery -> 2", status)

        this.getDispatch()(messageDeliveredToReceiverService(status.xmlObject));
        // self.updateView(msgId: msgId!, status: MessageStatus.delivery)
        // CryptManager.sharedInstance().changeEncryptionState(e2e, number: from!)
        PendingQueue.instance.removeAndSendNextPending(msgId)
        // ZLConversationModel.sharedInstance().updateMessageToDelivered(withMsgId: ["msgId" : msgId!, "from" : from!, "index" : 0], isCommit: isCommit)

        // if (from != UserManager.sharedInstance.userNumber) {
            Log.i(this.TAG, `DELIVERY Response - value: ${msgId}`)
            TransportManager.sharedInstance.sendDeliveryAck(msgId)
        // } else {
        //     Log.i(this.TAG, `DELIVERY self Response - value: ${msgId}`)
            // TransportManager.sharedInstance.sendDeliveryForMyMessageFromOtherDevice(msgId)
        // }
    }

    private deliveryResponse(msgId: string) {
        if (msgId == null) {
            return
        }

        PendingQueue.instance.removeAndSendNextPending(msgId)
    }

    private seen(status: SignalingStatus, isCommit: boolean = true) {
        Log.i("status SignalingStatus ->", status)
        if (status == null) {
            return
        }

        let e2e = status.isE2ESupport == 1
        let msgId = status.msgId
        let from = status.from

        if (msgId == null || from == null) {
            return
        }

        this.getDispatch()(messageDisplayedToReceiverService(status.xmlObject))
        // self.updateView(msgId: msgId!, status: MessageStatus.seen)
        // CryptManager.sharedInstance().changeEncryptionState(e2e, number: from!)
        PendingQueue.instance.removeAndSendNextPending(msgId)
        // ZLConversationManager.sharedInstance()?.receivedSeen(with: msgId!, from: from!, index:0, isCommit: isCommit)

        // if (from != UserManager.sharedInstance.userNumber) {
            Log.i(this.TAG, `SEEN Response - value: ${msgId}`)
            TransportManager.sharedInstance.sendSeenAck(msgId)
        // } else {
        //     Log.i(this.TAG, `SEEN self Response - value: ${msgId}`)
        //     TransportManager.sharedInstance.sendDeliveryForMyMessageFromOtherDevice(msgId)
        // }
    }

    private seenResponse(msgId: string) {
        if (msgId == null) {
            return
        }

        PendingQueue.instance.removeAndSendNextPending(msgId)
    }

    sendSeensAsync(uid: String) {
        if (!this.isSeenOn) {
            return
        }


        this.sendSeens(uid)
    }

    sendSeens(uid: String) {
        if (!this.isSeenOn) {
            return
        }


        // let messages = MessageDao.getNotSeenMessages(in: uid)
        let messages: Message[] = []
        var pendings: Pending[] = []
        var isGroup: boolean = false

        for (var i = 0; i < messages.length; i++) {
            let message = messages[i]
            let to = message.from
            let msgId = message.msgId
            if (to == null || msgId == null) {
                continue
            }

            // let msg = new Message()
            // msg.configure(message)
            // let pending = this.createPendingForStatus(status: PendingMessageType.seen, message: msg)
            // pending.isLock = false
            // pendings.push(pending)
            // message.seen = true
            // isGroup = message.conversation.group != null
            // message.conversation?.unreadMsgCount = NSNumber(value: 0)
            Log.i(this.TAG, `put seen in queue ${msgId}`)
        }

        if (isGroup) {
            PendingQueue.instance.addMessagesToQueue(pendings)
        } else {
            PendingQueue.instance.addBlockToQueue(pendings)
        }


        if (pendings.length > 0) {
            // DERHManagedObjectContextManager.sharedDEDatamodel().commit()
            // BadgeManagerWrapper.sharedManager()?.calculateMessagesBadge()
        }
    }

    private didReceiveMessage(message: Message){
        Log.i(this.TAG, `didReceiveMessage messagID = ${message.msgId} type = ${message.messageType.localizedDescription}`)

        const store: Store<any> = storeCreator.getStore();
        const dispatch: any = store.dispatch;

        message.xmlNotification.isGroup = message.isGroup
        Log.i(`didReceiveMessage message =`, message)
        if (message.isMyMessageFromOtherDevice && !message.isGroup){
            Log.i(this.TAG, "didReceiveMessage carbonMessageHandler")
            dispatch(carbonMessageHandler(message.xmlObject));
        } else if (message.isGroup){
            Log.i(this.TAG,"didReceiveMessage messageHandlerService")
            dispatch(groupMessageHandler(message.xmlObject, message.xmlNotification));
        } else {
            Log.i(this.TAG,"didReceiveMessage messageHandlerService")
            dispatch(messageHandlerService(message.xmlObject, message.xmlNotification));
        }


        if (this.isNetwokAndServices(message)
            // || MessagingServiceEncryption.sharedInstance.isCryptMessage(message)
            || this.isEditOrDeleteMessage(message)
            || !this.isAddMessage(message)
            || this.isPartMessage(message)) {
            return
        }


        if (message.isMyMessageFromOtherDevice){
            this.handleMyMessageFromMyOtherDevice(message)
            return
        }

        // if (message.messageType == MessageType.notification) {
        //     SystemMessageProfileModul.getSystemMessageProfile(message)
        // }


        if (message.messageType == MessageType.change_avatar){
            if (message.fileSize != "") {
                this.handleGroupEventMessage(message)
                return
            }
        }

        // ZLConversationManager.sharedInstance()?.receive(message)


        if (message.isGroup){
            this.handleGroupEventMessage(message)
        }
    }

    private isPartMessage(messageTS: Message): boolean {
        if (messageTS.relMessageId == null || messageTS.relMessageId == "") {
            return false
        }

        Log.i(this.TAG, `part -> transfer message ${messageTS.msgId}`)
        // let message = MessageDao.getMessage(messageTS.relMessageId)
        let message = null
        let signalingPartMessage = new SignalingPartMessage()
        signalingPartMessage.configure(messageTS)

        if (messageTS.transferStatus == MessageTransferStatus.transferCancel || messageTS.transferStatus == MessageTransferStatus.transferFailed || messageTS.transferStatus == MessageTransferStatus.transferFaildByEncryption) {
            if (message?.transferStatus?.intValue != MessageTransferStatus.transferFailed.value && message?.transferStatus?.intValue != MessageTransferStatus.transferDone.value) {
                // FileTransferManager.cancelTransfer(id: messageTS.relMessageId!, state: MessageTransferStatus.transferCancel)
            }
        } else if (messageTS.message != "" && messageTS.message.includes("msgId")) {
            signalingPartMessage.partNumber = Number(messageTS.message) ?? -1
            // FileTransferManager.reUploadPart(event: signalingPartMessage)
            return true
        } else if (message?.transferStatus?.intValue != MessageTransferStatus.transferDone.value) {
            // FileTransferManager.addPart(event: signalingPartMessage)
        }

        messageTS.msgId = messageTS.relMessageId
        messageTS.relMessageId = null
        return message != null
    }

    private handleMyMessageFromMyOtherDevice(messageTS: Message) {
        if (messageTS.msgId == ""){
            return
        }

        // TransportManager.sharedInstance.sendDeliveryForMyMessageFromOtherDevice(messageTS.msgId)

        // let dbMessage = MessageDao.getMessage(messageTS.msgId)
        //
        // if (dbMessage != nil){
        //     return
        // }
        //
        // messageTS.status = MessageStatus.serverRecived
        // messageTS.from = messageTS.to
        // messageTS.to = ""
        // messageTS.isCommit = true
        //
        // let message = ZLConversationManager.sharedInstance()?.createFastMessage(messageTS, conversation: messageTS.conversation, isCommit: false)
        //
        // if (message?.isFileMessage() == true) {
        //     message?.changeTransferStatus(MessageTransferStatus.transferDownloading)
        //     ZLConversationManager.sharedInstance()?.downloadFile(message, messageTS: messageTS)
        // }
        //
        // ZLConversationManager.sharedInstance()?.messageRecivedFinish(messageTS, dbMessage: message, badge: true, isTyping: false)
        // CryptManager.sharedInstance().changeEncryptionState(messageTS.isExistKey, number: messageTS.from)
    }

    private isNetwokAndServices(msg: Message): Boolean {
        if (msg == null) {
            return false
        }

        let message: Message = msg

        if (message.messageType.value == MessageType.network_delete.value || message.messageType.value == MessageType.network_leave.value || message.messageType.value == MessageType.network_kick.value) {
            Log.i(this.TAG, `didReceiveMessage msgID -> ${message.msgId} sendDeliveryNotification`)

            return true
        } else if (message.messageType.value == MessageType.network_update.value || message.messageType.value == MessageType.network_join.value) {

            return true
        } else if (message.messageType.value == MessageType.remove_service.value || message.messageType.value == MessageType.join_service.value) {
            return true
        }

        return false
    }

    private isEditOrDeleteMessage(msg: Message): boolean {
        if (msg.messageType == MessageType.delete) {
            if (msg.relMessageId == null) {
                return true
            }

// ZLConversationModel.sharedInstance().changeMessage(toDeleted: msg.relMessageId!, from: msg.from, isCommit: msg.isCommit, index: 0)
            return true
        } else if (msg.messageType == MessageType.edit) {
            return this.recivedEditMessage(msg)
        }

        return false
    }

    private recivedEditMessage(msg: Message): boolean {
        return false
    }

    checkMessageSeen(message: Message): Pending {
        const store: Store<any> = storeCreator.getStore();
        const {privacy} = selector(store.getState(), {
            settings: {privacy: true}
        });
        const {
            calls,
            selectedThreadId,
            showConference,
            app: {
                minimized,
                showChat,
                isFocused
            }
        } = selector(store.getState(), {app: true});
        const lastCall = calls.valueSeq().first()
        const senderUsername = getUsername(message.from);
        const senderId = getUserId(senderUsername);

        // if (message.from == "" || message.from == UserManager.sharedInstance.userNumber || (message.isMyMessageFromOtherDevice && !message.isGroup)) {
        if (message.from == "" || message.from == UserManager.sharedInstance.userNumber) {
            return null
        }

        switch (message.messageType) {
            case MessageType.remove_service,
                MessageType.join_service,
                MessageType.network_join,
                MessageType.network_update,
                MessageType.network_delete,
                MessageType.network_leave,
                MessageType.network_kick:
                return null
            default:
                break
        }

        if (message.messageType.value > MessageType.crypt_status.value && message.messageType.value < MessageType.group_end.value) {
            return null
        }

        // if (RegistrationService.instance.onBackground) {
        //     return null
        // }

        let bool = message.generalType === "groupchat" && message.uid == selectedThreadId.split("@")[0]

        Log.i("bool ->", bool)
        Log.i("message ->", message)
        Log.i("selectedThreadId ->", selectedThreadId)
        Log.i("senderId ->", senderId)
        Log.i("onBackground -> ", RegistrationService.instance.onBackground)
        Log.i("seenStatus -> isFocused = ", isFocused)
        Log.i("seenStatus -> showConference = ", showConference)

        // if (showConference) {
        //     message.status = MessageStatus.seen
        //     return this.createPendingForStatus(PendingMessageType.seen, message)
        // }

        if (!bool && selectedThreadId !== senderId) {
            Log.i("checkMessageSeen -> 1", bool)
            return null
        }

        if(selectedThreadId === senderId && message.isGroup) {
            Log.i("checkMessageSeen -> 2", bool)
            return null
        }

        if (showChat && selectedThreadId !== senderId){
            Log.i("checkMessageSeen -> 3", bool)
            return null
        }

        if (minimized || !isFocused){
            Log.i("checkMessageSeen -> 4", bool)
            return null
        }

        if (lastCall && lastCall.size > 0  && selectedThreadId !== senderId){
            Log.i("checkMessageSeen -> 5", bool)
            return null
        }

        if (!this.isSeenOn) {
            Log.i("checkMessageSeen -> 6", bool)
            return null
        }

        message.status = MessageStatus.seen
        return privacy && privacy.get("showSeenStatus") ? this.createPendingForStatus(PendingMessageType.seen, message) : null
    }

    createPendingForStatus(status: PendingMessageType, message: Message): Pending {
        let time = Date.now()

        var map: any = {}
        map["to"] = message.senderNumber
        map["msgId"] = message.msgId

        if (status == PendingMessageType.delivery) {
            map["status"] = "delivered"
        } else {
            map["status"] = "seen"
        }

        map["roomName"] = message.getGroupId()
        map["from"] = UserManager.sharedInstance.userNumber
        map["isE2ESupport"] = 0

        return new Pending(map, time, message.msgId, true, status)
    }

    private isAddMessage(message: Message): boolean {
        // if (!message.isGroup) {
        //     return true
        // }
        //
        // if (message.messageType == MessageType.leave) {
        //     Log.i(this.TAG, "LEAVE_ROOM")
        //     // let messageDB = MessageDao.getMessage(message.msgId)
        //     // if (messageDB == null) {
        //     //     var deletedUser = message.msgInfo ?? ""
        //     //     if (deletedUser.contains("|")) {
        //     //         deletedUser = deletedUser.components(separatedBy: "|")[0]
        //     //     }
        //     //
        //     //     ZLConversationGroupModel.sharedInstance().deleteMember(deletedUser, groupId: message.getGroupId())
        //     //
        //     //     let isMyNumber = self.isGroupActionToMyNumber(from: message.from, msgInfo: message.msgInfo ?? "", msgType: message.generalType)
        //     //
        //     //     if (isMyNumber) {
        //     //         return false
        //     //     }
        //     // }
        //     // else
        //     // {
        //     return false;
        //     // }
        // } else if (message.messageType == MessageType.join || message.messageType == MessageType.changename || message.messageType == MessageType.change_avatar) {
        //     switch (message.messageType) {
        //         case MessageType.join:
        //             // ZLConversationGroupModel.sharedInstance().changeConversationGroupState(message.getGroupId(), conversation: message.conversation, lastState: ZLConversationGroupStatus.addPending, notificationName: nil)
        //
        //             if (message.from == UserManager.sharedInstance.userNumber) {
        //                 return false
        //             }
        //
        //             break
        //         case MessageType.changename:
        //             // ZLConversationGroupModel.sharedInstance().changeConversationGroupState(message.getGroupId(), conversation: message.conversation, lastState: ZLConversationGroupStatus.namePending, notificationName: nil)
        //             break
        //         case MessageType.change_avatar:
        //             // ZLConversationGroupModel.sharedInstance().changeConversationGroupState(message.getGroupId(), conversation: message.conversation, lastState: ZLConversationGroupStatus.photoPending, notificationName: nil)
        //             break
        //         default:
        //             break
        //     }
        // } else if (message.messageType.value >= MessageType.start_group_call.value && message.messageType.value <= MessageType.end_group_call.value) {
        //     // ZLConversationGroupModel.sharedInstance().reciveGroupCall(message)
        //     return false
        // } else {
        //     let isMyNumber = this.isGroupActionToMyNumber(message.from, message.msgInfo != null ? message.msgInfo : "", message.messageTypeString)
        //     if (isMyNumber) {
        //         return false
        //     }
        // }

        return true
    }

    private isGroupActionToMyNumber(from: string, msgInfo: string, msgType: string): boolean {
        let myNumber = UserManager.sharedInstance.userNumber
        return from == myNumber || (msgType?.startsWith("ROOM_") && msgInfo == myNumber)
    }

    handleGroupEventMessage(message: Message){
        switch (message.messageType) {
            case MessageType.join: {
                Log.i(this.TAG, `JOIN_ROOM ${message.msgId}`)
                var newUser = message.msgInfo ?? ""
                var email: string = null
                if (newUser.includes("|")) {
                    let split = newUser.split("|")
                    email = split[1]
                    newUser = split[0]
                }

                let time = message.msgId.replace("msgId", "")

                if (newUser == UserManager.sharedInstance.userNumber || email == UserManager.sharedInstance.userEmail) {
                    // ZLConversationGroupModel.sharedInstance().addNewMember(newUser, email: email, conversation: message.conversation, groupId: message.getGroupId(), isSendGroupInfo: true, messageTime: time)
                } else {
                    // ZLConversationGroupModel.sharedInstance().addNewMember(newUser, email: email, conversation: message.conversation, groupId: message.getGroupId(), isSendGroupInfo: false, messageTime: time)
                }
            }
                break
            case MessageType.kick: {
                Log.i(this.TAG, `KICK_ROOM ${message.msgId}`)
                var oldUser = message.msgInfo != null ? message.msgInfo : ""
                if (oldUser.includes("|")) {
                    oldUser = oldUser.split("|")[0]
                }


                let time = message.msgId.replace("msgId", "")
                oldUser = oldUser.replace(conf.app.prefix, "")
                // ZLConversationGroupModel.sharedInstance().kickMember(oldUser, conversation: message.conversation, fromGroupWithId: message.getGroupId(), messageTime: time)
            }
                break;
            case MessageType.changename:
                Log.i(this.TAG, `CHANGE_ROOM ${message.msgId}`)
                // ZLConversationGroupModel.sharedInstance().changeGroupName(message.msgInfo, conversation: message.conversation, groupId: message.getGroupId())

                break;
            case MessageType.change_avatar:
                Log.i(this.TAG, `CHANGE_ROOM_AVATAR ${message.msgId}`)

                let isMyNumber = this.isGroupActionToMyNumber(message.from, message.msgInfo != null ? message.msgInfo : "", message.messageTypeString)
                if (!isMyNumber) {
                    // ZLConversationGroupModel.sharedInstance().changeGroupAvatar(message.getGroupId(), conversation: message.conversation)
                }

                break

            default:
                break
        }
    }
}
