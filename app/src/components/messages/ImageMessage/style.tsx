import * as React from "react";
import styled from 'styled-components';
import thumbnail from "assets/images/thumbnail100x100.png";
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
export const ImageBlock = styled.div`{ 
          width: auto;
          height: auto;
          display: block;
}`;
export const GifBlock = styled.div`{
    width: auto;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
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
          background-image: url(${thumbnail});
          background-repeat: no-repeat;
          background-size: 100% 100%;
          img {
            max-height: 400px;
            max-width: 397px;
            object-fit: cover;
            object-position: center;
            overflow: hidden;
            user-drag:none;
            user-select:none;
          }
}`;
