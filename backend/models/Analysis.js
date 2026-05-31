const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    fileName: { type: String, default: "resume.pdf" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    result: {
        matchScore: Number,
        missingKeywords: [String],
        suggestions: [String],
        summary: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("Analysis", analysisSchema);