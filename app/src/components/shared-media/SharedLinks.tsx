"use strict";

import {Map} from "immutable";
import * as React from "react";
import {Scrollbars} from 'react-custom-scrollbars';

import {getFirstOccurance} from "helpers/MessageHelper";
import {getInitials} from "helpers/DataHelper";
import components from "configs/localization";

interface ISharedLinksTabProps {
    links?: Map<string, any>;
    handleFilesChecked?: (message: any) => void;
    fileEditing?: boolean,
    checkedFiles?: Array<string>,
}

export default class SharedLinks extends React.Component<ISharedLinksTabProps> {

    render() {
        const {links, fileEditing, handleFilesChecked, checkedFiles} = this.props;
        const localization: any = components().sharedLinks;

        return links && links.size > 0 ?
            (
                <Scrollbars className="shared_links" autoHide autoHideTimeout={2000} autoHideDuration={1000}>
                    {links.valueSeq().map((linkMessage, item) => {
                        const href: string = getFirstOccurance(linkMessage.get("text"));
                        const m_options = linkMessage.get("m_options") && linkMessage.get("m_options").toJS();

                        let url: string;
                        let domain: string;
                        if (href) {
                            url = href.replace(/(http(s)?:\/\/)?(www.)?/i, '');
                            if (url.indexOf('/') !== -1) {
                                domain = url.split('/')[0];
                            } else {
                                domain = url;
                            }
                        } else {
                            return null;
                        }

                        const DomainArr: Array<any> = url.split(".");
                        let firstCharacter: string;
                        if (DomainArr.length > 2) {
                            firstCharacter = getInitials(DomainArr[1]);
                        } else {
                            firstCharacter = getInitials(DomainArr[0]);
                        }
                        const toggleFile: any = () => handleFilesChecked(linkMessage);
                        const msgId = linkMessage.get("messageId") || linkMessage.get("id");

                        const title = m_options && m_options.title && m_options.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const description = m_options && m_options.description && m_options.description.replace(/>/g, '&gt;').replace(/</g, '&lt;');
                        return (
                            <div className="links_content" key={item} onClick={fileEditing ? toggleFile : null}>
                                <div className="link">
                                    <div
                                        className={`link-img ${(m_options && m_options.img) ? "link-img-no-background" : ""}`}>
                                        {(m_options && m_options.img) ?
                                            <img draggable={false} src={`data:image/jpeg;base64,${m_options.img}`}
                                                 alt=""/>
                                            : <span className="link-character">{firstCharacter}</span>}
                                    </div>
                                    <div className={fileEditing ? "link-block link-block-width" : "link-block"}>
                                            <span className="link-part">
                                                <a className="linkified" href={`http://${url}`}
                                                   target="_blank">{href}</a> :
                                            </span>
                                        {!(m_options && (m_options.title || m_options.description)) &&
                                        <span className="domain">{domain}</span>}
                                        {(m_options && m_options.title && !m_options.description) &&
                                        <span className="link-title" dangerouslySetInnerHTML={{__html: title}}/>}
                                        {(m_options && m_options.description) && <span className="link-description"
                                                                                       dangerouslySetInnerHTML={{__html: description}}/>}
                                    </div>
                                    {
                                        fileEditing && <div className="edit-mode">
                                            <span
                                                className={checkedFiles.includes(msgId) ? "media-checked" : "media-not-checked"}/>
                                        </div>
                                    }
                                </div>
                            </div>
                        )
                    })
                    }
                </Scrollbars>
            ) :
            (
                <div className="no_links">
                    <span className="no_links_title">{localization.noLinks}</span>
                    <p className="no_links_text">{localization.noLinksText}</p>
                </div>
            )
    }
};
