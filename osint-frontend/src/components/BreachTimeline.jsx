import React from 'react';

export default function BreachTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="empty-icon">⏱</div>
        <h3>No chronological breach timeline detected</h3>
        <p>Intelligence data contains unstructured records without explicit timestamp anchors.</p>
      </div>
    );
  }

  return (
    <div className="breach-timeline-container">
      <div className="timeline-header-meta">
        <span className="meta-title">CHRONOLOGICAL EXPOSURE TIMELINE</span>
        <span className="meta-count">{events.length} Historical Incident{events.length > 1 ? 's' : ''}</span>
      </div>

      <div className="timeline-wrapper">
        <div className="timeline-spine" />
        <div className="timeline-list">
          {events.map((evt, idx) => (
            <div className="timeline-item slide-in" key={idx} style={{ animationDelay: `${idx * 0.15}s` }}>
              <div className="timeline-marker">
                <span className="marker-dot" />
                <span className="marker-year">{evt.year}</span>
              </div>
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <span className="source-name">💾 {evt.source}</span>
                  <span className={`category-tag ${String(evt.severity || 'high').toLowerCase()}`}>
                    {evt.category || 'Data Breach'}
                  </span>
                </div>
                <div className="timeline-card-body">
                  {evt.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
