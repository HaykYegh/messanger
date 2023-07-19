import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";
import {ARABIC_LANGUAGE} from "configs/constants";

// variables
export const BubbleColor = {
    borderUser: '#D1EEFE',
    borderGuest: '#e3e5e6',
};


// index//


// Edited
export const FileBlock = styled.div`{ 
      float: left;
      width: 100%;
      position: relative;
}`;
export const FileContent = styled.div`{ 
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
}`;
export const FileTextBlock = styled.div`{
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0 0 0 10px;
      ${(props) => {
        if(props.language === 'ar') {
            return `align-items: flex-end;`
        } else {
            return `align-items: flex-start;`
        }
      }}
}`;
export const FileName = styled.a`{ 
         display: block;
         font-size: 14px;
         font-weight: 600;
         color: #000;
         cursor: pointer;
         width: 265px;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
         user-select: none;
         ${(props) => {
            if(props.language === ARABIC_LANGUAGE) {
               return `
                   text-align: right;
                   margin-right: 10px;
                   margin-left: 0;
               `;
            } else {
                return `text-align: left;`
            }
         }}
}`;
export const FileSize = styled.a`{ 
         margin: 6px 0 0 0;
         display: block;
         font-size: 12px;
         line-height: 12px;
         font-weight: 400;
         color: #8491ab;
         text-transform: uppercase;
         user-select: none;
         ${(props) => {
             if (props.language === ARABIC_LANGUAGE) {
                 return `margin-right: 10px;`
             }
         }
}`;
export const Link = styled.span`{ 
      cursor: pointer;
      display: none;
      color: ${primary.color};
      transition: all 0.2s ease;
      text-transform: initial;
      margin: 0 6px;
      opacity: 0;
}`;
export const ButtonText = styled.span`{ 
      cursor: pointer;
      display: none;
      color: ${primary.color};
      transition: all 0.2s ease;
      text-transform: initial;
      margin: 0 6px;
      opacity: 0;
      position: absolute;
      left: -185px;
      bottom: 6px;
      padding: 0 4px;
      width: 101px;
      text-align: left;
      background-color: #fff;
      font-size: 12px;

}`;
