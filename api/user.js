// Kullanıcı bilgileri endpoint'i
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // CORS preflight için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const headerUserId = req.headers['x-user-id'];
  const headerRole = req.headers['x-user-role'];

  if (headerUserId) {
    const id = Number(Array.isArray(headerUserId) ? headerUserId[0] : headerUserId);
    return res.status(200).json({
      id: Number.isFinite(id) ? id : 0,
      username: 'user',
      displayName: 'Kullanici',
      role: headerRole ? String(Array.isArray(headerRole) ? headerRole[0] : headerRole) : 'student',
      profile: {
        grade: '12. Sınıf',
        targetExam: 'TYT',
      }
    });
  }

  // Default to guest (not authenticated)
  return res.status(200).json({
    id: 0,
    username: 'guest',
    displayName: 'Misafir',
    role: 'guest',
    profile: {
      grade: null,
      targetExam: null,
    }
  });
}
