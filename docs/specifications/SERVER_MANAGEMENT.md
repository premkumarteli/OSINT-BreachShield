# OSINT Project - Server Management

This project includes convenient batch files to manage all servers for development.

## Quick Start

1. **First time setup** (run once):
   ```
   setup_dependencies.bat
   ```
   This installs all Node.js and Python dependencies.

2. **Start all servers**:
   ```
   start_all_servers.bat
   ```
   This starts:
   - Python FastAPI service on port 8001
   - Node.js backend on port 5000  
   - React frontend on port 3000

3. **Stop all servers**:
   ```
   stop_all_servers.bat
   ```
   This kills all processes running on the project ports.

## Services

- **Frontend**: http://localhost:3000 (React app)
- **Backend API**: http://localhost:5000 (Node.js Express server)
- **Python Service**: http://localhost:8001 (FastAPI for Telegram integration)

## Manual Commands

If you prefer to start services manually:

### Backend (Python FastAPI)
```bash
cd osint-backend
python -m uvicorn osint_service:app --host 0.0.0.0 --port 8001 --reload
```

### Backend (Node.js)
```bash
cd osint-backend
node index.js
```

### Frontend (React)
```bash
cd osint-frontend
npm start
```

## Notes

- Each service runs in its own terminal window when using the batch files
- The Python service requires Telegram API credentials in environment variables or defaults
- The React frontend will automatically open in your browser
- All services support hot reloading during development