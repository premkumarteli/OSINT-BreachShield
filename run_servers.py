#!/usr/bin/env python3
"""
OSINT BreachShield - Unified Server Runner
Starts:
  1. Python FastAPI service on port 8001
  2. Node.js Express backend on port 5000
  3. React Frontend on port 3000

Handles process lifecycle, log streaming with prefixes, health checks, and graceful shutdown.
"""

import os
import sys
import time
import signal
import socket
import urllib.request
import webbrowser
import subprocess
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_DIR = os.path.join(BASE_DIR, 'services', 'python-scraper')
BACKEND_DIR = os.path.join(BASE_DIR, 'services', 'api-gateway')
FRONTEND_DIR = os.path.join(BASE_DIR, 'apps', 'web-dashboard')

# Colors for terminal output
CYAN = '\033[96m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
MAGENTA = '\033[95m'
RESET = '\033[0m'
BOLD = '\033[1m'

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

processes = []

def print_banner():
    banner = f"""{CYAN}{BOLD}
 ================================================================
       OSINT BREACHSHIELD - UNIFIED SERVER LAUNCHER
 ================================================================
  - Python FastAPI Service : http://localhost:8001
  - Node.js Express Backend : http://localhost:5000
  - React Frontend App     : http://localhost:3000
 ================================================================{RESET}
"""
    print(banner)

def find_python():
    candidates = [
        os.path.join(PYTHON_DIR, '.venv', 'Scripts', 'python.exe'),
        os.path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe'),
        os.path.join(PYTHON_DIR, 'venv', 'Scripts', 'python.exe'),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return sys.executable

def find_npm():
    if sys.platform == 'win32':
        return 'npm.cmd'
    return 'npm'

def find_node():
    return 'node'

def is_port_open(host, port, timeout=1.0):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

def stream_log(process, prefix, color):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            clean_line = line.rstrip()
            if clean_line:
                print(f"{color}[{prefix}]{RESET} {clean_line}")
    except Exception:
        pass

def wait_for_service(url, name, max_retries=30, delay=1.0):
    print(f"{YELLOW}[LAUNCHER] Waiting for {name} ({url})...{RESET}")
    for _ in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'HealthCheck/1.0'})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status in (200, 204):
                    print(f"{GREEN}[LAUNCHER] [OK] {name} is READY!{RESET}")
                    return True
        except Exception:
            time.sleep(delay)
    print(f"{YELLOW}[LAUNCHER] [WARN] {name} did not respond within timeout, continuing...{RESET}")
    return False

def shutdown(signum=None, frame=None):
    print(f"\n{RED}[LAUNCHER] Stopping all services...{RESET}")
    for p, name in reversed(processes):
        try:
            if p.poll() is None:
                print(f"{YELLOW}[LAUNCHER] Terminating {name}...{RESET}")
                if sys.platform == 'win32':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
        except Exception as e:
            pass
    print(f"{GREEN}[LAUNCHER] All services stopped cleanly.{RESET}")
    sys.exit(0)

def main():
    print_banner()

    # Register exit handlers
    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, shutdown)

    python_bin = find_python()
    npm_bin = find_npm()
    node_bin = find_node()

    print(f"{CYAN}[LAUNCHER] Python Binary:{RESET} {python_bin}")
    print(f"{CYAN}[LAUNCHER] Node Binary  :{RESET} {node_bin}")
    print(f"{CYAN}[LAUNCHER] NPM Binary   :{RESET} {npm_bin}\n")

    start_telegram = "--telegram" in sys.argv or os.environ.get("ENABLE_TELEGRAM_SCRAPER") == "true"

    # 1. Start Python FastAPI Service (Optional: only if --telegram is passed)
    if start_telegram:
        fastapi_cmd = [python_bin, "-m", "uvicorn", "osint_service:app", "--host", "127.0.0.1", "--port", "8001"]
        print(f"{MAGENTA}[1/3] Starting Python FastAPI Service on port 8001...{RESET}")
        p_fastapi = subprocess.Popen(
            fastapi_cmd,
            cwd=PYTHON_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append((p_fastapi, "FastAPI (8001)"))
        threading.Thread(target=stream_log, args=(p_fastapi, "FastAPI", MAGENTA), daemon=True).start()
        wait_for_service("http://127.0.0.1:8001/health", "FastAPI (8001)", max_retries=15)
    else:
        print(f"{CYAN}[INFO] Telegram Bot Scraper is OFF (relying on Local k-Anonymity & 1,027-Breach Store). Pass --telegram to enable.{RESET}")

    # 2. Start Node.js Express Backend (Port 5000)
    node_cmd = [node_bin, "index.js"]
    print(f"{CYAN}[2/3] Starting Node.js Express Backend on port 5000...{RESET}")
    p_node = subprocess.Popen(
        node_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append((p_node, "Node.js (5000)"))
    threading.Thread(target=stream_log, args=(p_node, "NodeJS ", CYAN), daemon=True).start()

    # Wait for Node.js backend to become healthy
    wait_for_service("http://localhost:5000/health", "Node.js (5000)", max_retries=15)

    # 3. Start React Frontend (Port 3000)
    frontend_env = os.environ.copy()
    frontend_env["BROWSER"] = "none"  # Prevent double browser tab
    print(f"{GREEN}[3/3] Starting React Frontend on port 3000...{RESET}")
    p_react = subprocess.Popen(
        f"{npm_bin} start" if sys.platform == 'win32' else [npm_bin, "start"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=frontend_env,
        shell=(sys.platform == 'win32')
    )
    processes.append((p_react, "React (3000)"))
    threading.Thread(target=stream_log, args=(p_react, "React  ", GREEN), daemon=True).start()

    # Wait for React frontend
    wait_for_service("http://localhost:3000", "React Frontend (3000)", max_retries=30)

    # Open Browser once everything is verified running
    print(f"\n{GREEN}{BOLD}>>> All systems operational! Opening http://localhost:3000 in browser...{RESET}\n")
    try:
        webbrowser.open("http://localhost:3000")
    except Exception:
        pass

    print(f"{YELLOW}[PRESS CTRL+C TO STOP ALL SERVERS]{RESET}\n")

    # Keep main thread alive
    while True:
        time.sleep(1)

if __name__ == '__main__':
    main()
