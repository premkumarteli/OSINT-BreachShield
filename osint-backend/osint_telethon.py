from telethon import TelegramClient, events
import sys
import asyncio

import os

# Prefer environment variables for secrets; fall back to the values below if not set
api_id = os.environ.get('TG_API_ID', '28444606')
api_hash = os.environ.get('TG_API_HASH', '409411e66ccb00968523f446d30cded9')
phone = os.environ.get('TG_PHONE', '+917337771210')
bot_username = os.environ.get('TG_BOT_USERNAME', 'The_Devil_OSINT_bot')

# Normalize common phone formats: if user provided a 10-digit Indian number, prepend +91
if phone.isdigit() and len(phone) == 10:
    phone = '+91' + phone
elif phone.startswith('0') and phone[1:].isdigit():
    # convert 0XXXXXXXXXX to +country? just keep it but warn
    phone = phone

print(f"Using api_id={api_id}, phone={phone}, bot={bot_username}")

async def main(query):
    client = TelegramClient('osint_session', api_id, api_hash)
    await client.start(phone=phone)

    await client.send_message(bot_username, query)

    @client.on(events.NewMessage(from_users=bot_username))
    async def handler(event):
        print(event.text)
        await client.disconnect()

    await client.run_until_disconnected()

if __name__ == '__main__':
    query = sys.argv[1] if len(sys.argv) > 1 else input('Enter query: ')
    asyncio.run(main(query))


