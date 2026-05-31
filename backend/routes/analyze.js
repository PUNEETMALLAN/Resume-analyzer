const authMiddleware = require("../middleware/auth");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Analysis = require("../models/Analysis");
const auth = require("../middleware/auth");
const { analyzeResume } = require("../utils/aiAnalyzer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        file.mimetype === "application/pdf" ?
            cb(null, true) :
            cb(new Error("Only PDFs allowed"), false);
    },
});

router.post("/", authMiddleware, upload.single("resume"), async(req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "Please upload a PDF." });

        const { jobDescription } = req.body;
        if (!jobDescription || jobDescription.trim().length < 50)
            return res.status(400).json({ error: "Job description too short (min 50 chars)." });

        const pdfData = await pdfParse(req.file.buffer);
        if (!pdfData.text.trim())
            return res.status(400).json({ error: "Could not read PDF text." });

        const result = await analyzeResume(pdfData.text, jobDescription.trim());

        const saved = await Analysis.create({
            resumeText: pdfData.text,
            jobDescription: jobDescription.trim(),
            fileName: req.file.originalname,
            result,
            userId: req.user && req.user.id ? req.user.id : undefined,
        });

        res.json({ id: saved._id, fileName: saved.fileName, result, createdAt: saved.createdAt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Something went wrong." });
    }
});

module.exports = router;