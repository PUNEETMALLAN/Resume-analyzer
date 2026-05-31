const { webcrypto } = require("crypto");
globalThis.crypto = webcrypto;

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const analyzeRoutes = require("./routes/analyze");
const historyRoutes = require("./routes/history");
const authRoutes = require("./routes/auth");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://[::1]:3000",
    "http://[::1]:3001",
    "http://[::1]:5173",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:3001",
    "http://0.0.0.0:5173",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS origin not allowed'));
    }
}));
app.use(express.json());

app.use("/api/analyze", analyzeRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })
    .catch((err) => {
        console.error("❌ MongoDB error:", err.message);
        process.exit(1);
    });