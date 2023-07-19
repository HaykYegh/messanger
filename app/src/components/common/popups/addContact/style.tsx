import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";


interface IAddContact {
  cancel?: boolean;
  add?: boolean;
  isDisabled?: boolean;
  fontWeight?: string;
  justify_content?: string;
  margin?: string;
  isValid?: string;
  imgVisibility?: string;
  primary?: boolean,
  hasBorder?: boolean,
  paddingRight?: boolean,
  overflowScroll?: boolean,
  hasMarginTop?: boolean,
  fadeOut?: boolean,
  value?: string,
}

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

export const ValidError = styled.span`{
    color: #da2626;
    font-size: 12px;
    font-style: italic;
}`;


export const PopupBlock = styled.div`{
    width: 350px;
    max-height: 434px;
    background-color: #ffffff;
    border-radius: 5px;
    user-select: none;
    opacity: 1;
    display: flex;
 }`;

export const PopupContainer = styled.div`{
    width: 100%;
    position: relative;
    display: flex;     
    justify-content: space-between;
    flex-direction: column;
 }`;

export const PopupHeader = styled.div`{
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 55px;
    border-radius: 5px 5px 0 0;
    padding: 0 20px;
    border-bottom: 1px solid #E5E7EA;
 }`;

export const Title: any = styled.h2`{
    text-align: center;
    color: #333337;
    font-weight: 700;
    font-size: 15px;
    line-height: 18px;
    width: 100%;
    display: flex;
    justify-content: ${(props: IAddContact) => props.justify_content || "center"};
}`;

export const Space = styled.h4`{
    margin: ${(props: IAddContact ) => props.margin || "26px 0 0 0"}};
}`;

export const PopupBody: any = styled.div`{
    //height: 321px;
     margin-top: ${(props: IAddContact) => props.hasMarginTop ? "26px" : ''};
    max-height: 282px;    
    padding: 0 29px;
    overflow-y: ${(props: IAddContact) => props.overflowScroll ? 'scroll' : ''};
    
    &::-webkit-scrollbar {
     -webkit-appearance: none;
    }
    
    &::-webkit-scrollbar:vertical {
      width: 11px;
    }
    
    &::-webkit-scrollbar:horizontal {
      height: 11px;
    }
    
    &::-webkit-scrollbar-thumb {
     border-radius: 8px;
     border: 2px solid #EDEFF4;
      background-color: rgba(0, 0, 0, .2);
    }
    
    &::-webkit-scrollbar-track {
      background-color: #fff;
      border-radius: 8px;
    }
}`;


export const NameBlock: any = styled.div`{
    display: flex;         
    flex-direction: column;
    width: 100%;
    input{
      min-height: 40px;
      border: none;
      padding: 7px 0;
      border-bottom: 1px solid #E5E7EA;
      color: #333337;
      background-color: transparent;
      font-size: 14px;
      font-weight: 300;
      line-height: 25px;
      caret-color: ${primary.color};
      &::placeholder {
              color: #C3C3C4;
              font-size: 14px;
              font-weight: 400;
              line-height: 17px;
              user-select: none
            }
      &:focus {
        border-bottom: 1px solid ${primary.color};
    }
    }
}`;

export const ContactNumber: any = styled.div`{
    margin-top: ${(props: IAddContact) => props.hasMarginTop ? "4px" : ''};
    display: flex;
    flex-direction: column;
    width: 100%;        
    
    .list-item-appear {
    height: 0;
    }

    .list-item-appear.list-item-appear-active {      
      height: 40px;
      transition: opacity .3s ease-in, height .3s ease-in;
    }
    
    .list-item-enter {
      height: 0px;
    }
    
    .list-item-enter.list-item-enter-active {
      height: 40px;
      transition: opacity 500ms ease-out, height 300ms ease-out;      
    } 
    
    .list-item-leave {
      height: 40px;
    }
    
    .list-item-leave.list-item-leave-active {
      opacity: 0.01;
      height: 0;      
       div {
        opacity: 0;
        transition:  ease-in, opacity 100ms ease-in;        
        span {
        opacity: 0;
        transition:  ease-in, opacity 100ms ease-in;
      }
      }
       input {
        height: 0;
        opacity: 0;
        transition: height 300ms ease-in, opacity 100ms ease-in;
      }
      transition: opacity 100ms ease-in, height 300ms ease-in;
    }
    
}`;
export const IconLabelWrapper = styled.div`{
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  position: absolute;
}`;

export const Number: any = styled.div`{
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 40px;
   img{
    width: 13px;
    visibility: ${(props: IAddContact ) => props.imgVisibility};
    }
}`;

export const Input: any = styled.input`{
    border: none;
    padding: 5px 0 5px 25px;
    color: #333337;
    background-color: transparent;
    font-size: 14px;
    font-weight: 300;
    line-height: 24px;
    caret-color: ${primary.color};
    width: 100%;
    border-bottom: ${(props: IAddContact) => (props.isValid && props.value) ? "1px solid #99D38E" : props.value ? "1px solid #F51815" : "1px solid #E5E7EA"};

    &:focus {
      border-bottom: ${(props: IAddContact) => (props.isValid && props.value) ? "1px solid #99D38E" : props.value ? "1px solid #F51815" : `1px solid ${primary.color}`};
    }

    &:hover ${Number} {
        border-bottom: 1px solid ${primary.color};
    };

    &::placeholder {
        color: #C3C3C4;
        font-size: 14px;
        font-weight: 400;
        line-height: 17px;
        user-select: none;
    };
    img {
    cursor: pointer;
    }
}`;


export const Label: any = styled.div`{
    color: ${primary.color};
    font-size: 13px;
    font-weight: 400;
    line-height: 17px;
    // width: 132px;
    text-align: left;
    cursor: pointer;
    span{
      padding-right: 5px;
    }
    img{
      width: 10px;
      height: 10px;
      visibility: visible;
    }
}`;

export const GreyTextBar = styled.div`{
    margin-top: ${(props: IAddContact) => props.hasMarginTop ? "26px" : ''};
    color: #919193;
    font-size: 12px;
    font-weight: 400;
    //margin-bottom: 10px;
}`

export const FormFooterContainer = styled.div`{
  width: 100%;
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  align-items: center;
  padding: 0 29px 19px 29px;
  margin-top: 26px;
}`;

export const FormFooterButton = styled.button`{
  width: 85px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  font-size: 13px;
  align-items: center;
  background-color: ${(props:IAddContact) => props.primary ? `${primary.color}`: ''};
  color: ${(props: IAddContact) => props.primary ? '#FFFFFF': '#606060'};
  border: ${(props: IAddContact) => props.hasBorder ? '1px solid #E5E7EA' : ''};
  margin-right: ${(props: IAddContact) => props.paddingRight ? '12px': ''};
  cursor: ${(props: IAddContact ) => props.isDisabled ? "no-drop" : "pointer"};
}`

export const CancelButton = styled.button`{

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
}`


export const CreateButton = styled.button`{
	        cursor: pointer;
	        transition: 0.3s;
	        color:#ffffff;
            background: rgb(23, 171, 246);
            padding: 3px 22px;
	        border-radius: 5px;
	        font-size: 13px;
	        font-weight: 600;
	        cursor: pointer;
	        min-width: 30px;
	        border: 1px solid #d3d3d3;
	        text-transform: capitalize;
	        user-select: none;
	        &:hover {
	        	color:#ffffff;
	        	background: rgb(73, 156, 217);
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
        
                  
}`
