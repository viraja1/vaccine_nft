import React from 'react';
import Button from 'react-bootstrap-button-loader';
import {Navbar, Image} from 'react-bootstrap';
import Web3Modal from "web3modal";
import VaccineNFT from './VaccineNFT.json';
import Torus from "@toruslabs/torus-embed";

const Web3 = require('web3');
const torusResolver = new Torus();


let networkNameMapping = {
    "Mumbai Matic-Testnet": {
        "host": "mumbai",
        "chainId": "8001",
        "contractAddress": "0x33CFF3EAd2cBE63c6462F1cE6554f30D0AfEB8fE",
        "displayName": "matic mumbai"
    },
    "SKALE Network": {
        "host": "https://eth-global-12.skalenodes.com:10392",
        "chainId": "0x3b08f03d84d6c",
        "contractAddress": "0xB41273cdF6b8cFD172A269E1Fd0206a040F6EeAf",
        "displayName": "skale"
    },
    "rinkeby": {
        "host": "rinkeby",
        "chainId": "4",
        "contractAddress": "0x7f6A662306298f7007D228AA97138cad49b8c821",
        "displayName": "rinkeby"
    }
};
const defaultNetwork = "rinkeby";
let allowedNetworks = ['10385532214511', '0x3b08f03d84d6c', '80001', '4', '1038553221451116'];
const unsupportedNetworkCopy = 'App works only for Rinkeby, Matic Mumbai or Skale testnet';

const reverseLookupMapping = {
    "google": "google",
    "ethereum": "ethereum",
    "reddit": "reddit",
    "discord": "discord"
};


class App extends React.Component {
    state = {
        account: '',
        web3: '',
        nftDetails: {},
        nftBalance: 0,
        otherAccountType: '',
        otherAccount: '',
        otherAccountVaccinated: '',
        loadingVerification: false,
        selectedNetwork: localStorage.getItem('selectedNetwork') || defaultNetwork
    };


    web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions: {
            torus: {
                package: Torus, // required
                options: {
                    networkParams: {
                        networkName: this.state.selectedNetwork,
                        host: networkNameMapping[this.state.selectedNetwork]["host"],
                        chainId: networkNameMapping[this.state.selectedNetwork]["chainId"]
                    }
                }
            }
        }
    });

    async fetchDetails() {
        if (!this.state.web3) {
            return
        }
        const VaccineNFTContract = new this.state.web3.eth.Contract(
            VaccineNFT,
            networkNameMapping[this.state.selectedNetwork]["contractAddress"]
        );
        const balance = await VaccineNFTContract.methods.balanceOf(this.state.account, 0).call();
        console.log('balance: ' + balance.toString());
        let uri = await VaccineNFTContract.methods.uri(0).call();
        uri = uri.replace("{id}", 0);
        console.log(uri);
        let nftDetails = await fetch(uri);
        nftDetails = await nftDetails.json();
        this.setState({nftDetails: nftDetails, nftBalance: parseInt(balance)});
    }

    async login() {
        const provider = await this.web3Modal.connect();
        await this.subscribeProvider(provider);
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const address = accounts[0];
        const networkId = await web3.eth.net.getId();
        console.log('Login network id: ' + networkId.toString() + ', type: ' + typeof networkId);
        if (allowedNetworks.indexOf(networkId.toString()) === -1) {
            alert(unsupportedNetworkCopy);
            return;
        }
        this.setState({
            web3: web3,
            account: address
        });
        await this.fetchDetails();
        console.log(this.web3Modal);
    }

    async logout() {
        this.resetApp();
    }

    async subscribeProvider(provider) {
        if (!provider.on) {
            return;
        }
        provider.on("close", () => this.resetApp());
        provider.on("accountsChanged", async (accounts) => {
            await this.setState({account: accounts[0]});
        });
        provider.on("chainChanged", async (chainId) => {
            const {web3} = this.state;
            if (!web3) {
                return
            }
            const networkId = await web3.eth.net.getId();
            console.log('chainChanged network id: ' + networkId.toString() + ', type: ' + typeof networkId);
            if (allowedNetworks.indexOf(networkId.toString()) === -1) {
                alert(unsupportedNetworkCopy);
                return;
            }
            await this.fetchDetails();
            console.log(this.web3Modal);
        });

        provider.on("networkChanged", async (networkId) => {
            console.log('networkChanged network id: ' + networkId.toString() + ', type: ' + typeof networkId);
            if (allowedNetworks.indexOf(networkId.toString()) === -1) {
                alert(unsupportedNetworkCopy);
                return;
            }
            await this.fetchDetails();
            console.log(this.web3Modal);
        });
    };

    async resetApp() {
        const {web3} = this.state;
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
            await web3.currentProvider.close();
        }
        await this.web3Modal.clearCachedProvider();
        this.setState({account: '', web3: '', otherAccountVaccinated: '', loadingVerification: false});
    };

    async componentWillMount() {
        if (this.web3Modal.cachedProvider) {
            this.login();
        }
    }

    updateOtherAccountType(value) {
        this.setState({otherAccountType: value});
    }

    updateOtherAccount(value) {
        this.setState({otherAccount: value});
    }

    updateNetwork(value) {
        localStorage.setItem('selectedNetwork', value);
        this.setState({selectedNetwork: value});
        console.log('updateNetwork: ' + value);
        window.location.reload();
    }

    async verifyVaccinationStatus() {
        console.log('selectedNetwork: ' + this.state.selectedNetwork);
        if (!this.state.otherAccount || !this.state.otherAccountType) {
            return
        }
        this.setState({loadingVerification: true});
        let account;
        if (this.state.otherAccountType === 'ethereum') {
            account = this.state.otherAccount;
        } else {
            account = await torusResolver.getPublicAddress({
                verifier: this.state.otherAccountType,
                verifierId: this.state.otherAccount,
            });
        }
        console.log('otherAccount: ' + account);
        const VaccineNFTContract = new this.state.web3.eth.Contract(
            VaccineNFT,
            networkNameMapping[this.state.selectedNetwork]["contractAddress"]
        );
        let balance = await VaccineNFTContract.methods.balanceOf(account, 0).call();
        console.log('otherAccountBalance: ' + balance);
        balance = parseInt(balance);
        let otherAccountVaccinated = false;
        if (balance > 0) {
            otherAccountVaccinated = true
        }
        this.setState({otherAccountVaccinated: otherAccountVaccinated, loadingVerification: false});
    }

    render() {
        if (this.state.account === '') {
            return (
                <div>
                    <Navbar className="navbar-custom" variant="dark">
                        <div style={{width: "90%"}}>
                            <Navbar.Brand href="/">
                                <b>Vaccine NFT</b>
                            </Navbar.Brand>
                        </div>
                        <select className="form-control-sm"
                                style={{marginRight: "10px"}}
                                value={this.state.selectedNetwork}
                                onChange={e => this.updateNetwork(e.target.value)}>
                            {Object.keys(networkNameMapping).map((key, index) => (
                                <option value={key}
                                        key={"network-" + index}>{networkNameMapping[key]['displayName']}</option>
                            ))}
                        </select>
                        <Button variant="default btn-sm" onClick={this.login.bind(this)} style={{float: "right"}}>
                            Connect
                        </Button>
                    </Navbar>
                    <div className="panel-landing  h-100 d-flex" id="section-1">
                        <div className="container row" style={{marginTop: "50px"}}>
                            <div className="col l8 m12">

                                <p className="h2" style={{fontFamily: "Helvetica"}}>
                                    Vaccine NFT
                                </p>
                                <p className="h6" style={{marginTop: "10px", fontFamily: "Helvetica"}}>
                                    Get a free NFT after your COVID-19 vaccination
                                </p>
                                <Image src="/vaccine.png"
                                       style={{height: "300px", width: "300px", marginTop: "10px"}} fluid/>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div className="App">
                <div>
                    <Navbar className="navbar-custom" variant="dark" style={{position: "sticky"}} fixed="top">
                        <div style={{width: "90%"}}>
                            <Navbar.Brand href="/">
                                <b>Vaccine NFT</b>
                            </Navbar.Brand>
                        </div>
                        <select className="form-control-sm"
                                style={{marginRight: "10px"}}
                                value={this.state.selectedNetwork}
                                onChange={e => this.updateNetwork(e.target.value)}>
                            {Object.keys(networkNameMapping).map((key, index) => (
                                <option value={key}
                                        key={"network-" + index}>{networkNameMapping[key]['displayName']}</option>
                            ))}
                        </select>
                        <Button variant="default btn-sm" onClick={this.logout.bind(this)} style={{float: "right"}}>
                            Logout
                        </Button>
                    </Navbar>
                    <div style={{margin: "20px"}}>
                        {this.state.nftBalance > 0 &&
                        <div style={{fontWeight: "900", fontFamily: "Helvetica"}}>
                            <p>Congrats! You are already vaccinated against COVID-19. Below is your verified NFT.</p>
                            <Image src={this.state.nftDetails['image']}
                                   style={{height: "200px", width: "200px", marginTop: "10px"}} fluid
                            />
                        </div>
                        }
                        {this.state.nftBalance === 0 &&
                        <div style={{fontWeight: "900", fontFamily: "Helvetica"}}>
                            <p>You are yet to get vaccinated against COVID-19. Get vaccinated soon to get your free
                                verified NFT shown
                                below.</p>
                            <Image src={this.state.nftDetails['image']}
                                   style={{height: "200px", width: "200px", marginTop: "10px"}} fluid
                            />
                        </div>
                        }
                        <br/>
                        <div>
                            <div style={{fontWeight: "900", fontFamily: "Helvetica"}}>
                                <p>Verify vaccination status for others</p>
                            </div>
                            <select className="form-control" style={{marginBottom: "10px"}}
                                    value={this.state.otherAccountType}
                                    onChange={e => this.updateOtherAccountType(e.target.value)}>
                                <option value="" disabled>Select account type</option>
                                {Object.keys(reverseLookupMapping).map((key, index) => (
                                    <option value={key}
                                            key={"network-" + index}>{reverseLookupMapping[key]}</option>
                                ))}
                            </select>
                            <input className="form-control" type="text" placeholder="Enter account value"
                                   value={this.state.otherAccount}
                                   onChange={e => this.updateOtherAccount(e.target.value)}
                                   style={{marginBottom: "10px"}}/>
                            <Button variant="success btn" onClick={this.verifyVaccinationStatus.bind(this)}
                                    loading={this.state.loadingVerification}
                            >Verify Vaccination Status</Button>
                            {this.state.otherAccountVaccinated !== '' &&

                            <p style={{marginTop: "10px"}}>
                                <b>Vaccinated:</b> {this.state.otherAccountVaccinated.toString()}</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }


}

export default App
