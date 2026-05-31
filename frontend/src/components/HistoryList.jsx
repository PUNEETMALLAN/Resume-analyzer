import React from 'react';
import { clearHistory } from '../api/resumeApi';

function HistoryList({ history, onSelect, onClear }) {
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await clearHistory();
        onClear();
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <div className="history-list">
      <h2>Analysis History</h2>
      <ul className="history-items">
        {history.map((item) => (
          <li
            key={item.id}
            className="history-item"
            onClick={() => onSelect(item)}
          >
            <div>
              <strong>{item.fileName || 'Untitled'}</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#999' }}>
              {new Date(item.createdAt).toLocaleString()}
            </div>
            {item.analysis?.score && (
              <div style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 'bold' }}>
                Score: {item.analysis.score}/100
              </div>
            )}
          </li>
        ))}
      </ul>
      <button className="clear-history-btn" onClick={handleClearHistory}>
        Clear All History
      </button>
    </div>
  );
}

export default HistoryList;
