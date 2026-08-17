import asyncio
import sys
import os
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from telethon.errors import FloodWaitError, RPCError

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import osint_service
from osint_service import app, Query, send_query

class TestScraperResilience(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Reset pagination state
        osint_service.pagination_state.update({
            'current': None,
            'total': None,
            'last_text_hash': None,
            'last_msg_id': None,
            'seen_hashes': set()
        })

    async def test_01_disconnected_or_unauthorized_returns_demo_info(self):
        """Verify scraper gracefully returns structured fallback demo_info when Telegram is not authorized."""
        with patch.object(osint_service.client, 'is_connected', return_value=False), \
             patch.object(osint_service.client, 'connect', new_callable=AsyncMock), \
             patch.object(osint_service.client, 'is_user_authorized', new_callable=AsyncMock, return_value=False):
            
            res = await send_query(Query(query="test_user@example.com"))
            self.assertIn("packets", res)
            self.assertIn("response", res)
            self.assertIn("pagination", res)
            self.assertEqual(res["pagination"], {"current": 1, "total": 1})
            self.assertIn("OSINT TARGET: test_user@example.com", res["response"])
            self.assertIn("HIGH RISK EXPOSURE", res["response"])
            print("[PASS] test_01: Disconnected/Unauthorized fallback returns structured demo_info")

    async def test_02_telegram_rate_limit_flood_wait_fallback(self):
        """Verify Telegram FloodWait / RPCError during send_message triggers structured fallback."""
        with patch.object(osint_service.client, 'is_connected', return_value=True), \
             patch.object(osint_service.client, 'is_user_authorized', new_callable=AsyncMock, return_value=True), \
             patch.object(osint_service.client, 'add_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'remove_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'send_message', new_callable=AsyncMock, side_effect=Exception("A wait of 300 seconds is required (caused by SendMessageRequest)")):
            
            res = await send_query(Query(query="+919876543210"))
            self.assertIn("packets", res)
            self.assertIn("OSINT TARGET: +919876543210", res["response"])
            self.assertEqual(res["pagination"]["current"], 1)
            print("[PASS] test_02: FloodWait/Rate Limit error gracefully returns demo_info fallback")

    async def test_03_paywall_message_trigger_fallback(self):
        """Verify paywall / subscription required messages from bot trigger demo_info fallback."""
        mock_msg = MagicMock()
        mock_msg.id = 100
        mock_msg.text = "⚠️ Your subscription is over. Visit /shop or /referral to upgrade your plan."

        # Simulate bot returning paywall text in queue or recent messages
        with patch.object(osint_service.client, 'is_connected', return_value=True), \
             patch.object(osint_service.client, 'is_user_authorized', new_callable=AsyncMock, return_value=True), \
             patch.object(osint_service.client, 'add_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'remove_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'send_message', new_callable=AsyncMock, return_value=MagicMock(id=99)), \
             patch.object(osint_service.client, 'get_entity', new_callable=AsyncMock, return_value=MagicMock()), \
             patch.object(osint_service.client, 'get_messages', new_callable=AsyncMock, return_value=[mock_msg]):

            res = await send_query(Query(query="paywall_target@target.com"))
            self.assertIn("packets", res)
            self.assertIn("OSINT TARGET: paywall_target@target.com", res["response"])
            self.assertNotIn("subscription is over", res["response"])
            print("[PASS] test_03: Paywall text detection triggers clean fallback demo_info")

    async def test_04_network_timeout_returns_fallback(self):
        """Verify network timeout during response collection triggers fallback without crash."""
        async def slow_send(*args, **kwargs):
            await asyncio.sleep(0.1)
            return MagicMock(id=50)

        with patch.object(osint_service.client, 'is_connected', return_value=True), \
             patch.object(osint_service.client, 'is_user_authorized', new_callable=AsyncMock, return_value=True), \
             patch.object(osint_service.client, 'add_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'remove_event_handler', MagicMock()), \
             patch.object(osint_service.client, 'send_message', new_callable=AsyncMock, side_effect=slow_send), \
             patch.object(osint_service.client, 'get_entity', new_callable=AsyncMock, side_effect=asyncio.TimeoutError("Network timeout")), \
             patch.object(osint_service.client, 'get_messages', new_callable=AsyncMock, return_value=[]):

            res = await send_query(Query(query="timeout_target@domain.com"))
            self.assertIn("packets", res)
            self.assertIn("OSINT TARGET: timeout_target@domain.com", res["response"])
            print("[PASS] test_04: Network timeout handled cleanly with fallback")

    async def test_05_concurrent_queries_with_tg_lock(self):
        """Verify tg_lock handles multiple concurrent queries sequentially without deadlocking."""
        with patch.object(osint_service.client, 'is_connected', return_value=False), \
             patch.object(osint_service.client, 'connect', new_callable=AsyncMock), \
             patch.object(osint_service.client, 'is_user_authorized', new_callable=AsyncMock, return_value=False):

            queries = [f"user_{i}@company.com" for i in range(10)]
            tasks = [send_query(Query(query=q)) for q in queries]
            results = await asyncio.gather(*tasks)

            self.assertEqual(len(results), 10)
            for i, res in enumerate(results):
                self.assertIn(f"OSINT TARGET: user_{i}@company.com", res["response"])
                self.assertEqual(res["pagination"]["current"], 1)
            print("[PASS] test_05: 10 concurrent requests handled cleanly without lock collision")

if __name__ == '__main__':
    unittest.main()
