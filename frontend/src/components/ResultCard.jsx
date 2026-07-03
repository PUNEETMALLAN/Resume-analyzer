export default function ResultCard({ result }) {
  const { matchScore, missingKeywords, suggestions, summary, suggestedJobs = [] } = result;

  return (
    <div className="result-card">
      <div className="score-display">{matchScore}%</div>
      <p className="summary-text">{summary}</p>

      <div className="section">
        <h3>Missing Keywords</h3>
        <div className="tag-grid">
          {missingKeywords.map((kw) => (
            <span key={kw} className="skill-tag">{kw}</span>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Suggestions</h3>
        <ul>
          {suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      {suggestedJobs.length > 0 && (
        <div className="section">
          <h3>Suggested Job Titles</h3>
          <div className="tag-grid">
            {suggestedJobs.map((job) => (
              <span key={job} className="job-tag">{job}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
