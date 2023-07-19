import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";
import {TooltipButton} from "components/messages/style";


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
      align-items: flex-start;
      margin: 0 0 0 10px;
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
