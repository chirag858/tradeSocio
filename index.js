const express = require("express");
const NodeCache = require("node-cache");
// const axios = require("axios");
const route = require('./route');
const app = express();

app.use('/route',route);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
