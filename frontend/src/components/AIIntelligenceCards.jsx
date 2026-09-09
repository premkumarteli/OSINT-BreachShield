import React, { useState } from 'react';

const MODEL_COLORS = {
  hf_urlbert: { bg: '#00f3ff', label: 'HF UrlBERT' },
  cnn: { bg: '#ff003c', label: 'CNN (Char-1D)' },
  rnn: { bg: '#ffcc00', label: 'RNN (BiLSTM)' },
  transformer: { bg: '#a855f7', label: 'Transformer' },
  xgboost: { bg: '#00ff66', label: 'XGBoost' },
};

export default function AIIntelligenceCards({ analytics, auditLedger, blockchainAudit, token }) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareUrl, setCompareUrl] = useState('');
  const [llmResult, setLlmResult] = useState(null);
  const [llmAnalyzing, setLlmAnalyzing] = useState(false);
  const [llmText, setLlmText] = useState('');
  const [ollamaModels, setOllamaModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [switchingModel, setSwitchingModel] = useState(false);

  const aiAnalysis = analytics?.aiAnalysis || null;
  const exposure = analytics?.exposure || null;
  const urlAnalyses = aiAnalysis?.url_analyses || [];
  const factors = exposure?.factors || null;
  const auditData = auditLedger || blockchainAudit || null;

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // Fetch available Ollama models on mount
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/ai/ollama-models`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include'
        });
        const data = await resp.json();
        setOllamaModels(data.models || []);
        setActiveModel(data.active_model || '');
      } catch (_) {}
    };
    fetchModels();
  }, [API_BASE, token]);

  const handleSwitchModel = async (modelName) => {
    setSwitchingModel(true);
    try {
      const resp = await fetch(`${API_BASE}/api/ai/ollama-models/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ model: modelName })
      });
      const data = await resp.json();
      if (data.success) {
        setActiveModel(data.active_model);
        setLlmResult(null);
      }
    } catch (_) {}
    setSwitchingModel(false);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

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

  const handleLlmAnalyze = async () => {
    if (!llmText.trim()) return;
    setLlmAnalyzing(true);
    setLlmResult(null);
    try {
      const resp = await fetch(`${API_BASE}/api/ai/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ text: llmText.trim(), query: 'breach analysis' })
      });
      const data = await resp.json();
      setLlmResult(data);
    } catch (err) {
      setLlmResult({ success: false, error: err.message });
    } finally {
      setLlmAnalyzing(false);
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
                  {((factors.phishing_probability || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ffcc00' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Correlation Score</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {((factors.correlation_score || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ff003c' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>PII Severity Weight</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {((factors.severity || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ background: '#030712', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #00ff66' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Source Reliability</span>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                  {((factors.source_reliability || 0) * 100).toFixed(1)}%
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

      {/* 3. Multi-Model Comparison */}
      <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ color: '#a855f7', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🧠</span> Multi-Model Comparison (5 Models)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>
          Compare phishing classification across HF UrlBERT, CNN, RNN, Transformer, and XGBoost architectures.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input
            type="text"
            value={compareUrl}
            onChange={(e) => setCompareUrl(e.target.value)}
            placeholder="Enter URL to compare (e.g. https://suspicious-site.xyz/login)"
            style={{
              flex: 1,
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

            {/* Individual model cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(compareResult.models || {}).map(([key, model]) => {
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
          </div>
        )}

        {compareResult?.error && (
          <div style={{ color: '#ff003c', background: 'rgba(255,0,60,0.1)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
            Error: {compareResult.error}
          </div>
        )}
      </div>

      {/* 4. LLM Threat Analysis (Offline Ollama) */}
      <div className="ai-card" style={{ background: '#0b0f19', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ color: '#fbbf24', marginTop: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🤖</span> LLM Threat Analysis (Offline — Ollama)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 12px 0' }}>
          Deep threat analysis using local LLM. Paste breach text for entity extraction, risk assessment, and recommended actions. Zero API calls — runs 100% offline.
        </p>

        {/* Model Selector */}
        {ollamaModels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Active Model:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ollamaModels.map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleSwitchModel(m.name)}
                  disabled={switchingModel || m.name === activeModel}
                  style={{
                    background: m.name === activeModel ? 'rgba(251,191,36,0.25)' : '#030712',
                    color: m.name === activeModel ? '#fbbf24' : '#64748b',
                    border: `1px solid ${m.name === activeModel ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: m.name === activeModel ? 'default' : 'pointer',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: m.name === activeModel ? 'bold' : 'normal',
                    opacity: switchingModel ? 0.6 : 1,
                  }}
                >
                  {m.name.split('/').pop()} ({formatBytes(m.size_bytes)})
                </button>
              ))}
            </div>
            {switchingModel && <span style={{ color: '#fbbf24', fontSize: '11px' }}>Switching...</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <textarea
            value={llmText}
            onChange={(e) => setLlmText(e.target.value)}
            placeholder="Paste breach text here for LLM analysis (e.g. leaked data dump, phishing email content, breach notification...)"
            rows={4}
            style={{
              flex: 1,
              background: '#030712',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#e2e8f0',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
        <button
          onClick={handleLlmAnalyze}
          disabled={llmAnalyzing || !llmText.trim()}
          style={{
            background: llmAnalyzing ? '#1a1a2e' : 'rgba(251,191,36,0.2)',
            color: '#fbbf24',
            border: '1px solid #fbbf24',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: llmAnalyzing ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            opacity: (!llmText.trim() || llmAnalyzing) ? 0.5 : 1,
          }}
        >
          {llmAnalyzing ? 'Analyzing with Local LLM...' : 'Analyze with LLM'}
        </button>

        {llmResult?.success && llmResult.analysis && (
          <div style={{ marginTop: '16px' }}>
            {/* Risk level badge */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                background: llmResult.analysis.risk_level === 'CRITICAL' ? 'rgba(255,0,60,0.2)' :
                  llmResult.analysis.risk_level === 'HIGH' ? 'rgba(255,100,0,0.2)' :
                  llmResult.analysis.risk_level === 'MEDIUM' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,102,0.2)',
                color: llmResult.analysis.risk_level === 'CRITICAL' ? '#ff003c' :
                  llmResult.analysis.risk_level === 'HIGH' ? '#ff6400' :
                  llmResult.analysis.risk_level === 'MEDIUM' ? '#ffcc00' : '#00ff66',
                border: `1px solid ${llmResult.analysis.risk_level === 'CRITICAL' ? '#ff003c' :
                  llmResult.analysis.risk_level === 'HIGH' ? '#ff6400' :
                  llmResult.analysis.risk_level === 'MEDIUM' ? '#ffcc00' : '#00ff66'}`
              }}>
                {llmResult.analysis.risk_level}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                Type: <strong style={{ color: '#e2e8f0' }}>{llmResult.analysis.breach_type}</strong>
              </span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                Confidence: <strong style={{ color: '#fbbf24' }}>{((llmResult.analysis.confidence || 0) * 100).toFixed(0)}%</strong>
              </span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                Model: {llmResult.model} | {llmResult.inference_latency_ms}ms
              </span>
            </div>

            {/* Summary */}
            <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid #fbbf24' }}>
              <div style={{ color: '#fbbf24', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Threat Summary</div>
              <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{llmResult.analysis.threat_summary}</div>
            </div>

            {/* Reasoning */}
            {llmResult.analysis.reasoning && (
              <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid #a855f7' }}>
                <div style={{ color: '#a855f7', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>LLM Reasoning</div>
                <div style={{ color: '#cbd5e1', fontSize: '13px' }}>{llmResult.analysis.reasoning}</div>
              </div>
            )}

            {/* Entities */}
            {llmResult.analysis.entities && (
              <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ color: '#00f3ff', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Extracted Entities</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                  {Object.entries(llmResult.analysis.entities).map(([key, val]) => {
                    const items = Array.isArray(val) ? val : [];
                    if (items.length === 0) return null;
                    return (
                      <div key={key} style={{ fontSize: '12px' }}>
                        <span style={{ color: '#94a3b8', textTransform: 'uppercase' }}>{key}:</span>
                        <div style={{ color: '#e2e8f0', marginTop: '2px' }}>{items.join(', ')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {llmResult.analysis.recommended_actions?.length > 0 && (
              <div style={{ background: '#030712', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #00ff66' }}>
                <div style={{ color: '#00ff66', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Actions</div>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {llmResult.analysis.recommended_actions.map((action, i) => (
                    <li key={i} style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '4px' }}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {llmResult?.success === false && (
          <div style={{ marginTop: '12px', color: '#ff003c', background: 'rgba(255,0,60,0.1)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
            {llmResult.error?.includes('not installed') || llmResult.error?.includes('not available') ? (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Ollama not detected</div>
                <div style={{ color: '#94a3b8' }}>To enable offline LLM analysis:</div>
                <code style={{ display: 'block', marginTop: '6px', color: '#fbbf24', background: '#030712', padding: '8px', borderRadius: '4px' }}>
                  1. Install Ollama: https://ollama.com<br/>
                  2. Pull model: ollama pull phi3<br/>
                  3. Restart this service
                </code>
              </div>
            ) : (
              <div>Error: {llmResult.error}</div>
            )}
          </div>
        )}
      </div>

      {/* 5. SHA-256 Audit Hash Chain / Tamper-Evident Event Ledger */}
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
