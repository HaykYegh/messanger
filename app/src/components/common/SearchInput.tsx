"use strict";

import components from "configs/localization";
import "scss/pages/left-panel/SearchInput";
import * as React from "react";
import {phoneMask} from "helpers/UIHelper";

interface ISearchInputProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    name?: string;
    clearButton?: boolean;

    iconClassName: string;
    iconOnClick?: () => void;
    handleSearchClear?: () => void;

    newId?: boolean;
    searchId?: string;
    searchValue?:string;
}

export default function SearchInput({name = "", placeholder = "", onChange, iconClassName, iconOnClick, clearButton, handleSearchClear, newId, searchId, searchValue}: ISearchInputProps): JSX.Element {
    const localization: any = components().searchInput;

    return (
        <div className="search-container">
            <div className="content">
                <span className="search-input">
                    <input
                        id={newId ? searchId : "searchInput"}
                        type="text"
                        placeholder={placeholder || localization.placeholder}
                        name={name}
                        onChange={onChange}
                        value={searchValue ? phoneMask(searchValue) : searchValue}
                        // value={searchValue}
                        autoComplete="off"
                    />
                    {clearButton && <button className="clear-text" onClick={handleSearchClear}/>}
                </span>
                <span className={iconClassName} onClick={iconOnClick}/>
            </div>
        </div>
    );
};
