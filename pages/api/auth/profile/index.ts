// @/pages/api/auth/profile/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import mongoConnect from '@/lib/mongoConnect';
import User from '@/models/User';
import verifyCors, { cors } from '@/middleware/verifyCors';

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtPayload {
  userId: string;
  username: string;
  name: string;
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (jwtError) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    await mongoConnect();

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const userProfile = {
      id: user._id,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: 'Profile berhasil diambil',
      user: userProfile,
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
