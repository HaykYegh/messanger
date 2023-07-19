import * as React from "react";
import styled from 'styled-components';
import {contactList, primaryColor} from "services/style/variables";


//contact block///

interface IContactsSidebarProps {
    active?: boolean;
}

/////////////////contact block//////////
export const AllContacts = styled.div`{
    overflow: auto;
    overflow-x: hidden;
    width: 100%;
    margin: 10px 0 0 0;
    height: calc(100% - 106px);
}`;

export const ContactsContainer = styled.ul`{
    list-style-type: none;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    padding: 0;
}`;

export const ContactListBlock = styled.li`{
    max-height: 48px;
    height: 48px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;   
    ${(props: IContactsSidebarProps) => props.active && `
        background-color: ${contactList.listColorActive};
        cursor: default !important;
        div:last-child {
            span {
                color: #fff;
            }
        }
    `}
}`;

export const ContactInfo = styled.div`{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}`;

export const ContactName = styled.span`{
    max-height: 48px;
    font-size: 0.92rem;
    font-weight: 500;
    width: 250px;
    height: 18px;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
}`;

export const ContactFavoritesIcon = styled.span`{
    position: relative;
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 50%;
    margin: 0 12px;
    background-color: #F5F5F7;
    display: flex;
    justify-content: center;
    align-items: center;
    a {
        color: #6c6f82;
        font-size: 24px;
        font-family: 'icomoon' !important;
        &::before{
            content: "\\E91D";
        }
    }
}`;

export const NoContact = styled.div`{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    h2 {
        font-weight: 300;
        font-size: 20px;
        color: rgb(0, 0, 0);
    }
    p {
        font-weight: 400;
        font-size: 14px;
        line-height: 1.2;
        color: rgb(128, 128, 136);
        text-align: center;
        margin: 15px 0 0;
    }
}`;

export const SubTitle = styled.h2`{
    font-size: 13px;
    line-height: 13px;
    font-weight: 700;
    color: #263238;
    text-align: left;
    text-transform: uppercase;
    margin: ${(props: { margin: string }) => props.margin};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}`;

export const SubTitleIcon = styled.span`{
    font-family: 'icomoon' !important;
    cursor: pointer;
    padding: 2px 0 0 5px;
    &::before {
        color: #263238;
        font-size: 12px;
        content: "\\E915";
    }
}`;

export const FilterPopup = styled.div`{
    user-select: none;
    box-shadow: 0 2px 20px 3px rgba(0, 0, 0, 0.1);
    position: absolute;
    left: 5px;
    top: 40px;
    width: max-content;
    height: auto;
    background-color: #ffffff;
    border-radius: 6px;
    opacity: 0;
    transform-origin: top left;
    transform: scale(0);
    transition: all 110ms cubic-bezier(.04, .37, .23, .61) !important;
    
    &.open {
        opacity: 1;
        transform: scale(1);
        z-index: 21;
    }
}`;

export const FilterPopupList = styled.ul`{
    padding: 6px 0;
    height: 100%;
    opacity: 1;
}`;

export const FilterPopupListItem = styled.li`{
    cursor: pointer;
    padding: 2px 10px 1px 28px;
    &:hover {
        background-color: ${primaryColor};
        span {
            &::before {
                color: #fff;
            }
        }
        button {
            background-color: ${primaryColor};
            color: #ffffff;
        }
    }
    
    ${(props: IContactsSidebarProps) => props.active && `
        padding-left: 10px;
    `}
}`;

export const FilterPopupListItemIcon = styled.span`{
    font-family: 'icomoon' !important;
    cursor: pointer;
    padding-bottom: 5px;
    &::before {
        color: #858F96;
        font-size: 10px;
        content: "\\E937";
    }
}`;

export const FilterPopupListItemContent = styled.button`{
    cursor: pointer;
    font-weight: 400;
    font-size: 14px;
    text-decoration: none;
    border: none;
    background-color: #ffffff;
    width: 100%;
    text-align: left;
}`;

