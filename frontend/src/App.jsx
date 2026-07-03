import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultCard from "./components/ResultCard";
import { buildResume } from "./api/resumeApi";

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState("analyze");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");

  const handleBuild = async () => {
    if (!analysis?.id) {
      setBuildError("Upload and analyze a resume first to build it.");
      setView("analyze");
      return;
    }

    setBuildError("");
    setBuilding(true);

    try {
      const { data } = await buildResume(analysis.id);
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(data.content);
        newWin.document.close();
      }
    } catch (err) {
      setBuildError(err.response?.data?.error || "Failed to build resume.");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header glass-card">
        <div className="header-left">
          <div className="brand-row">
            <span className="brand-dot"></span>
            <span className="brand-name">resume.ai</span>
          </div>
          <p>Build smarter resumes with AI. Upload, analyze, and generate a polished professional resume from one dashboard.</p>
        </div>

        <nav className="top-nav">
          <button className={`nav-link ${view === "analyze" ? "active" : ""}`} onClick={() => setView("analyze")}>Dashboard</button>
          <button className="resume-button" onClick={handleBuild}>
            {building ? "Building..." : "Build Resume"}
          </button>
          <div className="status-pill">
            <span className="status-dot"></span>
            ready
          </div>
          <div className="user-pill">puneet</div>
          <button className="logout-pill">logout</button>
        </nav>
      </header>

      <main className="app-main">
        <section className="panel glass-card">
          {view === "analyze" ? (
            <>
              <h2>Resume Dashboard</h2>
              <p>Upload your resume PDF and paste the job description to get a match score, missing keywords, and suggestions.</p>
              <UploadForm onResult={(data) => setAnalysis(data)} />
            </>
          ) : (
            <>
              <h2>Resume Builder</h2>
              <p>Generate a polished professional resume from your latest analysis.</p>
              {analysis ? (
                <div className="builder-panel">
                  <p><strong>Current file:</strong> {analysis.fileName}</p>
                  <p><strong>Match score:</strong> {analysis.result.matchScore}%</p>
                  <button className="action-button" onClick={handleBuild} disabled={building}>
                    {building ? "Building resume..." : "Build Professional Resume"}
                  </button>
                  {buildError && <p className="error-text">{buildError}</p>}
                </div>
              ) : (
                <div className="empty-panel">
                  <p>Analyze a resume first, then open the builder tab to create the final resume.</p>
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel glass-card">
          <h2>Analysis Preview</h2>
          {analysis ? (
            <ResultCard result={analysis.result} />
          ) : (
            <div className="empty-panel">
              <p>No analysis available. Upload a resume to get started.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
