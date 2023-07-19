import connectionCreator from "xmpp/connectionCreator";
import Log from "modules/messages/Log";

export class RegistrationService {
    static instance: RegistrationService = new RegistrationService()
    get isConnected() {
        const connection: any = connectionCreator.getConnection();
        Log.i("connection -> isConnected = isConnected", connection)
        return connection.connected && navigator.onLine
    }

    private _onBackground: boolean = false
    get onBackground() {
        return this._onBackground
    }

    set onBackground(newValue: boolean) {
        this._onBackground = newValue
    }
}
