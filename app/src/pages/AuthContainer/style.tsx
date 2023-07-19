import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";
import {buttons} from "services/style/variables";
import {resolveAny} from "dns";
import {APPLICATION} from "configs/constants";

// index//

interface ILoginProps {
    isInvalidUser?: boolean;
    width?: string;
    height?: string;
    minHeight?: string;
}
export const Logo = styled.div`{
    width: 81px;
    height: 30px;
}`;

export const BoldText = styled.p `{
    width: auto;
    height: auto;
    font-size: ${(props: {fontSize: string}) => props.fontSize || "18px"};
    font-weight: 600;
    color: #202123;
    margin-bottom: ${(props: {showAppNumber: boolean}) => props.showAppNumber ? "16px" : "25px"};
    text-align: center;
    display: ${(props: {display: string}) => props.display || "inherit"};
}`;

export const DescriptionText = styled.div `{
    width: auto;
    height: auto;
    padding-bottom: ${(props: {padding: string}) => props.padding || "0px"}
    text-align: center;
    display: block;
    font-size: ${(props: {fontSize: string}) => props.fontSize || "15px"};
    font-weight: 400;
    color: #999999;
    margin-bottom: ${(props: {marginBottom: string}) => props.marginBottom || "0px"};
    line-height: 1.5;
}`;

export const PhoneDescriptionText = styled.div `{
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    line-height: 18px;
    text-align: center;
    color: #000000;
    margin-bottom: 13px;
}`;

export const LoginBackground = styled.div`{
      width: 100%;
      height: 100%;
      background-color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
}`;
export const LoginContent = styled.div`{
      width: ${(props: ILoginProps) => props.width};
      min-height: ${(props: ILoginProps) => props.minHeight};
      height: ${(props: ILoginProps) => props.height};
      border: ${(props: ILoginProps) => props.isInvalidUser ? '' : '1px solid #DEDEDE'};
      background-color: ${(props: ILoginProps) => props.isInvalidUser ? '#000000;' : ''};
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      padding: 0 41px 0 41px;
      position: relative;
  }`;
export const ContentBlock = styled.div`{
    width: ${(props: ILoginProps) => props.width};
    min-height: ${(props: ILoginProps) => props.minHeight};
    height: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}`;

export const BackButton = styled.span`{
  color: #FFFFFF;
  // font-family: SFProText;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: -0.49px;
  // line-height: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  margin-left: 26px;
  margin-top: 23px;
  span {
  margin-left: 6px;
  };
  cursor: pointer;
  
}`

export const AttentionSign = styled.span`{
  color: #FFFFFF;
  // font-family: SFProText;
  font-size: 25px;
  font-weight: 500;
  letter-spacing: -0.62px;
  line-height: 30px;
  // width: 351px;
  text-align: center;
  margin-top: 20px;
}`;

export const BackButtonIcon = styled.img`{
    height: 18px;
}`;

export const LockIcon = styled.img`{
    height: 71px; 
    margin-top: 35px; 
    margin-bottom: 17px;
}`;

export const EmailNote = styled.span`{
  color: #FFFFFF;
  // font-family: SFProText;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: -0.49px;
  // line-height: 24px;
  // width: 393px;
  text-align: center;
}`;

export const CheckIcon = styled.img`{
    height: 48px;
    margin-top: 30px;
    margin-bottom: 9px;
}`;

export const JalaExclusiveText = styled.span`{
  color: #8F8F8F;
  // font-family: SFProText;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: -0.49px;
  //line-height: 24px;
  //width: 274px;
  text-align: center;
}`;

export const JalaLogo = styled.img`{
    height: 43px;
    margin-top: 20px;    
}`;
export const ContentHeader = styled.div`{
    position: absolute;
    top: 0;
    // height: 10px;
    // background-color: red;
    z-index: 10;
    width: 100%;
    display: flex;
    justify-content: flex-start    
}
`;


export const LoginType: any = styled.div`{
    font-size: 14px;
    font-weight: 500;
    color: #4AB8F5;
    cursor: pointer;
    margin-top: 10px;
}`;

export const LoginBlock = styled.div`
    width: 100%;
    padding: 0 40px;
    height: ${props => props.size};
`;
export const ErrorMessage: any = styled.span`
    color: #F51815;
    font-size: 13px;
    font-weight: 400;
    padding-top: 11px;
    display: block;
    text-align: center;
    position: relative;
    width: 100%;
    height: ${(props: {height: string}) => props.height ? props.height : "auto"};
`;
export const Content = styled.div`
  width: 100%;
  margin-bottom: 24px;
  margin-top: ${(props: {whyApp: boolean}) => props.whyApp ? "0" : "28px"};
`;

export const QrContent = styled.div`
  width: 100%;
`;

export const Block = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
`;
export const AppNumber = styled.div`
    font-style: normal;
    font-weight: 500;
    font-size: 25px;
    line-height: 30px;
    text-align: center;
    color: #12B0FA;
`
export const NumberDescriptionText = styled.div`
 font-style: normal;
 font-weight: normal;
 font-size: 15px;
 line-height: 18px;
 text-align: center;
 padding: 11px;
`
export const BackButtonN = styled.button`
    position: absolute;
    top: 0;
    cursor: pointer;
    border: none;
    font-size: 15px;
    color: #3AB4F4;
    transform: translateX(-100%);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
`
export const BackIcon = styled.span`
    font-size: 50px;
    line-height: 0;
    height: 20px;
    display: inline-block;
    width: 20px;
`
export const PhoneNumberBlock = styled.div`
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    height: 51px;
    width: 100%;
    border-bottom: 1px solid rgba(199,206,216,0.5);
`;

// buttons//${primary.color}

export const Button = styled.button`
    background-color: ${(props: {disabled: boolean}) => props.disabled ? buttons.confirmButtonDisabledBg : buttons.confirmButtonBg};
    color: ${(props: {disabled: boolean}) => props.disabled ? "#ffffff" : "#FFFFFF"};
    margin-bottom: ${(props: {marginBottom: string}) => props.marginBottom || "0"};
    width: 100%;
    padding: 9px;
    text-align: center;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2ms linear;
    margin-top: 42px;
    user-select: none;
`;
export const LinkButton = styled.p`{
    width: 100%;
    text-align: center;
    user-select: none;

    font-size: 15px;
    font-weight: 400;
    color:  ${primary.color};
    cursor: pointer;
    margin-top: ${(props: {marginTop: string}) => props.marginTop || "0"};
    margin-bottom: ${(props: {marginBottom: string}) => props.marginBottom || "0"};
    line-height: ${(props: {lineHeight: string}) => props.lineHeight || "unset"};
  }`;
export const MailgoButton = styled.a`{
    width: 100%;
    text-align: center;
    user-select: none;

    font-size: 15px;
    font-weight: 400;
    color:  ${primary.color};
    cursor: pointer;
    margin-bottom: ${(props: {marginBottom: string}) => props.marginBottom || "0"};
    line-height: ${(props: {lineHeight: string}) => props.lineHeight || "unset"};
  }`;
export const PinInputBlock = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 36px;
    width: 200px;
    position: relative;
    margin-bottom: 45px;
`;

// input//

export const InputContent = styled.div`
    display: flex;
    position: relative;
    width: 100%;
    margin-bottom: ${(props: {marginBottom: string}) => props.marginBottom ? props.marginBottom : "45px"};
    height: ${(props: {height: string}) => props.height ? props.height : "50px"};
    border-bottom: ${(props: {isErrorMessage: boolean}) => props.isErrorMessage ? "1px solid #F51815" : "1px solid rgba(199,206,216,0.5)"};
    .content-loader {
        top: 13px;
    }
`;
export const Input: any = styled.input`
    width: ${(props: {width: string}) => props.width || "100%"};
    font-size: 15px;
    font-weight: 500;
    color: black;
    border: none;
    text-align: ${props => props.textAlign};
    padding: ${props => props.padding};
    &::placeholder {
        color: #999999
    }

`;
export const PhoneCode = styled.span`
    border: none;
    font-size: 15px;
    line-height: 50px;
    margin: 0 5px 0 0;
    color: #000;
    font-weight: 500;
    padding: 0 0 0 5px;
`;
export const PinInput = styled.input`
    width: 140px;
    height: 35px;
    padding: 0 0 0 9px;
    text-align: left;
    border: 0;
    background-image: linear-gradient(to left, #dadada 70%, rgba(255, 255, 255, 0) 0%);
    background-position: bottom;
    background-size: 30px 1px;
    background-repeat: repeat-x;
    background-position-x: 25px;
    letter-spacing: 19px;
    font-weight: 700;
    font-size: 20px;
    margin: 0 0 0 25px;
    position: relative;
    caret-color:  ${primary.color};
    color:  ${primary.color};
`;
export const SpanHidden = styled.span`{
    position: absolute;
    right: 9px;
    bottom: 0;
    width: 30px;
    height: 30px;
    background-color: #FFFFFF;
  }`;
//text//
export const Title = styled.h2`
    width: 100%;
    font-weight: 300;
    font-size: 22px;
    margin: 10px 0 0 0;
    line-height: 1.42857;
    text-align: center;
    user-select: none;
`;
export const Text = styled.p`
    width: 100%;
    font-weight: 400;
    font-size: 15px;
    line-height: 1.42857;
    text-align: center;
    user-select: none;
    span {
        font-weight: 700;
    }
`;


///profile///
export const ProfileInfo = styled.div`
    flex-direction: row;
    height: auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 82px;
`;

export const IconUser = styled.span`
    width: 100%;
    height: 100%;
    z-index: 8;
    cursor: pointer;
    display: flex;
    align-items: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    input{
        width: 100%;
        height: 100%;
        border: none;
        border-bottom: 1px solid rgba(144, 155, 180, 0.34);
        font-weight: 700;
        line-height: 14px;
        text-align: center;
        padding: 0 33px;
        opacity: 0;
        outline: none;
        cursor: pointer;
    }
`;
export const UserNameContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 20px;
    width: 100%;
`;

export const AvatarImage = styled.img`{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: contain;
    user-drag: none;
    user-select: none;
}`;

export const AvatarNoImage = styled.span`{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #e9ebee;
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    font-family: 'icomoon', sans-serif !important;
    display: flex;
    align-items: center;
    justify-content: center;
    &:after {
         content: '\\E947';
         color: #ffffff;
         font-size: 28px;
         display: block;
     }
}`;

export const AvatarName = styled.span`{
    position: relative;
    width:  100%;
    height:  100%;
    border-radius: 50%;
    background-color: #EEF3FA;
    display: flex;
    justify-content: center;
    align-items: center;
    span{
    font-size: 16px;
    line-height: 19px;
    font-weight: 700;
    text-transform: uppercase;
    text-align: left;
    }
}`;

export const AvatarSize = styled.div`{
    width: ${(props: {width: string}) => props.width || "38px"};
    height: ${(props: {height: string}) => props.height || "38px"};
    min-width: 38px;
    border-radius: 50%;
    position: relative;
}`;

export const UserImage = styled.div`
    margin: 10px 0 0 0;
    position: relative;
    background-color: ${buttons.confirmButtonBg};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    span{
        background-color: initial;
    }
`;
