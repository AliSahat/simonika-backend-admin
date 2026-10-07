import type { NextApiRequest, NextApiResponse } from "next";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import { ConfigValidationError, validatePoolConfig } from "@/lib/waterControl";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";

const isDuplicateKey = (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  let userId: string;
  try { userId = getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    console.error("Pool auth configuration error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }
  try {
    await mongoConnect();
    if (req.method === "GET") {
      const pools = await Pool.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: pools });
    }
    if (req.method === "POST") {
      const input = validatePoolConfig((req.body ?? {}) as Record<string, unknown>);
      if (await Pool.exists({ serial: input.serial })) return res.status(409).json({ success: false, message: "Serial perangkat sudah terdaftar" });
      const pool = await Pool.create({ userId, ...input });
      return res.status(201).json({ success: true, data: pool });
    }
    return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  } catch (error) {
    if (error instanceof ConfigValidationError) return res.status(400).json({ success: false, message: error.message });
    if (isDuplicateKey(error)) return res.status(409).json({ success: false, message: "Serial perangkat sudah terdaftar" });
    console.error("Pool API error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
}
