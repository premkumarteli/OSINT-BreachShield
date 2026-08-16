"""
Flask micro-service for sending and verifying SMS OTP via Fast2SMS.

Features:
- /send-otp: Accepts a phone number, sends a 6-digit OTP via Fast2SMS, and stores it in SQLite.
- /verify-otp: Verifies the OTP for the given phone. Deletes it once used.
- Resend cooldown: 30 seconds
- OTP TTL: 5 minutes
- Env loader: python-dotenv via load_env()

This module is intentionally self-contained and safe to run alongside the existing FastAPI app.
"""

from __future__ import annotations

import os
import sqlite3
import time
import secrets
from typing import Optional, Tuple

from flask import Flask, jsonify, request
from dotenv import load_dotenv as _load_dotenv
import httpx


# -----------------------------
# Configuration / Environment
# -----------------------------
def load_env() -> None:
	"""Load environment variables from a local .env if present.

	Uses python-dotenv; safe to call multiple times. Does nothing if .env is
	absent. Call this early so FAST2SMS_API_KEY is available.
	"""
	# Do not throw if missing; this enables flexible deployments.
	_load_dotenv(override=False)


load_env()


# -----------------------------
# Flask App Factory
# -----------------------------
def create_app() -> Flask:
	app = Flask(__name__)

	# Locate SQLite DB inside this package's instance/ folder
	base_dir = os.path.dirname(os.path.abspath(__file__))
	instance_dir = os.path.join(base_dir, 'instance')
	os.makedirs(instance_dir, exist_ok=True)
	db_path = os.path.join(instance_dir, 'osint.db')

	OTP_TTL_SEC = 5 * 60  # 5 minutes
	RESEND_COOLDOWN_SEC = 30  # 30 seconds

	# -----------------------------
	# Database helpers
	# -----------------------------
	def get_db() -> sqlite3.Connection:
		conn = sqlite3.connect(db_path)
		conn.row_factory = sqlite3.Row
		return conn

	def init_db() -> None:
		with get_db() as conn:
			# Table with required columns only: id, contact, otp, expires_at
			conn.execute(
				"""
				CREATE TABLE IF NOT EXISTS otp_store (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					contact TEXT NOT NULL,
					otp TEXT NOT NULL,
					expires_at INTEGER NOT NULL
				)
				"""
			)
			conn.commit()

	init_db()

	# -----------------------------
	# Utility helpers
	# -----------------------------
	def normalize_phone(raw: str) -> str:
		"""Keep digits only; drop leading +. Fast2SMS expects comma-separated numbers.
		"""
		digits = ''.join(ch for ch in (raw or '') if ch.isdigit())
		return digits

	def generate_otp() -> str:
		# Cryptographically secure 6-digit with leading zeros preserved
		return f"{secrets.randbelow(1_000_000):06d}"

	def last_request_info(conn: sqlite3.Connection, contact: str) -> Optional[Tuple[int, int]]:
		"""Return (created_at, expires_at) for the most recent OTP for a contact, or None.
		Since we only store expires_at, derive created_at as expires_at - OTP_TTL_SEC.
		"""
		cur = conn.execute(
			"SELECT expires_at FROM otp_store WHERE contact=? ORDER BY id DESC LIMIT 1",
			(contact,),
		)
		row = cur.fetchone()
		if not row:
			return None
		expires_at = int(row['expires_at'])
		created_at = expires_at - OTP_TTL_SEC
		return created_at, expires_at

	def cleanup_expired(now_ts: Optional[int] = None) -> int:
		"""Delete expired OTP rows and return count deleted. Logs when any expired.
		"""
		now_ts = int(time.time()) if now_ts is None else int(now_ts)
		with get_db() as conn:
			cur = conn.execute("SELECT COUNT(*) AS c FROM otp_store WHERE expires_at < ?", (now_ts,))
			count = int(cur.fetchone()[0])
			if count:
				print(f"[OTP][CLEANUP] Deleting {count} expired OTP entr{'y' if count==1 else 'ies'}")
				conn.execute("DELETE FROM otp_store WHERE expires_at < ?", (now_ts,))
				conn.commit()
		return count

	# -----------------------------
	# Fast2SMS helper
	# -----------------------------
	def send_sms_fast2sms(phone: str, otp: str) -> Tuple[bool, str]:
		"""Send OTP via Fast2SMS. Returns (ok, message).

		Uses GET https://www.fast2sms.com/dev/bulkV2
		Params: authorization, route=otp, variables_values, numbers
		"""
		# Dry run mode: skip external call for local testing
		if os.environ.get('FAST2SMS_DRY_RUN', '').strip() in {'1', 'true', 'yes'}:
			print(f"[OTP][SEND][DRY-RUN] phone=***{phone[-4:]} otp={otp}")
			return True, 'DRY_RUN: OTP logged to console'

		api_key = os.environ.get('FAST2SMS_API_KEY')
		if not api_key:
			return False, 'FAST2SMS_API_KEY not configured'

		url = 'https://www.fast2sms.com/dev/bulkV2'
		params = {
			'authorization': api_key,
			'route': 'otp',
			'variables_values': otp,
			'numbers': phone,
		}
		try:
			with httpx.Client(timeout=10.0) as client:
				resp = client.get(url, params=params, headers={'accept': 'application/json'})
		except Exception as exc:
			return False, f'Fast2SMS request failed: {exc}'

		if resp.status_code < 200 or resp.status_code >= 300:
			hint = 'Fast2SMS error'
			if resp.status_code == 401:
				hint = 'Invalid or missing Fast2SMS API key'
			elif 400 <= resp.status_code < 500:
				hint = f'Fast2SMS client error ({resp.status_code})'
			elif resp.status_code >= 500:
				hint = 'Fast2SMS server error'
			try:
				data = resp.json()
				detail = data.get('message') or data.get('error') or str(data)
			except Exception:
				detail = resp.text[:200]
			return False, f'{hint}: {detail}'

		try:
			data = resp.json()
			if isinstance(data, dict) and 'return' in data and not bool(data['return']):
				return False, str(data.get('message') or 'Fast2SMS rejected request')
		except Exception:
			pass
		return True, 'OTP sent'

	# -----------------------------
	# Endpoint: /send-otp (primary) and /send-sms-otp (alias)
	# -----------------------------
	def _send_otp_handler():
		try:
			cleanup_expired()

			payload = request.get_json(silent=True) or {}
			contact = (
				payload.get('phone')
				or payload.get('contact')
				or request.args.get('phone')
				or request.args.get('contact')
			)
			if not contact:
				return jsonify({ 'success': False, 'error': 'Missing phone' }), 400

			phone = normalize_phone(contact)
			if not phone or len(phone) < 8:
				return jsonify({ 'success': False, 'error': 'Invalid phone number' }), 400

			now = int(time.time())

			# Enforce resend cooldown per contact (30s)
			with get_db() as conn:
				info = last_request_info(conn, phone)
				if info:
					created_at, _expires_at = info
					if now < created_at + RESEND_COOLDOWN_SEC:
						wait = (created_at + RESEND_COOLDOWN_SEC) - now
						return jsonify({ 'success': False, 'error': f'Resend allowed in {wait}s' }), 429

			otp = generate_otp()

			ok, msg = send_sms_fast2sms(phone, otp)
			if not ok:
				return jsonify({ 'success': False, 'error': msg }), 502

			# Store OTP after successful send
			expires_at = now + OTP_TTL_SEC
			with get_db() as conn:
				conn.execute(
					'INSERT INTO otp_store (contact, otp, expires_at) VALUES (?, ?, ?)',
					(phone, otp, expires_at),
				)
				conn.commit()

			# Log send event
			print(f"[OTP][SEND] phone=***{phone[-4:]} expires_in={OTP_TTL_SEC}s")

			return jsonify({ 'success': True, 'message': 'OTP sent' })
		except Exception as exc:
			return jsonify({ 'success': False, 'error': f'Unexpected error: {str(exc)}' }), 500

	@app.post('/send-otp')
	def send_otp_primary():
		return _send_otp_handler()

	@app.post('/send-sms-otp')
	def send_otp_alias():
		# Backward compatibility
		return _send_otp_handler()

	# -----------------------------
	# Endpoint: /verify-otp
	# -----------------------------
	@app.post('/verify-otp')
	def verify_otp():
		try:
			cleanup_expired()

			payload = request.get_json(silent=True) or {}
			contact = (
				payload.get('phone')
				or payload.get('contact')
				or request.args.get('phone')
				or request.args.get('contact')
			)
			otp_in = (payload.get('otp') or request.args.get('otp') or '').strip()
			if not contact or not otp_in:
				return jsonify({ 'success': False, 'error': 'Missing phone or otp' }), 400

			phone = normalize_phone(contact)
			if not phone or not otp_in.isdigit() or len(otp_in) != 6:
				return jsonify({ 'success': False, 'error': 'Invalid phone or otp format' }), 400

			now = int(time.time())
			with get_db() as conn:
				cur = conn.execute(
					'SELECT id, otp, expires_at FROM otp_store WHERE contact=? ORDER BY id DESC LIMIT 1',
					(phone,),
				)
				row = cur.fetchone()
				if not row:
					return jsonify({ 'success': False, 'error': 'OTP not found. Please request a new one.' }), 404

				otp_db = str(row['otp'])
				expires_at = int(row['expires_at'])
				row_id = int(row['id'])

				if now > expires_at:
					# Log expire event and delete row
					print(f"[OTP][EXPIRE] phone=***{phone[-4:]} row_id={row_id}")
					conn.execute('DELETE FROM otp_store WHERE id=?', (row_id,))
					conn.commit()
					return jsonify({ 'success': False, 'error': 'OTP expired. Please request a new one.' }), 410

				if otp_in != otp_db:
					print(f"[OTP][VERIFY][INVALID] phone=***{phone[-4:]} row_id={row_id}")
					return jsonify({ 'success': False, 'error': 'Invalid OTP' }), 401

				# Success: delete to prevent reuse
				conn.execute('DELETE FROM otp_store WHERE id=?', (row_id,))
				conn.commit()

			print(f"[OTP][VERIFY][OK] phone=***{phone[-4:]}")
			return jsonify({ 'success': True, 'message': 'OTP verified' })
		except Exception as exc:
			return jsonify({ 'success': False, 'error': f'Unexpected error: {str(exc)}' }), 500

	return app


# Expose default app for gunicorn/flask run
app = create_app()

if __name__ == '__main__':
	# Local dev server: flask_app runs on 5055 by default
	port = int(os.environ.get('FLASK_PORT', '5055'))
	app.run(host='127.0.0.1', port=port, debug=True)

