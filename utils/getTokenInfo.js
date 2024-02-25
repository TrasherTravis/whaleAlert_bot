const axios = require('axios');
const { ETHPLORER_API } = process.env;


async function getTokenInfo(tokenAddress, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const url = `https://api.ethplorer.io/getTokenInfo/${tokenAddress}?apiKey=${ETHPLORER_API}`;
            const response = await axios.get(url);
            const data = response.data;

            // console.log(data);

            const name = data.name;
            const symbol = data.symbol;
            const decimals = data.decimals;
            const totalSupply = data.totalSupply;

            return {
                name,
                symbol,
                decimals,
                totalSupply
            };

        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

module.exports = getTokenInfo;