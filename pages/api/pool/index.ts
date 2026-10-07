import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import mongoConnect from "@/lib/mongoConnect";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";
import { parseWaterControlConfig } from "@/lib/waterControl";

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  await mongoConnect();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token tidak ditemukan" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    if (req.method === "GET") {
      const pools = await Pool.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: pools });
    }

    if (req.method === "POST") {
      const serial = String(req.body.serial ?? "").trim();
      const namaWadah = String(req.body.namaWadah ?? "").trim();

      if (!serial || !namaWadah) {
        return res.status(400).json({ success: false, message: "Serial dan nama wadah wajib diisi" });
      }

      const parsed = parseWaterControlConfig(req.body);
      if (!parsed.config) {
        return res.status(400).json({ success: false, message: parsed.error });
      }

      const duplicate = await Pool.exists({ userId, serial });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Serial perangkat sudah digunakan pada wadah lain" });
      }

      const pool = await Pool.create({
        userId,
        serial,
        namaWadah,
        ...parsed.config,
        isActive: req.body.isActive ?? true,
      });

      return res.status(201).json({ success: true, data: pool });
    }

    return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  } catch (error) {
    console.error("Pool API error:", error);
    return res.status(401).json({ success: false, message: "Token tidak valid atau error server" });
  }
}
