export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const resource = typeof req.query?.resource === 'string' ? req.query.resource : '';
  const now = new Date().toISOString();

  switch (resource) {
    case 'logout':
      return res.status(200).json({ ok: true });
    case 'dashboard-notes':
    case 'notes':
      if (req.method === 'GET') {
        return res.status(200).json([]);
      }
      if (req.method === 'POST') {
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
      if (req.method === 'PUT' || req.method === 'DELETE') {
        return res.status(200).json({ stored: false });
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'dashboard-stats': {
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
    case 'dashboard-paths':
    case 'learning-paths':
      return res.status(200).json([]);
    case 'learning-paths-progress':
      if (req.method === 'GET') {
        return res.status(200).json({});
      }
      if (req.method === 'POST') {
        return res.status(200).json({ stored: false });
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'tyt-subjects':
      return res.status(200).json([]);
    default:
      return res.status(404).json({ message: 'Not found' });
  }
}
