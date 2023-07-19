"use strict";

import * as React from "react";
import styled from 'styled-components';

interface IimageMessageBubble{
  imageWidth?:string;
  imageHeight?:string;
}

export const ImageTextContent = styled.div`{
   display: flex;
   ${(props) => {
      if(props.language === "ar") {
        return `flex-direction: row-reverse;`
      } else {
        return `flex-direction: row`
      }
   }}
}`

export const ImageBlock = styled.div`{ 
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
    min-height: 200px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    img {
      // max-height: 400px;
      // max-width: 397px;
      // height: 400px;
      // width: 397px;
      width: ${(props: IimageMessageBubble) => {return props.imageWidth && Number(props.imageWidth) > 397 ? 397 : props.imageWidth && Number(props.imageWidth) < 200 ? 200 : props.imageWidth ? props.imageWidth : 397}}px;
      height: ${(props: IimageMessageBubble) => props.imageHeight && Number(props.imageHeight) > 400 ? 400 : props.imageHeight && Number(props.imageHeight) < 200 ? 200 : props.imageHeight ? props.imageHeight : 400}px;
      object-fit: cover;
      object-position: center;
      overflow: hidden;
      user-drag:none;
      user-select:none;
    }
}`;
