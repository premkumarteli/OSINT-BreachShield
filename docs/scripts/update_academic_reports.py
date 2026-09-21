import docx

p1_prog = (
    "During this period, the team finalized the system requirements and established the multi-tier monorepo "
    "architecture for BreachShield across the React frontend, Node.js/Express API Gateway, Python FastAPI "
    "scraper service, and native Android Kotlin companion application. Work completed includes:\n"
    "1. Designed and implemented the dual-channel One-Time Password (OTP) verification engine (/api/auth/send-otp, "
    "/api/auth/verify-otp) featuring bcrypt password hashing, a 30-second cooldown timer, and a 5-attempt brute-force "
    "lockout threshold.\n"
    "2. Integrated Nodemailer with Gmail SMTP for email OTP dispatch and developed the initial WebSocket gateway "
    "endpoint (/ws/gateway) to relay mobile SMS verification requests to the companion Android device.\n"
    "3. Configured MySQL 8.0 schema for users, sessions, and email_otps, coupled with an automated JSON-file "
    "fallback storage layer ensuring continuous offline development.\n"
    "4. Scaffolded the React 19 single-page application with a Cyberpunk HUD terminal interface and strict route "
    "gating, enforcing HTTP 403 Forbidden on unauthenticated /api/search lookup attempts.\n"
    "Problems encountered: Mobile carrier DLT spam filtering initially blocked test SMS OTP messages; this was "
    "resolved by standardizing the outbound SMS payload template to conform with telecom regulatory guidelines. "
    "Gmail SMTP authentication drops caused by trailing whitespace in app passwords were eliminated via automated string sanitization."
)

p1_sched = (
    "Implement the client-side zero-knowledge k-anonymity prefix hashing protocol using the browser Web Crypto API; "
    "integrate the live Telegram OSINT threat scraper with Telethon MTProto client under asyncio.Lock concurrency "
    "controls; and design the pluggable BreachSource adapter interface for simultaneous multi-source querying."
)

p1_ref = (
    "[1] P. Grassi, M. Garcia, and J. Fenton, \"Digital Identity Guidelines: Authentication and Lifecycle Management,\" "
    "NIST Special Publication 800-63B, National Institute of Standards and Technology, Gaithersburg, MD, 2020."
)

p2_prog = (
    "During this period, the team developed and integrated the core privacy-preserving search protocol and "
    "multi-source OSINT aggregation engine. Work completed includes:\n"
    "1. Implemented client-side k-anonymity prefix hashing using the browser's native window.crypto.subtle API "
    "(SHA-256). Only a 5-character prefix is transmitted to the server range API (/api/k-anonymity/range/:prefix), "
    "ensuring raw query identifiers never leave the client unhashed.\n"
    "2. Built the Python FastAPI OSINT scraper service with Telethon MTProto client for monitoring real-time Telegram "
    "threat intelligence channels. Implemented an asyncio.Lock mutex with an 8-second timeout to serialize client "
    "calls, backed by an automated demo_info fallback during bot rate limits.\n"
    "3. Implemented the pluggable BreachSource adapter architecture, integrating the local 1,034-record breach catalog, "
    "live Telegram scraper, and Hudson Rock Infostealer intelligence, combined concurrently via Promise.allSettled.\n"
    "4. Engineered the native Android companion app (Kotlin) with Liquid Glass UI, persistent foreground service, "
    "and WebSocketManager.kt featuring exponential backoff reconnects and offline dispatch polling.\n"
    "Problems encountered: Concurrent API queries triggered sqlite3 database lock errors on the Telethon MTProto "
    "session file. This was resolved by implementing strict mutex serialization with asyncio.Lock around all Telegram "
    "client calls. Search token mismatches on Indian 10-digit phone numbers were resolved with automatic +91 canonicalization."
)

p2_sched = (
    "Train and benchmark machine learning models (XGBoost, CNN, RNN, Transformer) for breach severity classification; "
    "build the cryptographic Merkle tree batching and Solidity smart contract anchoring pipeline for verifiable audit "
    "logging; and execute a full-stack security and adversarial challenge audit."
)

p2_ref = (
    "[1] L. Sweeney, \"k-anonymity: A model for protecting privacy,\" Int. J. Uncertainty, Fuzziness Knowledge-Based "
    "Syst., vol. 10, no. 5, pp. 557-570, 2002."
)

p3_prog = (
    "During this period, the team implemented real machine learning threat scoring, deployed the blockchain audit "
    "trail, and completed full-stack adversarial security hardening. Work completed includes:\n"
    "1. Curated a verified benchmark dataset of 1,034 data breaches from the HaveIBeenPwned catalog and benchmarked four "
    "ML architectures across a stratified 80/20 train/test split: XGBoost achieved 89.2% accuracy and was selected for "
    "production classification over deep learning models (CNN: 66.2%, RNN: 44.6%, Transformer: 48.4%).\n"
    "2. Implemented the blockchain audit logging pipeline: buffered search events into Merkle batches, computed SHA-256 "
    "root hashes, and anchored them on-chain via Solidity smart contract AnchorRegistry.sol deployed on an automated local "
    "Hardhat node with dead-letter queue (DLQ) retry and startup recovery.\n"
    "3. Conducted a comprehensive security audit across all tiers: locked down unauthenticated endpoints, rotated JWT "
    "secret to 128-char crypto-random hex, fixed OTP predictability with crypto.randomInt(), and brought backend test "
    "suite to 94 passing tests (including adversarial challenge suite) and frontend to 26 passing tests.\n"
    "4. Built real-time darkweb watchlist stream via Server-Sent Events (SSE) and integrated offline Ollama LLM threat "
    "intelligence connector for local contextual explanations.\n"
    "Problems encountered: Deploying to Polygon Amoy public testnet suffered from severe RPC rate limits and gas price "
    "spikes that stalled automated testing; the blockchain layer was therefore reliably scoped to an automated local "
    "Hardhat node. Merkle proof loss during server restart recovery was resolved by persisting generated proofs in the "
    "batch record."
)

p3_sched = (
    "Compile the final academic Phase-2 project dissertation and defense presentation slides; conduct end-to-end "
    "integration rehearsals with live Android device relays and local blockchain anchoring; and evaluate production cloud "
    "testnet deployment options for future iterations."
)

p3_ref = (
    "[1] T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in Proc. 22nd ACM SIGKDD Int. Conf. "
    "Knowledge Discovery Data Mining, 2016, pp. 785-794."
)

data = {
    1: {'prog': p1_prog, 'sched': p1_sched, 'ref': p1_ref},
    2: {'prog': p2_prog, 'sched': p2_sched, 'ref': p2_ref},
    3: {'prog': p3_prog, 'sched': p3_sched, 'ref': p3_ref}
}

target_title = 'BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection'

for num in [1, 2, 3]:
    draft_path = f'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/BreachShield_Progress_Report_{num}_DRAFT.docx'
    final_path = f'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/BreachShield_Progress_Report_{num}.docx'
    
    doc = docx.Document(draft_path)
    
    # Update title in table 0 row 3
    doc.tables[0].rows[3].cells[2].text = target_title
    
    # Update paragraphs
    doc.paragraphs[6].text = data[num]['prog']
    doc.paragraphs[10].text = data[num]['sched']
    doc.paragraphs[36].text = data[num]['ref']
    
    # Save final reports
    doc.save(final_path)
    print(f'Successfully generated {final_path}')
    
    # Try updating draft if not locked by Word
    try:
        doc.save(draft_path)
        print(f'Successfully updated {draft_path}')
    except PermissionError:
        print(f'Notice: {draft_path} is currently open in Microsoft Word. Changes saved to {final_path}.')
