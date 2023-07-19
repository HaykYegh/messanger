import styled from 'styled-components';
import {MESSAGES_BADGE_LIMIT} from "configs/constants";

export const ChatSvgContent = styled.span`
  ${props => {
    const unreadMessageCount: any = props.unreadMessagesCount;
    const isBiggest: boolean = unreadMessageCount === `${MESSAGES_BADGE_LIMIT}+`;
    
    if (unreadMessageCount) {
      return `
        &:after {
          content: "${unreadMessageCount}";
          display: block;
          position: absolute;
          top: 13px;
          left: ${isBiggest ? '25px' : '32px'};
          width: 14px;
          height: 14px;
          padding: 0 5px;
          border-radius: 30px;
          background-color: #FF4D4D;
          color: #ffffff;
          font-size: 10px;
          font-weight: bolder;
          line-height: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: system-ui, -apple-system, BlinkMacSystemFont !important;
        }
      `;
    }
  }}
`;
