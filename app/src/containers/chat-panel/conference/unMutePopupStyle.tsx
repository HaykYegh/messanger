import styled from "styled-components";

export const UnMutePopupOvelay = styled.div`{
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 28;
}`

export const UnMutePopupContent = styled.div`{
  width: 350px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0px 0px 10px #000000;
  text-align: center;
  p {
    margin: 10px 0;
    font-size: 15px;
    line-height: 20px;
  }
}`

export const UnMuteButtonsContent = styled.div`{
  display: flex;
  justify-content: space-between;
  button {
    border: unset;
    box-shadow: unset;
    padding: unset;
    color: #089AE6;
    font-size: 12px;
    cursor: pointer;
  }
}`
