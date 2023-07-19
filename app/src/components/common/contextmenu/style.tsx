import * as React from "react";
import styled from 'styled-components';
import {primary} from "services/style/variables";

interface IMenuPopUp {
    menuPopup?: boolean;
    fileBubble?: boolean;
}

export const ContextMenuPopUp = styled.div`{
          box-shadow: 0 2px 20px 3px rgba(0, 0, 0, 0.1);
          display: none;
          position: absolute;
          top: 55px;
          right: 5px;
          opacity: 0;
          transform: scale(0);
          min-width: max-content;
          height: auto;
          background-color: #ffffff;
          border-radius: 6px;
          ${(props: (IMenuPopUp)) => {
                if (props.menuPopup) {
                    return `
                    display: block;
                    opacity: 1;
                    transform: scale(1);
                    z-index: 26;`
                }
          }}
      
          }`;
export const ButtonItem = styled.button`{
    cursor: pointer;
    font-weight: 400;
    font-size: 14px;
    text-decoration: none;
    border: none;
    background-color: transparent;
    width: 100%;
    text-align: left;
}`;

export const PopUpList = styled.ul`{
    padding: 6px 0;
    height: 100%;
    opacity: 1;
}`;
export const ListItem = styled.li`{
   cursor: pointer;
   padding: 2px 21px 1px;
   &:hover {
   background-color: ${primary.color};
   }
   &:hover ${ButtonItem} {
   color: #ffffff;
   }
}`;
