"use strict";

import * as React from "react";
import styled from 'styled-components';

import {leftSideBar} from "services/style/variables";
import {MESSAGES_BADGE_LIMIT} from "configs/constants";


// index//

export const AppLeftMenu = styled.div`{
  min-width: 60px;
  background-color: ${leftSideBar.background};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  
}`;
// export const Title = styled.span`{
//     user-select: none;
//     height: 100%;
//     font-size: 10px;
//     line-height: 12px;
//     text-align: left;
//     padding-top: 4px;
//     color: ${(props: { active: boolean, color: string }) => props.active ? props.color : leftSideBar.iconLabelColor};
//     font-weight: ${(props: any) => props.active ? "600" : "400"};
// }`;

export const LeftMenuContent = styled.div`{
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
   //@media only screen and (max-width: 760px){
   // flex-direction: row;
   // justify-content: space-around;
   // }
  }`;
export const LeftIcons = styled.div`{
      padding-bottom: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      flex-direction: column;
      &:hover{
      span:first-child{
          &:before{
          color: ${(props: { color: string }) => props.color || leftSideBar.iconColorHover};
                  }
              }
          } 
     }`;
export const Icon = styled.span`{
    font-size: 33px;
    background-color: rgba(255, 0, 0, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'icomoon';
    &:before {
        content: ${(props: { content: string }) => props.content};
        color: ${(props: any) => props.active ? props.color : leftSideBar.iconColor};
    }
    ${props => {
    const unreadMessageCount: any = props['data-unread-count'];
    const isBiggest: boolean = unreadMessageCount === `${MESSAGES_BADGE_LIMIT}+`;

    if (unreadMessageCount) {
        return `
        &:after {
            content: attr(data-unread-count);
            display: block;
            position: absolute;
            top: 10px;
            left: ${isBiggest ? '25px' : '32px'};
            width: auto;
            min-width: 20px;
            padding: 0 5px;
            height: 20px;
            border:2px solid #f7f7f9;
            border-radius: 30px;
            background-color: #ff0000;
            color: #ffffff;
            font-size: 12px;
            font-weight: 500;
            line-height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `
    }
}
    }`;

export const SettingsBlock = styled.div`{
     margin: auto 0 15px 0;
     display: flex;
     justify-content: center;
     align-items: center;
     }`;
export const SettingsContent = styled.div`{
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    &:hover{
      span:first-child{
          &:before{
          color: ${(props: { color: string }) => props.color || leftSideBar.iconColorHover};
                  }
              }
          } 
     }\`;
    ${props => props['data-update'] && `
        &:after {
            content: attr(data-update);
            display: block;
            position: absolute;
            bottom: ${props.isAvatarSet ? "47px" : "41px"};
            left: ${props.isAvatarSet ? "33px" : "35px"};
            width: auto;
            padding: 0 5px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #FF4D4D;
            color: #ffffff;
            font-size: 10px;
            font-weight: bolder;
            line-height: 3px;
            display: flex;
            justify-content: center;
            align-items: center;
    }`}
`;

