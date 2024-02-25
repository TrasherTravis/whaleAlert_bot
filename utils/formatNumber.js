function formatNumber(value) {
    try {
        value = Number(value);

        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + 'B';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else {
            const roundedValue = value.toFixed(1);
            return roundedValue.endsWith('.0') ? roundedValue.slice(0, -2) : roundedValue;
        }

    } catch (error) {
        console.log(error);
    };
}

module.exports = formatNumber;