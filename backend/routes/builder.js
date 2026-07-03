const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Analysis = require("../models/Analysis");
const { generateProfessionalResume } = require("../utils/aiAnalyzer");

router.post("/", auth, async (req, res) => {
    try {
        const { analysisId } = req.body;
        if (!analysisId) return res.status(400).json({ error: "analysisId is required" });

        const analysis = await Analysis.findById(analysisId);
        if (!analysis) return res.status(404).json({ error: "Analysis not found" });

        const content = await generateProfessionalResume(analysis.resumeText, analysis.result);

        res.json({ content, format: "html" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Failed to generate resume" });
    }
});

module.exports = router;
