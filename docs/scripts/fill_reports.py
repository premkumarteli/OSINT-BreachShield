import docx
from docx.shared import Pt
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

reports = {
    1: {
        "date_range": "20/07/2026 to 31/07/2026",
        "progress": [
            "Phase 2 project planning and architecture design completed.",
            "Set up dual-service architecture: Node.js backend (port 5000) + Python FastAPI scraper (port 8001).",
            "Implemented email-based OTP authentication system with 300-second cooldown.",
            "Configured JWT token issuance with role-based access control (user/admin).",
            "Set up MySQL 8.0 database for authentication and user management.",
            "Implemented JSON file storage for sessions, audit logs, and Merkle batch queues.",
            "Created React.js frontend with 3-page flow: Search, OTP verification, Results display.",
            "Integrated HIBP API for breach data collection with rate limiting and retry logic.",
            "Implemented client-side k-anonymity hashing using Web Crypto API (SHA-256).",
            "Set up Git version control and project documentation structure.",
            "Deployed frontend to Vercel for testing.",
            "Created backend API routes: /api/auth/send-otp, /api/auth/verify-otp, /api/search.",
            "Implemented session management with sessionStorage and httpOnly cookies.",
            "Configured CORS and security middleware for cross-origin requests.",
        ],
        "problems": [
            "HIBP API rate limiting caused delays in batch testing.",
            "CORS configuration required careful header management for Vercel deployment.",
            "MySQL connection pooling needed optimization for concurrent requests.",
        ],
        "next_work": [
            "Implement ML threat analysis module using Python FastAPI.",
            "Set up Telegram channel monitoring for real-time threat intelligence.",
            "Begin blockchain audit trail implementation.",
            "Train XGBoost model for breach severity classification.",
        ]
    },
    2: {
        "date_range": "01/08/2026 to 15/08/2026",
        "progress": [
            "Implemented Python FastAPI threat analysis service with phishing classifier.",
            "Integrated HuggingFace transformers for phishing URL detection (89% accuracy).",
            "Set up SentenceTransformer for semantic entity correlation.",
            "Implemented real-time Telegram channel monitoring using Telethon API.",
            "Created keyword matching and threat event extraction pipeline.",
            "Trained XGBoost model for breach severity classification (89.2% test accuracy).",
            "Implemented risk scoring engine with rule-based and ML-enhanced risk levels.",
            "Set up model training pipeline with stratified train/test split.",
            "Created ML results documentation with accuracy comparisons.",
            "Implemented Telegram page navigation API (/api/telegram-page, /api/telegram-prev-page).",
            "Set up Python service health monitoring and error handling.",
            "Implemented audit event logging with canonical JSON and SHA-256 hashing.",
            "Created threat intelligence data collection from multiple OSINT sources.",
            "Set up Merkle tree construction for audit log integrity.",
        ],
        "problems": [
            "CNN and RNN models showed poor performance (66.2% and 44.6% accuracy respectively).",
            "Transformer model underperformed baseline (48.4% vs 47.1% baseline).",
            "Telegram API authentication required careful session management.",
            "Model training required GPU resources for reasonable training times.",
        ],
        "next_work": [
            "Complete blockchain integration with Hardhat local node.",
            "Implement Merkle batching and on-chain anchoring.",
            "Conduct security audit and penetration testing.",
            "Prepare Phase 2 presentation and documentation.",
        ]
    },
    3: {
        "date_range": "16/08/2026 to 04/09/2026",
        "progress": [
            "Completed Hardhat local blockchain setup with AnchorRegistry.sol contract.",
            "Implemented automatic contract deployment on server startup (ensureContractDeployed).",
            "Created Merkle batching system with queue management and retry logic.",
            "Implemented dead letter queue for failed batches (max 5 retries).",
            "Fixed corrupted queue quarantine and recovery mechanisms.",
            "Integrated blockchain anchoring into audit logging pipeline.",
            "Conducted comprehensive security audit of entire codebase.",
            "Identified and documented 5 security concerns and 5 bugs.",
            "Fixed JWT secret rotation to 128-char crypto-random hex.",
            "Implemented admin-only access control for audit log routes.",
            "Added input validation for audit event endpoints.",
            "Verified frontend-backend API integration across all routes.",
            "Completed Phase 2 presentation with implementation details.",
            "Documented honest architecture limitations (local chain, ML overfitting).",
            "Achieved 94/94 backend tests passing, 17/17 Merkle tests passing.",
            "Full restart cycle verified: auto-deploy, recover pending batch, anchored on chain.",
        ],
        "problems": [
            "Blockchain anchoring is local-only (not Polygon Amoy as initially planned).",
            "Some ML models (CNN, RNN, Transformer) showed random weight issues.",
            "4 frontend routes call non-existent backend endpoints (dead features).",
            "JWT stored in sessionStorage is vulnerable to XSS attacks.",
        ],
        "next_work": [
            "Deploy blockchain to Polygon Amoy testnet for production use.",
            "Retrain ML models with larger, more diverse datasets.",
            "Implement missing backend routes (/api/auth/me, /api/auth/set-password).",
            "Fix identified security vulnerabilities in authentication flow.",
            "Prepare final project report and documentation.",
        ]
    }
}

for report_num, content in reports.items():
    path = rf'C:\Users\prem\OSINT-breach-Finder-main\docs\Project Work Phase 2_ Report {report_num}.docx'
    doc = docx.Document(path)
    
    # Add progress content at the end of the document
    doc.add_paragraph('')
    doc.add_paragraph(f'Progress Report No. {report_num} ({content["date_range"]}):')
    doc.add_paragraph('')
    
    doc.add_paragraph('Progress:')
    for item in content['progress']:
        p = doc.add_paragraph(f'  - {item}')
        p.paragraph_format.space_after = Pt(2)
    
    doc.add_paragraph('')
    doc.add_paragraph('Problems encountered:')
    for item in content['problems']:
        p = doc.add_paragraph(f'  - {item}')
        p.paragraph_format.space_after = Pt(2)
    
    doc.add_paragraph('')
    doc.add_paragraph('Work schedule and expected results for the next progress:')
    for item in content['next_work']:
        p = doc.add_paragraph(f'  - {item}')
        p.paragraph_format.space_after = Pt(2)
    
    doc.save(path)
    print(f'Report {report_num} updated successfully!')

print('All reports updated!')
