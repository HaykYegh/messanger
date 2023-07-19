import * as React from "react";
import styled from 'styled-components';
import {PROJECT_COLORS} from "configs/constants";


export const Header = styled.div`{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-bottom: 1px solid #edf2f9;
    min-height: 55px;
    align-items: center;
    padding: 0 22px 0 6px;
}`;

export const Title = styled.p`{
    text-align: center;
    font-size: 14px;
    font-weight: 600;
}`;


export const BackArrow = styled.img`{
    width: 32px;
    height: 32px;
    margin-left: 6px;
    cursor: pointer;
}`;

export const Button = styled.span`{
    min-width: 34px;
    font-size: 14px;
    color: #1FA6FA;
    cursor: pointer;
    text-align: end;
    font-weight: ${(props: { fontWeight?: string }) => props.fontWeight};
}`;

export const RightPanel = styled.div`{
  background-color: ${PROJECT_COLORS.RIGHT_PANEL_BACKGROUND};
  width: 310px;
  height: 100%;
  overflow: hidden;
  position: relative;
  border-left: 1px solid #edf2f9;
    &.open {
    transform: translate(310px, 0);
    width: 0;

    &.openActive {
      transform: translate(0, 0);
      width: 310px;
      transition: all 200ms ease-in-out;
    }
  }

  &.close {
    transform: translate(0, 0);
    width: 310px;

    &.closeActive {
      transform: translate(310px, 0);
      width: 0;
      transition: all 200ms ease-in-out;
    }
  }
}`
