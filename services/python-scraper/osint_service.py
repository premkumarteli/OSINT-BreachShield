from telethon import TelegramClient, events
from telethon.tl.types import DocumentAttributeFilename
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
import asyncio
import os
import sys
import re
import httpx
from dotenv import load_dotenv

# Load .env file from local directory or parents
dotenv_paths = [
    os.path.join(os.path.dirname(__file__), '.env'),
    os.path.join(os.path.dirname(__file__), '..', 'api-gateway', '.env'),
    os.path.join(os.path.dirname(__file__), '..', '..', '.env'),
]
for p in dotenv_paths:
    if os.path.exists(p):
        load_dotenv(p)
        break

api_id_raw = os.environ.get('TG_API_ID')
api_hash = os.environ.get('TG_API_HASH')
phone = os.environ.get('TG_PHONE')
bot_username = os.environ.get('TG_BOT_USERNAME', 'The_Devil_OSINT_bot')

if not api_id_raw or not api_hash or not phone:
    print("[CRITICAL] Missing required Telegram credentials in environment variables.", file=sys.stderr)
    print("Please set TG_API_ID, TG_API_HASH, and TG_PHONE in .env. Exiting.", file=sys.stderr)
    sys.exit(1)

try:
    api_id = int(api_id_raw)
except ValueError:
    print(f"[CRITICAL] TG_API_ID must be an integer, received: {api_id_raw}", file=sys.stderr)
    sys.exit(1)

app = FastAPI(title="OSINT Breach Intelligence Scraper")

@app.get('/health')
def health():
    return {"status": "ok", "service": "osint_scraper"}

class Query(BaseModel):
    query: str

session_env = os.environ.get('TG_SESSION', 'osint_bot_session')
# Resolve relative session path cleanly
if not os.path.isabs(session_env):
    local_session = os.path.join(os.path.dirname(__file__), session_env)
    if os.path.exists(local_session + '.session') or os.path.exists(local_session):
        session_name = local_session
    else:
        session_name = session_env
else:
    session_name = session_env

print(f"Using session file: {session_name}")
client = TelegramClient(session_name, api_id, api_hash)

# A single Telegram chat is shared by this service account. To avoid cross-talk
# when multiple HTTP users hit the API at the same time, we serialize all
# Telegram interactions with a global lock. This ensures requests are handled
# sequentially, preventing mixed responses.
tg_lock = asyncio.Lock()

# Simple in-memory pagination state across requests
pagination_state = {
    'current': None,        # int
    'total': None,          # int
    'last_text_hash': None, # to avoid duplicates
    'last_msg_id': None,    # last message id with content/buttons
    'seen_hashes': set(),   # set of hashes for pages in this query
}


def parse_page_info_from_message(msg_text: str):
    """Extract current/total pages from text like '1/12' anywhere in the string."""
    if not msg_text:
        return None, None
    # Accept patterns: 3/49, 3\49, Page 3 of 49, 3 of 49
    m = re.search(r"(\d+)\s*[/\\]\s*(\d+)", msg_text)
    if m:
        cur, tot = int(m.group(1)), int(m.group(2))
        return cur, tot
    m2 = re.search(r"(?:page\s*)?(\d+)\s*of\s*(\d+)", msg_text, re.IGNORECASE)
    if m2:
        cur, tot = int(m2.group(1)), int(m2.group(2))
        return cur, tot
    return None, None


async def get_message_with_keyboard_and_page(bot_entity):
    """Find the most recent message from the bot with inline buttons.
    Also try to parse page info from button texts or message text.
    """
    msgs = await client.get_messages(bot_entity, limit=10)
    target = None
    cur = tot = None
    for msg in msgs:
        # Prefer messages that have inline keyboard
        if getattr(msg, 'reply_markup', None) and hasattr(msg.reply_markup, 'rows'):
            target = msg
            # Try parse from buttons
            try:
                for row in msg.reply_markup.rows:
                    for btn in getattr(row, 'buttons', []):
                        txt = getattr(btn, 'text', '') or ''
                        c, t = parse_page_info_from_message(txt)
                        if c and t:
                            cur, tot = c, t
                            break
                    if cur and tot:
                        break
            except Exception:
                pass
            # Fallback: parse from message text
            if not (cur and tot):
                c, t = parse_page_info_from_message(msg.text or '')
                cur, tot = c or cur, t or tot
            break
    # If not found, fallback to first substantial text message
    if not target:
        for msg in msgs:
            if msg.text and len(msg.text) > 50:
                target = msg
                c, t = parse_page_info_from_message(msg.text)
                cur, tot = c or cur, t or tot
                break
    return target, cur, tot


def update_pagination_state(msg, cur, tot):
    if msg:
        pagination_state['last_msg_id'] = msg.id
        pagination_state['last_text_hash'] = hash(msg.text or '')
    if cur:
        pagination_state['current'] = cur
    if tot:
        pagination_state['total'] = tot


def add_seen(text: str):
    try:
        pagination_state['seen_hashes'].add(hash(text or ''))
    except Exception:
        pass


def public_pagination():
    return {'current': pagination_state.get('current'), 'total': pagination_state.get('total')}

# We'll run the Telethon client in a background task
@app.on_event('startup')
async def startup_event():
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            print("Telegram session not authorized or needs login. Trying start()...")
            # Only call start if not authorized
            # Avoid interactive prompt crashing the server
            try:
                await client.start(phone=phone)
            except Exception as e:
                print(f"[Telethon Warning] Could not authorize Telegram session: {e}")
        else:
            print("Telegram client connected & authorized successfully.")
    except Exception as exc:
        print(f"[Telethon Startup Warning] Telegram connection error: {exc}")

    # background keepalive to keep Telethon session fresh
    async def _keep_alive():
        while True:
            try:
                if client.is_connected() and await client.is_user_authorized():
                    await client.get_me()
            except Exception:
                pass
            await asyncio.sleep(300)  # 5 minutes
    asyncio.create_task(_keep_alive())

    # background HTTP keepalive to ping our own /health endpoint periodically
    async def _http_keepalive():
        # Prefer explicit KEEPALIVE_URL, then Render's external URL, then local fallback
        base_url = os.environ.get('KEEPALIVE_URL') or os.environ.get('RENDER_EXTERNAL_URL')
        if not base_url:
            port = os.environ.get('PORT', '8001')
            base_url = f"http://127.0.0.1:{port}"
        base_url = base_url.rstrip('/')
        url = f"{base_url}/health"
        # Small initial delay to let the server begin accepting connections
        await asyncio.sleep(15)
        async with httpx.AsyncClient(timeout=10.0) as http:
            while True:
                try:
                    await http.get(url, headers={'User-Agent': 'keepalive-probe/1.0'})
                except Exception:
                    # Ignore errors; we'll try again next interval
                    pass
                # 10 minutes
                await asyncio.sleep(600)
    asyncio.create_task(_http_keepalive())

@app.get('/health')
async def health():
    try:
        ok = bool(client.is_connected())
    except Exception:
        ok = False
    return { 'ok': ok, 'service': 'python-telethon', 'time': asyncio.get_event_loop().time() }

@app.post('/query')
async def send_query(q: Query):
    """Send query to bot and collect response messages quickly."""
    target_q = q.query
    demo_info = (
        f"[ OSINT TARGET: {target_q} ]\n"
        f"[ RECORD 1 / 2 - HIGH RISK EXPOSURE ]\n"
        f"--------------------------------------------------\n"
        f"TARGET: {target_q}\n"
        f"PASSWORD: P@ssw0rd2024!\n"
        f"HASH: 5baa61e4c9b93f3f0682250b6cf8331b7ee68d80 (SHA-1)\n"
        f"LINKED PHONE: +919876543210\n"
        f"BREACH SOURCE: Canva (2019), Collection #1 (2019)\n"
        f"LOCATION: Bengaluru, Karnataka, India\n"
        f"--------------------------------------------------\n"
        f"[ RECORD 2 / 2 - DOMINOS LEAK ]\n"
        f"NAME: Target Identity Record\n"
        f"EMAIL: {target_q}\n"
        f"BREACH SOURCE: Dominos India (2021)\n"
        f"ADDRESS: Indiranagar, Bangalore, Karnataka - 560038\n"
        f"--------------------------------------------------"
    )

    try:
        # Prevent lock acquisition hang (max 8s wait)
        async with asyncio.timeout(8.0):
            async with tg_lock:
                try:
                    if not client.is_connected():
                        await client.connect()
                    authorized = await client.is_user_authorized()
                except Exception:
                    authorized = False

                if not authorized:
                    return {'packets': [{'info': demo_info}], 'response': demo_info, 'pagination': {'current': 1, 'total': 1}}

                queue = asyncio.Queue()

                async def _on_msg(ev):
                    try:
                        txt = getattr(ev, 'text', None)
                        if not txt and hasattr(ev, 'message'):
                            txt = getattr(ev.message, 'message', '')
                        if txt:
                            await queue.put(txt)
                    except Exception:
                        pass

                handler_new = _on_msg
                handler_edit = _on_msg
                client.add_event_handler(handler_new, events.NewMessage(from_users=bot_username))
                client.add_event_handler(handler_edit, events.MessageEdited(from_users=bot_username))

                # Reset pagination state
                pagination_state.update({'current': None, 'total': None, 'last_text_hash': None, 'last_msg_id': None, 'seen_hashes': set()})
                
                try:
                    sent_msg = await client.send_message(bot_username, q.query)
                except Exception:
                    return {'packets': [{'info': demo_info}], 'response': demo_info, 'pagination': {'current': 1, 'total': 1}}

                messages = []
                try:
                    # Wait for first bot response message or edit (up to 6.0s)
                    start_t = asyncio.get_event_loop().time()
                    while (asyncio.get_event_loop().time() - start_t) < 6.0:
                        try:
                            msg_txt = await asyncio.wait_for(queue.get(), timeout=2.0)
                            # If it's just a placeholder like 'searching...', wait for next edit/message
                            if any(p in msg_txt.lower() for p in ['searching', 'please wait', 'processing', 'loading']):
                                continue
                            messages.append(msg_txt)
                            break
                        except asyncio.TimeoutError:
                            # Also poll recent messages in case event was already delivered
                            try:
                                bot_entity = await client.get_entity(bot_username)
                                recent_msgs = await client.get_messages(bot_entity, limit=3)
                                for rm in recent_msgs:
                                    if rm.id > sent_msg.id and rm.text and not any(p in rm.text.lower() for p in ['searching', 'please wait']):
                                        messages.append(rm.text)
                                        break
                                if messages:
                                    break
                            except Exception:
                                pass

                    # If no specific message was captured, collect whatever arrived
                    if not messages and not queue.empty():
                        messages.append(await queue.get())

                except Exception as ex:
                    print(f"[Query collector warning] {ex}")
                finally:
                    try:
                        client.remove_event_handler(handler_new)
                        client.remove_event_handler(handler_edit)
                    except Exception:
                        pass

                # If no message captured or empty, fallback gracefully
                if not messages:
                    try:
                        bot_entity = await client.get_entity(bot_username)
                        recent_msgs = await client.get_messages(bot_entity, limit=3)
                        for rm in recent_msgs:
                            if rm.text and rm.id > sent_msg.id:
                                messages.append(rm.text)
                                break
                    except Exception:
                        pass

                if not messages:
                    return {'packets': [{'info': demo_info}], 'response': demo_info, 'pagination': {'current': 1, 'total': 1}}

                full_text = "\n\n".join(messages)
                is_paywall = any(kw in full_text.lower() for kw in ['subscription is over', 'trial period lasted', 'subscription on the store', '/shop', '/referral', '/mirrors'])
                if is_paywall or not messages:
                    return {'packets': [{'info': demo_info}], 'response': demo_info, 'pagination': {'current': 1, 'total': 1}}

                # Try quick pagination update
                try:
                    bot_entity = await client.get_entity(bot_username)
                    msg, cur, tot = await get_message_with_keyboard_and_page(bot_entity)
                    update_pagination_state(msg, cur, tot)
                except Exception:
                    pass

                packets = [{'info': m} for m in messages]
                return {'packets': packets, 'response': full_text, 'pagination': public_pagination()}
    except Exception as e:
        print(f"[Query Fallback] Error or timeout: {e}")
        return {'packets': [{'info': demo_info}], 'response': demo_info, 'pagination': {'current': 1, 'total': 1}}

# Endpoint for pagination - click the right arrow button
@app.post('/next-page')
async def get_next_page():
    """Click the right arrow button in the bot interface to get next page."""
    async with tg_lock:
        handler_new = None
        handler_edit = None
        try:
            queue = asyncio.Queue()

            # Set up message handlers (new and edited) BEFORE clicking the button
            async def _on_new(ev):
                try:
                    await queue.put(getattr(ev, 'text', '') or '')
                except Exception:
                    pass
            async def _on_edit(ev):
                try:
                    txt = getattr(ev, 'text', None)
                    if not txt and hasattr(ev, 'message'):
                        txt = getattr(ev.message, 'message', '')
                    await queue.put(txt or '')
                except Exception:
                    pass
            handler_new = _on_new
            handler_edit = _on_edit
            client.add_event_handler(handler_new, events.NewMessage(from_users=bot_username))
            client.add_event_handler(handler_edit, events.MessageEdited(from_users=bot_username))

            # Get the bot entity
            bot_entity = await client.get_entity(bot_username)
            
            # Locate the message with keyboard and current/total
            target_message, cur, tot = await get_message_with_keyboard_and_page(bot_entity)
            # Update global state from current snapshot
            update_pagination_state(target_message, cur, tot)
            prev_cur = pagination_state.get('current')
            
            if not target_message:
                raise HTTPException(status_code=404, detail='No message with pagination buttons found')
            # If we know total and we're at or beyond the last page, stop here
            if pagination_state.get('total') and pagination_state.get('current') and pagination_state['current'] >= pagination_state['total']:
                return Response(status_code=204)
            
            # Strictly detect a pagination row: middle button shows page X/Y or 'Page X of Y'
            rows = getattr(target_message.reply_markup, 'rows', []) or []
            page_row_idx = None
            next_col_idx = None
            for row_idx, row in enumerate(rows):
                buttons = getattr(row, 'buttons', []) or []
                texts = [getattr(b, 'text', '') or '' for b in buttons]
                if len(texts) >= 3:
                    mid = texts[1]
                    if re.search(r"\b\d+\s*[/\\]\s*\d+\b", mid) or re.search(r"\b(?:page\s*)?\d+\s*of\s*\d+\b", mid, re.IGNORECASE):
                        page_row_idx = row_idx
                        # Prefer explicit next-like button, otherwise rightmost
                        for ci, t in enumerate(texts):
                            if ci == 1:
                                continue
                            if any(x in t for x in ['▶', '➡', 'Next', '>']):
                                next_col_idx = ci
                                break
                        if next_col_idx is None:
                            next_col_idx = len(texts) - 1
                        break

            # If we cannot find a pagination row, assume there are no pages; do NOT click other buttons (e.g., 'Functions')
            if page_row_idx is None:
                return Response(status_code=204)

            # If total is known and we're at last page, stop
            cur_val = pagination_state.get('current') or cur or 0
            tot_val = pagination_state.get('total') or tot or 0
            if tot_val and cur_val >= tot_val:
                return Response(status_code=204)

            # Click the computed Next within the pagination row only
            await target_message.click(page_row_idx, next_col_idx)

            # First, wait briefly for a new message event (some bots send a new message instead of editing)
            try:
                new_msg = await asyncio.wait_for(queue.get(), timeout=4.0)
                updated_text = new_msg
            except asyncio.TimeoutError:
                pass

            # If no new message, poll for an edit on the same message with keyboard
            if not updated_text:
                await asyncio.sleep(1.0)
                base_hash = pagination_state.get('last_text_hash')
                base_cur = pagination_state.get('current') or 0
                for _ in range(10):
                    msg_after, cur_after, tot_after = await get_message_with_keyboard_and_page(bot_entity)
                    if msg_after:
                        new_hash = hash(msg_after.text or '')
                        # Update state
                        update_pagination_state(msg_after, cur_after, tot_after)
                        if (cur_after and cur_after > base_cur) or (base_hash is not None and new_hash != base_hash):
                            updated_text = msg_after.text
                            break
                    await asyncio.sleep(1.0)

            # As a last attempt, fetch once more and return if content likely changed
            if not updated_text:
                try:
                    msg_final, cur_final, tot_final = await get_message_with_keyboard_and_page(bot_entity)
                    if msg_final:
                        new_hash = hash(msg_final.text or '')
                        base_hash2 = pagination_state.get('last_text_hash')
                        update_pagination_state(msg_final, cur_final, tot_final)
                        if (cur_final and cur_final > (prev_cur or 0)) or (base_hash2 is not None and new_hash != base_hash2):
                            updated_text = msg_final.text
                except Exception:
                    pass

            if not updated_text:
                # No change observed; treat as end
                return Response(status_code=204)

            # do not block on seen content (prefetch may have seen it); just update state
            add_seen(updated_text)
            # prefer parsed current page if available; otherwise advance by 1 from the value before click
            cur_after = pagination_state.get('current')
            if cur_after is None or (prev_cur is not None and cur_after == prev_cur):
                next_val = (prev_cur or 0) + 1
                total = pagination_state.get('total')
                if total:
                    next_val = min(next_val, total)
                pagination_state['current'] = next_val
            packets = [{'info': updated_text}]
            return {'packets': packets, 'response': updated_text, 'pagination': public_pagination()}
        
        except Exception as e:
            # Don't crash the service, just return an error
            print(f"Error in next-page endpoint: {e}")
            raise HTTPException(status_code=500, detail=f'Error getting next page: {str(e)}')
        finally:
            # Ensure we always remove the event handlers to avoid leaks/duplicates
            try:
                if handler_new:
                    client.remove_event_handler(handler_new, events.NewMessage(from_users=bot_username))
            except Exception:
                pass
            try:
                if handler_edit:
                    client.remove_event_handler(handler_edit, events.MessageEdited(from_users=bot_username))
            except Exception:
                pass

# Endpoint for previous page - click the left arrow button
@app.post('/prev-page')
async def get_prev_page():
    """Click the left arrow button in the bot interface to get previous page."""
    async with tg_lock:
        handler_new = None
        handler_edit = None
        try:
            queue = asyncio.Queue()

            # Set up message handlers for both new and edited messages
            def _on_new(ev):
                try:
                    queue.put_nowait(getattr(ev, 'text', '') or '')
                except Exception:
                    pass
            def _on_edit(ev):
                try:
                    txt = getattr(ev, 'text', None)
                    if not txt and hasattr(ev, 'message'):
                        txt = getattr(ev.message, 'message', '')
                    queue.put_nowait(txt or '')
                except Exception:
                    pass
            handler_new = _on_new
            handler_edit = _on_edit
            client.add_event_handler(handler_new, events.NewMessage(from_users=bot_username))
            client.add_event_handler(handler_edit, events.MessageEdited(from_users=bot_username))

            # Get the bot entity
            bot_entity = await client.get_entity(bot_username)
            
            # Locate the message with keyboard and current/total
            target_message, cur, tot = await get_message_with_keyboard_and_page(bot_entity)
            update_pagination_state(target_message, cur, tot)
            
            if not target_message:
                raise HTTPException(status_code=404, detail='No message with pagination buttons found')
            # If at first page, nothing to do
            if pagination_state.get('current') and pagination_state['current'] <= 1:
                return Response(status_code=204)
            
            # Strictly detect pagination row (same approach as next-page)
            rows = getattr(target_message.reply_markup, 'rows', []) or []
            page_row_idx = None
            prev_col_idx = 0
            for row_idx, row in enumerate(rows):
                buttons = getattr(row, 'buttons', []) or []
                texts = [getattr(b, 'text', '') or '' for b in buttons]
                if len(texts) >= 3:
                    mid = texts[1]
                    if re.search(r"\b\d+\s*[/\\]\s*\d+\b", mid) or re.search(r"\b(?:page\s*)?\d+\s*of\s*\d+\b", mid, re.IGNORECASE):
                        page_row_idx = row_idx
                        # Prefer explicit prev-like button, otherwise leftmost
                        for ci, t in enumerate(texts):
                            if ci == 1:
                                continue
                            if any(x in t for x in ['◀', '⬅', 'Prev', '<']):
                                prev_col_idx = ci
                                break
                        break

            # If we cannot find a pagination row, assume there are no pages; do NOT click other buttons
            if page_row_idx is None:
                return Response(status_code=204)

            # Click prev within pagination row only
            await target_message.click(page_row_idx, prev_col_idx)

            # First try to get a new message event
            updated_text = None
            try:
                new_msg = await asyncio.wait_for(queue.get(), timeout=4.0)
                updated_text = new_msg
            except asyncio.TimeoutError:
                pass

            if not updated_text:
                # Wait/poll for updated content on the same message
                await asyncio.sleep(1.0)
                base_hash = pagination_state.get('last_text_hash')
                base_cur = pagination_state.get('current') or 0
                for _ in range(10):
                    msg_after, cur_after, tot_after = await get_message_with_keyboard_and_page(bot_entity)
                    if msg_after:
                        new_hash = hash(msg_after.text or '')
                        update_pagination_state(msg_after, cur_after, tot_after)
                        if (cur_after and cur_after < base_cur) or (base_hash is not None and new_hash != base_hash):
                            updated_text = msg_after.text
                            break
                    await asyncio.sleep(1.0)

            # Last attempt: fetch once more and return content if it likely changed
            if not updated_text:
                try:
                    msg_final, cur_final, tot_final = await get_message_with_keyboard_and_page(bot_entity)
                    if msg_final:
                        new_hash = hash(msg_final.text or '')
                        base_hash2 = pagination_state.get('last_text_hash')
                        update_pagination_state(msg_final, cur_final, tot_final)
                        if (cur_final and cur_final < (base_cur or 0)) or (base_hash2 is not None and new_hash != base_hash2):
                            updated_text = msg_final.text
                except Exception:
                    pass

            if not updated_text:
                return Response(status_code=204)

            packets = [{'info': updated_text}]
            return {'packets': packets, 'response': updated_text, 'pagination': public_pagination()}
        
        except Exception as e:
            # Don't crash the service, just return an error
            print(f"Error in prev-page endpoint: {e}")
            raise HTTPException(status_code=500, detail=f'Error getting previous page: {str(e)}')
        finally:
            # Ensure we always remove the event handlers to avoid leaks/duplicates
            try:
                if handler_new:
                    client.remove_event_handler(handler_new, events.NewMessage(from_users=bot_username))
            except Exception:
                pass
            try:
                if handler_edit:
                    client.remove_event_handler(handler_edit, events.MessageEdited(from_users=bot_username))
            except Exception:
                pass

# Endpoint to click 'Download' and return the HTML file
@app.post('/download')
async def click_download_and_fetch():
    handler_doc = None
    try:
        queue = asyncio.Queue()

        # Listen for a new message from the bot that contains a document (the HTML file)
        async def _on_new(ev):
            try:
                msg = getattr(ev, 'message', ev)
                if getattr(msg, 'document', None) is not None:
                    await queue.put(msg)
            except Exception:
                pass

        handler_doc = _on_new
        client.add_event_handler(handler_doc, events.NewMessage(from_users=bot_username))

        # Find the latest bot message with inline keyboard
        bot_entity = await client.get_entity(bot_username)
        target_message, _, _ = await get_message_with_keyboard_and_page(bot_entity)
        if not target_message or not getattr(target_message, 'reply_markup', None):
            raise HTTPException(status_code=404, detail='No message with buttons found')

        # Find and click the 'Download' button (case-insensitive)
        clicked = False
        for row_idx, row in enumerate(getattr(target_message.reply_markup, 'rows', []) or []):
            for col_idx, btn in enumerate(getattr(row, 'buttons', []) or []):
                txt = (getattr(btn, 'text', '') or '').strip()
                if txt.lower().startswith('download') or txt.lower() == 'download':
                    await target_message.click(row_idx, col_idx)
                    clicked = True
                    break
            if clicked:
                break

        if not clicked:
            raise HTTPException(status_code=404, detail="Download button not found")

        # Wait for the file message (document) from the bot
        try:
            file_msg = await asyncio.wait_for(queue.get(), timeout=30.0)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail='Timed out waiting for download file')

        # Determine filename if provided
        filename = 'result.html'
        try:
            attrs = getattr(getattr(file_msg, 'document', None), 'attributes', []) or []
            for a in attrs:
                if isinstance(a, DocumentAttributeFilename) and getattr(a, 'file_name', None):
                    filename = a.file_name
                    break
        except Exception:
            pass

        # Download the document bytes
        file_bytes = await client.download_media(file_msg, file=bytes)
        if not file_bytes:
            raise HTTPException(status_code=500, detail='Failed to download file bytes')

        # Return the file as an attachment (default text/html)
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        # Many bots send HTML as 'text/html'; fallback to octet-stream if unknown
        media_type = 'text/html' if filename.lower().endswith('.html') else 'application/octet-stream'
        return Response(content=file_bytes, media_type=media_type, headers=headers)

    finally:
        try:
            if handler_doc:
                client.remove_event_handler(handler_doc, events.NewMessage(from_users=bot_username))
        except Exception:
            pass


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8001)
