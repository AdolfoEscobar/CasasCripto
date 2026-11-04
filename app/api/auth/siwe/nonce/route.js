import { NextResponse } from "next/server";
import { generateNonce } from "siwe";

// GET /api/auth/siwe/nonce — emite el nonce anti-replay para el login con
// wallet. Se guarda en cookie httpOnly y el cliente lo incrusta en el mensaje
// SIWE que firma con MetaMask; libs/auth.js lo valida en authorize().
export async function GET() {
  const nonce = generateNonce();
  const res = NextResponse.json({ nonce });
  res.cookies.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutos: suficiente para firmar, corto anti-replay
  });
  return res;
}
