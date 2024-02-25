const express = require('express');
const ngrok = require('ngrok');
const fs = require('fs');
const stateManager = require('./routes/stateManager');
const ethereumTx = require('./routes/ethereum');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/', ethereumTx);

const { userState } = stateManager;


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);

    // Ngrok setup
    (async () => {
        try {
            console.log('Server listening on port', port);
            const url = await ngrok.connect(port);
            console.log('ngrok tunnel set up:', url);
        } catch (error) {
            console.error('Error setting up ngrok:', error);
        }
    })();
});







