"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import {AvatarImage, AvatarName, AvatarNoImage} from "components/contacts/style";
import {IMAGE_TOGGLE} from "configs/constants";
import jalaLogo from "assets/images/Jala/jala_logo.png";
import storeCreator from "helpers/StoreHelper";
import selector from "services/selector";
import {Store} from "react-redux";
interface IAvatarProps {
    image?: {
        url: string,
        file: Blob,
        loadFromWeb?: boolean,
    };
    color: string;
    status?: string;
    avatarCharacter: string;
    name: string;
    contactId?:string;
    meta?: any;
    userAvatar?: boolean;
    handleMediaPopUpOpen?: (type: typeof IMAGE_TOGGLE, id?: string, url?: string, creatorId?: string, sharedMediaPopUp?: boolean, isAvatarClick?: boolean) => void;
    isGroup?: boolean;
    fontSize?: string;
    iconSize?: string;
    border?: string;
    active?: boolean;
    avatarBlobUrl?: string;
    backgroundColor?: string;
}

interface IAvatarState {
    photo: Blob,
    opacity: string
}

export default class Avatar extends React.Component<IAvatarProps, IAvatarState> {

    get imageUrl(): string {
        return this._imageUrl;
    }

    set imageUrl(value: string) {
        this._imageUrl = value;
    }

    private _imageUrl: string;

    constructor(props: any) {
        super(props);
        this.state = {
            photo: null,
            opacity: "0"
        }
    }

    componentDidMount(): void {

        // const {image}: IAvatarProps = this.props;
        //
        // (async () => {
        //     await this.getImage(image)
        // })();
    }

    shouldComponentUpdate(nextProps: IAvatarProps, nextState: IAvatarState): boolean {
        const {name, avatarCharacter, image} = this.props;

        if (!isEqual(image, nextProps.image)) {
            return true;
        }

        if (name !== nextProps.name) {
            return true;
        }

        if (avatarCharacter !== nextProps.avatarCharacter) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: Readonly<IAvatarProps>, prevState: Readonly<IAvatarState>, snapshot?: any): void {
        // if (!isEqual(prevProps.image, this.props.image)) {
        //     (async () => {
        //         await this.getImage(this.props.image)
        //     })();
        // }
    }

    handleImageClick = (event): void => {
        const {handleMediaPopUpOpen, image} = this.props;

        if (image && typeof handleMediaPopUpOpen === "function") {
            event.stopPropagation();
            event.preventDefault();
            handleMediaPopUpOpen(IMAGE_TOGGLE, null, null, null, null, true);
        }
    };

    handleImageLoaded = () => {
        this.setState({opacity: '1'});
    }


    getImage = async (image: {
        url: string,
        file: Blob
    }) => {
        let file: File | Blob = null;
        if (!image.file) {
            // if (image.url !== '') {
            //     try {
            //         const fetching: any = await fetch(image.url);
            //         const blob = await fetching.blob();
            //         if (blob && blob.type !== "application/xml") {
            //             file = blob;
            //         }
            //     } catch (e) {
            //         console.log("CANT'T RETRIEVE IMAGE");
            //     }
            // }

        } else {
            file = image.file;
        }

        if (file && file.size !== 0) {
            this.imageUrl = (window as any).URL.createObjectURL(file);
            // setTimeout(() => {
            //     this.setState({opacity: '1'});
            // }, 250)
            this.setState({photo: file, opacity: '0'});
        } else {
            (window as any).URL.revokeObjectURL(this.imageUrl);
            this.imageUrl = "";
            this.setState({photo: null});
        }
    };

    render(): JSX.Element {
        const {color, avatarCharacter, name, userAvatar, isGroup, fontSize, iconSize, border, contactId, active, avatarBlobUrl, backgroundColor} = this.props;
        const avatarStyle: any = {
            color,
        };
        const store: Store<any> = storeCreator.getStore();

        const {app: {applicationState: selectedAvatarUrl}} = selector(store.getState(), {
            selectedAvatarUrl: true
        });

        return (
          avatarBlobUrl ?
                <AvatarImage
                  onLoad={this.handleImageLoaded}
                  // style={{
                  //     opacity: this.state.opacity
                  // }}
                  onClick={(event) => this.handleImageClick(event)} src={avatarBlobUrl} className="" alt=""
                             border={border}/> :
                (contactId === "000000002@msg.hawkstream.com" || contactId === "111@msg.hawkstream.com") && !this.imageUrl ?
                <AvatarImage onClick={(event) => this.handleImageClick(event)} src={jalaLogo} className="" alt=""
                             border={border}/> :
                name && avatarCharacter && !userAvatar ?
                    <AvatarName backgroundColor={backgroundColor} fontSize={fontSize} className="" style={avatarStyle} data-line={avatarCharacter}>
                        <span>{avatarCharacter}</span>
                    </AvatarName>
                    :
                    <AvatarNoImage backgroundColor={backgroundColor} fontSize={iconSize} isGroup={isGroup} content={isGroup ? "'\\E949'" : "'\\E959'"}/>
        );
    }
}
