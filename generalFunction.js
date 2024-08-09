const rawJson = require('./raw.json');
const NodeCache = require("node-cache");
const axios = require("axios");
const moment = require('moment');
const cache = new NodeCache({ stdTTL: 600 });


const fetchDataFromAPI = async (symbol, period, startTime, endTime) => {
    try {
        const filteredData = filterDataByTimestamp( startTime, endTime);

        const responseData = filteredData; 
        return responseData;
    } catch (error) {
        // Handle any errors that occur during the API request
        throw new Error("Failed to fetch data from external API in fetchDataFromAPI",error);
    }
};
function filterDataByTimestamp(start, endtime) {
    // Convert start and end times to moment objects for comparison
    const startTime = moment(start);
    const endTime = moment(endtime);

    // Filter the dataset based on the timestamp range
    
    return rawJson.data.filter(item => {
        const itemTime = moment(item.timestamp);
        // Check if the item's timestamp is >= startTime and < endTime
        return itemTime.isBetween(startTime, endTime, undefined, '[)');
    });
}

const determineCacheIntervals = (symbol, period, start, end) => {
    const intervals = [];
    let currentTime = new Date(start).getTime(); // Start time in milliseconds
    const endTime = new Date(end).getTime(); // End time in milliseconds
    const intervalDuration = getIntervalDuration(period); // Duration of each period in milliseconds

    // Split the requested time range into smaller intervals based on the period
    while (currentTime < endTime) {
        const nextTime = Math.min(currentTime + intervalDuration, endTime);
        intervals.push({
            key: `${symbol}-${period}-${new Date(currentTime).toISOString()}-${new Date(nextTime).toISOString()}`,
            start: new Date(currentTime).toISOString(),
            end: new Date(nextTime).toISOString()
        });
        currentTime = nextTime;
    }
    return intervals;
};

const getIntervalDuration = (period) => {
    switch (period) {
        case '1min': return 60 * 1000; // 1 minute in milliseconds
        case '5min': return 5 * 60 * 1000; // 5 minutes in milliseconds
        case '1hour': return 60 * 60 * 1000; // 1 hour in milliseconds
        case '1day': return 24 * 60 * 60 * 1000; // 1 day in milliseconds
        default: throw new Error("Invalid period");
    }
};


module.exports ={ determineCacheIntervals ,fetchDataFromAPI};