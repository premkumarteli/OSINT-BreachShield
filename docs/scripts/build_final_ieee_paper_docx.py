import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

output_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\final paper\BreachShield_Final_IEEE_Paper.docx'
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\final paper\figures'

doc = docx.Document()

# Base IEEE A4 geometry
sec0 = doc.sections[0]
sec0.page_width = Inches(8.27)
sec0.page_height = Inches(11.69)
sec0.top_margin = Inches(0.70)
sec0.bottom_margin = Inches(0.75)
sec0.left_margin = Inches(0.55)
sec0.right_margin = Inches(0.55)

def set_run(p, text, size=Pt(10), bold=False, italic=False, font_name='Times New Roman', color=None):
    r = p.add_run(text)
    r.font.name = font_name
    r.font.size = size
    r.font.bold = bold
    r.font.italic = italic
    if color:
        r.font.color.rgb = color
    return r

# Title (20 pt Bold, Centered)
p_title = doc.add_paragraph()
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_before = Pt(0)
p_title.paragraph_format.space_after = Pt(4)
p_title.paragraph_format.line_spacing = 1.05
set_run(p_title, "BreachShield: A Privacy-Preserving OSINT Breach Intelligence Platform with k-Anonymous Search and Blockchain-Anchored Audit Logging", size=Pt(19), bold=True)

# Footnote banner
p_foot = doc.add_paragraph()
p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_foot.paragraph_format.space_before = Pt(0)
p_foot.paragraph_format.space_after = Pt(8)
set_run(p_foot, "*This paper documents the design, engineering implementation, and empirical evaluation of Major Project Phase II (Course Code: BIS786) by Batch 05, Department of Information Science and Engineering, Acharya Institute of Technology, affiliated with Visvesvaraya Technological University (VTU), Belagavi, Karnataka, India.", size=Pt(8.0), italic=True)

# Authors Table (borderless, 2 rows x 3 columns)
table_auth = doc.add_table(rows=2, cols=3)
table_auth.alignment = WD_TABLE_ALIGNMENT.CENTER

authors_r1 = [
    ("Arvind D. H.", "USN: 1AY24IS400", "arvinddh.24.beis@acharya.ac.in"),
    ("Girishkumar N. M.", "USN: 1AY24IS404", "girishkumarnm.24.beis@acharya.ac.in"),
    ("Manoj", "USN: 1AY24IS406", "manoj.24.beis@acharya.ac.in")
]

for col_idx, (name, usn, email) in enumerate(authors_r1):
    cell = table_auth.cell(0, col_idx)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.0
    set_run(p, f"{name}\n", size=Pt(9.5), bold=True)
    set_run(p, f"{usn}\nDept. of Information Science & Eng.\nAcharya Institute of Technology\nBengaluru, India\n", size=Pt(8.0), italic=True)
    set_run(p, email, size=Pt(8.0))

authors_r2 = [
    (0, "Premkumar Teli", "USN: 1AY24IS407", "premkumarteli.24.beis@acharya.ac.in", "Student Researcher"),
    (2, "Prof. Sushma T. M.", "Assistant Professor", "sushmatm@acharya.ac.in", "Project Guide & Supervisor")
]

for col_idx, name, info, email, role in authors_r2:
    cell = table_auth.cell(1, col_idx)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.0
    set_run(p, f"{name}\n", size=Pt(9.5), bold=True)
    set_run(p, f"{role} ({info})\nDept. of Information Science & Eng.\nAcharya Institute of Technology\nBengaluru, India\n", size=Pt(8.0), italic=True)
    set_run(p, email, size=Pt(8.0))

table_auth.cell(1, 1).paragraphs[0].text = ""

def remove_cell_borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    for b in tcPr.xpath('./w:tcBorders'):
        tcPr.remove(b)
    borders_el = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
    tcPr.append(borders_el)

for row in table_auth.rows:
    for cell in row.cells:
        remove_cell_borders(cell)

# Transition to 2-column layout for body
sec1 = doc.add_section(WD_SECTION.CONTINUOUS)
sec1.page_width = Inches(8.27)
sec1.page_height = Inches(11.69)
sec1.top_margin = Inches(0.70)
sec1.bottom_margin = Inches(0.75)
sec1.left_margin = Inches(0.55)
sec1.right_margin = Inches(0.55)

sectPr = sec1._sectPr
cols = sectPr.xpath('./w:cols')
if cols:
    sectPr.remove(cols[0])
cols_xml = parse_xml(f'<w:cols {nsdecls("w")} w:num="2" w:space="360"/>')
sectPr.append(cols_xml)

def add_abstract(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.02
    set_run(p, "Abstract—", size=Pt(9.0), bold=True, italic=True)
    set_run(p, text, size=Pt(9.0), bold=True)

def add_keywords(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.02
    set_run(p, "Keywords—", size=Pt(9.0), bold=True, italic=True)
    set_run(p, text, size=Pt(9.0))

def add_h1(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    set_run(p, title.upper(), size=Pt(10.0), bold=True)

def add_h2(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    set_run(p, title, size=Pt(9.5), bold=True, italic=True)

def add_body(text, indent=True):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    if indent:
        p.paragraph_format.first_line_indent = Inches(0.18)
    set_run(p, text, size=Pt(9.5))

def add_bullet(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.line_spacing = 1.05
    set_run(p, "•  ", size=Pt(9.0), bold=True)
    set_run(p, text, size=Pt(9.5))

def add_figure(img_filename, caption):
    img_path = os.path.join(figures_dir, img_filename)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(3.35))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(6)
        p_cap.paragraph_format.line_spacing = 1.0
        set_run(p_cap, caption, size=Pt(8.0))

def add_styled_table(title, headers, rows):
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(6)
    p_cap.paragraph_format.space_after = Pt(2)
    set_run(p_cap, title.upper(), size=Pt(8.0), bold=True)
    
    t = doc.add_table(rows=len(rows)+1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header
    for j, h in enumerate(headers):
        cell = t.cell(0, j)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        set_run(p, h, size=Pt(8.0), bold=True)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F0F0F0"/>')
        cell._tc.get_or_add_tcPr().append(shd)
        
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = t.cell(i+1, j)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 0 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            set_run(p, str(val), size=Pt(8.0))
            
    # Set standard IEEE borders (top, header bottom, table bottom)
    tblPr = t._tbl.tblPr
    for b in tblPr.xpath('./w:tblBorders'):
        tblPr.remove(b)
    borders_el = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/><w:insideV w:val="none"/><w:left w:val="none"/><w:right w:val="none"/></w:tblBorders>')
    tblPr.append(borders_el)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)

def add_callout_box(title, text_lines):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.cell(0, 0)
    cell.width = Inches(3.4)
    p0 = cell.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p0.paragraph_format.space_before = Pt(2)
    p0.paragraph_format.space_after = Pt(2)
    set_run(p0, f"{title}\n", size=Pt(8.5), bold=True)
    for line in text_lines:
        p = cell.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1)
        set_run(p, line, size=Pt(8.0), font_name='Consolas')
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="FAFAFA"/>')
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:color="888888"/><w:bottom w:val="single" w:sz="4" w:color="888888"/><w:left w:val="single" w:sz="4" w:color="888888"/><w:right w:val="single" w:sz="4" w:color="888888"/></w:tcBorders>')
    tcPr.append(shd)
    tcPr.append(borders)

print("Writing document content...")

# Abstract and Keywords
add_abstract("Breach-checking services face a structural privacy tension: to determine whether a personal identifier has been compromised, users are conventionally required to submit that identifier in plaintext to a remote server, transforming protective tooling into a vector for query surveillance. This paper presents BreachShield, an open-source intelligence (OSINT) breach detection and dark web intelligence platform that resolves this tension through a client-side k-anonymity search protocol based on 20-bit SHA-256 prefix disclosure. The platform integrates a dual-channel out-of-band one-time password (OTP) identity gate, a pluggable multi-source OSINT aggregation registry, a dynamically computed regex-based exposure risk-scoring engine, a gradient-boosted breach severity classifier (XGBoost, achieving 89.2% accuracy on 1,034 curated breach records), and a Merkle-tree-batched audit log anchored to a local Ethereum Virtual Machine (EVM) smart contract. Automated verification confirms full passes across 101 backend tests and 50 frontend component tests, while a live pretrained URL-transformer classifier operates concurrently on the production search path. We provide an exact architectural description based on real class structures and call flows, deliver a comparative benchmark of tree-based against neural architectures for breach triage, and report an unvarnished audit of current engineering limitations and scheduled remediations.")

add_keywords("OSINT, breach intelligence, dark web monitoring, k-anonymity, XGBoost, blockchain audit log, tamper-evident logging, phishing detection.")

# Section I
add_h1("I. Introduction")
add_body("The rapid proliferation of digital services and identity-linked platforms has coincided with an unprecedented surge in corporate data disclosures, credential leaks, and illicit commercial trade across dark web forums and underground communication channels [1]. According to IBM's 2024 Cost of a Data Breach Report, the global average financial impact of an organizational breach reached USD 4.88 million, reflecting a 10% escalation over the previous year, with stolen or compromised credentials remaining the most prevalent attack vector, accounting for 16% of all studied security breaches [17].")
add_body("In response to this expanding threat landscape, consumer and enterprise breach-notification utilities have emerged as primary defensive mechanisms. However, contemporary compromise-checking infrastructure remains predominantly reactive and structurally flawed from a privacy perspective. To query whether an email address, telephone number, or national identity token appears within known exposure catalogs, end users are typically forced to transmit the raw target identifier in plaintext across the network to a centralised third-party repository. This operational model transforms what is intended as a security audit into an acute privacy liability: the querying service gains visibility into the sensitive identifiers an investigator or individual is actively monitoring, creating single points of forensic surveillance and correlation risk.")
add_body("To address these vulnerabilities, this paper introduces BreachShield, an end-to-end, privacy-preserving OSINT breach intelligence and threat detection platform developed across Project Phase 1 (conceptual formulation, system requirements, and baseline architectural design) and Project Phase 2 (production-level implementation, multi-tier orchestration, and rigorous empirical validation) at the Department of Information Science and Engineering, Acharya Institute of Technology. Whereas the initial Phase 1 conceptual scope envisioned an expansive suite encompassing client browser filtering, general vulnerability scanning, and public threat feeds, Phase 2 engineering strategically narrowed focus to a defensible, mathematically grounded core: eliminating server-side query surveillance via client-side k-anonymity prefix partitioning, enforcing strict identity accountability through an out-of-band carrier SMS/email gate, providing transparent multi-source OSINT correlation, and establishing a tamper-evident audit trail anchored cryptographically to an EVM smart contract.")
add_body("The core scientific and engineering contributions of this work are fourfold:")
add_bullet("Privacy-Preserving Multi-Tier Architecture: A cohesive four-tier architecture combining client-side k-anonymity range search, out-of-band dual-channel OTP verification, an asynchronous OSINT adapter registry, and a Merkle-batched smart contract audit log, documented according to concrete class structures and operational sequence flows.")
add_bullet("Dynamic Regex-Driven Risk Scoring: An algorithmic exposure scoring engine that analyzes aggregated multi-source breach corpora using weighted regular expression pattern recognition, cross-record structural correlation, and integrated URL phishing probabilities, eliminating reliance on static lookup heuristics.")
add_bullet("Empirical Severity Classification Benchmark: A rigorous comparative benchmark evaluating gradient-boosted decision trees (XGBoost) against deep recurrent, convolutional, and self-attention neural architectures across a curated corpus of 1,034 breach records, demonstrating an 89.2% test accuracy and establishing the superiority of tree-based ensembles on tabular breach metadata.")
add_bullet("Transparent Empirical Verification and Defect Audit: A comprehensive evaluation supported by 101 passing backend tests and 50 passing frontend tests, coupled with a completely transparent, non-fabricated disclosure of current implementation constraints (including an EVM deployer credential issue, unintegrated secondary feeds, and class-imbalance boundaries) and a scheduled remediation roadmap.")

# Section II
add_h1("II. Related Work")
add_h2("A. Phishing and Malicious URL Classification")
add_body("Deep learning architectures applied to lexical and structural URL attributes have received extensive academic focus. Aljofey et al. [1] demonstrated an end-to-end character-level Convolutional Neural Network (CNN) operating on raw URL sequences without requiring manual feature engineering, achieving high detection rates on large-scale web corpora. Sahingoz et al. [2] conducted a comprehensive comparative benchmark of five distinct neural network architectures (ANN, CNN, RNN, BiRNN, and attention-based networks) across approximately five million labeled URLs, identifying CNN models as the superior single-architecture paradigm for localized textual pattern extraction (achieving 98.74% accuracy). These findings directly informed BreachShield's dual-model strategy: deploying a pretrained transformer-based URL classifier (UrlBERT) on the active search path for real-time lexical inference, while validating a 1D-CNN as the strongest neural baseline in our offline text classification benchmark (Section VII).")

add_h2("B. Mitigating Class Imbalance in Cybersecurity")
add_body("Cybersecurity threat catalogs inherently suffer from severe class imbalance, where catastrophic or critical security incidents represent a small fraction of observed events relative to minor infractions. Alsubaei et al. [3] demonstrated that incorporating Synthetic Minority Over-sampling Technique (SMOTE) within a hybrid deep-learning framework improved classification accuracy from 83% to 98% across sparse threat distributions. This empirical precedent is directly relevant to BreachShield's severity triage, where the highest-severity classification tier represents an inherently scarce subset of the training corpus (Section X).")

add_h2("C. Explainable and Few-Shot Threat Intelligence")
add_body("The operational adoption of automated threat triage depends critically on model interpretability. Pavani et al. [4] applied SHapley Additive exPlanations (SHAP) and Local Interpretable Model-agnostic Explanations (LIME) to malicious URL classifiers, establishing that transparent feature attribution significantly improves security analysts' triage efficiency compared to uncalibrated confidence scores. Similarly, Tawfik et al. [5] addressed emerging threat campaigns through few-shot learning with BERT-derived embeddings, showing that compact, high-dimensional textual representations can deliver robust generalizability even when labeled incident data is constrained.")

add_h2("D. OSINT and Underground Dark Web Monitoring")
add_body("Systematic extraction of intelligence from illicit digital forums involves distinct operational hurdles. Kühn et al. [6] performed an extensive empirical evaluation of manual and semi-automated dark web collection techniques, contrasting the high intelligence yield of closed chat channels with the severe API and rate-limiting barriers of decentralized platforms. Saleem et al. [15] surveyed the technical topology of hidden services, while Pastor-Galindo et al. [16] reviewed the broader OSINT tooling ecosystem, highlighting that modern threat intelligence platforms must decouple transport adapters from scoring engines to maintain continuous operation when external feeds experience disruption.")

add_h2("E. Cryptographic Integrity and Blockchain-Backed Logging")
add_body("Merkle's classic cryptographic hash-tree construction [11] and Crosby and Wallach's append-only history trees [12] provide the foundational basis for tamper-evident data structures that guarantee log consistency with logarithmic proof overhead. Recently, Arabnouri et al. [7] formulated a checkpoint-based blockchain audit architecture that accumulates and batches system access events over configurable intervals before committing state roots to a distributed ledger, substantially amortizing transaction costs. BreachShield implements an analogous hybrid size-and-time Merkle flush mechanism (Section VIII), bridging local cryptographic chaining with on-chain immutability.")

add_h2("F. Privacy-Preserving Compromise Inquiries")
add_body("Sweeney's formalization of k-anonymity [8] and its practical adaptations by El Emam and Dankar [13] define the fundamental mathematical framework for query obfuscation. In the domain of credential compromise checking, Li et al. [9] presented a formal cryptanalytic evaluation of prefix-bucket protocols alongside advanced Private Set Intersection (PSI) constructions. Their analysis demonstrated that while prefix disclosure provides robust privacy against passive network eavesdroppers, the operational integration of authentication gates introduces subtle identity-linkage trade-offs (Section IV).")

add_h2("G. Ensemble Tree Boosting on Tabular Metadata")
add_body("Chen and Guestrin's XGBoost [10] represents the foundational standard for tree-boosted supervised learning. While deep learning architectures dominate unstructured audio, visual, and sequential natural language processing, extensive empirical benchmarks by Grinsztajn et al. [14] across forty-five diverse datasets established that gradient-boosted decision trees consistently outperform deep neural networks on tabular datasets, owing to their invariance to uninformative features and superior handling of non-smooth decision boundaries.")

add_styled_table("TABLE I: Related Work Summary and Architectural Positioning",
    ["Area", "Relation to BreachShield"],
    [
        ["URL / Phishing DL [1], [2]", "Direct inspiration for search-path UrlBERT and 1D-CNN baseline benchmark."],
        ["Explainable Threat AI [4], [5]", "Mandates multi-factor probability breakdowns over monolithic opaque metrics."],
        ["Dark Web OSINT [6], [15], [16]", "Motivates decoupled adapter design and mutex-locked asynchronous Telegram scraping."],
        ["Cryptographic Audit [7], [11], [12]", "Informs hybrid count/time Merkle-batching anchored to Solidity smart contracts."],
        ["k-Anonymity Protocols [8], [9], [13]", "Establishes mathematical framework for 20-bit SHA-256 prefix range partitioning."],
        ["Tabular ML vs. DL [10], [14]", "Validates XGBoost superiority over RNN and Transformer models on breach metadata."]
    ]
)

add_styled_table("TABLE II: Design Comparison Between BreachShield and Related Works",
    ["Dimension", "Conventional Approach", "BreachShield Platform"],
    [
        ["Query Privacy", "Plaintext target transmitted to API server", "Client-side SHA-256 with 20-bit prefix range query (k-anonymity)"],
        ["Identity Verification", "Captcha or open unauthenticated access", "Carrier-compliant DLT SMS / SMTP OTP with signed 1-hour JWT session"],
        ["OSINT Ingestion", "Rigid, synchronous external API bindings", "Pluggable adapter registry with Promise.allSettled concurrency"],
        ["Severity Triage", "Uncalibrated heuristic rule tables", "XGBoost classifier (89.2% test accuracy) trained on 1,034 curated records"],
        ["Audit Logging", "Ephemeral database tables or flat files", "Canonical JSON hashing, Merkle-tree batching, and EVM smart-contract anchor"]
    ]
)

# Section III
add_h1("III. System Architecture")
add_h2("A. Design Goals and Non-Functional Requirements")
add_body("The design of BreachShield balances strict security guarantees against practical usability across four primary non-functional requirements:")
add_bullet("Query Confidentiality: Raw search targets (email addresses, phone numbers, identity credentials) must never be transmitted across the network in plaintext, nor revealed in full hash form to the gateway.")
add_bullet("Tamper-Evident Accountability: All system queries and security events must generate verifiable, immutable cryptographic proofs anchored to an independent consensus ledger.")
add_bullet("Graceful Fault Tolerance: Network timeouts, API rate limits, or connectivity failures in individual OSINT threat sources must not interrupt the primary search pipeline or crash the API gateway.")
add_bullet("Strict Multi-Tenant Access Control: Unauthorized bots and automated mass-harvesting crawlers must be blocked from exhaustively enumerating breach records.")

add_h2("B. Four-Tier System Topology")
add_body("BreachShield is structured as a modular, multi-tier monorepo architecture, illustrated in Fig. 1.")
add_figure("fig_architecture.png", "Fig. 1. Four-tier BreachShield system architecture: React frontend, Express API gateway, Python OSINT scraper, and Android SMS gateway.")
add_body("The primary operational tiers comprise:")
add_bullet("Frontend Web Dashboard (frontend/): Built on React 19, this tier provides a Cyberpunk-styled Heads-Up Display (HUD) terminal interface. It interfaces with the W3C Web Crypto API to execute cryptographic hashing locally before initiating any outbound network traffic.")
add_bullet("Backend API Gateway (backend/): An Express 5 service running on Node.js that orchestrates identity verification, manages bcrypt-hashed OTP states, issues signed JSON Web Tokens (JWTs), executes dynamic risk evaluation, and coordinates Merkle audit batching. Storage is backed by MySQL 8.0 with an integrated, automatic file-based JSON failover mechanism that maintains continuous local development if database connectivity drops.")
add_bullet("OSINT Scraper Engine (scraper/): A Python 3.11 service utilizing the FastAPI framework and the Telethon MTProto library to interact directly with Telegram channels and threat disclosure groups. To resolve database locking exceptions during concurrent requests, the client access layer is serialized using an asyncio.Lock synchronization primitive.")
add_bullet("Android SMS Gateway (android-gateway/): A native Android application written in Kotlin that establishes a persistent, bi-directional WebSocket connection (/ws/gateway) with the API gateway. The app receives pending OTP dispatch events and transmits carrier-compliant SMS messages formatted to satisfy Indian Telecom Distributed Ledger Technology (DLT) template standards.")

add_h2("C. Pluggable Breach-Source Registry")
add_body("The backend defines a unified abstraction, BreachSource, exposing a standardized asynchronous contract: search(T_norm, H_target) -> R_source, where T_norm is the normalized identifier and H_target is the full hash. Four concrete adapters implement this contract:")
add_bullet("PublicBreachSource: Queries the verified local database of known public breach records.")
add_bullet("TelegramScraperSource: Interrogates the active MTProto Telegram microservice for recent dark web dumps and threat feed postings.")
add_bullet("PhishingFeedSource and ThreatIntelSource: Registered adapter interfaces structured for external commercial feeds, currently configured as non-blocking offline stubs (Section X).")
add_body("When a search query is dispatched, the gateway executes all registered adapters concurrently via Promise.allSettled, ensuring that slow or unresponsive adapters degrade gracefully without impeding operational responses.")

# Section IV
add_h1("IV. Privacy-Preserving Search Protocol")
add_h2("A. Mathematical Formulation of Range Search")
add_body("BreachShield enforces mathematical query confidentiality through a prefix-bucket k-anonymity protocol grounded in Sweeney's theoretical model [8]. Let T represent the arbitrary user identifier. The client first applies a canonical normalization function: T' = lowercase(trim(T)).")
add_body("Using the browser's native Web Crypto API, the client computes the 256-bit cryptographic digest: H = SHA-256(T') in {0, 1}^256. The 64-character hexadecimal representation of H is partitioned into two disjoint segments: H = P || S, where P = H[0:5] is a 5-hex-character (20-bit) prefix, and S = H[5:64] is the residual 59-hex-character (236-bit) suffix.")
add_body("The client transmits only the 20-bit prefix P to the API gateway. The total number of possible prefix buckets is |B| = 16^5 = 1,048,576. For a global catalog containing N total compromised records, the expected anonymity set size E[k] per prefix query is E[k] = N / 1,048,576. The mutual information disclosed to the server regarding the exact identifier T is strictly upper-bounded by I(T; P) <= log2(16^5) = 20 bits, regardless of catalog magnitude N.")

add_callout_box("Algorithm 1: Client-Side k-Anonymity Range Query", [
    "Require: Target identifier T, Authenticated session token tau",
    "Ensure: Matched breach metadata set R_match",
    "1:  T_norm <- lowercase(trim(T))",
    "2:  H <- WebCrypto.SHA256(T_norm)     // In-browser computation",
    "3:  P <- H[0:5],  S <- H[5:64]        // 20-bit prefix, 236-bit suffix",
    "4:  Bucket <- HTTP_GET('/api/v1/range/' + P, Bearer tau)",
    "5:  R_match <- empty_set",
    "6:  for each (S_i, Metadata_i) in Bucket do",
    "7:      if S_i == S then",
    "8:          R_match <- R_match union {Metadata_i}",
    "9:      end if",
    "10: end for",
    "11: return R_match"
])

add_h2("B. Adversary and Threat Model")
add_body("The security model of BreachShield considers two distinct adversarial profiles:")
add_bullet("Passive Network Eavesdropper: An adversary monitoring physical transport traffic observes only TLS-encrypted frames conveying a 5-hexadecimal character prefix and a bearer token. The full hash and raw identifier are never transmitted.")
add_bullet("Honest-but-Curious Server Operator: The gateway administrator operates the matching infrastructure faithfully but attempts to deduce which specific individual is being investigated. Because the server only receives prefix P, it cannot identify which record within the returned bucket corresponds to the user's inquiry.")

add_h2("C. Gating Trade-Off and Identity Linkage")
add_body("To protect against automated scraping and denial-of-service degradation, access to the range query endpoint is protected by an out-of-band OTP verification gate. This architectural decision introduces an explicit design trade-off identified by Li et al. [9]: because the user must authenticate via an OTP session prior to issuing range queries, the server establishes a session identity binding with the querying client. While the operator remains mathematically blind to which particular identifier within bucket B(P) matched, the server does know the authenticated identity of the inquirer. This represents a conscious engineering compromise favoring access accountability over absolute unlinkability in academic and enterprise environments.")

# Section V
add_h1("V. Identity Verification and Dynamic Risk Scoring")
add_h2("A. Out-of-Band Authentication Flow")
add_body("Prior to executing a breach search, the user initiates identity validation via /api/auth/send-otp. The gateway enforces a strict 30-second cooldown between requests. A cryptographically secure 6-digit numerical token is generated, hashed with bcrypt (work factor 10), and stored with a 5-minute time-to-live (TTL). The plaintext token is dispatched either via Gmail SMTP (for email targets) or relayed over the Android WebSocket gateway to be broadcast as a transactional SMS.")
add_body("Upon submission to /api/auth/verify-otp, the backend enforces a maximum threshold of five failed attempts. Upon successful verification, the gateway generates a signed HMAC-SHA256 JWT (1-hour validity) containing the claim verifiedTarget, issued both in the JSON payload and as a Secure HTTP-Only cookie.")

add_figure("fig_merkle_anchoring.png", "Fig. 2. End-to-end execution sequence: OTP authentication, concurrent source querying, dynamic risk evaluation, and Merkle-tree audit anchoring.")

add_h2("B. Dynamic Exposure Risk Engine")
add_body("Unlike systems that rely on static, hardcoded severity constants, BreachShield evaluates exposure severity dynamically across aggregated textual corpora X. The risk engine executes a weighted regular-expression evaluation across five vulnerability categories, accumulating points subject to strict sub-category ceilings:")
add_bullet("Identity Documents (C_doc): Aadhaar, passport, PAN, and national ID patterns (up to 35 points).")
add_bullet("Credential Material (C_pwd): Cleartext passwords, salted hashes, and cryptographic tokens (up to 30 points).")
add_bullet("Physical Locality (C_addr): Residential addresses, postal codes, and geolocation data (up to 20 points).")
add_bullet("Telecommunication Records (C_phone): Telephone and mobile numbers (up to 15 points).")
add_bullet("Multi-Source Dispersion (C_multi): Evidence confirmed across multiple distinct OSINT sources (up to 15 points).")
add_body("In addition, the engine computes a cross-record structural correlation score (kappa <= 15) and integrates live probability signals from the active UrlBERT transformer classifier (P_phish * 30). The raw aggregate score is bounded within the range [20, 100], and subsequently partitioned into four operational tiers: LOW ([20, 40)), MEDIUM ([40, 70)), HIGH ([70, 90)), and CRITICAL ([90, 100]).")

add_callout_box("Algorithm 2: Dynamic Exposure Risk Scoring", [
    "Require: Aggregated breach corpus X, AI Phishing result A",
    "Ensure: Risk Score S in [20, 100], Severity Tier T",
    "1:  S_raw <- 0",
    "2:  for each category c in {doc, pwd, addr, phone, multi} do",
    "3:      w_c <- EvaluateRegexMatches(X, c)",
    "4:      S_raw <- S_raw + min(w_c, cap[c])",
    "5:  end for",
    "6:  kappa <- ComputeCrossCorrelation(X)",
    "7:  S_raw <- S_raw + min(kappa, 15)",
    "8:  if A is present then",
    "9:      S_raw <- S_raw + (A.phishingProb * 30)",
    "10: end if",
    "11: S <- min(100, max(20, S_raw))",
    "12: T <- MapTierThresholds(S)",
    "13: return S, T"
])

# Section VI
add_h1("VI. Data Flow Analysis")
add_body("Table III traces the exact data transformations occurring throughout a complete inquiry cycle, from in-browser normalization to blockchain anchor verification.")

add_styled_table("TABLE III: End-to-End System Data Flow Pipeline",
    ["Step", "Pipeline Phase", "Operational Data Transformation"],
    [
        ["1", "Input Normalization", "Raw string T -> lowercase, whitespace-trimmed T'."],
        ["2", "Client Cryptography", "T' -> 256-bit SHA-256 digest H via W3C Web Crypto."],
        ["3", "Hash Partitioning", "H -> 5-character prefix P and 59-character suffix S."],
        ["4", "Range Dispatch", "Prefix P -> HTTP GET /api/v1/range/{P} with Bearer JWT."],
        ["5", "Server Filtering", "Prefix P -> Retrieval of candidate bucket B(P) from storage."],
        ["6", "Local Verification", "Suffix S -> In-browser matching against B(P) without server exposure."],
        ["7", "Multi-Source Query", "Target T' -> Asynchronous execution of registered OSINT adapters."],
        ["8", "Dynamic Scoring", "Text corpus X -> Regex evaluation, correlation, and tier assignment."],
        ["9", "Canonicalization", "Event record -> Sorted-key canonical JSON -> SHA-256 Merkle leaf."],
        ["10", "Ledger Anchoring", "Merkle leaves -> Root calculation -> Smart contract transaction."]
    ]
)

# Section VII
add_h1("VII. Machine Learning Severity Triage")
add_h2("A. Curated Dataset and Stratification")
add_body("To benchmark automated severity triage, an empirical dataset comprising 1,034 verified historical breach disclosures was curated from the Have I Been Pwned catalog and dark web intelligence archives. Features were extracted across 165 dense dimensions encoding compromised attribute types, breach volume, password hashing methodologies, domain classifications, and historical recurrence. The corpus was partitioned using a stratified 70/15/15 split (random seed 42) into 723 training records, 154 validation records, and 157 held-out testing records, as outlined in Table IV.")

add_styled_table("TABLE IV: Dataset Partitioning and Class Distribution",
    ["Partition", "Total", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
    [
        ["Train (70%)", "723", "49", "341", "291", "42"],
        ["Val (15%)", "154", "10", "73", "62", "9"],
        ["Test (15%)", "157", "11", "74", "63", "9"],
        ["Full Corpus", "1,034", "70", "488", "416", "60"]
    ]
)

add_h2("B. Model Population Distinction")
add_body("To maintain complete scientific integrity, an explicit distinction is drawn between two model populations present within the repository:")
add_bullet("Offline Severity Benchmark Population: A set of trained, persistent model artifacts stored on disk. This population contains our trained XGBoost classifier alongside comparative 1D-CNN, RNN, and Transformer checkpoints. Repeated inferences yield deterministic outputs.")
add_bullet("Demonstration Models: Lightweight interactive demo models embedded within secondary UI exploration screens that generate synthetic outputs for interface prototyping.")
add_body("All quantitative metrics reported in this section evaluate strictly the persistent, checkpoint-loaded benchmark population.")

add_h2("C. Comparative Experimental Results")
add_body("We evaluated four competing machine learning architectures on identical feature representations: XGBoost (Ours: max depth 6, lr 0.1, 100 estimators), 1D-CNN (multi-scale kernels k=3,4,5), Recurrent Neural Network (dual-layer GRU with packed padding and gradient clipping), and Transformer Encoder (2 layers, 4 heads).")

add_styled_table("TABLE V: Comparative Severity Classification Performance (Test Set N=157)",
    ["Architecture", "Accuracy", "Macro F1", "Weighted F1"],
    [
        ["Majority Baseline (MED)", "47.1%", "16.0%", "30.2%"],
        ["RNN (Packed + Clipped)", "44.6%", "34.0%", "46.8%"],
        ["Transformer (2L / 4H)", "48.4%", "42.9%", "50.8%"],
        ["1D-CNN (k=3,4,5)", "66.2%", "57.2%", "65.7%"],
        ["XGBoost (Ours)", "89.2%", "83.2%", "89.4%"]
    ]
)

add_figure("fig_model_comparison.png", "Fig. 3. Comparative severity classification performance across models on held-out test set (N=157).")

add_body("As presented in Table V and visualized in Fig. 3, XGBoost achieved an overall test accuracy of 89.2% and a Macro F1-score of 83.2%, substantially outperforming all neural network architectures. The 1D-CNN emerged as the most resilient deep learning model (66.2% accuracy), while sequential RNN and Transformer architectures suffered from structural overfitting on the tabular feature space.")
add_body("Table VI details the per-tier precision, recall, and F1 performance for the benchmarked XGBoost model. Performance remains strong across MEDIUM (91.3% F1) and HIGH (91.8% F1) classes, with misclassifications confined strictly to adjacent severity boundaries.")

add_styled_table("TABLE VI: XGBoost Per-Class Performance on Test Set (N=157)",
    ["Severity Tier", "Precision", "Recall", "F1-Score", "Test Support (n)"],
    [
        ["LOW", "64.3%", "81.8%", "72.0%", "11"],
        ["MEDIUM", "90.7%", "91.9%", "91.3%", "74"],
        ["HIGH", "94.9%", "88.9%", "91.8%", "63"],
        ["CRITICAL*", "77.8%", "77.8%", "77.8%", "9"]
    ]
)

add_figure("fig_per_class_f1.png", "Fig. 4. Per-class F1-scores across severity tiers comparing XGBoost against neural baselines (*CRITICAL tier support n=9).")

add_h2("D. Theoretical Empirical Interpretation")
add_body("These empirical findings substantiate the theoretical assertions of Grinsztajn et al. [14]: tabular security metadata features exhibit irregular distributions, lack translational spatial invariance, and contain uninformative categorical dimensions that distort gradient-based backpropagation in deep neural networks. Decision tree ensembles naturally accommodate axis-aligned partitions, delivering robust classification boundaries without requiring millions of training instances.")

add_h2("E. Active Search-Path Transformer Classifier")
add_body("In parallel with offline severity triage, BreachShield incorporates a live pretrained transformer model (UrlBERT) directly onto the active search pathway. When an OSINT record contains linked URLs or domains, the text sequence is evaluated by UrlBERT, yielding a continuous phishing probability. In verification testing against a known malicious credential-harvesting URL, the classifier successfully flagged the link with a confidence score of 0.9999, injecting a corresponding +30 point factor into the dynamic risk scoring engine.")

# Section VIII
add_h1("VIII. Blockchain-Anchored Audit Trail")
add_h2("A. Merkle Batching Construction")
add_body("To prevent system administrators or compromised servers from retroactively altering audit records, BreachShield implements an append-only cryptographic logging architecture. For each security event E, the payload is canonicalized by sorting keys lexicographically into a deterministic JSON string: J_canon = CanonicalizeJSON(E). The leaf digest is computed as L_i = SHA-256(J_canon). Leaves are appended to an in-memory queue. Flushing to the smart contract occurs under a hybrid size-and-time policy: Trigger = (|Q| >= 100) or (Delta_t >= 60 seconds).")
add_body("Upon reaching either threshold, a balanced binary Merkle tree is computed over the leaf set {L_1, L_2, ..., L_m}. The resulting root hash R_Merkle = MerkleRoot(L_1, ..., L_m) is submitted to the smart contract.")

add_h2("B. Solidity Smart Contract Implementation")
add_body("The audit contract, AnchorRegistry.sol, is authored in Solidity (^0.8.20) and deployed to a local Hardhat EVM node. The contract maintains an append-only mapping of anchor events: A(R) = {rootHash, timestamp, blockNumber, batchSize}. Emitted events allow any independent auditing party to verify whether a particular event leaf L_i was included within batch R_Merkle by supplying a logarithmic inclusion proof of length ceil(log2 m).")

add_h2("C. Latency and Exposure Window Trade-Off")
add_body("Committing every individual lookup event on-chain synchronously would introduce unacceptable transaction costs and execution latency (often exceeding 2–5 seconds per block confirmation). The 60-second hybrid batching window amortizes blockchain overhead efficiently. Within the 60-second accumulation window, uncommitted leaves are protected by local SHA-256 hash chaining; once anchored, the audit proof becomes immutable and globally verifiable.")

# Section IX
add_h1("IX. System Evaluation and Testing")
add_h2("A. Comprehensive Testing Verification")
add_body("The platform was subjected to extensive automated and empirical testing across all architectural tiers. Testing methodologies included:")
add_bullet("Backend Unit and Integration Suites: 101 automated test cases executed across 26 test suites using Jest and Supertest, verifying API routing, OTP lifecycles, JWT claims, and database fallback operations (101/101 passing, 100% success rate).")
add_bullet("Frontend Component Suites: 50 automated component test cases verified using Vitest and React Testing Library, testing HUD terminal rendering, client-side Web Crypto hashing, and form validation (50/50 passing, 100% success rate).")
add_bullet("Live Endpoint and Adversarial Verification: Direct HTTP test vectors executed against the running API gateway to confirm that invalid OTPs trigger lockout thresholds and malformed hashes are rejected.")
add_bullet("Deterministic Classifier Invariance: Repeated sequential inference calls against the benchmark XGBoost classifier confirmed complete numerical determinism across identical input vectors.")

add_styled_table("TABLE VII: System Subsystem Evaluation Matrix",
    ["Subsystem Component", "Empirical Verification Methodology", "Operational Status"],
    [
        ["k-Anonymity Search", "Live client-side hashing; 5-char prefix query", "Verified / Live"],
        ["XGBoost Severity Triage", "89.2% accuracy on 1,034 records (N=157)", "Benchmark Validated"],
        ["Backend Automated Tests", "101 unit/integration tests across 26 suites", "101/101 Passing"],
        ["Frontend Component Tests", "50 component tests across 3 test suites", "50/50 Passing"],
        ["Dynamic Risk Engine", "Weighted regex pattern matching on live text", "Verified / Live"],
        ["Live URL Phishing AI", "UrlBERT inference (0.9999 test confidence)", "Verified / Live"],
        ["Merkle Audit Batching", "Canonical JSON hashing and root construction", "Verified / Live"],
        ["Blockchain Contract Deploy", "Solidity compilation on local Hardhat node", "Requires Config Fix"],
        ["OSINT Feed Adapters", "2 live sources (Catalog, Telegram); 2 stubs", "Partially Integrated"]
    ]
)

# Section X
add_h1("X. Limitations and Remediation Roadmap")
add_body("In accordance with strict academic standards, this section discloses all verified system constraints and incomplete integrations without fabrication or embellishment:")
add_h2("A. Blockchain Deployer Credential Defect")
add_body("While the AnchorRegistry.sol contract compiles cleanly, automatic smart contract deployment upon node restart currently fails due to an unset private-key environment variable in the automated deployment script. The deployment process cannot resolve the default signer address without this variable. This is an operational configuration defect rather than an architectural error in the Merkle batching algorithm.")

add_h2("B. Secondary OSINT Feed Stubs")
add_body("Of the four registered BreachSource adapters, only PublicBreachSource and TelegramScraperSource actively ingest live external data. PhishingFeedSource and ThreatIntelSource are currently implemented as non-blocking skeleton stubs to validate registry registration and avoid third-party API rate limits during academic demonstration.")

add_h2("C. Class Imbalance in CRITICAL Severity Tier")
add_body("The curated training corpus contains only 60 total CRITICAL records, resulting in a held-out test support of n = 9. While XGBoost achieved 77.8% precision and recall on this tier, the narrow sample size yields wider statistical confidence intervals. Incorporating SMOTE oversampling [3] is scheduled for future dataset expansion.")

add_h2("D. Prioritized Remediation Plan")
add_bullet("1. Ledger Deployment Automation: Configure persistent local Hardhat deployment credentials in the server initialization script to enable automated contract deployment upon system reboot.")
add_bullet("2. Secondary Adapter Ingestion: Wire PhishingFeedSource to open-source threat feeds (such as URLhaus or PhishTank) to ingest live phishing domain updates.")
add_bullet("3. Resampling for Scarce Tiers: Apply SMOTE oversampling to balance the CRITICAL severity class across training iterations.")
add_bullet("4. End-to-End Latency Benchmarking: Implement an automated distributed benchmarking harness to record millisecond-level latency percentiles (p50, p95, p99) under simulated concurrent traffic.")

# Section XI
add_h1("XI. Conclusion")
add_body("This paper presented BreachShield, a privacy-preserving OSINT breach intelligence and threat detection platform developed at Acharya Institute of Technology. By combining client-side 20-bit SHA-256 prefix range queries (k-anonymity), out-of-band carrier SMS/email OTP gating, and dynamic regex-driven risk scoring, BreachShield allows users to audit digital compromise exposure without revealing plaintext target identifiers to intermediate networks or server operators. Empirical evaluation demonstrates that tree-based gradient boosting (XGBoost) significantly outperforms deep learning architectures on tabular breach metadata, delivering 89.2% accuracy on 1,034 curated breach records. Append-only Merkle-tree batching provides cryptographic audit trails anchored to an EVM smart contract, supported by 101 passing backend tests and 50 passing frontend tests. A transparent accounting of system limitations and scheduled remediations provides a solid foundation for future operational deployment.")

add_h1("Acknowledgment")
add_body("The authors express their gratitude to their project supervisor, Prof. Sushma T. M., Assistant Professor, Department of Information Science and Engineering, Acharya Institute of Technology, for guidance and constructive review throughout the design, implementation, and evaluation of Major Project Phase II (Course Code: BIS786).")

add_h1("References")
refs = [
    "[1] A. Aljofey, Q. Jiang, Q. Qu, M. Huang, and J.-P. Niyigena, \"An Effective Phishing Detection Model Based on Character Level Convolutional Neural Network from URL,\" Electronics, vol. 9, no. 9, p. 1514, 2020.",
    "[2] O. K. Sahingoz, E. Buber, and E. Kugu, \"DEPHIDES: Deep Learning Based Phishing Detection System,\" IEEE Access, vol. 12, pp. 8052-8070, 2024.",
    "[3] F. S. Alsubaei, A. A. Almazroi, and N. Ayub, \"Enhancing Phishing Detection: A Novel Hybrid Deep Learning Framework for Cybercrime Forensics,\" IEEE Access, vol. 12, pp. 8373-8389, 2024.",
    "[4] B. V. Pavani, D. Mahitha, and B. Uma Maheswari, \"Enhancing Online Safety: Phishing URL Detection Using Machine Learning and Explainable AI,\" in Proc. 2024 15th ICCCNT, IEEE, 2024.",
    "[5] M. Tawfik, A. A. Abu-Ein, A. H. Abdelhaliem, Y. M. Al-Sharo, and I. S. Fathi, \"Explainable Few-Shot Learning with Modern BERT for Detecting Emerging Phishing Attacks Using XF-PhishBERT,\" Scientific Reports, vol. 15, no. 1, art. 42821, 2025.",
    "[6] P. Kühn, K. Wittorf, and C. Reuter, \"Navigating the Shadows: Manual and Semi-Automated Evaluation of the Dark Web for Cyber Threat Intelligence,\" IEEE Access, vol. 12, pp. 45210-45228, 2024.",
    "[7] A. Arabnouri, S. Eissazadeh, and A. Shafieinejad, \"A Secure Auditable Log based on Blockchain,\" Monadi, vol. 13, no. 2, pp. 75-86, 2024.",
    "[8] L. Sweeney, \"k-Anonymity: A Model for Protecting Privacy,\" Int. J. Uncertainty, Fuzziness Knowl.-Based Syst., vol. 10, no. 5, pp. 557-570, 2002.",
    "[9] L. Li, B. Pal, J. Ali, N. Sullivan, R. Chatterjee, and T. Ristenpart, \"Protocols for Checking Compromised Credentials,\" in Proc. 2019 ACM CCS, 2019, pp. 1387-1403.",
    "[10] T. Chen and C. Guestrin, \"XGBoost: A Scalable Tree Boosting System,\" in Proc. 22nd ACM SIGKDD, 2016, pp. 785-794.",
    "[11] R. C. Merkle, \"A Digital Signature Based on a Conventional Encryption Function,\" in Advances in Cryptology - CRYPTO '87, Springer, 1988, pp. 369-378.",
    "[12] S. A. Crosby and D. S. Wallach, \"Efficient Data Structures for Tamper-Evident Logging,\" in Proc. 18th USENIX Security Symp., 2009, pp. 317-334.",
    "[13] K. El Emam and F. K. Dankar, \"Protecting Privacy Using k-Anonymity,\" J. Amer. Med. Inform. Assoc., vol. 15, no. 5, pp. 627-637, 2008.",
    "[14] L. Grinsztajn, E. Oyallon, and G. Varoquaux, \"Why Do Tree-Based Models Still Outperform Deep Learning on Typical Tabular Data?,\" in Proc. NeurIPS, vol. 35, 2022, pp. 507-520.",
    "[15] M. Saleem, R. Islam, and M. A. Kabir, \"The Anonymity of the Dark Web: A Survey,\" IEEE Access, vol. 10, pp. 33628-33660, 2022.",
    "[16] J. Pastor-Galindo, P. Nespoli, F. Gómez Mármol, and G. Martínez Pérez, \"The Not Yet Exploited Goldmine of OSINT: Opportunities, Open Challenges and Future Trends,\" IEEE Access, vol. 8, pp. 10282-10304, 2020.",
    "[17] IBM Security, \"Cost of a Data Breach Report 2024,\" IBM Corporation, Jul. 2024."
]

for ref in refs:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.left_indent = Inches(0.22)
    p.paragraph_format.first_line_indent = Inches(-0.22)
    p.paragraph_format.line_spacing = 1.02
    set_run(p, ref, size=Pt(8.0))

doc.save(output_docx)
print("Successfully generated:", output_docx)
