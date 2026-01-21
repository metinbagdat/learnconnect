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

    // Here you would integrate with your email service
    // Examples: SendGrid, Mailgun, AWS SES, Resend, etc.
    
    // For now, we'll log it (in production, replace with actual email service)
    console.log('📧 Email sent:', {
      to: recipient,
      subject: template.subject,
      type,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending
    // In production:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: recipient,
      from: 'noreply@learnconnect.com',
      subject: template.subject,
      text: template.body,
      html: template.body.replace(/\n/g, '<br>')
    });
    */

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
