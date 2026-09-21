import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

out_dir = r'docs/paper/figures'
os.makedirs(out_dir, exist_ok=True)

# -------------------------------------------------------------
# FIG 1: Overall Benchmark Comparison
# -------------------------------------------------------------
models = ['Naive Baseline', 'BiLSTM-RNN', 'Transformer', '1D-CNN', 'XGBoost (Ours)']
acc = [47.1, 44.6, 48.4, 66.2, 89.2]
macro_f1 = [16.0, 34.0, 42.9, 57.2, 83.2]
weighted_f1 = [30.2, 46.8, 50.8, 65.7, 89.4]

x = np.arange(len(models))
width = 0.24

fig, ax = plt.subplots(figsize=(6.8, 3.8), dpi=300)
rects1 = ax.bar(x - width, acc, width, label='Accuracy (%)', color='#1f4e79')
rects2 = ax.bar(x, macro_f1, width, label='Macro F1 (%)', color='#2e75b6')
rects3 = ax.bar(x + width, weighted_f1, width, label='Weighted F1 (%)', color='#e67e22')

for rects in [rects1, rects2, rects3]:
    for rect in rects:
        h = rect.get_height()
        if h > 0:
            ax.annotate(f'{h:.1f}%', xy=(rect.get_x() + rect.get_width()/2, h),
                        xytext=(0, 2), textcoords="offset points",
                        ha='center', va='bottom', fontsize=6.5, rotation=0)

ax.set_ylabel('Performance Score (%)', fontsize=9, fontweight='bold')
ax.set_title('Breach Severity Classification Performance Benchmark', fontsize=10, fontweight='bold', pad=8)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=8, fontweight='bold')
ax.set_ylim(0, 108)
ax.axhline(47.1, color='#c0392b', linestyle='--', linewidth=1, label='Naive Baseline (47.1%)')
ax.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=7.5, loc='upper left')
ax.grid(axis='y', linestyle=':', alpha=0.6)
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_model_comparison.png'))
plt.close()

# -------------------------------------------------------------
# FIG 2: Per-Class F1 Score Comparison (XGBoost vs CNN)
# -------------------------------------------------------------
classes = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
xgb_f1 = [72.0, 91.3, 91.8, 77.8]
cnn_f1 = [45.5, 72.2, 64.2, 47.1]
bilstm_f1 = [20.8, 46.2, 57.1, 11.8]

x = np.arange(len(classes))
width = 0.24

fig, ax = plt.subplots(figsize=(6.5, 3.6), dpi=300)
r1 = ax.bar(x - width, bilstm_f1, width, label='BiLSTM-RNN', color='#95a5a6')
r2 = ax.bar(x, cnn_f1, width, label='1D-CNN', color='#2e75b6')
r3 = ax.bar(x + width, xgb_f1, width, label='XGBoost (Ours)', color='#27ae60')

for rects in [r1, r2, r3]:
    for rect in rects:
        h = rect.get_height()
        ax.annotate(f'{h:.1f}%', xy=(rect.get_x() + rect.get_width()/2, h),
                    xytext=(0, 2), textcoords="offset points",
                    ha='center', va='bottom', fontsize=7)

ax.set_ylabel('F1-Score (%)', fontsize=9, fontweight='bold')
ax.set_title('Per-Class F1-Score Across Severity Tiers', fontsize=10, fontweight='bold', pad=8)
ax.set_xticks(x)
ax.set_xticklabels(classes, fontsize=9, fontweight='bold')
ax.set_ylim(0, 108)
ax.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=8, loc='upper left')
ax.grid(axis='y', linestyle=':', alpha=0.6)
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_per_class_f1.png'))
plt.close()

# -------------------------------------------------------------
# FIG 3: Merkle Tree & Blockchain Anchoring Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(7.2, 3.8), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

def draw_box(ax, x, y, w, h, text, color, text_color='black', fontsize=7.5):
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                          facecolor=color, edgecolor='#333333', linewidth=1.2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight='bold', color=text_color)

# Leaves
draw_box(ax, 0.4, 0.4, 1.8, 0.9, 'Event $e_1$\n(Canonical JSON)\n$L_1 = H(e_1)$', '#d6eaf8')
draw_box(ax, 2.8, 0.4, 1.8, 0.9, 'Event $e_2$\n(Canonical JSON)\n$L_2 = H(e_2)$', '#d6eaf8')
draw_box(ax, 5.2, 0.4, 1.8, 0.9, 'Event $e_3$\n(Canonical JSON)\n$L_3 = H(e_3)$', '#d6eaf8')
draw_box(ax, 7.6, 0.4, 1.8, 0.9, 'Event $e_4$\n(Canonical JSON)\n$L_4 = H(e_4)$', '#d6eaf8')

# Intermediate nodes
draw_box(ax, 1.6, 2.2, 2.2, 0.8, '$N_{12} = H(L_1 \\parallel L_2)$', '#aed6f1')
draw_box(ax, 6.4, 2.2, 2.2, 0.8, '$N_{34} = H(L_3 \\parallel L_4)$', '#aed6f1')

# Merkle Root
draw_box(ax, 3.8, 3.8, 2.6, 0.9, 'Merkle Root $R$\n$R = H(N_{12} \\parallel N_{34})$', '#f9e79f')

# Smart Contract
draw_box(ax, 3.0, 5.0, 4.2, 0.8, 'EVM Smart Contract (AnchorRegistry.sol)\nanchorRoot(batchId, root, count)', '#d5f5e3', text_color='#196f3d')

# Arrows
ax.annotate('', xy=(2.7, 2.2), xytext=(1.3, 1.3), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))
ax.annotate('', xy=(2.7, 2.2), xytext=(3.7, 1.3), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))
ax.annotate('', xy=(7.5, 2.2), xytext=(6.1, 1.3), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))
ax.annotate('', xy=(7.5, 2.2), xytext=(8.5, 1.3), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))

ax.annotate('', xy=(5.1, 3.8), xytext=(2.7, 3.0), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))
ax.annotate('', xy=(5.1, 3.8), xytext=(7.5, 3.0), arrowprops=dict(arrowstyle='->', lw=1.2, color='#2c3e50'))

ax.annotate('', xy=(5.1, 5.0), xytext=(5.1, 4.7), arrowprops=dict(arrowstyle='->', lw=1.5, color='#27ae60'))

plt.title('Cryptographic Audit Event Merkle Tree Construction & EVM Anchoring', fontsize=9.5, fontweight='bold')
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_merkle_anchoring.png'))
plt.close()

# -------------------------------------------------------------
# FIG 4: End-to-End System Architecture & Threat Pipeline
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=300)
ax.set_xlim(0, 12)
ax.set_ylim(0, 7)
ax.axis('off')

# Tier 1: User & Browser
draw_box(ax, 0.3, 4.5, 2.8, 1.8, 'Client-Side HUD (React 19)\n- Web Crypto API\n- SHA-256 Prefix Hashing\n- k-Anonymity Suffix Filter\n- Reactive Audit Feed', '#e8f8f5', text_color='#117864')

# Tier 2: Backend API Gateway
draw_box(ax, 4.2, 3.8, 3.5, 2.8, 'API Gateway (Node.js / Express 5)\n- Out-of-Band Dual OTP (Email/SMS)\n- JWT RBAC & Rate Limiter\n- Pluggable BreachSource Registry\n- Merkle Batch Queue & Dead-Letter\n- Canonical Audit Logger', '#ebf5fb', text_color='#1b4f72')

# Tier 3: Scraper Engine
draw_box(ax, 8.8, 4.8, 2.9, 1.8, 'OSINT Engine (FastAPI)\n- Telethon MTProto Client\n- asyncio.Lock Serialization\n- HuggingFace Phishing Model\n- SentenceTransformer Sim.', '#fef9e7', text_color='#7d6608')

# Tier 4: Mobile SMS Gateway
draw_box(ax, 0.3, 0.6, 2.8, 1.8, 'Android Gateway (Kotlin)\n- Persistent WebSocket (/ws/gateway)\n- Exponential Backoff & Jitter\n- SmsManager Carrier-Safe Relay\n- Mobile Admin Telemetry', '#fbeee6', text_color='#78281f')

# Tier 5: Blockchain Ledger
draw_box(ax, 4.2, 0.6, 3.5, 1.8, 'Blockchain Ledger (Hardhat EVM)\n- AnchorRegistry.sol Contract\n- Merkle Root Verification\n- Tamper-Evident State Store\n- Auto-Deploy Startup Recovery', '#eafaf1', text_color='#196f3d')

# External Breach Repositories
draw_box(ax, 8.8, 0.6, 2.9, 1.8, 'External OSINT Sources\n- HIBP v3 Pwned API\n- Telegram Dark Channels\n- Local Breach Catalog\n- Threat Intelligence Feeds', '#f4ecf7', text_color='#512e5f')

# Flow arrows
ax.annotate('k-Anonymity 5-char prefix / JWT', xy=(4.2, 5.5), xytext=(3.1, 5.5),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color='#2c3e50'), fontsize=6.5, ha='center', va='bottom')

ax.annotate('HTTP /api/ai / Query', xy=(8.8, 5.5), xytext=(7.7, 5.5),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color='#2c3e50'), fontsize=6.5, ha='center', va='bottom')

ax.annotate('WebSocket Relay\n(SMS OTP)', xy=(3.1, 2.0), xytext=(4.2, 4.0),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color='#c0392b'), fontsize=6.5, ha='right', va='center')

ax.annotate('Merkle Root Anchoring\neth_sendTransaction', xy=(5.9, 2.4), xytext=(5.9, 3.8),
            arrowprops=dict(arrowstyle='->', lw=1.3, color='#27ae60'), fontsize=6.5, ha='left', va='center')

ax.annotate('Promise.allSettled\nConcurrent Harvest', xy=(8.8, 2.0), xytext=(7.7, 4.2),
            arrowprops=dict(arrowstyle='<->', lw=1.2, color='#8e44ad'), fontsize=6.5, ha='right', va='center')

plt.title('BreachShield Multi-Tier Zero-Trust System Architecture', fontsize=10.5, fontweight='bold')
plt.tight_layout()
fig.savefig(os.path.join(out_dir, 'fig_architecture.png'))
plt.close()

print('All 4 figures generated successfully!')
