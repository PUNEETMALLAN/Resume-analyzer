import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultCard from "./components/ResultCard";
import HistoryList from "./components/HistoryList";
import { buildResume } from "./api/resumeApi";

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState("analyze");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [history, setHistory] = useState([]);

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
    <div className="app-shell">
      <header className="hero-pill glass-card animated-card">
        <div className="hero-label">RESUME.AI</div>
      </header>

      <div className="dashboard-grid">
        <section className="glass-panel input-card animated-card">
          <div className="card-header">
            <div className="card-icon">📝</div>
            <div>
              <div className="eyebrow">Input</div>
              <h2>Drop your resume</h2>
            </div>
          </div>

          <UploadForm
            onResult={(data) => {
              setAnalysis(data);
              setHistory((prev) => [data, ...prev]);
            }}
          />
        </section>

        <section className="glass-panel preview-card animated-card">
          <div className="card-header">
            <div className="card-icon">👁️</div>
            <div>
              <div className="eyebrow">Live preview</div>
              <h2>Resume preview</h2>
            </div>
          </div>

          <div className="preview-content">
            {analysis ? (
              <ResultCard result={analysis.result} />
            ) : (
              <div className="preview-placeholder">
                <div className="preview-placeholder-icon">📄</div>
                <p>Your resume preview will appear here</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel history-card animated-card">
        <div className="history-header">
          <div>
            <div className="eyebrow">Scan History</div>
            <p className="history-subtitle">Your analyzed resumes will appear here</p>
          </div>
          <button className="filter-btn">Filter</button>
        </div>

        {history.length > 0 ? (
          <HistoryList
            history={history}
            onSelect={(item) => setAnalysis(item)}
            onClear={() => setHistory([])}
          />
        ) : (
          <div className="history-placeholder">
            <div className="history-icon">📂</div>
            <p>No scans yet</p>
            <span>Upload a resume to start analyzing.</span>
          </div>
        )}
      </section>

      <footer className="bottom-nav glass-card animated-card">
        <button className={`nav-item ${view === "analyze" ? "active" : ""}`} onClick={() => setView("analyze")}>
          <span className="nav-icon">📄</span>
          Resume Analyzer
        </button>
        <button className={`nav-item ${view === "builder" ? "active" : ""}`} onClick={() => setView("builder")}>
          <span className="nav-icon">🧾</span>
          Resume Builder
        </button>
        <button className="nav-item">
          <span className="nav-icon">👤</span>
          Profile
        </button>
        <button className="nav-item">
          <span className="nav-icon">⚙️</span>
          Settings
        </button>
      </footer>
    </div>
  );
}

