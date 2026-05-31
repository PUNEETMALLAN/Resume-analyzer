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

module.exports = { analyzeResume };