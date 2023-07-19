import styled from "styled-components";

export const LeaveCallPopup = styled.div`{
  position: absolute;
  width: 242px;
  height: 132px;
  top: -150px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  padding: 10px 15px;
  right: 0;
}`;

export const LeaveCallPopupM = styled.div`{
  position: absolute;
  width: 242px;
  height: 132px;
  top: 50%;
  left: 50%;
  transform: translateY(-50%) translateX(-50%);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  padding: 10px 15px;
}`;

export const LeaveCallPopupContent = styled.div`{
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 4px;
  flex: 1;
  button {
    border: none;
    color: #259FE6;
    text-transform: capitalize;
    cursor: pointer;
  }
}`;

export const LeaveGroupCallContent = styled.div`{
  height: 26px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 14px 0 3px;
  button{
    width: 100%;
    height: 100%;
    padding: 0;
    font-size: 10px;
    line-height: 1.2;
    color: #333333;
    border: 1px solid #D3D3D3;
    border-radius: 4px;
  }
}`;

export const EndGroupCallContent = styled.div`{
  height: 26px;
  display: flex;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  button{
    width: 100%;
    height: 100%;
    padding: 0;
    font-size: 10px;
    line-height: 1.2;
    color: #fff;
    background: #FB2C2F;
    border-radius: 4px;
  }
}`;

export const LeaveCallDescriptionForInitiatorContent = styled.div`{
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  line-height: 12px;
  text-align: center;
  color: #333333;
}`;

export const LeaveCallCancelContent = styled.div`{
  display: flex;
  height: 26px;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  cursor: pointer;
  width: max-content;
  margin: 5px 0 0 0;
  button {
    border: none;
    color: #000;
    cursor: pointer;
  }
}`;
