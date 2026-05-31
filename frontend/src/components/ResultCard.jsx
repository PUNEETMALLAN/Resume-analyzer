export default function ResultCard({ result }) {
  const { matchScore, missingKeywords, suggestions, summary } = result;

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20, marginTop: 24 }}>
      <h2>Match Score: {matchScore}%</h2>
      <p>{summary}</p>

      <h3>Missing Keywords</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {missingKeywords.map((kw) => (
          <span key={kw} style={{ background: "#fee2e2", padding: "4px 10px", borderRadius: 20, fontSize: 13 }}>
            {kw}
          </span>
        ))}
      </div>

      <h3>Suggestions</h3>
      <ul>
        {suggestions.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}