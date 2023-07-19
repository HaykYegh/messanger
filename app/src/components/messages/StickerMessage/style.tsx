import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";



export const StickerSlock = styled.div`{ 
   width: auto;
   height: auto;
   margin: 3px 0 5px 0;
   overflow: hidden;
   cursor: pointer;
   display: flex;
   align-items: center;
   justify-content: flex-end;
   position: relative;
   img {
          height: calc(100% / 2);
          width: calc(100% / 2);
          user-select: none;
          cursor: auto;
        }
}`;

export const LoadingSticker = styled.span`{ 
   pointer-events: none !important;
   width: auto;
   height: auto;
   user-select: none;
   opacity: 0;
   animation: profile-popup-content 50ms forwards;
   -webkit-animation-delay: 500ms;
   animation-delay: 500ms;
   speak: none;
   font-style: normal;
   font-weight: normal;
   font-variant: normal;
   text-transform: none;
   line-height: 1;
   font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;  
    &:after {
      content: "\\E90D";
      color: #e5eaef;
      font-size: 90px;
    
}`;
