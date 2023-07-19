"use strict";

import {createSelector} from "helpers/DataHelper";
import {Map} from "immutable";

const userDataSelector: any = state => {
    return state.get("userData");
};

const user: any = createSelector(
    userDataSelector, (userData: any) => {
        return Map({
            fullName: userData.get("fullName"),
            firstName: userData.get("firstName"),
            lastName: userData.get("lastName"),
            avatarCharacter: userData.get("avatarCharacter"),
            avatar: userData.get("avatar"),
            imageUrl: userData.get("imageUrl"),
            username: userData.get("username"),
            password: userData.get("password"),
            color: userData.get("color"),
            phone: userData.get("phone"),
            email: userData.get("email"),
            id: userData.get("id")
        })
    }
);

const errorMessageSelector: any = createSelector(
    userDataSelector, (userData: any) => userData.get("errorMessage")
);

export interface IUserModuleProps {
    errorMessage: string;
    user: any;
}


export const usernameSelector = createSelector(
    userDataSelector, (userData: any) => userData.get("username")
);


export default (state, variables = null) => {
    if (!variables) {
        return {
            user: userSelector()(state),
            responseMessage: responseMessageSelector()(state)
        }
    } else if (variables === true) {
        return {
            user: user(state)
        }
    } else {
        return {
            user: variables.user ? userSelector()(state) : null,
            errorMessage: variables.errorMessage ? responseMessageSelector()(state) : null
        }
    }
};


// refactored


export const userIdSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.getIn(["user", "id"])
);

export const userNameSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.getIn(["user", "username"]) || ""
);

export const userSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.get("user")
);

export const responseMessageSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.get("responseMessage")
);

export const userAvatarSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.getIn(["user", "avatar"])
);

export const userImageSelector = () => createSelector(
    userDataSelector, (userData: any) => userData.getIn(["user", "imageUrl"])
);
