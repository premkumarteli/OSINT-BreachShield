import os
import sys
from telethon import TelegramClient
from dotenv import load_dotenv

dotenv_paths = [
    os.path.join(os.path.dirname(__file__), '.env'),
    os.path.join(os.path.dirname(__file__), '..', '.env')
]
for p in dotenv_paths:
    if os.path.exists(p):
        load_dotenv(p)

api_id_raw = os.environ.get('TG_API_ID')
api_hash = os.environ.get('TG_API_HASH')
phone = os.environ.get('TG_PHONE')
session_env = os.environ.get('TG_SESSION', 'osint_bot_session')

if not os.path.isabs(session_env):
    session_name = os.path.abspath(os.path.join(os.path.dirname(__file__), session_env))
else:
    session_name = os.path.abspath(session_env)

if not api_id_raw or not api_hash or not phone:
    print("[ERROR] Missing required Telegram credentials.", file=sys.stderr)
    print("Set TG_API_ID, TG_API_HASH, and TG_PHONE in your .env file.", file=sys.stderr)
    sys.exit(1)

try:
    api_id = int(api_id_raw)
except ValueError:
    print(f"[ERROR] TG_API_ID must be an integer, received: {api_id_raw}", file=sys.stderr)
    sys.exit(1)

print("==================================================")
print("     TELEGRAM LOGIN / RE-AUTHENTICATION SCRIPT    ")
print("==================================================")
print(f"Phone number: {phone}")
print(f"Session path: {session_name}.session\n")

try:
    client = TelegramClient(session_name, api_id=api_id, api_hash=api_hash)
except TypeError:
    # Fallback for older Telethon versions
    client = TelegramClient(session_name, api_id, api_hash)

async def main():
    print(f"Connecting to Telegram for phone {phone}...")
    await client.connect()
    
    # Check if already authenticated under a different phone number
    if await client.is_user_authorized():
        try:
            me = await client.get_me()
            clean_target = ''.join(c for c in str(phone) if c.isdigit())
            clean_current = ''.join(c for c in str(me.phone or '') if c.isdigit())
            if clean_target and clean_current and not clean_current.endswith(clean_target[-10:]):
                print(f"\n[NOTICE] Existing session belongs to phone +{me.phone}.")
                print(f"[NOTICE] Logging out old account to switch to new phone: {phone}...\n")
                await client.log_out()
        except Exception as e:
            print(f"[WARNING] Could not verify existing session account: {e}")

    await client.start(phone=phone)
    me = await client.get_me()
    print("\n==================================================")
    print(f"[SUCCESS] Logged in as: {me.first_name} {me.last_name or ''} (@{me.username or 'no_username'})")
    print(f"[SUCCESS] Phone: +{me.phone}")
    print(f"[SUCCESS] Fresh session saved to '{session_name}.session'!")
    print("==================================================")
    await client.disconnect()
    
    # Sync session file between root and scraper directory if needed
    try:
        import shutil
        session_base = os.path.splitext(os.path.basename(session_env))[0]
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        scraper_dir = os.path.abspath(os.path.dirname(__file__))
        root_sess = os.path.join(root_dir, f"{session_base}.session")
        scraper_sess = os.path.join(scraper_dir, f"{session_base}.session")
        source_sess = f"{session_name}.session"

        if os.path.exists(source_sess):
            if source_sess != root_sess:
                try:
                    shutil.copy2(source_sess, root_sess)
                    print(f"[SYNC] Session copied to root: {root_sess}")
                except Exception as e:
                    print(f"[NOTE] Could not update root session file: {e}")
            if source_sess != scraper_sess:
                try:
                    shutil.copy2(source_sess, scraper_sess)
                    print(f"[SYNC] Session copied to scraper: {scraper_sess}")
                except Exception as e:
                    print(f"[NOTE] Could not update scraper session file: {e}")
    except Exception as sync_err:
        print(f"[NOTE] Session sync warning: {sync_err}")

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
