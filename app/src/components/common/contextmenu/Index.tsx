"use strict";

import * as React from "react";

import components from "configs/localization";
import "scss/pages/Header";
import {ButtonItem, ListItem, ContextMenuPopUp, PopUpList} from "components/common/contextmenu/style";
import {TooltipButton} from "components/messages/style";

interface IContextMenuState {
}

interface IContextMenuProps {
    menuPopup: boolean;
    fileBubble?: boolean;
    handleMessageDelete?: () => void;
    handleShowInFolder: (event: React.MouseEvent<HTMLElement>, showInFolder?: boolean) => void;
    download?: () => void;
    handelMenuPopUpClose?: () => void;
    clientX: any,
    clientY: any
}

export default class ContextMenu extends React.Component<IContextMenuProps, IContextMenuState> {

    menuPopupContainer: any = React.createRef();

    constructor(props: any) {
        super(props);
        this.state = {}
    }

    componentDidMount(): void {
        const {clientX, clientY} = this.props;
        document.addEventListener("click", this.handleOutSideClick);
        const rootH: number = this.menuPopupContainer.current.offsetHeight;
        const rootW: number = this.menuPopupContainer.current.offsetWidth;
        const screenH: number = window.innerHeight - 160;
        const screenW: number = window.innerWidth;
        const clickX: number = clientX ;
        const clickY: number = clientY ;

        const right: boolean = (screenW - clickX) > rootW;
        const top: boolean = (screenH - clickY) > rootH;
        const bottom: boolean = !top;
        const left: boolean = !right;

        if (right) {
            this.menuPopupContainer.current.style.right = `${0}px`;
        }

        if (left) {
            this.menuPopupContainer.current.style.right = `${0}px`;
        }

        if (top) {
            this.menuPopupContainer.current.style.top = `${rootH/2 + 13}px`;
        }

        if (bottom) {
            this.menuPopupContainer.current.style.top = `-${rootH/2 + 28}px`;
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("click", this.handleOutSideClick);
    }

    // handleOutSideClick = (event: any) => {
    //     const {handelMenuPopUpClose, menuPopup} = this.props;
    //
    //     if (!menuPopup && this.menuPopupContainer && this.menuPopupContainer.current && !this.menuPopupContainer.current.contains(event.target)) {
    //         handelMenuPopUpClose();
    //     }
    // };




handleOutSideClick = (event: any) => {
    const {menuPopup, handelMenuPopUpClose} = this.props;
    handelMenuPopUpClose();

    // if (menuPopup && this.menuPopupContainer.current && !this.menuPopupContainer.current.contains(event.target)) {
    // }
};


    render(): JSX.Element {
        const {menuPopup,fileBubble, handleMessageDelete, handleShowInFolder, download} = this.props;
        const localization: any = components().tooltip;

        return (
            <ContextMenuPopUp fileBubble={fileBubble} menuPopup={menuPopup} ref={this.menuPopupContainer}>
                <PopUpList>
                    {
                        download &&
                        <ListItem onClick={download}>
                            <ButtonItem>{localization.download}</ButtonItem>
                        </ListItem>
                    }

                    {
                        handleShowInFolder &&
                        <ListItem onClick={(event) => handleShowInFolder(event, true)}>
                            <ButtonItem
                                data-buttonType="moreee"
                            >{localization.showInFinder}</ButtonItem>
                        </ListItem>
                    }

                    {
                        handleMessageDelete &&
                        <ListItem onClick={handleMessageDelete}>
                            <ButtonItem>{localization.deleteMessage}</ButtonItem>
                        </ListItem>
                    }

                </PopUpList>
            </ContextMenuPopUp>
        )
    }
}
