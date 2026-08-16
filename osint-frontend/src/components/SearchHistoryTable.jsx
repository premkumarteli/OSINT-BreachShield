import React, { useState } from 'react';

export default function SearchHistoryTable({ history = [], onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = history.filter(item => {
    const q = String(item.query || '').toLowerCase();
    const matchQuery = q.includes(searchTerm.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || item.risk_level === riskFilter;
    const matchType = typeFilter === 'ALL' || item.search_type === typeFilter;
    return matchQuery && matchRisk && matchType;
  });

  const getRiskColor = (risk) => {
    switch (String(risk).toUpperCase()) {
      case 'CRITICAL': return '#ff003c';
      case 'HIGH': return '#ff6a00';
      case 'MEDIUM': return '#ffcc00';
      default: return '#00ff66';
    }
  };

  return (
    <div className="history-table-wrapper">
      <div className="history-toolbar">
        <input
          type="text"
          className="history-search-input"
          placeholder="🔍 Search target query..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select className="history-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="Email">Email</option>
          <option value="Mobile">Mobile</option>
          <option value="Other">Other</option>
        </select>
        <select className="history-filter-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="ALL">All Risks</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Target Identifier</th>
              <th>Vector</th>
              <th>Score</th>
              <th>Risk Level</th>
              <th>Records</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id}>
                <td className="target-cell">
                  <span className="mono-target">{row.query}</span>
                </td>
                <td>
                  <span className="vector-pill">{row.search_type || 'Email'}</span>
                </td>
                <td>
                  <span className="score-badge">{row.exposure_score || 0}/100</span>
                </td>
                <td>
                  <span
                    className="risk-pill"
                    style={{
                      borderColor: getRiskColor(row.risk_level),
                      color: getRiskColor(row.risk_level),
                      backgroundColor: `${getRiskColor(row.risk_level)}18`
                    }}
                  >
                    {row.risk_level || 'LOW'}
                  </span>
                </td>
                <td>{row.records_found || 1}</td>
                <td className="time-cell">
                  {new Date(row.created_at || Date.now()).toLocaleDateString()} {new Date(row.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <button className="del-btn" title="Delete audit entry" onClick={() => onDelete(row.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-table-cell">
                  No investigation history matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
