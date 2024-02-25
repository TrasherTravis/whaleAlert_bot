const fs = require('fs');

let userState = {};

function backupData() {
    try{
    const dataToBackup = {
        userState
    };

    const replacer = (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString() + 'n';
        }
        return value;
    };

    fs.writeFileSync('userState.json', JSON.stringify(dataToBackup, replacer));
} catch(error){
    console.log(error);
}
} 

setInterval(backupData, 5 * 10 * 1000);

function restoreData() {
    try {
        const content = fs.readFileSync('userState.json', 'utf-8');
        const reviver = (key, value) => {
            if (typeof value === 'string' && /\d+n$/.test(value)) {
                return BigInt(value.slice(0, -1));
            }
            return value;
        };
        const restoredData = JSON.parse(content, reviver);

        userState = restoredData.userState || {};

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Backup file not found. Starting with empty data.');
            userState = {};
        } else { 
            console.error('Error restoring data:', error);
        }
    }
}

restoreData();

module.exports = {
    userState
};