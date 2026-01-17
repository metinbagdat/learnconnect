// Kullanıcı bilgileri endpoint'i
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // CORS preflight için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Demo kullanıcı verisi
  const userData = {
    id: 1,
    name: 'Demo Öğrenci',
    email: 'demo@ogrenci.com',
    role: 'student',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    profile: {
      grade: '12. Sınıf',
      targetExam: 'TYT',
      weeklyStudyHours: 20,
      subjects: ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilimleri']
    }
  };
  
  return res.status(200).json(userData);
}
