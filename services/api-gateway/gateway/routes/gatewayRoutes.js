const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');

/**
 * @route   POST /api/gateway/register
 * @desc    Register a new or existing Android SMS Gateway device
 */
router.post('/register', gatewayController.registerDevice);

/**
 * @route   GET /api/gateway/devices
 * @desc    List all registered SMS gateway devices
 */
router.get('/devices', gatewayController.getDevices);

/**
 * @route   POST /api/gateway/send-sms
 * @desc    Queue an SMS command to be sent via the Android device
 */
router.post('/send-sms', gatewayController.sendSms);

/**
 * @route   POST /api/gateway/status
 * @desc    Receive delivery status updates (SENT, DELIVERED, FAILED) from the Android device
 */
router.post('/status', gatewayController.updateStatus);

/**
 * @route   GET /api/gateway/pending/:deviceId
 * @desc    Polling endpoint for the Android device to fetch pending SMS commands
 */
router.get('/pending/:deviceId', gatewayController.getPendingJobs);

module.exports = router;
