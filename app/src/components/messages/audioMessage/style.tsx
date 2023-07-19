import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";



// Edited
export const AudioBlock = styled.div`{ 
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  position: relative;
  width: 100%;
  max-width: 220px;
  padding: 0 0 12px 0;
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
  height: 40px;
  width: 150px;
  max-width: 149px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    left: 48px;
    color: #17ABF6;
    bottom: 0;
    font-size: 12px;
    font-weight: 400;
}`;
export const VoiceAmplitudesContainer = styled.div`{ 
    display: flex;
    height: 40px;
    max-width: 149px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
}`;
