import * as React from "react";
import styled from 'styled-components';


export const DateBubblePosition = styled.div`{
  position: sticky;
    top: 5px;
    z-index: 1;
    margin: 8px auto 8px auto;
    max-width: 1000px;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    p{
    height: auto;
    width: auto;
    text-align: center;
    position: relative;
    font-size: 13px;
    line-height: 1.4;
    font-weight: 600;
    color: #919193;
    padding: 0 12px;
    background-color: #FFF;
    border-radius: 10px;
    }
    }`;
