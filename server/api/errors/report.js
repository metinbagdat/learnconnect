// Hata raporlama endpoint'i
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // CORS preflight için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Hata log'u (Vercel log'larında görünecek)
  console.log('[Error Report]', {
    timestamp: new Date().toISOString(),
    body: req.body,
    ip: req.headers['x-forwarded-for']
  });
  
  // Her zaman başarı döndür
  return res.status(200).json({
    success: true,
    message: 'Hata raporunuz alındı',
    timestamp: new Date().toISOString(),
    reportId: 'ERR_' + Date.now()
  });
}
