import styled from "styled-components";

const $slide_count = 5;
const $slide_width = "30rem";

export const CarouselWrap = styled.div`{
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  position: absolute;
  width: 80%;
  height: 150px;
  top: 86px;
  left: 50%;
  transform: translateX(-50%);
}`

export const CarouselInner = styled.div`{
  height: 100%;
  position: relative;
  width: calc(90rem);
}`

export const CarouselContainer = styled.div`{
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  &.center {
    display: flex;
    justify-content: center;
  }
}`

export const CarouselSlideList = styled.ul`{
  height: 100%;
  //left: 50%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  position: absolute;
  //transform: translateX(-50%);
  display: flex;
  align-items: center;
}`

export const CarouselSlideItemTag = styled.li`{
  display: inline-block;
  height: 130px;
  margin: 0;
  padding: 0 7.5px;
  position: absolute;
  
  width: 220px;
}`

export const CarouselSlideItemImgLink = styled.div`{
    display: flex;
    height: 100%;
    overflow: hidden;
    position: relative;
    width: 100%;
    background: rgba(34, 36, 38, 0.8);
    border-radius: 7.38462px;
    justify-content: center;
    align-items: center;
  
    span {
      font-style: normal;
      font-weight: bold;
      font-size: 24.6154px;
      line-height: 11px;
      /* identical to box height, or 45% */
      text-align: center;
      letter-spacing: -0.134384px;
      color: #259FE6;
    }

    img {
        height: 100%;
        object-fit: cover;
        transition: all 0.5s ease;
        width: 100%;
    }

    //&:after {
    //    align-items: center;
    //    background: rgba(black, 0.5);
    //    color: white;
    //    content: 'read more';
    //    display: flex;
    //    height: 100%;
    //    justify-content: center;
    //    opacity: 0;
    //    position: absolute;
    //    transition: all 0.5s ease;
    //    width: 100%;
    //}

    //&:hover {
    //    &:after {
    //        opacity: 1;
    //    }
    //
    //    img {
    //        transform: scale(1.3);
    //    }
    //}
}`

export const CarouselSlideItemVoiceActivity = styled.div`{
  position: absolute;
  width: 217px;
  height: 143px;
  border: 3px solid #259fe6;
  border-radius: 11px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`

export const CarouselSlideItemName = styled.div`{
  position: absolute;
  height: 20px;
  left: 11px;
  top: 100px;
  display: flex;

  background: rgba(20, 22, 25, 0.7);
  border-radius: 4px;
  padding: 5px 6px;
  span {
    font-style: normal;
    font-weight: 500;
    font-size: 10px;
    line-height: 11px;
    /* identical to box height, or 112% */

    text-align: center;
    letter-spacing: -0.134384px;
    
    svg {
      width: 20px;
      height: 16px;
      top: -3px;
      position: relative;
    }
  }
}`

export const CarouselSlideItemBody = styled.div`{
    bottom: -2.5rem;
    height: 10%;
    position: absolute;

    h4 {
        margin: 0.7rem 0 0;
        text-transform: uppercase;
    }

    p {
        font-size: 1.2rem;
        line-height: 1.3;
        margin: 0.7rem 0 0;
    }
}`

export const CarouselBtn = styled.button`{
    align-items: center;
    background: 0;
    border: 0;
    cursor: pointer;
    display: flex;
    justify-content: center;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);

    &.prev {
        left: -35px;
    }

    &.next {
        right: -35px;
    }
}`

export const CarouselBtnArrow = styled.i`{
    border: solid black;
    border-width: 0 0.4rem 0.4rem 0;
    height: 6rem;
    padding: 3px;
    width: 6rem;
    z-index: 10;

    .left {
        transform: rotate(135deg);
    }

    .right {
        transform: rotate(-45deg);
    }
}`

export const CarouselDots = styled.div`{
    display: inline-block;
    left: 50%;
    margin-top: 2rem;
    position: absolute;
    transform: translateX(-50%);

    .dot {
        background: #ccc;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        height: 2rem;
        margin: 0 0.3rem;
        outline: none;
        transform: scale(0.5);
        width: 2rem;

        &.active {
            background: black;
        }
    }
}`
