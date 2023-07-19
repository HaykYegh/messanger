import {long} from "aws-sdk/clients/backup";
import Log from "modules/messages/Log"
import {
  getBatchMessageXMLForSend,
  getMessageXMLForSend,
  messageDeliveredReceivedXML,
  messageSeenXML, messageSeenXMLService,
  sendMessageXML, XMLReceivedXML, XMLReceivedXMLService
} from "xmpp/XMLBuilders";
import {XML_MESSAGE_TYPES} from "xmpp/XMLConstants";
import {MESSAGE_TYPES} from "configs/constants";
import {PendingMessageType} from "modules/messages/PendingMessageType";
import {PendingType} from "modules/messages/PendingType";
import {SignalingMessage} from "modules/messages/SignalingMessage";

export class Pending {
  private TAG: string = "Pending"
  private isLogs: boolean = false
  private message: Strophe.Builder = null

  id: number = -1
  dictMessage: any = null
  time: any = null
  messageId: string = ""
  isInternalMessage: boolean = false
  type: PendingType = PendingType.none
  batches: Pending[] = []
  parentId: number = -1
  isLock: boolean = true
  messageType: PendingMessageType = PendingMessageType.message

  constructor(map: any = null, _time: any = 0, _msgId: string = null, _isInternalMessage: boolean = false, messageType: PendingMessageType = PendingMessageType.message, type: PendingType = PendingType.none) {
    this.dictMessage = map
    this.time = _time
    this.messageId = _msgId
    this.isInternalMessage = _isInternalMessage
    this.type = type
    this.messageType = messageType
  }

  insert(pendings: Pending[]){
    for (var i = 0; i < pendings.length; i++) {
      let obj = pendings[i]

      if (obj.messageId == null) {
        if (this.isLogs){
          Log.e(this.TAG,"MQ -> Critical Error -> messageId is NULL")
        }

        return
      }

      this.insertWithPending(obj)
    }
  }

  insertWithPending(pending: Pending){

    if (!this.batches.includes(pending)) {
      this.batches.push(pending)
    }

    if (this.isLogs){
      Log.i("insertWithPending -> batches", this.batches)
    }
  }

  configureForSendXml(obj) {
    return {
      from: obj.author.split("@").shift(),
      to: obj.to.split("@").shift(),
      type: obj.type,
      msgId: obj.id,
      msg: obj.msgText,
      msgInfo: obj.msgInfo,
      msgType: obj.msgType,
      alias: obj.alias || null,
      fileSize: obj.fileSize || null,
      fileRemotePath: obj.fileRemotePath || null,
      ext: obj.ext || null,
      email: obj.email || null,
      rel: obj.rel || null,
      repId: obj.repId,
      firstName: obj.firstName || null,
      lastName: obj.lastName || null,
      avatarHash: obj.avatarHash || null,
      resolution: obj.resolution || null,
      time: obj.time || null,
      transferStatus: obj.transferStatus || null,
      partCount: obj.partCount || null,
      isExistKey: obj.isExistKey || null,
      reset: obj.reset || null,
    }
  }

  getJson() : Strophe.Builder  {
    if (this.message !== null) {
      return this.message
    }

    if (this.messageId === null) {
      return null
    }

    if (this.type == PendingType.none) {
      this.message = this.getMessageXML()
      Log.i(this.TAG, `locationMessage message = ${this.message}`)
      if (this.isLogs){
        Log.i(this.TAG, `MQ -> insert into message ${this.message}`)
      }

      return this.message
    }

    var messageMap: any = {}
    messageMap["to"] = ""

    if (this.type == PendingType.lockBatch) {
      messageMap["msgType"] = MESSAGE_TYPES.msg_transport_locked
    } else {
      messageMap["msgType"] = MESSAGE_TYPES.transport
    }

    messageMap["msgId"] = this.messageId

    var messages: any[] = []
    var statuses: any[] = []

    if (this.batches.length > 0) {
      let msgs = this.batches
      msgs.sort((first, second) => {
        if (first.time < second.time) {
          return -1;
        } else if (first.time > second.time) {
          return 1;
        } else {
          return 0;
        }
      })

      for (var i = 0; i < msgs.length; i++) {
        let queueObject = msgs[i]
        if (queueObject.dictMessage == null){
          if (this.isLogs){
            Log.e(this.TAG, `MQ -> insert into batch ${queueObject.messageId} dictMessage is null`)
          }

          continue
        }

        if (this.isLogs){
          Log.i(this.TAG, `MQ -> insert into batch ${queueObject.messageId}`)
        }

        // const dictMessageBatch = JSON.parse(JSON.stringify(queueObject.dictMessage))
        //
        // console.log(dictMessageBatch, "dictMessageBatch")
        //
        // const from = dictMessageBatch.author.split("@").shift();
        // delete dictMessageBatch.author;
        // dictMessageBatch.from = from;
        // dictMessageBatch.to = dictMessageBatch.to.split("@").shift()




        if (queueObject.messageType == PendingMessageType.message) {
          const messageObj = this.configureForSendXml(queueObject.dictMessage)
          messages.push(messageObj)
        } else {
          statuses.push(queueObject.dictMessage)
        }

        if (this.type == PendingType.lockBatch && messageMap["to"] == "") {
          messageMap["to"] = queueObject.dictMessage["to"]
        }
      }
    }

    var map = {}
    map["messages"] = messages
    map["statuses"] = statuses
    messageMap["msgInfo"] = JSON.stringify(map).replace(/&quot;/g, '"')

    if (messages.length == 0 && statuses.length == 0){
      return null
    }

    return getBatchMessageXMLForSend(messageMap)
  }

  private getMessageXML(){

    switch (this.messageType) {
      case PendingMessageType.delivery:
        if (this.isLogs){
          Log.i("PendingMessageType -> delivery", this.dictMessage)
        }

        // return messageDeliveredReceivedXML(this.dictMessage)
        return XMLReceivedXMLService(this.dictMessage)
      case PendingMessageType.seen:
        if (this.isLogs){
          Log.i("PendingMessageType -> seen", this.dictMessage)
        }

        return messageSeenXMLService(this.dictMessage)
      default:
        if (this.isLogs){
          Log.i("PendingMessageType -> default", this.dictMessage)
        }

        return getMessageXMLForSend(this.dictMessage)
    }
  }

  removePendingFromBatch(pending){
    if (pending == null) {
      return
    }

    this.removeFromBatch(pending)
    this.message = null
  }

  removeFromBatch(pending){
    let index = this.batches.indexOf(pending)
    if (index != null) {
      this.batches.splice(index, 1)
    }
  }

  isBatch() {
    return this.type == PendingType.batch || this.type == PendingType.lockBatch
  }


  isEqual(other: any) {
    let obj = other

    if (obj == null) {
      return false
    }

    if (this.messageId == null || obj!.messageId == null) {
      return false
    }

    if (obj!.messageId == this.messageId && obj!.messageType == this.messageType && obj!.type == this.type) {
      return true
    }

    if (this.batches.length > 0) {
      for (var i = 0; i < this.batches.length; i++) {
        let queueObject = this.batches[i]
        if (queueObject.messageId == obj!.messageId && obj!.messageType == queueObject.messageType && obj!.type == queueObject.type) {
          return true
        }
      }
    }

    if (obj!.batches.count > 0) {
      for (var i = 0; i < this.batches.length; i++) {
        let queueObject = this.batches[i]
        if (this.messageId == queueObject.messageId && this.messageType == queueObject.messageType && this.type == queueObject.type) {
          return true
        }
      }
    }

    return false
  }
}
