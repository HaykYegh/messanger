"use strict";

import * as React from "react";
import {connect} from "react-redux";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {
    getContactsCountSelector,
    getShowProductContuctsSelector,
    getContactsListSelector,
    getContactsLoadingSelector,
    getFavoritesSelector,
    getContuctsSearchSelector
} from "modules/contacts/ContactsSelector";
import {
    attemptFavoritesUpdate,
    attemptToggleFavorite,
    FETCH_CONTACT_LIST,
    FETCH_FAVORITE_CONTACT_LIST
} from "modules/contacts/ContactsActions";
import ContactContainer from "containers/sidebars/ContactsSidebar/ContactContainer";
import {attemptSetSelectedThread, FETCH_THREAD, FETCH_SELECTED_THREAD, setSelectedThreadId} from "modules/application/ApplicationActions";
import {
    applicationStateSelector,
    selectedThreadIdSelector,
    selectedThreadParentMainIdSelector
} from "modules/application/ApplicationSelector";
import {IApplicationState} from "modules/application/ApplicationReducer";
import {languagesSelector} from "modules/settings/SettingsSelector";
import Search from "containers/sidebars/ContactsSidebar/Search";
import FavoritesPopup from "components/common/popups/Favorites";
import {CONTACTS_LIMIT} from "configs/constants";
import {IStoreProps} from "services/selector";
import components from "configs/localization";
import "scss/pages/left-panel/ContactList";

interface IContactsSidebarState {
    contactNumbers: string[];
    showProductContacts: boolean;
    keyword: string;

    skip: number;
    limit: number;
    isAddToFavoritePopupShown: boolean;
    q: string,
    selectedId: string
}

interface IContactsSidebarProps extends IStoreProps {
    attemptToggleFavorite: (id: string, favorite: boolean, parentContactId: string) => void,
    attemptFavoritesUpdate: (favoriteChanges: { prevValue: boolean, value: boolean, username: string } []) => void,
    attemptSetSelectedThread: (thread: any, updateConversationTime?: boolean, contactId?: string) => void,

    FETCH_CONTACT_LIST: (skip: number, limit: number, q?: string, isProductContact?: boolean, isScrollToBottom?: boolean) => void,
    FETCH_THREAD: (threadId: string) => void,
    FETCH_SELECTED_THREAD: (threadId: string) => void,
    setSelectedThreadId: (threadId: string) => void,
    FETCH_FAVORITE_CONTACT_LIST: (q?: string) => void,

    list: any,
    showProductContactsP: boolean,
    contactsSearch: string,
    favoriteList: any,
    count: number,
    loading: boolean;
    applicationState: IApplicationState,
    languages: any;
    selectedThreadId: string;
    selectedThreadParentMainId: string;
    value: string;
}

class ContactsSidebar extends React.Component<IContactsSidebarProps, IContactsSidebarState> {

    constructor(props: any) {
        super(props);

        this.state = {
            showProductContacts: true,
            contactNumbers: [],
            keyword: "",
            limit: CONTACTS_LIMIT,
            skip: 0,
            isAddToFavoritePopupShown: false,
            q: '',
            selectedId: null
        }
    }

    componentDidMount(): void {
        const {skip, limit, q, showProductContacts} = this.state;
        const {list, showProductContactsP, contactsSearch} = this.props;
        this.setState({showProductContacts: showProductContactsP, q: contactsSearch });

        if(list.size === 0) {
            this.props.FETCH_FAVORITE_CONTACT_LIST(contactsSearch);
            this.props.FETCH_CONTACT_LIST(skip, limit, contactsSearch, showProductContactsP);
            this.setState({skip: skip + 1});
        }
    }

    shouldComponentUpdate(nextProps: Readonly<IContactsSidebarProps>, nextState: Readonly<IContactsSidebarState>, nextContext: any): boolean {

        if (!isEqual(this.props.list, nextProps.list)) {
            return true;
        }

        if (this.props.showProductContactsP !== nextProps.showProductContactsP) {
           return true
        }

        if (!isEqual(this.props.favoriteList, nextProps.favoriteList)) {
            return true;
        }

        if (this.props.loading !== nextProps.loading) {
            return true;
        }

        if (this.props.count !== nextProps.count) {
            return true;
        }

        if (this.props.selectedThreadId !== nextProps.selectedThreadId) {
            return true;
        }

        if (this.props.applicationState.get("isFocused") !== nextProps.applicationState.get("isFocused")) {
            return true;
        }

        if (this.props.languages.get('selectedLanguage') !== nextProps.languages.get('selectedLanguage')) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: Readonly<IContactsSidebarProps>, prevState: Readonly<IContactsSidebarState>, snapshot?: any): void {
        // Set and remove active class from Contacts

        if (!isEqual(prevProps.selectedThreadId, this.props.selectedThreadId)) {

            // there we can have more than one instance because that same thread can be in favorites also
            const prevElements: NodeListOf<HTMLElement> = document.querySelectorAll(`[data-thread="${prevProps.selectedThreadId}"`);

            // removing the active class from threads in contacts and favorites
            if (prevElements.length > 0) {
                for (const element of prevElements) {
                    if (element instanceof HTMLElement) {
                        if (element.classList.contains('active')) {
                            element.classList.remove('active')
                        }
                    }
                }
            }

            // there we can have more than one instance because that same thread can be in favorites also
            const currentElements: NodeListOf<HTMLElement> = document.querySelectorAll(`[data-thread="${this.props.selectedThreadId}"`);

            // adding the active class to threads in contacts and favorites
            if (currentElements.length > 0) {
                for (const element of currentElements) {
                    if (element instanceof HTMLElement) {
                        if (!element.classList.contains('active')) {
                            element.classList.add('active')

                        }
                    }
                }
            }

        }
    }

    handleContactListScroll = (e: any) => {
        if (e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight)) {
            const {count, FETCH_CONTACT_LIST} = this.props;
            const {limit, skip, q, showProductContacts} = this.state;

            if ((skip * limit) >= count) {
                return;
            }

            FETCH_CONTACT_LIST(skip, limit, q, showProductContacts, true);
            this.setState({skip: skip + 1});
        }
    };

    handleThreadFetch = (threadId: string) => {
        const {attemptSetSelectedThread, selectedThreadId, FETCH_THREAD, FETCH_SELECTED_THREAD} = this.props;
        // attemptSetSelectedThread(null, false, threadId);
        // this.setState({selectedId: threadId})

        // FETCH_SELECTED_THREAD(threadId);

        if (selectedThreadId !== threadId) {
            if ((window as any).isRefactor) {
                FETCH_THREAD(threadId);
                this.setState({selectedId: threadId})
            } else {
                // FETCH_THREAD(threadId);
                attemptSetSelectedThread(null, false, threadId);
                this.setState({selectedId: threadId})
            }
        }
    };

    handleAddToFavoritesPopupToggle = () => {
        const {isAddToFavoritePopupShown} = this.state;
        this.setState({isAddToFavoritePopupShown: !isAddToFavoritePopupShown});
    };

    handleSearchInputChange = (q: string) => {
        this.setState({
            skip: 0,
            limit: CONTACTS_LIMIT,
            q
        }, () => {
            const {skip, showProductContacts, q, limit} = this.state;
            this.props.FETCH_FAVORITE_CONTACT_LIST(q);
            this.props.FETCH_CONTACT_LIST(skip, limit, q, showProductContacts);
            this.setState({skip: skip + 1});
        });
    };

    handleToggleContacts = (showProductContacts: boolean): void => {
        const {limit, q} = this.state;
        const {showProductContactsP} = this.props;

        if (this.state.showProductContacts === showProductContacts) {
            return;
        }

        this.setState({skip: 1, showProductContacts});

        this.props.FETCH_CONTACT_LIST(0, limit, q, showProductContacts);
    };

    handleClearButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        this.handleSearchInputChange("")
    };

    get popup(): JSX.Element {
        const {attemptFavoritesUpdate}: IContactsSidebarProps = this.props;
        const {isAddToFavoritePopupShown}: IContactsSidebarState = this.state;

        return (
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
                    isAddToFavoritePopupShown &&
                    <FavoritesPopup
                        close={this.handleAddToFavoritesPopupToggle}
                        attemptFavoritesUpdate={attemptFavoritesUpdate}
                    />
                }
            </ReactCSSTransitionGroup>
        );
    }

    get noInfo() {
        const {keyword} = this.state;
        const localization: any = components().contactsPanel;

        return (
            <span className="no-info">
                <span className="no-info-title">{!keyword ? localization.noContactTitle : ""}</span>
                <span className="no-info-text">
                    {!keyword ? localization.noContactText : localization.noSearchResult}
                </span>
            </span>
        )
    }

    static get loader() {
        return (
            <div className="contacts-loader">
                <div className="loader">
                    <div className="circular-loader">
                        <div className="loader-stroke">
                            <div className="loader-stroke-left"/>
                            <div className="loader-stroke-right"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    get content() {
        const {list, loading, favoriteList, selectedThreadId, selectedThreadParentMainId, languages, showProductContactsP} = this.props;
        const {showProductContacts, selectedId} = this.state;
        const localization: any = components().contactsPanel;
        const showContactContainer: boolean = !loading && list;
        const showNoInfo: boolean = !loading && list.size === 0;
        return (
            <React.Fragment>

                {loading ? ContactsSidebar.loader : null}
                {
                    showContactContainer ?
                        <ContactContainer
                            handleThreadFetch={this.handleThreadFetch}
                            selectedId={selectedId}
                            toggleAddToFavorites={this.handleAddToFavoritesPopupToggle}
                            favoritesTitle={localization.favorites}
                            contacts={list}
                            favoriteContacts={favoriteList}
                            selectedThreadId={selectedThreadId}
                            selectedThreadParentMainId={selectedThreadParentMainId}
                            selectedLanguage={languages.get('selectedLanguage')}
                            toggleContacts={this.handleToggleContacts}
                            showProductContacts={showProductContacts}
                            productContacts={showProductContactsP}
                        /> : null
                }
                {showNoInfo ? this.noInfo : null}
            </React.Fragment>
        )
    }

    render(): JSX.Element {
        const {loading, list}: IContactsSidebarProps = this.props;

        return (
            <div className="left_side">
                {this.popup}
                <div className="left_side_content contacts">
                    <Search value={this.state.q} handleClearButtonClick={this.handleClearButtonClick} handleInputChange={this.handleSearchInputChange}/>
                    <div className={`all-contacts${loading ? " loading" : ""}`} onScroll={this.handleContactListScroll}>
                        {this.content}
                    </div>
                </div>
            </div>
        );
    }

}

const mapStateToProps = () => {
    const contactsList = getContactsListSelector();
    const contactsCount = getContactsCountSelector();
    const showProductContacts = getShowProductContuctsSelector();
    const showContactsSearch = getContuctsSearchSelector()
    const contactsLoading = getContactsLoadingSelector();
    const favoriteList = getFavoritesSelector();
    const selectedThreadId = selectedThreadIdSelector();
    const selectedThreadParentMainId = selectedThreadParentMainIdSelector();
    const applicationState = applicationStateSelector();
    const languages = languagesSelector();
    // console.log(showProductContacts, 'showProductContacts')
    return (state, props) => {
        return {
            list: contactsList(state, props),
            count: contactsCount(state, props),
            loading: contactsLoading(state, props),
            favoriteList: favoriteList(state, props),
            selectedThreadId: selectedThreadId(state, props),
            selectedThreadParentMainId: selectedThreadParentMainId(state, props),
            applicationState: applicationState(state, props),
            languages: languages(state, props),
            showProductContactsP: showProductContacts(state, props),
            contactsSearch: showContactsSearch(state, props)
        }
    }
};
const mapDispatchToProps: any = dispatch => ({
    FETCH_FAVORITE_CONTACT_LIST: (q) => dispatch(FETCH_FAVORITE_CONTACT_LIST(q)),
    FETCH_CONTACT_LIST: (skip, limit, q, isProductContact, isScrollToBottom) => dispatch(FETCH_CONTACT_LIST(skip, limit, q, isProductContact, isScrollToBottom)),
    FETCH_THREAD: (threadId) => dispatch(FETCH_THREAD(threadId)),
    FETCH_SELECTED_THREAD: (threadId) => dispatch(FETCH_SELECTED_THREAD(threadId)),
    setSelectedThreadId: (threadId) => dispatch(setSelectedThreadId(threadId)),

    attemptToggleFavorite: (id, favorite, parentContactId) => dispatch(attemptToggleFavorite(id, favorite, parentContactId)),
    attemptFavoritesUpdate: (changes) => dispatch(attemptFavoritesUpdate(changes)),
    attemptSetSelectedThread: (thread, updateConversationTime, contactId) => dispatch(attemptSetSelectedThread(thread, updateConversationTime, contactId)),

});

export default connect(mapStateToProps, mapDispatchToProps)(ContactsSidebar);
