// src/lib/cors.js
import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';

// Use a dynamic origin handler so the server echoes back the request Origin.
// This allows browser clients (including Flutter web) to use the API from any origin
// while still supporting credentials if needed. If you prefer a stricter policy,
// replace the origin function with an allowlist check.
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // echo the request origin (allows cross-origin usage from anywhere)
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // allow requests with no origin like server-to-server or mobile clients
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  // allow credentials (cookies, Authorization header) if clients send them
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
  preflightContinue: false,
});

function verifyCors(req: NextApiRequest, res: NextApiResponse, fn: typeof cors): Promise<void> {
  // Ensure CORS headers are present on every response (extra safety for browsers)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Kuma-Revision');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');

  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      return result instanceof Error ? reject(result) : resolve(result);
    });
  });
}

export default verifyCors;
export { cors };
