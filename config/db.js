const mongoose = require("mongoose");

// =========================================================================
// DATABASE CONNECTION (MongoDB / MongoDB Atlas)
// =========================================================================
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error(
                "MONGO_URI is not defined. Please set MONGO_URI in your .env file or Render Environment Variables."
            );
        }

        console.log("⏳ Connecting to MongoDB...");

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 8000 // 8-second timeout for server selection
        });

        console.log("=========================================");
        console.log(" Connected to MongoDB successfully!");
        console.log(` Host: ${conn.connection.host}`);
        console.log(` Database: ${conn.connection.name}`);
        console.log("=========================================");
    } catch (error) {
        console.error("=========================================");
        console.error(" MongoDB connection error:", error.message);
        console.error("=========================================");
        console.error("📌 MongoDB Atlas Troubleshooting:");
        console.error("1. Ensure 'MONGO_URI' is added in your Render Dashboard -> Environment Variables.");
        console.error("2. Ensure MongoDB Atlas Network Access has '0.0.0.0/0' (Allow Access from Anywhere) enabled.");
        console.error("3. Ensure your database username & password in the connection string are correct.");
        console.error("=========================================");
        throw error;
    }
};

module.exports = connectDB;
