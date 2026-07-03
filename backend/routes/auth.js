const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// ─────────────────────────────────────────────
// EMAIL TRANSPORTER
// ─────────────────────────────────────────────
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    if (!process.env.SMTP_HOST && process.env.EMAIL_USER && !/@(gmail|googlemail)\.com$/i.test(process.env.EMAIL_USER)) {
        console.log("WARNING: EMAIL_USER is not a Gmail address and SMTP_HOST is not configured.");
        console.log("Set SMTP_HOST, SMTP_PORT, and SMTP_SECURE to your email provider values.");
    }

    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
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
} else {
    console.log("Mail credentials not configured — running in dev mode, OTPs will be logged to console.");
}

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
    // In development, if email credentials are not configured, log the OTP
    // instead of attempting to send mail to avoid crashing the request.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !transporter) {
        console.log(`DEV OTP for ${email}: ${otp}`);
        return false;
    }

    await transporter.sendMail({
        from: `"Resume.ai" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your verification code — Resume.ai",

        html: `
        <div style="font-family:Arial;background:#0a0a0f;color:#f0f8; padding:40px;max-width:480px;margin:0 auto;border-radius:12px">

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

    return true;
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

        const emailSent = await sendOTP(email, otp, name);

        // DEV LOG
        if (process.env.NODE_ENV !== "production") {
            console.log(`OTP for ${email}: ${otp}`);
        }

        const responsePayload = {
            message: "OTP sent successfully",
            email,
            sentTo: email,
        };

        if (!emailSent) {
            responsePayload.warning = "Email service not configured. OTP logged to backend console.";
        }

        if (process.env.NODE_ENV !== "production") {
            responsePayload.devOtp = otp;
        }

        res.status(201).json(responsePayload);

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

// ─────────────────────────────────────────────
// FORGOT PASSWORD - send reset OTP
// POST /api/auth/forgot
// ─────────────────────────────────────────────
router.post("/forgot", async(req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ error: 'Email required.' });

        const user = await User.findOne({ email });
        if (!user) {
            // do not reveal account existence
            return res.json({ message: 'If an account exists, a reset code was sent.' });
        }

        const otp = generateOTP();
        user.resetOtp = otp;
        user.resetOtpExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        await sendOTP(email, otp, user.name);

        const payload = { message: 'Reset code sent to email.' };
        if (process.env.NODE_ENV !== 'production') payload.devOtp = otp;
        res.json(payload);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// ─────────────────────────────────────────────
// RESET PASSWORD - verify OTP and set new password
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
router.post("/reset-password", async(req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const { otp, password } = req.body;
        if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP and new password required.' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid OTP or email.' });

        if (!user.resetOtp || user.resetOtp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
        if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) return res.status(400).json({ error: 'OTP expired.' });

        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

module.exports = router;