import { useState } from "react";
import { analyzeResume } from "../api/resumeApi";

export default function UploadForm({ onResult }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Please select a resume file.");
    if (jd.trim().length < 20) return setError("Job description too short.");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jd);

    try {
      setLoading(true);
      const { data } = await analyzeResume(formData);
      onResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form animated-card">
      <div
        className={`drop-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        {file ? (
          <div className="file-preview">
            <strong>{file.name}</strong>
            <span className="muted"> — click to change</span>
          </div>
        ) : (
          <div className="drop-placeholder">
            <p className="drop-title">Drop your resume here</p>
            <p className="drop-sub">PDF, DOCX, TXT (Max 10MB)</p>
          </div>
        )}
        <input
          id="fileInput"
          style={{ display: 'none' }}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <label className="desc-label">Description</label>
      <textarea
        className="jd-input"
        rows={8}
        maxLength={500}
        placeholder="Add a brief description about your resume..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      <div className="char-count">{jd.length}/500</div>

      {error && <p className="error-text">{error}</p>}
      <button className="submit-btn analyze-btn" type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>
    </form>
  );
}