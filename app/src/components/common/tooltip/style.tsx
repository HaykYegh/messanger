import styled from 'styled-components';

export const TooltipTextContent = styled.div`
    & > div {
        &:hover {
            &::before {
                content: "${(props: { content: string }) => props.content}";
            }
        }
    }

    ${(props: { default: boolean }) => {
        if (props.default) {
            return `
                position: relative;
                & > div {
                    &:hover {
                        &::before {
                            position: absolute;
                            bottom: 20px;
                            font-size: 13px;
                            font-weight: bolder;
                            left: -12px;
                            background: #a9a9a9;
                            color: #fff;
                            padding: 3px;
                            border-radius: 3px;
                        }
                    }
                }
            `;
        }
    }}
    
    &.right-side-user-number-copy-tooltip {
        display: inline-block;
        & > div {
            &:hover {
                &::before {
                    transition: all 1.2s;
                    position: absolute;
                    font-size: 13px;
                    font-weight: bolder;
                    background: #a9a9a9;
                    color: #fff;
                    padding: 3px;
                    border-radius: 3px;
                    left: -1;
                    bottom: 18px;
                }
            }
        }
    }
    
    ${(props: { styles: any }) => {
        if (props.styles) {
            return `
                & > div {
                    &:hover {
                        &::before {
                            ${props.styles};
                        }
                    }
                }
            `;
        }
    }}
`;

