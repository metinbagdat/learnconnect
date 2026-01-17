// api/health.js - ES MODULE FORMAT
// NO IMPORTS, NO DEPENDENCIES - PURE JAVASCRIPT
// This matches package.json's "type": "module" setting
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LearnConnect API',
    version: '1.0.0',
    environment: 'production'
  });
}
