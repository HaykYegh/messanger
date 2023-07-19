import * as React from "react";
import styled from 'styled-components';
import {buttons, primary, settingsIcon} from "services/style/variables";


// index//

export const SettingsPopup = styled.div`{
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
    #settings-popup-block {
      opacity: 0;
      transform: scale(0.6);
      animation: popup-scale 0.3s forwards;
    }
  }

  &.close {
    opacity: 1;
    animation: close-popup 0.2s forwards;
    #settings-popup-block {
      opacity: 1;
      transform: scale(1);
      animation: close-popup-scale 0.2s forwards;
    }
  }
 }`;
export const SettingsPopupContainer = styled.div`{
    display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 10px;
  overflow: hidden;
}`;
export const SettingsPopupBlock = styled.div`{
    //min-width: 630px;
    //min-height: 600px;
    //width: 630px;
    //height: 600px;
    //border-radius: 5px;
    background-color: #ffffff;
    opacity: 1;
    display: flex;
    height: 512px;
    box-sizing: border-box;
     @media only screen and (max-width: 760px){
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    }
}`;
export const SettingsMenuBar = styled.div`{
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    box-sizing: border-box;
    border-right: 1px solid #E7E7EC;
    padding: 0 8px 0 8px;
    width: 230px;
    min-width: 230px;
}`;
export const SettingsTitleBlock: any = styled.div`{
    display: flex;
    flex-direction: row;
    width: 100%;
    text-align: center;
    align-items: center;
    color: #373749;
    font-size: 20px;
    font-weight: 700;
    height: 58px;
    //border-top-right-radius: 5px;
    border-bottom-color: #E7E7EC;
    border-bottom-style: solid;
    border-bottom-width: 1px;
    position: relative;
    z-index: 1;
    background-color: ${(props: { backgroundColor: string }) => props.backgroundColor || "inherit"};
    padding: 0 22px;
}`;
export const SettingsPageTitle: any = styled.h2`{
    text-align: center;
    color: #000000;
    font-weight: 600;
    font-size: 18px;
    width: ${(props: { width: string }) => props.width ? props.width : "100%"};
    display: flex;
    justify-content: ${(props: { justify_content: string }) => props.justify_content || "center"};
    user-select: none;
}`;

export const SettingsPageTitleAfterLogin: any = styled.h2`{
    text-align: center;
    color: #333337;
    font-weight: 700;
    margin: 20px 0;
    font-size: 15px;
    width: ${(props: { width: string }) => props.width ? props.width : "100%"};
    display: flex;
    justify-content: ${(props: { justify_content: string }) => props.justify_content || "center"};
}`;

export const SettingsIconClose = styled.span`{
    cursor: pointer;
    color: #000000;
    margin-left: 2px;
    display: inline-block;
    font-family: 'icomoon' !important;
    font-size: 14px;
    &:before {
        content: "\\E995";
    }
}`;

export const SettingsIconBackground = styled.div`{
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    background-color: ${(props: { color?: string }) => props.color };
    width: 24px;
    height: 24px;
    margin-right: 11px;
}`;

export const SettingsContainer = styled.div`{
    list-style-type: none;
    width: 100%;
    margin-top: 11px;
    .icon_pack {
      -webkit-user-drag: none;
      user-select: none;
      display: flex;
      align-items: center;
      cursor: pointer;
      height: 36px;
      width: 100%;
      box-sizing: border-box;
      padding: 0 12px;
      border-radius: 5px;
      &:hover {
        .icon {
          &:before {
            color: #33333B;
          }
        }
      }

      .icon {
        width: auto;
        height: auto;
        display: inline-block;
        background-size: 30px 270px;
        border-radius: 6px;
        margin-right: 18px;
        padding: 5px;
        overflow-x: unset;
        //background-color: #00A2E2;

        &::before {
          font-size: 16px;
          color: #585A69;
        }
      }

      .block-info {
           flex: 1;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: space-between;
        .update-notification{
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${primary.color};
            color: #fff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 13px;
            font-weight: 500;
        }

        .icon_info {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 500;
          text-align: left;
          color: #585A69;
        }
      }
      
      &:not(.icon_pack-active) {
        &:hover {
          .icon_info {
            color: #33333B!important;
          }
        }
      }
      
      &.icon_pack-active {
        .block-info {
          .icon_info {
            font-weight: 700;
          }
        }

        .icon-account {
          &::before {
            color:  ${settingsIcon.account};
          }

          + .block-info {
            .icon_info {
              color:   ${settingsIcon.account};
            }
          }
        }

        .icon-networks {
          &::before {
            color: ${settingsIcon.networks};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.networks};
            }
          }
        }

        .icon-add_credit {
          &::before {
            color: ${settingsIcon.addCredit};
          }

          + .block-info {
            .icon_info {
              color:${settingsIcon.addCredit};
            }
          }
        }
        .icon-chat_settings {
          &::before {
            color: ${settingsIcon.chatSettings};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.chatSettings};
            }
          }
        }

        .icon-privacy {
          &::before {
            color:  ${settingsIcon.privacy};
          }

          + .block-info {
            .icon_info {
              color:  ${settingsIcon.privacy};
            }
          }
        }

        .icon-check_for_updates {
          &::before {
            color:  ${settingsIcon.checkForUpdates};
          }

          + .block-info {
            .icon_info {
              color:  ${settingsIcon.checkForUpdates};
            }
          }
        }

        .icon-sticker_store {
          &::before {
            color: ${settingsIcon.stickerStore};
          }

          + .block-info {
            .icon_info {
              color:${settingsIcon.stickerStore};
            }
          }
        }

        .icon-system_language {
          &::before {
            color: ${settingsIcon.systemLanguage};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.systemLanguage};
            }
          }
        }

        .icon-notifications {
          &::before {
            color: ${settingsIcon.notifications};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.notifications};
            }
          }
        }

        .icon-why_us {
          &::before {
            color: ${settingsIcon.whyUs};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.whyUs};
            }
          }
        }

        .icon-logs {
          &::before {
            color: ${settingsIcon.logs};
          }

          + .block-info {
            .icon_info {
              color: ${settingsIcon.logs};
            }
          }
        }

      }
    }
}`;

export const SettingsPopupContent = styled.div`{
    width: 100%;
    text-align: center;
    padding: 0 0 14px 0;
    background-color: #EFEFF3;
}`;

export const ScrollBar = styled.div`{
    width: 100%;
    position: relative;
    height: ${(props: { height: string }) => props.height || "545px"};
    padding: ${(props: { padding: string }) => props.padding || "20px 30px 0"};
    overflow-y: scroll;
}`;
export const SettingsScrollBar = styled.div`{
    position: relative;
    height: 498px;
    padding: ${(props: { isStickerStore }) => props.isStickerStore ? props.isStickerStore : "20px 30px 0"};
    user-select: ${(props: { userSelect }) => props.userSelect ? props.userSelect : ""};
}`;
export const UserNumber = styled.div`{
    display: flex;
    max-height: 17px;
}`;
export const CopyUserNumberIcon = styled.div`{
    transition: transform 0.1s;
    cursor: pointer;
    user-select: none;
    position: relative;
    bottom: 4px;
    margin-left: 4px;
    max-height: 17px;
    ${(props: { scale: number }) => `transform: scale(${props.scale});`}
}`;
export const TooltipText : any  = styled.div`{  
    
}`;

export const SettingsListBlockContent: any = styled.div`{
    background-color: #FFFFFF;
    border-radius: 5px;
    position: relative;
    overflow-x: hidden;
    & > div {
      padding: 0 !important;
    }
}`;

export const NetworkIdBlock: any = styled.div`{
    cursor: ${(props: { cursor?: string }) => props.cursor || "default"}};
    display: flex;
    align-items: center;
    justify-content: ${(props: { justify_content?: string }) => props.justify_content || "space-between"};
    width: 100%;
    height: 33px;
    background-color: #FFFFFF;
    padding: 0 0 0 15px;
    border-radius: 5px;
}`;

export const SettingsListBlock: any = styled.div`{
    cursor: ${(props: { cursor?: string }) => props.cursor || "default"}};
    display: flex;
    align-items: center;
    justify-content: ${(props: { justify_content?: string }) => props.justify_content || "space-between"};
    width: 100%;
    height: 33px;
    background-color: #FFFFFF;
    border-radius: 5px;
}`;

export const SettingsAccountListBlock: any = styled.div`{
    cursor: ${(props: { cursor?: string }) => props.cursor || "default"}};
    display: flex;
    align-items: center;
    justify-content: ${(props: { justify_content?: string }) => props.justify_content || "space-between"};
    width: 384px;
    height: 50px;
    background-color: #FFFFFF;
    box-sizing: border-box;
    padding: 0 15px;
    margin: 0 auto;
    border-radius: 5px;
}`;
export const SettingsTitle = styled.h3`{
    color: #2D2E3B;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    user-select: ${(props: { user_select?: string }) => props.user_select ? props.user_select : "none"};
    color: ${props => props.color};
    cursor: ${(props: { cursor: string }) => props.cursor ? props.cursor : "default" }
    padding-left: 16px;
    padding-top: 1px;
}`;

export const SettingsPasswordText = styled.h3`{
  font-weight: 400;
  font-size: 12px;
  color: #000000;
  letter-spacing: -0.408px;
  text-transform: capitalize;
  cursor: ${(props: { cursor: string }) => props.cursor ? props.cursor : "default" }
}`;

export const AppNumber = styled.div`{
    color: #000000;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    user-select: ${(props: { user_select?: string }) => props.user_select ? props.user_select : "none"};
    cursor: ${(props: { cursor: string }) => props.cursor ? props.cursor : "default" }
}`;

export const SettingsSmallText = styled.span`{
    color: #A0A0A0;
    font-size: 10px;
    font-weight: 400;
    text-align: left;
    margin-bottom: 4px;
    user-select: ${(props: { user_select?: string }) => props.user_select ? props.user_select : "none"};
    cursor: ${(props: { cursor: string }) => props.cursor ? props.cursor : "default" }
}`;

export const SettingsNumberContainer = styled.div`{
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: start;
}`;

export const SettingsBlockNext = styled.div`{
    display: flex;
    align-items: center;
}`;

export const SettingsNumber = styled.h3`{
    color: #919193;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
}`;
export const SettingsLabelTitle = styled.h4`{
    color: #919193;
    font-size: 12px;
    text-align: left;
    font-weight: 400;
    text-transform: uppercase;
    line-height: 1.38;
    margin: ${(props: { margin?: string }) => props.margin ? "0" : "26px 0 0 0"}};
    padding-left: 15px;
    padding-bottom: 5px;
}`;
export const GroupSettingsLabelTitle = styled.div`{
    display: flex;
    flex-direction: row;
    align-items: center;
    .setting-option{
      display: flex;
      flex-direction: row-reverse;
      font-size: 14px;
      font-weight: 400;
      text-align: left;
      color: #808088;
      &:before{
              //margin: 2px 0 0 0;
              content: "\\E946";
              font-family: "icomoon";
      }
    }
}`;

export const SettingsInfo: any = styled.p`{
    font-weight: 400;
    font-size: 12px;
    line-height: 1.38;
    color: #919193;
    width: 100%;
    text-align: left;
    padding: 5px 0 0 0;
    text-transform: ${(props: { textTransform?: string }) => props.textTransform};
    user-select: ${(props: { userSelect?: string }) => props.userSelect };
}`;

export const SettingsText: any = styled.p`{
    font-weight: 400;
    font-size: 12px;
    line-height: 1.38;
    color: #919193;
    width: 100%;
    text-align: left;
    padding: 5px 0 0 15px;
    text-transform: ${(props: { textTransform?: string }) => props.textTransform};
    user-select: ${(props: { userSelect?: string }) => props.userSelect };
}`;
export const SettingsAccountText: any = styled.p`{
  font-weight: 400;
  font-size: 10px;
  line-height: 22px;
  letter-spacing: -0.408px;
  color: #A6A6A6;
  text-align: center;
  width: 384px;
  margin: 0 auto;
  user-select: ${(props: { userSelect?: string }) => props.userSelect };
}`;
export const SettingsNextIcon = styled.span`{
    font-family: 'icomoon'!important;
    display: inline-block;
    margin-right: 12px;
    color: rgb(124, 126, 144);
    &:before{
    content: "\\e946";
    }
}`;
export const Header = styled.div`{
    background-color: #fff;
    display: flex;
    justify-content: ${(props: { justify_content: string }) => props.justify_content};
    align-items: center;
    position: absolute;
    top: -54px;
    left: 0;
    width: 100%;
    height: 53px;
    border-radius: 5px;
    padding: 0 20px 0 4px;
    z-index: 2;
}`;
export const HeaderButton: any = styled.span`{
    cursor: ${(props: { isDisabled: boolean }) => props.isDisabled ? "default" : "pointer"};
    font-size: 14px;
    width: 66px;
    height: 14px;
    color: ${(props: { isDisabled: boolean }) => props.isDisabled ? "#919193" : "#17abf6"};
    display: flex;
    align-items: center;
    justify-content: ${(props: { justify_content?: string }) => props.justify_content};
    font-weight: ${(props: { fontWeight: string }) => props.fontWeight || "400"};
    img{
      width: 32px;
    }
}`;
export const SwitchButton = styled.label`{
  position: relative;
  margin-right: 12px;
  width: 32px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  input {
    display: block;
    margin: 0;
    background-color: #ffffff;
    position: absolute;
    width: 100%;
    height: 20px;
    z-index: 1;
    cursor: pointer;
    opacity: 0;
  }
  input {
    &:checked {
      + {
        .slider {
          background-color: ${primary.color};

          &::before {
            transform: translateX(12px);
            box-shadow: none;
            background-color: #ffffff;
          }
        }
      }
    }
}
  .slider {
    cursor: pointer;
    display: block;
    right: 0;
    border-radius: 22px;
    height: 20px;
    background-color: #ebebeb;
    transition: 0.3s;

&::before {
        position: absolute;
        content: " ";
        width: 18px;
        height: 18px;
        right: 13px;
        top: 1px;
        border-radius: 50%;
        background-color: #ffffff;
        box-shadow: 0 0 1px 1px #cdcdcd;
        transition: .3s;
    }
}
}`;

export const SettingsListContent = styled.div`{
    position: relative;
    width: 100%;
}`;

export const NetworksContent = styled.div`{
    position: relative;
}`;
export const ClearButton = styled.button`{
    position: absolute;
    top: 1px;
    right: 10px;
    bottom: unset;
    left: unset;
    speak: none;
    font-style: normal;
    font-weight: normal;
    text-transform: none;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    font-family: icomoon, sans-serif !important;
    font-variant: normal;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    background: none;
    padding: 0px;
    &:after {
    content: "";
    color: rgb(144, 156, 180);
    font-size: 15px;
    cursor: pointer;
    position: absolute;
    top: 8px;
    right: 0;
}
}`;
export const NwtworksTextLink = styled.a`{
    display: block;
    font-size: ${(props: { font_size?: string }) => props.font_size ? props.font_size : "12px"}};
    font-weight: 400;
    text-align: left;
    margin: 15px 0;
    width: 100%;
    cursor: pointer;
    padding-left: 15px;
    color: ${primary.color};
}`;
export const ResetNotificationsButton = styled.h3`{
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  left: 13px;
  top: 5px;
  color: #FFFFFF;
  width: 53px;
  height: 24px;
  background: #52B1EB;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  padding: 4px 0 0 0;
  margin: 0 5px 0 0;
  user-select: none;
  transition: all 0.3s ease 0s;
  ${(props: { disabled?: boolean }) => {
    if (props.disabled) {
      return `
               border-color: #47A6E0;
               background: #52B1EB;
               color: #FFFFFF;
                 `
    } else {
      return `
               border-color: #FFFFFF;
               background: rgba(82, 177, 235, 0.5);
               color: #FFFFFF;
               cursor:default;
                 `
    }
  }
  }

}`;
export const InputNetworks = styled.input`{
    width: 100%;
    position: relative;
    height: 30px;
    border: 0;
    color: #28283c;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.38;
    text-align: left;
    &::placeholder{
      color: #C3C3C4;
    }
}`;

export const PasswordInputsContent = styled.div`{
    background-color: #FFFFFF;
    padding: 0 15px 15px 15px;
    border-radius: 8px;
    margin-top: 5px;
}`;

export const PasswordInput = styled.input`{
    border: none;
    border-bottom: ${(props: { isError?: boolean }) => props.isError ? "1px solid #F51815" : "1px solid rgba(199, 206, 216, 0.3)"}};
    color: #28283c;
    font-weight: 400;
    line-height: 1.38;
    font-size: 14px;
    width: 100%;
    padding: 10px 0;
    &::placeholder{
      color: #C3C3C4;
    } 
    &:focus {
        border-bottom: 1px solid ${primary.color};
    }
}`;

export const PasswordContainer = styled.div`{
  margin-top: ${(props: { isAlertShown?: boolean }) => props.isAlertShown ? "24px" : "0"};
  transition: margin 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}`;


export const LanguageSettings = styled.div`{
   .content {
    width: 100%;
    height: 55px;
    min-height: 55px;
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    .info {
      .title {
        font-weight: 400;
        line-height: 16px;
        font-size: 15px;
        color: #000000;
        cursor: pointer;
        padding-bottom: 5px;
      }
      .name {
        font-weight: 400;
        font-size: 12px;
        line-height: 16px;
        text-transform: capitalize;
        color: #8F9CB4;
        text-align: left;
      }
    }
    .language-active {
      padding: 7px 12px 5px 10px;
      font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
      &::before {
        content: "\\e906";
        color: ${primary.color};
        font-size: 24px;
      }
    }
  }
}`;
export const AppUpdate = styled.div`{
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    height: 100%;
}`;
export const UpdateContent = styled.div`{
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
    padding: 10px 0 0 0;
      h2 {
      color: #333333;
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 6px 0;
    }
    p{
    color: #2D2E3B;
    font-size: 12px;
    font-weight: 400;
    text-align: left;
    }
}`;
export const UpdateBlock = styled.div`{
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    width: 100%;
    margin: 0 0 20px 0;
    .logo-block{
    display: flex;
    }
}`;
export const VersionBlock = styled.div`{
    display: flex;
    align-items: flex-start;  
    flex-direction: column;
    margin: 0 0 0 40px;
    & > p {
      span {
        margin-left: 15px;
      }
    }
}`;
export const NewUpdateBlock = styled.div`{
    display: flex;
    cursor: pointer;
   p{
    color: #333337;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.38;
    text-align: right;
   }
   span{
   font-family: 'icomoon'!important;
    display: inline-block;
    color: rgb(124,126,144);
  &:before{
      font-size: 14px;
      content: "\\e946";
  }
   }
}`;
export const UpdateLogo = styled.div`{
  img{
    width: 70px;
  }
}`;
export const UpdateProgress = styled.div`{
  width: 100%;
  .progress-bar{
      height: 6px;
      margin: 0 0 8px;
      border-radius: 4px;

      background-color: #E8E9EC;
      .loading{
        height: 6px;
        border-radius: 4px;
        background-color: #17ABF6;
      }
      .loading-errored{
        background-color: #f61e00;
      }
    }
}`;
export const UpdateProgressBlock = styled.div`{
 display: flex;
 justify-content: space-between;
 align-items: center;
 height: 40px;
 
}`;

export const ReleaseNote = styled.div`{
 position: absolute;
 top: ${(props: { top: string }) => props.top}};
}`;

export const ReleaseNoteTitle = styled.div`{
    color: #2D2E3B;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    margin-bottom: 16px;
}`;

export const ReleaseNoteDescription = styled.div`{
    color: #333337;
    font-size: 12px;
    font-weight: 400;
    text-align: left;
    line-height: 16px;
    white-space: pre-line;
}`;

export const Alert = styled.div`{
    background-color: ${(props: { isErrorMessage?: boolean }) => props.isErrorMessage ? "#F51815" : "#5ECB70"}};
    color: #fff;
    font-size: 14px;
    font-weight: 400;
    line-height: 44px;
    width: 100%;
    left: 0;
    top: ${(props: { isAlertShown?: boolean }) => props.isAlertShown ? "0" : "-44px"};
    transition: top 0.25s cubic-bezier(0.4, 0, 0.6, 1);
    position: absolute;
    overflow: hidden;
    z-index: 0;
}`;

export const CloseButton = styled.span`{
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    position: absolute;
    right: 22px;
    font-family: 'icomoon' !important;
    &:before {
        content: "\\E995";
    }
}`;

export const LogsContainer = styled.div`{
  font-size: 12px;
  height: ${(props: { isAlertShown?: boolean }) => props.isAlertShown ? "calc(100% - 34px)" : "calc(100% - 10px)"};
  overflow-y: scroll;
  padding: 0 5px 0 0;
  margin-top: ${(props: { isAlertShown?: boolean }) => props.isAlertShown ? "24px" : "0"};
  transition: margin 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}`;

export const LogsTable = styled.table`{
  width: 100%;
}`;

export const LogsTableTr = styled.tr`{
  border-spacing: 2px;
}`;

export const LogsTableTd = styled.td`{
  padding: 8px 0 8px 3px;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
}`;

export const LogsButtonsContent = styled.div`{
  padding-right: 0;
  //border-bottom: 1px solid #ddd;
  //vertical-align: middle;
}`;

export const LogsButton = styled.div`{
  font-weight: 400;
  font-size: 11px;
  text-align: center;
  padding: 3px 8px;
  background-color: #fff;
  border-color: #dee5e7 #dee5e7 #d8e1e3;
  box-shadow: 0 1px 1px rgba(90, 90, 90, .1);
  line-height: 1.43;
  border-radius: 4px;
  user-select: none;
  margin: 0 0 0 12px;
  width: 52px;
  float: right;
  cursor: ${(props: { isDisabled?: boolean }) => props.isDisabled ? "default" : "pointer"};
  color: ${(props: { isDisabled?: boolean }) => props.isDisabled ? "#dee5e7" : "#58666e"};
  height: 23px;
  position: relative;
  border-width: 1px;
  border-style: solid;
}`;

export const LogsBbtn = styled.div`{
  float: right;
  cursor: ${(props: { isDisabled?: boolean }) => props.isDisabled ? "default" : "pointer"};
  color: ${(props: { isDisabled?: boolean, color?: string }) => props.isDisabled ? "#dee5e7" : props.color};
  background-color: ${(props: { backgroundColor?: string }) => props.backgroundColor};
  width: 46.38px;
  height: 21px;
  border: 0.875px solid ${(props: { borderColor?: string }) => props.borderColor};
  border-radius: 5.25px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-style: normal;
  font-weight: 500;
  font-size: 10.5px;
  line-height: 12px;
  margin-right: 6px;
}`;

export const SepLine = styled.hr `{
  height: 0.5px;
  width: 100%;
  background: #E6E6E6;
  position: absolute;
  margin-top: 16px;
  margin-left: 15px;
  border: none;
}`

export const SepLineLanguage = styled.hr `{
  height: 0.5px;
  width: 100%;
  background: #E6E6E6;
  position: absolute;
  margin-top: 25px;
  margin-left: 15px;
  border: none;
}`


export const Loader = styled.div`{
  border: 3px solid #ecedef;
  border-top: 3px solid #91939c;
  border-radius: 100%;
  width: 15px;
  height: 15px;
  animation: spin 1s linear infinite;
  left: 16px;
  bottom: 1px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}`;

