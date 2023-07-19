import * as React from "react";
import styled from 'styled-components';

export const NoMember = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 16px;
  font-weight: 500;
  transform: translateX(-50%) translateY(-50%);
`

export const AMMutedIcon = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
`

export const HoldDiv = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.4);
  top: 0;
  left: 0;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  span {
    font-weight: bold;
  }
`

export const PMHoldDiv = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.4);
  top: 0;
  left: 0;
  border-radius: 7.38462px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  span {
    font-weight: bold;
  }
`
