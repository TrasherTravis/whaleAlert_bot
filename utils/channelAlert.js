const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();
const stateManager = require('../routes/stateManager');

const getTokenInfo = require('./getTokenInfo');
const getCurrentTokenPrice = require('./getCurrentTokenPrice');
const formatNumber = require('./formatNumber');

const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, {
    polling: true
});

const ethPriceInUSDUrl = process.env.ETH_PRICE_IN_USD_URL;
const EXPLORER = process.env.ETHERSCAN;

const { userState } = stateManager;

async function ensureUserExists(chatId) {
    if (!userState[chatId]) {
        userState[chatId] = {};
    }

    if (!userState[chatId].whaleConfig) {
        userState[chatId].whaleConfig = {
            minEth: 1,
            minMc: 1000000,
        };
    }

    if (!userState[chatId].lastBotMessageId) {
        userState[chatId].lastBotMessageId = "";
    }

    if (!userState[chatId].callbackType) {
        userState[chatId].callbackType = "";
    }
}

async function channelAlert(trade) {
    try {
        let tokenAddress = trade.tokenAddress;
        let fromAddress = trade.fromAddress;

        const tokenInfo = await getTokenInfo(tokenAddress);

        const tokenName = tokenInfo.name;
        const symbol = tokenInfo.symbol;
        const decimals = Number(tokenInfo.decimals);
        const supply = Number(tokenInfo.totalSupply) / (10 ** decimals);

        const amountETH = 10 ** 18;
        const ethPrice = await axios.get(ethPriceInUSDUrl);
        const ethToUsdRate = ethPrice.data.USD;

        let priceInfo = await getCurrentTokenPrice(tokenAddress, amountETH);
        const tokensPerETH = Number(priceInfo.tokensPerETH) / Number(10 ** decimals);
        const tokenPriceInETH = 1 / tokensPerETH;
        const marketCap = (tokenPriceInETH * supply).toFixed(2);
        const marketCapInUSD = marketCap * ethToUsdRate;

        // Iterate over userState to check conditions for each chatId
        for (const chatId in userState) {
            const minEth = userState[chatId].whaleConfig.minEth;
            const minMc = userState[chatId].whaleConfig.minMc;

            // Check conditions for sending the alert
            if (trade.ethValue >= minEth && marketCapInUSD >= minMc) {
                const roundedValue = formatNumber(marketCapInUSD);
                const message = `📣 Whale Alert 🚀 \n\n` +
                    `${tokenName} (${symbol}) ᴅᴇᴄɪᴍᴀʟꜱ : ${decimals} \n\n` +
                    `🪙 : \`${tokenAddress}\` \n\n 🐋: \`${fromAddress}\`\n\n` +
                    `Volume: \`${trade.ethValue.toFixed(3)}\` Ξ | 💲Price: \`${tokensPerETH.toFixed(6)} ${symbol}\` per \`ETH\`\n\n` +
                    `MC: $${roundedValue} \n\n` +
                    `[ᴇᴛʜᴇʀꜱᴄᴀɴ](${EXPLORER}/address/${tokenAddress})   `;

                // Send alert only if conditions are met
                bot.sendMessage(chatId, message, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                }).catch(error => {
                    console.error(`Failed to send message to the channel: ${error}`);
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = channelAlert;



bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    ensureUserExists(chatId);

    const replyMarkup = {
        inline_keyboard: [
            [{
                text: `Min ETH: ${userState[chatId].whaleConfig.minEth}`,
                callback_data: 'minEth'
            }, {
                text: `Min MC: ${userState[chatId].whaleConfig.minMc}`,
                callback_data: 'minMc'
            }]
        ]
    }

    bot.sendMessage(chatId, `🚀 Welcome to WhaleAlert 🚀 \n\nPlease configure your whale alert preference!`, {
        reply_markup: replyMarkup,
    });
    userState[chatId].lastBotMessageId = messageId;

});

bot.on('message', (inputText) => {
    const chatId = inputText.chat.id;
    const messageId = inputText.message_id;
    const text = inputText.text;

    ensureUserExists(chatId);

    

    const replyMarkup = {
        inline_keyboard: [
            [{
                text: `Min ETH: ${userState[chatId].whaleConfig.minEth}`,
                callback_data: 'minEth'
            }, {
                text: `Min MC: ${userState[chatId].whaleConfig.minMc}`,
                callback_data: 'minMc'
            }]
        ]
    }

    let lastBotMessageId = userState[chatId].lastBotMessageId;



    bot.deleteMessage(chatId, messageId);

    switch (true) {
        case /^(Start)$/i.test(text):
            bot.sendMessage(chatId, `🚀 Welcome to WhaleAlert 🚀 \n\nPlease configure your whale alert preference!`, {
                reply_markup: replyMarkup,
            });

            userState[chatId].lastBotMessageId = messageId;
            break;
    }
});


bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    ensureUserExists(chatId);

    switch (query.data) {
        case 'minEth':
            userState[chatId].callbackType = "minEth";
            await setValue(chatId, messageId);
            break;

        case 'minMc':
            userState[chatId].callbackType = "minMc";
            await setValue(chatId, messageId);
            break;      
    }

    console.log(userState);

});

async function setValue(chatId, messageId) {

    let messageText;

    if(userState[chatId].callbackType === "minEth"){
    messageText = 'Minimum ETH volume (> 1 ETH) ';
    }else if(userState[chatId].callbackType === "minMc"){
    messageText = 'Minimum MC value (> $10000) ';
    }

    const sentMessage = await bot.sendMessage(chatId, messageText, {
        reply_markup: {
            force_reply: true
        }
    });

    const ethMsg = await new Promise((resolve) => {
        const listener = (msg) => {
            if (msg.chat.id === chatId && msg.message_id !== sentMessage.message_id) {
                resolve(msg);
            }
        };

        bot.on('message', listener);

        setTimeout(() => {
            bot.removeListener('message', listener);
        }, 2 * 60 * 1000); // 2 minutes timeout
    });

    const enteredValue = ethMsg.text.trim();

    if ((userState[chatId].callbackType === "minEth" && (parseFloat(enteredValue) < 0.1 || parseFloat(enteredValue) > 100)) || (userState[chatId].callbackType === "minMc" && parseFloat(enteredValue) < 10000)) {
        await bot.deleteMessage(chatId, sentMessage.message_id);

        await bot.sendMessage(chatId, '❗Invalid input.').then((message) => {
            setTimeout(() => {
                bot.deleteMessage(chatId, message.message_id);
            }, 3000);
        });
    } else {
        const value = parseFloat(enteredValue);

        if (userState[chatId].callbackType === "minEth") {
            userState[chatId].whaleConfig.minEth = value;
        } else if (userState[chatId].callbackType === "minMc") {
            userState[chatId].whaleConfig.minMc = value;
        } else {
            return;
        }

        await bot.deleteMessage(chatId, sentMessage.message_id);

        const replyMarkup = {
            inline_keyboard: [
                [{
                    text: `Min ETH: ${userState[chatId].whaleConfig.minEth}`,
                    callback_data: 'minEth'
                }, {
                    text: `Min MC: ${userState[chatId].whaleConfig.minMc}`,
                    callback_data: 'minMc'
                }]
            ]
        };

        await bot.deleteMessage(chatId, messageId);

        await bot.sendMessage(chatId, `🚀 Welcome to WhaleAlert 🚀 \n\nPlease configure your whale alert preference!`, {
            reply_markup: replyMarkup,
        });

        userState[chatId].lastBotMessageId = messageId;
    }
}



