import React, { useState } from 'react';

export default function AIIntelligenceCards({ analytics, auditLedger, blockchainAudit, token }) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const aiAnalysis = analytics?.aiAnalysis || null;
  const exposure = analytics?.exposure || null;
  const urlAnalyses = aiAnalysis?.url_analyses || [];
  const factors = exposure?.factors || null;
  const auditData = auditLedger || blockchainAudit || null;

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const handleVerifyEvent = async () => {
    if (!auditData?.eventId) return;
    setVerifying(true);
    try {
      const resp = await fetch(`${API_BASE}/api/audit/verify/${auditData.eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const data = await resp.json();
      setVerificationResult(data);
    } catch (err) {
      setVerificationResult({ status: 'ERROR', message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="ai-intelligence-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Explainable Risk Score Breakdown */}
      {exposure && (
        <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: '10px', padding: '20px', boxShadow: '0 0 15px rgba(0,243,255,0.1)' }}>
          <h3 style={{ color: '#00f3ff', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Advanced Risk Score Breakdown ({exposure.score}/100 - <span style={{ color: exposure.riskColor }}>{exposure.riskLevel}</span>)
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 16px 0' }}>
            Multi-factor transparent threat calculation incorporating PII severity, leak recency, source reliability, and AI phishing probabilities.
          </p>
          {factors && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #00f3ff' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Phishing Probability</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {(factors.phishing_probability * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ffcc00' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Correlation Score</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {(factors.correlation_score * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ff003c' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>PII Severity Weight</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {(factors.severity * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #00ff66' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Source Reliability</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {(factors.source_reliability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. AI Phishing URL Detection (HuggingFace urlbert) */}
      {urlAnalyses.length > 0 && (
        <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(255, 0, 60, 0.3)', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ color: '#ff003c', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> AI Phishing URL Detection ({urlAnalyses.length} Analyzed)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {urlAnalyses.map((u, i) => (
              <div key={i} style={{ background: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ color: '#00f3ff', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '13px' }}>{u.url}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                    Model: <strong>{u.model || u.model_name}</strong> | Latency: <strong>{u.inference_latency_ms}ms</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: u.classification === 'PHISHING' ? 'rgba(255,0,60,0.2)' : (u.classification === 'SUSPICIOUS' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,102,0.2)'),
                    color: u.classification === 'PHISHING' ? '#ff003c' : (u.classification === 'SUSPICIOUS' ? '#ffcc00' : '#00ff66'),
                    border: `1px solid ${u.classification === 'PHISHING' ? '#ff003c' : (u.classification === 'SUSPICIOUS' ? '#ffcc00' : '#00ff66')}`
                  }}>
                    {u.classification} ({(u.confidence * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SHA-256 Audit Hash Chain / Tamper-Evident Event Ledger */}
      {auditData && (
        <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(0, 255, 102, 0.3)', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ color: '#00ff66', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔗</span> Tamper-Evident Event Ledger (SHA-256 Audit Chain)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', marginTop: '12px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Event ID:</span>
              <div style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{auditData.eventId}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Event Hash (SHA-256):</span>
              <div style={{ color: '#00f3ff', fontFamily: 'monospace', wordBreak: 'break-all' }}>{auditData.canonicalHash || auditData.eventHash}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleVerifyEvent}
              disabled={verifying}
              style={{
                background: 'transparent',
                color: '#00ff66',
                border: '1px solid #00ff66',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              {verifying ? 'Recomputing SHA-256 Hash...' : 'Verify Event Integrity'}
            </button>

            {verificationResult && (
              <span style={{
                color: verificationResult.verified ? '#00ff66' : '#ff003c',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                Status: {verificationResult.status} - {verificationResult.message}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
