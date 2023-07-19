"use strict";

import * as React from "react";

import components from "configs/localization";

interface IErrorContentProps {
    toggleExpanded: () => void;
    expanded: boolean;
    groupName: string;
    contentRefs: any;
    leave: () => void;
}

export default class ErrorContent extends React.Component<IErrorContentProps, null> {
    constructor(props: any) {
        super(props);
    }

    render () {
        const {
            groupName, contentRefs, expanded, toggleExpanded, leave
        } = this.props;
        const localization: any = components().conferencePanel;


        return (
            <div className='conference-panel-block error'>
                <div className='header' ref={contentRefs.headerRef}>
                    <div className='left-content'>
                        <span className={`${expanded ? 'icon-minimize' : 'icon-maximize'}`} onClick={toggleExpanded}/>
                        <div className='group-info'>
                            <span className='group-name'>{groupName}</span>
                        </div>
                    </div>
                </div>
                <div
                    className="content"
                    // className={`content${roomClassNames.content}`}
                    ref={contentRefs.contentRef}>
                    <p>
                        This group call has already been finished
                    </p>
                </div>
                <div className='footer' ref={contentRefs.footerRef}>
                    <div className="call-actions">
                        <div className='end-call'>
                            <span className="icon-footer icon-end-call" onClick={() => leave()}/>
                            <span className='description'>{localization.close}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
