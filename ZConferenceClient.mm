//
//  ZAudioClientProxy.m
//  TBIRTMP
//
//  Created by Zaven on 16.09.21.
//  Copyright © 2021 Zangi Livecom Pte. Ltd. All rights reserved.
//

#import "ZConferenceClient.h"

#include <memory>
#include "ZAudioClient.hpp"
#include "ZAudioListener.hpp"
#include "ZLogService.hpp"
#include "ConferenceAudioUnit.h"
#include "ZAudioListenerWrapper.h"

@interface ZConferenceClient()
@property(nonatomic) std::shared_ptr<ZAudioListenerWrapper> ptrToAudioListener;
@property(nonatomic) std::shared_ptr<ZAudioClient> ptrToAudioClient;
@property(nonatomic) std::shared_ptr<ConferenceAudioUnit> ptrToAudioUnit;
@property(nonatomic) std::shared_ptr<ZLogService> logServices;
@end


@implementation ZConferenceClient
-(void)createAudioCall:(NSString *)developerId userName:(NSString *)userName {
    const char* developerIdC  = [developerId UTF8String];
    const char* userNameC  = [userName UTF8String];
    self.ptrToAudioClient->createAudioCall(developerIdC, userNameC);
}

-(void)joinAudioCall:(long)conferenceId userName:(NSString *)userName {
    const char* userNameC  = [userName UTF8String];
    self.ptrToAudioClient->joinAudioCall(conferenceId, userNameC);
}

-(void)leaveAudioCall{
    self.ptrToAudioClient->leaveAudioCall();
}

-(void)intToAll:(int)value{
    self.ptrToAudioClient->intToAll(value);
}

-(BOOL)intToParticipant:(int)value userName:(NSString *)userName {
    const char* userNameC  = [userName UTF8String];
    return self.ptrToAudioClient->intToParticipant(value, userNameC);
}

-(BOOL)stringToParticipant:(NSString *)value userName:(NSString *)userName{
    const char* valueC  = [value UTF8String];
    const char* userNameC  = [userName UTF8String];
    return self.ptrToAudioClient->stringToParticipant(valueC, userNameC);
}

-(BOOL)setProperty:(int)propertyId value:(NSString *)value userName:(NSString *)userName{
    const char* valueC  = [value UTF8String];
    const char* userNameC  = [userName UTF8String];
    return self.ptrToAudioClient->setProperty(propertyId, valueC, userNameC);
}

-(void)sendAudio:(void*)buffer size:(int)size {
    self.ptrToAudioUnit->setMicrophoneData(buffer, size);
}

-(int)getAudio:(void*)buffer size:(int)size{
    return self.ptrToAudioUnit->getReceivedData(buffer, size);
}

-(void)close {
    self.ptrToAudioUnit.reset();
    self.ptrToAudioListener->stopAndWait();

    self.ptrToAudioListener.reset();
    self.ptrToAudioClient->close();
    self.ptrToAudioClient.reset();
}

-(instancetype)initWithListener:(id<IZConferenceListener>)listener {
    if ((self = [super init])) {
        self.ptrToAudioListener = std::make_shared<ZAudioListenerWrapper>((__bridge_retained void *)listener);
        self.logServices = std::make_shared<ZLogService>();
        self.logServices->start();
        self.ptrToAudioClient = std::make_shared< ZAudioClient>(self.ptrToAudioListener, self.logServices);
        self.ptrToAudioUnit = std::make_shared<ConferenceAudioUnit>(self.logServices);
        std::shared_ptr<ZAudioUnit> zaudioUnit = std::dynamic_pointer_cast<ZAudioUnit>(self.ptrToAudioUnit);
        self.ptrToAudioClient->setAudioUnit(zaudioUnit);
    }
    
    return self;
}
@end
