const mongoose = require("mongoose");
require('dotenv').config({ path: './config.env' });

function mongooseConnection() {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.MONGODB_URL)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB', err));
}


module.exports = { mongooseConnection }