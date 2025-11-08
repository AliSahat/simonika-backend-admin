// src/pages/api/water-level/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import mongoConnect from '@/lib/mongoConnect';
import verifyCors, { cors } from '@/middleware/verifyCors';
import { WaterLevel } from '@/models/WaterLevel';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  await mongoConnect();

  // 🔐 Verifikasi token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token tidak ditemukan.' });
  }

  let userId: string;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!decoded || !decoded.userId) throw new Error('Token payload tidak memiliki userId');
    userId = decoded.userId;
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ success: false, message: 'Unauthorized: Token tidak valid.' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const data = await WaterLevel.find({ userId }).sort({ timestamp: -1 });
        return res.status(200).json({ success: true, data });
      }

      case 'POST': {
        const { serial, waterLevel, distance, timestamp } = req.body;

        if (!serial || typeof serial !== 'string') {
          return res.status(400).json({ success: false, message: 'serial harus string dan wajib.' });
        }
        if (typeof waterLevel !== 'number') {
          return res.status(400).json({ success: false, message: 'waterLevel harus number dan wajib.' });
        }
        if (typeof distance !== 'number') {
          return res.status(400).json({ success: false, message: 'distance harus number dan wajib.' });
        }

        const newData = await WaterLevel.create({
          userId,
          serial,
          waterLevel,
          distance,
          timestamp,
        });

        return res.status(201).json({ success: true, data: newData });
      }

      default:
        return res.status(405).json({ success: false, message: 'Metode tidak diizinkan.' });
    }
  } catch (error) {
    console.error('API Error (index):', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
}
