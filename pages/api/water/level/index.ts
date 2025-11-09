import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { WaterLevel } from '@/models/WaterLevel';
import verifyCors, { cors } from '@/middleware/verifyCors';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  await connectDB();

  if (req.method === 'GET') {
    const { serial, limit } = req.query;

    const filter: any = {};
    if (serial) filter.serial = serial;

    const data = await WaterLevel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50);

    return res.status(200).json({ success: true, count: data.length, data });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
