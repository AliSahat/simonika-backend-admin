import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  let userId: string;
  try { userId = getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    console.error("Telemetry auth configuration error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }
  const poolId = Array.isArray(req.query.poolId) ? req.query.poolId[0] : req.query.poolId;
  if (!poolId || !mongoose.isValidObjectId(poolId)) return res.status(400).json({ success: false, message: "poolId tidak valid" });
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const parsedLimit = rawLimit === undefined ? 50 : Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) return res.status(400).json({ success: false, message: "limit harus berupa bilangan bulat positif" });
  const limit = Math.min(parsedLimit, 200);
  try {
    await mongoConnect();
    const pool = await Pool.findOne({ _id: poolId, userId }).select("_id");
    if (!pool) return res.status(404).json({ success: false, message: "Data wadah tidak ditemukan" });
    const data = await WaterLevel.find({ poolId: pool._id, userId }).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Telemetry API error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
}
