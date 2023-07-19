import * as React from "react";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import AvatarCropper from "components/common/AvatarCropper";
import components from "configs/localization";

interface IEnterGroupDetailsProps {
    groupAvatarUpdate: ({file, cropped}: { file: Blob | File, cropped: Blob | File }) => void,
    groupNameUpdate: (name: string) => void,
}

interface IEnterGroupDetailsState {
    name: string,
    file: File | Blob,
    croppedFile: File | Blob,
    isCropStarted: boolean,
    isNameEmpty: boolean,
}

export default class EnterGroupDetails extends React.Component<IEnterGroupDetailsProps, IEnterGroupDetailsState> {
    get input(): string {
        return this._input;
    }

    set input(value: string) {
        this._input = value;
    }

    get imageUrl(): string {
        return this._imageUrl;
    }

    set imageUrl(value: string) {
        this._imageUrl = value;
    }

    get ref(): any {
        return this._ref;
    }

    set ref(value: any) {
        this._ref = value;
    }

    private _ref: any;

    private _imageUrl: string;

    private _input: string;

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            file: null,
            croppedFile: null,
            isCropStarted: false,
            isNameEmpty: false
        };
    }

    shouldComponentUpdate(nextProps: Readonly<IEnterGroupDetailsProps>, nextState: Readonly<IEnterGroupDetailsState>, nextContext: any): boolean {
        return true;
    }

    handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {groupNameUpdate} = this.props;
        let value: string = e.currentTarget.value;
        if (value.startsWith(' ')) {
            value = value.trimLeft()
        }
        this.setState({
            isNameEmpty: false,
            name: value
        });

        groupNameUpdate(value);
    };

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            this.setState({file: e.target.files[0], isCropStarted: true})
        }
        e.currentTarget.value = "";
    };

    handleCroppedImageUpdate = (croppedFile: any) => {

        const {groupAvatarUpdate} = this.props;

        (window as any).URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = (window as any).URL.createObjectURL(croppedFile.avatar);

        this.setState({
            croppedFile: croppedFile.avatar,
            isCropStarted: false,
        }, () => {
            groupAvatarUpdate({cropped: croppedFile.avatar, file: this.state.file});
        })
    };

    handleCropPopupDismiss = () => {
        this.setState({
            isCropStarted: false,
        })
    };

    render() {
        const localization: any = components().createGroupPopup;
        const {name, file, isCropStarted, croppedFile, isNameEmpty} = this.state;


        return (
            <div className={"enter-group-details"}>

                <div className={`choose-avatar${croppedFile ? " selected-avatar" : ""}`}>
                    <input className="profile-pic-upload"
                           type={"file"}
                           accept="image/gif,image/jpeg,image/jpg,image/png"
                           onChange={this.handleFileChange}/>
                </div>


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
                    {isCropStarted && <AvatarCropper cropPopupDismiss={this.handleCropPopupDismiss}
                                                     croppedImageUpdate={this.handleCroppedImageUpdate}
                                                     file={file}/>}
                </ReactCSSTransitionGroup>


                {this.imageUrl && <img className="avatar-image" src={this.imageUrl} alt={""}/>}


                <div className={`enter-group-name${isNameEmpty ? ' invalid-name' : ''}`}>
                    <input autoFocus={true} value={name} type={"text"}
                           onChange={this.handleNameChange}
                           placeholder={`${localization.groupName}`}
                           maxLength={50}
                    />
                </div>


            </div>
        );
    }
};
