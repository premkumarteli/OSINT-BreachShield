import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

output_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'
os.makedirs(output_dir, exist_ok=True)

# ============================================================
# DIAGRAM 1: Data Flow Diagram (Level 1)
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(14, 8))
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')
ax.set_facecolor('white')
fig.patch.set_facecolor('white')

def draw_entity(ax, x, y, w, h, text, color='#E8F4FD'):
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='#2C3E50', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=9, fontweight='bold', color='#2C3E50')

def draw_process(ax, x, y, w, h, text, color='#D5F5E3'):
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='#27AE60', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=8, fontweight='bold', color='#1E8449')

def draw_store(ax, x, y, w, h, text, color='#FDEBD0'):
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05",
                          facecolor=color, edgecolor='#E67E22', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=8, fontweight='bold', color='#D35400')

def draw_arrow(ax, x1, y1, x2, y2, text='', color='#2C3E50'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
    if text:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.15, text, ha='center', va='bottom', fontsize=7, color='#555')

# External Entities
draw_entity(ax, 0.5, 6.5, 2, 0.8, 'User\n(Email Owner)')
draw_entity(ax, 0.5, 2.5, 2, 0.8, 'Admin\nUser')

# Processes
draw_process(ax, 4, 6.5, 2.2, 0.8, 'P1: Auth\n(OTP+JWT)')
draw_process(ax, 4, 4.5, 2.2, 0.8, 'P2: Breach\nSearch')
draw_process(ax, 4, 2.5, 2.2, 0.8, 'P3: Threat\nAnalysis')
draw_process(ax, 4, 0.5, 2.2, 0.8, 'P4: Audit\nLogger')

# Data Stores
draw_store(ax, 8, 6.5, 2, 0.7, 'D1: Users\n(MySQL)')
draw_store(ax, 8, 4.5, 2, 0.7, 'D2: Audit\nLogs (JSON)')
draw_store(ax, 8, 2.5, 2, 0.7, 'D3: Merkle\nBatches')
draw_store(ax, 8, 0.5, 2, 0.7, 'D4: Blockchain\n(Hardhat)')

# External Systems
draw_entity(ax, 11.5, 5.5, 2, 0.8, 'HIBP\nAPI', '#FADBD8')
draw_entity(ax, 11.5, 3.5, 2, 0.8, 'Python\nService', '#FADBD8')
draw_entity(ax, 11.5, 1.5, 2, 0.8, 'Telegram\nChannels', '#FADBD8')

# Arrows
draw_arrow(ax, 2.5, 6.9, 4, 6.9, 'OTP Request')
draw_arrow(ax, 2.5, 2.9, 4, 2.9, 'Admin Ops')
draw_arrow(ax, 6.2, 6.9, 8, 6.85, 'Store/Verify')
draw_arrow(ax, 6.2, 4.9, 8, 4.85, 'Write Log')
draw_arrow(ax, 6.2, 2.9, 8, 2.85, 'Enqueue')
draw_arrow(ax, 6.2, 0.9, 8, 0.85, 'Anchor')
draw_arrow(ax, 10, 6.85, 11.5, 5.9, 'Query')
draw_arrow(ax, 10, 4.85, 11.5, 3.9, 'Analyze')
draw_arrow(ax, 10, 2.85, 11.5, 1.9, 'Monitor')

ax.set_title('Data Flow Diagram - Level 1', fontsize=14, fontweight='bold', pad=10)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'dfd_level1.png'), dpi=200, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print('DFD created')

# ============================================================
# DIAGRAM 2: Class Diagram
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis('off')
ax.set_facecolor('white')
fig.patch.set_facecolor('white')

def draw_class(ax, x, y, w, name, attrs, methods, color='#E8F4FD'):
    total_h = 0.4 + len(attrs)*0.25 + len(methods)*0.25 + 0.3
    # Header
    rect = FancyBboxPatch((x, y), w, 0.4, boxstyle="round,pad=0.02",
                          facecolor=color, edgecolor='#2C3E50', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + 0.2, name, ha='center', va='center',
            fontsize=9, fontweight='bold', color='#2C3E50')
    # Attributes
    attr_h = len(attrs) * 0.25
    rect2 = FancyBboxPatch((x, y - attr_h), w, attr_h, boxstyle="square,pad=0",
                           facecolor='white', edgecolor='#2C3E50', linewidth=1)
    ax.add_patch(rect2)
    for i, attr in enumerate(attrs):
        ax.text(x + 0.1, y - 0.15 - i*0.25, attr, fontsize=7, color='#333', family='monospace')
    # Methods
    meth_h = len(methods) * 0.25
    rect3 = FancyBboxPatch((x, y - attr_h - meth_h), w, meth_h, boxstyle="square,pad=0",
                           facecolor='white', edgecolor='#2C3E50', linewidth=1)
    ax.add_patch(rect3)
    for i, meth in enumerate(methods):
        ax.text(x + 0.1, y - attr_h - 0.15 - i*0.25, meth, fontsize=7, color='#333', family='monospace')
    return y - total_h

# User class
draw_class(ax, 0.5, 9.5, 3, 'User', 
           ['- userId: String', '- email: String', '- role: String', '- otpVerified: Boolean'],
           ['+ sendOtp(): void', '+ verifyOtp(token): Boolean', '+ searchBreach(q): Result'])

# AuthGuard class
draw_class(ax, 0.5, 5.5, 3, 'AuthGuard',
           ['- jwtSecret: String', '- otpStore: Map', '- rateLimiter: RateLimit'],
           ['+ verifyOtpToken(req,res,next)', '+ requireAdminToken(req,res,next)', '+ generateOtp(): String'])

# SearchService class
draw_class(ax, 5, 9.5, 3.2, 'SearchService',
           ['- hibpClient: HIBP', '- riskEngine: RiskEngine', '- pythonService: PythonAPI'],
           ['+ searchBreach(email): Result', '+ logThreatEvent(event): void', '+ computeRisk(score): RiskLevel'])

# MerkleBatcher class
draw_class(ax, 5, 5.5, 3.2, 'MerkleBatcher',
           ['- queue: Batch[]', '- history: Batch[]', '- batchSize: int'],
           ['+ enqueueLeaf(hash): void', '+ buildMerkleRoot(): Hash', '+ recoverPending(): void'])

# AnchorClient class
draw_class(ax, 9.5, 9.5, 3.5, 'AnchorClient',
           ['- provider: JsonRpcProvider', '- contract: AnchorRegistry', '- network: String'],
           ['+ anchorRoot(root,proof): Tx', '+ verifyAnchor(root): bool', '+ getAnchorBlock(): int'])

# AnchorRegistry (Solidity)
draw_class(ax, 9.5, 5.5, 3.5, 'AnchorRegistry.sol',
           ['- anchors: Mapping(bytes32=>Anchor)', '- owner: Address'],
           ['+ anchorRoot(root,proof): void', '+ verifyAnchor(root): bool', '+ getAnchor(root): Anchor'])

# PhishingClassifier
draw_class(ax, 5, 1.5, 3.2, 'PhishingClassifier',
           ['- model: HuggingFaceModel', '- tokenizer: AutoTokenizer'],
           ['+ predict(url): float', '+ classify(url): String', '+ batchPredict(urls): float[]'])

# EntityCorrelator
draw_class(ax, 9.5, 1.5, 3.5, 'EntityCorrelator',
           ['- model: SentenceTransformer', '- threshold: float'],
           ['+ correlate(e1,e2): float', '+ findCluster(entities): List', '+ computeSimilarity(a,b): float'])

# Relationships
ax.annotate('', xy=(5, 8.5), xytext=(3.5, 8.5),
            arrowprops=dict(arrowstyle='->', color='#E74C3C', lw=1.5, connectionstyle='arc3,rad=0'))
ax.text(4.25, 8.7, 'uses', fontsize=7, color='#E74C3C', ha='center')

ax.annotate('', xy=(5, 6.5), xytext=(3.5, 6.5),
            arrowprops=dict(arrowstyle='->', color='#E74C3C', lw=1.5))
ax.text(4.25, 6.7, 'uses', fontsize=7, color='#E74C3C', ha='center')

ax.annotate('', xy=(8.2, 7.5), xytext=(8.2, 5.5),
            arrowprops=dict(arrowstyle='<->', color='#8E44AD', lw=1.5))
ax.text(8.4, 6.5, 'builds', fontsize=7, color='#8E44AD')

ax.annotate('', xy=(9.5, 6.5), xytext=(8.2, 6.5),
            arrowprops=dict(arrowstyle='->', color='#8E44AD', lw=1.5))
ax.text(8.85, 6.7, 'deploys', fontsize=7, color='#8E44AD')

ax.set_title('Class Diagram', fontsize=14, fontweight='bold', pad=10)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'class_diagram.png'), dpi=200, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print('Class diagram created')

# ============================================================
# DIAGRAM 3: Use Case Diagram
# ============================================================
fig, ax = plt.subplots(1, 1, figsize=(14, 8))
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')
ax.set_facecolor('white')
fig.patch.set_facecolor('white')

# System boundary
rect = FancyBboxPatch((3, 0.5), 8, 7, boxstyle="round,pad=0.2",
                      facecolor='#F8F9FA', edgecolor='#2C3E50', linewidth=2, linestyle='--')
ax.add_patch(rect)
ax.text(7, 7.2, 'BreachShield System', ha='center', fontsize=12, fontweight='bold', color='#2C3E50')

# Actors
# User
ax.plot(1.5, 5.5, 'ko', markersize=8)
ax.plot(1.5, 5.0, 'ko', markersize=12, fillstyle='none', markeredgewidth=2)
ax.plot([1.5, 1.5], [4.5, 5.0], 'k-', linewidth=2)
ax.plot([1.2, 1.8], [4.7, 4.7], 'k-', linewidth=2)
ax.plot([1.2, 1.8], [4.2, 4.2], 'k-', linewidth=2)
ax.plot([1.5, 1.2], [4.5, 4.0], 'k-', linewidth=2)
ax.plot([1.5, 1.8], [4.5, 4.0], 'k-', linewidth=2)
ax.text(1.5, 3.7, 'User', ha='center', fontsize=10, fontweight='bold')

# Admin
ax.plot(12.5, 5.5, 'ko', markersize=8)
ax.plot(12.5, 5.0, 'ko', markersize=12, fillstyle='none', markeredgewidth=2)
ax.plot([12.5, 12.5], [4.5, 5.0], 'k-', linewidth=2)
ax.plot([12.2, 12.8], [4.7, 4.7], 'k-', linewidth=2)
ax.plot([12.2, 12.8], [4.2, 4.2], 'k-', linewidth=2)
ax.plot([12.5, 12.2], [4.5, 4.0], 'k-', linewidth=2)
ax.plot([12.5, 12.8], [4.5, 4.0], 'k-', linewidth=2)
ax.text(12.5, 3.7, 'Admin', ha='center', fontsize=10, fontweight='bold')

# Use Cases
use_cases = [
    (5, 6.2, 'Request OTP'),
    (5, 5.2, 'Verify OTP'),
    (5, 4.2, 'Search Breach'),
    (5, 3.2, 'View Results'),
    (9, 6.2, 'Monitor Alerts'),
    (9, 5.2, 'Manage Watchlist'),
    (9, 4.2, 'Verify Audit Event'),
    (9, 3.2, 'View Dashboard'),
    (7, 2.0, 'Login/Register'),
]

for x, y, text in use_cases:
    ellipse = mpatches.Ellipse((x, y), 2.2, 0.6, facecolor='#D5F5E3', edgecolor='#27AE60', linewidth=1.5)
    ax.add_patch(ellipse)
    ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color='#1E8449')

# Actor to Use Case connections
for y_pos in [6.2, 5.2, 4.2, 3.2]:
    ax.plot([2.0, 3.9], [y_pos, y_pos], 'k-', linewidth=1)

for y_pos in [6.2, 5.2, 4.2, 3.2]:
    ax.plot([12.0, 10.1], [y_pos, y_pos], 'k-', linewidth=1)

# Login/Register connections
ax.plot([2.0, 5.9], [4.5, 2.0], 'k-', linewidth=1)
ax.plot([12.0, 8.1], [4.5, 2.0], 'k-', linewidth=1)

# Include relationships
ax.annotate('', xy=(5, 5.2), xytext=(5, 6.0),
            arrowprops=dict(arrowstyle='->', color='#8E44AD', lw=1, linestyle='dashed'))
ax.text(5.3, 5.6, '<<include>>', fontsize=6, color='#8E44AD', rotation=90)

ax.annotate('', xy=(9, 5.2), xytext=(9, 6.0),
            arrowprops=dict(arrowstyle='->', color='#8E44AD', lw=1, linestyle='dashed'))
ax.text(9.3, 5.6, '<<include>>', fontsize=6, color='#8E44AD', rotation=90)

ax.set_title('Use Case Diagram', fontsize=14, fontweight='bold', pad=10)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'usecase_diagram.png'), dpi=200, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print('Use case diagram created')

print(f'\nAll diagrams saved to {output_dir}')
