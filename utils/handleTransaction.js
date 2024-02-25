const { ethers } = require('ethers');
const { Web3 } = require('web3');
require('dotenv').config();

const UniswapV2RouterABI = require('.././abi/UniswapV2RouterABI.json');
const channelAlert = require('./channelAlert');

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;

const UNISWAP_V2_ROUTER ='0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
const UNIVERSAL_ROUTER ='0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad'
const MAESTRO_ROUTER = '0x80a64c6d7f12c47b7c66c5b4e20e72bc1fcd5d9e'
const BANANA_ROUTER = '0x3328f7f4a1d1c57c35df56bbf0c9dcafca309c49'
const KYBERSWAP_ROUTER = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'
const ONE_INCH_ROUTER = '0x1111111254eeb25477b68fb85ed929f73a960582'

const UK_ROUTER1 = '0xb13c95e00312e301085d29ebb84c21fca663daae'
const UK_ROUTER2 = '0xf3de3c0d654fda23dad170f0f320a92172509127'
const UK_ROUTER = '0xdee141a25803e46342f176b63fbbaf394807c3e5'

const routerAddress = [UNISWAP_V2_ROUTER, UNIVERSAL_ROUTER, MAESTRO_ROUTER, BANANA_ROUTER, KYBERSWAP_ROUTER, ONE_INCH_ROUTER, UK_ROUTER, UK_ROUTER1, UK_ROUTER2]

const web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_RPC_URL));

const SWAP_ETH_FOR_TOKENS = ['0x7ff36ab5', '0xb6f9de95'];

let freshWallets = [];

async function handleTransaction(tx) {


    try {
        const currentBlockNumber = parseInt(tx['blockNumber'], 16);
        const nonce = tx['nonce'];
        const gas = tx['gasPrice'];
        const fromAddress = tx['from'];
        const value = tx['value'];
        const ETH = web3.utils.fromWei(value, 'ether');
        const method = tx['input'].slice(0, 10);
        const data = tx['input'];

        const ethValue = Number(ETH);


        if (routerAddress.includes(tx.to) && SWAP_ETH_FOR_TOKENS.includes(method)) {

            console.log("Block Number:", currentBlockNumber, "From: " + fromAddress + "|" + " Method:" + method + " | " + ethValue + "eth" + "|" + "Gas: " + gas + "|" + "Nonce: " + parseInt(nonce, 16));

            try {
                const iface = new ethers.Interface(UniswapV2RouterABI);
                const decodedArgs = iface.decodeFunctionData(method, data);
            
                const path = decodedArgs[1];
                const tokenAddress = path[1]; 
            
                const freshTrades = {
                    blockNumber: currentBlockNumber,
                    tokenAddress: tokenAddress,
                    fromAddress: [fromAddress],
                    ethValue,
                    counts: 1
                };
            
                freshWallets = freshWallets.filter(trade => trade.blockNumber + 15 >= currentBlockNumber); // Block Range here
            
                const index = freshWallets.findIndex(trade => trade.tokenAddress === tokenAddress);
            
                if (index !== -1) {
                    if (freshWallets[index].fromAddress.includes(fromAddress)) {
                        freshWallets[index].counts++;
                    }
                    freshWallets[index].ethValue += ethValue;
            
                    if (freshWallets[index].ethValue >= 0.1) {
                        channelAlert(freshWallets[index]);
                        freshWallets.splice(index, 1);
                        console.log(freshWallets[index]);
                    }
                } else if( ethValue >= 0.1){
                    channelAlert(freshTrades);
                    console.log(freshWallets);
                } else {
                    freshTrades.fromAddress = [fromAddress];
                    freshWallets.push(freshTrades);
                }
            
            } catch (error) {
                console.log(error);
            }

        }


    } catch (error) {}
}

module.exports = handleTransaction;