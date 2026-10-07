import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import mongoConnect from '@/lib/mongoConnect';
import User from '@/models/User';
import verifyCors, { cors } from '@/middleware/verifyCors';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleLoginRequest { idToken: string; }

interface ApiResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

function createAppToken(user: { _id: unknown; username: string; name: string }): string {
  if (!JWT_SECRET) throw new Error('JWT Secret tidak ditemukan');
  return jwt.sign(
    { userId: String(user._id), username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function usernameBaseFromEmail(email: string): string {
  const localPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const base = localPart.replace(/^_+|_+$/g, '').slice(0, 24);
  return base.length >= 3 ? base : `google_${base}`;
}

async function getAvailableUsername(email: string): Promise<string> {
  const base = usernameBaseFromEmail(email);
  let username = base;
  let suffix = 1;
  while (await User.exists({ username })) {
    username = `${base.slice(0, 24 - String(suffix).length)}${suffix}`;
    suffix += 1;
  }
  return username;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  await verifyCors(req, res, cors);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { idToken } = (req.body || {}) as GoogleLoginRequest;
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ message: 'Google ID token harus diisi' });
  }
  if (!GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID belum dikonfigurasi');
    return res.status(500).json({ message: 'Google login belum dikonfigurasi' });
  }

  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (error: unknown) {
    console.error('Google token verification error:', error);
    return res.status(401).json({ message: 'Token Google tidak valid' });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ message: 'Token Google tidak valid atau email belum terverifikasi' });
  }

  try {
    await mongoConnect();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      const username = await getAvailableUsername(payload.email);
      user = await User.create({
        name: payload.name?.trim() || payload.email.split('@')[0],
        username,
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
      });
    }

    return res.status(200).json({
      message: 'Login Google berhasil',
      token: createAppToken(user),
      user: {
        id: String(user._id),
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
