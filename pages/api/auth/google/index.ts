import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import mongoConnect from '@/lib/mongoConnect';
import User from '@/models/User';
import verifyCors, { cors } from '@/middleware/verifyCors';

const JWT_SECRET = process.env.JWT_SECRET;
const googleClient = new OAuth2Client();

interface GoogleLoginRequest {
  idToken?: string;
  id_token?: string;
  credential?: string;
}

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

import { getAllowedGoogleClientIds, usernameBaseFromEmail } from '@/lib/googleAuth';

export { getAllowedGoogleClientIds, usernameBaseFromEmail };

function createAppToken(user: { _id: unknown; username: string; name: string }): string {
  if (!JWT_SECRET) throw new Error('JWT Secret tidak ditemukan');
  return jwt.sign(
    { userId: String(user._id), username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
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

  const body = (req.body || {}) as GoogleLoginRequest;
  const rawToken = body.idToken || body.id_token || body.credential;

  if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
    return res.status(400).json({ message: 'Google ID token harus diisi' });
  }

  const allowedClientIds = getAllowedGoogleClientIds();
  if (allowedClientIds.length === 0) {
    console.error('GOOGLE_CLIENT_ID belum dikonfigurasi di environment server');
    return res.status(500).json({ message: 'Google login belum dikonfigurasi di server' });
  }

  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: rawToken.trim(),
      audience: allowedClientIds,
    });
    payload = ticket.getPayload();
  } catch (error: unknown) {
    console.error('Google token verification error:', error);
    return res.status(401).json({ message: 'Token Google tidak valid atau kedaluwarsa' });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ message: 'Token Google tidak valid atau email belum terverifikasi' });
  }

  try {
    await mongoConnect();
    const normalizedEmail = payload.email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }],
    });

    if (!user) {
      const username = await getAvailableUsername(normalizedEmail);
      user = await User.create({
        name: payload.name?.trim() || normalizedEmail.split('@')[0],
        username,
        email: normalizedEmail,
        googleId: payload.sub,
      });
    } else {
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        shouldSave = true;
      }
      if (!user.email) {
        user.email = normalizedEmail;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
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
