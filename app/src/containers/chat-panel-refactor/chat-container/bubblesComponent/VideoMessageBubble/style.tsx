import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";


// variables
export const BubbleColor = {
    borderUser: '#D1EEFE',
    borderGuest: '#e3e5e6',
};


// index//

interface IVideoBubble{
    isOwnMessage?: boolean;
    reply?: boolean;
    forward?: boolean;
    more?: boolean;
}
// Edited
export const VideoPart = styled.div`{ 
          width: 400px;
          height: auto;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          max-width: 100%;
          img {
            max-height: 400px;
            max-width: 400px;
            border-radius: 5px;
            object-fit: cover;
            object-position: center;
            overflow: hidden;
            user-drag:none;
            user-select:none;
            width: 100%;
          }
}`;
export const Video = styled.div`{ 
         width: 250px;
         height: 250px;
         object-fit: cover;
}`;
export const PlayButton = styled.div`{ 
    position: absolute;
    z-index: 8;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
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
      &:before {
              content: "\\e932";
              background-color: rgba(0, 0, 0, 0.40);;
              font-size: 50px;
              transition: 0.5s;
              cursor: pointer;
              color: #ffffff;
              border-radius: 50%;
            }
}`;

