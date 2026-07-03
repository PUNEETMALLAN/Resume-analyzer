# Resume Analyzer

**Resume Analyzer** is a full-stack resume analysis app that lets users upload a PDF resume and compare it against a job description. The backend runs on Express/MongoDB, and the frontend provides a rich UI for uploading resumes, viewing AI-driven match scores, missing keywords, and improvement suggestions.

## Key Features

- User authentication with JWT
- PDF resume upload and parsing
- AI resume analysis and scoring
- Personalized history per authenticated user
- Simple login/register UI in the frontend

## Structure

- `backend/` — Express server, MongoDB models, auth routes, analysis and history endpoints
- `frontend/` — client UI for resume upload, job description input, analysis results, and auth

## Getting Started

1. Configure `backend/.env` with `MONGO_URI`, `CLIENT_URL`, and `JWT_SECRET`.
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start backend: `npm run dev`
5. Start frontend: `npm run dev`

## Notes

The backend currently uses `bcryptjs` and `jsonwebtoken` for auth and stores analysis records tied to user accounts.

## Deploying to Render

This repo is ready for deployment to Render using a single web service.

1. Connect your GitHub repository to Render.
2. Create a new Web Service.
3. Set the environment to `Node`.
4. Use the following settings:
   - Root directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `CLIENT_URL` (optional, if using CORS)
     - `EMAIL_USER`, `EMAIL_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (optional for email)
     - `GROQ_API_KEY` (required for AI resume generation)
5. Deploy the service and visit the Render URL.

Because the backend now serves static files from the `/frontend` folder, the full app is available from the same domain.
