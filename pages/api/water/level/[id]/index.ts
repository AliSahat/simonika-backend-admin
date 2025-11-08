// src/pages/api/water-level/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
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

  const { id } = req.query;
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid.' });
  }

  try {
    const record = await WaterLevel.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    if (record.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Tidak punya akses.' });
    }

    switch (req.method) {
      case 'GET': {
        return res.status(200).json({ success: true, data: record });
      }

      case 'PUT': {
        const { serial, waterLevel, distance, timestamp } = req.body;
        const updatePayload: any = {};

        if (serial !== undefined) {
          if (typeof serial !== 'string') return res.status(400).json({ success: false, message: 'serial harus string.' });
          updatePayload.serial = serial;
        }
        if (waterLevel !== undefined) {
          if (typeof waterLevel !== 'number') return res.status(400).json({ success: false, message: 'waterLevel harus number.' });
          updatePayload.waterLevel = waterLevel;
        }
        if (distance !== undefined) {
          if (typeof distance !== 'number') return res.status(400).json({ success: false, message: 'distance harus number.' });
          updatePayload.distance = distance;
        }
        if (timestamp !== undefined) {
          if (typeof timestamp !== 'number') return res.status(400).json({ success: false, message: 'timestamp harus number.' });
          updatePayload.timestamp = timestamp;
        }

        const updated = await WaterLevel.findByIdAndUpdate(id, updatePayload, { new: true });
        return res.status(200).json({ success: true, data: updated });
      }

      case 'DELETE': {
        await WaterLevel.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: 'Data berhasil dihapus.' });
      }

      default:
        return res.status(405).json({ success: false, message: 'Metode tidak diizinkan.' });
    }
  } catch (error) {
    console.error('API Error ([id]):', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
}
