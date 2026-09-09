import sqlite3
import os

paths = [
    'osint_bot_session.session',
    'scraper/osint_bot_session.session',
    'scraper/osint_service_session.session'
]

for p in paths:
    if os.path.exists(p):
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        try:
            cur.execute("PRAGMA table_info(sessions)")
            cols = [col[1] for col in cur.fetchall()]
            if 'tmp_auth_key' not in cols or len(cols) != 6:
                print(f"Ensuring 6-column Telethon 1.44 schema for {p}...")
                cur.execute("SELECT dc_id, server_address, port, auth_key, takeout_id FROM sessions")
                rows = cur.fetchall()
                cur.execute("DROP TABLE sessions")
                cur.execute("""CREATE TABLE sessions (
                    dc_id INTEGER PRIMARY KEY,
                    server_address TEXT,
                    port INTEGER,
                    auth_key BLOB,
                    takeout_id INTEGER,
                    tmp_auth_key BLOB
                )""")
                for r in rows:
                    cur.execute("INSERT INTO sessions (dc_id, server_address, port, auth_key, takeout_id, tmp_auth_key) VALUES (?, ?, ?, ?, ?, ?)", (r[0], r[1], r[2], r[3], r[4], None))
                conn.commit()
                print(f"Fixed {p} for Telethon 1.44.")
            else:
                print(f"{p} is already Telethon 1.44 schema.")
        except Exception as e:
            print(f"Error on {p}: {e}")
        finally:
            conn.close()
h}')

