import {isLoggedIn} from "services/request";
import {UserManager} from "modules/messages/UserManager";
export class LoginManager{
    static sharedInstance: LoginManager = new LoginManager()
    get autoLogin() : boolean {

        return isLoggedIn()
    }

    afterLogin(){
        UserManager.sharedInstance.userNumber = null
        UserManager.sharedInstance.userEmail = null
    }

    afterLogout(){
        UserManager.sharedInstance.userNumber = null
        UserManager.sharedInstance.userEmail = null
    }
}