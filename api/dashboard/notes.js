export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    const now = new Date().toISOString();
    return res.status(200).json({
      id: null,
      title: req.body?.title || '',
      content: req.body?.content || '',
      tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
      createdAt: now,
      updatedAt: now,
      stored: false,
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
