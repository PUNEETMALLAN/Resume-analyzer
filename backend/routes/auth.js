const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// ─────────────────────────────────────────────
// EMAIL TRANSPORTER
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// VERIFY MAIL SERVER
transporter.verify(function(error, success) {
    if (error) {
        console.log("Mail Error:", error);
    } else {
        console.log("Mail server ready");
    }
});

// ─────────────────────────────────────────────
// OTP GENERATOR
// ─────────────────────────────────────────────
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// SEND OTP MAIL
// ─────────────────────────────────────────────
async function sendOTP(email, otp, name) {

    console.log("Sending OTP to:", email);

    await transporter.sendMail({
        from: `"Resume.ai" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your verification code — Resume.ai",

        html: `
        <div style="font-family:Arial;background:#0a0a0f;color:#f0f0f8;padding:40px;max-width:480px;margin:0 auto;border-radius:12px">

            <h2 style="color:#7c6af7;margin-bottom:8px">
                resume<span style="color:#fff">.</span>ai
            </h2>

            <p style="color:#9090aa;margin-bottom:24px">
                Hi ${name}, verify your email to get started.
            </p>

            <div style="background:#1a1a24;border:1px solid #ffffff0f;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">

                <p style="color:#55556a;font-size:12px;margin-bottom:8px;letter-spacing:0.1em">
                    YOUR VERIFICATION CODE
                </p>

                <h1 style="font-size:42px;font-weight:800;color:#7c6af7;letter-spacing:8px">
                    ${otp}
                </h1>

                <p style="color:#55556a;font-size:11px;margin-top:8px">
                    expires in 10 minutes
                </p>
            </div>

            <p style="color:#55556a;font-size:11px">
                If you didn't create an account, ignore this email.
            </p>
        </div>
        `,
    });
}

// ─────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post("/register", async(req, res) => {

    try {

        const { name, password } = req.body;

        const email = req.body.email.trim().toLowerCase();

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required."
            });
        }

        // CHECK EXISTING USER
        const exists = await User.findOne({ email });

        if (exists && exists.isVerified) {
            return res.status(400).json({
                error: "Email already registered."
            });
        }

        // HASH PASSWORD
        const hashed = await bcrypt.hash(password, 10);

        // GENERATE OTP
        const otp = generateOTP();

        // OTP EXPIRY
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // UPDATE OR CREATE USER
        if (exists) {

            exists.name = name;
            exists.password = hashed;
            exists.otp = otp;
            exists.otpExpiresAt = otpExpiresAt;

            await exists.save();

        } else {

            await User.create({
                name,
                email,
                password: hashed,
                otp,
                otpExpiresAt,
                isVerified: false,
            });
        }

        // DEV LOG
        if (process.env.NODE_ENV !== "production") {
            console.log(`OTP for ${email}: ${otp}`);
        }

        // SEND EMAIL
        await sendOTP(email, otp, name);

        res.status(201).json({
            message: "OTP sent successfully",
            email,
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message || "Server error",
        });
    }
});

// ─────────────────────────────────────────────
// VERIFY OTP
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────
router.post("/verify-otp", async(req, res) => {

    try {

        const email = req.body.email.trim().toLowerCase();

        const { otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                error: "Email and OTP required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: "User not found."
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                error: "Invalid OTP."
            });
        }

        if (user.otpExpiresAt < new Date()) {
            return res.status(400).json({
                error: "OTP expired. Register again."
            });
        }

        // VERIFY USER
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;

        await user.save();

        // JWT TOKEN
        const token = jwt.sign({
                id: user._id,
                name: user.name,
            },
            process.env.JWT_SECRET, {
                expiresIn: "7d",
            }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message || "Server error",
        });
    }
});

// ─────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post("/login", async(req, res) => {

    try {

        const password = req.body.password;

        const email = req.body.email.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: "Invalid email or password."
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                error: "Please verify your email first."
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({
                error: "Invalid email or password."
            });
        }

        // JWT TOKEN
        const token = jwt.sign({
                id: user._id,
                name: user.name,
            },
            process.env.JWT_SECRET, {
                expiresIn: "7d",
            }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message || "Server error",
        });
    }
});

module.exports = router;