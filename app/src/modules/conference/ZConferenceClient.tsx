import {ZConferenceListener} from "modules/conference/ZConferenceListener";
import Log from "modules/messages/Log";

const ipcRenderer = (window as any).ipcRenderer;

export class ZConferenceClient {
    createAudioCall(developerId: string, userName: string): void {
        Log.i("conference -> createAudioCall = ", ipcRenderer)
        ipcRenderer.send("createAudioCall", {developerId, userName});
    }

    joinAudioCall(conferenceId: bigint, userName: string): void {
        ipcRenderer.send("joinAudioCall", {conferenceId, userName});
    }

    leaveAudioCall(): void {
        ipcRenderer.send("leaveAudioCall");
        // ipcRenderer.send("closeAudioCall");
    }

    intToAll(value: number): void {
        ipcRenderer.send("intToAll", {value});
    }

    intToParticipant(value: number, userName: string): void {
        ipcRenderer.send("intToParticipant", {value, userName});
    }

    stringToParticipant(value: string, userName: string): void {
        ipcRenderer.send("stringToParticipant", {value, userName});
    }

    setProperty(propertyId: number, value: string, userName: string): void {
        Log.i("conference -> propertyId = ", propertyId)
        Log.i("conference -> value = ", value)
        Log.i("conference -> userName = ", userName)
        ipcRenderer.send("setProperty", {propertyId, value, userName});
    }

    sendAudio(buffer: Float32Array): void {
        ipcRenderer.send("sendAudio", buffer);
    }

    getAudio(): void {
        ipcRenderer.send("getAudio");
    }

    close(): void {
        Log.i("conference -> room_call_end = member = 2 ")
       ipcRenderer.send("closeAudioCall");
    }

    constructor(sampleRate: number) {
        Log.i("conference -> init = ", "init")
        ipcRenderer.send("init", {sampleRate:44100})
    }
}
