import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'edulearn.sid';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || 'edulearn-platform-dev-secret-change-in-production';
}

function signPayload(encodedPayload) {
  return createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function safeCompare(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: Number(user.id) || 0,
    username: String(user.username || 'guest'),
    displayName: String(user.displayName || user.name || 'Misafir'),
    role: String(user.role || 'guest'),
    profile: user.profile || { grade: null, targetExam: null },
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload);
  if (!safeCompare(signature, expected)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload !== 'object') return null;
    if (Number(payload.exp) <= now) return null;
    if (!payload.id || Number(payload.id) <= 0) return null;

    return {
      id: Number(payload.id),
      username: String(payload.username || 'guest'),
      displayName: String(payload.displayName || 'Misafir'),
      name: String(payload.displayName || payload.name || 'Misafir'),
      role: String(payload.role || 'guest'),
      profile: payload.profile || { grade: null, targetExam: null },
    };
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const cookieHeader = req?.headers?.cookie || '';
  return cookieHeader.split(';').reduce((acc, item) => {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
}

export function getUserFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  return verifySessionToken(token);
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'Path=/',
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
}

export function guestUser() {
  return {
    id: 0,
    username: 'guest',
    name: 'Misafir',
    displayName: 'Misafir',
    role: 'guest',
    profile: {
      grade: null,
      targetExam: null,
    },
  };
}
