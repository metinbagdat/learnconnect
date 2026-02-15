export function setCorsHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

export function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  return res.status(statusCode).json(payload);
}

export function methodNotAllowed(req, res, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    return sendJson(res, 405, {
      success: false,
      message: `Method ${req.method} not allowed`,
      allowedMethods,
    });
  }
  return null;
}
