import * as React from "react";
import styled from 'styled-components';
import {primary, borders} from "services/style/variables";


export const OutCall = styled.a`{
    width: 340px;
    height: 230px;
    border-radius: 8px;
    background-color: #f4f7fc;
    border: 1px solid #e6ebf4;
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    &:hover {
        background-color: #f3f8ff;
    }
}`;

export const OutCallIcon = styled.span`{
    width: 65px;
    height: 65px;
    display: flex;
    align-items: center;
    margin: 35px 0 0 0;
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    font-family: 'icomoon',Noto, NotoArm, system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important;
    &:before {
        content: "\\E901";
        color: ${primary.color};
        font-size: 55px;
        display: block;
    }
}`;

export const OutCallDescription = styled.p`{
    user-select: none;
    margin: 15px 0 0 0;
    color: #000;
    width: 240px;
    text-decoration: none;
    text-align: center;
    font-size: 14px;
    line-height: 1.35;
    font-weight: 400;
}`;
