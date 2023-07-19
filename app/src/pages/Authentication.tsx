"use strict";

import * as React from "react";

import LoginUsingMobile from "components/authentication/LoginUsingMobile";
import {IStoreProps} from "services/selector";
import {SIGN_IN} from "modules/user/UserActions";
import {connect} from "react-redux";
import {ICountry} from "services/interfaces";

const appLogo: any = require("assets/images/login-logo.svg");

interface IAuthenticationState {
    pause: boolean;
    currentLoop: number
}

interface IAuthenticationProps {
    SIGN_IN: (selectedCountry: ICountry, number: string, email?: string, password?: string, pinCode?: string) => void;
}

class Authentication extends React.Component<IAuthenticationProps, IAuthenticationState> {

    timeOut: any = null;

    constructor(props: any) {
        super(props);
        this.state = {
            pause: true,
            currentLoop: 1,
        };
    }

    componentDidMount() {
        this.setState({pause: false})
    }

    componentWillUnmount() {
        clearTimeout(this.timeOut);
    }

    handleAnimationPause = (e: any): void => {
        const {currentLoop} = this.state;
        if (e.currentTime > (e.totalTime - 1)) {
            if (currentLoop === 3) {
                this.setState({pause: true});
                return;
            }
            this.setState({currentLoop: currentLoop + 1});
        }
    };

    pause(pause: boolean, time: number): void {
        this.timeOut = setTimeout(() => {
            this.setState({pause: pause})
        }, time)
    }

    render(): JSX.Element {

        return (
            <div className="authentication-page">
                <div className="logo">
                    {/*<SVG
                        width={350}
                        src={LOGIN_LOGO}
                        className='lottie-animation'
                        pause={pause}
                        eventName='enterFrame'
                        callback={this.handleAnimationPause}

                    />*/}
                    <img className="app-logo" draggable={false} src={appLogo} alt=""/>
                    <p className="app-text">Sign in with</p>
                </div>
                <div className="authentication-content">

                    {/**** SignIn component start: *****/}

                    <LoginUsingMobile/>

                    {/**** SignIn component end; *****/}

                </div>
            </div>
        );
    }
}

const mapStateToProps = () => {

    return (state, props) => {
        return {
        }
    }
};


const mapDispatchToProps: any = dispatch => ({
    SIGN_IN: (country: ICountry, number?: string, email?: string, password?: string, pinCode?: string) => dispatch(SIGN_IN(country, number, email, password, pinCode)),
    // UPDATE_RESPONSE_MESSAGE: (responseMessage: IResponseMessage) => dispatch(UPDATE_RESPONSE_MESSAGE(responseMessage)),

});


export default connect(mapStateToProps, mapDispatchToProps)(Authentication);
