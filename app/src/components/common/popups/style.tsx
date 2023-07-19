import * as React from "react";
import styled from 'styled-components';


// index//

export const PopupContent = styled.div`{
 width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 27;
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  &.open {
    opacity: 0;
    animation: profile-popup-content 0.3s forwards;

    .popup-block {
      opacity: 0;
      transform: scale(0.6);
      animation: popup-scale 0.3s forwards;
    }
  }
  &.close {
    opacity: 1;
    animation: close-popup 0.2s forwards;

    .popup-block {
      opacity: 1;
      transform: scale(1);
      animation: close-popup-scale 0.2s forwards;
    }
  }
 }`;
export const PopupBlock = styled.div`{
    min-width: 440px;
    min-height: 650px;
    width: 440px;
    height: 650px;
    background-color: #ffffff;
    border-radius: 7px;
    user-select: none;
    opacity: 1;
    display: flex;
     @media only screen and (max-width: 760px){
    min-width: 100%;
    min-height: 100%;
    width: 100%;
    height: 100%;
    }
 }`;
export const Loader = styled.div`{
      border: 4px solid #ecedef;
      border-top: 4px solid #91939c;
      border-radius: 100%;
      width: 30px;
      height: 30px;
      margin: auto;
      animation: spin 1s linear infinite;
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
 }`;
export const PopupContainer = styled.div`{
      width: 100%;
      position: relative;
      display: flex;
      justify-content: space-between;
      flex-direction: column;
 }`;
export const PopupHeader = styled.div`{
       border-bottom: 1px solid #e2e4eb;
       border: ${props => props.border};
       padding: ${props => props.padding};
 }`;
export const TextBlock = styled.div`{
         height: 56px;
         display: flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         margin: ${props => props.margin};
         border-bottom: ${props => props.border};
          h2 {
            margin: 10px 0 0 0;
            font-size: 15px;
            font-weight: 600;

            span {
              font-weight: 400;
              color: #808088;
              margin: 0 0 0 10px;
            }
          }
          .error-text {
            margin: 3px 0 0 0;
            color: red;
            font-size: 13px;
          }
          .display_none {
            opacity: 0;
            transition: opacity 300ms;
          }
          .display {
            opacity: 1;
            transition: opacity 300ms;
          }
 }`;
export const ContactSearchContainer = styled.div`{
      padding: 0 20px 20px;
 }`;
export const SearchInput = styled.input`{
            align-items: self-start;
            height: auto;
            width: 400px;
            border: 1px solid #D8DBE1;
            border-radius: 6px;
            overflow: auto;
            max-height: 98px;
            padding: 1px 7px;
            &::placeholder {
              color: #8C8A98;
              margin-left: 23px;
              margin-right: 2px;
              position: relative;
              top: 9px;
              -webkit-transform: translateY(-50%);
              -ms-transform: translateY(-50%);
              transform: translateY(-50%);
              box-sizing: border-box;
              border: none;
              font-size: 13px;
              font-weight: 400;
              text-align: left;
              &::after {
                display: block;
                content: "\\e93d";
                color: #8492ab;
                font-size: 20px;
 }`;
export const CreateGroupContainer = styled.div`{
          .enter-group-details {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin: 0 20px 0 0;
            position: relative;
            height: 80px;
            .avatar-image {
              width: 80px;
              height: 80px;
              position: absolute;
              left: 18px;
              top: 0;
              border-radius: 50%;
            }

            .choose-avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              z-index: 8;
              transition: .2s;
              display: flex;
              justify-content: center;
              align-items: center;
              position: absolute;
              left: 58px;
              top: 50%;
              -webkit-transform: translate(-50%, -50%);
              -ms-transform: translate(-50%, -50%);
              transform: translate(-50%, -50%);
              speak: none;
              font-style: normal;
              font-weight: normal;
              font-variant: normal;
              text-transform: none;
              line-height: 1;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              font-family: 'icomoon', sans-serif !important;
              background-color: #E6E8EC;

              &:before {
                content: "\\E968";
                color: #FFFFFF;
                font-size: 36px;
                transition: 0.2s;
              }

              .profile-pic-upload {
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
              }

            }

            .selected-avatar {
              background-color: rgba(0, 0, 0, 0.1);
              //&:before{
              //  content: "";
              //}
              //&:hover{
              //  background-color: rgba(0, 0, 0, 0.1);
              //  &:before{
              //    content: "\\E968";
              //    color: #FFFFFF;
              //    font-size: 36px;
              //    transition: 0.2s;
              //  }
              //}
            }

            .enter-group-name {
              width: 73%;

              input {
                border: none;
                border-bottom: 1px solid #e2e4eb;
                color: #2D2E3B;
                font-weight: 500;
                background-color: transparent;
                font-size: 14px;
                width: 100%;
                padding: 7px 0;

                &::placeholder {
                  color: #8e8e8e;
                  font-weight: 400;
                }
              }
            }

            .invalid-name {
              border-bottom: 1px solid #F51815;
              transition: all 400ms;
            }
          }  
 }`;
export const PopupBody = styled.div`{
        height: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
 }`;
export const ContactsContainerBlock = styled.div`{
        width: 100%;
        flex-grow: 1;
        overflow: auto;
        min-height: 0;
 }`;
export const SendContactBlock = styled.div`{
        .text {
              margin: 20px 20px 8px;
              font-size: 12px;
              font-weight: 400;
              position: relative;
              color: #8e8e8e;
              width: auto;
              text-align: left;
            }
        .contact-name {
              margin: 0 20px 0 58px;
              input {
                border: none;
                border-bottom: 1px solid #e2e4eb;
                color: #2D2E3B;
                font-weight: 500;
                background-color: transparent;
                font-size: 14px;
                width: 100%;
                padding: 7px 0;
              }
            }
        .contact-to-share {
              display: flex;
              justify-content: flex-start;
              flex-direction: row;
              align-items: center;
              width: 100%;
              height: 100%;

              padding: 20px 0 0 20px;
              .info-content {
                height: auto;
                padding: 10px 0 10px 0;
                margin: 0 20px;
                width: 90%;
                border-bottom: 1px solid #e2e4eb;
                .text-block {
                  width: 110px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  .type-of-number {
                    display: block;
                    font-size: 14px;
                    font-weight: 400;
                    height: 13px;
                    color: #17ABF6;
                  }
                  .product-name {
                    display: block;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 16px;
                    text-align: center;
                    width: auto;
                    padding: 0 8px;
                    height: 16px;
                    text-transform: lowercase;
                    margin: 0 0 0 8px;
                    border-radius: 10px;
                    background-color: #17ABF6;
                    color: #FFF;
                  }
                }
                .number-block {
                  font-size: 15px;
                  font-weight: 500;
                  width: 135px;
                  height: 18px;
                  color: #232c31;
                  display: block;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  text-align: left;
                  line-height: 1.3;
                  margin: 5px 0 0 0;
                }
              }

            }
 }`;
export const MembersCount = styled.p`{
    margin: 20px 20px 8px;
    font-size: 12px;
    font-weight: 400;
    position: relative;
    color: #8e8e8e;
    width: auto;
    text-align: left;
    text-transform: uppercase;
 }`;
export const ContactListContainer = styled.ul`{
            overflow-y: auto;
            width: 100%;
            .label-title {
              font-size: 14px;
              line-height: 14px;
              font-weight: 500;
              color: #263238;
              margin: 15px 0 15px 15px;
            }
            li {
              &:last-of-type {
                div {
                  .contact-block {
                    .contact-content {
                      border-bottom: none;
                    }
                  }
                }
              }
            }

            .contact {
              .contact-block {
                transition: opacity 300ms;
                height: 48px;
                margin: 0 20px;
                display: flex;
                justify-content: space-between;
                flex-direction: row;
                align-items: center;
                .no-name_icon, .contact_img, .contact_icon {
                  margin: 0 12px 0 0;

                }

                .contact-content {
                  display: flex;
                  justify-content: space-between;
                  flex-direction: row;
                  align-items: center;
                  width: 100%;
                  height: 100%;
                  border-bottom: 1px solid #e2e4eb;
                  padding: 10px 0;

                  .text-block {
                    .user-info {
                      font-size: 12px;
                      font-weight: 400;
                      position: relative;
                      color: #8e8e8e;
                      width: auto;
                      margin: 0 15px 0 auto;
                      text-align: left;
                    }

                    .user-name, .no-name {
                      font-size: 14px;
                      font-weight: 500;
                      width: 135px;
                      height: 18px;
                      color: #232c31;
                      display: block;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      text-align: left;
                      line-height: 1.3;
                      margin: 0 0 5px 0;
                    }
                  }

                }



                @keyframes multiValueOpen {
                  0% {
                    opacity: 0;
                  }
                  20% {
                    opacity: 0.2;
                  }
                  40% {
                    opacity: 0.4;
                  }
                  60% {
                    opacity: 0.6;

                  }
                  80% {
                    opacity: 0.8;

                  }
                  100% {
                    opacity: 1;
                  }
                }
                @keyframes multiValueRemove {
                  0% {

                    opacity: 1;
                  }
                  100% {
                    opacity: 0;
                    background-color: red;
                  }
                }
              }
            }

            .empty-message {
              display: flex;
              justify-content: center;
              margin: 70px 0 0 0;
              overflow: hidden;
            }

            &::-webkit-scrollbar-track {
              background-color: #17ABF6;
              width: 2px;
            }

          &::-webkit-scrollbar-thumb {
            background-color: #ffffff;
            width: 0;
          }
 }`;
export const PopupFooter = styled.div`{
        background: #fff;
        z-index: 99;
        width: 100%;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        border-top: 1px solid #e2e4eb;

        .footer-content {
          padding: 20px;
          display: flex;
          justify-content: flex-end;

          .btn-cancel {
            margin: 0 14px 0 0;
            padding: 3px 22px;
	        border-radius: 5px;
	        font-size: 13px;
	        font-weight: 600;
	        cursor: pointer;
	        min-width: 30px;
	        border: 1px solid #d3d3d3;
	        color: #333;
	        background: #fff;
	        text-transform: capitalize;
	        user-select: none;
	        &:hover {
	        	color: #000000;
	        	background: #f4f7fc;
	        }
          }

          .btn-next {
            min-width: 85px;
	        padding: 4px 22px;
	        border-radius: 5px;
	        font-size: 13px;
	        font-weight: 700;
	        //border: 1px solid $confirm-button-border;
	        border: none;
	        color: #fff;
	        background: #17ABF6;
	        cursor: pointer;
	        transition: 0.3s;
	        text-transform: capitalize;
	        @include user-select(none);
	        &:hover {
	        	color:#ffffff;
	        	background: #499cd9;
	        }
	        &:active {
	        	background: #0A89CA;
	        }
	        &:disabled {
	        	background: #8bd5fb;
	        	color: #fff;
	        	//border: 1px solid $confirm-button-disabled-border;
	        	cursor: unset;
	        	pointer-events: none;
	        }
	        &.disabled-button {
	        	background: #8bd5fb;
	        	//border: 1px solid $confirm-button-disabled-border;
	        	color: #fff;
	        	cursor: unset;
	        	pointer-events: none;
	        }
        
                  }
                }
 }`;
export const Overlay = styled.div`{
        background: rgba(0, 0, 0, 0.7);
 }`;
export const Select = styled.div`{
    width: 18px;
    height: 18px;
    min-width: 18px;
    margin: 0 12px 0 0;
    border-radius: 50%;
    border: 1px solid #e2e4eb;
${props => props.active &&`
    background:#17ABF6;
    border: 1px solid #fff;
  `}
    &:before {
      content: "";
      display: block;
      width: 8px;
      height: 5px;
      position: relative;
      left: 4px;
      top: 4px;
      border-left: 1px solid #fff;
      border-bottom: 1px solid #fff;
      transform: rotate(-45deg);
    }
 }`;
export const SetTime = styled.div`{
     margin: 45px 0 0 0;
     width: 100%;
     height: auto;
     font-weight: 400;
     font-size: 16px;
     line-height: 16px;
     color: #808088;
     cursor: pointer;
     &:hover {
        color: #17ABF6;
          }
     @include flex();
     @include align-items-center();
     @include justify-content-flex-start();
 }`;


