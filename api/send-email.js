// Email Notification Service
// Uses Vercel's email API or any SMTP service

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { type, recipient, data } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email templates
    const templates = {
      new_user_welcome: {
        subject: 'LearnConnect\'e Hoş Geldiniz!',
        body: `
Merhaba ${data?.name || 'Kullanıcı'},

LearnConnect ailesine katıldığınız için teşekkür ederiz!

Platformumuzda TYT/AYT hazırlığınız için AI destekli çalışma planları ve kapsamlı müfredat içerikleri sizi bekliyor.

Hemen başlamak için: ${data?.loginUrl || 'https://learnconnect.vercel.app'}

İyi çalışmalar!
LearnConnect Ekibi
        `
      },
      admin_notification: {
        subject: 'Yeni Kullanıcı Kaydı',
        body: `
Yeni kullanıcı kaydı:
Email: ${data?.email}
Tarih: ${new Date().toLocaleString('tr-TR')}
        `
      },
      curriculum_updated: {
        subject: 'Müfredat Güncellendi',
        body: `
Merhaba,

${data?.subject} dersi müfredatında güncellemeler yapıldı.

Detayları görmek için admin paneline giriş yapın.
        `
      }
    };

    const template = templates[type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    // Use Resend when RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from,
        to: recipient,
        subject: template.subject,
        html: template.body.replace(/\n/g, '<br>'),
      });
    } else {
      console.log('📧 Email (simulated):', { to: recipient, subject: template.subject, type });
    }

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      type,
      recipient
    });
    
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
}
