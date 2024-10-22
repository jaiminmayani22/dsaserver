require("dotenv").config();
const config = require('config');
const mongoose = require("mongoose");

mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(config.get("DB_SUCCESS_CONNECT"), process.env.MONGO_URI);
    } catch (err) {
        console.log(config.get("DB_FAILED_CONNECT"), err.message);
    }
};

module.exports = connectDB;
