const express = require("express");
const router = express.Router();
const Analysis = require("../models/Analysis");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async(req, res) => {
    try {
        const list = await Analysis.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("-resumeText");
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", authMiddleware, async(req, res) => {
    try {
        const doc = await Analysis.findOne({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ error: "Not found." });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const doc = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ error: "Not found or not authorized." });
        res.json({ message: "Deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;