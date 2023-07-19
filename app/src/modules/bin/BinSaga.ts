"use strict";
import {call, cancel, fork, put, take, takeEvery} from "redux-saga/effects";
import {eventChannel} from "redux-saga";
import {actions as UserActions} from "../user/UserReducer";
import Log from "modules/messages/Log";

const ipcRenderer = (window as any).ipcRenderer;

function ipc(): Promise<any> {
    return new Promise((resolve) => resolve(ipcRenderer));
}

function subscribe(ipc): any {
    return eventChannel(emit => {
        ipc.on("appData", (event, reply) => {
            if (reply) {
                switch (reply.action) {
                    case "VERSION": {
                        if (reply.error) {
                            // Handle Error
                        }

                        Log.i("### SAGA REPLY ####");
                        Log.i({reply});
                        break;
                    }
                    default:
                }
            }
        });
        return () => {
        };
    });
}

function* read(ipc): any {
    const channel: any = yield call(subscribe, ipc);
    while (true) {
        const action: any = yield take(channel);
        yield put(action);
    }
}

function* handleIPCConnection(ipc): any {
    yield fork(read, ipc);
}

function* flow(): any {
    while (true) {
        const task: any = yield fork(handleIPCConnection, ipc);
        // yield take(UserActions.ATTEMPT_SIGN_OUT);
        yield cancel(task);
        ipcRenderer.removeAllListeners("appData");
    }
}


function* saga(): any {
    // yield fork(flow);
}

export default saga;
