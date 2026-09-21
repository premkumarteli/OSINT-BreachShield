import React, { useState } from 'react';

const MODEL_COLORS = {
  hf_urlbert: { bg: '#00f3ff', label: 'HF UrlBERT' },
  cnn: { bg: '#ff003c', label: 'CNN (Char-1D)' },
  rnn: { bg: '#ffcc00', label: 'RNN (BiLSTM)' },
  transformer: { bg: '#a855f7', label: 'Transformer' },
  xgboost: { bg: '#64748b', label: 'XGBoost (experimental)' },
};

export default function AIIntelligenceCards({ analytics, auditLedger, blockchainAudit, token }) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareUrl, setCompareUrl] = useState('');

  const aiAnalysis = analytics?.aiAnalysis || null;
  const urlAnalyses = aiAnalysis?.url_analyses || [];
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

  const handleCompare = async () => {
    if (!compareUrl.trim()) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const resp = await fetch(`${API_BASE}/api/ai/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ url: compareUrl.trim() })
      });
      const data = await resp.json();
      setCompareResult(data);
    } catch (err) {
      setCompareResult({ error: err.message });
    } finally {
      setComparing(false);
    }
  };

  const getConfidenceColor = (prob) => {
    if (prob >= 0.7) return '#ff003c';
    if (prob >= 0.4) return '#ffcc00';
    return '#00ff66';
  };

  return (
    <div className="ai-intelligence-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* AI Phishing URL Detection (HuggingFace urlbert) */}
      {urlAnalyses.length > 0 && (
        <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(255, 0, 60, 0.3)', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ color: '#ff003c', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> AI Phishing URL Detection ({urlAnalyses.length} Analyzed)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {urlAnalyses.map((u, i) => (
              <div key={i} style={{ background: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ color: '#00f3ff', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '13px' }}>{u.url}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                    Model: <strong>{u.model || u.model_name}</strong> | Latency: <strong>{u.inference_latency_ms}ms</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
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

      {/* 3. Multi-Model Comparison */}
      <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ color: '#a855f7', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🧠</span> Multi-Model Comparison (5 Models)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>
          Compare phishing classification across HF UrlBERT, CNN, RNN, Transformer, and XGBoost architectures.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <input
            type="text"
            value={compareUrl}
            onChange={(e) => setCompareUrl(e.target.value)}
            placeholder="Enter URL to compare (e.g. https://suspicious-site.xyz/login)"
            style={{
              flex: '1 1 260px',
              minWidth: 0,
              background: '#030712',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#e2e8f0',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          />
          <button
            onClick={handleCompare}
            disabled={comparing || !compareUrl.trim()}
            style={{
              flex: '0 0 auto',
              background: comparing ? '#1a1a2e' : 'rgba(168,85,247,0.2)',
              color: '#a855f7',
              border: '1px solid #a855f7',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: comparing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              opacity: (!compareUrl.trim() || comparing) ? 0.5 : 1,
            }}
          >
            {comparing ? 'Analyzing...' : 'Compare All Models'}
          </button>
        </div>

        {compareResult && !compareResult.error && (
          <div>
            {/* Ensemble verdict */}
            <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', marginBottom: '12px', border: `1px solid ${getConfidenceColor(compareResult.ensemble?.phishing_probability || 0)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>ENSEMBLE VERDICT</span>
                  <div style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 'bold', marginTop: '2px' }}>
                    {compareResult.ensemble?.classification}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Probability</span>
                  <div style={{ color: getConfidenceColor(compareResult.ensemble?.phishing_probability || 0), fontSize: '20px', fontWeight: 'bold' }}>
                    {((compareResult.ensemble?.phishing_probability || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '6px' }}>
                Average of {compareResult.ensemble?.model_count} models | {compareResult.inference_latency_ms}ms total
              </div>
            </div>

            {/* Individual model cards — validated models */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
              {Object.entries(compareResult.models || {}).filter(([key]) => key !== 'xgboost').map(([key, model]) => {
                const color = MODEL_COLORS[key] || { bg: '#64748b', label: key };
                return (
                  <div key={key} style={{ background: '#030712', padding: '14px', borderRadius: '8px', border: `1px solid ${color.bg}33` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: color.bg, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{color.label}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: model.classification === 'PHISHING' ? 'rgba(255,0,60,0.2)' : (model.classification === 'SUSPICIOUS' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,102,0.2)'),
                        color: model.classification === 'PHISHING' ? '#ff003c' : (model.classification === 'SUSPICIOUS' ? '#ffcc00' : '#00ff66'),
                        fontWeight: 'bold',
                      }}>
                        {model.classification}
                      </span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold' }}>
                      {((model.phishing_probability || 0) * 100).toFixed(1)}%
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>
                      {model.model_name} | {model.inference_latency_ms}ms
                    </div>
                    {/* Confidence bar */}
                    <div style={{ background: '#1a1a2e', height: '4px', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(model.phishing_probability || 0) * 100}%`,
                        height: '100%',
                        background: color.bg,
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Experimental XGBoost — visually separated, not part of ensemble */}
            {compareResult.models?.xgboost && (
              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', border: '1px dashed #64748b', background: 'rgba(100,116,139,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Not part of ensemble — experimental model
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                  <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid #64748b33' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>XGBoost (experimental)</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: compareResult.models.xgboost.classification === 'PHISHING' ? 'rgba(255,0,60,0.2)' : (compareResult.models.xgboost.classification === 'SUSPICIOUS' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,102,0.2)'),
                        color: compareResult.models.xgboost.classification === 'PHISHING' ? '#ff003c' : (compareResult.models.xgboost.classification === 'SUSPICIOUS' ? '#ffcc00' : '#00ff66'),
                        fontWeight: 'bold',
                      }}>
                        {compareResult.models.xgboost.classification}
                      </span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold' }}>
                      {((compareResult.models.xgboost.phishing_probability || 0) * 100).toFixed(1)}%
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>
                      {compareResult.models.xgboost.model_name} | {compareResult.models.xgboost.inference_latency_ms}ms
                    </div>
                    <div style={{ background: '#1a1a2e', height: '4px', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(compareResult.models.xgboost.phishing_probability || 0) * 100}%`,
                        height: '100%',
                        background: '#64748b',
                        borderRadius: '2px',
                      }} />
                    </div>
                    {compareResult.models.xgboost.disclosure && (
                      <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.4' }}>
                        {compareResult.models.xgboost.disclosure}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {compareResult?.error && (
          <div style={{ color: '#ff003c', background: 'rgba(255,0,60,0.1)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
            Error: {compareResult.error}
          </div>
        )}
      </div>

      {/* SHA-256 Audit Hash Chain / Tamper-Evident Event Ledger */}
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
