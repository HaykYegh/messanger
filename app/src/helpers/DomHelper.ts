"use strict";

import {call, fork, put} from "redux-saga/effects";

import {attemptUpdateConversationAvatar} from "modules/conversations/ConversationsActions";
import {
    CONVERSATION_TYPE,
    EMAIL_VALIDAITON_REGEX,
    IMAGE_MIME_TYPE,
    MESSAGE_TYPES,
    VIDEO_MIME_TYPE
} from "configs/constants";
import IDBConversation from "services/database/class/Conversation";
import {ImageManager} from "helpers/ImageHelper";
import {blobToBase64, getBlobUri} from "helpers/FileHelper";
import {fetchFile} from "requests/fsRequest";

export const setCaretPosition: any = (textArea, position: number = 0) => {
    const range: Range = document.createRange();
    // range.selectNodeContents(textArea);
    range.setStart(textArea, position);
    range.setEnd(textArea, position);
    range.collapse(false);
    const selection: Selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};


export const placeCaretAtEnd: any = (el: HTMLDivElement) => {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range: Range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel: Selection = window.getSelection();
        // sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof (document.body as any).createTextRange !== "undefined") {
        const textRange: any = (document.body as any).createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
};

export const getThumbnail: any = (file) => {
    return new Promise((resolve) => {
        ImageManager.resize(file, {
            width: 60,
            height: 60,
            isFlex: false
        }, (blob) => {
            blobToBase64(blob).then((data) => {
                resolve(data);
            })
        });
    })
};

export function* getChannelsThumbnails(isChannel) {
    const conversations = yield call(IDBConversation.getAllConversations, isChannel ? CONVERSATION_TYPE.CHANNEL : CONVERSATION_TYPE.GROUP);
    for (const conversation in conversations) {
        if (conversations.hasOwnProperty(conversation)) {
            if (!(conversations[conversation] && conversations[conversation].threads && conversations[conversation].threads.threadInfo)) {
                continue;
            }

            if (conversations[conversation].threads.threadInfo.avatar === "" || !(conversations[conversation].threads.threadInfo.avatarUrl) || conversations[conversation].threads.threadInfo.avatar) {
                continue;
            }

            const imageThumb: any = yield call(fetchThumbnail, conversations[conversation].threads.threadInfo.avatarUrl);
            conversations[conversation].threads.threadInfo.avatar = imageThumb;

            yield fork(IDBConversation.updateThreadInfo, conversations[conversation].threads.threadInfo.id, {avatar: imageThumb});

            if (imageThumb) {
                yield put(attemptUpdateConversationAvatar(conversations[conversation].threads.threadInfo.id, imageThumb));
            }
        }
    }
}

export async function fetchThumbnail(avatarUrl) {
    const imageBlob = await fetchFile(avatarUrl);
    let imageThumb: any = "";
    if (!(imageBlob.type.includes('xml') || imageBlob.type.includes('html'))) {
        imageThumb = await new Promise((resolve) => {
            ImageManager.resize(imageBlob, {
                width: 180,
                height: 180,
                isFlex: false
            }, (blob) => {
                resolve(blob);
            });
        });
        return imageThumb;
    } else {
        return "";
    }
}

export const getNodeIndex: any = node => {
    let i: number = 0;

    while ((node = node.previousSibling) != null) {
        i++;
    }

    return i;
};

export const getCaretNode: any = () => {
    if (window.getSelection && window.getSelection().getRangeAt) {
        const selectedObj: any = window.getSelection();
        if (selectedObj.baseNode) {
            return {
                node: selectedObj.baseNode,
                position: selectedObj.baseOffset
            };
        } else {
            return -1;
        }
    }
    return -1;
};

export const getCaretPosition = (el) => {
    const range = window.getSelection().getRangeAt(0);
    const selectedObj = window.getSelection();
    let rangeCount = 0;
    const childNodes: any = el.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i] == selectedObj.anchorNode) {
            break;
        }
        if (childNodes[i].outerHTML) {
            rangeCount += childNodes[i].outerHTML.length;

        } else if (childNodes[i].nodeType == 3) {
            rangeCount += childNodes[i].textContent.length;
        }
    }
    return range.startOffset + rangeCount;

};

export const activateThread: any = (threadId: string) => {
    const currentThreadElement = document.querySelector(`.left_side_content li[data-threadid="${threadId}"]`);
    const activeThreadElement = document.querySelector(".left_side_content li.thread_block.active");

    if (currentThreadElement !== activeThreadElement) {
        let activeElemenets = document.querySelectorAll(".left_side_content li.thread_block.active");
        if (activeElemenets.length === 0) {
            activeElemenets = document.querySelectorAll(".left_side_content li.contacts_pack.active");
        }
        if (activeElemenets && activeElemenets.length > 0) {
            for (let i = 0; i < activeElemenets.length; i++) {
                if (currentThreadElement != activeElemenets.item(0)) {
                    activeElemenets[i].classList.remove("active");
                }
            }
        }
        currentThreadElement && !currentThreadElement.classList.contains("active") && currentThreadElement.classList.add("active");
    }
    return currentThreadElement !== activeThreadElement;
};

let isScrollClick = false;
export const handleScrollShow = (event: any) => {
    const target = event.currentTarget;
    if (event.type === "mousedown" && event.clientX >= target.offsetWidth - 10) {
        isScrollClick = true;
        return;
    } else if (event.type === "mousedown") {
        return;
    } else if (event.type === "mouseup" && !isScrollClick) {
        return;
    } else if (event.type === "mouseup") {
        isScrollClick = false;
    } else if (event.type === "mouseenter" && event.buttons > 0) {
        return;
    } else if (event.type === "scroll") {
        target.classList.add("scrolling");
        target.classList.remove("scrollable");
        void target.scrollWidth;
        target.classList.add("scrollable");
        return;
    }

    target.classList.remove("scrolling");
    target.classList.remove("scrollable");
    void target.scrollWidth;
    target.classList.add("scrollable");
};

export const isFullScreen: any = () => {
    return (document as any).fullScreen || (document as any).mozFullScreen || (document as any).webkitIsFullScreen;
};

export const getWebContentTitle: any = (html: string) => {
    let title: string = "";
    const titlePattern: any = /<title.*?>(.*?)<\/title>/i;

    // Check if content includes title tag and get this content, otherwise check meta tags
    if (titlePattern.test(html)) {
        titlePattern.exec(html);
        title = RegExp.$1 || "";
    }

    if (!title) {
        const nameTitlePattern: any = /<meta\s*?name=["']?title["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?name=["']?title["'].*?>/i;
        const ogTitlePattern: any = /<meta\s*?property=["']?og:title["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?property=["']?og:title["'].*?>/i;
        const itemPropTitlePattern: any = /<meta\s*?itemprop=["']?name["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?itemprop=["']?name["'].*?>/i;

        if (nameTitlePattern.test(html)) {
            nameTitlePattern.exec(html);
            title = RegExp.$1 || RegExp.$2 || "";
        } else if (!title && ogTitlePattern.test(html)) {
            ogTitlePattern.exec(html);
            title = RegExp.$1 || RegExp.$2 || "";
        } else if (!title && itemPropTitlePattern.test(html)) {
            itemPropTitlePattern.exec(html);
            title = RegExp.$1 || RegExp.$2 || "";
        }
    }

    return title;
};

export const getWebContentDescription: any = (html: string) => {
    const nameDescriptionPattern: any = /<meta\s*?name=["']?description["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?name=["']?description["'].*?>/i;
    const ogDescriptionPattern: any = /<meta\s*?property=["']?og:description["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?property=["']?og:description["'].*?>/i;
    const itemPropDescriptionPattern: any = /<meta\s*?itemprop=["']?description["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?itemprop=["']?description["'].*?>/i;
    let description: string = "";

    if (nameDescriptionPattern.test(html)) {
        nameDescriptionPattern.exec(html);
        description = RegExp.$1 || RegExp.$2 || "";
    } else if (!description && ogDescriptionPattern.test(html)) {
        ogDescriptionPattern.exec(html);
        description = RegExp.$1 || RegExp.$2 || "";
    } else if (!description && itemPropDescriptionPattern.test(html)) {
        itemPropDescriptionPattern.exec(html);
        description = RegExp.$1 || RegExp.$2 || "";
    }

    return description;
};

export const getWebContentImageUrl: any = (html: string, baseUrl: string) => {
    const imagePattern: any = /<meta\s*?(property|name)=["']?og:image.*?["']?\s*?content=["'](.*?)["'].*>|<meta\s*?content=["'](.*?)["']\s*?(property|name)=["']?og:image.*?["']?.*>/i;

    let url: string = "";

    if (imagePattern.test(html)) {
        imagePattern.exec(html);
        url = RegExp.$2 || RegExp.$3 || "";
    }

    if (!url) {
        // Check if content includes meta tag contained itemprop='image' attribute
        const itemPropImagePattern: any = /<meta\s*?itemprop=["']?image["']\s*?content=["'](.*?)["'].*?>|<meta\s*?content=["'](.*?)["']\s*?itemprop=["']?image["'].*?>/i;

        if (itemPropImagePattern.test(html)) {
            // itemPropImagePattern.exec(html);
            // url = RegExp.$1 || RegExp.$2 || "";

            const result: any = html.match(itemPropImagePattern);
            const virtualDOM: any = new DOMParser().parseFromString(result[0], "text/html");

            if (virtualDOM) {
                const metaTags: any = virtualDOM.getElementsByTagName("meta");
                const metaTagsLength: number = metaTags.length;

                for (let i = 0; i < metaTagsLength; i++) {
                    if (metaTags[i].getAttribute("itemprop") === "image") {
                        url = metaTags[i].getAttribute("content") || "";
                    }
                }
            }
        }

        if (!url) {
            // Check if content includes img tag and get this source
            const logoPattern: any = /<img.*?src=["'](.*?\.(jpg|jpeg|png)$)["'].*?>/i;
            if (logoPattern.test(html)) {
                logoPattern.exec(html);
                url = RegExp.$1 || "";
            }
        }
    }

    if (url) {
        const protocolPattern: any = /^https?:\/\//i;
        if (!protocolPattern.test(url)) {

            // Todo temporary check, remove after if find best result
            if (baseUrl.toLowerCase().includes("google") && !baseUrl.toLowerCase().includes("www")) {
                baseUrl = baseUrl.toLowerCase().replace("google", "www.google");
            }

            url = `${baseUrl}${url}`;

        }
    }

    return url;
};

// URI check in validate
export const isURI: any = (message: string) => {
    // const linkPattern: any = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\//=]*)?/gi;
    const linkPattern: any = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    const msgArr = message && message.split(/\s+/);
    let isLinkBool = false;

    if (msgArr) {
        for(let i = 0; i < msgArr.length; i++) {
            const isLink = linkPattern.test(msgArr[i]);
            if(isLink === true){
                isLinkBool = true;
                break;
            }
        }
    }

    return isLinkBool;
};

export const getURIOrigin: any = (uri: string) => {
    const pattern: any = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/i;
    if (pattern.test(uri)) {
        const result: any[] = uri.match(pattern);

        if (result) {
            return result[0] || uri;
        }
    }
    return uri;
};

export const normalizeURI: any = (url: string) => {
    let normalizedURI: string = "";
    let URIWithoutHTTPProtocol: string = "";

    // URI check in validate
    const linkPattern: any = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    const msgArr = url.split(/\s+/);
    let matchArr = [];
    msgArr.map(item => linkPattern.test(item) ? matchArr.push(item) : null);
    normalizedURI = matchArr[0];
    if (!/^(?:f|ht)tps?:\/\//.test(normalizedURI)) {
        URIWithoutHTTPProtocol = normalizedURI;
        normalizedURI = "http://" + normalizedURI;
    }

    return {
        url: URIWithoutHTTPProtocol || url,
        normalizedURI: normalizedURI || url,
    };
};

export const setMediaDimensions: any = (file: any, type, obj: any, index: number) => {
    if (file) {

        // get image dimensions
        if (type === IMAGE_MIME_TYPE) {
            const imageContainer: HTMLImageElement = document.createElement('img');
            imageContainer.src = getBlobUri(file);
            imageContainer.onload = () => {
                let width = imageContainer.naturalWidth;
                let height = imageContainer.naturalHeight;
                if (width > 400) {
                    width = 400;
                    height = height * (400 / width);
                }
                obj[index] = {
                    width,
                    height,
                };
            }
        }

        // get video dimensions
        if (type === VIDEO_MIME_TYPE) {
            const videoContainer: HTMLVideoElement = document.createElement('video');
            videoContainer.src = getBlobUri(file);
            videoContainer.onloadeddata = () => {
                let width = videoContainer.videoWidth;
                let height = videoContainer.videoHeight;
                if (width > 400) {
                    width = 400;
                    height = height * (400 / width);
                }
                obj[index] = {
                    width,
                    height,
                };
            }
        }
    }
};

export const getDimensions: any = (src: string, type: string, options: any) => {
    if (type === MESSAGE_TYPES.image) {
        const imageContainer: HTMLImageElement = document.createElement('img');
        imageContainer.src = src;
        imageContainer.onload = () => {
            let width = imageContainer.naturalWidth;
            let height = imageContainer.naturalHeight;
            if (width > 400) {
                width = 400;
                height = height * (400 / width);
            }
            options = {
                width,
                height,
            };
        };
    }

    if (type === MESSAGE_TYPES.video) {
        const videoContainer: HTMLVideoElement = document.createElement('video');
        videoContainer.src = src;
        videoContainer.onloadeddata = () => {
            let width = videoContainer.videoWidth;
            let height = videoContainer.videoHeight;
            if (width > 400) {
                width = 400;
                height = height * (400 / width);
            }
            options = {
                width,
                height,
            };
        }
    }
};

export function clearSelection() {
    if ((document as any).selection && (document as any).selection.empty) {
        (document as any).selection.empty();
    } else if (window.getSelection) {
        const sel: any = window.getSelection();
        sel.removeAllRanges();
    }
}

export const selectElementText = (element) => {
    if (window.getSelection) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};
