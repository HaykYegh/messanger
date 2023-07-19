"use strict";

import {IContact} from "modules/contacts/ContactsReducer";
import {fromJS, List, Map} from "immutable";
import {createSelector} from "helpers/DataHelper";
import {IApplicationState} from "modules/application/ApplicationReducer";
import app = Electron.app;

const applicationSelector: any = state => state.get("applicationData");

export interface IApplicationModuleProps {
    app: {
        rightCreateGroupMember: IContact;
        oldCreateContactNumber: number;
        createNewContactPopUp: boolean;
        selectedInfoThreadId: string;
        selectedThread: Map<any, any>;
        createContactNumber: number;
        previousRightPanel: string;
        showProfilePopUp: boolean;
        previousLeftPanel: string;
        selectedThreadId: string;
        selectedAvatarUrl: string;
        sharedMediaMessages: any;
        gifMessages: any;
        settingsSubPage: string;
        showRightPanel: boolean;
        selectedStickerId: null;
        showSharedMedia: boolean;
        previousGroupId: string;
        addMemberPlace: string;
        threadTexts: any;
        synced: Map<any, any>;
        caches: Map<any, any>;
        failedSync: List<any>;
        files: Array<File>;
        sendingLocation: any;
        rightPanel: string;
        leftPanel: string;
        loading: boolean;
        showChat: boolean;
        minimized: boolean;
        fetchChannel: number;
        showLoading: any;
        gifsLoading: boolean;
        showMoreGifLoading: boolean;
        gifMessagesCount: any;
        newMessages: any;
        db: any;
        sharedMediaPanel: any;
        searchKeyword: string;
        outCallPopup: any;
        privateChatError: string;
        showSearchMessages: boolean;
        sharedMediaCount: number;
        applicationState: IApplicationState;
        sharedMedia: any;
        canNotDoCallPopup: boolean;
        canNotDeleteGroupPopup: boolean;
    }
}


export const appStateSelector = createSelector(
    applicationSelector, (app: Map<string, any>) => fromJS({
        sidebars: {
            left: app.get('leftPanel'),
            right: app.get('rightPanel'),
        }
    })
);


export default (state, variables = null) => {

    if (!variables) {
        return {
            app: applicationSelector(state).toJS()
        }
    } else if (variables === true) {
        return {
            app: applicationSelector(state).toJS()
        }
    } else {
        return {
            app: variables.app ? applicationSelector(state).toJS() : null
        }
    }
};

export const selectedThreadIdSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("selectedThreadId")
    )
};

export const selectedThreadParentMainIdSelector = () => {
    return createSelector(
        applicationSelector, selectedThreadIdSelector(), (applicationData, selectedThreadId) => {
            return applicationData.getIn(['selectedThread', 'members', selectedThreadId, 'parentMainId']);
        }
    )
};


export const selectedThreadSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("selectedThread")
    )
};

//refactored


export const currentThreadSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get('currentThread')
    )
};

export const leftPanelSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get('leftPanel')
    )
};

export const threadIdSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.getIn(['currentThread', 'threadId'])
    )
};

export const applicationStateSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("applicationState")
    )
};

export const applicationVersionSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.getIn(["applicationState", 'config', 'version'])
    )
};

export const applicationWalletUrlSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.getIn(["applicationState", 'walletURL'])
    )
};

export const updateDownloadProgressSelector = () => {
    return createSelector(
      applicationSelector, (applicationData) => applicationData.get("updateProgress")
    )
};

export const updateDownloadStartSelector = () => {
    return createSelector(
      applicationSelector, (applicationData) => applicationData.get("updateDownloadStart")
    )
};

export const updateDownloadFinishSelector = () => {
    return createSelector(
      applicationSelector, (applicationData) => applicationData.get("updateDownloadFinish")
    )
};

export const updateIsAvailableSelector = () => {
    return createSelector(
      applicationSelector, (applicationData) => applicationData.get("updateIsAvailable")
    )
};

export const updateIsLoadingSelector = () => {
    return createSelector(
      applicationSelector, (applicationData) => applicationData.get("updateIsLoading")
    )
}

export const sharedMediaSkipSelector = (type) => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.getIn(["sharedMedia", "types", type, "skip"])
    )
};

export const newMessagesCountSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => {
            return applicationData.get('newMessages') ? applicationData.getIn(['newMessages', 'thread']) : 0;
        }
    )
};

export const minimizedSelector = () => {
    return createSelector(
        applicationSelector, applicationData => applicationData.get('minimized')
    )
};

export const showChatSelector = () => {
    return createSelector(
        applicationSelector, applicationData => applicationData.get('showChat')
    )
};

export const sharedMediaPanelSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("sharedMediaPanel")
    )
};

export const outCallPopupSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("outCallPopup")
    )
};

export const createNewContactPopupSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("createNewContactPopup")
    )
};

export const createContactNumberSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("createContactNumber")
    )
};

export const showSearchMessagesSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("showSearchMessages")
    )
};

export const selectedInfoThreadIdSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("selectedInfoThreadId")
    )
};

export const showRightPanelSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("showRightPanel")
    )
};

export const sharedMediaSelector = () => {
    return createSelector(
        applicationSelector, (applicationData) => applicationData.get("sharedMedia")
    )
};

export const fileSelector = () => createSelector(
    applicationSelector, (applicationData) => {
        let records: any = applicationData.getIn(["sharedMedia", "types", "file", "records"]);
        if (records.size !== 0) {
            records = records.sort((prev, next) => {
                const prevDate: number = prev.getIn(["messages", "time"]);
                const nextDate: number = next.getIn(["messages", "time"]);
                if (prevDate === nextDate) {
                    return 0
                }

                if (prevDate < nextDate) {
                    return 1
                } else {
                    return -1
                }
            });
        }

        return records
    }
);

export const mediaSelector = () => createSelector(
    applicationSelector, (applicationData) => {
        let records: any = applicationData.getIn(["sharedMedia", "types", "media", "records"]);
        if (records.size !== 0) {
            records = records.sort((prev, next) => {
                const prevDate: number = prev.getIn(["messages", "time"]);
                const nextDate: number = next.getIn(["messages", "time"]);
                if (prevDate === nextDate) {
                    return 0
                }

                if (prevDate < nextDate) {
                    return 1
                } else {
                    return -1
                }
            });
        }

        return records
    }
);

export const imageUrlSelector = () => createSelector(
  applicationSelector, (applicationData) => {
      return applicationData.getIn(["sharedMedia", "types", "media", "imageUrls"])
  }
);

export const linkSelector = () => createSelector(
    applicationSelector, (applicationData) => {
        let records: any = applicationData.getIn(["sharedMedia", "types", "link", "records"]);
        if (records.size !== 0) {
            records = records.sort((prev, next) => {
                const prevDate: number = prev.getIn(["messages", "time"]);
                const nextDate: number = next.getIn(["messages", "time"]);
                if (prevDate === nextDate) {
                    return 0
                }

                if (prevDate < nextDate) {
                    return 1
                } else {
                    return -1
                }
            });
        }

        return records
    }
);

export const messageModalSelector = () => createSelector(
  applicationSelector, (applicationData) => (
    applicationData.get("messageModal")
  ),
);
