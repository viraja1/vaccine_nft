/*
 * This truffle script will deploy your smart contracts to the selected Chain.
 */
require('dotenv').config();
let HDWalletProvider = require("@truffle/hdwallet-provider");

//wallet private key
let privateKey = process.env.PRIVATE_KEY;

// Websocket urls
let rinkeby = process.env.RINKEBY;
let skale = process.env.SKALE_CHAIN;
let matic_mumbai = process.env.MATIC_MUMBAI;

module.exports = {
    networks: {
        ganache: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },
        rinkeby: {
            provider: () => new HDWalletProvider(privateKey, rinkeby),
            network_id: "4"

        },
        skale: {
            provider: () => new HDWalletProvider(privateKey, skale),
            gasPrice: 0,
            network_id: "*",
            networkCheckTimeout: 1000000,
            timeoutBlocks: 200
        },
        matic_mumbai: {
            provider: () => new HDWalletProvider(privateKey, matic_mumbai),
            network_id: "80001"
        },
    },
    compilers: {
        solc: {
            version: "0.8.0"
        }
    }
};
