import * as React from "react";
import styled from 'styled-components';
import { grey, header, primary, rightPanelColors} from "services/style/variables";

interface IContactInfoProps  {
  numbers?: any,
  number?: any,
  threadId?: any,
  online?: boolean,
  disconnected?: boolean,
  error?: boolean,
  bold?: boolean,
  editing?: boolean,
  textRed?: any,
  imageEdit?: any
  canEditAvatar?: any,
  accountSetings?: any,
  primaryColor?: any,
  animatedButton?: any,
  fontSize?: string,
  rightAligned?: any,
  leftAlighned?: any,
}


export const LeftSideIcon = styled.img`{
  width: 15px;
  height: 15px;
  margin: 0 10px 0 0;
  cursor: pointer;
}`

export const ActionButton = styled.span`{
  transition: .3s;
  font-size: 14px;
  line-height: 1.38;
  font-weight: 400;
  cursor: pointer;      
}`
export const PropertyGrey = styled.span`{
  display: block;
  font-size: 14px;
  line-height: 1.38;
  font-weight: 400;
  color: ${grey.color}
`;
export const NextIcon = styled.span`{
  &:before {
    content: "\\e946";
    color: ${header.newIconColor};
    font-size: 16px;
    font-family: 'icomoon';
  }
}`;
export const ContactInfoProperties = styled.div`{
  margin: 0  0 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
}`;
export const InfoBlock = styled.div`{
  height: 100%;
  width: 100%;
 // border-bottom: 1px solid #edf2f9;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
}`;


export const ContactInfoAction = styled.div`{
   width: 100%;
   height: 40px;
   margin: 0 auto;
   display:  flex;
   flex-direction: row;
   justify-content: flex-start;
   align-items: center;
   user-select: none;     
   cursor: pointer;
   & ${ActionButton} {
    color: ${(props: IContactInfoProps) => props.textRed ? '#E92E25' : '' };
   }
   &:hover ${ActionButton} {
      color: ${(props: IContactInfoProps) => props.textRed ? '' : `${primary.color}`};
    }   
  }
}`;

export const NumberType = styled.span`{
  display: block;
  font-size: 13px;
  font-weight: 400;
  height: 13px;
  color: #7C7E90;
  ${(props: IContactInfoProps) => {
  if(Object.keys(props.numbers).length > 1 && props.threadId.includes(props.number)) {
    return `
        color: ${rightPanelColors.blue}
      `
  }
}
}
  }`;

export const ContactType = styled.span`{
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
  border-radius: 3px;
  background-color: #BAC7D1;
  color: #FFF;
}`

export const FavoriteIcon = styled.span`{
  margin: 0 0 0 8px;
  display: flex;
  justify-content: center;
  &:before {
    content: "\\e944";
    color: #BAC7D1;
    font-size: 16px;
    font-family: "icomoon";
  }
}`;
export const NumberTypeWrapper = styled.div`{
  height: auto;
  display: flex;
  flex-direction: row;
  align-items: center;            
}`;

export const PhoneNumber = styled.span`{
  margin: 8px 0 0 0;
  display: block;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 400;
  cursor: pointer;
  user-select: text;
  transition: transform 0.1s;
  position: relative;
  max-width: 120px;
  & img {
    position: absolute;
    top: -5px;
    margin-left: 5px;
    ${(props: { scale: number }) => `transform: scale(${props.scale});`}
  }
  ${(props: IContactInfoProps) => {
  if(Object.keys(props.numbers).length > 1 && props.threadId.includes(props.number)) {
    return` 
        color: "#17ABF6",
        cursor: "pointer"
        `
  }
}
}`;

export const ReatesInfoText = styled.span`{
  font-size: 13px;
  line-height: 1.2;
  font-weight: 400;
  color: ${rightPanelColors.blue};
  cursor: pointer;
}`;

export const RatesInfoWrapper = styled.div`{
  display: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
}`


export const NumberRowWrapper = styled.div`{
  display: flex;
  flex-direction: column;
}`;

export const ContactNumberRow = styled.div`{
  width: 100%;
  height: 58px;
  border-bottom: 1px solid #edf2f9;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  visibility: visible;
  transition: visibility 0.2s linear, opacity 0.2s linear;
}`

export const ContactNameWrap = styled.span`{
  display: block;
  margin-bottom: 5px;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 600;
  text-align: center;
  width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: text;
  cursor: pointer;
}`;

export const ContactStatusInfoWrapper = styled.div`{
  height: 15px;
  ${(props: IContactInfoProps ) => {
  if (props.disconnected) {
    return` 
        visibility: hidden !important
        `
  }
}
}`

export const ContactStatusInfo = styled.div`{
  display: block;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 400;
  color: #7C7E90;
  opacity: 1;
  ${(props: IContactInfoProps) => {
  if (props.online) {
    return` 
        color: $right-panel-blue;
        font-weight: 500;
        `}
}
}`


export const EditContactInput = styled.input`{
  margin: 0;
  border: none;
  border-bottom: 1px solid rgba(199, 206, 216, 0.3);
  background-color: transparent;
  width: 100%;
  height: 40px;
  font-size: 15px;
  font-weight: 400;

  text-align: left;
  padding: 10px 0 0 0;
  
  &:focus {
    border-bottom: 1px solid ${primary.color};
  }

  &::placeholder {
    text-align: left;
    color: ${grey.color};
    font-size: 15px;
    line-height: 1.2;
    font-weight: 400;
  }
  ${(porps: IContactInfoProps) => {
  if(porps.error) {
    return`
      border-bottom: 1px solid #F51815;
      `
  }
}}
}`;

export const EditContactInputWrapper = styled.div`{
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 1;
  margin-top: 20px;
}`;


export const ImageBlockWrapper = styled.div`{
  margin-bottom: 10px;
  margin-top: ${(props: IContactInfoProps) => props.imageEdit? '45px': ''};
}`
export const ImageBlock = styled.div`{
  width: 100%;
  margin-bottom: 10px;
  // pointer-events: ${(props: IContactInfoProps) => !props.canEditAvatar ? 'none': ''};
  height: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  user-select: none;

}`;


export const BlockButton = styled.span`{
  left: ${(props: IContactInfoProps) => !props.rightAligned ? 0 : ""};
  font-size: ${(props: IContactInfoProps) => props.fontSize ? props.fontSize : "13px"};
  line-height: 1.2;  
  cursor: pointer;
  z-index: 8;
  font-weight: ${(props: IContactInfoProps) => props.bold ? 600 : 400};
  color: ${(props: IContactInfoProps) => props.primaryColor? primary.color : ''}}
  visibility: ${(props: IContactInfoProps) => props.animatedButton? "visible": ''};
    ${(props: IContactInfoProps) => {
  if (props.editing) {
    return `
        opacity: 0;
        visibility: hidden;
        z-index: -1;
`    }
}}
${(props: IContactInfoProps) => {
  if (props.rightAligned) {
    return `
      right: 0;
      position: absolute;
      width: fit-content;
`    }
}}
${(props: IContactInfoProps) => {
  if (props.leftAlighned) {
    return`
      left: 0;
      position: absolute;
      width: fit-content;
`    }
}}      
  
}`;


export const InputButtonLabel = styled.label`{    
    display: block;
    margin: 15px 0 0 0;
    border: none;
    border-bottom: 1px solid rgba(199,206,216,0.3);
    background-color: transparent;
    width: 100%;
    height: 40px;
    font-size: 15px;
    font-weight: 400;
    text-align: left;
    padding: 15px 0 0 0;
    color: ${primary.color};
    cursor: pointer;
}`
export const InputButton = styled.input`{
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}`

export const ContactInfoButtonsBlock = styled.div`{
  width: 100%;
  height: auto;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  padding-top: 15px;
}`;

export const EditableContentWrapper = styled.div`{
    width: 100%;
    height: auto;
    position: absolute;    
    visibility: visible;
    left: ${(props: IContactInfoProps) => props.accountSetings ? 0 : ''}
    transition: visibility .2s linear, opacity .2s linear;
    ${(props: IContactInfoProps) => {
  if (!props.editing) {
    return `
        opacity: 0;
        visibility: hidden;
        z-index: -1;
`    }
}}
}`
export const ContactInfoContent = styled.div`{
  width: 100%;
  height: auto;
  padding: 0 22px;
  position: absolute;
  visibility: visible;
  opacity: 1;
  transition: visibility .2s linear, opacity .2s linear;
  z-index: 1;
  ${(props: IContactInfoProps) => {
  if(!props.editing) {
    return `
        opacity: 0;
        visibility: hidden;
        z-index: -1;
        transition: visibility 0s linear, opacity 0s linear;
`    }
}}
}`;

export const ContactInfoRight = styled.div`{
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  user-select: none;
  display: flex;
  flex-direction: column;  
}`;
