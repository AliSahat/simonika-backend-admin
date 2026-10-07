import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import mongoConnect from "@/lib/mongoConnect";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { WaterLevel } from "@/models/WaterLevel";
import { Pool } from "@/models/Pool";
import { connectMqtt } from "@/lib/mqttClient";

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  connectMqtt();
  await verifyCors(req, res, cors);

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await mongoConnect();

    const poolId = typeof req.query.poolId === "string" ? req.query.poolId : undefined;
    const serialQuery = typeof req.query.serial === "string" ? req.query.serial : undefined;
    const requestedLimit = Number(req.query.limit) || 50;
    const limit = Math.max(1, Math.min(requestedLimit, 200));

    let serial = serialQuery;
    if (poolId) {
      const pool = await Pool.findOne({ _id: poolId, userId: decoded.userId }).select("serial");
      if (!pool) {
        return res.status(404).json({ success: false, message: "Wadah tidak ditemukan" });
      }
      serial = pool.serial;
    }

    if (!serial) {
      return res.status(400).json({ success: false, message: "poolId atau serial wajib diisi" });
    }

    const ownedPool = await Pool.exists({ userId: decoded.userId, serial });
    if (!ownedPool) {
      return res.status(403).json({ success: false, message: "Perangkat tidak terhubung ke akun ini" });
    }

    const data = await WaterLevel.find({ serial })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, serial, count: data.length, data });
  } catch (error) {
    console.error("Water level API error:", error);
    return res.status(401).json({ success: false, message: "Token tidak valid atau error server" });
  }
}
