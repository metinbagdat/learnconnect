// api/user.js - ES MODULE FORMAT
// NO IMPORTS, NO DEPENDENCIES - PURE JAVASCRIPT
// This matches package.json's "type": "module" setting
export default function handler(req, res) {
  res.status(200).json({
    id: 1,
    name: 'Test User',
    email: 'user@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profileComplete: true,
    emailVerified: true,
    avatar: null,
    bio: 'Test user',
    language: 'tr',
    timezone: 'Europe/Istanbul'
  });
}
