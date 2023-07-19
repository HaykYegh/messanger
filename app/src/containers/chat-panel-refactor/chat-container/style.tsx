"use strict";

import * as React from "react";
import styled from 'styled-components';

export const ChatContainerContent = styled.div`{
  user-select: none;
  color: rgba(0, 0, 0, 0);
  overflow-y: scroll;
  overflow-x: hidden;
  width: 100%;
  &.scroll-smooth {
    scroll-behavior: smooth;
  }
   &.show-chat-content {
    margin: auto 0 0 0;
  }
}`;