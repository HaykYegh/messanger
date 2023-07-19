"use strict";

import {Map} from "immutable";
import * as React from "react";
import isEqual from "lodash/isEqual";

import ContactBlock from "containers/sidebars/ContactsSidebar/ContactBlock";
import components from "configs/localization";
import {IContact} from "modules/contacts/ContactsReducer";
import {
    ContactFavoritesIcon,
    ContactInfo,
    ContactListBlock,
    ContactName,
    ContactsContainer,
    FilterPopup,
    FilterPopupList,
    FilterPopupListItem,
    FilterPopupListItemContent,
    FilterPopupListItemIcon,
    SubTitle,
    SubTitleIcon
} from "containers/sidebars/ContactsSidebar/style";

interface IContactContainerProps {
    handleThreadFetch?: (threadId: string) => void;
    toggleContacts?: (isProductContacts: boolean) => void;
    toggleAddToFavorites?: () => void;
    favoriteContacts?: Map<string, IContact>;
    contacts?: Map<string, any>;
    favoritesTitle?: string;
    addToFavorites?: boolean;
    selectedThreadId: string;
    selectedThreadParentMainId: string;
    selectedLanguage: string;
    showProductContacts: boolean;
    productContacts: boolean;
    selectedId: string
}

interface IContactContainerState {
    filterPopupOpen: boolean;
}

export default class ContactContainer extends React.Component<IContactContainerProps, IContactContainerState> {

    filterPopupContainer: React.RefObject<HTMLDivElement>;

    contactTitleContainer: React.RefObject<HTMLDivElement>;

    constructor(props: any) {
        super(props);
        this.filterPopupContainer = React.createRef();
        this.contactTitleContainer = React.createRef();

        this.state = {
            filterPopupOpen: false,
        }
    }

    componentDidMount() {
        document.addEventListener("click", this.handleOutSideClick);
    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
    }

    shouldComponentUpdate(nextProps: Readonly<IContactContainerProps>, nextState: Readonly<IContactContainerState>, nextContext: any): boolean {

        if (!isEqual(this.props.contacts, nextProps.contacts)) {
            return true;
        }

        if (!isEqual(this.props.favoriteContacts, nextProps.favoriteContacts)) {
            return true;
        }

        if (this.props.productContacts !== nextProps.productContacts) {
            return true
        }

        if (this.props.selectedThreadId !== nextProps.selectedThreadId) {
            return true;
        }

        if (this.props.selectedId !== nextProps.selectedId) {
            return true;
        }

        if (this.props.selectedLanguage !== nextProps.selectedLanguage) {
            return true;
        }

        if (this.props.showProductContacts !== nextProps.showProductContacts) {
            return true;
        }

        return this.state.filterPopupOpen !== nextState.filterPopupOpen;
    }

    componentDidUpdate(prevProps: IContactContainerProps, prevState: IContactContainerState) {
        if (this.props.productContacts !== prevProps.productContacts) {
            this.handleFilterPopupToggle();
        }
    }

    handleFilterPopupToggle = (): void => {
        this.setState({filterPopupOpen: !this.state.filterPopupOpen});
    };

    handleOutSideClick = (event: any): void => {
        if (
            this.state.filterPopupOpen && this.filterPopupContainer && this.filterPopupContainer.current
            && !this.filterPopupContainer.current.contains(event.target) &&
            this.contactTitleContainer && !this.contactTitleContainer.current.contains(event.target)
        ) {
            this.handleFilterPopupToggle();
        }
    };

    get filterPopupList(): JSX.Element {
        const {filterPopupOpen} = this.state;
        const {toggleContacts, showProductContacts, productContacts} = this.props;
        const localization: any = components().contactInfo;
        return (
            <FilterPopup
                className={`${filterPopupOpen ? " open" : ""}`}
                ref={this.filterPopupContainer}
            >
                <FilterPopupList>
                    <FilterPopupListItem active={productContacts}>
                        {productContacts && <FilterPopupListItemIcon/>}
                        <FilterPopupListItemContent
                            onClick={() => toggleContacts(true)}
                        >{localization.productContacts}</FilterPopupListItemContent>
                    </FilterPopupListItem>
                    <FilterPopupListItem active={!productContacts}>
                        {!productContacts && <FilterPopupListItemIcon/>}
                        <FilterPopupListItemContent
                            onClick={() => toggleContacts(false)}
                        >{localization.allContacts}</FilterPopupListItemContent>
                    </FilterPopupListItem>
                </FilterPopupList>
            </FilterPopup>
        );
    }

    render(): JSX.Element {
        const {
            favoritesTitle, favoriteContacts, contacts, selectedThreadParentMainId,
            toggleAddToFavorites, handleThreadFetch, selectedThreadId, showProductContacts, productContacts, selectedId
        }: IContactContainerProps = this.props;



        const localization: any = components().contactInfo;
        const content: any[] = [
            {
                contacts: favoriteContacts,
                favorite: true,
                title: favoritesTitle,
            },
            {
                contacts: contacts,
                favorite: false,
                title: productContacts ? localization.productContacts : localization.allContacts
            },
        ];

        return (
            <div>
                {
                    content.map((item, index) => {
                        return (
                            <ul className="usual_contacts" key={index}>
                                <li>
                                    <SubTitle
                                        onClick={this.handleFilterPopupToggle}
                                        ref={item.favorite ? null : this.contactTitleContainer}
                                        margin={item.favorite ? "8px 0 12px 15px" : "20px 0 12px 15px"}
                                    >
                                        {item.title}
                                        {!item.favorite && <SubTitleIcon/>}
                                    </SubTitle>
                                    {!item.favorite && this.filterPopupList}
                                </li>

                                <li>
                                    <ContactsContainer className="contacts_container">
                                        {item.contacts && item.contacts.valueSeq().map(contact => {
                                            const contactId: string = contact.get("contactId");
                                            const mainId: string = contact.get("mainId");
                                            if (contact.get("favorite")) {
                                                contact = contacts.get(contactId)
                                            }
                                            return (
                                                <ContactBlock
                                                    key={contactId}
                                                    active={contactId === selectedThreadId || (selectedThreadParentMainId && (mainId === selectedThreadParentMainId))}
                                                    // active={contactId === selectedId}
                                                    contact={contact}
                                                    fetchThread={handleThreadFetch}
                                                />
                                            )
                                        })}
                                    </ContactsContainer>
                                </li>

                                {
                                    item.favorite &&
                                    <ContactListBlock onClick={toggleAddToFavorites}>
                                        <ContactFavoritesIcon>
                                            <a/>
                                        </ContactFavoritesIcon>
                                        <ContactInfo>
                                            <ContactName>{localization.addFav}</ContactName>
                                        </ContactInfo>
                                    </ContactListBlock>
                                }
                            </ul>
                        )
                    })
                }
            </div>
        )
    }
}
