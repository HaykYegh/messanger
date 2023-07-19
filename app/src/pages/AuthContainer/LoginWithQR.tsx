import * as React from "react";
import {Content, QrContent} from "./style";
import LoginUsingQR from "components/authentication/LoginUsingQR";
import {getQRCode} from "requests/loginRequest";
import Select, {createFilter, components} from "react-select";
import {ICountry} from "services/interfaces";
import countriesList from "configs/countries";
import {APPLICATION, DOWN_KEY_CODE, ENTER_KEY_CODE, LOG_TYPES, UP_KEY_CODE} from "configs/constants";
import {writeLog} from "helpers/DataHelper";




interface ILoginWithQRProps {
  handleQrSignIn: (accessToken: string, username: string, email?: string) => void;
  handleSelectedCountryChange: (selectedCountry: ICountry) => void;
  selectedCountry: ICountry;
}

interface  ILoginWithQRState {
  qrRefresh: boolean;
  qrLoader: boolean;
  QRValue: string;
  isSelectMenuOpened: boolean,
}

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    fontWeight: "500 !important",
    fontSize: "14px !important",
    ":hover": {
      backgroundColor: "#f4f5f7 !important"
    },
    backgroundColor: state.isFocused ? "#f4f5f7 !important" : "#fff"
  }),
  control: (provided, state) => ({
    alignItems: "center",
    borderBottom: "1px solid rgba(199,206,216,0.5)",
    cursor: "pointer",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    minHeight: "50px",
    outline: "0 !important",
    position: "relative",
    boxSizing: "border-box",
    caretColor: state.selectProps.menuIsOpen ? "#1FA6FA" : "transparent",
  }),
  indicatorSeparator: () => ({
    display: "none"
  }),
  singleValue: (provided, state) => ({
    color: "#1FA6FA",
    fontWeight: "500",
    fontSize: "14px",
    display: state.selectProps.menuIsOpen ? 'none' : 'block',
  }),
  container: () => ({
    position: "relative",
    boxSizing: "border-box",
    width: "100%"
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#999999",
    fontSize: "15px",
    fonWeight: "500",
  }),
  // indicatorsContainer: (provided, state) => ({
  //     ...provided,
  //     width: "12px",
  //     height: "6px"
  // }),
};


export default class LoginWithQR extends React.Component<ILoginWithQRProps, ILoginWithQRState> {
  constructor(props) {
    super(props);
    this.state = {
      qrRefresh: false,
      qrLoader: false,
      QRValue: '',
      isSelectMenuOpened: false,
    }
  }
  qrTimeOut: any;
  timeOut:any;
  mounted: boolean;

  componentDidMount() {
    this.mounted = true;
    this.handleQrRefreshShow();
    this.setState({qrLoader: true});
    window.addEventListener("keydown", this.handleInputKeyboardPress);
    if (navigator.onLine) {
      this.attemptToGetQRAndLogIn();
    }
  };

  componentWillUnmount(): void {
    window.removeEventListener("keydown",  this.handleInputKeyboardPress);
    this.mounted = false;
    clearTimeout(this.timeOut);
    clearTimeout(this.qrTimeOut);
    this.setState({QRValue: "", qrRefresh: false});
  }

  handleInputKeyboardPress = (e: any) => {
    if (e.keyCode === DOWN_KEY_CODE || e.keyCode === UP_KEY_CODE) {
      e.preventDefault();
    }
  };

  handleQrRefreshShow = () => {
    this.qrTimeOut = setTimeout(() => {
      this.setState({qrRefresh: true, QRValue: "", qrLoader: false});
      clearTimeout(this.timeOut);
    }, 60000)
  };

  handleQrRefreshClick = () => {
    clearTimeout(this.qrTimeOut);
    this.setState({qrRefresh: false, qrLoader: true});
    if(navigator.onLine){
      this.attemptToGetQRAndLogIn();
    }
    this.handleQrRefreshShow();
  };

  attemptToGetQRAndLogIn(): void {
    const {handleQrSignIn} = this.props;

    const attemptToGetQRAndLogIn: any = () => {
      getQRCode(false).then(data => {
        const {qrRefresh} = this.state;
        if (this.mounted && !qrRefresh) {
          this.setState({QRValue: data.QRValue, qrLoader: false}, () => {
            getQRCode(data.QRValue)
              .then(data => {
                if (data.username && data.accessToken) {
                  const {username, accessToken, email} = data;
                  this.setState({qrLoader:false})
                  handleQrSignIn(accessToken,username, email || "");
                }
              })
              .catch(() => {
                  return attemptToGetQRAndLogIn()
              }
                );
          })
        }
      })
        .catch(() => {
          attemptToGetQRAndLogIn()
        } );
    };
    attemptToGetQRAndLogIn();
  }

  handleSelectMenuOpen = () => {
    this.setState({isSelectMenuOpened: true})
  };

  handleSelectMenuClose = () => {
    this.setState({isSelectMenuOpened: false})
  };

  handleCountryChange = (selected: any): void => {
    const {handleSelectedCountryChange} = this.props;
    handleSelectedCountryChange(selected)
  };

  render() {
    const {qrRefresh,qrLoader,QRValue,isSelectMenuOpened} = this.state;
    const {selectedCountry} = this.props;
    return (
      <QrContent>
        {
          <LoginUsingQR
            qrValue={QRValue}
            qrRefresh={qrRefresh}
            qrLoader={qrLoader}
            handleQrRefreshClick={this.handleQrRefreshClick}
          />
        }

      </QrContent>
    );
  }
}
