package com.beint.project.core.managers

import android.content.Intent
import android.os.Looper
import com.beint.project.MainApplication
import com.beint.project.ZangiEngine
import com.beint.project.core.Pending.Pending
import com.beint.project.core.Pending.PendingMessageType
import com.beint.project.core.Pending.PendingType
import com.beint.project.core.Signaling.SignalingMessageFromConference
import com.beint.project.core.dataaccess.dao.ConversationDao
import com.beint.project.core.dataaccess.dao.MessageDao
import com.beint.project.core.model.contact.ContactNumber
import com.beint.project.core.model.sms.*
import com.beint.project.core.services.impl.MessagingService
import com.beint.project.core.signal.AVSession
import com.beint.project.core.signal.CallViewManager
import com.beint.project.core.utils.*
import com.beint.project.core.wrapper.ProjectWrapper
import com.beint.project.core.wrapper.sdk.IZConferenceListener
import com.beint.project.core.wrapper.sdk.ZConferenceClient
import com.beint.project.core.wrapper.sdk.ZConferenceListener
import com.beint.project.core.wrapper.sdk.ZConferenceParticipant
import com.google.gson.Gson
import com.google.gson.annotations.Expose
import com.google.gson.annotations.SerializedName
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.*
import kotlin.collections.ArrayList
import kotlin.collections.HashMap
import kotlin.collections.LinkedHashSet

object ConferenceManager {
    private val TAG = ConferenceManager::class.java.canonicalName

    private val myRegisterNumber = ZangiEngineUtils.getCurrentRegisteredUserId()
    private val conferenceManagerLock = Any()
    private val conferenceManagerListLock = Any()
    var roomName: String = ""
    private var callMembersMap: HashMap<String, GroupMember> = HashMap()
    var participantMuteMap: HashMap<String, String> = HashMap()
    var callInitiator = ""
    var uiListener:WeakReference<ConferenceCallUiListener>? = null
    private val uiEventsMap = HashMap<String, GroupMember.CallState>()
    var membersIdsMap:HashMap<Int, String> = HashMap()
    private val uiHandler = android.os.Handler(Looper.getMainLooper())
    private val callIdList = LinkedHashSet<String>()
    private var pendingConferenceId: String? = null

    private var audioClient: ZConferenceClient? = null
    private var audioListener: IZConferenceListener? = null

    fun changeOrCreateCurrentMembersInConference(msg: ZangiMessage) {
        this.callInitiator = msg.getConference().initiator ?: ""
    }

    private fun getConferenceCallMessageInfo(msgInfo: String?) : ConferenceCallMessageInfo? {
        if (msgInfo.isNullOrEmpty()) {
            return null
        }

        val info: ConferenceCallMessageInfo? = Gson().fromJson(msgInfo, ConferenceCallMessageInfo::class.java)
        val callId = info?.callId ?: return null
        if(!handleMessageOrNo(callId)){
            return null
        }


//        if (AVSession.getCurrentAvSession() == null || AVSession.getCurrentAvSession().id != callId){
//            return null
//        }

        return info
    }

    private fun handleMessageOrNo(callId:String?) :Boolean {
        if(AVSession.currentAvSession == null) {
            if(callId == null || !CallIdStacks.checkCallId(callId) || CallIdStacks.checkStatus(callId, CallIdStacks.CallIdStacksStatusType.CALL_FINISHED)){
                return false
            }
        } else {
            if(AVSession.currentAvSession?.id != callId) {
                return false
            }
        }
        return true
    }
    private fun getCallInitiatorFromConferenceCallMessageInfo(info: ConferenceCallMessageInfo) : String{
        return if (info.initiator != null) {
            info.initiator!!
        } else {
            ""
        }
    }

    private fun addJoinedMembers(joinMembersList: List<String>?) {
        if (joinMembersList == null){
            return
        }

        for (joinMember in joinMembersList) {
            this.addJoinedMember(joinMember)
        }
    }

    private fun addJoinedMember(joinMember: String) {
        if (callMembersMap[joinMember] == null) {
            addMemberInCallMemberMap(joinMember)
        }
    }

    private fun changeMembersCallStatusOrRemoveMember(memberCallStatusMap: HashMap<String, String>?){
        if (memberCallStatusMap == null) {
            return
        }
        val keys:MutableList<String> = ArrayList()
        keys.addAll(callMembersMap.keys)

        for (key in keys) {
            if (memberCallStatusMap.containsKey(key)) {
                changeMembersCallStatusIfNeeded(memberCallStatusMap[key] ?: "", key)
            } else {
                callMembersMap.remove(key)
            }
        }
    }

    private fun changeMembersCallStatusIfNeeded(callStatus: String, key: String){
        when (callStatus) {
            "CALLING" -> _changeMemberCallStatus(key, GroupMember.CallState.CALLING)
            "RINGING" -> _changeMemberCallStatus(key, GroupMember.CallState.RINGING)
            "JOIN" -> _changeMemberCallStatus(key, GroupMember.CallState.IN_CALL)
            "LEAVE" -> _changeMemberCallStatus(key, GroupMember.CallState.LEAVE)
            "DECLINE" -> _changeMemberCallStatus(key, GroupMember.CallState.DECLINE)
            else -> _changeMemberCallStatus(key, null)
        }
    }

    private fun notifyUIForMemberChange(){
        if (Looper.myLooper() == Looper.getMainLooper()) {
            uiListener?.get()?.inCallMembersChange()
        } else {
            MainApplication.getMainHandler().post {
                uiListener?.get()?.inCallMembersChange()

            }
        }
    }


    fun removeUiListener() {
        uiListener = null
    }
    private fun addUiEvent(key: String, value: GroupMember.CallState) {
        synchronized(conferenceManagerLock) {
            uiEventsMap.put(key, value)
        }
    }

    fun removeUiEvent(key: String) {
        synchronized(conferenceManagerLock) {
            uiEventsMap.remove(key)
        }
    }

    fun checkUiEvent(key: String): GroupMember.CallState? {
        synchronized(conferenceManagerLock) {
            return uiEventsMap[key]
        }
    }


    fun createGroup(numbers: List<ContactNumber>, groupName: String) {

        val group = Group()

        group.createGroupChat(numbers, "", "")
        group.filedName = groupName

        val conversation: Conversation? = ZangiEngine.getInstance().storageService.createOrGetConversationForGroup(group.filedUid)
        if (conversation != null) {
            group.filedId = Objects.requireNonNull<Group>(conversation.group).filedId

            group.configuration = conversation.group!!.configuration

            for (i in 0 until group.allMembers.size) {
                group.allMembers[i].groupId = conversation.group!!.filedId
            }


            group.addToStateSet(GroupState.GROUP_CREATED)


            ZangiEngine.getInstance().storageService.updatetGroupTable(group)
            conversation.group = group
            conversation.lastUpdateDate = System.currentTimeMillis()
            conversation.isGroup = true
            ZangiEngine.getInstance().storageService.updateConversation(conversation)

        }

        callIdList.add(group.filedUid)
        ZangiEngine.getInstance().messagingService.sendCreateGroup(conversation)
        NotificationCenter.postNotificationName(NotificationCenter.NotificationType.UPDATE_ALL_CONVERSATIONS, null)
    }

    fun checkConferenceCallId(group: Group) {
        val uId = group.filedUid
        if (callIdList.contains(uId)) {
            callIdList.remove(uId)
            startCall(group, true)
        }
    }

    fun startCall(group: Group, isCreated: Boolean) {
        this.audioClient = ZConferenceClient()
        this.audioClient?.createAudioCall("12345", AppUserManager.userNumber)
    }

    fun muteMember(members : List<String>, mute : Boolean) {
        for (number in members) {
            this.muteMember(number, mute)
        }
    }

    fun muteMember(memberNumber: String, mute: Boolean){
        this.participantMuteMap[memberNumber] = if(mute) "1" else "0"

        var action = ConfSettingsAction.unMute
        if (mute) {
            action = ConfSettingsAction.mute
        }

        this.audioClient?.intToParticipant(action.rawValue, memberNumber)
    }

    fun intActionToParticipantConfCallBack(value: Int, sender: String) {
        var action: ConfSettingsAction = ConfSettingsAction.mute

        if (value == ConfSettingsAction.unMute.rawValue){
            action = ConfSettingsAction.unMute
        } else if(value == ConfSettingsAction.mute.rawValue) {
            action = ConfSettingsAction.mute
        } else {
            return
        }

        this.factory.onActionRecive(action, AppUserManager.userNumber ?: "")
    }

    fun updatePropertyConfCallBack(ownerName: String, userName: String, propertyId: Int, value: String) {
        if(userName == AppUserManager.userNumber){
            return
        }

        this.factory.onUpdatePropertyRecive(propertyId, value, ownerName)
    }

    fun onGroupCallMuteAll(mute: Boolean, number: String) {
        val model = AVSession.activeSession
        if (mute) {
            model?.muteCall()
        } else {
            model?.unMuteCall()
        }
    }

    fun onGroupCallMute(mute: Boolean, number: String) {
        if (number == AppUserManager.userNumber) {
            this.muteMe(mute)
            return
        }

        this.participantMuteMap[number] = if (mute) "1" else "0"

        mainThread {
            uiListener?.get()?.onMuteChanged()
        }
    }

    fun onGroupCallHold(hold: Boolean, number: String) {
        mainThread {
            uiListener?.get()?.changeHold(number, hold)
        }
    }

    private fun muteMe(mute: Boolean){
        val model: AVSession? = AVSession.activeSession
        if (mute){
            model?.muteCall()
        } else {
            mainThread {
                this.uiListener?.get()?.showMuteAlert()
            }
        }
    }

    fun setConferenceProperty(propertyId: ConfPropertyId, value: String){
        this.audioClient?.setProperty(propertyId.rawValue, value, AppUserManager.userNumber)
    }

    fun isInitiateByMy(): Boolean {
        return callInitiator == ZangiEngineUtils.getCurrentRegisteredUserId()
    }

    fun createGroupNameByChatMembers(members:Collection<GroupMember>) : String{
        var groupName = ""
        val p = ZangiEngine.getInstance().zangiProfileService.myProfile
        if (p.firstName != null && p.firstName.isNotEmpty()) {
            groupName += p.firstName
        } else if (p.lastName != null && p.lastName.isNotEmpty()) {
            groupName += p.lastName
        } else {
            var number = myRegisterNumber
            if (number.contains("+")) {
                number = number.replace("+", "")
            }
            groupName += number
        }


        for (member in members) {
            groupName = "$groupName, ${member.displayName}"
        }

        return groupName
    }
    fun getGroupNameByContactsNumber(numbersList: Collection<ContactNumber>): String {
        var groupName = ""
        val p = ZangiEngine.getInstance().zangiProfileService.myProfile
        if (p.firstName != null && p.firstName.isNotEmpty()) {
            groupName += p.firstName
        } else if (p.lastName != null && p.lastName.isNotEmpty()) {
            groupName += p.lastName
        } else {
            var number = myRegisterNumber
            if (number.contains("+")) {
                number = number.replace("+", "")
            }
            groupName += number
        }

//                        List<ContactWrapper> cList = mAdapter.getmItems();
        val numbers = java.util.ArrayList<ContactNumber>()

        for (zc in numbersList) {
            numbers.add(zc)
            val contact = zc.getFirstContact()
            if (contact != null) {
                if (contact.firstName != null && contact.firstName != "") {
                    groupName = groupName + ", " + contact.firstName
                } else if (contact.lastName != null && contact.lastName != "") {
                    groupName = groupName + ", " + contact.lastName
                }
            } else {
                groupName =  if (zc.isHaveEmail()) {
                    "$groupName, ${getUserNameFromContactNumber(zc)}"
                } else {
                    "$groupName, ${getUserNameFromContactNumber(zc)}"
                }
            }
        }
        return groupName
    }


    private fun getUserNameFromContactNumber(contactNumber: ContactNumber):String {
        var userName = ""
        val profile = contactNumber.profile
        if(profile != null) {
            userName = profile.firstName?:""
            if(userName.isEmpty()) {
                userName = profile.lastName?:""
            }
        }

        if(userName.isEmpty()) {
            userName =  if (contactNumber.isHaveEmail()) {
                getUserNameFromUserId(contactNumber.email?:"")
            } else {
                getUserNameFromUserId(contactNumber.fullNumber?:"")
            }
        }
        return userName
    }

    private fun getUserNameFromUserId(userId:String) :String{
        var userName = ""
        val profile  = ZangiEngine.getInstance().zangiProfileService.getProfileFromMap(userId)
        if(profile != null) {
            userName = profile.firstName?:""
            if(userName.isEmpty()) {
                userName = profile.lastName?:""
            }
        }
        if(userName.isEmpty()) {
            userName = userId
        }
        return userName
    }

    fun getCallMembersMap(): HashMap<String, GroupMember> {
        synchronized(conferenceManagerListLock) {
            return callMembersMap
        }
    }

    fun getCallMembers(): List<GroupMember> {
        val arr: ArrayList<GroupMember> = ArrayList()
        synchronized(conferenceManagerListLock) {
            for ((_ , value ) in callMembersMap){
                arr.add(value)
            }
        }
        return arr
    }


    fun changeMemberCallStatus(number: String, state: GroupMember.CallState?) {
        synchronized(conferenceManagerListLock) {
            _changeMemberCallStatus(number, state)
        }
    }

    private fun _changeMemberCallStatus(number: String, state: GroupMember.CallState?) {
        val mem = callMembersMap[number]
        if (mem != null) {
            if (state == GroupMember.CallState.IN_CALL) {
                mem.callState = GroupMemberCallState.inCall
            } else {
                mem.callState = GroupMemberCallState.none
            }
        }
    }

    private fun addMemberInCallMemberMap(key: String) {
        synchronized(conferenceManagerListLock) {
            val mem = ZangiEngine.getInstance().storageService.getMember(key)
            if (mem == null) {
                callMembersMap.put(key, GroupMember(key, MemberRole.ADMIN))
            } else {
                callMembersMap.put(key, mem)
            }
        }
    }

    fun joinCall(groupId: String, callId: String?) {
        this.pendingConferenceId = groupId
        val map = HashMap<String, Any>()
        map["roomUid"] = groupId
        if (callId != null){
            map["callId"] = callId
        }

        val json = Json.jsonString(map)
        Log.i(TAG, "json  === $json")
        ProjectWrapper.sendCreateConference(json, 0, false)
        addMemberInCallMemberMap(AppUserManager.userNumber!!)
    }

    fun onJoinCall(groupId: String, callId: String) {
        this.audioListener = ZConferenceListener(groupId, false)
        this.audioClient = ZConferenceClient(this.audioListener)

        try {
            val conferenceId: Long = callId.toLong()
            this.audioClient?.joinAudioCall(conferenceId, AppUserManager.userNumber)
        } catch (e: Exception){
            Log.e(TAG, e.localizedMessage)
        }
    }

    fun sendAudio(pBuffer: ByteArray?, nSize: Int) {
        this.audioClient?.sendAudio(pBuffer)
    }

    fun getAudio(buffer: ByteArray?, nSize: Int): Int {
        return this.audioClient?.getAudio(buffer) ?: 0
    }

    fun stopConferenceCall() {
        this.audioClient?.leaveAudioCall()

        asyncThreadNormal {
            this.audioClient?.close()
        }
    }


    fun roomCallJoin(msg: ZangiMessage) {
        val msgInfo = msg.msgInfo ?: return

        val info = Gson().fromJson(msgInfo, ConferenceCallMessageInfo::class.java)

        if(info == null || !handleMessageOrNo(info.callId)) {
            return
        }

        val from = msg.from
        addMemberInCallMemberMap(from!!)
        addUiEvent(from, GroupMember.CallState.IN_CALL)
        changeMemberCallStatus(from, GroupMember.CallState.IN_CALL)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            uiListener?.get()?.updateCallStatus(from, GroupMember.CallState.IN_CALL)
        } else {
            uiHandler.post {
                uiListener?.get()?.updateCallStatus(from, GroupMember.CallState.IN_CALL)
            }
        }

        changeMemberIds(info.membersIds, info.vStreamId, from)
    }

    private fun changeMemberIds(membersIds: MutableList<MemberStreamId>?, vStreamId: Int?, from: String) {
        if (vStreamId != null) {
            membersIdsMap[vStreamId] = from
        }

        if (membersIds != null) {
            for (memberId in membersIds) {
                val number = memberId.number
                val id = memberId.id
                if (number != null && id != null) {
                    membersIdsMap[id] = number
                }
            }
        }
    }

    fun roomCallLeave(msg: ZangiMessage) {
        val msgInfo = msg.msgInfo ?: return

        val info = Gson().fromJson(msgInfo, ConferenceCallMessageInfo::class.java)
        if(info == null || !handleMessageOrNo(info.callId)) {
            return
        }
//        if (info == null || info.callId != AVSession.getCurrentAvSession()?.id) {
//            return
//        }
        val from = msg.from
        if (from == myRegisterNumber) {
            closeExistingCall(info)
            return
        }
        changeMemberCallStatus(from!!, GroupMember.CallState.LEAVE)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            uiListener?.get()?.callLeave(from)
        } else {
            ConferenceManager.uiHandler.post {
                uiListener?.get()?.callLeave(from)
            }
        }

    }

    private fun closeExistingCall(info: ConferenceCallMessageInfo) {
        uiEventsMap.clear()
        callMembersMap.clear()
        this.pendingConferenceId = null
        callInitiator = ""
        roomName = ""
        participantMuteMap.clear()
        val callId = info.callId
        val roomName = info.roomName
        val session = AVSession.currentAvSession
        if (session != null && session.id == callId) {
            if (session.isInFakeCallState) {
                session.hangUpFakeCall()
            } else {
                session.hangUpCall()
            }
        }
    }

    fun roomCallDecline(msg: ZangiMessage) {
        val msgInfo = msg.msgInfo ?: return
        val info = Gson().fromJson(msgInfo, ConferenceCallMessageInfo::class.java)

        if(info == null || !handleMessageOrNo(info.callId)) {
            return
        }
//        if (info == null || info.callId != AVSession.getCurrentAvSession()?.id) {
//            return
//        }
        val from = msg.from
        if (from == myRegisterNumber) {
            closeExistingCall(info)
            return
        }
        changeMemberCallStatus(from!!, GroupMember.CallState.LEAVE)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            uiListener?.get()?.callDecline(from)
        } else {
            ConferenceManager.uiHandler.post {
                uiListener?.get()?.callDecline(from)
            }
        }
    }

    fun roomCallEnd(msg: ZangiMessage) {
        synchronized(conferenceManagerLock) {
            uiEventsMap.clear()
        }

        if (!msg.msgInfo.isNullOrEmpty()) {
            val gson = Gson()
            val conferenceCallInfo = gson.fromJson(msg.msgInfo, ConferenceCallMessageInfo::class.java)
            val callId = conferenceCallInfo.callId
//            ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), callId)

            val session: AVSession? = AVSession.activeSession
            if (session != null && session.id == callId && roomName == AVSession.roomName) {
//                currentCallGroup = null
                callMembersMap.clear()
                callInitiator = ""
                roomName = ""
                participantMuteMap.clear()
                uiEventsMap.clear()
                if (session.isInFakeCallState) {
                    session.hangUpFakeCall()
                } else {
                    session.hangUpCall()
                }
            } else if (session == null) {
//                currentCallGroup = null
                uiEventsMap.clear()
                callMembersMap.clear()
                callInitiator = ""
                roomName = ""
                participantMuteMap.clear()
            }

            this.pendingConferenceId = null
            NotificationCenter.postNotificationName(NotificationCenter.NotificationType.UPDATE_RECENT_LIST, null)
        }
    }

    fun changeHost(callId: String, member: String) {
        if (roomName.isNotEmpty()) {
            val tm = System.currentTimeMillis()
            val msgId  = "msgId${tm}"

            val map = HashMap<String, Any>()
            map["member"] = member
            map["roomName"] = roomName
            map["callId"] = callId
            map["msgId"] = msgId
            val jsonObject = JSONObject(map as Map<*, *>)
            val json = jsonObject.toString()
            Log.i(TAG, "json  === $json")
            val pending = Pending(map, tm, msgId, true, PendingMessageType.changeConferenceInitiator,  PendingType.setting)
            MessagingService.sendLockMessage(pending)
//            ProjectWrapper.sendChangeInitiatorConference(json)
        }
    }

    fun cancelMember(member: String, callId: String?) {
        if (roomName.isNotEmpty() && callId != null) {
            val tm = System.currentTimeMillis()
            val msgId  = "msgId${tm}"

            val map = HashMap<String, Any>()
            map["member"] = member
            map["roomName"] = roomName
            map["callId"] = callId
            map["msgId"] = msgId
            val jsonObject = JSONObject(map as Map<*, *>)
            val json = jsonObject.toString()
            Log.i(TAG, "json  === $json")
//            ProjectWrapper.sendCancelMember(json)

            val pending = Pending(map, tm, msgId, true, PendingMessageType.cancelMemberInConferenece,  PendingType.setting)
            MessagingService.sendLockMessage(pending)

            changeMemberCallStatus(member, GroupMember.CallState.DECLINE)

        }
    }

    fun addMember(member: String, callId: String?) {
        if (roomName.isNotEmpty() && callId != null) {
            val map = HashMap<String, Any>()
            map["roomUid"] = roomName
            map["callId"] = callId
            map["members"] = member
            val jsonObject = JSONObject(map as Map<*, *>)
            val json = jsonObject.toString()
            Log.i(TAG, "json  === $json")
            ProjectWrapper.sendAddConfMember(json)
        }
    }

    fun addMembers(numbersList: MutableList<String>, callId: String?) {
        if (roomName.isNotEmpty() && callId != null) {
            val map = HashMap<String, Any>()
            map["roomUid"] = roomName
            map["callId"] = callId
            map["members"] = numbersList
            val jsonObject = JSONObject(map as Map<*, *>)
            val json = jsonObject.toString()
            Log.i(TAG, "json  === $json")
            ProjectWrapper.sendAddConfMember(json)
        }
    }

    fun checkCallExist(roomName: String, callId: String?) {
        if (callId != null) {
            val tm = System.currentTimeMillis()
            val msgId  = "msgId${tm}"

            val map = HashMap<String, Any>()
            map["roomName"] = roomName
            map["callId"] = callId
            map["msgId"] = msgId
            val jsonObject = JSONObject(map as Map<*, *>)
            val json = jsonObject.toString()
            Log.i(TAG, "json  === $json")
            val pending = Pending(map, tm, msgId, true, PendingMessageType.checkConferenceCallExist,  PendingType.setting)
            MessagingService.sendLockMessage(pending)
//            ProjectWrapper.sendConfCallExistenceInGroup(json)
        }
    }

//    fun checkGroupHaseCall(roomName: String) {
//        needToDeleteGroup = true
//        val map = HashMap<String, Any>()
//        map["roomName"] = roomName
//        map["msgId"] = "msgId${System.currentTimeMillis()}"
//        val jsonObject = JSONObject(map)
//        val json = jsonObject.toString()
//        Log.i(TAG, "json  === $json")
//        ProjectWrapper.sendConfCallExistenceInGroup(json)
//    }


    fun groupCallEventCreate(event : SignalingMessageFromConference?) {
        if(event?.isValid == 0 ) {
            if(event.isCallExist == 0) {
                ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_EXIST.ordinal)
            } else {
                ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_INVALID.ordinal)
            }
        } else if(event?.isValid == 2) {
            ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_INVALID.ordinal)
        }
    }
    fun groupCallEventMute(event : SignalingMessageFromConference?) {

        // to do
    }
    fun groupCallEventMuteAll(event : SignalingMessageFromConference?) {
        // tp do
    }
    fun groupCallEventAdd(event : SignalingMessageFromConference?) {
        if (event?.isValid == 1) {
            if (event.roomUid != null) {
                Log.i(TAG, "update groupInfo")
                ZangiEngine.getInstance().messagingService.updateGroupInfo(event.roomUid)
            }
        }
    }
    fun groupCallEventJoin(event : SignalingMessageFromConference?) {
//        Log.i("ssssssssssssssssssss", "groupCallEventJoin json   ==  " + event?.msgInfo)
//
//        if (event?.msgInfo != null) {
//            val info = Gson().fromJson(event.msgInfo, ConferenceCallMessageInfo::class.java)
//            when (info.isValid) {
//                ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_NOT_ALLOWED.ordinal,
//                ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_INVALIED.ordinal -> {
//                    // show error
////                        ZangiEngine.getInstance().signallingService.getSignalingManager().openConferenceCallScreen(info.getIsValid()!!)
//
//                    val callId = info.callId
//                    val roomName = info.roomName
//                    ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), callId)
//                    MainApplication.getMainContext().sendBroadcast(Intent(Constants.UPDATE_RECENT_LIST_UI_KEY))
//                }
//                ConferenceCallJoinStatus.CONFCALL_JOIN_ALREADY_JOINED.ordinal -> {
//
//                }
//            }
//        }

        when (event?.isValid) {

            ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_INVALIED.ordinal -> {
                val conversation = ConversationDao.getConversationWithUid(event.roomUid)
                if (conversation?.getCallId() != null){
                    conversation.setCallId(null)
                }

                // show error
                ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_NOT_EXIST.ordinal)
            }
            ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_NOT_ALLOWED.ordinal -> {
                val conversation = ConversationDao.getConversationWithUid(event.roomUid)
                if (conversation?.getCallId() != null){
                    conversation.setCallId(null)
                }

                ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.NOT_ALLOWED.ordinal)
            }
            ConferenceCallJoinStatus.CONFCALL_JOIN_ALREADY_JOINED.ordinal -> {
                ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.NOT_ALLOWED.ordinal)
            }
        }
    }


    fun groupCallEventCheck(event : SignalingMessageFromConference?) {
//        Log.i("ssssssssssssssssssss", "groupCallEventCheck json   ==  " + event?.msgInfo)

//        if(event?.msgInfo != null) {
//            val gson = Gson()
//            val conferenceCallInfo = gson.fromJson(event.msgInfo, ConferenceCallMessageInfo::class.java)
//            val callId = conferenceCallInfo.callId
////            if(needToDeleteGroup){
////                needToDeleteGroup = false
////                val conversation:Conversation?  = if(conferenceCallInfo.getRoomName() != null){
////                    ZangiEngine.getInstance().storageService.getConversationItemByChat(conferenceCallInfo.getRoomName())
////                } else {
////                    null
////                }
////                val callExist  = if(conferenceCallInfo.getIsCallExist() != null) {
////                    conferenceCallInfo.getIsCallExist()!!
////                } else {
////                    0
////                }
////
////                return
////            }
//
//            if (conferenceCallInfo.isCallExist == 0) {
//                ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), callId)
//                MainApplication.getMainContext().sendBroadcast(Intent(Constants.UPDATE_RECENT_LIST_UI_KEY))
//            }
//        }

        if (event?.isCallExist == 0) {
            ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), event.callId)
            NotificationCenter.postNotificationName(NotificationCenter.NotificationType.UPDATE_RECENT_LIST, null)
        }
    }
    fun groupCallEventChangeInitiator(event : SignalingMessageFromConference?) {
        // to do
    }
    fun groupCallEventEnd(event : SignalingMessageFromConference?) {
        // to do
    }

//    fun handleEvent(event: MessageEvent) {
//        if (event.eventType == SignalingEventType.group_call_event_create.ordinal) {
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_BEGIN json   ==  " + event.json)
//
//            if (event.json != null) {
//                val info = Gson().fromJson(String(event.json!!), ConferenceCallMessageInfo::class.java)
//                if (info.isValid != 1) {
////                    ZangiEngine.getInstance().signallingService.getSignalingManager().openConferenceCallScreen(info.getIsValid()!!)
//
//                    //error  to do Babken
//                }
//            } else {
////                ZangiEngine.getInstance().signallingService.getSignalingManager().openConferenceCallScreen(0)
//
//                // error  to do Babken
//            }
//        } else if (event.eventType == SignalingEventType.group_call_event_join.ordinal) {
//            if (event.json != null) {
//                val info = Gson().fromJson(String(event.json!!), ConferenceCallMessageInfo::class.java)
//                when (info.isValid) {
//                    ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_NOT_ALLOWED.ordinal,
//                    ConferenceCallJoinStatus.CONFCALL_JOIN_CALL_INVALIED.ordinal -> {
//                        // show error
////                        ZangiEngine.getInstance().signallingService.getSignalingManager().openConferenceCallScreen(info.getIsValid()!!)
//
//                        val callId = info.callId
//                        val roomName = info.roomName
//                        ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), callId)
//                        MainApplication.getMainContext().sendBroadcast(Intent(Constants.UPDATE_RECENT_LIST_UI_KEY))
//                    }
//                    ConferenceCallJoinStatus.CONFCALL_JOIN_ALREADY_JOINED.ordinal -> {
//
//                    }
//                }
//            }
//        } else if (event.eventType == SignalingEventType.group_call_event_add.ordinal) {
//            if (event.json != null) {
//                val info = Gson().fromJson(String(event.json!!), AddMemberInfo::class.java)
//                if (info.getIsValid() == 1) {
//                    if (info.getRoomId() != null) {
//                        Log.i(TAG, "update groupInfo")
//                        ZangiEngine.getInstance().messagingService.updateGroupInfo(info.getRoomId())
//                    }
//                }
//            }
//
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_ADD event = " + event.json)
//        } else if (event.eventType == SignalingEventType.group_call_event_check.ordinal) {
//            val gson = Gson()
//            val conferenceCallInfo = gson.fromJson(String(event.json!!), ConferenceCallMessageInfo::class.java)
//            val callId = conferenceCallInfo.callId
////            if(needToDeleteGroup){
////                needToDeleteGroup = false
////                val conversation:Conversation?  = if(conferenceCallInfo.getRoomName() != null){
////                    ZangiEngine.getInstance().storageService.getConversationItemByChat(conferenceCallInfo.getRoomName())
////                } else {
////                    null
////                }
////                val callExist  = if(conferenceCallInfo.getIsCallExist() != null) {
////                    conferenceCallInfo.getIsCallExist()!!
////                } else {
////                    0
////                }
////
////                return
////            }
//
//            if (conferenceCallInfo.isCallExist == 0) {
//                ZangiEngine.getInstance().storageService.updateRecentEndTime(System.currentTimeMillis(), callId)
//                MainApplication.getMainContext().sendBroadcast(Intent(Constants.UPDATE_RECENT_LIST_UI_KEY))
//            }
//
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_CHECK")
//        } else if (event.eventType == SignalingEventType.group_call_event_mute.ordinal) {
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_MUTE")
//        } else if (event.eventType == SignalingEventType.group_call_event_mute_all.ordinal) {
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_MUTE_ALL")
//        } else if (event.eventType == SignalingEventType.group_call_event_change_initiator.ordinal) {
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_CHANGE_INITIATOR")
//        } else if (event.eventType == SignalingEventType.group_call_event_end.ordinal) {
//            Log.i("ssssssssssssssssssss", "RTMP_GROUP_CALL_EVENT_END")
//        }
//    }

    fun checkGroupExist(msg: ZangiMessage, gc: Group) {
        val msgInfo = msg.msgInfo
        try {
            val info = Gson().fromJson(msgInfo, ConferenceCallMessageInfo::class.java)
            if (info != null) {
                val callId = info.callId
                if (callId != null && !callId.isEmpty()) {
                    val recent = ZangiEngine.getInstance().storageService.getRecentByCallId(callId)
                    if (recent != null && recent.group == null) {
                        gc.recentId = recent.id
                        recent.group = gc
                        ZangiEngine.getInstance().storageService.updateGroupRecentId(gc)
                        ZangiEngine.getInstance().storageService.updateRecentGroupFieldId(gc.filedId!!, recent.id)
                        val intent = Intent()
                        intent.putExtra("callId", recent.callId)
                        NotificationCenter.postNotificationName(NotificationCenter.NotificationType.UPDATE_RECENT_ITEM, intent)
                    }
                }
            }
        } catch (e: Exception) {
            Log.i("", e.message)
        }
    }

    fun checkRecentUpdate(group: Group) {
        val recent = ZangiEngine.getInstance().storageService.getRecentByGroupFieldId(group.filedId)
        if (recent != null) {
            group.recentId = recent.id
            ZangiEngine.getInstance().storageService.updateGroupRecentId(group)
            NotificationCenter.postNotificationName(NotificationCenter.NotificationType.UPDATE_RECENT_LIST, null)
        }
    }

    enum class ErrorScreenType{
        NONE, CALL_EXIST, CALL_INVALID, CALL_NOT_EXIST, NOT_ALLOWED
    }

    private val conferenceSyncObject: Any = Any()
    private val factory: ConferenceManagerFactory = ConferenceManagerFactory()

    fun reciveGroupCallMessage(message: ZangiMessage) : Boolean {
        this.onConferenceInfoEvent(message)
        val isAdd = message.canAddConferenceMessageToConversation()
        if (!isAdd) {
            this.messageRecivedFinish(message)
        }

        return isAdd
    }

    fun onConferenceInfoEvent(message: ZangiMessage) {
        synchronized(this.conferenceSyncObject) {
            val model = AVSession.activeSession
            val bean = message.getConference()

            if (model != null){
                if (model.startTime > bean.time && bean.time > 0) {
                    Log.e(TAG, "ConferenceTime -> Came late message of conference callId = ${message.conferenceCallId}, callTime = ${model.startTime}, infoTime = ${bean.time}, type = ${message.messageType}")
                    return
                }
            }

            this.factory.onConferenceInfoEvent(message)
        }
    }

    fun messageRecivedFinish(message: ZangiMessage){
        if (message.groupId() == ""){
            return
        }

        this.notifyConversationControllerAboutJoinChange(message.groupId())
    }

    private fun notifyConversationControllerAboutJoinChange(groupId: String?){
        val conversationId = ZangiEngine.getInstance().messagingService.conversationManager.getConversaitonId()
        if (conversationId == groupId) {
            ZangiEngine.getInstance().messagingService.conversationManager?.changeJoinView()
        }
    }

    fun onStartGroupCall(message: ZangiMessage){
        this.setGroupCallId(message)
       // MessagingService.messagingService?.processConferenceIns(message)
    }

    fun onGroupCallCurrentMembers(message: ZangiMessage){
        this.setGroupMembersCallStates(message)
        this.setGroupCallId(message)

        val model: AVSession? = AVSession.getSession(message.conferenceCallId)

        if (model?.isCallActive != true && this.pendingConferenceId != message.groupId()){
            return
        }

        this.changeOrCreateCurrentMembersInConference(message)
    }

    fun onJoinGroupCall(message: ZangiMessage){
        this.setGroupMemberCallState(message)

        val model = AVSession.getSession(message.conferenceCallId)

        if (model?.isCallActive != true){
            return
        }

        this.roomCallJoin(message)
    }

    fun setGroupMemberCallState(message: ZangiMessage) {
        if (message.conversation == null) {
            return
        }

        if (message.messageType == MessageType.join_group_call) {
            if (!this.isGroupCallClosed(message.conferenceCallId)){
                val number = message.from
                val email = message.email
                message.conversation!!.changeGroupMemberCallState(number, email, GroupMemberCallState.inCall)
            }
        } else if (message.messageType == MessageType.leave_group_call){
            val number = message.from
            val email = message.email
            message.conversation!!.changeGroupMemberCallState(number, email, GroupMemberCallState.none)
        } else if (message.messageType == MessageType.end_group_call ||
                message.messageType == MessageType.decline_group_call) {
            message.conversation!!.changeAllGroupMemberCallState(GroupMemberCallState.none)
        }
    }

    fun onLeaveGroupCall(message: ZangiMessage){
        if (!this.isLeaveMessageActual(message)){
            return
        }

        this.setGroupMemberCallState(message)

        val model = AVSession.getSession(message.conferenceCallId)

        if (model == null || !model.isCallActive){
            return
        }

        this.roomCallLeave(message)
    }

    private fun isLeaveMessageActual(message: ZangiMessage): Boolean {
        val messages = MessageDao.getMessagesByGroupCallId(message.conferenceCallId)

        for (oldMessage in messages) {
            if (oldMessage.messageType == MessageType.end_group_call) {
                return false
            }

            if (oldMessage.messageType != MessageType.join_group_call) {
                continue
            }

            if (oldMessage.from != message.from) {
                continue
            }

            if (oldMessage.time > message.time) {
                return false
            }
        }

        return true
    }

    fun onDeclineGroupCall(message: ZangiMessage){
        this.setGroupMemberCallState(message)
        this.setGroupCallId(message)
        this.roomCallDecline(message)
    }


    fun onGroupCallVideo(infoEvent: MessageConference){

    }

    fun onRingingGroupCall(infoEvent: MessageConference){
        if(!handleMessageOrNo(infoEvent.callId)) {
            return
        }

        val from = infoEvent.from
        if (from == myRegisterNumber) {
            changeMemberCallStatus(from!!, GroupMember.CallState.RINGING)
            return
        }
        addUiEvent(from!!, GroupMember.CallState.RINGING)
        changeMemberCallStatus(from, GroupMember.CallState.RINGING)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            uiListener?.get()?.updateCallStatus(from, GroupMember.CallState.RINGING)
        } else {
            this.uiHandler.post {
                uiListener?.get()?.updateCallStatus(from, GroupMember.CallState.RINGING)
            }
        }
    }

    fun onGroupChangeInitiator(infoEvent: MessageConference){
        val groupUid = infoEvent.groupId
        val callId = infoEvent.callId
        if (groupUid == roomName && handleMessageOrNo(callId)) {
            callInitiator = if (infoEvent.initiator != null) {
                infoEvent.initiator!!
            } else {
                ""
            }
        }
    }

    fun onEndGroupCall(message: ZangiMessage){
        this.setGroupCallId(message)
        this.setGroupMemberCallState(message)
        this.roomCallEnd(message)
    }

    fun setGroupCallId(message: ZangiMessage) {
        if (message.messageType == MessageType.group_call_current_members){
            if (this.hasStartMessage(message.conferenceCallId)){
                return
            }

            if (message.conferenceCallId != null) {
                this.setCallIdIntoGroup(message, message.conferenceCallId)
            } else {
                this.setCallIdIntoGroup(message, null)
            }
        } else if (message.messageType == MessageType.end_group_call ||
                message.messageType == MessageType.decline_group_call) {
            this.setCallIdIntoGroup(message, null)
        } else if (message.messageType == MessageType.start_group_call) {
            this.setCallIdIntoGroup(message, message.conferenceCallId)
        }
    }

    private fun setCallIdIntoGroup(message: ZangiMessage, callId: String?) {
        val conversation = ZangiEngine.getInstance().storageService.getConversationItemByChat(message.groupId())
        if (callId != null && !this.isGroupCallClosed(callId)){
            Log.i(TAG, "setGroupCallId -> ${message.conferenceCallId  ?: ""}) group = ${message.groupId()}")
            conversation?.setCallId(callId)
        } else {
            Log.i(TAG, "setGroupCallId -> end_group_call group = ${message.groupId()}")
            conversation?.setCallId(null)
        }
    }

    fun isGroupCallClosed(callId: String?) : Boolean {
        val messages = MessageDao.getMessagesByGroupCallId(callId)

        for (message in messages) {
            if (message.messageType == MessageType.end_group_call) {
                Log.e(TAG, "Group call closed cant continue $callId")
                return true
            }
        }

        return false
    }

    private fun isConferenceActiveFromCurrentMembers(bean: MessageConference) : Boolean {
        val memberStatusMap = bean.memberStatusMap ?: return false

        for ((_, value) in memberStatusMap) {
            val state = value as? String
            if (state == "JOIN") {
                return true
            }
        }

        return false
    }

    fun hasStartMessage(callId: String?) : Boolean {
        val messages = MessageDao.getMessagesByGroupCallId(callId)

        for (message in messages) {
            if (message.messageType == MessageType.start_group_call){
                return true
            }
        }

        return false
    }

    fun setGroupMembersCallStates(message: ZangiMessage) {
        if (message.conversation == null) {
            return
        }

        if (this.hasStartMessage(message.conferenceCallId)) {
            return
        }

        if (this.isGroupCallClosed(message.conferenceCallId)) {
            return
        }

        val bean = message.getConference()
        val memberStatusMap = bean.memberStatusMap

        if (memberStatusMap == null) {
            return
        }

        for ((number, value) in memberStatusMap) {
            val state = value as? String
            if (state == "JOIN") {
                val member = message.conversation?.getGroupMember(number, null)
                if (member == null) {
                    GroupMember.createGroupMemeber(number, null, MemberRole.MEMBER, message.conversation!!)
                }

                message.conversation?.changeGroupMemberCallState(number, null, GroupMemberCallState.inCall)
            } else {
                message.conversation?.changeAllGroupMemberCallState(GroupMemberCallState.none)
            }
        }
    }

    fun reciveVoiceActivity(users: List<ConferenceVoiceActivityUser>) {
//        CallViewManager.shared().getCallView().conferenceViewModel.onVoiceActivity(users)
    }

    fun sessionExpired(){
        val model = AVSession.activeSession ?: return
        model.closeCall()

        val conversation = ConversationDao.getConversationWithUid(AVSession.roomName)
        if (conversation?.getCallId() != null){
            conversation.setCallId(null)
        }

        mainThread {
            ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_NOT_EXIST.ordinal)
        }
    }

    fun firstAudio(){
        ZangiEngine.getInstance().signallingService.onFirstAudio(AVSession.callId ?: "")
    }

    fun connectionFailed(){
        val model = AVSession.activeSession ?: return

        model.closeCall()

        val conversation = ConversationDao.getConversationWithUid(AVSession.roomName)
        if (conversation?.getCallId() != null){
            conversation.setCallId(null)
        }

        mainThread {
            ZangiEngine.getInstance().signallingService.getSignalingManager()?.openConferenceCallScreen(ErrorScreenType.CALL_INVALID.ordinal)
        }
    }

    fun onHistoryOfParticipants(participants: Array<out ZConferenceParticipant>?){
        if (participants == null){
            return
        }

        for (participant in participants) {



            val number = participant.name ?: ""

            mainThread {
                Log.i(TAG, "history -> $number")
                this.addJoinedMember(number)
                changeMembersCallStatusIfNeeded("JOIN", number)
                notifyUIForMemberChange()

                asyncThread {
                    for ((propertyId, value) in participant.all) {
                        if (propertyId == 123) {
                            continue
                        }

                        this.updatePropertyConfCallBack(participant.name, participant.name, propertyId, value)
                    }
                }
            }
        }
    }
}

interface ConferenceCallUiListener {
    fun updateCallStatus(jid: String, state: GroupMember.CallState)
    fun callLeave(jid: String)
    fun callDecline(jid: String)
    fun inCallMembersChange()
    fun callEnd()
    fun showMuteAlert()
    fun onMuteChanged()
    fun changeHold(from: String, isHold: Boolean)
    fun performMuteAction()
    fun performUnMuteAction()
}

class ConferenceCallMessageInfo {
    @SerializedName("callId")
    @Expose
    var callId: String? = null
    @SerializedName("roomName")
    @Expose
    var roomName: String? = null
    @SerializedName("vStreamId")
    @Expose
    var vStreamId: Int? = null
    @SerializedName("videoOn")
    @Expose
    var videoOn: Int? = null
    @Expose
    var isValid: Int? = null
    @Expose
    var isCallExist: Int? = null
    @SerializedName("joinedMemberList")
    @Expose
    var joinedMemberList: ArrayList<String>? = null
    @Expose
    var memberStatusMap: HashMap<String, String>? = null
    @SerializedName("initiator")
    @Expose
    var initiator: String? = null
    @Expose
    var participantMuteMap: HashMap<String, String>? = null
    @Expose
    var participantHoldMap: HashMap<String, Int> = HashMap()
    @SerializedName("membersIds")
    @Expose
    var membersIds: MutableList<MemberStreamId>? = null
}

class MemberStreamId{
    @SerializedName("number")
    @Expose
    var number: String? = null
    @SerializedName("id")
    @Expose
    var id: Int? = null
}

enum class ConferenceCallJoinStatus(value: Int){
    CONFCALL_JOIN_CALL_INVALIED(0),
    CONFCALL_JOIN_CALL_VALIED(1),
    CONFCALL_JOIN_ALREADY_JOINED(2),
    CONFCALL_JOIN_CALL_NOT_ALLOWED(3),

}
