const axios = require("axios");
const { ETHERSCAN_API } = process.env.ETHERSCAN_API;


async function getABI(tokenAddress) {
    try {
        const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${tokenAddress}&apikey=${ETHERSCAN_API}`;
        const response = await axios.get(url);
        const data = response.data;

        // console.log(data.status);

        if (data.status === "1") {
            const ABI = JSON.parse(data.result);

            return contractABI;

        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = getABI;