"use strict";

import * as React from "react";
import styled from 'styled-components';

export const ContactBlock = styled.div`{ 
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  ${(props) => {
  if (props.language === 'ar') {
    return `flex-direction: row-reverse;`
  } else {
    return `flex-direction: row;`
  }
}}
}`;

export const ContactIcon = styled.span`{ 
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #F5F5F7;
  display: flex;
  justify-content: center;
  align-items: center;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: 'icomoon', Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
   &:after {
            content: '\\E959';
            color: #8493AA;
            opacity: 0.3;
            font-size: 35px;
          } 
}`;

export const ContactInfo = styled.div`{
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  ${(props) => {
    if (props.language === 'ar') {
      return `text-align: right;
              margin: 0 10px 0 0;`
    } else {
      return `text-align: left;
              margin: 0 0 0 10px;`
    }
  }}
}`;

export const ContactName = styled.div`{ 
  font-size: 14px;
  font-weight: 600;
  color: #000;
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}`;
