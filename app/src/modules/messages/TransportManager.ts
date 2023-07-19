import connectionCreator from "xmpp/connectionCreator";
import {
    deliveredMessageForMyMessageFromOtherDeviceXML,
    messageDeliveredReceivedXML,
    messageDisplayedReceivedXML
} from "xmpp/XMLBuilders";
import Log from "modules/messages/Log";

export class TransportManager {
    static sharedInstance = new TransportManager()

    sendDelivery(json: any){
        const connection: any = connectionCreator.getConnection();

        if (connection.connected) {
            connection.send(json)
        }
    }

    sendDeliveryAck(msgId: string){
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = messageDeliveredReceivedXML({id: msgId});

        Log.i("sendDeliveryAck ->", ` ${msg}`)

        if (connection.connected) {
            connection.send(msg)
        }
    }

    sendDeliveryForMyMessageFromOtherDevice(msgId: string) {
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = deliveredMessageForMyMessageFromOtherDeviceXML({id: msgId});

        Log.i("sendDeliveryForMyMessageFromOtherDevice ->", ` ${msg}`)

        if (connection.connected) {
            connection.send(msg)
        }
    }

    sendSeen(json: any){
        const connection: any = connectionCreator.getConnection();

        if (connection.connected) {
            connection.send(json)
        }
    }

    sendSeenAck(msgId: string){
        const connection: any = connectionCreator.getConnection();
        const msg: Strophe.Builder = messageDisplayedReceivedXML({id: msgId});

        if (connection.connected) {
            connection.send(msg);
        }
    }
}
