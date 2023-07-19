import * as React from "react";
import styled from 'styled-components';
import {Link} from "components/messages/FileMessage/style";
import {primary} from "services/style/variables";


// variables
export const BubbleColor = {
    borderUser: '#D1EEFE',
    borderGuest: '#e3e5e6',
};


// index//

interface IBubbleProps {
    isMediaBubble?: boolean;
    isLinkBubble?: boolean;
    stickerBubble?: boolean;
    fileBubble?: boolean;
    isOwnMessage?: boolean;
    isSent?: boolean;
    isDelivered?: boolean;
    isSeen?: boolean;
    isCaption?: boolean;
    callBubble?: boolean;
    isLocationBubble?: boolean;
    isActiveThread?: boolean;
    isLastMessage?: boolean;
    videoBubble?: boolean;
    imageBubble?: boolean;
    stickerReplyBubble?: boolean;
    replyBubble?: boolean;
    audioBubble?: boolean;
    highlight?: boolean;
    language?: string;
}

interface ITooltipButton {
    isOwnMessage?: boolean;
    reply?: boolean;
    forward?: boolean;
    more?: boolean;
    delete?: boolean;
    isMenuPopUpOpen?: boolean;
}


export const RightSideContent = styled.span`{
  user-select: none;
  color: rgba(0, 0, 0, 0);
  overflow-y: scroll;
  overflow-x: hidden;
  width: 100%;
  &.scroll-smooth {
    scroll-behavior: smooth;
  }
   &.show-chat-content {
    margin: auto 0 0 0;
  }
}`;

// time bubble
export const IsDeliveryWaiting = styled.span`{
        display: block;
        width: ${(props: IBubbleProps) => props.isLastMessage ? "20px" : "17px"};
        span{
        position: absolute;
        right: 6px;
        opacity: 0;
        width: 10px;
        height: 10px;
        border-width: 1px;
        border-style: solid;
        border-radius: 50%;
        animation: profile-popup-content 0.1ms forwards;
        animation-delay: 1s;
        ${(props: IBubbleProps) => {

    if (props.isLastMessage && props.isActiveThread) {
        return `
                    left: 3px;
                    bottom: 14px;
                    border-color: #fff;
                `
    } else if (props.isLastMessage) {
        return `
                    left: 3px;
                    bottom: 14px;
                    border-color: #94A6B9;
                `
    }

    if (props.isMediaBubble) {
        return `
                    border-color: #FFF;
                    bottom: 4px;
                 `
    } else if (props.isLinkBubble) {
        return `
                    bottom: 6px;
                    right: 13px;
                 `
    } else if (props.fileBubble) {
        return `
                    bottom: 8px;
                    right: 4px;
                 `
    } else if (props.stickerBubble) {
        return `
                    bottom: 4px;
                    right: 10px;
                 `
    } else {
        return `
                    border-color: #94A6B9;
                    bottom: 0;
                 `
    }
}
    }
        &:after {
          content: "";
          position: absolute;
          background-color: ${(props: IBubbleProps) => {
    if (props.isMediaBubble || props.isActiveThread) {
        return "#FFF"
    } else {
        return "#94A6B9"
    }
}
    }          
          top: 1px;
          left: 45%;
          height: 4px;
          width: 1.2px;
          border-radius: 5px;
          transform-origin: 50% 94%;
          transform: ${(props: IBubbleProps) => props.isLastMessage ? "rotate(90deg)" : "none"};
          animation: ${(props: IBubbleProps) => !props.isLastMessage ? "ptAiguille 1.5s linear infinite" : "none"};
        }
       
        @keyframes grdAiguille {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        &:before {
          content: "";
          position: absolute;
          background-color: ${(props: IBubbleProps) => {
    if (props.isMediaBubble || props.isActiveThread) {
        return "#FFF"
    } else {
        return "#94A6B9"
    }
}
    }    
          top: 1px;
          left: 45%;
          height: 4px;
          width: 1.2px;
          border-radius: 5px;
          transform-origin: 50% 94%;
          animation: ${(props: IBubbleProps) => !props.isLastMessage ? "ptAiguille 1s linear infinite" : "none"}; 
        }
        @keyframes ptAiguille {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        }
}`;

export const TimeBubble = styled.span`{ 
    
    color: #a2b0c4;
    height: 18px;
    float: right;
    display: flex;
    font-size: 12px;
    line-height: 10px;
    font-weight: 400;
    ${(props: IBubbleProps) => {
    if (props.isMediaBubble && !props.isOwnMessage) {
        return `
            position: absolute;
            right: 4px;
            bottom: 4px;
            background-color: rgba(0, 0, 0, 0.4);
            padding: 0 4px 0 6px;
            color: #fff;
            border-radius: 3px;
            align-items: center;
                 `
    } else if (props.isCaption) {
        return `
            position: relative;
            margin: -26px 6px 0 0;
            align-items: flex-end;
            `
    } else if (props.replyBubble) {
        return `
            position: relative;
            margin: -20px -3px 0 0;
            align-items: flex-end;
            `
    } else if (props.fileBubble || props.callBubble) {
        return `
            position: absolute;
            right: 6px;
            bottom: 4px;
                 `
    } else if (props.isMediaBubble) {
        return `
            position: absolute;
            right: 4px;
            bottom: 4px;
            background-color: rgba(0, 0, 0, 0.4);
            padding: 0 3px 0 6px;
            color: #fff;
            border-radius: 3px;
            align-items: center
                 `
    } else if (props.stickerBubble) {
        return `
            padding: 0 4px 0 6px;
            align-items: center;
            margin: 0 5px 0 0;
            float: ${!props.isOwnMessage ? 'right' : 'left'};
            `
    } else if (props.isLinkBubble) {
        return `
             align-items: flex-end;
             margin: -20px 6px 0 0;
                 `
    } else if (props.isLocationBubble) {
        return `
             margin: 5px 0 0 10px;
                 `
    } else {
        return `
            position: relative;
            margin: -20px -3px 0 0;
            align-items: flex-end;
            `
    }
}
    }}
}`;
export const Time = styled.span`{ 
    font-style: italic;
}`;
export const StatusMessage: any = styled.span`{ 
        margin: ${(props: { isLastMessage?: boolean }) => props.isLastMessage ? "0 0 6px 0" : "0 0 0 4px"};
        bottom: -2px;
        right: -26px;
        //animation: none !important;
        width: auto !important;
        height: auto !important;
        border: none !important;
        font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;@opacity: 0;
        animation: profile-popup-content 0.1ms forwards;
        &:before {
        ${(props: IBubbleProps) => {
    if (props.isSent) {
        return `
                    content: "\\e937";
                    color: ${props.isActiveThread ? '#fff' : '#a2b0c4'};

                    `
    } else if (props.isDelivered) {
        return `
                    content: "\\e937";
                    color: ${props.isMediaBubble && !props.isCaption || props.isActiveThread ? '#fff' : '#17abf6'};
                    `
    } else if (props.isSeen) {
        return `
                    content: "\\e935";
                    color: ${props.isMediaBubble && !props.isCaption || props.isActiveThread ? '#fff' : '#17abf6'};
                    `
    }
}
    };
          font-size: 10px;
          line-height: 10px;
        }
}`;
export const TooltipContent: any = styled.span`{ 
      display: flex;
      align-items: center;
      justify-content: flex-end;
      opacity: ${(props: ITooltipButton) => props.isMenuPopUpOpen ? "1" : "0"};
      transition-duration: 200ms;
      position: absolute;
      width: 121px;
      top: 2px;
      ${(props: IBubbleProps) => {
    if (props.fileBubble && props.language !== "ar") {
        return `
                    box-shadow: -16px 0 11px 0 #fdfdfd;
                    height: 94%;
                    background-color: #fff;
                    right: 2px;
                    padding:0 10px;
                         `
    }
    if (props.fileBubble && props.language === "ar") {
      return `
                      box-shadow: -16px 0 11px 0 #fdfdfd;
                      height: 94%;
                      background-color: #fff;
                      padding:0 10px;
                           `
    }
    else {
        return `
                    box-shadow: none;
                    background-color: none;
                    height: 52px;
                    right: 12px;
                           `
    }
}
    }    
}`;

export const BubbleContainer = styled.div`{ 
    position: relative;
    line-height: 1.38;
    font-weight: 400;
    color: #000;
    max-width: 72%;
    display: inline-block;
    white-space: pre-wrap;
    border-radius: 6px;
    //background-color: #FCFEFF;
    height: auto;
    min-width: 80px;
    border-width: 1px;
    border-style: solid; 
    .highlight {
        background-color: #cccccc !important;
      }

      .highlight-active {
        background-color: #91daff !important;
      }
    
     @media (max-width: 1180px) {
        max-width: 83%;
     }  
     ${(props: IBubbleProps) => {
    if (!props.isOwnMessage) {
        return `
                    border-color: ${BubbleColor.borderUser};
                    margin: 2px 0 0 auto;
                    padding: ${props.isLinkBubble ? '6px 0' : '5px 9px 6px 9px'};
                    `
    } else {
        return `
                    border-color: ${BubbleColor.borderGuest};
                    margin: 0 0 0 6px;
                    padding: ${props.isLinkBubble ? '6px 0' : '5px 9px 6px 9px'};
                   `
    }
}
    };
     ${(props: IBubbleProps) => {
    if (!props.isMediaBubble || (props.isMediaBubble && props.isCaption)) {
        return `
                    background-color: #FCFEFF;
                    
                    `
    } else {
        return `
                    
                   `
    }
}
    };
     
     ${(props: IBubbleProps) => {
    if (props.fileBubble) {
        return `
                min-width: 400px;
                max-width: 400px;
                padding: 9px 9px 9px 10px;
                &:hover ${Link} {
                             display: inline-block !important;
                              opacity: 1 !important;
                 }
                 
                 &:hover ${TooltipContent} {
                              opacity: 1 !important;
                 }
            `;
    }
    else if (props.imageBubble || props.videoBubble || props.isCaption) {
        return `
                max-width: 400px;
                min-width: 200px;
                width: min-content;
                padding: 0;
                position: relative;
                &:hover ${TooltipContent} {
                              opacity: 1 !important;
                 }
            `;
    }
    else if (props.audioBubble) {
        return `
                 font-size: 12px;
                 color: #7d7c7c;
                 width: 220px;
                 min-height: 63px;
                 padding: 7px 9px 2px 12px;
            `;
    }
    else if (props.isLinkBubble) {
        return `
               max-width: 400px;
            `;
    }
}
    }
     }`;


// Edited
export const EditedMessage = styled.span`{ 
   width: 15px;
   height: 15px;
   margin: 0 -2px 0 0;
   display: flex;
   align-items: flex-end;
   font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
   &:before {
            content: "\\e966";
            color: #a2b0c4;
            font-size: 12px;
          }
}`;
// FileBubble
export const TooltipText: any = styled.div`{ 
       display: inline;
       position: relative;
       margin: 0 0 0 4px;
       &:hover{
         &:after {
         background: #000;
         border-radius: 5px;
         bottom: 44px;
         color: #fff;
         font-weight: 600;
         line-height: 1;
         content: attr(content);
         text-decoration: none;
         padding: 6px 9px 7px;
         font-size: 13px;
         left: 50%;
         transform: translateX(-50%);
         position: absolute;
        } 
         &:before {
          border: solid;
          border-color: #000 transparent;
          border-width: 6px 6px 0 6px;
          bottom: 39px;
          content:"";
          left: 50%;
          transform: translateX(-50%);
          position: absolute;
        }
      }
           
}`;
export const ButtonText = styled.span`{ 
      cursor: pointer;
      color: ${primary.color};
      font-size: 12px;
      transition: all 0.2s ease;
      text-transform: initial;
      margin: 0 6px;

}`;

export const TooltipButton: any = styled.button`{ 
      width: 32px;
      height: 32px;
      border-radius: 6px;
      font-size: 22px;
      padding: 0;
      z-index: 26;
      cursor: pointer;
      position: relative;
      display: inline-block;
      ${(props: IBubbleProps) => {
    if (props.fileBubble) {
        return `     
                     border-style: solid;
                     border-color: #e3e5e6;
                     color: #7C7E90;
                         `
    }
    else {
        return `
                     border:none;
                     color: #fff;
                     background-color: rgba(0,0,0,0.40);
                           `
    }
}
    }   
     
      &:hover{
      ${TooltipText} {
       visibility: visible;
       opacity: 1;
       display:inline-block;
      }
          ${(props: IBubbleProps) => {
    if (props.fileBubble) {
        return `
        color: ${primary.color};
                         `
    }
    else {
        return `
                   color:#fff;
                   background-color: #000;
                           `
    }
}
    }    
      }
      &:before{
          font-size: 30px;
          line-height: 1.1;
          width: 100%;
          display: inline-block;
          ${(props: ITooltipButton) => {
    if (props.reply) {
        return `
                    content: "\\E951";
                         `
    }
    else if (props.forward) {
        return `
                   content: "\\e94f";
                                        `
    }
    else if (props.more) {
        return `
                   content: "\\e952";
                                        `
    }
    else if (props.delete) {
        return `
                   content: "\\e953";
                                        `
    }
}
    }
            }     
}`;
export const SearchText = styled.span`{ 
    -webkit-user-drag: none;
    user-select: text;
    font-size: 15px;
    line-height: 1;
    display: contents;
    color: #272727;
          ${(props: IBubbleProps) => {
    if (props.highlight) {
        return `     
                    background-color: #91daff !important;
                         `
    }
    else {
        return `
                    background-color: #cccccc !important;
                           `
    }
}
    } 
}`;

export const BlobImg = styled.img`{ 
     min-width: 25px;
     border-radius: 50%;
     object-fit: contain;
     user-select: none;
     -webkit-user-drag: none; 
}`;


export const ProgressLoader = styled.div`{ 
             position: absolute;
             left: 50%;
             top: 50%;
             transform: translate(-50%, -50%);
             display: flex;
             align-items: center;
             justify-content: center;
            .loader-content {
              position: relative;
              background-color: rgba(0, 0, 0, 0.40);
              height: 50px;
              width: 50px;
              border-radius: 50%;
              animation: trying-clock 1000ms infinite linear;

              .progress {
                -webkit-transform: rotate(-90deg);
                transform: rotate(-90deg);
              }

              .progress__meter,
              .progress__value {
                fill: none;
              }

              .progress__meter {
                stroke: transparent;
              }

              .progress__value {
                stroke: #fff;
                stroke-linecap: round;
              }
            }

            .cancel {
              &:before {
                content: "\\e921";
              }
            }
            .upload {
              &:before {
                content: "\\e933";
              }
            }
            .download {
              &:before {
                content: "\\e92c";
              }
            }
            .upload, .download, .cancel{
              transform: translate(-50%,-50%);
              position: absolute;
	          left: 50%;
	          top: 50%;
	          speak: none;
	          font-style: normal;
	          font-weight: normal;
	          font-variant: normal;
	          text-transform: none;
	          line-height: 1;
	          -webkit-font-smoothing: antialiased;
	          -moz-osx-font-smoothing: grayscale;
	          font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
	          &:before {
                display: block;
                color: #D1DCEE;
                font-size: 33px;
              }
            }
            .text {
              @include absolute-center-xy();
              color: #ffffff;
              min-width: 40px;
              text-align: center;
            }
}`;


// caption

export const CaptionContent = styled.div`{ 
    
    padding: 5px 9px 6px 9px;
}`;
export const CaptionText = styled.span`{ 
    user-select: text;
    font-size: 15px;
    line-height: 1;
    display: contents;
    color: #272727;
}`;
