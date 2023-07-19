import {ZConferenceListener} from "modules/conference/ZConferenceListener";
import Log from "modules/messages/Log";

const ipcRenderer = (window as any).ipcRenderer;


export function ZConferenceListenerRenderer(roomId: string) {
    Log.i("conference -> responseCreateAudioCall -> Renderer -> roomId = ", roomId)
    const objZConferenceListener = new ZConferenceListener(roomId)
    Log.i("conference -> responseCreateAudioCall -> objZConferenceListener = ", objZConferenceListener)
    ipcRenderer.on("responseCreateAudioCall", (event, data) => {
        Log.i("conference -> responseCreateAudioCall -> ", data)
        objZConferenceListener.responseCreateAudioCall(data.conferenceId, data.userId, data.errorCode)
    })

    ipcRenderer.on("responseJoinAudioCall", (event, data) => {
        objZConferenceListener.responseJoinAudioCall(data.userId, data.participants, data.errorCode)
    })

    ipcRenderer.on("responseLeaveAudioCall", (event, data) => {
        objZConferenceListener.responseLeaveAudioCall(data.errorCode)
    })

    ipcRenderer.on("responseGetAudio", (event, data) => {
        objZConferenceListener.responseGetAudio(data)
    })

    ipcRenderer.on("participantJoined", (event, data) => {
        objZConferenceListener.participantJoined(data.joinedParticipant, data.participants, data.errorCode)
    })

    ipcRenderer.on("participantLeft", (event, data) => {
        objZConferenceListener.participantJoined(data.leftParticipant, data.participants, data.errorCode)
    })

    ipcRenderer.on("receiveBroadcast", (event, data) => {
        objZConferenceListener.receiveBroadcast(data.intValue, data.owner)
    })

    ipcRenderer.on("receive", (event, data) => {
        objZConferenceListener.receive(data.intValue, data.owner)
    })

    ipcRenderer.on("receiveInt", (event, data) => {
        objZConferenceListener.receiveInt(data.intValue, data.owner)
    })

    ipcRenderer.on("propertyUpdated", (event, data) => {
        Log.i("ZConferenceListenerRenderer -> propertyUpdated -> data = ", data)
        objZConferenceListener.propertyUpdated(data.owner, data.user, data.propertyId, data.value)
    })

    ipcRenderer.on("voiceActivity", (event, data) => {
        objZConferenceListener.voiceActivity(data.participants)
    })

    ipcRenderer.on("connectionFailed", (event, data) => {
        objZConferenceListener.connectionFailed()
    })

    ipcRenderer.on("connectionLost", (event, data) => {
        objZConferenceListener.connectionLost()
    })

    ipcRenderer.on("connectionRecovered", (event, data) => {
        objZConferenceListener.connectionRecovered()
    })

    ipcRenderer.on("systemError", (event, data) => {
        objZConferenceListener.systemError(data.errorCode)
    })

    ipcRenderer.on("sessionExpired", (event, data) => {
        objZConferenceListener.sessionExpired()
    })

    ipcRenderer.on("firstAudio", (event, data) => {
        objZConferenceListener.firstAudio()
    })
}


