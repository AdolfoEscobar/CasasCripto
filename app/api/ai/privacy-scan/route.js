import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { scanImagePrivacy } from "@/libs/metaModel";
import { checkAiRateLimit, AI_LIMITS } from "@/libs/aiRateLimit";

// POST /api/ai/privacy-scan
// Usa Meta SAM 3.1 para avisar si una foto del listado muestra personas,
// rostros o placas visibles — antes de publicar, no después. Es informativo
// (no bloquea el envío a revisión): el dueño decide si cambia la foto.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = await checkAiRateLimit({
      key: `user:${session.user.id}`,
      action: "privacy-scan",
      limit: AI_LIMITS.authenticated["privacy-scan"],
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Alcanzaste el límite diario de revisiones con IA. Intenta mañana." },
        { status: 429 }
      );
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl es requerido" },
        { status: 400 }
      );
    }

    const result = await scanImagePrivacy({ imageUrl });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("❌ Error scanning image privacy:", error);
    return NextResponse.json(
      { error: "No pudimos revisar la imagen" },
      { status: 500 }
    );
  }
}
