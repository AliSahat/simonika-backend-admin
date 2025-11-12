// @/pages/api/pool/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import mongoConnect from "@/lib/mongoConnect";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await verifyCors(req, res, cors);
  await mongoConnect();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Token tidak ditemukan" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    switch (req.method) {
      case "POST": {
        const {
          serial,
          namaWadah,
          kedalaman,
          keranTutup,
          keranNormal,
          keranBuka,
        } = req.body;

        if (
          !serial ||
          !namaWadah ||
          !kedalaman ||
          !keranTutup ||
          !keranNormal ||
          !keranBuka
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Semua field wajib diisi" });
        }

        const pool = await Pool.create({
          userId,
          serial,
          namaWadah,
          kedalaman,
          keranTutup,
          keranNormal,
          keranBuka,
        });

        return res.status(201).json({ success: true, data: pool });
      }

      case "GET": {
        const pools = await Pool.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: pools });
      }

      default:
        return res
          .status(405)
          .json({ success: false, message: "Metode tidak diizinkan" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(401)
      .json({ success: false, message: "Token tidak valid atau error server" });
  }
}
