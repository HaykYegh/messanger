"use strict";

import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";

export const AudioBlock = styled.div`{ 
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 250px;
  padding: 0 0 12px 0;
  ${(props) => {
    if(props.language === 'ar') {
      return `flex-direction: row-reverse`
    } else {
      return `flex-direction: row`
    }
  }}
}`;

export const AudioProgressBar = styled.div`{ 
  height: 40px;
   audio {
      display: none;
      width: 150px;
      height: 30px;
      background-color: ${primary.color};
    }
}`;

export const ProgressBar = styled.div`{
  height: 45px;
  width: 150px;
  max-width: 149px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${(props) => {
    if(props.language === 'ar') {
      return `transform: rotate(180deg)`
    } else {
      return `transform: rotate(0)`
    }
  }}
}`;

export const VoiceAmplitude = styled.div`{ 
    display: flex;
    height: 40px;
    max-width: 149px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
}`;

export const AudioDuration = styled.span`{ 
    position: absolute;
    color: #17ABF6;
    bottom: 0;
    font-size: 12px;
    font-weight: 400;
    ${(props) => {
      if(props.language === 'ar') {
        return `right: 60px`
      } else {
        return `left: 60px`
      }
    }}
}`;

export const VoiceAmplitudesContainer = styled.div`{ 
    display: flex;
    height: 40px;
    max-width: 149px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
}`;
