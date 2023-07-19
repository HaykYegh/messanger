import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";

export class UserManager{
    static sharedInstance: UserManager = new UserManager()

    private _userNumber: string = null
    get userNumber(){
        if (this._userNumber == null){
            const store: Store<any> = storeCreator.getStore();
            const {user} = selector(store.getState(), {user: true});
            this._userNumber = user.get("username")
        }

        return this._userNumber
    }
    set userNumber(newValue: string){
        this._userNumber = newValue
    }

    private _userEmail: string = null
    get userEmail(){
        if (this._userEmail == null){
            const store: Store<any> = storeCreator.getStore();
            const {user} = selector(store.getState(), {user: true});
            this._userEmail = user.get("email")
        }

        return this._userEmail
    }
    set userEmail(newValue: string){
        this._userEmail = newValue
    }
}