import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '../src/types/cms.ts';

// Runtime server-side signing key (no JWT_SECRET environment variable required)
const RUNTIME_SIGNING_KEY = crypto
  .createHash('sha256')
  .update(`yrt-esports-session:${process.env.MONGODB_URI || process.cwd()}`)
  .digest();

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  admin?: AuthPayload;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const pad = 4 - (input.length % 4 || 4);
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export function signAdminToken(payload: AuthPayload): string {
  const body: AuthPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', RUNTIME_SIGNING_KEY).update(encodedPayload).digest()
  );
  return `${encodedPayload}.${sig}`;
}

export function verifyAdminToken(token: string): AuthPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, sig] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', RUNTIME_SIGNING_KEY).update(encodedPayload).digest()
    );
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(encodedPayload)) as AuthPayload;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = req.cookies?.yrt_admin_token;
  if (cookieToken) return cookieToken;
  return null;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const decoded = verifyAdminToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.admin = decoded;
  next();
}

export function requireRoles(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.admin.role === 'super_admin' || allowedRoles.includes(req.admin.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
    });
  };
}
