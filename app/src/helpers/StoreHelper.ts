"use strict";

import {APPLICATION_DISABLED_LOGGING_ACTIONS} from "modules/application/ApplicationReducer";
import {CONTACTS_DISABLED_LOGGING_ACTIONS, IContactsData} from "modules/contacts/ContactsReducer";
import {MESSAGE_DISABLED_LOGGING_ACTIONS} from "modules/messages/MessagesReducer";
import {REQUEST_DISABLED_LOGGING_ACTIONS} from "modules/requests/RequestsReducer";
import {GROUPS_DISABLED_LOGGING_ACTIONS} from "modules/groups/GroupsReducer";

import createSagaMiddleware, {SagaMiddleware} from "redux-saga";
import {applyMiddleware, createStore} from "redux";
import {createLogger} from "redux-logger";
import selector from "services/selector";
import {Store} from "react-redux";

import IDBApplication from "services/database/class/Application";
import {createBrowserHistory, History} from "history";
import Log from "modules/messages/Log";


let history: History = null;

export function getBrowserHistory() {
    if (!history) {
        history = createBrowserHistory();
    }
    return history;
}


export function saveState(state: any): void {
    if (state.getIn(["userData", "username"])) {
        const savedStore: any = state.toJSON();
        IDBApplication.update("store", savedStore).catch(err => Log.i(err));
    }
}

export function updateContactProperties(state: IContactsData, contactId, props: any): IContactsData {

    for (const key in props) {
        if(props.hasOwnProperty(key)){
            state = state.setIn(["contacts", contactId, 'members', contactId, key], props[key]) as IContactsData;
            state = state.setIn(["list", contactId, key], props[key]) as IContactsData;
        }
    }
    return state;
}

let thisRootReducer: any;
let thisRootSaga: any;
let thisMessageSaga: any;
let thisSettingsSaga: any;
let thisContactsSaga: any;
let thisConversationsSaga: any;
let thisRequestsSaga: any;
let thisHandlersSaga: any;
let thisGroupsSaga: any;
let thisUserSaga: any;
let thisCallSaga: any;
let thisNetworksSaga: any;
let thisBinSaga: any;
let thisConferenceSaga: any;
let store: Store<any>;


export default (() => {


    function runSaga(saga, sagaMiddleware) {
        sagaMiddleware.run(saga);
    }


    function createStoreObject(rootReducer: any, rootSaga: any, messageSaga: any, settingsSaga: any, contactsSaga: any, conversationsSaga: any, requestsSaga: any, handlersSaga: any, groupsSaga: any, userSaga: any, callSaga: any, networksSaga: any, binSaga: any, conferenceSaga: any): Store<any> {

        let newStore: Store<any>;

        // const sagaMiddleware: SagaMiddleware<any> = createSagaMiddleware({
        //     onError: (error) => {
        //         console.log(error, "######333");
        //         return ;
        //     }
        // });
        const sagaMiddleware: SagaMiddleware<any> = createSagaMiddleware();
        const applyMiddleWareArgs: Array<any> = [sagaMiddleware];

        if (process.env && process.env.NODE_ENV !== "production") {
            const logger: any = createLogger({
                collapsed: false,
                stateTransformer: state => selector(state),
                predicate: (getState, action) => ![
                    ...APPLICATION_DISABLED_LOGGING_ACTIONS,
                    ...CONTACTS_DISABLED_LOGGING_ACTIONS,
                    ...MESSAGE_DISABLED_LOGGING_ACTIONS,
                    ...REQUEST_DISABLED_LOGGING_ACTIONS,
                    ...GROUPS_DISABLED_LOGGING_ACTIONS
                ].includes(action.type)
            });
           applyMiddleWareArgs.push(logger);
        }
        newStore = createStore(
            rootReducer,
            applyMiddleware.apply(null, applyMiddleWareArgs));


        runSaga(rootSaga, sagaMiddleware);
        runSaga(messageSaga, sagaMiddleware);
        runSaga(settingsSaga, sagaMiddleware);
        runSaga(contactsSaga, sagaMiddleware);
        runSaga(conversationsSaga, sagaMiddleware);
        runSaga(requestsSaga, sagaMiddleware);
        runSaga(handlersSaga, sagaMiddleware);
        runSaga(groupsSaga, sagaMiddleware);
        runSaga(userSaga, sagaMiddleware);
        runSaga(callSaga, sagaMiddleware);
        runSaga(networksSaga, sagaMiddleware);
        runSaga(binSaga, sagaMiddleware);
        runSaga(conferenceSaga, sagaMiddleware);

        /*sagaMiddleware.run(rootSaga).done.catch((e) => {
            sagaMiddleware.run(rootSaga);
            console.log("TESSSST" + e.message)
          });
        sagaMiddleware.run(messageSaga).done.catch((e) => {
            sagaMiddleware.run(messageSaga);
            console.log("TESSSST" + e.message)
          });*/


        // newStore.subscribe(throttle(() => {
        //     saveState(newStore.getState());
        // }, 5000));
        return newStore;
    }

    return {
        setParams: (rootReducer: any, rootSaga: any, messageSaga: any, settingsSaga: any, contactsSaga: any, conversationsSaga: any, requestsSaga: any, handlersSaga: any, groupsSaga: any, userSaga: any, callSaga: any, networksSaga: any, binSaga: any, conferenceSaga: any) => {
            thisRootReducer = rootReducer;
            thisRootSaga = rootSaga;
            thisMessageSaga = messageSaga;
            thisSettingsSaga = settingsSaga;
            thisContactsSaga = contactsSaga;
            thisConversationsSaga = conversationsSaga;
            thisRequestsSaga = requestsSaga;
            thisHandlersSaga = handlersSaga;
            thisGroupsSaga = groupsSaga;
            thisUserSaga = userSaga;
            thisCallSaga = callSaga;
            thisNetworksSaga = networksSaga;
            thisBinSaga = binSaga;
            thisConferenceSaga = conferenceSaga;
        },
        getStore: () => {
            if (!thisRootReducer || !thisRootSaga || !thisMessageSaga || !thisSettingsSaga || !thisContactsSaga || !thisConversationsSaga || !thisRequestsSaga || !thisHandlersSaga || !thisGroupsSaga || !thisUserSaga || !thisCallSaga || !thisNetworksSaga || !thisBinSaga || !thisConferenceSaga) {
                return undefined;
            }

            if (!store) {
                store = createStoreObject(thisRootReducer, thisRootSaga, thisMessageSaga, thisSettingsSaga, thisContactsSaga, thisConversationsSaga, thisRequestsSaga, thisHandlersSaga, thisGroupsSaga, thisUserSaga, thisCallSaga, thisNetworksSaga, thisBinSaga, thisConferenceSaga);
            }

            if ((module as any).hot) {
                (module as any).hot.accept('../services/reducer', () =>
                    store.replaceReducer(require('../services/reducer')) // eslint-disable-line global-require
                );
            }

            return store;
        }
    }
})();
