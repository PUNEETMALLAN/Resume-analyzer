import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultCard from "./components/ResultCard";

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1>AI Resume Analyzer</h1>
      <p>Upload your resume and paste a job description to get an AI-powered match score.</p>

      <UploadForm onResult={(data) => setResult(data.result)} />

      {result && <ResultCard result={result} />}
    </div>
  );
}