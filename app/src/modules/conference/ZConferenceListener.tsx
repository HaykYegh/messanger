import Log from "modules/messages/Log";
import connectionCreator from "xmpp/connectionCreator";
import {createXML, leaveXML} from "modules/conference/ConferenceXMLBuilders";
import {all, put, select} from "redux-saga/effects";
import {getLastCallSelector} from "modules/call/CallSelector";
import {
    accept as conferenceAccept, changingVoiceActivityMembers, closeAudioCall, endConference, getCallAudio,
    hideConference, removeConference, setConferenceProperty,
    setHistoryOfPartisipants, toggleMemberMuted, toggleUnMutePopup, updatePropertyConferenceCallBack
} from "modules/conference/ConferenceActions";
import {removeCall} from "modules/call/CallActions";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import {userNameSelector} from "modules/user/UserSelector";
import {isConferenceIncomingCallSelector} from "modules/conference/ConferenceSelector";
import {ConfPropertyId} from "modules/conference/ConfPropertyId";
import {ConfIntToParticipantId} from "modules/conference/ConfIntToParticipantId";
// import {ZConferenceParticipant} from "modules/conference/ZConferenceParticipant";
// import {ZConferenceActiveUserUnit} from "modules/conference/ZConferenceActiveUserUnit";


interface ZConferenceParticipant {
    participantId: number;
    name: string;
    properties: any;
}

interface ZConferenceActiveUserUnit {
    userId: number;
    userName: string;
    startActivityTime: bigint;
    lastActivityTime: bigint;
}

let TAG: String = "ZConferenceListener"
export class ZConferenceListener {
    roomId: string = ""

    constructor(roomId: string) {
        this.roomId = roomId
    }

    responseCreateAudioCall(conferenceId: number, userId: number, errorCode: number) {
        const store: Store<any> = storeCreator.getStore();
        const {selectedThreadId} = selector(store.getState(), {
            selectedThreadId: true
        });
        this.roomId = selectedThreadId
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;

        // Log.i("conference -> responseCreateAudioCall -> roomId = ", this.roomId)
        Log.i("conference -> responseCreateAudioCall -> roomId = 2 ", this.roomId)
        const roomName: string = this.roomId ? this.roomId.split("@")[0] : '';

        Log.i("conference -> responseCreateAudioCall -> roomName = ", roomName)

        const msg: Strophe.Builder = createXML({
            id,
            groupId: roomName,
            callid: conferenceId
        });


        if (connection.connected) {

            connection.send(msg);
        }
    }

    responseJoinAudioCall(userId: number, participants: ZConferenceParticipant[], errorCode: number) {
        Log.i(TAG, `participants count -> ${participants.length}`)
        const store: Store<any> = storeCreator.getStore();
        const dispatch: any = store.dispatch;
        dispatch(conferenceAccept());
        dispatch(setHistoryOfPartisipants(participants));

        // let model = CallController.sharedInstance.getActiveCall()
        // model?.acceptCall()
        // Log.i(TAG, "participants count -> \(participants.count)")
        //ConferenceManager.sharedInstance.onHistoryOfParticipants(participants: participants)
    }

    responseLeaveAudioCall(errorCode: number) {
        const store: Store<any> = storeCreator.getStore();
        const {calls} = selector(store.getState(), {
            calls: true
        });
        const lastCall = calls.valueSeq().first()
        // const lastCall: any = select(getLastCallSelector());
        const connection: any = connectionCreator.getConnection();
        const id: string = `msgId${Date.now()}`;
        Log.i("conference -> ZConferenceListener -> lastCall = ", lastCall)
        if (lastCall) {
            const callId: string = lastCall.get('callId');

            const msg: Strophe.Builder = leaveXML({
                id,
                callId,
                to: lastCall.get('to')
            });

            if (connection.connected) {
                // Send leave
                connection.send(msg);
            }
            store.dispatch(removeCall(callId))
            store.dispatch(closeAudioCall())
            // this.audioClient.close()
        }



        store.dispatch(hideConference())
        store.dispatch(removeConference())


    }

    responseGetAudio(data) {
        const store: Store<any> = storeCreator.getStore();
        store.dispatch(getCallAudio(data))
    }

    participantJoined(joinedParticipant: ZConferenceParticipant, participants: ZConferenceParticipant[], errorCode: number) {

    }

    participantLeft(leftParticipant:ZConferenceParticipant, participants: ZConferenceParticipant[], errorCode: number) {

    }

    receiveBroadcast(intValue: number, owner: ZConferenceParticipant) {

    }

    receive(intValue: number, owner: ZConferenceParticipant) {

    }

    receiveInt(intValue: number, owner: ZConferenceParticipant) {
        const store: Store<any> = storeCreator.getStore();
        const {user} = selector(store.getState(), {
            user: true
        });

        Log.i("conference -> receiveInt -> intValue = ", intValue)

        if (intValue === ConfIntToParticipantId.mute){
            store.dispatch(toggleMemberMuted(user.get("id"), true))
            store.dispatch(setConferenceProperty(ConfPropertyId.mute, "1"))
        }
        if (intValue === ConfIntToParticipantId.unMute) {
            store.dispatch(toggleUnMutePopup(true))
        }
    }

    propertyUpdated(owner: ZConferenceParticipant, user: ZConferenceParticipant, propertyId: number, value: string) {
        const store: Store<any> = storeCreator.getStore();

        Log.i("conference -> propertyUpdated222 -> owner = ", owner)
        store.dispatch(updatePropertyConferenceCallBack(owner.name, user.name, propertyId, value))
    }

    voiceActivity(participants: ZConferenceActiveUserUnit[]) {
        const store: Store<any> = storeCreator.getStore();
        store.dispatch(changingVoiceActivityMembers(participants))
    }

    connectionFailed() {

    }

    connectionLost() {

    }

    connectionRecovered() {

    }

    systemError(errorCode: number) {

    }

    sessionExpired() {
        const store: Store<any> = storeCreator.getStore();
        const {conferenceDetails} = selector(store.getState(), {
            conferenceDetails: true
        });

        Log.i("conference -> sessionExpired = ", "sessionExpired")
        store.dispatch(endConference(conferenceDetails.getIn(["info", "threadId"])))
    }

    firstAudio() {

    }
}


