"use strict";

import * as React from "react";
import Select from 'react-select';
import isEqual from "lodash/isEqual";

import {IContact} from "modules/contacts/ContactsReducer";
import localizationComponents from "configs/localization";
import isEmpty from "lodash/isEmpty"
import {AUTOFOCUS_TYPES} from "configs/constants";
import {phoneMask} from "helpers/UIHelper";

const components = {
    DropdownIndicator: null
};

const createOption = (contact: IContact) => {
    let label: any = "";

    if (contact.firstName || contact.lastName) {
        label = `${contact.firstName} ${contact.lastName}`.trim();
    } else if (contact.email) {
        label = contact.email;
    } else {
        label = `+${contact.username}`;
    }

    return {
        label: label,
        value: contact.username,
    }
};

interface IInputSelectableProps {
    contactsUpdate: (contacts: any) => void;
    selectedContactDelete: (username?: string) => void;
    contactsListLoaderUpdate: (loading: boolean) => void;
    selectedContacts: { [key: string]: IContact },
    selectedContactsCount: number,
    isLoading: boolean,
    offset: number,
    limit: number,
    autoFocus?: string,
    inputValue?: string
}

interface IInputSelectableState {
    inputValue: string,
    menuIsOpen: boolean,
}

export default class InputSelectable extends React.Component<IInputSelectableProps, IInputSelectableState> {

    inputSelectableRef: any = React.createRef();

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

    componentDidMount(): void {
        this.inputSelectableRef.current.cropWithEllipsis = false;
    }

    shouldComponentUpdate(nextProps: Readonly<IInputSelectableProps>, nextState: Readonly<IInputSelectableState>, nextContext: any): boolean {
        const {selectedContacts, offset, limit, isLoading} = this.props;
        const {inputValue} = this.state;

        if (!isEqual(nextProps.selectedContacts, selectedContacts)) {
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

        return !isEqual(nextState.inputValue, inputValue);
    }

    componentDidUpdate(prevProps: Readonly<IInputSelectableProps>, prevState: Readonly<IInputSelectableState>, snapshot?: any): void {
        const {inputValue} = this.state;
        const {contactsUpdate, selectedContacts, selectedContactsCount} = this.props;
        if (prevState.inputValue !== inputValue) {
            contactsUpdate(inputValue);
        }
        const selectRef: any = this.inputSelectableRef.current.select;

        if (!isEqual(prevProps.selectedContacts, selectedContacts)) {

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

    handleChange = (inputValue, {action, removedValue}) => {
        const {selectedContactDelete} = this.props;
        if (action === 'remove-value') {
            this.inputSelectableRef.current.select.focus();
            selectedContactDelete(removedValue.value);
        }
    };

    handleKeyDown = (event) => {
        const {inputValue} = this.state;
        const {selectedContactDelete, selectedContacts} = this.props;
        if (event.key === "Backspace" && inputValue === "" && !isEmpty(selectedContacts)) {
            this.inputSelectableRef.current.select.focus();
            selectedContactDelete();
        }
    };

    handleInputFocus = () => {
        this.inputSelectableRef.current.select.focus();
    };

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
            placeholder: (styles) => ({
                ...styles,
                border: "none",
                color: "#8C8A98",
                fontSize: "13px",
                fontWeight: "400",
                textAlign: "left",
                marginLeft: "27px",
            }),
            input: (styles) => ({
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
            multiValue: (styles) => ({
                    ...styles,
                    border: "none",
                    background: "#17ABF6",
                    color: "#fff",
                    borderRadius: "5px",
                    opacity: "0",
                    animation: "multiValueOpen 200ms",
                    animationFillMode: "forwards",
                }
            ),
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
        const localization: any = localizationComponents().createGroupPopup;
        const {selectedContacts, isLoading, autoFocus} = this.props;
        const {inputValue} = this.state;
        const selectedContactOptions = Object.keys(selectedContacts).map(username => {
            return createOption(selectedContacts[username])
        });
        return (
            <div className="input-selectable" onClick={this.handleInputFocus}>
                <Select
                    ref={this.inputSelectableRef}
                    isMulti
                    isClearable={false}
                    isSearchable
                    isLoading={isLoading}
                    autoFocus={autoFocus === AUTOFOCUS_TYPES.true ? true : false}
                    placeholder={localization.groupSearch}
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
