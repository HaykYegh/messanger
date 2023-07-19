"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import {Scrollbars} from 'react-custom-scrollbars';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    attemptChangeLeftPanel,
    attemptSetSelectedThread,
    setSelectedThreadId,
    toggleProfilePopUp
} from "modules/application/ApplicationActions";
import {attemptFavoritesUpdate, attemptToggleFavorite} from "modules/contacts/ContactsActions";
import ContactContainer from "components/contacts/ContactContainer";
import {CONVERSATIONS_LIMIT, LEFT_PANELS} from "configs/constants";
import {getUserId, includesInNumbers} from "helpers/DataHelper";
import FavoritesPopup from "components/common/popups/Favorites";
import FooterNavBar from "components/common/FooterNavBar";
import selector, {IStoreProps} from "services/selector";
import SearchInput from "components/common/SearchInput";
import components from "configs/localization";

import "scss/pages/left-panel/ContactList";
import {IContact} from "modules/contacts/ContactsReducer";

interface IContactsPanelState {
    contactNumbers: Array<string>;
    onlyProductContact: boolean;
    keyword: string;
    currentPage: number;
    getContacts: boolean;
    isAddToFavoritesPopup: boolean
}

interface IContactsPanelProps extends IStoreProps {
    setSelectedThreadId: (id: string) => void;
    setSelectedThread: (thread: any) => void;
    changeLeftPanel: (panel: string) => void;
    toggleProfilePopUp: () => void;
    attemptToggleFavorite: (id: string, favorite: boolean, parentContactId: string) => void,
    attemptFavoritesUpdate: (favoriteChanges: { prevValue: boolean, value: boolean, username: string } []) => void,
}

const selectorVariables: any = {
    newMessagesCount: true,
    selectedThreadId: true,
    selectedThread: true,
    application: {
        app: true
    },
    contacts: {
        favoriteContacts: true,
        standardContacts: true,
        savedContacts: true,
        contactsLoading: true,
        contacts: true
    },
    settings: {
        chat: true
    },
    user: true
};

class ContactsPanel extends React.Component<IContactsPanelProps, IContactsPanelState> {

    constructor(props: any) {
        super(props);

        this.state = {
            onlyProductContact: true,
            contactNumbers: [],
            keyword: "",
            currentPage: 1,
            getContacts: false,
            isAddToFavoritesPopup: false,
        }
    }

    scrollTop: number;

    contextMenu: HTMLDivElement;

    componentDidMount(): void {
        document.getElementById("contactContainer").addEventListener("scroll", this.handleDocumentScroll, true);
    }

    shouldComponentUpdate(nextProps: IContactsPanelProps, nextState: IContactsPanelState): boolean {
        if (!this.props.chat.equals(nextProps.chat)) {
            return true;
        }

        if (!this.props.selectedThread.equals(nextProps.selectedThread)) {
            return true;
        }

        if (!isEqual(this.state, nextState)) {
            return true;
        }

        return this.props.selectedThreadId !== nextProps.selectedThreadId ||
            this.props.app.showProfilePopUp !== nextProps.app.showProfilePopUp ||
            !this.props.contacts.equals(nextProps.contacts) ||
            !this.props.standardContacts.equals(nextProps.standardContacts) ||
            !this.props.favoriteContacts.equals(nextProps.favoriteContacts) ||
            this.props.newMessagesCount !== nextProps.newMessagesCount ||
            this.props.contactsLoading !== nextProps.contactsLoading ||
            !this.props.savedContacts.equals(nextProps.savedContacts) ||
            !this.props.user.equals(nextProps.user);
    }

    componentDidUpdate(): void {
        const {getContacts} = this.state;
        if (getContacts) {
            this.setState({getContacts: false});
            const scrollBar: any = this.refs.scrollBar;
            if (scrollBar) {
                this.scrollTop = scrollBar.lastViewScrollTop;
            }
        }
    }

    componentWillUnmount(): void {
        document.getElementById("contactContainer").removeEventListener("scroll", this.handleDocumentScroll, true);
        document.removeEventListener("click", this.handleDocumentClick)
    }

    handleDocumentClick = (event: MouseEvent) => {
        if (!(event.target as any).contains(this.contextMenu) && this.contextMenu && this.contextMenu.style.display === "block") {
            this.contextMenu.style.display = "none";
            this.setState({contactNumbers: []});
        }
    };

    handleAddToFavorites = () => {
        const newState: IContactsPanelState = {...this.state};
        newState.isAddToFavoritesPopup = true;
        this.setState(newState);
    };

    // componentDidMount() {
    //     document.addEventListener("click", this.handleDocumentClick);
    // }
    //

    handlePanelChange = (panel: string) => {
        const {app, changeLeftPanel} = this.props;

        if (panel !== app.leftPanel) {
            changeLeftPanel(panel);
        }
    };

    handleSearchInputChange = ({currentTarget: {value}}: React.ChangeEvent<HTMLInputElement>) => {
        const {keyword} = this.state;
        if (value !== keyword) {
            this.setState({keyword: value.toLowerCase()});
        }
    };

    handleSearchClear = (): void => {
        this.setState({keyword: ""});
        (document.getElementById("searchInput") as HTMLInputElement).value = "";
    };

    handleThreadChange = (contact: any, event?: React.MouseEvent<HTMLLIElement>) => {
        const threadId = contact.getIn(["threads", "threadId"]);
        const contactInfo = contact.get("members").first();
        const numbers: any = contactInfo.get("numbers");
        const {setSelectedThread, selectedThreadId} = this.props;

        if (numbers && numbers.size > 1 && !contactInfo.get("singleProductContact")) {
            this.showNumbers(event, numbers.toArray());

        } else if (selectedThreadId !== threadId) {
            setSelectedThread(contact.toJS());
        }
    };

    showNumbers = (event: React.MouseEvent<HTMLLIElement>, contactNumbers) => {
        document.removeEventListener("click", this.handleDocumentClick);
        event.preventDefault();
        event.stopPropagation();
        const rootH: number = this.contextMenu.offsetHeight;
        const rootW: number = this.contextMenu.offsetWidth;
        const screenH: number = window.innerHeight;
        const screenW: number = window.innerWidth;
        const clickX: number = event.clientX;
        const clickY: number = event.clientY;

        const right: boolean = (screenW - clickX) > rootW;
        const top: boolean = (screenH - clickY) > rootH;
        const bottom: boolean = !top;
        const left: boolean = !right;

        if (right) {
            this.contextMenu.style.left = `${clickX + 5}px`;
        }

        if (left) {
            this.contextMenu.style.left = `${clickX - rootW - 5}px`;
        }

        if (top) {
            this.contextMenu.style.top = `${clickY + 5}px`;
        }

        if (bottom) {
            this.contextMenu.style.top = `${clickY - rootH - 5}px`;
        }

        this.setState({contactNumbers});
        this.contextMenu.style.display = "block";
        document.addEventListener("click", this.handleDocumentClick);
    };

    setIsProductContact = () => {
        this.setState({onlyProductContact: true});
    };

    setAllContact = () => {
        this.setState({onlyProductContact: false});
    };

    get headerLeftButton(): any {
        const {user, toggleProfilePopUp} = this.props;

        if (!user) {
            return null;
        }

        return {
            style: user.get("avatarUrl") ? {
                backgroundImage: `url(${user.get("avatarUrl")})`,
                backgroundSize: "contain"
            } : {},
            onClick: toggleProfilePopUp,
            className: "user_icon"
        };
    }

    handleContactCreate = () => {
        this.handlePanelChange(LEFT_PANELS.create_contact)
    };

    get favoriteContacts(): any {
        const {favoriteContacts} = this.props;
        const {keyword} = this.state;

        return favoriteContacts
            .filter(contact => {
                const contactInfo = contact.get("members").first();
                const [name, phone, numbers, isProductContact] = [contactInfo.get("name"), contactInfo.get("phone"), contactInfo.get("numbers"), contactInfo.get("isProductContact")];
                return isProductContact && name && name.toLowerCase().includes(keyword) || includesInNumbers(phone, numbers, keyword);
            })
            .valueSeq()
            .sort((c1, c2) => {
                const c1IsNumber = !isNaN(c1.get('members').first().get("avatarCharacter"));
                const c2IsNumber = !isNaN(c2.get('members').first().get("avatarCharacter"));
                const compare = c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name"));
                if (compare !== 0 && c1IsNumber && !c2IsNumber) {
                    return 1;
                } else if (compare !== 0 && !c1IsNumber && c2IsNumber) {
                    return -1;
                }
                return compare;
            });
    }

    get contacts(): any {
        const {savedContacts} = this.props;
        const {keyword} = this.state;

        return savedContacts
            .filter(contact => {
                const contactInfo = contact.get("members").first();
                const [name, phone, numbers, isProductContact] = [contactInfo.get("name"), contactInfo.get("phone"), contactInfo.get("numbers"), contactInfo.get("isProductContact")];
                return (isProductContact && name && name.toLowerCase().includes(keyword) || includesInNumbers(phone, numbers, keyword)) && !contactInfo.get("parentMainId")
            })
            .valueSeq()
            .sort((c1, c2) => {
                const c1IsNumber = !isNaN(c1.get('members').first().get("avatarCharacter"));
                const c2IsNumber = !isNaN(c2.get('members').first().get("avatarCharacter"));
                const compare = c1.get('members').first().get("name").localeCompare(c2.get('members').first().get("name"));
                if (compare !== 0 && c1IsNumber && !c2IsNumber) {
                    return 1;
                } else if (compare !== 0 && !c1IsNumber && c2IsNumber) {
                    return -1;
                }
                return compare;
            });
    }

    handleNumberSelect = (number: string) => {
        const {savedContacts, setSelectedThread} = this.props;
        const contact = savedContacts.get(getUserId(number));
        this.contextMenu.style.display = "none";
        if (contact) {
            setSelectedThread(contact.toJS());
        }
        this.setState({
            contactNumbers: []
        });
    };

    handleDocumentScroll = (event) => {
        const target = event.target;
        const {contacts} = this.props;
        const {currentPage} = this.state;
        const scrollBar: any = this.refs.scrollBar;

        if ((target.scrollTop + target.offsetHeight) == target.scrollHeight) {
            target.scrollTop--;
        }

        if (target.scrollTop === 0 && !(scrollBar && scrollBar.lastViewScrollTop)) {
            scrollBar.scrollTop(scrollBar.viewScrollTop);
        }
        if (this.scrollTop && this.scrollTop < target.scrollTop) {
            scrollBar.scrollTop(this.scrollTop);
            this.scrollTop = this.scrollTop + 100;
        }

        if (!this.state.getContacts && (target.scrollHeight - (target.offsetHeight + target.scrollTop) <= target.scrollHeight / 7) && (CONVERSATIONS_LIMIT * currentPage < contacts.size)) {
            this.setState({
                getContacts: true,
                currentPage: currentPage + 1
            });
        }


    };

    updateContactsInfo = (getContacts, currentPage) => {
        if (currentPage) {
            this.setState({getContacts, currentPage});
        } else {
            this.setState({getContacts});
        }
    };

    handleAddToFavoritesPopUpClose = () => {
        const newState: IContactsPanelState = {...this.state};
        newState.isAddToFavoritesPopup = false;
        this.setState(newState);
    };

    get contactNumbers() {
        const {savedContacts} = this.props;
        const {contactNumbers} = this.state;
        return contactNumbers.map(number => {
            const contactId: string = getUserId(number);
            const contact: IContact = savedContacts.getIn([contactId, "members", contactId]);
            const email: string = contact.get("email");

            return (<div className="contextMenu--option"
                        key={number}
                        onClick={() => this.handleNumberSelect(number)}>{email || number}
            </div>);
        })
    }

    render(): JSX.Element {
        const {app, selectedThreadId, newMessagesCount, contactsLoading, attemptFavoritesUpdate, user, savedContacts} = this.props;
        const {onlyProductContact, keyword, contactNumbers, getContacts, currentPage, isAddToFavoritesPopup} = this.state;
        const localization: any = components().contactsPanel;
        const searchClearButton: boolean = keyword && keyword !== "";
        const userId: string = user.get("id");

        return (
            <div className="left_side">
                <ReactCSSTransitionGroup
                    transitionName={{
                        enter: 'open',
                        leave: 'close',
                    }}
                    component="div"
                    transitionEnter={true}
                    transitionLeave={true}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={200}>
                    {
                        isAddToFavoritesPopup &&
                        <FavoritesPopup
                            close={this.handleAddToFavoritesPopUpClose}
                            // isFavoritesPopup={isAddToFavoritesPopup}
                            attemptFavoritesUpdate={attemptFavoritesUpdate}
                        />
                    }
                </ReactCSSTransitionGroup>
                <div className="left_side_content contacts">
                    <SearchInput onChange={this.handleSearchInputChange}
                                 iconClassName="hidden"
                                 handleSearchClear={this.handleSearchClear}
                                 clearButton={searchClearButton}
                    />
                    <div className="contacts-tab hidden">
                        <div className={onlyProductContact ? "tab" : "tab tab-active"} onClick={this.setAllContact}>
                            <span className="tab-btn">{localization.all}</span>
                        </div>
                        <div className={`tab ${!onlyProductContact} ? "" : "tab-active" `}
                             onClick={this.setIsProductContact}>
                            <span className="tab-btn">RASED</span>
                        </div>
                    </div>
                    <Scrollbars
                        className="all-contacts"
                        ref="scrollBar"
                        id="contactContainer"
                        style={{height: "calc(100% - 43px)"}}
                        onMouseDown={() => {
                            this.scrollTop = 0
                        }}
                        autoHide autoHideTimeout={2000}
                        autoHideDuration={1000}>
                        <ContactContainer
                            toggleSelectedThread={this.handleThreadChange}
                            selectedContactId={selectedThreadId}
                            onlyProductContact={onlyProductContact}
                            contacts={this.favoriteContacts}
                            updateContactsInfo={this.updateContactsInfo}
                            title={localization.favorites}
                            getContacts={getContacts}
                            currentPage={currentPage}
                            showTitle={true}
                            scrollBar={this.refs.scrollBar}
                            favoriteContact={true}
                            toggleAddToFavorites={this.handleAddToFavorites}
                            addToFavorites={isAddToFavoritesPopup}
                            userId={userId}
                        />

                        {this.contacts && this.contacts.size > 0 &&
                        <ContactContainer
                            showTitle={true}
                            toggleSelectedThread={this.handleThreadChange}
                            onlyProductContact={onlyProductContact}
                            selectedContactId={selectedThreadId}
                            title={localization.contacts}
                            updateContactsInfo={this.updateContactsInfo}
                            getContacts={getContacts}
                            currentPage={currentPage}
                            contacts={this.contacts}
                            scrollBar={this.refs.scrollBar}
                            toggleAddToFavorites={this.handleAddToFavorites}
                            addToFavorites={isAddToFavoritesPopup}
                            userId={userId}
                        />}

                        {this.favoriteContacts && this.favoriteContacts.size === 0 && this.contacts.size === 0 ?
                            contactsLoading ?
                                <div className="contacts-loader">
                                    <div className="loader">
                                        <div className="circular-loader">
                                            <div className="loader-stroke">
                                                <div className="loader-stroke-left"/>
                                                <div className="loader-stroke-right"/>
                                            </div>
                                        </div>
                                    </div>
                                </div> :
                                <span className="no-info">
                                    <span className="no-info-title">{!keyword ? localization.noContactTitle : ""}</span>
                                    <span className="no-info-text">{!keyword ? localization.noContactText : localization.noSearchResult}</span>
                                </span> : null
                        }
                    </Scrollbars>
                </div>
                <div className="contextMenu" ref={ref => this.contextMenu = ref}>
                    {this.contactNumbers}
                </div>
                <FooterNavBar
                    selected={app.leftPanel} changePanel={this.handlePanelChange}
                    newMessagesCount={newMessagesCount}
                />

            </div>
        );
    }
}

const mapStateToProps: any = state => selector(state, selectorVariables);

const mapDispatchToProps: any = dispatch => ({
    setSelectedThreadId: id => dispatch(setSelectedThreadId(id)),
    changeLeftPanel: panel => dispatch(attemptChangeLeftPanel(panel)),
    toggleProfilePopUp: () => dispatch(toggleProfilePopUp()),
    setSelectedThread: (thread) => dispatch(attemptSetSelectedThread(thread)),
    attemptToggleFavorite: (id, favorite, parentContactId) => dispatch(attemptToggleFavorite(id, favorite, parentContactId)),
    attemptFavoritesUpdate: (changes) => dispatch(attemptFavoritesUpdate(changes))
});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsPanel);
