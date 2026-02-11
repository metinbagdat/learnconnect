export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const date = typeof req.query?.date === 'string'
    ? req.query.date
    : new Date().toISOString().split('T')[0];

  return res.status(200).json({
    id: 'today',
    date,
    minutes: 0,
    streakCount: 0,
  });
}
