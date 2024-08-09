const express = require("express");
const NodeCache = require("node-cache");
const axios = require("axios");
const app = express();
const rawJson = require('./raw.json');
const moment = require('moment');
const {determineCacheIntervals , fetchDataFromAPI } = require('./generalFunction') 
// Initialize in-memory cache with a default time-to-live (TTL) of 10 minutes
const cache = new NodeCache({ stdTTL: 600 });



app.get('/timeseries', async (req, res) => {
    try {
    const { symbol, period, start, end } = req.query;

    // Validate that all required query parameters are provided
    if (!symbol || !period || !start || !end) {
        return res.status(400).json({ error: "Symbol, period, start time, and end time are required" });
    }

    // Create a unique cache key based on the symbol, period, and time range
    const cacheKey = `${symbol}-${period}-${start}-${end}`;
    
    console.log(cacheKey , "qwerty CACHE KEY")
    // Attempt to retrieve the cached data for the requested key
    let cachedData = cache.get(cacheKey);

    // If the requested data is found in the cache, return it immediately
    if (cachedData) {
        return res.json(cachedData);
    }

    let data = []; // Array to store the final timeseries data
    let missingIntervals = []; // Array to track intervals that need to be fetched from the API

    // Determine the intervals to check in the cache based on the requested time range
    const cacheIntervals = determineCacheIntervals(symbol, period, start, end);

    // Iterate over the determined intervals to check the cache for existing data
    for (const interval of cacheIntervals) {
        const intervalData = cache.get(interval.key);
        if (intervalData) {
            // If data for this interval is found in the cache, add it to the final data array
            data.push(...intervalData);
        } else {
            // If data for this interval is not found in the cache, add it to the list of missing intervals
            missingIntervals.push(interval);
        }
    }

    // If there are any missing intervals, fetch the missing data from the external API
    if (missingIntervals.length > 0) {
        try {
            for (const interval of missingIntervals) {
                const intervalData = await fetchDataFromAPI(symbol, period, interval.start, interval.end);
                // Cache the newly fetched data for the interval
                cache.set(interval.key, intervalData);
                // Add the newly fetched data to the final data array
                data.push(...intervalData);
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Sort the final combined data by timestamp to ensure it is in chronological order
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Cache the complete data for the requested range using the original cache key
    cache.set(cacheKey, data);

    // Return the final combined data to the client
    res.json(data);
} catch (error) {
    throw new Error("Failed to fetch data from external API",error);
}
});



module.exports = app;