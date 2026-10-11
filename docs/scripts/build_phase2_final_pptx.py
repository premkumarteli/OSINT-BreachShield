import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import os

template_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\Final_presentation2 format 2026-27.pptx'
output_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Final_Phase2_Presentation.pptx'
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\figures'
diagrams_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'

prs = pptx.Presentation(template_path)

FONT_NAME = 'Calibri'
NAVY = RGBColor(16, 44, 87)
DARK_TEXT = RGBColor(30, 30, 30)
BLUE = RGBColor(33, 97, 140)
GREEN = RGBColor(39, 174, 96)
GRAY = RGBColor(100, 100, 100)
WHITE = RGBColor(255, 255, 255)

def clear_shape(shape):
    if shape.has_text_frame:
        for p in shape.text_frame.paragraphs:
            for r in p.runs:
                r.text = ""

def set_text(shape, text, size=Pt(12), bold=False, color=DARK_TEXT, align=PP_ALIGN.LEFT):
    tf = shape.text_frame
    tf.word_wrap = True
    if len(tf.paragraphs) == 0:
        p = tf.add_paragraph()
    else:
        p = tf.paragraphs[0]
        for r in p.runs:
            r.text = ""
    p.alignment = align
    r = p.add_run() if len(p.runs) == 0 else p.runs[0]
    r.text = text
    r.font.name = FONT_NAME
    r.font.size = size
    r.font.bold = bold
    if color:
        r.font.color.rgb = color
    return p

def add_bullet(shape, text, level=0, size=Pt(12), bold=False, color=DARK_TEXT, space_before=Pt(3), space_after=Pt(2)):
    tf = shape.text_frame
    tf.word_wrap = True
    if len(tf.paragraphs) == 1 and tf.paragraphs[0].text == "":
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.level = level
    p.space_before = space_before
    p.space_after = space_after
    r = p.add_run()
    r.text = text
    r.font.name = FONT_NAME
    r.font.size = size
    r.font.bold = bold
    if color:
        r.font.color.rgb = color
    return p

# ============================================================
# SLIDE 1: TITLE SLIDE
# ============================================================
slide1 = prs.slides[0]
# Shape 0: Under Guidance of
for shape in slide1.shapes:
    if "Under the Guidance" in shape.text:
        clear_shape(shape)
        tf = shape.text_frame
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = "Under the Guidance of\n"
        r.font.size = Pt(11)
        r.font.bold = True
        r = p.add_run()
        r.text = "Prof. Sushma T. M.\n"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = NAVY
        r = p.add_run()
        r.text = "Assistant Professor\nDept. of ISE, Acharya Institute of Technology"
        r.font.size = Pt(10)
        break

# Shape 1: Title
for shape in slide1.shapes:
    if shape.name == "Google Shape;55;p1" and shape.top.inches < 1.5:
        clear_shape(shape)
        tf = shape.text_frame
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = "BreachShield: A Privacy-Preserving OSINT Breach Intelligence Platform with k-Anonymous Search and Blockchain-Anchored Audit Logging"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = NAVY
        break

# Shape 2: Team Members
for shape in slide1.shapes:
    if "Project Team" in shape.text or "Batch No" in shape.text or "ABC" in shape.text:
        clear_shape(shape)
        tf = shape.text_frame
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = "Project Team Members:\n"
        r.font.size = Pt(11)
        r.font.bold = True
        r = p.add_run()
        r.text = "• Arvind D H               (1AY24IS400)\n"
        r.text += "• Girishkumar N M    (1AY24IS404)\n"
        r.text += "• Manoj                        (1AY24IS406)\n"
        r.text += "• Premkumar Teli        (1AY24IS407)"
        r.font.size = Pt(10.5)
        break

# ============================================================
# SLIDE 2: AGENDA
# ============================================================
slide2 = prs.slides[1]
for shape in slide2.shapes:
    if "Abstract" in shape.text and "Introduction" in shape.text:
        clear_shape(shape)
        items = [
            "1. Abstract & Motivation",
            "2. Introduction & Background",
            "3. Problem Statement & Challenges",
            "4. Requirement Specification (Hardware & Software, Functional & Non-Functional)",
            "5. System Architecture & Design (4-Tier Architecture & DFD / UML)",
            "6. Implementation & Core Modules (Web HUD, Gateway, AI Engine, EVM Smart Contract)",
            "7. Testing Methodology (175 Automated Unit, Integration & Security Tests)",
            "8. Comprehensive Test Cases Table (12 Critical Verification Scenarios)",
            "9. Results & Empirical Performance Benchmarks (89.2% Accuracy, 1,034 Records)",
            "10. System Snapshots & Threat Verification",
            "11. Conclusion & Key Takeaways",
            "12. Future Enhancements & Scalability Roadmap",
            "13. Research Paper (Accepted IEEE Conference Publication)",
            "14. References"
        ]
        for it in items:
            add_bullet(shape, it, size=Pt(10), color=DARK_TEXT, space_before=Pt(1), space_after=Pt(1))
        break

# ============================================================
# SLIDE 3: ABSTRACT
# ============================================================
slide3 = prs.slides[2]
for shape in slide3.shapes:
    if "Note:- Write Abstract" in shape.text or shape.name == "TextBox 2":
        clear_shape(shape)
        p1 = add_bullet(shape, 
            "BreachShield is an enterprise-grade, privacy-preserving OSINT breach intelligence platform engineered to solve the structural surveillance flaw inherent in conventional breach search engines. Traditional breach lookup systems require users to submit raw personal emails or credentials to third-party servers, creating potential query exposure. BreachShield overcomes this through a client-side k-anonymity protocol (5-hex-character SHA-256 prefix matching), ensuring that plaintext identifiers never cross the network boundary.",
            size=Pt(10.5), color=DARK_TEXT, space_before=Pt(2), space_after=Pt(4))
        p2 = add_bullet(shape,
            "The platform unifies an out-of-band dual-channel OTP identity gate (Email SMTP + Android SMS relay), a pluggable multi-source OSINT aggregation registry (Telegram, HIBP, local catalogs), an XGBoost breach-severity classifier (89.2% accuracy on 1,034 curated breach records), and a pretrained UrlBERT phishing URL detection model. All administrative and query transactions are batched into SHA-256 Merkle trees anchored to a local EVM smart contract (AnchorRegistry.sol), providing cryptographically verifiable, tamper-evident audit logging. The entire system achieves 100% test pass rates across 175 automated test suites.",
            size=Pt(10.5), color=DARK_TEXT, space_before=Pt(2), space_after=Pt(2))
        break

# ============================================================
# SLIDE 4: INTRODUCTION
# ============================================================
slide4 = prs.slides[3]
# Add content text box to slide 4
tx_box4 = slide4.shapes.add_textbox(Inches(1.8), Inches(1.1), Inches(7.8), Inches(4.1))
tf4 = tx_box4.text_frame
tf4.word_wrap = True

add_bullet(tx_box4, "Background & Industry Threat Context:", size=Pt(12), bold=True, color=NAVY)
add_bullet(tx_box4, "• Escalating Breach Damages: IBM's 2024 Cost of a Data Breach Report estimates the global average cost of a data breach at $4.88M, with compromised credentials accounting for 16% of initial attack vectors.", size=Pt(10.5))
add_bullet(tx_box4, "• Flawed Query Paradigms: Existing breach lookup tools force users to disclose cleartext PII (emails/phone numbers) to third-party databases, turning protective lookups into surveillance risks.", size=Pt(10.5))
add_bullet(tx_box4, "• Log Tampering & Lack of Immutability: Standard database audit logs are vulnerable to administrative manipulation, post-compromise log wiping, and repudiation during forensic reviews.", size=Pt(10.5))

add_bullet(tx_box4, "The BreachShield Solution:", size=Pt(12), bold=True, color=NAVY, space_before=Pt(6))
add_bullet(tx_box4, "• Zero-Knowledge Privacy: Client computes SHA-256 locally via WebCrypto API; only a 5-hex character prefix is disclosed to query candidate partitions.", size=Pt(10.5))
add_bullet(tx_box4, "• Empirical AI Threat Intelligence: Gradient-boosted trees (XGBoost) benchmarked against deep learning models to predict breach severity with 89.2% accuracy.", size=Pt(10.5))
add_bullet(tx_box4, "• Verifiable Blockchain Immutability: SHA-256 Merkle tree batching committed directly to an EVM smart contract to guarantee unalterable forensic trails.", size=Pt(10.5))

# ============================================================
# SLIDE 5: PROBLEM STATEMENT
# ============================================================
slide5 = prs.slides[4]
for shape in slide5.shapes:
    if "Note:- Mention the problem" in shape.text or shape.name == "TextBox 1":
        clear_shape(shape)
        add_bullet(shape, "1. Cleartext Query Surveillance Dilemma", size=Pt(11.5), bold=True, color=NAVY)
        add_bullet(shape, "Conventional breach lookup services require users to transmit plaintext email addresses or usernames over the wire, exposing their active identities and interest in specific breach targets to ISPs, eavesdroppers, and intermediate server operators.", size=Pt(10))
        
        add_bullet(shape, "2. Fragmented & Unstructured OSINT Threat Feeds", size=Pt(11.5), bold=True, color=NAVY, space_before=Pt(4))
        add_bullet(shape, "Threat intelligence is scattered across disparate channels (dark web Telegram dumps, paste sites, commercial APIs). Security teams face severe alert fatigue due to the lack of unified multi-source harvesting and empirical severity classification.", size=Pt(10))
        
        add_bullet(shape, "3. Mutable & Vulnerable Audit Trails", size=Pt(11.5), bold=True, color=NAVY, space_before=Pt(4))
        add_bullet(shape, "Standard centralized databases allow root administrators or attackers to delete, tamper with, or rewrite audit logs post-breach, defeating non-repudiation and enterprise compliance standards.", size=Pt(10))
        
        add_bullet(shape, "4. Ineffective Out-of-Band Identity Gating", size=Pt(11.5), bold=True, color=NAVY, space_before=Pt(4))
        add_bullet(shape, "Automated scraping bots harvest breach data when lookup endpoints lack strict identity gating, rate limiting, and out-of-band multi-factor authentication.", size=Pt(10))
        break

# ============================================================
# SLIDE 6: REQUIREMENT SPECIFICATION
# ============================================================
slide6 = prs.slides[5]
for shape in slide6.shapes:
    if "Note:- Write Functional" in shape.text or shape.name == "TextBox 1":
        clear_shape(shape)
        add_bullet(shape, "Functional Requirements (FR):", size=Pt(11.5), bold=True, color=NAVY)
        add_bullet(shape, "• FR1: Client-Side k-Anonymity — SHA-256 local hashing; transmit only 5-character hex prefix to retrieve suffix buckets for in-memory client matching.", size=Pt(9.5))
        add_bullet(shape, "• FR2: Out-of-Band Dual OTP — Dispatch time-limited verification codes via Gmail SMTP and Android SMS WebSocket relay; 5-attempt brute-force lockout.", size=Pt(9.5))
        add_bullet(shape, "• FR3: Multi-Source OSINT Aggregation — Concurrent harvesting across Telegram MTProto, HIBP v3, and local datasets via Promise.allSettled.", size=Pt(9.5))
        add_bullet(shape, "• FR4: AI Severity Classification & Phishing Detection — XGBoost 7-feature severity model + HuggingFace UrlBERT real-time phishing scoring.", size=Pt(9.5))
        add_bullet(shape, "• FR5: Merkle Tree Blockchain Anchoring — Batch query logs into SHA-256 Merkle trees and anchor roots via AnchorRegistry.sol on EVM.", size=Pt(9.5))
        
        add_bullet(shape, "Non-Functional Requirements (NFR) & Environment:", size=Pt(11.5), bold=True, color=NAVY, space_before=Pt(4))
        add_bullet(shape, "• NFR1 (Privacy & Security): Zero server-side storage of raw queries; bcrypt OTP hashing; JWT RBAC tokens with 1-hour expiration.", size=Pt(9.5))
        add_bullet(shape, "• NFR2 (Performance & Reliability): Sub-800ms end-to-end lookup latency; automatic JSON fallback storage on database disconnect.", size=Pt(9.5))
        add_bullet(shape, "• Hardware & Software Spec: Node.js 20+, Python 3.11+, React 19, Hardhat EVM, MySQL 8.0 / JSON Fallback; Intel i5/i7, 8GB+ RAM, 50GB SSD.", size=Pt(9.5))
        break

# ============================================================
# SLIDE 7: SYSTEM DESIGN
# ============================================================
slide7 = prs.slides[6]
for shape in slide7.shapes:
    if "Note:- Select any two" in shape.text:
        clear_shape(shape)
        break

# Add system architecture diagram image
arch_img = os.path.join(figures_dir, 'fig_architecture.png')
if os.path.exists(arch_img):
    slide7.shapes.add_picture(arch_img, Inches(1.8), Inches(1.15), Inches(5.1), Inches(3.9))

# Add design explanation box on right side
tx7 = slide7.shapes.add_textbox(Inches(7.0), Inches(1.15), Inches(2.8), Inches(3.9))
tf7 = tx7.text_frame
tf7.word_wrap = True
add_bullet(tx7, "Selected Designs:", size=Pt(11), bold=True, color=NAVY)
add_bullet(tx7, "1. Four-Tier Microservice Architecture", size=Pt(9.5), bold=True)
add_bullet(tx7, "• Client HUD (React 19, Web Crypto)", size=Pt(8.5))
add_bullet(tx7, "• Gateway (Express 5, JWT, OTP)", size=Pt(8.5))
add_bullet(tx7, "• AI/OSINT (FastAPI, Telethon, HuggingFace)", size=Pt(8.5))
add_bullet(tx7, "• Ledger (Hardhat EVM, Merkle Registry)", size=Pt(8.5))
add_bullet(tx7, "2. Data Flow & Security Boundaries", size=Pt(11), bold=True, color=NAVY, space_before=Pt(4))
add_bullet(tx7, "• k-Anonymity prefix partition", size=Pt(8.5))
add_bullet(tx7, "• Out-of-band SMS relay via Android", size=Pt(8.5))
add_bullet(tx7, "• Merkle tree root anchoring pipeline", size=Pt(8.5))

# ============================================================
# SLIDE 8: IMPLEMENTATION
# ============================================================
slide8 = prs.slides[7]
for shape in slide8.shapes:
    if "Note: List all the Modules" in shape.text:
        clear_shape(shape)
        add_bullet(shape, "Module 1: Client-Side k-Anonymity Web Console (React 19 & WebCrypto)", size=Pt(11), bold=True, color=NAVY)
        add_bullet(shape, "• Browser uses crypto.subtle.digest('SHA-256', identifier) to generate 64-char hex string.", size=Pt(9.5))
        add_bullet(shape, "• Only the 5-char prefix is sent to /api/k-anonymity/range/:prefix. Suffixes are filtered locally in browser memory.", size=Pt(9.5))
        
        add_bullet(shape, "Module 2: Secure API Gateway & Multi-Source OSINT Registry (Node.js Express 5)", size=Pt(11), bold=True, color=NAVY, space_before=Pt(3))
        add_bullet(shape, "• Out-of-band dual OTP delivery via Gmail SMTP and Android WebSocket (/ws/gateway) with bcrypt hashing.", size=Pt(9.5))
        add_bullet(shape, "• Pluggable BreachSource registry querying Telegram, HIBP, and local catalogs via Promise.allSettled.", size=Pt(9.5))
        
        add_bullet(shape, "Module 3: AI Threat Classification & Phishing Detection (Python FastAPI)", size=Pt(11), bold=True, color=NAVY, space_before=Pt(3))
        add_bullet(shape, "• Pretrained UrlBERT transformer classifies suspicious URLs into benign vs phishing with 89% accuracy.", size=Pt(9.5))
        add_bullet(shape, "• XGBoost multi-class breach severity model (LOW, MEDIUM, HIGH, CRITICAL) trained on 1,034 curated breach records.", size=Pt(9.5))
        
        add_bullet(shape, "Module 4: Merkle Tree Blockchain Audit Ledger (Hardhat EVM & Solidity)", size=Pt(11), bold=True, color=NAVY, space_before=Pt(3))
        add_bullet(shape, "• Deterministic canonical JSON serialization -> SHA-256 leaf hashing -> Merkle Root calculation.", size=Pt(9.5))
        add_bullet(shape, "• AnchorRegistry.sol commits anchorRoot(batchId, root, count) on local EVM blockchain for tamper evidence.", size=Pt(9.5))
        break

# ============================================================
# SLIDE 9: TESTING
# ============================================================
slide9 = prs.slides[8]
for shape in slide9.shapes:
    if "Note:- Explanation about how testing" in shape.text:
        clear_shape(shape)
        add_bullet(shape, "Automated Full-Stack Test Pipeline (175/175 Tests Passing - 100% Pass Rate)", size=Pt(11.5), bold=True, color=NAVY)
        add_bullet(shape, "• Backend Contract & Security Tests (Jest — 103 Tests): Exhaustive test coverage verifying adversarial route gating, rate limiters (429), bcrypt OTP verification, 5-attempt brute-force lockout, and JWT token lifecycle.", size=Pt(10))
        add_bullet(shape, "• Frontend Contract Tests (React Testing Library — 50 Tests): Validated client-side k-anonymity hash generation, prefix slicing, error handling, route protection, and responsive Cyberpunk HUD terminal components.", size=Pt(10), space_before=Pt(3))
        add_bullet(shape, "• Machine Learning & NLP Tests (Pytest — 4 Tests): Tested UrlBERT tokenizer integration, PyTorch inference pipeline, XGBoost 7-feature extraction, and confidence probability thresholding.", size=Pt(10), space_before=Pt(3))
        add_bullet(shape, "• Scraper Resilience Tests (5 Tests): Verified Telethon MTProto flood-wait backoff, Telegram session failover, and non-blocking timeout handling.", size=Pt(10), space_before=Pt(3))
        add_bullet(shape, "• Blockchain & Merkle Tests (Hardhat / Mocha — 10 Tests): Validated canonical JSON formatting, Merkle tree root computation, proof generation, and smart contract state verification.", size=Pt(10), space_before=Pt(3))
        add_bullet(shape, "• Audit Log Tamper-Evidence Tests (3 Tests): Validated immediate cryptographic failure and alert detection whenever log payloads are altered post-anchoring.", size=Pt(10), space_before=Pt(3))
        break

# ============================================================
# SLIDE 10: TEST CASES TABLE
# ============================================================
slide10 = prs.slides[9]
for shape in slide10.shapes:
    if "Note:- write 10 to 12" in shape.text:
        clear_shape(shape)
        p = shape.text_frame.paragraphs[0]
        r = p.add_run()
        r.text = "12 Comprehensive Test Cases across Unit, Integration, and System Verification"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = NAVY
        break

test_cases_data = [
    ("TC-01", "Unit (Frontend)", "User email: test@example.com", "Generate 64-char SHA-256 hash locally", "Local hash computed in browser", "PASS", "Zero plaintext leak"),
    ("TC-02", "Unit (Frontend)", "SHA-256 full hash", "Extract exactly first 5 hex chars as prefix", "Prefix '973af' extracted", "PASS", "k-Anonymity contract"),
    ("TC-03", "Unit (Backend)", "6-digit OTP generated", "Hash OTP with bcrypt before storage", "bcrypt salt & hash stored in DB", "PASS", "Safe at rest"),
    ("TC-04", "Unit (Backend)", "OTP request within 30s cooldown", "Return HTTP 429 Too Many Requests", "HTTP 429 returned with retry countdown", "PASS", "Spam prevention"),
    ("TC-05", "Unit (Backend)", "5 consecutive wrong OTP submissions", "Lockout target and reject further attempts", "Account locked for 15 minutes", "PASS", "Brute-force defense"),
    ("TC-06", "Integration (Auth)", "Valid email OTP request", "Nodemailer dispatches email via Gmail SMTP", "Email received with 6-digit code", "PASS", "Out-of-band verified"),
    ("TC-07", "Integration (Relay)", "Phone OTP request via WebSocket", "Relay payload over /ws/gateway to Android app", "Android SmsManager dispatches SMS", "PASS", "Carrier-safe template"),
    ("TC-08", "Integration (OSINT)", "Query with 5-char prefix", "Aggregate Telegram, HIBP & Local datasets", "Unified JSON response via Promise.allSettled", "PASS", "Non-blocking fallback"),
    ("TC-09", "Integration (ML)", "URL: paypa1-secure-login.tk", "UrlBERT predicts Phishing probability > 65%", "Classified as PHISHING (89% prob)", "PASS", "Live model verified"),
    ("TC-10", "Integration (Merkle)", "Batch of 10 audit log events", "Construct SHA-256 Merkle tree & root", "Valid 32-byte Merkle root computed", "PASS", "Deterministic hashes"),
    ("TC-11", "System (Blockchain)", "Anchor Merkle root to Hardhat", "AnchorRegistry.sol commits anchorRoot tx", "EVM transaction mined with block receipt", "PASS", "On-chain immutability"),
    ("TC-12", "System (Audit)", "Mutate 1 byte in anchored audit log", "Merkle proof verification must fail", "Cryptographic mismatch detected & logged", "PASS", "Tamper evidence validated"),
]

# Remove old table shape and add new 13x7 table
for shape in list(slide10.shapes):
    if shape.has_table:
        sp = shape._element
        sp.getparent().remove(sp)

new_tbl_shape = slide10.shapes.add_table(len(test_cases_data) + 1, 7, Inches(1.8), Inches(1.4), Inches(8.0), Inches(3.9))
table = new_tbl_shape.table

# Set specific column widths
col_widths = [Inches(0.7), Inches(1.1), Inches(1.4), Inches(1.5), Inches(1.5), Inches(0.7), Inches(1.1)]
for c_idx, w in enumerate(col_widths):
    table.columns[c_idx].width = w

# Format Header
headers = ["TC#", "Testing Type", "Input", "Expected Output", "Obtained Result", "Status", "Remarks"]
for c_idx, h_text in enumerate(headers):
    cell = table.cell(0, c_idx)
    cell.text = h_text
    p = cell.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.runs[0].font.size = Pt(8.5)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = WHITE
    cell.fill.solid()
    cell.fill.fore_color.rgb = NAVY

# Populate Rows
for r_idx, row_data in enumerate(test_cases_data):
    row = table.rows[r_idx + 1]
    for c_idx, val in enumerate(row_data):
        cell = row.cells[c_idx]
        cell.text = val
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER if c_idx in [0, 5] else PP_ALIGN.LEFT
        if len(p.runs) > 0:
            p.runs[0].font.size = Pt(7.5)
            p.runs[0].font.name = FONT_NAME
            if c_idx == 5:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = GREEN
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(245, 248, 250) if r_idx % 2 == 0 else WHITE


# ============================================================
# SLIDE 11: RESULTS (SNAPSHOTS)
# ============================================================
slide11 = prs.slides[10]
for shape in slide11.shapes:
    if "Note:- Place 5 to 6" in shape.text:
        clear_shape(shape)
        break

# Place 3 benchmark/architectural figures
fig_model = os.path.join(figures_dir, 'fig_model_comparison.png')
fig_f1 = os.path.join(figures_dir, 'fig_per_class_f1.png')
fig_merkle = os.path.join(figures_dir, 'fig_merkle_anchoring.png')

if os.path.exists(fig_model):
    slide11.shapes.add_picture(fig_model, Inches(1.8), Inches(1.2), Inches(3.8), Inches(2.0))
if os.path.exists(fig_f1):
    slide11.shapes.add_picture(fig_f1, Inches(5.8), Inches(1.2), Inches(3.9), Inches(2.0))
if os.path.exists(fig_merkle):
    slide11.shapes.add_picture(fig_merkle, Inches(1.8), Inches(3.3), Inches(4.5), Inches(2.0))

# Result metrics summary box
tx11 = slide11.shapes.add_textbox(Inches(6.4), Inches(3.3), Inches(3.3), Inches(2.0))
tf11 = tx11.text_frame
tf11.word_wrap = True
add_bullet(tx11, "Empirical Results Summary:", size=Pt(10), bold=True, color=NAVY)
add_bullet(tx11, "• 89.2% Test Accuracy for XGBoost severity model on 1,034 curated records (vs 66.2% CNN, 48.4% Transformer).", size=Pt(8.5))
add_bullet(tx11, "• 175/175 Automated Tests Passing with zero build breaks across frontend, backend, ML and blockchain.", size=Pt(8.5))
add_bullet(tx11, "• Sub-800ms end-to-end query latency with zero raw PII disclosure on network layer.", size=Pt(8.5))
add_bullet(tx11, "• 100% Tamper Detection on mutated audit log entries via SHA-256 Merkle root verification.", size=Pt(8.5))

# ============================================================
# SLIDE 12: CONCLUSION
# ============================================================
slide12 = prs.slides[11]
tx_box12 = slide12.shapes.add_textbox(Inches(1.8), Inches(1.2), Inches(7.8), Inches(4.0))
tf12 = tx_box12.text_frame
tf12.word_wrap = True

add_bullet(tx_box12, "Summary of Achievements & Technical Contributions:", size=Pt(12), bold=True, color=NAVY)
add_bullet(tx_box12, "• Eliminated Query Surveillance: Engineered a production-ready client-side k-anonymity protocol using WebCrypto SHA-256 prefix hashing, guaranteeing that sensitive search targets are never transmitted in the clear.", size=Pt(10.5))
add_bullet(tx_box12, "• Multi-Tier Architectural Integration: Successfully harmonized React 19 frontend HUD, Node.js Express 5 API Gateway, Python FastAPI ML services, Android Kotlin SMS gateway, and EVM Hardhat blockchain.", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box12, "• Empirical AI Severity Classification: Curated a 1,034-record breach benchmark and established XGBoost as superior to deep learning architectures (89.2% accuracy, 83.2% Macro F1).", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box12, "• Cryptographic Audit Immutability: Deployed Merkle tree batching committed to AnchorRegistry.sol smart contracts, delivering verifiable tamper evidence.", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box12, "• Rigorous Engineering Quality: Validated end-to-end functionality across 175 automated unit, integration, and security tests with 100% pass rates.", size=Pt(10.5), space_before=Pt(3))

# ============================================================
# SLIDE 13: FUTURE ENHANCEMENTS
# ============================================================
slide13 = prs.slides[12]
tx_box13 = slide13.shapes.add_textbox(Inches(1.8), Inches(1.2), Inches(7.8), Inches(4.0))
tf13 = tx_box13.text_frame
tf13.word_wrap = True

add_bullet(tx_box13, "Future Enhancements & Scalability Roadmap:", size=Pt(12), bold=True, color=NAVY)
add_bullet(tx_box13, "• Public L2 Blockchain Deployment: Transition smart contract anchoring from local Hardhat testnet to Ethereum Layer-2 rollups (Arbitrum, Polygon) for decentralized, low-cost public verification.", size=Pt(10.5))
add_bullet(tx_box13, "• Zero-Knowledge Proofs (zk-SNARKs): Enhance privacy by implementing zero-knowledge membership proofs, allowing users to verify breach status without downloading suffix buckets.", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box13, "• Distributed Tor/I2P Dark Web Scrapers: Expand the OSINT registry with decentralized headless scrapers for hidden onion services and pastebin networks.", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box13, "• Automated Enterprise Credential Revocation: Integrate with enterprise Identity Providers (Okta, Azure AD) via SCIM APIs for immediate password revocation upon compromise.", size=Pt(10.5), space_before=Pt(3))
add_bullet(tx_box13, "• Synthetic Data Balancing for Rare Breaches: Apply SMOTE and generative augmentations to expand training support for CRITICAL tier severity records.", size=Pt(10.5), space_before=Pt(3))

# ============================================================
# SLIDE 14: RESEARCH PAPER SLIDE
# ============================================================
slide14 = prs.slides[13]
tx_box14 = slide14.shapes.add_textbox(Inches(1.8), Inches(1.3), Inches(7.8), Inches(3.9))
tf14 = tx_box14.text_frame
tf14.word_wrap = True

add_bullet(tx_box14, "Research Publication Outcome (Accepted IEEE Conference Paper):", size=Pt(12), bold=True, color=NAVY)
add_bullet(tx_box14, "• Title: BreachShield: A Privacy-Preserving OSINT Breach Intelligence Platform with k-Anonymous Search and Blockchain-Anchored Audit Logging", size=Pt(10.5), bold=True, color=DARK_TEXT, space_before=Pt(3))
add_bullet(tx_box14, "• Authors: Arvind D. H., Girishkumar N. M., Manoj, Premkumar Teli", size=Pt(10))
add_bullet(tx_box14, "• Project Guide: Prof. Sushma T. M. (Assistant Professor, Dept. of ISE)", size=Pt(10))
add_bullet(tx_box14, "• Status: Accepted for Presentation & Publication in IEEE International Conference", size=Pt(10), bold=True, color=GREEN)
add_bullet(tx_box14, "• Acceptance Proof & Certificate: COE-BIS786 on record in departmental archive.", size=Pt(10))

add_bullet(tx_box14, "Key Research Innovations Published:", size=Pt(11), bold=True, color=NAVY, space_before=Pt(5))
add_bullet(tx_box14, "1. Formalized client-side k-anonymity protocol avoiding cleartext identifier disclosure in breach searches.", size=Pt(9.5))
add_bullet(tx_box14, "2. Curated 1,034-record empirical breach benchmark comparing XGBoost (89.2%) against 1D-CNN (66.2%) and Transformer (48.4%).", size=Pt(9.5))
add_bullet(tx_box14, "3. Verifiable Merkle-tree EVM smart contract anchoring architecture for immutable cybersecurity audit logs.", size=Pt(9.5))

# ============================================================
# SLIDE 15: REFERENCES
# ============================================================
slide15 = prs.slides[14]
tx_box15 = slide15.shapes.add_textbox(Inches(1.8), Inches(1.1), Inches(7.8), Inches(4.1))
tf15 = tx_box15.text_frame
tf15.word_wrap = True

add_bullet(tx_box15, "References:", size=Pt(12), bold=True, color=NAVY)
refs = [
    "[1] R. Aljofey et al., \"An effective convolutional neural network for phishing detection using character-level URL features,\" Computers & Security, vol. 116, p. 102674, 2022.",
    "[2] O. K. Sahingoz et al., \"Machine learning based phishing detection from URLs,\" Expert Systems with Applications, vol. 117, pp. 345–357, 2019.",
    "[3] F. Alsubaei et al., \"A hybrid deep learning-based framework for phishing URL detection with SMOTE,\" IEEE Access, vol. 10, pp. 88124–88137, 2022.",
    "[4] M. Pavani et al., \"Explainable AI for malicious URL detection using SHAP and LIME,\" IEEE Trans. Information Forensics and Security, 2023.",
    "[5] NIST Special Publication 800-63B, \"Digital Identity Guidelines: Authentication and Lifecycle Management,\" National Institute of Standards and Technology, 2020.",
    "[6] M. Kuhn et al., \"Systematic evaluation of dark-web monitoring methodology,\" ACM Computing Surveys, vol. 55, no. 4, pp. 1–35, 2023.",
    "[7] IBM Security, \"Cost of a Data Breach Report 2024,\" IBM Corporation, Tech. Rep., 2024.",
    "[8] T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in Proc. 22nd ACM SIGKDD, 2016, pp. 785–794."
]
for ref in refs:
    add_bullet(tx_box15, ref, size=Pt(8.5), color=DARK_TEXT, space_before=Pt(1), space_after=Pt(1))

# Save presentation
prs.save(output_path)
print(f"Successfully generated final presentation at: {output_path}")
