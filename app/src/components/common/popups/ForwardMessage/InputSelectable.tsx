"use strict";

import * as React from "react";
import Select from 'react-select';
import isEqual from "lodash/isEqual";

import localizationComponents from "configs/localization";
import isEmpty from "lodash/isEmpty"
import {phoneMask} from "helpers/UIHelper";

const components = {
    DropdownIndicator: null
};


const createOption = (thread) => {
    let label: string = "";

    if (thread.firstName || thread.lastName) {
        label = `${thread.firstName} ${thread.lastName}`.trim();
    } else if (thread.email) {
        label = thread.email;
    } else if (thread.username) {
        label = `+${thread.username}`;
    } else {
        label = thread.name;
    }

    return {
        label: label,
        value: thread.username || thread.name,
    }
};

interface IInputSelectableProps {
    contactsUpdate: (contacts: any) => void;
    selectedContactDelete: (username?: string) => void;
    contactsListLoaderUpdate: (loading: boolean) => void;
    selectedThreads: { [key: string]: any },
    selectedContactsCount: number,
    isLoading: boolean,
    offset: number,
    limit: number,
}

interface IInputSelectableState {
    inputValue: string,
    menuIsOpen: boolean,
}

export default class InputSelectable extends React.Component<IInputSelectableProps, IInputSelectableState> {
    get ref(): any {
        return this._ref;
    }

    set ref(value: any) {
        this._ref = value;
    }

    private _ref: any;

    constructor(props) {
        super(props);
        this.state = {
            inputValue: "",
            menuIsOpen: false
        };
    }

    handleInputChange = (inputValue, {action}) => {
        switch (action) {
            case 'input-change':
                const regexp = /[^+0-9a-z.@_\-]/gi;
                inputValue = inputValue.replace(regexp, "");
                this.setState({inputValue});
                return;
            case 'menu-close':
                let menuIsOpen = undefined;
                if (this.state.inputValue) {
                    menuIsOpen = true;
                }
                this.setState({
                    menuIsOpen
                });
                return;
            default:
                return;
        }
    };

    handleChange = (inputValue, {action, removedValue}) => {

        const {selectedContactDelete} = this.props;
        if (action === 'remove-value') {
            this.ref.select.focus();
            selectedContactDelete(removedValue.value);
        }
    };


    handleKeyDown = (event) => {
        const {inputValue} = this.state;
        const {selectedContactDelete, selectedThreads} = this.props;
        if (event.key === "Backspace" && inputValue === "" && !isEmpty(selectedThreads)) {
            this.ref.select.focus();
            selectedContactDelete();
        }
    };

    handleInputFocus = () => {
        this.ref.select.focus();
    };


    componentDidMount(): void {
        this.ref.cropWithEllipsis = false;
    }

    componentDidUpdate(prevProps: Readonly<IInputSelectableProps>, prevState: Readonly<IInputSelectableState>, snapshot?: any): void {
        const {inputValue} = this.state;
        const {contactsUpdate, selectedThreads, selectedContactsCount} = this.props;
        if (prevState.inputValue !== inputValue) {
            contactsUpdate(inputValue);
        }
        const selectRef: any = this.ref.select;

        if (!isEqual(prevProps.selectedThreads, selectedThreads)) {

            if (selectedContactsCount > prevProps.selectedContactsCount) {
                const controlRef = selectRef.controlRef;
                controlRef.scrollTop = controlRef.scrollHeight;
            }

            if (inputValue !== '') {
                this.setState({
                    inputValue: ""
                })
            }

        }
        selectRef.focus();
    }

    shouldComponentUpdate(nextProps: Readonly<IInputSelectableProps>, nextState: Readonly<IInputSelectableState>, nextContext: any): boolean {
        const {selectedThreads, offset, limit, isLoading} = this.props;
        const {inputValue} = this.state;

        if (!isEqual(nextProps.selectedThreads, selectedThreads)) {
            return true
        }

        if (!isEqual(nextProps.offset, offset)) {
            return true
        }

        if (!isEqual(nextProps.limit, limit)) {
            return true
        }

        if (!isEqual(nextProps.isLoading, isLoading)) {
            return true
        }


        if (!isEqual(nextState.inputValue, inputValue)) {
            return true
        }

        return false;
    }

    get colourSearchStyles() {
        return {
            control: (styles, {...args}) => {
                const {isDisabled, isFocused} = args;

                return {
                    ...styles,

                    "backgroundColor": (() => {
                        if (isDisabled) {
                            return "#FFF";
                        } else if (isFocused) {
                            return "#FFF";
                        }
                        return "#FFF";

                    })(),
                    "color": (() => {
                        if (isDisabled) {
                            return "#ccc";
                        } else if (isFocused) {
                            return "#070707";
                        }
                    })(),
                    "borderColor": (() => {
                        if (isDisabled) {
                            return "#FFF";
                        } else if (isFocused) {
                            return "#070707";
                        }
                        return "#FFF";

                    })(),
                    "cursor": isDisabled ? "not-allowed" : "text",
                    "&:hover": {borderColor: "#ccc"},
                    "align-items": "self-start",
                    "boxShadow": "none",
                    "height": "auto",
                    "width": "400px",
                    "border": "1px solid #D8DBE1",
                    "border-radius": "6px",
                    "overflow": "auto",
                    "max-height": "113px",
                    "scroll-behavior": "smooth"
                };
            },
            placeholder: (styles, state) => ({
                ...styles,
                border: "none",
                color: "#8C8A98",
                fontSize: "13px",
                fontWeight: "400",
                textAlign: "left",
                marginLeft: "27px"
            }),
            input: (styles, state) => ({
                ...styles,
                border: "none",
                fontSize: "13px",
                paddingLeft: this.props.selectedContactsCount ? "0px" : "24px",
                '&:after': {
                    position: "absolute",
                    content: '"\\e93d"',
                    color: "#8492ab",
                    fontSize: "20px",
                    left: "9px",
                    top: "10px",
                    visibility: this.props.selectedContactsCount ? "hidden" : "visible"
                },
            }),
            multiValue: (styles, {...args}) => {
                return {
                    ...styles,
                    border: "none",
                    background: "#17ABF6",
                    color: "#fff",
                    borderRadius: "5px",
                    opacity: "0",
                    animation: "multiValueOpen 200ms",
                    animationFillMode: "forwards",
                }
            },
            multiValueRemove: (styles, {isFocused}) => ({
                ...styles,
                cursor: "pointer",
                '&:hover': {
                    backgroundColor: "#ffffff45",
                    color: "#fff"
                },
                backgroundColor: isFocused ? "#ffffff45" : "",
                paddingTop: "1px"
            }),
            multiValueLabel: (styles, {isFocused}) => ({
                ...styles,
                color: "#fff",
                backgroundColor: isFocused ? "#ffffff45" : "",
                padding: "3px 6px 5px 0"
            }),
            valueContainer: (styles) => ({
                ...styles,
                padding: "5px 7px",
                maxWidth: "370px"
            }),
            loadingIndicator: (styles) => ({
                ...styles,
                marginRight: 0,
                paddingLeft: 0
            })
        }
    };


    render() {
        const localization: any = localizationComponents().searchInput;
        const {selectedThreads, isLoading} = this.props;
        const {inputValue} = this.state;
        const selectedContactOptions = Object.keys(selectedThreads).map(username => {
            return createOption(selectedThreads[username])
        });
        return (
            <div className={"inputSelectable"} onClick={this.handleInputFocus}>
                <Select
                    ref={(ref) => this.ref = ref}
                    isMulti={true}
                    isClearable={false}
                    isSearchable={true}
                    isLoading={isLoading}
                    autoFocus={true}
                    placeholder={localization.placeholder}
                    components={components}
                    styles={this.colourSearchStyles}
                    inputValue={inputValue ? phoneMask(inputValue) : inputValue}
                    onInputChange={this.handleInputChange}
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    value={selectedContactOptions}
                    menuIsOpen={false}
                />

            </div>
        );
    }
};
