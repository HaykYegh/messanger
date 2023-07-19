import * as React from "react";

interface IMyBalanceSvgProps {
    color?: string;
}

class MyBalanceSvg extends React.Component<IMyBalanceSvgProps, null> {
    render(): JSX.Element {
        return (
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M17.3801 3.03759C17.3801 1.69103 16.287 0.600464 14.9407 0.600464H3.01944C1.6732 0.600464 0.580078 1.69103 0.580078 3.03759V10.9633C0.580078 12.3099 1.6732 13.4005 3.01944 13.4005H14.9407C16.287 13.4005 17.3801 12.3099 17.3801 10.9633V3.03759ZM16.18 3.03759V10.9633C16.18 11.6443 15.625 12.2024 14.9407 12.2024H3.01944C2.33512 12.2024 1.78016 11.6443 1.78016 10.9633V3.03759C1.78016 2.35663 2.33512 1.79853 3.01944 1.79853H14.9407C15.625 1.79853 16.18 2.35663 16.18 3.03759Z" fill="white"/>
            </svg>
        );
    }
}

export default MyBalanceSvg;


