// @/pages/api/auth/register/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import mongoConnect from '@/lib/mongoConnect';
import User from '@/models/User';
import verifyCors, { cors } from '@/middleware/verifyCors';

const JWT_SECRET = process.env.JWT_SECRET as string;

interface RegisterRequest {
  name: string;
  username: string;
  password: string;
}

interface ApiResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    createdAt: Date;
  };
}

interface ApiRequest extends NextApiRequest {
  body: RegisterRequest;
}

export default async function handler(req: ApiRequest, res: NextApiResponse<ApiResponse>) {
  await verifyCors(req, res, cors);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await mongoConnect();

    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Format data tidak valid' });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: 'Nama minimal 2 karakter' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username minimal 3 karakter' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const user = new User({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password,
    });

    await user.save();

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
      id: (user._id as any).toString(),
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: 'User berhasil dibuat',
      token,
      user: userResponse,
    });
  } catch (error: unknown) {
    console.error('Register error:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
