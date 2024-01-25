function calculateAverage(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return (sum / arr.length).toFixed(2);
}

function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sortedArr = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0 ? sortedArr[mid] : ((sortedArr[mid - 1] + sortedArr[mid]) / 2).toFixed(2);
}

module.exports = {calculateAverage, calculateMedian};