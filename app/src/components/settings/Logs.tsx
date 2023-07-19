"use strict";

import * as React from "react";

import {
    Alert,
    CloseButton,
    LogsContainer,
    LogsTable,
    LogsButton,
    LogsTableTr,
    LogsTableTd,
    Loader, SettingsListBlockContent, SettingsListBlock, SettingsTitle, LogsButtonsContent, LogsBbtn, SepLine
} from "containers/settings/style";
import {IUserData} from "modules/user/UserReducer";
import Log from "modules/messages/Log";
import {logger} from "helpers/AppHelper";

const ipcRenderer = (window as any).ipcRenderer;


interface ILogsProps {
    user: IUserData
}

interface ILogsState {
    list: string[],
    isSent: boolean,
    isDeleted: boolean,
    errorMessage: string,
    successMessage: string,
    isAlertShown: boolean,
    timerId: number,
    disabledButtons: {
        deleteButton: number[],
        sendButton: number[]
    }
}

export default class Logs extends React.Component<ILogsProps, ILogsState> {


    constructor(props) {
        super(props);
        this.state = {
            list: [],
            isSent: false,
            isDeleted: false,
            errorMessage: null,
            successMessage: null,
            isAlertShown: false,
            timerId: null,
            disabledButtons: {
                deleteButton: [],
                sendButton: []
            }
        }
    }

    startListeners(): void {
        ipcRenderer.on("logs", (event, reply) => {
            if (reply) {
                const newState: ILogsState = this.state;

                switch (reply.action) {
                    case "LIST": {
                        // logger("### DELETE SHARED MEDIA MESSAGES ERROR ###", 'info');
                        // logger(reply, 'info');
                        if (reply.error) {
                            this.setState({
                                errorMessage: "Cannot get logs' list",
                                successMessage: null,
                                isAlertShown: true
                            });
                            return;
                        }
                        this.setState({list: reply.result});
                        break;
                    }
                    case "SEND":
                        Log.i(reply);

                        const sendButton: number[] = newState.disabledButtons.sendButton.filter(id => id !== reply.id);
                        newState.disabledButtons.sendButton = sendButton;
                        this.setState(newState);

                        if (reply.error) {
                            this.setState({
                                errorMessage: "Cannot send the log",
                                successMessage: null,
                                isAlertShown: true
                            });
                            return;
                        } else {
                            this.setState({
                                successMessage: "Log has been successfully sent",
                                errorMessage: null,
                                isAlertShown: true
                            });
                        }
                        break;
                    case "REMOVE":
                        Log.i(reply);

                        const deleteButton: number[] = newState.disabledButtons.deleteButton.filter(id => id !== reply.id);
                        newState.disabledButtons.deleteButton = deleteButton;
                        this.setState(newState);

                        if (reply.error) {
                            this.setState({
                                errorMessage: "Cannot remove the log",
                                successMessage: null,
                                isAlertShown: true
                            });
                            return;
                        } else {
                            this.setState({
                                successMessage: "Log has been successfully removed",
                                errorMessage: null,
                                isAlertShown: true
                            });
                        }
                        let list: any[] = this.state.list.filter(item => item !== reply.result);
                        this.setState({list});
                        break;
                    case "FLUSH":
                        Log.i(reply);
                        if (reply.error) {
                            this.setState({
                                errorMessage: "Cannot flush logs",
                                successMessage: null,
                                isAlertShown: true
                            });
                            return;
                        } else {
                            this.setState({
                                successMessage: "Logs have been successfully flushed",
                                errorMessage: null,
                                isAlertShown: true
                            });
                        }
                        if (!reply.result) {
                            this.setState({
                                errorMessage: "Cannot remove logs for unknown reason",
                                successMessage: null,
                                isAlertShown: true
                            });
                            return;
                        }
                        this.setState({list: []});
                        break;
                    default:
                }

                if (this.state.isAlertShown) {
                    if (this.state.timerId) {
                        clearTimeout(this.state.timerId)
                    }
                    const timerId: any = setTimeout(this.handleCancel, 5000);
                    this.setState({timerId})
                }
            }
        });
    }

    removeListeners(): void {
        ipcRenderer.removeAllListeners("logs");
    }

    componentWillUnmount(): void {
        this.removeListeners();
        removeEventListener("click", this.handleCancel);
        if (this.state.timerId) {
            clearTimeout(this.state.timerId)
        }
    }

    componentDidMount(): void {
        this.startListeners();
        ipcRenderer.send("onLogs", {action: "LIST"})
    }

    handleLogTransmit = (e: React.MouseEvent<HTMLDivElement>) => {

        const {user} = this.props;
        const email: any = user.get("email");
        const phone: any = user.get("username");
        const username = email ? `${email}-${phone}` : phone;
        const logName: string = e.currentTarget.getAttribute("data-value");
        const id: number = +e.currentTarget.getAttribute("data-id");


        const newState: ILogsState = this.state;
        newState.disabledButtons.sendButton.push(id);
        this.setState(newState);


        ipcRenderer.send("onLogs", {action: "SEND", username, logName, id});
    };

    handleLogRemove = (e: React.MouseEvent<HTMLDivElement>) => {
        const logName: string = e.currentTarget.getAttribute("data-value");
        const id: number = +e.currentTarget.getAttribute("data-id");

        const newState: ILogsState = this.state;
        newState.disabledButtons.deleteButton.push(id);
        this.setState(newState);

        ipcRenderer.send("onLogs", {action: "REMOVE", logName, id});
    };

    handleLogsFlush = (e: React.MouseEvent<HTMLButtonElement>) => {
        ipcRenderer.send("onLogs", {action: "FLUSH"});
    };

    handleCancel = () => {
        if (this.state.timerId) {
            clearTimeout(this.state.timerId)
        }
        this.setState({isAlertShown: false, timerId: null})
    };

    render() {
        const {list, errorMessage, successMessage, isAlertShown, disabledButtons: {deleteButton, sendButton}} = this.state;
        return (
            <>
                <Alert id="message"
                       isErrorMessage={errorMessage}
                       isAlertShown={isAlertShown}
                >
                    {errorMessage || successMessage || ""}
                    <CloseButton onClick={this.handleCancel}/>
                </Alert>
                <LogsContainer isAlertShown={isAlertShown} className="scroll-bar">
                    {list.length === 0 ? <div>There are no logs!</div> :
                        <SettingsListBlockContent>
                            {list.map((log, i) => {
                                const logName: string = log.length > 40 ? log.slice(0, 40) + "..." : log;
                                return (
                                    <SettingsListBlock key={i}>
                                        <SettingsTitle data-value={log}>{logName}</SettingsTitle>
                                        <LogsButtonsContent>
                                            <LogsBbtn
                                                isDisabled={sendButton.includes(i)}
                                                data-id={i}
                                                data-value={log}
                                                onClick={!sendButton.includes(i) ? this.handleLogTransmit : null}
                                                backgroundColor={"#52B1EB"}
                                                borderColor={"#47A6E0"}
                                                color={"#FFFFFF"}
                                            >{sendButton.includes(i) ? <Loader/>: "Send"}
                                            </LogsBbtn>

                                            {i !== 0 &&
                                            <LogsBbtn
                                                isDisabled={deleteButton.includes(i)}
                                                data-id={i}
                                                data-value={log}
                                                onClick={!deleteButton.includes(i) ? this.handleLogRemove : null}
                                                backgroundColor={"#FFFFFF"}
                                                borderColor={"#52B1EB"}
                                                color={"#52B1EB"}
                                            >{deleteButton.includes(i) ? <Loader/>: "Delete"}
                                            </LogsBbtn>}
                                        </LogsButtonsContent>
                                        { i !== list.length - 1 &&
                                            <SepLine />
                                        }

                                    </SettingsListBlock>
                                )
                            })
                            }
                        </SettingsListBlockContent>
                    }
                </LogsContainer>
            </>
        );
    }

};
