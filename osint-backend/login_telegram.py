import os
import sys
from telethon import TelegramClient

api_id = int(os.environ.get('TG_API_ID', '28444606'))
api_hash = os.environ.get('TG_API_HASH', '409411e66ccb00968523f446d30cded9')
phone = os.environ.get('TG_PHONE', '+917337771210')
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

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
