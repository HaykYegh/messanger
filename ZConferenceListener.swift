//
//  ZAudioListener.swift
//  Project
//
//  Created by Zaven on 17.09.21.
//  Copyright © 2021 Zangi Livecom Pte. Ltd. All rights reserved.
//

import UIKit


private let TAG: String = "ZConferenceListener"
class ZConferenceListener: NSObject, IZConferenceListener {
    var roomId: String = ""

    convenience init(_ roomId: String){
        self.init()
        self.roomId = roomId
    }



    func responseCreateAudioCall(_ conferenceId: Int, userId: Int32, errorCode: Int32) {
        var map: [String:AnyObject] = [:]
        map["roomUid"] = self.roomId as AnyObject
        map["callId"] = "\(conferenceId)" as AnyObject
        let json = Json.jsonString(map)
        Log.i(TAG, "json  === \(String(describing: json))")
        //TransportManager.sharedInstance().sendCreateConference(json, conferenceId: conferenceId, isCreate: true)
    }

    func responseJoinAudioCall(_ userId: Int32, participants: [ZConferenceParticipant]!, errorCode: Int32) {
        let model = CallController.sharedInstance.getActiveCall()
        model?.acceptCall()
        Log.i(TAG, "participants count -> \(participants.count)")
        ConferenceManager.sharedInstance.onHistoryOfParticipants(participants: participants)
    }



    func responseLeaveAudioCall(_ errorCode: Int32) {

    }

    func participantJoined(_ joinedParticipant: ZConferenceParticipant!, participants: [ZConferenceParticipant]!, errorCode: Int32) {

    }

    func participantLeft(_ leftParticipant: ZConferenceParticipant!, participants: [ZConferenceParticipant]!, errorCode: Int32) {

    }

    func receiveBroadcast(_ intValue: Int32, owner: ZConferenceParticipant!) {

    }

    func receive(_ intValue: Int32, owner: ZConferenceParticipant!) {
        //ConferenceManager.sharedInstance.intActionToParticipantConfCallBack(Int(intValue), sender: owner.getName())
    }

    func receive(_ value: String!, owner: ZConferenceParticipant!) {
        //guard let valueInt = Int(value) else { return }
        //ConferenceManager.sharedInstance.intActionToParticipantConfCallBack(valueInt, sender: owner.getName())
    }

    func propertyUpdated(_ owner: ZConferenceParticipant!, user: ZConferenceParticipant!, propertyId: Int32, value: String!) {
        //ConferenceManager.sharedInstance.updatePropertyConfCallBack(owner.getName(), userName:user.getName(), propertyId:Int(propertyId), value:value)
    }

    func voiceActivity(_ participants: [ZConferenceActiveUserUnit]!) {
//         var array: [ConferenceVoiceActivityUser] = []
//
//         for participant in participants {
//             let user = ConferenceVoiceActivityUser()
//             user.userId = participant.getUserId()
//             user.userName = participant.getUserName()
//             user.startActivityTime = TimeInterval(participant.getStartActivityTime())
//             user.lastActivityTime = TimeInterval(participant.getLastActivityTime())
//             array.append(user)
//         }
//
//         ConferenceManager.sharedInstance.reciveVoiceActivity(array)
    }

    func connectionFailed() {

    }

    func connectionLost() {

    }

    func connectionRecovered() {

    }

    func systemError(_ errorCode: Int32) {
        //ConferenceManager.sharedInstance.connectionFailed()
    }

    func sessionExpired() {
        //ConferenceManager.sharedInstance.sessionExpired()
    }

    func firstAudio() {
        //ConferenceManager.sharedInstance.firstAudio()
    }
}
