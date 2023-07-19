import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";


// index//

export const App = styled.div`{
      width: 100%;
    height: 100%;
    overflow-x: hidden;
    display: flex;
    @media only screen and (max-width: 760px){
    flex-direction: column-reverse;
    }
}`;
export const AppMain = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}`;
export const UserContent = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: hidden;
}`;


export const AppContent = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow-x: hidden;
}`;

export const UserChatContainer = styled.div`{
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 100%;
}`;
export const ChatContainer = styled.div`{
    width: auto;
    @media only screen and (max-width: 760px){
        width: 0%;
    }
}`;
export const LoadingPage = styled.div`{
    width: ${(props: {width: string}) => props.width ? props.width : "100%"};
    height: ${(props: {height: string}) => props.height ? props.height : "100%"};
    background-color: ${(props: {backgroundColor: string}) => props.backgroundColor ? props.backgroundColor : "#fff"};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column; 
    right: ${(props: {right: string}) => props.right ? props.right : "0"};
    top: ${(props: {top: string}) => props.top ? props.top : "0"};
    position: ${(props: {position: string}) => props.position ? props.position : "initial"}
    }`;

export const Loader = styled.div`{
  font-size: 10px;
  margin: 0 auto;
  text-indent: -9999em;
  width: ${(props: {width: string}) => props.width || "60px"};
  height: ${(props: {height: string}) => props.height || "60px"};
  border-radius: 50%;
  background: ${(props: { circleColor: string }) => props.circleColor ? props.circleColor : `linear-gradient(to right, ${primary.color} 10%, rgba(255,255,255, 0) 42%)`};
  position: relative;
  animation: load3 1.4s infinite linear;
  transform: translateZ(0);
  &:before {
    width: 50%;
    height: 50%;
    background: ${(props: { circleColor: string }) => props.circleColor ? props.circleColor : '#1FA6FA'};
    border-radius: 100% 0 0 0;
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    }
  &::after {
        background: ${(props: {background: string}) => props.background ? props.background : "#fff"};
        width: 75%;
        height: 75%;
        border-radius: 50%;
        content: '';
        margin: auto;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
  
}
@-webkit-keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}`;

export const TextLoading = styled.p`{
    font-size: 18px;
    font-weight: 400;
    color: #263238;
    user-select: none;
    margin: 20px 0 0 0;
}`;

