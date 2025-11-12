// @/pages/api/pool/[id]/index.ts
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
    const { id } = req.query;

    switch (req.method) {
      // 🔵 READ DETAIL
      case "GET": {
        const pool = await Pool.findOne({ _id: id, userId });
        if (!pool)
          return res
            .status(404)
            .json({ success: false, message: "Data tidak ditemukan" });
        return res.status(200).json({ success: true, data: pool });
      }

      // 🟡 UPDATE
      case "PUT": {
        const {
          serial,
          namaWadah,
          kedalaman,
          keranTutup,
          keranNormal,
          keranBuka,
          isActive,
        } = req.body;

        const updatedPool = await Pool.findOneAndUpdate(
          { _id: id, userId },
          {
            serial,
            namaWadah,
            kedalaman,
            keranTutup,
            keranNormal,
            keranBuka,
            isActive,
          },
          { new: true, runValidators: true },
        );

        if (!updatedPool)
          return res
            .status(404)
            .json({ success: false, message: "Data tidak ditemukan" });

        return res.status(200).json({ success: true, data: updatedPool });
      }

      // 🔴 DELETE
      case "DELETE": {
        const deletedPool = await Pool.findOneAndDelete({ _id: id, userId });
        if (!deletedPool)
          return res
            .status(404)
            .json({ success: false, message: "Data tidak ditemukan" });
        return res
          .status(200)
          .json({ success: true, message: "Data berhasil dihapus" });
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
