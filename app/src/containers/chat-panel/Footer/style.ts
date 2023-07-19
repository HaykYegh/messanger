import styled from 'styled-components';
import {contactList} from "services/style/variables";

export const VideoWrapper = styled.div`{
    & > .video-js { 
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }
}`;

export const JoinConference = styled.div`{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  border-bottom: 1px solid #edf2f9;
  background-color: #FDFEFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  box-shadow: 0px 0px 10px #edf2f9;
  padding: 0 20px;
  z-index: 1;
}`;

export const ParticipantsInfo = styled.div`{
  h1 {
    line-height: 1.38;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 200px;
  }
  
  span {
    font-size: 12px;
    line-height: 16px;
    font-weight: 400;
    margin-top: 4px;
    color: #6c6f82;
  }
}`;

// export const JoinButton = styled.button`{
//   text-transform: uppercase;
//   padding: 5px 10px;
//   font-size: 14px;
//   cursor: pointer;
//   background-color: #259fe6;
//   border: 1px solid #D8DBE1;
//   color: white;
//   border-radius: 6px;
// }`

export const JoinButton = styled.button`{
  //position: absolute;
  //right: 10px;
  width: 53px;
  height: 24px;
  border-radius: 17px;
  cursor: pointer;
  background-color: ${contactList.listColorActive};
  box-sizing: border-box;
  outline: unset;
  font-size: 12px;
  color: white;
  text-transform: uppercase;
  border: 0px solid #47A6E0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont;
  font-weight: 700;
  transition: border 0.125s linear;

  &:hover {
    border: 1px solid #47A6E0;
  }
}`
