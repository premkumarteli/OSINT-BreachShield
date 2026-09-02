import os
import sys
from telethon import TelegramClient

api_id = int(os.environ.get('TG_API_ID', '28444606'))
api_hash = os.environ.get('TG_API_HASH', '409411e66ccb00968523f446d30cded9')
phone = os.environ.get('TG_PHONE', '+918928868564')
session_name = os.environ.get('TG_SESSION', 'osint_bot_session')

print("==================================================")
print("     TELEGRAM LOGIN / RE-AUTHENTICATION SCRIPT    ")
print("==================================================")
print(f"Phone number: {phone}")
print(f"Session name: {session_name}.session\n")

client = TelegramClient(session_name, api_id, api_hash)

async def main():
    print(f"Connecting to Telegram for phone {phone}...")
    await client.start(phone=phone)
    me = await client.get_me()
    print("\n==================================================")
    print(f"[SUCCESS] Logged in as: {me.first_name} {me.last_name or ''} (@{me.username or 'no_username'})")
    print(f"[SUCCESS] Phone: {me.phone}")
    print(f"[SUCCESS] Fresh session saved to '{session_name}.session'!")
    print("==================================================")
    await client.disconnect()
    
    # Sync session file between root and scraper directory if needed
    try:
        import shutil
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        scraper_dir = os.path.abspath(os.path.dirname(__file__))
        root_sess = os.path.join(root_dir, f"{session_name}.session")
        scraper_sess = os.path.join(scraper_dir, f"{session_name}.session")
        if os.path.exists(root_sess) and root_dir != os.getcwd():
            shutil.copy2(root_sess, scraper_sess)
        elif os.path.exists(f"{session_name}.session"):
            curr_sess = os.path.abspath(f"{session_name}.session")
            if curr_sess != root_sess:
                shutil.copy2(curr_sess, root_sess)
            if curr_sess != scraper_sess:
                shutil.copy2(curr_sess, scraper_sess)
    except Exception as sync_err:
        print(f"[NOTE] Session sync warning: {sync_err}")

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
