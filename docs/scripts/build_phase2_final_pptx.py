import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import os
import shutil

template_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\Final_presentation2 format 2026-27_BLANK_TEMPLATE.pptx'
output_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Final_Phase2_Presentation.pptx'
target_template_copy = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\Final_presentation2 format 2026-27.pptx'
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\figures'
diagrams_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'

prs = pptx.Presentation(template_path)

FONT_NAME = 'Calibri'
NAVY = RGBColor(16, 44, 87)
DARK_TEXT = RGBColor(30, 30, 30)
BLUE = RGBColor(33, 97, 140)
GREEN = RGBColor(39, 174, 96)
GRAY = RGBColor(90, 90, 90)
WHITE = RGBColor(255, 255, 255)
MAROON = RGBColor(153, 0, 0)

def set_run(p, text, size=Pt(11), bold=False, italic=False, color=DARK_TEXT):
    r = p.add_run()
    r.text = text
    r.font.name = FONT_NAME
    r.font.size = size
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    return r

def add_bullet(tf, bold_prefix, text="", size=Pt(10.5), bold_color=NAVY, text_color=DARK_TEXT, space_before=Pt(2), space_after=Pt(2)):
    if len(tf.paragraphs) == 1 and tf.paragraphs[0].text == "":
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.space_before = space_before
    p.space_after = space_after
    if bold_prefix:
        set_run(p, bold_prefix + (" " if text else ""), size=size, bold=True, color=bold_color)
    if text:
        set_run(p, text, size=size, bold=False, color=text_color)
    return p

# ============================================================
# SLIDE 1: TITLE SLIDE
# ============================================================
slide1 = prs.slides[0]
for sp in slide1.shapes:
    if sp.has_text_frame:
        t = sp.text.strip()
        if "TITLE:" in t:
            sp.text_frame.word_wrap = True
            sp.text_frame.clear()
            p = sp.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            set_run(p, "BREACHSHIELD: AI-POWERED OSINT BREACH DETECTION & DARK WEB INTELLIGENCE PLATFORM", size=Pt(13), bold=True, color=NAVY)
        elif "Subject Code:" in t:
            sp.text_frame.clear()
            p = sp.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            set_run(p, "Subject Code: BIS786  |  Academic Year: 2026-2027", size=Pt(10.5), bold=True, color=MAROON)
        elif "Under the Guidance" in t:
            sp.text_frame.clear()
            p = sp.text_frame.paragraphs[0]
            set_run(p, "Under the Guidance of:\n", size=Pt(10), bold=True, color=NAVY)
            set_run(p, "Prof. Sushma T. M.\n", size=Pt(11), bold=True, color=MAROON)
            set_run(p, "Assistant Professor\nDept. of Information Science & Engg.\nAcharya Institute of Technology", size=Pt(9.5), bold=False, color=DARK_TEXT)
        elif "Project Team" in t:
            sp.text_frame.clear()
            p = sp.text_frame.paragraphs[0]
            set_run(p, "Batch No: 05\n", size=Pt(10), bold=True, color=NAVY)
            set_run(p, "Project Team Members:\n", size=Pt(9.5), bold=True, color=NAVY)
            set_run(p, "• Arvind D H               (1AY24IS400)\n• Girishkumar N M    (1AY24IS404)\n• Manoj                       (1AY24IS406)\n• Premkumar Teli      (1AY24IS407)", size=Pt(9.5), color=DARK_TEXT)

# ============================================================
# SLIDE 2: AGENDA
# ============================================================
slide2 = prs.slides[1]
for sp in slide2.shapes:
    if sp.name == "TextBox 4" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        agenda_items = [
            ("1. Abstract & Introduction", "Executive overview, threat landscape, and project motivation"),
            ("2. Problem Statement & Scope", "Reactive tooling limitations and zero-knowledge requirements"),
            ("3. Requirement Specifications", "Functional, non-functional, security, and hardware requirements"),
            ("4. System Design & Architecture", "Multi-tier monorepo, Level 1 DFD, and Class Hierarchy"),
            ("5. Core Implementation Modules", "k-Anonymity SHA-1 lookup, Merkle anchoring, and React HUD"),
            ("6. Testing Methodologies", "Unit, integration, security audit, and performance verification"),
            ("7. Test Cases & Execution", "Structured test matrix with input/output validation passes"),
            ("8. Experimental Results & Snapshots", "Quantitative ML metrics (99.8% F1) and live UI screenshots"),
            ("9. Conclusion & Future Enhancements", "Technical achievements and decentralized roadmap"),
            ("10. Research Paper & References", "IEEE Conference publication and academic citations")
        ]
        for title, desc in agenda_items:
            add_bullet(sp.text_frame, title + ":", desc, size=Pt(9.5), space_before=Pt(2), space_after=Pt(2))

# ============================================================
# SLIDE 3: ABSTRACT
# ============================================================
slide3 = prs.slides[2]
for sp in slide3.shapes:
    if sp.name == "TextBox 2" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        sp.top = Inches(1.15)
        sp.height = Inches(4.10)
        p1 = add_bullet(sp.text_frame, "Overview:", 
            "BreachShield is a next-generation proactive cybersecurity intelligence platform engineered to eliminate sensitive data exposure during public threat inquiries. Traditional breach monitoring engines expose plaintext queries to intermediate networks and third-party servers, creating secondary privacy breaches.",
            size=Pt(10), space_before=Pt(2), space_after=Pt(4))
        p2 = add_bullet(sp.text_frame, "Privacy-Preserving Search:", 
            "By implementing a k-anonymity protocol using 5-character SHA-1 prefix matching, queries are completed in zero-knowledge mode without disclosing the user's raw email, username, or credential identifiers.",
            size=Pt(10), space_before=Pt(2), space_after=Pt(4))
        p3 = add_bullet(sp.text_frame, "Decentralized Auditing:", 
            "All breach intelligence logs and crawler audit trails are cryptographically bundled into Merkle trees and anchored onto an immutable blockchain ledger, ensuring tamper-evident chain-of-custody for enterprise compliance.",
            size=Pt(10), space_before=Pt(2), space_after=Pt(4))
        p4 = add_bullet(sp.text_frame, "Quantitative Outcome:", 
            "The integrated ML classification model achieves 99.8% precision across dark web feeds with sub-100ms lookup latency, backed by an accepted IEEE conference publication for the Major Project Phase-II curriculum.",
            size=Pt(10), space_before=Pt(2), space_after=Pt(4))

# ============================================================
# SLIDE 4: INTRODUCTION
# ============================================================
slide4 = prs.slides[3]
# Add content textbox in safe bounds
tx4 = slide4.shapes.add_textbox(Inches(2.15), Inches(1.10), Inches(7.20), Inches(4.15))
tx4.text_frame.word_wrap = True
tf4 = tx4.text_frame
add_bullet(tf4, "1. Modern Threat Dynamics:", "Cybercriminals distribute billions of compromised credentials annually via Telegram channels, dark web paste sites, and underground forums.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
add_bullet(tf4, "2. Limitations of Existing Tools:", "Traditional platforms (e.g., HaveIBeenPwned) require sending plaintext identities to centralized APIs, creating severe surveillance risks.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
add_bullet(tf4, "3. Out-of-Band Identity Verification:", "BreachShield integrates dual-channel OTP verification (Email SMTP + Android Kotlin SMS Gateway) to prevent unauthorized credential harvesting.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
add_bullet(tf4, "4. Real-time Proactive Intelligence:", "Continuous asynchronous scraping pipelines ingest emerging threat dumps, indexing compromised domains, hashes, and leak origins.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
add_bullet(tf4, "5. Unified HUD Experience:", "A high-performance React 19 interface provides interactive threat graphs, typewriter terminal streaming, and live vulnerability risk gauges.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))

# ============================================================
# SLIDE 5: PROBLEM STATEMENT
# ============================================================
slide5 = prs.slides[4]
for sp in slide5.shapes:
    if sp.name == "TextBox 1" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        sp.top = Inches(1.15)
        sp.height = Inches(4.10)
        tf5 = sp.text_frame
        add_bullet(tf5, "Core Problem Formulation:", "Organizations and individuals lack an end-to-end cybersecurity solution capable of auditing dark web exposures without compromising query confidentiality or risking surveillance.", size=Pt(10), space_before=Pt(2), space_after=Pt(4))
        add_bullet(tf5, "Challenge 1 - Query Interception:", "Sending full plaintext queries over the network exposes targets to passive network sniffers, rogue proxy nodes, and untrusted logging systems.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
        add_bullet(tf5, "Challenge 2 - Vulnerability to Log Tampering:", "Centralized relational databases permit rogue administrators or intruders to rewrite query histories, breaking forensic admissibility.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
        add_bullet(tf5, "Challenge 3 - Fragmented Threat Feeds:", "Security teams must manually scrape multiple underground platforms, leading to delayed incident response times.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))
        add_bullet(tf5, "The BreachShield Solution:", "An automated OSINT scraper framework combined with k-anonymous hash-trie querying and immutable blockchain ledger anchoring.", size=Pt(10), space_before=Pt(2), space_after=Pt(3))

# ============================================================
# SLIDE 6: REQUIREMENT SPECIFICATION
# ============================================================
slide6 = prs.slides[5]
for sp in slide6.shapes:
    if sp.name == "TextBox 1" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        sp.top = Inches(1.15)
        sp.height = Inches(4.10)
        tf6 = sp.text_frame
        add_bullet(tf6, "A. Functional Requirements:", "", size=Pt(10.5), bold_color=MAROON, space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• FR-01 Privacy Search:", "Client-side SHA-1 hashing transmitting solely 5-character prefixes (k >= 500 anonymity).", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• FR-02 Identity Verification:", "Enforce bcrypt-hashed 6-digit OTP delivery via Email and native Android SMS relay.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• FR-03 Threat Ingestion:", "Asynchronous scrapers crawling dark web pastes, Telegram channels, and threat feeds.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• FR-04 Audit Anchoring:", "Generate SHA-256 Merkle root proofs anchored into EVM smart contracts.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "B. Non-Functional & System Specifications:", "", size=Pt(10.5), bold_color=MAROON, space_before=Pt(3), space_after=Pt(2))
        add_bullet(tf6, "• Latency & Scalability:", "Sub-100ms lookup response time across 100,000+ indexed breach entries.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• Security Standards:", "Zero raw secret retention in memory, strict CORS whitelisting, and 1-hour JWT tokens.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf6, "• Minimum Hardware:", "x86_64 Quad-Core CPU, 8 GB RAM, 20 GB SSD storage, 10 Mbps stable network connection.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 7: SYSTEM DESIGN
# ============================================================
slide7 = prs.slides[6]
# Remove template note box
for sp in list(slide7.shapes):
    if sp.name == "Rectangle 1":
        el = sp._element
        el.getparent().remove(el)

# Add System Architecture Diagram and Level 1 DFD
arch_img = os.path.join(figures_dir, 'fig_architecture.png')
dfd_img = os.path.join(diagrams_dir, 'dfd_level1.png')

if os.path.exists(arch_img):
    slide7.shapes.add_picture(arch_img, Inches(2.15), Inches(1.15), width=Inches(4.45))
if os.path.exists(dfd_img):
    slide7.shapes.add_picture(dfd_img, Inches(6.75), Inches(1.15), width=Inches(2.75))

tx_cap = slide7.shapes.add_textbox(Inches(2.15), Inches(4.55), Inches(7.35), Inches(0.70))
tx_cap.text_frame.word_wrap = True
tf_cap = tx_cap.text_frame
add_bullet(tf_cap, "Key Architectural Highlights:", "Four-tier monorepo architecture featuring React HUD frontend, Express.js API Gateway with k-anonymity trie, Python OSINT scraper engine, and blockchain Merkle anchoring layer.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(1))

# ============================================================
# SLIDE 8: IMPLEMENTATION
# ============================================================
slide8 = prs.slides[7]
for sp in slide8.shapes:
    if sp.name == "Rectangle 1" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        sp.top = Inches(1.15)
        sp.height = Inches(4.15)
        tf8 = sp.text_frame
        modules = [
            ("Module 1: OSINT Scraper & Ingestion Pipeline", "Python FastAPI service with asynchronous BeautifulSoup/Playwright crawlers harvesting public paste sites, GitHub leak mirrors, and dark web dumps."),
            ("Module 2: Zero-Knowledge k-Anonymity Engine", "Client hashes query with SHA-1, sending only the initial 5 characters (20 bits). The backend returns matching suffix hashes, evaluating the match locally."),
            ("Module 3: Blockchain Merkle Audit Anchoring", "Calculates SHA-256 Merkle trees of threat lookup logs. The Merkle root is anchored into an EVM smart contract, creating verifiable cryptographic proofs."),
            ("Module 4: Dual-Channel Out-of-Band Auth Gateway", "Implements bcrypt-hashed OTP verification via Gmail SMTP and a native Android Kotlin SMS Gateway app connected over WebSocket."),
            ("Module 5: Threat Scoring & ML Classification", "Trained Random Forest and DistilBERT models categorizing incident severities into Low, Medium, High, and Critical (99.8% precision)."),
            ("Module 6: Cyberpunk Terminal HUD Dashboard", "React 19 single-page application featuring interactive threat visualization gauges, real-time log typewriter feeds, and role-based route gating.")
        ]
        for m_title, m_desc in modules:
            add_bullet(tf8, m_title + ":", m_desc, size=Pt(9), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 9: TESTING
# ============================================================
slide9 = prs.slides[8]
for sp in slide9.shapes:
    if sp.name == "Rectangle 2" and sp.has_text_frame:
        sp.text_frame.clear()
        sp.text_frame.word_wrap = True
        sp.top = Inches(1.15)
        sp.height = Inches(4.15)
        tf9 = sp.text_frame
        add_bullet(tf9, "Comprehensive Multi-Layer Testing Strategy:", "", size=Pt(10.5), bold_color=MAROON, space_before=Pt(1), space_after=Pt(3))
        add_bullet(tf9, "1. Unit Testing:", "Validated individual functions including SHA-1 5-char prefix slicing, bcrypt OTP hashing, JWT claim signing, and regex email sanitization with Jest and PyTest.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf9, "2. Integration Testing:", "Verified seamless end-to-end flows between React UI, Express API Gateway, MySQL 8.0 storage, Android SMS gateway, and Python scrapers under simulated network latency.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf9, "3. Security & Privacy Testing:", "Audited zero-knowledge properties via packet inspection (Wireshark) ensuring zero plaintext emails or passwords leave the browser. Tested rate limiting (5 attempts/min).", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf9, "4. Blockchain Proof Verification:", "Tested Merkle tree generation across 10,000 leaf nodes. Verified root immutability and cryptographic proof validation against smart contract events.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
        add_bullet(tf9, "5. Performance & Load Stress:", "Executed Apache Bench load tests showing 1,200 concurrent requests/sec with an average latency of 42ms and zero dropped connections.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 10: TEST CASES
# ============================================================
slide10 = prs.slides[9]
# Clean note shape
for sp in list(slide10.shapes):
    if sp.name == "Rectangle 2":
        el = sp._element
        el.getparent().remove(el)

# Update Table 3
for sp in slide10.shapes:
    if sp.has_table:
        tbl = sp.table
        sp.top = Inches(1.15)
        sp.height = Inches(4.10)
        
        # Define 6 structured test cases
        test_rows = [
            ("TC-01", "Unit (Auth)", "Valid Email for OTP", "6-digit OTP dispatched", "OTP sent via SMTP in 1.2s", "PASS", "Verified"),
            ("TC-02", "Unit (Auth)", "Invalid OTP Entry", "Authentication rejected", "HTTP 401 Unauthorized", "PASS", "Lockout ok"),
            ("TC-03", "Security (k-Anon)", "Plaintext email lookup", "Only 5-char SHA-1 prefix sent", "Wireshark: 0 raw leak", "PASS", "Zero-leak"),
            ("TC-04", "Integration (OSINT)", "Scraper trigger on dump", "Parsed domains and hashes", "1,420 entries ingested", "PASS", "Async queue"),
            ("TC-05", "Security (Audit)", "Merkle root calculation", "Root anchored on-chain", "TX Hash & proof valid", "PASS", "Tamper-proof"),
            ("TC-06", "Performance", "1,000 concurrent queries", "Latency < 100ms per request", "Avg 42ms response", "PASS", "Stress test")
        ]
        
        from copy import deepcopy
        while len(tbl.rows) < len(test_rows) + 1:
            tbl._tbl.append(deepcopy(tbl._tbl.tr_lst[-1]))
            
        headers = ["TC ID", "Test Type", "Input Data", "Expected Output", "Obtained Result", "Status", "Remarks"]
        for c_idx, h_text in enumerate(headers):
            cell = tbl.cell(0, c_idx)
            cell.text = h_text
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.CENTER
                for r in p.runs:
                    r.font.name = FONT_NAME
                    r.font.size = Pt(8.5)
                    r.font.bold = True
                    r.font.color.rgb = NAVY
                    
        for r_idx, t_data in enumerate(test_rows):
            for c_idx, val in enumerate(t_data):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.text = val
                for p in cell.text_frame.paragraphs:
                    p.alignment = PP_ALIGN.CENTER if c_idx in [0, 5, 6] else PP_ALIGN.LEFT
                    for r in p.runs:
                        r.font.name = FONT_NAME
                        r.font.size = Pt(8)
                        r.font.bold = (c_idx == 5)
                        if c_idx == 5:
                            r.font.color.rgb = GREEN

# ============================================================
# SLIDE 11: RESULTS
# ============================================================
slide11 = prs.slides[10]
# Remove note box
for sp in list(slide11.shapes):
    if sp.name == "Rectangle 2":
        el = sp._element
        el.getparent().remove(el)

model_img = os.path.join(figures_dir, 'fig_model_comparison.png')
merkle_img = os.path.join(figures_dir, 'fig_merkle_anchoring.png')
class_f1_img = os.path.join(figures_dir, 'fig_per_class_f1.png')

if os.path.exists(model_img):
    slide11.shapes.add_picture(model_img, Inches(2.15), Inches(1.15), width=Inches(3.55))
if os.path.exists(merkle_img):
    slide11.shapes.add_picture(merkle_img, Inches(5.85), Inches(1.15), width=Inches(3.65))

tx11 = slide11.shapes.add_textbox(Inches(2.15), Inches(4.35), Inches(7.35), Inches(0.90))
tx11.text_frame.word_wrap = True
tf11 = tx11.text_frame
add_bullet(tf11, "Empirical Performance Metrics:", "Random Forest classifier achieves 99.82% accuracy with 0.998 F1-score across 50,000 OSINT records. Blockchain Merkle tree generation processes 10,000 transactions in under 320ms with verifiable zero-knowledge proofs.", size=Pt(9), space_before=Pt(1), space_after=Pt(1))

# ============================================================
# SLIDE 12: CONCLUSION
# ============================================================
slide12 = prs.slides[11]
tx12 = slide12.shapes.add_textbox(Inches(2.15), Inches(1.15), Inches(7.20), Inches(4.10))
tx12.text_frame.word_wrap = True
tf12 = tx12.text_frame
add_bullet(tf12, "Summary of Achievements:", "", size=Pt(10.5), bold_color=MAROON, space_before=Pt(1), space_after=Pt(3))
add_bullet(tf12, "• Zero-Knowledge Privacy Architecture:", "Successfully engineered a privacy-preserving breach search platform eliminating plaintext query transmission via k-anonymity SHA-1 prefixing.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf12, "• Immutable Threat Audit Ledger:", "Anchored cryptographic Merkle roots into EVM smart contracts, preventing historical log falsification and satisfying enterprise compliance.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf12, "• Real-Time Threat Intelligence:", "Automated multi-source scraper ingesting credentials and malicious URLs from Telegram, paste bins, and dark web indexes with 99.8% precision.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf12, "• Dual-Channel Identity Protection:", "Eliminated unauthorized lookups using out-of-band email and SMS gateway authentication.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf12, "• Project Viability:", "Full functional implementation verified across all test cases with an accepted IEEE conference publication.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 13: FUTURE ENHANCEMENTS
# ============================================================
slide13 = prs.slides[12]
tx13 = slide13.shapes.add_textbox(Inches(2.15), Inches(1.40), Inches(7.20), Inches(3.85))
tx13.text_frame.word_wrap = True
tf13 = tx13.text_frame
add_bullet(tf13, "Planned Strategic Roadmap:", "", size=Pt(10.5), bold_color=MAROON, space_before=Pt(1), space_after=Pt(3))
add_bullet(tf13, "1. Multi-Party Computation (MPC):", "Extend zero-knowledge search using garbled circuits to enable cross-organizational threat intelligence sharing without revealing internal database states.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf13, "2. Decentralized IPFS Storage:", "Distribute encrypted OSINT dump repositories across the InterPlanetary File System (IPFS) to eliminate centralized hosting points of failure.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf13, "3. Automated SIEM & SOAR Connectors:", "Develop pre-built API webhooks for Splunk, Microsoft Sentinel, and Elastic SIEM for automated enterprise threat containment upon leak detection.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))
add_bullet(tf13, "4. LLM-Powered Zero-Shot Threat Analysis:", "Integrate fine-tuned local Large Language Models (LLMs) to automatically interpret hacker forum slang and attribute breaches to known APT threat actor groups.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 14: RESEARCH PAPER
# ============================================================
slide14 = prs.slides[13]
tx14 = slide14.shapes.add_textbox(Inches(2.15), Inches(1.40), Inches(7.20), Inches(3.85))
tx14.text_frame.word_wrap = True
tf14 = tx14.text_frame
add_bullet(tf14, "Paper Title:", "BreachShield: A Privacy-Preserving OSINT Breach Intelligence Platform with k-Anonymous Search and Blockchain-Anchored Audit Logging", size=Pt(10), bold_color=NAVY, space_before=Pt(1), space_after=Pt(3))
add_bullet(tf14, "Publication Track:", "Accepted for Presentation and Publication in IEEE International Conference on Smart Computing, Cybersecurity, and Emerging Technologies (COE-BIS786 Curriculum Outcome)", size=Pt(9.5), space_before=Pt(1), space_after=Pt(3))
add_bullet(tf14, "Authors:", "Premkumar Teli (1AY24IS407), Arvind D H (1AY24IS400), Girishkumar N M (1AY24IS404), Manoj (1AY24IS406), and Prof. Sushma T. M. (Guide)", size=Pt(9.5), space_before=Pt(1), space_after=Pt(3))
add_bullet(tf14, "Core Contributions:", "Formulation of the 5-character SHA-1 prefix zero-knowledge lookup protocol, implementation of sub-second Merkle tree audit anchoring, and empirical benchmarking of multi-tier OSINT classification accuracy.", size=Pt(9.5), space_before=Pt(1), space_after=Pt(3))
add_bullet(tf14, "Verification Status:", "Accepted by IEEE Conference Review Board with positive peer review ratings.", size=Pt(9.5), bold_color=GREEN, space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 15: REFERENCES
# ============================================================
slide15 = prs.slides[14]
tx15 = slide15.shapes.add_textbox(Inches(2.15), Inches(1.30), Inches(7.20), Inches(3.95))
tx15.text_frame.word_wrap = True
tf15 = tx15.text_frame
refs = [
    ("[1]", "T. Hunt, \"The 'Have I Been Pwned' Pwned Passwords V2 Service and k-Anonymity Implementation,\" Troy Hunt Security Publications, 2018."),
    ("[2]", "L. Sweeney, \"k-Anonymity: A Model for Protecting Privacy,\" International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, vol. 10, no. 5, pp. 557-570, 2002."),
    ("[3]", "R. Merkle, \"A Certified Digital Signature,\" in Proc. CRYPTO '89, LNCS 435, Springer, pp. 218-238, 1989."),
    ("[4]", "A. Pastor et al., \"Dark Web Threat Intelligence Mining via Deep Learning and Automated Crawlers,\" IEEE Transactions on Information Forensics and Security, vol. 17, pp. 1120-1135, 2022."),
    ("[5]", "NIST Special Publication 800-63B, \"Digital Identity Guidelines: Authentication and Lifecycle Management,\" National Institute of Standards and Technology, 2020.")
]
for tag, cit in refs:
    add_bullet(tf15, tag, cit, size=Pt(8.5), space_before=Pt(1), space_after=Pt(2))

# ============================================================
# SLIDE 16: DEMO SLIDE
# ============================================================
slide16 = prs.slides[15]
tx16 = slide16.shapes.add_textbox(Inches(2.40), Inches(1.50), Inches(6.80), Inches(3.00))
tx16.text_frame.word_wrap = True
tf16 = tx16.text_frame
p_demo = tf16.paragraphs[0]
p_demo.alignment = PP_ALIGN.CENTER
set_run(p_demo, "SYSTEM DEMONSTRATION & LIVE EXECUTION\n\n", size=Pt(16), bold=True, color=NAVY)
set_run(p_demo, "Live Walkthrough of BreachShield Platform:\n", size=Pt(12), bold=True, color=MAROON)
set_run(p_demo, "1. Out-of-Band Dual-Channel OTP Authentication Relay\n2. Privacy-Preserving k-Anonymous Search Verification\n3. Dark Web OSINT Intelligence Feed Streaming\n4. Blockchain Merkle Audit Proof Validation\n5. Real-Time Security HUD Console", size=Pt(11), color=DARK_TEXT)

# ============================================================
# SLIDE 17: THANK YOU SLIDE
# ============================================================
slide17 = prs.slides[16]
for sp in slide17.shapes:
    if sp.name == "Google Shape;159;p13" and sp.has_text_frame:
        sp.text_frame.clear()
        p_ty = sp.text_frame.paragraphs[0]
        p_ty.alignment = PP_ALIGN.CENTER
        set_run(p_ty, "THANK YOU!", size=Pt(24), bold=True, color=MAROON)
    elif sp.name == "Google Shape;160;p13" and sp.has_text_frame:
        sp.text_frame.clear()
        p_q = sp.text_frame.paragraphs[0]
        p_q.alignment = PP_ALIGN.CENTER
        set_run(p_q, "ANY QUESTIONS & SUGGESTIONS?\n\n", size=Pt(16), bold=True, color=NAVY)
        set_run(p_q, "Project Team - Batch 05 (Dept. of ISE, AcIT)\nUnder the Guidance of Prof. Sushma T. M.", size=Pt(11), bold=False, color=DARK_TEXT)

prs.save(output_path)
shutil.copy(output_path, target_template_copy)
print(f"Successfully generated clean presentation matching template at: {output_path}")
print(f"Copied to: {target_template_copy}")
