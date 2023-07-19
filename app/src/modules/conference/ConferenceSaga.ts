"use strict";

import {all, call, delay, put, select, takeEvery} from "redux-saga/effects";

import {
    addAllMembersMuted,
    changedConferenceDetails, changedConferenceInfo, changedVoiceActivityMembers,
    changeInitiatorSuccess, getedStartMessage,
    hideConference,
    holdMembers,
    removeAllMembersMuted,
    removeConference,
    removeIncomingCall,
    setCallId, setCurrentMember,
    setStatuses, showConference,
    startedConference, toggleInitiatorPopup,
    toggleLeaveGroupCallPopup,
    toggleMemberMuted, toggleStartedConference,
    toggleUnMuteLoading, toggleUnMutePopup,
    updatePropertyConferenceCallBack,
} from "modules/conference/ConferenceActions";
import {
    leave as leaveAction
} from "modules/conference/ConferenceActions";
import {
    acceptXML, ackConferenceXML, addMembersXML,
    cancelXML, changeInitiatorXML,
    checkXML,
    createXML,
    declineXML,
    joinXML,
    leaveXML,
    ringingXML
} from "modules/conference/ConferenceXMLBuilders";
import {
    getConferenceCallIdSelector,
    getConferenceInfoSelector,
    getConferenceMembersSelector
} from "modules/conference/ConferenceSelector";
import {getLastCallSelector} from "modules/call/CallSelector";
import {actions} from "modules/conference/ConferenceReducer";
import {addCall, removeCall} from "modules/call/CallActions";
import IDBThreads from "services/database/class/Threads";
import connectionCreator from "xmpp/connectionCreator";
import {CALL_STATUSES} from "configs/constants";

import {getPartialId} from "helpers/DataHelper";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import Log from "modules/messages/Log";
import {ZConferenceListener} from "modules/conference/ZConferenceListener";
import {ZConferenceClient} from "modules/conference/ZConferenceClient";
import {ZConferenceListenerRenderer} from "modules/conference/ZConferenceListenerRenderer";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import {ZConferenceParticipant} from "modules/conference/ZConferenceParticipant";
import {ConfIntToParticipantId} from "modules/conference/ConfIntToParticipantId";
import IDBConversation from "services/database/class/Conversation";
import {updateConversationProps} from "modules/conversations/ConversationsActions";
import {userNameSelector} from "modules/user/UserSelector";
import {GROUP_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";

let audioClient = null
let conferenceListenerRenderer = null

class LoopBackWebRtc {
    rtcConnection = null;
    rtcLoopbackConnection = null;
    loopbackStream = null;
    audioContext = null;
    recorderNode = null;
    destinationNode = null;
    globalStream = null;
    createAudio = (withStart: boolean) =>
    {
        this.audioContext = new AudioContext();

        console.log("audio is starting up 1...");
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia){
            navigator.getUserMedia({audio:true},
                async (stream) => {
                    await this.initAudio(stream);
                    if (withStart) {
                        this.startAudio()
                    }
                },
                (e) => {
                    alert('Error capturing audio.');
                }
            );

        } else { alert('getUserMedia not supported in this browser.');
        }

    };

    async initAudio(stream)
    {
        this.globalStream = stream;
        console.log("initAudioContext start Audio");
        await this.audioContext.audioWorklet.addModule('assets/audio-capture-player.js')
        console.log("initAudioContext start Audio 0");

        this.destinationNode = this.audioContext.createMediaStreamDestination();
        console.log("initAudioContext start Audio 1", this.destinationNode);

        this.loopbackStream = await this.createLoopbackConnection(this.destinationNode);
        console.log("initAudioContext start Audio 2");

    }

    startAudio = (): void => {
        console.log("startAudio -> this", this)
        this.createWorker();
        console.log("startAudio start Audio 0");
        let microphone_stream = this.audioContext.createMediaStreamSource(new MediaStream([this.globalStream.getAudioTracks()[0]]));
        console.log("startAudio start Audio 1");
        microphone_stream.connect(this.recorderNode);
        console.log("startAudio start Audio 2");
        this.recorderNode.connect(this.destinationNode);
        console.log("startAudio start Audio 3");
        const audioElement: any = document.getElementById("audio-element");
        audioElement.srcObject = this.loopbackStream;
        audioElement.autoplay = true;
    }

    createWorker()
    {
        this.recorderNode = new window.AudioWorkletNode(
            this.audioContext,
            'zangi-worklet',
        );
        this.recorderNode.port.onmessage = (event) => {
            if (event.data.eventType === 'data') {
                const audioData = event.data.audioBuffer;
                audioClient.sendAudio(audioData)
                // process pcm data
            } else if (event.data.eventType === 'get') {
                audioClient.getAudio();
                // process pcm data
            }
        };

    }

    getSampleRate()
    {
        return this.audioContext.sampleRate;
    }

    playData(data)
    {
        this.recorderNode.port.postMessage(data);
    }

    mute()
    {
        const capturingParam = this.recorderNode.parameters.get('isCapturing');
        Log.i("capturingParam -> mute ", capturingParam)
        capturingParam.setValueAtTime(0, this.audioContext.currentTime);
    }

    unmute()
    {
        const capturingParam = this.recorderNode.parameters.get('isCapturing');
        Log.i("capturingParam -> unmute ", capturingParam)
        capturingParam.setValueAtTime(1, this.audioContext.currentTime);
    }
    close() {
        this.recorderNode.port.postMessage({
            eventType: "stop",
        });
        this.audioContext.close();
    }
    async createLoopbackConnection(stream)
    {

        this.loopbackStream = new MediaStream(); // this is the stream you will read from for actual audio output
        const offerOptions = {
            offerVideo: true,
            offerAudio: true,
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
        };
        let offer, answer;
// initialize the RTC connections
        this.rtcConnection = new RTCPeerConnection();

        this.rtcLoopbackConnection = new RTCPeerConnection();
        this.rtcConnection.onicecandidate = e =>
            e.candidate && this.rtcLoopbackConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
        this.rtcLoopbackConnection.onicecandidate = e =>
            e.candidate && this.rtcConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
        this.rtcLoopbackConnection.ontrack = e =>
            e.streams[0].getTracks().forEach(track => this.loopbackStream.addTrack(track));
// setup the loopback
        this.rtcConnection.addStream(stream.stream); // this stream would be the processed stream coming out of Web Audio API destination node
        offer = await this.rtcConnection.createOffer(offerOptions);
        console.log("rtcConnection -> offer = ", this.rtcConnection, offer)
        await this.rtcConnection.setLocalDescription(offer);

        await this.rtcLoopbackConnection.setRemoteDescription(offer);
        answer = await this.rtcLoopbackConnection.createAnswer();

        await this.rtcLoopbackConnection.setLocalDescription(answer);
        await this.rtcConnection.setRemoteDescription(answer);
        return this.loopbackStream;
    }
}


export let loopBackClient = null;
function initAudioContext(withStart: boolean): any {
    console.log("initAudioContext22222", loopBackClient);
    if (!loopBackClient) {
        loopBackClient = new LoopBackWebRtc();
    }
    return loopBackClient.createAudio(withStart);
}

function* startCall({payload: {groupId, ownCall}}: any) {

    // this.audioClient = new ZConferenceClient(this.audioListener)
    // this.audioClient?.createAudioCall("12345", AppUserManager.userNumber)
    try {

        // If initiator is current user send create
        Log.i("conference -> isCreated = ", ownCall)
        const store: Store<any> = storeCreator.getStore();
        const {user} = selector(store.getState(), {user: true});
        const username = user.get("username");





/////////////////////
//      TODO call initAudioContext(), when finish loopBackClient.startAudio()
        if (!loopBackClient) {
            loopBackClient = new LoopBackWebRtc();
        }

        yield call(initAudioContext, true)


       //initAudioContext();
///////////////////////////////////
        //Log.i("conference -> startCall -> sampleRate = ", this.audioContext.sampleRate);
        audioClient = new ZConferenceClient(loopBackClient.getSampleRate());


        Log.i("conference -> startCall -> ownCall = ", ownCall)

        if (!conferenceListenerRenderer) {
            conferenceListenerRenderer = ZConferenceListenerRenderer
            conferenceListenerRenderer(groupId)
        }

        // ZConferenceListenerRenderer(groupId)

        if (ownCall) {
            audioClient.createAudioCall("12345", username)
        }

        const [members, group] = yield all([
            call(IDBThreads.selectGroupMembers, {groupId}),
            call(IDBThreads.selectGroup, {groupId})
        ]);

        const statuses: any = {};



        for (const item in members.records) {
            const store: Store<any> = storeCreator.getStore();
            const {user} = selector(store.getState(), {user: true});
            const username = user.get("username");
            Log.i("conferenceData -> item = ", item);
            if (members.records.hasOwnProperty(item) && item.includes(username)) {
                statuses[item] = CALL_STATUSES.calling;
            }
        }

        // yield put(startedConference(members.records, group.records, statuses));
        // yield put(startedConference({}, group.records, {}));
        Log.i("conference -> startCall -> audioClient = ", audioClient)
        yield put(changedConferenceInfo(group.records));
        yield put(updateConversationProps(groupId, {
            statusMap: statuses,
            joinedList: members.records
        }))
        yield put(showConference());

        // audioClient.getAudio()

    } catch (e) {
        console.log(e);
    }
}

function* getAudioCallSaga({payload: {data}}: any) {
    if (loopBackClient) {
        loopBackClient.playData(data);
    }


}

function* onJoinCall({payload: {groupId, callId}}: any) {
    // if (!audioClient) {
    /////////////////////
    //TODO call loopBackClient.startAUdio() if initAudioContext finished
    //initAudioContext();

    if (!loopBackClient) {
        loopBackClient = new LoopBackWebRtc();
        loopBackClient.createAudio(true)
    } else {


        // yield call(initAudioContext)
        yield call(loopBackClient.startAudio)
    }

///////////////////////////////////
        audioClient = new ZConferenceClient(loopBackClient.getSampleRate())
    // }

    if (!conferenceListenerRenderer) {
        Log.i("conference -> conferenceListenerRenderer", conferenceListenerRenderer)
        conferenceListenerRenderer = ZConferenceListenerRenderer
        conferenceListenerRenderer(groupId)
    }
    Log.i("conference -> audioClient 2", conferenceListenerRenderer)
    Log.i("conference -> callId", callId)
    const store: Store<any> = storeCreator.getStore();
    const {user} = selector(store.getState(), {user: true});
    const username = user.get("username");

    // let conferenceId: number = Number(callId)
    let conferenceId: number = callId
    audioClient.joinAudioCall(conferenceId, username)
}

function* onHistoryOfParticipants({payload: {participants}}: any) {

    Log.i("conference -> participants = ", participants)

    if (participants == null){
        return
    }

    const statuses = participants.reduce((acc, item) => {
        acc[`${item.name}@msg.hawkstream.com`] = CALL_STATUSES.calling;


        return acc
    }, {})

    // yield put(setStatuses(statuses))

    for(const item of participants) {
        for (const prop in item.properties) {
            if (Number(prop) === ConfIntToParticipantId.unMute) {
                yield put(toggleUnMutePopup(true))
            } else {
                yield put(updatePropertyConferenceCallBack(item.name, item.name, Number(prop), item.properties[prop]))
            }
        }
    }






    // for (participant in participants) {
    //
    //
    //
    //     val number = participant.name ?: ""
    //
    //     mainThread {
    //         Log.i(TAG, "history -> $number")
    //         this.addJoinedMember(number)
    //         changeMembersCallStatusIfNeeded("JOIN", number)
    //         notifyUIForMemberChange()
    //
    //         asyncThread {
    //             for ((propertyId, value) in participant.all) {
    //                 if (propertyId == 123) {
    //                     continue
    //                 }
    //
    //                 this.updatePropertyConfCallBack(participant.name, participant.name, propertyId, value)
    //             }
    //         }
    //     }
    // }
}

function* updatePropertyConfCallBack({payload: {ownerName, userName, propId, value}}: any) {
    Log.i("conference -> updatePropertyConfCallBack -> payload = ", ConfPropertyId.get(propId))
    const store: Store<any> = storeCreator.getStore();
    const {conferenceDetails, conversations} = selector(store.getState(), {
        conferenceDetails: true,
        conversations: true
    });
    const groupId: string = conferenceDetails.getIn(["info", "threadId"]);
    const groupInfo = conversations.get(groupId).toJS().threads

    const threadInfo: any = groupInfo.threadInfo
    const joinedList: any = threadInfo.joinedList
    Log.i("conference -> joinedList = ", joinedList)

    if (propId === ConfPropertyId.mute.valueOf()) {
        Log.i("conference -> updatePropertyConfCallBack -> mute = 1", ConfPropertyId.mute.valueOf())
        // yield put(toggleMemberMuted(`${userName}@msg.hawkstream.com`, value === "0" ? false : true))
        if (value === "0") {
            joinedList[`${userName}@msg.hawkstream.com`].muted = false;
        } else {
            joinedList[`${userName}@msg.hawkstream.com`].muted = true;
        }

        if (value === "0") {
            Log.i("conference -> updatePropertyConfCallBack -> mute = 2", ConfPropertyId.mute.valueOf())
            joinedList[`${userName}@msg.hawkstream.com`].unMuteLoader = false
            // yield put(toggleUnMuteLoading(`${userName}@msg.hawkstream.com`, false))
        }
    }

    if (propId === ConfPropertyId.hold.valueOf()) {
        if (value === "0") {
            joinedList[`${userName}@msg.hawkstream.com`].hold = false;
        } else {
            joinedList[`${userName}@msg.hawkstream.com`].hold = true;
        }
        // yield put(holdMembers({userName: value === "0" ? false : true}))
    }

    if (propId === ConfPropertyId.muteAll.valueOf()) {
        Log.i("conference -> updatePropertyConfCallBack -> muteAll = ", ConfPropertyId.mute.valueOf())
        Log.i("conference -> updatePropertyConfCallBack -> value = ", value)
        if (value === "0") {
            yield put(toggleUnMutePopup(true))
            // yield put(removeAllMembersMuted(conferenceDetails.get("members").keySeq()))
        }
        if (value === "1") {
            for (const item in joinedList) {
                joinedList[item].muted = true
            }
            // yield put(addAllMembersMuted(conferenceDetails.get("members").keySeq()))
        }
    }
    yield all([
        call(IDBConversation.updateGroup, groupId, {
            joinedList
        }),
        put(updateConversationProps(groupId, {
            joinedList
        }))
    ]);
}

function* setConferenceProperty({payload: {propertyId, value}}){
    Log.i("conference -> saga -> propertyId 1", propertyId.valueOf())
    Log.i("conference -> saga -> value", value)
    const store: Store<any> = storeCreator.getStore();
    const {user, conferenceDetails} = selector(store.getState(), {user: true, conferenceDetails: true});
    const username = user.get("username");
    if (propertyId.valueOf() === 0 && value === "1") {
        conferenceMute()
    }
    if (propertyId.valueOf() === 0 && value === "0") {
        conferenceUnMute()
    }
    audioClient.setProperty(propertyId.valueOf(), value, username)
}

function conferenceMute() {
    Log.i("conference -> saga -> mute")
    loopBackClient.mute();
}

function conferenceUnMute() {
    Log.i("conference -> saga -> unmute")
    loopBackClient.unmute();
}

function* intToParticipant({payload: {rawValue, memberNumber}}: any) {
    Log.i("conference -> intToParticipant -> rawValue = ", rawValue)
    audioClient.intToParticipant(rawValue, memberNumber)
}

function stopConferenceCall() {
    if (audioClient) {
        audioClient.leaveAudioCall()
    } else {
        const store: Store<any> = storeCreator.getStore();
        const {calls} = selector(store.getState(), {
            calls: true
        });
        const lastCall = calls.valueSeq().first()
        // const lastCall: any = select(getLastCallSelector());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;
        Log.i("conference -> lastCall = ", lastCall)

        if (lastCall) {
            const callId: string = lastCall.get('callId');
            store.dispatch(removeCall(callId))
        }


        store.dispatch(hideConference())

    }
}

function* changingConferenceDetailsOpt({payload: {callId, groupId, messageInfo, from, initiator}}: any) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {conferenceDetails, conversations, contacts, user} = selector(store.getState(), {conferenceDetails: true, conversations: true, contacts: true, user: true});
        Log.i("conference -> groupId = ", conversations.get(groupId))
        const conferenceMembers = conferenceDetails.get("members").toJS()
        Log.i("conference -> conferenceMembers = ", conferenceMembers)
        const groupInfo = conversations.get(groupId).toJS().threads
        Log.i("conversations -> threadInfo", groupInfo.threadInfo)
        const threadInfo: any = groupInfo.threadInfo
        const activeMembers: any = threadInfo.activeMembers || {}
        const pasiveMembers: any = threadInfo.pasiveMembers || {}
        const id = user.get("id")
        const member: any = contacts.getIn([id, "members", id]).toJS()
        pasiveMembers[id] = member
        let currentActiveMember: any = threadInfo.currentActiveMember || null

        const joinedList = messageInfo.joinedMemberList.reduce((acc, item) => {
            const id = item + "@msg.hawkstream.com"
            const member: any = contacts.getIn([id, "members", id]).toJS()
            if(!currentActiveMember && id !== user.get("id")) {
                currentActiveMember = member
            }
            acc[id] = acc[id] ? {...member, ...acc[id]} : member
            const activeMembersLength = Object.keys(activeMembers).length
            if (id !== user.get("id") && !activeMembers[id] &&  activeMembersLength < 4) {
                activeMembers[id] = activeMembers[id] ? {...member, ...activeMembers[id]} : member
            } else {
                if (!pasiveMembers[id] && !activeMembers[id]) {
                    pasiveMembers[id] = pasiveMembers[id] ? {...member, ...pasiveMembers[id]} : member
                }
            }
            return acc
        }, threadInfo.joinedList || {})

        joinedList[id] = joinedList[id] ? {...member, ...joinedList[id]} : member

        Log.i("conference -> joinedList = ", joinedList)

        const statusMap = {}
        for (const item in messageInfo.memberStatusMap) {
            const id = item + "@msg.hawkstream.com"
            statusMap[id] = messageInfo.memberStatusMap[item].toLowerCase()
        }

        // const userId: string = user.get("id");
        // const userMember: any = contacts.getIn([userId, "members", userId]).toJS()
        // pasiveMembers[userId] = userMember

        yield all([
            // put(changedConferenceInfo(groupInfo)),
            // put(changedConferenceDetails(joinedList, groupInfo, statusMap)),
            // put(setCallId(callId)),
            call(IDBConversation.updateGroup, groupId, {
                statusMap,
                joinedList,
                activeMembers,
                pasiveMembers,
                currentActiveMember,
                callId,
                conferenceLastCall: {callId, deleted: null}
            }),
            put(updateConversationProps(groupId, {
                statusMap,
                joinedList,
                activeMembers,
                pasiveMembers,
                currentActiveMember,
                callId,
                conferenceLastCall: {callId, deleted: null}
            }))
        ]);
    } catch (e) {
        console.log(e);
    }
}

function* changingVoiceActivityMembers({payload: {participants}}: any) {
    try {
        Log.i("conference -> changingVoiceActivityMembers -> participants = ", participants)
        const store: Store<any> = storeCreator.getStore();
        const {conferenceDetails, conversations, user} = selector(store.getState(), {
            conferenceDetails: true,
            conversations: true,
            user: true
        });
        const groupId: string = conferenceDetails.getIn(["info", "threadId"]);
        Log.i("conference -> changingVoiceActivityMembers -> groupId = ", groupId)
        const groupInfo = conversations.get(groupId).toJS().threads

        const threadInfo: any = groupInfo.threadInfo
        const activeMembers: any = threadInfo.activeMembers || {}
        const pasiveMembers: any = threadInfo.pasiveMembers || {}
        const joinedList: any = threadInfo.joinedList || {}
        let currentActiveMember: any = threadInfo.currentActiveMember || null


        const members = !!participants.length ? participants.reduce((acc, item) => {
            const id = item.userName + "@msg.hawkstream.com"

            if (activeMembers[id]) {
                activeMembers[id].startActivity = item.startActivityTime
                activeMembers[id].lastActivity = item.lastActivityTime
            }

            if (id !== user.get("id")) {
                const c_member = joinedList[id];
                currentActiveMember = c_member
            }

            if (pasiveMembers[id] && id !== user.get("id")) {
                const member = pasiveMembers[id]
                member.startActivity = item.startActivityTime
                member.lastActivity = item.lastActivityTime
                delete pasiveMembers[id]

                let pasiveMember = {
                    member: null,
                    dif: Number.MIN_VALUE
                }

                for (const prop in activeMembers) {
                    if(!activeMembers[prop].lastActivity) {
                        pasiveMember["member"] = prop
                        pasiveMember["dif"] = Number.MIN_VALUE
                        delete activeMembers[prop]
                        break
                    }

                    const dif = Date.now() - activeMembers[prop].lastActivity

                    if (dif > pasiveMember.dif) {
                        pasiveMember["member"] = prop
                        pasiveMember["dif"] = dif
                    }
                }

                if (pasiveMember["dif"] > 0) {
                    delete activeMembers[pasiveMember["member"]]
                }
                activeMembers[id] = member
            }

            acc[id] = item
            return acc
        }, {}) : {}

        // if (participants.length === 0) {
        //     yield delay(1000)
        // } else {
        //     yield put(setCurrentMember(participants[0].userName))
        // }

        if (participants.length > 0 && !conferenceDetails.get("startedConference")) {
            yield put(toggleStartedConference(true))
        }

        yield put(updateConversationProps(groupId, {
            activeMembers,
            pasiveMembers,
            currentActiveMember
        }))

        yield put(changedVoiceActivityMembers(members))

        yield call(IDBConversation.updateGroup, groupId, {
            activeMembers,
            pasiveMembers,
            currentActiveMember
        })

    } catch (e) {
        console.log(e);
    }
}

function* ringing({payload: {call}}: any) {
    try {
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        const msg: Strophe.Builder = ringingXML({
            id,
            callId: call.callId,
            groupId: call.groupId,
            to: call.to,
            info: call.callInfo
        });

        if (connection.connected) {
            // Send ringing
            connection.send(msg);
        }

        call.status = CALL_STATUSES.ringing;
        yield all([
            put(addCall(call)),
            put(setCallId(call.callId))
        ]);

    } catch (e) {
        console.log(e, "CONFERENCE RINGING ERROR");
    }
}

function* accept() {
    try {
        const lastCall: any = yield select(getLastCallSelector());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;
        const info: any = {
            dwidth: lastCall.getIn(['callInfo', 'device', 'width']),
            dheight: lastCall.getIn(['callInfo', 'device', 'height']),
            acandidate: lastCall.getIn(['callInfo', 'audio', 'candidate']),
            acodec: lastCall.getIn(['callInfo', 'audio', 'codec']),
            vcandidate: lastCall.getIn(['callInfo', 'video', 'candidate']),
            vcodec: lastCall.getIn(['callInfo', 'video', 'codec']),
            version: lastCall.getIn(['callInfo', 'version']),
            prototype: lastCall.getIn(['callInfo', 'callPrototype']),
        };

        const msg: Strophe.Builder = acceptXML({
            id,
            callId: lastCall.get('callId'),
            to: lastCall.get('to'),
            info
        });

        if (connection.connected) {
            // Send accept
            connection.send(msg);
        }

        yield put(removeIncomingCall());


    } catch (e) {
        console.log(e, "CONFERENCE ACCEPT ERROR");
    }
}

function* decline() {
    try {
        const lastCall: any = yield select(getLastCallSelector());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;
        const callId: string = lastCall.get('callId');
        const msg: Strophe.Builder = declineXML({
            id,
            callId,
            to: lastCall.get('to')
        });

        if (connection.connected) {
            // Send decline
            connection.send(msg);
        }

        // Remove incoming screen and remove last call
        yield all([
            put(hideConference()),
            put(removeCall(callId))
        ]);

    } catch (e) {
        console.log(e, "CONFERENCE DECLINE ERROR");
    }
}

function* leave() {
    try {
        if(loopBackClient) {
            loopBackClient.close();
        }
        loopBackClient = null;
        const store: Store<any> = storeCreator.getStore();
        const {conferenceDetails} = selector(store.getState(), {
            startedConference: true
        });
        stopConferenceCall()
        Log.i("conference -> stopConferenceCall = ", conferenceDetails)
        yield put(toggleStartedConference(false))
        yield put(toggleLeaveGroupCallPopup(false))
        yield all([
            put(updateConversationProps(conferenceDetails.getIn(["info", "threadId"]), {unValid: false})),
            call(IDBConversation.updateGroup, conferenceDetails.getIn(["info", "threadId"]), {unValid: false})
        ]);

        // const lastCall: any = yield select(getLastCallSelector());
        // const connection: any = connectionCreator.getConnection();
        // const id: string = `msgId${Date.now()}`;
        // Log.i("conference -> lastCall = ", lastCall)
        //
        // const callId: string = lastCall.get('callId');
        //
        // const msg: Strophe.Builder = leaveXML({
        //     id,
        //     callId,
        //     to: lastCall.get('to')
        // });
        //
        // if (connection.connected) {
        //     // Send leave
        //     connection.send(msg);
        // }
        //
        // yield all([
        //     put(hideConference()),
        //     put(removeCall(callId))
        // ]);

    } catch (e) {
        console.log(e, "CONFERENCE END ERROR");
    }
}

function* check({payload: {groupId}}) {
    try {
        const callId: string = yield select(getConferenceCallIdSelector());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        const msg: Strophe.Builder = checkXML({
            id,
            callId,
            groupId
        });

        if (connection.connected) {
            // Send check
            connection.send(msg);
        }

    } catch (e) {
        console.log(e, "CONFERENCE CHECK ERROR");
    }
}

function* join({payload: {groupId, callId}}) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {conversations} = selector(store.getState(), {conversations: true});
        const username: string = userNameSelector()(store.getState());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        Log.i("conference -> join -> callId = ", callId)
        const conversationId = `${groupId}@${GROUP_CONVERSATION_EXTENSION}/${username}`
        Log.i("conference -> join -> groupId = ", conversationId)
        const groupInfo = conversations.get(conversationId).toJS().threads

        const msg: Strophe.Builder = joinXML({
            id,
            callId,
            groupId
        });

        if (connection.connected) {
            // Send check
            connection.send(msg);
        }
        yield put(changedConferenceInfo(groupInfo))

    } catch (e) {
        console.log(e, "CONFERENCE JOIN ERROR");
    }
}

function* addMembers({payload: {groupId, callId, members}}) {
    try {
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        const msg: Strophe.Builder = addMembersXML({
            id,
            callId,
            groupId,
            members
        });

        if (connection.connected) {
            // Send check
            connection.send(msg);
        }

    } catch (e) {
        console.log(e, "CONFERENCE ADD MEMBERS ERROR");
    }
}

function* cancel({payload: {memberId}}) {
    try {
        const callId: string = yield select(getConferenceCallIdSelector());
        const groupInfo: any = yield select(getConferenceInfoSelector());
        const members: any = yield select(getConferenceMembersSelector());
        const groupId: string = getPartialId(groupInfo.get('threadId'));
        const member: string = members.getIn([memberId, 'username']) || "";
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;
        const msg: Strophe.Builder = cancelXML({
            id,
            callId,
            groupId,
            member
        });

        if (connection.connected) {
            // Send cancel
            connection.send(msg);
        }
    } catch (e) {
        console.log(e, "CONFERENCE CANCEL ERROR");
    }
}

function* end({payload: {groupId}}) {
    try {
        const store: Store<any> = storeCreator.getStore();
        const {showConference, conversations, user, contacts, conferenceDetails} = selector(store.getState(), {showConference: true, conversations: true, user: true, contacts: true});
        const threadInfo = conversations.getIn([groupId, "threads", "threadInfo"])
        const id = user.get("id")
        const member: any = contacts.getIn([id, "members", id]).toJS()
        const callId: string = threadInfo.get("callId")
        const pasiveMembers = {}
        pasiveMembers[id] = member

        Log.i("conference -> room_call_end = member = ", member)
        Log.i("conference -> room_call_end = groupId = ", groupId)
        Log.i("conference -> room_call_end = threadId = ", conferenceDetails.getIn(['info', "threadId"]))
        const bool: boolean = groupId === conferenceDetails.getIn(['info', "threadId"])

        if (bool) {
            yield all([
                put(removeCall(callId)),
                put(removeConference())
            ])
        }

        yield all([
            put(updateConversationProps(groupId, {
                statusMap: {},
                joinedList: {},
                activeMembers: {},
                currentActiveMember: null,
                pasiveMembers,
                callId: "",
                conferenceLastCall: {callId, deleted: true},
                unValid: false
            })),
            call(IDBConversation.updateGroup, groupId, {
                statusMap: {},
                joinedList: {},
                activeMembers: {},
                currentActiveMember: null,
                pasiveMembers,
                callId: "",
                conferenceLastCall: {callId, deleted: true},
                unValid: false
            })
        ]);
        if (audioClient && bool) {
            audioClient.close()
        }
    } catch (e) {
        console.log(e, "CONFERENCE END ERROR");
    }
}

function* closeAudioCall() {
    try {
        audioClient.close()
    } catch (e) {
        console.log(e, "CONFERENCE CLOSE AUDIO CALL ERROR");
    }
}

function* sendAckConference({payload: {id}}) {
    try {
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = ackConferenceXML({
            id
        });

        if (connection.connected) {
            // Send cancel
            connection.send(msg);
        }

    } catch (e) {
        console.log(e, "CONFERENCE END ERROR");
    }
}

function* changeInitiator({payload: {groupId, member}}: any) {
    // this.audioClient = new ZConferenceClient(this.audioListener)
    // this.audioClient?.createAudioCall("12345", AppUserManager.userNumber)
    try {
        const store: Store<any> = storeCreator.getStore();
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        // Log.i("conference -> responseCreateAudioCall -> roomId = ", this.roomId)
        Log.i("conference -> responseCreateAudioCall -> roomId = 2 ", groupId)
        const roomName: string = groupId ? groupId.split("@")[0] : '';

        const msg: Strophe.Builder = changeInitiatorXML({
            id,
            groupId: roomName,
            member
        });

        if (connection.connected) {
            Log.i("conference -> responseCreateAudioCall -> connected = ", groupId)
            connection.send(msg);
        }

        yield put(toggleInitiatorPopup(false))
        yield put(leaveAction())
        yield put(changeInitiatorSuccess(member))
    } catch (e) {
        console.log(e);
    }
}

function* getedStartMessageSaga() {
    try {
        initAudioContext(false);
    } catch (e) {
        console.log(e);
    }
}



function* conferenceSaga(): any {
    yield takeEvery(actions.STARTING, startCall);
    yield takeEvery(actions.CHANGE_INITIATOR_ACCESS, changeInitiator);
    yield takeEvery(actions.GET_CALL_AUDIO, getAudioCallSaga);
    yield takeEvery(actions.ROOM_CALL_START, getedStartMessageSaga);
    yield takeEvery(actions.CHANGING_CONFERENCE_DETAILS, changingConferenceDetailsOpt);
    yield takeEvery(actions.CHANGING_VA_MEMBERS, changingVoiceActivityMembers);
    yield takeEvery(actions.SET_CONFERENCE_PROPERTY, setConferenceProperty);
    yield takeEvery(actions.CLOSE_AUDIO_CALL, closeAudioCall);
    yield takeEvery(actions.SET_HISTORY_OF_PARTISIPANTS, onHistoryOfParticipants);
    yield takeEvery(actions.INT_TO_PARTICIPANT, intToParticipant);
    yield takeEvery(actions.RINGING, ringing);
    yield takeEvery(actions.ACCEPT, accept);
    yield takeEvery(actions.UPDATE_PROPERTY_CONF_CALLBACK, updatePropertyConfCallBack);
    yield takeEvery(actions.DECLINE, decline);
    yield takeEvery(actions.LEAVE, leave);
    yield takeEvery(actions.CHECK, check);
    yield takeEvery(actions.JOIN, join);
    yield takeEvery(actions.ON_JOIN_CALL, onJoinCall);
    yield takeEvery(actions.ADD_MEMBERS, addMembers);
    yield takeEvery(actions.CANCEL, cancel);
    yield takeEvery(actions.END, end);
    // yield takeEvery(actions.SEND_ACK_CONFERENCE, sendAckConference);
}

export default conferenceSaga;
