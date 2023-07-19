"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import {createSelector} from "helpers/DataHelper";
import {List, Map} from "immutable";
import {CONVERSATION_TYPE} from "configs/constants";

const contactsDataSelector: any = state => state.get("contactsData");

const allContactsSelector: any = createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("contacts")
);

const savedContactsSelector: any = createSelector(
    allContactsSelector, (contacts: any) => contacts.filter(contact => contact.get("members").first().get("saved") && contact.getIn(["threads", "threadType"]) !== CONVERSATION_TYPE.PRIVATE_CHAT)
);

const standardContactsSelector: any = createSelector(
    savedContactsSelector, (contacts: any) => contacts.filter(contact => !contact.get("favorite"))
);

const favoriteContactsSelector: any = createSelector(
    savedContactsSelector, (contacts: any) => contacts.filter(contact => {
        const savedContact = contact.get("members").first();
        return savedContact.get("favorite");
    })
);

const blockedContactNumbersSelector: any = createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("blockedContactNumbers")
);

const contactsLoadingSelector: any = createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("contactsLoading")
);

const contactErrorsSelector: any = createSelector(
  contactsDataSelector, (contactsData: any) => contactsData.get("contactErrors")
);

const blockedContactsSelector: any = createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("blockedContacts")
);

const selectedThreadID: any = state => state.getIn(["applicationData", "selectedThreadId"]);

const selectedInfoThreadID: any = state => state.getIn(["applicationData", "selectedInfoThreadId"]);

const selectedContactSelector: any = createSelector(
    allContactsSelector, selectedThreadID, (contacts: any, selectedThreadId: string) => contacts.get(selectedThreadId)
);

const selectedInfoContactSelector: any = createSelector(
    allContactsSelector, selectedInfoThreadID, (contacts: any, selectedInfoThreadId: string) => contacts.get(selectedInfoThreadId)
);


export interface IContactModuleProps {
    standardContacts: Map<string, IContact>;
    favoriteContacts: Map<string, IContact>;
    blockedContacts: Map<string, IContact>;
    savedContacts: Map<string, IContact>;
    blockedContactNumbers: List<string>;
    contacts: Map<string, IContact>;
    selectedInfoContact: IContact;
    selectedContact: IContact;
    contactsLoading: boolean;
    contactErrors: any;

    list: Map<string, IContact>,
    count: any
}

export default (state, variables = null) => {
    if (!variables) {
        return {
            blockedContactNumbers: blockedContactNumbersSelector(state),
            selectedInfoContact: selectedInfoContactSelector(state),
            standardContacts: standardContactsSelector(state),
            favoriteContacts: favoriteContactsSelector(state),
            selectedContact: selectedContactSelector(state),
            blockedContacts: blockedContactsSelector(state),
            contactsLoading: contactsLoadingSelector(state),
            contactErrors: contactErrorsSelector(state),
            savedContacts: savedContactsSelector(state),
            contacts: allContactsSelector(state),
        }
    } else if (variables === true) {
        return {
            contacts: allContactsSelector(state),
        }
    } else {
        return {
            selectedInfoContact: variables.selectedInfoContact ? selectedInfoContactSelector(state) : null,
            blockedContactNumbers: variables.selectedContact ? blockedContactNumbersSelector(state) : null,
            standardContacts: variables.standardContacts ? standardContactsSelector(state) : null,
            contactsLoading: variables.contactsLoading ? contactsLoadingSelector(state) : null,
            contactErrors: variables.contactErrors ? contactErrorsSelector(state) : null,
            favoriteContacts: variables.favoriteContacts ? favoriteContactsSelector(state) : null,
            selectedContact: variables.selectedContact ? selectedContactSelector(state) : null,
            blockedContacts: variables.blockedContacts ? blockedContactsSelector(state) : null,
            savedContacts: variables.savedContacts ? savedContactsSelector(state) : null,
            contacts: variables.contacts ? allContactsSelector(state) : null,
        }
    }
};


// Refactored
export const getContactsSelector: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => {
        const contacts: any = contactsData.get("contacts");

        return contacts.filter(item => {
            const contact: any = item.get("members").first();
            if (!contact) {
                return false;
            }

            return contact.get('saved');

        }).toOrderedMap().sortBy(item => item.get('name'));
    }
);

export const getContactsListSelector: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => {
        return contactsData.get("list")
            .filter(contact => contact.get("saved") && !contact.get('parentMainId'))
            .toOrderedMap()
            .sortBy(item => item.get('name'));
    }
);

export const getContactsCountSelector: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("count")
);

export const getShowProductContuctsSelector: any = () => createSelector(
  contactsDataSelector, (contactsData: any) => contactsData.get("showProductContacts")
);

export const getContuctsSearchSelector: any = () => createSelector(
  contactsDataSelector, (contactsData: any) => contactsData.get("contactsSearch")
);

export const getContactsLoadingSelector: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("contactsLoading")
);

export const getFavoritesSelector: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get("favoriteList")
        .filter(contact => !contact.get('parentMainId'))
        .toOrderedMap()
        .sortBy(item => item.get('name'))
);

export const contactSelector: any = (contactId) => createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.getIn(["contacts", contactId])
);

export const getSelectedContactSelector: any = () => createSelector(
    contactsDataSelector, selectedThreadID, (contactsData: any, selectedThreadId: string) => contactsData.getIn(["contacts", selectedThreadId])
);

export const getContactsSelectorOld: any = () => createSelector(
    contactsDataSelector, (contactsData: any) => contactsData.get('contacts')
); // Todo remove after refactor HeaderContainer
