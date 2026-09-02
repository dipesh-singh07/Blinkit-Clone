const mongoose = require("mongoose");

// ==========================================
// DATABASE CONNECTION (MongoDB / Atlas / Local Fallback)
// ==========================================
const connectDB = async () => {
    const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blinkit";
    const localUri = "mongodb://127.0.0.1:27017/blinkit";

    try {
        // Attempt connecting to configured MONGO_URI
        await mongoose.connect(primaryUri, {
            serverSelectionTimeoutMS: 4000
        });

        console.log("=========================================");
        console.log(" Connected to MongoDB successfully!");
        console.log(` URI: ${primaryUri.replace(/:([^:@]+)@/, ":****@")}`);
        console.log("=========================================");
    } catch (primaryError) {
        console.error("⚠️  Primary MongoDB connection failed:", primaryError.message);

        // If primary was an Atlas or external URI that failed, fallback to local MongoDB
        if (primaryUri !== localUri) {
            console.log("🔄 Attempting fallback connection to Local MongoDB (mongodb://127.0.0.1:27017/blinkit)...");
            try {
                await mongoose.connect(localUri, {
                    serverSelectionTimeoutMS: 3000
                });
                console.log("=========================================");
                console.log(" Connected to Local MongoDB successfully!");
                console.log(` URI: ${localUri}`);
                console.log("=========================================");
                return;
            } catch (fallbackError) {
                console.error(" Local MongoDB fallback also failed:", fallbackError.message);
            }
        }

        console.warn("\n📌 ATLAS IP WHITELIST TIP:");
        console.warn("If using MongoDB Atlas, make sure your IP is whitelisted in your Atlas Dashboard:");
        console.warn("Atlas Dashboard -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0)\n");
    }
};

module.exports = connectDB;
