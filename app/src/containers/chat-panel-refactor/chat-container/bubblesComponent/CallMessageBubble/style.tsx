"use strict";

import * as React from "react";
import styled from 'styled-components';

interface ICallBubble {
    statusCall?: boolean;
}

// Edited
export const CallBlock = styled.div`{ 
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 10px 14px 0 10px;
  width: 100%;
  height: auto;
  ${(props) => {
    if(props.language === 'ar') {
        return `flex-direction: row-reverse;`
    } else {
      return `flex-direction: row;`
    }
  }}
}`;

export const CallStatus = styled.div`{ 
     margin: 0 0 6px 10px;
     display: flex;
     flex-direction: column;
     
}`;

export const CallStatusDuration = styled.div`{
    display: block;
    margin: 5px auto 0 0;
    color: #9ca1af;
    font-size: 12px;
    line-height: 14px;
    ${(props: ICallBubble) => {
          if (props.statusCall) {
              return `     
                      display:none;   
                  `
          }
      }
    }
}`;

export const CallStatusText = styled.span`{ 
      display: block;
    
      font-size: 14px;
      line-height: 1;
      font-weight: 500;
       ${(props: ICallBubble) => {
    if (props.statusCall) {
        return `     
                color: #FF1E1C;      
                `
    }
    else {
        return `
                 color: #272727;
                       `
    }
}
    }
}`;

export const CallIcon = styled.span`{ 
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
    margin: 1px 0 6px 0;
    transform: ${(props) => {
          if(props.language === 'ar'){
            return `rotate(270deg)`
          } else {
      return `rotate(0)`
    }
    }};
    ${(props: ICallBubble) => {
    if (props.statusCall) {
        return `color: #FF1E1C;`
    }
    else {
        return `color: #17ABF6;`

    }
}
    }
    &:after {
        content: "\\e950";
        font-size: 26px;
    }
}`;
