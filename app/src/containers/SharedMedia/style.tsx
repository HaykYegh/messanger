import * as React from "react";
import styled from 'styled-components';
import {primary, borders} from "services/style/variables";
import {SHARED_MEDIA_TYPES} from "configs/constants";
import {elementType} from "prop-types";
import { css } from 'styled-components'
import {PROJECT_COLORS} from "configs/constants";

interface IsharedMediaImageProps {
    blur: boolean;
    sharedMediaPanel: boolean;
}
export const SharedMediaHeader = styled.div`{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-bottom: 1px solid #edf2f9;
    min-height: 55px;
    align-items: center;
    padding: 0 22px 0 6px;
}`;

export const SharedMediaTitle = styled.p`{
    text-align: center;
    font-size: 14px;
    font-weight: 600;
}`;

export const EditButton = styled.span`{
    min-width: 34px;
    font-size: 14px;
    color: #151515;
    cursor: pointer;
    text-align: end;
    font-weight: ${(props: { fontWeight: string }) => props.fontWeight};
}`;

export const BackArrow = styled.img`{
    width: 32px;
    height: 32px;
    margin-left: 6px;
    cursor: pointer;
}`;

export const NavBar = styled.div`{
    width: 100%;
    display: flex;
    flex-direction: row;
    min-height: 55px;
    align-items: center;
    padding: 0;
}`;

export const NavBarTabs = styled.div`{
    width: 100%;
    height: 30px;
    border-radius: 5px;
    background: #FFFFFF;
    justify-content: space-around;
    display: flex;
    align-items: center;
    z-index: 1;
    position: relative;
}`;

export const Tab = styled.span`{
    font-size: 12px;
    width: 100%;
    height: 26px;
    text-align: center;
    line-height: 26px;
    z-index: 3;
    cursor: pointer;
}`;

export const BackgroundSlider = styled.span`{
    position: absolute;
    border-radius: 5px;
    height: 26px;
    z-index: 2;
    width: ${(props: { tabLength: number }) => `${100 / props.tabLength}%`};
    background: #E6EEF7;
    left: ${(props: { left: string }) => props.left};
    ${(props: ({ tabIndex: number, tabLength: number })) => {
    if (props.tabIndex === 1) {
        return `left: ${100 / props.tabLength}%;`
    } else if (props.tabIndex === 0) {
        return `left: calc(0% + 2px);`
    } else {
        return `left: calc(100% - ${100 / props.tabLength}% - 2px);`
    }
}}
    transition: all 150ms ease-in-out;
}`;

export const SharedMediaContent = styled.div`{
    width: 100%;
    height: ${(props: { height: string }) => props.height};
    display: flex;
    flex-direction: row;
    position: relative;
    transition: height 0.25s cubic-bezier(0.4, 0, 0.6, 1);
    
    & > div {
      & > div {
        overflow: overlay;
      
        &::-webkit-scrollbar {
          -webkit-appearance: none;
        }
        
        &::-webkit-scrollbar:vertical {
          width: 7px;
        }
       
        &::-webkit-scrollbar:horizontal {
          height: 7px;
        }
        
        &::-webkit-scrollbar-thumb {
          border-radius: 8px;
          background-color: rgba(0, 0, 0, .2);
        }

        &::-webkit-scrollbar-track {
          background-color: #F9FAFF;
          border-radius: 8px;
        }
      } 
    }
}`;

export const SharedMediaFooter = styled.div`{
    width: 100%;
    max-width: 309px;
    max-height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    border-top: 1px solid #edf2f9;
    position: absolute;
    bottom: ${(props: { bottom: string }) => props.bottom};
    transition: bottom 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}`;

export const SharedMediaList: any = styled.ul`{
    margin: ${(props: { margin: string }) => props.margin || "none"};
    padding: ${(props: { padding: string }) => props.padding || "4px 6px 0 6px"};
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
}`;

export const SharedMediaElement = styled.li`{
    margin-bottom: ${(props: { elementType: string }) => {
    if (props.elementType === SHARED_MEDIA_TYPES.LINK || props.elementType === SHARED_MEDIA_TYPES.FILE) {
        return `0`
    } else {
        return `5px`
    }
}};
    margin-right: ${(props: { elementType: string }) => {
    if (props.elementType === SHARED_MEDIA_TYPES.LINK || props.elementType === SHARED_MEDIA_TYPES.FILE) {
        return "0"
    } else {
        return "4px"
    }
}};
    width: ${(props: { elementType: string }) => {
    if (props.elementType === SHARED_MEDIA_TYPES.LINK || props.elementType === SHARED_MEDIA_TYPES.FILE) {
        return "100%"
    } else {
        return "95px"
    }
}};
    height: ${(props: { elementType: string }) => {
    if (props.elementType === SHARED_MEDIA_TYPES.LINK) {
        return "66px"
    } else if (props.elementType === SHARED_MEDIA_TYPES.FILE) {
        return "50px"
    } else {
        return "95px"
    }
}};
    cursor: ${(props: { isEditing: boolean, elementType: string }) => {
    if (props.isEditing || props.elementType === SHARED_MEDIA_TYPES.MEDIA) {
        return "pointer"
    } else {
        return "unset"
    }
}};
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}`;

export const SharedMediaImage = styled.img`{
    height: 100%;
    width: 100%;
    object-fit: cover;
    object-position: 50% 50%;
    user-drag: none;
    // filter: blur(8px);
    filter: ${(props: IsharedMediaImageProps) => props.blur ? "blur(8px)" : 'unset'};
    border: 1px solid #edf2f9;
    border-radius: 3px;
}`;

export const PlayButton = styled.div`{ 
    position: absolute;
    font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
      &:before {
              position: relative;
              content: "\\e932";
              background-color: rgba(0, 0, 0, 0.40);;
              font-size: 35px;
              transition: 0.5s;
              cursor: pointer;
              color: #ffffff;
              border-radius: 50%;
            }
            
}`;

export const SelectButton = styled.div`{
    position: absolute;
    top: ${(props: { top: string }) => props.top || "4px"};
    right: ${(props: { right: string }) => props.right || "4px"};
    width: 20px;
    height: 20px;
    border-radius: 50px;
    border: 2px solid #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 1px 8px 0px rgba(0,0,0,0.2);
    background: ${(props: { isSelected: boolean }) => props.isSelected ? `${primary.color}` : `rgba(0, 0, 0, 0.15)`};
}`;

export const ButtonContent = styled.span`{
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
}`;

export const Select = styled.div`{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: relative;
    height: 100%;
    width: 20px;
}`;

export const FooterTab = styled.li`{
    align-items: center;
    display: flex;
    justify-content: center;
    flex-direction: column;
    cursor: ${(props: { cursor: string }) => props.cursor || "default"};
}`;

export const FooterButton = styled.img`{
    width: 16px;
    height: 16px;
    margin-bottom: 8px;
}`;

export const FooterButtonTitle = styled.span`{
    font-size: 10px;
}`;

export const FooterTabList = styled.ul`{
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-around;
    flex-direction: row;
    background-color: ${PROJECT_COLORS.RIGHT_PANEL_BACKGROUND};
}`;

export const SharedMediaContainer = styled.div`{
    width: 100%;
    height: inherit;
    display: flex;
    flex-direction: column;
    position: absolute;
    user-select: none;
    left: 0;
    
    animation: ${(props: IsharedMediaImageProps) => (props.sharedMediaPanel === true ? css`slideIn 0.3s ease-in-out` : css`slideOut 0.3s ease-in-out`)};
    // will-change: transform;
    @-webkit-keyframes slide {
        100% { right: 0; opacity: 1 }
    }    
    @keyframes slide {
        100% { right: 0; opacity: 1}
    }

    @keyframes slideIn {
        0% {
        opacity: 0;
        transform: translate(100%,0)
        }
        100% {
          opacity: 1;
          transform: translate(0,0)
        }
    }
    @keyframes slideOut {
        0% {
        opacity: 1;
        transform: translate(0,0)
        }
        100% {
          opacity: 0;
          transform: translate(100%,0)
        }
    }
}`;

export const NoMedia = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 0 14px;
}`;

export const LinkContent = styled.div`{
    width: 100%;
    height: auto;
    padding: 0 14px 0 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}`;

export const Link = styled.div`{
    min-height: 60px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
}`;

export const Img = styled.img`{
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: contain;
    object-position: center;
}`;

export const LinkDomain = styled.span`{
    font-size: 13px;
    font-weight: 400;
    color: ${primary.color};
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    width: 190px; 
}`;

export const LinkTitle = styled.span`{
    font-size: 13px;
    font-weight: 600;
    color: #333337;
    line-height: 1.25;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    width: 190px; 
}`;

export const MessageTime = styled.span`{
    display: block;
    font-weight: 400;
    font-size: 12px;
    line-height: 12px;
    color: #bdb8b8;
    position: absolute;
    top: unset;
    right: 20px;
    bottom: 3px;
    left: unset;    
}`;

export const ShowInFolder = styled.span`{
    color: #17ABF6;
    font-size: 13px;
    font-weight: 400;
    transition: all 0.2s ease;
    text-transform: initial;
    margin: 0 6px;
    opacity: 1;
    cursor: pointer;
    display: none;
}`;

export const MessageDate = styled.span`{
    display: flex;
    font-size: 13px;
    font-weight: 400;
    color: #919193;     
}`;

export const MessageBlock: any = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
    
    &:hover ${ShowInFolder} {
        display: ${(props: { isFilesEditing: boolean }) => props.isFilesEditing ? "none" : "unset"};
    };
    
    &:hover ${MessageDate} {
       display: ${(props: { isFilesEditing: boolean }) => props.isFilesEditing ? "unset" : "none"};
    }
}`;

export const FileInfo = styled.div`{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
}`;

export const MessageIcon: any = styled.div`{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background: ${(props: { background: string }) => props.background || "none"};
    border-radius: ${(props: { borderRadius: string }) => props.borderRadius || "0"};
    margin: ${(props: { isChatFileMessage: boolean, isMusicFileMessage: boolean, isReplyBlock: boolean, language: string }) => {

    if (props.isChatFileMessage && props.isReplyBlock) {
        if(props.language === 'ar') {
            return "0 0 0 7px"
        } else {
            return "0 7px 0 0"
        }
        
    } else if (!props.isChatFileMessage && props.isReplyBlock) {
        if(props.language === 'ar') {
            return "0 0 0 7px"
        } else {
            return "0 7px 0 0"
        }
    } else if (props.isChatFileMessage && props.isMusicFileMessage) {
        return "0 0 0 2px"
    } else if (props.isChatFileMessage) {
        return "0 4px 0 6px"
    } else if (!props.isChatFileMessage && !props.isMusicFileMessage) {
        return "0 4px"
    }
    return "0"
}};
    cursor: ${(props: { isChatFileMessage: boolean, isLink: boolean }) => {
    if (!props.isChatFileMessage && !props.isLink) {
        return "pointer"
    }

    return "auto"
}}
    ${(props: { isLink: boolean }) => {
    if (props.isLink) {
        return `
                min-width: 50px;
                height: 50px;
                background: #EAF0F8;
                border-radius: 5px;
                color: #fff;
                font-size: 18px;
                font-weight: 600;
            `
    }
}}
}`;

export const Icon = styled.img`{
    width: ${(props: { width: string }) => props.width};
    object-fit: ${(props: { objectFit: string }) => props.objectFit || "unset"};
    border-radius: ${(props: { borderRadius: string }) => props.borderRadius || "0"};
    transform: ${(props: { language: string }) => {
        if(props.language === 'ar') {
            return "rotate(180deg)"
        } else {
            return "rotate(0)"
        }
    }};
  
    &[alt]:after {  
      content: attr(alt);
      display: block;
      position: absolute;
      top: 0;
      left: 0;  
      width: 100%;
      height: 100%;
      background-color: #EAF0F8;
      font-size: 16px;
      font-weight: 500;
      line-height: 3;
      text-align: center;
      border-radius: 5px;
      color: #6D6F81;
    }

    &[alt]:before {
      content: attr(alt);
      position: absolute;
      left: 0;
      right: 0;
      width: 100%;
      height: 100%;
      background-color: #F9FAFF;
    }
}`;

export const IconText = styled.span`{
    font-size: 11px;
    font-weight: 500;
    position: absolute;
    color: #fff;
}`;

export const MessageInfo = styled.div`{
    display: ${(props: { display: string }) => props.display || "flex"};
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    width: 100%;
    height: 100%;
    border-bottom: 1px solid  #edf2f9;
    &:hover {
    .ShowInFolder{
       display: block;
       }
    };   
    margin: ${(props: { isFileMessage: boolean }) => {
    if (props.isFileMessage) {
        return "0 0 0 14px"
    } else {
        return "0 0 0 10px"
    }
}};
    .audio {
        display: none;
    }
}`;

export const FileName = styled.a`{
    display: block;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    color: #333337;
    padding-bottom: 8px;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 210px;
}`;

export const FileSize = styled.span`{
    display: flex;
    font-size: 13px;
    font-weight: 400;
    color: #919193;    
}`;

export const ksjfbsakj = styled.span`{
${(props: ({ tabIndex: number, tabLength: number })) => {
    if (props.tabIndex === 1) {
        return `left: ${100 / props.tabLength}%;`
    } else if (props.tabIndex === 0) {
        return `left: calc(0% + 2px);`
    } else {
        return `left: calc(100% - ${100 / props.tabLength}% - 2px);`
    }
}}
    transition: all 150ms ease-in-out;
}`

