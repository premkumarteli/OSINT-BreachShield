const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../auth/db');
const { JWT_SECRET } = require('../../config/env');

// In-memory fallback stores in case MySQL is offline in local dev environment
const memoryDevices = new Map();
const memoryJobs = new Map();
const memoryLogs = [];

/**
 * 1. POST /api/gateway/register
 * Register or update an Android SMS Gateway device.
 */
async function registerDevice(req, res) {
  try {
    const {
      deviceId,
      deviceName,
      manufacturer,
      model,
      androidVersion,
      androidId,
      simReady
    } = req.body || {};

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: deviceId'
      });
    }

    // Sign a long-lived JWT token for this device
    const gatewayToken = jwt.sign(
      {
        deviceId,
        role: 'sms_gateway',
        platform: 'android'
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    const now = new Date();
    const deviceRecord = {
      deviceId,
      deviceName: deviceName || 'Android SMS Gateway',
      manufacturer: manufacturer || 'Unknown',
      model: model || 'Android Device',
      androidVersion: androidVersion || '14',
      androidId: androidId || 'N/A',
      simReady: Boolean(simReady !== false),
      gatewayToken,
      status: 'ONLINE',
      lastSeen: now
    };

    // Try MySQL database
    try {
      const upsertSql = `
        INSERT INTO gateway_devices 
          (device_id, device_name, manufacturer, model, android_version, android_id, sim_ready, gateway_token, status, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ONLINE', NOW())
        ON DUPLICATE KEY UPDATE
          device_name = VALUES(device_name),
          manufacturer = VALUES(manufacturer),
          model = VALUES(model),
          android_version = VALUES(android_version),
          android_id = VALUES(android_id),
          sim_ready = VALUES(sim_ready),
          gateway_token = VALUES(gateway_token),
          status = 'ONLINE',
          last_seen = NOW();
      `;
      await db.query(upsertSql, [
        deviceRecord.deviceId,
        deviceRecord.deviceName,
        deviceRecord.manufacturer,
        deviceRecord.model,
        deviceRecord.androidVersion,
        deviceRecord.androidId,
        deviceRecord.simReady,
        deviceRecord.gatewayToken
      ]);
    } catch (dbErr) {
      console.warn('[Gateway DB Warning] MySQL unavailable, using in-memory store:', dbErr.message);
      memoryDevices.set(deviceId, deviceRecord);
    }

    return res.status(200).json({
      success: true,
      gatewayToken,
      message: 'Gateway device registered successfully'
    });
  } catch (err) {
    console.error('[Gateway Register Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during registration'
    });
  }
}

/**
 * 2. GET /api/gateway/devices
 * List all registered Android SMS Gateway devices.
 */
async function getDevices(req, res) {
  try {
    let devices = [];
    try {
      devices = await db.query(`
        SELECT 
          device_id AS deviceId,
          device_name AS deviceName,
          manufacturer,
          model,
          android_version AS androidVersion,
          android_id AS androidId,
          sim_ready AS simReady,
          status,
          battery_level AS batteryLevel,
          signal_strength AS signalStrength,
          last_seen AS lastSeen,
          created_at AS createdAt
        FROM gateway_devices
        ORDER BY last_seen DESC;
      `);
    } catch (dbErr) {
      devices = Array.from(memoryDevices.values());
    }

    return res.status(200).json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (err) {
    console.error('[Gateway Get Devices Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve gateway devices'
    });
  }
}

/**
 * Internal helper to queue and dispatch an SMS job without HTTP request objects.
 */
async function queueSmsJob(phoneNumber, message, deviceId = null, customRequestId = null) {
  if (!phoneNumber || !message) {
    throw new Error('Missing required fields: phoneNumber and message');
  }

  // If deviceId not specified, choose the most recently seen ONLINE device or active WebSocket socket
  let targetDeviceId = deviceId;
  if (!targetDeviceId) {
    try {
      const [activeDevice] = await db.query(`
        SELECT device_id FROM gateway_devices 
        WHERE status = 'ONLINE' AND sim_ready = 1 
        ORDER BY last_seen DESC LIMIT 1;
      `);
      targetDeviceId = activeDevice?.device_id;
    } catch (_) {}

    if (!targetDeviceId) {
      const { activeSockets } = require('../gatewayWs');
      if (activeSockets && activeSockets.size > 0) {
        targetDeviceId = Array.from(activeSockets.keys())[0];
      }
    }

    if (!targetDeviceId) {
      const memActive = Array.from(memoryDevices.values()).find(d => d.status === 'ONLINE');
      targetDeviceId = memActive?.deviceId || Array.from(memoryDevices.keys())[0];
    }
  }

  if (!targetDeviceId) {
    return {
      success: false,
      error: 'No active Android SMS Gateway devices currently available'
    };
  }

  const requestId = customRequestId || `sms_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const jobRecord = {
    requestId,
    deviceId: targetDeviceId,
    phoneNumber,
    message,
    status: 'PENDING',
    createdAt: new Date()
  };

  try {
    const insertSql = `
      INSERT INTO sms_jobs (request_id, device_id, phone_number, message, status, created_at)
      VALUES (?, ?, ?, ?, 'PENDING', NOW());
    `;
    await db.query(insertSql, [requestId, targetDeviceId, phoneNumber, message]);
  } catch (dbErr) {
    memoryJobs.set(requestId, jobRecord);
  }

  // Attempt real-time WebSocket dispatch if phone is currently connected
  try {
    const { sendSmsToGateway } = require('../gatewayWs');
    sendSmsToGateway(targetDeviceId, requestId, phoneNumber, message);
  } catch (_) {}

  return {
    success: true,
    requestId,
    deviceId: targetDeviceId,
    status: 'PENDING'
  };
}

/**
 * 3. POST /api/gateway/send-sms
 * Queue an SMS dispatch command for a targeted device.
 */
async function sendSms(req, res) {
  try {
    const { deviceId, phoneNumber, message, requestId: customRequestId } = req.body || {};

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber and message'
      });
    }

    const result = await queueSmsJob(phoneNumber, message, deviceId, customRequestId);
    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      deviceId: result.deviceId,
      status: result.status,
      message: 'SMS command queued for gateway dispatch'
    });
  } catch (err) {
    console.error('[Gateway Send SMS Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to queue SMS job'
    });
  }
}

/**
 * 4. POST /api/gateway/status
 * Receive SMS delivery status updates from the Android app.
 */
async function updateStatus(req, res) {
  try {
    const { requestId, deviceId, status, timestamp, error: errorReason } = req.body || {};

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requestId and status'
      });
    }

    const normalizedStatus = String(status).toUpperCase(); // SENT, DELIVERED, FAILED
    const ts = timestamp || Date.now();

    try {
      // 1. Update job record
      let updateSql = `
        UPDATE sms_jobs 
        SET status = ?, error_reason = ?, updated_at = NOW()
      `;
      const params = [normalizedStatus, errorReason || null];

      if (normalizedStatus === 'SENT') {
        updateSql += `, sent_at = NOW() `;
      } else if (normalizedStatus === 'DELIVERED') {
        updateSql += `, delivered_at = NOW() `;
      }
      updateSql += ` WHERE request_id = ?;`;
      params.push(requestId);

      await db.query(updateSql, params);

      // 2. Insert into audit logs
      const logSql = `
        INSERT INTO sms_logs (request_id, device_id, phone_number, message, status, error_reason, timestamp, created_at)
        SELECT request_id, device_id, phone_number, message, ?, ?, ?, NOW()
        FROM sms_jobs WHERE request_id = ?;
      `;
      await db.query(logSql, [normalizedStatus, errorReason || null, ts, requestId]);

      // 3. Update device lastSeen
      if (deviceId) {
        await db.query(`UPDATE gateway_devices SET last_seen = NOW() WHERE device_id = ?`, [deviceId]);
      }
    } catch (dbErr) {
      if (memoryJobs.has(requestId)) {
        const job = memoryJobs.get(requestId);
        job.status = normalizedStatus;
        job.errorReason = errorReason;
      }
      memoryLogs.push({
        requestId,
        deviceId: deviceId || 'UNKNOWN',
        status: normalizedStatus,
        errorReason,
        timestamp: ts
      });
    }

    return res.status(200).json({
      success: true,
      requestId,
      status: normalizedStatus,
      message: `Status updated to ${normalizedStatus}`
    });
  } catch (err) {
    console.error('[Gateway Status Update Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update SMS status'
    });
  }
}

/**
 * 5. GET /api/gateway/pending/:deviceId
 * Polling fallback endpoint for Android devices to retrieve pending SMS jobs.
 */
async function getPendingJobs(req, res) {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceId parameter'
      });
    }

    let pendingJobs = [];
    try {
      pendingJobs = await db.query(`
        SELECT 
          request_id AS requestId,
          phone_number AS phone,
          message,
          created_at AS createdAt
        FROM sms_jobs
        WHERE device_id = ? AND status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 20;
      `, [deviceId]);

      // Update device heartbeat
      await db.query(`UPDATE gateway_devices SET status = 'ONLINE', last_seen = NOW() WHERE device_id = ?`, [deviceId]);
    } catch (dbErr) {
      pendingJobs = Array.from(memoryJobs.values())
        .filter(job => job.deviceId === deviceId && job.status === 'PENDING')
        .map(job => ({
          requestId: job.requestId,
          phone: job.phoneNumber,
          message: job.message,
          createdAt: job.createdAt
        }));
    }

    return res.status(200).json({
      success: true,
      deviceId,
      count: pendingJobs.length,
      jobs: pendingJobs
    });
  } catch (err) {
    console.error('[Gateway Pending Jobs Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch pending SMS jobs'
    });
  }
}

/**
 * Middleware to verify gatewayToken JWT for device endpoints
 */
function verifyGatewayToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Gateway token required'
      });
    }

    const token = authHeader.substring(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || decoded.role !== 'sms_gateway' || !decoded.deviceId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid gateway token role'
      });
    }

    const targetDeviceId = req.params?.deviceId || req.body?.deviceId;
    if (targetDeviceId && targetDeviceId !== decoded.deviceId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Token deviceId mismatch'
      });
    }

    req.gatewayDevice = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired gateway token'
    });
  }
}

module.exports = {
  registerDevice,
  getDevices,
  sendSms,
  queueSmsJob,
  updateStatus,
  getPendingJobs,
  verifyGatewayToken,
  memoryDevices,
  memoryJobs,
  memoryLogs
};
