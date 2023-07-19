"use strict";

import * as React from "react";
import {Scrollbars} from 'react-custom-scrollbars';
import { Picker } from 'emoji-mart'

import {EMOJI_HANDLERS} from "configs/constants";
import Log from "modules/messages/Log";

interface ISmilesProps {
    emojiClick: (emojiClass: string, emojiName?: string) => void;
    display?: string,
    showSmilesContent?: boolean
}

export default function Smiles({emojiClick, display, showSmilesContent}: ISmilesProps): JSX.Element {

    return (
        <div style={{
            display
        }}>
            {showSmilesContent && <Picker
                onSelect={(emoji) => emojiClick(emoji)}
                set="apple"
                autoFocus={false}
                emojiSize={26}
                color="#3f83c7"
                i18n={{
                    categories: {
                        search: 'Search Results',
                        recent: 'Frequently Used',
                        smileys: 'Smileys & Emotion',
                        people: 'People & Body',
                        nature: 'Animals & Nature',
                        foods: 'Food & Drink',
                        activity: 'Activity',
                        places: 'Travel & Places',
                        objects: 'Objects',
                        symbols: 'Symbols',
                        flags: 'Flags',
                        custom: 'Custom',
                    },
                }}
            />}
        </div>
        // <Scrollbars style={{height: "226px"}} autoHide autoHideTimeout={2000} autoHideDuration={1000}>
        //     <ul className="smile-list">
        //         {EMOJI_HANDLERS.emojiContainer.map((emoji, index) => {
        //             const sendEmoji: any = () => emojiClick(emoji.emojiClass, emoji.emojiName);
        //
        //             return (
        //                 <li key={index} className="list-item">
        //                     <a onClick={sendEmoji} className={emoji.emojiClass}/>
        //                 </li>
        //             );
        //         })}
        //     </ul>
        // </Scrollbars>
    );
};
