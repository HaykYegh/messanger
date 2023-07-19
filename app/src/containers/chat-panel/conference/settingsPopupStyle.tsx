import {leftSideBar, primary} from "services/style/variables";
import styled from "styled-components";

export const ConferenceOptionsOvelay = styled.div`{
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
}`;

export const ConferenceOptionsContent = styled.div`{
  min-width: 440px;
  min-height: 650px;
  width: 440px;
  height: 650px;
  background-color: #ffffff;
  border-radius: 7px;
  user-select: none;
  opacity: 1;
  display: flex;
  
  & h5 {
    margin: 8px 0 0 20px;
  }
  
  & hr {
    width: 100%;
    margin: 0;
  }
  
  & .search-container .content {
    padding: 0 20px 14px;
  }
}`;

export const ConferenceAPContent = styled.div`{
  max-width: 90%;
  max-height: 90%;
  width: 307px;
  height: 121px;
  background-color: #ffffff;
  border-radius: 7px;
  user-select: none;
  opacity: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  & h4 {
    margin: 8px 0 0;
    text-align: center;
  }
  
  & p {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
  
  & button {
    border: none;
    display: flex;
    width: 33px;
    height: 27px;
    text-align: center;
    font-size: 15px;
    cursor: pointer;
    color: ${primary.color};
  }
}`;

export const ConferenceOptionsContainer = styled.div`{
  width: 100%;
  position: relative;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
}`;

export const MembersContainer = styled.div`{
  position: absolute;
  background: #FFFFFF;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}`;


export const ConferenceOptionsHeader = styled.div`{
  padding: 0 20px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 56px;
}`;

export const ConferenceTextBlock = styled.div`{
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-bottom: 1px solid #e2e4eb;
}`

export const ContactsTextBlock = styled.div`{
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 56px;
  h2 {
    margin: 10px 0 0 0;
    font-size: 15px;
    font-weight: 600;
  }
  span {
    font-weight: 400;
    color: #808088;
    margin: 0 0 0 10px;
  }
  .display_none {
    opacity: 0;
    transition: opacity 300ms;
  }
  .error-text {
    margin: 3px 0 0 0;
    color: red;
    font-size: 13px;
  }
}`

export const ContactSearchCotainer = styled.div`{
  margin-bottom: 15px;
}`

export const ConferenceSearch = styled.div`{
  padding: 0 20px 20px;
}`

export const HeaderItem = styled.div`{
  display: flex;
  justify-content: center;
  align-items: center;
  &.middle{
    width: 100%;
    flex: 1;
    h2 {
      font-size: 15px;
      font-weight: 600;
    }
    
    span {
      font-weight: 400;
      color: #8E8E8E;
      margin: 0 0 0 10px;
    }
  }
  & button {
    color: #089AE6;
     font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    cursor: pointer;
    padding: 0;
    background: unset;
    border: unset;
    outline: unset;
  }
}`;

export const ConferenceOptionsBody = styled.div`{
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  
  ul {
    padding: 20px;
    li {
      min-height: 57px;
      .contact {
        height: 100%;
        .contact-block {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          .contact-content {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            align-items: center;
            width: 100%;
            height: 100%;
            border-bottom: 1px solid #e2e4eb;
            padding: 10px 0;
            min-height: 57px;
            
            .text-block {
              .user-name {
                font-weight: 500;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0.14px;
                color: #252C31;
              }
              .user-info {
                font-weight: 500;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0.14px;
                color: #8E8E8E;
              }
            }

            .select {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 1px solid #e2e4eb;

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
            }

            .isSelected {
              background: #00A2FF;
              border: 1px solid #fff;
            }
          }
        }
      }
    }
  }
}`;

export const ConferenceOptionsContBlock = styled.div`{
  width: 100%;
  flex-grow: 1;
  overflow: auto;
  min-height: 0;
}`;

export const CallStatusMembers = styled.div`{
  padding: 10px 20px;
  font-size: 13px;
  color: #089AE6;
}`;

export const ConferenceOptionsMemberContent = styled.div`{
  transition: opacity 300ms;
  height: 48px;
  margin: 0 20px;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
}`;

export const MemberContentInfo = styled.div`{
  position: relative;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;
  border-bottom: 1px solid #e2e4eb;
  padding: 4px 0;
  cursor: pointer;
  & button {
    background: unset;
    color: white;
    border: unset;
    outline: unset;
    font-size: 15px;
    cursor: pointer;
    padding: 0;
  }
}`;

export const TextBlock = styled.div`{
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
}`;

export const UserName = styled.div`{
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0.14px;
  color: #252C31;
}`;

export const UserInfo = styled.div`{
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.14px;
  color: #8E8E8E;
}`;

export const ConferenceOptionsFooter = styled.div`{
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e2e4eb;
}`;

export const FooterItem = styled.div`{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 10px;
  
  & button {
    color: #089AE6;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    cursor: pointer;
    padding: 0;
    background: unset;
    border: unset;
    outline: unset;
  }
  
}`;
