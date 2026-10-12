import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import numpy as np
import os

out_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\final paper\figures'
os.makedirs(out_dir, exist_ok=True)

# Common styling
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 8.5
plt.rcParams['axes.linewidth'] = 0.8

# ==============================================================================
# FIG 1: Four-Tier System Architecture (Professional Publication Grade)
# ==============================================================================
fig, ax = plt.subplots(figsize=(7.2, 4.4), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Background container
bg = FancyBboxPatch((1, 2), 98, 96, boxstyle="round,pad=1.0", facecolor='#F8F9FA', edgecolor='#D5D8DC', linewidth=1.0)
ax.add_patch(bg)
ax.text(50, 95.5, 'BreachShield: Four-Tier Privacy-Preserving Architecture', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1B2631')

def draw_tier(ax, x, y, w, h, title, subtitle, items, bg_color, border_color, title_color='#1B2631'):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8", facecolor=bg_color, edgecolor=border_color, linewidth=1.4)
    ax.add_patch(box)
    ax.text(x + w/2, y + h - 4.5, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color=title_color)
    if subtitle:
        ax.text(x + w/2, y + h - 8.5, subtitle, ha='center', va='center', fontsize=7.0, fontstyle='italic', color='#566573')
    start_y = y + h - 13.5
    for i, itm in enumerate(items):
        ax.text(x + 3.0, start_y - (i * 4.2), f'• {itm}', ha='left', va='center', fontsize=7.2, color='#2C3E50')

# Tier 1: Frontend
draw_tier(ax, 3, 48, 28, 43, 'Tier 1: Web Dashboard', 'React 19 Single Page App', 
          ['Cyberpunk HUD Terminal UI', 'W3C Web Crypto API Hashing', 'Client-side Prefix Partitioning', 'Zero Plaintext Disclosure', 'SSE Watchlist Stream'], 
          '#EBF5FB', '#2980B9', '#1A5276')

# Tier 2: API Gateway
draw_tier(ax, 36, 48, 28, 43, 'Tier 2: API Gateway', 'Node.js Express 5 REST/WS', 
          ['Dual-Channel OTP Auth Gate', 'Bcrypt (cost=10), 30s Cooldown', '1h HMAC-SHA256 JWT Issuer', 'Pluggable Source Registry', 'MySQL 8 + Auto JSON Fallback'], 
          '#E8F8F5', '#1ABC9C', '#117A65')

# Tier 3: OSINT Microservice
draw_tier(ax, 69, 48, 28, 43, 'Tier 3: OSINT Engine', 'Python 3.11 FastAPI', 
          ['Telethon MTProto Telegram Client', 'asyncio.Lock Mutex Serializer', '8.0s Timeout Fallback Handling', 'Underground Channel Monitor', 'Pretrained UrlBERT Phishing AI'], 
          '#FEF9E7', '#F39C12', '#B9770E')

# Tier 4: Android Gateway
draw_tier(ax, 15, 6, 32, 34, 'Tier 4: SMS Gateway', 'Kotlin Native Android Service', 
          ['Persistent WebSocket (/ws/gateway)', 'Ping/Pong Keepalive Handshake', 'Carrier DLT Template Conformance', 'Out-of-Band SMS Verification', 'Liquid Glass Admin Control'], 
          '#F4ECF7', '#8E44AD', '#6C3483')

# Blockchain Component
draw_tier(ax, 53, 6, 32, 34, 'Audit Ledger: Blockchain', 'Hardhat EVM Smart Contract', 
          ['AnchorRegistry.sol (^0.8.20)', 'Canonical Sorted-Key JSON Hash', '16-Record / 60s Merkle Batch', 'Logarithmic Inclusion Proofs', 'Tamper-Evident History Tree'], 
          '#FDEDEC', '#E74C3C', '#922B21')

# Connectors
def draw_conn(ax, x1, y1, x2, y2, label, offset_y=1.5):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color='#2C3E50', lw=1.3, shrinkA=3, shrinkB=3))
    if label:
        ax.text((x1+x2)/2, (y1+y2)/2 + offset_y, label, ha='center', va='center', fontsize=6.5, 
                fontweight='bold', color='#1B2631', bbox=dict(boxstyle="square,pad=0.2", fc="white", ec="none", alpha=0.85))

draw_conn(ax, 31, 70, 36, 70, 'HTTP / 20-bit P')
draw_conn(ax, 64, 70, 69, 70, 'FastAPI HTTP')
draw_conn(ax, 45, 48, 35, 40, 'WS / JSON')
draw_conn(ax, 55, 48, 65, 40, 'Merkle Leaves')

plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_architecture.png'), dpi=300, bbox_inches='tight')
plt.close()

# ==============================================================================
# FIG 2: Merkle Batching & EVM Anchoring Flow
# ==============================================================================
fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 60)
ax.axis('off')

def draw_m_box(ax, x, y, w, h, text, color, border='#2C3E50', text_color='#1B2631', fs=7.2):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", facecolor=color, edgecolor=border, linewidth=1.1)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=fs, fontweight='bold', color=text_color)

# Event Leaves
draw_m_box(ax, 3, 5, 18, 12, 'Event e1\n(Canonical JSON)\nL1 = H(e1)', '#EBF5FB', '#2980B9')
draw_m_box(ax, 23, 5, 18, 12, 'Event e2\n(Canonical JSON)\nL2 = H(e2)', '#EBF5FB', '#2980B9')
draw_m_box(ax, 43, 5, 18, 12, 'Event e3\n(Canonical JSON)\nL3 = H(e3)', '#EBF5FB', '#2980B9')
draw_m_box(ax, 63, 5, 18, 12, 'Event e4\n(Canonical JSON)\nL4 = H(e4)', '#EBF5FB', '#2980B9')

# Intermediate Nodes
draw_m_box(ax, 13, 24, 18, 10, 'H12 = H(L1 || L2)', '#D4EFDF', '#27AE60')
draw_m_box(ax, 53, 24, 18, 10, 'H34 = H(L3 || L4)', '#D4EFDF', '#27AE60')

# Merkle Root
draw_m_box(ax, 33, 42, 20, 11, 'Merkle Root R\nH(H12 || H34)', '#FCF3CF', '#F39C12')

# Hardhat EVM Contract
draw_m_box(ax, 72, 38, 25, 17, 'AnchorRegistry.sol\n(Local EVM Node)\n• emit NewAnchor(R)\n• block.number, t', '#FDEDEC', '#E74C3C', '#922B21', fs=7.5)

# Tree Connectors
def draw_m_line(ax, x1, y1, x2, y2):
    ax.plot([x1, x2], [y1, y2], color='#34495E', lw=1.2, zorder=1)

draw_m_line(ax, 12, 17, 22, 24)
draw_m_line(ax, 32, 17, 22, 24)
draw_m_line(ax, 52, 17, 62, 24)
draw_m_line(ax, 72, 17, 62, 24)
draw_m_line(ax, 22, 34, 43, 42)
draw_m_line(ax, 62, 34, 43, 42)

# Root to Anchor Arrow
ax.annotate('', xy=(72, 47), xytext=(53, 47),
            arrowprops=dict(arrowstyle="->", color='#C0392B', lw=1.6, shrinkA=3, shrinkB=3))
ax.text(62.5, 49.5, 'anchorRoot(R)', ha='center', va='bottom', fontsize=7.2, fontweight='bold', color='#C0392B')

plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_merkle_anchoring.png'), dpi=300, bbox_inches='tight')
plt.close()

# ==============================================================================
# FIG 3: Model Comparison Benchmark (High-Resolution Publication Bar Chart)
# ==============================================================================
models = ['Naive Baseline', 'BiLSTM-RNN', 'Transformer', '1D-CNN', 'XGBoost (Ours)']
acc = [47.1, 44.6, 48.4, 66.2, 89.2]
macro_f1 = [16.0, 34.0, 42.9, 57.2, 83.2]
weighted_f1 = [30.2, 46.8, 50.8, 65.7, 89.4]

x = np.arange(len(models))
width = 0.24

fig, ax = plt.subplots(figsize=(7.0, 3.8), dpi=300)
rects1 = ax.bar(x - width, acc, width, label='Accuracy (%)', color='#1B4F72', edgecolor='#154360', lw=0.6)
rects2 = ax.bar(x, macro_f1, width, label='Macro F1 (%)', color='#2874A6', edgecolor='#1F618D', lw=0.6)
rects3 = ax.bar(x + width, weighted_f1, width, label='Weighted F1 (%)', color='#D35400', edgecolor='#BA4A00', lw=0.6)

for rects in [rects1, rects2, rects3]:
    for rect in rects:
        h = rect.get_height()
        if h > 0:
            ax.annotate(f'{h:.1f}%', xy=(rect.get_x() + rect.get_width()/2, h),
                        xytext=(0, 2), textcoords="offset points",
                        ha='center', va='bottom', fontsize=6.8, fontweight='bold')

ax.set_ylabel('Performance Score (%)', fontsize=8.8, fontweight='bold')
ax.set_title('Comparative Breach Severity Classification Benchmark (Test Set N=157)', fontsize=9.5, fontweight='bold', pad=8)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=8.0, fontweight='bold')
ax.set_ylim(0, 108)
ax.axhline(47.1, color='#C0392B', linestyle='--', linewidth=1.0, label='Majority Class Baseline (47.1%)')
ax.legend(frameon=True, facecolor='white', framealpha=0.92, fontsize=7.5, loc='upper left')
ax.grid(axis='y', linestyle=':', alpha=0.55)
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_model_comparison.png'), dpi=300, bbox_inches='tight')
plt.close()

# ==============================================================================
# FIG 4: Per-Class F1-Score Breakdown
# ==============================================================================
classes = ['LOW (n=11)', 'MEDIUM (n=74)', 'HIGH (n=63)', 'CRITICAL* (n=9)']
xgb_f1 = [72.0, 91.3, 91.8, 77.8]
cnn_f1 = [45.5, 72.2, 64.2, 47.1]
rnn_f1 = [20.8, 46.2, 57.1, 11.8]

x = np.arange(len(classes))
width = 0.24

fig, ax = plt.subplots(figsize=(6.8, 3.6), dpi=300)
r1 = ax.bar(x - width, rnn_f1, width, label='BiLSTM-RNN', color='#7F8C8D', edgecolor='#566573', lw=0.6)
r2 = ax.bar(x, cnn_f1, width, label='1D-CNN (k=3,4,5)', color='#2980B9', edgecolor='#1F618D', lw=0.6)
r3 = ax.bar(x + width, xgb_f1, width, label='XGBoost (Ours)', color='#27AE60', edgecolor='#1E8449', lw=0.6)

for rects in [r1, r2, r3]:
    for rect in rects:
        h = rect.get_height()
        ax.annotate(f'{h:.1f}%', xy=(rect.get_x() + rect.get_width()/2, h),
                    xytext=(0, 2), textcoords="offset points",
                    ha='center', va='bottom', fontsize=7.0, fontweight='bold')

ax.set_ylabel('F1-Score (%)', fontsize=8.8, fontweight='bold')
ax.set_title('Per-Class F1-Score Across Severity Tiers (*CRITICAL Tier Test Support n=9)', fontsize=9.2, fontweight='bold', pad=8)
ax.set_xticks(x)
ax.set_xticklabels(classes, fontsize=8.0, fontweight='bold')
ax.set_ylim(0, 108)
ax.legend(frameon=True, facecolor='white', framealpha=0.92, fontsize=7.8, loc='upper left')
ax.grid(axis='y', linestyle=':', alpha=0.55)
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_per_class_f1.png'), dpi=300, bbox_inches='tight')
plt.close()

# ==============================================================================
# FIG 5: Three-Stage Empirical Verification Methodology Funnel
# ==============================================================================
fig, ax = plt.subplots(figsize=(7.2, 3.8), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 60)
ax.axis('off')

def draw_stage(ax, x, y, w, h, title, subtitle, bullets, bg, border, tc='#1B2631'):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6", facecolor=bg, edgecolor=border, linewidth=1.2)
    ax.add_patch(box)
    ax.text(x + w/2, y + h - 4.0, title, ha='center', va='center', fontsize=8.0, fontweight='bold', color=tc)
    ax.text(x + w/2, y + h - 8.0, subtitle, ha='center', va='center', fontsize=6.8, fontstyle='italic', color='#566573')
    sy = y + h - 12.5
    for i, b in enumerate(bullets):
        ax.text(x + 2.5, sy - (i * 3.8), f'• {b}', ha='left', va='center', fontsize=6.8, color='#2C3E50')

draw_stage(ax, 2, 8, 29, 46, 'Stage 1: Dual Audit', 'Two Independent Agents',
           ['Blind 8-section audit', 'Architecture & flows', 'ML & Blockchain code', 'Test suite coverage', 'Data honesty audit'],
           '#EBF5FB', '#2980B9', '#1A5276')

draw_stage(ax, 35, 8, 30, 46, 'Stage 2: Live Verification', 'Disagreement Resolution',
           ['Direct curl requests', 'Repeated ML inference', 'Contract deploy check', 'Codebase source inspect', 'Logbook cross-check'],
           '#FEF9E7', '#F39C12', '#B9770E')

draw_stage(ax, 69, 8, 29, 46, 'Stage 3: Reproduction', 'Isolated Clean Enclave',
           ['Third-party re-derivation', 'Confirmed positives', 'Exposed fabrications', 'Hardcoded timings killed', 'Roadmap established'],
           '#E8F8F5', '#27AE60', '#196F3D')

# Connectors
ax.annotate('', xy=(35, 31), xytext=(31, 31), arrowprops=dict(arrowstyle="->", color='#2C3E50', lw=1.4))
ax.annotate('', xy=(69, 31), xytext=(65, 31), arrowprops=dict(arrowstyle="->", color='#2C3E50', lw=1.4))

plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_verification_methodology.png'), dpi=300, bbox_inches='tight')
plt.close()

print('All 5 publication figures rendered successfully!')
