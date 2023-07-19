"use strict";

import * as React from "react";

import {stringReplace} from "helpers/MessageHelper";
import {EMOJI_HANDLERS} from "configs/constants";
import {Smile} from "containers/chat-panel/Reply/style";
import Log from "modules/messages/Log";

const emojiStyles: any = {
    verticalAlign: "middle",
    boxSizing: "border-box",
    width: "24px",
    height: "29px",
    color: "transparent",
    fontSize: "29px",
    paddingTop: "280px",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "243px 289px",
    position: "relative",
    animationName: "change-opacity",
    letterSpacing: ".015em",
    lineHeight: "1"
};

const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/;

export function emojify(message: string, leftPanel: boolean = false): any {
    const regexp: RegExp = /([';|)']?[:;|$BO][\']?[\(\)\|$DXOSP]|\([^\(\)]+\)|<.)/g;
    let match: RegExpExecArray;
    let emojifiedMessage: any = message;
    let j: number = 0;
    const changeEmojies = [];

    while (match = regexp.exec(message)) {
        const rawEmoji: string = match[1];
        const emojiClass: string = EMOJI_HANDLERS.emojiMap.get(rawEmoji);
        if (changeEmojies.indexOf(rawEmoji) > -1) {
            continue;
        }
        if (emojiClass) {
            emojifiedMessage = stringReplace(emojifiedMessage, rawEmoji, (matched, i) => (
                leftPanel ?
                    <span key={`${i}-${emojiClass}-${j++}`} className={emojiClass}
                          style={emojiStyles}>&#9632;</span> :
                    `<img draggable="false" class="${emojiClass}" src="./assets/images/empty.png" alt="${rawEmoji}" />`
            ));
        }
        j++;
        changeEmojies.push(rawEmoji);
    }

    emojifiedMessage = Array.isArray(emojifiedMessage) ? emojifiedMessage.filter(part => !!part) : emojifiedMessage;

    return emojifiedMessage;
}

export const setEmoji: any = (textArea, caretNode, emoji) => {
    if (textArea === caretNode.node) {
        if (caretNode.position > textArea.childNodes.length) {
            textArea.appendChild(emoji);
        } else {
            textArea.insertBefore(emoji, textArea.childNodes[caretNode.position]);
        }
    } else {
        const text: any = caretNode.node;
        const at: number = caretNode.position;
        textArea.insertBefore(emoji, text.splitText(at));
    }
};

export const demojify: any = element => {
    const children: any = element.childNodes;
    let str: string = "";

    for (const child of children) {
        Log.i(child, "child1234")
        if (child.nodeType === 3) {
            str += child.textContent;
        } else {
            str += child.innerHTML
            // str += EMOJI_HANDLERS.demojiMap.get(child.className);
        }
    }

    return str;
};

export const toUTF16 = codePoint => {
    const TEN_BITS = parseInt('1111111111', 2);
    const u = codeUnit => '\\u' + codeUnit.toString(16).toUpperCase();

    if (codePoint <= 0xFFFF) {
        return u(codePoint);
    }
    codePoint -= 0x10000;

    const leadSurrogate = 0xD800 + (codePoint >> 10);

    const tailSurrogate = 0xDC00 + (codePoint & TEN_BITS);

    return u(leadSurrogate) + u(tailSurrogate);
};

export const includesEmoji = str => emojiRegex.test(str);

export const sanitizeEmoji = str => {
    const match = str.match(emojiRegex);
    if (match) {
        str = str.replace(match[0], toUTF16(str.codePointAt(match.Index)));
        return sanitizeEmoji(str);
    }
    return str;
};
