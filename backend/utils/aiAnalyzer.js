const Groq = require("groq-sdk");

let groq = null;

function getGroqClient() {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing from your .env file");
        }
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groq;
}

async function analyzeResume(resumeText, jobDescription) {
    const client = getGroqClient();

    const prompt = `
You are an expert resume coach and ATS specialist.
Analyze the resume against the job description and return ONLY a JSON object:
{
    "matchScore": <0-100>,
    "missingKeywords": ["keyword1", "keyword2"],
    "suggestions": ["tip1", "tip2", "tip3"],
    "suggestedJobs": ["Job Title 1", "Job Title 2"],
    "summary": "2-3 sentence assessment"
}

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}
`.trim();

    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
    });

    const raw = response.choices[0].message.content.trim();
    const clean = raw.replace(/^```json|^```|```$/gm, "").trim();
    return JSON.parse(clean);
}

async function generateProfessionalResume(resumeText, analysisResult) {
    const client = getGroqClient();

    const prompt = `
You are an expert resume writer. Given the candidate's resume text and the analysis (match score, missing keywords, suggestions, suggested jobs), produce a polished, professional resume in HTML. Keep formatting clean and use semantic tags (header, section, h1/h2, ul). Return ONLY the HTML string.

--- RESUME_TEXT ---
${resumeText}

--- ANALYSIS ---
${JSON.stringify(analysisResult, null, 2)}
`.trim();

    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1200,
    });

    const raw = response.choices[0].message.content.trim();
    const clean = raw.replace(/^```(?:html)?|```$/gm, "").trim();
    return clean;
}

module.exports = { analyzeResume, generateProfessionalResume };