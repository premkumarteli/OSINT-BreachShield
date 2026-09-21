import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

template_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\conference_template_std.docx'
output_docx1 = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'
output_docx2 = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\newp\OSINT-BreachShield_Paper_Draft.docx'
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\figures'
diagrams_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'

EXACT_TITLE = "BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection"

EXACT_REFERENCES = [
    "[1] P. Grassi, M. Garcia, and J. Fenton, \"Digital Identity Guidelines: Authentication and Lifecycle Management,\" NIST Special Publication 800-63B, National Institute of Standards and Technology, Gaithersburg, MD, 2020.",
    "[2] OWASP Foundation, \"Authentication Cheat Sheet,\" OWASP Cheat Sheet Series, 2023. Available: https://cheatsheetseries.owasp.org/.",
    "[3] E. Rescorla, \"The Transport Layer Security (TLS) Protocol Version 1.3,\" RFC 8446, Internet Engineering Task Force (IETF), 2018.",
    "[4] M. Conti, A. Dehghantanha, K. Franke, and S. Watson, \"Internet of Things Security and Forensics: Challenges and Opportunities,\" Future Generation Computer Systems, vol. 78, pp. 544–546, 2018.",
    "[5] A. M. Antonopoulos, \"Mastering Bitcoin: Programming the Open Blockchain,\" 2nd ed., O'Reilly Media, Sebastopol, CA, 2017.",
    "[6] RFC 7519, \"JSON Web Token (JWT),\" Internet Engineering Task Force (IETF), 2015. Available: https://datatracker.ietf.org/doc/html/rfc7519.",
    "[7] L. Sweeney, \"k-anonymity: A model for protecting privacy,\" International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, vol. 10, no. 5, pp. 557–570, 2002.",
    "[8] P. Mell and T. Grance, \"The NIST Definition of Cloud Computing,\" NIST Special Publication 800-145, 2011.",
    "[9] Telethon Documentation, \"Telegram MTProto API Client Library for Python,\" Available: https://docs.telethon.dev/.",
    "[10] A. Aljofey, Q. Jiang, Q. Qu, M. Huang, and J.-P. Niyigena, \"An effective phishing detection model based on character level CNN from URL,\" Electronics, vol. 9, no. 9, p. 1514, 2020.",
    "[11] OWASP Foundation, \"Web Security Testing Guide (WSTG) v4.2,\" 2020. Available: https://owasp.org/www-project-web-security-testing-guide/.",
    "[12] B. Laurie and E. Kasper, \"Certificate Transparency,\" ACM Queue, vol. 12, no. 8, pp. 10–19, 2014.",
    "[13] T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 2016, pp. 785–794.",
    "[14] R. C. Merkle, \"A Digital Signature Based on a Conventional Encryption Function,\" in Advances in Cryptology – CRYPTO '87, Lecture Notes in Computer Science, vol. 293, Springer, Berlin, Heidelberg, 1988, pp. 369–378.",
    "[15] S. Nakamoto, \"Bitcoin: A Peer-to-Peer Electronic Cash System,\" 2008. Available: https://bitcoin.org/bitcoin.pdf.",
    "[16] OWASP Foundation, \"Testing JSON Web Tokens,\" OWASP Web Security Testing Guide (WSTG), 2024. Available: https://owasp.org/www-project-web-security-testing-guide/.",
    "[17] A. Vaswani et al., \"Attention Is All You Need,\" in Advances in Neural Information Processing Systems (NeurIPS 2017), vol. 30, 2017.",
    "[18] Ethereum Foundation, \"Solidity Documentation and Smart Contract Guidelines,\" Available: https://docs.soliditylang.org/."
]

def build_docx(target_path):
    doc = docx.Document(template_path)

    # Paragraph 0: Exact Title
    p_title = doc.paragraphs[0]
    p_title.text = EXACT_TITLE
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p_title.runs:
        run.font.name = 'Times New Roman'
        run.font.size = Pt(24)
        run.font.bold = True

    # Paragraph 1: Footnote
    p_foot = doc.paragraphs[1]
    p_foot.text = "*This paper documents the design, implementation, and empirical evaluation of Project Phase II (BIS786), Department of Information Science & Engineering, Acharya Institute of Technology, affiliated with Visvesvaraya Technological University (VTU), Belagavi, Karnataka, India."
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p_foot.runs:
        run.font.name = 'Times New Roman'
        run.font.size = Pt(8.5)
        run.font.italic = True

    doc.paragraphs[2].text = ""
    doc.paragraphs[3].text = ""

    # Authors
    doc.paragraphs[4].text = "Arvind D. H. (1AY24IS400)\nDept. of Information Science & Eng.\nAcharya Institute of Technology\nBengaluru, India\narvinddh.24.beis@acharya.ac.in"
    doc.paragraphs[4].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.paragraphs[5].text = "Girishkumar N. M. (1AY24IS404)\nDept. of Information Science & Eng.\nAcharya Institute of Technology\nBengaluru, India\ngirishkumarnm.24.beis@acharya.ac.in"
    doc.paragraphs[5].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.paragraphs[6].text = "Manoj (1AY24IS406)\nDept. of Information Science & Eng.\nAcharya Institute of Technology\nBengaluru, India\nmanoj.24.beis@acharya.ac.in"
    doc.paragraphs[6].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.paragraphs[7].text = "Premkumar Teli (1AY24IS407)\nAcharya Institute of Technology\npremkumarteli.24.beis@acharya.ac.in\n\nProf. Sushma T. M. (Project Guide)\nAssistant Professor, Dept. of ISE\nsushmatm@acharya.ac.in"
    doc.paragraphs[7].alignment = WD_ALIGN_PARAGRAPH.CENTER

    for p in [doc.paragraphs[4], doc.paragraphs[5], doc.paragraphs[6], doc.paragraphs[7]]:
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9)

    doc.paragraphs[8].text = ""
    doc.paragraphs[9].text = ""

    # Remove dummy table
    if len(doc.tables) > 0:
        t = doc.tables[0]
        t._element.getparent().remove(t._element)

    # Clean body paragraphs
    for i in range(10, 89):
        el = doc.paragraphs[10]._element
        el.getparent().remove(el)

    p_anchor = doc.paragraphs[10]
    p_anchor.text = ""

    def add_p(text, style='Body Text', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=3, line_spacing=1.0):
        p = p_anchor.insert_paragraph_before(text, style=style)
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
        return p

    def add_heading1(title):
        p = p_anchor.insert_paragraph_before(title, style='Heading 1')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            r.font.bold = True
        return p

    def add_heading2(title):
        p = p_anchor.insert_paragraph_before(title, style='Heading 2')
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            r.font.bold = True
            r.font.italic = True
        return p

    def add_image(img_path, caption, width_in=3.3):
        if os.path.exists(img_path):
            p_img = p_anchor.insert_paragraph_before()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(2)
            r_img = p_img.add_run()
            r_img.add_picture(img_path, width=Inches(width_in))
            
            p_cap = p_anchor.insert_paragraph_before()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(1)
            p_cap.paragraph_format.space_after = Pt(4)
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(8)
            r_cap.font.italic = True

    def add_table(headers, rows, caption):
        p_cap = p_anchor.insert_paragraph_before()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(5)
        p_cap.paragraph_format.space_after = Pt(2)
        r_cap = p_cap.add_run(caption)
        r_cap.font.name = 'Times New Roman'
        r_cap.font.size = Pt(8.5)
        r_cap.font.bold = True
        
        table = doc.add_table(rows=len(rows)+1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            for p in hdr_cells[i].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                for r in p.runs:
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(8)
                    r.font.bold = True
                    
        for r_idx, row in enumerate(rows):
            row_cells = table.rows[r_idx+1].cells
            for c_idx, val in enumerate(row):
                row_cells[c_idx].text = str(val)
                for p in row_cells[c_idx].paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after = Pt(1)
                    for r in p.runs:
                        r.font.name = 'Times New Roman'
                        r.font.size = Pt(8)
                        
        p_anchor._element.addprevious(table._element)

    # 1. ABSTRACT (Directly from Progress Reports & Presentation Slide 3)
    p_abs = p_anchor.insert_paragraph_before(style='Abstract')
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.space_before = Pt(4)
    p_abs.paragraph_format.space_after = Pt(3)
    r1 = p_abs.add_run("Abstract—")
    r1.font.name = 'Times New Roman'; r1.font.size = Pt(9); r1.font.bold = True
    r2 = p_abs.add_run("BreachShield is an AI-powered, privacy-preserving OSINT breach intelligence and real-time exposure monitoring platform. It enables individuals and enterprises to verify whether sensitive credentials (email addresses, phone numbers, and identity identifiers) have been compromised in known data leaks and subterranean dark web disclosures without disclosing the plaintext target identifier to third parties or intermediate servers. The system is engineered as a modular four-tier monorepo comprising a React 19 single-page HUD terminal, a Node.js Express 5 API Gateway, a high-concurrency Python FastAPI OSINT scraper utilizing Telethon MTProto, and a native Android Kotlin SMS Gateway relay. To resolve the privacy paradox in breach searching, BreachShield implements a client-side k-anonymity protocol using the Web Crypto API, transmitting only a 5-hexadecimal-character (20-bit) prefix of the SHA-256 target hash, while suffix evaluation is executed locally in the client browser. Unauthorized bulk harvesting is prevented by an out-of-band dual-channel verification engine supporting Nodemailer SMTP email and Android WebSocket carrier SMS OTPs, fortified by bcrypt hashing, a 30-second cooldown, a 5-attempt brute-force lockout, and cryptographically signed 1-hour JWT tokens. For breach severity assessment, the platform curates 1,034 verified incident records and benchmarks four machine learning models, demonstrating that XGBoost decisively achieves an 89.2% test accuracy and an 83.2% macro F1-score (+42.0% over the naive baseline), outperforming deep neural networks that suffer from sequence bias and feature dilution. To guarantee forensic non-repudiation, audit events are serialized into canonical JSON, batched into binary Merkle trees with dead-letter queue recovery, and anchored on-chain into a Solidity smart contract (AnchorRegistry.sol) on an EVM-compatible node. End-to-end evaluation across 94 automated backend tests confirms sub-200 ms query latency, robust fault tolerance, and tamper-evident audit integrity.")
    r2.font.name = 'Times New Roman'; r2.font.size = Pt(9)

    # 2. KEYWORDS
    p_kw = p_anchor.insert_paragraph_before(style='Keywords')
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.space_before = Pt(2)
    p_kw.paragraph_format.space_after = Pt(6)
    rk1 = p_kw.add_run("Keywords—")
    rk1.font.name = 'Times New Roman'; rk1.font.size = Pt(9); rk1.font.bold = True
    rk2 = p_kw.add_run("Open-Source Intelligence (OSINT), k-Anonymity, Credential Exposure, Breach Intelligence, XGBoost, Merkle Tree, Blockchain Audit Trail, Smart Contracts, Dark Web Protection.")
    rk2.font.name = 'Times New Roman'; rk2.font.size = Pt(9)

    # SECTION I: INTRODUCTION (Alings with Report 1 & Logbook)
    add_heading1("I. INTRODUCTION")
    add_p("The rapid escalation of cybercrime and data breaches has rendered identity credentials the most actively targeted digital assets in corporate and consumer ecosystems [1]. Underground criminal marketplaces and encrypted messaging channels routinely aggregate billions of compromised records comprising plaintext passwords, cryptographic hashes, personally identifiable information (PII), and authentication tokens [2]. These leaked corpuses are monetized through automated credential stuffing, account takeover (ATO), and targeted spear-phishing offensives [3].")
    add_p("Open-Source Intelligence (OSINT) repositories and breach lookups have become primary tools for exposure assessment. However, current platforms suffer from three severe limitations:")
    add_p("1) Privacy Violation (The Privacy Paradox): Users must transmit their raw email address or telephone number to external servers in plaintext, converting breach detection portals into centralized tracking honeypots.")
    add_p("2) Automated Reconnaissance: Public search endpoints lack strict identity gating, enabling malicious bots to automate dictionary attacks against breach catalogs to discover valid target accounts.")
    add_p("3) Vulnerability of Centralized Logs: Security audit logs stored in relational databases remain vulnerable to retroactive tampering, modification, or insider deletion during post-incident investigations [4], [5].")
    add_p("To resolve these challenges, this paper presents BreachShield: an AI-powered, privacy-preserving OSINT breach detection and dark web protection platform engineered as an academic major project (BIS786) in the Department of Information Science and Engineering, Acharya Institute of Technology.")

    add_image(os.path.join(diagrams_dir, "dfd_level1.png"), "Fig. 1. Data Flow Diagram (Level 1) of BreachShield System Architecture.")

    # SECTION II: ARCHITECTURE & EVOLUTION (Aligns with Report 1 & Logbook Evolution)
    add_heading1("II. SYSTEM ARCHITECTURE & EVOLUTION")
    add_p("BreachShield is designed as a four-tier monorepo architecture with clean interface boundaries:")
    add_p("1) Frontend Web Dashboard: A responsive React 19 single-page application featuring a Cyberpunk HUD terminal, typewriter output streaming, real-time threat exposure gauges, and client-side Web Crypto API hashing [6].")
    add_p("2) Backend API Gateway: An Express 5 / Node.js orchestration engine managing dual-channel OTP authentication, JWT session verification, search route gating (403 Forbidden on unauthenticated access), pluggable source querying, and audit logging [1], [6].")
    add_p("3) OSINT Scraper Service: A high-concurrency Python FastAPI microservice utilizing the Telethon MTProto client with asyncio.Lock mutex serialization (8.0s timeout) to monitor real-time Telegram channels without triggering rate limits [9].")
    add_p("4) Android SMS Gateway Relay: A native Android Kotlin companion application maintaining a persistent WebSocket connection (/ws/gateway) with exponential backoff and carrier-safe SMS dispatch conforming to Indian telecom DLT regulations.")
    add_p("5) Blockchain Audit Trail: A Solidity smart contract (AnchorRegistry.sol) deployed on an EVM-compatible node, receiving batch-anchored Merkle roots computed over canonical JSON audit logs [5], [18].")

    add_image(os.path.join(diagrams_dir, "class_diagram.png"), "Fig. 2. Class Diagram showing core components, interfaces, and service relationships.")

    # SECTION III: PRIVACY PROTOCOL & OSINT HARVESTING (Aligns with Report 2)
    add_heading1("III. PRIVACY-PRESERVING PROTOCOL & OSINT AGGREGATION")
    add_p("A. Client-Side k-Anonymity Search Protocol: Under the k-anonymity protocol [7], the target identifier T is normalized and hashed locally in the browser: H = SHA-256(normalize(T)). The client extracts a 5-hex-character prefix P = H[0:5] (20 bits) and sends only P to the server. The server queries indexed breaches sharing prefix P: B(P) = {(S_i, Metadata_i)}. The client receives B(P) and checks locally whether the suffix S = H[5:64] matches S_i. The user's plaintext target never leaves the client browser, satisfying information-theoretic privacy ($k \\gg 950$ candidate identities per prefix).")
    add_p("B. Out-of-Band Dual-Channel Authentication: To eliminate automated harvesting, search access requires a 6-digit OTP. Tokens are hashed with bcrypt (salt rounds r=10) and dispatched via Nodemailer Gmail SMTP or the Android SMS Gateway. Gating enforces a 30s resend cooldown, 300s expiration, and 5-attempt brute-force lockout, issuing a signed 1-hour JWT [6], [16].")
    add_p("C. Multi-Source OSINT Concurrency: Pluggable BreachSource adapters aggregate intelligence across the local database catalog, Have I Been Pwned, and live Telegram channels concurrently using JavaScript Promise.allSettled. Transient timeouts in a single source do not disrupt overall availability.")

    add_image(os.path.join(figures_dir, "fig_merkle_anchoring.png"), "Fig. 3. Cryptographic Merkle tree batching and EVM smart contract anchoring workflow.")

    # SECTION IV: MACHINE LEARNING SEVERITY TRIAGE (Aligns with Report 3 & RESULTS.md)
    add_heading1("IV. MACHINE LEARNING THREAT SEVERITY TRIAGE")
    add_p("A. Dataset Curation: The platform curated 1,034 verified enterprise breach records from Have I Been Pwned and threat feeds. Incidents are categorized into four standardized severity tiers: LOW, MEDIUM, HIGH, and CRITICAL. The dataset was partitioned using stratified 70/15/15 train/val/test splits as summarized in Table I [13].")

    add_table(
        ["Dataset Split", "Total Records", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
        [
            ["Train Set (70%)", "723", "49", "341", "291", "42"],
            ["Validation (15%)", "154", "10", "73", "62", "9"],
            ["Test Set (15%)", "157", "11", "74", "63", "9"]
        ],
        "TABLE I. DATASET PARTITION AND SEVERITY TIER DISTRIBUTION"
    )

    add_p("Features comprise a 163-dimensional multi-hot vector of DataClasses, log-scaled record count ln(PwnCount + 1), and a boolean verification indicator, yielding an input dimension of 165.")
    add_p("B. Comparative Benchmark: Four model architectures were benchmarked against the naive baseline (predicting MEDIUM, 47.1%): (1) XGBoost (max_depth=6, lr=0.1, sample weights) [13]; (2) 1D-CNN (kernels k=3,4,5, 64 filters) [10]; (3) BiLSTM-RNN; and (4) Transformer Encoder (2 layers, 4 heads) [17]. Test set results are reported in Table II and Table III.")

    add_table(
        ["Model Architecture", "Accuracy", "Macro Prec.", "Macro Rec.", "Macro F1", "Weighted F1"],
        [
            ["Naive Baseline (Predict MEDIUM)", "47.1%", "11.8%", "25.0%", "16.0%", "30.2%"],
            ["BiLSTM-RNN (Unpacked)", "41.4%", "34.3%", "37.9%", "32.1%", "44.0%"],
            ["BiLSTM-RNN (Packed, Grad Clip)", "44.6%", "35.2%", "37.8%", "34.0%", "46.8%"],
            ["Transformer Encoder (2L/4H)", "48.4%", "47.6%", "47.9%", "42.9%", "50.8%"],
            ["1D-CNN (k=3,4,5 Filters)", "66.2%", "59.7%", "56.6%", "57.2%", "65.7%"],
            ["XGBoost (max_depth=6, lr=0.1)", "89.2%", "81.9%", "85.1%", "83.2%", "89.4%"]
        ],
        "TABLE II. COMPARATIVE BENCHMARK ON TEST SET (N=157)"
    )

    add_image(os.path.join(figures_dir, "fig_model_comparison.png"), "Fig. 4. Comparative benchmark across model architectures on the test set.")

    add_table(
        ["Model", "Severity Tier", "Precision", "Recall", "F1-Score", "Support"],
        [
            ["XGBoost", "LOW", "64.3%", "81.8%", "72.0%", "11"],
            ["XGBoost", "MEDIUM", "90.7%", "91.9%", "91.3%", "74"],
            ["XGBoost", "HIGH", "94.9%", "88.9%", "91.8%", "63"],
            ["XGBoost", "CRITICAL", "77.8%", "77.8%", "77.8%", "9"],
            ["1D-CNN", "LOW", "45.5%", "45.5%", "45.5%", "11"],
            ["1D-CNN", "MEDIUM", "64.2%", "82.4%", "72.2%", "74"],
            ["1D-CNN", "HIGH", "79.1%", "54.0%", "64.2%", "63"],
            ["1D-CNN", "CRITICAL", "50.0%", "44.4%", "47.1%", "9"],
            ["BiLSTM", "LOW", "13.5%", "45.5%", "20.8%", "11"],
            ["BiLSTM", "MEDIUM", "53.6%", "40.5%", "46.2%", "74"],
            ["BiLSTM", "HIGH", "60.7%", "54.0%", "57.1%", "63"],
            ["BiLSTM", "CRITICAL", "12.5%", "11.1%", "11.8%", "9"]
        ],
        "TABLE III. PER-CLASS PERFORMANCE METRICS ACROSS SEVERITY TIERS"
    )

    add_p("C. Overfitting Analysis: XGBoost decisively outperformed deep architectures (+42.0% over naive baseline). In contrast, BiLSTM (44.6%) and Transformer (48.4%) struggled severely. Breach data classes represent an unordered, sparse categorical vocabulary. Imposing sequential recurrence on unordered sets introduces artificial inductive bias, while multi-head self-attention dilutes focus on small tabular samples. XGBoost constructs axis-aligned orthogonal decision boundaries, isolating critical sparse features with superior sample efficiency [13].")

    # SECTION V: BLOCKCHAIN AUDITING & TEST VALIDATION (Aligns with Report 3)
    add_heading1("V. BLOCKCHAIN AUDITING & EXPERIMENTAL VALIDATION")
    add_p("A. Merkle Batching & Smart Contract: Security audit events are normalized into canonical JSON, hashed into SHA-256 leaves, and aggregated into a binary Merkle tree [14]. Every 60 seconds or upon accumulating 16 records, the gateway anchors the root R to AnchorRegistry.sol on an EVM node [18]. A dead-letter queue with exponential backoff (max 5 retries) and startup-quarantine logic handles RPC disconnections without data loss.")
    add_p("B. System Performance & Test Suite: End-to-end client-side k-anonymity queries completed in an average round-trip latency of 168 ms over local loopback, with browser Web Crypto hashing taking under 1.2 ms. The implementation passed 100% of 94 automated backend tests and 17 Merkle batching tests [11]. Crash-restart simulations verified seamless in-memory batch recovery.")

    # SECTION VI: CONCLUSION & FUTURE WORK
    add_heading1("VI. CONCLUSION & FUTURE WORK")
    add_p("BreachShield successfully establishes a privacy-preserving OSINT breach detection and dark web exposure protection framework. By integrating client-side k-anonymity with out-of-band dual-channel authentication, the platform resolves the breach search privacy paradox. Empirical evaluations confirm that XGBoost achieves 89.2% accuracy in automated severity triage, outperforming deep neural networks on tabular security metadata. Furthermore, Merkle-chain smart contract anchoring delivers an immutable audit trail for forensic non-repudiation.")
    add_p("Future research will focus on deploying blockchain anchoring to the Polygon Amoy testnet, resolving mobile number canonicalization discrepancies, and exploring zero-knowledge proofs (zk-SNARKs) for private exposure verification.")

    # REFERENCES: EXACT 18 REFERENCES FROM REPORTS 1, 2, AND 3
    add_heading1("REFERENCES")
    for ref in EXACT_REFERENCES:
        p_ref = p_anchor.insert_paragraph_before(ref, style='Normal')
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.space_before = Pt(1)
        p_ref.paragraph_format.space_after = Pt(2)
        p_ref.paragraph_format.line_spacing = 1.0
        for r in p_ref.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8)

    p_anchor._element.getparent().remove(p_anchor._element)
    doc.save(target_path)
    print(f"Successfully generated: {target_path}")

build_docx(output_docx1)
build_docx(output_docx2)
print("Both documents updated successfully!")
