"use strict";

import * as React from "react";
import {List, Map} from "immutable";
import isEqual from "lodash/isEqual";

import StickerSubPage from "components/settings/StickerSubPage";
import {LEFT_PANELS, SHARED_MEDIA_TABS, STICKERS_TABS} from "configs/constants";
import BlobImage from "components/common/BlobImage";
import components from "configs/localization";
import {getBlobUri} from "helpers/FileHelper";
import StickerRow from "./StickerRow";

import "scss/pages/left-panel/settings/StickerStore";
import {BackgroundSlider, NavBar, NavBarTabs, Tab} from "containers/SharedMedia/style";
import Log from "modules/messages/Log";

interface IStickerPassedProps {
    handleChangePanel: (page: string, id?: string) => void;
    handleStickerStoreTabClick: (tab: string) => void;
    attemptAddStickerPreviewIcon: (id: string) => void;
    attemptAddStickerPreviewImage: (id: string) => void;
    attemptSetStickersIcons: (id: string, callback: any) => void;
    attemptAddSticker: (id: string) => void;
    attemptCheckNewStickers: () => void;
    stickers: Map<string, any>;
    myStickers: List<string>;

    handleStickerRemove: (id: string) => void;
    handleMenuOpen: (menuId: string, event?: any) => void;
    handleStickerHide: (id: string) => void;
    handleStickerShow: (id: string) => void;
    handleMenuClose: () => void
    menuId: string;
    stickerStoreTab: string;
    showContextMenuTop: boolean;
}

interface IStickerStoreState {
    featured: boolean;
    selectedTab: string;
    isStickerSubPageShown: boolean;
    selectedStickerID: any;
    tabs: string[];
}

export default class StickerStore extends React.Component<IStickerPassedProps, IStickerStoreState> {

    constructor(props: any) {
        super(props);

        this.state = {
            featured: false,
            tabs: [
                "all",
                "trending",
                "myStickers",
            ],
            selectedTab: this.props.stickerStoreTab || STICKERS_TABS.all,
            isStickerSubPageShown: false,
            selectedStickerID: null
        };

    }

    componentDidMount(): void {
        const {attemptCheckNewStickers} = this.props;
        attemptCheckNewStickers();
    }

    shouldComponentUpdate(nextProps: IStickerPassedProps, nextState: IStickerStoreState): boolean {
        const {stickers, myStickers, menuId} = this.props;

        if (stickers && !stickers.equals(nextProps.stickers)) {
            return true;
        }

        if (myStickers && !myStickers.equals(nextProps.myStickers)) {
            return true;
        }

        if (menuId !== nextProps.menuId) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    handleTabChange = ({currentTarget: {dataset}}: React.MouseEvent<HTMLDivElement>): void => {
        const {handleStickerStoreTabClick} = this.props;
        const tab = dataset.file;
        if (tab !== this.state.selectedTab) {
            this.setState({selectedTab: tab});
            handleStickerStoreTabClick(tab);
        }
    };

    showStickerInfo = (stickerId?: any): void => {
        this.setState({isStickerSubPageShown: !this.state.isStickerSubPageShown, selectedStickerID: stickerId});
    };

    handleStickerAdd = (): void => {
        const {attemptAddSticker, myStickers, attemptSetStickersIcons} = this.props;
        attemptSetStickersIcons(
            this.state.selectedStickerID,
            !myStickers.includes(this.state.selectedStickerID) ? () => attemptAddSticker(this.state.selectedStickerID): null
        );
    };

    render() {
        const showMyStikcers: any = () => handleChangePanel(LEFT_PANELS.my_stickers);
        const localization: any = components().stickerStore;
        const {handleChangePanel, stickers, myStickers, handleStickerHide, handleStickerRemove, handleStickerShow, menuId, handleMenuOpen, showContextMenuTop, handleMenuClose, attemptAddStickerPreviewIcon, attemptAddStickerPreviewImage} = this.props;
        const {featured, selectedTab, isStickerSubPageShown, selectedStickerID, tabs} = this.state;
        const localizationMyStickers: any = components().myStickers;

        return (
            isStickerSubPageShown ?
                <StickerSubPage
                    available={myStickers.includes(selectedStickerID)}
                    attemptAddStickerPreviewImage={attemptAddStickerPreviewImage}
                    sticker={stickers.get(selectedStickerID)}
                    handleStickerAdd={this.handleStickerAdd}
                    goBack={this.showStickerInfo}/> :
                <div className="stickers-store">
                    <NavBar>
                        <NavBarTabs>
                            {
                                tabs.map((tab) => {
                                    return (
                                        <Tab
                                            key={tab}
                                            onClick={this.handleTabChange}
                                            data-file={STICKERS_TABS[tab]}
                                        >
                                            {localization[tab]}
                                        </Tab>
                                    )
                                })
                            }
                            <BackgroundSlider
                                tabLength={tabs.length}
                                tabIndex={
                                    selectedTab === STICKERS_TABS.all ? 0 :
                                        selectedTab === STICKERS_TABS.trending ? 1 : 2
                                }
                            />
                        </NavBarTabs>
                    </NavBar>
                    <div className="stickers-store-content scroll-bar" onScroll={handleMenuClose}>
                        {
                            (selectedTab === STICKERS_TABS.all || selectedTab === STICKERS_TABS.trending) && stickers.valueSeq().map(sticker => {
                                // const showStickerInfo: any = () => handleChangePanel(LEFT_PANELS.sticker, sticker.get("id"));
                                const stickerId: any = sticker.get("id");
                                return sticker.get("defaultPackage") ? null : ((selectedTab === STICKERS_TABS.all) || (selectedTab === STICKERS_TABS.trending && sticker.get("featured"))) && (
                                    <StickerRow key={stickerId}
                                                showStickerInfo={() => {
                                                    this.showStickerInfo(stickerId)
                                                }}
                                                myStickers={myStickers}
                                                sticker={sticker}
                                                attemptAddStickerPreviewIcon={attemptAddStickerPreviewIcon}/>
                                );
                            })
                        }
                        {
                            selectedTab === STICKERS_TABS.myStickers &&
                            stickers.valueSeq().map(sticker => {

                                const showStickerInfo: any = () => {
                                    if (!sticker.get("defaultPackage")) {
                                        handleChangePanel(LEFT_PANELS.sticker, sticker.get("id"));
                                    }
                                    return;
                                };
                                const openActionMenu: any = (event) => handleMenuOpen(sticker.get("id"), event);
                                const setStickerVisible: any = () => handleStickerShow(sticker.get("id"));
                                const setStickerHidden: any = () => handleStickerHide(sticker.get("id"));
                                const removeMySticker: any = () => handleStickerRemove(sticker.get("id"));

                                const stickerMenu = (menuId === sticker.get("id") ? {
                                    display: "block",
                                    bottom: "auto",
                                    top: "35px"
                                } : {});
                                if (showContextMenuTop) {
                                    stickerMenu.bottom = "45px";
                                    stickerMenu.top = "auto";
                                }
                                const stickerBlob: any = sticker && sticker.get("icon");
                                const stickerImage: any = getBlobUri(stickerBlob);
                                const stickerUrl: any = sticker.get("defaultPackage") ? stickerBlob : stickerImage;
                                const brokenImage: boolean = stickerBlob && stickerBlob.type == "application/xml";

                                const stickerId: any = sticker.get("id");

                                return !myStickers.includes(sticker.get("id")) ? null : (
                                    <div className="sticker my-sticker" key={sticker.get("id")}>
                                        <div className="sticker_info" onClick={() => {
                                            this.showStickerInfo(stickerId)
                                        }}>
                                            {
                                                brokenImage ? <span className="broken-sticker-icon"/> :
                                                    <BlobImage image={stickerUrl} width={52} height={52}/>
                                            }
                                            <div>
                                                <span className="sticker-name">{sticker.get("name")}</span>
                                                {/*<span className="sticker-count">12 Animated Stickers</span>*/}
                                            </div>
                                            <button className="sticker-store-menu" onClick={openActionMenu}/>
                                        </div>
                                        <div className="my-sticker-menu" style={stickerMenu}>
                                            {sticker.get("hidden") ?
                                                <div className="contextMenu--option"
                                                     onClick={setStickerVisible}>{localizationMyStickers.show}</div> :
                                                <div className="contextMenu--option"
                                                     onClick={setStickerHidden}>{localizationMyStickers.hide}</div>}
                                            {!sticker.get("defaultPackage") && <div className="contextMenu--option"
                                                                                    onClick={removeMySticker}>{localizationMyStickers.deleteSticker}</div>}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
        );
    }
};
