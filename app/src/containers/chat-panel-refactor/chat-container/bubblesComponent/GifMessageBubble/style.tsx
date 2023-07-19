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

export const ImageBlock = styled.div`{ 
    width: auto;
    height: auto;
    display: block;
    position: relative;
    
    .loader {
        position: absolute;
        display: flex;
        justify-content: center;
        width: 100%;
        top: 50%;
    }
}`;

export const ImageContent = styled.div`{ 
          width: auto;
          height: auto;
          border-radius: 5px;
          overflow: hidden;
          min-height: 150px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          img {
            max-height: 400px;
            max-width: 400px;
            object-fit: cover;
            object-position: center;
            overflow: hidden;
            user-drag:none;
            user-select:none;
          }
}`;
