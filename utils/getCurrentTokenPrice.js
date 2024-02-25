
const { Web3 } = require('web3');
const UNISWAP_ROUTER_ABI = require('.././abi/UniswapV2RouterABI.json');

const routerAddress = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const WETH_ADDRESS = process.env.WETH_ADDRESS;

const web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_RPC_URL));

const routerContract = new web3.eth.Contract(UNISWAP_ROUTER_ABI, routerAddress);


async function getCurrentTokenPrice(tokenAddress, amountETH) {
    try {
        const tokensPerETH = (await routerContract.methods.getAmountsOut(amountETH, [WETH_ADDRESS, tokenAddress]).call())[1];
        return {
            tokensPerETH
        };
    }catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = getCurrentTokenPrice;