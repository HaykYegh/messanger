import styled from "styled-components";

export const CanNotDoCallContent = styled.div`{
    min-height: 100px;
    min-width: 450px;
    max-width: 450px;
    width: auto;
    height: auto;
    background-color: #ffffff;
    padding: 18px 24px 20px 20px;
    border-radius: 5px;
    opacity: 1;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  h4 {
    margin: 10px 0 0 0;
    display: block;
    text-align: center;
    font-weight: 700;
    font-size: 15px;
    color: #263239;
  }
  p {
     display: block;
    text-align: center;
    font-weight: 400;
    font-size: 13px;
    line-height: 1.38;
    color: #333333;
    margin: 12px 0 0 0;
  }
  
  button {
    border: none;
    cursor: pointer;
    font-size: 15px;
    color: #00A2FF;
    text-transform: uppercase;
  }
}`;
