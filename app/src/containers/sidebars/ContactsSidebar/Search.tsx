"use strict";

import * as React from "react";

import "scss/pages/left-panel/SearchInput";
import components from "configs/localization";
import {phoneMask} from "helpers/UIHelper";

interface ISearchProps {
    handleInputChange: (q: string) => void;
    handleClearButtonClick: (e: any) => void;
    value: string;
}

interface ISearchState {
    q: string
}

export default class Search extends React.Component<ISearchProps, ISearchState> {

    render(): JSX.Element {
        const localization: any = components().searchInput;
        return (
            <div className='search-container'>
                <div className="content">
                    <div className='search-input'>
                        <input
                            value={this.props.value ? phoneMask(this.props.value) : this.props.value}
                            // value={this.props.value}
                            autoComplete="off"
                            placeholder={localization.placeholder}
                            onChange={(event) => this.props.handleInputChange(event.target.value)}
                            name="search"
                        />
                        {
                            this.props.value !== '' &&
                            <button onClick={(event) => this.props.handleClearButtonClick(event)} className='clear-text'/>
                        }
                    </div>
                </div>
            </div>
        )
    }
}
