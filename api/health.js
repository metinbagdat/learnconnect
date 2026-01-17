// api/health.js - Health check endpoint
// CommonJS format for Vercel compatibility

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LearnConnect API',
    endpoint: 'direct-js-file',
    version: '1.0.0'
  });
};
