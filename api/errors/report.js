// api/errors/report.js - ES MODULE FORMAT
// NO IMPORTS, NO DEPENDENCIES - PURE JAVASCRIPT
// This matches package.json's "type": "module" setting
export default function handler(req, res) {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // SIMPLE, NO IMPORTS, NO DEPENDENCIES
  res.status(200).json({
    success: true,
    message: 'Error report received successfully',
    timestamp: new Date().toISOString(),
    reportId: 'ERR_' + Date.now()
  });
}
