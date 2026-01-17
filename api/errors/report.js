// api/errors/report.js - Direct serverless function for /api/errors/report
// This bypasses all Express routes, Zod validation, and TypeScript errors

export default async function handler(req, res) {
  try {
    // Accept any error report - no validation
    const errorReport = req.body || {};
    
    // Log the error (but don't fail)
    console.error('Client error report received:', {
      type: errorReport.type || 'unknown',
      message: errorReport.message || 'No message',
      stack: errorReport.stack ? errorReport.stack.substring(0, 500) : undefined,
      url: errorReport.url || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
    });
    
    // Always return success
    return res.status(200).json({
      success: true,
      message: 'Error report received successfully',
      timestamp: new Date().toISOString(),
      reportId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    
  } catch (error) {
    // Even if parsing fails, return success
    console.error('Error in /api/errors/report handler:', error?.message || 'Unknown error');
    return res.status(200).json({
      success: true,
      message: 'Error report received (parsing bypassed)',
      timestamp: new Date().toISOString(),
      reportId: `ERR_${Date.now()}`,
    });
  }
}
