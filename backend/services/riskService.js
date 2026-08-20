/**
 * @file riskService.js
 * @description Risk scoring and sensitive data redaction services.
 */

const { analyzeExposure, redactSensitiveData } = require('../analytics/riskEngine');

module.exports = {
  analyzeExposure,
  redactSensitiveData
};
