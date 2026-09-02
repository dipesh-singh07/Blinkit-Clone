const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blinkit";

async function seedDatabase() {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully!");

        // 1. Clear existing sample data
        console.log("Cleaning old data...");
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        // 2. Create Default Users (with hashed passwords)
        console.log("Creating default users...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const users = await User.create([
            {
                name: "Rahul Customer",
                email: "customer@blinkit.com",
                password: hashedPassword,
                role: "customer",
                address: "Flat 402, Green Meadows, Andheri West, Mumbai"
            },
            {
                name: "Admin Boss",
                email: "admin@blinkit.com",
                password: hashedPassword,
                role: "admin",
                address: "Blinkit Central Office, Cyber City, Gurgaon"
            },
            {
                name: "Suresh Rider",
                email: "delivery@blinkit.com",
                password: hashedPassword,
                role: "delivery",
                address: "Blinkit Hub 12, Powai, Mumbai"
            }
        ]);
        console.log(`Created ${users.length} users (Password: password123 for all)`);

        // 3. Create Sample Categories
        console.log("Creating categories...");
        const categories = await Category.create([
            {
                name: "Dairy, Bread & Eggs",
                description: "Fresh milk, curd, paneer, butter, brown & white breads, farm eggs.",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Fruits & Vegetables",
                description: "Farm fresh fruits, leafy greens, onions, potatoes and organic veggies.",
                image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Snacks & Munchies",
                description: "Crisps, chips, roasted nuts, popcorn, and traditional namkeens.",
                image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Cold Drinks & Juices",
                description: "Soft drinks, sparkling water, fruit juices, and cold brewed beverages.",
                image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Instant Food & Noodles",
                description: "Instant noodles, pasta, ready-to-eat meals, soups and sauces.",
                image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Bakery & Biscuits",
                description: "Cookies, cream biscuits, rusks, cakes, and artisanal pastries.",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60"
            },
            {
                name: "Personal Care",
                description: "Shampoos, soaps, toothpaste, body washes and grooming essentials.",
                image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60"
            }
        ]);
        console.log(`Created ${categories.length} categories.`);

        // Map categories by name for easy reference
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name] = c._id;
        });

        // 4. Create Sample Products
        console.log("Creating sample products...");
        const products = await Product.create([
            // Dairy, Bread & Eggs
            {
                name: "Amul Taaza Toned Fresh Milk",
                description: "Pasteurized toned milk, rich in calcium and essential vitamins.",
                price: 27,
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Dairy, Bread & Eggs"],
                quantity: 150,
                unit: "500 ml",
                brand: "Amul",
                isAvailable: true
            },
            {
                name: "Britannia 100% Whole Wheat Brown Bread",
                description: "Healthy and wholesome whole wheat bread baked to perfection.",
                price: 45,
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Dairy, Bread & Eggs"],
                quantity: 80,
                unit: "400 g",
                brand: "Britannia",
                isAvailable: true
            },
            {
                name: "Farm Fresh White Eggs",
                description: "Protein-rich fresh white table eggs, directly sourced from poultry farms.",
                price: 75,
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Dairy, Bread & Eggs"],
                quantity: 60,
                unit: "6 pcs",
                brand: "Eggoz",
                isAvailable: true
            },
            {
                name: "Amul Pasteurised Salted Butter",
                description: "Delicious and creamy salted table butter, utterly butterly delicious.",
                price: 58,
                image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Dairy, Bread & Eggs"],
                quantity: 100,
                unit: "100 g",
                brand: "Amul",
                isAvailable: true
            },

            // Fruits & Vegetables
            {
                name: "Fresh Hybrid Tomato",
                description: "Firm, bright red juicy tomatoes ideal for curries, salads and soups.",
                price: 34,
                image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Fruits & Vegetables"],
                quantity: 200,
                unit: "1 kg",
                brand: "Farm Fresh",
                isAvailable: true
            },
            {
                name: "Fresh Jyoti Potato (Aloo)",
                description: "Daily cooking essential, fresh and clean golden skin potatoes.",
                price: 28,
                image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Fruits & Vegetables"],
                quantity: 250,
                unit: "1 kg",
                brand: "Farm Fresh",
                isAvailable: true
            },
            {
                name: "Robusta Fresh Bananas",
                description: "Sweet, potassium-rich golden ripe bananas ready to eat.",
                price: 48,
                image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Fruits & Vegetables"],
                quantity: 120,
                unit: "1 kg (approx 6-8 pcs)",
                brand: "Fresh Produce",
                isAvailable: true
            },
            {
                name: "Royal Gala Crisp Apples",
                description: "Sweet, crunchy and juicy imported apples loaded with dietary fiber.",
                price: 160,
                image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Fruits & Vegetables"],
                quantity: 90,
                unit: "4 pcs (approx 600g)",
                brand: "Fresh Produce",
                isAvailable: true
            },

            // Snacks & Munchies
            {
                name: "Lay's India's Magic Masala Potato Chips",
                description: "Crispy ridge cut potato chips seasoned with authentic spicy Indian masalas.",
                price: 20,
                image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Snacks & Munchies"],
                quantity: 300,
                unit: "50 g",
                brand: "Lay's",
                isAvailable: true
            },
            {
                name: "Kurkure Masala Munch Crisps",
                description: "Crunchy puffed corn curls packed with a mouth-watering spicy punch.",
                price: 20,
                image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Snacks & Munchies"],
                quantity: 200,
                unit: "75 g",
                brand: "Kurkure",
                isAvailable: true
            },

            // Instant Food & Noodles
            {
                name: "Maggi 2-Minute Masala Instant Noodles",
                description: "India's favorite instant noodle with iconic tastemaker spice blend.",
                price: 14,
                image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Instant Food & Noodles"],
                quantity: 400,
                unit: "70 g",
                brand: "Nestle Maggi",
                isAvailable: true
            },

            // Cold Drinks & Juices
            {
                name: "Coca-Cola Original Taste",
                description: "Refreshing carbonated cola soft drink served chilled.",
                price: 40,
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Cold Drinks & Juices"],
                quantity: 180,
                unit: "750 ml",
                brand: "Coca-Cola",
                isAvailable: true
            },

            // Bakery & Biscuits
            {
                name: "Parle-G Original Glucose Biscuits",
                description: "Classic golden baked glucose biscuits packed with nourishment and taste.",
                price: 10,
                image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Bakery & Biscuits"],
                quantity: 500,
                unit: "250 g",
                brand: "Parle",
                isAvailable: true
            },
            {
                name: "Oreo Original Vanilla Creme Cookies",
                description: "Rich dark cocoa biscuit sandwich filled with smooth vanilla cream.",
                price: 35,
                image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Bakery & Biscuits"],
                quantity: 160,
                unit: "120 g",
                brand: "Cadbury Oreo",
                isAvailable: true
            },

            // Personal Care
            {
                name: "Head & Shoulders Smooth & Silky Anti-Dandruff Shampoo",
                description: "Gentle formula leaves hair soft, silky and up to 100% flake-free.",
                price: 145,
                image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Personal Care"],
                quantity: 75,
                unit: "180 ml",
                brand: "Head & Shoulders",
                isAvailable: true
            },
            {
                name: "Colgate Strong Teeth Dental Cream Toothpaste",
                description: "Calcium-boosted toothpaste for cavity protection and fresh breath.",
                price: 65,
                image: "https://images.unsplash.com/photo-1559591937-e129188a82cf?w=500&auto=format&fit=crop&q=60",
                category: categoryMap["Personal Care"],
                quantity: 110,
                unit: "150 g",
                brand: "Colgate",
                isAvailable: true
            }
        ]);
        console.log(`Created ${products.length} products.`);

        console.log("\n=========================================");
        console.log("DATABASE SEEDED SUCCESSFULLY!");
        console.log("=========================================");
        console.log("Default Login Credentials for Testing:");
        console.log("1. Customer: customer@blinkit.com | Password: password123");
        console.log("2. Admin:    admin@blinkit.com    | Password: password123");
        console.log("3. Delivery: delivery@blinkit.com | Password: password123");
        console.log("=========================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
