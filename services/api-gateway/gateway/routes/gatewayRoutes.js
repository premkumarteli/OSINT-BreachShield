const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const gatewayController = require('../controllers/gatewayController');
const { verifyOtpToken } = require('../../auth/routes/auth');

// Rate limiter for registration: 5 requests per minute per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per windowMs
  message: { success: false, error: 'Too many registration requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/gateway/register
 * @desc    Register a new or existing Android SMS Gateway device (Rate limited: 5 req/min)
 */
router.post('/register', registerLimiter, gatewayController.registerDevice);

/**
 * @route   GET /api/gateway/devices
 * @desc    List all registered SMS gateway devices (Requires user OTP auth token)
 */
router.get('/devices', verifyOtpToken, gatewayController.getDevices);

/**
 * @route   POST /api/gateway/send-sms
 * @desc    Queue an SMS command to be sent via the Android device (Requires gateway token)
 */
router.post('/send-sms', gatewayController.verifyGatewayToken, gatewayController.sendSms);

/**
 * @route   POST /api/gateway/status
 * @desc    Receive delivery status updates from the Android device (Requires gateway token)
 */
router.post('/status', gatewayController.verifyGatewayToken, gatewayController.updateStatus);

/**
 * @route   GET /api/gateway/pending/:deviceId
 * @desc    Polling endpoint for the Android device to fetch pending SMS commands (Requires gateway token)
 */
router.get('/pending/:deviceId', gatewayController.verifyGatewayToken, gatewayController.getPendingJobs);

module.exports = router;
