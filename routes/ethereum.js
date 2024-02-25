const express = require('express');
const router = express.Router();

const handleTransaction = require('../utils/handleTransaction');

router.post('/', async (req, res) => {

    const tx = req.body;
    // console.log(tx);

    res.status(200).end();

    try {
        await handleTransaction(tx[0]);
    } catch (error) {
        console.error('Error handling transaction:', error);
    }
});

module.exports = router;