from telethon import TelegramClient, events
from fastapi import # Endpoint for pagination - click the right arrow button
@app.post('/next-page')
async def get_next_page():
    """Click the right arrow button in the bot interface to get next page."""
    try:
        queue = asyncio.Queue()

        @client.on(events.NewMessage(from_users=bot_username))
        async def handler(ev):
            await queue.put(ev.text)

        # Get the bot entity
        bot_entity = await client.get_entity(bot_username)
        
        # Get recent messages to find the one with inline buttons
        messages = await client.get_messages(bot_entity, limit=5)
        
        # Find the message with inline keyboard (pagination buttons)
        target_message = None
        for msg in messages:
            if msg.reply_markup and hasattr(msg.reply_markup, 'rows'):
                target_message = msg
                break
        
        if not target_message:
            raise HTTPException(status_code=404, detail='No message with pagination buttons found')
        
        # Find the right arrow button and click it
        for row in target_message.reply_markup.rows:
            for button in row.buttons:
                if hasattr(button, 'text') and ('▶' in button.text or '➡' in button.text or 'Next' in button.text):
                    # Click the button
                    await client(button.click())
                    breakException
from pydantic import BaseModel
import asyncio
import os

api_id = int(os.environ.get('TG_API_ID', '28444606'))
api_hash = os.environ.get('TG_API_HASH', '409411e66ccb00968523f446d30cded9')
phone = os.environ.get('TG_PHONE', '+919380175597')
bot_username = os.environ.get('TG_BOT_USERNAME', 'The_Devil_OSINT_bot')

app = FastAPI()

class Query(BaseModel):
    query: str

session_name = os.environ.get('TG_SESSION', 'osint_service_session')
print(f"Using session file: {session_name}")
client = TelegramClient(session_name, api_id, api_hash)

# We'll run the Telethon client in a background task
@app.on_event('startup')
async def startup_event():
    await client.start(phone=phone)

# Endpoint to send a query and wait for a response
@app.post('/query')
async def send_query(q: Query):
    """Send query to bot and collect multiple consecutive messages (pages).
    We collect messages until there's a short silence (timeout) after the last received message.
    """
    queue = asyncio.Queue()

    @client.on(events.NewMessage(from_users=bot_username))
    async def handler(ev):
        await queue.put(ev.text)

    # send the query
    await client.send_message(bot_username, q.query)

    # collect messages until silence
    messages = []
    try:
        # wait for the first message (longer timeout)
        first = await asyncio.wait_for(queue.get(), timeout=30.0)
        messages.append(first)
        # then collect any immediately following messages with short timeout
        while True:
            try:
                nxt = await asyncio.wait_for(queue.get(), timeout=5.0)
                messages.append(nxt)
            except asyncio.TimeoutError:
                break
    except asyncio.TimeoutError:
        client.remove_event_handler(handler)
        raise HTTPException(status_code=504, detail='No response from bot')
    finally:
        client.remove_event_handler(handler)

    # return messages as an array of packet objects (preserve order)
    packets = [{'info': m} for m in messages]
    # also include a legacy 'response' concatenation for older callers
    full_text = "\n\n".join(messages)
    return {'packets': packets, 'response': full_text}

# Endpoint for pagination - send "➡️" to get next page
@app.post('/next-page')
async def get_next_page():
    """Send ➡️ to bot and wait for the next page response."""
    try:
        queue = asyncio.Queue()

        @client.on(events.NewMessage(from_users=bot_username))
        async def handler(ev):
            await queue.put(ev.text)

        # send the next page command - try the right arrow character
        await client.send_message(bot_username, "▶")

        # collect response messages
        messages = []
        try:
            # wait for the first message (longer timeout)
            first = await asyncio.wait_for(queue.get(), timeout=30.0)
            messages.append(first)
            # then collect any immediately following messages with short timeout
            while True:
                try:
                    nxt = await asyncio.wait_for(queue.get(), timeout=5.0)
                    messages.append(nxt)
                except asyncio.TimeoutError:
                    break
        except asyncio.TimeoutError:
            client.remove_event_handler(handler)
            raise HTTPException(status_code=504, detail='No response from bot')
        finally:
            client.remove_event_handler(handler)

        # return messages as an array of packet objects (preserve order)
        packets = [{'info': m} for m in messages]
        full_text = "\n\n".join(messages)
        return {'packets': packets, 'response': full_text}
    
    except Exception as e:
        # Don't crash the service, just return an error
        print(f"Error in next-page endpoint: {e}")
        raise HTTPException(status_code=500, detail=f'Error getting next page: {str(e)}')

# Endpoint for previous page - click the left arrow button
@app.post('/prev-page')
async def get_prev_page():
    """Click the left arrow button in the bot interface to get previous page."""
    try:
        queue = asyncio.Queue()

        @client.on(events.NewMessage(from_users=bot_username))
        async def handler(ev):
            await queue.put(ev.text)

        # Get the bot entity
        bot_entity = await client.get_entity(bot_username)
        
        # Get recent messages to find the one with inline buttons
        messages = await client.get_messages(bot_entity, limit=5)
        
        # Find the message with inline keyboard (pagination buttons)
        target_message = None
        for msg in messages:
            if msg.reply_markup and hasattr(msg.reply_markup, 'rows'):
                target_message = msg
                break
        
        if not target_message:
            raise HTTPException(status_code=404, detail='No message with pagination buttons found')
        
        # Find the left arrow button and click it
        for row in target_message.reply_markup.rows:
            for button in row.buttons:
                if hasattr(button, 'text') and ('◀' in button.text or '⬅' in button.text or 'Prev' in button.text):
                    # Click the button
                    await client(button.click())
                    break

        # collect response messages
        messages = []
        try:
            # wait for the first message (longer timeout)
            first = await asyncio.wait_for(queue.get(), timeout=30.0)
            messages.append(first)
            # then collect any immediately following messages with short timeout
            while True:
                try:
                    nxt = await asyncio.wait_for(queue.get(), timeout=5.0)
                    messages.append(nxt)
                except asyncio.TimeoutError:
                    break
        except asyncio.TimeoutError:
            client.remove_event_handler(handler)
            raise HTTPException(status_code=504, detail='No response from bot')
        finally:
            client.remove_event_handler(handler)

        # return messages as an array of packet objects (preserve order)
        packets = [{'info': m} for m in messages]
        full_text = "\n\n".join(messages)
        return {'packets': packets, 'response': full_text}
    
    except Exception as e:
        # Don't crash the service, just return an error
        print(f"Error in prev-page endpoint: {e}")
        raise HTTPException(status_code=500, detail=f'Error getting previous page: {str(e)}')

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8001)
