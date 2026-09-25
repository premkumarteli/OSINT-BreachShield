import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

output_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\figures'

EXACT_TITLE = "BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection"

doc = docx.Document()

# IEEE A4 standard page geometry
sec0 = doc.sections[0]
sec0.page_width = Inches(8.27)
sec0.page_height = Inches(11.69)
sec0.top_margin = Inches(0.70)
sec0.bottom_margin = Inches(0.75)
sec0.left_margin = Inches(0.55)
sec0.right_margin = Inches(0.55)

# Title
p_title = doc.add_paragraph()
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_before = Pt(0)
p_title.paragraph_format.space_after = Pt(2)
p_title.paragraph_format.line_spacing = 1.05
r_title = p_title.add_run(EXACT_TITLE)
r_title.font.name = 'Times New Roman'
r_title.font.size = Pt(20)
r_title.font.bold = True

def set_cell_no_borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    for b in tcPr.xpath('./w:tcBorders'):
        tcPr.remove(b)
    borders_el = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
    succ = tcPr.xpath('./w:shd | ./w:noWrap | ./w:tcMar | ./w:textDirection | ./w:tcFitText | ./w:vAlign | ./w:hideMark | ./w:headers')
    if succ:
        succ[0].addprevious(borders_el)
    else:
        tcPr.append(borders_el)

def set_table_borders(table, xml_str):
    tblPr = table._tbl.tblPr
    for b in tblPr.xpath('./w:tblBorders'):
        tblPr.remove(b)
    borders_el = parse_xml(xml_str)
    succ = tblPr.xpath('./w:shd | ./w:tblLayout | ./w:tblCellMar | ./w:tblLook')
    if succ:
        succ[0].addprevious(borders_el)
    else:
        tblPr.append(borders_el)

def set_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    if not trPr.xpath('./w:cantSplit'):
        cs = parse_xml(f'<w:cantSplit {nsdecls("w")}/>')
        succ = trPr.xpath('./w:trHeight | ./w:tblHeader | ./w:tblCellSpacing | ./w:jcPr | ./w:hidden')
        if succ:
            succ[0].addprevious(cs)
        else:
            trPr.append(cs)

def set_section_columns(section, num_cols=2, space_twips=360):
    sectPr = section._sectPr
    for c in sectPr.xpath('./w:cols'):
        sectPr.remove(c)
    cols_xml = parse_xml(f'<w:cols {nsdecls("w")} w:num="{num_cols}" w:space="{space_twips}"/>')
    succ = sectPr.xpath('./w:formProt | ./w:vAlign | ./w:noEndnote | ./w:titlePg | ./w:textDirection | ./w:bidi | ./w:rtlGutter | ./w:docGrid | ./w:printerSettings | ./w:sectPrChange')
    if succ:
        succ[0].addprevious(cols_xml)
    else:
        sectPr.append(cols_xml)

# Authors Table (Clean 2-block layout matching IEEEtran \and)
table_auth = doc.add_table(rows=1, cols=2)
table_auth.alignment = WD_TABLE_ALIGNMENT.CENTER

cell0 = table_auth.cell(0, 0)
p0 = cell0.paragraphs[0]
p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
p0.paragraph_format.space_before = Pt(2)
p0.paragraph_format.space_after = Pt(4)
p0.paragraph_format.line_spacing = 1.05
r0_names = p0.add_run("Arvind D. H., Girishkumar N. M., Manoj, Premkumar Teli\n")
r0_names.font.name = 'Times New Roman'; r0_names.font.size = Pt(9.5); r0_names.font.bold = True
r0_affil = p0.add_run("Department of Information Science and Engineering\nAcharya Institute of Technology, Bengaluru, India")
r0_affil.font.name = 'Times New Roman'; r0_affil.font.size = Pt(8.5); r0_affil.font.italic = True

cell1 = table_auth.cell(0, 1)
p1 = cell1.paragraphs[0]
p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
p1.paragraph_format.space_before = Pt(2)
p1.paragraph_format.space_after = Pt(4)
p1.paragraph_format.line_spacing = 1.05
r1_name = p1.add_run("Sushma T. M.\n")
r1_name.font.name = 'Times New Roman'; r1_name.font.size = Pt(9.5); r1_name.font.bold = True
r1_affil = p1.add_run("Assistant Professor, Dept. of Information Science and Engineering\nAcharya Institute of Technology, Bengaluru, India")
r1_affil.font.name = 'Times New Roman'; r1_affil.font.size = Pt(8.5); r1_affil.font.italic = True

for cell in [cell0, cell1]:
    set_cell_no_borders(cell)

# 2-Column Body Section
sec_body = doc.add_section(WD_SECTION.CONTINUOUS)
sec_body.page_width = Inches(8.27)
sec_body.page_height = Inches(11.69)
sec_body.top_margin = Inches(0.70)
sec_body.bottom_margin = Inches(0.75)
sec_body.left_margin = Inches(0.55)
sec_body.right_margin = Inches(0.55)

set_section_columns(sec_body, 2, 360)

def add_p(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=2.0, line_spacing=1.0):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    return p

def add_heading1(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r.font.bold = True
    return p

def add_heading2(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r.font.bold = True
    r.font.italic = True
    return p

def add_heading3(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(1.0)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    r = p.add_run(title)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.0)
    r.font.italic = True
    return p

def add_equation(eq_text, eq_num):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2.5)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(eq_text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.0)
    r.font.italic = True
    
    r_space = p.add_run("   " * 2)
    r_num = p.add_run(f"({eq_num})")
    r_num.font.name = 'Times New Roman'
    r_num.font.size = Pt(9.0)
    r_num.font.bold = False
    return p

def add_image(img_path, caption, width_in=3.35):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(3)
        p_img.paragraph_format.space_after = Pt(1.5)
        p_img.paragraph_format.keep_with_next = True
        r_img = p_img.add_run()
        r_img.add_picture(img_path, width=Inches(width_in))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(1)
        p_cap.paragraph_format.space_after = Pt(4)
        p_cap.paragraph_format.keep_with_next = False
        r_cap = p_cap.add_run(caption)
        r_cap.font.name = 'Times New Roman'
        r_cap.font.size = Pt(8.0)
        r_cap.font.italic = True

def add_table_clean(headers, rows, caption, col_widths=None, font_size=7.2):
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(1.5)
    p_cap.paragraph_format.keep_with_next = True
    r_cap = p_cap.add_run(caption)
    r_cap.font.name = 'Times New Roman'
    r_cap.font.size = Pt(7.5)
    r_cap.font.bold = True
    
    table = doc.add_table(rows=len(rows)+1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, f'<w:tblBorders {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D3D3D3"/><w:left w:val="none"/><w:right w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.0
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(font_size)
            r.font.bold = True
            
    for r_idx, row in enumerate(rows):
        row_cells = table.rows[r_idx+1].cells
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 and len(str(val)) < 14 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0.8)
            p.paragraph_format.space_after = Pt(0.8)
            p.paragraph_format.line_spacing = 1.0
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(font_size)
                
    for row in table.rows:
        set_row_cant_split(row)
        if col_widths:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)
                
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(0)
    p_space.paragraph_format.space_after = Pt(2.5)

def add_algorithm(number, title, inputs, outputs, lines):
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(2)
    p_cap.paragraph_format.keep_with_next = True
    r = p_cap.add_run(f"Algorithm {number}: {title}")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(8.5)
    r.font.bold = True
    
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, f'<w:tblBorders {nsdecls("w")}><w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:insideH w:val="none"/><w:left w:val="none"/><w:right w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    
    cell = table.cell(0, 0)
    cell.width = Inches(3.35)
    
    p_in = cell.paragraphs[0]
    p_in.paragraph_format.space_before = Pt(2)
    p_in.paragraph_format.space_after = Pt(1)
    p_in.paragraph_format.line_spacing = 1.0
    r_in_lbl = p_in.add_run("Require: ")
    r_in_lbl.font.name = 'Times New Roman'; r_in_lbl.font.size = Pt(8.0); r_in_lbl.font.bold = True
    r_in = p_in.add_run(inputs)
    r_in.font.name = 'Times New Roman'; r_in.font.size = Pt(8.0); r_in.font.italic = True
    
    p_out = cell.add_paragraph()
    p_out.paragraph_format.space_before = Pt(0)
    p_out.paragraph_format.space_after = Pt(3)
    p_out.paragraph_format.line_spacing = 1.0
    r_out_lbl = p_out.add_run("Ensure: ")
    r_out_lbl.font.name = 'Times New Roman'; r_out_lbl.font.size = Pt(8.0); r_out_lbl.font.bold = True
    r_out = p_out.add_run(outputs)
    r_out.font.name = 'Times New Roman'; r_out.font.size = Pt(8.0); r_out.font.italic = True
    
    for l_idx, line in enumerate(lines):
        p_l = cell.add_paragraph()
        p_l.paragraph_format.space_before = Pt(0.5)
        p_l.paragraph_format.space_after = Pt(0.5)
        p_l.paragraph_format.line_spacing = 1.0
        r_num = p_l.add_run(f"{l_idx+1}: ")
        r_num.font.name = 'Times New Roman'; r_num.font.size = Pt(7.5); r_num.font.bold = True
        r_code = p_l.add_run(line)
        r_code.font.name = 'Courier New'; r_code.font.size = Pt(7.5)
        
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(0)
    p_space.paragraph_format.space_after = Pt(2)

# Abstract & Keywords
p_abs = doc.add_paragraph()
p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p_abs.paragraph_format.space_before = Pt(1)
p_abs.paragraph_format.space_after = Pt(2)
p_abs.paragraph_format.line_spacing = 1.0
r_abs_lbl = p_abs.add_run("Abstract—")
r_abs_lbl.font.name = 'Times New Roman'; r_abs_lbl.font.size = Pt(9.0); r_abs_lbl.font.bold = True
r_abs = p_abs.add_run("Breach notification and dark-web exposure intelligence platforms suffer from a fundamental privacy paradox: to determine whether personal credentials have been compromised, users must transmit those sensitive identifiers in plaintext to a third-party server, creating a centralized query-surveillance and correlation vector. This paper presents BreachShield, a privacy-preserving Open-Source Intelligence (OSINT) breach detection and threat assessment platform designed to resolve this tension through cryptographic query isolation, accountable gating, and verifiable audit logging. BreachShield combines a client-side k-anonymity range-query protocol (20-bit SHA-256 prefix partitioning) executed via the W3C Web Crypto API, a dual-channel out-of-band One-Time Password (OTP) identity gate, a pluggable OSINT source aggregation engine supporting live breach stores and Telegram scraping, an empirical machine-learning breach severity assessment framework, and a Merkle-tree batched audit trail anchored to an Ethereum Virtual Machine (EVM) smart contract. We define a comprehensive threat model spanning external eavesdroppers, malicious authenticated users, insider adversaries, and source-poisoning vectors, supported by formal security and privacy analyses that evaluate prefix leakage against Private Set Intersection (PSI) baselines. We report extensive functional evaluation across all pipeline subsystems and detail the experimental evaluation of a 165-dimensional gradient-boosted decision tree classifier (XGBoost, 89.2% test accuracy) benchmarked against deep learning architectures.")
r_abs.font.name = 'Times New Roman'; r_abs.font.size = Pt(9.0)

p_key = doc.add_paragraph()
p_key.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p_key.paragraph_format.space_before = Pt(1)
p_key.paragraph_format.space_after = Pt(5)
p_key.paragraph_format.line_spacing = 1.0
r_key_lbl = p_key.add_run("Keywords—")
r_key_lbl.font.name = 'Times New Roman'; r_key_lbl.font.size = Pt(9.0); r_key_lbl.font.bold = True
r_key = p_key.add_run("Breach intelligence, k-anonymity, Open-Source Intelligence (OSINT), threat modeling, Merkle tree, blockchain audit log, XGBoost, query privacy.")
r_key.font.name = 'Times New Roman'; r_key.font.size = Pt(9.0)

# Section I: Introduction
add_heading1("I. INTRODUCTION")
add_p("The exponential expansion of digital identity surfaces and automated credential theft has precipitated widespread exfiltration of personal records onto dark-web marketplaces, underground paste sites, and public data dumps [1], [2]. Traditional compromise-checking services are fundamentally reactive and architecturally centralized. Users or corporate security teams seeking to determine credential exposure typically submit target queries—such as cleartext email addresses, employee identities, or telephone numbers—directly to centralized lookup services. This lookup process exposes users to third-party query tracking: the lookup provider learns precisely which identifier is being monitored, when the query occurred, and the requesting network location [3]. Consequently, querying for compromised status inadvertently creates a high-value surveillance vector.")

add_p("To counteract query-exposure risks, partial prefix-matching constructions (commonly termed k-anonymity range queries) have been introduced [3], [4]. In these models, clients hash target identifiers locally and submit only a truncated cryptographic hash prefix. The lookup server returns all records matching that prefix bucket, leaving the final matching step to the client. While prefix disclosure prevents the server from deterministically identifying the requested record among bucket candidates, naive public range endpoints remain vulnerable to bulk enumeration and dictionary-scraping attacks. Malicious actors can traverse the finite prefix space (16^d possibilities) to harvest complete compromised credential corpora.")

add_p("Furthermore, multi-source OSINT threat ingestion introduces acute data integrity and operational reliability challenges [2]. Underground data sources, such as distributed Telegram dump channels, operate with erratic uptime, rate limits, and unauthenticated provenance. Once compromise intelligence is obtained, security administrators face the operational challenge of triaging threat severity: distinguishing between low-impact leaks (e.g., outdated usernames) and critical exposures (e.g., plaintext passwords correlated with national identity records). Finally, audit records generated during organizational investigations are vulnerable to retroactive manipulation or repudiation by privileged insiders unless backed by cryptographic integrity guarantees [5], [6].")

add_p("This paper presents BreachShield, a privacy-preserving OSINT breach intelligence platform engineered to address query privacy, authenticated enumeration resistance, multi-source aggregation, severity triage, and audit integrity within a unified architecture. BreachShield implements an end-to-end operational pipeline combining client-side Web Crypto SHA-256 partitioning, an out-of-band carrier-compliant OTP authentication gate, concurrent OSINT source dispatching, heuristic and machine-learning threat scoring, and Merkle-tree batched EVM smart contract anchoring.")

add_p("The primary contributions of this paper are:")
add_p("1) Privacy-Preserving Breach Intelligence Architecture: A client-side k-anonymity range-query protocol that bounds query disclosure to 20 bits of entropy, performing local cryptographic partitioning via the W3C Web Crypto API prior to network transmission.")
add_p("2) Multi-Source OSINT Aggregation Framework: An extensible asynchronous provider pipeline featuring concurrent dispatching, thread-safe Telegram scraper microservices with mutex-controlled SQLite session pooling, and automated failover data stores.")
add_p("3) OTP-Gated Authenticated Breach-Search Architecture: An accountable access control gate utilizing cryptographically secure OTP issuance, bcrypt hashing, carrier-compliant telecom DLT SMS templating via an Android gateway, and cryptographic session-token binding that enforces identity match invariants.")
add_p("4) Tamper-Evident Audit Logging: A deterministic audit logger using sorted-key canonical JSON leaf hashing, asynchronous batch buffering (100-record / 60-second window), Merkle tree generation, and EVM smart contract state anchoring.")
add_p("5) Experimental Machine-Learning Severity Assessment: An empirical benchmark evaluating XGBoost against 1D-CNN, RNN, and Transformer architectures across 1,034 curated breach records on a 165-dimensional feature space, establishing structural criteria for tabular exposure triage.")

# Section II: Threat Model
add_heading1("II. THREAT MODEL")
add_heading2("A. System Assets and Security Assumptions")
add_p("The assets requiring protection within BreachShield include: (i) Target Identifier Privacy (T): The plaintext identity (email address or phone number) queried by a user; (ii) Credential Integrity: The authoritative repository of breach metadata and suffix buckets; (iii) Audit Log Verifiability: The chronological record of compliance events and threat intelligence queries; and (iv) Authentication Credentials: Ephemeral OTP codes, bcrypt password hashes, and JSON Web Tokens (JWT). All operational communications occur over TLS 1.3. Cryptographic primitives including SHA-256 and bcrypt are assumed computationally secure against preimage and collision attacks.")

add_heading2("B. Adversary Taxonomy and Capabilities")
add_p("We define five adversarial classes categorized by vantage point and capabilities:")
add_p("1) Attacker A1 (External Network Adversary): Positioned on the network path between the client browser and the API gateway. A1 can eavesdrop on, intercept, replay, or inject packets. While TLS 1.3 prevents payload tampering, A1 observes packet timing, transfer volumes, and TLS SNI metadata.")
add_p("2) Attacker A2 (Authenticated Malicious User): Successfully completes OTP verification for identifier T_A but seeks to harvest prefix buckets to reconstruct the server breach corpus, query unauthorized identifiers T_B != T_A, or exhaust downstream OSINT rate limits.")
add_p("3) Attacker A3 (Malicious Insider): Possesses administrative read access to backend application servers, runtime process memory, and persistent MySQL storage. A3 attempts to correlate client IP addresses, JWT tokens, and requested prefix buckets to unmask plaintext targets.")
add_p("4) Attacker A4 (Source-Poisoning Adversary): Controls an upstream intelligence channel (such as a monitored public Telegram dump). A4 injects malformed data, deceptive entity records, or DoS payloads to corrupt threat triage scoring.")
add_p("5) Attacker A5 (Audit Log Adversary): A privileged insider attempting to retroactively delete, truncate, reorder, or manipulate query audit logs to conceal unauthorized lookups or falsify historical evidence.")

# Section III: System Architecture
add_heading1("III. SYSTEM ARCHITECTURE & IMPLEMENTATION")
add_image(os.path.join(figures_dir, "fig_architecture.png"), "Fig. 1. BreachShield multi-tier system architecture and operational data paths.", width_in=3.35)

add_heading2("A. Client-Side Anonymization Tier")
add_p("Implemented in React 19. Plaintext targets T are normalized locally by lowercasing and trimming whitespace. The normalized string is transformed into a 256-bit hash H = SHA-256(T) using the browser's hardware-accelerated W3C Web Crypto API (frontend/src/lib/kAnonymity.js). H is split into a 5-character (20-bit) prefix P = H[0:5] and a 59-character (236-bit) suffix S = H[5:64]. The plaintext target T and suffix S never traverse the network during range querying.")

add_heading2("B. API Gateway & Session Gating")
add_p("The gateway runs on Express 5 (backend/server.js), enforcing rate limiting, CORS restrictions, session validation, and breach source registry orchestration. Range queries are guarded by verifyOtpToken middleware. MySQL 8 serves as the persistent store for user records, OTP states, and local breach dumps, with an automatic JSON file-based fallback layer (backend/auth/db.js) activated upon database disconnection.")

add_heading2("C. OSINT Ingestion Microservice")
add_p("High-entropy dark-web dump tracking is handled by a Python FastAPI microservice using Telethon MTProto. Because SQLite session files incur file-lock collisions under concurrent asynchronous requests (sqlite3.OperationalError), the microservice serializes channel client access through an asyncio.Lock mutex with an 8.0-second timeout ceiling, guaranteeing process isolation.")

add_heading2("D. Android Telecom Relay Gateway")
add_p("In jurisdictions with strict telecom DLT mandates (such as India's TRAI regulations), automated cloud SMS gateways drop non-templated OTP payloads. BreachShield integrates a companion Android native client written in Kotlin (android-gateway/). It maintains a persistent bidirectional WebSocket connection to the gateway, transmitting pending OTPs via carrier hardware using pre-approved SMS header templates.")

add_heading2("E. Pluggable Source Registry")
add_p("Breach sources implement an abstract contract defined in backend/sources/BreachSource.js:")
add_equation("search(target, targetHash) -> P(Record)", 1)
add_p("The registry dynamically loads four concrete adapters: (1) PublicBreachSource: Executes range queries against the local normalized breach database; (2) TelegramScraperSource: Dispatches HTTP queries to the FastAPI scraper; (3) PhishingFeedSource: Scaffolding for domain reputation feeds; and (4) ThreatIntelSource: Scaffolding for commercial threat intelligence feeds.")

add_heading2("F. Operational Risk-Scoring Engine")
add_p("Threat triage on the operational search path is computed dynamically by riskEngine.js: analyzeExposure(): (i) Document / National ID exposure: up to 35 points; (ii) Password / cryptographic hash material: up to 30 points; (iii) Physical address coordinates: up to 20 points; (iv) Phone numbers: up to 15 points; (v) Multiple independent source mentions: up to 15 points; (vi) Cross-record correlation scores: up to 15 points; and (vii) Live URL phishing classification probabilities: up to 30 points, grounded in recent neural detection baselines [11]-[13]. The aggregated score is floored at 20, capped at 100, and mapped to categorical tiers: LOW (<40), MEDIUM (40-59), HIGH (60-79), and CRITICAL (>=80). Recency decay is calculated as:")
add_equation("w_recency = max(0.20, 1.0 - 0.10 * delta_y)", 2)
add_p("where delta_y is the elapsed time in years since breach occurrence.")

# Section IV: Protocols
add_heading1("IV. PRIVACY-PRESERVING PROTOCOLS")
add_heading2("A. Client-Side k-Anonymity Range Query")
add_p("BreachShield implements an adapted k-anonymity bucket-matching protocol derived from Sweeney's model [4] and popularized by Li et al. [3]. Algorithm 1 formalizes this procedure.")

add_algorithm(
    1,
    "Client-Side k-Anonymity Range Query",
    "Target identifier string T, verified session token tau",
    "Set of matched breach records R",
    [
        "T' = ToLower(Trim(T))",
        "H = WebCrypto.SHA-256(T')  // in-browser",
        "P = H[0:5]                // 20-bit prefix",
        "S = H[5:64]               // 236-bit suffix",
        "B(P) = HTTP_GET('/api/v1/range/' + P, Headers={Bearer tau})",
        "R = empty_set",
        "for each (S_i, Metadata_i) in B(P) do",
        "    if S_i == S then",
        "        R = R union {Metadata_i}",
        "    end if",
        "end for",
        "return R"
    ]
)

add_p("The prefix length d=5 hex characters defines 16^5 = 1,048,576 uniform buckets. For a breach catalog containing N records, the expected candidate bucket size is:")
add_equation("E[k] = N / 16^5 = N / 1,048,576", 3)
add_p("The mutual information disclosed to the server regarding the full hash H is bounded by:")
add_equation("I(H; P) <= log_2(16^5) = 20 bits", 4)
add_p("leaving 236 bits of suffix entropy undisclosed.")

add_heading2("B. OTP-Gated Accountable Search Protocol")
add_p("To neutralize automated prefix-bucket enumeration by unauthenticated scrapers, BreachShield restricts search endpoints behind a dual-channel OTP gate:")
add_p("1) Issuance (POST /api/auth/send-otp): The gateway enforces a 30-second resend cooldown per target. A 6-digit code C in [100000, 999999] is generated via crypto.randomInt(). The gateway computes salted bcrypt hash h_C = bcrypt(C, 10) and stores (T, h_C, t_exp) with 5-minute TTL. The code is dispatched out-of-band via Nodemailer or Android DLT SMS gateway.")
add_p("2) Verification (POST /api/auth/verify-otp): Verified with hard limit <= 5 attempts via bcrypt.compare().")
add_p("3) Session Binding: Issues signed JWT tau = Sign_HMAC-SHA256({T, verified: true}, K_jwt) with 1h expiration:")
add_equation("tau = Sign_HMAC-SHA256({T, verified: true}, K_jwt)", 5)
add_p("The gateway strictly enforces the identity invariant:")
add_equation("normalize(T_query) == normalize(tau.target)", 6)
add_p("preventing authenticated users from executing lookups against third-party identifiers.")

# Section V: Audit Logging
add_heading1("V. TAMPER-EVIDENT AUDIT LOGGING")
add_image(os.path.join(figures_dir, "fig_merkle_anchoring.png"), "Fig. 2. Merkle-tree batching structure and on-chain root anchoring workflow.", width_in=3.35)

add_p("To guarantee audit accountability and non-repudiation, BreachShield logs every security event through a deterministic hash tree pipeline [5], [10] (backend/blockchain/merkleBatcher.js).")

add_heading2("A. Canonical Serialization & Leaf Generation")
add_p("To prevent key-ordering serialization discrepancies across runtimes, auditLogger.js normalizes objects into sorted-key canonical JSON representations:")
add_equation("e_i = SHA-256(Canonicalize(Event_i))", 7)

add_heading2("B. Batching Buffer & Merkle Tree Aggregation")
add_p("merkleBatcher.js aggregates leaf hashes into a memory-buffered FIFO queue flushed under two threshold conditions:")
add_equation("Flush Condition = (|Q| >= 100) or (t_now - t_last >= 60s)", 8)
add_p("When triggered, merkleUtils.js: buildMerkleTree() constructs a balanced binary hash tree over leaf set {e_1, ..., e_M}:")
add_equation("N_{j, k} = SHA-256(N_{j-1, 2k} || N_{j-1, 2k+1})", 9)
add_p("yielding a single 32-byte Merkle root R.")

add_heading2("C. Smart Contract Anchoring")
add_p("Root R is anchored on-chain by anchorClient.js, which invokes anchor(bytes32 root) on AnchorRegistry.sol:")
add_equation("Registry[R] = block.timestamp", 10)
add_p("The transaction receipt (block hash, number, transaction ID) is persisted alongside batch metadata. (Currently verified on local Hardhat EVM).")

# Section VI: Machine Learning Evaluation
add_heading1("VI. EXPERIMENTAL MACHINE LEARNING EVALUATION")

add_heading2("A. Curated Breach Dataset")
add_p("To benchmark automated severity assessment models, we constructed a curated ground-truth corpus of 1,034 historical breach incidents categorized into four ordinal severity classes based on credential exposure depth: LOW, MEDIUM, HIGH, and CRITICAL. The dataset was partitioned using a stratified 70/15/15 split (seed 42), summarized in Table I.")

add_table_clean(
    ["Split", "Total", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
    [
        ["Train (70%)", "723", "49", "341", "291", "42"],
        ["Val (15%)", "154", "10", "73", "62", "9"],
        ["Test (15%)", "157", "11", "74", "63", "9"]
    ],
    "TABLE I: DATASET PARTITION AND CLASS DISTRIBUTION",
    col_widths=[1.1, 0.45, 0.45, 0.45, 0.45, 0.45]
)

add_heading2("B. Feature Space Extraction")
add_p("Each breach record was mapped to a 165-dimensional feature vector consisting of: (i) DataClasses Multi-Hot Vector (163 dims): Binary encoding across compromised attributes (Passwords, Email addresses, Credit card numbers, Social Security numbers); (ii) PwnCount (1 dim): log10(PwnCount + 1); and (iii) IsVerified (1 dim): Binary analyst validation.")

add_heading2("C. Comparative Benchmarks")
add_p("We evaluated five classification architectures under identical train/test splits: Naive Baseline, RNN (BiLSTM), Transformer Encoder, 1D-CNN, and XGBoost [7]. Table II presents test set performance (N=157).")

add_table_clean(
    ["Model Architecture", "Accuracy", "Macro F1", "Weighted F1"],
    [
        ["Naive Baseline (Predict MED)", "47.1%", "16.0%", "30.2%"],
        ["RNN (BiLSTM Retrained)", "44.6%", "34.0%", "46.8%"],
        ["Transformer (2L / 4H)", "48.4%", "42.9%", "50.8%"],
        ["1D-CNN (k=3,4,5)", "66.2%", "57.2%", "65.7%"],
        ["XGBoost (Ours)", "89.2%", "83.2%", "89.4%"]
    ],
    "TABLE II: COMPARATIVE MODEL BENCHMARK ON TEST SET (N=157)",
    col_widths=[1.55, 0.6, 0.6, 0.6]
)

add_image(os.path.join(figures_dir, "fig_model_comparison.png"), "Fig. 3. Severity classification benchmark across accuracy, macro F1, and weighted F1.", width_in=3.35)

add_p("Table III provides the per-class precision, recall, and F1 scores for the top architectures.")

add_table_clean(
    ["Model", "Severity Tier", "Precision", "Recall", "F1-Score"],
    [
        ["XGBoost", "LOW", "64.3%", "81.8%", "72.0%"],
        ["", "MEDIUM", "90.7%", "91.9%", "91.3%"],
        ["", "HIGH", "94.9%", "88.9%", "91.8%"],
        ["", "CRITICAL", "77.8%", "77.8%", "77.8%"],
        ["1D-CNN", "LOW", "45.5%", "45.5%", "45.5%"],
        ["", "MEDIUM", "64.2%", "82.4%", "72.2%"],
        ["", "HIGH", "79.1%", "54.0%", "64.2%"],
        ["", "CRITICAL", "50.0%", "44.4%", "47.1%"],
        ["RNN", "LOW", "13.5%", "45.5%", "20.8%"],
        ["", "MEDIUM", "53.6%", "40.5%", "46.2%"],
        ["", "HIGH", "60.7%", "54.0%", "57.1%"],
        ["", "CRITICAL", "12.5%", "11.1%", "11.8%"]
    ],
    "TABLE III: PER-CLASS PRECISION, RECALL, AND F1 SCORES",
    col_widths=[0.65, 0.75, 0.65, 0.65, 0.65]
)

add_image(os.path.join(figures_dir, "fig_per_class_f1.png"), "Fig. 4. Per-class F1 score comparison demonstrating XGBoost resilience across all tiers.", width_in=3.35)

add_p("The confusion matrix for XGBoost across the test set (ordered LOW, MED, HIGH, CRIT) demonstrates favorable adjacent-boundary classification:")
add_equation("M_XGB = [[9, 2, 0, 0], [4, 68, 2, 0], [1, 4, 56, 2], [1, 1, 1, 7]]", 11)
add_p("Of 17 misclassifications, 14 occurred between directly adjacent severity categories (e.g., MEDIUM misclassified as LOW), minimizing severe operational triage errors.")

add_heading2("D. Tabular Bias Analysis & Operational Status")
add_p("The performance advantage of XGBoost over neural architectures (89.2% vs 66.2% for 1D-CNN and 48.4% for Transformer) aligns with empirical tabular literature [8]. Neural attention and recurrent layers assume implicit spatial or temporal continuity, whereas DataClasses represents an unordered, sparse categorical space optimal for orthogonal tree splits.")
add_p("Operational Integration Clarification: XGBoost was evaluated experimentally but is retained as an offline research artifact due to tabular feature contract mismatch in raw text scrapes. Production relies on the regex risk engine alongside live UrlBERT [11]-[13].")

# Section VII: Security Analysis
add_heading1("VII. SECURITY ANALYSIS")
add_heading2("A. Query Privacy & Bulk Enumeration Resistance")
add_p("Against external eavesdroppers (A1), target T is protected by client-side Web Crypto SHA-256 hashing. Recovering T requires inverting 236 bits of suffix entropy, which is computationally infeasible.")
add_p("Against malicious scrapers (A2), unauthenticated requests are rejected with 401 Unauthorized, and authGuard validates the identity binding:")
add_equation("SHA-256(normalize(T_query))[0:5] == P_query", 12)

add_heading2("B. OTP & Authentication Flow Security")
add_p("Entropy space S = 9 x 10^5 possibilities (~19.78 bits), conforming to NIST SP 800-63B [14]. Guessing probability within 5 trials:")
add_equation("P_guess <= 5 / 900,000 ~= 5.56 x 10^-6", 13)
add_p("Secrets are stored as bcrypt hashes (cost=10), defending against database dump extraction (A3), with 300s TTL.")

add_heading2("C. Session Integrity & Transport Security")
add_p("JWTs are signed via HMAC-SHA256 according to RFC 7519 [15], encapsulated with 1h expiry and transmitted via HttpOnly, Secure, SameSite=Strict browser cookies:")
add_equation("Claims = {target: T, verified: true, exp: t + 3600}", 14)

add_heading2("D. Audit Log Integrity & Non-Repudiation")
add_p("Against insider tampering (A5), modifying event e_i' alters the canonical hash and propagates to the Merkle root:")
add_equation("R' = MerkleRoot(e_1, ..., e_i', ..., e_M) != R", 15)
add_p("Because root R is anchored on-chain with block timestamp t_block, retrospective mutation produces a cryptographic mismatch:")
add_equation("Verify(R', Proof_i, Registry[R]) == False", 16)

# Section VIII: Privacy Analysis
add_heading1("VIII. PRIVACY ANALYSIS")
add_heading2("A. k-Anonymity Guarantees & Prefix Disclosure")
add_p("In BreachShield, disclosed quasi-identifier is 20-bit prefix P. The server identifies candidate subset:")
add_equation("D_P = {r in D | SHA-256(normalize(r))[0:5] == P}", 17)
add_p("Anonymity set size k follows Poisson distribution with lambda = N / 2^20. For enterprise catalog of N = 5 x 10^7 records:")
add_equation("E[k] = 50,000,000 / 1,048,576 ~= 47.68", 18)
add_p("The server cannot distinguish which of the ~48 candidate entries was queried.")

add_heading2("B. Identity Linkage & Session Trade-offs")
add_p("Because search queries are gated behind verified sessions to prevent scraping, the server possesses client's session identity T_auth and submitted prefix P_query. Accountable enumeration resistance is explicitly prioritized over complete query unlinkability.")

add_heading2("C. Comparison with Stronger Protocols: PSI")
add_p("Table IV contrasts BreachShield's prefix-bucket model against OPRF-based Private Set Intersection (PSI) [3].")

add_table_clean(
    ["Dimension", "Prefix k-Anonymity", "OPRF-Based PSI"],
    [
        ["Client Compute", "1 SHA-256 evaluation", "EC point multiplications"],
        ["Server Compute", "1 B-Tree index lookup", "1 OPRF eval per item"],
        ["Bandwidth", "Proportional to bucket size", "O(1) constant response"],
        ["Prefix Disclosed", "20 bits revealed", "0 bits (Full privacy)"],
        ["Scraping Resist.", "Mandates OTP gating", "Bounded query evals"],
        ["Client Complexity", "Minimal (Web Crypto API)", "High (WASM / BigInt crypto)"]
    ],
    "TABLE IV: PROTOCOL COMPARISON: PREFIX K-ANONYMITY VS. OPRF-PSI",
    col_widths=[1.1, 1.15, 1.1]
)

# Section IX: Functional Evaluation
add_heading1("IX. FUNCTIONAL EVALUATION")
add_p("We evaluated BreachShield's implemented modules using automated test suites across API gateway, microservices, and database layers:")
add_p("1) Authentication: backend/test/auth_search.test.js verified 30s rate limiting (HTTP 429), bcrypt verification, attempt invalidation (>5), and target mismatch rejection (HTTP 403).")
add_p("2) Range Query: /api/v1/range/:prefix validated with known test hashes; client-side parsing isolated targets while non-compromised inputs yielded empty match sets.")
add_p("3) Concurrency Control: backend/test/challenger_backend.test.js confirmed asyncio.Lock mutex eliminated Telethon SQLite operational collisions under concurrent load.")
add_p("4) Audit Verification: backend/test/verify_audit_integrity.js confirmed canonical sorted JSON serialization, 100-record / 60s batch triggers, and cryptographic Merkle proof invalidation upon bit modification.")
add_p("5) Smart Contract: contracts/AnchorRegistry.sol compiled and deployed on Hardhat; anchor(bytes32) committed root and emitted RootAnchored event.")

# Section X: Limitations
add_heading1("X. LIMITATIONS")
add_p("We identify the following technical constraints in the current implementation:")
add_p("1) Severity Tier Imbalance: In the ML dataset, CRITICAL severity is represented by 9 test instances (5.7%), yielding wider confidence bounds compared to MEDIUM (n=74) and HIGH (n=63).")
add_p("2) Source Coverage Constraints: In OSINT registry, only PublicBreachSource and TelegramScraperSource execute live network queries; PhishingFeedSource and ThreatIntelSource remain stubs.")
add_p("3) Local Blockchain PoC: Audit anchoring operates on local Hardhat EVM; public testnet deployment requires dynamic gas estimation.")
add_p("4) Decoupled ML Pipeline: XGBoost operates as an offline evaluation artifact due to feature availability constraints in raw OSINT data.")
add_p("5) Identity-Query Linkage: Gating search endpoints behind verified OTP sessions links query transactions to verified user sessions.")

# Section XI: Future Work & Conclusion
add_heading1("XI. FUTURE WORK & CONCLUSION")
add_p("Immediate extensions include integrating SMOTE-based class balancing [9] for the CRITICAL severity tier, implementing live connectors for stubbed threat feeds, and deploying AnchorRegistry to an EVM testnet. Long-term research will explore migrating from prefix k-anonymity to OPRF-based Private Set Intersection (PSI).")
add_p("BreachShield demonstrates an effective privacy-preserving breach intelligence platform that resolves the structural query-surveillance paradox of credential monitoring. By pairing client-side k-anonymity range queries with out-of-band carrier-compliant OTP identity gating, multi-source asynchronous OSINT scraping, heuristic and machine-learning risk evaluation, and Merkle-tree batched smart contract audit anchoring, the platform establishes robust query privacy alongside strong operational auditability.")

# Acknowledgment
add_heading2("Acknowledgment")
add_p("The authors thank Assistant Professor Sushma T. M. for guidance and project coordination throughout this research.")

# References
add_heading1("REFERENCES")
references = [
    "[1] A. Aljofey, Q. Jiang, Q. Qu, M. Huang, and J.-P. Niyigena, \"An effective phishing detection model based on character level convolutional neural network from URL,\" Electronics, vol. 9, no. 9, p. 1514, 2020.",
    "[2] P. Kuhn, K. Wittorf, and C. Reuter, \"Navigating the shadows: Manual and semi-automated evaluation of the dark web for cyber threat intelligence,\" IEEE Access, vol. 12, pp. 45112-45128, 2024.",
    "[3] L. Li, B. Pal, J. Ali, N. Sullivan, R. Chatterjee, and T. Ristenpart, \"Protocols for checking compromised credentials,\" in Proc. ACM SIGSAC Conf. Comput. Commun. Secur. (CCS), 2019, pp. 1387-1403.",
    "[4] L. Sweeney, \"k-anonymity: A model for protecting privacy,\" Int. J. Uncertainty, Fuzziness Knowl.-Based Syst., vol. 10, no. 5, pp. 557-570, 2002.",
    "[5] S. A. Crosby and D. S. Wallach, \"Efficient data structures for tamper-evident logging,\" in Proc. 18th USENIX Secur. Symp., 2009, pp. 317-334.",
    "[6] A. Arabnouri, S. Eissazadeh, and A. Shafieinejad, \"A secure auditable log based on blockchain,\" Monadi, vol. 13, no. 2, pp. 75-86, 2024.",
    "[7] T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in Proc. 22nd ACM SIGKDD Int. Conf. Knowl. Discov. Data Min., 2016, pp. 785-794.",
    "[8] L. Grinsztajn, E. Oyallon, and G. Varoquaux, \"Why do tree-based models still outperform deep learning on typical tabular data?\" in Adv. Neural Inf. Process. Syst. (NeurIPS), vol. 35, 2022, pp. 507-520.",
    "[9] F. S. Alsubaei, A. A. Almazroi, and N. Ayub, \"Enhancing phishing detection: A novel hybrid deep learning framework for cybercrime forensics,\" IEEE Access, vol. 12, pp. 8373-8389, 2024.",
    "[10] R. C. Merkle, \"A digital signature based on a conventional encryption function,\" in Adv. Cryptol. - CRYPTO '87, Springer, 1988, pp. 369-378.",
    "[11] O. K. Sahingoz, E. Buber, and E. Kugu, \"DEPHIDES: Deep learning based phishing detection system,\" IEEE Access, vol. 12, pp. 8052-8070, 2024.",
    "[12] B. V. Pavani, D. Mahitha, and B. Uma Maheswari, \"Enhancing online safety: Phishing URL detection using machine learning and explainable AI,\" in Proc. 15th Int. Conf. Comput., Commun. Netw. Technol. (ICCCNT), IEEE, 2024, pp. 1-6.",
    "[13] M. Tawfik, A. A. Abu-Ein, A. H. Abdelhaliem, Y. M. Al-Sharo, and I. S. Fathi, \"Explainable few-shot learning with modern BERT for detecting emerging phishing attacks using XF-PhishBERT,\" Sci. Rep., vol. 15, no. 1, p. 42821, 2025.",
    "[14] P. Grassi, M. Garcia, and J. Fenton, \"Digital identity guidelines: Authentication and lifecycle management,\" NIST Special Publication 800-63B, Gaithersburg, MD, 2020.",
    "[15] M. Jones, J. Bradley, and N. Sakimura, \"JSON Web Token (JWT),\" RFC 7519, May 2015."
]

for ref in references:
    p_ref = doc.add_paragraph()
    p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ref.paragraph_format.space_before = Pt(1)
    p_ref.paragraph_format.space_after = Pt(2)
    p_ref.paragraph_format.line_spacing = 1.0
    r = p_ref.add_run(ref)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(8.0)

doc.save(output_docx)
print(f"Document saved successfully at: {output_docx}")
