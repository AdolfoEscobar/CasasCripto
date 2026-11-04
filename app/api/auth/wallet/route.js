import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { expectedSiweDomain, getRequestCookie } from "@/libs/siwe";

// PATCH /api/auth/wallet — vincula una wallet a la cuenta logueada
// (ej. entró con Google y ahora conecta MetaMask). Exige firma SIWE fresca:
// { message, signature } verificados contra dominio + nonce de cookie.
// La dirección debe ser única en toda la colección.
export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json(
        { error: "Faltan message y signature" },
        { status: 400 }
      );
    }

    const expectedNonce = getRequestCookie(req, "siwe-nonce");
    if (!expectedNonce) {
      return NextResponse.json(
        { error: "Sesión de firma vencida. Pide un nuevo mensaje." },
        { status: 400 }
      );
    }

    const expectedDomain = expectedSiweDomain(req);
    if (!expectedDomain) {
      return NextResponse.json(
        { error: "No pudimos verificar el dominio. Inténtalo de nuevo." },
        { status: 400 }
      );
    }

    const siwe = new SiweMessage(message);
    const result = await siwe.verify({
      signature,
      domain: expectedDomain,
      nonce: expectedNonce,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: "Firma inválida. Inténtalo de nuevo." },
        { status: 400 }
      );
    }

    const address = siwe.address.toLowerCase();
    await connectMongo();

    const taken = await User.findOne({
      walletAddress: address,
      _id: { $ne: session.user.id },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Esa wallet ya está vinculada a otra cuenta." },
        { status: 409 }
      );
    }

    await User.findByIdAndUpdate(session.user.id, {
      walletAddress: address,
      walletVerifiedAt: new Date(),
    });

    return NextResponse.json({ walletAddress: address });
  } catch (e) {
    console.error("Link wallet failed:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos vincular tu wallet." },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/wallet — desvincula la wallet de la cuenta. Solo se
// permite si la cuenta conserva otra vía de acceso (email): una cuenta creada
// solo con wallet quedaría sin forma de entrar.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  const dbUser = await User.findById(session.user.id);
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!dbUser.email) {
    return NextResponse.json(
      {
        error:
          "Tu cuenta solo usa wallet: agrega un correo primero para poder desvincularla.",
      },
      { status: 400 }
    );
  }

  await User.findByIdAndUpdate(session.user.id, {
    $unset: { walletAddress: "", walletVerifiedAt: "" },
  });
  return NextResponse.json({ ok: true });
}
