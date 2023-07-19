import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";


interface ICallReply{
    contactImageReply?: boolean;
    language: string;
}

export const  ReplyContanier = styled.div`{
   width: 100%;
   z-index: 8;
   min-height: 34px;
   font-size: 14px;
   background-color: transparent;
   margin: 5px 0 7px 2px;
   cursor: pointer;
   display: flex;
   align-items: flex-start;
   flex-direction: row;
  ${(props) => {
    if(props.language === "ar") {
      return `flex-direction: row-reverse;
              padding: 0 10px 0 0;
              border-right: 2px solid #17ABF6;`
    } else {
      return `flex-direction: row;
              padding: 0 0 0 10px;
              border-left: 2px solid #17ABF6;`
    }
  }}
}`;
export const  ContactReply = styled.span`{ 
    width: 40px;
    height: 40px;
    max-height: 40px;
    min-width: 40px;  
    margin: 0 9px 0 0;
    background-color: #F5F5F7;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none; 
    border-radius: 50%;
    ${(props: ICallReply) => {
      if (props.language === 'ar') {
          return `
                  margin: 0 0 0 9px;
                    `
                }
      else {
        return `
                             margin: 0 9px 0 0;
                                   `
      }
      }
    }
        &:after {
        content: '\\E959';
        color: #8493AA;
        opacity: 0.3;
        font-size: 40px;
      }
}`;
export const  Smile = styled.img`{
  width: 22px;
  height: 22px;
  line-height: 22px;
  vertical-align: middle;
  background-size: 242px 286px;
  pointer-events: none;
  display: inline-block;
  font-size: 0;
  overflow: hidden;
}`;
export const  ImageReply = styled.img`{

     max-width: 40px;
     max-height: 40px;
     min-height: 40px;
     min-width: 40px;
     width: 40px;
     height: 40px;
     border-radius: 4px;
     object-fit: cover;
     ${(props: ICallReply) => {
    if (props.contactImageReply) {
        return `     
                border-radius: 50%;   
                `
            }
            else {
                return `
                 border-radius: 4px;
                       `
            }
       }
    }
    ${(props: ICallReply) => {
      if (props.language === 'ar') {
          return `
                  margin: 0 0 0 9px;
                  `
              }
      else {
        return `
                       margin: 0 9px 0 0;
                             `
      }
    }
    }
}`;
export const  MessagePart = styled.div`{ 
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0 0 2px 0;
}`;
export const  ReplayName = styled.span`{ 
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: ${primary.color};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    ${(props) => {
      if(props.language === "ar") {
        return `flex-direction: row-reverse;`
      } else {
        return `row`
      }
    }}
}`;
export const  ReplayType = styled.span`{
    word-break: break-word;
    width: 100%;
    margin: 0;
    display: block;
    font-size: 13px;
    line-height: 1.38;
    font-weight: 400;
    color: #272727;
    overflow: hidden;
    text-overflow: ellipsis;
    ${(props: ICallReply) => {
      if (props.language === 'ar') {
        return `
                      text-align: right;
                      `
      }
      else {
        return `
                 text-align: left;
                 `
      }
    }
    }
}`;
export const  CancelEditingText = styled.span`{
    speak: none;
	font-style: normal;
	font-weight: normal;
	font-variant: normal;
	text-transform: none;
	line-height: 1;
	font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
    display: block;
    margin: 0 15px 0 0;
    position: absolute;
    right: 2px;
    top: 25px;
    &:after {
                cursor: pointer;
                content: "\\e960";
                color: #909cb4;
                font-size: 18px;
              }
    ${(props: ICallReply) => {
      if (props.language === 'ar') {
        return `
                left: 2px;
                margin: 0 0 0 15px
                `
        }
        else {
          return `
                         right: 2px;
                         margin: 0 15px 0 0;
                         `
        }
      }
    }
}`;
export const  PersonallyReply = styled.div`{ 
    display: flex;
    justify-content: flex-start;
}`;
export const  PersonallyReplyIcon = styled.img`{ 
     height: 12px;
     width: 12px;
     margin: 0 5px 0 0;
}`;
export const  PersonallyReplytext = styled.span`{ 
    font-size: 13px;
    color: rgb(145, 145, 145);
}`;
