import type { NextApiRequest } from "next";
import jwt, { type JwtPayload } from "jsonwebtoken";

export class AuthError extends Error {}

export function getAuthenticatedUserId(req: NextApiRequest): string {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AuthError("Token tidak ditemukan");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET belum dikonfigurasi");

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (typeof decoded.userId !== "string" || !decoded.userId) {
      throw new AuthError("Token tidak valid");
    }
    return decoded.userId;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Token tidak valid");
  }
}
