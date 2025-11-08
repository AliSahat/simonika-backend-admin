// @/pages/api/auth/login/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import mongoConnect from '@/lib/mongoConnect';
import User from '@/models/User';
import verifyCors, { cors } from '@/middleware/verifyCors';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await mongoConnect();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: 'Login berhasil',
      token,
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
