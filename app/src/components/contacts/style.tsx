import * as React from "react";
import styled from 'styled-components';


export const AvatarSize = styled.div`{
    min-width: ${(props: { width: string }) => props.width || "38px"};
    border-radius: 50%;
    width: ${(props: { width: string }) => props.width || "38px"}; 
    height: ${(props: any) => props.height || "38px"}; 
    margin: ${(props: { margin: string }) => props.margin || "0 12px"}; 
    position: relative;
    cursor: ${(props: { cursor: string }) => props.cursor || "inherit"};
    
}`;
export const AvatarImage = styled.img`{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: contain;
    user-drag: none;
    user-select: none;
    border: ${(props: { border: string }) => props.border || "none"};
}`;
export const AvatarNoImage = styled.span`{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: ${(props: { backgroundColor: string }) => props.backgroundColor ? props.backgroundColor : "#FDFEFF"};
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    //font-family: 'icomoon', sans-serif !important;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
       &:after {
         content: ${(props: { content: string }) => props.content};
         font-size: ${(props: { fontSize: string }) => props.fontSize || "38px"};
         color: #8493AA;
         opacity: 0.3;
         font-family: ${(props: { isGroup: boolean }) => props.isGroup ? "inherit" : "'icomoon'"};;
        }
    }`;
export const AvatarName = styled.span`{
    position: relative;
    width:  100%;
    height:  100%;
    border-radius: 50%;
    background-color: ${(props: { backgroundColor: string }) => props.backgroundColor ? props.backgroundColor : "#FDFEFF"};
    display: flex;
    justify-content: center;
    align-items: center;
    span{
    font-size: ${(props: { fontSize: string }) => props.fontSize || "14px"};
    line-height: 19px;
    font-weight: 700;
    text-transform: uppercase;
    text-align: left;
    margin-left: 1px;
    margin-top: 1px;
}`;
export const EditImagesInput = styled.input`{
    width: 100%;
    height: 100%;
    position: absolute;
    right: 0;
    margin: 0;
    bottom: 0;
    padding: 0;
    opacity: 0; 
    outline: none; 
    cursor: pointer; 
    font-size: 0 !important;
}`;

export const DeleteContactBlock: any = styled.div`{
    cursor: ${(props: { cursor?: string }) => props.cursor || "default"}};
    display: flex;
    align-items: center;
    justify-content: ${(props: { justify_content?: string }) => props.justify_content || "space-between"};
    width: 100%;
    height: 40px;
    border-bottom: solid 1px #e5e7ea;
}`;
export const DeleteContactTitle = styled.h3`{
    color: #2D2E3B;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    user-select: ${(props: { user_select?: string }) => props.user_select};
    color: ${props => props.color};
    cursor: pointer;
}`;

export const CallActions: any = styled.div`{
  position: absolute !important;
  display: flex;
  right: 14px;
  z-index: 5;

  .icon-call-actions {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    transition: 0.2s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;

    &:hover {
      &:before {
        opacity: .7;
      }
    }

    &:before {
      color: #ffffff;
      transition: 0.2s;
      font-size: 30px;
    }

    &:last-child {
      margin-right: 0;
    }
  }

  .icon-microphone {
    background-color: #707384;

    &.off {
      background-color: #ffff;

      &:before {
        color: #FB2C2F;
      }
    }

    &.on {
      background-color: #707384;

      &:before {
        color: #fff;
      }
    }

    &:before {
      content: "\\e928";
    }
  }

  .icon-end-call {
    background-color: #FB2C2F;

    &:before {
      content: "\\e921";
    }
  }

  .icon-video-call {
    background-color: #fff;

    &:before {
      content: "\\e929";
      color: #000;
    }
  }

  .icon-accept-call {
    background-color: #00A2EC;

    &:before {
      transition: none;
      content: '\\e950';
      font-size: 16px;
    }
  }
}`;
