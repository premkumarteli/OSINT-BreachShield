const { WebSocketServer } = require('ws');
const db = require('../auth/db');

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
    console.log('[Gateway WS] Phone WebSocket connected from:', req.socket.remoteAddress);

    ws.on('message', async (rawMsg) => {
      const msgStr = rawMsg.toString().trim();

      // Handle heartbeat ping
      if (msgStr === 'ping') {
        ws.send('pong');
        return;
      }

      try {
        const data = JSON.parse(msgStr);

        // 1. Authenticate / Handshake
        if (data.deviceId) {
          currentDeviceId = data.deviceId;
          activeSockets.set(currentDeviceId, ws);
          console.log(`[Gateway WS] Authenticated Gateway Device: ${currentDeviceId}`);

          // Update status in DB
          try {
            await db.query(`UPDATE gateway_devices SET status = 'ONLINE', last_seen = NOW() WHERE device_id = ?`, [currentDeviceId]);
          } catch (_) {}

          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', deviceId: currentDeviceId, time: Date.now() }));
          return;
        }

        // 2. Heartbeat Payload
        if (data.type === 'HEARTBEAT') {
          if (data.deviceId) currentDeviceId = data.deviceId;
          if (currentDeviceId) activeSockets.set(currentDeviceId, ws);
          
          try {
            if (currentDeviceId) {
              await db.query(`
                UPDATE gateway_devices 
                SET status = 'ONLINE', battery_level = ?, signal_strength = ?, last_seen = NOW() 
                WHERE device_id = ?
              `, [data.battery || null, data.signalStrength || null, currentDeviceId]);
            }
          } catch (_) {}

          ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
          return;
        }

        // 3. SMS Delivery Status Update from Android
        if (data.requestId && data.status) {
          console.log(`[Gateway WS] SMS Status Callback from ${data.deviceId}: requestId=${data.requestId}, status=${data.status}`);
          try {
            const statusUpper = String(data.status).toUpperCase();
            let updateSql = `UPDATE sms_jobs SET status = ?, updated_at = NOW()`;
            if (statusUpper === 'SENT') updateSql += `, sent_at = NOW()`;
            if (statusUpper === 'DELIVERED') updateSql += `, delivered_at = NOW()`;
            updateSql += ` WHERE request_id = ?;`;
            await db.query(updateSql, [statusUpper, data.requestId]);
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[Gateway WS] Non-JSON message received:', msgStr);
      }
    });

    ws.on('close', async () => {
      if (currentDeviceId) {
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
