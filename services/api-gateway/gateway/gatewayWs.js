const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const db = require('../auth/db');
const { JWT_SECRET } = require('../config/env');

// Map of active connected gateway sockets: deviceId -> ws
const activeSockets = new Map();

let wss = null;

function setupGatewayWebSocket(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (pathname === '/ws/gateway' || pathname === '/api/gateway/ws' || pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    let currentDeviceId = null;
    let isAuthenticated = false;
    console.log('[Gateway WS] Phone WebSocket connected from:', req.socket.remoteAddress);

    ws.on('message', async (rawMsg) => {
      const msgStr = rawMsg.toString().trim();

      // Handle raw ping if already authenticated
      if (msgStr === 'ping') {
        if (isAuthenticated) {
          ws.send('pong');
        } else {
          ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Authentication required' }));
          ws.close(1008, 'Authentication required');
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(msgStr);
      } catch (err) {
        console.warn('[Gateway WS] Non-JSON message received:', msgStr);
        if (!isAuthenticated) {
          ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Invalid message format' }));
          ws.close(1008, 'Invalid message format');
        }
        return;
      }

      // 1. Initial Handshake & JWT Authentication
      if (!isAuthenticated) {
        const { deviceId, gatewayToken, token } = data;
        const targetToken = gatewayToken || token;

        if (!deviceId || !targetToken) {
          console.warn('[Gateway WS] Missing deviceId or gatewayToken on initial message');
          ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Missing deviceId or gatewayToken' }));
          ws.close(1008, 'Missing credentials');
          return;
        }

        try {
          const decoded = jwt.verify(targetToken, JWT_SECRET);
          if (!decoded || decoded.deviceId !== deviceId || decoded.role !== 'sms_gateway') {
            console.warn(`[Gateway WS] Invalid token payload for device ${deviceId}`);
            ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Invalid gateway credentials' }));
            ws.close(1008, 'Invalid credentials');
            return;
          }

          // Authentication successful
          isAuthenticated = true;
          currentDeviceId = deviceId;
          activeSockets.set(currentDeviceId, ws);
          console.log(`[Gateway WS] Authenticated Gateway Device: ${currentDeviceId}`);

          // Update status in DB
          try {
            await db.query(`UPDATE gateway_devices SET status = 'ONLINE', last_seen = NOW() WHERE device_id = ?`, [currentDeviceId]);
          } catch (_) {}

          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', deviceId: currentDeviceId, time: Date.now() }));
          return;
        } catch (authErr) {
          console.warn(`[Gateway WS] JWT verification failed:`, authErr.message);
          ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Authentication failed', message: authErr.message }));
          ws.close(1008, 'Authentication failed');
          return;
        }
      }

      // 2. Heartbeat Payload (Authenticated sockets only)
      if (data.type === 'HEARTBEAT') {
        try {
          await db.query(`
            UPDATE gateway_devices 
            SET status = 'ONLINE', battery_level = ?, signal_strength = ?, last_seen = NOW() 
            WHERE device_id = ?
          `, [data.battery || null, data.signalStrength || null, currentDeviceId]);
        } catch (_) {}

        ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
        return;
      }

      // 3. SMS Delivery Status Update from Android
      if (data.requestId && data.status) {
        console.log(`[Gateway WS] SMS Status Callback from ${currentDeviceId}: requestId=${data.requestId}, status=${data.status}`);
        try {
          const statusUpper = String(data.status).toUpperCase();
          let updateSql = `UPDATE sms_jobs SET status = ?, updated_at = NOW()`;
          if (statusUpper === 'SENT') updateSql += `, sent_at = NOW()`;
          if (statusUpper === 'DELIVERED') updateSql += `, delivered_at = NOW()`;
          updateSql += ` WHERE request_id = ?;`;
          await db.query(updateSql, [statusUpper, data.requestId]);
        } catch (_) {}
      }
    });

    ws.on('close', async () => {
      if (currentDeviceId && isAuthenticated) {
        activeSockets.delete(currentDeviceId);
        console.log(`[Gateway WS] Device ${currentDeviceId} disconnected`);
        try {
          await db.query(`UPDATE gateway_devices SET status = 'OFFLINE', last_seen = NOW() WHERE device_id = ?`, [currentDeviceId]);
        } catch (_) {}
      }
    });

    ws.on('error', (err) => {
      console.error('[Gateway WS Error]', err.message);
    });
  });

  console.log('[Gateway WS] WebSocket server ready on /ws/gateway & /api/gateway/ws');
}

/**
 * Dispatch SMS command to connected Android Phone in real-time
 */
function sendSmsToGateway(deviceId, requestId, phoneNumber, message) {
  const ws = activeSockets.get(deviceId);
  if (!ws || ws.readyState !== 1 /* OPEN */) {
    return false;
  }

  // Send both action and type for universal compatibility
  const payload = JSON.stringify({
    action: 'send_sms',
    type: 'SEND_SMS',
    requestId,
    phone: phoneNumber,
    phoneNumber,
    message
  });

  ws.send(payload);
  console.log(`[Gateway WS] Real-time SMS dispatched to ${deviceId}: ${phoneNumber}`);
  return true;
}

module.exports = {
  setupGatewayWebSocket,
  sendSmsToGateway,
  activeSockets
};
