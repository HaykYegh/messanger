"use strict";

import {
    attemptChangeLeftPanel,
    attemptSetSelectedThread,
    changeRightPanel,
    removeRightCreateGroupMember,
    setSelectedThreadId,
    toggleProfilePopUp
} from "modules/application/ApplicationActions";
import {
    CREATE_GROUP_ACTION_STATES,
    DIGITS_REGEX,
    EMAIL_VALIDAITON_REGEX,
    GROUP_MAX_MEMBERS_COUNT,
    LEFT_PANELS,
    RIGHT_PANELS
} from "configs/constants";
import CreateGroupAddMembersState from "components/group/CreateGroupAddMembersState";
import {attemptCreateGroup, inviteGroupMembers} from "modules/groups/GroupsActions";
import CreateGroupAddNameState from "components/group/CreateGroupAddNameState";
import {GROUP_CONVERSATION_EXTENSION, SINGLE_CONVERSATION_EXTENSION} from "xmpp/XMLConstants";
import FooterNavBar from "components/common/FooterNavBar";
import {IContact} from "modules/contacts/ContactsReducer";
import selector, {IStoreProps} from "services/selector";
import connectionCreator from "xmpp/connectionCreator";
import {clone, cloneDeep, isEqual} from "lodash";
import components from "configs/localization";
import {getColor} from "helpers/AppHelper";
import classnames from "classnames";
const classNames = classnames;
import conf from "configs/configurations";
import {connect} from "react-redux";
import * as React from "react";
import {getThumbnail, setAWSFiles} from "helpers/FileHelper";
import {getUserId, getUsername, validateNumber} from "helpers/DataHelper";
import {attemptCreateContact} from "modules/contacts/ContactsActions";

interface ICreateGroupPanelState {
    checkedContactsUsernames: Array<string>;
    allTimeCheckedContactsUsernames: Array<string>;
    currentGroupId: string;
    actionState: string;
    groupName: string;
    groupId: string;
    keyword: string;
    avatar: Blob;
    image: any;
}

interface ICreateGroupPanelPassedProps {
    inRightSide?: boolean;
}

interface ICreateGroupPanelProps extends IStoreProps, ICreateGroupPanelPassedProps {
    createGroup: (group: any, username: string, setThread: boolean) => void;
    createContact: (contactId: string, phone: string, author: string, email?: string) => void;
    inviteGroupMembers: (groupId: string, members: string) => void;
    setSelectedThreadId: (id: string) => void;
    changeRightPanel: (panel: string) => void;
    setSelectedThread: (thread: any, updateConversationTime: boolean) => void;
    changeLeftPanel: (panel: string) => void;
    removeRightCreateGroupMember: () => void;
    toggleProfilePopUp: () => void;
}

const selectorVariables: any = {
    newMessagesCount: true,
    selectedThreadId: true,
    application: {
        app: true
    },
    contacts: {
        savedContacts: true,
        contacts: true
    },
    settings: {
        chat: true
    },
    user: true
};

class CreateGroupPanel extends React.Component<ICreateGroupPanelProps, ICreateGroupPanelState> {

    constructor(props: any) {
        super(props);

        this.state = {
            actionState: CREATE_GROUP_ACTION_STATES.add_members,
            checkedContactsUsernames: [],
            allTimeCheckedContactsUsernames: [],
            currentGroupId: null,
            groupName: "",
            avatar: null,
            groupId: "",
            keyword: "",
            image: null,
        }
    }

    handleInputChange = ({currentTarget: {value, name}}: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state[name] !== value.trim()) {
            const newState: any = clone(this.state);
            newState[name] = value.trim();
            this.setState(newState);
        }
    };

    onAvatarChange = ({currentTarget: {files}}: React.ChangeEvent<HTMLInputElement>) => {
        if (files[0]) {
            this.setState({image: files[0]});
        }
    };

    changePanel = (panel: string, left: boolean = false) => {
        const {app, changeLeftPanel, changeRightPanel} = this.props;
        if (left) {
            if (app.leftPanel !== panel) {
                changeLeftPanel(panel);
            }
        } else if (app.rightPanel !== panel) {
            if (app.rightPanel !== panel) {
                changeRightPanel(panel);
            }
        }
    };

    toggleMember = (contact: IContact) => {
        const contactUsername = contact.get('members').first().get("username");
        const {user} = this.props;
        if (user.get("username") === contactUsername) return;

        const {checkedContactsUsernames, allTimeCheckedContactsUsernames} = this.state;
        const contactIndex: number = checkedContactsUsernames.indexOf(contact.get('members').first().get("username"));
        const newState: any = cloneDeep(this.state);

        if(allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) === -1){
            newState.allTimeCheckedContactsUsernames.push(contactUsername);
        }

        if (contactIndex !== -1) {
            newState.checkedContactsUsernames.splice(contactIndex, 1);
        } else {
            if (checkedContactsUsernames.length < GROUP_MAX_MEMBERS_COUNT) {
                newState.checkedContactsUsernames.push(contactUsername);
            }
        }

        if (!isEqual(this.state, newState)) {
            this.setState(newState);
        }
    };

    changeSelectedThread = (thread: any) => {
        const {setSelectedThread} = this.props;
        setSelectedThread(thread, true);
    };

    handleUploadAvatar = async (file: any) => {
        if (file) {
            const {user} = this.props;

            const id: number = Date.now();
            const author: string = user.get("username");
            const groupId: string = `gid${id}-${author}`;
            const avatarKey: string = `${groupId}/profile/avatar`;
            const avatar = await getThumbnail(file.cropped, false);

            const dataURI: string = atob(avatar.img);
            const ab: ArrayBuffer = new ArrayBuffer(dataURI.length);
            const ia: Uint8Array = new Uint8Array(ab);

            for (let i: number = 0; i < dataURI.length; i++) {
                ia[i] = dataURI.charCodeAt(i);
            }

            const resizedFile: File = new File([ab], "avatar", {type: "image/jpeg"});
            const avatarBlob = new Blob([new Uint8Array(ab)]);
            this.setState({avatar: avatarBlob, image: null, groupId});
            const uploadImage: any = await setAWSFiles([
                {
                    bucket: conf.app.aws.bucket.group,
                    path: avatarKey,
                    value: resizedFile,
                }
            ]);
        }
    };

    createGroup = () => {
        const {groupName, checkedContactsUsernames, groupId, avatar} = this.state;

        const connection: any = connectionCreator.getConnection();
        const {user, createGroup} = this.props;

        if (groupName.replace(/\s/g, "") === "") {
            return;
        }

        const id: number = Date.now();
        const author: string = user.get("username");
        const partialId: string = groupId || `gid${id}-${author}`;

        const group: any = {
            id: `${partialId}@${GROUP_CONVERSATION_EXTENSION}/${user.get("username")}`,
            groupMembersUsernames: [...checkedContactsUsernames, user.get("username")],
            author: user.get("username"),
            color: getColor(),
            avatar: avatar,
            name: groupName,
            partialId
        };


        this.setState({currentGroupId: group.partialId}, () => {
            createGroup(group, user.get("username"), true);
        });
    };

    closeCrop = () => {
        this.setState({image: null});
        if((document.getElementById("groupPicInput") as any)){
            (document.getElementById("groupPicInput") as any).value = "";
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchInputGroupAddMember") as HTMLInputElement).value = "";
    };

    get createContactState(): JSX.Element {
        const {actionState, checkedContactsUsernames, image, avatar, keyword} = this.state;
        const {contacts, user} = this.props;
        const searchClearButton: boolean = keyword && keyword !== "";

        return actionState === CREATE_GROUP_ACTION_STATES.add_members ?
            (
                <CreateGroupAddMembersState
                    contacts={this.contacts}
                    toggleMember={this.toggleMember}
                    checkedContactsUsernames={checkedContactsUsernames}
                    searchInput={{onChange: this.handleInputChange, name: "keyword", iconClassName: "hidden", handleSearchClear: this.handleSearchClear, clearButton: searchClearButton, newId: true, searchId: "searchInputGroupAddMember"}}
                    leftButton={this.groupLeftButton}
                    rightButton={this.groupRightButton}
                    user={user}
                />
            ) :
            (
                <CreateGroupAddNameState
                    inputProps={{onChange: this.handleInputChange, name: "groupName"}}
                    checkedContactsUsernames={checkedContactsUsernames}
                    onAvatarChange={this.onAvatarChange}
                    uploadAvatar={this.handleUploadAvatar}
                    closeCrop={this.closeCrop}
                    contacts={contacts}
                    avatar={avatar}
                    image={image}
                    leftButton={this.groupLeftButton}
                    rightButton={this.groupRightButton}
                    user={user}
                />
            )
    }

    get groupRightButton(): any {
        const {actionState, checkedContactsUsernames, groupName} = this.state;
        const localization: any = components().createGroupPanel;
        const {inRightSide, contacts, selectedThreadId} = this.props;

        return actionState === CREATE_GROUP_ACTION_STATES.add_members ?
            {
                text: "",
                className: classNames({right_btn: true, next_btn_active: checkedContactsUsernames.length > 0}),
                onClick: () => {
                    if (checkedContactsUsernames.length > 1) {
                        this.setState({actionState: CREATE_GROUP_ACTION_STATES.add_name});
                    } else if (checkedContactsUsernames.length !== 0) {
                        inRightSide ?
                            this.changePanel(RIGHT_PANELS.contact_info) :
                            this.changePanel(LEFT_PANELS.threads, true);

                        const username = checkedContactsUsernames.shift();
                        const contactId = getUserId(username);

                        if (selectedThreadId !== contactId) {
                            setTimeout(() => {
                                const currentThreadElement = document.querySelector(`li[data-threadid="${contactId}"]`);
                                const activeThreadElement = document.querySelector("li.contacts_pack.active");

                                if (currentThreadElement && currentThreadElement !== activeThreadElement) {
                                    !currentThreadElement.classList.contains("active") && currentThreadElement.classList.add("active");
                                    activeThreadElement && activeThreadElement.classList.remove("active");
                                }
                            }, 0);

                            const thread = contacts.get(contactId);
                            this.changeSelectedThread(thread.toJS());

                        }

                    }
                }
            } :
            {
                text: localization.create,
                className: classNames({right_btn: true, next_btn_active: groupName.length > 0}),
                onClick: () => {
                    this.createGroup()
                }
            };
    }

    get groupLeftButton(): any {
        const localization: any = components().createGroupPanel;
        const {inRightSide, app} = this.props;
        const {actionState} = this.state;

        return actionState === CREATE_GROUP_ACTION_STATES.add_members ?
            {
                className: "left_btn",
                onClick: () => inRightSide ? this.changePanel(app.previousRightPanel) : this.changePanel(LEFT_PANELS.threads, true)
            } :
            {
                className: "left_btn",
                onClick: () => {
                    this.setState({actionState: CREATE_GROUP_ACTION_STATES.add_members, keyword: ""});
                }
            }
    }

    get headerLeftButton(): any {
        const {user, toggleProfilePopUp} = this.props;

        return {
            style: {},
            className: "user_icon",
            onClick: toggleProfilePopUp
        };
    }

    get contacts(): any {
        const {savedContacts, contacts, user, createContact} = this.props;
        const {allTimeCheckedContactsUsernames} = this.state;
        const {keyword} = this.state;
        const _keyword = keyword.toLowerCase();
        let searchedEmail: string;

        if(EMAIL_VALIDAITON_REGEX.test(_keyword)) {
            searchedEmail = _keyword;

        } else {
            searchedEmail = "";
        }

        const email  = !!user.get("email");
        const number: any = searchedEmail ? {}: validateNumber(_keyword, user.get("phone"), email);

        let checkedContacts:any =  savedContacts && savedContacts
                .filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const firstName = contactInfo.get("firstName").toLowerCase();
                    const lastName = contactInfo.get("lastName").toLowerCase();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const isProductContact = contactInfo.get("isProductContact");
                    const blocked = contactInfo.get("blocked");
                    const contactEmail: string = contactInfo.get("email");

                    return isProductContact && !blocked && ((firstName && firstName.includes(_keyword)) ||
                        (lastName && lastName.includes(_keyword)) ||
                        (name && name.includes(_keyword)) ||
                        (contactEmail !== "" &&  contactEmail === searchedEmail) ||
                        (phone.toString().includes(_keyword)))
                })
                .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

        if(checkedContacts && checkedContacts.size > 0 && allTimeCheckedContactsUsernames.length > 0){
            const oldCheckedContacts = contacts && contacts
                .filter(contact => {
                    const contactInfo = contact.get("members").first();
                    const firstName = contactInfo.get("firstName").toLowerCase();
                    const lastName = contactInfo.get("lastName").toLowerCase();
                    const name = contactInfo.get("name").toLowerCase();
                    const phone = contactInfo.get("phone");
                    const isProductContact = contactInfo.get("isProductContact");
                    const blocked = contactInfo.get("blocked");
                    const contactEmail: string = contactInfo.get("email");

                    return isProductContact && !blocked && allTimeCheckedContactsUsernames.indexOf(contact.get('members').first().get("username")) > -1 && ((firstName && firstName.includes(_keyword)) ||
                        (lastName && lastName.includes(_keyword)) ||
                        (name && name.includes(_keyword)) ||
                        (contactEmail !== "" &&  contactEmail === searchedEmail) ||
                        (phone.toString().includes(_keyword)))
                });

             checkedContacts = checkedContacts.merge(oldCheckedContacts).sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));

        }

        if(checkedContacts && checkedContacts.size === 0){
            if((number && number.fullNumber) || searchedEmail) {
                checkedContacts = contacts && contacts
                    .filter(contact => {
                        const contactInfo = contact.get("members").first();
                        const firstName = contactInfo.get("firstName").toLowerCase();
                        const lastName = contactInfo.get("lastName").toLowerCase();
                        const name = contactInfo.get("name").toLowerCase();
                        const phone = contactInfo.get("phone");
                        const isProductContact = contactInfo.get("isProductContact");
                        const blocked = contactInfo.get("blocked");
                        const contactEmail: string = contactInfo.get("email");

                        return isProductContact && !blocked && ((firstName && firstName.includes(_keyword)) ||
                            (lastName && lastName.includes(_keyword)) ||
                            (name && name.includes(_keyword)) ||
                            (contactEmail !== "" &&  contactEmail === searchedEmail) ||
                            (phone.toString().includes(number.fullNumber)))
                    })
                    .sort((c1, c2) => c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name")));
            }
        }

        if(_keyword && _keyword.length > 0 && ((checkedContacts && checkedContacts.size === 0) || !checkedContacts)){
            if(number && number.fullNumber && DIGITS_REGEX.test(number.fullNumber)){
                createContact(`${number.fullNumber}@${SINGLE_CONVERSATION_EXTENSION}`, number.fullNumber, user.get("phone"));

            } else if(searchedEmail) {
                createContact("", "", user.get("phone"), searchedEmail);
            }
        }
        return checkedContacts;
    }

    componentDidMount(): void {
        const {app} = this.props;

        if (app.rightCreateGroupMember) {
            const {rightCreateGroupMember} = app;
            const {threads}: any = rightCreateGroupMember;
            const threadId = threads && threads.threadId;
            const username = threadId && getUsername(threadId);
            this.setState({checkedContactsUsernames: [username], allTimeCheckedContactsUsernames: [username]});
        }
    }

    shouldComponentUpdate(nextProps: ICreateGroupPanelProps, nextState: ICreateGroupPanelState): boolean {
        const {contacts, app} = this.props;

        if (!this.props.chat.equals(nextProps.chat)) {
            return true;
        }

        if(app.newMessages !== nextProps.app.newMessages){
            return true;
        }

        if (contacts !== nextProps.contacts) {
            return true;
        }

        if (app.showProfilePopUp !== nextProps.app.showProfilePopUp) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentWillUnmount(): void {
        const {app, removeRightCreateGroupMember} = this.props;
        if (app.rightCreateGroupMember) {
            removeRightCreateGroupMember();
        }
    }

    render(): JSX.Element {
        const {app, inRightSide, newMessagesCount} = this.props;

        const changePanel: any = panel => this.changePanel(panel, true);

        return (
            <div className="left_side">
                {this.createContactState}
                {!inRightSide &&
                <FooterNavBar selected={app.leftPanel} changePanel={changePanel} newMessagesCount={newMessagesCount}/>}
            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = (dispatch) => ({
    createContact: (contactId, phone, author, email) => dispatch(attemptCreateContact(contactId,"","", author, phone, false, false, null, false, email)),
    setSelectedThread: (thread, updateConversationTime) => dispatch(attemptSetSelectedThread(thread, updateConversationTime)),
    createGroup: (group, username, setThread) => dispatch(attemptCreateGroup(group, username, setThread)),
    inviteGroupMembers: (groupId, members) => dispatch(inviteGroupMembers(groupId, members)),
    removeRightCreateGroupMember: () => dispatch(removeRightCreateGroupMember()),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    changeRightPanel: panel => dispatch(changeRightPanel(panel)),
    setSelectedThreadId: id => dispatch(setSelectedThreadId(id)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp())
});

export default connect<{}, {}, ICreateGroupPanelPassedProps>(mapStateToProps, mapDispatchToProps)(CreateGroupPanel);
