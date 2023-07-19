import selector, {IStoreProps} from "services/selector";
import "scss/pages/left-panel/ChatList";
import {connect} from "react-redux";
import * as React from "react";
import Log from "modules/messages/Log";

interface IConversationSidebarState {


}

interface IConversationSidebarProps extends IStoreProps {


}


class ConversationSidebar extends React.Component<IConversationSidebarProps, IConversationSidebarState> {

    constructor(props: any) {
        super(props);

        this.state = {

        };
    }

    // contextMenu: HTMLDivElement;
    // scrollTop: number = 0;
    // searchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
    //     const {app: {searchKeyword}, setSearchKeyword} = this.props;
    //
    //     if (value.trim() !== searchKeyword) {
    //         setSearchKeyword(value.trim());
    //     }
    // };
    //
    // handleSearchClear = (): void => {
    //     const {setSearchKeyword} = this.props;
    //     (document.getElementById("searchInput") as HTMLInputElement).value = "";
    //     setSearchKeyword("");
    // };

    // threadRightClick = (event: React.MouseEvent<HTMLLIElement>) => {
    //     event.preventDefault();
    //     const {currentTarget: {dataset: {threadid}}} = event;
    //     const rootH: number = this.contextMenu.offsetHeight;
    //     const rootW: number = this.contextMenu.offsetWidth;
    //     const screenH: number = window.innerHeight;
    //     const screenW: number = window.innerWidth;
    //     const clickX: number = event.clientX;
    //     const clickY: number = event.clientY;
    //
    //     const right: boolean = (screenW - clickX) > rootW;
    //     const top: boolean = (screenH - clickY) > rootH;
    //     const bottom: boolean = !top;
    //     const left: boolean = !right;
    //
    //     if (right) {
    //         this.contextMenu.style.left = `${clickX + 5}px`;
    //     }
    //
    //     if (left) {
    //         this.contextMenu.style.left = `${clickX - rootW - 5}px`;
    //     }
    //
    //     if (top) {
    //         this.contextMenu.style.top = `${clickY + 5}px`;
    //     }
    //
    //     if (bottom) {
    //         this.contextMenu.style.top = `${clickY - rootH - 5}px`;
    //     }
    //
    //     const {conversations} = this.props;
    //
    //     this.setState({contextMenuThread: conversations.get(threadid)});
    //     this.contextMenu.style.display = "block";
    // };

    // handleDocumentClick = (event: MouseEvent) => {
    //     if (!(event.target as any).contains(this.contextMenu) && this.contextMenu && this.contextMenu.style.display === "block") {
    //         this.contextMenu.style.display = "none";
    //         this.setState({contextMenuThread: null});
    //     }
    // };

    // changePanel = (panel: string) => {
    //     const {app, changeLeftPanel} = this.props;
    //
    //     if (panel !== app.leftPanel) {
    //         changeLeftPanel(panel);
    //     }
    // };

    // handleDocumentScroll = (event) => {
    //     if (this.contextMenu && this.contextMenu.style.display === "block") {
    //         this.contextMenu.style.display = "none";
    //         this.setState({contextMenuThread: null});
    //     }
    //     const target = event.target;
    //
    //     if ((target.scrollTop + target.offsetHeight) == target.scrollHeight) {
    //         target.scrollTop--;
    //     }
    //
    //     const scrollBar: any = this.refs.scrollBar
    //     if (target.scrollTop === 0 && !(scrollBar && scrollBar.lastViewScrollTop)) {
    //         scrollBar && scrollBar.scrollTop(scrollBar.viewScrollTop);
    //     }
    //     if (this.scrollTop && this.scrollTop < target.scrollTop) {
    //         const sc: any = this.refs.scrollbar;
    //         sc.scrollTop(this.scrollTop)
    //         this.scrollTop = this.scrollTop + 100;
    //     }
    //
    //     if (!this.state.getConversations && (target.scrollHeight - (target.offsetHeight + target.scrollTop) <= target.scrollHeight / 200) && event.currentTarget.id == "threadContainer" && !this.state.getConversations) {
    //         this.getConversations();
    //         this.setState({
    //             getConversations: true,
    //             scrollTop: target.scrollTop
    //         });
    //     }
    //
    //
    // };

    // toggleDeletePopup = () => {
    //     const {deleteThreadPopUp, contextMenuThreadOne, contextMenuThread} = this.state;
    //     this.setState({
    //         deleteThreadPopUp: !deleteThreadPopUp,
    //         contextMenuThreadOne: contextMenuThread
    //     });
    // };

    // deleteThread = () => {
    //     const {attemptDeleteGroup, deleteConversation, selectedThreadId, attemptLeaveGroup, user} = this.props;
    //     const {contextMenuThreadOne} = this.state;
    //     const threadId = contextMenuThreadOne.getIn(["threads", "threadId"]);
    //     const partialId = contextMenuThreadOne.getIn(["threads", "threadInfo", "partialId"]);
    //     const disabled = contextMenuThreadOne.getIn(["threads", "threadInfo", "disabled"]);
    //     const isGroup = isPublicRoom(threadId);
    //     const username = user.get("username");
    //
    //     if (contextMenuThreadOne) {
    //         if (isGroup) {
    //             if (disabled) {
    //                 attemptDeleteGroup(threadId, false);
    //
    //             } else {
    //                 attemptLeaveGroup(partialId, username);
    //             }
    //
    //         } else {
    //             deleteConversation(threadId);
    //         }
    //     }
    //     this.toggleDeletePopup();
    // };

    // onDrop = (accepted: any, threadId: string) => {
    //     const {setFiles} = this.props;
    //     if (accepted.length > 0) {
    //         setFiles(accepted.filter(file => file.type && file.type !== ""), threadId);
    //     }
    // };
    //
    // createGroupChat = () => {
    //     this.changePanel(LEFT_PANELS.create_group)
    // };

    // get headerLeftButton(): any {
    //     // const {user, toggleProfilePopUp} = this.props;
    //     //
    //     // if (!user) {
    //     //     return null;
    //     // }
    //     //
    //     // return {
    //     //     style: user.get("avatarUrl") ? {
    //     //         backgroundImage: `url(${user.get("avatarUrl")})`,
    //     //         backgroundSize: "contain"
    //     //     } : {},
    //     //     onClick: toggleProfilePopUp,
    //     //     className: "user_icon"
    //     // };
    // }

    // handleOnlyGroupsShow = () => {
    //     const {setSelectedThreadType, app: {searchKeyword}} = this.props;
    //     this.setState({onlyGroup: true}, () => {
    //         this.getConversations(true, searchKeyword);
    //     });
    //     setSelectedThreadType(CONVERSATION_TYPE.GROUP);
    // };
    // handleAllContactShow = () => {
    //     const {setSelectedThreadType, app: {searchKeyword}} = this.props;
    //     this.setState({onlyGroup: false}, () => {
    //         this.getConversations(true, searchKeyword);
    //     });
    //     setSelectedThreadType(CONVERSATION_TYPE.SINGLE);
    // };
    //
    // getConversations(takeFirst: boolean = false, searchText: string = "") {
    //     const {getConversations} = this.props;
    //     const threadsCount = this.threads.size;
    //     const threadType = this.state.onlyGroup ? CONVERSATION_TYPE.GROUP : CONVERSATION_TYPE.SINGLE;
    //     getConversations(Math.floor((takeFirst ? 1 : ((threadsCount + 1) / CONVERSATIONS_LIMIT) + 1)), threadType, true, searchText);
    //     takeFirst && (document.getElementById("threadContainer").scrollTop = 0);
    // };

    // get threads(): any {
    //     const {conversations, selectedThreadId, contacts, setSelectedThread, user, app: {searchKeyword}} = this.props;
    //     const {onlyGroup} = this.state;
    //     const username = user.get("username");
    //     const filteredConversations = conversations.filter(conversation => {
    //         const thread = conversation.get("threads");
    //         const {isChannel, isGroup, isProductContact, isPrivateChat} = getThreadType(thread.get("threadType"));
    //         const {threadInfo} = getThread(conversation, username, true);
    //         const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
    //         const [name, phone, numbers] = threadInfo && [threadInfo.get("name"), threadInfo.get("phone"), threadInfo.get("numbers")];
    //
    //         if (isChannel || !name || (!isGroup && !isProductContact && !isPrivateChat) || (!isGroup && !lastMessageId) || thread.get('threadId') === user.get('id')) {
    //             return false;
    //         }
    //
    //         if (!name.toLowerCase().includes(searchKeyword.toLowerCase())) {
    //             if (!phone) {
    //                 return false;
    //
    //             } else if (!includesInNumbers(phone, numbers, searchKeyword)) {
    //                 return false;
    //             }
    //         }
    //
    //         if (conversation.hasIn(["threads", 'threadId'])) {
    //             return !conversation.getIn(['threads', 'threadId']).includes(CHANNEL_CONVERSATION_EXTENSION);
    //         }
    //         return true;
    //     });
    //     return filteredConversations.valueSeq().map(conversation => {
    //         const thread = conversation.get("threads");
    //         const {isPrivateChatOwnChannel, threadInfo} = getThread(conversation, username, true);
    //         if ((!thread.get('threadInfo') || thread.get('threadInfo').isEmpty()) && conversation.get("members") && conversation.get("members").isEmpty()) {
    //             return null;
    //         }
    //         const {isChannel, isGroup, isProductContact, isPrivateChat} = getThreadType(thread.get("threadType"));
    //         const name = threadInfo && threadInfo.get("name");
    //         const lastMessageId = conversation.getIn(['conversations', 'lastMessageId']);
    //         const draft = conversation.getIn(['conversations', 'draft']);
    //         const lastMessage = lastMessageId ? conversation.get("messages") : null;
    //
    //         if (isChannel || !name || !name.toLowerCase().includes(searchKeyword.toLowerCase()) || (!isGroup && !isProductContact && !isPrivateChat) || (!isGroup && !lastMessageId) || thread.get('threadId') === user.get('id')) {
    //             return null;
    //         }
    //         const handleDrop: any = accepted => this.onDrop(accepted, thread.get("threadId"));
    //         if (onlyGroup) {
    //             return (
    //                 isGroup && <Thread
    //                     thread={conversation}
    //                     contacts={contacts}
    //                     key={thread.get("threadId")}
    //                     handleDrop={handleDrop}
    //                     userId={user.get("username")}
    //                     onClick={setSelectedThread}
    //                     selectedThreadID={selectedThreadId}
    //                     onRightClick={this.threadRightClick}
    //                     lastMessage={lastMessage}
    //                     draft={draft}
    //                 />
    //             )
    //         } else {
    //             return (
    //                 <Thread
    //                     thread={conversation}
    //                     contacts={contacts}
    //                     key={thread.get("threadId")}
    //                     handleDrop={handleDrop}
    //                     userId={user.get("username")}
    //                     onClick={setSelectedThread}
    //                     selectedThreadID={selectedThreadId}
    //                     onRightClick={this.threadRightClick}
    //                     lastMessage={lastMessage}
    //                     isPrivateChatOwnChannel={isPrivateChatOwnChannel}
    //                     draft={draft}
    //                 />
    //             )
    //         }
    //
    //     });
    // }

    componentDidMount(): void {

        Log.i("##### CONVERSATION SIDEBAR");




        // document.addEventListener("click", this.handleDocumentClick);
        // document.getElementById("threadContainer").addEventListener("scroll", this.handleDocumentScroll, true);
    }

    shouldComponentUpdate(nextProps: IConversationSidebarProps, nextState: IConversationSidebarState): boolean {

        return  true;



        // if (this.threads.size > CONVERSATIONS_LIMIT && nextProps.conversations.size <= CONVERSATIONS_LIMIT) {
        //     document.getElementById("threadContainer").scrollTop = 0;
        // }
        //
        // if (this.props.app.searchKeyword !== nextProps.app.searchKeyword) {
        //     this.getConversations(true, nextProps.app.searchKeyword);
        //     return true;
        // }
        //
        // return this.props.app.showProfilePopUp !== nextProps.app.showProfilePopUp ||
        //     this.props.selectedThreadId !== nextProps.selectedThreadId ||
        //     !isEqual(this.props.app.threadTexts, nextProps.app.threadTexts) ||
        //     this.props.newMessagesCount !== nextProps.newMessagesCount ||
        //     //!this.props.allMessages.equals(nextProps.allMessages) ||
        //     !this.props.conversations.equals(nextProps.conversations) ||
        //     !this.props.threads.equals(nextProps.threads) ||
        //     this.state.onlyGroup !== nextState.onlyGroup ||
        //     this.state.deleteThreadPopUp !== nextState.deleteThreadPopUp ||
        //     !this.props.user.equals(nextProps.user);
    }

    componentWillUnmount(): void {
        // const {setSelectedThreadType} = this.props;
        // document.removeEventListener("click", this.handleDocumentClick);
        // document.getElementById("threadContainer").removeEventListener("scroll", this.handleDocumentScroll);
        // setSelectedThreadType(CONVERSATION_TYPE.SINGLE);
    }


    componentDidUpdate() {

        // const state = this.state;
        // if (state.getConversations) {
        //     this.setState({
        //         getConversations: false,
        //     });
        //     if (this.refs.scrollbar) {
        //         const scrollBar: any = this.refs.scrollbar;
        //         this.scrollTop = scrollBar.lastViewScrollTop;
        //     }
        // }
    }

    render(): JSX.Element {
        // const {app, newMessagesCount, app: {searchKeyword}} = this.props;
        // const {deleteThreadPopUp, contextMenuThread, onlyGroup, contextMenuThreadOne} = this.state;
        // const localization: any = components().Index;
        // const state = this.state;
        // const searchClearButton: boolean = searchKeyword && searchKeyword !== "";

        return (
            <div className="conversations-sidebar-container">

            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state);

const mapDispatchToProps: any = dispatch => ({
    // getConversations: (page, threadType, offset, searchText) => dispatch(attemptGetConversations(page, offset, threadType, searchText)),
    // attemptLeaveGroup: (id, username) => dispatch(attemptLeaveOrRemoveMember(id, username, LEAVE_GROUP_COMMAND, true)),
    // attemptDeleteGroup: (id, keepHistory) => dispatch(attemptDeleteGroup(id, keepHistory)),
    // deleteConversation: (id) => dispatch(attemptRemoveConversation(id, true)),
    // setFiles: (files, filesReceiver) => dispatch(setFiles(files, filesReceiver)),
    // setSelectedThreadType: (threadType) => dispatch(setThreadType(threadType)),
    // setSelectedThread: thread => dispatch(attemptSetSelectedThread(thread)),
    // changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    // setSelectedThreadId: id => dispatch(setSelectedThreadId(id)),
    // toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    // setSearchKeyword: (keyword) => dispatch(setSearchKeyword(keyword)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConversationSidebar);
