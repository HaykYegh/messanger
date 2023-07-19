"use strict";

import * as React from "react";

import {first} from "configs/animation/settings/whyOurApp/1"
import {second} from "configs/animation/settings/whyOurApp/2"
import {third} from "configs/animation/settings/whyOurApp/3"
import {fourth} from "configs/animation/settings/whyOurApp/4"
import components from "configs/localization";
import {LEARN_MORE} from "configs/constants";
import SVG from "components/common/SVG";
import "scss/pages/left-panel/settings/WhyOurApp";
import Log from "modules/messages/Log";

interface IWhyOurAppProps {

}

interface IWhyOurAppState {
    step: number,
    pause: boolean
}

class WhyOurApp extends React.Component<IWhyOurAppProps, IWhyOurAppState> {
    constructor(props) {
        super(props);
        this.state = {
            step: 1,
            pause: true
        }
    }

    componentDidMount() {
        this.setState({pause: false});
        document.addEventListener('keydown', this.handleKeyUp);
        const button:any = document.querySelector(".whyApp")
        if (button) {
            button.disabled = true;
            button.style.backgroundColor = "#eff1f5"
        }
        Log.i(button, "button2222")
    }

    componentDidUpdate(prevProps: Readonly<IWhyOurAppProps>, prevState: Readonly<IWhyOurAppState>, snapshot?: any) {
        const {step} = this.state;
        const button:any = document.querySelector(".whyApp")
        if (button) {
            if (step === 4) {
                button.disabled = false;
                button.style.backgroundColor = "#17ABF6"
            } else {
                button.disabled = true;
                button.style.backgroundColor = "#eff1f5"
            }
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyUp);
    }

    static get carouselDetails(): Array<any> {
        return [
            {
                step: 1,
                animationSrc: first,
                learnMore: LEARN_MORE.secureAndSafe
            },
            {
                step: 2,
                animationSrc: second,
                learnMore: LEARN_MORE.saveWith
            },
            {
                step: 3,
                animationSrc: third,
                learnMore: LEARN_MORE.beConnected
            },
            {
                step: 4,
                animationSrc: fourth,
                learnMore: LEARN_MORE.addSomeFun
            }
        ];
    }

    handleKeyUp = (event: any) => {
        const {step} = this.state;
        const key = event.key;

        switch (key) {
            case "ArrowLeft":
                if (step !== 1)
                    this.setState({step: step - 1});
                break;
            case "ArrowRight":
                if (step !== 4)
                    this.setState({step: step + 1});
                break;
        }
        this.setState({pause: false});
        event.preventDefault();
    };

    handleCarouselChange = (e: React.MouseEvent<HTMLButtonElement>) => {
        const selectedStep = +e.currentTarget.getAttribute("data-step");
        this.setState({step: selectedStep, pause: false});
        setTimeout(() => {
            this.setState({pause: false});
        }, 10);

        e.preventDefault();
    };

    handleCarouselPause = (e: any) => {
        if (e.currentTime > (e.totalTime - 1)) {
            this.setState({pause: true})
        }
    };

    render(): JSX.Element {
        const localization: any = components().why;
        const {step, pause} = this.state;

        return (
            <div className="carousel-block">
                <div className="carousel">
                    {WhyOurApp.carouselDetails.length > 0 && <div className="content">
                        <SVG
                            key={WhyOurApp.carouselDetails[step - 1].step}
                            src={WhyOurApp.carouselDetails[step - 1].animationSrc}
                            className="destroy"
                            width={250}
                            height={221}
                            pause={pause}
                            eventName="enterFrame"
                            callback={this.handleCarouselPause}
                        />
                        <div className="info">
                            <span
                                className='title'>{localization[`slide${WhyOurApp.carouselDetails[step - 1].step}`].title}</span>
                            <span
                                className='text'>{localization[`slide${WhyOurApp.carouselDetails[step - 1].step}`].text}</span>
                            <a className='learn-more' href={WhyOurApp.carouselDetails[step - 1].learnMore}
                               target='_blank'>{localization.learnMore}</a>
                        </div>
                    </div>}
                    <div className="btn-block">
                        <button className={`left btn-content ${step !== 1 && "btn-active"}`} data-step={step - 1}
                                disabled={step === 1} onClick={this.handleCarouselChange}/>
                        <ul className='step'>
                            {
                                WhyOurApp.carouselDetails.map((details) => {
                                    return <li className={`step-icon ${details.step === step ? 'carousel-active' : ''}`}
                                               key={details.step}>
                                        <button className='step-icon-btn' onClick={this.handleCarouselChange}
                                                data-step={details.step}/>
                                    </li>
                                })
                            }
                        </ul>
                        <button className={`right btn-content ${step !== 4 && "btn-active"}`} disabled={step === 4}
                                data-step={step + 1} onClick={this.handleCarouselChange}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default WhyOurApp;
